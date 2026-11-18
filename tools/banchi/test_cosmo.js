#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════════
   test_cosmo — 🎞️ Simulazioni cosmiche (v258)

   PERCHE' QUESTO BANCO ESISTE
   Le simulazioni devono sembrare reel ma essere simulazioni vere: qui si
   pretende la fisica, con i numeri che l'autore stesso ha chiesto di provare.
   · H₂: minimo di Morse a 74,1 pm e −4,75 eV, D₀ = 4,48 eV, ν = 1,32·10¹⁴ Hz,
     moto esatto che conserva l'energia, nuvola LCAO esatta che a R grande
     diventa due 1s separate.
   · Geodetiche: b_crit = 5,196 M (catturato sotto, sfugge sopra), deflessione
     che tende a 4M/b, giri che crescono come −ln ε/2π, vincolo conservato
     (ΔE/E < 10⁻⁷), equazione della lente con l'anello di Einstein ≈ √(4MD).
   · Galassia: Bessel, picco del disco di Freeman a 2,15 R_d, Φ coerente con
     v², curva piatta con l'alone, 100 % legate con l'alone e meno senza,
     ΔE/E piccolo con il leapfrog.
   · Telo: N corpi con l'energia conservata e una luna che resta legata.
   · Reticolo: lo spostamento è verso la massa e si annulla senza massa.
   Poi la pagina, sul telefono: la sezione, le schede-anteprima, ogni
   simulazione si apre e disegna, l'HUD ha i numeri, nessun errore.

   USO   node tools/banchi/test_cosmo.js    (serve un server su :8899)
   ════════════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const { chromium } = require('playwright-core');
const RADICE = path.join(__dirname, '..', '..');
const BASE = process.env.BSI_URL_BASE || 'http://127.0.0.1:8899/';
const CHROME = process.env.BSI_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
let ok = 0, ko = 0;
function att(d, atteso, avuto) { if (String(atteso) === String(avuto)) { ok++; console.log('  ✓ ' + d + '  → ' + avuto); } else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + '\n      avuto:  ' + avuto); } }
function vero(d, c) { att(d, true, !!c); }

(async () => {
  const ctx = { console, Math, Array, Object, isFinite, String, Number, JSON, Float32Array, Float64Array, Int8Array, Date }; ctx.window = ctx; ctx.globalThis = ctx;
  ctx.BSIFisica = { t: a => a, tt: a => a[0], calcolo: {}, el: () => ({}), sezione() {}, cursore() {} }; vm.createContext(ctx);
  ['bsi-cosmo-core.js', 'bsi-cosmo-h2.js', 'bsi-cosmo-geodetiche.js', 'bsi-cosmo-galassia.js', 'bsi-cosmo-telo.js', 'bsi-cosmo-reticolo.js'].forEach(f => vm.runInContext(fs.readFileSync(path.join(RADICE, f), 'utf8'), ctx));
  const C = ctx.BSICosmo;

  console.log('── 9 · H₂ ──');
  const H = C.h2;
  let rmin = 0, vmin = 1; for (let R = 0.5; R < 1.2; R += 1e-5) { const v = H.V(R); if (v < vmin) { vmin = v; rmin = R; } }
  att('minimo della curva a 74,1 pm e −4,75 eV', '74.1 -4.75', (rmin * 100).toFixed(1) + ' ' + vmin.toFixed(2));
  att('D₀ = D_e − E₀ = 4,48 eV (432 kJ/mol)', '4.48 432', H.D0.toFixed(2) + ' ' + Math.round(H.D0 * 96.4853));
  att('vibra 1,32·10¹⁴ volte al secondo', '1.32', (H.NU / 1e14).toFixed(2));
  { const mu = 0.503912 * 1.66053906660e-27, E = H.E0; let p = 0; const W = H.Omega(E); for (let k = 1; k < 100; k++) { const fi = k * 0.0628, h = 1e-6, r = H.Rdi(E, fi), rd = (H.Rdi(E, fi + h) - H.Rdi(E, fi - h)) / (2 * h) * W * 1e-10; p = Math.max(p, Math.abs(0.5 * mu * rd * rd / 1.602176634e-19 + H.V(r) + 4.7472 - E) / E); }
    vero('moto esatto: energia conservata (scarto ' + p.toExponential(1) + ')', p < 1e-6); }
  { const pos = new Float32Array(3 * H.N), col = new Float32Array(3 * H.N), k = H.nuvola(0.7414, pos, col); let mezzo = 0, ciano = 0; for (let i = 0; i < k; i++) { if (Math.abs(pos[3 * i]) < 0.2) mezzo++; if (col[3 * i + 1] > 0.85) ciano++; }
    vero('nuvola all\'equilibrio: ' + k + ' punti, densità condivisa fra i nuclei (' + (ciano / k * 100).toFixed(0) + ' % ciano)', k > 25000 && ciano / k > 0.2 && mezzo / k > 0.15);
    const k2 = H.nuvola(5, pos, col); let c2 = 0; for (let i = 0; i < k2; i++) if (col[3 * i + 1] > 0.85) c2++;
    vero('a 500 pm restano due 1s quasi separate (' + (c2 / k2 * 100).toFixed(1) + ' % ciano)', c2 / k2 < 0.05); }

  console.log('\n── 4 · Geodetiche di Schwarzschild ──');
  const G = C.geodetiche;
  att('b_crit = 3√3 M = 5,196 M', '5.196', G.CONST.bcrit.toFixed(3));
  att('b = 5,19 catturato, b = 5,20 sfugge', 'catturato sfugge', G.raggio(5.19).esito + ' ' + G.raggio(5.2).esito);
  { const r = G.raggio(100); vero('campo debole: deflessione 4M/b + 15πM²/4b² a b = 100 (' + r.deflessione.toFixed(5) + ')', Math.abs(r.deflessione - (0.04 + 15 * Math.PI / 4e4)) < 2e-4); }
  { const g4 = G.raggio(5.196152422706632 * (1 + 1e-4), { maxGiri: 8 }), g8 = G.raggio(5.196152422706632 * (1 + 1e-8), { maxGiri: 8 }); vero('giri: da ε = 10⁻⁴ a 10⁻⁸ crescono di ln(10⁴)/2π = 1,47 (' + (g8.giri - g4.giri).toFixed(2) + ')', Math.abs(g8.giri - g4.giri - Math.log(1e4) / (2 * Math.PI)) < 0.05); }
  { let e = 0; [0.5, 3, 5.0, 5.3, 8, 20].forEach(b => { e = Math.max(e, G.raggio(b).errore); }); vero('vincolo conservato: ΔE/E < 10⁻⁷ (' + e.toExponential(1) + ')', e < 1e-7); }
  vero('lente: l\'immagine di una stella allineata cade vicino all\'anello di Einstein √(4MD) = 10,95 (' + G.immagine(0).toFixed(2) + ')', Math.abs(G.immagine(0) - 11) < 2);

  console.log('\n── 8 · Galassia e materia oscura ──');
  const Ga = C.galassia;
  att('Bessel: I₀(1), K₀(1), I₁(1), K₁(1)', '1.26607 0.42102 0.56516 0.60191', [Ga.I0(1), Ga.K0(1), Ga.I1(1), Ga.K1(1)].map(x => x.toFixed(5)).join(' '));
  { let vm2 = 0, Rm = 0; for (let R = 0.1; R < 20; R += 0.005) { const v = Math.sqrt(Ga.v2d(R)); if (v > vm2) { vm2 = v; Rm = R; } } att('picco del disco di Freeman a R = 2,15 R_d', '2.15', (Rm / Ga.CONST.Rd).toFixed(2)); }
  { let peg = 0; [2, 8, 20].forEach(R => { const h = 1e-4; [[Ga.phid, Ga.v2d], [Ga.phih, Ga.v2h], [Ga.phib, Ga.v2b]].forEach(([p, v]) => { peg = Math.max(peg, Math.abs((p(R + h) - p(R - h)) / (2 * h) * R / v(R) - 1)); }); }); vero('Φ coerente con v² = R dΦ/dR per le tre componenti (scarto ' + peg.toExponential(1) + ')', peg < 1e-5); }
  vero('curva piatta con l\'alone: v(10) e v(25) entro il 10 % (' + Ga.vc(10, true).toFixed(0) + ', ' + Ga.vc(25, true).toFixed(0) + ' km/s)', Math.abs(Ga.vc(25, true) / Ga.vc(10, true) - 1) < 0.1);
  vero('senza alone cala: v(25)/v(10) < 0,8', Ga.vc(25, false) / Ga.vc(10, false) < 0.8);
  { const g1 = Ga.galassia(3000, 7), g2 = Ga.galassia(3000, 7); Ga.iniziaEnergie(g1, true); Ga.iniziaEnergie(g2, false); Ga.evolvi(g1, true, 0.0008, 160); Ga.evolvi(g2, false, 0.0008, 160); const m1 = Ga.misure(g1, true), m2 = Ga.misure(g2, false);
    vero('con l\'alone: 100 % legate, ΔE/E < 10⁻⁴ (' + m1.dEE.toExponential(1) + ')', m1.legate === 1 && m1.dEE < 1e-4);
    vero('senza alone: le stelle esterne sfuggono (' + (m2.legate * 100).toFixed(1) + ' % legate)', m2.legate < 0.97 && m2.legate > 0.7);
    vero('la curva misurata sulle stelle segue quella del modello a 8 kpc (' + (m1.curva.find(p => p[0] === 8.5) || [0, 0])[1].toFixed(0) + ' km/s)', Math.abs((m1.curva.find(p => p[0] === 8.5) || [0, 0])[1] / Ga.vc(8.5, true) - 1) < 0.08); }

  console.log('\n── 6 · Telo e N corpi ──');
  { const Te = C.telo, c = Te.sistema(1000); Te.accelerazioni(c); const E0 = Te.energia(c); let mx = 0; for (let k = 0; k < 30000; k++) { Te.verlet(c, 0.0006); mx = Math.max(mx, Math.hypot(c[5].x - c[3].x, c[5].y - c[3].y)); }
    vero('Velocity Verlet: energia conservata (' + Math.abs((Te.energia(c) - E0) / E0).toExponential(1) + ')', Math.abs((Te.energia(c) - E0) / E0) < 1e-5);
    vero('la luna resta entro la sfera di Hill del suo pianeta (distanza massima ' + mx.toFixed(2) + ')', mx < 0.5); }
  console.log('\n── 2 · Reticolo ──');
  { const R = C.reticolo, d = R.spostamento(3, 0, 0, 1), z = R.spostamento(3, 0, 0, 0); vero('lo spostamento punta verso la massa e si annulla senza massa', d[0] < 0 && Math.abs(z[0]) < 1e-12); }

  console.log('\n── La pagina, telefono ──');
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const cx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true }), pg = await cx.newPage(), errs = [];
  pg.on('pageerror', e => errs.push(e.message.slice(0, 200)));
  await pg.addInitScript(() => { try { localStorage.setItem('bsi_guide_v3', '1'); } catch (e) {} });
  await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
  await pg.waitForFunction(() => !!(window.BSICosmo && window.BSISpectraLive && window.BSILab3D), null, { timeout: 60000 });
  const elenco = await pg.evaluate(() => BSICosmo.elenco());
  vero('simulazioni registrate: ' + elenco.join(', '), elenco.length >= 7);
  const r = await pg.evaluate(async () => {
    const pausa = ms => new Promise(r => setTimeout(r, ms)), o = { sim: [] };
    BSISpectraLive.calcolo.apriSezione('scosmo'); await pausa(800);
    const d = document.querySelector('#scosmo .bsiCO-griglia').parentNode; o.carte = document.querySelectorAll('#scosmo .bsiCO-card').length;
    for (const id of BSICosmo.elenco()) {
      d._apri(id); for (let i = 0; i < 80; i++) { if (d._cosmo && d._cosmo.pronto && d._cosmo.S) break; await pausa(200); }
      const a = d._cosmo; a.vai(3); await pausa(900);
      const luce = (() => { a.S.disegna(); const c = document.createElement('canvas'); c.width = 90; c.height = 160; const q = c.getContext('2d'); q.drawImage(a.S.ren.domElement, 0, 0, 90, 160); const d = q.getImageData(0, 0, 90, 160).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] > 120) n++; return n; })();   /* pixel luminosi: lo sfondo è nero */
      o.sim.push({ id, px: luce, hud: a.S.box.querySelector('.bsiCO-hud').textContent.length, rapp: +(a.S.ren.domElement.clientHeight / a.S.ren.domElement.clientWidth).toFixed(2), reg: !![...document.querySelectorAll('#scosmo .bsiCO-comandi button')].find(x => /Registra/.test(x.textContent)) });
    }
    o.sb = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    return o;
  });
  att('una scheda-anteprima per simulazione', elenco.length, r.carte);
  r.sim.forEach(s => vero(s.id + ': disegna (' + s.px + ' pixel luminosi su 14 400), HUD con i numeri, formato verticale (' + s.rapp + '), pulsante Registra', s.px > 100 && s.hud > 10 && s.rapp > 1.4 && s.reg));
  att('non sborda', 0, r.sb);
  att('nessun errore JavaScript', 0, errs.length); errs.slice(0, 3).forEach(e => console.log('      ! ' + e));
  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.stack || e.message); process.exit(1); });
