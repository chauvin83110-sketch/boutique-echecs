/* Maison Roszada : fiche produit sur téléphone (26/11).
   Le long texte de la fiche est replié avec « Lire la suite », pour que
   les avis et les garanties arrivent plus vite. Rien ne se passe au-dessus de 749 px. */
(function () {
  var mq = window.matchMedia('(max-width: 749px)');
  function run() {
    if (!mq.matches) return;
    document.querySelectorAll('.product-details .group-block-content > rte-formatter, .product-details .group-block-content > .text-block').forEach(function (el) {
      if (el.dataset.echClamp || el.scrollHeight < 520) return;
      el.dataset.echClamp = '1';
      el.classList.add('ech-clamp');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ech-more';
      btn.textContent = 'Lire la suite';
      btn.setAttribute('aria-expanded', 'false');
      btn.addEventListener('click', function () {
        var open = el.classList.toggle('ech-clamp');
        btn.textContent = open ? 'Lire la suite' : 'Replier';
        btn.setAttribute('aria-expanded', open ? 'false' : 'true');
        if (open) el.scrollIntoView({ block: 'start', behavior: 'smooth' });
      });
      el.insertAdjacentElement('afterend', btn);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run); else run();
})();
