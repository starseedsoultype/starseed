// TwinFrequency — Record Swipe Edge Function
// Supabase Edge Function: POST /functions/v1/record-swipe
// Body: { target_id: string, action: "like" | "pass" }
// Returns: { matched: boolean, match_id?: string }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const DAILY_SWIPE_LIMIT = 30

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    })
  }

  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) return new Response("Unauthorized", { status: 401 })

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, // service role for trigger bypass
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response("Unauthorized", { status: 401 })

    const body = await req.json()
    const { target_id, action } = body

    if (!target_id || !["like", "pass"].includes(action)) {
      return new Response("Invalid request", { status: 400 })
    }

    // Check daily limit
    const { data: me } = await supabase
      .from("profiles")
      .select("daily_swipes_count, last_swipe_date")
      .eq("id", user.id)
      .single()

    const today = new Date().toISOString().split("T")[0]
    const count = me?.last_swipe_date === today ? (me?.daily_swipes_count ?? 0) : 0

    if (count >= DAILY_SWIPE_LIMIT) {
      return new Response(
        JSON.stringify({ matched: false, error: "daily_limit_reached" }),
        { headers: { "Content-Type": "application/json" } }
      )
    }

    // Record swipe (upsert in case of retry)
    const { error: swipeError } = await supabase
      .from("swipes")
      .upsert({ actor_id: user.id, target_id, action }, { onConflict: "actor_id,target_id" })

    if (swipeError) throw swipeError

    // Update daily counter
    await supabase
      .from("profiles")
      .update({
        daily_swipes_count: me?.last_swipe_date === today ? count + 1 : 1,
        last_swipe_date: today,
      })
      .eq("id", user.id)

    // Check for match (if like)
    let matched = false
    let matchId: string | null = null

    if (action === "like") {
      // Check if target already liked us
      const { data: mutualSwipe } = await supabase
        .from("swipes")
        .select("id")
        .eq("actor_id", target_id)
        .eq("target_id", user.id)
        .eq("action", "like")
        .maybeSingle()

      if (mutualSwipe) {
        // Check if match already exists
        const { data: existingMatch } = await supabase
          .from("matches")
          .select("id")
          .or(
            `and(user1_id.eq.${user.id},user2_id.eq.${target_id}),and(user1_id.eq.${target_id},user2_id.eq.${user.id})`
          )
          .maybeSingle()

        if (existingMatch) {
          matched = true
          matchId = existingMatch.id
        } else {
          // Create match
          const { data: newMatch } = await supabase
            .from("matches")
            .insert({
              user1_id: user.id < target_id ? user.id : target_id,
              user2_id: user.id < target_id ? target_id : user.id,
            })
            .select("id")
            .single()

          if (newMatch) {
            matched = true
            matchId = newMatch.id
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        matched,
        match_id: matchId,
        remaining_swipes: DAILY_SWIPE_LIMIT - (count + 1),
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    )
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500 })
  }
})
