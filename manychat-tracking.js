(function () {
  function mcTag(tagName) {
    if (window.fbq) {
      window.fbq('trackCustom', tagName, { page: window.location.pathname });
    }
    if (window.Manychat && typeof window.Manychat.addTag === 'function') {
      window.Manychat.addTag(tagName);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var path = window.location.pathname.toLowerCase();

    if (path.indexOf('workshop') !== -1) {
      mcTag('ss_visited_workshop');
    }

    if (path.indexOf('connection-quiz') !== -1 || path.indexOf('quiz') !== -1) {
      mcTag('ss_visited_quiz');
    }

    if (path.indexOf('congratulations') !== -1) {
      mcTag('ss_visited_result');
    }

    document.addEventListener('click', function (event) {
      var target = event.target.closest('a, button');
      if (!target) return;

      var href = target.getAttribute('href') || '';
      var text = (target.innerText || target.value || '').trim();
      var combined = text + ' ' + href;

      if (/gumroad|unlock|reading|checkout|purchase|buy/i.test(combined)) {
        mcTag('ss_clicked_buy');
      }

      if (/telegram|t\.me/i.test(combined)) {
        mcTag('ss_clicked_telegram');
      }
    }, true);
  });
})();
