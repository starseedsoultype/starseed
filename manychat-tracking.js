(function () {
  window.StarSeedFunnel = window.StarSeedFunnel || {};

  window.StarSeedFunnel.track = function (eventName, properties) {
    properties = properties || {};
    properties.page = window.location.pathname;
    properties.url = window.location.href;

    if (window.fbq) {
      window.fbq('trackCustom', eventName, properties);
    }

    if (window.Manychat) {
      try {
        if (typeof window.Manychat.track === 'function') {
          window.Manychat.track(eventName, properties);
        }
      } catch (error) {
        console.warn('ManyChat tracking event was not sent', error);
      }
    }

    window.dispatchEvent(new CustomEvent('starseedfunnel:event', {
      detail: { eventName: eventName, properties: properties }
    }));
  };

  document.addEventListener('DOMContentLoaded', function () {
    window.StarSeedFunnel.track('StarSeed_Page_View');

    var path = window.location.pathname.toLowerCase();

    if (path.indexOf('index') !== -1 || path === '/' || path.endsWith('/')) {
      window.StarSeedFunnel.track('StarSeed_Landing_View');
    }

    if (path.indexOf('workshop') !== -1) {
      window.StarSeedFunnel.track('StarSeed_Workshop_View');
    }

    if (path.indexOf('connection-quiz') !== -1 || path.indexOf('quiz') !== -1) {
      window.StarSeedFunnel.track('StarSeed_Quiz_View');
    }

    if (path.indexOf('bond') !== -1) {
      window.StarSeedFunnel.track('StarSeed_Bond_View');
    }

    if (path.indexOf('congratulations') !== -1) {
      window.StarSeedFunnel.track('StarSeed_Result_View');
    }

    document.addEventListener('click', function (event) {
      var target = event.target.closest('a, button');
      if (!target) return;

      var text = (target.innerText || target.value || target.getAttribute('aria-label') || '').trim().slice(0, 120);
      var href = target.getAttribute('href') || '';
      var payload = { text: text, href: href };
      var combined = text + ' ' + href;

      if (/portal|11\.11|test|quiz|start/i.test(combined)) {
        window.StarSeedFunnel.track('StarSeed_Test_Start_Click', payload);
      }

      if (/workshop/i.test(combined)) {
        window.StarSeedFunnel.track('StarSeed_Workshop_Click', payload);
      }

      if (/twin|free pdf|guide/i.test(combined)) {
        window.StarSeedFunnel.track('StarSeed_FreePDF_Click', payload);
      }

      if (/telegram|t\.me/i.test(combined)) {
        window.StarSeedFunnel.track('StarSeed_Telegram_Click', payload);
      }

      if (/gumroad|unlock|reading|checkout|purchase|buy/i.test(combined)) {
        window.StarSeedFunnel.track('StarSeed_Gumroad_Click', payload);
      }

      if (/bond|compatibility|connection/i.test(combined)) {
        window.StarSeedFunnel.track('StarSeed_Bond_Click', payload);
      }
    }, true);
  });
})();
