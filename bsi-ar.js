/* ═══════════════════════════════════════════════════════════════════════════
   bsi-ar.js — 🥽 Realtà aumentata unificata (fase 3 del progetto, §6)
   BioSpecInfo · © Samuele Pio Provenzano

   PERCHE' ESISTE (v254)
   Ogni scena 3D dell'app (orbitali, molecole, campi, pianeti, buchi neri…) deve
   potersi posare sul tavolo con il telefono. Un modulo solo, tre strade:

     iPhone e iPad   AR Quick Look: si costruisce un file USDZ e Safari lo apre
                     con il visore di sistema (rel="ar").
     Android         WebXR «immersive-ar» in Chrome: la scena vera, posata con un
                     tocco dove il telefono vede un piano (hit-test); due dita o
                     i pulsanti la ingrandiscono.
     computer        si scarica il modello .glb (e, a richiesta, .usdz), che si
                     apre con qualunque visore 3D o si manda al telefono.

   Nessuna libreria in più: l'esportatore GLB (glTF 2.0 binario) e quello USDZ
   (zip non compresso, allineato a 64 byte, con una scena USDA) sono qui sotto,
   scritti per i soli oggetti che l'app disegna.

   COME SI CONVERTE LA SCENA
   · Le mesh passano con posizioni, normali e colori per vertice; i materiali con
     colore e trasparenza.
   · Le nuvole di punti (gli orbitali) diventano piccoli ottaedri: i visori AR
     non disegnano i punti. Al massimo 4000 punti, scelti a passo regolare.
   · Linee, assi, etichette di testo e sprite restano fuori: in AR non si
     leggono. La scena dell'app ha z in alto; glTF e USD hanno y in alto: si
     ruota. La scena si scala a 30 cm e si posa sul piano.
   · In USDZ i colori per vertice si raggruppano in al massimo 64 materiali
     (Quick Look non legge i colori per vertice).

   ONESTA'
   · L'AR dipende dal telefono: WebXR c'è in Chrome per Android con ARCore,
     Quick Look su iOS 12 e successivi. Sugli altri si scarica il file, e lo si
     dice.
   · Le animazioni non vanno in AR: si posa la scena com'è in quel momento.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  var D = g.document;
  function t(it, en) { var F = g.BSIFisica; return F && F.t ? F.t(it, en) : it; }
  var LATO = 0.30, MAX_PUNTI = 4000, MAX_MAT_USD = 64, MAX_TRI = 60000;

  /* ═══ 1. DALLA SCENA AI DATI ═════════════════════════════════════════════ */
  /** Raccoglie le mesh di un oggetto three.js in coordinate «y in alto», scalate a `lato` metri e posate sul piano y = 0.
      opz.zSu: true se la scena ha z in alto (le scene dell'app). Restituisce { mesh: [{ pos, nor, col, idx, colore, opacita, nome }], lato, scala }. */
  function raccogli(oggetto, opz) {
    opz = opz || {}; var T = g.THREE, zSu = opz.zSu !== false, out = [];
    oggetto.updateMatrixWorld(true);
    var base = new T.Matrix4(); if (oggetto.parent) base.copy(oggetto.parent.matrixWorld).invert();
    var rot = new T.Matrix4(); if (zSu) rot.makeRotationX(-Math.PI / 2);         /* (x, y, z) → (x, z, −y) */
    var ottaedro = null;
    oggetto.traverse(function (o) {
      if (o.visible === false) return;
      var p = o; while (p && p !== oggetto) { if (p.visible === false) return; p = p.parent; }
      var M = new T.Matrix4().multiplyMatrices(rot, new T.Matrix4().multiplyMatrices(base, o.matrixWorld)), N = new T.Matrix3().getNormalMatrix(M);
      var mat = Array.isArray(o.material) ? o.material[0] : o.material, colore = mat && mat.color ? [mat.color.r, mat.color.g, mat.color.b] : [0.8, 0.8, 0.8];
      var opacita = mat && mat.transparent ? Math.max(0.15, mat.opacity == null ? 1 : mat.opacity) : 1;
      if (o.isMesh && o.geometry && o.geometry.attributes && o.geometry.attributes.position) {
        var G = o.geometry, P = G.attributes.position, Nn = G.attributes.normal, C = G.attributes.color, I = G.index, n = P.count;
        if (n < 3) return;
        var pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = C ? new Float32Array(n * 3) : null, v = new T.Vector3();
        for (var i = 0; i < n; i++) {
          v.fromBufferAttribute(P, i).applyMatrix4(M); pos[i * 3] = v.x; pos[i * 3 + 1] = v.y; pos[i * 3 + 2] = v.z;
          if (Nn) { v.fromBufferAttribute(Nn, i).applyMatrix3(N).normalize(); nor[i * 3] = v.x; nor[i * 3 + 1] = v.y; nor[i * 3 + 2] = v.z; }
          if (col) { col[i * 3] = C.getX(i); col[i * 3 + 1] = C.getY(i); col[i * 3 + 2] = C.getZ(i); }
        }
        var idx; if (I) { idx = new Uint32Array(I.count); for (var j = 0; j < I.count; j++) idx[j] = I.getX(j); } else { idx = new Uint32Array(n - n % 3); for (var k = 0; k < idx.length; k++) idx[k] = k; }
        if (M.determinant() < 0) for (var q = 0; q + 2 < idx.length; q += 3) { var s = idx[q + 1]; idx[q + 1] = idx[q + 2]; idx[q + 2] = s; }
        idx = senzaDegeneri(pos, idx);
        if (!idx.length) return;
        if (!Nn) normaliPiatte(pos, nor, idx); else riparaNormali(pos, nor, idx);
        out.push({ pos: pos, nor: nor, col: col, idx: idx, colore: colore, opacita: opacita, nome: o.name || 'mesh' });
      } else if (o.isPoints && o.geometry && o.geometry.attributes.position) {
        var GP = o.geometry, PP = GP.attributes.position, CP = GP.attributes.color, np = PP.count, passo = Math.max(1, Math.ceil(np / MAX_PUNTI)), scelti = [];
        for (var a = 0; a < np; a += passo) scelti.push(a);
        if (!ottaedro) ottaedro = forma8();
        var r = (mat && mat.size ? mat.size : 0.05) * 0.45 * Math.sqrt(passo) ;
        var m = scelti.length, pos2 = new Float32Array(m * 18), nor2 = new Float32Array(m * 18), col2 = new Float32Array(m * 18), idx2 = new Uint32Array(m * 24), w = new T.Vector3();
        scelti.forEach(function (sp, h) {
          w.fromBufferAttribute(PP, sp).applyMatrix4(M);
          var cr = CP ? CP.getX(sp) : colore[0], cg = CP ? CP.getY(sp) : colore[1], cb = CP ? CP.getZ(sp) : colore[2];
          if (mat && mat.blending === T.AdditiveBlending) { var mx = Math.max(cr, cg, cb, 1e-3); cr /= mx; cg /= mx; cb /= mx; }   /* in AR non c'è il buio dietro: si porta il colore alla piena luminosità */
          for (var e = 0; e < 6; e++) { var V = ottaedro.v[e]; pos2[h * 18 + e * 3] = w.x + V[0] * r; pos2[h * 18 + e * 3 + 1] = w.y + V[1] * r; pos2[h * 18 + e * 3 + 2] = w.z + V[2] * r; nor2.set(V, h * 18 + e * 3); col2[h * 18 + e * 3] = cr; col2[h * 18 + e * 3 + 1] = cg; col2[h * 18 + e * 3 + 2] = cb; }
          for (var f = 0; f < 24; f++) idx2[h * 24 + f] = h * 6 + ottaedro.f[f];
        });
        out.push({ pos: pos2, nor: nor2, col: col2, idx: idx2, colore: [1, 1, 1], opacita: 1, nome: o.name || 'punti', punti: true });
      }
    });
    /* scala a `lato` metri e posa sul piano */
    var mn = [Infinity, Infinity, Infinity], mx2 = [-Infinity, -Infinity, -Infinity];
    out.forEach(function (x) { for (var i = 0; i < x.pos.length; i += 3) for (var c = 0; c < 3; c++) { mn[c] = Math.min(mn[c], x.pos[i + c]); mx2[c] = Math.max(mx2[c], x.pos[i + c]); } });
    if (!out.length) return { mesh: [], lato: 0, scala: 1 };
    var lato = opz.lato || LATO, dim = Math.max(mx2[0] - mn[0], mx2[1] - mn[1], mx2[2] - mn[2]) || 1, sc = lato / dim, cx = (mn[0] + mx2[0]) / 2, cz = (mn[2] + mx2[2]) / 2;
    out.forEach(function (x) { for (var i = 0; i < x.pos.length; i += 3) { x.pos[i] = (x.pos[i] - cx) * sc; x.pos[i + 1] = (x.pos[i + 1] - mn[1]) * sc; x.pos[i + 2] = (x.pos[i + 2] - cz) * sc; } });
    /* oltre MAX_TRI triangoli la scena si semplifica raggruppando i vertici su una griglia di CELLA metri:
       lo scarto massimo è mezza diagonale della cella (sotto il millimetro), invisibile su un modello di 30 cm */
    var tot = out.reduce(function (s, x) { return s + x.idx.length / 3; }, 0), cella = opz.cella || 0;
    if (cella) out = out.map(function (x) { return x.punti ? x : semplifica(x, cella); }).filter(function (x) { return x.idx.length; });
    else if (tot > MAX_TRI) {
      var orig = out; cella = lato / 300;
      for (var giro = 0; giro < 6; giro++) {
        out = orig.map(function (x) { return x.punti ? x : semplifica(x, cella); }).filter(function (x) { return x.idx.length; });
        if (out.reduce(function (s, x) { return s + x.idx.length / 3; }, 0) <= MAX_TRI || cella >= lato / 75) break;
        cella *= 1.4;
      }
    }
    return { mesh: out, lato: lato, scala: sc, cella: cella, triangoliPrima: tot };
  }
  /** Raggruppa i vertici che cadono nella stessa cella (media di posizione, normale e colore), toglie i triangoli degeneri e i doppioni. */
  function semplifica(m, cella) {
    var mappa = new Map(), nuovo = [], n = m.pos.length / 3, rim = new Uint32Array(n);
    for (var i = 0; i < n; i++) {
      var k = Math.round(m.pos[i * 3] / cella) + ',' + Math.round(m.pos[i * 3 + 1] / cella) + ',' + Math.round(m.pos[i * 3 + 2] / cella), j = mappa.get(k);
      if (j == null) { j = nuovo.length; mappa.set(k, j); nuovo.push({ p: [0, 0, 0], n: [0, 0, 0], c: [0, 0, 0], q: 0 }); }
      var v = nuovo[j]; v.q++; for (var c = 0; c < 3; c++) { v.p[c] += m.pos[i * 3 + c]; v.n[c] += m.nor[i * 3 + c]; if (m.col) v.c[c] += m.col[i * 3 + c]; }
      rim[i] = j;
    }
    var visti = new Set(), idx = [];
    for (var t2 = 0; t2 + 2 < m.idx.length; t2 += 3) {
      var a = rim[m.idx[t2]], b = rim[m.idx[t2 + 1]], d = rim[m.idx[t2 + 2]];
      if (a === b || b === d || a === d) continue;
      var ch = [a, b, d].sort(function (x, y) { return x - y; }).join(',') + (((b - a) * (d - a) > 0) ? '+' : '-');
      if (visti.has(ch)) continue; visti.add(ch); idx.push(a, b, d);
    }
    var N = nuovo.length, pos = new Float32Array(N * 3), nor = new Float32Array(N * 3), col = m.col ? new Float32Array(N * 3) : null;
    nuovo.forEach(function (v, i) { var l = Math.hypot(v.n[0], v.n[1], v.n[2]) || 1; for (var c = 0; c < 3; c++) { pos[i * 3 + c] = v.p[c] / v.q; nor[i * 3 + c] = l > 1e-9 ? v.n[c] / l : (c === 1 ? 1 : 0); if (col) col[i * 3 + c] = v.c[c] / v.q; } if (Math.hypot(nor[i * 3], nor[i * 3 + 1], nor[i * 3 + 2]) < 0.5) { nor[i * 3] = 0; nor[i * 3 + 1] = 1; nor[i * 3 + 2] = 0; } });
    var out = { pos: pos, nor: nor, col: col, idx: new Uint32Array(idx), colore: m.colore, opacita: m.opacita, nome: m.nome };
    out.idx = senzaDegeneri(out.pos, out.idx);
    return out;
  }
  function forma8() { return { v: [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]], f: [0, 2, 4, 2, 1, 4, 1, 3, 4, 3, 0, 4, 2, 0, 5, 1, 2, 5, 3, 1, 5, 0, 3, 5] }; }
  /** Toglie i triangoli di area nulla (l'isosuperficie ne produce dove la superficie tocca un vertice della griglia). */
  function senzaDegeneri(pos, idx) {
    var buoni = [];
    for (var i = 0; i + 2 < idx.length; i += 3) {
      var a = idx[i] * 3, b = idx[i + 1] * 3, c = idx[i + 2] * 3, ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2], vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
      var nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      if (nx * nx + ny * ny + nz * nz > 1e-24) buoni.push(idx[i], idx[i + 1], idx[i + 2]);
    }
    return buoni.length === idx.length ? idx : new Uint32Array(buoni);
  }
  /** Le normali nulle o non finite si sostituiscono con quelle delle facce vicine. */
  function riparaNormali(pos, nor, idx) {
    var rotte = false;
    for (var j = 0; j < nor.length; j += 3) { var l = Math.hypot(nor[j], nor[j + 1], nor[j + 2]); if (!(l > 0.5)) { rotte = true; break; } }
    if (!rotte) return;
    var fac = new Float32Array(nor.length); normaliPiatte(pos, fac, idx);
    for (var k = 0; k < nor.length; k += 3) { var m = Math.hypot(nor[k], nor[k + 1], nor[k + 2]); if (!(m > 0.5)) { var f = Math.hypot(fac[k], fac[k + 1], fac[k + 2]); if (f > 0.5) { nor[k] = fac[k]; nor[k + 1] = fac[k + 1]; nor[k + 2] = fac[k + 2]; } else { nor[k] = 0; nor[k + 1] = 1; nor[k + 2] = 0; } } }
  }
  function normaliPiatte(pos, nor, idx) {
    for (var i = 0; i + 2 < idx.length; i += 3) {
      var a = idx[i] * 3, b = idx[i + 1] * 3, c = idx[i + 2] * 3, ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2], vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
      var nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      [a, b, c].forEach(function (k) { nor[k] += nx; nor[k + 1] += ny; nor[k + 2] += nz; });
    }
    for (var j = 0; j < nor.length; j += 3) { var l = Math.hypot(nor[j], nor[j + 1], nor[j + 2]); if (l > 0) { nor[j] /= l; nor[j + 1] /= l; nor[j + 2] /= l; } else { nor[j] = 0; nor[j + 1] = 1; nor[j + 2] = 0; } }
  }

  /* ═══ 2. GLB (glTF 2.0 binario) ══════════════════════════════════════════ */
  function glb(dati, nome) {
    var json = { asset: { version: '2.0', generator: 'BioSpecInfo bsi-ar' }, scene: 0, scenes: [{ name: nome || 'BioSpecInfo', nodes: [] }], nodes: [], meshes: [], materials: [], accessors: [], bufferViews: [], buffers: [] };
    var parti = [], off = 0;
    function vista(arr, target) { var b = new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength), pad = (4 - b.length % 4) % 4; json.bufferViews.push({ buffer: 0, byteOffset: off, byteLength: b.length, target: target }); parti.push(b); if (pad) parti.push(new Uint8Array(pad)); off += b.length + pad; return json.bufferViews.length - 1; }
    function accessore(arr, tipo, comp, target, minmax) { var a = { bufferView: vista(arr, target), componentType: comp, count: arr.length / (tipo === 'VEC3' ? 3 : 1), type: tipo }; if (minmax) { var mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity]; for (var i = 0; i < arr.length; i += 3) for (var c = 0; c < 3; c++) { mn[c] = Math.min(mn[c], arr[i + c]); mx[c] = Math.max(mx[c], arr[i + c]); } a.min = mn; a.max = mx; } json.accessors.push(a); return json.accessors.length - 1; }
    dati.mesh.forEach(function (m, i) {
      var attr = { POSITION: accessore(m.pos, 'VEC3', 5126, 34962, true), NORMAL: accessore(m.nor, 'VEC3', 5126, 34962) };
      if (m.col) attr.COLOR_0 = accessore(m.col, 'VEC3', 5126, 34962);
      var ind = accessore(m.idx, 'SCALAR', 5125, 34963);
      var bc = m.col ? [1, 1, 1, m.opacita] : [m.colore[0], m.colore[1], m.colore[2], m.opacita];
      json.materials.push({ name: 'materiale' + i, pbrMetallicRoughness: { baseColorFactor: bc.map(function (x) { return +x.toFixed(4); }), metallicFactor: 0, roughnessFactor: 0.55 }, alphaMode: m.opacita < 1 ? 'BLEND' : 'OPAQUE', doubleSided: true });
      json.meshes.push({ name: m.nome, primitives: [{ attributes: attr, indices: ind, material: i, mode: 4 }] });
      json.nodes.push({ name: m.nome, mesh: i }); json.scenes[0].nodes.push(i);
    });
    json.buffers.push({ byteLength: off });
    var testo = new TextEncoder().encode(JSON.stringify(json)), padJ = (4 - testo.length % 4) % 4, lungJ = testo.length + padJ, tot = 12 + 8 + lungJ + 8 + off;
    var out = new Uint8Array(tot), dv = new DataView(out.buffer);
    dv.setUint32(0, 0x46546C67, true); dv.setUint32(4, 2, true); dv.setUint32(8, tot, true);
    dv.setUint32(12, lungJ, true); dv.setUint32(16, 0x4E4F534A, true); out.set(testo, 20); for (var i = 0; i < padJ; i++) out[20 + testo.length + i] = 0x20;
    var p = 20 + lungJ; dv.setUint32(p, off, true); dv.setUint32(p + 4, 0x004E4942, true); p += 8;
    parti.forEach(function (b) { out.set(b, p); p += b.length; });
    return out.buffer;
  }

  /* ═══ 3. USDZ (zip con una scena USDA) ═══════════════════════════════════ */
  function f6(x) { return (Math.round(x * 1e6) / 1e6).toString(); }
  function f4(x) { return (Math.round(x * 1e4) / 1e4).toString(); }
  function f3(x) { return (Math.round(x * 1e3) / 1e3).toString(); }
  function usda(dati, nome) {
    /* i triangoli si raggruppano per colore (al massimo 64 materiali) */
    var gruppi = {}, nG = 0, L = ['#usda 1.0', '(', '    defaultPrim = "Radice"', '    metersPerUnit = 1', '    upAxis = "Y"', '    doc = "' + String(nome || 'BioSpecInfo').replace(/["\\]/g, '') + ' — BioSpecInfo"', ')', '', 'def Xform "Radice" (', '    kind = "component"', ')', '{'];
    var livelli = 4;
    function q(x) { return Math.min(livelli - 1, Math.max(0, Math.round(x * (livelli - 1)))); }
    dati.mesh.forEach(function (m) {
      for (var i = 0; i + 2 < m.idx.length; i += 3) {
        var r, gg, b;
        if (m.col) { r = 0; gg = 0; b = 0; for (var k = 0; k < 3; k++) { var v = m.idx[i + k] * 3; r += m.col[v]; gg += m.col[v + 1]; b += m.col[v + 2]; } r /= 3; gg /= 3; b /= 3; } else { r = m.colore[0]; gg = m.colore[1]; b = m.colore[2]; }
        var chiave = q(r) + '' + q(gg) + q(b) + '|' + m.opacita.toFixed(2);
        if (!gruppi[chiave]) { if (nG >= MAX_MAT_USD) chiave = Object.keys(gruppi)[0]; else { gruppi[chiave] = { col: [q(r) / (livelli - 1), q(gg) / (livelli - 1), q(b) / (livelli - 1)], op: m.opacita, tri: [] }; nG++; } }
        gruppi[chiave].tri.push([m, i]);
      }
    });
    var mats = [];
    Object.keys(gruppi).forEach(function (k, gi) {
      var G = gruppi[k], mappa = new Map(), punti = [], normali = [], ind = [];
      G.tri.forEach(function (x) { var m = x[0]; for (var j = 0; j < 3; j++) { var vi = m.idx[x[1] + j], ch = m.nome + '/' + vi + '/' + dati.mesh.indexOf(m), n = mappa.get(ch); if (n == null) { n = punti.length; mappa.set(ch, n); punti.push('(' + f4(m.pos[vi * 3]) + ',' + f4(m.pos[vi * 3 + 1]) + ',' + f4(m.pos[vi * 3 + 2]) + ')'); normali.push('(' + f3(m.nor[vi * 3]) + ',' + f3(m.nor[vi * 3 + 1]) + ',' + f3(m.nor[vi * 3 + 2]) + ')'); } ind.push(n); } });
      var nt = ind.length / 3;
      L.push('    def Mesh "parte' + gi + '" (', '        prepend apiSchemas = ["MaterialBindingAPI"]', '    )', '    {',
        '        int[] faceVertexCounts = [' + new Array(nt).fill(3).join(',') + ']',
        '        int[] faceVertexIndices = [' + ind.join(',') + ']',
        '        point3f[] points = [' + punti.join(',') + ']',
        '        normal3f[] normals = [' + normali.join(',') + '] (', '            interpolation = "vertex"', '        )',
        '        uniform token subdivisionScheme = "none"', '        uniform bool doubleSided = 1',
        '        rel material:binding = </Radice/Materiali/materiale' + gi + '>', '    }');
      mats.push('        def Material "materiale' + gi + '"', '        {', '            token outputs:surface.connect = </Radice/Materiali/materiale' + gi + '/Superficie.outputs:surface>',
        '            def Shader "Superficie"', '            {', '                uniform token info:id = "UsdPreviewSurface"',
        '                color3f inputs:diffuseColor = (' + G.col.map(f6).join(', ') + ')', '                float inputs:opacity = ' + f6(G.op), '                float inputs:roughness = 0.55', '                float inputs:metallic = 0',
        '                token outputs:surface', '            }', '        }');
    });
    L.push('    def Scope "Materiali"', '    {'); L.push.apply(L, mats); L.push('    }', '}', '');
    return { testo: L.join('\n'), materiali: nG };
  }
  var CRC = null;
  function crc32(b) { if (!CRC) { CRC = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; CRC[n] = c >>> 0; } } var x = 0xFFFFFFFF; for (var i = 0; i < b.length; i++) x = CRC[(x ^ b[i]) & 0xFF] ^ (x >>> 8); return (x ^ 0xFFFFFFFF) >>> 0; }
  /** Zip non compresso con i dati di ogni file allineati a 64 byte, come chiede il formato USDZ. */
  function zip64(files) {
    var parti = [], centrale = [], off = 0;
    files.forEach(function (f) {
      var nome = new TextEncoder().encode(f.nome), dati = f.dati, crc = crc32(dati), base = 30 + nome.length, pad = (64 - (off + base + 4) % 64) % 64, extra = 4 + pad;
      var h = new Uint8Array(30 + nome.length + extra), dv = new DataView(h.buffer);
      dv.setUint32(0, 0x04034b50, true); dv.setUint16(4, 20, true); dv.setUint16(6, 0, true); dv.setUint16(8, 0, true); dv.setUint16(10, 0, true); dv.setUint16(12, 0x21, true);
      dv.setUint32(14, crc, true); dv.setUint32(18, dati.length, true); dv.setUint32(22, dati.length, true); dv.setUint16(26, nome.length, true); dv.setUint16(28, extra, true);
      h.set(nome, 30); dv.setUint16(30 + nome.length, 0x1986, true); dv.setUint16(32 + nome.length, pad, true);
      parti.push(h, dati);
      var c = new Uint8Array(46 + nome.length), dc = new DataView(c.buffer);
      dc.setUint32(0, 0x02014b50, true); dc.setUint16(4, 20, true); dc.setUint16(6, 20, true); dc.setUint16(8, 0, true); dc.setUint16(10, 0, true); dc.setUint16(12, 0, true); dc.setUint16(14, 0x21, true);
      dc.setUint32(16, crc, true); dc.setUint32(20, dati.length, true); dc.setUint32(24, dati.length, true); dc.setUint16(28, nome.length, true); dc.setUint32(42, off, true); c.set(nome, 46);
      centrale.push(c); off += h.length + dati.length;
    });
    var lc = centrale.reduce(function (s, c) { return s + c.length; }, 0), fine = new Uint8Array(22), df = new DataView(fine.buffer);
    df.setUint32(0, 0x06054b50, true); df.setUint16(8, files.length, true); df.setUint16(10, files.length, true); df.setUint32(12, lc, true); df.setUint32(16, off, true);
    var tot = off + lc + 22, out = new Uint8Array(tot), p = 0; parti.concat(centrale, [fine]).forEach(function (b) { out.set(b, p); p += b.length; });
    return out;
  }
  function usdz(dati, nome) { var u = usda(dati, nome); return zip64([{ nome: 'modello.usda', dati: new TextEncoder().encode(u.testo) }]); }

  /* ═══ 4. IL DISPOSITIVO ══════════════════════════════════════════════════ */
  function quickLook() { try { var a = D.createElement('a'); return !!(a.relList && a.relList.supports && a.relList.supports('ar')); } catch (e) { return false; } }
  function supporto() {
    var x = g.navigator && g.navigator.xr, ql = quickLook();
    if (!x || !x.isSessionSupported) return Promise.resolve({ webxr: false, quicklook: ql });
    return x.isSessionSupported('immersive-ar').then(function (s) { return { webxr: !!s, quicklook: ql }; }, function () { return { webxr: false, quicklook: ql }; });
  }
  function scarica(buf, nomeFile, tipo) { var u = URL.createObjectURL(new Blob([buf], { type: tipo })), a = D.createElement('a'); a.href = u; a.download = nomeFile; D.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 60000); }
  function nomeFile(nome) { return String(nome || 'scena').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'scena'; }

  /* ═══ 5. LA SESSIONE WEBXR (Android) ═════════════════════════════════════ */
  var sessione = null;
  function costruisci(dati) {
    var T = g.THREE, gr = new T.Group();
    dati.mesh.forEach(function (m) {
      var G = new T.BufferGeometry(); G.setAttribute('position', new T.BufferAttribute(m.pos, 3)); G.setAttribute('normal', new T.BufferAttribute(m.nor, 3)); if (m.col) G.setAttribute('color', new T.BufferAttribute(m.col, 3)); G.setIndex(new T.BufferAttribute(m.idx, 1));
      gr.add(new T.Mesh(G, new T.MeshStandardMaterial({ color: m.col ? 0xffffff : new T.Color(m.colore[0], m.colore[1], m.colore[2]), vertexColors: !!m.col, transparent: m.opacita < 1, opacity: m.opacita, roughness: 0.55, metalness: 0, side: T.DoubleSide, depthWrite: m.opacita >= 1 })));
    });
    return gr;
  }
  function avviaWebXR(dati, nome, avvisa) {
    var T = g.THREE, ov = D.createElement('div');
    ov.className = 'bsiAR-sovra';
    ov.innerHTML = '<div class="bsiAR-cima"><b>🥽 ' + String(nome || '').replace(/[<>&]/g, '') + '</b><button type="button" data-a="esci" aria-label="' + t('Esci dalla realtà aumentata', 'Exit augmented reality') + '">✕</button></div>' +
      '<div class="bsiAR-aiuto" aria-live="polite">' + t('Muovi piano il telefono per trovare il tavolo, poi tocca per posare la scena.', 'Move the phone slowly to find the table, then tap to place the scene.') + '</div>' +
      '<div class="bsiAR-basso"><button type="button" data-a="meno" aria-label="' + t('Più piccola', 'Smaller') + '">−</button><button type="button" data-a="ruota" aria-label="' + t('Ruota', 'Rotate') + '">⟳</button><button type="button" data-a="piu" aria-label="' + t('Più grande', 'Larger') + '">+</button></div>';
    D.body.appendChild(ov);
    var ren = new T.WebGLRenderer({ antialias: true, alpha: true }); ren.setPixelRatio(Math.min(2, g.devicePixelRatio || 1)); ren.setSize(g.innerWidth, g.innerHeight); ren.xr.enabled = true; ren.domElement.className = 'bsiAR-tela'; D.body.appendChild(ren.domElement);
    var sc = new T.Scene(), cam = new T.PerspectiveCamera(70, g.innerWidth / g.innerHeight, 0.01, 40);
    sc.add(new T.HemisphereLight(0xffffff, 0x444466, 1.0)); var dl = new T.DirectionalLight(0xffffff, 0.6); dl.position.set(1, 3, 2); sc.add(dl);
    var modello = costruisci(dati); modello.visible = false; sc.add(modello);
    var mirino = new T.Mesh(new T.RingGeometry(0.06, 0.08, 40).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ color: 0x5eead4 })); mirino.matrixAutoUpdate = false; mirino.visible = false; sc.add(mirino);
    var sorgente = null, chiesta = false, scala = 1, aiuto = ov.querySelector('.bsiAR-aiuto');
    function fine() { try { ren.setAnimationLoop(null); } catch (e) {} ren.dispose(); ren.domElement.remove(); ov.remove(); sessione = null; }
    ov.addEventListener('click', function (e) {
      var a = e.target && e.target.getAttribute('data-a'); if (!a) return; e.stopPropagation();
      if (a === 'esci' && sessione) sessione.end();
      if (a === 'piu') scala = Math.min(8, scala * 1.25); if (a === 'meno') scala = Math.max(0.15, scala / 1.25); if (a === 'ruota') modello.rotation.y += Math.PI / 6;
      modello.scale.setScalar(scala);
    });
    ov.addEventListener('beforexrselect', function (e) { e.preventDefault(); });   /* i pulsanti non posano la scena */
    return g.navigator.xr.requestSession('immersive-ar', { requiredFeatures: ['hit-test'], optionalFeatures: ['dom-overlay', 'local-floor'], domOverlay: { root: ov } }).then(function (s) {
      sessione = s; ren.xr.setReferenceSpaceType('local'); ren.xr.setSession(s);
      s.addEventListener('end', fine);
      s.addEventListener('select', function () { if (!mirino.visible) return; modello.position.setFromMatrixPosition(mirino.matrix); modello.visible = true; aiuto.textContent = t('Posata. Tocca altrove per spostarla; − e + per la misura.', 'Placed. Tap elsewhere to move it; − and + for size.'); });
      ren.setAnimationLoop(function (tempo, frame) {
        if (frame) {
          var rif = ren.xr.getReferenceSpace();
          if (!chiesta) { chiesta = true; s.requestReferenceSpace('viewer').then(function (v) { return s.requestHitTestSource({ space: v }); }).then(function (h) { sorgente = h; }); }
          if (sorgente) { var ris = frame.getHitTestResults(sorgente); if (ris.length) { mirino.visible = true; mirino.matrix.fromArray(ris[0].getPose(rif).transform.matrix); } else mirino.visible = false; }
        }
        ren.render(sc, cam);
      });
      return 'webxr';
    }, function (e) { fine(); throw e; });
  }

  /* ═══ 6. APRI: SCEGLIE LA STRADA ═════════════════════════════════════════ */
  function avviso(testo) { var F = g.BSIFisica, a = D.createElement('div'); a.className = 'bsiAR-avviso'; a.setAttribute('role', 'status'); a.textContent = testo; D.body.appendChild(a); setTimeout(function () { a.remove(); }, 7000); return testo; }
  /** Apre in AR un oggetto three.js. opz: { nome, zSu (default true), modo: 'auto'|'glb'|'usdz' }. Promessa → 'quicklook' | 'webxr' | 'glb' | 'usdz' | 'vuota'. */
  function apri(oggetto, opz) {
    opz = opz || {}; stile();
    var dati = raccogli(oggetto, { zSu: opz.zSu !== false, lato: opz.lato }), nome = opz.nome || t('Scena di BioSpecInfo', 'BioSpecInfo scene'), file = nomeFile(nome);
    if (!dati.mesh.length) return Promise.resolve(avviso(t('In questa vista non c\'è niente da posare in AR (solo linee o testo).', 'Nothing to place in AR in this view (only lines or text).')) && 'vuota');
    if (opz.modo === 'glb') { scarica(glb(dati, nome), file + '.glb', 'model/gltf-binary'); return Promise.resolve('glb'); }
    if (opz.modo === 'usdz') { scarica(usdz(dati, nome), file + '.usdz', 'model/vnd.usdz+zip'); return Promise.resolve('usdz'); }
    return supporto().then(function (s) {
      if (s.quicklook) {
        var u = URL.createObjectURL(new Blob([usdz(dati, nome)], { type: 'model/vnd.usdz+zip' })), a = D.createElement('a'); a.rel = 'ar'; a.href = u + '#allowsContentScaling=1';
        a.appendChild(D.createElement('img')); D.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 120000);
        return 'quicklook';
      }
      if (s.webxr) return avviaWebXR(dati, nome).catch(function () { scarica(glb(dati, nome), file + '.glb', 'model/gltf-binary'); avviso(t('La realtà aumentata non è partita: ho scaricato il modello .glb.', 'Augmented reality did not start: I downloaded the .glb model.')); return 'glb'; });
      scarica(glb(dati, nome), file + '.glb', 'model/gltf-binary');
      avviso(t('Su questo dispositivo la realtà aumentata non c\'è: ho scaricato il modello .glb. Sul telefono il pulsante AR posa la scena sul tavolo (Android con Chrome, iPhone con Safari).', 'This device has no augmented reality: I downloaded the .glb model. On a phone the AR button places the scene on the table (Android with Chrome, iPhone with Safari).'));
      return 'glb';
    });
  }

  /* ═══ 7. IL PULSANTE NELLE SCENE 3D ══════════════════════════════════════ */
  /** Aggiunge «AR» alla barra di una BSILab3D.Scena. */
  function aggancia(S) {
    if (!S || !S.box || S._ar) return; S._ar = true; stile();
    var barra = S.box.querySelector('.bsi3d-barra'); if (!barra) return;
    var b = D.createElement('button'); b.type = 'button'; b.textContent = 'AR'; b.className = 'bsiAR-tasto';
    var nm = t('Realtà aumentata: posa la scena sul tavolo', 'Augmented reality: place the scene on the table'); b.title = nm; b.setAttribute('aria-label', nm);
    b.addEventListener('click', function (e) { e.stopPropagation(); var tit = (S.didascalia && S.didascalia.textContent) || ''; var sez = S.box.closest && S.box.closest('.section'), st = sez && sez.querySelector('.bsiFX-titolo, .section-title, h2'); apri(S.radice, { nome: (st ? st.textContent.trim() + (tit ? ' · ' : '') : '') + tit.split('·')[0].trim() }); });
    barra.insertBefore(b, barra.firstChild);
  }
  var stileFatto = false;
  function stile() {
    if (stileFatto || !D) return; stileFatto = true;
    var s = D.createElement('style'); s.id = 'bsi-ar-stile';
    s.textContent = '.bsiAR-tasto{font-weight:800;font-size:12px!important;letter-spacing:.03em;color:#5eead4!important;border-color:#5eead4!important}' +
      '.bsiAR-sovra{position:fixed;inset:0;z-index:2147483000;pointer-events:none;font:15px system-ui,sans-serif;color:#e6fffb}' +
      '.bsiAR-sovra button{pointer-events:auto;min-width:52px;min-height:52px;border-radius:26px;border:1px solid #5eead4;background:rgba(8,21,34,.82);color:#e6fffb;font-size:22px}' +
      '.bsiAR-cima{position:absolute;top:max(12px,env(safe-area-inset-top));left:12px;right:12px;display:flex;justify-content:space-between;align-items:center;gap:8px}' +
      '.bsiAR-cima b{background:rgba(8,21,34,.82);padding:8px 12px;border-radius:12px;max-width:70vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
      '.bsiAR-aiuto{position:absolute;left:16px;right:16px;bottom:96px;text-align:center;background:rgba(8,21,34,.82);padding:10px 12px;border-radius:12px}' +
      '.bsiAR-basso{position:absolute;left:0;right:0;bottom:max(20px,env(safe-area-inset-bottom));display:flex;justify-content:center;gap:16px}' +
      '.bsiAR-tela{position:fixed;inset:0;width:100%!important;height:100%!important;z-index:2147482999}' +
      '.bsiAR-avviso{position:fixed;left:16px;right:16px;bottom:24px;z-index:2147483001;max-width:520px;margin:0 auto;background:#0a1628;border:1px solid #5eead4;color:#e6fffb;padding:12px 14px;border-radius:12px;font:14px/1.45 system-ui,sans-serif;box-shadow:0 8px 30px rgba(0,0,0,.5)}';
    D.head.appendChild(s);
  }
  /* aggancio automatico: ogni BSILab3D.Scena creata d'ora in poi riceve il pulsante */
  function innesta(prove) {
    var L3 = g.BSILab3D;
    if (!L3 || !L3.Scena) { if ((prove || 0) < 40) setTimeout(function () { innesta((prove || 0) + 1); }, 250); return; }
    if (L3._arInnestato) return; L3._arInnestato = true;
    var Orig = L3.Scena;
    function ScenaAR(padre, rapporto) { Orig.call(this, padre, rapporto); try { aggancia(this); } catch (e) {} }
    ScenaAR.prototype = Orig.prototype; ScenaAR.originale = Orig;
    L3.Scena = ScenaAR;
    (L3.scene ? L3.scene() : []).forEach(function (S) { try { aggancia(S); } catch (e) {} });
  }

  g.BSIAR = { semplifica: semplifica, raccogli: raccogli, glb: glb, usda: usda, usdz: usdz, zip64: zip64, crc32: crc32, supporto: supporto, apri: apri, aggancia: aggancia, costruisci: costruisci, quickLook: quickLook, LATO: LATO };
  if (D) innesta(0);
})(typeof window !== 'undefined' ? window : globalThis);
