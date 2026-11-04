#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   test_spectra_rig — il rig automatico (bsi-spectra-rig.js)

   PERCHE' QUESTO BANCO ESISTE
   Il corpo di Spectra scelto dall'autore e' una figura senza scheletro: il rig
   automatico le da' ossa, pesi, colori dell'app e toglie la testa per il volto
   «Noir». Il modello non sta nel repository (licenza da chiarire), quindi il
   banco costruisce un UMANOIDE SINTETICO in posa ad A (busto, braccia e gambe
   come tubi continui, testa con un cappuccio) e controlla che:
   · lo scheletro abbia i nomi Mixamo e il driver del corpo lo riconosca
     (ossa, locomozione);
   · i pesi siano normalizzati (somma 1) e stiano dove devono: la mano alle ossa
     della mano e dell'avambraccio, il fianco del busto accanto alla mano pendente
     a NESSUN osso del braccio (il difetto che strappava il busto), una gamba
     mai all'osso dell'altra;
   · nel gesto «spiega» la mano si sposti davvero e il fianco resti fermo;
   · la camminata sposti il corpo;
   · la testa sparisca (e col cappuccio si tenga la parte dietro);
   · la ricolorazione dia il blu notte e trasformi i dettagli turchesi in luce;
   · nessun errore JavaScript.

   USO   node tools/banchi/test_spectra_rig.js    (serve un server su :8899)
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
  const pg = await (await b.newContext({ serviceWorkers: 'block' })).newPage(), errs = [];
  pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(BASE + 'manifest.json');
  await pg.setContent('<!doctype html><meta charset="utf-8"><body>' + ['three.min.js', 'bsi-spectra-corpo.js', 'bsi-spectra-rig.js'].map(s => '<script src="' + BASE + s + '"></script>').join(''));
  await pg.waitForFunction(() => window.THREE && window.BSISpectraRig && window.BSISpectraCorpo);
  const R = await pg.evaluate(() => {
    const T = THREE;
    /* ── l'umanoide sintetico, 1 m (poi scalato a 1,8): una mesh sola, senza ossa ── */
    const pezzi = [];
    function tubo(a, b, r, seg) { const A = new T.Vector3(...a), B = new T.Vector3(...b), d = B.clone().sub(A), g = new T.CylinderGeometry(r, r, d.length(), 12, seg || 12, false);
      g.applyMatrix4(new T.Matrix4().makeRotationFromQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), d.clone().normalize()))); g.translate(...A.clone().add(B).multiplyScalar(0.5).toArray()); pezzi.push(g); }
    tubo([0, 0.40, 0.02], [0, 0.80, 0.02], 0.12, 16);                 /* busto */
    tubo([0, 0.80, 0.02], [0, 0.84, 0.02], 0.04, 2);                  /* collo */
    const testa = new T.SphereGeometry(0.06, 16, 12); testa.translate(0, 0.90, 0.03); pezzi.push(testa);
    const capp = new T.SphereGeometry(0.075, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.75); capp.translate(0, 0.905, 0.02); pezzi.push(capp);
    [1, -1].forEach(s => {
      tubo([s * 0.15, 0.775, 0.015], [s * 0.245, 0.47, 0.04], 0.035, 24);   /* braccio intero, in posa ad A */
      tubo([s * 0.075, 0.42, 0.02], [s * 0.10, 0.02, 0.0], 0.05, 24);       /* gamba intera */
      const piede = new T.BoxGeometry(0.07, 0.03, 0.14, 2, 1, 4); piede.translate(s * 0.10, 0.015, 0.04); pezzi.push(piede);
    });
    const pos = [], nor = [], uv = [], ind = []; let base = 0;
    pezzi.forEach(g => { const gi = g.index ? g : null, p = g.attributes.position, n = g.attributes.normal, u = g.attributes.uv;
      for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i)); uv.push(u ? u.getX(i) : 0, u ? u.getY(i) : 0); }
      if (gi) for (let i = 0; i < gi.index.count; i++) ind.push(base + gi.index.getX(i)); base += p.count; });
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new T.Float32BufferAttribute(nor, 3)); geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); geo.setIndex(ind);
    function scena() { const sc = new T.Group(); sc.add(new T.Mesh(geo, new T.MeshStandardMaterial())); return sc; }
    const out = {};
    const t0 = performance.now(); const Rg = BSISpectraRig.rigga(scena(), { T, altezza: 1.8, togliTesta: true, cappuccio: true, apertura: 42, ricolora: false }); out.ms = Math.round(performance.now() - t0);
    const Rsenza = BSISpectraRig.rigga(scena(), { T, altezza: 1.8, togliTesta: true, cappuccio: false, ricolora: false });
    const Rintera = BSISpectraRig.rigga(scena(), { T, altezza: 1.8, togliTesta: false, ricolora: false });
    out.tolti = [Rg.tolti, Rsenza.tolti, Rintera.tolti];
    /* la definizione: tassellazione di Phong, un livello */
    const Rd = BSISpectraRig.rigga(scena(), { T, altezza: 1.8, togliTesta: false, suddividi: 1, ricolora: false });
    const gd = Rd.mesh.geometry, swd = gd.attributes.skinWeight.array; let errD = 0; for (let i = 0; i < gd.attributes.position.count; i++) errD = Math.max(errD, Math.abs(swd[i * 4] + swd[i * 4 + 1] + swd[i * 4 + 2] + swd[i * 4 + 3] - 1));
    /* la pelle resta chiusa: ogni lato interno e' condiviso da due triangoli (contando i vertici saldati per posizione) */
    const pd = gd.attributes.position, idd = gd.index.array, kd = i => Math.round(pd.getX(i) * 1e4) + ',' + Math.round(pd.getY(i) * 1e4) + ',' + Math.round(pd.getZ(i) * 1e4), conta = {};
    for (let t = 0; t < idd.length; t += 3) for (let c = 0; c < 3; c++) { const a = kd(idd[t + c]), b = kd(idd[t + (c + 1) % 3]), e = a < b ? a + '|' + b : b + '|' + a; conta[e] = (conta[e] || 0) + 1; }
    const contaO = {}, po = geo.attributes.position, io = geo.index.array, ko = i => Math.round(po.getX(i) * 1e4) + ',' + Math.round(po.getY(i) * 1e4) + ',' + Math.round(po.getZ(i) * 1e4);
    for (let t = 0; t < io.length; t += 3) for (let c = 0; c < 3; c++) { const a = ko(io[t + c]), b = ko(io[t + (c + 1) % 3]), e = a < b ? a + '|' + b : b + '|' + a; contaO[e] = (contaO[e] || 0) + 1; }
    const bordi = o => Object.values(o).filter(x => x === 1).length;
    out.def = { tri0: Rintera.mesh.geometry.index.count / 3, tri1: gd.index.count / 3, errD, bordi0: bordi(contaO), bordi1: bordi(conta) };
    /* il cappuccio col solo viso: nessun triangolo tolto, foro nello shader, cappuccio rigido con la testa */
    const Rv = BSISpectraRig.rigga(scena(), { T, altezza: 1.8, togliTesta: true, cappuccio: true, visiera: false, gonfia: 1.2, viso: { y: 1.62, ax: 0.06, ay: 0.07 }, ricolora: false });
    const mv = Rv.mesh.material, gv = Rv.mesh.geometry, nv = Rv.mesh.skeleton.bones.map(o => o.name), iH = nv.indexOf('Head');
    let rigidi = 0, sopra = 0; for (let i = 0; i < gv.attributes.position.count; i++) if (gv.attributes.position.getY(i) > 1.8 * 0.84) { sopra++; if (gv.attributes.skinIndex.array[i * 4] === iH && gv.attributes.skinWeight.array[i * 4] === 1) rigidi++; }
    const sh = { uniforms: {}, vertexShader: '#include <begin_vertex>', fragmentShader: '#include <clipping_planes_fragment>\n#include <dithering_fragment>' }; mv.onBeforeCompile(sh);
    const om = gv.attributes.aOmbra; let inOmbra = 0; if (om) for (let i = 0; i < om.count; i++) inOmbra += om.getX(i);
    out.viso = { inOmbra, ombraShader: /vOmbra/.test(sh.fragmentShader), tolti: Rv.tolti, doppio: mv.side === T.DoubleSide, chiave: mv.customProgramCacheKey(), discard: /discard/.test(sh.fragmentShader) && /vRig = position/.test(sh.vertexShader), rigidi, sopra };
    out.ossa = Rg.mesh.skeleton.bones.length; out.mixamo = ['Hips', 'Spine2', 'Neck', 'Head', 'LeftArm', 'RightForeArm', 'LeftHand', 'RightUpLeg', 'LeftLeg', 'RightFoot'].every(n => Rg.ossa[n] && Rg.ossa[n].isBone);
    const C = BSISpectraCorpo.crea(Rg.radice, {}); out.rap = C.rapporto();
    const G = Rg.mesh.geometry, P = G.attributes.position, SI = G.attributes.skinIndex.array, SW = G.attributes.skinWeight.array, nomi = Rg.mesh.skeleton.bones.map(o => o.name), n = P.count;
    let errSomma = 0; for (let i = 0; i < n; i++) errSomma = Math.max(errSomma, Math.abs(SW[i * 4] + SW[i * 4 + 1] + SW[i * 4 + 2] + SW[i * 4 + 3] - 1)); out.errSomma = errSomma;
    function peso(i, re) { let w = 0; for (let k = 0; k < 4; k++) if (re.test(nomi[SI[i * 4 + k]])) w += SW[i * 4 + k]; return w; }
    function vicino(x, y, z) { let b = -1, d = 1e9; for (let i = 0; i < n; i++) { const dd = Math.hypot(P.getX(i) - x, P.getY(i) - y, P.getZ(i) - z); if (dd < d) { d = dd; b = i; } } return b; }
    /* (le coordinate scalate: x e z ×1,8 attorno al centro, y ×1,8 dal suolo) */
    const k = 1.8, mano = vicino(0.245 * k + 0.03, 0.47 * k, 0.04 * k - 0.0), fianco = vicino(0.12 * k, 0.47 * k, 0.02 * k - 0.018), gamba = vicino(0.075 * k + 0.05 * k, 0.25 * k, 0);
    out.mano = +peso(mano, /^Left(Hand|ForeArm)$/).toFixed(3); out.fianco = +peso(fianco, /^(Left|Right)(Arm|ForeArm|Hand)$/).toFixed(3); out.gambaAltra = +peso(gamba, /^Right(UpLeg|Leg|Foot|ToeBase)$/).toFixed(3); out.gambaSua = +peso(gamba, /^Left(UpLeg|Leg)$/).toFixed(3);
    function dove(i) { Rg.radice.updateMatrixWorld(true); Rg.mesh.skeleton.update(); const v = new T.Vector3().fromBufferAttribute(P, i); Rg.mesh.boneTransform(i, v); return v; }
    for (let i = 0; i < 30; i++) C.passo(1 / 30);
    const m0 = dove(mano), f0 = dove(fianco);
    C.fai('spiega', null, 9); for (let i = 0; i < 60; i++) C.passo(1 / 30);
    out.manoSi = +dove(mano).distanceTo(m0).toFixed(3); out.fiancoSi = +dove(fianco).distanceTo(f0).toFixed(3);
    C.gesto = null; const r0 = Rg.radice.position.clone(); C.cammina(new T.Vector3(0, 0, 3)); for (let i = 0; i < 45; i++) C.passo(1 / 30); out.cammino = +Rg.radice.position.distanceTo(r0).toFixed(3);
    /* ── la ricolorazione: grigio medio → blu notte; turchese → luce verde acqua ── */
    const cv = document.createElement('canvas'); cv.width = 4; cv.height = 1; const g2 = cv.getContext('2d');
    [[128, 128, 128], [20, 20, 20], [235, 235, 235], [30, 150, 200]].forEach((c, i) => { g2.fillStyle = 'rgb(' + c + ')'; g2.fillRect(i, 0, 1, 1); });
    const tx = new T.Texture(cv); const RC = BSISpectraRig.ricolora(tx, T);
    const px = (t, i) => Array.from(t.image.getContext('2d').getImageData(i, 0, 1, 1).data).slice(0, 3);
    out.colori = [0, 1, 2, 3].map(i => px(RC.mappa, i)); out.emissivi = [0, 3].map(i => px(RC.emissiva, i));
    return out;
  });
  console.log('── Lo scheletro ──');
  vero('rig costruito in ' + R.ms + ' ms (sotto 3 s)', R.ms < 3000);
  att('27 ossa (20 che pesano e 7 punte)', 27, R.ossa);
  vero('nomi Mixamo (Hips, Spine2, Neck, Head, LeftArm, RightForeArm…)', R.mixamo);
  vero('il driver del corpo le riconosce (' + R.rap.ossa + ')', parseInt(R.rap.ossa) >= 20);
  vero('e sa camminare (locomozione)', R.rap.locomozione);
  console.log('── I pesi ──');
  vero('somma dei pesi = 1 su ogni vertice (scarto ' + R.errSomma.toExponential(1) + ')', R.errSomma < 1e-3);
  vero('la mano va alla mano e all\'avambraccio (' + R.mano + ')', R.mano > 0.8);
  att('il fianco accanto alla mano pendente: nessun peso del braccio', 0, R.fianco);
  att('una gamba non tocca mai l\'altra', 0, R.gambaAltra);
  vero('la gamba sinistra va alle sue ossa (' + R.gambaSua + ')', R.gambaSua > 0.9);
  console.log('── Il movimento ──');
  vero('nel gesto «spiega» la mano si sposta (' + R.manoSi + ' m)', R.manoSi > 0.15);
  vero('e il fianco resta fermo (' + R.fiancoSi + ' m)', R.fiancoSi < 0.03);
  vero('la camminata sposta il corpo (' + R.cammino + ' m)', R.cammino > 0.3);
  console.log('── La definizione ──');
  att('tassellazione: ogni triangolo ne diventa quattro (' + R.def.tri0 + ' → ' + R.def.tri1 + ')', R.def.tri0 * 4, R.def.tri1);
  vero('i pesi restano normalizzati anche sui vertici nuovi (scarto ' + R.def.errD.toExponential(1) + ')', R.def.errD < 1e-3);
  att('la pelle resta chiusa: i bordi aperti raddoppiano soltanto (ogni lato di bordo diventa due)', R.def.bordi0 * 2, R.def.bordi1);
  console.log('── Testa e cappuccio ──');
  vero('senza testa: tolti ' + R.tolti[1] + ' triangoli', R.tolti[1] > 100);
  vero('col cappuccio se ne tolgono meno (' + R.tolti[0] + '): la nuca resta', R.tolti[0] > 0 && R.tolti[0] < R.tolti[1]);
  att('con la testa: nessun triangolo tolto', 0, R.tolti[2]);
  att('col solo viso: nessun triangolo tolto (il foro è nello shader)', 0, R.viso.tolti);
  vero('il foro è un\'ellisse al pixel, sulla posa di riposo (segue la testa)', R.viso.discard && /bsi-rig-viso/.test(R.viso.chiave));
  vero('niente visiera nera: il casco sotto il cappuccio diventa ombra opaca (' + R.viso.inOmbra + ' vertici, nessuno tolto)', R.viso.inOmbra > 0 && R.viso.ombraShader);
  vero('dal foro si vede l\'interno del casco (doppia faccia), non il vuoto', R.viso.doppio);
  vero('il cappuccio è rigido con la testa (' + R.viso.rigidi + '/' + R.viso.sopra + ' vertici)', R.viso.sopra > 50 && R.viso.rigidi === R.viso.sopra);
  console.log('── I colori dell\'app ──');
  const [grigio, scuro, chiaro, turchese] = R.colori;
  vero('il grigio medio diventa blu notte ' + JSON.stringify(grigio), grigio[2] > grigio[0] + 15 && grigio[2] < 120);
  vero('le ombre restano quasi nere ' + JSON.stringify(scuro), Math.max(...scuro) < 30);
  vero('le luci restano chiare, appena azzurre ' + JSON.stringify(chiaro), chiaro[2] > 160 && chiaro[2] >= chiaro[0]);
  vero('il turchese diventa luce verde acqua ' + JSON.stringify(R.emissivi[1]), R.emissivi[1][1] > 80 && R.emissivi[1][0] === 0);
  att('il grigio non emette luce', '0,0,0', R.emissivi[0].join(','));
  att('nessun errore JavaScript', 0, errs.length);
  errs.slice(0, 3).forEach(e => console.log('      ! ' + e.slice(0, 200)));
  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
