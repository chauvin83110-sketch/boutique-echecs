/* Maison Roszada : motion design (voir ech-motion.css).
   Ne fait rien sans la classe ech-motion sur <html>. Aucune dépendance. */
(function () {
  var root = document.documentElement;
  if (!root.classList.contains('ech-motion') || !('IntersectionObserver' in window)) return;

  // Ce qui apparaît au défilement. Les éléments d'une même liste arrivent en cascade.
  var SINGLE = '.ech-scenes__head, .ech-cols__head, .ech-showcase__head, .ech-showcase__text, .ech-gifts__head, .ech-gifts__tierhead,' +
    '.ech-mani__text > .ech-kicker, .ech-mani__title, .ech-mani__text > .ech-link, .ech-spot__text, .ech-guide__title, .ech-guide__intro,' +
    '.ech-faq__title, .ech-compare, .ech-avis > .ech-kicker, .ech-ld__lead, .ech-ld__specs, .ech-ld__band';
  var LIST = '.ech-promises li, .ech-scenes__grid > li, .ech-cols__grid > li, .ech-showcase__grid > li, .ech-tiles > *, .ech-faq__item, .ech-avis__item';
  var IMAGES = '.ech-mani__media, .ech-spot__media, .ech-ld__scene';
  var WORDS = '.ech-mani__body';
  var PARALLAX = '.ech-amb__img, .ech-shero__media img';
  var SKIP = 'header, footer, .ech-amb__text, .ech-shero__text, .ech-hero__text, dialog, [data-m]';

  var vh = window.innerHeight;
  function below(el) { return el.getBoundingClientRect().top > vh * 0.92; }

  function tag(selector, kind) {
    document.querySelectorAll(selector).forEach(function (el) {
      if (el.hasAttribute('data-m') || (el.parentElement && el.parentElement.closest(SKIP))) return;
      if (!below(el)) return; // déjà à l'écran : on n'y touche pas (pas de clignotement)
      el.setAttribute('data-m', kind);
    });
  }

  function show(el) { el.classList.add('is-in'); }

  var io = new IntersectionObserver(function (entries) {
    var n = 0;
    entries.forEach(function (e) {
      var el = e.target;
      // Déjà dépassé sans avoir été vu (ancre, saut de page) : on affiche tout de suite.
      if (!e.isIntersecting && e.boundingClientRect.bottom < 0) { io.unobserve(el); show(el); return; }
      if (!e.isIntersecting) return;
      io.unobserve(el);
      // Arrivé d'un coup loin au-dessus (ancre, retour arrière) : on affiche sans attendre.
      var d = e.boundingClientRect.top < 0 ? 0 : Math.min(n++, 5) * 90;
      el.style.setProperty('--m-d', d + 'ms');
      show(el);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  // Mots : découpe le texte en mots sans toucher aux balises (em, liens).
  function splitWords(el) {
    var i = 0;
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      if (!node.nodeValue.trim()) return;
      var frag = document.createDocumentFragment();
      node.nodeValue.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        var s = document.createElement('span');
        s.className = 'ech-m-w';
        s.style.setProperty('--m-wi', i++);
        s.textContent = part;
        frag.appendChild(s);
      });
      node.parentNode.replaceChild(frag, node);
    });
    el.style.setProperty('--m-n', i);
    el.setAttribute('data-m-words', '');
  }

  var live = []; // éléments suivis pendant le défilement (mots, parallaxe), seulement quand ils sont à l'écran
  var ticking = false;
  function frame() {
    ticking = false;
    live.forEach(function (item) {
      if (!item.on) return;
      var r = (item.frame || item.el).getBoundingClientRect();
      if (item.type === 'words') {
        var p = (vh * 0.86 - r.top) / (r.height + vh * 0.36);
        p = Math.max(0, Math.min(1, p));
        if (Math.abs(p - item.last) > 0.004) { item.last = p; item.el.style.setProperty('--m-p', p.toFixed(3)); }
      } else {
        // r = cadre de la photo (son parent) : on mesure de combien il est monté depuis le chargement.
        var y = Math.max(0, Math.min(140, (item.base - r.top) * 0.14));
        item.el.style.setProperty('--m-y', y.toFixed(1) + 'px');
      }
    });
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }

  var liveIo = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      live.forEach(function (item) { if (item.el === e.target) item.on = e.isIntersecting; });
    });
    onScroll();
  }, { rootMargin: '10% 0px 10% 0px' });

  function init() {
    tag(IMAGES, 'img');
    tag(SINGLE, 'up');
    tag(LIST, 'up');
    document.querySelectorAll('[data-m]').forEach(function (el) { io.observe(el); });

    document.querySelectorAll(WORDS).forEach(function (el) {
      if (!below(el)) return;
      splitWords(el);
      live.push({ el: el, type: 'words', on: false, last: -1 });
    });
    if (window.matchMedia('(min-width: 990px) and (hover: hover)').matches) {
      document.querySelectorAll(PARALLAX).forEach(function (el) {
        el.setAttribute('data-m-parallax', '');
        var frame = el.closest('.ech-amb, .ech-shero__media') || el.parentElement;
        live.push({ el: el, frame: frame, type: 'parallax', on: false, base: Math.max(0, frame.getBoundingClientRect().top) });
      });
    }
    if (live.length) {
      live.forEach(function (item) { liveIo.observe(item.el); });
      // Capture : sur ordinateur, le thème fait défiler .page-wrapper et non la fenêtre.
      document.addEventListener('scroll', onScroll, { passive: true, capture: true });
      window.addEventListener('resize', function () { vh = window.innerHeight; onScroll(); }, { passive: true });
    }

    // Filet de sécurité : si une page est restaurée depuis le cache, tout doit être visible.
    window.addEventListener('pageshow', function (ev) {
      if (ev.persisted) document.querySelectorAll('[data-m]').forEach(show);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
