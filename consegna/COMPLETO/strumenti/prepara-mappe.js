#!/usr/bin/env node
/* prepara-mappe.js — le mappe dei laboratori di ATOMIC PROTOCOL.

   Dai modelli forniti dall'utente (Sketchfab; i tre in USDZ prima convertiti
   con tools/usd-in-glb.py) ai file che il gioco carica:

     models/mappe/<nome>.glb    la mappa ottimizzata: materiali spec/gloss
                                riportati a metal/rough, mesh unite per
                                materiale, geometria semplificata (meshopt)
                                fino al bilancio di triangoli, texture JPEG/PNG
                                ridotte, scala in metri, pavimento a y = 0
     models/mappe/<nome>.json   la GRIGLIA DI CAMMINO: per ogni cella da 25 cm
                                fino a tre pavimenti, ciascuno segnato
                                percorribile o no (c'e' qualcosa fra 40 cm e
                                1,75 m sopra, o a meno di 30 cm di distanza),
                                piu' il punto d'ingresso, il posto del banco,
                                i punti luce sotto il soffitto e i limiti

   La griglia si calcola qui, una volta, nel browser (con lo stesso three.js
   del gioco, cosi' le trasformazioni sono identiche): il gioco la legge e
   basta.

   uso:  node tools/prepara-mappe.js <cartella dei sorgenti .glb> [nome …]
   servono @gltf-transform/core|extensions|functions, meshoptimizer e sharp
   (npm i --no-save @gltf-transform/core@4 @gltf-transform/extensions@4
    @gltf-transform/functions@4 meshoptimizer@0.21 sharp@0.33), e Chromium */
'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');

const RADICE = path.resolve(__dirname, '..');
const USCITA = path.join(RADICE, 'models', 'mappe');

/* le mappe: sorgente, scala (metri per unita'), giro intorno a y, bilancio
   di triangoli, lato massimo delle texture */
const MAPPE = {
  small:       { file: 'small.glb',       scala: 3.0 / 55.4, tri: 60000,  tex: 1024, titolo: 'Small Lab' },
  overgrown:   { file: 'overgrown.glb',   scala: 1.7,        tri: 110000, tex: 1024, titolo: 'Overgrown Laboratory' },
  scifi1:      { file: 'scifi1.glb',      scala: 1,          tri: 110000, tex: 1024, titolo: 'Sci-fi lab' },
  flynn:       { file: 'flynn.glb',       scala: 1,          tri: 60000,  tex: 512,  titolo: "Flynn's Secret Lab [Tron Legacy]" },
  underground: { file: 'underground.glb', scala: 1,          tri: 160000, tex: 512,  titolo: 'Location underground laboratory' },
  /* le due apparecchiature: non si percorrono, si mettono nei laboratori */
  reattore:    { file: 'quantum.glb',     scala: 1.6,        tri: 60000,  tex: 1024, titolo: 'Quantum_Laboratory_X_Alpha', oggetto: true },
  capsula:     { file: 'scifi2.glb',      scala: 0.8,        tri: 40000,  tex: 512,  titolo: 'Sci Fi lab', oggetto: true }
};

async function ottimizza(src, dst, cfg) {
  const { NodeIO } = require('@gltf-transform/core');
  const { ALL_EXTENSIONS } = require('@gltf-transform/extensions');
  const F = require('@gltf-transform/functions');
  const { MeshoptSimplifier } = require('meshoptimizer');
  const sharp = require('sharp');
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
  const doc = await io.read(src);
  const crediti = doc.getRoot().getAsset().extras || {};
  /* scala e pavimento: un nodo radice nuovo che porta tutto */
  const scena = doc.getRoot().getDefaultScene() || doc.getRoot().listScenes()[0];
  const radice = doc.createNode('mappa').setScale([cfg.scala, cfg.scala, cfg.scala]);
  scena.listChildren().forEach(n => { scena.removeChild(n); radice.addChild(n); });
  scena.addChild(radice);
  await doc.transform(
    F.metalRough(),
    F.dedup(), F.prune(),
    F.flatten(), F.join({ keepNamed: false }),
    F.weld(),
    F.simplify({ simplifier: MeshoptSimplifier, ratio: 1, error: 0.0005 })
  );
  /* il bilancio di triangoli: si semplifica finche' non ci si sta */
  const contaTri = () => doc.getRoot().listMeshes().reduce((a, m) => a + m.listPrimitives().reduce((b, p) => {
    const i = p.getIndices(); return b + (i ? i.getCount() : p.getAttribute('POSITION').getCount()) / 3;
  }, 0), 0);
  let tri = contaTri();
  for (let giro = 0; giro < 6 && tri > cfg.tri; giro++) {
    await doc.transform(F.simplify({ simplifier: MeshoptSimplifier, ratio: Math.max(0.05, cfg.tri / tri * 0.95), error: 0.002 * (giro + 1) }));
    tri = contaTri();
  }
  await doc.transform(
    F.textureCompress({ encoder: sharp, targetFormat: 'jpeg', resize: [cfg.tex, cfg.tex], quality: 82,
                        pattern: /^(?!.*(alpha|opac|glass|vetro)).*$/i }),
    F.prune()
  );
  /* le texture con trasparenza restano PNG ma ridotte */
  await doc.transform(F.textureCompress({ encoder: sharp, resize: [cfg.tex, cfg.tex] }));
  doc.getRoot().getAsset().extras = Object.assign({}, crediti, {
    note: 'Adattato per BioSpecInfo (tools/prepara-mappe.js): materiali metal/rough, mesh unite, geometria semplificata a ' +
          Math.round(tri) + ' triangoli, texture ridotte a ' + cfg.tex + ' px, scala in metri.'
  });
  await io.write(dst, doc);
  return { tri: Math.round(tri), crediti };
}

/* la griglia di cammino: nel browser, con three e il GLTFLoader del gioco */
async function griglia(nome) {
  const { chromium } = require(path.join(RADICE, 'node_modules', 'playwright-core'));
  const exe = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find(p => fs.existsSync(p));
  const srv = http.createServer((q, r) => {
    if (q.url === '/__vuota') { r.writeHead(200, { 'content-type': 'text/html' }); r.end('<html><body></body></html>'); return; }
    const f = path.join(RADICE, decodeURIComponent(q.url.split('?')[0]));
    if (!f.startsWith(RADICE) || !fs.existsSync(f)) { r.writeHead(404); r.end(); return; }
    r.writeHead(200); fs.createReadStream(f).pipe(r);
  });
  await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
  const porta = srv.address().port;
  const b = await chromium.launch(exe ? { executablePath: exe, args: ['--no-sandbox'] } : {});
  const pg = await b.newPage();
  pg.on('pageerror', e => console.error('  ! ' + e.message));
  await pg.goto('http://127.0.0.1:' + porta + '/__vuota');
  await pg.addScriptTag({ url: 'http://127.0.0.1:' + porta + '/three.min.js' });
  await pg.addScriptTag({ url: 'http://127.0.0.1:' + porta + '/gltf_loader.js' });
  const ris = await pg.evaluate(async (url) => {
    const T = THREE;
    const gltf = await new Promise((ok, ko) => new T.GLTFLoader().load(url, ok, null, ko));
    const sc = gltf.scene; sc.updateMatrixWorld(true);
    /* tutti i triangoli nel mondo */
    const tri = [];
    sc.traverse(o => {
      if (!o.isMesh) return;
      const g = o.geometry, p = g.attributes.position, idx = g.index;
      const n = idx ? idx.count : p.count, v = [new T.Vector3(), new T.Vector3(), new T.Vector3()];
      for (let i = 0; i < n; i += 3) {
        for (let k = 0; k < 3; k++) v[k].fromBufferAttribute(p, idx ? idx.getX(i + k) : i + k).applyMatrix4(o.matrixWorld);
        tri.push([v[0].x, v[0].y, v[0].z, v[1].x, v[1].y, v[1].z, v[2].x, v[2].y, v[2].z]);
      }
    });
    const bb = new T.Box3().setFromObject(sc);
    const C = 0.25;                                     /* la cella */
    const x0 = bb.min.x, z0 = bb.min.z;
    const NX = Math.ceil((bb.max.x - x0) / C) + 1, NZ = Math.ceil((bb.max.z - z0) / C) + 1;
    const pav = Array.from({ length: NX * NZ }, () => []);   /* altezze dei pavimenti */
    const ost = Array.from({ length: NX * NZ }, () => []);   /* intervalli [y0, y1] degli ostacoli */
    const sopra = (px, pz, t) => {                       /* il punto (px,pz) e' dentro il triangolo in pianta? altezza */
      const ax = t[0], az = t[2], bx = t[3], bz = t[5], cx = t[6], cz = t[8];
      const d = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz);
      if (Math.abs(d) < 1e-12) return null;
      const l1 = ((bz - cz) * (px - cx) + (cx - bx) * (pz - cz)) / d;
      const l2 = ((cz - az) * (px - cx) + (ax - cx) * (pz - cz)) / d;
      const l3 = 1 - l1 - l2;
      if (l1 < -1e-4 || l2 < -1e-4 || l3 < -1e-4) return null;
      return l1 * t[1] + l2 * t[4] + l3 * t[7];
    };
    const distSeg = (px, pz, ax, az, bx, bz) => {
      const vx = bx - ax, vz = bz - az, w = vx * vx + vz * vz;
      let k = w ? ((px - ax) * vx + (pz - az) * vz) / w : 0; k = Math.max(0, Math.min(1, k));
      return Math.hypot(px - ax - vx * k, pz - az - vz * k);
    };
    for (const t of tri) {
      const ux = t[3] - t[0], uy = t[4] - t[1], uz = t[5] - t[2], vx = t[6] - t[0], vy = t[7] - t[1], vz = t[8] - t[2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, nl = Math.hypot(nx, ny, nz) || 1;
      const verticale = Math.abs(ny / nl);
      const mnx = Math.min(t[0], t[3], t[6]), mxx = Math.max(t[0], t[3], t[6]);
      const mnz = Math.min(t[2], t[5], t[8]), mxz = Math.max(t[2], t[5], t[8]);
      const mny = Math.min(t[1], t[4], t[7]), mxy = Math.max(t[1], t[4], t[7]);
      const i0 = Math.max(0, Math.floor((mnx - x0) / C - 0.5)), i1 = Math.min(NX - 1, Math.ceil((mxx - x0) / C + 0.5));
      const k0 = Math.max(0, Math.floor((mnz - z0) / C - 0.5)), k1 = Math.min(NZ - 1, Math.ceil((mxz - z0) / C + 0.5));
      for (let i = i0; i <= i1; i++) for (let k = k0; k <= k1; k++) {
        const px = x0 + i * C, pz = z0 + k * C;
        const h = sopra(px, pz, t);
        if (h != null && verticale > 0.6 && ny > 0) { pav[k * NX + i].push(h); continue; }
        /* ostacolo: il triangolo tocca la cella (dentro, o a meno di mezza cella) */
        let tocca = h != null;
        if (!tocca) tocca = Math.min(distSeg(px, pz, t[0], t[2], t[3], t[5]), distSeg(px, pz, t[3], t[5], t[6], t[8]),
                                     distSeg(px, pz, t[6], t[8], t[0], t[2])) < C * 0.5;
        if (tocca) ost[k * NX + i].push(h != null && verticale > 0.6 ? [h, h] : [mny, mxy]);
      }
    }
    /* per ogni cella fino a tre pavimenti (dal piu' basso), distinti di
       almeno 1,8 m; percorribile se niente fra +0,4 e +1,75 */
    const MAXP = 3, H = new Int16Array(NX * NZ * MAXP).fill(-32768), LIB = new Uint8Array(NX * NZ * MAXP), COP = new Uint8Array(NX * NZ * MAXP);
    for (let c = 0; c < NX * NZ; c++) {
      const hs = pav[c].sort((a, b) => a - b), scelti = [];
      hs.forEach(h => {
        if (!scelti.length) { scelti.push(h); return; }
        const u = scelti[scelti.length - 1];
        if (h - u < 0.25) scelti[scelti.length - 1] = h;  /* piastrelle, un tappeto: lo stesso pavimento */
        else if (h - u >= 1.8) scelti.push(h);            /* un piano sopra */
        /* in mezzo: un piano di lavoro, un tavolo — un ostacolo, non un pavimento */
      });
      scelti.slice(-MAXP).forEach((h, j) => {
        H[c * MAXP + j] = Math.round(h * 100);
        let ok = true;
        for (const iv of ost[c]) if (iv[1] > h + 0.4 && iv[0] < h + 1.75) { ok = false; break; }
        /* un pavimento vero ha un soffitto: senza niente sopra entro 8 m e'
           il tetto della mappa, visto da fuori */
        let tetto = false;
        for (const iv of ost[c]) if (iv[0] > h + 1.75 && iv[0] < h + 8) { tetto = true; break; }
        if (!tetto) for (const h2 of hs) if (h2 > h + 1.75 && h2 < h + 8) { tetto = true; break; }
        /* senza soffitto si accetta solo se e' ben sotto la cima della mappa
           (le mappe aperte in alto, come un diorama) */
        if (!tetto && h > bb.max.y - 1.5) ok = false;
        COP[c * MAXP + j] = tetto ? 1 : 0;
        /* anche un pavimento che sta sopra di poco (un tavolo) blocca */
        for (const h2 of hs) if (h2 > h + 0.4 && h2 < h + 1.75) { ok = false; break; }
        LIB[c * MAXP + j] = ok ? 1 : 0;
      });
    }
    /* il raggio del chimico: una cella resta percorribile solo se le quattro
       celle accanto (25 cm) hanno un pavimento percorribile a meno di 45 cm */
    const R = 1, LIB2 = new Uint8Array(LIB.length);
    const trova = (i, k, h) => {
      if (i < 0 || k < 0 || i >= NX || k >= NZ) return false;
      for (let j = 0; j < MAXP; j++) { const v = H[(k * NX + i) * MAXP + j]; if (v !== -32768 && Math.abs(v - h) <= 45 && LIB[(k * NX + i) * MAXP + j]) return true; }
      return false;
    };
    for (let k = 0; k < NZ; k++) for (let i = 0; i < NX; i++) for (let j = 0; j < MAXP; j++) {
      const c = (k * NX + i) * MAXP + j; if (!LIB[c]) continue;
      let ok = true;
      for (const [a, b2] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!trova(i + a, k + b2, H[c])) { ok = false; break; }
      LIB2[c] = ok ? 1 : 0;
    }
    /* la componente connessa piu' grande: li' si entra */
    const comp = new Int32Array(LIB2.length).fill(-1); let migliore = -1, nc = 0; const compInfo = [];
    for (let s = 0; s < LIB2.length; s++) {
      if (!LIB2[s] || comp[s] >= 0) continue;
      const coda = [s]; comp[s] = nc; let dim = 0, coperte = 0;
      while (coda.length) {
        const c = coda.pop(); dim++; coperte += COP[c];
        const cell = Math.floor(c / MAXP), i = cell % NX, k = Math.floor(cell / NX), h = H[c];
        for (const [a, b2] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const ii = i + a, kk = k + b2; if (ii < 0 || kk < 0 || ii >= NX || kk >= NZ) continue;
          for (let j = 0; j < MAXP; j++) { const c2 = (kk * NX + ii) * MAXP + j; if (LIB2[c2] && comp[c2] < 0 && Math.abs(H[c2] - h) <= 45) { comp[c2] = nc; coda.push(c2); } }
        }
      }
      compInfo.push({ id: nc, dim: dim, coperto: coperte > dim * 0.5 });
      nc++;
    }
    /* la piu' grande; ma se una coperta da un soffitto e' grande almeno un
       terzo di quella, la coperta (la grande scoperta e' un tetto) */
    compInfo.sort((a, b) => b.dim - a.dim);
    if (compInfo.length) {
      const coperta = compInfo.find(x => x.coperto && x.dim >= compInfo[0].dim * 0.3);
      migliore = (coperta || compInfo[0]).id;
    }
    for (let c = 0; c < LIB2.length; c++) if (comp[c] !== migliore) LIB2[c] = 0;
    /* la distanza dal bordo (in celle) di ogni cella percorribile */
    const dist = new Float32Array(LIB2.length).fill(0);
    const celle = []; for (let c = 0; c < LIB2.length; c++) if (LIB2[c]) celle.push(c);
    const bordo = celle.filter(c => { const cell = Math.floor(c / MAXP), i = cell % NX, k = Math.floor(cell / NX);
      return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b2]) => !trova2(i + a, k + b2, H[c])); });
    function trova2(i, k, h) {
      if (i < 0 || k < 0 || i >= NX || k >= NZ) return false;
      for (let j = 0; j < MAXP; j++) { const c = (k * NX + i) * MAXP + j; if (LIB2[c] && Math.abs(H[c] - h) <= 45) return true; }
      return false;
    }
    const pos = c => { const cell = Math.floor(c / MAXP); return [x0 + (cell % NX) * C, H[c] / 100, z0 + Math.floor(cell / NX) * C]; };
    const bp = bordo.map(pos);
    celle.forEach(c => { const p = pos(c); let m = 1e9; for (const q of bp) { if (Math.abs(q[1] - p[1]) > 1) continue; const d = Math.hypot(q[0] - p[0], q[2] - p[2]); if (d < m) m = d; } dist[c] = m; });
    /* il soffitto sopra ogni cella: la superficie piu' bassa sopra 2 m */
    const soffitto = c => { const cell = Math.floor(c / MAXP), h = H[c] / 100; let m = 1e9;
      for (const iv of ost[cell]) if (iv[0] > h + 2 && iv[0] < m) m = iv[0];
      for (const h2 of pav[cell]) if (h2 > h + 2 && h2 < m) m = h2;
      return m < 1e8 ? m : h + 3; };
    /* IL BANCO: un vero piano di lavoro della mappa — una superficie
       orizzontale fra 70 cm e 1,15 m sopra il pavimento, larga — accanto a
       una cella percorribile. Si sceglie la cella percorribile con piu'
       piano di lavoro intorno (entro 60 cm), e sul piano piu' vicino si
       mettera' l'apparecchio */
    const piano = new Float32Array(NX * NZ).fill(NaN);
    for (let c = 0; c < NX * NZ; c++) {
      const f = H[c * MAXP]; if (f === -32768) continue;
      for (const h2 of pav[c]) if (h2 > f / 100 + 0.65 && h2 < f / 100 + 1.3) { piano[c] = h2; break; }
    }
    let banco = -1, mira = null, migl = 0;
    celle.forEach(c => {
      const cell = Math.floor(c / MAXP), i = cell % NX, k = Math.floor(cell / NX);
      let n = 0, vic = null, dv = 1e9;
      for (let a = -3; a <= 3; a++) for (let b2 = -3; b2 <= 3; b2++) {
        const ii = i + a, kk = k + b2; if (ii < 0 || kk < 0 || ii >= NX || kk >= NZ) continue;
        const q = piano[kk * NX + ii]; if (isNaN(q) || Math.abs(q - (H[c] / 100 + 0.95)) > 0.35) continue;
        n++; const d = Math.hypot(a, b2); if (d < dv) { dv = d; vic = [x0 + ii * C, q, z0 + kk * C]; }
      }
      const punti = n + Math.min(dist[c], 1) * 3;
      if (n >= 3 && punti > migl) { migl = punti; banco = c; mira = vic; }
    });
    const ord = celle.slice().sort((a, b) => dist[b] - dist[a]);
    if (banco < 0) banco = ord[0];
    const pb = pos(banco);
    let ingresso = ord.find(c => { const p = pos(c); return dist[c] >= 0.6 && Math.hypot(p[0] - pb[0], p[2] - pb[2]) > 2.5; }) || ord[0];
    /* i posti delle apparecchiature (il reattore, la capsula): celle ampie,
       lontane dal banco, dall'ingresso e fra loro */
    const pi = pos(ingresso), posti = [];
    for (const c of ord) {
      if (dist[c] < 0.6 || posti.length >= 3) break;
      const p = pos(c);
      /* lontano dall'ingresso (chi entra deve vedere il laboratorio, non un
         macchinario in faccia), dal banco e dagli altri posti */
      const lontano = Math.hypot(pi[0] - p[0], pi[2] - p[2]) > 3.5 &&
        [pb].concat(posti).every(q => Math.hypot(q[0] - p[0], q[2] - p[2]) > 2.0);
      if (lontano) posti.push(p.map(v => +v.toFixed(2)).concat([+dist[c].toFixed(2)]));
    }
    /* i punti luce: una griglia larga sulle celle percorribili, sotto il soffitto */
    const luci = [], passoL = 3.2;
    const pavLuce = [];
    celle.forEach(c => { const p = pos(c);
      if (dist[c] < 0.5) return;
      if (pavLuce.every((f, n) => Math.hypot(luci[n][0] - p[0], luci[n][2] - p[2]) > passoL || Math.abs(f - p[1]) > 1.5)) {
        pavLuce.push(p[1]);
        luci.push([+p[0].toFixed(2), +(Math.min(soffitto(c), p[1] + 3.2) - 0.35).toFixed(2), +p[2].toFixed(2)]);
      }
    });
    /* in uscita: i pavimenti percorribili, compatti */
    let bin = ''; const u8 = new Uint8Array(H.buffer); for (let i = 0; i < u8.length; i++) bin += String.fromCharCode(u8[i]);
    let bin2 = ''; for (let i = 0; i < LIB2.length; i++) bin2 += String.fromCharCode(LIB2[i]);
    return {
      cella: C, x0: +x0.toFixed(4), z0: +z0.toFixed(4), nx: NX, nz: NZ, piani: MAXP,
      altezze: btoa(bin), libero: btoa(bin2),
      ingresso: pos(ingresso).map(v => +v.toFixed(2)), banco: pb.map(v => +v.toFixed(2)), posti: posti,
      bancoSpazio: +dist[banco].toFixed(2), bancoPiano: mira ? mira.map(v => +v.toFixed(2)) : null,
      luci: luci.slice(0, 64), celleLibere: celle.length, triangoli: tri.length,

      limiti: [bb.min.x, bb.min.y, bb.min.z, bb.max.x, bb.max.y, bb.max.z].map(v => +v.toFixed(2))
    };
  }, 'http://127.0.0.1:' + porta + '/models/mappe/' + nome + '.glb');
  await b.close(); srv.close();
  return ris;
}

(async () => {
  const src = process.argv[2];
  if (!src) { console.error('uso: node tools/prepara-mappe.js <cartella sorgenti> [nome …]'); process.exit(2); }
  const nomi = process.argv.slice(3).length ? process.argv.slice(3) : Object.keys(MAPPE);
  fs.mkdirSync(USCITA, { recursive: true });
  for (const nome of nomi) {
    const cfg = MAPPE[nome];
    const dst = path.join(USCITA, nome + '.glb');
    const r = await ottimizza(path.join(src, cfg.file), dst, cfg);
    let msg = nome + ': ' + r.tri + ' triangoli, ' + (fs.statSync(dst).size / 1048576).toFixed(2) + ' MB';
    if (!cfg.oggetto) {
      const g = await griglia(nome);
      g.titolo = cfg.titolo; g.crediti = r.crediti;
      fs.writeFileSync(path.join(USCITA, nome + '.json'), JSON.stringify(g));
      msg += ' · griglia ' + g.nx + '×' + g.nz + ', ' + g.celleLibere + ' celle libere, banco ' + (g.bancoPiano ? 'su un piano vero' : 'NEL VUOTO') + ', ' + g.luci.length + ' luci, ' + g.posti.length + ' posti per le apparecchiature';
    }
    console.log('→ ' + msg);
  }
})().catch(e => { console.error(e); process.exit(1); });
