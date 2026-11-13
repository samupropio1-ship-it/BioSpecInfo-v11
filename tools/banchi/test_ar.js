#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   test_ar — 🥽 Realtà aumentata unificata (v254): i file e le tre strade

   PERCHE' QUESTO BANCO ESISTE
   L'AR vera si prova solo con un telefono in mano. Quello che si può provare
   qui si prova tutto, perché è la parte che si rompe senza far rumore:
   · i file: il GLB rispetta la struttura glTF 2.0 binaria (intestazione,
     blocchi JSON e BIN, viste allineate a 4 byte, accessori dentro i buffer,
     indici validi, min e max giusti); lo USDZ è uno zip non compresso con i
     dati allineati a 64 byte e il CRC giusto, e la scena USDA è coerente
     (y in alto, metri, ogni indice dentro i punti, al massimo 64 materiali).
     normali di lunghezza 1 e nessun triangolo di area nulla. Durante lo
     sviluppo i file della scena vera degli orbitali sono passati dal
     validatore glTF di Khronos (0 errori, 0 avvisi) e dai 30 validatori di
     USD (0 problemi).
   · la semplificazione (v255): sopra 60 000 triangoli i vertici si
     raggruppano su una griglia; la forma resta entro la cella e i file restano
     validi; lo USDZ della scena degli orbitali scende sotto 4 MB.
   · la conversione: z in alto diventa y in alto, la scena è di 30 cm e posa
     sul piano, i punti diventano ottaedri (al massimo 4000), le linee restano
     fuori, uno specchio non rovescia le facce.
   · le tre strade, nella pagina vera: senza AR si scarica il .glb e lo si
     dice; con Quick Look (simulato) si apre un USDZ con rel="ar"; con WebXR
     (simulato) si chiede «immersive-ar» con hit-test, e se il telefono rifiuta
     si scarica il .glb. Il pulsante «AR» c'è in ogni scena 3D.

   USO   node tools/banchi/test_ar.js    (serve un server su :8899)
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

/* ── controlli dei formati, usati sia in Node sia sui file della pagina ── */
function controllaGLB(buf) {
  const u8 = new Uint8Array(buf), dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength), err = [];
  if (dv.getUint32(0, true) !== 0x46546C67) err.push('magia'); if (dv.getUint32(4, true) !== 2) err.push('versione'); if (dv.getUint32(8, true) !== u8.length) err.push('lunghezza');
  const lj = dv.getUint32(12, true); if (dv.getUint32(16, true) !== 0x4E4F534A) err.push('blocco JSON'); if (lj % 4) err.push('JSON non allineato');
  const json = JSON.parse(new TextDecoder().decode(u8.subarray(20, 20 + lj)));
  const pb = 20 + lj, lb = dv.getUint32(pb, true); if (dv.getUint32(pb + 4, true) !== 0x004E4942) err.push('blocco BIN'); if (pb + 8 + lb !== u8.length) err.push('BIN fuori misura');
  if (json.asset.version !== '2.0') err.push('asset'); if (json.buffers[0].byteLength !== lb) err.push('buffer');
  const bin = new DataView(u8.buffer, u8.byteOffset + pb + 8, lb), dim = { 5126: 4, 5125: 4 }, comp = { VEC3: 3, SCALAR: 1 };
  json.bufferViews.forEach((v, i) => { if (v.byteOffset % 4) err.push('vista ' + i + ' non allineata'); if (v.byteOffset + v.byteLength > lb) err.push('vista ' + i + ' fuori'); });
  json.accessors.forEach((a, i) => { const v = json.bufferViews[a.bufferView]; if (a.count * comp[a.type] * dim[a.componentType] > v.byteLength) err.push('accessore ' + i + ' fuori'); });
  let triangoli = 0;
  json.meshes.forEach(m => m.primitives.forEach(p => {
    const P = json.accessors[p.attributes.POSITION], I = json.accessors[p.indices], vI = json.bufferViews[I.bufferView], vP = json.bufferViews[P.bufferView];
    if (I.count % 3) err.push('indici non a triangoli'); triangoli += I.count / 3;
    for (let k = 0; k < I.count; k++) if (bin.getUint32(vI.byteOffset + k * 4, true) >= P.count) { err.push('indice oltre i vertici'); break; }
    const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
    for (let k = 0; k < P.count * 3; k++) { const x = bin.getFloat32(vP.byteOffset + k * 4, true), c = k % 3; if (!isFinite(x)) { err.push('posizione non finita'); break; } mn[c] = Math.min(mn[c], x); mx[c] = Math.max(mx[c], x); }
    for (let c = 0; c < 3; c++) if (Math.abs(mn[c] - P.min[c]) > 1e-6 || Math.abs(mx[c] - P.max[c]) > 1e-6) { err.push('min/max sbagliati'); break; }
    if (p.attributes.COLOR_0 != null && json.accessors[p.attributes.COLOR_0].count !== P.count) err.push('colori ≠ vertici');
    if (json.accessors[p.attributes.NORMAL].count !== P.count) err.push('normali ≠ vertici');
    const vN = json.bufferViews[json.accessors[p.attributes.NORMAL].bufferView]; for (let k = 0; k < P.count; k++) { const l = Math.hypot(bin.getFloat32(vN.byteOffset + k * 12, true), bin.getFloat32(vN.byteOffset + k * 12 + 4, true), bin.getFloat32(vN.byteOffset + k * 12 + 8, true)); if (Math.abs(l - 1) > 5e-4) { err.push('normale non unitaria'); break; } }
    for (let k = 0; k < I.count; k += 3) { const q = [0, 1, 2].map(j => bin.getUint32(vI.byteOffset + (k + j) * 4, true)), X = q.map(v => [0, 1, 2].map(c => bin.getFloat32(vP.byteOffset + v * 12 + c * 4, true))), u = [0, 1, 2].map(c => X[1][c] - X[0][c]), w = [0, 1, 2].map(c => X[2][c] - X[0][c]); if (Math.hypot(u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]) === 0) { err.push('triangolo degenere'); break; } }
  }));
  return { err, json, triangoli };
}
const TAB = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
function crc(b) { let x = 0xFFFFFFFF; for (let i = 0; i < b.length; i++) x = TAB[(x ^ b[i]) & 0xFF] ^ (x >>> 8); return (x ^ 0xFFFFFFFF) >>> 0; }
function controllaUSDZ(buf) {
  const u8 = new Uint8Array(buf), dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength), err = [];
  if (dv.getUint32(0, true) !== 0x04034b50) return { err: ['non è uno zip'] };
  if (dv.getUint16(8, true) !== 0) err.push('compresso');
  const ln = dv.getUint16(26, true), le = dv.getUint16(28, true), nome = new TextDecoder().decode(u8.subarray(30, 30 + ln)), off = 30 + ln + le, n = dv.getUint32(18, true);
  if (off % 64) err.push('dati non allineati a 64 byte (' + off + ')');
  const dati = u8.subarray(off, off + n); if (crc(dati) !== dv.getUint32(14, true)) err.push('CRC');
  const eocd = u8.length - 22; if (dv.getUint32(eocd, true) !== 0x06054b50) err.push('fine dello zip');
  const testo = new TextDecoder().decode(dati);
  if (!/^#usda 1\.0/.test(testo)) err.push('non è USDA'); if (!/upAxis = "Y"/.test(testo)) err.push('asse'); if (!/metersPerUnit = 1/.test(testo)) err.push('metri');
  let materiali = 0, parti = 0;
  testo.split('def Mesh ').slice(1).forEach(b => {
    parti++;
    const conta = (b.match(/faceVertexCounts = \[([^\]]*)\]/) || [])[1].split(',').length, ind = (b.match(/faceVertexIndices = \[([^\]]*)\]/) || [])[1].split(',').map(Number), punti = (b.match(/point3f\[\] points = \[([^\]]*)\]/) || [])[1].split('),').length;
    if (ind.length !== conta * 3) err.push('facce ≠ indici'); let mx = 0; for (const v of ind) if (v > mx) mx = v; if (mx >= punti) err.push('indice oltre i punti');
  });
  materiali = (testo.match(/def Material /g) || []).length;
  if (materiali !== parti) err.push('materiali ≠ parti'); if (materiali > 64) err.push('più di 64 materiali');
  return { err, nome, off, materiali, testo };
}

(async () => {
  global.window = global; global.THREE = require(path.join(RADICE, 'three.min.js'));
  require(path.join(RADICE, 'bsi-ar.js'));
  const T = THREE, A = global.BSIAR;

  console.log('── La conversione ──');
  const radice = new T.Group();
  const sfera = new T.Mesh(new T.SphereGeometry(1, 24, 16), new T.MeshPhongMaterial({ color: 0x44aaff, transparent: true, opacity: 0.6 })); sfera.position.set(0, 0, 3); radice.add(sfera);
  const g = new T.BufferGeometry(), N = 9000, p = new Float32Array(N * 3), c = new Float32Array(N * 3); for (let i = 0; i < N * 3; i++) { p[i] = Math.sin(i * 12.9898) * 2; c[i] = 0.3; }
  g.setAttribute('position', new T.BufferAttribute(p, 3)); g.setAttribute('color', new T.BufferAttribute(c, 3)); radice.add(new T.Points(g, new T.PointsMaterial({ size: 0.05, vertexColors: true, blending: T.AdditiveBlending })));
  radice.add(new T.AxesHelper(5));
  const scatola = new T.Mesh(new T.BoxGeometry(1, 1, 1), new T.MeshBasicMaterial({ color: 0xff8800 })); scatola.scale.set(-1, 1, 1); scatola.position.set(0, 0, -2); radice.add(scatola);
  const d = A.raccogli(radice, { zSu: true });
  let mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
  d.mesh.forEach(m => { for (let i = 0; i < m.pos.length; i += 3) for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], m.pos[i + k]); mx[k] = Math.max(mx[k], m.pos[i + k]); } });
  att('tre parti: sfera, punti, scatola (gli assi restano fuori)', 3, d.mesh.length);
  vero('la scena è di 30 cm e posa sul piano (y minimo 0, centrata in x e z)', Math.abs(Math.max(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]) - 0.30) < 1e-6 && Math.abs(mn[1]) < 1e-9 && Math.abs(mn[0] + mx[0]) < 1e-6 && Math.abs(mn[2] + mx[2]) < 1e-6);
  const cs = d.mesh[0], ys = []; for (let i = 1; i < cs.pos.length; i += 3) ys.push(cs.pos[i]);
  vero('z in alto diventa y in alto: la sfera (z = +3) è in cima', Math.min(...ys) > 0.15);
  const pt = d.mesh[1]; vero('i 9000 punti diventano al più 4000 ottaedri (' + pt.pos.length / 18 + ')', pt.pos.length / 18 <= 4000 && pt.idx.length === pt.pos.length / 18 * 24);
  vero('il colore additivo dei punti è portato alla piena luminosità', Math.abs(pt.col[0] - 1) < 1e-6);
  const sc = d.mesh[2]; let fuori = 0, tot = 0, cx = 0, cy = 0, cz = 0; for (let i = 0; i < sc.pos.length; i += 3) { cx += sc.pos[i]; cy += sc.pos[i + 1]; cz += sc.pos[i + 2]; } cx /= sc.pos.length / 3; cy /= sc.pos.length / 3; cz /= sc.pos.length / 3;
  for (let i = 0; i < sc.idx.length; i += 3) { const [a, b, e] = [sc.idx[i] * 3, sc.idx[i + 1] * 3, sc.idx[i + 2] * 3], u = [0, 1, 2].map(k => sc.pos[b + k] - sc.pos[a + k]), v = [0, 1, 2].map(k => sc.pos[e + k] - sc.pos[a + k]), n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]], m = [(sc.pos[a] + sc.pos[b] + sc.pos[e]) / 3 - cx, (sc.pos[a + 1] + sc.pos[b + 1] + sc.pos[e + 1]) / 3 - cy, (sc.pos[a + 2] + sc.pos[b + 2] + sc.pos[e + 2]) / 3 - cz]; tot++; if (n[0] * m[0] + n[1] * m[1] + n[2] * m[2] <= 0) fuori++; }
  att('la scatola specchiata (scala −1) ha ancora le facce verso l\'esterno', '0 su 12', fuori + ' su ' + tot);

  console.log('\n── GLB ──');
  const G = controllaGLB(A.glb(d, 'Prova'));
  att('struttura glTF 2.0 binaria senza errori', '', G.err.join(', '));
  att('tre mesh, tre materiali, la trasparenza dichiarata', '3 3 BLEND', G.json.meshes.length + ' ' + G.json.materials.length + ' ' + G.json.materials[0].alphaMode);
  console.log('\n── USDZ ──');
  const U = controllaUSDZ(A.usdz(d, 'Prova'));
  att('zip non compresso, dati a 64 byte, CRC, scena USDA coerente', '', U.err.join(', '));
  att('il file dentro si chiama modello.usda', 'modello.usda', U.nome);
  vero('al massimo 64 materiali (' + U.materiali + ')', U.materiali >= 2 && U.materiali <= 64);
  vero('ogni parte ha il suo materiale con UsdPreviewSurface', /UsdPreviewSurface/.test(U.testo) && /MaterialBindingAPI/.test(U.testo));
  att('una scena vuota (solo linee) non produce niente', 0, A.raccogli(new T.AxesHelper(2)).mesh.length);
  /* la semplificazione: una sfera fittissima scende sotto il tetto, mantiene la forma entro la cella */
  const fitta = new T.Group(); fitta.add(new T.Mesh(new T.SphereGeometry(1, 400, 300), new T.MeshStandardMaterial({ color: 0x88aaff })));
  const ds = A.raccogli(fitta, { zSu: true }), trs = ds.mesh.reduce((q, m) => q + m.idx.length / 3, 0);
  vero('una scena di ' + ds.triangoliPrima + ' triangoli scende a ' + trs + ' (tetto 60 000), cella ' + (ds.cella * 1000).toFixed(2) + ' mm', trs <= 60000 && trs < ds.triangoliPrima / 2);
  let devMax = 0; const cS = 0.15; for (let i = 0; i < ds.mesh[0].pos.length; i += 3) { const x = ds.mesh[0].pos[i], y = ds.mesh[0].pos[i + 1] - cS, z = ds.mesh[0].pos[i + 2]; devMax = Math.max(devMax, Math.abs(Math.hypot(x, y, z) - cS)); }
  vero('dopo la semplificazione ogni vertice resta sulla sfera entro la cella (scarto ' + (devMax * 1000).toFixed(2) + ' mm)', devMax <= ds.cella);
  const Gs = controllaGLB(A.glb(ds, 'sfera')), Us = controllaUSDZ(A.usdz(ds, 'sfera'));
  att('la scena semplificata dà file validi', '', Gs.err.concat(Us.err).join(', '));
  att('CRC32 di «123456789» (valore di riferimento CBF43926)', 'cbf43926', A.crc32(new TextEncoder().encode('123456789')).toString(16));

  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  for (const [nome, opz] of [['telefono', { viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true }], ['schermo grande', { viewport: { width: 1280, height: 860 } }]]) {
    console.log('\n── La pagina, ' + nome + ' ──');
    const cx2 = await b.newContext(Object.assign({ serviceWorkers: 'block', acceptDownloads: true }, opz)), pg = await cx2.newPage(), errs = [];
    pg.on('pageerror', e => errs.push(e.message.slice(0, 200)));
    await pg.addInitScript(() => { try { localStorage.setItem('bsi_guide_v3', '1'); } catch (e) {} });
    await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
    await pg.waitForFunction(() => !!(window.BSISpectraLive && window.BSIAR && window.BSIFisica && BSIFisica.calcolo.orbitali), null, { timeout: 60000 });
    const r0 = await pg.evaluate(async () => {
      const pausa = ms => new Promise(r => setTimeout(r, ms));
      BSISpectraLive.calcolo.apriSezione('sorbitali');
      for (let i = 0; i < 80 && !document.querySelector('#sorbitali .bsiAR-tasto'); i++) await pausa(250);
      await pausa(800);
      const tasti = [...document.querySelectorAll('#sorbitali .bsi3d-barra')].map(b => !!b.querySelector('.bsiAR-tasto'));
      BSISpectraLive.calcolo.apriSezione('sastrobh'); for (let i = 0; i < 40 && !document.querySelector('#sastrobh .bsi3d-barra'); i++) await pausa(250);
      const bh = [...document.querySelectorAll('#sastrobh .bsi3d-barra')].map(b => !!b.querySelector('.bsiAR-tasto'));
      BSISpectraLive.calcolo.apriSezione('sorbitali'); await pausa(400);
      return { tasti, bh, nome: (document.querySelector('#sorbitali .bsiAR-tasto') || {}).getAttribute && document.querySelector('#sorbitali .bsiAR-tasto').getAttribute('aria-label') };
    });
    vero(nome + ' · il pulsante AR c\'è nelle scene 3D degli orbitali e dei buchi neri (' + r0.tasti.length + ' + ' + r0.bh.length + ')', r0.tasti.length && r0.tasti.every(Boolean) && r0.bh.length && r0.bh.every(Boolean));
    vero(nome + ' · il pulsante dice che cosa fa', /Realtà aumentata/.test(r0.nome || ''));
    /* strada 1: niente AR → si scarica il .glb e lo si dice */
    const [dl] = await Promise.all([pg.waitForEvent('download', { timeout: 30000 }), pg.evaluate(() => document.querySelector('#sorbitali .bsiAR-tasto').click())]);
    const file = await dl.path(), G2 = controllaGLB(fs.readFileSync(file));
    await pg.waitForTimeout(300);
    const msg = await pg.evaluate(() => (document.querySelector('.bsiAR-avviso') || {}).textContent || '');
    vero(nome + ' · senza AR scarica «' + dl.suggestedFilename() + '», un GLB valido di ' + G2.triangoli + ' triangoli', /\.glb$/.test(dl.suggestedFilename()) && !G2.err.length && G2.triangoli > 1000);
    vero(nome + ' · e dice perché', /realtà aumentata non c'è/.test(msg));
    /* strada 2: Quick Look simulato */
    const ql = await pg.evaluate(async () => {
      const orig = DOMTokenList.prototype.supports; DOMTokenList.prototype.supports = function (x) { return x === 'ar' ? true : orig.call(this, x); };
      let preso = null; const f = e => { const a = e.target.closest && e.target.closest('a'); if (a && a.rel === 'ar') { preso = { href: a.href, img: !!a.querySelector('img') }; e.preventDefault(); } };
      document.addEventListener('click', f, true);
      const S = BSILab3D.scene().filter(s => s.box.closest('#sorbitali') && s.box.offsetParent)[0];
      const esito = await BSIAR.apri(S.radice, { nome: 'Prova' });
      document.removeEventListener('click', f, true); DOMTokenList.prototype.supports = orig;
      let byte = null; if (preso) { const buf = await (await fetch(preso.href.split('#')[0])).arrayBuffer(); byte = Array.from(new Uint8Array(buf)); }
      return { esito, preso, byte };
    });
    const U2 = ql.byte ? controllaUSDZ(Uint8Array.from(ql.byte)) : { err: ['niente'] };
    vero(nome + ' · con Quick Look apre un USDZ valido con rel="ar" (' + (ql.byte ? (ql.byte.length / 1e6).toFixed(1) + ' MB, ' + U2.materiali + ' materiali' : '—') + ')', ql.esito === 'quicklook' && ql.preso && ql.preso.img && /^blob:/.test(ql.preso.href) && !U2.err.length && ql.byte.length < 4e6);
    /* strada 3: WebXR simulato, che rifiuta */
    const xr = await pg.evaluate(async () => {
      let chiesto = null;
      const finto = { isSessionSupported: m => Promise.resolve(m === 'immersive-ar'), requestSession: (m, o) => { chiesto = { m, o: JSON.stringify(o.requiredFeatures) + JSON.stringify(o.optionalFeatures) }; return Promise.reject(new Error('NotAllowedError')); } };
      Object.defineProperty(navigator, 'xr', { value: finto, configurable: true });
      const s = await BSIAR.supporto(), S = BSILab3D.scene().filter(s => s.box.closest('#sorbitali') && s.box.offsetParent)[0];
      const p = BSIAR.apri(S.radice, { nome: 'Prova' }); const esito = await p;
      return { s, chiesto, esito, resti: document.querySelectorAll('.bsiAR-sovra, .bsiAR-tela').length };
    });
    vero(nome + ' · con WebXR chiede «immersive-ar» con hit-test e dom-overlay', xr.s.webxr && xr.chiesto && xr.chiesto.m === 'immersive-ar' && /hit-test/.test(xr.chiesto.o) && /dom-overlay/.test(xr.chiesto.o));
    vero(nome + ' · se il telefono rifiuta: si scarica il .glb e non resta niente sullo schermo', xr.esito === 'glb' && xr.resti === 0);
    att(nome + ' · nessun errore JavaScript', 0, errs.length); errs.slice(0, 3).forEach(e => console.log('      ! ' + e));
    await cx2.close();
  }
  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.stack || e.message); process.exit(1); });
