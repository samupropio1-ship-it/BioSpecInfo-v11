#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════════
   test_spectra_ponte — il ponte WebSocket con Spectra Prime e le scene fisiche 3D (v257)

   PERCHE' QUESTO BANCO ESISTE
   Spectra Prime (spectra_core/, server FastAPI + LangGraph) comanda la scena 3D
   di BioSpecInfo via WebSocket. Il server vero non gira nella batteria (vuole
   Python, LangGraph e una chiave): qui un server finto, dentro Playwright,
   parla lo stesso protocollo — TELEMETRY_UPDATE, USER_MESSAGE, CONFIRM in
   arrivo; SPECTRA_3D_BRIDGE, SPECTRA_EMBODIMENT, SPECTRA_RESPONSE in uscita —
   e si pretende che i comandi cambino DAVVERO la scena (sezione aperta,
   scheda, cursori, caselle, camera), che la telemetria lo riporti, che gli
   indirizzi non sicuri siano rifiutati, che un'azione sconosciuta o una scena
   inesistente non facciano nulla, che il ponte si ricolleghi da solo e smetta
   quando lo si scollega. Il grafo dei sette agenti ha i suoi test in Python:
   spectra_core/tests (10 test, con modelli finti).
   Poi la fisica delle tre scene nuove: Morse (energia conservata nel moto
   esatto, D₀ contro la misura, punti di inversione), la nuvola di H₂, il
   dipolo (L = 1/cos²λ), Shue, la calotta polare che si allarga con B_z verso
   sud, Kelvin che soddisfa l'equazione di Navier.

   USO   node tools/banchi/test_spectra_ponte.js    (serve un server su :8899)
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
  const ctx = { console, Math, Array, Object, isFinite, String, Number, JSON, Float32Array }; ctx.window = ctx; ctx.globalThis = ctx;
  ctx.BSIFisica = { t: a => a, tt: a => a[0], calcolo: {}, el: () => ({}), sezione() {} }; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(RADICE, 'bsi-fis-scene3d.js'), 'utf8'), ctx);
  const S = ctx.BSIFisica.calcolo.scene3d, M = S.morse();

  console.log('── H₂ e la curva di Morse ──');
  att('a = 2πcω_e √(μ/2D_e) = 1,944 Å⁻¹', '1.944', M.a.toFixed(3));
  att('D₀ = D_e − E₀ = 4,478 eV (misurato 4,4781)', '4.478', M.D0.toFixed(3));
  att('periodo di vibrazione armonico 7,58 fs', '7.58', (M.periodo * 1e15).toFixed(2));
  const mu = 0.503912 * 1.66053906660e-27; let peggio = 0;
  [0, 4, 9, 14].forEach(v => { const Ev = M.livelli[v], T = M.periodoDi(Ev); for (let k = 1; k < 100; k++) { const tt = k * T / 100, h = T * 1e-6, r = M.r(Ev, tt), rd = (M.r(Ev, tt + h) - M.r(Ev, tt - h)) / (2 * h) * 1e-10; peggio = Math.max(peggio, Math.abs(0.5 * mu * rd * rd / 1.602176634e-19 + M.V(r) + M.De - Ev) / Ev); } });
  vero('moto esatto nel potenziale di Morse: energia conservata (scarto relativo ' + peggio.toExponential(1) + ')', peggio < 1e-7);
  vero('il moto va da un punto di inversione all\'altro in mezzo periodo', [0, 7, 15].every(v => { const Ev = M.livelli[v], tp = M.inversione(Ev); return Math.abs(M.r(Ev, 0) - tp[0]) < 1e-9 && Math.abs(M.r(Ev, M.periodoDi(Ev) / 2) - tp[1]) < 1e-9; }));
  vero('livelli sempre più fitti verso la dissociazione', M.livelli.every((e, i) => i < 2 || (e - M.livelli[i - 1]) < (M.livelli[i - 1] - M.livelli[i - 2])));
  { let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647, nu = S.nuvolaH2(0.74144, 30000, 1.197, rnd), n = nu.length / 3; let fra = 0; for (let i = 0; i < n; i++) if (Math.abs(nu[3 * i]) < 0.37072) fra++;
    vero('nuvola σg: 30 000 punti, più densità fra i nuclei che fuori a pari distanza (' + (fra / n * 100).toFixed(0) + ' % con |x| < r_e/2)', n === 30000 && fra / n > 0.3); }

  console.log('\n── Magnetosfera e aurore ──');
  { const tr = S.traccia(S.piede(60 * Math.PI / 180, 0, true), -1, 0, null, 80, 6000); let rmax = 0; tr.punti.forEach(p => rmax = Math.max(rmax, Math.hypot(...p)));
    vero('dipolo puro: la linea da 60° si chiude e arriva a L = 1,01/cos²λ = 4,04 R_T (' + rmax.toFixed(3) + ')', tr.esito === 'chiusa' && Math.abs(rmax - 4.04) < 0.01); }
  const Pd = S.pressione(5, 400), sh = S.shue(-5, Pd);
  att('P_d per n = 5 cm⁻³, v = 400 km/s: 1,34 nPa', '1.34', Pd.toFixed(2));
  att('Shue 1998: r₀ = 10,42 R_T, α = 0,619', '10.42 0.619', sh.r0.toFixed(2) + ' ' + sh.alfa.toFixed(3));
  vero('Chapman e Ferraro (f = 2) danno lo stesso ordine: ' + S.chapmanFerraro(5, 400).toFixed(2) + ' R_T', Math.abs(S.chapmanFerraro(5, 400) - sh.r0) < 1.5);
  vero('più pressione, magnetopausa più vicina (r₀ ∝ P_d^(−1/6,6))', S.shue(-5, S.pressione(20, 700)).r0 < sh.r0 * 0.75);
  const sud = S.confineCalotta(0, -10, true) * 180 / Math.PI, nord = S.confineCalotta(0, 5, true) * 180 / Math.PI, medio = S.confineCalotta(0, -5, true) * 180 / Math.PI;
  vero('B_z verso sud allarga la calotta e abbassa l\'ovale: ' + sud.toFixed(1) + '° (−10 nT) < ' + medio.toFixed(1) + '° (−5) < ' + nord.toFixed(1) + '° (+5)', sud < medio && medio < nord && medio > 65 && medio < 80);

  console.log('\n── Il reticolo di Kelvin ──');
  { const e = [0, 0, -1], nu = 0.3, lam = 2 * nu / (1 - 2 * nu); let res = 0, dv = 0, sc = 0;
    for (const p of [[0.3, 0.2, 0.5], [-0.4, 0.6, -0.2], [0.7, -0.3, 0.1], [0.1, 0.1, -0.8]]) { const h = 1e-3, u = (x, y, z) => S.kelvin(x, y, z, e, nu, 0), lap = [0, 0, 0], gd = [0, 0, 0];
      const div = (x, y, z) => { let s = 0; for (let k = 0; k < 3; k++) { const a = [x, y, z], b = [x, y, z]; a[k] += h; b[k] -= h; s += (u(...a)[k] - u(...b)[k]) / (2 * h); } return s; };
      for (let k = 0; k < 3; k++) { const a = [...p], b = [...p]; a[k] += h; b[k] -= h; const ua = u(...a), ub = u(...b), u0 = u(...p); for (let j = 0; j < 3; j++) lap[j] += (ua[j] - 2 * u0[j] + ub[j]) / (h * h); gd[k] = (div(...a) - div(...b)) / (2 * h); }
      sc = Math.max(sc, ...lap.map(Math.abs)); res = Math.max(res, ...[0, 1, 2].map(j => Math.abs(lap[j] + (lam + 1) * gd[j]))); dv = Math.max(dv, Math.abs(div(...p) - S.dilatazione(...p, e, nu, 0))); }
    vero('Kelvin soddisfa Navier μ∇²u + (λ + μ)∇(∇·u) = 0 (residuo relativo ' + (res / sc).toExponential(1) + ')', res / sc < 1e-3);
    vero('la dilatazione è quella della formula chiusa (scarto ' + dv.toExponential(1) + ')', dv < 1e-5);
    vero('con ν = 0,5 il materiale è incomprimibile: dilatazione nulla', Math.abs(S.dilatazione(0.3, 0.2, 0.5, e, 0.5, 0)) < 1e-15); }

  console.log('\n── Il ponte con Spectra Prime ──');
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const cx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 860 } }), errs = [], ricevuti = [];
  let connessioni = 0, server = null;
  await cx.routeWebSocket(/wss:\/\/prime\.example\/ws\/spectra\/.*/, ws => {
    connessioni++; server = ws;
    ws.onMessage(m => {
      const d = JSON.parse(m); ricevuti.push(d);
      if (d.type === 'USER_MESSAGE') {
        const manda = o => ws.send(JSON.stringify(o));
        manda({ channel: 'SPECTRA_3D_BRIDGE', payload: { action: 'load', sceneType: 'magnetosfera', params: { 'Velocità del vento solare': 800 } } });
        setTimeout(() => manda({ channel: 'SPECTRA_3D_BRIDGE', payload: { action: 'update', params: { 'B_z': -12, 'inesistente': 3 } } }), 3500);
        setTimeout(() => manda({ channel: 'SPECTRA_3D_BRIDGE', payload: { action: 'toggle_layer', layerName: 'Onda d\'urto', visible: false } }), 5500);
        setTimeout(() => manda({ channel: 'SPECTRA_3D_BRIDGE', payload: { action: 'focus', pos: [0, -40, 10], target: [0, 0, 0] } }), 6000);
        setTimeout(() => manda({ channel: 'SPECTRA_3D_BRIDGE', payload: { action: 'rm_rf' } }), 6200);
        setTimeout(() => { manda({ channel: 'SPECTRA_EMBODIMENT', payload: { expression: 'analytical' } }); manda({ channel: 'SPECTRA_RESPONSE', content: 'Ecco la magnetosfera con il vento a 800 km/s.', verdict: 'approved', actions: [] }); }, 6500);
      }
    });
  });
  const pg = await cx.newPage(); pg.on('pageerror', e => errs.push(e.message.slice(0, 200)));
  await pg.addInitScript(() => { try { localStorage.setItem('bsi_guide_v3', '1'); localStorage.removeItem('bsi-spectra-prime-url'); } catch (e) {} });
  await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
  await pg.waitForFunction(() => !!(window.BSISpectraLive && window.BSISpectraPonte && window.BSIMotore3D && BSIFisica.calcolo.scene3d), null, { timeout: 60000 });
  const v = await pg.evaluate(() => { const P = BSISpectraPonte; return [P.urlValido('ws://sito.example/ws'), P.urlValido('https://x.example'), P.urlValido('wss://prime.example/ws/spectra'), P.urlValido('ws://localhost:8000/ws/spectra'), P.connetti('ws://sito.example/ws'), P.stato().stato].join(' '); });
  att('indirizzi: ws:// esterno no, https no, wss sì, ws://localhost sì; un indirizzo non ammesso non collega', 'false false true true false spento', v);
  const r1 = await pg.evaluate(async () => {
    const pausa = ms => new Promise(r => setTimeout(r, ms)), o = { risposte: [], corpo: [] };
    document.addEventListener('bsi-spectra-risposta', e => o.risposte.push(e.detail));
    document.addEventListener('bsi-spectra-embodiment', e => o.corpo.push(e.detail));
    BSISpectraPonte.connetti('wss://prime.example/ws/spectra', { utente: 'samu' }); await pausa(800);
    o.stato = BSISpectraPonte.stato().stato; o.sessione = BSISpectraPonte.stato().sessione;
    o.inviato = BSISpectraPonte.invia('Mostrami la magnetosfera durante una tempesta');
    await pausa(8500);
    const el = document.getElementById('sfisscene'); o.aperta = el && el.classList.contains('on');
    const tel = BSIMotore3D.getSimulationTelemetry(); o.tel = tel;
    const sl = n => (tel.cursori.find(c => c.nome.indexOf(n) >= 0) || {}).valore;
    o.vel = sl('Velocità del vento'); o.bz = sl('B_z'); o.urto = (tel.caselle.find(c => /Onda d/.test(c.nome)) || {}).attiva;
    o.r = tel.scena && tel.scena.camera.r;
    o.registro = BSISpectraPonte.stato().registro.filter(x => x.tipo === 'eseguito').map(x => x.x && (x.x.ok === false ? 'no:' + x.x.errore : 'ok'));
    o.scenaFalsa = await BSIMotore3D.loadSimulation('cucina', {}); o.sezFalsa = await BSIMotore3D.loadSimulation('sinesistente', {});
    return o;
  });
  vero('collegato al server finto, sessione persistente (' + r1.sessione + ')', r1.stato === 'collegato' && /^bsi-/.test(r1.sessione) && r1.inviato);
  const tel0 = ricevuti.find(d => d.type === 'TELEMETRY_UPDATE');
  vero('la telemetria arriva al server con la sezione aperta e i cursori', tel0 && typeof tel0.payload.sezione === 'string' && Array.isArray(tel0.payload.cursori) && tel0.user_id === 'samu');
  att('il messaggio dell\'utente arriva come USER_MESSAGE', 'Mostrami la magnetosfera durante una tempesta', (ricevuti.find(d => d.type === 'USER_MESSAGE') || {}).content);
  vero('«load magnetosfera» apre la sezione delle scene e la scheda giusta', r1.aperta && /Magnetosfera/.test(r1.tel.scheda || '') || (r1.aperta && /Magnetosfera/.test((r1.tel.scena || {}).didascalia || '')));
  att('il parametro del load muove il cursore della velocità', 800, r1.vel);
  att('«update B_z = −12» muove il cursore del campo', -12, r1.bz);
  att('«toggle_layer Onda d\'urto» spegne la casella', false, r1.urto);
  vero('«focus» porta la camera a |pos − target| = 41,2 (' + (r1.r || 0).toFixed(2) + ')', Math.abs(r1.r - Math.hypot(40, 10)) < 0.01);
  vero('un\'azione sconosciuta non fa nulla: ' + r1.registro.join(', '), r1.registro.length === 5 && /azione non ammessa/.test(r1.registro[4]));
  vero('scene o sezioni inesistenti rifiutate', r1.scenaFalsa.ok === false && r1.sezFalsa.ok === false);
  vero('direttiva al corpo e risposta arrivano come eventi', r1.corpo.length === 1 && r1.corpo[0].expression === 'analytical' && r1.risposte.some(x => x.channel === 'SPECTRA_RESPONSE' && /800 km\/s/.test(x.content)));
  const telDopo = ricevuti.filter(d => d.type === 'TELEMETRY_UPDATE').pop();
  vero('la telemetria dopo i comandi riporta la scena nuova', telDopo && telDopo.payload.sezione === 'sfisscene' && telDopo.payload.cursori.some(c => /B_z/.test(c.nome) && c.valore === -12));
  vero('la telemetria si manda solo quando cambia (' + ricevuti.filter(d => d.type === 'TELEMETRY_UPDATE').length + ' invii in ~9 s, non 18)', ricevuti.filter(d => d.type === 'TELEMETRY_UPDATE').length < 16);
  /* il server cade: il ponte si ricollega da solo */
  server.close(); await pg.waitForTimeout(2600);
  att('il server cade: il ponte si ricollega da solo', 2, connessioni);
  const r2 = await pg.evaluate(async () => { BSISpectraPonte.disconnetti(); await new Promise(r => setTimeout(r, 2500)); return BSISpectraPonte.stato().stato; });
  att('scollegato a mano resta spento', 'spento', r2);
  att('e non si ricollega', 2, connessioni);
  const r3 = await pg.evaluate(async () => { BSISpectraRisveglio.apriGuida(); await new Promise(r => setTimeout(r, 300)); const b2 = document.querySelector('#bsiRD .bsiSP-box'); const o = { box: !!b2, url: b2 && b2.querySelector('input[type=url]').value }; BSISpectraRisveglio.chiudiGuida(); return o; });
  vero('la guida «Occhiali e dispositivi» ha il riquadro Spectra Prime con l\'indirizzo ricordato', r3.box && r3.url === 'wss://prime.example/ws/spectra');
  att('nessun errore JavaScript', 0, errs.length); errs.slice(0, 3).forEach(e => console.log('      ! ' + e));

  console.log('\n── Le scene sul telefono ──');
  const cxT = await b.newContext({ serviceWorkers: 'block', viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' }), pgT = await cxT.newPage(), errT = [];
  pgT.on('pageerror', e => errT.push(e.message.slice(0, 200)));
  await pgT.addInitScript(() => { try { localStorage.setItem('bsi_guide_v3', '1'); } catch (e) {} });
  await pgT.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
  await pgT.waitForFunction(() => !!(window.BSISpectraLive && BSIFisica.calcolo.scene3d && window.BSILab3D), null, { timeout: 60000 });
  const rt = await pgT.evaluate(async () => {
    const pausa = ms => new Promise(r => setTimeout(r, ms)), o = { schede: [] };
    BSISpectraLive.calcolo.apriSezione('sfisscene'); await pausa(500);
    const el = document.getElementById('sfisscene'), bt = [...el.querySelectorAll('.bsiFX-schede button')];
    for (const b of bt) { b.click(); await pausa(3000); const S = BSILab3D.scene().filter(s => s.box.offsetParent && el.contains(s.box))[0]; o.schede.push({ nome: b.textContent.trim(), px: S ? S.campiona() : 0, ar: !!(S && S.box.querySelector('.bsiAR-tasto')), dida: S ? S.didascalia.textContent : '' }); }
    o.sb = document.documentElement.scrollWidth - document.documentElement.clientWidth; o.strano = (el.innerText.match(/.{0,20}(\bNaN\b|\bundefined\b|Infinity).{0,20}/) || [null])[0];
    return o;
  });
  rt.schede.forEach(s => vero('telefono · «' + s.nome + '»: disegnata (' + s.px + ' campioni), pulsante AR, didascalia onesta', s.px > 200 && s.ar && /MODELLO|MISURATO|Kelvin/.test(s.dida)));
  att('telefono · tre schede', 3, rt.schede.length);
  att('telefono · non sborda e non mostra valori mancanti', '0 null', rt.sb + ' ' + rt.strano);
  att('telefono · nessun errore JavaScript', 0, errT.length); errT.slice(0, 3).forEach(e => console.log('      ! ' + e));
  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.stack || e.message); process.exit(1); });
