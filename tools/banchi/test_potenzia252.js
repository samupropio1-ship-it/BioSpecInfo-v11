#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   test_potenzia252 — le tre sezioni nuove della v252, le icone 3D delle
   materie e la testa di Spectra che si muove

   PERCHE' QUESTO BANCO ESISTE
   Richiesta dell'autore (v252): «la testa della sua icona si muova», «le icone
   delle sezioni matematica, chimica e fisica in 3D o comunque molto più
   particolari», e potenziare ancora le sezioni con dati e sezioni nuove:
     σ  Hammett e sostituenti        (chimica organica fisica)
     🌍 Pendolo di Foucault e Coriolis (fisica)
     🌀 Curve nello spazio: Frenet     (matematica)
   I numeri si confrontano con ciò che si può controllare:
   · HAMMETT: pKa dell'acido p-nitrobenzoico 3,42 (sperimentale 3,44) e
     m-clorobenzoico 3,83 (3,83); p-nitrofenolo con σ⁻ 7,16 (7,15); il
     cumile p-metossi ~3500 volte più veloce (Brown e Okamoto); ρ ricavato
     dai pKa veri di dieci acidi benzoici: 1,00 ± 0,05, R² > 0,99.
   · FOUCAULT: un giro a Parigi in 31,8 h, a Milano in 33,6 h, al polo in un
     giorno siderale, mai all'equatore; l'integrazione numerica ruota il piano
     dell'angolo previsto da Ω·sin φ; un corpo che cade da 100 m a 45° devia
     di 1,55 cm verso est.
   · FRENET: elica (κ = 0,8, τ = 0,4), cubica gobba in t = 0 (κ = 2, τ = 3) e
     in t = 1 (κ = 0,16642, τ = 3/19), lunghezza di un giro d'elica 2π√1,25;
     dT/ds = κN verificata; l'interprete delle curve scritte non esegue codice.
   Poi le pagine a 412 e 1280 px (si aprono, disegnano, non sbordano, niente
   NaN), le icone 3D visibili e animate (nella prima stesura una regola di
   stile le rendeva invisibili: qui si guarda l'opacità vera), e la testa che
   si muove, di più quando parla, e sta ferma con «riduci movimento».

   USO   node tools/banchi/test_potenzia252.js    (serve un server su :8899)
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
function vicino(d, atteso, avuto, tol) { const e = Math.abs(avuto - atteso) / Math.max(1e-300, Math.abs(atteso)); if (e <= tol) { ok++; console.log('  ✓ ' + d + '  → ' + (+avuto.toPrecision(6)) + ' (atteso ' + atteso + ')'); } else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + ' ± ' + (tol * 100) + ' %\n      avuto:  ' + avuto); } }

function carica() {
  const ctx = { console, Math, Date, setTimeout, clearTimeout, Array, Object, JSON, isFinite, parseFloat, String, Number, Infinity, Error, RegExp };
  ctx.window = ctx; ctx.globalThis = ctx;
  ctx.BSIFisica = { t: a => a, calcolo: {}, el: () => ({}), sezione() {} };
  vm.createContext(ctx);
  ['bsi-chim-hammett.js', 'bsi-fis-foucault.js', 'bsi-mat-frenet.js'].forEach(f => vm.runInContext(fs.readFileSync(path.join(RADICE, f), 'utf8'), ctx, { filename: f }));
  return ctx.BSIFisica.calcolo;
}

(async () => {
  const C = carica(), H = C.hammett, Fo = C.foucault, Fr = C.frenet;

  console.log('── Hammett, contro le misure ──');
  vicino('pKa dell\'acido p-nitrobenzoico (sperimentale 3,44)', 3.44, H.prevedi('benzoici', 'NO2', 'p').pKa, 0.01);
  vicino('pKa dell\'acido m-clorobenzoico (sperimentale 3,83)', 3.83, H.prevedi('benzoici', 'Cl', 'm').pKa, 0.005);
  vicino('pKa del p-nitrofenolo, con σ⁻ (sperimentale 7,15)', 7.15, H.prevedi('fenoli', 'NO2', 'p').pKa, 0.01);
  vero('e con σ⁻ si usa davvero σ⁻: ' + H.prevedi('fenoli', 'NO2', 'p').usato, H.prevedi('fenoli', 'NO2', 'p').usato === 'σp⁻');
  vicino('cloruro di cumile p-metossi: quante volte più veloce (Brown e Okamoto, ~3360)', 3360, H.prevedi('cumile', 'OMe', 'p').rel, 0.06);
  vero('dove σ⁺ non è tabulato si ripiega su σp e lo si dice', H.prevedi('cumile', 'CHO', 'p').ripiego === true && H.prevedi('cumile', 'CHO', 'p').usato === 'σp');
  vero('in meta si usa σm anche per le reazioni con σ⁺', H.sigma('OMe', 'm', 'σ+').valore === 0.12);
  att('i nomi alternativi si riconoscono (CH3, OCH3, COCH3)', 'Me OMe COMe', ['CH3', 'och3', 'COCH₃'].map(x => (H.trovaSost(x) || {}).sim).join(' '));
  const L = H.leggiDati(H.ESEMPIO, 'pKa', 'σ'), A = H.adatta(L.punti);
  vicino('ρ ricavato dai pKa veri di dieci acidi benzoici (per definizione 1)', 1.0, A.rho, 0.05);
  vero('con R² ' + A.r2.toFixed(4) + ' > 0,99 e dieci punti', A.r2 > 0.99 && A.n === 10);
  const sint = [['p-NO2', 0.78], ['m-Cl', 0.37], ['p-Me', -0.17], ['p-OMe', -0.27], ['H', 0]].map(x => x[0] + ' ' + (2.5 * x[1]).toFixed(4)).join('\n');
  vicino('dati sintetici con ρ = 2,5: ritrovato', 2.5, H.adatta(H.leggiDati(sint, 'log', 'σ').punti).rho, 1e-3);
  const er = H.leggiDati('p-XYZ 3\nciao\nH 4.2\np-NO2 3.4', 'pKa', 'σ');
  vero('righe sbagliate segnalate, non inventate: ' + er.errori.join('; '), er.errori.length === 2 && er.punti.length === 2);
  vero('senza la riga H non si calcola nulla e lo si dice', /manca la riga/.test(H.leggiDati('p-NO2 3.44', 'pKa', 'σ').errori.join()));

  console.log('\n── Foucault e Coriolis, contro le formule ──');
  vicino('Parigi, Panthéon: un giro in 31,8 h', 31.79, Fo.periodoPrecessione(48.846), 0.002);
  vicino('Milano: un giro in 33,6 h', 33.58, Fo.periodoPrecessione(45.46), 0.002);
  vicino('al polo: un giorno siderale', 23.9345, Fo.periodoPrecessione(90), 1e-6);
  att('all\'equatore il piano non ruota', Infinity, Fo.periodoPrecessione(0));
  vicino('15°·sin φ all\'ora a 30°', 7.52, Fo.gradiOra(30), 0.002);
  const I = Fo.integra({ L: 1, lat: 45, accelera: 300, durata: 60, A: 1, ogni: 1 }), ultima = I.punti.filter(p => p.t > I.tempo - 2.006);
  const atteso = -I.Oz * I.tempo * 180 / Math.PI, misurato = Fo.anglePiano(ultima);
  vicino('Runge–Kutta: il piano ruota dell\'angolo previsto da Ω·sin φ (gradi)', atteso, misurato, 0.06);
  vero('in senso orario nell\'emisfero nord, antiorario nel sud', misurato < 0 && Fo.anglePiano(Fo.integra({ L: 1, lat: -45, accelera: 300, durata: 60, A: 1, ogni: 1 }).punti.filter(p => p.t > 57.99)) > 0);
  const E = Fo.integra({ L: 1, lat: 0, accelera: 300, durata: 60, A: 1, ogni: 1 }); vero('all\'equatore resta nel piano di partenza', Math.max.apply(null, E.punti.map(p => Math.abs(p.y))) < 1e-9);
  const en = p => 0.5 * (p[2] * p[2] + p[3] * p[3]) + 0.5 * (9.80665 / 1) * (p[0] * p[0] + p[1] * p[1]);
  vicino('l\'energia si conserva (Coriolis non lavora)', en([1, 0, 0, 0]), en(I.stato), 1e-6);
  vicino('un corpo che cade da 100 m a 45° devia verso est di 1,55 cm', 0.01552, Fo.deviazioneEst(100, 45), 0.002);
  vicino('accelerazione di Coriolis a 300 m/s, 45° (mm/s²)', 30.94, Fo.coriolisOrizzontale(300, 45) * 1000, 0.002);

  console.log('\n── Frenet, contro i valori esatti ──');
  const el = Fr.geometria(Fr.CURVE.elica.r, 1.3); vicino('elica: κ = a/(a²+b²) = 0,8', 0.8, el.k, 1e-6); vicino('elica: τ = b/(a²+b²) = 0,4', 0.4, el.tau, 1e-6);
  const c0 = Fr.geometria(Fr.CURVE.cubica.r, 0); vicino('cubica gobba in 0: κ = 2', 2, c0.k, 1e-6); vicino('cubica gobba in 0: τ = 3', 3, c0.tau, 1e-6);
  const c1 = Fr.geometria(Fr.CURVE.cubica.r, 1); vicino('cubica gobba in 1: κ = √76/14^{3/2}', Math.sqrt(76) / Math.pow(14, 1.5), c1.k, 1e-6); vicino('cubica gobba in 1: τ = 3/19', 3 / 19, c1.tau, 1e-6);
  vicino('lunghezza di un giro d\'elica: 2π√1,25', 2 * Math.PI * Math.sqrt(1.25), Fr.lunghezza(Fr.CURVE.elica.r, 0, 2 * Math.PI), 1e-7);
  const ci = Fr.geometria(Fr.CURVE.cerchio.r, 0.7); vero('cerchio di raggio 2: κ = 0,5 e τ = 0 (curva piana)', Math.abs(ci.k - 0.5) < 1e-6 && Math.abs(ci.tau) < 1e-6);
  const ver = Fr.verificaFrenet(Fr.CURVE.trifoglio.r, 1); vero('Frenet–Serret sul nodo trifoglio: dT/ds = κN e dB/ds = −τN (errori ' + ver.T.toExponential(1) + ', ' + ver.B.toExponential(1) + ')', ver.T < 1e-5 && ver.B < 1e-5);
  const T0 = Fr.geometria(Fr.CURVE.viviani.r, 2); vero('il triedro è ortonormale (Viviani)', [[T0.T, T0.N], [T0.N, T0.B], [T0.T, T0.B]].every(([a, b]) => Math.abs(a[0] * b[0] + a[1] * b[1] + a[2] * b[2]) < 1e-9) && [T0.T, T0.N, T0.B].every(v => Math.abs(Math.hypot(...v) - 1) < 1e-9));
  vicino('una curva scritta: x = cos t, y = sin t, z = t/2 è l\'elica (κ = 0,8)', 0.8, Fr.geometria(Fr.curvaScritta('cos(t)', 'sin(t)', 't/2'), 2).k, 1e-6);
  vicino('l\'interprete: 2sin(t)^2 + 3·cos(pi) in t = 1', 2 * Math.sin(1) ** 2 - 3, Fr.compila('2sin(t)^2 + 3·cos(pi)')(1), 1e-12);
  const rif = ['alert(1)', 'constructor', 't;fetch(1)', 'sin(t'].map(x => { try { Fr.compila(x); return 'accettata'; } catch (e) { return 'rifiutata'; } });
  att('codice e sintassi sbagliata rifiutati', 'rifiutata,rifiutata,rifiutata,rifiutata', rif.join(','));
  const retta = Fr.geometria(Fr.curvaScritta('t', '2t', '3t'), 0.5); vero('su una retta N, B e τ non sono definiti: lo dice', retta.definito === false && retta.N === null && retta.tau === null);

  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  for (const [nome, opz] of [['telefono', { viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true }], ['schermo grande', { viewport: { width: 1280, height: 860 } }]]) {
    console.log('\n── Le pagine, ' + nome + ' ──');
    const ctx = await b.newContext(Object.assign({ serviceWorkers: 'block', reducedMotion: 'no-preference' }, opz)), pg = await ctx.newPage(), errs = [];
    pg.on('pageerror', e => errs.push(e.message.slice(0, 200)));
    pg.on('console', m => { if (m.type() === 'error' && /TypeError|ReferenceError/.test(m.text())) errs.push(m.text().slice(0, 200)); });
    await pg.addInitScript(() => { try { localStorage.setItem('bsi_guide_v3', '1'); } catch (e) {} });
    await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
    await pg.waitForFunction(() => !!(window.BSISpectraLive && window.BSIFisica && BSIFisica.calcolo.hammett && BSIFisica.calcolo.frenet && document.querySelector('.bsi-mat-fab')), null, { timeout: 60000 });
    const r = await pg.evaluate(async () => {
      const pausa = ms => new Promise(r => setTimeout(r, ms)), o = {};
      for (const id of ['shammett', 'sfoucault', 'smatfrenet']) {
        const x = BSISpectraLive.calcolo.apriSezione(id); await pausa(700);
        const el = document.getElementById(id), schede = [...el.querySelectorAll('.bsiFX-schede button')], v = { aperta: x && x.id, schede: schede.length, tele: [], sb: 0, strano: null, nav: !!document.querySelector('.nav-btn[data-s="' + id + '"]') };
        for (const bt of schede) {
          bt.click(); await pausa(700);
          v.tele.push([...el.querySelectorAll('canvas')].filter(c => c.offsetParent !== null && c.width > 100 && c.height > 60).length);
          v.sb = Math.max(v.sb, document.documentElement.scrollWidth - document.documentElement.clientWidth);
          v.strano = v.strano || (el.innerText.match(/.{0,20}(\bNaN\b|\bundefined\b|\bInfinity\b).{0,20}/) || [null])[0];
        }
        o[id] = v;
      }
      /* Hammett: la retta dai dati di esempio, poi una riga sbagliata */
      BSISpectraLive.calcolo.apriSezione('shammett'); await pausa(400); let el = document.getElementById('shammett'); el.querySelectorAll('.bsiFX-schede button')[2].click(); await pausa(500);
      o.rho = (el.innerText.match(/ρ = ([\d.]+)/) || [])[1]; o.r2 = (el.innerText.match(/R² = ([\d.]+)/) || [])[1];
      const ta = el.querySelector('textarea'); ta.value = 'H 4.20\np-NO2 3.44\np-Pippo 3'; [...el.querySelectorAll('button')].find(q => /Ricava/.test(q.textContent)).click(); await pausa(400);
      o.erroreRiga = /non in tabella/.test(el.innerText);
      el.querySelectorAll('.bsiFX-schede button')[0].click(); await pausa(300); o.barre = el.querySelectorAll('.bsiHM-tab tr').length;
      /* Foucault: all'equatore */
      BSISpectraLive.calcolo.apriSezione('sfoucault'); await pausa(400); el = document.getElementById('sfoucault'); el.querySelectorAll('.bsiFX-schede button')[0].click(); await pausa(400);
      const sel = el.querySelector('select'); sel.value = '0'; sel.dispatchEvent(new Event('change')); await pausa(400);
      o.equatore = /all’equatore il piano non ruota/.test(el.innerText);
      /* Frenet: una curva scritta, e la rotazione con il dito */
      BSISpectraLive.calcolo.apriSezione('smatfrenet'); await pausa(400); el = document.getElementById('smatfrenet'); el.querySelectorAll('.bsiFX-schede button')[0].click(); await pausa(400);
      const s2 = el.querySelector('select'); s2.value = 'scritta'; s2.dispatchEvent(new Event('change')); await pausa(300);
      const campi = el.querySelectorAll('input[type=text]'); campi[2].value = 't/3'; campi[2].dispatchEvent(new Event('change')); await pausa(300);
      o.kScritta = (el.innerText.match(/κ = ([\d.]+)/) || [])[1];
      const cv = [...el.querySelectorAll('canvas')].filter(c => c.offsetParent)[0], prima = cv.toDataURL(), rc = cv.getBoundingClientRect();
      cv.dispatchEvent(new PointerEvent('pointerdown', { clientX: rc.left + 50, clientY: rc.top + 50, pointerId: 1, bubbles: true })); cv.dispatchEvent(new PointerEvent('pointermove', { clientX: rc.left + 140, clientY: rc.top + 80, pointerId: 1, bubbles: true })); cv.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, bubbles: true })); await pausa(200);
      o.ruota = cv.toDataURL() !== prima;
      campi[0].value = 'alert(1)'; campi[0].dispatchEvent(new Event('change')); await pausa(300); o.rifiuto = /non conosco «alert»/.test(el.innerText);
      /* le icone delle materie: visibili e animate */
      o.icone = [...document.querySelectorAll('.bsi-mat-fab')].filter(b => b.offsetParent).map(b => { const i = b.querySelector('.ico3d'), cs = i && getComputedStyle(i), r = i && i.getBoundingClientRect(), an = i && [...i.querySelectorAll('*')].map(x => getComputedStyle(x).animationName).filter(a => a && a !== 'none'); return { m: b.dataset.materia, vis: !!i && cs.opacity === '1' && cs.visibility === 'visible' && r.width >= 24, anim: an ? an.length : 0, nome: (b.querySelector('.nome') || {}).textContent }; });
      BSIMaterie.imposta('fisica'); await pausa(600);
      o.icone2 = [...document.querySelectorAll('.bsi-mat-fab')].filter(b => b.offsetParent).map(b => b.dataset.materia + ':' + (b.querySelector('.ico3d') || { className: '' }).className.replace('ico3d ', '')).join(',');
      BSIMaterie.imposta('chimica'); await pausa(400);
      /* la testa */
      const testa = document.querySelector('#bsiJV-fab .bsiVO-ico > *'); o.testa = testa ? getComputedStyle(testa).animationName : 'manca';
      o.riflesso = testa ? getComputedStyle(testa.parentNode, '::after').animationName : 'manca';
      document.dispatchEvent(new CustomEvent('bsi-spectra-dice', { detail: { testo: 'prova' } })); await pausa(50);
      o.parla = document.body.classList.contains('bsiJV-parla') && getComputedStyle(testa).animationName;
      await pausa(1200); o.dopo = document.body.classList.contains('bsiJV-parla');
      return o;
    });
    for (const [id, schede, tele] of [['shammett', 3, '0,1,1'], ['sfoucault', 3, '1,1,1'], ['smatfrenet', 3, '1,1,0']]) {
      const v = r[id];
      vero(nome + ' · ' + id + ': nella barra, si apre, ' + schede + ' schede, i grafici ci sono (' + v.tele.join(',') + ')', v.nav && v.aperta === id && v.schede === schede && v.tele.join(',') === tele);
      att(nome + ' · ' + id + ': non sborda e non mostra valori mancanti', '0 null', v.sb + ' ' + v.strano);
    }
    vero(nome + ' · Hammett: ρ = ' + r.rho + ', R² = ' + r.r2 + ' dai dati di esempio', Math.abs(+r.rho - 1) < 0.05 && +r.r2 > 0.99);
    vero(nome + ' · un sostituente che non esiste è segnalato', r.erroreRiga);
    vero(nome + ' · la tabella delle costanti ha 24 sostituenti (' + (r.barre - 1) + ')', r.barre - 1 === 24);
    vero(nome + ' · Foucault all\'equatore: lo dice', r.equatore);
    vero(nome + ' · Frenet: la curva scritta (cos t, sin t, t/3) ha κ = 0,9 (' + r.kScritta + ')', Math.abs(+r.kScritta - 0.9) < 1e-4);
    vero(nome + ' · trascinando con il dito la curva ruota', r.ruota);
    vero(nome + ' · una formula con codice è rifiutata', r.rifiuto);
    vero(nome + ' · le icone 3D delle materie sono visibili e animate: ' + r.icone.map(x => x.m + ' ' + x.anim + ' animazioni').join(', '), r.icone.length === 2 && r.icone.every(x => x.vis && x.anim >= 1 && x.nome));
    att(nome + ' · in fisica i pulsanti diventano la beuta e la Σ', 'chimica:beuta,matematica:sigma', r.icone2);
    att(nome + ' · la testa di Spectra si muove', 'bsiJVtesta', r.testa);
    att(nome + ' · con un riflesso metallico che le passa sopra', 'bsiJVriflesso', r.riflesso);
    att(nome + ' · quando parla si muove di più', 'bsiJVparla', r.parla);
    att(nome + ' · e quando ha finito torna calma', false, r.dopo);
    att(nome + ' · nessun errore JavaScript', 0, errs.length);
    errs.slice(0, 3).forEach(e => console.log('      ! ' + e));
    await ctx.close();
  }
  /* «riduci movimento»: tutto fermo */
  const ctx = await b.newContext({ serviceWorkers: 'block', reducedMotion: 'reduce', viewport: { width: 412, height: 915 }, isMobile: true }), pg = await ctx.newPage();
  await pg.addInitScript(() => { try { localStorage.setItem('bsi_guide_v3', '1'); } catch (e) {} });
  await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 }); await pg.waitForFunction(() => !!document.querySelector('.bsi-mat-fab .ico3d') && !!document.querySelector('#bsiJV-fab .bsiVO-ico'), null, { timeout: 60000 });
  const ferma = await pg.evaluate(() => ({ testa: getComputedStyle(document.querySelector('#bsiJV-fab .bsiVO-ico > *')).animationName, icone: [...document.querySelectorAll('.bsi-mat-fab .ico3d *')].filter(x => getComputedStyle(x).animationName !== 'none').length, vis: [...document.querySelectorAll('.bsi-mat-fab .ico3d')].every(i => getComputedStyle(i).opacity === '1') }));
  att('con «riduci movimento» la testa sta ferma', 'none', ferma.testa);
  vero('e anche le icone, che restano visibili', ferma.icone === 0 && ferma.vis);
  await ctx.close();
  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
