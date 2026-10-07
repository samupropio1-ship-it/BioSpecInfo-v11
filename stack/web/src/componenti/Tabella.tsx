import type { Segnale } from '../api'

/* La tabella di assegnazione: etichetta, spostamento, integrazione,
 * molteplicita', costanti. Per il ¹³C l'integrazione non e' quantitativa e
 * al suo posto c'e' il numero di carboni equivalenti — scrivere «3H» accanto
 * a un carbonio sarebbe un'informazione falsa. */
export function Tabella({
  segnali, nucleo, acceso, suClic,
}: {
  segnali: Segnale[]
  nucleo: '1H' | '13C'
  acceso: string | null
  suClic: (nome: string | null) => void
}) {
  if (!segnali.length) return <p className="nota">Nessun segnale.</p>
  return (
    <table className="tbl">
      <thead>
        <tr>
          <th>etich.</th><th>ppm</th>
          {nucleo === '1H' ? <><th>integr.</th><th>mult.</th><th>J (Hz)</th></> : <th>n. C</th>}
          <th>assegnazione</th>
        </tr>
      </thead>
      <tbody>
        {segnali.map((s) => (
          <tr key={s.nome}
              className={acceso === s.nome ? 'on' : ''}
              onClick={() => suClic(acceso === s.nome ? null : s.nome)}>
            <td><b>{s.nome}</b></td>
            <td>{s.ppm.toFixed(2)}</td>
            {nucleo === '1H' ? (
              <>
                <td>{s.nH}H</td>
                <td>{s.molteplicita}</td>
                <td>{s.J.map((j) => j.toFixed(1)).join(', ')}</td>
              </>
            ) : (
              <td>{s.n}</td>
            )}
            <td>
              {s.etichetta}
              {s.contributi.length > 0 && (
                <><br /><span className="piccolo">{s.contributi.join(' · ')}</span></>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
