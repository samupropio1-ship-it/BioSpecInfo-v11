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
   · la MODALITA' LEZIONE (stile every-joule) ci sia nella finestra di Spectra:
     scheda «⚡ Lezione», Spectra col corpo che la conduce, le tre lezioni del
     laboratorio offline in quattro fasi (il cursore della prova ricalcola davvero),
     un argomento libero con un modello simulato (JSON controllato), la memoria;
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
    /* LA MODALITA' LEZIONE (stile every-joule) nella finestra di Spectra */
    await pg.evaluate(() => window.bsiOpenAIHub('lezione'));
    await pg.waitForFunction(() => document.querySelectorAll('#bsiLA-locali button').length >= 3, null, { timeout: 60000 }).catch(() => {});
    await pg.waitForTimeout(1200);
    const lz = await pg.evaluate(async () => {
      const pausa = ms => new Promise(r => setTimeout(r, ms)), o = {}, F = BSISpectraFigura.figura, tab = [...document.querySelectorAll('.bsi-hub-tab')].map(x => x.dataset.tab);
      o.tab = tab.indexOf('lezione'); o.figura = document.getElementById('bsi-pane-lezione').contains(F.box);
      o.locali = document.querySelectorAll('#bsiLA-locali button').length;
      document.querySelectorAll('#bsiLA-locali button')[0].click(); await pausa(500);
      o.opzioni = document.querySelectorAll('#bsiLA .opz button').length; o.curiosa = F.spectra.corpo.emo;
      document.querySelectorAll('#bsiLA .opz button')[0].click(); await pausa(400);
      const i = document.querySelector('#bsiLA .cursore input'); i.value = 15; i.dispatchEvent(new Event('input')); o.m15 = BSILezioneAI.stato().misura;
      i.value = 0; i.dispatchEvent(new Event('input')); o.m0 = BSILezioneAI.stato().misura;
      [...document.querySelectorAll('#bsiLA .bt')].pop().click(); await pausa(300); o.formule = document.querySelectorAll('#bsiLA .f').length; o.det = F.spectra.corpo.emo;
      [...document.querySelectorAll('#bsiLA .bt')].pop().click(); await pausa(400);
      o.fase = BSILezioneAI.stato().fase; o.giusta = document.querySelectorAll('#bsiLA .opz .giusta').length; o.ese = document.querySelectorAll('#bsiLA .ese').length; o.sorpresa = F.spectra.corpo.emo;
      /* un argomento libero con un modello simulato: JSON nella prima fase, markdown dopo */
      const R = ['ecco: {"titolo":"Tunnel","scena":"Un elettrone da 1 eV e una barriera di 2 eV larga 1 nm.","domanda":"Passa?","opzioni":["Mai","Sì, raramente","Sempre","Solo accelerando"],"giusta":1,"perche":["a","b","c","d"]} fine', '| a | T |\n|---|---|\n| 0,5 nm | 6 % |', '1. T ≈ e^(−2κa)', 'Giusta.'];
      let k = 0; const prima = [window.bsiLLM, window.bsiStreamChat];
      window.bsiLLM = { provider: () => 'finto', chiave: () => 'x' }; window.bsiStreamChat = (p, c, m, sys, cb) => { o.sistema = sys; const x = R[k++]; cb.onToken(x, x); return Promise.resolve(); };
      document.getElementById('bsiLA-arg').value = 'effetto tunnel'; document.getElementById('bsiLA-via').click(); await pausa(300);
      o.aiOpz = document.querySelectorAll('#bsiLA .opz button').length; document.querySelectorAll('#bsiLA .opz button')[1].click(); await pausa(300);
      o.aiTab = !!document.querySelector('#bsiLA table');
      [...document.querySelectorAll('#bsiLA .bt')].pop().click(); await pausa(300); [...document.querySelectorAll('#bsiLA .bt')].pop().click(); await pausa(300);
      o.aiFase = BSILezioneAI.stato().fase; o.gioia = F.spectra.corpo.emo;
      o.json = !!BSILezioneAI.leggiPredici(R[0]) && !BSILezioneAI.leggiPredici('{"domanda":"x","opzioni":["a"],"giusta":3}');
      window.bsiLLM = prima[0]; window.bsiStreamChat = prima[1];
      o.mem = JSON.parse(localStorage.getItem(BSILezioneAI.MEM) || '{}');
      return o;
    });
    att('la scheda «⚡ Lezione» è la seconda della finestra di Spectra', 1, lz.tab);
    vero('Spectra col corpo si sposta nella scheda e conduce la lezione', lz.figura);
    att('tre lezioni del laboratorio anche senza rete e senza chiave', 3, lz.locali);
    vero('PREDICI: quattro previsioni, Spectra curiosa', lz.opzioni === 4 && lz.curiosa === 'curiosa');
    vero('PROVA: il cursore ricalcola (v₀ 15 → gittata ' + lz.m15.gittata.toFixed(2) + ' m) e il tempo non cambia (' + lz.m15.tB.toFixed(3) + ' = ' + lz.m0.tB.toFixed(3) + ' s)', Math.abs(lz.m15.gittata - 15 * Math.sqrt(40 / 9.81)) < 0.05 && Math.abs(lz.m15.tB - lz.m0.tB) < 1e-9);
    vero('DIMOSTRA: le formule (' + lz.formule + '), Spectra determinata', lz.formule >= 3 && lz.det === 'determinata');
    vero('RIVELA: la giusta segnata, 4 esercizi per livello; previsione sbagliata → sorpresa', lz.fase === 3 && lz.giusta === 1 && lz.ese === 4 && lz.sorpresa === 'sorpresa');
    vero('argomento libero col modello: JSON controllato, 4 opzioni, prova con tabella, quattro fasi; giusta → gioia', lz.json && lz.aiOpz === 4 && lz.aiTab && lz.aiFase === 3 && lz.gioia === 'gioia');
    vero('il modello riceve il metodo (prevedi → prova → dimostra → rivela) e il livello', /PREDICI → PROVA → DIMOSTRA → RIVELA/.test(lz.sistema) && /Triennale/.test(lz.sistema));
    vero('la memoria ricorda le previsioni (caduta: sbagliata; tunnel: giusta)', lz.mem.caduta && lz.mem.caduta.sbagliate === 1 && lz.mem['ai:effetto tunnel'] && lz.mem['ai:effetto tunnel'].giuste === 1);
    att(nome + ': nessun errore JavaScript', 0, errs.length);
    errs.slice(0, 3).forEach(e => console.log('      ! ' + e.slice(0, 200)));
    await ctx.close();
  }
  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
