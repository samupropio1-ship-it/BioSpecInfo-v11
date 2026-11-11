#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   test_potenzia250 — le quattro sezioni nuove della v250: i numeri e le pagine

   PERCHE' QUESTO BANCO ESISTE
   Richiesta dell'autore: i potenziamenti maggiori per chemioinformatica, RDKit,
   data science, spettri, astrochimica e astrofisica. Fatto l'inventario di cio'
   che c'era, la v250 aggiunge quattro sezioni:
     🗺️ Mappa dello spazio chimico   (t-SNE esatto sulle distanze di Tanimoto)
     📈 Deconvoluzione di picchi       (Levenberg–Marquardt)
     ☁️ Chimica di una nube interstellare (H₂ e CO fra grani e ultravioletto)
     🌡️ Saha e le classi spettrali     (ionizzazione, righe di Balmer, Ca II nel Sole)
   Una sezione che disegna curve belle e numeri sbagliati e' peggio di nessuna
   sezione. Qui i numeri si confrontano con cio' che si puo' controllare:

   · SAHA, contro gli esempi classici dei manuali (Carroll e Ostlie):
     a P_e = 20 Pa meta' dell'idrogeno e' ionizzata vicino a 9600 K; le righe di
     Balmer sono massime vicino a 9900 K; N₂ = N₁ a 85 400 K; nel Sole
     (5777 K, 1,5 Pa) ci sono ~400 ioni Ca II nello stato fondamentale per ogni
     atomo di H in n = 2.
   · LA NUBE, contro le soluzioni esatte: senza schermo l'integratore arriva
     all'equilibrio f = 2kn/(2kn + Γ); senza distruzione f(t) = 1 − e^(−2knt),
     quindi 63,2 % a t = 1/(2kn), che per n = 100 cm⁻³ e 100 K vale 5,3 milioni
     di anni; e la fisica: le frazioni crescono con la profondita', e H diventa
     H₂ PRIMA che C⁺ diventi CO.
   · LA DECONVOLUZIONE, contro la verita' nota: spettri sintetici con picchi
     scelti e rumore a seme fisso; il fit deve ritrovare centri, larghezze e
     altezze. Le aree in forma chiusa contro l'integrale numerico.
   · IL t-SNE, contro cio' che deve fare: su quattro gruppi gaussiani in dieci
     dimensioni conserva i vicinati meglio della PCA, li tiene separati, la
     divergenza KL scende, e lo stesso seme da' la stessa mappa.
   Poi le pagine, a 412 e 1280 px: ogni scheda si apre, disegna, non sborda,
   non mostra NaN; la mappa vera con RDKit separa le sette famiglie.

   USO   node tools/banchi/test_potenzia250.js    (serve un server su :8899)
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const { chromium } = require('playwright-core');
const RADICE = path.join(__dirname, '..', '..');
const BASE = process.env.BSI_URL_BASE || 'http://127.0.0.1:8899/';
const CHROME = process.env.BSI_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let ok = 0, ko = 0;
function att(d, atteso, avuto) {
  if (String(atteso) === String(avuto)) { ok++; console.log('  ✓ ' + d + '  → ' + avuto); }
  else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + '\n      avuto:  ' + avuto); }
}
function vero(d, c) { att(d, true, !!c); }
function vicino(d, atteso, avuto, tol) { const e = Math.abs(avuto - atteso) / Math.max(1e-300, Math.abs(atteso)); if (e <= tol) { ok++; console.log('  ✓ ' + d + '  → ' + (+avuto.toPrecision(6)) + ' (atteso ' + atteso + ', scarto ' + (e * 100).toFixed(2) + ' %)'); } else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + ' ± ' + tol * 100 + ' %\n      avuto:  ' + avuto); } }

function carica() {
  const ctx = { console, Math, Date, setTimeout, clearTimeout, Float64Array, Float32Array, Array, Object, JSON, isFinite, parseFloat, String, Number, Infinity };
  ctx.window = ctx; ctx.globalThis = ctx;
  ctx.BSIFisica = { t: a => a, calcolo: {}, el: () => ({}), sezione() {} };
  vm.createContext(ctx);
  ['bsi-astro-chimica.js', 'bsi-chem-mappe.js'].forEach(f => vm.runInContext(fs.readFileSync(path.join(RADICE, f), 'utf8'), ctx, { filename: f }));
  return ctx.BSIFisica.calcolo;
}

(async () => {
  const C = carica(), S = C.saha, N = C.nube, M = C.mappe, D = C.deconv;

  console.log('── Saha e Boltzmann, contro i manuali ──');
  vicino('metà dell\'idrogeno ionizzata, P_e = 20 Pa (K)', 9600, S.temperaturaMeta(20), 0.01);
  vicino('massimo delle righe di Balmer, P_e = 20 Pa (K)', 9900, S.piccoBalmer(20).T, 0.01);
  vicino('N₂/N₁ = 1 a 85 400 K', 1, S.boltzmann(85400, 10.2, 8, 2), 0.01);
  const so = S.soleCalcio();
  vicino('Sole: idrogeno ionizzato (N_II/N_tot)', 7.70e-5, so.ionizzatoH, 0.03);
  vicino('Sole: atomi di H in n = 2', 5.06e-9, so.H2, 0.02);
  vero('Sole: quasi tutto il calcio è Ca II (' + (so.CaII * 100).toFixed(2) + ' %) e nello stato fondamentale (' + (so.fondamentale * 100).toFixed(2) + ' %)', so.CaII > 0.995 && so.fondamentale > 0.99);
  vicino('Sole: ioni Ca II che assorbono per ogni H che assorbe', 400, so.rapporto, 0.05);
  vero('la ionizzazione cresce con la temperatura e cala con la pressione', S.ionizzatoH(9000, 20) < S.ionizzatoH(11000, 20) && S.ionizzatoH(10000, 200) < S.ionizzatoH(10000, 2));
  att('le classi: 5777 K, 9900 K, 3500 K, 20 000 K', 'G A M B', [5777, 9900, 3500, 20000].map(S.classeDi).join(' '));

  console.log('\n── La nube, contro le soluzioni esatte ──');
  vicino('tempo di formazione di H₂, n = 100 cm⁻³, T = 100 K (milioni di anni)', 5.28, N.tempoH2(100, 100) / 1e6, 0.01);
  vero('è la regola «10⁹/n anni»: a n = 1000 il tempo è dieci volte più breve', Math.abs(N.tempoH2(100, 100) / N.tempoH2(1000, 100) - 10) < 1e-9);
  const P = { n: 100, T: 100, G0: 1, Av: 0, schermo: false };
  vicino('senza schermo l\'integratore arriva a f = 2kn/(2kn + Γ)', N.fEquilibrio(100, 100, N.gammaH2(0, P)), N.evolvi(P).fFin, 1e-6);
  const E2 = N.evolvi({ n: 100, T: 100, G0: 0, Av: 10 }, { passi: 4000 }), tf = N.tempoH2(100, 100), i = E2.t.findIndex(x => x >= tf);
  vicino('senza ultravioletto f(t = 1/2kn) = 1 − 1/e', 1 - Math.exp(-1), E2.f[i], 0.01);
  vero('lo schermo vale 1 senza colonna e crolla con la colonna (' + N.schermo(1e21).toExponential(1) + ' a 10²¹ cm⁻²)', Math.abs(N.schermo(0) - 1) < 1e-3 && N.schermo(1e21) < 1e-4 && N.schermo(1e14) > N.schermo(1e16));
  const R = N.profilo({ n: 1000, T: 50, G0: 10 }, 8);
  vero('attraverso la nube le frazioni di H₂ e di CO non calano mai', R.f.every((v, k) => k === 0 || v >= R.f[k - 1] - 1e-9) && R.y.every((v, k) => k === 0 || v >= R.y[k - 1] - 1e-9));
  vero('H diventa H₂ prima che C⁺ diventi CO (A_V = ' + R.AvH2.toFixed(2) + ' contro ' + R.AvCO.toFixed(2) + ')', R.AvH2 != null && R.AvCO != null && R.AvH2 < R.AvCO);
  vero('in superficie il gas è atomico e ionizzato, in fondo molecolare', R.f[0] < 0.01 && R.y[0] < 0.01 && R.f[80] > 0.99 && R.y[80] > 0.99);
  const forte = N.profilo({ n: 1000, T: 50, G0: 1000 }, 8);
  vero('un campo ultravioletto cento volte più forte spinge il CO più in profondità (' + forte.AvCO.toFixed(2) + ')', forte.AvCO > R.AvCO + 1);
  const tc = N.tassiCO(1, 0, { n: 1000, G0: 0, Av: 5 });
  vero('senza ultravioletto tutto il CHₓ diventa CO (β = 1)', Math.abs(tc.beta - 1) < 1e-12 && tc.distrugge === 0);

  console.log('\n── La deconvoluzione, contro la verità nota ──');
  for (const k of Object.keys(D.ESEMPI)) {
    const E = D.ESEMPI[k], d = D.datiEsempio(k), r = D.deconvolvi(d.x, d.y, E.n, E.tipo);
    const sc = E.picchi.map((p, j) => [Math.abs(r.picchi[j].c - p.c), Math.abs(r.picchi[j].w - p.w) / p.w, Math.abs(r.picchi[j].h - p.h) / p.h]);
    vero('«' + k + '»: ' + E.n + ' picchi ritrovati (centro entro ' + Math.max(...sc.map(x => x[0])).toFixed(2) + ', larghezza entro ' + (Math.max(...sc.map(x => x[1])) * 100).toFixed(1) + ' %, altezza entro ' + (Math.max(...sc.map(x => x[2])) * 100).toFixed(1) + ' %), R² = ' + r.R2.toFixed(5),
      sc.every(x => x[0] < 0.5 && x[1] < 0.06 && x[2] < 0.06) && r.R2 > 0.999);
    if (k === 'ammide') vicino('ammide I: la quota d\'area dell\'α-elica (1655 cm⁻¹)', 1.0 * 19 / E.picchi.reduce((a, p) => a + p.h * p.w, 0), r.picchi[2].quota, 0.03);
    if (k === 'spalla') vicino('pseudo-Voigt: η ritrovato', 0.4, r.eta, 0.1);
  }
  for (const tp of ['gauss', 'lorentz']) { let s = 0; for (let x = -40000; x <= 40000; x += 0.05) s += D.profilo(x, 2, 0, 12, tp, 0) * 0.05; vicino('area ' + tp + ': forma chiusa contro integrale numerico', s, D.area(2, 12, tp), tp === 'gauss' ? 1e-6 : 1e-3); }
  vicino('a metà larghezza il profilo vale metà altezza (gaussiana)', 0.5, D.profilo(6, 1, 0, 12, 'gauss', 0), 1e-12);
  vicino('a metà larghezza il profilo vale metà altezza (lorentziana)', 0.5, D.profilo(6, 1, 0, 12, 'lorentz', 0), 1e-12);
  const un = D.deconvolvi(...(() => { const d = D.sintetico([{ h: 1, c: 50, w: 10 }], 0, 100, 300, 'gauss', 0, 1, 0); return [d.x, d.y]; })(), 1, 'gauss');
  vero('un picco senza rumore: fit esatto (R² = ' + un.R2.toFixed(8) + ')', un.R2 > 0.9999999 && Math.abs(un.picchi[0].c - 50) < 1e-4);
  const L = D.leggiXY('3 0,5\n1;0.2\n2\t0.9\nriga non valida\n');
  att('i dati incollati si leggono con virgole, punti e virgola, tabulazioni, e si ordinano', '1,2,3|0.2,0.9,0.5', L.x.join(',') + '|' + L.y.join(','));

  console.log('\n── Il t-SNE, contro ciò che deve fare ──');
  const G = M.gruppiSintetici(4, 25, 10, 3, 11), DD = M.distanze(G.X), T = M.tsne(DD, { perplessita: 10, seme: 7 }), Pc = M.pca2(G.X);
  const cT = M.conservazione(DD, T.Y, 5), cP = M.conservazione(DD, Pc, 5);
  vero('conserva i vicinati meglio della PCA (' + cT.toFixed(2) + ' contro ' + cP.toFixed(2) + ')', cT > cP + 0.15 && cT > 0.5);
  vero('tiene separati i quattro gruppi (vicino dello stesso gruppo: ' + (M.purezza(T.Y, G.classi) * 100).toFixed(0) + ' %)', M.purezza(T.Y, G.classi) > 0.97);
  vero('la divergenza KL scende (' + T.kl[10].toFixed(3) + ' → ' + T.kl[T.kl.length - 1].toFixed(3) + ')', T.kl[T.kl.length - 1] < T.kl[10] && T.kl[T.kl.length - 1] < 0.6);
  vero('lo stesso seme dà la stessa mappa', JSON.stringify(M.tsne(DD, { perplessita: 10, seme: 7 }).Y) === JSON.stringify(T.Y));
  vero('un seme diverso dà una mappa diversa ma altrettanto buona', (() => { const T2 = M.tsne(DD, { perplessita: 10, seme: 99 }); return JSON.stringify(T2.Y) !== JSON.stringify(T.Y) && M.purezza(T2.Y, G.classi) > 0.97; })());
  const Pm = M.probabilita(DD, 10); let somma = 0; for (const r of Pm) for (const v of r) somma += v;
  vicino('le probabilità P sommano a 1', 1, somma, 1e-3);
  vero('P è simmetrica', Pm.every((r, a) => r.every((v, b2) => Math.abs(v - Pm[b2][a]) < 1e-12)));
  vero('la mappa è centrata', Math.abs(T.Y.reduce((a, p) => a + p[0], 0)) < 1e-6 && Math.abs(T.Y.reduce((a, p) => a + p[1], 0)) < 1e-6);
  att('le molecole d\'esempio: sette famiglie', '7 55', M.FAMIGLIE.length + ' ' + M.esempio().length);

  console.log('\n── Le pagine ──');
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  for (const [nome, opz] of [['telefono', { viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true }], ['schermo grande', { viewport: { width: 1280, height: 860 } }]]) {
    const ctx = await b.newContext(Object.assign({ serviceWorkers: 'block' }, opz)), pg = await ctx.newPage(), errs = [];
    pg.on('pageerror', e => errs.push(e.message.slice(0, 200)));
    pg.on('console', m => { if (m.type() === 'error' && /TypeError|ReferenceError/.test(m.text())) errs.push(m.text().slice(0, 200)); });
    await pg.addInitScript(() => { try { localStorage.setItem('bsi_guide_v3', '1'); } catch (e) {} });
    await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
    await pg.waitForFunction(() => !!(window.BSISpectraLive && window.BSIFisica && BSIFisica.calcolo.mappe && BSIFisica.calcolo.saha), null, { timeout: 60000 });
    const r = await pg.evaluate(async () => {
      const pausa = ms => new Promise(r => setTimeout(r, ms)), o = {};
      for (const id of ['ssaha', 'snubeism', 'sdeconv', 'sspaziochim']) {
        const x = BSISpectraLive.calcolo.apriSezione(id); await pausa(700);
        const el = document.getElementById(id), schede = [...el.querySelectorAll('.bsiFX-schede button')], v = { aperta: x && x.id, schede: schede.length, tele: [], sb: 0, strano: null, nav: !!document.querySelector('.nav-btn[data-s="' + id + '"]') };
        for (const bt of schede) {
          bt.click(); await pausa(600);
          if (id === 'sspaziochim' && bt === schede[0]) for (let k = 0; k < 150 && !/Vicinati conservati/.test(el.innerText); k++) await pausa(200);
          v.tele.push([...el.querySelectorAll('canvas')].filter(c => c.offsetParent !== null && c.width > 100 && c.height > 60).length);
          v.sb = Math.max(v.sb, document.documentElement.scrollWidth - document.documentElement.clientWidth);
          v.strano = v.strano || (el.innerText.match(/.{0,20}(\bNaN\b|\bundefined\b|\bInfinity\b).{0,20}/) || [null])[0];
          if (id === 'sspaziochim' && bt === schede[0]) v.mappa = el.innerText.match(/(\d+) molecole[\s\S]*?conservati \(5 vicini\): (\d+) %[\s\S]*?stessa famiglia: (\d+) %/);
          if (id === 'sdeconv' && bt === schede[0]) v.tabella = el.querySelectorAll('.bsiFX-tab tbody tr').length + ' ' + ((el.innerText.match(/R² = ([\d.]+)/) || [])[1] || '');
        }
        o[id] = v;
      }
      /* i comandi cambiano i numeri: nella deconvoluzione, due componenti invece di cinque */
      BSISpectraLive.calcolo.apriSezione('sdeconv'); await pausa(500); const el = document.getElementById('sdeconv'); el.querySelectorAll('.bsiFX-schede button')[0].click(); await pausa(500);
      const cur = el.querySelector('input[type=range]'); cur.value = 2; cur.dispatchEvent(new Event('input')); await pausa(500);
      o.dueComponenti = el.querySelectorAll('.bsiFX-tab tbody tr').length + ' ' + ((el.innerText.match(/R² = ([\d.]+)/) || [])[1] || '');
      /* e i dati dell'utente: due gaussiane incollate */
      const ta = el.querySelector('textarea'); let txt = ''; for (let x = 0; x <= 100; x += 0.5) txt += x + ' ' + (Math.exp(-4 * Math.LN2 * (x - 40) ** 2 / 100) + 0.6 * Math.exp(-4 * Math.LN2 * (x - 62) ** 2 / 144)).toFixed(5) + '\n';
      ta.value = txt; [...el.querySelectorAll('button')].find(q => /miei dati|my data/i.test(q.textContent)).click(); await pausa(700);
      o.miei = [...el.querySelectorAll('.bsiFX-tab tbody tr')].map(tr => tr.children[1].textContent).join(' ');
      return o;
    });
    for (const [id, schede, tele] of [['ssaha', 3, '1,1,1'], ['snubeism', 3, '1,1,0'], ['sdeconv', 2, '2,1'], ['sspaziochim', 3, '1,2,1']]) {
      const v = r[id];
      vero(nome + ' · ' + id + ': nella barra, si apre, ' + schede + ' schede, i grafici ci sono (' + v.tele.join(',') + ')', v.nav && v.aperta === id && v.schede === schede && v.tele.join(',') === tele);
      att(nome + ' · ' + id + ': non sborda e non mostra valori mancanti', '0 null', v.sb + ' ' + v.strano);
    }
    const m = r.sspaziochim.mappa;
    vero(nome + ' · la mappa vera con RDKit: ' + (m ? m[1] + ' molecole, vicinati conservati ' + m[2] + ' %, stessa famiglia ' + m[3] + ' %' : 'non calcolata'), m && +m[1] === 55 && +m[2] >= 60 && +m[3] >= 85);
    vero(nome + ' · deconvoluzione dell\'ammide I: cinque componenti, R² ' + r.sdeconv.tabella.split(' ')[1], /^5 0\.999/.test(r.sdeconv.tabella));
    vero(nome + ' · con due componenti invece di cinque il fit peggiora (R² ' + r.dueComponenti.split(' ')[1] + '): il cursore ricalcola', /^2 /.test(r.dueComponenti) && +r.dueComponenti.split(' ')[1] < 0.999);
    vero(nome + ' · i dati incollati: due picchi ritrovati a ' + r.miei, /^40[.,]0 62[.,]0$/.test(r.miei));
    att(nome + ' · nessun errore JavaScript', 0, errs.length);
    errs.slice(0, 3).forEach(e => console.log('      ! ' + e));
    await ctx.close();
  }
  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
