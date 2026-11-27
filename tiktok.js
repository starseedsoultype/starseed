/* TikTok Pixel with consent for European visitors.
   Everyone else: loads right away.
   Visitors whose browser time zone is in the EU, EEA, UK or Switzerland: the pixel loads only after they press Accept.
   Key events that the page already sends to Google Analytics (gtag) are also sent to TikTok,
   so no page needs its own TikTok calls. Include this file right after the GA4 snippet. */
(function () {
  var PIXEL_ID = 'DC4N75BC77UCAR1O3R60';
  var KEY = 'ss_cookie_consent_tt';

  // Standard TikTok stub: queues ttq calls until events.js arrives
  !function (w, d, t) {
    w.TiktokAnalyticsObject = t; var ttq = w[t] = w[t] || [];
    ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie", "holdConsent", "revokeConsent", "grantConsent"];
    ttq.setAndDefer = function (t, e) { t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))) } };
    for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
    ttq.instance = function (t) { for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]); return e };
    ttq.load = function (e, n) {
      var r = "https://analytics.tiktok.com/i18n/pixel/events.js", o = n && n.partner;
      ttq._i = ttq._i || {}, ttq._i[e] = [], ttq._i[e]._u = r, ttq._t = ttq._t || {}, ttq._t[e] = +new Date, ttq._o = ttq._o || {}, ttq._o[e] = n || {};
      n = document.createElement("script"); n.type = "text/javascript", n.async = !0, n.src = r + "?sdkid=" + e + "&lib=" + t;
      e = document.getElementsByTagName("script")[0]; e.parentNode.insertBefore(n, e)
    };
  }(window, document, 'ttq');

  var ttq = window.ttq;
  ttq.page();

  // GA4 event name -> TikTok standard event
  var MAP = {
    ss_visited_result: 'ViewContent',
    tf_app_result_viewed: 'ViewContent',
    ss_origin_result_viewed: 'ViewContent',
    generate_lead: 'SubmitForm',
    ss_clicked_buy: 'InitiateCheckout',
    tf_app_clicked_buy: 'InitiateCheckout',
    book_click: 'Contact',
    calendly_scheduled: 'PlaceAnOrder',
    workshop_preregister: 'CompleteRegistration',
    book_download: 'Download',
    ss_clicked_telegram: 'ClickButton',
    tf_app_clicked_telegram: 'ClickButton',
    open_bot_ru: 'ClickButton',
    tf_app_signup_clicked: 'ClickButton'
  };

  var ga = window.gtag;
  if (typeof ga === 'function') {
    window.gtag = function (cmd, name, params) {
      try {
        if (cmd === 'event' && MAP[name]) {
          var data = {
            contents: [{
              content_id: name,
              content_type: 'product',
              content_name: (params && (params.content_name || params.session || params.page)) || location.pathname
            }],
            currency: 'USD',
            description: name
          };
          // A completed session booking is worth $111
          if (name === 'calendly_scheduled') data.value = 111;
          ttq.track(MAP[name], data);
        }
      } catch (e) {}
      return ga.apply(this, arguments);
    };
  }

  function loadPixel() {
    if (window.__ssTikTokLoaded) return;
    window.__ssTikTokLoaded = true;
    ttq.load(PIXEL_ID);
  }

  function isEurope() {
    try {
      var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      // EU, EEA, UK and Switzerland only (GDPR). Russia, Belarus, Turkey and others load as usual.
      return /^Europe\/(Amsterdam|Athens|Belfast|Berlin|Bratislava|Brussels|Bucharest|Budapest|Busingen|Copenhagen|Dublin|Gibraltar|Guernsey|Helsinki|Isle_of_Man|Jersey|Lisbon|Ljubljana|London|Luxembourg|Madrid|Malta|Mariehamn|Nicosia|Oslo|Paris|Prague|Riga|Rome|Sofia|Stockholm|Tallinn|Vaduz|Vienna|Vilnius|Warsaw|Zagreb|Zurich)$/.test(tz) ||
        /^(Atlantic\/(Canary|Madeira|Azores|Reykjavik|Faroe)|Asia\/(Nicosia|Famagusta)|Arctic\/Longyearbyen)$/.test(tz);
    } catch (e) { return false; }
  }

  function getChoice() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function setChoice(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  if (!isEurope()) { loadPixel(); return; }

  var choice = getChoice();
  if (choice === 'accept') { loadPixel(); return; }
  if (choice === 'decline') return;

  function showBanner() {
    var css = document.createElement('style');
    css.textContent =
      '#ss-consent{position:fixed;left:16px;right:16px;bottom:16px;z-index:99999;max-width:560px;margin:0 auto;' +
      'background:#111;border:1px solid rgba(201,169,110,0.3);color:#C9C1B8;padding:18px 20px;' +
      'font:300 13px/1.6 Inter,-apple-system,Helvetica,Arial,sans-serif;box-shadow:0 8px 32px rgba(0,0,0,0.5)}' +
      '#ss-consent a{color:#C9A96E}' +
      '#ss-consent .ss-row{display:flex;gap:10px;margin-top:14px;flex-wrap:wrap}' +
      '#ss-consent button{flex:1;min-width:120px;padding:11px 16px;cursor:pointer;background:transparent;' +
      'font:300 11px Inter,-apple-system,Helvetica,Arial,sans-serif;letter-spacing:3px;text-transform:uppercase;' +
      'border:1px solid rgba(201,169,110,0.35);color:#C9A96E}' +
      '#ss-consent button.ss-no{border-color:rgba(255,255,255,0.12);color:#7A7672}';
    document.head.appendChild(css);

    var b = document.createElement('div');
    b.id = 'ss-consent';
    b.setAttribute('role', 'dialog');
    b.setAttribute('aria-label', 'Cookie consent');
    b.innerHTML =
      'We use a TikTok cookie to measure our ads and show our content to people who may enjoy it. ' +
      'You choose. <a href="https://www.starseedsoultype.com/privacy.html">Privacy Policy</a>' +
      '<div class="ss-row"><button type="button" class="ss-yes">Accept</button>' +
      '<button type="button" class="ss-no">Decline</button></div>';
    document.body.appendChild(b);

    b.querySelector('.ss-yes').onclick = function () { setChoice('accept'); b.remove(); loadPixel(); };
    b.querySelector('.ss-no').onclick = function () { setChoice('decline'); b.remove(); };
  }

  if (document.body) showBanner();
  else document.addEventListener('DOMContentLoaded', showBanner);
})();
