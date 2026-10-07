/* I tipi dell'API, e il client che la chiama.
 *
 * I tipi sono scritti a mano e NON generati dallo schema: generarli darebbe
 * l'illusione che siano verificati, mentre a verificarli e' il banco
 * `stack/api/tests`, che chiama le stesse rotte. Qui servono a far fallire
 * la compilazione quando il front end legge un campo che non esiste — che e'
 * il mestiere di TypeScript in questo progetto.
 */

const BASE = (import.meta.env.VITE_API as string | undefined) ?? '/api'

export interface Segnale {
  ppm: number
  atomi: number[]
  n: number
  nH: number
  molteplicita: string
  J: number[]
  etichetta: string
  contributi: string[]
  nome: string
}

export interface Spettro {
  nucleo: '1H' | '13C'
  smiles: string
  segnali: Segnale[]
  nAtomi: number
  /** lo scarto MISURATO dal banco: senza, un numero previsto sembra misurato */
  incertezza: string
  metodo: string
  fonte?: string
  errore?: string
}

export interface Macchia {
  x: number
  y: number
  atomi: number[]
  segno: number
  etichetta: string
  dettaglio: string
}

export interface Mappa2D {
  tipo: 'HSQC' | 'COSY' | 'HMBC'
  picchi: Macchia[]
  diagonale: { x: number; y: number; atomi: number[]; nome: string }[]
  asseX: { nucleo: string; min: number; max: number; nome: string }
  asseY: { nucleo: string; min: number; max: number; nome: string }
  segnali1H: Segnale[]
  segnali13C: Segnale[]
  metodo: string
  limiti: string
}

export interface Atomo3D { i: number; el: string; x: number; y: number; z: number }

export interface Geometria {
  atomi: Atomo3D[]
  bonds: { a: number; b: number; bo: number }[]
  /** gli atomi pesanti stanno PRIMA: il loro indice e' quello del predittore */
  nPesanti: number
  scarto: number
  metodo: string
  limiti: string
}

export interface Identita {
  smiles: string
  canonico?: string
  inchi?: string
  chiave?: string
  formula?: string
  peso?: number
  esatto?: number
  logp?: number
  tpsa?: number
}

export interface Salute {
  versione: string
  stato: string
  rdkit: string | null
  /** l'impronta di ogni file del motore: serve a sapere che e' quello giusto */
  moduli: Record<string, string>
}

/** L'errore porta con se' lo stato: 422 vuol dire «non e' una molecola», 503
 *  «il motore non c'e'». Trattarli allo stesso modo farebbe dire «SMILES
 *  sbagliato» a chi ha solo il server spento. */
export class ErroreAPI extends Error {
  constructor(readonly stato: number, messaggio: string) {
    super(messaggio)
    this.name = 'ErroreAPI'
  }
  get eColpaDelloSmiles() { return this.stato === 422 }
  get eColpaDelServizio() { return this.stato >= 500 }
}

async function chiedi<T>(rotta: string, corpo?: unknown): Promise<T> {
  let r: Response
  try {
    r = await fetch(BASE + rotta, {
      method: corpo === undefined ? 'GET' : 'POST',
      headers: corpo === undefined ? {} : { 'Content-Type': 'application/json' },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    })
  } catch (e) {
    throw new ErroreAPI(0, "l'API non risponde: è avviata su :8000?")
  }
  if (!r.ok) {
    let dettaglio = r.statusText
    try {
      const d = await r.json()
      if (typeof d?.detail === 'string') dettaglio = d.detail
      else if (Array.isArray(d?.detail)) dettaglio = d.detail.map((x: { msg?: string }) => x.msg).join('; ')
    } catch { /* un corpo non JSON: resta lo statusText */ }
    throw new ErroreAPI(r.status, dettaglio)
  }
  return (await r.json()) as T
}

export const api = {
  salute: () => chiedi<Salute>('/salute'),
  identita: (smiles: string) => chiedi<Identita>('/identita', { smiles }),
  nmr: (smiles: string, nucleo: '1H' | '13C') => chiedi<Spettro>('/nmr', { smiles, nucleo }),
  nmr2d: (smiles: string, tipo: Mappa2D['tipo']) => chiedi<Mappa2D>('/nmr2d', { smiles, tipo }),
  geometria: (smiles: string) => chiedi<Geometria>('/geometria', { smiles }),
  struttura: (smiles: string, atomi: number[]) =>
    chiedi<{ svg: string }>('/struttura', { smiles, atomi, larghezza: 420, altezza: 300 }),
}
