#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   test_spectra_studio — lo studio di Spectra: corpo, voce, lezioni

   PERCHE' QUESTO BANCO ESISTE
   La v239 da' a Spectra un corpo e un laboratorio (spectra-studio.html):
   · bsi-spectra-corpo.js, il driver per qualunque avatar umanoide, provato sul
     manichino riggato costruito nel codice (ossa Mixamo in posa a T,
     blendshape ARKit, capelli ROSSI che devono diventare neri);
   · bsi-spectra-voce.js, la catena di effetti della voce (bassi, metallo,
     stanza), provata con un contesto audio offline;
   · le tre lezioni predici → testa → dimostra → rivela, con le simulazioni
     che devono dare i numeri giusti, la memoria delle previsioni e la
     versione senza WebGL (solo testo).

   USO   node tools/banchi/test_spectra_studio.js    (serve un server su :8899)
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';
const path = require('path');
const { execFileSync } = require('child_process');
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
  console.log('── I calcoli delle lezioni ──');
  {
    let out = '', codice = 0;
    try { out = execFileSync(process.execPath, [path.join(__dirname, 'verifiche', 'verifica-studio-spectra.js')], { encoding: 'utf8', timeout: 600000 }); }
    catch (e) { out = (e.stdout || '') + (e.stderr || ''); codice = e.status || 1; }
    const m = out.match(/(\d+) superati, (\d+) falliti/); const sup = m ? +m[1] : 0, fal = m ? +m[2] : 1;
    ok += sup; ko += fal + (codice && !fal ? 1 : 0);
    console.log('  ' + (fal || codice ? '✗' : '✓') + ' verifica-studio-spectra: ' + sup + ' controlli superati' + (fal ? ', ' + fal + ' falliti' : ''));
  }

  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

  console.log('\n── Il corpo (driver sul manichino) e la voce ──');
  {
    const pg = await (await b.newContext({ viewport: { width: 800, height: 600 } })).newPage(), errs = [];
    pg.on('pageerror', e => errs.push(e.message));
    await pg.goto(BASE + 'spectra-studio.html', { waitUntil: 'load', timeout: 120000 });
    await pg.waitForFunction(() => !!(window.BSISpectraCorpo && window.THREE && window.BSISpectraVoce), null, { timeout: 60000 });
    const R = await pg.evaluate(async () => {
      const T = THREE, sc = new T.Scene(), M = BSISpectraCorpo.manichino(); sc.add(M);
      const C = BSISpectraCorpo.crea(M), o = {}, passi = n => { for (let i = 0; i < n; i++) C.passo(1 / 30); };
      o.rapporto = C.rapporto();
      const h = C.capelli[0].material.color; o.capelli = [h.r, h.g, h.b];
      passi(30);
      /* le braccia a riposo: dalla posa a T a quasi verticali */
      const dir = (a, b) => b.getWorldPosition(new T.Vector3()).sub(a.getWorldPosition(new T.Vector3())).normalize();
      o.braccioRiposo = dir(C.ossa.braccioS, C.ossa.avambS).y;
      /* indica un punto: l'avambraccio destro punta verso il bersaglio */
      const P = new T.Vector3(-1.5, 1.7, 1.5); C.fai('indica', P, 99); passi(60);
      const mano = C.ossa.manoD.getWorldPosition(new T.Vector3()), gomito = C.ossa.avambD.getWorldPosition(new T.Vector3());
      o.angoloIndica = mano.clone().sub(gomito).normalize().angleTo(P.clone().sub(gomito).normalize()) * 180 / Math.PI;
      /* pensa: la mano destra vicino al mento */
      C.fai('pensa', null, 99); passi(60);
      o.manoMento = C.ossa.manoD.getWorldPosition(new T.Vector3()).distanceTo(C.ossa.testa.getWorldPosition(new T.Vector3()));
      C.gesto = null; passi(30);
      /* lo sguardo: la testa si gira verso un punto a destra del personaggio (−x) */
      C.guarda(new T.Vector3(-3, 1.6, 0.5)); passi(90);
      const fw = new T.Vector3(0, 0, 1).applyQuaternion(C.ossa.testa.getWorldQuaternion(new T.Quaternion()));
      o.sguardoX = fw.x;
      /* cammina: il corpo si sposta verso la meta e le gambe si muovono */
      C.guarda(new T.Vector3(0, 1.6, 3)); const x0 = M.position.clone(); C.cammina(new T.Vector3(0, 0, 1)); const q0 = C.ossa.cosciaS.quaternion.clone(); let varia = 0;
      for (let i = 0; i < 60; i++) { C.passo(1 / 30); varia = Math.max(varia, C.ossa.cosciaS.quaternion.angleTo(q0)); }
      o.avanzato = M.position.distanceTo(x0); o.gambe = varia;
      /* seduto: le anche scendono */
      for (let i = 0; i < 120; i++) C.passo(1 / 30); C.meta = null; const y0 = C.ossa.anche.getWorldPosition(new T.Vector3()).y; C.siedi(true); passi(90);
      o.scesa = y0 - C.ossa.anche.getWorldPosition(new T.Vector3()).y; C.siedi(false); passi(90);
      /* il viso: emozioni → blendshape, labiale dall'audio, battito */
      C.emozione('gioia', 99); passi(60); o.sorriso = C.peso('mouthSmileLeft');
      C.emozione('preoccupata', 99); passi(60); o.tristezza = C.peso('mouthFrownLeft'); o.sorrisoDopo = C.peso('mouthSmileLeft');
      C.dici('aaaa'); C.audio({ apertura: 1, rotondo: 0, largo: 0, frazione: 0.2 }); passi(3); o.bocca = C.peso('jawOpen');
      C.taci(); C.palp = 0.5; C.prossimo = 99; C.passo(0.001); o.battito = C.peso('eyeBlinkLeft');
      /* la voce: la catena offline (un seno a 80 Hz piu' forte dopo i bassi; un impulso con la coda della stanza) */
      const sr = 44100, oac = new OfflineAudioContext(1, sr * 2, sr);
      const buf = oac.createBuffer(1, sr * 0.5, sr), d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = 0.2 * Math.sin(2 * Math.PI * 80 * i / sr);
      const src = oac.createBufferSource(); src.buffer = buf; const ch = BSISpectraVoce.catena(oac); src.connect(ch.ingresso); ch.uscita.connect(oac.destination); src.start();
      const out = await oac.startRendering(), y = out.getChannelData(0); ch.ferma();
      let e1 = 0, e2 = 0; for (let i = sr * 0.1; i < sr * 0.4; i++) e1 += y[i] * y[i]; for (let i = sr * 0.1; i < sr * 0.4; i++) e2 += d[i] * d[i];
      o.guadagnoBassi = 10 * Math.log10(e1 / e2);
      let coda = 0; for (let i = Math.floor(sr * 0.75); i < sr * 1.2; i++) coda += y[i] * y[i]; o.coda = coda;
      o.qualita = BSISpectraVoce.qualita();
      return o;
    });
    console.log('      (rapporto del manichino: ' + JSON.stringify(R.rapporto) + ')');
    vero('il driver trova le ossa (' + R.rapporto.ossa + '), i blendshape (' + R.rapporto.blendshape + ') e i capelli', R.rapporto.ossa === '22/23' && R.rapporto.blendshape === '14/14' && R.rapporto.capelli === 1 && R.rapporto.locomozione);
    vero('i capelli rossi diventano neri (' + R.capelli.map(x => x.toFixed(3)).join(', ') + ')', Math.max(...R.capelli) < 0.06 && Math.max(...R.capelli) - Math.min(...R.capelli) < 0.02);
    vero('dalla posa a T le braccia scendono lungo il corpo (y = ' + R.braccioRiposo.toFixed(2) + ')', R.braccioRiposo < -0.9);
    vero('indica: l\'avambraccio punta al bersaglio (scarto ' + R.angoloIndica.toFixed(1) + '°)', R.angoloIndica < 8);
    vero('pensa: la mano vicino al mento (' + (R.manoMento * 100).toFixed(1) + ' cm dalla testa)', R.manoMento < 0.22);
    vero('lo sguardo si gira verso destra (avanti.x = ' + R.sguardoX.toFixed(2) + ')', R.sguardoX < -0.35);
    vero('cammina: si sposta (' + R.avanzato.toFixed(2) + ' m) e muove le gambe (' + (R.gambe * 180 / Math.PI).toFixed(0) + '°)', R.avanzato > 0.5 && R.gambe > 0.25);
    vero('si siede: le anche scendono di ' + (R.scesa * 100).toFixed(0) + ' cm', R.scesa > 0.25);
    vero('gioia → sorriso (' + R.sorriso.toFixed(2) + '); preoccupazione → angoli giù (' + R.tristezza.toFixed(2) + ') e il sorriso se ne va (' + R.sorrisoDopo.toFixed(2) + ')', R.sorriso > 0.6 && R.tristezza > 0.25 && R.sorrisoDopo < 0.15);
    vero('labiale dall\'audio: la mandibola si apre (' + R.bocca.toFixed(2) + ')', R.bocca > 0.5);
    vero('battito: le palpebre si chiudono (' + R.battito.toFixed(2) + ')', R.battito > 0.9);
    vero('voce: i bassi a 80 Hz escono rinforzati (' + R.guadagnoBassi.toFixed(1) + ' dB)', R.guadagnoBassi > 1.5);
    vero('voce: la stanza lascia una coda dopo la fine del suono', R.coda > 1e-6);
    att('senza chiave la voce ripiega sulla sintesi del sistema', 'sistema', R.qualita);
    att('nessun errore JavaScript', 0, errs.length);
    errs.slice(0, 3).forEach(e => console.log('      ! ' + e.slice(0, 200)));
  }

  for (const [nome, opz, args] of [['schermo grande', { viewport: { width: 1280, height: 800 } }, []], ['telefono', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, []]]) {
    console.log('\n── Le lezioni, ' + nome + ' ──');
    const ctx = await b.newContext(opz), pg = await ctx.newPage(), errs = [];
    pg.on('pageerror', e => errs.push(e.message));
    pg.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('console: ' + m.text()); });
    await pg.goto(BASE + 'spectra-studio.html', { waitUntil: 'load', timeout: 120000 });
    await pg.waitForFunction(() => !!window.SpectraStudio, null, { timeout: 60000 });
    await pg.waitForFunction(() => SpectraStudio.stato().volto, null, { timeout: 90000 }).catch(() => {});
    await pg.evaluate(() => { try { localStorage.removeItem('bsi-spectra-studio-v1'); } catch (e) {} });
    const allineato = await pg.evaluate(() => { const S = SpectraStudio.S(), T = THREE; if (!S.volto) return null; S.corpoRadice.updateMatrixWorld(true); const bb = new T.Box3().setFromObject(S.volto.parti.Object_2), tp = S.corpo.ossa.testa.getWorldPosition(new T.Vector3()); return bb.min.y - tp.y; });
    if (allineato != null) vero('il volto è appoggiato sul collo (mento ' + (allineato * 100).toFixed(1) + ' cm sopra l\'osso della testa)', Math.abs(allineato) < 0.03);
    for (const [id, giusta] of [['caduta', 2], ['acqua', 3], ['basilea', 2]]) {
      const r = await pg.evaluate(async ([id, giusta]) => {
        const pausa = ms => new Promise(r => setTimeout(r, ms)), o = {};
        SpectraStudio.apri(id); const v = document.getElementById('voce'); if (v && v.textContent === '🔊') v.click();
        await pausa(400); o.opzioni = document.querySelectorAll('#corpo .opz button').length;
        document.querySelectorAll('#corpo .opz button')[giusta === 2 && id === 'acqua' ? 0 : 0].click(); await pausa(300);
        SpectraStudio.testa(); for (let k = 0; k < 120 && !SpectraStudio.stato().misure; k++) await pausa(250);
        o.misure = SpectraStudio.stato().misure; o.testoMisure = (document.getElementById('mis') || {}).textContent || '';
        SpectraStudio.dimostra(0); await pausa(200); o.formule = document.querySelectorAll('#corpo .f').length;
        SpectraStudio.rivela(); await pausa(300);
        o.giusta = document.querySelectorAll('#corpo .opz .giusta').length; o.esercizi = document.querySelectorAll('#corpo .ese').length; o.consigliato = document.querySelectorAll('#corpo .ese.consigliato').length;
        const d = document.querySelector('#corpo details'); d.open = true; await pausa(150);
        const m = JSON.parse(localStorage.getItem('bsi-spectra-studio-v1') || '{}')[id] || {}; o.memoria = (m.previsioni || []).length; o.risolti = Object.keys(m.esercizi || {}).length;
        o.sborda = document.documentElement.scrollWidth - document.documentElement.clientWidth;
        return o;
      }, [id, giusta]);
      const M = r.misure || {};
      if (id === 'caduta') vero('caduta: le due sfere toccano terra insieme (' + (M.tA || 0).toFixed(3) + ' / ' + (M.tB || 0).toFixed(3) + ' s)', M.tA && Math.abs(M.tA - M.tB) < 1e-6 && Math.abs(M.tA - 2.0193) < 2e-3);
      if (id === 'acqua') vero('acqua: tetraedro ' + (M.uguali || 0).toFixed(2) + '°, con i doppietti ' + (M.acqua || 0).toFixed(2) + '°', M.uguali && Math.abs(M.uguali - 109.47) < 0.1 && Math.abs(M.acqua - 104.5) < 0.4);
      if (id === 'basilea') vero('Basilea: S₁₀₀₀ = ' + (M.S1000 || 0).toFixed(5) + ', coprimi ' + (M.coprimi || 0).toFixed(4), M.S1000 && Math.abs(M.S1000 - Math.PI * Math.PI / 6) < 1.1e-3 && Math.abs(M.coprimi - 0.6079) < 0.02);
      vero(id + ': 4 previsioni, misure in tabella, formule nella dimostrazione', r.opzioni === 4 && r.testoMisure.length > 20 && r.formule >= 1);
      vero(id + ': la rivelazione segna la risposta giusta, 4 esercizi, uno consigliato', r.giusta === 1 && r.esercizi === 4 && r.consigliato === 1);
      vero(id + ': la memoria ricorda la previsione e l\'esercizio aperto', r.memoria === 1 && r.risolti === 1);
      if (nome === 'telefono') att(id + ': a 390 px niente sborda', 0, r.sborda);
    }
    att(nome + ': nessun errore JavaScript', 0, errs.length);
    errs.slice(0, 3).forEach(e => console.log('      ! ' + e.slice(0, 200)));
    await ctx.close();
  }

  console.log('\n── La voce si ricorda, e i dati dello studio si cancellano ──');
  {
    const ctx = await b.newContext(), pg = await ctx.newPage();
    await pg.goto(BASE + 'spectra-studio.html', { waitUntil: 'load', timeout: 120000 });
    await pg.waitForFunction(() => !!window.SpectraStudio, null, { timeout: 60000 });
    await pg.evaluate(() => { localStorage.removeItem('bsi-spectra-studio-voce'); SpectraStudio.apri('caduta'); const v = document.getElementById('voce'); if (v.textContent === '🔊') v.click(); });
    await pg.reload({ waitUntil: 'load' }); await pg.waitForFunction(() => !!window.SpectraStudio, null, { timeout: 60000 });
    const v = await pg.evaluate(() => { SpectraStudio.apri('caduta'); return { salvata: localStorage.getItem('bsi-spectra-studio-voce'), bottone: document.getElementById('voce').textContent }; });
    att('la voce spenta resta spenta dopo una ricarica', '0|🔇', v.salvata + '|' + v.bottone);
    await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
    await pg.waitForFunction(() => typeof window.bsiCancellaDati === 'function', null, { timeout: 60000 });
    const c = await pg.evaluate(() => { localStorage.setItem('bsi-spectra-studio-v1', '{"caduta":{}}'); bsiCancellaDati(['memoria']); return [localStorage.getItem('bsi-spectra-studio-v1'), localStorage.getItem('bsi-spectra-studio-voce')].map(String).join('|'); });
    att('«Cancella dati → memoria» toglie la memoria e la scelta della voce dello studio', 'null|null', c);
    await ctx.close();
  }

  console.log('\n── Senza WebGL: la lezione si segue a testo ──');
  {
    const b2 = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--disable-3d-apis', '--disable-webgl'] });
    const pg = await (await b2.newContext()).newPage(), errs = [];
    pg.on('pageerror', e => errs.push(e.message));
    await pg.goto(BASE + 'spectra-studio.html', { waitUntil: 'load', timeout: 120000 });
    await pg.waitForFunction(() => !!window.SpectraStudio, null, { timeout: 60000 });
    const r = await pg.evaluate(async () => {
      const pausa = ms => new Promise(r => setTimeout(r, ms));
      SpectraStudio.apri('caduta'); const v = document.getElementById('voce'); if (v && v.textContent === '🔊') v.click();
      document.querySelectorAll('#corpo .opz button')[2].click(); await pausa(200); SpectraStudio.testa(); await pausa(900);
      return { scena: SpectraStudio.stato().scena, misure: SpectraStudio.stato().misure };
    });
    vero('senza WebGL non c\'è scena, ma la lezione dà le misure (' + (r.misure ? r.misure.tA.toFixed(3) : '—') + ' s)', r.scena === false && r.misure && Math.abs(r.misure.tA - 2.0193) < 2e-3);
    att('senza WebGL: nessun errore JavaScript', 0, errs.length);
    await b2.close();
  }
  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
