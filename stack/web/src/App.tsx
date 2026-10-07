import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api, ErroreAPI } from './api'
import type { Geometria, Identita, Macchia, Mappa2D as Dati2D, Salute, Spettro } from './api'
import { Spettro1D } from './componenti/Spettro1D'
import { Mappa2D } from './componenti/Mappa2D'
import { Visore3D } from './componenti/Visore3D'
import { Tabella } from './componenti/Tabella'

const ESEMPI = [
  ['acetato di etile', 'CCOC(C)=O'],
  ['aspirina', 'CC(=O)Oc1ccccc1C(=O)O'],
  ['anisolo', 'COc1ccccc1'],
  ['caffeina', 'Cn1cnc2c1c(=O)n(C)c(=O)n2C'],
  ['stirene', 'C=Cc1ccccc1'],
  ['ibuprofene', 'CC(C)Cc1ccc(cc1)C(C)C(=O)O'],
] as const

type Tipo2D = Dati2D['tipo']

export default function App() {
  const [smiles, setSmiles] = useState('CCOC(C)=O')
  const [inviato, setInviato] = useState('CCOC(C)=O')
  const [nucleo, setNucleo] = useState<'1H' | '13C'>('13C')
  const [tipo2d, setTipo2d] = useState<Tipo2D | null>(null)
  const [mostra3d, setMostra3d] = useState(false)

  const [spettro, setSpettro] = useState<Spettro | null>(null)
  const [mappa, setMappa] = useState<Dati2D | null>(null)
  const [geo, setGeo] = useState<Geometria | null>(null)
  const [ident, setIdent] = useState<Identita | null>(null)
  const [svg, setSvg] = useState('')
  const [salute, setSalute] = useState<Salute | null>(null)

  const [acceso, setAcceso] = useState<string | null>(null)
  const [acceso2d, setAcceso2d] = useState<string | null>(null)
  const [atomi2d, setAtomi2d] = useState<number[] | null>(null)
  const [errore, setErrore] = useState<string | null>(null)
  const [carico, setCarico] = useState(false)
  const [storia, setStoria] = useState<Identita[]>([])

  /* Una richiesta puo' tornare DOPO che l'utente ha già cambiato molecola:
     senza un contatore, la risposta vecchia sovrascriverebbe la nuova e lo
     schermo mostrerebbe lo spettro di una molecola che non è più quella
     scritta nel campo. */
  const giro = useRef(0)

  useEffect(() => { api.salute().then(setSalute).catch(() => setSalute(null)) }, [])

  const atomiAccesi = useMemo(() => {
    if (atomi2d?.length) return atomi2d
    if (!spettro || !acceso) return []
    return spettro.segnali.find((s) => s.nome === acceso)?.atomi ?? []
  }, [spettro, acceso, atomi2d])

  const prevedi = useCallback(async (quale: string) => {
    const mio = ++giro.current
    setCarico(true); setErrore(null)
    setAcceso(null); setAcceso2d(null); setAtomi2d(null)
    try {
      const [sp, id] = await Promise.all([api.nmr(quale, nucleo), api.identita(quale)])
      if (mio !== giro.current) return
      setSpettro(sp); setIdent(id); setInviato(quale)
      setStoria((s) => {
        const senza = s.filter((x) => (x.chiave && id.chiave ? x.chiave !== id.chiave
                                                             : x.canonico !== id.canonico))
        return [id, ...senza].slice(0, 10)
      })
    } catch (e) {
      if (mio !== giro.current) return
      const m = e instanceof ErroreAPI ? e.message : String(e)
      setErrore(m); setSpettro(null); setMappa(null); setGeo(null); setIdent(null); setSvg('')
    } finally {
      if (mio === giro.current) setCarico(false)
    }
  }, [nucleo])

  useEffect(() => { void prevedi(inviato) /* eslint-disable-line */ }, [nucleo])
  useEffect(() => { void prevedi('CCOC(C)=O') /* eslint-disable-line */ }, [])

  useEffect(() => {
    if (!spettro) { setSvg(''); return }
    let vivo = true
    api.struttura(inviato, atomiAccesi)
      .then((d) => { if (vivo) setSvg(d.svg) })
      .catch(() => { if (vivo) setSvg('') })
    return () => { vivo = false }
  }, [inviato, atomiAccesi, spettro])

  useEffect(() => {
    if (!tipo2d || !spettro) { setMappa(null); return }
    let vivo = true
    api.nmr2d(inviato, tipo2d)
      .then((d) => { if (vivo) setMappa(d) })
      .catch((e) => { if (vivo) { setMappa(null); setErrore(String(e.message ?? e)) } })
    return () => { vivo = false }
  }, [tipo2d, inviato, spettro])

  useEffect(() => {
    if (!mostra3d || !spettro) { setGeo(null); return }
    let vivo = true
    api.geometria(inviato)
      .then((d) => { if (vivo) setGeo(d) })
      .catch((e) => { if (vivo) { setGeo(null); setErrore(String(e.message ?? e)) } })
    return () => { vivo = false }
  }, [mostra3d, inviato, spettro])

  const clicMacchia = (m: Macchia | null) => {
    setAcceso2d(m ? m.etichetta : null)
    setAtomi2d(m ? m.atomi : null)
    setAcceso(null)
  }

  return (
    <div className="pagina">
      <header>
        <h1>BioSpecInfo <span className="tag">API + React</span></h1>
        <p className="nota">
          Questa interfaccia non contiene nessun calcolo: chiama l'API, che esegue{' '}
          <b>gli stessi file</b> della PWA. Le impronte qui sotto lo dimostrano.
        </p>
        {salute ? (
          <p className="piccolo">
            RDKit {salute.rdkit} · moduli{' '}
            {Object.entries(salute.moduli).map(([n, h]) => `${n.replace('bsi-', '').replace('.js', '')} ${h.slice(0, 8)}`).join(' · ')}
          </p>
        ) : (
          <p className="piccolo avviso">
            L'API non risponde. Avviala con <code>uvicorn bsi_api.main:app</code> in <code>stack/api</code>.
          </p>
        )}
      </header>

      <section className="barra">
        <input
          value={smiles}
          spellCheck={false}
          onChange={(e) => setSmiles(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void prevedi(smiles) }}
          placeholder="SMILES — per esempio CCOC(C)=O"
          aria-label="SMILES"
        />
        <button onClick={() => void prevedi(smiles)} disabled={carico}>
          {carico ? '…' : 'Prevedi'}
        </button>
        <span className="sep" />
        {(['13C', '1H'] as const).map((n) => (
          <button key={n} className={nucleo === n ? 'on' : ''} onClick={() => setNucleo(n)}>
            {n === '13C' ? '¹³C' : '¹H'}
          </button>
        ))}
        <span className="sep" />
        {(['HSQC', 'COSY', 'HMBC'] as const).map((k) => (
          <button key={k} className={tipo2d === k ? 'on' : ''}
                  onClick={() => setTipo2d(tipo2d === k ? null : k)}>{k}</button>
        ))}
        <button className={mostra3d ? 'on' : ''} onClick={() => setMostra3d(!mostra3d)}>3D</button>
      </section>

      <section className="esempi">
        {ESEMPI.map(([nome, s]) => (
          <button key={s} className="chip" onClick={() => { setSmiles(s); void prevedi(s) }}>{nome}</button>
        ))}
      </section>

      {storia.length > 0 && (
        <section className="esempi">
          <span className="piccolo">cronologia:</span>
          {storia.map((x) => (
            <button key={x.chiave ?? x.canonico} className="chip"
                    title={`${x.canonico}\n${x.inchi ?? ''}\n${x.chiave ?? ''}`}
                    onClick={() => { const q = x.canonico ?? x.smiles; setSmiles(q); void prevedi(q) }}>
              {(x.canonico ?? x.smiles).slice(0, 20)}
            </button>
          ))}
        </section>
      )}

      {errore && <p className="avviso">⚠ {errore}</p>}

      {spettro && (
        <>
          <section className="griglia">
            <div>
              <Spettro1D segnali={spettro.segnali} nucleo={spettro.nucleo}
                         acceso={acceso} suClic={(n) => { setAcceso(n); setAtomi2d(null); setAcceso2d(null) }} />
              <p className="nota">
                <b>Metodo:</b> {spettro.metodo}<br />
                <b>Scarto:</b> {spettro.incertezza}
                {spettro.fonte && <><br /><span className="piccolo">{spettro.fonte}</span></>}
              </p>
            </div>
            <div>
              {svg && <div className="dep" dangerouslySetInnerHTML={{ __html: svg }} />}
              {ident && (
                <p className="piccolo">
                  {ident.canonico} · {ident.formula} · {ident.peso?.toFixed(2)} g/mol
                  {ident.chiave && <><br />{ident.chiave}</>}
                </p>
              )}
              {mostra3d && geo && (
                <>
                  <Visore3D geo={geo} illuminati={atomiAccesi} />
                  <p className="piccolo">
                    {geo.atomi.length} atomi · residuo {geo.scarto} Å · {geo.limiti}
                  </p>
                </>
              )}
              <Tabella segnali={spettro.segnali} nucleo={spettro.nucleo}
                       acceso={acceso} suClic={(n) => { setAcceso(n); setAtomi2d(null); setAcceso2d(null) }} />
            </div>
          </section>

          {tipo2d && mappa && (
            <section>
              <Mappa2D dati={mappa} acceso={acceso2d} suClic={clicMacchia} />
              <p className="nota">
                <b>{mappa.tipo}:</b> {mappa.metodo}<br />
                <b>{mappa.picchi.length}</b> correlazioni — clicca una macchia per illuminare gli atomi
                <br /><span className="piccolo">{mappa.limiti}</span>
              </p>
            </section>
          )}
        </>
      )}
    </div>
  )
}
