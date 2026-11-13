#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   test_correzioni — gli errori scientifici trovati scrivendo la teoria (v253)

   PERCHE' QUESTO BANCO ESISTE
   Scrivere la teoria di 145 sezioni ha voluto dire rileggerne il codice, e la
   rilettura ha trovato errori veri: calcoli sbagliati, dati scambiati, frasi
   false. Sono stati corretti nella v253; questo banco impedisce che tornino.
   · CALCOLI: pH di titolazione dal bilancio di carica (acido acetico 2,88 →
     4,76 → 8,73 → 11,29; ammoniaca con il punto equivalente acido, 5,28);
     punto isoelettrico dalla carica netta (His 7,59, Cys 5,07, Tyr 5,63);
     formula bruta da SMILES con gli idrogeni contati davvero (etanolo C₂H₆O,
     aspirina C₉H₈O₄, caffeina C₈H₁₀N₄O₂); la dose di mantenimento finita;
     log K di Nernst senza contare n due volte.
   · DATI: la forma aperta degli zuccheri con la stereochimica giusta (CIP
     calcolato con RDKit); i pKa della lisina; il numero di atomi delle
     molecole della simmetria e il carattere di T₂g in Oₕ; i ΔG°′ dei
     complessi III e IV; gli H⁺ pompati senza tirare a sorte.
   · TESTI: anti-periplanare nella E2, carbocatione secondario nel propene,
     anidrasi carbonica fra le liasi, A=T con due legami H.

   USO   node tools/banchi/test_correzioni.js    (serve un server su :8899)
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright-core');
const RADICE = path.join(__dirname, '..', '..');
const BASE = process.env.BSI_URL_BASE || 'http://127.0.0.1:8899/';
const CHROME = process.env.BSI_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
let ok = 0, ko = 0;
function att(d, atteso, avuto) { if (String(atteso) === String(avuto)) { ok++; console.log('  ✓ ' + d + '  → ' + avuto); } else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + '\n      avuto:  ' + avuto); } }
function vero(d, c) { att(d, true, !!c); }

(async () => {
  const H = fs.readFileSync(path.join(RADICE, 'index.html'), 'utf8');

  console.log('── Gli zuccheri aperti, con RDKit ──');
  const RD = await require(path.join(RADICE, 'RDKit_minimal.js'))({ locateFile: () => path.join(RADICE, 'RDKit_minimal.wasm') });
  const ZUCCHERI = { 'D-Glucosio': '(2R,3S,4R,5R)', 'D-Galattosio': '(2R,3S,4S,5R)', 'D-Mannosio': '(2S,3S,4R,5R)', 'D-Ribosio': '(2R,3R,4R)', '2-Desossi-D-ribosio': '(3S,4R)', 'D-Fruttosio': '(3S,4R,5R)' };
  for (const [nome, cip] of Object.entries(ZUCCHERI)) {
    const i = H.indexOf('name:"' + nome + '"'), m = /smi_open:"([^"]+)"/.exec(H.slice(i, i + 1500));
    const mol = m && RD.get_mol(m[1]); if (!mol) { att(nome + ': forma aperta leggibile', true, false); continue; }
    /* numerazione dello zucchero: C1 è il carbonio carbonilico (o il CH₂OH vicino al C=O nel chetoso); i descrittori CIP
       vanno letti per C2, C3… : si ricavano dall'InChI, che li numera in modo canonico, confrontandolo con l'InChI di riferimento */
    const inchi = mol.get_inchi(), tags = JSON.parse(mol.get_stereo_tags()).CIP_atoms.map(x => x[1]).join(''); mol.delete();
    const RIF = { 'D-Glucosio': 'C([C@H]([C@H]([C@@H]([C@H](C=O)O)O)O)O)O', 'D-Galattosio': 'C([C@H]([C@@H]([C@@H]([C@H](C=O)O)O)O)O)O', 'D-Mannosio': 'C([C@H]([C@H]([C@@H]([C@@H](C=O)O)O)O)O)O', 'D-Ribosio': 'C([C@H]([C@H]([C@H](C=O)O)O)O)O', '2-Desossi-D-ribosio': 'C(C=O)[C@@H]([C@@H](CO)O)O', 'D-Fruttosio': 'C([C@H]([C@H]([C@@H](C(=O)CO)O)O)O)O' };
    const r = RD.get_mol(RIF[nome]), ir = r.get_inchi(); r.delete();
    vero(nome + ' ' + cip + ': la forma aperta è un ' + (/Fruttosio/.test(nome) ? 'chetoso' : 'aldoso') + ' con la stereochimica giusta (' + tags + ')', inchi === ir);
  }

  console.log('\n── Nel codice ──');
  vero('Nernst: log K = E°/(2,303RT/nF), n contato una volta', /Keq=Math\.pow\(10,E0\/slope\)/.test(H) && !/Keq=Math\.pow\(10,n\*E0\/slope/.test(H));
  att('simmetria: numero di atomi (CHCl₃, trans-C₂H₂Cl₂, XeF₄, NH₂Cl, CHFClBr)', '5 6 5 4 5', ["f:'CHCl₃'", "f:'trans-C₂H₂Cl₂'", "f:'XeF₄'", "f:'NH₂Cl'", "f:'CHFClBr'"].map(k => (new RegExp(k.replace(/[()]/g, '\\$&') + "[^}]*?n:(\\d+)").exec(H) || [])[1]).join(' '));
  vero('Oₕ: carattere di T₂g sotto 6C₂ = +1', H.indexOf("{ s:'T₂g', c:[3,0,1,-1,-1,3,-1,0,-1,1]") >= 0);
  vero('niente etichette con «ₗ» nelle tavole dei caratteri', !/s:'[A-Z]ₗ/.test(H));
  vero('lisina: α-NH₃⁺ 9,06 e catena 10,54', /name:"Lisina",formula:"",pka:2\.16,pka2:9\.06,pka3:10\.54/.test(H));
  vero('complessi III e IV: ΔG°′ ≈ −40 e −109 kJ/mol', /Complesso III \(citocromo bc\\u2081\)",coenz:"eme, Fe-S","\\u0394G":-40/.test(H) && /Complesso IV \(citocromo c ossidasi\)",coenz:"eme a\/a\\u2083, Cu","\\u0394G":-109/.test(H));
  vero('catena respiratoria: H⁺ pompati senza Math.random', !/c\.pumps>0 && Math\.random\(\)/.test(H));
  vero('E2 anti-periplanare, propene → carbocatione secondario', !/doppio legame syn-periplanar/.test(H) && /uno secondario, più stabile/.test(H));
  vero('anidrasi carbonica fra le liasi', /data-pdb="1CA2" data-name="Anidrasi carbonica" data-cat="Liasi"/.test(H));
  vero('DNA: A=T con due legami H, 3,4 Å fra coppie', /A=T \(2 legami H/.test(H) && !/A≡T/.test(H));

  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const pg = await (await b.newContext({ serviceWorkers: 'block', viewport: { width: 412, height: 915 }, isMobile: true })).newPage(), errs = [];
  pg.on('pageerror', e => errs.push(e.message.slice(0, 200)));
  await pg.addInitScript(() => { try { localStorage.setItem('bsi_guide_v3', '1'); } catch (e) {} });
  await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
  await pg.waitForFunction(() => typeof window.calcpH === 'function' && typeof window.parseSMILES === 'function' && window.BSISpectraLive, null, { timeout: 60000 });
  console.log('\n── Nella pagina ──');
  const r = await pg.evaluate(async () => {
    const pausa = ms => new Promise(r => setTimeout(r, ms)), o = {};
    const f = (t, pk, V) => calcpH(t, pk, 0.1, 0.1, 0.025, V / 1000).toFixed(2);
    o.acetico = [0, 12.5, 25, 26].map(v => f('weak_acid', 4.76, v)).join(' '); o.nh3 = [0, 12.5, 25, 26].map(v => f('weak_base', 9.25, v)).join(' '); o.forte = [0, 25, 26].map(v => f('strong_acid', 0, v)).join(' ');
    o.formule = ['CCO', 'CC(=O)Oc1ccccc1C(=O)O', 'Cn1cnc2c1c(=O)n(c(=O)n2C)C', 'c1ccncc1'].map(s => (parseSMILES(s) || {}).formula).join(' ');
    BSISpectraLive.calcolo.apriSezione('scalcav'); await pausa(900);
    const sel = document.getElementById('piAA'); o.pI = [];
    if (sel) for (const a of ['His', 'Cys', 'Tyr', 'Lys', 'Gly']) { sel.value = a; window.calcPI(); o.pI.push(a + ' ' + document.getElementById('piResult').textContent.match(/[\d.]+/)[0]); }
    o.pI = o.pI.join(', ');
    BSISpectraLive.calcolo.apriSezione('stitr'); await pausa(900);
    if (window.updateTitration) { window.updateTitration(); o.pe = ((document.getElementById('titrInfo') || {}).textContent || '').match(/pH al PE:\s*([\d.]+)/); o.pe = o.pe && o.pe[1]; }
    BSISpectraLive.calcolo.apriSezione('spkcalc'); await pausa(900);
    try { renderPKCInputs('dose'); await pausa(200); calcPKC('dose'); o.dose = (document.getElementById('pkcResults') || {}).textContent; } catch (e) { o.dose = 'errore ' + e.message; }
    return o;
  });
  att('titolazione dell\'acido acetico: inizio, metà, equivalenza, oltre', '2.88 4.76 8.73 11.29', r.acetico);
  att('titolazione dell\'ammoniaca: il punto equivalente è acido (5,28)', '11.12 9.25 5.28 2.71', r.nh3);
  att('acido forte con base forte', '1.00 7.00 11.29', r.forte);
  att('formula bruta da SMILES: etanolo, aspirina, caffeina, piridina', 'C2H6O C9H8O4 C8H10N4O2 C5H5N', r.formule);
  att('punto isoelettrico dalla carica netta', 'His 7.59, Cys 5.07, Tyr 5.63, Lys 9.74, Gly 5.97', r.pI);
  att('il «pH al PE» della titolazione è quello esatto, non il punto di griglia', '8.73', r.pe);
  vero('dose di mantenimento finita (Css 10 · CL 5 · τ 8 / F 0,8 = 500 mg): ' + (r.dose || '').replace(/\s+/g, ' ').slice(0, 70), /= 500\.0 mg/.test(r.dose || ''));
  att('nessun errore JavaScript', 0, errs.length); errs.slice(0, 3).forEach(e => console.log('      ! ' + e));
  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
