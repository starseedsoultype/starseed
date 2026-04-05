// TwinFrequency — Record Swipe Edge Function
// Supabase Edge Function: POST /functions/v1/record-swipe
// Body: { target_id: string, action: "like" | "pass" }
// Returns: { matched: boolean, match_id?: string, connection_type?: string, remaining_swipes: number }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// ═══════════════════════════════════════════════════════════
// ORIGIN → GROUP MAPPING
// ═══════════════════════════════════════════════════════════
const ORIGIN_GROUP: Record<string, number> = {
  Siriusian: 1, Pleiadian: 1, Lemurian: 1, Cassiopeian: 1, Procyonian: 1, Lyran: 1,
  Arcturian: 2, Orion: 2, Vegan: 2, "Zeta Reticulan": 2, "Epsilon Eridan": 2, Atlantean: 2,
  Andromedan: 3, Polarisian: 3, Nibiruan: 3, Egyptian: 3, Titan: 3, "Blue Avian": 3,
  "Tau Cetian": 4, Aldebaran: 4, Centaurian: 4, Herculean: 4, Anunnaki: 4, Hyperborean: 4,
}

// ═══════════════════════════════════════════════════════════
// CONNECTION TYPE ALGORITHM — SERVER-SIDE ONLY
// Full 10-type matrix. Never exposed to client in raw form.
// ═══════════════════════════════════════════════════════════
function getConnectionType(origin1: string, origin2: string): string {
  if (!origin1 || !origin2 || origin1 === "Unknown" || origin2 === "Unknown") return "Unknown"

  // Identical origin — rarest, most powerful resonance
  if (origin1 === origin2) return "Frequency Twins"

  const g1 = ORIGIN_GROUP[origin1]
  const g2 = ORIGIN_GROUP[origin2]
  if (!g1 || !g2) return "Unknown"

  const diff = Math.abs(g1 - g2)

  // Same group, different origin — mirror-like
  if (diff === 0) return "Eternal Reflection"

  // Adjacent groups
  if (diff === 1) {
    const lower = Math.min(g1, g2)
    if (lower === 1) return "Twin Stars"       // heart ↔ mind
    if (lower === 2) return "Cosmic Flow"      // mind ↔ energy
    if (lower === 3) return "Star Alchemy"     // energy ↔ matter
  }

  // Two groups apart
  if (diff === 2) {
    const lower = Math.min(g1, g2)
    if (lower === 1) return "Mirror Portals"   // heart ↔ energy
    if (lower === 2) return "Celestial Mentor" // mind ↔ matter
  }

  // Maximum polarity — groups 1 & 4
  if (diff === 3) {
    // Deterministic assignment based on origin characters
    const hash = (origin1.charCodeAt(0) + origin2.charCodeAt(0)) % 3
    if (hash === 0) return "Karmic Bonds"
    if (hash === 1) return "Shadow Contracts"
    return "Black Holes"
  }

  return "Unknown"
}

// ═══════════════════════════════════════════════════════════
// COMPATIBILITY SCORE (0–100)
// ═══════════════════════════════════════════════════════════
function getCompatibilityScore(type: string): number {
  const scores: Record<string, number> = {
    "Frequency Twins": 100,
    "Eternal Reflection": 95,
    "Twin Stars": 85,
    "Star Alchemy": 80,
    "Cosmic Flow": 75,
    "Mirror Portals": 65,
    "Celestial Mentor": 60,
    "Karmic Bonds": 50,
    "Shadow Contracts": 35,
    "Black Holes": 20,
    "Unknown": 40,
  }
  return scores[type] ?? 50
}

const DAILY_SWIPE_LIMIT = 30

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS })
  }

  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) return new Response("Unauthorized", { status: 401 })

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response("Unauthorized", { status: 401 })

    const body = await req.json()
    const { target_id, action } = body

    if (!target_id || !["like", "pass"].includes(action)) {
      return new Response("Invalid request", { status: 400 })
    }

    // ── Load my profile (need origin for connection_type)
    const { data: me } = await supabase
      .from("profiles")
      .select("origin, daily_swipes_count, last_swipe_date")
      .eq("id", user.id)
      .single()

    // ── Check daily limit
    const today = new Date().toISOString().split("T")[0]
    const count = me?.last_swipe_date === today ? (me?.daily_swipes_count ?? 0) : 0

    if (count >= DAILY_SWIPE_LIMIT) {
      return new Response(
        JSON.stringify({ matched: false, error: "daily_limit_reached" }),
        { headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
      )
    }

    // ── Record swipe (upsert in case of retry)
    const { error: swipeError } = await supabase
      .from("swipes")
      .upsert({ actor_id: user.id, target_id, action }, { onConflict: "actor_id,target_id" })

    if (swipeError) throw swipeError

    // ── Update daily counter
    await supabase
      .from("profiles")
      .update({
        daily_swipes_count: me?.last_swipe_date === today ? count + 1 : 1,
        last_swipe_date: today,
      })
      .eq("id", user.id)

    // ── Check for match
    let matched = false
    let matchId: string | null = null
    let connectionType: string | null = null

    if (action === "like") {
      // Check if target already liked us back
      const { data: mutualSwipe } = await supabase
        .from("swipes")
        .select("id")
        .eq("actor_id", target_id)
        .eq("target_id", user.id)
        .eq("action", "like")
        .maybeSingle()

      if (mutualSwipe) {
        // Load target's origin to compute connection type server-side
        const { data: targetProfile } = await supabase
          .from("profiles")
          .select("origin")
          .eq("id", target_id)
          .single()

        connectionType = getConnectionType(
          me?.origin ?? "Unknown",
          targetProfile?.origin ?? "Unknown"
        )

        // Check if match already exists
        const { data: existingMatch } = await supabase
          .from("matches")
          .select("id, connection_type")
          .or(
            `and(user1_id.eq.${user.id},user2_id.eq.${target_id}),and(user1_id.eq.${target_id},user2_id.eq.${user.id})`
          )
          .maybeSingle()

        if (existingMatch) {
          matched = true
          matchId = existingMatch.id
          // Backfill connection_type if missing
          if (!existingMatch.connection_type && connectionType) {
            await supabase
              .from("matches")
              .update({ connection_type: connectionType })
              .eq("id", existingMatch.id)
          } else {
            connectionType = existingMatch.connection_type
          }
        } else {
          // Create new match — store connection_type immediately
          const { data: newMatch } = await supabase
            .from("matches")
            .insert({
              user1_id: user.id < target_id ? user.id : target_id,
              user2_id: user.id < target_id ? target_id : user.id,
              connection_type: connectionType,
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
        connection_type: connectionType,
        remaining_swipes: DAILY_SWIPE_LIMIT - (count + 1),
      }),
      {
        headers: {
          "Content-Type": "application/json",
          ...CORS_HEADERS,
        },
      }
    )
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    })
  }
})
