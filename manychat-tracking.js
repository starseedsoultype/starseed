(function () {
  function mcEvent(eventName) {
    if (window.fbq) {
      window.fbq('trackCustom', eventName, { page: window.location.pathname });
    }
    if (window.MC_PIXEL && typeof window.MC_PIXEL.fireLogConversionEvent === 'function') {
      window.MC_PIXEL.fireLogConversionEvent(eventName);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var path = window.location.pathname.toLowerCase();

    if (path.indexOf('workshop') !== -1) { mcEvent('ss_visited_workshop'); }
    if (path.indexOf('connection-quiz') !== -1 || path.indexOf('quiz') !== -1) { mcEvent('ss_visited_quiz'); }
    if (path.indexOf('congratulations') !== -1) { mcEvent('ss_visited_result'); }

    document.addEventListener('click', function (event) {
      var target = event.target.closest('a, button');
      if (!target) return;
      var href = target.getAttribute('href') || '';
      var text = (target.innerText || target.value || '').trim();
      var combined = text + ' ' + href;
      if (/gumroad|unlock|reading|checkout|purchase|buy/i.test(combined)) { mcEvent('ss_clicked_buy'); if (path.indexOf('quiz') !== -1) mcEvent('ss_origin_clicked_gumroad'); }
      if (/telegram|t\.me/i.test(combined)) { mcEvent('ss_clicked_telegram'); }
    }, true);
  });
})();
