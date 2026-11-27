// Maison Roszada : fabrique de reels 9:16 avec musique originale.
// A injecter dans un onglet https://maisonroszada.com (images même origine).
// Usage : await RZ.build(spec) -> {blob, url}. spec = {key, cards:[...], music:{chords,beat}}
// cards : {type:'text', big, small, dur} | {type:'photo', src, title, sub, dur, z0,z1,dx,dy} | {type:'end', big, small, dur}
window.RZ = (() => {
  const W = 1080, H = 1920, FPS = 30, IV = '#F6F1E7', INK = '#2B2520', BRASS = '#8C6D3F', GREEN = '#23362B';
  async function fonts() {
    if (!document.getElementById('rz-fonts')) {
      const l = document.createElement('link'); l.id = 'rz-fonts'; l.rel = 'stylesheet';
      l.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=Inter:wght@400;500&display=block';
      document.head.appendChild(l); await new Promise(r => l.onload = r);
    }
    await Promise.all(['400 40px "Cormorant Garamond"', 'italic 400 40px "Cormorant Garamond"', '500 20px Inter'].map(f => document.fonts.load(f)));
  }
  const img = src => new Promise((res, rej) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => res(i); i.onerror = rej; i.src = src; });
  const ease = x => { x = Math.min(Math.max(x, 0), 1); return x * x * (3 - 2 * x); };
  function spaced(ctx, txt, x, y, sp) { // texte espacé centré
    const chars = [...txt]; const w = chars.reduce((a, c) => a + ctx.measureText(c).width, 0) + sp * (chars.length - 1);
    let cx = x - w / 2; ctx.textAlign = 'left'; for (const c of chars) { ctx.fillText(c, cx, y); cx += ctx.measureText(c).width + sp; } ctx.textAlign = 'center';
  }
  function wrap(ctx, txt, x, y, maxW, lh) {
    const lines = []; for (const para of txt.split('\n')) { let cur = ''; for (const w of para.split(' ')) { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; } lines.push(cur); }
    const y0 = y - (lines.length - 1) * lh / 2; lines.forEach((l, i) => ctx.fillText(l, x, y0 + i * lh)); return y0 + (lines.length - 1) * lh;
  }
  function frame(ctx) { // cadre fixe : en-tête + pied
    ctx.fillStyle = IV; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = INK; ctx.font = '500 34px "Cormorant Garamond"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    spaced(ctx, 'MAISON ROSZADA', W / 2, 170, 9);
    ctx.fillStyle = BRASS; ctx.fillRect(W / 2 - 40, 215, 80, 2);
    ctx.font = '500 22px Inter'; spaced(ctx, 'MAISONROSZADA.COM', W / 2, H - 150, 5);
  }
  function drawCard(ctx, c, t, imgs) {
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; // t = temps local en s
    if (c.type === 'text' || c.type === 'end') {
      ctx.fillStyle = INK; ctx.font = 'italic 400 ' + (c.size || 84) + 'px "Cormorant Garamond"';
      const yb = wrap(ctx, c.big, W / 2, H / 2 - 40, 860, (c.size || 84) * 1.18);
      if (c.small) { ctx.fillStyle = c.type === 'end' ? BRASS : BRASS; ctx.font = (c.type === 'end' ? '500 26px Inter' : 'italic 400 46px "Cormorant Garamond"');
        if (c.type === 'end') spaced(ctx, c.small.toUpperCase(), W / 2, yb + 110, 4); else wrap(ctx, c.small, W / 2, yb + 100, 860, 56); }
    } else if (c.type === 'photo') {
      const im = imgs[c.src], bw = 1080, bh = 1080, by = 330; // photo carrée pleine largeur
      const p = t / c.dur, z = c.z0 + (c.z1 - c.z0) * p;
      const s = Math.max(bw / im.width, bh / im.height) * z, w = im.width * s, h = im.height * s;
      const cx = (bw - w) / 2 + (c.dx || 0) * p * (w - bw) / 2, cy = (bh - h) / 2 + (c.dy || 0) * p * (h - bh) / 2;
      ctx.save(); ctx.beginPath(); ctx.rect(0, by, bw, bh); ctx.clip(); ctx.drawImage(im, cx, by + cy, w, h); ctx.restore();
      if (c.title) { ctx.fillStyle = INK; ctx.font = 'italic 400 64px "Cormorant Garamond"'; ctx.fillText(c.title, W / 2, by + bh + 105); }
      if (c.sub) { ctx.fillStyle = BRASS; ctx.font = '500 24px Inter'; spaced(ctx, c.sub.toUpperCase(), W / 2, by + bh + 175, 4); }
    }
  }
  function music(dur, m) { // piano arpégé + nappe + écho, rendu hors ligne
    const SR = 44100, oc = new OfflineAudioContext(2, Math.ceil(SR * dur), SR);
    const master = oc.createGain(); master.gain.value = 2.1;
    const dl = oc.createDelay(1); dl.delayTime.value = 0.13; const fb = oc.createGain(); fb.gain.value = 0.42; const wet = oc.createGain(); wet.gain.value = 0.5;
    dl.connect(fb); fb.connect(dl); dl.connect(wet); wet.connect(oc.destination);
    const fade = oc.createGain(); master.connect(fade); fade.connect(oc.destination); fade.connect(dl);
    fade.gain.setValueAtTime(1, Math.max(0, dur - 1.6)); fade.gain.linearRampToValueAtTime(0, dur);
    const hz = n => 440 * Math.pow(2, (n - 69) / 12);
    const note = (n, t0, d, a) => { [1, 2, 3].forEach((h, i) => { const o = oc.createOscillator(), g = oc.createGain(); o.frequency.value = hz(n) * h; g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(a * [1, .35, .1][i], t0 + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d); o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + d + 0.05); }); };
    const pad = (ns, t0, d) => ns.forEach(n => { const o = oc.createOscillator(), g = oc.createGain(); o.type = 'triangle'; o.frequency.value = hz(n); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.022, t0 + d / 2); g.gain.linearRampToValueAtTime(0, t0 + d); o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + d); });
    const pat = m.pattern || [0, 1, 2, 3, 2, 1, 0, 2]; const b = m.beat; let bar = 0;
    while (bar * b * 8 < dur) { const ch = m.chords[bar % m.chords.length], t0 = bar * b * 8, ns = [ch[0], ch[1], ch[2], ch[0] + 12];
      note(ch[0] - 12, t0, 4.5, 0.20); pad(ch, t0, b * 8);
      pat.forEach((j, i) => { if (t0 + i * b < dur - 0.3) note(ns[j] + 12 * (m.oct || 0), t0 + i * b, 2.4, 0.11); });
      bar++; }
    return oc.startRendering();
  }
  async function loadImgs(spec) { const imgs = {}; for (const c of spec.cards) if (c.src && !imgs[c.src]) imgs[c.src] = await img(c.src); return imgs; }
  // Le son exige un vrai clic (règle d'autoplay de Chrome) : build() affiche un bouton « RZ-GO » et attend le clic.
  function gesture() { return new Promise(r => { const b = document.createElement('button'); b.id = 'rzgo'; b.textContent = 'RZ-GO'; b.style.cssText = 'position:fixed;left:20px;top:20px;z-index:9999999;font-size:40px;padding:20px 40px;background:#23362B;color:#fff'; b.onclick = () => { b.remove(); r(); }; document.body.appendChild(b); }); }
  async function build(spec) {
    await fonts(); const imgs = await loadImgs(spec);
    let t = 0; const XF = 0.5; spec.cards.forEach(c => { c.t0 = t; t += c.dur; }); const dur = t;
    const buf = await music(dur, spec.music);
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const ctx = cv.getContext('2d');
    const off = document.createElement('canvas'); off.width = W; off.height = H; const octx = off.getContext('2d');
    const o2 = document.createElement('canvas'); o2.width = W; o2.height = H; const o2x = o2.getContext('2d');
    const render = time => {
      frame(ctx);
      const i = spec.cards.findIndex(c => time >= c.t0 && time < c.t0 + c.dur); const ci = i < 0 ? spec.cards.length - 1 : i; const c = spec.cards[ci];
      const lt = time - c.t0;
      octx.clearRect(0, 0, W, H); drawCard(octx, c, lt, imgs);
      const a = ci === 0 ? 1 : ease(lt / XF);
      if (ci > 0 && a < 1) { const p = spec.cards[ci - 1]; o2x.clearRect(0, 0, W, H); drawCard(o2x, p, p.dur + lt, imgs); ctx.globalAlpha = 1 - a; ctx.drawImage(o2, 0, 0); }
      ctx.globalAlpha = a; ctx.drawImage(off, 0, 0); ctx.globalAlpha = 1;
    };
    await gesture();
    const ac = new AudioContext(); await ac.resume(); const dest = ac.createMediaStreamDestination(); const srcN = ac.createBufferSource(); srcN.buffer = buf; srcN.connect(dest);
    const stream = new MediaStream([...cv.captureStream(FPS).getVideoTracks(), ...dest.stream.getAudioTracks()]);
    const mime = ['video/mp4;codecs=avc1.640028,mp4a.40.2', 'video/mp4;codecs=avc1,mp4a', 'video/mp4'].find(m => MediaRecorder.isTypeSupported(m));
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8e6, audioBitsPerSecond: 160e3 }); const chunks = [];
    rec.ondataavailable = e => e.data.size && chunks.push(e.data);
    const done = new Promise(r => rec.onstop = r);
    render(0); rec.start(250); const start = ac.currentTime + 0.05; srcN.start(start);
    await new Promise(res => { const tick = () => { const now = ac.currentTime - start; if (now >= dur) return res(); render(Math.max(0, now)); setTimeout(tick, 1000 / FPS / 2); }; tick(); });
    await new Promise(r => setTimeout(r, 300)); rec.stop(); await done; ac.close();
    const blob = new Blob(chunks, { type: 'video/mp4' });
    await save(spec.key, blob); return { url: URL.createObjectURL(blob), size: blob.size, mime, dur };
  }
  function db() { return new Promise((r, j) => { const q = indexedDB.open('reels'); q.onupgradeneeded = () => q.result.createObjectStore('v'); q.onsuccess = () => r(q.result); q.onerror = j; }); }
  async function save(k, b) { let d = await db(); if (!d.objectStoreNames.contains('v')) { const v = d.version; d.close(); d = await new Promise((r, j) => { const q = indexedDB.open('reels', v + 1); q.onupgradeneeded = () => q.result.createObjectStore('v'); q.onsuccess = () => r(q.result); q.onerror = j; }); } return new Promise(r => { const tx = d.transaction('v', 'readwrite'); tx.objectStore('v').put(b, k); tx.oncomplete = r; }); }
  async function load(k) { const d = await db(); return new Promise(r => { const q = d.transaction('v').objectStore('v').get(k); q.onsuccess = () => r(q.result); }); }
  async function preview(spec) { // planche d'aperçu (canvas)
    await fonts(); const imgs = await loadImgs(spec);
    const n = spec.cards.length, sw = 216, sh = 384, pl = document.createElement('canvas'); pl.width = n * (sw + 8) + 8; pl.height = sh + 16; const p = pl.getContext('2d'); p.fillStyle = '#ccc'; p.fillRect(0, 0, pl.width, pl.height);
    spec.cards.forEach((c, i) => { const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d'); frame(x); drawCard(x, c, c.dur * 0.6, imgs); p.drawImage(cv, 8 + i * (sw + 8), 8, sw, sh); });
    return pl;
  }
  // URLs des photos d'une fiche, en même origine (canvas non « tainted »)
  async function productImages(h) { return (await (await fetch('/products/' + h + '.js')).json()).images.map(s => s.replace(/^\/\//, 'https://').replace('cdn.shopify.com/s/files/1/0925/0003/3909', 'maisonroszada.com/cdn/shop') + (s.includes('?') ? '&' : '?') + 'width=1400'); }
  return { build, save, load, preview, productImages };
})();
'ok'
