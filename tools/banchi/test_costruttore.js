#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════════
   test_costruttore — 🧪 Costruttore molecolare 3D e AR (v257)

   PERCHE' QUESTO BANCO ESISTE
   Il progetto chiede di costruire una molecola e di posarla sul tavolo in
   realtà aumentata. Un costruttore che dà angoli sbagliati insegna la chimica
   sbagliata: qui si confrontano le geometrie minimizzate con la VSEPR e con
   le distanze misurate (tolleranze dichiarate: centesimi di ångström, pochi
   gradi), si controllano formula di Hill, massa molare, insaturazioni, il
   file MOL, la costruzione a mano (catena, anello chiuso, carica), e poi la
   pagina: il tocco vero sulla scena 3D che lega un atomo, il pulsante AR, il
   GLB che ne esce, niente sbordi, nessun errore, a 412 e 1280 px.

   USO   node tools/banchi/test_costruttore.js    (serve un server su :8899)
   ════════════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const { chromium } = require('playwright-core');
const RADICE = path.join(__dirname, '..', '..');
const BASE = process.env.BSI_URL_BASE || 'http://127.0.0.1:8899/';
const CHROME = process.env.BSI_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
let ok = 0, ko = 0;
function att(d, atteso, avuto) { if (String(atteso) === String(avuto)) { ok++; console.log('  ✓ ' + d + '  → ' + avuto); } else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + '\n      avuto:  ' + avuto); } }
function vero(d, c) { att(d, true, !!c); }
function vicino(d, atteso, avuto, tol) { const k = Math.abs(avuto - atteso) <= tol; if (k) { ok++; console.log('  ✓ ' + d + '  → ' + avuto.toFixed(3) + ' (atteso ' + atteso + ' ± ' + tol + ')'); } else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + ' ± ' + tol + '\n      avuto:  ' + avuto); } }

(async () => {
  const ctx = { console, Math, Array, Object, isFinite, String, Number, JSON, Float64Array }; ctx.window = ctx; ctx.globalThis = ctx;
  ctx.BSIFisica = { t: a => a, tt: a => a[0], calcolo: {}, el: () => ({}), sezione() {} }; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(RADICE, 'bsi-costruttore.js'), 'utf8'), ctx);
  const C = ctx.BSIFisica.calcolo.costruttore;
  const pesante = (M, el) => M.atomi.findIndex(a => a.el === el);
  const ang = (M, i) => C.descrivi(M, i).angoli, lun = (M, i) => C.descrivi(M, i).legami.map(l => l.d);
  const tutti = (xs, f) => xs.length > 0 && xs.every(f);

  console.log('── Le geometrie contro la VSEPR e le misure ──');
  let M = C.modello('metano'); const c0 = pesante(M, 'C');
  vero('metano: quattro angoli H–C–H a 109,47° ± 0,5°', tutti(ang(M, c0), a => Math.abs(a - 109.47) < 0.5));
  vicino('metano: C–H (misurato 1,087 Å)', 1.087, lun(M, c0)[0], 0.03);
  M = C.modello('acqua'); vicino('acqua: angolo H–O–H (misurato 104,5°)', 104.5, ang(M, pesante(M, 'O'))[0], 1);
  vicino('acqua: O–H (misurato 0,958 Å)', 0.958, lun(M, pesante(M, 'O'))[0], 0.03);
  M = C.modello('ammoniaca'); vero('ammoniaca: piramidale, H–N–H 107° ± 1°', tutti(ang(M, pesante(M, 'N')), a => Math.abs(a - 107) < 1));
  M = C.modello('co2'); vicino('CO₂: lineare (180°)', 180, ang(M, pesante(M, 'C'))[0], 0.5);
  M = C.modello('acetilene'); vicino('acetilene: H–C≡C lineare', 180, ang(M, pesante(M, 'C'))[0], 0.5);
  vicino('acetilene: C≡C (misurato 1,203 Å)', 1.203, C.descrivi(M, pesante(M, 'C')).legami.filter(l => l.ordine === 3)[0].d, 0.03);
  M = C.modello('etilene'); vero('etilene: angoli a 120° ± 1°', tutti(ang(M, pesante(M, 'C')), a => Math.abs(a - 120) < 1));
  { /* planarità: tutti i sei atomi nel piano dei due carboni e di un idrogeno */
    const A = M.atomi, cs = A.map((a, i) => i).filter(i => A[i].el === 'C'), h = M.vicini(cs[0]).filter(j => A[j].el === 'H')[0];
    const p = A[cs[0]], u = [A[cs[1]].x - p.x, A[cs[1]].y - p.y, A[cs[1]].z - p.z], w = [A[h].x - p.x, A[h].y - p.y, A[h].z - p.z];
    const n = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]], ln = Math.hypot(...n);
    const fuori = Math.max(...A.map(a => Math.abs(((a.x - p.x) * n[0] + (a.y - p.y) * n[1] + (a.z - p.z) * n[2]) / ln)));
    vero('etilene: piatto (scarto massimo dal piano ' + fuori.toFixed(4) + ' Å < 0,02)', fuori < 0.02);
  }
  M = C.modello('benzene');
  { const cc = M.legami.filter(l => M.atomi[l.a].el === 'C' && M.atomi[l.b].el === 'C').map(l => Math.hypot(M.atomi[l.a].x - M.atomi[l.b].x, M.atomi[l.a].y - M.atomi[l.b].y, M.atomi[l.a].z - M.atomi[l.b].z));
    vero('benzene: sei C–C uguali a 1,39 Å ± 0,01 (non Kekulé alternato)', cc.length === 6 && cc.every(d => Math.abs(d - 1.39) < 0.01));
    const zs = M.atomi.map(a => a.z), A = M.atomi;
    const p = A[0], u = [A[1].x - p.x, A[1].y - p.y, A[1].z - p.z], w = [A[2].x - p.x, A[2].y - p.y, A[2].z - p.z], n = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]], ln = Math.hypot(...n);
    const fuori = Math.max(...A.map(a => Math.abs(((a.x - p.x) * n[0] + (a.y - p.y) * n[1] + (a.z - p.z) * n[2]) / ln)));
    vero('benzene: dodici atomi nello stesso piano (scarto ' + fuori.toFixed(4) + ' Å)', fuori < 0.02 && zs.length === 12); }
  M = C.modello('cicloesano'); vero('cicloesano: angoli C–C–C tetraedrici ± 1,5° (sedia, non piatto)', tutti(M.atomi.map((a, i) => i).filter(i => M.atomi[i].el === 'C'), i => ang(M, i).every(a => Math.abs(a - 109.47) < 1.5)));
  M = C.modello('sf6'); vero('SF₆: ottaedro, angoli F–S–F a 90° o 180° ± 1°', tutti(ang(M, pesante(M, 'S')), a => Math.abs(a - 90) < 1 || Math.abs(a - 180) < 1));
  att('SF₆: 12 angoli a 90° e 3 a 180°', '12 3', ang(M, pesante(M, 'S')).filter(a => Math.abs(a - 90) < 1).length + ' ' + ang(M, pesante(M, 'S')).filter(a => Math.abs(a - 180) < 1).length);
  M = C.modello('pcl5'); { const a = ang(M, pesante(M, 'P')), n90 = a.filter(x => Math.abs(x - 90) < 1.5).length, n120 = a.filter(x => Math.abs(x - 120) < 1.5).length, n180 = a.filter(x => Math.abs(x - 180) < 1.5).length;
    att('PCl₅: bipiramide trigonale, 6 angoli a 90°, 3 a 120°, 1 a 180°', '6 3 1', n90 + ' ' + n120 + ' ' + n180); }
  const d = C.descrivi(C.modello('acqua'), 0);
  att('acqua: VSEPR AX₂E₂, sp³', '2 2 sp³', d.vicini + ' ' + d.coppie + ' ' + d.ibrido);

  console.log('\n── Formula, massa, insaturazioni, file ──');
  const prop = k => { const m = C.modello(k); return C.formula(m) + ' ' + C.massa(m).toFixed(2); };
  att('etanolo', 'C₂H₆O 46.07', prop('etanolo'));
  att('glicina', 'C₂H₅NO₂ 75.07', prop('glicina'));
  att('acido solforico (Hill senza carbonio: ordine alfabetico)', 'H₂O₄S 98.07', prop('solforico'));
  att('ammoniaca (Hill: H₃N)', 'H₃N 17.03', prop('ammoniaca'));
  att('insaturazioni: benzene 4, cicloesano 1, acetilene 2, etano 0', '4 1 2 0', ['benzene', 'cicloesano', 'acetilene', 'etano'].map(k => C.insaturazioni(C.modello(k))).join(' '));
  att('insaturazioni non definite con valenza espansa (SF₆)', 'null', String(C.insaturazioni(C.modello('sf6'))));
  { const t = C.mol(C.modello('etanolo'), 'etanolo').split('\n');
    att('MOL V2000: riga dei conteggi (9 atomi, 8 legami)', '  9  8  0  0  0  0  0  0  0  0999 V2000', t[3]);
    vero('MOL: una riga per atomo e per legame, chiusa da M  END', t.length >= 4 + 9 + 8 + 1 && t[4 + 9 + 8] === 'M  END');
    const xy = C.xyz(C.modello('acqua')).trim().split('\n'); att('XYZ: 3 atomi, intestazione e righe', '3 5', xy[0] + ' ' + xy.length); }

  console.log('\n── Costruire a mano ──');
  M = new C.Molecola(); M.aggiungiAtomo('C'); let j = C.attacca(M, 0, 'C', 1); j = C.attacca(M, j, 'C', 1); C.attacca(M, j, 'O', 1); C.completaH(M); C.ottimizza(M, 3000);
  att('C → C → C → O e idrogeni: propanolo', 'C₃H₈O', C.formula(M));
  M = new C.Molecola(); M.aggiungiAtomo('C'); let p = 0, primo = 0; for (let k = 0; k < 5; k++) p = C.attacca(M, p, 'C', 1); M.lega(primo, p, 1); C.completaH(M); C.ottimizza(M, 4000);
  att('catena di sei carboni chiusa ad anello e completata: cicloesano', 'C₆H₁₂', C.formula(M));
  M = new C.Molecola(); M.aggiungiAtomo('N'); M.atomi[0].q = 1; C.completaH(M); C.ottimizza(M, 3000);
  att('azoto con carica +: ione ammonio, tetraedrico', 'H₄N⁺ 4', C.formula(M) + ' ' + M.vicini(0).length);
  vero('NH₄⁺: angoli a 109,47° ± 0,5°', tutti(ang(M, 0), a => Math.abs(a - 109.47) < 0.5));
  M = new C.Molecola(); M.aggiungiAtomo('O'); M.atomi[0].q = -1; C.completaH(M); att('ossigeno con carica −: ossidrile', 'HO⁻', C.formula(M));
  M = C.modello('metano'); att('un idrogeno non regge un secondo legame', -1, C.attacca(M, M.atomi.findIndex(a => a.el === 'H'), 'C', 1));
  att('un carbonio saturo non regge un quinto legame', -1, C.attacca(M, 0, 'H', 1));

  console.log('\n── La pagina ──');
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  for (const [nome, opz] of [['telefono', { viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true }], ['schermo grande', { viewport: { width: 1280, height: 860 } }]]) {
    const cx = await b.newContext(Object.assign({ serviceWorkers: 'block' }, opz)), pg = await cx.newPage(), errs = [];
    pg.on('pageerror', e => errs.push(e.message.slice(0, 200)));
    await pg.addInitScript(() => { try { localStorage.setItem('bsi_guide_v3', '1'); } catch (e) {} });
    await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
    await pg.waitForFunction(() => !!(window.BSISpectraLive && window.BSIFisica && BSIFisica.calcolo.costruttore), null, { timeout: 60000 });
    const r0 = await pg.evaluate(async () => {
      const pausa = ms => new Promise(r => setTimeout(r, ms)), o = {};
      o.nav = !!document.querySelector('.nav-btn[data-s="scostruttore"]');
      const x = BSISpectraLive.calcolo.apriSezione('scostruttore'); o.aperta = x && x.id;
      for (let k = 0; k < 60; k++) { const d = [...document.querySelectorAll('#scostruttore div')].find(z => z._costruttore && z._costruttore.scena); if (d) break; await pausa(250); }
      const d = [...document.querySelectorAll('#scostruttore div')].find(z => z._costruttore); window.__cm = d && d._costruttore;
      o.scena = !!(window.__cm && window.__cm.scena); o.ar = !!document.querySelector('#scostruttore .bsi3d-barra .bsiAR-tasto');
      o.formula = window.__cm ? BSIFisica.calcolo.costruttore.formula(window.__cm.stato.M) : '';
      return o;
    });
    vero(nome + ' · nella barra e si apre con la scena 3D', r0.nav && r0.aperta === 'scostruttore' && r0.scena);
    vero(nome + ' · il pulsante AR nella barra della scena', r0.ar);
    att(nome + ' · parte dal metano', 'CH₄', r0.formula);
    /* il tocco VERO: «Nuova» con C scelto lascia un carbonio da solo (nel metano è nascosto dietro un idrogeno, da certe viste);
       lo si proietta sullo schermo e lo si tocca; in modo «Lega» con O scelto diventa metanolo */
    await pg.evaluate(() => { const bt = [...document.querySelectorAll('#scostruttore .bsiCM-el button')]; bt.find(x => x.textContent === 'C').click(); [...document.querySelectorAll('#scostruttore .bsiCM-az button')].find(x => /Nuova/.test(x.textContent)).click(); bt.find(x => x.textContent === 'O').click(); });
    await pg.waitForTimeout(300);
    const punto = await pg.evaluate(() => {
      const S = window.__cm.scena, T = THREE, M = window.__cm.stato.M, i = M.atomi.findIndex(a => a.el === 'C'); S.disegna();
      const v = new T.Vector3(M.atomi[i].x, M.atomi[i].y, M.atomi[i].z).project(S.cam), r = S.ren.domElement.getBoundingClientRect();
      return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height };
    });
    await pg.evaluate(p => { const el = window.__cm.scena.ren.domElement; el.scrollIntoView({ block: 'center', behavior: 'instant' }); }, punto); await pg.waitForTimeout(200);
    const p2 = await pg.evaluate(() => { const S = window.__cm.scena, T = THREE, M = window.__cm.stato.M, i = M.atomi.findIndex(a => a.el === 'C'); S.disegna(); const v = new T.Vector3(M.atomi[i].x, M.atomi[i].y, M.atomi[i].z).project(S.cam), r = S.ren.domElement.getBoundingClientRect(); return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height }; });
    if (opz.hasTouch) await pg.touchscreen.tap(p2.x, p2.y); else { await pg.mouse.move(p2.x, p2.y); await pg.mouse.down(); await pg.mouse.up(); } await pg.waitForTimeout(400);
    const r1 = await pg.evaluate(() => { const C = BSIFisica.calcolo.costruttore, M = window.__cm.stato.M, o = {}; o.formula = C.formula(M); const iO = M.atomi.findIndex(a => a.el === 'O'); o.ang = iO >= 0 ? C.descrivi(M, iO).angoli[0] : 0; o.info = document.querySelector('#scostruttore .bsiCM-info').textContent; return o; });
    att(nome + ' · il tocco sul carbonio con O scelto: metanolo', 'CH₄O', r1.formula);
    vero(nome + ' · angolo C–O–H a 104,5° ± 1° dopo la minimizzazione', Math.abs(r1.ang - 104.5) < 1);
    vero(nome + ' · il pannello dice formula, massa e VSEPR dell\'atomo nuovo (' + r1.info.slice(0, 60) + '…)', /CH₄O/.test(r1.info) && /32,04 g\/mol/.test(r1.info) && /AX₂E₂/.test(r1.info));
    const r2 = await pg.evaluate(async () => {
      const pausa = ms => new Promise(r => setTimeout(r, ms)), o = {}, sel = document.querySelector('#scostruttore select');
      sel.value = 'benzene'; sel.dispatchEvent(new Event('change')); await pausa(300);
      o.formula = BSIFisica.calcolo.costruttore.formula(window.__cm.stato.M); o.dida = window.__cm.scena.didascalia.textContent;
      const R = BSIAR.raccogli(window.__cm.scena.radice); o.tri = R && (R.tri || R.triangoli || (R.indici ? R.indici.length / 3 : 0) || (R.ind ? R.ind.length / 3 : 0));
      try { const g = BSIAR.glb(R); const u = new Uint8Array(g.buffer || g); o.glb = String.fromCharCode(u[0], u[1], u[2], u[3]); o.byte = u.length; } catch (e) { o.glb = 'errore ' + e.message; }
      o.sb = document.documentElement.scrollWidth - document.documentElement.clientWidth;
      const el = document.getElementById('scostruttore'); o.strano = (el.innerText.match(/.{0,20}(\bNaN\b|\bundefined\b).{0,20}/) || [null])[0];
      const px = (() => { const S = window.__cm.scena; S.disegna(); const c = document.createElement('canvas'); c.width = 64; c.height = 64; c.getContext('2d').drawImage(S.ren.domElement, 0, 0, 64, 64); const d = c.getContext('2d').getImageData(0, 0, 64, 64).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] + d[i + 1] + d[i + 2] > 120) n++; return n; })(); o.acceso = px;
      return o;
    });
    att(nome + ' · il modello pronto «benzene»', 'C₆H₆', r2.formula);
    vero(nome + ' · la didascalia dichiara MODELLO (' + r2.dida + ')', /MODELLO/.test(r2.dida));
    vero(nome + ' · la scena è disegnata (' + r2.acceso + ' pixel accesi su 4096)', r2.acceso > 40);
    att(nome + ' · l\'esportazione AR produce un GLB valido', 'glTF', r2.glb);
    att(nome + ' · non sborda e non mostra valori mancanti', '0 null', r2.sb + ' ' + r2.strano);
    att(nome + ' · nessun errore JavaScript', 0, errs.length); errs.slice(0, 3).forEach(e => console.log('      ! ' + e));
    await cx.close();
  }
  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.stack || e.message); process.exit(1); });
