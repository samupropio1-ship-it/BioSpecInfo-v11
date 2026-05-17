# BioSpecInfo v11 — Architettura Modulare

## 🎯 Come fare il deploy su GitHub Pages

### Opzione 1: Nuova repo (consigliata)

1. Vai su [github.com/new](https://github.com/new)
2. Nome: `BioSpecInfo-v11`
3. Public, Aggiungi README, Crea repo
4. Nella repo: **Add file → Upload files**
5. Estrai lo ZIP `BioSpecInfo-v11.zip` sul tuo PC
6. Apri la cartella `v11` e **trascina TUTTO il contenuto** (non la cartella, ma i file dentro)
7. Commit changes
8. Settings → Pages → Branch: `main` → Save
9. Aspetta 2 minuti
10. Il sito sarà su `https://samupropio1-ship-it.github.io/BioSpecInfo-v11/`

### Opzione 2: Sovrascrivere repo esistente

1. Vai sulla repo `BioSpecInfo-`
2. **Add file → Upload files**
3. Estrai lo ZIP e carica il contenuto della cartella `v11/`
4. Commit: "v11 release"

## 📂 Struttura

```
v11/
├── index.html              ← Entry point
├── manifest.json           ← PWA manifest
├── sw.js                   ← Service Worker
├── assets/
│   ├── icons/              ← Icone PWA
│   ├── css/main.css        ← Stili principali
│   └── data/farmaci.json   ← Dati farmaci
└── js/
    ├── core.js             ← Router e nav
    ├── pwa.js              ← Install handler
    └── modules/            ← Moduli sezioni
        ├── dashboard.js
        ├── molecules.js
        ├── pharma.js
        ├── synthesis.js
        ├── periodic.js
        ├── spectroscopy.js
        ├── analytics.js
        ├── amino.js
        ├── notes.js
        ├── filemanager.js
        └── about.js
```

## ✨ Funzionalità

- ✅ **PWA installabile** — banner verde + icona ⊕ nella barra Chrome
- ✅ **Offline** — funziona senza connessione dopo prima visita
- ✅ **Lazy loading** — ogni sezione caricata solo quando richiesta
- ✅ **143 farmaci** con schede cliniche complete
- ✅ **289 reazioni** organiche
- ✅ **118 elementi** tavola periodica interattiva
- ✅ **20 amminoacidi** con proprietà
- ✅ **Spettroscopia** NMR/IR/MS tabelle
- ✅ **Chimica Analitica II** appunti
- ✅ **File Manager** IndexedDB per i tuoi PDF
- ✅ **Note personali** con import/export
- ✅ **Ricerca molecole** PubChem
- ✅ **Dark mode** automatico
- ✅ **Responsive** mobile/desktop

## 🚀 Performance

| Metrica | v10 (vecchio) | v11 (nuovo) | Miglioramento |
|---------|---------------|-------------|---------------|
| Dimensione totale | 2.4 MB | 155 KB (totale) | -94% |
| First load (initial) | ~3-4 s | ~0.5-1 s | 3-4× più veloce |
| Cache granulare | ❌ | ✅ | Modifiche piccole = update veloci |
| Code splitting | ❌ | ✅ | Carica solo ciò che serve |
| PWA install | ❌ rotto | ✅ funziona | Banner nativo Chrome |

## 📱 Installazione (per utenti)

1. Apri il link del sito in Chrome
2. Aspetta 2 secondi → appare banner verde "Installa BioSpecInfo"
3. Tocca "Installa"
4. Chrome chiede conferma → "Installa"
5. App nella schermata home senza barra browser

## ⚠️ Importante

- I dati sono salvati nel **tuo dispositivo** (localStorage + IndexedDB)
- Le note possono essere esportate come JSON (sezione Note → 📤 Esporta)
- I file caricati in File Manager possono essere scaricati uno per uno (👁️ Apri o ⬇️ Scarica)

## 🔄 Migrare dati dalla v10

Apri la vecchia versione, vai in Console (F12) e incolla:

```javascript
const backup = {};
for(let i=0;i<localStorage.length;i++){
  const k=localStorage.key(i);
  if(k.startsWith('bsi_')) backup[k]=localStorage.getItem(k);
}
const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'});
const a=document.createElement('a');
a.href=URL.createObjectURL(blob);
a.download='backup-v10.json';
a.click();
```

Poi nella v11 → Note → 📥 Importa → seleziona `backup-v10.json`.

---

© 2025 Samuele Pio Provenzano · v11.0
