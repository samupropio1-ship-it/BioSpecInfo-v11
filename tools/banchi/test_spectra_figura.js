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
const SINTETICO = () => {
  const T = THREE, pezzi = [];
  function tubo(a, b, r, seg) { const A = new T.Vector3(...a), B = new T.Vector3(...b), d = B.clone().sub(A), g = new T.CylinderGeometry(r, r, d.length(), 12, seg || 12, false);
    g.applyMatrix4(new T.Matrix4().makeRotationFromQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), d.clone().normalize()))); g.translate(...A.clone().add(B).multiplyScalar(0.5).toArray()); pezzi.push(g); }
  tubo([0, 0.40, 0.02], [0, 0.80, 0.02], 0.12, 16); tubo([0, 0.80, 0.02], [0, 0.84, 0.02], 0.04, 2);
  const testa = new T.SphereGeometry(0.06, 16, 12); testa.translate(0, 0.90, 0.03); pezzi.push(testa);
  const capp = new T.SphereGeometry(0.075, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.75); capp.translate(0, 0.905, 0.02); pezzi.push(capp);
  [1, -1].forEach(s => { tubo([s * 0.15, 0.775, 0.015], [s * 0.245, 0.47, 0.04], 0.035, 24); tubo([s * 0.075, 0.42, 0.02], [s * 0.10, 0.02, 0.0], 0.05, 24); const p = new T.BoxGeometry(0.07, 0.03, 0.14, 2, 1, 4); p.translate(s * 0.10, 0.015, 0.04); pezzi.push(p); });
  const pos = [], nor = [], uv = [], ind = []; let base = 0;
  pezzi.forEach(g => { const p = g.attributes.position, n = g.attributes.normal, u = g.attributes.uv; for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i)); uv.push(u ? u.getX(i) : 0, u ? u.getY(i) : 0); } for (let i = 0; i < g.index.count; i++) ind.push(base + g.index.getX(i)); base += p.count; });
  const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new T.Float32BufferAttribute(nor, 3)); geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); geo.setIndex(ind);
  const sc = new T.Group(); sc.add(new T.Mesh(geo, new T.MeshStandardMaterial({ color: 0x1a3050 }))); return BSISpectraFigura.figura.spectra.usaScena(sc);
};

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
    const senza = await pg.evaluate(() => { const F = BSISpectraFigura.figura, i = F.box.querySelector('.bsiSF-invito'); return { invito: !!i && !i.hidden, figura: F.spectra.radice.children.length, corpo: !!F.spectra.corpo }; });
    if (!senza.corpo) {
      vero('senza il corpo sul dispositivo: l\'invito a caricarlo', senza.invito);
      att('e nessun sostituto (niente manichino)', 0, senza.figura);
      await pg.evaluate(SINTETICO);
    }
    /* la figura si disegna (e si allinea) solo quando si vede: la si porta in vista */
    await pg.evaluate(() => BSISpectraFigura.figura.box.scrollIntoView({ block: 'center' }));
    await pg.waitForFunction(() => { const S = BSISpectraFigura.figura.spectra; return S.volto && S.allinea === 0; }, null, { timeout: 90000 }).catch(() => {});
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
    vero('arriva la risposta → spiega con le mani, gioia, labiale su corpo e viso (' + await hud() + ')', parla.gesto === 'spiega' && parla.emo === 'gioia' && parla.testo && parla.viso);
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
      /* una scena 3D */
      document.getElementById('bsi-hub-close').click(); document.querySelector('[data-s="sastroorbite"]').click(); await pausa(2500);
      const S3 = BSISpiega.schermo(), im3 = await BSISpiega.immagine(S3); o.s3 = S3 && { titolo: S3.titolo, grafici: S3.grafici, img: !!im3 && im3.length > 2000 };
      /* uno spettro in SVG (il quiz degli spettri) */
      document.querySelector('[data-s="squizspec"]').click(); await pausa(1500); const Sv = BSISpiega.schermo(), imv = await BSISpiega.immagine(Sv); o.sv = Sv && { svg: Sv.svg.length, img: !!imv && imv.length > 2000 };
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
    vero('legge anche gli spettri disegnati in SVG (' + (sp.sv && sp.sv.svg) + ' grafici vettoriali trasformati in immagine)', sp.sv && sp.sv.svg >= 1 && sp.sv.img);
    vero('legge anche una scena 3D (' + (sp.s3 && sp.s3.titolo) + ': ' + (sp.s3 && sp.s3.grafici) + ' tele, immagine)', sp.s3 && sp.s3.grafici >= 1 && sp.s3.img);
    att(nome + ': nessun errore JavaScript', 0, errs.length);
    errs.slice(0, 3).forEach(e => console.log('      ! ' + e.slice(0, 200)));
    await ctx.close();
  }
  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
