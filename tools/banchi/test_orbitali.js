#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   test_orbitali — 🔮 Laboratorio degli orbitali (v254): la fisica e la pagina

   PERCHE' QUESTO BANCO ESISTE
   Il progetto (§5.3) chiede orbitali «di livello alto» ma esatti. Un orbitale
   disegnato bene e calcolato male è peggio di nessuno: qui i numeri si
   confrontano con le soluzioni analitiche dell'atomo di idrogeno.
   · Normalizzazione: ∫r²R²dr = 1 e ∫|Y|²dΩ = 1 per molti (n, l, m).
   · Raggio più probabile: 1s → 1 a₀, 2p → 4 a₀, 3d → 9 a₀, 2s → 3 + √5 a₀.
   · Nodi radiali n − l − 1 nelle posizioni esatte: 2s a 2 a₀,
     3s a (9 ∓ 3√3)/2 a₀, 3p a 6 a₀.
   · ⟨r⟩ = [3n² − l(l+1)]/(2Z); E = −13,6 Z²/n² eV; scala 1/Z per gli ioni.
   · Ortogonalità ⟨1s|2s⟩ = 0 su griglia radiale.
   · Le forme reali puntano dove dicono: px positiva su +x, py su +y.
   · Sovrapposizione 1s + 2p: ν = 2,467×10¹⁵ Hz, λ = 121,5 nm (Lyman-α);
     regola di dipolo Δl = ±1.
   · H₂⁺: S(2 a₀) = 0,5865; la legante ha densità fra i nuclei, l'antilegante
     un piano nodale.
   · Isosuperficie: i tetraedri marcianti su una sfera danno vertici sulla
     sfera; la soglia al 90 % racchiude il 90 %.
   Poi la pagina a 412 e 1280 px: nella barra, quattro schede, il 3D si
   costruisce, i grafici ci sono, i numeri scritti sono quelli giusti, niente
   NaN, niente sbordi, nessun errore.

   USO   node tools/banchi/test_orbitali.js    (serve un server su :8899)
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const { chromium } = require('playwright-core');
const RADICE = path.join(__dirname, '..', '..');
const BASE = process.env.BSI_URL_BASE || 'http://127.0.0.1:8899/';
const CHROME = process.env.BSI_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
let ok = 0, ko = 0;
function att(d, atteso, avuto) { if (String(atteso) === String(avuto)) { ok++; console.log('  ✓ ' + d + '  → ' + avuto); } else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + '\n      avuto:  ' + avuto); } }
function vero(d, c) { att(d, true, !!c); }
function vicino(d, atteso, avuto, tol) { const e = Math.abs(avuto - atteso) / Math.max(1e-300, Math.abs(atteso)); if (e <= tol) { ok++; console.log('  ✓ ' + d + '  → ' + (+avuto.toPrecision(6)) + ' (atteso ' + atteso + ')'); } else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + ' ± ' + (tol * 100) + ' %\n      avuto:  ' + avuto); } }

(async () => {
  const ctx = { console, Math, Array, Object, isFinite, String, Number, Float32Array }; ctx.window = ctx; ctx.globalThis = ctx;
  ctx.BSIFisica = { t: a => a, calcolo: {}, el: () => ({}), sezione() {} }; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(RADICE, 'bsi-orbitali.js'), 'utf8'), ctx);
  const O = ctx.BSIFisica.calcolo.orbitali, PI = Math.PI;

  console.log('── Le funzioni d\'onda ──');
  const coppie = [[1, 0], [2, 0], [2, 1], [3, 0], [3, 1], [3, 2], [4, 0], [4, 3], [5, 2], [6, 5]];
  vero('∫r²R²dr = 1 per ' + coppie.length + ' coppie (n, l)', coppie.every(([n, l]) => Math.abs(O.radialeInfo(n, l, 1).norma - 1) < 1e-4));
  function normaY(l, m, re) { let s = 0; const N = 160; for (let i = 0; i < N; i++) for (let j = 0; j < 2 * N; j++) { const th = (i + 0.5) / N * PI, ph = (j + 0.5) / N * PI, A = O.angolare(l, m, re, th, ph); s += (A.re * A.re + A.im * A.im) * Math.sin(th) * (PI / N) ** 2; } return s; }
  const ang = [[0, 0, true], [1, 1, true], [1, -1, true], [2, -2, true], [2, 1, false], [3, -3, true], [3, 2, false], [4, -4, false]];
  vero('∫|Y|²dΩ = 1 per ' + ang.length + ' armoniche, reali e complesse', ang.every(([l, m, r]) => Math.abs(normaY(l, m, r) - 1) < 1e-3));
  vicino('raggio più probabile 1s (a₀)', 1, O.radialeInfo(1, 0, 1).rPiuProbabile, 3e-3);
  vicino('raggio più probabile 2p (a₀)', 4, O.radialeInfo(2, 1, 1).rPiuProbabile, 3e-3);
  vicino('raggio più probabile 3d (a₀)', 9, O.radialeInfo(3, 2, 1).rPiuProbabile, 3e-3);
  vicino('raggio più probabile 2s (a₀) = 3 + √5', 3 + Math.sqrt(5), O.radialeInfo(2, 0, 1).rPiuProbabile, 3e-3);
  vicino('nodo del 2s (a₀)', 2, O.radialeInfo(2, 0, 1).nodiRadiali[0], 3e-3);
  const n3 = O.radialeInfo(3, 0, 1).nodiRadiali;
  vero('nodi del 3s a (9 ∓ 3√3)/2 = 1,902 e 7,098 a₀', n3.length === 2 && Math.abs(n3[0] - (9 - 3 * Math.sqrt(3)) / 2) < 0.01 && Math.abs(n3[1] - (9 + 3 * Math.sqrt(3)) / 2) < 0.01);
  vicino('nodo del 3p (a₀)', 6, O.radialeInfo(3, 1, 1).nodiRadiali[0], 3e-3);
  vero('numero di nodi radiali = n − l − 1 per ogni coppia', coppie.every(([n, l]) => O.radialeInfo(n, l, 1).nodiRadiali.length === n - l - 1));
  // ⟨r⟩ numerico contro la formula
  function rMedioNum(n, l, Z) { let s = 0; const h = 0.004, M = Math.round((n * n * 6 + 30) / Z / h); for (let i = 1; i <= M; i++) { const r = i * h, R = O.radiale(n, l, Z, r); s += r * r * r * R * R * h; } return s; }
  vero('⟨r⟩ numerico = [3n² − l(l+1)]/(2Z) per 1s, 2s, 2p, 3d, 4f', [[1, 0], [2, 0], [2, 1], [3, 2], [4, 3]].every(([n, l]) => Math.abs(rMedioNum(n, l, 1) - O.rMedio(n, l, 1)) < 2e-3));
  vicino('He⁺ (Z = 2): raggio più probabile 1s dimezzato (a₀)', 0.5, O.radialeInfo(1, 0, 2).rPiuProbabile, 5e-3);
  vicino('E₁ dell\'idrogeno (eV)', -13.6057, O.energia(1, 1), 1e-4);
  vicino('E₁ di Li²⁺ = −9·13,6 (eV)', -122.451, O.energia(1, 3), 1e-4);
  let orto = 0; for (let i = 1; i <= 20000; i++) { const r = i * 0.002; orto += r * r * O.radiale(1, 0, 1, r) * O.radiale(2, 0, 1, r) * 0.002; }
  vero('⟨1s|2s⟩ = 0 (ortogonali)', Math.abs(orto) < 1e-4);
  vero('px è positiva su +x, py su +y, dxy positiva sulla bisettrice x = y', O.psi({ n: 2, l: 1, m: 1, reale: true, Z: 1 }, 1, 0, 0).re > 0 && O.psi({ n: 2, l: 1, m: -1, reale: true, Z: 1 }, 0, 1, 0).re > 0 && O.psi({ n: 3, l: 2, m: -2, reale: true, Z: 1 }, 1, 1, 0).re > 0);
  vero('dx²−y² cambia segno fra x e y, dz² è positiva sull\'asse z', O.psi({ n: 3, l: 2, m: 2, reale: true, Z: 1 }, 1, 0, 0).re > 0 && O.psi({ n: 3, l: 2, m: 2, reale: true, Z: 1 }, 0, 1, 0).re < 0 && O.psi({ n: 3, l: 2, m: 0, reale: true, Z: 1 }, 0, 0, 2).re > 0);
  const pc = O.psi({ n: 2, l: 1, m: 1, reale: false, Z: 1 }, 0, 1, 0), pr = O.psi({ n: 2, l: 1, m: 1, reale: false, Z: 1 }, 1, 0, 0);
  vero('forma complessa m = +1: la fase cresce di π/2 da +x a +y (e^(iφ))', Math.abs(Math.atan2(pc.im, pc.re) - Math.atan2(pr.im, pr.re) - PI / 2) < 1e-9 || Math.abs(Math.atan2(pc.im, pc.re) - Math.atan2(pr.im, pr.re) + 3 * PI / 2) < 1e-9);
  vero('|ψ| della forma complessa non dipende da φ (la densità è simmetrica attorno a z)', Math.abs(Math.hypot(pc.re, pc.im) - Math.hypot(pr.re, pr.im)) < 1e-12);
  att('nomi: 3dxy, 2pz, 4fxyz, 1s', '3dxy,2pz,4fxyz,1s', [O.nome({ n: 3, l: 2, m: -2, reale: true }), O.nome({ n: 2, l: 1, m: 0, reale: true }), O.nome({ n: 4, l: 3, m: -2, reale: true }), O.nome({ n: 1, l: 0, m: 0, reale: true })].join(','));

  console.log('\n── Nuvola, isosuperficie, soglia ──');
  const pts = O.campiona({ n: 1, l: 0, m: 0, reale: true, Z: 1 }, 20000, 3), rm = pts.reduce((s, p) => s + Math.hypot(p[0], p[1], p[2]), 0) / pts.length;
  vicino('la nuvola del 1s campiona ⟨r⟩ = 1,5 a₀', 1.5, rm, 0.02);
  const pz = O.campiona({ n: 2, l: 1, m: 0, reale: true, Z: 1 }, 20000, 5), cos2 = pz.reduce((s, p) => s + p[2] * p[2] / (p[0] * p[0] + p[1] * p[1] + p[2] * p[2]), 0) / pz.length;
  vicino('la nuvola del 2pz ha ⟨cos²θ⟩ = 3/5 (distribuzione cos²θ)', 0.6, cos2, 0.02);
  const tri = O.isosuperficie((x, y, z) => -(x * x + y * y + z * z), 2, 24, -1), errMax = tri.reduce((m, T) => Math.max(m, ...T.map(p => Math.abs(Math.hypot(p[0], p[1], p[2]) - 1))), 0);
  vero('tetraedri marcianti su una sfera di raggio 1: vertici sulla sfera (errore ' + errMax.toFixed(3) + ' a₀)', tri.length > 500 && errMax < 0.03);
  const v = new Float32Array([5, 4, 1, 0, 0]); att('soglia al 90 % su valori 5,4,1,0,0 (somma 10)', 4, O.soglia(v, 1, 0.9));

  console.log('\n── Sovrapposizioni e H₂⁺ ──');
  const B = O.battimento(1, 2, 1);
  vicino('1s + 2p: ν = ΔE/h (Hz)', 2.4674e15, B.nu, 1e-3);
  vicino('1s + 2p: λ della riga Lyman-α (nm)', 121.50, B.lambda, 1e-3);
  vicino('2p + 3d: λ della riga Balmer-α (nm)', 656.11, O.battimento(2, 3, 1).lambda, 1e-3);
  vero('dipolo: 1s→2p permessa, 1s→2s e 1s→3d proibite', O.permessa({ l: 0, m: 0 }, { l: 1, m: 0 }) && !O.permessa({ l: 0, m: 0 }, { l: 0, m: 0 }) && !O.permessa({ l: 0, m: 0 }, { l: 2, m: 0 }));
  vicino('H₂⁺: S(2 a₀) = e^(−2)(1 + 2 + 4/3)', 0.58645, O.sovrapposizione(2), 1e-4);
  vero('S(0) = 1 e S decresce con R', Math.abs(O.sovrapposizione(0) - 1) < 1e-12 && O.sovrapposizione(3) < O.sovrapposizione(2));
  vero('σg ha densità a metà fra i nuclei, σu* vi ha un piano nodale', O.h2piu(2, true, 0, 0, 0) > 0.2 && Math.abs(O.h2piu(2, false, 0, 0, 0)) < 1e-12);
  let ng = 0, nu = 0; const H = 0.1; for (let x = -7; x <= 7; x += H) for (let y = -7; y <= 7; y += H) for (let z = -8; z <= 8; z += H) { const g = O.h2piu(2, true, x, y, z), u = O.h2piu(2, false, x, y, z); ng += g * g; nu += u * u; }
  vero('σg e σu* sono normalizzate (∫|σ|² = ' + (ng * H ** 3).toFixed(3) + ', ' + (nu * H ** 3).toFixed(3) + ')', Math.abs(ng * H ** 3 - 1) < 0.02 && Math.abs(nu * H ** 3 - 1) < 0.02);

  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  for (const [nome, opz] of [['telefono', { viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true }], ['schermo grande', { viewport: { width: 1280, height: 860 } }]]) {
    console.log('\n── La pagina, ' + nome + ' ──');
    const cx = await b.newContext(Object.assign({ serviceWorkers: 'block' }, opz)), pg = await cx.newPage(), errs = [];
    pg.on('pageerror', e => errs.push(e.message.slice(0, 200)));
    await pg.addInitScript(() => { try { localStorage.setItem('bsi_guide_v3', '1'); } catch (e) {} });
    await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
    await pg.waitForFunction(() => !!(window.BSISpectraLive && window.BSIFisica && BSIFisica.calcolo.orbitali), null, { timeout: 60000 });
    const r = await pg.evaluate(async () => {
      const pausa = ms => new Promise(r => setTimeout(r, ms)), o = { tele: [], sb: 0, strano: null };
      const x = BSISpectraLive.calcolo.apriSezione('sorbitali'); await pausa(700); o.aperta = x && x.id; o.nav = !!document.querySelector('.nav-btn[data-s="sorbitali"]');
      const el = document.getElementById('sorbitali'), schede = [...el.querySelectorAll('.bsiFX-schede button')]; o.schede = schede.length;
      const vis = () => [...el.querySelectorAll('select')].filter(x => x.offsetParent !== null);
      const testi = [];
      for (const bt of schede) {
        bt.click();
        for (let i = 0; i < 60 && /Caricamento del motore 3D/.test(el.innerText); i++) await pausa(250);
        await pausa(900);
        o.tele.push([...el.querySelectorAll('canvas')].filter(c => c.offsetParent !== null && c.width > 100 && c.height > 60).length);
        o.sb = Math.max(o.sb, document.documentElement.scrollWidth - document.documentElement.clientWidth);
        o.strano = o.strano || (el.innerText.match(/.{0,20}(\bNaN\b|\bundefined\b|Infinity).{0,20}/) || [null])[0];
        testi.push(el.innerText);
      }
      o.t3d = /3dz²/.test(testi[1]) && /isosuperficie al 90 %/.test(testi[1]) && /−1,512 eV/.test(testi[1]) && /2 angolari/.test(testi[1]);
      o.graf = /Normalizzazione numerica ∫P\(r\)dr = 1,0000/.test(testi[2]);
      o.sovr = /2,467×10¹⁵ Hz/.test(testi[3]) && /121,5 nm/.test(testi[3]) && /Lyman-α/.test(testi[3]) && /permessa/.test(testi[3]);
      o.h2 = /S = 0,5865/.test(testi[4]);
      /* la scheda 3D: si cambia orbitale e si passa alla forma complessa */
      schede[1].click(); await pausa(300);
      const s = vis(); s[2].value = '-2'; s[2].dispatchEvent(new Event('change')); await pausa(600); o.dxy = /3dxy/.test(el.innerText);
      s[3].value = 'c'; s[3].dispatchEvent(new Event('change')); await pausa(600); s[2] = vis()[2]; vis()[2].value = '1'; vis()[2].dispatchEvent(new Event('change')); await pausa(600);
      o.complessa = /colore è la fase/.test(el.innerText) && /m = \+1/.test(el.innerText);
      s[0].value = '1'; s[0].dispatchEvent(new Event('change')); await pausa(600); o.uno = /1s/.test(el.innerText) && /−13,606 eV/.test(el.innerText);
      o.didasc = (el.querySelector('.bsiL3-didascalia, [class*="didascalia"]') || {}).textContent || '';
      o.strano = o.strano || (el.innerText.match(/.{0,20}(\bNaN\b|\bundefined\b).{0,20}/) || [null])[0];
      return o;
    });
    vero(nome + ' · nella barra, si apre, 4 schede, le tele ci sono (' + r.tele.join(',') + ')', r.nav && r.aperta === 'sorbitali' && r.schede === 5 && r.tele.every(n => n >= 1));
    att(nome + ' · non sborda e non mostra valori mancanti', '0 null', r.sb + ' ' + r.strano);
    vero(nome + ' · 3D: 3dz², E = −1,512 eV, 2 nodi angolari, isosuperficie al 90 %', r.t3d);
    vero(nome + ' · grafici: la normalizzazione numerica è 1', r.graf);
    vero(nome + ' · sovrapposizione 1s + 2p: 2,467×10¹⁵ Hz, 121,5 nm, Lyman-α, permessa', r.sovr);
    vero(nome + ' · H₂⁺: S = 0,5865', r.h2);
    vero(nome + ' · si cambia orbitale (3dxy), si passa alla forma complessa (m = +1, fase come colore), poi a 1s', r.dxy && r.complessa && r.uno);
    att(nome + ' · nessun errore JavaScript', 0, errs.length); errs.slice(0, 3).forEach(e => console.log('      ! ' + e));
    await cx.close();
  }
  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
