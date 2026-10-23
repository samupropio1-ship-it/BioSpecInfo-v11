#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   test_grafica3d — grafici animati, viste molecolari e Laboratorio 3D

   PERCHE' QUESTO BANCO ESISTE

   Una figura sbagliata insegna una cosa sbagliata con piu' autorita' di un
   numero sbagliato. Qui si controlla che cio' che si vede sia giusto, non
   solo che si veda:

   · ORBITALI: i polinomi di Laguerre e di Legendre contro le forme chiuse;
     i nodi dove la teoria li mette (2s a r = 2a₀, 3s a (9 ± 3√3)/2 a₀,
     2p_z sul piano xy, 3d_z² sul cono cos²θ = 1/3); la nuvola campionata ha
     il raggio medio esatto ⟨r⟩ = (3n² − l(l+1))/(2Z) a₀ e scala con 1/Z;
   · MOTI: l'equazione di Keplero risolta, l'attrattore di Lorenz che sotto
     soglia cade nel punto fisso (√(β(ρ−1)), √(β(ρ−1)), ρ−1) e sopra separa due
     traiettorie vicine;
   · CRISTALLI: il contenuto delle celle (NaCl 4:4, CsCl 1:1, CaF₂ 4:8,
     SrTiO₃ 1:1:3), le frazioni di impacchettamento rifatte dalla geometria
     delle sfere a contatto, i piani di Miller (100), (110), (111) con la
     loro area, il picco (200) di NaCl a 2θ ≈ 31,7° con Cu Kα;
   · CAMPI: il campo del dipolo contro la somma esatta, la legge di Gauss
     (flusso su una sfera = 4π·carica interna), il campo della spira al
     centro e sull'asse, una linea che parte dalla carica + e arriva alla −;
   · SUPERFICI: le curve di livello di x² + y² sono cerchi;

   e nel browser:

   · ogni scheda del Laboratorio 3D disegna, ha un nome accessibile, risponde
     al trascinamento e alla rotellina, non sborda a 390 px;
   · i grafici di tutte le sezioni: entrano con l'animazione, quando i dati
     cambiano SCIVOLANO e alla fine l'immagine e' IDENTICA a quella disegnata
     senza animazione (sovrapposizioni dei moduli comprese); il mirino
     compare e, uscendo, il grafico torna com'era; chi chiede meno movimento
     non vede animazioni;
   · i visori 3Dmol ricevono la barra dei comandi e la qualita', e il resto
     della libreria continua a funzionare.

   USO   node tools/banchi/test_grafica3d.js    (serve un server su :8899)
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';

const path = require('path');
const fs = require('fs');
const vm = require('vm');
const { chromium } = require('playwright-core');

const RADICE = path.join(__dirname, '..', '..');
const BASE = process.env.BSI_URL_BASE || 'http://127.0.0.1:8899/';
const CHROME = process.env.BSI_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const MINIMO = 90;

let ok = 0, ko = 0, eseguiti = 0;
function att(d, atteso, avuto) {
  eseguiti++;
  if (String(atteso) === String(avuto)) { ok++; console.log('  ✓ ' + d + '  → ' + avuto); }
  else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + '\n      avuto:  ' + avuto); }
}
function vicino(d, atteso, avuto, tol) {
  eseguiti++;
  if (Math.abs(avuto - atteso) <= tol) { ok++; console.log('  ✓ ' + d + '  → ' + (+(+avuto).toPrecision(8)) + ' (atteso ' + (+(+atteso).toPrecision(8)) + ' ± ' + tol + ')'); }
  else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + ' ± ' + tol + '\n      avuto:  ' + avuto); }
}
function vero(d, c) { att(d, true, !!c); }

function carica() {
  const ctx = { console, Math, Float64Array, Float32Array, Int8Array, Int32Array, Uint8Array, Date, Number, Array, Object, String, JSON, isFinite, Infinity, NaN, BigInt, setTimeout, clearTimeout, RegExp, Promise };
  ctx.window = ctx; ctx.globalThis = ctx;
  ctx.document = { getElementById: () => null, head: { appendChild() {} }, createElement: () => ({ style: {} }), querySelector: () => null, querySelectorAll: () => [] };
  ctx.addEventListener = () => {};
  vm.createContext(ctx);
  ['bsi-fisica-comune.js', 'bsi-mat-cas.js', 'bsi-mat-multi.js', 'bsi-lab3d.js'].forEach(f => vm.runInContext(fs.readFileSync(path.join(RADICE, f), 'utf8'), ctx, { filename: f }));
  return ctx;
}

(async () => {
  const W = carica(), L = W.BSIFisica.calcolo.lab3d;

  console.log('── Orbitali: funzioni speciali e nodi ──');
  vicino('L₁⁽³⁾(2) = 1 + a − x = 2', 2, L.laguerre(1, 3, 2), 1e-12);
  vicino('L₂⁽¹⁾(1,7) = (x² − 6x + 6)/2', (1.7 * 1.7 - 6 * 1.7 + 6) / 2, L.laguerre(2, 1, 1.7), 1e-12);
  vicino('L₃⁽⁰⁾(0,8) = (−x³ + 9x² − 18x + 6)/6', (-(0.8 ** 3) + 9 * 0.64 - 18 * 0.8 + 6) / 6, L.laguerre(3, 0, 0.8), 1e-12);
  vicino('P₂⁰(0,3) = (3x² − 1)/2', (3 * 0.09 - 1) / 2, L.legendre(2, 0, 0.3), 1e-12);
  vicino('P₂¹(0,3) = 3x√(1 − x²)', 0.9 * Math.sqrt(0.91), L.legendre(2, 1, 0.3), 1e-12);
  vicino('P₃²(0,4) = 15x(1 − x²)', 15 * 0.4 * 0.84, L.legendre(3, 2, 0.4), 1e-12);
  vicino('nodo radiale del 2s a r = 2a₀', 0, L.psi(2, 0, 0, 1, 2, 0, 0), 1e-12);
  vicino('nodi del 3s a r = (9 − 3√3)/2 a₀', 0, L.psi(3, 0, 0, 1, (9 - 3 * Math.sqrt(3)) / 2, 0, 0), 1e-12);
  vicino('nodi del 3s a r = (9 + 3√3)/2 a₀', 0, L.psi(3, 0, 0, 1, (9 + 3 * Math.sqrt(3)) / 2, 0, 0), 1e-12);
  vicino('2p_z si annulla sul piano xy', 0, L.psi(2, 1, 0, 1, 1.3, -0.7, 0), 1e-12);
  vicino('3d_z² si annulla sul cono cos²θ = 1/3', 0, L.psi(3, 2, 0, 1, Math.sqrt(2), 0, 1), 1e-12);
  vicino('2p_x si annulla sul piano yz', 0, L.psi(2, 1, 1, 1, 0, 0.8, 1.1), 1e-12);
  vicino('3d_xy si annulla sul piano xz', 0, L.psi(3, 2, -2, 1, 1.2, 0, 0.4), 1e-12);
  vero('2p_z cambia segno attraversando il piano xy', L.psi(2, 1, 0, 1, 0, 0, 1) * L.psi(2, 1, 0, 1, 0, 0, -1) < 0);
  console.log('\n── Orbitali: la nuvola campionata ha il raggio medio esatto ⟨r⟩ = (3n² − l(l+1))/(2Z) ──');
  const media = c => { let s = 0; for (let i = 0; i < c.n; i++) s += Math.hypot(c.p[3 * i], c.p[3 * i + 1], c.p[3 * i + 2]); return s / c.n; };
  for (const [n, l, m, Z] of [[1, 0, 0, 1], [2, 0, 0, 1], [2, 1, 0, 1], [3, 2, 0, 1], [3, 1, 1, 1], [4, 3, 0, 1], [1, 0, 0, 2], [2, 1, -1, 3]]) {
    const c = L.campionaOrbitale(n, l, m, Z, 40000, 777), atteso = (3 * n * n - l * (l + 1)) / (2 * Z);
    vicino('⟨r⟩ di n=' + n + ' l=' + l + ' m=' + m + ' Z=' + Z + ' = ' + atteso + ' a₀', atteso, media(c), atteso * 0.02);
  }
  const s1 = L.campionaOrbitale(1, 0, 0, 1, 5000, 3); let pos = 0; for (let i = 0; i < s1.n; i++) if (s1.segno[i] > 0) pos++;
  att('1s: la funzione d\'onda ha un solo segno', s1.n, pos);
  const pz = L.campionaOrbitale(2, 1, 0, 1, 20000, 5); pos = 0; for (let i = 0; i < pz.n; i++) if (pz.segno[i] > 0) pos++;
  vicino('2p_z: metà dei punti positivi, metà negativi', 0.5, pos / pz.n, 0.02);
  const dz = L.campionaOrbitale(3, 2, 0, 1, 30000, 9); pos = 0; for (let i = 0; i < dz.n; i++) if (dz.segno[i] > 0) pos++;
  /* ∫|Y₂₀|² sui due lobi (|cosθ| > 1/√3) = 0,5·(1 − ∫ dentro l'anello): si calcola qui per quadratura */
  let lobi = 0, tot = 0; for (let k = 0; k < 20000; k++) { const u = -1 + 2 * (k + 0.5) / 20000, y = (3 * u * u - 1) ** 2; tot += y; if (Math.abs(u) > 1 / Math.sqrt(3)) lobi += y; }
  vicino('3d_z²: la frazione nei lobi (ψ > 0) è quella dell\'integrale di |Y₂₀|²', lobi / tot, pos / dz.n, 0.015);

  console.log('\n── Moti ──');
  for (const [M, e] of [[0.3, 0], [1.2, 0.5], [3, 0.9], [5.5, 0.7]]) { const E = L.kepleroE(M, e); vicino('Keplero M = E − e sin E per M = ' + M + ', e = ' + e, M, E - e * Math.sin(E), 1e-12); }
  const fermo = L.lorenz(10, 10, 8 / 3, [1, 1, 1], 20000, 0.005).pop(), fp = Math.sqrt(8 / 3 * 9);
  vicino('Lorenz ρ = 10: x → √(β(ρ−1)) = ' + fp.toFixed(4), fp, Math.abs(fermo[0]), 1e-4);
  vicino('Lorenz ρ = 10: z → ρ − 1 = 9', 9, fermo[2], 1e-4);
  const a1 = L.lorenz(10, 28, 8 / 3, [1, 1, 1], 7000, 0.005), a2 = L.lorenz(10, 28, 8 / 3, [1.001, 1, 1], 7000, 0.005);
  const d0 = Math.hypot(a1[0][0] - a2[0][0], a1[0][1] - a2[0][1], a1[0][2] - a2[0][2]), d1 = Math.hypot(a1[7000][0] - a2[7000][0], a1[7000][1] - a2[7000][1], a1[7000][2] - a2[7000][2]);
  vero('Lorenz ρ = 28: due traiettorie a 0,001 si separano più di mille volte (caos)', d1 / d0 > 1000);

  console.log('\n── Cristalli ──');
  const S = L.STRUTTURE, cont = k => { const c = L.contenuto(S[k]); return Object.keys(c).sort().map(e => e + c[e]).join(' '); };
  att('NaCl: 4 Na e 4 Cl per cella', 'Cl4 Na4', cont('nacl'));
  att('CsCl: 1 Cs e 1 Cl', 'Cl1 Cs1', cont('cscl'));
  att('CaF₂: 4 Ca e 8 F', 'Ca4 F8', cont('fluorite'));
  att('SrTiO₃: 1 Sr, 1 Ti, 3 O', 'O3 Sr1 Ti1', cont('perovskite'));
  att('diamante: 8 atomi', 'C8', cont('diamante'));
  att('fcc 4, bcc 2, cubica semplice 1', '4 2 1', [cont('fcc'), cont('bcc'), cont('sc')].map(x => x.replace(/\D/g, '')).join(' '));
  /* frazioni rifatte dalla geometria: sfere a contatto lungo la diagonale di faccia (fcc), del corpo (bcc), lo spigolo (sc), il legame (diamante) */
  const v = r => 4 / 3 * Math.PI * r ** 3;
  vicino('fcc: 4 sfere di raggio a√2/4', 4 * v(Math.SQRT2 / 4), S.fcc.pf, 1e-12);
  vicino('bcc: 2 sfere di raggio a√3/4', 2 * v(Math.sqrt(3) / 4), S.bcc.pf, 1e-12);
  vicino('cubica semplice: 1 sfera di raggio a/2', v(0.5), S.sc.pf, 1e-12);
  vicino('diamante: 8 sfere di raggio a√3/8', 8 * v(Math.sqrt(3) / 8), S.diamante.pf, 1e-12);
  vicino('esagonale compatta = fcc (stesso impacchettamento)', S.fcc.pf, S.hcp.pf, 1e-12);
  vicino('Mg: c/a vicino all\'ideale √(8/3) = 1,633', Math.sqrt(8 / 3), S.hcp.c / S.hcp.a, 0.01);
  vicino('diamante: legame C–C = a√3/4 = 1,545 Å', S.diamante.a * Math.sqrt(3) / 4, S.diamante.legami, 0.002);
  const area = P => { let A = [0, 0, 0]; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length]; A[0] += p[1] * q[2] - p[2] * q[1]; A[1] += p[2] * q[0] - p[0] * q[2]; A[2] += p[0] * q[1] - p[1] * q[0]; } return Math.hypot(...A) / 2; };
  let P = L.pianoMiller(1, 0, 0); att('(100): quadrato di 4 vertici', 4, P.length); vicino('(100): area 1', 1, area(P), 1e-12);
  P = L.pianoMiller(1, 1, 0); att('(110): rettangolo di 4 vertici', 4, P.length); vicino('(110): area √2', Math.SQRT2, area(P), 1e-12);
  P = L.pianoMiller(1, 1, 1); att('(111): triangolo', 3, P.length); vicino('(111): area √3/2', Math.sqrt(3) / 2, area(P), 1e-12);
  P = L.pianoMiller(2, 0, 0); vero('(200): piano parallelo a (100)', P.every(p => Math.abs(p[0] - P[0][0]) < 1e-12));
  att('(000) non è un piano', 0, L.pianoMiller(0, 0, 0).length);
  const d200 = S.nacl.a / 2; vicino('NaCl (200) con Cu Kα: 2θ ≈ 31,7° (picco più intenso del salgemma)', 31.7, 2 * Math.asin(1.5406 / (2 * d200)) * 180 / Math.PI, 0.1);

  console.log('\n── Campi ──');
  const dip = [[1, -1, 0, 0], [-1, 1, 0, 0]];
  vicino('dipolo sull\'asse a x = 20: somma esatta 1/21² − 1/19²', 1 / 441 - 1 / 361, L.campoE(dip, 20, 0, 0)[0], 1e-15);
  vicino('dipolo lontano ≈ 2p/r³ (p = 2, verso −x)', -4 / 8000, L.campoE(dip, 20, 0, 0)[0], 3e-5);
  /* legge di Gauss: flusso su una sfera di raggio 3 attorno a due cariche +1 = 4π·2 */
  const gauss = (Q, R) => { const N = 20000, g = Math.PI * (3 - Math.sqrt(5)); let F = 0; for (let i = 0; i < N; i++) { const z = 1 - 2 * (i + 0.5) / N, r = Math.sqrt(1 - z * z), n = [r * Math.cos(g * i), r * Math.sin(g * i), z], E = L.campoE(Q, R * n[0], R * n[1], R * n[2]); F += (E[0] * n[0] + E[1] * n[1] + E[2] * n[2]) * 4 * Math.PI * R * R / N; } return F; };
  vicino('Gauss: due cariche +1 dentro la sfera → flusso 8π', 8 * Math.PI, gauss([[1, -1, 0, 0], [1, 1, 0, 0]], 3), 0.01);
  vicino('Gauss: dipolo dentro la sfera → flusso 0', 0, gauss(dip, 3), 0.01);
  vicino('Gauss: +2 e due −1 → flusso 0', 0, gauss([[2, 0, 0, 0], [-1, 1.5, 0, 0], [-1, -1.5, 0, 0]], 3), 0.01);
  vicino('spira R = 1,5: al centro |B| = 2π/R (unità μ₀I/4π)', 2 * Math.PI / 1.5, Math.abs(L.campoSpira(1.5, 0, 0, 0)[2]), 0.002);
  vicino('spira sull\'asse a z = 2: |B| = 2πR²/(R² + z²)^(3/2)', 2 * Math.PI * 2.25 / Math.pow(6.25, 1.5), Math.abs(L.campoSpira(1.5, 0, 0, 2)[2]), 0.001);
  vicino('spira: sull\'asse B non ha componenti trasverse', 0, Math.hypot(L.campoSpira(1.5, 0, 0, 2)[0], L.campoSpira(1.5, 0, 0, 2)[1]), 1e-9);
  const lin = L.lineaCampo((x, y, z) => L.campoE(dip, x, y, z), [-0.85, 0.05, 0], 1, p => Math.hypot(p[0] - 1, p[1], p[2]) < 0.12 || Math.hypot(...p) > 6, 2000), fineL = lin[lin.length - 1];
  vicino('una linea che parte dalla carica + arriva alla − (a x = 1)', 0, Math.hypot(fineL[0] - 1, fineL[1], fineL[2]), 0.13);

  console.log('\n── Superfici ──');
  const sup = L.superficie('x^2 + y^2', 2, 60), seg = L.curveLivello(sup.Z, 60, -2, 2, [1]);
  vero('curva di livello 1 di x² + y²: tutti i punti a distanza 1 dall\'origine (±1 %)', seg.length > 20 && seg.every(p => Math.abs(Math.hypot(p[0], p[1]) - 1) < 0.01));
  let errS = null; try { L.superficie('x + z', 2, 10); } catch (e) { errS = e.message; }
  vero('una variabile diversa da x e y viene rifiutata con un messaggio', /z/.test(errS || ''));

  /* ── nel browser ─────────────────────────────────────────────────────── */
  console.log('\n── Nel browser: Laboratorio 3D ──');
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  for (const [nome, vp] of [['schermo grande', { width: 1280, height: 900 }], ['telefono', { width: 390, height: 844 }]]) {
    const ctx = await browser.newContext({ serviceWorkers: 'block', viewport: vp });
    const pg = await ctx.newPage(), err = [];
    pg.on('pageerror', e => err.push(e.message));
    pg.on('console', m => { if (m.type() === 'error') err.push('console: ' + m.text()); });
    await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 90000 });
    await pg.waitForTimeout(5000);
    const r = await pg.evaluate(async () => {
      const g = document.getElementById('bsi-guide'); if (g) g.remove();
      const pausa = ms => new Promise(r => setTimeout(r, ms));
      document.querySelector('.nav-group-tab[data-group="7"]').click();
      const b = document.querySelector('#navGroup7 .nav-btn[data-s="slab3d"]'); if (!b) return { manca: true };
      b.click(); await pausa(800);
      const sec = document.getElementById('slab3d'), sch = sec.querySelectorAll('.bsiFX-schede button'), out = { schede: sch.length, tab: [] };
      for (let i = 0; i < sch.length; i++) {
        sch[i].click(); await pausa(2600);
        const pan = [...sec.querySelectorAll('[role=tabpanel]')].find(x => x.offsetParent), S = pan && pan._scena;
        if (!S) { out.tab.push({ i, nessunaScena: true, testo: pan ? pan.textContent.slice(0, 120) : '' }); continue; }
        const tela = S.ren.domElement, px = S.campiona();
        /* trascinamento e rotellina */
        const th0 = S.vista.th, r0 = S.vista.r, rc = tela.getBoundingClientRect(), cx = rc.left + rc.width / 2, cy = rc.top + rc.height / 2;
        tela.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 7, clientX: cx, clientY: cy, bubbles: true }));
        tela.dispatchEvent(new PointerEvent('pointermove', { pointerId: 7, clientX: cx + 60, clientY: cy, bubbles: true }));
        tela.dispatchEvent(new PointerEvent('pointerup', { pointerId: 7, clientX: cx + 60, clientY: cy, bubbles: true }));
        tela.dispatchEvent(new WheelEvent('wheel', { deltaY: 200, clientX: cx, clientY: cy, bubbles: true, cancelable: true }));
        await pausa(100);
        const bott = [...S.box.querySelectorAll('.bsi3d-barra button')];
        out.tab.push({ i, px, etichetta: tela.getAttribute('aria-label') || '', ruota: S.vista.th !== th0, zoom: S.vista.r > r0, nomi: bott.length && bott.every(x => (x.getAttribute('aria-label') || '').length > 3), info: (pan.querySelector('.bsiFX-nota:last-child') || {}).textContent || '' });
      }
      /* rotazione automatica: l'angolo avanza da solo */
      const pan = [...sec.querySelectorAll('[role=tabpanel]')].find(x => x.offsetParent), S = pan._scena, th1 = S.vista.th;
      S.box.querySelector('.bsi3d-barra button').click(); await pausa(500);
      out.autorot = S.vista.th !== th1; S.box.querySelector('.bsi3d-barra button').click();
      out.sborda = document.documentElement.scrollWidth - document.documentElement.clientWidth;
      return out;
    });
    console.log('── ' + nome + ' ──');
    if (r.manca) { att('il pulsante del Laboratorio 3D esiste', true, false); await ctx.close(); continue; }
    att('cinque schede', 5, r.schede);
    const NOMI = ['superfici', 'orbitali', 'moti', 'cristalli', 'campi'];
    r.tab.forEach(x => {
      if (x.nessunaScena) { att(NOMI[x.i] + ': la scena 3D si crea', true, false); console.log('      ' + x.testo); return; }
      vero(NOMI[x.i] + ': la scena disegna (' + x.px + ' pixel non di sfondo)', x.px > 300);
      if (nome === 'schermo grande') {
        vero(NOMI[x.i] + ': la tela ha un nome accessibile («' + x.etichetta.slice(0, 40) + '»)', x.etichetta.length > 3);
        vero(NOMI[x.i] + ': trascinando ruota, con la rotellina si allontana', x.ruota && x.zoom);
        vero(NOMI[x.i] + ': i pulsanti hanno un nome', x.nomi);
      }
    });
    if (nome === 'schermo grande') {
      vero('superfici: trovati due minimi e una sella di x⁴ + y⁴ − 4xy', /minimo[\s\S]*minimo[\s\S]*sella|sella[\s\S]*minimo[\s\S]*minimo/.test(r.tab[0].info));
      vero('cristalli: NaCl mostra Z = 4 e coordinazione 6 : 6', /Z = 4[\s\S]*6 : 6/.test(r.tab[3].info));
      vero('la rotazione automatica fa avanzare la vista', r.autorot);
    } else att('a 390 px niente sborda', 0, r.sborda);
    att('nessun errore JavaScript', 0, err.length);
    err.slice(0, 3).forEach(e => console.log('      ! ' + e.slice(0, 160)));
    await ctx.close();
  }

  console.log('\n── Nel browser: i grafici delle sezioni ──');
  {
    const ctx = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 900 } });
    const pg = await ctx.newPage(), err = [];
    pg.on('pageerror', e => err.push(e.message));
    await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 90000 });
    await pg.waitForTimeout(5000);
    const r = await pg.evaluate(async () => {
      const g = document.getElementById('bsi-guide'); if (g) g.remove();
      const pausa = ms => new Promise(r => setTimeout(r, ms)), out = {};
      document.querySelector('.nav-group-tab[data-group="7"]').click();
      document.querySelector('.nav-btn[data-s="sschrod"]').click(); await pausa(1500);
      const sec = document.getElementById('sschrod'), c = [...sec.querySelectorAll('canvas')].find(x => x.offsetParent && x._bsiG);
      out.entra = c.classList.contains('bsiFX-entra');
      const cur = [...sec.querySelectorAll('input[type=range]')].find(x => x.offsetParent), v0 = cur.value;
      const passo = (+cur.step || 1) * Math.max(1, Math.round((+cur.max - +cur.min) / (+cur.step || 1) / 8));
      cur.value = String(Math.min(+cur.max, +v0 + passo)); cur.dispatchEvent(new Event('input')); await pausa(40);
      out.scivola = !!c._bsiG.anim;
      await pausa(600);
      out.finito = !c._bsiG.anim;
      const finale = c.toDataURL();
      /* lo stesso valore di nuovo, dopo una pausa: nessuna animazione, disegno diretto del modulo */
      await pausa(300); cur.dispatchEvent(new Event('input')); await pausa(40);
      out.ridisegnoDiretto = !c._bsiG.anim;
      out.identico = c.toDataURL() === finale;
      out.ops = c._bsiG.ops.length;
      /* il mirino */
      await pausa(300);
      const prima = c.toDataURL(), rc = c.getBoundingClientRect();
      c.dispatchEvent(new PointerEvent('pointermove', { clientX: rc.left + rc.width * 0.55, clientY: rc.top + rc.height / 2, bubbles: true }));
      out.mirino = c.toDataURL() !== prima;
      c.dispatchEvent(new PointerEvent('pointerleave', { bubbles: true }));
      out.ripristino = c.toDataURL() === prima;
      /* raffica (un cursore trascinato): niente animazione, il grafico non insegue */
      for (let k = 0; k < 5; k++) { cur.value = String(+v0 + (k % 2) * passo); cur.dispatchEvent(new Event('input')); await pausa(20); }
      out.raffica = !c._bsiG.anim;
      return out;
    });
    vero('un grafico entra con l\'animazione la prima volta', r.entra);
    vero('cambiando un dato, la curva scivola dal valore vecchio al nuovo', r.scivola);
    vero('l\'animazione finisce entro 0,6 s', r.finito);
    vero('alla fine l\'immagine è identica al disegno diretto (sovrapposizioni del modulo comprese)', r.ridisegnoDiretto && r.identico);
    vero('il mirino compare sopra il grafico', r.mirino);
    vero('uscendo, il grafico torna com\'era', r.ripristino);
    vero('a raffica (cursore trascinato) si disegna subito, senza inseguire', r.raffica);
    att('nessun errore JavaScript', 0, err.length);
    await ctx.close();
  }
  {
    const ctx = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    const pg = await ctx.newPage();
    await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 90000 });
    await pg.waitForTimeout(5000);
    const r = await pg.evaluate(async () => {
      const g = document.getElementById('bsi-guide'); if (g) g.remove();
      const pausa = ms => new Promise(r => setTimeout(r, ms));
      document.querySelector('.nav-group-tab[data-group="7"]').click();
      document.querySelector('.nav-btn[data-s="sschrod"]').click(); await pausa(1500);
      const sec = document.getElementById('sschrod'), c = [...sec.querySelectorAll('canvas')].find(x => x.offsetParent && x._bsiG);
      const cur = [...sec.querySelectorAll('input[type=range]')].find(x => x.offsetParent);
      cur.value = String(+cur.max); cur.dispatchEvent(new Event('input')); await pausa(40);
      return { entra: c.classList.contains('bsiFX-entra'), anim: !!c._bsiG.anim };
    });
    vero('con «riduci movimento» nel sistema: nessuna entrata e nessuna transizione', !r.entra && !r.anim);
    await ctx.close();
  }

  console.log('\n── Nel browser: viste molecolari 3Dmol ──');
  {
    const ctx = await browser.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 900 } });
    const pg = await ctx.newPage(), err = [];
    pg.on('pageerror', e => err.push(e.message));
    pg.on('console', m => { if (m.type() === 'error') err.push('console: ' + m.text()); });
    await pg.addInitScript(() => { try { localStorage.setItem('bsi-qualita3d', 'alta'); } catch (e) {} });
    await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 90000 });
    await pg.waitForTimeout(4000);
    const r = await pg.evaluate(async () => {
      const d = document.createElement('div'); d.style.cssText = 'position:fixed;left:0;top:0;width:400px;height:300px;z-index:99999'; document.body.appendChild(d);
      const v = $3Dmol.createViewer(d, { backgroundColor: '#060d1a' });
      v.addModel('3\nacqua\nO 0 0 0\nH 0.757 0.586 0\nH -0.757 0.586 0', 'xyz'); v.setStyle({}, { stick: {}, sphere: { scale: 0.3 } }); v.zoomTo(); v.render();
      await new Promise(r => setTimeout(r, 500));
      const bott = [...d.querySelectorAll('.bsi-vm-barra button')], q = bott[4], prima = localStorage.getItem('bsi-qualita3d');
      q.click();
      return { bott: bott.length, nomi: bott.every(b => (b.getAttribute('aria-label') || '').length > 3), livello: d.dataset.bsiQualita, png: (v.pngURI() || '').length, altroApi: typeof $3Dmol.SurfaceType === 'object' && typeof $3Dmol.GLViewer === 'function', qualita: prima + '→' + localStorage.getItem('bsi-qualita3d') };
    });
    att('ogni visore riceve la barra con cinque comandi', 5, r.bott);
    vero('i comandi hanno un nome accessibile', r.nomi);
    att('la qualità scelta (alta) viene applicata', 'alta', r.livello);
    vero('il visore disegna ed esporta un PNG', r.png > 1000);
    vero('il resto della libreria 3Dmol funziona come prima', r.altroApi);
    att('il pulsante qualità passa al livello successivo', 'alta→media', r.qualita);
    att('nessun errore JavaScript', 0, err.length);
    err.slice(0, 3).forEach(e => console.log('      ! ' + e.slice(0, 160)));
    await ctx.close();
  }
  {
    const ctxE = await browser.newContext({ serviceWorkers: 'block' });
    const pgE = await ctxE.newPage();
    await pgE.addInitScript(() => { try { localStorage.setItem('bsi_lang', 'en'); localStorage.setItem('bsi-lingua', 'en'); } catch (e) {} });
    await pgE.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 90000 });
    await pgE.waitForTimeout(5000);
    const tr = await pgE.evaluate(async () => { if (window.BSILingue && window.BSILingue.imposta) window.BSILingue.imposta('en'); await new Promise(r => setTimeout(r, 1500)); return document.querySelector('.nav-btn[data-s="slab3d"]').textContent.trim(); });
    att('in inglese: «3D Laboratory»', '🧊 3D Laboratory', tr);
    await ctxE.close();
  }
  await browser.close();

  if (eseguiti < MINIMO) { ko++; console.log('\n  ✗ eseguiti solo ' + eseguiti + ' controlli: ne erano attesi almeno ' + MINIMO); }
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
