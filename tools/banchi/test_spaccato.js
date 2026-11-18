#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════════
   test_spaccato — 🌟 Spaccati stellari (v260)

   PERCHE' QUESTO BANCO ESISTE
   L'autore ha chiesto un motore che mostri una stella tagliata mentre la
   composizione cambia, «con numeri reali, non inventati». Qui si pretende:
   · ogni composizione di ogni stadio somma 100 e l'arrotondamento mostrato
     somma esattamente 100;
   · i tempi fisici crescono, le durate sono positive;
   · OGNI reazione scritta è bilanciata nel numero di massa e nella carica;
   · i numeri calcolati: durate di WHW02 riprodotte a 15 e 25 M☉, residuo
     (stella di neutroni fino a 25 M☉, buco nero sopra), catena ⁵⁶Ni → ⁵⁶Co
     → ⁵⁶Fe che conserva i nuclei, picco di luce delle Ia ~10⁴³ erg/s,
     kilonova ~10⁴² erg/s a un giorno, BBN con n/p congelato e Y ≈ 0,24,
     calore del ²⁶Al, metallicità del Sole dal modello a scatola chiusa;
   · il motore: linea del tempo, orologio, composizione in ogni istante;
   · lo strumento per Spectra è registrato e non apre nulla da solo.
   Poi la pagina, sul telefono: la sezione, ogni scenario disegna, il
   pannello ha ciambella e legenda, il finale arriva (stella di neutroni o
   buco nero secondo la massa), «riduci movimento» non fa partire nulla da
   solo, nessuna apertura automatica, nessun errore. jsdom non esegue WebGL:
   qui si usa Chromium vero (headless, contesto senza dati = «in incognito»).

   USO   node tools/banchi/test_spaccato.js    (serve un server su :8899)
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
  const ctx = { console, Math, Array, Object, isFinite, String, Number, JSON, Float32Array, Date, Promise, setTimeout, setInterval, clearInterval }; ctx.window = ctx; ctx.globalThis = ctx; ctx.BSI_AI_TOOLS = [];
  const sezioni = {};
  ctx.BSIFisica = { t: a => a, tt: a => a[0], calcolo: {}, el: () => ({}), sezione(id, d) { sezioni[id] = d; }, cursore() {} };
  vm.createContext(ctx);
  ['bsi-astro-spaccato-scenari.js', 'bsi-astro-spaccato.js'].forEach(f => vm.runInContext(fs.readFileSync(path.join(RADICE, f), 'utf8'), ctx));
  const Dd = ctx.BSISpaccatoDati, SP = ctx.BSISpaccato, AN = Dd.ANNO, GG = Dd.GIORNO;

  console.log('── I dati di ogni scenario ──');
  const sc = Dd.scenari();
  att('nove scenari', 'supernova,sole,buconero,ia,kilonova,bigbang,terra,giove,galassia', sc.map(s => s.id).join(','));
  let somme = 0, arr = 0, temp = 0, reaz = 0, sbil = [], nReaz = 0, fonti = 0;
  sc.forEach(s => {
    const tutte = [s.comp0].concat(s.stadi.map(x => x.comp));
    tutte.forEach(c => { const tot = Object.values(c).reduce((a, b) => a + b, 0); if (Math.abs(tot - 100) > 1e-6) somme++; const r = Dd.arrotonda(c); if (Object.values(r).reduce((a, b) => a + b, 0) !== 100) arr++; });
    s.stadi.forEach(x => { if (!(x.dur > 0) || !(x.anim > 0)) temp++; (x.reazioni || []).forEach(r => { nReaz++; const q = Dd.reazione(r); if (q.A[0] !== q.A[1] || q.Z[0] !== q.Z[1]) sbil.push(s.id + ': ' + r); }); });
    if (s.finale && s.finale.collasso) s.finale.collasso.reazioni.concat(s.finale.reazioniEsp || []).forEach(r => { nReaz++; const q = Dd.reazione(r); if (q.A[0] !== q.A[1] || q.Z[0] !== q.Z[1]) sbil.push(s.id + ' finale: ' + r); });
    (s.fonti || []).forEach(k => { if (!Dd.FONTI[k]) fonti++; });
  });
  att('ogni composizione (iniziale e di fine stadio) somma 100 %', 0, somme);
  att('le percentuali mostrate (resto maggiore) sommano esattamente 100', 0, arr);
  att('durate fisiche e d\'animazione positive (quindi tempi crescenti)', 0, temp);
  att(nReaz + ' reazioni, tutte bilanciate in A e in Z', '', sbil.join(' | '));
  att('ogni fonte citata esiste nell\'oggetto FONTI', 0, fonti);
  att('testo della reazione con apici e simboli', '3 ⁴He → ¹²C + γ', Dd.reazione('3 4He -> 12C + g').testo);
  { let errore = ''; try { Dd.reazione('12C + 12C -> 24Mg'); Dd.reazione('Xx -> 1H'); } catch (e) { errore = e.message; } vero('un termine sconosciuto è rifiutato («' + errore + '»)', /sconosciuto/.test(errore)); }

  console.log('\n── Supernova: Woosley, Heger & Weaver 2002 ──');
  att('a 15 M☉ le durate sono quelle della tabella', Dd.WHW[15].join(' '), Dd.durateMassa(15).map(x => +x.toPrecision(3)).join(' '));
  att('a 25 M☉ le durate sono quelle della tabella', Dd.WHW[25].join(' '), Dd.durateMassa(25).map(x => +x.toPrecision(3)).join(' '));
  { const d = Dd.durateMassa(20); vero('a 20 M☉ stanno fra le due (H ' + (d[0] / 1e6).toFixed(2) + ' milioni di anni, Si ' + (d[5] * 365.25).toFixed(1) + ' giorni)', d[0] < Dd.WHW[15][0] && d[0] > Dd.WHW[25][0] && d[5] < Dd.WHW[15][5] && d[5] > Dd.WHW[25][5]); }
  att('residuo: 12 e 25 M☉ stella di neutroni, 30 e 40 M☉ buco nero', 'ns ns bh bh', [12, 25, 30, 40].map(Dd.residuo).join(' '));
  { const s = Dd.supernova(20), Si = s.stadi[5]; vero('l\'ultimo stadio lascia il nucleo di ferro (Fe ' + Si.comp.Fe + ' %) e il silicio dura meno di un mese', Si.comp.Fe > 85 && Si.dur < 30 * GG); }
  { const s = Dd.supernova(20), ord = s.stadi.map(x => x.T); vero('la temperatura del nucleo cresce a ogni stadio (' + ord.map(x => x.toExponential(0)).join(' → ') + ' K)', ord.every((x, i) => !i || x > ord[i - 1])); }

  console.log('\n── Supernova Ia: ⁵⁶Ni → ⁵⁶Co → ⁵⁶Fe ──');
  { let peg = 0; [0, 5, 20, 80, 300, 900].forEach(gg => { const c = Dd.catena56(gg * GG, 1); peg = Math.max(peg, Math.abs(c.Ni + c.Co + c.Fe - 1)); }); vero('Bateman: i nuclei si conservano (scarto ' + peg.toExponential(1) + ')', peg < 1e-12); }
  { const l1 = Math.LN2 / Dd.IA.tNi, l2 = Math.LN2 / Dd.IA.tCo, tm = Math.log(l1 / l2) / (l1 - l2) / GG; att('il cobalto è al massimo dopo ~' + tm.toFixed(1) + ' giorni', '24.2', tm.toFixed(1)); }
  { const L = Dd.luceIa(18 * GG); vero('luce a 18 giorni ≈ 10⁴³ erg/s (' + L.toExponential(2) + ')', L > 8e42 && L < 2e43); const r = Dd.luceIa(300 * GG) / Dd.luceIa(200 * GG); att('la coda segue il ⁵⁶Co: in 100 giorni cala di e^(−100/111,4)', Math.exp(-100 / (Dd.IA.tCo / Math.LN2 / GG)).toFixed(3), r.toFixed(3)); }
  { const s = Dd.perId('ia'); att('l\'accrescimento da 1,0 a 1,38 M☉ a 10⁻⁷ M☉/anno dura 3,8 milioni di anni', '3.80', (s.stadi[0].dur / AN / 1e6).toFixed(2)); }

  console.log('\n── Kilonova, Big Bang, Terra, Galassia ──');
  { const L = Dd.luceKN(GG); vero('kilonova: ~10⁴² erg/s a un giorno (' + L.toExponential(2) + ')', L > 5e41 && L < 3e42); att('e cala come t^−1,3 da 1 a 10 giorni', Math.pow(10, -1.3).toFixed(4), (Dd.luceKN(10 * GG) / L).toFixed(4)); }
  att('BBN: frazione di neutroni al congelamento 1/(1 + e^(1,293/0,75))', '0.151', Dd.Xn(1).toFixed(3));
  att('BBN: τ_n = 878,4 s fra 1 e 200 s', (Dd.Xn(1) * Math.exp(-199 / 878.4)).toFixed(4), Dd.Xn(200).toFixed(4));
  vero('BBN: Y = 2 X_n = ' + Dd.Ymod().toFixed(3) + ', entro 0,01 dal misurato 0,245', Math.abs(Dd.Ymod() - 0.245) < 0.01);
  att('BBN: a 1 s la temperatura è ~1,3·10¹⁰ K', '1.33e+10', Dd.Tbbn(1).toExponential(2));
  { const c = Dd.compBBN(1200); vero('BBN: a 20 minuti solo H ed He, che sommano 100', Math.abs(c.H + c.He - 100) < 1e-9 && !c.n); }
  { const P0 = Dd.caloreTerra(0), P1 = Dd.caloreTerra(0.717e6); vero('Terra: calore iniziale ' + P0.toExponential(2) + ' W/kg, dimezzato (quasi tutto ²⁶Al) dopo 0,717 milioni di anni', P0 > 1e-7 && P0 < 1e-6 && Math.abs(P1 / P0 - 0.5) < 0.02); }
  { const Z = Dd.compGal(9.2).Z / 100; vero('Galassia: alla nascita del Sole Z = ' + Z.toFixed(4) + ', entro il 10 % da Z☉ = 0,0134', Math.abs(Z / 0.0134 - 1) < 0.1); att('Galassia: al Big Bang niente metalli', '0', Dd.compGal(0).Z.toFixed(0)); }

  console.log('\n── Il motore ──');
  { let cresc = 0, som = 0, fin = 0; sc.forEach(s => { const L = SP.linea(s); let prec = -1; for (let k = 0; k <= 200; k++) { const st = SP.stato(s, L, L.totale * k / 200); if (st.tFis < prec - 1e-6) cresc++; prec = st.tFis; const c = SP.composizione(s, L, st), tot = Object.values(c).reduce((a, b) => a + b, 0); if (Math.abs(tot - 100) > 1e-6) som++; } if (!SP.stato(s, L, L.totale).fin) fin++; });
    att('in ogni istante di ogni scenario il tempo fisico non torna indietro', 0, cresc); att('in ogni istante la composizione somma 100', 0, som); att('alla fine della barra si arriva all\'evento finale', 0, fin); }
  { const s = Dd.supernova(20), L = SP.linea(s), st = SP.stato(s, L, L.totale); att('orologio a fine sequenza (anni, separatore italiano)', '≈ ' + Math.round(L.fineFis / AN).toLocaleString('it-IT') + ' anni', SP.orologio(s, L, st)); }
  att('durate leggibili', '18 giorni · 0,9 s · 6,70 milioni di anni', [SP.durata(18 * GG), SP.durata(0.9), SP.durata(6.7e6 * AN)].join(' · ').replace(/ /g, ' '));
  att('notazione scientifica con apici', '3·10¹⁴', SP.sci(3e14));
  att('la sezione è registrata', 'sastrospaccato', Object.keys(sezioni).join(','));
  { const T = ctx.BSI_AI_TOOLS.find(x => x.name === 'spaccato_stellare'); vero('strumento per Spectra registrato, con i nove scenari', T && T.parameters.properties.scenario.enum.length === 9); vero('e dice di usarlo SOLO quando l\'utente lo chiede', T && /SOLO quando l'utente/.test(T.description)); }

  console.log('\n── La pagina, telefono ──');
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const cx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true }), pg = await cx.newPage(), errs = [];
  pg.on('pageerror', e => errs.push(e.message.slice(0, 200))); pg.on('console', m => { if (m.type() === 'error' && !/favicon|net::ERR/.test(m.text())) errs.push('console: ' + m.text().slice(0, 200)); });
  await pg.addInitScript(() => { try { localStorage.setItem('bsi_guide_v3', '1'); } catch (e) {} });
  await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
  await pg.waitForFunction(() => !!(window.BSISpaccato && window.BSISpectraLive && window.BSILab3D), null, { timeout: 60000 });
  await pg.waitForTimeout(2500);
  att('nessuna apertura automatica: la sezione resta chiusa senza un gesto', false, await pg.evaluate(() => document.getElementById('sastrospaccato').classList.contains('on')));
  vero('il pulsante della sezione c\'è', await pg.evaluate(() => !!document.querySelector('.nav-btn[data-s="sastrospaccato"]')));
  vero('la scheda «Una stella muore» è nelle Simulazioni cosmiche', await pg.evaluate(() => window.BSICosmo && BSICosmo.elenco().indexOf('spaccato') >= 0));
  const r = await pg.evaluate(async () => {
    const pausa = ms => new Promise(r => setTimeout(r, ms)), o = { sc: [] };
    BSISpectraLive.calcolo.apriSezione('sastrospaccato'); await pausa(900);
    const d = document.querySelector('#sastrospaccato .bsiSP-scelte').parentNode; o.scelte = document.querySelectorAll('#sastrospaccato .bsiSP-scelte button').length;
    for (const id of BSISpaccato.ELENCO.map(e => e[0])) {
      const a = d._apri(id); for (let i = 0; i < 80; i++) { if (a.pronto) break; await pausa(200); }
      a.gioca(false); a.vai(a.totale * 0.35); await pausa(500);
      const luce = (() => { a.S.disegna(); const c = document.createElement('canvas'); c.width = 90; c.height = 160; const q = c.getContext('2d'); q.drawImage(a.S.ren.domElement, 0, 0, 90, 160); const dd = q.getImageData(0, 0, 90, 160).data; let n = 0; for (let i = 0; i < dd.length; i += 4) if (dd[i] + dd[i + 1] + dd[i + 2] > 120) n++; return n; })();
      const pan = { fette: a.S.box.querySelectorAll('.bsiSP-ciambella path').length, leg: (a.S.box.querySelector('.bsiSP-leg').textContent.match(/%/g) || []).length, oro: a.S.box.querySelector('.bsiSP-dx .oro').textContent, reaz: a.S.box.querySelector('.bsiSP-reaz').textContent.length + a.S.box.querySelector('.bsiSP-hud').textContent.length };
      const somma = [...a.S.box.querySelectorAll('.bsiSP-leg b')].filter(x => /%/.test(x.textContent)).reduce((s, x) => s + parseFloat(x.textContent.replace(',', '.')), 0);
      a.vai(a.totale); await pausa(500);
      o.sc.push({ id, px: luce, pan, somma: Math.round(somma * 10) / 10, fine: a.ultimo && a.ultimo.fin, residuo: a.ultimo && a.ultimo.residuo, tela: +(a.S.ren.domElement.clientHeight / a.S.ren.domElement.clientWidth).toFixed(2) });
    }
    o.sb = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    return o;
  });
  att('nove scenari da scegliere', 9, r.scelte);
  r.sc.forEach(s => vero(s.id + ': disegna (' + s.px + ' px luminosi su 14 400), ciambella (' + s.pan.fette + ' fette) e legenda, orologio «' + s.pan.oro + '», reazioni o HUD, formato verticale (' + s.tela + ')', s.px > 150 && s.pan.fette > 0 && s.pan.leg > 0 && s.pan.oro.length > 3 && s.pan.reaz > 10 && s.tela > 1.4));
  r.sc.forEach(s => { if (s.pan.leg <= 7) vero(s.id + ': la legenda somma 100 % (' + s.somma + ')', Math.abs(s.somma - 100) < 0.6); });
  att('supernova (20 M☉): alla fine resta una stella di neutroni', 'ns', (r.sc.find(s => s.id === 'supernova') || {}).residuo);
  att('stella di 40 M☉: alla fine resta un buco nero', 'bh', (r.sc.find(s => s.id === 'buconero') || {}).residuo);
  att('il Sole: alla fine resta una nana bianca', 'wd', (r.sc.find(s => s.id === 'sole') || {}).residuo);
  vero('ogni scenario arriva in fondo', r.sc.every(s => s.fine));
  att('non sborda', 0, r.sb);
  const mm = await pg.evaluate(async () => { const d0 = document.querySelector('#sastrospaccato .bsiSP-scelte').parentNode, a0 = d0._apri('supernova'); for (let i = 0; i < 80; i++) { if (a0.pronto) break; await new Promise(r => setTimeout(r, 200)); } const s = document.querySelector('#sastrospaccato input[type=range][min="10"]'); if (!s) return 'manca'; s.value = '35'; s.dispatchEvent(new Event('input')); s.dispatchEvent(new Event('change')); await new Promise(r => setTimeout(r, 2500)); const d = document.querySelector('#sastrospaccato .bsiSP-scelte').parentNode; return document.querySelector('#sastrospaccato .bsiSP-tit') && document.querySelector('#sastrospaccato .bsiSP-tit').textContent; });
  vero('il cursore della massa a 35 M☉ passa al buco nero («' + String(mm).slice(0, 40) + '»)', /buco nero/.test(String(mm)));
  att('nessun errore JavaScript', 0, errs.length); errs.slice(0, 4).forEach(e => console.log('      ! ' + e));
  await cx.close();

  console.log('\n── «Riduci movimento» ──');
  const cr = await b.newContext({ serviceWorkers: 'block', viewport: { width: 412, height: 915 }, reducedMotion: 'reduce' }), p2 = await cr.newPage();
  await p2.addInitScript(() => { try { localStorage.setItem('bsi_guide_v3', '1'); } catch (e) {} });
  await p2.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
  await p2.waitForFunction(() => !!(window.BSISpaccato && window.BSISpectraLive), null, { timeout: 60000 });
  const rm = await p2.evaluate(async () => { const pausa = ms => new Promise(r => setTimeout(r, ms)); BSISpectraLive.calcolo.apriSezione('sastrospaccato'); await pausa(900); const a = document.querySelector('#sastrospaccato .bsiSP-scelte').parentNode._sp; for (let i = 0; i < 80; i++) { if (a.pronto) break; await pausa(200); } await pausa(1500); return { tau: a.ultimo ? a.ultimo.stadio : -1, oro: a.S.box.querySelector('.bsiSP-dx .oro').textContent, play: a.S.box.parentNode.parentNode.querySelector('.bsiSP-com button').textContent }; });
  vero('non parte da solo: resta al primo istante (' + rm.oro + '), il tasto dice ▶', rm.play === '▶' && /≈ 0 anni/.test(rm.oro));
  await cr.close(); await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.stack || e.message); process.exit(1); });
