import { useEffect, useRef, useState } from 'react'
import type { Geometria } from '../api'

const COLORE: Record<string, string> = {
  H: '#e6edf3', C: '#4d6b82', N: '#4f7fd0', O: '#e05c5c', F: '#6fd08c',
  S: '#e0c24f', Cl: '#5fc46a', Br: '#b5663a', I: '#9b59b6', P: '#e08b3a',
  Si: '#b0a08a',
}
const RAGGIO: Record<string, number> = { H: 0.32, C: 0.72, N: 0.68, O: 0.66, S: 1.0 }

/* Un visore 3D minimo: proiezione prospettica, trascinamento per ruotare,
 * rotella per avvicinare. Gli atomi ILLUMINATI arrivano da fuori — sono
 * quelli del segnale NMR selezionato — e il loro indice e' quello del
 * predittore, perche' la geometria viene dallo stesso grafo.
 *
 * Gli atomi si disegnano dal piu' lontano al piu' vicino: senza
 * quell'ordine un atomo dietro finisce davanti e il modello sembra rotto. */
export function Visore3D({ geo, illuminati }: { geo: Geometria; illuminati: number[] }) {
  const tela = useRef<HTMLCanvasElement>(null)
  const [rot, setRot] = useState({ x: 0.3, y: 0 })
  const [zoom, setZoom] = useState(1)
  const trascina = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const c = tela.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const W = c.width, H = c.height
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#06141f'
    ctx.fillRect(0, 0, W, H)

    const raggio = Math.max(1, ...geo.atomi.map((a) => Math.hypot(a.x, a.y, a.z)))
    const scala = (Math.min(W, H) / 2.6 / raggio) * zoom
    const cy = Math.cos(rot.y), sy = Math.sin(rot.y)
    const cx = Math.cos(rot.x), sx = Math.sin(rot.x)
    const proietta = (a: { x: number; y: number; z: number }) => {
      const x1 = a.x * cy - a.z * sy
      const z1 = a.x * sy + a.z * cy
      const y1 = a.y * cx - z1 * sx
      const z2 = a.y * sx + z1 * cx
      const p = 1 + z2 / (raggio * 6)
      return { sx: W / 2 + x1 * scala * p, sy: H / 2 - y1 * scala * p, z: z2 }
    }
    const pts = geo.atomi.map(proietta)
    const acceso = new Set(illuminati)

    geo.bonds.forEach((b) => {
      const p1 = pts[b.a], p2 = pts[b.b]
      if (!p1 || !p2) return
      ctx.strokeStyle = acceso.has(b.a) && acceso.has(b.b) ? '#ffd93d' : '#355a74'
      ctx.lineWidth = b.bo >= 2 ? 3.5 : 2.5
      ctx.beginPath(); ctx.moveTo(p1.sx, p1.sy); ctx.lineTo(p2.sx, p2.sy); ctx.stroke()
    })

    geo.atomi
      .map((a, i) => ({ a, i, p: pts[i]! }))
      .sort((u, v) => u.p.z - v.p.z)
      .forEach(({ a, i, p }) => {
        const r = (RAGGIO[a.el] ?? 0.8) * scala * 0.42
        const on = acceso.has(i)
        ctx.beginPath(); ctx.arc(p.sx, p.sy, r, 0, Math.PI * 2)
        ctx.fillStyle = on ? '#ffd93d' : (COLORE[a.el] ?? '#8aa0b4')
        ctx.fill()
        if (on) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke() }
      })
  }, [geo, rot, zoom, illuminati])

  return (
    <canvas
      ref={tela}
      width={420}
      height={300}
      style={{ width: '100%', maxWidth: 420, height: 300, borderRadius: 8,
               background: '#06141f', touchAction: 'none', cursor: 'grab' }}
      onPointerDown={(e) => {
        trascina.current = { x: e.clientX, y: e.clientY }
        e.currentTarget.setPointerCapture(e.pointerId)
      }}
      onPointerMove={(e) => {
        const d = trascina.current
        if (!d) return
        setRot((r) => ({ x: r.x + (e.clientY - d.y) * 0.01, y: r.y + (e.clientX - d.x) * 0.01 }))
        trascina.current = { x: e.clientX, y: e.clientY }
      }}
      onPointerUp={() => { trascina.current = null }}
      onWheel={(e) => setZoom((z) => Math.max(0.4, Math.min(4, z * (e.deltaY < 0 ? 1.12 : 1 / 1.12))))}
    />
  )
}
