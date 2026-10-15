#!/usr/bin/env node
/* prepara-modelli.js — dai modelli che l'utente ha fornito (Sketchfab) ai
   file che ATOMIC PROTOCOL carica in prima persona. I sorgenti pesano 45 MB
   e non stanno nel repository; i derivati si', leggeri:

     mani     «hands animation» (hugo colauto)          → models/mani-atomic.glb
              Geometria, scheletro e animazione identici byte per byte; le
              sei PNG da 2048 px diventano tre JPEG condivisi dalle due mani
              (stessa mesh, stesse UV).
     camice   «Modern Scientist in a Lab Coat» (restore50) → models/manica-atomic.glb
              Dalla scansione intera (128 000 vertici) si ritaglia solo
              l'avambraccio sinistro: la manica del camice con l'orlo e il
              polsino azzurro della camicia, senza la mano. Il gioco la
              specchia per il braccio destro. Della texture resta il colore
              (le normali della scansione sono su un quarto insieme di UV,
              che three r128 non legge; le pieghe vere stanno gia' nella
              geometria).
     pistola  «Capsule Gun» (sc8di)                    → models/pistola-atomic.glb
              Geometria intatta, texture ridotte a JPEG.

   uso: node tools/prepara-modelli.js mani|camice|pistola <sorgente.glb> [uscita.glb]
   Serve Chromium (Playwright) per decodificare e ricomprimere le immagini. */
'use strict';
const fs = require('fs');
const path = require('path');

const COSA = process.argv[2], SORGENTE = process.argv[3];
const PREDEFINITI = { mani: 'mani-atomic.glb', camice: 'manica-atomic.glb', pistola: 'pistola-atomic.glb' };
if (!PREDEFINITI[COSA] || !SORGENTE) {
  console.error('uso: node tools/prepara-modelli.js mani|camice|pistola <sorgente.glb> [uscita.glb]');
  process.exit(2);
}
const USCITA = process.argv[4] || path.join(__dirname, '..', 'models', PREDEFINITI[COSA]);

function leggiGlb(buf) {
  if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error('non e\' un GLB');
  const lj = buf.readUInt32LE(12);
  const json = JSON.parse(buf.slice(20, 20 + lj).toString('utf8'));
  const lb = buf.readUInt32LE(20 + lj);
  return { json, bin: buf.slice(28 + lj, 28 + lj + lb) };
}

function scriviGlb(json, bin) {
  let js = Buffer.from(JSON.stringify(json), 'utf8');
  js = Buffer.concat([js, Buffer.alloc((4 - js.length % 4) % 4, 0x20)]);
  bin = Buffer.concat([bin, Buffer.alloc((4 - bin.length % 4) % 4)]);
  const h = Buffer.alloc(12); h.writeUInt32LE(0x46546c67, 0); h.writeUInt32LE(2, 4);
  h.writeUInt32LE(12 + 8 + js.length + 8 + bin.length, 8);
  const cj = Buffer.alloc(8); cj.writeUInt32LE(js.length, 0); cj.writeUInt32LE(0x4e4f534a, 4);
  const cb = Buffer.alloc(8); cb.writeUInt32LE(bin.length, 0); cb.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([h, cj, js, cb, bin]);
}

/* un buffer binario che cresce allineato a 4 byte, con le sue viste */
function Costruttore() {
  const pezzi = [], viste = []; let off = 0;
  return {
    viste,
    aggiungi(dati, extra) {
      const pad = (4 - off % 4) % 4; if (pad) { pezzi.push(Buffer.alloc(pad)); off += pad; }
      viste.push(Object.assign({ buffer: 0, byteOffset: off, byteLength: dati.length }, extra || {}));
      pezzi.push(dati); off += dati.length;
      return viste.length - 1;
    },
    bin() { return Buffer.concat(pezzi); }
  };
}

function accessore(json, bin, i) {
  const a = json.accessors[i], v = json.bufferViews[a.bufferView];
  const n = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[a.type];
  const C = { 5126: Float32Array, 5125: Uint32Array, 5123: Uint16Array, 5121: Uint8Array }[a.componentType];
  const off = (v.byteOffset || 0) + (a.byteOffset || 0), passo = v.byteStride || n * C.BYTES_PER_ELEMENT;
  const out = new C(a.count * n), dv = new DataView(bin.buffer, bin.byteOffset, bin.length);
  const leggi = C === Float32Array ? (o) => dv.getFloat32(o, true) : C === Uint32Array ? (o) => dv.getUint32(o, true)
    : C === Uint16Array ? (o) => dv.getUint16(o, true) : (o) => dv.getUint8(o);
  for (let k = 0; k < a.count; k++) for (let c = 0; c < n; c++) out[k * n + c] = leggi(off + k * passo + c * C.BYTES_PER_ELEMENT);
  return out;
}

async function ricomprimi(immagini) {
  const { chromium } = require(path.join(__dirname, '..', 'node_modules', 'playwright-core'));
  const exe = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find(p => fs.existsSync(p));
  const b = await chromium.launch(exe ? { executablePath: exe } : {});
  const pg = await b.newPage();
  const out = [];
  for (const im of immagini) {
    const b64 = await pg.evaluate(async ([u, lato, q]) => {
      const img = new Image(); img.src = u; await img.decode();
      const c = document.createElement('canvas'); c.width = c.height = lato;
      const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(img, 0, 0, lato, lato);
      return c.toDataURL('image/jpeg', q).split(',')[1];
    }, ['data:' + im.mime + ';base64,' + im.dati.toString('base64'), im.lato, im.qualita]);
    out.push(Buffer.from(b64, 'base64'));
  }
  await b.close();
  return out;
}

async function pixel(dati, mime, lato) {
  const { chromium } = require(path.join(__dirname, '..', 'node_modules', 'playwright-core'));
  const exe = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find(p => fs.existsSync(p));
  const b = await chromium.launch(exe ? { executablePath: exe } : {});
  const pg = await b.newPage();
  const b64 = await pg.evaluate(async ([u, lato]) => {
    const img = new Image(); img.src = u; await img.decode();
    const c = document.createElement('canvas'); c.width = c.height = lato;
    const x = c.getContext('2d'); x.drawImage(img, 0, 0, lato, lato);
    const d = x.getImageData(0, 0, lato, lato).data;
    let s = ''; for (let i = 0; i < d.length; i++) s += String.fromCharCode(d[i]);
    return btoa(s);
  }, ['data:' + mime + ';base64,' + dati.toString('base64'), lato]);
  await b.close();
  return Buffer.from(b64, 'base64');
}

/* ricopia un GLB tenendo tutte le viste che non sono immagini e mettendo
   al posto delle immagini quelle date */
function ricomponi(json, bin, nuoveImmagini, nomi) {
  const vista = i => { const v = json.bufferViews[i]; return bin.slice(v.byteOffset || 0, (v.byteOffset || 0) + v.byteLength); };
  const vecchie = new Set(json.images.map(im => im.bufferView));
  const B = Costruttore(), mappa = {};
  json.bufferViews.forEach((v, i) => {
    if (vecchie.has(i)) return;
    const extra = {}; if (v.byteStride) extra.byteStride = v.byteStride; if (v.target) extra.target = v.target;
    mappa[i] = B.aggiungi(vista(i), extra);
  });
  json.accessors.forEach(a => { if (a.bufferView != null) a.bufferView = mappa[a.bufferView]; });
  json.images = nuoveImmagini.map((d, k) => ({ bufferView: B.aggiungi(d), mimeType: 'image/jpeg', name: nomi[k] }));
  json.bufferViews = B.viste;
  const nb = B.bin();
  json.buffers = [{ byteLength: nb.length }];
  return nb;
}

function nota(json, testo) {
  json.asset.extras = Object.assign({}, json.asset.extras, { note: testo });
}

async function mani(json, bin) {
  const vista = i => { const v = json.bufferViews[i]; return bin.slice(v.byteOffset || 0, (v.byteOffset || 0) + v.byteLength); };
  const m0 = json.materials[0];
  const sorg = [m0.pbrMetallicRoughness.baseColorTexture.index, m0.pbrMetallicRoughness.metallicRoughnessTexture.index,
                m0.normalTexture.index].map(t => json.textures[t].source);
  const lati = [512, 256, 512], qualita = [0.86, 0.85, 0.92];
  const nuove = await ricomprimi(sorg.map((s, k) => ({ dati: vista(json.images[s].bufferView), mime: json.images[s].mimeType, lato: lati[k], qualita: qualita[k] })));
  const nb = ricomponi(json, bin, nuove, ['colore', 'orm', 'normali']);
  json.textures = [0, 1, 2].map(k => ({ sampler: 0, source: k }));
  json.materials.forEach(m => {
    m.pbrMetallicRoughness.baseColorTexture = { index: 0 };
    m.pbrMetallicRoughness.metallicRoughnessTexture = { index: 1 };
    m.occlusionTexture = { index: 1 };
    m.normalTexture = { index: 2 };
  });
  nota(json, 'Texture ricompresse per BioSpecInfo (tools/prepara-modelli.js): 3 JPEG condivisi da 512/256 px. Geometria, scheletro e animazione invariati.');
  return nb;
}

async function pistola(json, bin) {
  const vista = i => { const v = json.bufferViews[i]; return bin.slice(v.byteOffset || 0, (v.byteOffset || 0) + v.byteLength); };
  const lati = json.images.map((im, k) => k === 1 ? 512 : 1024);
  const nuove = await ricomprimi(json.images.map((im, k) => ({ dati: vista(im.bufferView), mime: im.mimeType, lato: lati[k], qualita: 0.88 })));
  const nb = ricomponi(json, bin, nuove, json.images.map((im, k) => 'immagine' + k));
  nota(json, 'Texture ricompresse per BioSpecInfo (tools/prepara-modelli.js): JPEG da 1024/512 px. Geometria invariata.');
  return nb;
}

/* LA MANICA: i triangoli della scansione che stanno tutti dentro la scatola
   dell'avambraccio sinistro (y dall'orlo del polsino al gomito, x fuori dal
   busto). Si salvano posizione, normale e UV del colore, riportati al
   riferimento della manica del gioco: origine al centro del polsino, asse
   del braccio lungo +z (verso il gomito), metri. */
const SCATOLA = { x: [0.188, 0.30], y: [-0.05, 0.24], z: [-0.2, 0.05] };
async function camice(json, bin) {
  const vista = i => { const v = json.bufferViews[i]; return bin.slice(v.byteOffset || 0, (v.byteOffset || 0) + v.byteLength); };
  /* il colore della texture, per lasciare fuori la pelle del polso che
     sta dentro il polsino */
  const imm0 = json.images[json.textures[json.materials[0].pbrMetallicRoughness.baseColorTexture.index].source];
  const LT = 256, pix = await pixel(vista(imm0.bufferView), imm0.mimeType, LT);
  const pelle = (u, v) => {
    const x = Math.min(LT - 1, Math.max(0, Math.floor(u * LT))), y = Math.min(LT - 1, Math.max(0, Math.floor(v * LT)));
    const o = (y * LT + x) * 4, r = pix[o], g = pix[o + 1], b = pix[o + 2];
    return r > g + 22 && r > b + 35;
  };
  const pos = [], nor = [], uv = [], idx = [];
  json.meshes.forEach(m => {
    const p = m.primitives[0];
    const P = accessore(json, bin, p.attributes.POSITION), N = accessore(json, bin, p.attributes.NORMAL);
    const U = accessore(json, bin, p.attributes.TEXCOORD_0), I = accessore(json, bin, p.indices);
    const dentro = k => P[k * 3] >= SCATOLA.x[0] && P[k * 3] <= SCATOLA.x[1] && P[k * 3 + 1] >= SCATOLA.y[0] &&
      P[k * 3 + 1] <= SCATOLA.y[1] && P[k * 3 + 2] >= SCATOLA.z[0] && P[k * 3 + 2] <= SCATOLA.z[1];
    const nuovo = new Map();
    for (let t = 0; t < I.length; t += 3) {
      if (!dentro(I[t]) || !dentro(I[t + 1]) || !dentro(I[t + 2])) continue;
      const uc = (U[I[t] * 2] + U[I[t + 1] * 2] + U[I[t + 2] * 2]) / 3, vc = (U[I[t] * 2 + 1] + U[I[t + 1] * 2 + 1] + U[I[t + 2] * 2 + 1]) / 3;
      if (pelle(uc, vc)) continue;
      for (let c = 0; c < 3; c++) {
        const k = I[t + c];
        if (!nuovo.has(k)) {
          nuovo.set(k, pos.length / 3);
          pos.push(P[k * 3], P[k * 3 + 1], P[k * 3 + 2]); nor.push(N[k * 3], N[k * 3 + 1], N[k * 3 + 2]); uv.push(U[k * 2], U[k * 2 + 1]);
        }
        idx.push(nuovo.get(k));
      }
    }
  });
  if (!idx.length) throw new Error('scatola vuota: la scansione non e\' quella attesa');
  /* l'asse del braccio: dal centro delle sezioni basse a quello delle alte */
  const centro = (y0, y1) => { let s = [0, 0, 0], n = 0; for (let i = 0; i < pos.length; i += 3) if (pos[i + 1] >= y0 && pos[i + 1] < y1) { s[0] += pos[i]; s[1] += pos[i + 1]; s[2] += pos[i + 2]; n++; } return s.map(v => v / n); };
  const basso = centro(-0.03, 0.01), alto = centro(0.18, 0.22);
  const asse = alto.map((v, i) => v - basso[i]); const la = Math.hypot(...asse); asse.forEach((v, i) => { asse[i] = v / la; });
  /* base: z = asse; x = orizzontale verso l'esterno; y = z × x */
  let ex = [1, 0, 0]; const d = ex[0] * asse[0] + ex[1] * asse[1] + ex[2] * asse[2];
  ex = ex.map((v, i) => v - d * asse[i]); const le = Math.hypot(...ex); ex = ex.map(v => v / le);
  const ey = [asse[1] * ex[2] - asse[2] * ex[1], asse[2] * ex[0] - asse[0] * ex[2], asse[0] * ex[1] - asse[1] * ex[0]];
  const proietta = (v, o) => { const w = [v[0] - o[0], v[1] - o[1], v[2] - o[2]]; return [w[0] * ex[0] + w[1] * ex[1] + w[2] * ex[2], w[0] * ey[0] + w[1] * ey[1] + w[2] * ey[2], w[0] * asse[0] + w[1] * asse[1] + w[2] * asse[2]]; };
  /* l'origine: il centro dell'orlo del polsino (la sezione piu' bassa) */
  let zmin = Infinity; const pp = [];
  for (let i = 0; i < pos.length; i += 3) { const q = proietta([pos[i], pos[i + 1], pos[i + 2]], basso); pp.push(q); zmin = Math.min(zmin, q[2]); }
  const P2 = new Float32Array(pos.length), N2 = new Float32Array(nor.length);
  const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
  pp.forEach((q, k) => {
    q[2] -= zmin;
    for (let c = 0; c < 3; c++) { P2[k * 3 + c] = q[c]; mn[c] = Math.min(mn[c], q[c]); mx[c] = Math.max(mx[c], q[c]); }
    const n = proietta([nor[k * 3], nor[k * 3 + 1], nor[k * 3 + 2]], [0, 0, 0]);
    N2[k * 3] = n[0]; N2[k * 3 + 1] = n[1]; N2[k * 3 + 2] = n[2];
  });
  const B = Costruttore();
  const vP = B.aggiungi(Buffer.from(P2.buffer), { target: 34962 });
  const vN = B.aggiungi(Buffer.from(N2.buffer), { target: 34962 });
  const vU = B.aggiungi(Buffer.from(new Float32Array(uv).buffer), { target: 34962 });
  const vI = B.aggiungi(Buffer.from(new Uint16Array(idx).buffer), { target: 34963 });
  const imm = json.images[json.textures[json.materials[0].pbrMetallicRoughness.baseColorTexture.index].source];
  const [col] = await ricomprimi([{ dati: vista(imm.bufferView), mime: imm.mimeType, lato: 1024, qualita: 0.88 }]);
  const vC = B.aggiungi(col);
  const nb = B.bin();
  const out = {
    asset: Object.assign({}, json.asset, { generator: 'BioSpecInfo tools/prepara-modelli.js' }),
    scene: 0, scenes: [{ nodes: [0] }], nodes: [{ name: 'manica', mesh: 0 }],
    meshes: [{ name: 'manica', primitives: [{ attributes: { POSITION: 0, NORMAL: 1, TEXCOORD_0: 2 }, indices: 3, material: 0 }] }],
    materials: [{ name: 'camice', doubleSided: true, pbrMetallicRoughness: { baseColorTexture: { index: 0 }, metallicFactor: 0, roughnessFactor: 0.85 } }],
    textures: [{ sampler: 0, source: 0 }], samplers: [{ magFilter: 9729, minFilter: 9987, wrapS: 33071, wrapT: 33071 }],
    images: [{ bufferView: vC, mimeType: 'image/jpeg', name: 'colore' }],
    accessors: [
      { bufferView: vP, componentType: 5126, count: P2.length / 3, type: 'VEC3', min: mn, max: mx },
      { bufferView: vN, componentType: 5126, count: N2.length / 3, type: 'VEC3' },
      { bufferView: vU, componentType: 5126, count: uv.length / 2, type: 'VEC2' },
      { bufferView: vI, componentType: 5123, count: idx.length, type: 'SCALAR' }
    ],
    bufferViews: B.viste, buffers: [{ byteLength: nb.length }]
  };
  nota(out, 'Avambraccio sinistro ritagliato dalla scansione per BioSpecInfo (tools/prepara-modelli.js): ' + idx.length / 3 +
    ' triangoli, origine al polsino, asse del braccio lungo +z, metri; texture del colore in JPEG da 1024 px.');
  if (idx.length / 3 > 20000 || pos.length / 3 > 65535) throw new Error('ritaglio troppo grande');
  return { json: out, bin: nb };
}

(async () => {
  const { json, bin } = leggiGlb(fs.readFileSync(SORGENTE));
  let outJson = json, outBin;
  if (COSA === 'mani') outBin = await mani(json, bin);
  else if (COSA === 'pistola') outBin = await pistola(json, bin);
  else { const r = await camice(json, bin); outJson = r.json; outBin = r.bin; }
  const glb = scriviGlb(outJson, outBin);
  fs.writeFileSync(USCITA, glb);
  console.log('→ ' + path.relative(process.cwd(), USCITA) + '  ' + (glb.length / 1048576).toFixed(2) + ' MB (era ' +
              (fs.statSync(SORGENTE).size / 1048576).toFixed(2) + ' MB)');
})().catch(e => { console.error(e); process.exit(1); });
