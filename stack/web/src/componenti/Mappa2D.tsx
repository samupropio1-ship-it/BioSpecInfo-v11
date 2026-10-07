import { useEffect, useRef } from 'react'
import type { Mappa2D as Dati, Macchia } from '../api'

/* La mappa di correlazioni. Entrambi gli assi decrescono, e il COSY ha la
 * diagonale tratteggiata: senza, le macchie fuori diagonale non si
 * riconoscono per quello che sono. */
export function Mappa2D({
  dati, acceso, suClic,
}: {
  dati: Dati
  acceso: string | null
  suClic: (m: Macchia | null) => void
}) {
  const tela = useRef<HTMLCanvasElement>(null)
  const mappa = useRef<{ X: (v: number) => number; Y: (v: number) => number } | null>(null)

  useEffect(() => {
    const c = tela.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const W = c.width, H = c.height, ml = 54, mb = 34, mt = 20, mr = 12
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#06141f'
    ctx.fillRect(0, 0, W, H)

    const tutti = [...dati.picchi, ...dati.diagonale]
    const bordo = (vals: number[], min: number, max: number): [number, number] => {
      if (!vals.length) return [min, max]
      const mn = Math.min(...vals), mx = Math.max(...vals)
      const m = Math.max(2, (mx - mn) * 0.12)
      return [Math.max(min, mn - m), Math.min(max, mx + m)]
    }
    const vx = bordo(tutti.map((p) => p.x), dati.asseX.min, dati.asseX.max)
    const vy = bordo(tutti.map((p) => p.y), dati.asseY.min, dati.asseY.max)
    const X = (v: number) => ml + ((vx[1] - v) / (vx[1] - vx[0])) * (W - ml - mr)
    const Y = (v: number) => mt + ((vy[1] - v) / (vy[1] - vy[0])) * (H - mt - mb)
    mappa.current = { X, Y }

    ctx.strokeStyle = '#13293d'
    ctx.fillStyle = '#7a8aa0'
    ctx.font = '10px ui-monospace,monospace'
    const passo = (a: number) => [0.5, 1, 2, 5, 10, 20, 50].find((g) => a / g <= 10) ?? 50
    const px0 = passo(vx[1] - vx[0]), py0 = passo(vy[1] - vy[0])
    ctx.textAlign = 'center'
    for (let g = Math.ceil(vx[0] / px0) * px0; g <= vx[1]; g += px0) {
      ctx.beginPath(); ctx.moveTo(X(g), mt); ctx.lineTo(X(g), H - mb); ctx.stroke()
      ctx.fillText(String(Math.round(g * 10) / 10), X(g), H - mb + 13)
    }
    ctx.textAlign = 'right'
    for (let g = Math.ceil(vy[0] / py0) * py0; g <= vy[1]; g += py0) {
      ctx.beginPath(); ctx.moveTo(ml, Y(g)); ctx.lineTo(W - mr, Y(g)); ctx.stroke()
      ctx.fillText(String(Math.round(g * 10) / 10), ml - 6, Y(g) + 3)
    }
    ctx.strokeStyle = '#1d3c52'
    ctx.strokeRect(ml, mt, W - ml - mr, H - mt - mb)

    if (dati.tipo === 'COSY') {
      ctx.strokeStyle = '#22455c'
      ctx.setLineDash([4, 4])
      ctx.beginPath(); ctx.moveTo(X(vx[0]), Y(vx[0])); ctx.lineTo(X(vx[1]), Y(vx[1])); ctx.stroke()
      ctx.setLineDash([])
    }

    const punto = (x: number, y: number, col: string, r: number) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 2)
      g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g
      ctx.beginPath(); ctx.arc(x, y, r * 2, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = col
      ctx.beginPath(); ctx.arc(x, y, r * 0.45, 0, Math.PI * 2); ctx.fill()
    }
    dati.diagonale.forEach((p) => punto(X(p.x), Y(p.y), '#5d7d93', 5))
    dati.picchi.forEach((p) => {
      const on = acceso === p.etichetta
      /* il segno negativo dei CH₂ si vede dal colore: e' l'informazione che
         un HSQC editato porta e che un disegno a un colore solo butta via */
      punto(X(p.x), Y(p.y), on ? '#ffd93d' : p.segno < 0 ? '#ff8fa3' : '#00c9b7', on ? 9 : 7)
    })

    ctx.fillStyle = '#9fb3c8'
    ctx.font = '11px system-ui,sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(dati.asseX.nome, (ml + W - mr) / 2, H - 6)
    ctx.save(); ctx.translate(12, (mt + H - mb) / 2); ctx.rotate(-Math.PI / 2)
    ctx.fillText(dati.asseY.nome, 0, 0); ctx.restore()
  }, [dati, acceso])

  return (
    <canvas
      ref={tela}
      width={620}
      height={400}
      style={{ width: '100%', maxWidth: 620, height: 400, borderRadius: 8, cursor: 'crosshair' }}
      onClick={(ev) => {
        const c = tela.current, m = mappa.current
        if (!c || !m) return
        const r = c.getBoundingClientRect()
        const px = ((ev.clientX - r.left) * c.width) / r.width
        const py = ((ev.clientY - r.top) * c.height) / r.height
        let best: Macchia | null = null
        let bd = 18
        dati.picchi.forEach((p) => {
          const d = Math.hypot(m.X(p.x) - px, m.Y(p.y) - py)
          if (d < bd) { bd = d; best = p }
        })
        suClic(best && (best as Macchia).etichetta === acceso ? null : best)
      }}
    />
  )
}
