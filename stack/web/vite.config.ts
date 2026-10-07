import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/* Il front end parla con l'API su un'altra porta. In sviluppo si passa dal
   proxy di Vite, cosi' il browser vede una sola origine e non c'e' niente da
   configurare; in produzione si mette l'API dietro lo stesso dominio, oppure
   si dichiara VITE_API. */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': { target: 'http://127.0.0.1:8000', rewrite: (p) => p.replace(/^\/api/, '') } }
  },
  build: { outDir: 'dist', sourcemap: true }
})
