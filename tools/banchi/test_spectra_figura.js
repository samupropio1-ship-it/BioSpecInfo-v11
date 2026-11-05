#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   test_spectra_figura — Spectra col corpo nelle sezioni dell'AI (bsi-spectra-figura.js)

   PERCHE' QUESTO BANCO ESISTE
   Richiesta dell'autore: l'icona di Spectra solo col volto e, in ogni sezione
   dell'AI (Spectra AI e le tre aree con l'assistente), Spectra COL CORPO: quello
   scelto da lui (cappuccio, viso «Noir»), «e non altro». Il banco controlla, a
   412 e 1280 px, che:
   · il pulsante flottante sia solo il volto (la pillola «Spectra» nascosta);
   · in ognuna delle quattro sezioni la figura compaia DENTRO la sezione, sotto il
     titolo e la descrizione, e che ci sia una figura sola (un contesto WebGL);
   · niente spazio vuoto sopra la sezione (le sezioni fuori da #main);
   · senza il corpo sul dispositivo compaia l'invito a caricarlo e nessun sostituto;
   · caricato il corpo (qui un umanoide sintetico, senza scheletro, con cappuccio)
     l'invito sparisca, il viso si appoggi sul collo e si veda solo il viso;
   · la figura reagisca all'app: «pensa» quando il modello lavora, «parla»
     (labiale, gesto, emozione) quando arriva la risposta, quando Spectra Live
     parla e quando l'assistente locale risolve un esercizio;
   · sul telefono i suoi pulsanti non si sovrappongano a quelli flottanti;
   · l'OLOGRAMMA alla destra di Spectra: sei scene vive (i pianeti seguono
     Keplero), il soggetto che segue il discorso, l'etichetta che apre la
     sezione, lo schermo vivo della sezione aperta dietro la finestra Spiega;
   · il CATALOGO: tutte le sezioni della barra mostrabili e spiegabili, una
     domanda che nomina un argomento apre la sua sezione, le sezioni senza
     grafici proiettate come scheda, il giro di tutte le sezioni di una materia;
   · «🧠 SPIEGA», l'AI che spiega tutto in modo esaustivo, ci sia nella finestra
     di Spectra: seconda scheda, Spectra col corpo che spiega, la lettura dello
     schermo (uno spettro NMR e una scena 3D: testo, valori e immagine) che arriva
     al modello, la struttura obbligatoria, i livelli fino al PhD avanzato, la
     conversazione che continua, e senza modello nessuna finzione;
   · nessun errore JavaScript.

   USO   node tools/banchi/test_spectra_figura.js    (serve un server su :8899)
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';
const { chromium } = require('playwright-core');
const BASE = process.env.BSI_URL_BASE || 'http://127.0.0.1:8899/';
const CHROME = process.env.BSI_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
let ok = 0, ko = 0;
function att(d, atteso, avuto) {
  if (String(atteso) === String(avuto)) { ok++; console.log('  ✓ ' + d + '  → ' + avuto); }
  else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + '\n      avuto:  ' + avuto); }
}
function vero(d, c) { att(d, true, !!c); }

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  for (const [nome, opz] of [['telefono', { viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true }], ['schermo grande', { viewport: { width: 1280, height: 860 } }]]) {
    console.log('\n── Le sezioni dell\'AI, ' + nome + ' ──');
    const ctx = await b.newContext(Object.assign({ serviceWorkers: 'block' }, opz)), pg = await ctx.newPage(), errs = [];
    pg.on('pageerror', e => errs.push(e.message));
    await pg.addInitScript(() => { try { localStorage.setItem('bsi_guide_v3', '1'); } catch (e) {} });
    await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
    await pg.waitForFunction(() => !!window.BSISpectraFigura, null, { timeout: 60000 });
    await pg.waitForTimeout(2500);
    const fab = await pg.evaluate(() => { const v = s => { const e = document.querySelector(s); if (!e) return false; const c = getComputedStyle(e); return c.display !== 'none' && c.visibility !== 'hidden' && e.getBoundingClientRect().width > 0; }; return { volto: v('#bsiJV-fab'), pillola: v('#bsi-spectra-fab') }; });
    vero('il pulsante di Spectra è solo il volto (pillola nascosta)', fab.volto && !fab.pillola);
    for (const id of ['sareachim', 'sareafis', 'sareamat', 'sai']) {
      await pg.evaluate(id => document.querySelector('[data-s="' + id + '"]').click(), id);
      await pg.waitForFunction(id => { const F = window.BSISpectraFigura && BSISpectraFigura.figura; return F && document.getElementById(id).contains(F.box); }, id, { timeout: 90000 }).catch(() => {});
      await pg.waitForTimeout(400);
      const r = await pg.evaluate(id => {
        const s = document.getElementById(id), F = BSISpectraFigura.figura, q = s.querySelector('.bsiFX') || s;
        const tit = q.querySelector(':scope > .section-title'), tb = tit ? tit.getBoundingClientRect() : null, fb = F ? F.box.getBoundingClientRect() : null;
        const m = document.getElementById('main'), primo = s.getBoundingClientRect().top + scrollY - (m.getBoundingClientRect().top + scrollY);
        return { dentro: !!F && s.contains(F.box), sotto: !!(tb && fb && fb.top >= tb.bottom - 1), tele: document.querySelectorAll('.bsiSF').length, alto: fb ? Math.round(fb.height) : 0, vuoto: Math.round(primo - m.offsetHeight) , mainH: m.offsetHeight, fuori: s.parentNode === document.body };
      }, id);
      vero(id + ': la figura è dentro la sezione, sotto il titolo (' + r.alto + ' px)', r.dentro && r.sotto && r.alto >= 280);
      att(id + ': una figura sola in tutta l\'app', 1, r.tele);
      if (r.fuori) vero(id + ': nessuno spazio vuoto sopra la sezione (#main ' + r.mainH + ' px)', r.mainH <= 12);
    }
    /* IL CORPO E' SEMPRE PRESENTE: incorporato nell'app, nessuno deve caricarlo */
    await pg.evaluate(() => BSISpectraFigura.figura.box.scrollIntoView({ block: 'center' }));
    await pg.waitForFunction(() => { const S = BSISpectraFigura.figura.spectra; return S.rig && S.volto; }, null, { timeout: 120000 }).catch(() => {});
    const sempre = await pg.evaluate(() => { const F = BSISpectraFigura.figura, i = F.box.querySelector('.bsiSF-invito'); return { rig: !!F.spectra.rig, ossa: F.spectra.modelloRiggato && F.spectra.modelloRiggato.ossa, invito: !!i && !i.hidden, pulsanti: [...F.box.querySelectorAll('.bsiSF-az > *')].map(b => b.textContent.trim()), file: !!F.box.querySelector('input[type=file]') }; });
    vero('il corpo di Spectra c\'è sempre, senza caricarlo: incorporato nell\'app (ossa ' + sempre.ossa + ')', sempre.rig && !sempre.invito);
    vero('nessun pulsante «Corpo» né scelta di file (' + sempre.pulsanti.join(', ') + ')', !sempre.file && !sempre.pulsanti.some(x => /Corpo|Body/.test(x)));
    /* la figura si disegna (e si allinea) solo quando si vede: la si porta in vista */
    await pg.evaluate(() => BSISpectraFigura.figura.box.scrollIntoView({ block: 'center' }));
    await pg.waitForFunction(() => { const S = BSISpectraFigura.figura.spectra; return S.volto && S.allinea === 0; }, null, { timeout: 90000 }).catch(() => {});
    /* l'allineamento del viso si fa nei primi fotogrammi: si misura a regime */
    await pg.waitForFunction(() => { const S = BSISpectraFigura.figura.spectra, T = THREE; if (!S.volto) return false; S.radice.updateMatrixWorld(true); const bb = new T.Box3().setFromObject(S.volto.parti.Object_2), rif = S.corpo.ossa.collo.getWorldPosition(new T.Vector3()); return Math.abs(bb.min.y - rif.y - 0.045) < 0.03; }, null, { timeout: 8000 }).catch(() => {});
    const con = await pg.evaluate(() => { const F = BSISpectraFigura.figura, S = F.spectra, T = THREE; S.radice.updateMatrixWorld(true);
      const bb = new T.Box3().setFromObject(S.volto.parti.Object_2), rif = S.corpo.ossa.collo.getWorldPosition(new T.Vector3()).add(new T.Vector3(0, 0.045, 0));
      return { invito: F.box.querySelector('.bsiSF-invito').hidden, mento: bb.min.y - rif.y, viso: Object.keys(S.volto.parti).filter(q => S.volto.parti[q].isMesh && S.volto.parti[q].visible).join(',') }; });
    vero('caricato il corpo: l\'invito sparisce', con.invito);
    vero('il viso «Noir» poggia sul colletto (' + (con.mento * 100).toFixed(1) + ' cm)', Math.abs(con.mento) < 0.03);
    att('della testa si vede solo il viso', 'Object_2,Object_3,Object_4', con.viso);
    const hud = () => pg.evaluate(() => BSISpectraFigura.figura.box.querySelector('.bsiSF-hud b').textContent);
    await pg.evaluate(() => document.dispatchEvent(new CustomEvent('bsi-spectra-stato', { detail: { stato: 'pensa' } }))); await pg.waitForTimeout(300);
    const pensa = await pg.evaluate(() => { const C = BSISpectraFigura.figura.spectra.corpo; return { gesto: C.gesto, emo: C.emo }; });
    vero('il modello lavora → Spectra pensa (mano al mento, concentrata; «' + await hud() + '»)', pensa.gesto === 'pensa' && pensa.emo === 'concentrata');
    await pg.evaluate(() => document.dispatchEvent(new CustomEvent('bsi-spectra-risposta', { detail: { testo: 'Ottimo! Il pH vale 3,4: ecco perché.' } }))); await pg.waitForTimeout(500);
    const parla = await pg.evaluate(() => { const S = BSISpectraFigura.figura.spectra; return { gesto: S.corpo.gesto, emo: S.corpo.emo, testo: !!S.corpo.testo, viso: !!S.volto.testo }; });
    vero('arriva la risposta → indica l\'ologramma, gioia, labiale su corpo e viso (' + await hud() + ')', parla.gesto === 'indica' && parla.emo === 'gioia' && parla.testo && parla.viso);
    await pg.waitForTimeout(2900);
    att('poi accompagna la spiegazione con le mani', 'spiega', await pg.evaluate(() => BSISpectraFigura.figura.spectra.corpo.gesto));
    await pg.evaluate(() => document.dispatchEvent(new CustomEvent('bsi-spectra-risposta', { detail: { errore: true } }))); await pg.waitForTimeout(200);
    att('una risposta mancata → dubbio', 'dubbio', await pg.evaluate(() => BSISpectraFigura.figura.spectra.corpo.emo));
    const live = await pg.evaluate(() => { const S = BSISpectraFigura.figura.spectra; S.taci(); if (!window.BSISpectraLive) return null; BSISpectraLive.parla('Ciao, sono Spectra.'); const r = !!S.corpo.testo; BSISpectraLive.taci(); return r; });
    if (live !== null) vero('quando Spectra Live parla, la figura parla con lei', live);
    await pg.evaluate(() => document.querySelector('[data-s="sareamat"]').click()); await pg.waitForTimeout(900);
    const ass = await pg.evaluate(() => { const S = BSISpectraFigura.figura.spectra; S.taci(); const s = document.getElementById('sareamat'), ta = s.querySelector('textarea'), bt = [...s.querySelectorAll('button')].find(b => /Risolvi|Solve|Invia|Rispondi/i.test(b.textContent)); if (!ta || !bt) return { manca: true }; ta.value = 'deriva x^2'; bt.click(); return { testo: S.corpo.testo, emo: S.corpo.emo }; });
    if (!ass.manca) vero('l\'assistente locale risolve un esercizio → Spectra lo spiega («' + String(ass.testo).slice(0, 40) + '…»)', /svolgimento|working/i.test(ass.testo) && ass.emo === 'sorrisoCaldo');
    if (nome === 'telefono') {
      const sov = await pg.evaluate(() => { const F = BSISpectraFigura.figura; F.box.scrollIntoView({ block: 'center' }); const bs = [...F.box.querySelectorAll('.bsiSF-az > *')].map(e => e.getBoundingClientRect());
        const fl = [...document.querySelectorAll('body *')].filter(e => { const c = getComputedStyle(e); return c.position === 'fixed' && e.offsetWidth > 30 && e.offsetWidth < 90 && e.offsetHeight > 30 && c.visibility !== 'hidden' && c.display !== 'none'; }).map(e => e.getBoundingClientRect());
        let n = 0; bs.forEach(a => fl.forEach(c => { if (a.left < c.right && a.right > c.left && a.top < c.bottom && a.bottom > c.top) n++; })); return n; });
      att('i pulsanti della figura non finiscono sotto quelli flottanti', 0, sov);
    }
    /* LA CONSOLE SPECTRA LIVE: al posto del busto, Spectra col corpo e l'ologramma */
    const cons = await pg.evaluate(async () => {
      const pausa = ms => new Promise(r => setTimeout(r, ms)), F = BSISpectraFigura.figura, da = F.box.parentNode && F.box.closest('[id]').id;
      BSISpectraLive.apri({ briefing: false }); await pausa(1500);
      const v = document.getElementById('bsiJV-volto'), o = { dentro: !!document.getElementById('bsiJV-figura') && document.getElementById('bsiJV-figura').contains(F.box), busto: v ? getComputedStyle(v).display : 'none', vista: F.box.getBoundingClientRect().height > 150 };
      document.dispatchEvent(new CustomEvent('bsi-spectra-stato', { detail: { stato: 'pensa' } })); await pausa(200); o.pensa = F.spectra.corpo.gesto;
      BSISpectraLive.chiudi(); await pausa(1500); o.torna = F.box.closest('.section') ? F.box.closest('.section').id : null; o.da = da;
      return o;
    });
    vero('nella console Spectra Live c\'è Spectra col corpo (e l\'ologramma) al posto del busto', cons.dentro && cons.busto === 'none' && cons.vista);
    att('la figura segue lo stato della console (elabora → mano al mento)', 'pensa', cons.pensa);
    vero('chiusa la console, Spectra torna nella sezione (' + cons.torna + ')', !!cons.torna);
    /* L'OLOGRAMMA alla destra di Spectra: le scene vive delle sezioni */
    const ol = await pg.evaluate(async () => {
      const pausa = ms => new Promise(r => setTimeout(r, ms)), F = BSISpectraFigura.figura, O = F.olo, T = THREE, o = {};
      F.box.scrollIntoView({ block: 'center' }); await pausa(300);
      const pS = F.spectra.radice.getWorldPosition(new T.Vector3()).project(F.cam), pO = O.grp.getWorldPosition(new T.Vector3()).project(F.cam);
      o.destra = pO.x > pS.x + 0.3 && pO.x < 1; o.xs = [pS.x.toFixed(2), pO.x.toFixed(2)];
      o.scene = []; for (const k of ['pianeti', 'molecola', 'spettro', 'superficie', 'orbitale', 'onda']) { O.auto = false; O.mostra(k); await pausa(250); const g = O.scene[k]; o.scene.push(k + ':' + (g.visible && g.children.length > 0 ? 'ok' : 'no')); }
      /* Keplero: il pianeta piu' eccentrico e' piu' veloce al perielio che all'afelio */
      O.mostra('pianeti'); const q = O.scene.pianeti.userData.U.p[3], U = O.scene.pianeti.userData.U, v = t => { U.passo(t); const a = q.pl.position.clone(); U.passo(t + 0.01); return { r: a.length(), v: q.pl.position.distanceTo(a) / 0.01 }; };
      let peri = null, afe = null; for (let t = 0; t < q.T; t += q.T / 200) { const x = v(t); if (!peri || x.r < peri.r) peri = x; if (!afe || x.r > afe.r) afe = x; }
      o.kepler = { vp: peri.v, va: afe.v, atteso: (1 + q.e) / (1 - q.e) };
      /* il soggetto segue il discorso */
      O.auto = true; document.dispatchEvent(new CustomEvent('bsi-spectra-risposta', { detail: { testo: 'Lo spettro IR mostra una banda a 1715 cm⁻¹.' } })); await pausa(200); o.tema = O.attuale;
      document.dispatchEvent(new CustomEvent('bsi-spectra-tema', { detail: { testo: 'perché i pianeti seguono orbite ellittiche?' } })); await pausa(200); o.tema2 = O.attuale;
      o.etichetta = F.box.querySelector('.bsiSF-olo').textContent;
      return o;
    });
    vero('l\'ologramma sta alla destra di Spectra (x sullo schermo ' + ol.xs.join(' → ') + ')', ol.destra);
    att('sei scene vive: pianeti, molecola, spettro, superficie, orbitale, onda', 'pianeti:ok,molecola:ok,spettro:ok,superficie:ok,orbitale:ok,onda:ok', ol.scene.join(','));
    vero('i pianeti seguono Keplero: al perielio più veloci che all\'afelio (rapporto ' + (ol.kepler.vp / ol.kepler.va).toFixed(2) + ', atteso (1+e)/(1−e) = ' + ol.kepler.atteso.toFixed(2) + ')', Math.abs(ol.kepler.vp / ol.kepler.va - ol.kepler.atteso) / ol.kepler.atteso < 0.08);
    att('il soggetto segue il discorso: una risposta sullo spettro IR → spettro; una domanda sulle orbite → pianeti', 'spettro|pianeti', ol.tema + '|' + ol.tema2);
    vero('l\'etichetta porta alla sezione (' + ol.etichetta + ')', /apri|open/.test(ol.etichetta));
    /* LA FIGURA NON SPARISCE: l'etichetta apre la sezione dietro la finestra «Spiega», con Spectra davanti; chiusa la finestra si torna da Spectra */
    const apre = await pg.evaluate(async () => {
      const pausa = ms => new Promise(r => setTimeout(r, ms)), F = BSISpectraFigura.figura, da = (BSISpectraLive.schermo() || {}).sezione;
      F.box.querySelector('.bsiSF-olo').click(); await pausa(2600);
      const vis = e => { const r = e.getBoundingClientRect(); return r.width > 50 && r.height > 50 && e.offsetParent !== null; };
      const o = { da, dietro: (BSISpectraLive.schermo() || {}).sezione, finestra: document.getElementById('bsi-hub-ov').classList.contains('open'), figuraVista: vis(F.box), nelPannello: document.getElementById('bsi-pane-spiega').contains(F.box), olo: F.olo.attuale };
      document.getElementById('bsi-hub-close').click(); await pausa(2500);
      o.ritorno = (BSISpectraLive.schermo() || {}).sezione; o.figuraDopo = vis(F.box) && document.getElementById(o.ritorno).contains(F.box);
      return o;
    });
    vero('un tocco sull\'etichetta apre «Sistema solare 3D» DIETRO la finestra Spiega: Spectra resta visibile davanti, l\'ologramma la mostra dal vivo', /sastrosole/.test(apre.dietro || '') && apre.finestra && apre.figuraVista && apre.nelPannello && apre.olo === 'schermo');
    vero('chiusa la finestra, l\'app torna alla sezione di Spectra (' + apre.ritorno + ') e la figura è lì', apre.ritorno === apre.da && apre.figuraDopo);
    /* «🧠 SPIEGA»: l'AI che spiega tutto, anche spettri e scene 3D sullo schermo */
    const sp = await pg.evaluate(async () => {
      const pausa = ms => new Promise(r => setTimeout(r, ms)), o = {};
      /* si apre uno spettro (NMR) dietro la finestra di Spectra */
      document.querySelector('[data-s="sspec"]').click(); await pausa(1500);
      window.bsiOpenAIHub('spiega'); await pausa(1200);
      const F = BSISpectraFigura.figura, tab = [...document.querySelectorAll('.bsi-hub-tab')].map(x => x.dataset.tab);
      o.tab = tab.indexOf('spiega'); o.lezione = tab.indexOf('lezione'); o.figura = !!F && document.getElementById('bsi-pane-spiega').contains(F.box);
      const S = BSISpiega.schermo(), im = await BSISpiega.immagine(S); o.schermo = S && { titolo: S.titolo, grafici: S.grafici, img: !!im && im.length > 2000, len: S.testo.length, ctrl: /Controlli/.test(S.testo) };
      o.carta = !!document.querySelector('#bsiSP-schermo #bsiSP-usa:checked');
      o.livelli = [...document.querySelectorAll('#bsiSP-liv option')].map(x => x.textContent);
      /* il modello simulato: si registra che cosa riceve */
      let ricevuto = null; const prima = [window.bsiLLM, window.bsiStreamChat];
      window.bsiLLM = { provider: () => 'finto', chiave: () => 'x' };
      window.bsiStreamChat = (p, c, m, sys, cb) => { ricevuto = { sys, m }; const x = '## In sintesi\nUno spettro ¹H-NMR.\n## Che cosa stai guardando\n| δ (ppm) | molteplicità |\n|---|---|\n| 7,26 | s |'; return new Promise(r => setTimeout(() => { cb.onToken(x, x); r(); }, 300)); };
      document.querySelectorAll('#bsiSP-spunti button')[1].click(); await pausa(250);
      o.pensa = F.spectra.corpo ? F.spectra.corpo.gesto : 'pensa'; await pausa(900);
      o.risposta = { h2: document.querySelectorAll('#bsiSP-out .risposta .bsi-md-h, #bsiSP-out .risposta h2').length, tab: !!document.querySelector('#bsiSP-out table') };
      o.sys = ricevuto.sys; o.msg = ricevuto.m[ricevuto.m.length - 1];
      o.immagine = !!(o.msg.files && o.msg.files[0] && o.msg.files[0].kind === 'image' && o.msg.files[0].data.length > 500);
      o.testoSchermo = /SCHERMO DELL'UTENTE/.test(o.msg.content) && /DOMANDA:/.test(o.msg.content);
      /* l'approfondimento: la conversazione continua, l'immagine non si rimanda */
      document.getElementById('bsiSP-q').value = 'dimostra il passaggio 3'; document.getElementById('bsiSP-usa').checked = false; document.getElementById('bsiSP-via').click(); await pausa(500);
      o.turni = ricevuto.m.length; o.vecchiaSenzaImm = !ricevuto.m[0].files;
      /* il livello PhD avanzato */
      o.sysPhd = BSISpiega.sistema(4, 'chimica');
      /* senza modello: non si finge */
      window.bsiLLM = { provider: () => null, chiave: () => null };
      document.getElementById('bsiSP-nuova').click(); document.getElementById('bsiSP-q').value = 'spiegami questo spettro'; document.getElementById('bsiSP-usa').checked = true; document.getElementById('bsiSP-via').click(); await pausa(300);
      o.senza = document.querySelector('#bsiSP-out .risposta').textContent;
      window.bsiLLM = prima[0]; window.bsiStreamChat = prima[1];
      /* IL CATALOGO: tutte le sezioni, per materia; una domanda che nomina una sezione la apre */
      const C = BSISpiega.catalogo(), mm = {}; C.forEach(x => { mm[x.materia] = (mm[x.materia] || 0) + 1; });
      o.cat = { n: C.length, barra: document.querySelectorAll('.nav-group-panel [data-s]').length, mm };
      o.nomina = ['spiegami le titolazioni acido base', 'come funziona l\'equazione di Schrödinger', 'calcola gli integrali per parti', 'lo spettro di massa del benzene', 'lo spettro infrarosso dell\'etanolo', 'la meccanica orbitale dei satelliti', 'ciao come stai'].map(q => (BSISpiega.sezioneDi(q) || {}).id || '—');
      window.bsiLLM = { provider: () => 'finto', chiave: () => 'x' }; let ric2 = null;
      window.bsiStreamChat = (p, c, m, sys, cb) => { ric2 = m[m.length - 1]; cb.onToken('## In sintesi\nok', '## In sintesi\nok'); return Promise.resolve(); };
      document.getElementById('bsiSP-nuova').click(); document.getElementById('bsiSP-usa').checked = false; document.getElementById('bsiSP-q').value = 'spiegami le titolazioni acido base'; document.getElementById('bsiSP-via').click(); await pausa(2600);
      o.autoApre = { sez: (BSILive = BSISpectraLive.schermo() || {}).sezione, schermo: !!ric2 && /SCHERMO DELL'UTENTE/.test(ric2.content), olo: BSISpectraFigura.figura.olo.attuale };
      /* la privacy: se l'utente toglie la spunta, la sezione nominata si apre ma al modello va solo la domanda */
      const u = document.getElementById('bsiSP-usa'); u.checked = false; u.dispatchEvent(new Event('change'));
      document.getElementById('bsiSP-q').value = 'come funziona l\'equazione di Schrödinger'; document.getElementById('bsiSP-via').click(); await pausa(2600);
      o.privacy = { sez: (BSISpectraLive.schermo() || {}).sezione, schermo: !!ric2 && /SCHERMO DELL'UTENTE/.test(ric2.content), img: !!(ric2 && ric2.files), spunta: document.getElementById('bsiSP-usa').checked };
      document.getElementById('bsiSP-usa').checked = true; document.getElementById('bsiSP-usa').dispatchEvent(new Event('change'));
      window.bsiLLM = prima[0]; window.bsiStreamChat = prima[1];
      /* una sezione senza grafici si proietta come scheda */
      await BSISpiega.mostraSezione('spt'); await pausa(1400); const O2 = BSISpectraFigura.figura.olo, px2 = O2.tela.getContext('2d').getImageData(0, 0, O2.tela.width, O2.tela.height).data; let a2 = 0; for (let i = 0; i < px2.length; i += 4000) a2 += px2[i] + px2[i + 1] + px2[i + 2];
      o.scheda = { modo: O2.attuale, pieno: a2 > 2000, sez: (BSISpectraLive.schermo() || {}).sezione };
      /* il giro di tutte le sezioni di una materia */
      BSISpiega.giro('matematica'); await pausa(10500); o.giro = document.getElementById('bsiSP-giro-stato').textContent; BSISpiega.giroFerma();
      /* una scena 3D */
      document.getElementById('bsi-hub-close').click(); await pausa(1800); document.querySelector('[data-s="sastroorbite"]').click(); await pausa(2500);
      window.bsiOpenAIHub('spiega'); await pausa(1800); const O = BSISpectraFigura.figura.olo, px = O.tela.getContext('2d').getImageData(0, 0, O.tela.width, O.tela.height).data; let acc = 0; for (let i = 0; i < px.length; i += 4000) acc += px[i] + px[i + 1] + px[i + 2];
      o.vivo = { modo: O.attuale, pieno: acc > 2000 }; document.getElementById('bsi-hub-close').click();
      const S3 = BSISpiega.schermo(), im3 = await BSISpiega.immagine(S3); o.s3 = S3 && { titolo: S3.titolo, grafici: S3.grafici, img: !!im3 && im3.length > 2000 };
      /* un grafico in SVG: si mette nella sezione aperta uno spettro vettoriale noto (molti spettri e diagrammi dell'app sono SVG)
         e si controlla che Spectra lo trovi e lo trasformi in immagine — deterministico, non dipende dai tempi di un'altra sezione */
      await pausa(1500);   /* chiusa la finestra, l'app torna alla sezione di partenza: si aspetta che si fermi */
      const sezA = document.getElementById((BSISpectraLive.schermo() || {}).sezione), ns = 'http://www.w3.org/2000/svg', sv = document.createElementNS(ns, 'svg');
      sv.setAttribute('width', '420'); sv.setAttribute('height', '180'); sv.setAttribute('viewBox', '0 0 420 180'); sv.id = 'banco-svg';
      const pl = document.createElementNS(ns, 'polyline'); pl.setAttribute('fill', 'none'); pl.setAttribute('stroke', '#00c9b7'); pl.setAttribute('stroke-width', '3');
      pl.setAttribute('points', Array.from({ length: 84 }, (_, i) => (i * 5) + ',' + (170 - 150 * Math.exp(-Math.pow((i - 30) / 4, 2)) - 90 * Math.exp(-Math.pow((i - 60) / 3, 2)))).join(' ')); sv.appendChild(pl);
      (sezA.querySelector('.bsiFX') || sezA).appendChild(sv); for (let w = 0; w < 30 && !(BSISpiega.schermo() || { svg: [] }).svg.some(x => x.id === 'banco-svg'); w++) await pausa(100);
      const Sv = BSISpiega.schermo(), imv = await BSISpiega.immagine(Sv); o.sv = Sv && { svg: Sv.svg.length, img: !!imv && imv.length > 2000 }; sv.remove();
      return o;
    });
    att('la scheda «🧠 Spiega» è la seconda della finestra di Spectra (e la «Lezione» non c\'è più)', '1|-1', sp.tab + '|' + sp.lezione);
    vero('Spectra col corpo si sposta nella scheda e spiega', sp.figura);
    vero('legge lo schermo: uno spettro aperto («Spettri Ref.»: ' + (sp.schermo && sp.schermo.titolo) + ', ' + (sp.schermo && sp.schermo.grafici) + ' grafici, valori dei controlli, immagine)', sp.schermo && sp.schermo.grafici >= 1 && sp.schermo.img && sp.schermo.ctrl && sp.carta);
    vero('livelli dalla scuola superiore al PhD avanzato (' + sp.livelli.length + ')', sp.livelli.length === 5 && /superiore/i.test(sp.livelli[0]) && /PhD avanzato/.test(sp.livelli[4]));
    vero('al modello arrivano il testo dello schermo, la domanda e l\'IMMAGINE di grafici e scene 3D', sp.testoSchermo && sp.immagine);
    vero('la richiesta: spiegazione esaustiva, non semplificata, lettura quantitativa dello spettro (δ, molteplicità, J, integrale)', /completamente esaustiv/.test(sp.sys) && /Non semplificare/.test(sp.sys) && /molteplicità, J, integrale/.test(sp.sys) && /scena 3D/.test(sp.sys));
    vero('la struttura obbligatoria: sintesi, fondamenti, derivazione, esempi, casi limite, collegamenti, frontiera, verifiche', ['In sintesi', 'Fondamenti', 'derivazione completa', 'Esempi numerici', 'Casi limite', 'Collegamenti', 'frontiera', 'verificare'].every(k => sp.sys.indexOf(k) >= 0));
    vero('la risposta arriva formattata (titoli e tabella) e Spectra pensa mentre il modello scrive', sp.risposta.h2 >= 2 && sp.risposta.tab && sp.pensa === 'pensa');
    vero('l\'approfondimento continua la conversazione senza rimandare l\'immagine (' + sp.turni + ' messaggi)', sp.turni === 3 && sp.vecchiaSenzaImm);
    vero('al PhD avanzato: frontiera, problemi aperti, letteratura primaria', /frontiera/.test(sp.sysPhd) && /problemi aperti/.test(sp.sysPhd) && /letteratura primaria/.test(sp.sysPhd));
    vero('senza modello non finge: lo dice e mostra ciò che l\'app sa della sezione', /serve un modello/.test(sp.senza) && /Sullo schermo/.test(sp.senza));
    vero('legge anche i grafici disegnati in SVG (' + (sp.sv && sp.sv.svg) + ' grafico vettoriale trasformato in immagine)', sp.sv && sp.sv.svg >= 1 && sp.sv.img);
    vero('con la scena 3D aperta dietro Spiega, l\'ologramma la mostra dal vivo (' + sp.vivo.modo + ')', sp.vivo.modo === 'schermo' && sp.vivo.pieno);
    vero('il catalogo ha TUTTE le sezioni della barra (' + sp.cat.n + '/' + sp.cat.barra + ': chimica ' + sp.cat.mm.chimica + ', fisica ' + sp.cat.mm.fisica + ', matematica ' + sp.cat.mm.matematica + ', comuni ' + (sp.cat.mm.comune || 0) + ')', sp.cat.n === sp.cat.barra && sp.cat.n >= 190 && sp.cat.mm.chimica > 50 && sp.cat.mm.fisica > 40 && sp.cat.mm.matematica > 20);
    att('una domanda che nomina un argomento trova la sua sezione', 'stitr|sschrod|smatcalc|sms|sirvis|sastroorbite|—', sp.nomina.join('|'));
    vero('chiedendo delle titolazioni, Spectra apre la sezione dietro la finestra, la mostra nell\'ologramma e la spiega con i suoi dati (' + sp.autoApre.sez + ')', sp.autoApre.sez === 'stitr' && sp.autoApre.schermo && sp.autoApre.olo === 'schermo');
    vero('privacy: tolta la spunta «Includi lo schermo», la sezione nominata si apre (' + sp.privacy.sez + ') ma al modello vanno solo la domanda, senza testo né immagine dello schermo', sp.privacy.sez === 'sschrod' && !sp.privacy.schermo && !sp.privacy.img && !sp.privacy.spunta);
    vero('una sezione senza grafici (Tavola Periodica) si proietta come scheda nell\'ologramma', sp.scheda.sez === 'spt' && sp.scheda.modo === 'schermo' && sp.scheda.pieno);
    vero('«🎞️ Mostrami tutto» scorre le sezioni della materia (' + sp.giro + ')', /^2\/\d+ · /.test(sp.giro) || /^3\/\d+ · /.test(sp.giro));
    vero('legge anche una scena 3D (' + (sp.s3 && sp.s3.titolo) + ': ' + (sp.s3 && sp.s3.grafici) + ' tele, immagine)', sp.s3 && sp.s3.grafici >= 1 && sp.s3.img);
    att(nome + ': nessun errore JavaScript', 0, errs.length);
    errs.slice(0, 3).forEach(e => console.log('      ! ' + e.slice(0, 200)));
    await ctx.close();
  }
  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
