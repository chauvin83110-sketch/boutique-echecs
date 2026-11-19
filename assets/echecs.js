/* Boutique d'échecs : dates de livraison estimées et compte à rebours promo. */
(function () {
  var fmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Europe/Paris' });

  function addBusinessDays(date, days) {
    var d = new Date(date.getTime());
    var added = 0;
    while (added < days) {
      d.setDate(d.getDate() + 1);
      var wd = d.getDay();
      if (wd !== 0 && wd !== 6) added++;
    }
    return d;
  }

  function renderDeliveries(root) {
    (root || document).querySelectorAll('[data-ech-delivery]:not([data-done])').forEach(function (el) {
      var min = parseInt(el.dataset.min, 10);
      var max = parseInt(el.dataset.max, 10);
      if (!min || !max) return;
      var now = new Date();
      // Commande passée après 14 h : on compte à partir du lendemain.
      var start = now.getHours() >= 14 ? addBusinessDays(now, 1) : now;
      var a = fmt.format(addBusinessDays(start, min)).replace('.', '');
      var b = fmt.format(addBusinessDays(start, max)).replace('.', '');
      var t = el.querySelector('[data-ech-delivery-text]');
      if (t) t.textContent = (el.dataset.prefix || 'Livré') + ' entre le ' + a + ' et le ' + b;
      el.setAttribute('data-done', '');
    });
  }

  function startCountdowns() {
    document.querySelectorAll('[data-ech-countdown]').forEach(function (el) {
      var end = parseInt(el.dataset.end, 10) * 1000;
      var out = el.querySelector('[data-ech-countdown-text]');
      function tick() {
        var diff = end - Date.now();
        if (diff <= 0) { el.hidden = true; return; }
        var s = Math.floor(diff / 1000);
        var d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
        out.textContent = (d > 0 ? d + ' j ' : '') + String(h).padStart(2, '0') + ' h ' + String(m).padStart(2, '0') + ' min ' + String(sec).padStart(2, '0') + ' s';
        setTimeout(tick, 1000);
      }
      tick();
    });
  }

  function init() { renderDeliveries(); startCountdowns(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  // Les filtres et le défilement infini remplacent la grille : on recalcule les dates.
  var queued = false;
  new MutationObserver(function () {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; renderDeliveries(); });
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
