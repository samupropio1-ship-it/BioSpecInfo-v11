#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════════
   test_biolab3d — 🧬 Biochimica 3D Lab (v264)

   PERCHE' QUESTO BANCO ESISTE
   L'autore studia biochimica per l'esame con questa sezione: un numero
   sbagliato diventa una risposta sbagliata all'orale. Qui si pretende:
   · in OGNI passo delle otto vie nessun carbonio nasce o sparisce (quelli
     che escono escono come CO₂, quelli che entrano entrano come HCO₃⁻);
   · i bilanci della dispensa: glicolisi +2 ATP +2 NADH, PDH 1 NADH 1 CO₂,
     Krebs 3 NADH 1 FADH₂ 1 GTP 2 CO₂, β-ossidazione 1 FADH₂ 1 NADH per giro,
     C8 = 50 ATP, palmitato = 106, glucosio 30/32;
   · i carboni del piruvato: il C1 (che esce come CO₂ nella PDH) viene dai
     C3·C4 del glucosio; nel Krebs le due CO₂ vengono dall'ossalacetato;
   · la cinetica: i quattro inibitori cambiano Km e Vmax come nella tabella,
     Lineweaver–Burk ha le intercette giuste, le frazioni sommano a 1 e la
     frazione ES è V/Vmax;
   · l'ATP sintasi: 8 H⁺ e 3 ATP per giro (H⁺/ATP = 8/3), le β passano per
     L, T, O sfasate di 120°; l'ossigrafo fa quello che si dice all'orale
     (ADP ↑ consumo, oligomicina ↓, DNP ↑ senza ATP, cianuro = 0);
   · i 12 capitoli ci sono tutti, con la risposta all'orale.
   Poi la pagina, sul telefono: le quattro schede disegnano, il rotore gira e
   i contatori seguono l'angolo, gli enzimi contati tornano con la formula,
   le vie arrivano in fondo, la teoria si apre, nessun errore.

   USO   node tools/banchi/test_biolab3d.js   (serve un server su :8899)
   ════════════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const { chromium } = require('playwright-core');
const RADICE = path.join(__dirname, '..', '..');
const BASE = process.env.BSI_URL_BASE || 'http://127.0.0.1:8899/';
const CHROME = process.env.BSI_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
let ok = 0, ko = 0;
function att(d, a, v) { if (String(a) === String(v)) { ok++; console.log('  ✓ ' + d + '  → ' + v); } else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + a + '\n      avuto:  ' + v); } }
function vero(d, c) { att(d, true, !!c); }
const vicino = (a, b, e) => Math.abs(a - b) <= (e || 1e-9);

(async () => {
  const ctx = { console, Math, Array, Object, isFinite, String, Number, JSON }; ctx.window = ctx; ctx.globalThis = ctx; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(RADICE, 'bsi-bio-lab3d-dati.js'), 'utf8'), ctx);
  const B = ctx.BSIBioDati;
  console.log('── Le vie: carboni e bilanci ──');
  att('otto vie… anzi sette, più i capitoli', 'glicolisi,pdh,krebs,beta,gluconeo,sintesiag,urea', B.VIE.map(v => v.id).join(','));
  let passi = 0, rotti = [];
  B.VIE.forEach(v => v.passi.forEach(p => { passi++; const b = B.bilancioCarboni(p); if (!b.ok) rotti.push(v.id + ' ' + p.n); }));
  vero('in tutti i ' + passi + ' passi i carboni si conservano (prima + entrati = dopo + usciti)', !rotti.length); if (rotti.length) console.log('      ! ' + rotti.join(', '));
  const c = id => JSON.stringify(B.conto(B.perVia(id)));
  att('glicolisi: +2 ATP, +2 NADH', '2 2', [B.conto(B.perVia('glicolisi')).ATP, B.conto(B.perVia('glicolisi')).NADH].join(' '));
  att('PDH: 1 NADH, 1 CO₂', '1 1', [B.conto(B.perVia('pdh')).NADH, B.conto(B.perVia('pdh'))['CO₂']].join(' '));
  { const k = B.conto(B.perVia('krebs')); att('Krebs: 3 NADH, 1 FADH₂, 1 GTP, 2 CO₂', '3 1 1 2', [k.NADH, k['FADH₂'], k.GTP, k['CO₂']].join(' ')); }
  { const k = B.conto(B.perVia('beta')); att('β-ossidazione: 1 FADH₂ + 1 NADH per giro', '1 1', [k['FADH₂'], k.NADH].join(' ')); }
  { const k = B.conto(B.perVia('sintesiag')); att('sintesi AG (primo giro): 2 NADPH, 1 ATP, la CO₂ entrata è la CO₂ uscita', '-2 -1 0', [k.NADPH, k.ATP, k['CO₂']].join(' ')); }
  att('C8 = 50 ATP (3 giri, 4 acetil-CoA)', '50 3 4', [B.atpAcidoGrasso(8).totale, B.atpAcidoGrasso(8).giri, B.atpAcidoGrasso(8).acetilCoA].join(' '));
  att('palmitato C16 = 106 ATP', 106, B.atpAcidoGrasso(16).totale);
  att('glucosio: 32 (malato–aspartato) e 30 (glicerolo-3-P)', '32 30', B.atpGlucosio('ma').totale + ' ' + B.atpGlucosio('g3p').totale);
  { const pir = B.perVia('glicolisi').passi[9].dopo[0], pdh1 = B.perVia('pdh').passi[0], esce = pdh1.prima[0].atomi.filter(a => !pdh1.dopo.some(m => m.atomi.some(b => b.k === a.k)) && a.el === 'C').map(a => a.k);
    att('PDH: esce come CO₂ il C1 del piruvato, cioè il «t1» = C3·C4 del glucosio', 't1 COO⁻', esce.join() + ' ' + pir.atomi.find(a => a.k === 't1').g); }
  { const usciti = []; B.perVia('krebs').passi.forEach(p => { const dopo = new Set(); p.dopo.forEach(m => m.atomi.forEach(a => dopo.add(a.k))); p.prima.forEach(m => m.atomi.forEach(a => { if (a.el === 'C' && !dopo.has(a.k)) usciti.push(a.k); })); });
    att('Krebs: le due CO₂ di un giro vengono dall\'ossalacetato, non dall\'acetile', 'o1,o4', usciti.join()); }
  { const gl = B.perVia('glicolisi').passi, al = gl[3]; att('aldolasi: C1–C3 → DHAP, C4–C6 → gliceraldeide-3-P', 'g1g2g3|g4g5g6', al.dopo.map(m => m.atomi.map(a => a.k).join('')).join('|')); }
  vero('ogni passo ha enzima, classe EC, cofattori, carboni e meccanismo in due lingue', B.VIE.every(v => v.passi.every(p => p.enz.length === 2 && B.CL[p.cl] && p.cof && p.car.length === 2 && p.come.length === 2)));
  vero('le tre tappe irreversibili della glicolisi sono le regolate (1, 3, 10)', B.perVia('glicolisi').passi.filter(p => p.reg).map(p => p.n).join() === '1,3,10' && B.perVia('glicolisi').passi.filter(p => !p.rev).map(p => p.n).join() === '1,3,10');

  console.log('\n── Cinetica ──');
  const o = { Km: 2, Vmax: 5, I: 3, Ki: 1, Ki2: 1 };
  const ap = t => B.apparenti(Object.assign({}, o, { tipo: t }));
  vero('competitivo: Km × α (α = 4), Vmax uguale', vicino(ap('competitivo').Km, 8) && vicino(ap('competitivo').Vmax, 5));
  vero('non competitivo puro: Km uguale, Vmax / α', vicino(ap('noncompetitivo').Km, 2) && vicino(ap('noncompetitivo').Vmax, 1.25));
  vero('incompetitivo: Km e Vmax divise per lo stesso α′ (rette parallele in LB)', vicino(ap('incompetitivo').Km, 0.5) && vicino(ap('incompetitivo').Vmax, 1.25) && vicino(B.lb(Object.assign({}, o, { tipo: 'incompetitivo' })).pendenza, B.lb(Object.assign({}, o, { tipo: 'nessuno' })).pendenza));
  { const l = B.lb({ Km: 2, Vmax: 5, tipo: 'nessuno' }); vero('Lineweaver–Burk: intercetta y 1/Vmax, x −1/Km, pendenza Km/Vmax', vicino(l.intercettaY, 0.2) && vicino(l.intercettaX, -0.5) && vicino(l.pendenza, 0.4)); }
  vero('V₀ = Vmax/2 quando [S] = Km', vicino(B.velocita(2, { Km: 2, Vmax: 5, tipo: 'nessuno' }), 2.5));
  let fOk = true; ['nessuno', 'competitivo', 'noncompetitivo', 'misto', 'incompetitivo'].forEach(t => [0.1, 1, 7].forEach(S => { const oo = { Km: 1, Vmax: 1, I: 2.5, Ki: 1, Ki2: 3, tipo: t }, f = B.frazioni(S, oo); if (!vicino(f.E + f.ES + f.EI + f.ESI, 1, 1e-12) || !vicino(f.ES, B.velocita(S, oo), 1e-12)) fOk = false; }));
  vero('frazioni E+ES+EI+ESI = 1 e frazione ES = V/Vmax per tutti i tipi (è così che i prodotti contati tornano con la formula)', fOk);
  vero('allosterico: sigmoide (V(K₀,₅) = Vmax/2, pendenza nulla all\'origine), l\'attivatore sposta a sinistra', vicino(B.velocita(1, { tipo: 'allosterico', K05: 1, n: 3, Vmax: 1 }), 0.5) && B.velocita(0.01, { tipo: 'allosterico', K05: 1, n: 3, Vmax: 1 }) < 1e-5 && B.velocita(1, { tipo: 'allosterico', K05: 1, n: 3, Vmax: 1, effettore: 0.4 }) > 0.9);

  console.log('\n── ATP sintasi e ossigrafo ──');
  { const r = B.rotore(2 * Math.PI * 5, 8); att('5 giri con c₈: 40 H⁺, 15 ATP, H⁺/ATP = 8/3', '40 15 2.667', r.protoni + ' ' + r.atp + ' ' + r.hPerAtp.toFixed(3)); }
  att('c₁₀ (lievito): H⁺/ATP 10/3', '3.333', B.rotore(1, 10).hPerAtp.toFixed(3));
  { const st = [0, 1, 2].map(i => B.statoBeta(0.3, i)).sort().join(''); att('le tre β sono sempre in tre stati diversi (L, O, T)', 'LOT', st);
    let cambi = 0, prima = B.statoBeta(0, 0); for (let a = 0.0005; a < 2 * Math.PI + 0.001; a += 0.001) { const s = B.statoBeta(a, 0); if (s !== prima) { cambi++; prima = s; } } att('una β cambia stato 3 volte per giro (ogni 120°)', 3, cambi); }
  const r2 = B.regime([]), r3 = B.regime(['ADP']), ro = B.regime(['ADP', 'oligomicina']), rd = B.regime(['ADP', 'oligomicina', 'dnp']), rc = B.regime(['ADP', 'oligomicina', 'dnp', 'cianuro']);
  vero('stato 3 (ADP): consumo di O₂ ' + (r3.consumoO2 / r2.consumoO2).toFixed(1) + ' volte lo stato 2 (controllo respiratorio > 3)', r3.consumoO2 > 3 * r2.consumoO2 && r3.Jsyn > 0 && r2.Jsyn === 0);
  vero('oligomicina: niente ATP e il consumo ricade allo stato 2', ro.Jsyn === 0 && ro.consumoO2 < r3.consumoO2 / 3);
  vero('disaccoppiante: consumo più alto dello stato 3, gradiente crollato, niente ATP', rd.consumoO2 > r3.consumoO2 && rd.dp < r3.dp - 50 && rd.Jsyn === 0);
  vero('cianuro: consumo zero, gradiente scarico', rc.consumoO2 === 0 && rc.dp < 1);

  console.log('\n── I 12 capitoli ──');
  att('12 capitoli, numerati da 1 a 12', '1,2,3,4,5,6,7,8,9,10,11,12', B.CAPITOLI.map(c => c.n).join());
  vero('ognuno ha sintesi e risposta all\'orale (≥ 40 parole) in due lingue', B.CAPITOLI.every(c => c.sintesi.length === 2 && c.orale.length === 2 && c.orale.every(x => x.split(/\s+/).length >= 40)));
  vero('i «non dire» della dispensa ci sono (enzima e ΔG, complesso II, oligomicina, giri del C8)', JSON.stringify(B.CAPITOLI).includes('abbassa il ΔG') && JSON.stringify(B.CAPITOLI).includes('complesso II pompa') && JSON.stringify(B.CAPITOLI).includes('4 giri per un C8'));
  att('tabella del capitolo 12: 18 enzimi regolati', 18, B.REGOLATI.length);

  console.log('\n── La pagina, telefono ──');
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const cx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true }), pg = await cx.newPage(), errs = [];
  pg.on('pageerror', e => errs.push(e.message.slice(0, 200)));
  await pg.addInitScript(() => { try { localStorage.setItem('bsi_guide_v3', '1'); } catch (e) {} });
  await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
  await pg.waitForFunction(() => !!(window.BSIBioLab3D && window.BSIBioDati && window.BSISpectraLive && window.BSILab3D), null, { timeout: 60000 });
  vero('il pulsante «Biochimica 3D Lab» è nella barra della biochimica', await pg.evaluate(() => !!document.querySelector('.nav-btn[data-s="sbiolab3d"]')));
  vero('Spectra ha lo strumento biochimica_3d', await pg.evaluate(() => (window.BSI_AI_TOOLS || []).some(t => t.name === 'biochimica_3d')));
  const r = await pg.evaluate(async () => {
    const P = ms => new Promise(r => setTimeout(r, ms)), o = {};
    const pix = S => { S.disegna(); const c = document.createElement('canvas'); c.width = 90; c.height = 120; const q = c.getContext('2d'); q.drawImage(S.ren.domElement, 0, 0, 90, 120); const d = q.getImageData(0, 0, 90, 120).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] > 150) n++; return n; };
    const vivo = cv => { const q = cv.getContext('2d'), d = q.getImageData(0, 0, cv.width, cv.height).data; let n = 0; for (let i = 0; i < d.length; i += 16) if (d[i + 3] > 200 && d[i] + d[i + 1] + d[i + 2] > 300) n++; return n; };
    BSISpectraLive.calcolo.apriSezione('sbiolab3d'); await P(900);
    const pan = () => [...document.querySelectorAll('#sbiolab3d [role="tabpanel"]')];
    o.schede = document.querySelectorAll('#sbiolab3d .bsiFX-schede button').length;
    /* ATP sintasi */
    let a = pan()[0]._bl; for (let i = 0; i < 80 && !a.pronto; i++) await P(200);
    a.S.box.scrollIntoView({ block: 'center' }); await P(2500);
    const u1 = a.ultimo; a.avanza(30); await P(400); const u2 = a.ultimo;
    o.atp = { px: pix(a.S), oss: vivo(a.S.box.querySelector('.bsiBL-vivo')), giri: u2.giri - u1.giri, atp: u2.atp - u1.atp, h: u2.protoni - u1.protoni, gira: u2.giri > u1.giri, stati: u2.stati };
    a.vista('taglio'); await P(800); o.atp.taglio = pix(a.S); a.vista('esplosa'); await P(800); o.atp.esplosa = pix(a.S);
    a.aggiungi('oligomicina'); a.avanza(20); await P(300); const g1 = a.ultimo.giri; a.avanza(20); await P(300); o.atp.fermo = Math.abs(a.ultimo.giri - g1) < 1e-9;
    /* enzimi */
    document.querySelectorAll('#sbiolab3d .bsiFX-schede button')[1].click(); await P(300);
    let e = pan()[1]._bl; for (let i = 0; i < 80 && !e.pronto; i++) await P(200);
    e.imposta({ tipo: 'competitivo', I: 3, logS: 0 }); e.S.box.scrollIntoView({ block: 'center' }); await P(22000);
    o.enz = { px: pix(e.S), graf: vivo(e.S.box.querySelector('.bsiBL-vivo')), formula: e.ultimo.formula, misurata: e.ultimo.misurata, prodotti: e.ultimo.prodotti };
    e.imposta({ grafico: 'lb' }); await P(300); o.enz.lb = vivo(e.S.box.querySelector('.bsiBL-vivo'));
    /* vie */
    document.querySelectorAll('#sbiolab3d .bsiFX-schede button')[2].click(); await P(300);
    o.vie = [];
    for (const v of BSIBioDati.VIE) {
      const d = pan()[2], w = d._apri(v.id); for (let i = 0; i < 80 && !w.pronto; i++) await P(200);
      w.gioca(false); w.S.box.scrollIntoView({ block: 'center' }); w.vai(0.55); await P(500);
      const px = pix(w.S), g = vivo(w.S.box.querySelector('.bsiBL-vivo')), isp = d.querySelector('.bsiBL-box[aria-live]').textContent.length;
      w.vai(v.passi.length); await P(500);
      o.vie.push({ id: v.id, px, g, isp, fine: w.ultimo && w.ultimo.passo === v.passi.length - 1 && w.ultimo.u === 1, conto: JSON.stringify(w.conto) === JSON.stringify(BSIBioDati.conto(v)) });
    }
    /* teoria */
    document.querySelectorAll('#sbiolab3d .bsiFX-schede button')[3].click(); await P(400);
    const tdv = pan()[3]; tdv._apri(6); await P(200);
    o.teoria = { capitoli: tdv.querySelectorAll('.bsiBL-scelte button').length, orale: !!tdv.querySelector('.bsiBL-orale'), nonDire: tdv.querySelectorAll('.bsiBL-no div').length, quiz: tdv.querySelectorAll('.bsiBL-quiz .bsiBL-com button').length, c8: /50 ATP/.test(tdv.textContent) };
    const r = await (window.BSI_AI_TOOLS.find(t => t.name === 'biochimica_3d')).execute({ scheda: 'vie', via: 'krebs' }); await P(1500); o.strumento = r.ok && /Krebs/.test(r.via) && document.querySelector('#sbiolab3d .bsiBL-scelte button[aria-pressed="true"]').textContent;
    o.sb = document.documentElement.scrollWidth - document.documentElement.clientWidth; return o;
  });
  att('quattro schede', 4, r.schede);
  vero('ATP sintasi: disegna (' + r.atp.px + ' px), ossigrafo vivo (' + r.atp.oss + '), montata/spaccato/esplosa (' + r.atp.taglio + ', ' + r.atp.esplosa + ' px)', r.atp.px > 300 && r.atp.oss > 20 && r.atp.taglio > 300 && r.atp.esplosa > 300);
  vero('ATP sintasi: in 30 s il rotore gira (' + r.atp.giri.toFixed(2) + ' giri) e i contatori seguono l\'angolo (' + r.atp.h + ' H⁺, ' + r.atp.atp + ' ATP: ≈ 8 e 3 per giro)', r.atp.gira && Math.abs(r.atp.h - 8 * r.atp.giri) <= 1.01 && Math.abs(r.atp.atp - 3 * r.atp.giri) <= 1.01);
  vero('le tre β in tre stati diversi (' + r.atp.stati + ')', r.atp.stati.split('').sort().join('') === 'LOT');
  vero('con l\'oligomicina il rotore si ferma', r.atp.fermo);
  vero('enzimi: disegnano (' + r.enz.px + ' px), grafici MM e LB vivi (' + r.enz.graf + ', ' + r.enz.lb + '), ' + r.enz.prodotti + ' prodotti contati', r.enz.px > 300 && r.enz.graf > 20 && r.enz.lb > 10 && r.enz.prodotti > 5);
  vero('enzimi: la velocità contata (' + r.enz.misurata.toFixed(2) + ') torna con la formula (' + r.enz.formula.toFixed(2) + ') entro 0,1', Math.abs(r.enz.misurata - r.enz.formula) < 0.1);
  r.vie.forEach(v => vero(v.id + ': disegna (' + v.px + ' px), grafico vivo (' + v.g + '), ispettore del passo, arriva in fondo col conto giusto', v.px > 80 && v.g > 10 && v.isp > 80 && v.fine && v.conto));
  vero('teoria: 12 capitoli, risposta all\'orale, ' + r.teoria.nonDire + ' «non dire» nel cap. 6, quiz con ' + r.teoria.quiz + ' risposte, C8 = 50 ATP', r.teoria.capitoli === 12 && r.teoria.orale && r.teoria.nonDire === 3 && r.teoria.quiz >= 2 && r.teoria.c8);
  vero('lo strumento di Spectra apre la via chiesta (' + r.strumento + ')', /Krebs/.test(r.strumento || ''));
  att('non sborda', 0, r.sb);
  att('nessun errore JavaScript', 0, errs.length); errs.slice(0, 3).forEach(e => console.log('      ! ' + e));
  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.stack || e.message); process.exit(1); });
