#!/usr/bin/env python3
"""usd-in-glb.py — da una scena USD/USDZ (Sketchfab) a un GLB che three.js r128
sa leggere. Serve per le mappe dei laboratori di ATOMIC PROTOCOL fornite in
USDZ (three r128 non ha un lettore USD).

Per ogni mesh: punti nel riferimento del mondo (trasformazioni della scena
applicate), facce triangolate a ventaglio, normali e coordinate UV (anche
«faceVarying», per questo i vertici si srotolano per faccia), il materiale
UsdPreviewSurface legato alla mesh: colore, normali ed emissione con le loro
texture, metallicita' e ruvidita' come valori. Le unita' diventano metri
(metersPerUnit) e l'asse in alto diventa +Y.

uso:  python3 usd-in-glb.py <scena.usdc|.usda dentro la cartella estratta> <uscita.glb>
serve il pacchetto usd-core (pip install usd-core numpy)
"""
import json, os, struct, sys
import numpy as np
from pxr import Usd, UsdGeom, UsdShade, Gf

def leggi_input(shader, nome):
    i = shader.GetInput(nome)
    if not i:
        return None, None
    if i.HasConnectedSource():
        src, _, _ = i.GetConnectedSource()
        sh = UsdShade.Shader(src.GetPrim())
        if sh and sh.GetIdAttr().Get() == 'UsdUVTexture':
            f = sh.GetInput('file').Get()
            return None, (f.resolvedPath or f.path) if f else None
        return None, None
    return i.Get(), None

def materiale(prim):
    mat, _ = UsdShade.MaterialBindingAPI(prim).ComputeBoundMaterial()
    if not mat:
        return None
    sh = mat.ComputeSurfaceSource()[0]
    if not sh:
        return None
    out = {'nome': mat.GetPrim().GetName()}
    for k in ['diffuseColor', 'normal', 'emissiveColor', 'metallic', 'roughness', 'opacity']:
        v, t = leggi_input(sh, k)
        out[k] = (v, t)
    return out

def main(src, dst):
    st = Usd.Stage.Open(src)
    mpu = UsdGeom.GetStageMetersPerUnit(st) or 1.0
    su_z = UsdGeom.GetStageUpAxis(st) == 'Z'
    base = os.path.dirname(os.path.abspath(src))
    xc = UsdGeom.XformCache(Usd.TimeCode.Default())
    gruppi = {}      # materiale -> liste di pos, nor, uv
    mats = {}
    for prim in st.Traverse():
        if not prim.IsA(UsdGeom.Mesh):
            continue
        im = UsdGeom.Imageable(prim)
        if im.ComputeVisibility() == 'invisible' or im.ComputePurpose() in ('guide', 'proxy'):
            continue
        m = UsdGeom.Mesh(prim)
        P = np.array(m.GetPointsAttr().Get() or [], dtype=np.float64)
        cnt = np.array(m.GetFaceVertexCountsAttr().Get() or [], dtype=np.int64)
        idx = np.array(m.GetFaceVertexIndicesAttr().Get() or [], dtype=np.int64)
        if not len(P) or not len(cnt):
            continue
        M = np.array(xc.GetLocalToWorldTransform(prim), dtype=np.float64)   # riga = vettore (USD)
        Pw = np.c_[P, np.ones(len(P))] @ M
        Pw = Pw[:, :3] * mpu
        # triangoli a ventaglio, in termini di «angolo di faccia» (face-vertex)
        inizio = np.r_[0, np.cumsum(cnt)[:-1]]
        tri = []
        for s0, c in zip(inizio, cnt):
            for k in range(1, c - 1):
                tri.append((s0, s0 + k, s0 + k + 1))
        tri = np.array(tri, dtype=np.int64).reshape(-1)
        if m.GetOrientationAttr().Get() == 'leftHanded':
            tri = tri.reshape(-1, 3)[:, ::-1].reshape(-1)
        pos = Pw[idx[tri]]
        # normali
        N = m.GetNormalsAttr().Get()
        nor = None
        if N is not None and len(N):
            N = np.array(N, dtype=np.float64)
            interp = m.GetNormalsInterpolation()
            # (convenzione a righe di USD: le normali vanno con l'inversa trasposta)
            Nw = N @ np.linalg.inv(M[:3, :3]).T
            if interp == 'faceVarying' and len(N) == len(idx):
                nor = Nw[tri]
            elif len(N) == len(P):
                nor = Nw[idx[tri]]
        # UV
        uv = None
        pv = UsdGeom.PrimvarsAPI(prim)
        for nome in ['st', 'st0', 'UVMap', 'uv', 'map1']:
            q = pv.GetPrimvar(nome)
            if q and q.HasValue():
                val = np.array(q.Get(), dtype=np.float64)
                ind = q.GetIndices()
                interp = q.GetInterpolation()
                if ind is not None and len(ind):
                    val = val[np.array(ind)]
                if interp == 'faceVarying' and len(val) == len(idx):
                    uv = val[tri]
                elif interp in ('vertex', 'varying') and len(val) == len(P):
                    uv = val[idx[tri]]
                break
        mt = materiale(prim)
        chiave = mt['nome'] if mt else '_'
        if mt:
            mats[chiave] = mt
        g = gruppi.setdefault(chiave, {'pos': [], 'nor': [], 'uv': []})
        g['pos'].append(pos)
        g['nor'].append(nor if nor is not None else None)
        g['uv'].append(uv if uv is not None else np.zeros((len(pos), 2)))
    # costruzione del glTF
    bin_ = bytearray()
    viste, acc, prims_out = [], [], []
    def aggiungi(arr, tipo, comp, target=None, minmax=False):
        nonlocal bin_
        while len(bin_) % 4:
            bin_ += b'\0'
        b = arr.tobytes()
        v = {'buffer': 0, 'byteOffset': len(bin_), 'byteLength': len(b)}
        if target:
            v['target'] = target
        viste.append(v)
        bin_ += b
        a = {'bufferView': len(viste) - 1, 'componentType': comp, 'count': len(arr), 'type': tipo}
        if minmax:
            a['min'] = arr.min(axis=0).tolist(); a['max'] = arr.max(axis=0).tolist()
        acc.append(a)
        return len(acc) - 1
    immagini, texture, materiali, idx_img = [], [], [], {}
    def tex(percorso):
        if not percorso:
            return None
        p = percorso if os.path.isabs(percorso) else os.path.join(base, percorso)
        if not os.path.exists(p):
            return None
        if p not in idx_img:
            nonlocal bin_
            dati = open(p, 'rb').read()
            while len(bin_) % 4:
                bin_ += b'\0'
            viste.append({'buffer': 0, 'byteOffset': len(bin_), 'byteLength': len(dati)})
            bin_ += dati
            immagini.append({'bufferView': len(viste) - 1, 'mimeType': 'image/png' if p.lower().endswith('.png') else 'image/jpeg',
                             'name': os.path.basename(p)})
            texture.append({'source': len(immagini) - 1, 'sampler': 0})
            idx_img[p] = len(texture) - 1
        return idx_img[p]
    for chiave, g in gruppi.items():
        pos = np.concatenate(g['pos']).astype(np.float32)
        uv = np.concatenate(g['uv']).astype(np.float32)
        uv[:, 1] = 1.0 - uv[:, 1]
        if su_z:
            pos = pos[:, [0, 2, 1]] * np.array([1, 1, -1], dtype=np.float32)
        attr = {'POSITION': aggiungi(pos, 'VEC3', 5126, 34962, True), 'TEXCOORD_0': aggiungi(uv, 'VEC2', 5126, 34962)}
        if all(n is not None for n in g['nor']):
            nor = np.concatenate(g['nor']).astype(np.float32)
            if su_z:
                nor = nor[:, [0, 2, 1]] * np.array([1, 1, -1], dtype=np.float32)
            ln = np.linalg.norm(nor, axis=1, keepdims=True); ln[ln == 0] = 1
            attr['NORMAL'] = aggiungi(nor / ln, 'VEC3', 5126, 34962)
        mt = mats.get(chiave)
        pbr = {'metallicFactor': 0.0, 'roughnessFactor': 0.6}
        md = {'name': chiave, 'pbrMetallicRoughness': pbr, 'doubleSided': True}
        if mt:
            v, t = mt['diffuseColor']
            ti = tex(t)
            if ti is not None:
                pbr['baseColorTexture'] = {'index': ti}
            elif v is not None:
                pbr['baseColorFactor'] = [float(v[0]), float(v[1]), float(v[2]), 1.0]
            v, t = mt['metallic']
            if v is not None: pbr['metallicFactor'] = float(v)
            elif t: pbr['metallicFactor'] = 0.5
            v, t = mt['roughness']
            if v is not None: pbr['roughnessFactor'] = float(v)
            v, t = mt['normal']
            ti = tex(t)
            if ti is not None:
                md['normalTexture'] = {'index': ti}
            v, t = mt['emissiveColor']
            ti = tex(t)
            if ti is not None:
                md['emissiveTexture'] = {'index': ti}; md['emissiveFactor'] = [1, 1, 1]
            elif v is not None and max(v) > 0:
                md['emissiveFactor'] = [float(v[0]), float(v[1]), float(v[2])]
            v, t = mt['opacity']
            if (v is not None and v < 0.99) or t:
                md['alphaMode'] = 'BLEND'
                if v is not None:
                    pbr.setdefault('baseColorFactor', [1, 1, 1, 1])[3] = float(v)
        materiali.append(md)
        prims_out.append({'attributes': attr, 'material': len(materiali) - 1})
    meta = st.GetRootLayer().customLayerData
    gl = {
        'asset': {'version': '2.0', 'generator': 'BioSpecInfo tools/usd-in-glb.py',
                  'extras': {'author': meta.get('author', ''), 'license': meta.get('copyright', ''),
                             'source': meta.get('url', ''), 'title': meta.get('title', '')}},
        'scene': 0, 'scenes': [{'nodes': [0]}],
        'nodes': [{'name': os.path.basename(dst), 'mesh': 0}],
        'meshes': [{'primitives': prims_out}],
        'materials': materiali, 'textures': texture, 'images': immagini,
        'samplers': [{'magFilter': 9729, 'minFilter': 9987, 'wrapS': 10497, 'wrapT': 10497}],
        'accessors': acc, 'bufferViews': viste, 'buffers': [{'byteLength': len(bin_)}]
    }
    if not texture:
        del gl['textures'], gl['images'], gl['samplers']
    js = json.dumps(gl).encode()
    js += b' ' * ((4 - len(js) % 4) % 4)
    while len(bin_) % 4:
        bin_ += b'\0'
    with open(dst, 'wb') as f:
        f.write(struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(bin_)))
        f.write(struct.pack('<II', len(js), 0x4E4F534A)); f.write(js)
        f.write(struct.pack('<II', len(bin_), 0x004E4942)); f.write(bin_)
    print('->', dst, len(prims_out), 'materiali,', sum(acc[p['attributes']['POSITION']]['count'] for p in prims_out) // 3, 'triangoli')

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
