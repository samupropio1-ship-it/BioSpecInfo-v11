#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   test_medfarm — 🫀 Fisiologia come sistema e 💉 Farmacologia quantitativa
   (v254): i modelli e le pagine

   PERCHE' QUESTO BANCO ESISTE
   Fase 8 del progetto. In medicina un numero sbagliato è peggio di nessun
   numero: qui ogni modello si confronta con la sua forma chiusa, con
   un'integrazione indipendente o con i valori di riferimento dei manuali.
   · Cuore: ciclo stazionario con volumi, frazione di eiezione, gittata e
     pressioni da adulto a riposo; Frank–Starling (più riempimento, più
     gittata); più resistenza, più pressione e meno gittata; conservazione
     del volume (sangue uscito = gittata).
   · Acido–base: pH 7,39 con 40/24; i sei casi classificati come nei manuali,
     con il compenso di Winter e il gap anionico; il misto dei salicilati.
   · Glicemia: il glucosio torna al basale; meno sensibilità, Kg più basso.
   · Gas: PAO2 ≈ 100 mmHg al mare; P50 = 26,8 mmHg; quota standard.
   · Farmacocinetica: due compartimenti chiusi contro l'integrazione, AUC =
     D/CL, Vss; dosi ripetute: Css media, accumulo, 3,3 t½; Hill; quantale;
     Rowland–Matin e le classi FDA.
   Poi le due pagine a 412 e 1280 px.

   USO   node tools/banchi/test_medfarm.js    (serve un server su :8899)
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
  const ctx = { console, Math, Array, Object, isFinite, String, Number, Infinity }; ctx.window = ctx; ctx.globalThis = ctx;
  ctx.BSIFisica = { t: a => a, calcolo: {}, el: () => ({}), sezione() {} }; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(RADICE, 'bsi-med-fisiologia.js'), 'utf8'), ctx);
  vm.runInContext(fs.readFileSync(path.join(RADICE, 'bsi-farm-quantitativa.js'), 'utf8'), ctx);
  const P = ctx.BSIFisica.calcolo.fisiologia, Q = ctx.BSIFisica.calcolo.farmquant;

  console.log('── Il ciclo cardiaco ──');
  const r = P.cicloCardiaco(P.CUORE);
  vero('volumi da adulto a riposo: EDV 120–160 ml (' + r.EDV.toFixed(0) + '), ESV 40–70 (' + r.ESV.toFixed(0) + ')', r.EDV > 120 && r.EDV < 160 && r.ESV > 40 && r.ESV < 70);
  vero('frazione di eiezione 50–70 % (' + (r.FE * 100).toFixed(0) + ' %), gittata 4–7 L/min (' + r.GC.toFixed(1) + ')', r.FE > 0.5 && r.FE < 0.7 && r.GC > 4 && r.GC < 7);
  vero('pressione arteriosa ~110/75 (' + r.Ps.toFixed(0) + '/' + r.Pd.toFixed(0) + ')', r.Ps > 100 && r.Ps < 130 && r.Pd > 60 && r.Pd < 90);
  vicino('il sangue uscito dall\'aorta in un ciclo è la gittata (ml)', r.GS, r.flusso, 0.01);
  vero('lavoro sistolico ~1 J (' + r.lavoroJ.toFixed(2) + ')', r.lavoroJ > 0.6 && r.lavoroJ < 1.4);
  const piu = P.cicloCardiaco(Object.assign({}, P.CUORE, { Pla: 14 })), res = P.cicloCardiaco(Object.assign({}, P.CUORE, { Rp: 1.8 })), con = P.cicloCardiaco(Object.assign({}, P.CUORE, { Emax: 1.2 }));
  vero('Frank–Starling: riempimento 8 → 14 mmHg, la gittata sale (' + r.GS.toFixed(0) + ' → ' + piu.GS.toFixed(0) + ' ml)', piu.GS > r.GS * 1.1);
  vero('resistenza più alta: pressione su, gittata giù', res.Ps > r.Ps + 15 && res.GS < r.GS);
  vero('contrattilità più bassa: frazione di eiezione giù (' + (con.FE * 100).toFixed(0) + ' %)', con.FE < r.FE - 0.1);
  vicino('l\'attivazione ha massimo 1', 1, Math.max(...Array.from({ length: 1001 }, (_, i) => P.attivazione(i / 1000 * 0.857, 0.857))), 1e-3);

  console.log('\n── Acido–base ──');
  vicino('pH con pCO2 40 e HCO3⁻ 24', 7.391, P.pH(24, 40), 1e-4);
  vicino('l\'inversa: HCO3⁻ da pH e pCO2', 24, P.hco3Da(P.pH(24, 40), 40), 1e-12);
  const casi = [[{ pco2: 22, hco3: 10, na: 135, cl: 98 }, /^acidosi metabolica$/, /come atteso/, 27], [{ pco2: 48, hco3: 34, na: 138, cl: 88 }, /^alcalosi metabolica$/, /come atteso/, 16], [{ pco2: 65, hco3: 33, na: 140, cl: 96, cronico: true }, /^acidosi respiratoria$/, /come atteso/, 11], [{ pco2: 28, hco3: 22, na: 140, cl: 106 }, /^alcalosi respiratoria$/, /come atteso/, 12], [{ pco2: 25, hco3: 14, na: 140, cl: 102 }, /acidosi metabolica a gap alto/, /alcalosi respiratoria/, 24], [{ pco2: 30, hco3: 10, na: 140, cl: 110 }, /^acidosi metabolica$/, /con acidosi respiratoria/, 20]];
  casi.forEach(([v, prim, misto, gap], i) => { const a = P.acidoBase(v); vero(['chetoacidosi', 'vomito', 'BPCO cronica', 'iperventilazione', 'salicilati (misto)', 'metabolica con respiratoria'][i] + ': ' + a.primario + ' — ' + a.misto + ', gap ' + a.gap, prim.test(a.primario) && misto.test(a.misto) && a.gap === gap); });
  att('Winter con HCO3⁻ 10: pCO2 attesa 23', 23, P.acidoBase({ pco2: 22, hco3: 10, na: 135, cl: 98 }).atteso.val);

  console.log('\n── Glicemia e gas ──');
  const cv = P.ivgtt(P.BERG), fine = cv[cv.length - 1][1];
  vero('dopo il bolo il glucosio torna verso il basale (' + fine.toFixed(0) + ' mg/dL a 180 min)', Math.abs(fine - P.BERG.Gb) < 15);
  const ir = P.ivgtt(Object.assign({}, P.BERG, { p3: P.BERG.p3 * 0.25 }));
  vero('con un quarto della sensibilità Kg scende (' + P.kg(cv).toFixed(2) + ' → ' + P.kg(ir).toFixed(2) + ' %/min)', P.kg(ir) < P.kg(cv) * 0.75);
  vicino('PAO2 al livello del mare in aria (mmHg)', 99.7, P.pAO2(0.21, 760, 40), 1e-3);
  vicino('P50 di Severinghaus: saturazione 50 % a 26,8 mmHg', 0.5, P.saturazione(26.8), 5e-3);
  vicino('saturazione a 100 mmHg ≈ 97,7 %', 0.9775, P.saturazione(100), 1e-3);
  vicino('atmosfera standard a 5500 m (mmHg)', 378.83, P.pressioneQuota(5500), 3e-3);
  vicino('contenuto di O2 con Hb 15, SaO2 98 %, PaO2 100 (mL/dL)', 20.0, P.contenutoO2(15, 0.98, 100), 2e-3);

  console.log('\n── Farmacocinetica e farmacodinamica ──');
  const p2 = { D: 500, V1: 10, k10: 0.2, k12: 0.5, k21: 0.3 }, d2 = Q.dueCompartimenti(p2), num2 = Q.dueCompartimentiNumerico(p2, 24);
  vicino('C(0) = D/V1', 50, d2.A + d2.B, 1e-12);
  vero('soluzione chiusa contro integrazione: scarto massimo < 0,2 %', num2.every(x => Math.abs(x[1] - d2.C(x[0])) / d2.C(x[0]) < 2e-3));
  vicino('α·β = k21·k10', 0.06, d2.alfa * d2.beta, 1e-9);
  let auc = 0; for (let tt = 0; tt < 400; tt += 0.01) auc += d2.C(tt + 0.005) * 0.01;
  vicino('AUC numerica = D/CL', 250, auc, 1e-4);
  vicino('Vss = V1(1 + k12/k21)', 26.667, d2.Vss, 1e-4);
  const q = { D: 500, tau: 12, V: 40, CL: 4, ka: 1.2, F: 0.8, ndosi: 100 }, I = Q.indiciRipetute(q); let s = 0; for (let tt = 0; tt < 12; tt += 0.001) s += Q.dosiRipetute(q, 600 + tt + 0.0005) * 0.001;
  vicino('Css media orale = F·D/(CL·τ) (mg/L)', 8.3333, s / 12, 1e-3);
  vicino('accumulo endovena: Cmax allo stato stazionario / C0 = R', I.R, Q.dosiRipetute(Object.assign({}, q, { ka: Infinity, F: 1 }), 600) / (500 / 40), 1e-6);
  const q90 = Object.assign({}, q, { ka: Infinity, F: 1 }), t90 = I.t90, lungo = Q.dosiRipetute(q90, 1200 - 1e-9) - 0, n90 = Math.ceil(t90 / 12) * 12;
  vero('dopo 3,3 emivite si è al 90 % dello stato stazionario', Math.abs(1 - Math.exp(-I.k * t90) - 0.9) < 0.002);
  vicino('Hill: a C = EC50 metà effetto', 50, Q.hill(10, { E0: 0, Emax: 100, EC50: 10, n: 2.7 }), 1e-12);
  vicino('erf(1)', 0.8427008, Q.erf(1), 1e-6);
  vicino('ED99 con σ = 0,25: ED50·10^(0,25·2,3263)', 38.158, Q.doseQuantile(0.99, 10, 0.25), 1e-4);
  vicino('midazolam orale con fm 0,94 e [I]/Ki 30: AUC ×', 11.07, Q.rapportoAUC(0.94, 30), 1e-3);
  att('classi FDA: 1,5 debole, 3 moderato, 11 forte', 'debole,moderato,forte', [Q.classeFDA(1.5), Q.classeFDA(3), Q.classeFDA(11)].join(','));
  vicino('inibizione totale: tetto 1/(1 − fm)', 10, Q.rapportoAUC(0.9, 1e12), 1e-6);

  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  for (const [nome, opz] of [['telefono', { viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true }], ['schermo grande', { viewport: { width: 1280, height: 860 } }]]) {
    console.log('\n── Le pagine, ' + nome + ' ──');
    const cx = await b.newContext(Object.assign({ serviceWorkers: 'block' }, opz)), pg = await cx.newPage(), errs = [];
    pg.on('pageerror', e => errs.push(e.message.slice(0, 200)));
    await pg.addInitScript(() => { try { localStorage.setItem('bsi_guide_v3', '1'); } catch (e) {} });
    await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
    await pg.waitForFunction(() => !!(window.BSISpectraLive && window.BSIFisica && BSIFisica.calcolo.fisiologia && BSIFisica.calcolo.farmquant), null, { timeout: 60000 });
    const r2 = await pg.evaluate(async () => {
      const pausa = ms => new Promise(r => setTimeout(r, ms)), out = {};
      for (const id of ['smedfisio', 'sfarmquant']) {
        const o = { tele: [], sb: 0, strano: null, testi: [] }; const x = BSISpectraLive.calcolo.apriSezione(id); await pausa(600); o.aperta = x && x.id; o.nav = !!document.querySelector('.nav-btn[data-s="' + id + '"]');
        const el = document.getElementById(id), schede = [...el.querySelectorAll('.bsiFX-schede button')]; o.schede = schede.length;
        for (const bt of schede) { bt.click(); await pausa(700); o.tele.push([...el.querySelectorAll('canvas')].filter(c => c.offsetParent !== null && c.width > 100 && c.height > 60).length); o.sb = Math.max(o.sb, document.documentElement.scrollWidth - document.documentElement.clientWidth); o.strano = o.strano || (el.innerText.match(/.{0,20}(\bNaN\b|\bundefined\b|Infinity).{0,20}/) || [null])[0]; o.testi.push(el.innerText); }
        o.prudenza = o.testi.every(s => /non sostituisce il medico/i.test(s));
        if (id === 'smedfisio') { schede[1].click(); await pausa(300); const sel = [...el.querySelectorAll('select')].filter(s => s.offsetParent)[0]; sel.value = 'cheto'; sel.dispatchEvent(new Event('change')); await pausa(400); o.cheto = /acidosi metabolica/.test(el.innerText) && /Gap anionico[^\n]*27/.test(el.innerText); }
        out[id] = o;
      }
      return out;
    });
    const f = r2.smedfisio, m = r2.sfarmquant;
    vero(nome + ' · fisiologia: nella barra, si apre, 4 schede con i grafici (' + f.tele.join(',') + ')', f.nav && f.aperta === 'smedfisio' && f.schede === 4 && f.tele.every(n => n >= 1));
    vero(nome + ' · farmacologia: nella barra, si apre, 4 schede con i grafici (' + m.tele.join(',') + ')', m.nav && m.aperta === 'sfarmquant' && m.schede === 4 && m.tele.every(n => n >= 1));
    att(nome + ' · non sbordano e non mostrano valori mancanti', '0 null 0 null', f.sb + ' ' + f.strano + ' ' + m.sb + ' ' + m.strano);
    vero(nome + ' · ogni scheda dice che non sostituisce il medico', f.prudenza && m.prudenza);
    vero(nome + ' · il caso della chetoacidosi: acidosi metabolica, gap 27', f.cheto);
    vero(nome + ' · i numeri scritti: FE, Css media, AUC', /frazione di eiezione \d+ %/.test(f.testi[0]) && /8,3 mg\/L/.test(m.testi[1]) && /AUC = D\/CL = 250 mg·h\/L/.test(m.testi[0]));
    att(nome + ' · nessun errore JavaScript', 0, errs.length); errs.slice(0, 3).forEach(e => console.log('      ! ' + e));
    await cx.close();
  }
  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.stack || e.message); process.exit(1); });
