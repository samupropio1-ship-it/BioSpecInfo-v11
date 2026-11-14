#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   test_spectra_olo — l'ologramma interattivo (bsi-spectra-olointerattivo.js)

   PERCHE' QUESTO BANCO ESISTE
   Richiesta dell'autore: selezionare l'ologramma e interagire; vedere i
   passaggi e il significato dei dati; negli spettri cambiare tipo e vederli
   modificarsi con la traccia scritta; pianeti e universo; matematica e fisica
   che cambiano in tempo reale; tutto spiegato da Spectra, a voce e per iscritto.
   Il banco controlla:
   · in node: le sei molecole con i cinque tipi di spettro; massa molare e
     grado di insaturazione; il multipletto ¹H che si allarga davvero con J/ν₀
     (60 vs 600 MHz); le attribuzioni di una traccia scritta (IR stretta/larga,
     MS con le perdite neutre); i pianeti: periodo di Keplero, vis-viva al
     perielio e all'afelio (Terra 30,29 / 29,29 km/s; rapporto (1+e)/(1−e)),
     gravita' di Marte, velocita' di fuga della Terra;
   · nel browser, a 412 e 1280 px: il pulsante «⛶ Interagisci» sull'ologramma
     apre la finestra; Spectra col corpo ci si sposta; i pulsanti flottanti
     dell'app spariscono; spettri: cambiare tipo e scrivere una traccia ridisegna
     e rifa' i passaggi, toccare un picco sceglie il suo passaggio; universo:
     scegliere Marte; matematica: «studia f(x)=x^3-3x» → zeri ±√3 e 0, punti
     stazionari ±1; fisica: il proiettile (gittata 35,31 m) e il pendolo (2,837 s)
     dall'assistente dell'app; «🔊 Spectra spiega i passaggi» li scorre tutti;
     «🧠 Approfondisci» apre Spiega; chiusa la finestra Spectra torna nella
     sezione; niente sborda; nessun errore JavaScript.

   USO   node tools/banchi/test_spectra_olo.js    (serve un server su :8899)
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';
const path = require('path');
const { chromium } = require('playwright-core');
const BASE = process.env.BSI_URL_BASE || 'http://127.0.0.1:8899/';
const CHROME = process.env.BSI_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
let ok = 0, ko = 0;
function att(d, atteso, avuto) {
  if (String(atteso) === String(avuto)) { ok++; console.log('  ✓ ' + d + '  → ' + avuto); }
  else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + '\n      avuto:  ' + avuto); }
}
function vero(d, c) { att(d, true, !!c); }
function vicino(d, x, y, tol) { vero(d + ' (' + (typeof x === 'number' ? x.toPrecision(6) : x) + ' ≈ ' + y + ')', typeof x === 'number' && Math.abs(x - y) <= tol); }

(async () => {
  console.log('── Spettri e universo (node) ──');
  global.window = undefined; global.document = undefined;
  require(path.join(__dirname, '..', '..', 'bsi-spectra-olointerattivo.js'));
  const I = globalThis.BSIOloInterattivo;
  const mol = Object.keys(I.SPETTRI);
  att('sei molecole di riferimento', 6, mol.length);
  vero('ognuna ha i cinque spettri (IR, ¹H, ¹³C, massa, UV)', mol.every(k => ['ir', 'h1', 'c13', 'ms', 'uv'].every(t => (I.SPETTRI[k][t] || []).length > 0)));
  vicino('massa molare dell\'acetone (g/mol)', I.massa('C3H6O'), 58.08, 0.01);
  att('grado di insaturazione: benzene 4, acetone 1, etanolo 0', '4|1|0', [I.insaturazione('C6H6'), I.insaturazione('C3H6O'), I.insaturazione('C2H6O')].join('|'));
  const w = MHz => { const S = I.spettro('h1', 'etanolo', { MHz }), r = S.righe.filter(x => Math.abs(x[0] - 1.22) < 0.3).map(x => x[0]); return Math.max(...r) - Math.min(...r); };
  vicino('tripletto del CH₃ a 400 MHz: larghezza 2J/ν₀ (ppm)', w(400), 2 * 7 / 400, 1e-9);
  vicino('a 60 MHz il multipletto è 10 volte più largo che a 600 MHz', w(60) / w(600), 10, 1e-9);
  const ir = I.spettro('ir', '1715 s, 2950 m, 3300 br').passi.map(p => p.html);
  vero('traccia IR: 1715 → C=O; 2950 stretta → C–H sp³ (non O–H acido); 3300 larga → O–H', /C=O/.test(ir[0]) && /C–H sp³/.test(ir[1]) && !/O–H/.test(ir[1]) && /O–H/.test(ir[2]));
  const ms = I.spettro('ms', '58 30, 43 100').passi.map(p => p.html);
  vero('traccia MS: 58 → ione molecolare; 43 → M − 15 (CH₃·) e acilio', /ione molecolare/.test(ms[0]) && /M − 15/.test(ms[1]) && /CH₃CO⁺/.test(ms[1]));
  const T = I.pianeta('Terra');
  vicino('Terra: periodo di Keplero (anni)', T.T, 1, 1e-9);
  vicino('Terra: velocità al perielio (km/s, vis-viva)', T.vq, 30.29, 0.02);
  vicino('Terra: velocità all\'afelio (km/s)', T.vQ, 29.29, 0.02);
  const Ma = I.pianeta('Marte');
  vicino('Marte: rapporto perielio/afelio = (1+e)/(1−e)', Ma.vq / Ma.vQ, (1 + 0.0934) / (1 - 0.0934), 1e-9);
  vero('Marte: gravità in superficie ≈ 3,71 m/s²', Ma.passi.some(p => /3,7[01] m\/s²/.test(p.html)));
  vero('Terra: velocità di fuga 11,19 km/s', T.passi.some(p => /11,19 km\/s<\/b>/.test(p.html)));
  vicino('un\'orbita scritta: a = 4 UA → T = 8 anni', I.pianeta({ a: 4, e: 0.5 }).T, 8, 1e-9);

  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  for (const [nome, opz] of [['telefono', { viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true }], ['schermo grande', { viewport: { width: 1280, height: 860 } }]]) {
    console.log('\n── L\'ologramma interattivo, ' + nome + ' ──');
    const ctx = await b.newContext(Object.assign({ serviceWorkers: 'block' }, opz)), pg = await ctx.newPage(), errs = [];
    pg.on('pageerror', e => errs.push(e.message));
    await pg.addInitScript(() => { try { localStorage.setItem('bsi_guide_v3', '1'); } catch (e) {} });
    await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
    await pg.waitForFunction(() => !!window.BSIOloInterattivo, null, { timeout: 60000 });
    await pg.evaluate(() => document.querySelector('[data-s="sareachim"]').click());
    await pg.waitForFunction(() => { const F = window.BSISpectraFigura && BSISpectraFigura.figura; return F && F.spectra.rig && F.spectra.volto; }, null, { timeout: 120000 }).catch(() => {});
    const r = await pg.evaluate(async () => {
      const pausa = ms => new Promise(r => setTimeout(r, ms)), F = BSISpectraFigura.figura, I = BSIOloInterattivo, o = {};
      /* la voce: si registra che cosa dice Spectra e si chiude subito ogni frase */
      const detti = []; const prima = BSISpectraLive.parla; BSISpectraLive.parla = (s, fatto) => { detti.push(s); if (fatto) setTimeout(fatto, 20); return true; };
      I.voceAutomatica(false);   /* qui si provano i comandi uno per uno; la voce automatica si prova sotto */
      F.olo.mostra('spettro'); await pausa(200); const bt = F.box.querySelector('.bsiSF-oi'); o.bottone = !!bt && bt.offsetWidth > 0; bt.click(); await pausa(1800);
      const ov = document.getElementById('bsi-olo-ov'); o.aperto = ov.classList.contains('aperto'); o.modo = I.stato().modo; o.figura = document.getElementById('bsiOI-figura').contains(F.box);
      const fab = document.getElementById('bsi14-fab'); o.fab = fab ? getComputedStyle(fab).display : 'none';
      /* spettri: tipo e traccia */
      const tp = document.getElementById('bsiOI-tipo'); tp.value = 'ir'; tp.onchange(); await pausa(200); o.ir = I.stato().passi.length;
      const tr = document.getElementById('bsiOI-traccia'); tr.value = '1715 s, 2950 m'; tr.oninput(); await pausa(200); o.traccia = I.stato().passi.join(' | ');
      tp.value = 'ms'; tp.onchange(); tr.value = '58 30, 43 100'; tr.oninput(); await pausa(200); o.ms = I.stato().passi.length;
      /* tocco su un picco: il suo passaggio */
      const cv = document.getElementById('bsiOI-2d'), rc = cv.getBoundingClientRect(), S = I.stato().dati.S; const m = { l: 56, r: 18 }, pw = rc.width - m.l - m.r, xp = m.l + pw * (43 - S.assi.x[0]) / (S.assi.x[1] - S.assi.x[0]);
      cv.dispatchEvent(new MouseEvent('click', { clientX: rc.left + xp, clientY: rc.top + 40, bubbles: true })); await pausa(200); o.tocco = I.stato().passi[I.stato().sel]; o.detto = detti[detti.length - 1] || '';
      /* universo: Marte */
      I.modo('universo'); await pausa(600); const pia = document.getElementById('bsiOI-pia'); pia.value = 'Marte'; pia.onchange(); await pausa(400); o.marte = I.stato().dati.P.nome + ' ' + I.stato().passi.length;
      o.canvas3d = !!document.getElementById('bsiOI-3d') && document.getElementById('bsiOI-3d').style.display !== 'none';
      /* matematica */
      I.modo('matematica', 'studia f(x)=x^3-3x'); await pausa(500); const v = I.stato().dati.vis; o.mat = v && v.tipo + ' ' + v.zeri.map(z => z.toFixed(3)).join(',') + ' ' + v.crit.map(z => z.toFixed(3)).join(','); o.matPassi = I.stato().passi.length;
      /* fisica */
      I.modo('fisica', 'un proiettile lanciato a 20 m/s con un angolo di 30°'); await pausa(400); const vp = I.stato().dati.vis; o.proj = vp && vp.tipo + ' ' + vp.R.toFixed(2);
      I.modo('fisica', 'pendolo lungo 2 m: periodo'); await pausa(400); const vd = I.stato().dati.vis; o.pend = vd && vd.tipo + ' ' + vd.T.toFixed(3);
      /* la voce: tutti i passaggi in ordine */
      detti.length = 0; document.getElementById('bsiOI-voce').click(); for (let k = 0; k < 60 && detti.length < I.stato().passi.length; k++) await pausa(100); await pausa(300);
      o.voce = detti.length + '/' + I.stato().passi.length;
      o.sborda = document.documentElement.scrollWidth - document.documentElement.clientWidth;
      /* (v248) sul telefono tutta la finestra scorre: i passaggi si leggono per intero, sopra i tasti del telefono */
      if (innerWidth < 820) { const sc0 = ov.scrollTop; ov.scrollTop = 99999; await pausa(150); const ul = document.querySelector('#bsiOI-passi .p:last-child').getBoundingClientRect();
        o.scorre = { alta: ov.scrollHeight > ov.clientHeight + 100, ultimo: Math.round(innerHeight - ul.bottom), sceso: ov.scrollTop > 100, testa: Math.round(document.getElementById('bsiOI-testa').getBoundingClientRect().top), font: parseFloat(getComputedStyle(document.querySelector('#bsiOI-passi .p')).fontSize) }; ov.scrollTop = sc0; }
      /* (v248) «🔔 Prova audio»: un bip e una frase, con la spiegazione */
      const provati = []; const ascolta = e => provati.push(e.detail && e.detail.testo || ''); document.addEventListener('bsi-spectra-dice', ascolta); document.getElementById('bsiOI-bip').click(); await pausa(1300); document.removeEventListener('bsi-spectra-dice', ascolta); BSISpectraLive.taci(); o.bip = { nota: document.getElementById('bsiOI-audio').textContent, frase: provati.join(' ') };
      /* (v248) «🗂️ Tutta l'app»: ogni sezione, scelta da chi usa l'app */
      { const prima = (BSISpectraLive.schermo() || {}).sezione; I.modo('app'); await pausa(400);
        const nav = new Set([...document.querySelectorAll('.nav-group-panel [data-s]')].map(x => x.getAttribute('data-s'))).size, opz = document.querySelectorAll('#bsiOI-asez option').length;
        const cerca = document.getElementById('bsiOI-acerca'), sel = document.getElementById('bsiOI-asez');
        const mat = document.getElementById('bsiOI-amat'); mat.value = 'fisica'; mat.onchange(); const fis = sel.options.length; mat.value = ''; mat.onchange();
        cerca.value = 'GHS'; cerca.oninput(); const trovate = sel.options.length; sel.selectedIndex = 0; sel.onchange(); await pausa(2300);
        const osp = document.getElementById('bsiOI-ospite'), pt = document.getElementById('sghs'), cella = pt && pt.querySelector('[onclick], .el, .pt-el, td, button');
        o.app = { nav, opz, fis, trovate, ospitata: !!pt && osp.contains(pt) && pt.offsetParent !== null, alta: Math.round(osp.getBoundingClientRect().height), passi: I.stato().passi.length };
        cerca.value = 'sistema solare 3d'; cerca.oninput(); sel.selectedIndex = 0; sel.onchange(); await pausa(3200);
        o.app.tornata = !!pt && !osp.contains(pt) && !!pt.parentNode && pt.parentNode.id !== 'bsiOI-ospite'; o.app.vivo = !!I.stato().dati.vivo; o.app.sez = (BSISpectraLive.schermo() || {}).sezione; o.app.passiSole = I.stato().passi.length;
        /* le voci del menu ✨: una pagina (Astrochimica 3D) si apre dentro il riquadro */
        const cat = I.catalogo(); o.app.menu = cat.filter(x => x.menu).length; o.app.pagine = cat.filter(x => x.pagina).length; o.app.nomi = cat.filter(x => x.menu).map(x => x.nome).join(' | ');
        o.app.centro = cat.some(x => x.id === 'scentrospettri');
        cerca.value = 'astrochimica'; cerca.oninput(); sel.value = 'menu:astro'; sel.onchange();
        for (let k = 0; k < 60; k++) { await pausa(150); const fr = document.getElementById('bsiOI-pagina'); if (fr && fr.contentDocument && fr.contentDocument.body && fr.contentDocument.body.textContent.length > 200) break; }
        const fr = document.getElementById('bsiOI-pagina'); o.app.astro = !!fr && fr.getBoundingClientRect().height > 250 && /Astro/i.test(fr.contentDocument.title || '');
        o.app.foglio = !!(document.getElementById('bsi14-sheet') && document.getElementById('bsi14-sheet').classList.contains('open'));
        I.modo('spettri'); await pausa(300); o.app.prima = prima; o.app.paginaTolta = !document.getElementById('bsiOI-pagina'); }
      /* (v242) la voce automatica: scritta una traccia, Spectra la spiega da sola, senza toccare «🔊» */
      I.voceAutomatica(true); I.modo('spettri'); await pausa(300); detti.length = 0;
      const tr2 = document.getElementById('bsiOI-traccia'); tr2.value = '1700 s'; tr2.oninput(); for (let k = 0; k < 40 && !detti.length; k++) await pausa(100);
      o.auto = detti.length > 0 && /1700/.test(detti.join(' ')); I.voceAutomatica(false); await pausa(200);
      /* approfondisci → Spiega; chiusa la finestra, Spectra torna */
      document.getElementById('bsiOI-ai').click(); await pausa(1200); o.spiega = document.getElementById('bsi-hub-ov').classList.contains('open') && !ov.classList.contains('aperto');
      document.getElementById('bsi-hub-close').click(); await pausa(1500); o.torna = !!F.box.closest('.section'); o.finale = (BSISpectraLive.schermo() || {}).sezione;
      /* (v248) una FINESTRA del menu ✨ (Lab Quantistico): «↗ Apri la sezione» chiude l'ologramma e la apre */
      I.apri('app'); await pausa(500); { const c2 = document.getElementById('bsiOI-acerca'), s2 = document.getElementById('bsiOI-asez'); c2.value = 'lab quantistico'; c2.oninput(); s2.value = 'menu:qlab'; s2.onchange(); await pausa(300);
        o.qlabPassi = I.stato().passi.length; document.getElementById('bsiOI-avai').click(); await pausa(1500);
        o.qlab = !I.stato().aperto && [...document.querySelectorAll('iframe')].some(f => f.getAttribute('srcdoc') && f.offsetParent !== null && f.getBoundingClientRect().height > 200); }

      /* (v242) un tocco SULL'OLOGRAMMA (il pannello alla destra di Spectra) lo apre interattivo */
      F.box.scrollIntoView({ block: 'center' }); await pausa(400); const cvF = F.box.querySelector('canvas'), pt = F.puntoOlogramma();
      const ev = (tipo) => cvF.dispatchEvent(new PointerEvent(tipo, { clientX: pt.x, clientY: pt.y, bubbles: true, pointerId: 1 }));
      ev('pointerdown'); ev('pointerup'); await pausa(900); o.toccoOlo = ov.classList.contains('aperto'); I.chiudi(); await pausa(600);
      /* (v242) «🧠 Spiega» senza chiave: risponde comunque a cio' che si chiede (lo svolgimento dell'assistente locale) e lo dice a voce */
      const ll = window.bsiLLM, pv = ll && ll.provider; if (ll) ll.provider = () => null; detti.length = 0;
      await BSISpiega.chiedi('calcola il pH di una soluzione di HCl 0,01 M'); await pausa(300);
      const carta = document.querySelector('#bsiSP-out .risposta'); o.spiegaLocale = carta ? carta.querySelectorAll('h3').length : 0; o.spiegaVoce = detti.join(' ').slice(0, 160);
      if (ll) ll.provider = pv;
      BSISpectraLive.parla = prima; return o;
    });
    vero('il pulsante «⛶ Interagisci» c\'è sull\'ologramma e apre la finestra, in «spettri» (perché l\'ologramma mostrava uno spettro)', r.bottone && r.aperto && r.modo === 'spettri');
    vero('Spectra col corpo si sposta nella finestra interattiva', r.figura);
    att('i pulsanti flottanti dell\'app spariscono', 'none', r.fab);
    vero('cambiando tipo (IR) e scrivendo una traccia, lo spettro e i passaggi si rifanno (' + r.traccia + ')', r.ir >= 5 && /1715 cm⁻¹/.test(r.traccia) && /2950 cm⁻¹/.test(r.traccia));
    vero('traccia di massa: due picchi, due passaggi (' + r.ms + ')', r.ms === 2);
    vero('toccando il picco 43 si sceglie il suo passaggio e Spectra lo dice (' + r.tocco + ')', /m\/z 43/.test(r.tocco || '') && /m\/z 43/.test(r.detto));
    vero('universo: Marte con i suoi passaggi, nella scena 3D (' + r.marte + ')', /^Marte 6$/.test(r.marte) && r.canvas3d);
    att('matematica: zeri −√3, 0, √3 e punti stazionari ±1', 'funzione -1.732,0.000,1.732 -1.000,1.000', r.mat);
    vero('matematica: i passaggi dell\'assistente (' + r.matPassi + ')', r.matPassi >= 8);
    att('fisica: la traiettoria del proiettile, gittata 35,31 m', 'proiettile 35.31', r.proj);
    att('fisica: il pendolo da 2 m, periodo 2,837 s', 'pendolo 2.837', r.pend);
    vero('«🔊 Spectra spiega i passaggi»: li dice tutti (' + r.voce + ')', r.voce.split('/')[0] === r.voce.split('/')[1] && +r.voce.split('/')[0] > 3);
    if (nome === 'telefono') att('a 412 px niente sborda', 0, r.sborda);
    vero('«🧠 Approfondisci» apre Spiega', r.spiega);
    vero('chiuse le finestre, Spectra torna nella sezione', r.torna);
    att('e l\'app è di nuovo nella sezione da cui si era partiti', 'sareachim', r.finale);
    vero('una finestra del menu ✨ (Lab Quantistico): «↗ Apri la sezione» chiude l\'ologramma e la apre', r.qlabPassi === 2 && r.qlab);
    if (nome === 'telefono') vero('sul telefono la finestra scorre fino in fondo: l\'ultimo passaggio sta ' + r.scorre.ultimo + ' px sopra il bordo (tasti di Android), la testata resta in alto, caratteri da ' + r.scorre.font + ' px', r.scorre.alta && r.scorre.sceso && r.scorre.ultimo >= 70 && r.scorre.testa === 0 && r.scorre.font >= 15);
    vero('«🔔 Prova audio»: bip, frase di prova e che cosa fare se non si sente (' + r.bip.frase.slice(0, 40) + '…)', /muto/.test(r.bip.nota) && /Multimedia|multimediali/.test(r.bip.nota) && /voce di Spectra/.test(r.bip.frase));
    vero('«🗂️ Tutta l\'app»: l\'elenco ha tutte le sezioni della barra più le 19 voci del menu ✨ (' + r.app.opz + ' = ' + r.app.nav + ' + 19), filtrabili per materia (Fisica: ' + r.app.fis + ') e per nome (' + r.app.trovate + ' per «GHS»)', r.app.opz === r.app.nav + 19 && r.app.nav > 150 && r.app.fis > 20 && r.app.fis < r.app.opz && r.app.trovate >= 1);
    vero('una sezione senza grafici (GHS; dalla v255 la Tavola Periodica è in 3D e si vede dal vivo) è ospitata davvero nel riquadro, viva e alta ' + r.app.alta + ' px, con i suoi passaggi (' + r.app.passi + ')', r.app.ospitata && r.app.alta > 250 && r.app.passi >= 1);
    vero('scelta un\'altra sezione, la sezione ospitata torna al suo posto e «Sistema solare 3D» si vede dal vivo con la sua lezione (' + r.app.passiSole + ' passaggi)', r.app.tornata && r.app.vivo && r.app.sez === 'sastrosole' && r.app.passiSole >= 3);
    vero('ci sono anche i laboratori e gli strumenti del menu ✨ (' + r.app.menu + ' voci, ' + r.app.pagine + ' pagine: Astrochimica, Lab Quantistico, Accademia…) e il Centro spettri', r.app.menu === 19 && r.app.pagine === 8 && /Astrochimica/.test(r.app.nomi) && /Lab Quantistico/.test(r.app.nomi) && /Glossario/.test(r.app.nomi) && r.app.centro && !r.app.foglio);
    vero('«Astrochimica 3D PRO» si apre dentro il riquadro, vera (la sua pagina), e cambiando modo si toglie', r.app.astro && r.app.paginaTolta);
    vero('Spectra spiega da sola, a voce, la traccia appena scritta (voce automatica)', r.auto);
    vero('un tocco sull\'ologramma stesso lo apre interattivo', r.toccoOlo);
    vero('«🧠 Spiega» senza chiave: lo svolgimento locale per intero (' + r.spiegaLocale + ' passaggi) e detto a voce (' + r.spiegaVoce.slice(0, 60) + '…)', r.spiegaLocale >= 2 && /pH/i.test(r.spiegaVoce));
    att(nome + ': nessun errore JavaScript', 0, errs.length);
    errs.slice(0, 3).forEach(e => console.log('      ! ' + e.slice(0, 200)));
    await ctx.close();
  }
  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
