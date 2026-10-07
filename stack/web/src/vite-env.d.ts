/// <reference types="vite/client" />

/* L'indirizzo dell'API si può cambiare senza ricompilare il codice: in
   sviluppo si passa dal proxy di Vite (`/api`), in produzione si mette
   VITE_API. Dichiararlo qui fa sì che TypeScript se ne accorga se qualcuno
   scrive un nome di variabile sbagliato. */
interface ImportMetaEnv {
  readonly VITE_API?: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
