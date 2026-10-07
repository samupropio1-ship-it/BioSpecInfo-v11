import { useEffect, useRef } from 'react'
import type { Segnale } from '../api'

/* Lo spettro 1D, disegnato su tela.
 *
 * Gli assi di un NMR vanno a DECRESCERE da sinistra a destra: il TMS sta a
 * zero, a destra. Disegnarlo al contrario e' il tipo di errore che nessuno
 * segnala perche' il grafico «sembra uno spettro» lo stesso. */
export function Spettro1D({
  segnali, nucleo, acceso, suClic,
}: {
  segnali: Segnale[]
  nucleo: '1H' | '13C'
  acceso: string | null
  suClic: (nome: string | null) => void
}) {
  const tela = useRef<HTMLCanvasElement>(null)
  const mappa = useRef<{ x: (v: number) => number; vista: [number, number] } | null>(null)

  useEffect(() => {
    const c = tela.current
    if (!c) return
    const ctx = c.getContext('2d')
    if (!ctx) return
    const W = c.width, H = c.height, ml = 10, mb = 26
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#06141f'
    ctx.fillRect(0, 0, W, H)

    const vista: [number, number] = nucleo === '13C' ? [0, 220] : [0, 12]
    if (segnali.length) {
      const mn = Math.min(...segnali.map((s) => s.ppm))
      const mx = Math.max(...segnali.map((s) => s.ppm))
      const m = Math.max(nucleo === '13C' ? 8 : 0.4, (mx - mn) * 0.1)
      vista[0] = Math.max(vista[0], mn - m)
      vista[1] = Math.min(vista[1], mx + m)
    }
    const X = (v: number) => ml + ((vista[1] - v) / (vista[1] - vista[0])) * (W - ml * 2)
    mappa.current = { x: X, vista }

    ctx.strokeStyle = '#13293d'
    ctx.fillStyle = '#7a8aa0'
    ctx.font = '10px ui-monospace,monospace'
    ctx.textAlign = 'center'
    const passo = nucleo === '13C' ? 20 : 1
    for (let g = Math.ceil(vista[0] / passo) * passo; g <= vista[1]; g += passo) {
      const x = X(g)
      ctx.beginPath(); ctx.moveTo(x, 4); ctx.lineTo(x, H - mb); ctx.stroke()
      ctx.fillText(String(g), x, H - mb + 13)
    }
    ctx.strokeStyle = '#1d3c52'
    ctx.beginPath(); ctx.moveTo(ml, H - mb); ctx.lineTo(W - ml, H - mb); ctx.stroke()

    const nHMax = Math.max(1, ...segnali.map((s) => s.nH || 1))
    segnali.forEach((s) => {
      const x = X(s.ppm)
      /* L'altezza di un picco ¹H E' l'integrazione: inventarla sarebbe
         peggio che ometterla. Per il ¹³C, dove l'intensita' non e'
         quantitativa, tutti i picchi sono alti uguale e lo si dichiara. */
      const q = nucleo === '1H' ? (s.nH || 1) / nHMax : 0.75
      const h = (H - mb - 16) * q
      const on = acceso === s.nome
      ctx.strokeStyle = on ? '#ffd93d' : '#00c9b7'
      ctx.lineWidth = on ? 2.5 : 1.5
      ctx.beginPath(); ctx.moveTo(x, H - mb); ctx.lineTo(x, H - mb - h); ctx.stroke()
      ctx.fillStyle = on ? '#ffd93d' : '#9fb3c8'
      ctx.font = '10px ui-monospace,monospace'
      ctx.fillText(s.nome, x, H - mb - h - 5)
    })
  }, [segnali, nucleo, acceso])

  return (
    <canvas
      ref={tela}
      width={620}
      height={240}
      style={{ width: '100%', maxWidth: 620, height: 240, borderRadius: 8, cursor: 'crosshair' }}
      onClick={(ev) => {
        const c = tela.current, m = mappa.current
        if (!c || !m) return
        const r = c.getBoundingClientRect()
        const px = ((ev.clientX - r.left) * c.width) / r.width
        let vicino: string | null = null
        let best = 18
        segnali.forEach((s) => {
          const d = Math.abs(m.x(s.ppm) - px)
          if (d < best) { best = d; vicino = s.nome }
        })
        suClic(vicino && vicino === acceso ? null : vicino)
      }}
    />
  )
}
