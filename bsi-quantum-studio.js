/* ═══════════════════════════════════════════════════════════════════════
   bsi-quantum-studio.js — 🌌 BioSpec Quantum Studio (v265)
   BioSpecInfo · © Samuele Pio Provenzano

   Un solo studio per 13 aree e 16 moduli: a sinistra il palco 3D con il
   grafico DENTRO il palco (ridisegnato nello stesso fotogramma della scena,
   dagli stessi numeri), la telemetria e i cursori dei parametri; a destra
   la teoria, il focus d'esame e le domande. Quattro modi di rappresentare:
   densità (nuvola di punti come una mappa crio-EM), atomi (sfere e
   bastoncini), orbitale/funzione d'onda, proiezione iperdimensionale.

   SPECTRA_3D_BRIDGE: il ponte per Spectra (voce e testo) — elenco(),
   apri(id), imposta(chiave, valore), stato(), rappresentazione(r),
   pausa(sì/no); con gli alias openSection(area, i) e setParameter(k, v).
   Lo strumento di Spectra «quantum_studio» lo usa.

   Riscritto sul motore 3D dell'app (three r128 locale, BSILab3D, resa
   cinema, risoluzione 4K): niente moduli ES né CDN, funziona offline.
   Tutti i grafici vengono dai modelli di bsi-quantum-studio-dati.js.
   ═══════════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  var F = g.BSIFisica, D = g.document;
  if (!F) return;
  var t = F.t, PI = Math.PI;
  function Q() { return g.BSIQuantumDati; }
  var MENO_MOTO = false; try { MENO_MOTO = !!(g.matchMedia && g.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { }
  function cl(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function fmt(x, n) { if (!isFinite(x)) return '∞'; return (+x).toFixed(n == null ? 2 : n).replace('.', t(',', '.')); }

  function stile() {
    if (D.getElementById('bsiQS-stile')) return; var s = D.createElement('style'); s.id = 'bsiQS-stile';
    s.textContent = '.bsiQS{display:grid;gap:12px}@media (min-width:1000px){.bsiQS{grid-template-columns:1.3fr 1fr;align-items:start}}' +
      '.bsiQS-chips{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0}.bsiQS-chips button{min-height:36px;border-radius:18px;border:1px solid #2a4a6e;background:#0a1b2e;color:#cfe3f7;font:600 .78rem system-ui,sans-serif;padding:4px 11px;cursor:pointer}.bsiQS-chips button[aria-pressed="true"]{border-color:#38bdf8;color:#fff;background:#0369a1}' +
      '.bsiQS-palco{position:relative;border-radius:12px;overflow:hidden;background:#03060d}.bsiQS-palco .bsi3d-box{margin:0;border-radius:12px;background:#03060d}' +
      '.bsiQS-tit{position:absolute;left:10px;right:10px;top:46px;pointer-events:none;color:#fff;font:800 clamp(13px,3.8vw,17px)/1.25 system-ui,sans-serif;text-shadow:0 1px 4px #000}.bsiQS-tit small{display:block;margin-top:4px;font:600 11px/1.35 ui-monospace,Menlo,monospace;color:#7dd3fc}' +
      '.bsiQS-vivo{position:absolute;left:8px;right:8px;bottom:8px;pointer-events:none}' +
      '.bsiQS-tel{display:grid;grid-template-columns:repeat(auto-fit,minmax(104px,1fr));gap:6px;margin:8px 0}.bsiQS-tel div{background:#0a1628;border:1px solid #1a3050;border-radius:9px;padding:5px 8px;color:#9fb3c8;font:500 .7rem system-ui,sans-serif}.bsiQS-tel b{display:block;color:#fff;font:800 1rem ui-monospace,Menlo,monospace}' +
      '.bsiQS-sl{display:grid;gap:8px;margin:6px 0}.bsiQS-sl label{display:block;font:500 .8rem system-ui,sans-serif;color:#cfe3f7}.bsiQS-sl label span{display:flex;justify-content:space-between;gap:8px}.bsiQS-sl b{color:#38bdf8}.bsiQS-sl input{width:100%;accent-color:#38bdf8}' +
      '.bsiQS-com{display:flex;flex-wrap:wrap;gap:6px}.bsiQS-com button{min-height:40px;min-width:40px;border-radius:9px;border:1px solid #2a4a6e;background:#0a1b2e;color:#e6f2ff;font:600 .84rem system-ui,sans-serif;padding:4px 11px;cursor:pointer}' +
      '.bsiQS-teo{background:#0a1628;border:1px solid #1a3050;border-radius:12px;padding:12px 14px;color:#dfe8f2;font:500 .9rem/1.55 system-ui,sans-serif}.bsiQS-teo h4{margin:0 0 6px;color:#fff;font:800 1rem system-ui,sans-serif}.bsiQS-eq{font:600 .84rem/1.5 ui-monospace,Menlo,monospace;color:#7dd3fc;background:#050b16;border:1px solid #1a3050;border-radius:8px;padding:8px 10px;margin:8px 0;overflow-x:auto}' +
      '.bsiQS-esame{margin:8px 0;padding:9px 11px;border-radius:9px;border:1px solid rgba(56,189,248,.45);background:rgba(56,189,248,.09);color:#bae6fd}.bsiQS-dom button{width:100%;text-align:left;min-height:42px;margin-top:6px;padding:8px 10px;border-radius:9px;border:1px solid #1a3050;background:#0b2036;color:#e6f2ff;font:600 .86rem system-ui,sans-serif;cursor:pointer}.bsiQS-dom div{padding:6px 10px;color:#cfe3f7}';
    D.head.appendChild(s);
  }

  function creaTesti(T) {
    var cache = {};
    function tex(s, col) { var k = s + '|' + col; if (cache[k]) return cache[k]; var c = D.createElement('canvas'), q = c.getContext('2d'), px = 44, K = 2.5; q.font = '700 ' + px + 'px system-ui,sans-serif'; var w = Math.ceil(q.measureText(s).width) + 14, h = px + 14; c.width = Math.ceil(w * K); c.height = Math.ceil(h * K); q.setTransform(K, 0, 0, K, 0, 0); q.font = '700 ' + px + 'px system-ui,sans-serif'; q.textBaseline = 'middle'; q.lineWidth = 6; q.strokeStyle = 'rgba(3,6,14,.85)'; q.strokeText(s, 7, h / 2); q.fillStyle = col; q.fillText(s, 7, h / 2); var tx = new T.CanvasTexture(c); tx.minFilter = T.LinearFilter; cache[k] = { tx: tx, r: w / h }; return cache[k]; }
    return { sprite: function (s, col, h) { var o = tex(s, col || '#fff'), sp = new T.Sprite(new T.SpriteMaterial({ map: o.tx, transparent: true, depthTest: false, depthWrite: false })); sp.scale.set(h * o.r, h, 1); sp.renderOrder = 30; sp.userData.h = h; return sp; },
      cambia: function (sp, s, col) { var o = tex(s, col || '#fff'); sp.material.map = o.tx; sp.material.needsUpdate = true; sp.scale.set(sp.userData.h * o.r, sp.userData.h, 1); },
      distruggi: function () { Object.keys(cache).forEach(function (k) { cache[k].tx.dispose(); }); cache = {}; } };
  }

  function kit(T, G, testi) {
    var Y = new T.Vector3(0, 1, 0), tmp = new T.Vector3(), geoS = new T.SphereGeometry(1, 24, 18), geoC = new T.CylinderGeometry(1, 1, 1, 14, 1);
    var K = { T: T, G: G, testi: testi, geoS: geoS, geoC: geoC,
      mat: function (col, o) { o = o || {}; return new T.MeshStandardMaterial({ color: col, emissive: o.em || col, emissiveIntensity: o.ei != null ? o.ei : 0.12, roughness: o.r != null ? o.r : 0.45, metalness: 0.05, transparent: o.op != null && o.op < 1, opacity: o.op != null ? o.op : 1, depthWrite: !(o.op != null && o.op < 1), side: o.doppio ? T.DoubleSide : T.FrontSide }); },
      sfera: function (r, col, pos, o) { var m = new T.Mesh(geoS, K.mat(col, o)); m.scale.setScalar(r); if (pos) m.position.set(pos[0], pos[1], pos[2]); (o && o.padre || G).add(m); return m; },
      cil: function (col, o) { var m = new T.Mesh(geoC, K.mat(col, o)); (o && o.padre || G).add(m); return m; },
      tra: function (m, p0, p1, r) { var dx = p1[0] - p0[0], dy = p1[1] - p0[1], dz = p1[2] - p0[2], l = Math.sqrt(dx * dx + dy * dy + dz * dz); m.visible = l > 1e-5; if (!m.visible) return; m.position.set((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, (p0[2] + p1[2]) / 2); m.scale.set(r, l, r); tmp.set(dx / l, dy / l, dz / l); m.quaternion.setFromUnitVectors(Y, tmp); },
      et: function (s, col, h, pos, padre) { var sp = testi.sprite(s, col, h || 0.32); sp.position.set(pos[0], pos[1], pos[2]); (padre || G).add(sp); return sp; },
      freccia: function (col, padre) { var gr = new T.Group(), c = new T.Mesh(geoC, K.mat(col, { ei: 0.3 })), p = new T.Mesh(new T.ConeGeometry(1, 1, 16), K.mat(col, { ei: 0.3 })); gr.add(c); gr.add(p); (padre || G).add(gr); return { g: gr, imposta: function (p0, p1, r) { var d = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]], l = Math.hypot(d[0], d[1], d[2]) || 1e-6, u = [d[0] / l, d[1] / l, d[2] / l], hl = Math.min(l * 0.35, r * 5), q0 = [p1[0] - u[0] * hl, p1[1] - u[1] * hl, p1[2] - u[2] * hl]; K.tra(c, p0, q0, r); p.position.set((q0[0] + p1[0]) / 2, (q0[1] + p1[1]) / 2, (q0[2] + p1[2]) / 2); p.scale.set(r * 2.6, hl, r * 2.6); tmp.set(u[0], u[1], u[2]); p.quaternion.setFromUnitVectors(Y, tmp); } }; },
      nuvola: function (punti, col, r, o) { var im = new T.InstancedMesh(new T.SphereGeometry(r, 8, 6), K.mat(col, o || { ei: 0.25 }), punti.length), d = new T.Object3D(); punti.forEach(function (p, i) { d.position.set(p[0], p[1], p[2]); d.updateMatrix(); im.setMatrixAt(i, d.matrix); }); im.instanceMatrix.needsUpdate = true; ((o && o.padre) || G).add(im); return im; },
      seme: function (s) { var x = s >>> 0 || 1; return function () { x = (x * 1664525 + 1013904223) >>> 0; return x / 4294967296; }; } };
    return K;
  }
  function cornice(q, W, H) { q.clearRect(0, 0, W, H); q.fillStyle = 'rgba(4,8,18,.74)'; q.strokeStyle = 'rgba(120,150,200,.25)'; q.beginPath(); if (q.roundRect) q.roundRect(0.5, 0.5, W - 1, H - 1, 10); else q.rect(0.5, 0.5, W - 1, H - 1); q.fill(); q.stroke(); }
  function assi(q, x0, y0, x1, y1, ex, ey) { q.strokeStyle = 'rgba(140,160,190,.35)'; q.lineWidth = 1; q.beginPath(); q.moveTo(x0, y0); q.lineTo(x0, y1); q.lineTo(x1, y1); q.stroke(); q.fillStyle = 'rgba(200,214,232,.9)'; q.font = '500 8.5px system-ui,sans-serif'; if (ey) q.fillText(ey, x0 + 3, y0 + 2); if (ex) { q.textAlign = 'right'; q.fillText(ex, x1, y1 + 11); q.textAlign = 'left'; } }
  function linea(q, f, a, b, X, Yf, col, w, tratt, n) { q.strokeStyle = col; q.lineWidth = w || 2; q.setLineDash(tratt ? [4, 4] : []); q.beginPath(); var primo = true; n = n || 240; for (var k = 0; k <= n; k++) { var x = a + (b - a) * k / n, y = f(x); if (!isFinite(y)) { primo = true; continue; } if (primo) { q.moveTo(X(x), Yf(y)); primo = false; } else q.lineTo(X(x), Yf(y)); } q.stroke(); q.setLineDash([]); q.lineWidth = 1; }
  function punto(q, x, y, col) { q.fillStyle = col || '#fff'; q.beginPath(); q.arc(x, y, 4, 0, 2 * PI); q.fill(); q.strokeStyle = 'rgba(255,255,255,.5)'; q.beginPath(); q.arc(x, y, 8, 0, 2 * PI); q.stroke(); }
  function testo(q, s, x, y, col, f) { q.fillStyle = col || '#e9ecef'; q.font = f || '600 9px system-ui,sans-serif'; q.fillText(s, x, y); }

  var MOTORI = {};
  g.BSIQuantumStudio = { MOTORI: MOTORI, stile: stile, creaTesti: creaTesti, kit: kit, util: { cornice: cornice, assi: assi, linea: linea, punto: punto, testo: testo, fmt: fmt, cl: cl } };
})(typeof window !== 'undefined' ? window : globalThis);
