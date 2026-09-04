> **NOTA DI ATTUAZIONE — settembre 2026, aggiunta dopo l'implementazione.**
>
> Questa guida è arrivata insieme a un pack esterno. Il lavoro descritto in
> §2.1–2.4 **è stato fatto**, ma NON come indicato al §3 punto 2: il
> `bsi-ai-hub.js` del pack contava 1.917 righe e 8 strumenti, mentre quello
> in repository ne conta 7.243 e 35. Sostituirlo avrebbe cancellato la
> risoluzione automatica dei modelli, la riserva fra fornitori, il budget
> delle richieste, il pulsante di reset e altro ancora. I tre strumenti
> nuovi sono stati quindi **aggiunti** al file esistente.
>
> Correzioni rispetto al testo qui sotto, emerse guardando il codice vero:
> - il pannello degli spettri è **`p-speclive`**, non `p-spec`;
> - gli spettri **non dipendono da RDKit** (`SpectralLab.analyze` lavora
>   sulle euristiche di `feat()`), quindi si servono subito; solo il disegno
>   della molecola va messo in coda su `rdkReady`;
> - il canale primario è la **chiamata diretta** a `bsiRDKitAPI` (stessa
>   origine, e restituisce un valore); `postMessage` è la riserva;
> - il listener accetta solo `ev.source === window.parent`.
>
> Stato dei criteri di accettazione (§5): tutti verificati da
> `browser_rdkit.js`, 31 controlli in Chromium.

---

# GUIDA CODEX — Spectra potente (molecole + spettri + agentic)

**Destinatario:** Claude Codex / Claude Code collegato al repo GitHub di BioSpecInfo  
**Autore contesto:** Samuele — BioSpecInfo (tesi UniBa)  
**Obiettivo:** portare Spectra da copilota base a agente capace di *disegnare molecole, generare spettri con diagrammi, eseguire workflow multi-step*.

---

## 1. Stato attuale (cosa c’è già)

| Componente | File | Note |
|---|---|---|
| Copilota AI | `bsi-ai-hub.js` | Multi-provider, tool-calling, fallback, proxy |
| App principale | `index.html` | Sezioni spettri, molecole, quiz, `goSection()` |
| RDKit Lab | `rdkit_lab.html` | Disegno SMILES, descrittori, **simulatore NMR/IR/MS** |
| Apertura lab | `window.openRDKitLab()` in `index.html` | Iframe overlay |

### Tool già presenti in Spectra (dopo questo pack)
- `naviga_sezione` — apre sezioni app
- `apri_strumento` — RDKit, ChemDraw, Accademia…
- `cerca_molecola` — cerca per nome e apre scheda
- **`disegna_molecola`** — SMILES → apre RDKit + postMessage
- **`mostra_spettri`** — apre spettri NMR/IR/MS
- **`analizza_molecola`** — DB locale + template picchi
- `apri_quiz`

### Limite attuale critico
RDKit Lab è in **iframe**. `postMessage` è già inviato da Spectra, ma **`rdkit_lab.html` non ascolta ancora** i messaggi `bsi-load-smiles` / `bsi-load-spectra`. Va implementato.

---

## 2. Lavoro da fare (checklist per Codex)

### PRIORITÀ ALTA

#### 2.1 Listener postMessage in `rdkit_lab.html`
Aggiungere in `rdkit_lab.html` (dopo init RDKit):

```js
window.addEventListener('message', function(ev){
  var d = ev.data;
  if(!d || typeof d !== 'object') return;
  if(d.type === 'bsi-load-smiles' && d.smiles){
    var inp = document.getElementById('smiles-input');
    if(inp){ inp.value = d.smiles; }
    if(typeof showPanelById === 'function') showPanelById('p-mol');
    if(typeof analyzeMol === 'function') setTimeout(analyzeMol, 100);
    else window._pendingSMI = d.smiles;
  }
  if(d.type === 'bsi-load-spectra'){
    if(d.smiles){
      var inp2 = document.getElementById('smiles-input');
      if(inp2) inp2.value = d.smiles;
      if(typeof analyzeMol === 'function') analyzeMol();
    }
    // Apri pannello spettri e seleziona tipo
    if(typeof showPanelById === 'function') showPanelById('p-spec'); // verifica id reale del pannello spettri
    var tipo = d.specType || 'nmr';
    if(tipo === 'tutti') tipo = 'nmr';
    // Clicca il bottone tipo spettro se esiste
    var btn = document.querySelector('[data-spt="'+tipo+'"]');
    if(btn && typeof specSetType === 'function') specSetType(btn, tipo);
    if(typeof specLoadFromMol === 'function') specLoadFromMol();
    if(typeof specAnalyze === 'function') setTimeout(specAnalyze, 200);
  }
});
```

**Verifica id pannelli:** in `rdkit_lab.html` cerca `showPanelById` / `p-spec` / `p-mol` e adatta gli id.

#### 2.2 Esporre API stabile da RDKit verso parent
In `rdkit_lab.html`:

```js
window.bsiRDKitAPI = {
  loadSMILES: function(smi){ /* ... */ },
  runSpectra: function(smi, type){ /* ... */ },
  getAnalysis: function(){ return { smiles: curSMI, /* picchi se disponibili */ }; }
};
```

E da Spectra, oltre a postMessage, fallback:

```js
var fr = document.querySelector('#bsi-rdkitlab-ov iframe');
if(fr && fr.contentWindow && fr.contentWindow.bsiRDKitAPI){
  fr.contentWindow.bsiRDKitAPI.loadSMILES(smi);
}
```

#### 2.3 Arricchire `analizza_molecola`
- Espandere DB locale (20–50 molecole d’esame: glucosio, caffeina, paracetamolo, toluene, acetato di etile, …)
- Oppure: se RDKit è già aperto, leggere `curSMI` + eventuali picchi calcolati
- Restituire sempre struttura JSON uniforme:

```json
{
  "nome": "...",
  "smiles": "...",
  "formula": "...",
  "mw": 0,
  "gruppi": [],
  "ir": [],
  "nmr_h": [],
  "nmr_c": [],
  "ms": []
}
```

#### 2.4 Workflow multi-step nel system prompt (già impostato)
Confermare che BASE_SYSTEM istruisca:
1. `analizza_molecola`
2. `disegna_molecola`
3. `mostra_spettri`
4. Spiegazione didattica in chat

Test manuale:
> “Disegna l’aspirina e mostrami tutti gli spettri con i diagrammi”

Atteso: RDKit si apre con SMILES aspirina + tab spettri + testo in chat su IR/NMR/MS.

---

### PRIORITÀ MEDIA

#### 2.5 Tool aggiuntivi suggeriti
| Tool | Descrizione |
|---|---|
| `prevedi_nmr` | Solo previsioni ¹H/¹³C testuali + tabella |
| `prevedi_ir` | Gruppi funzionali → bande |
| `confronta_molecole` | Due SMILES, differenze spettrali |
| `lancia_elucidazione` | Apre sezione elucidazione strutturale con dati |
| `esporta_report` | Genera HTML/Markdown report molecola+spettri |

#### 2.6 Migliorare simulatore spettri RDKit
File: `rdkit_lab.html` — funzioni `nmrPk`, `irPk`, `msPk`, `animateSpectrum`
- Usare euristiche per gruppi funzionali dallo SMILES (già parziale)
- Mostrare **diagramma a stick** + tabella picchi leggibile
- Bottone “Copia interpretazione” per Spectra

#### 2.7 Integrazione sezione molecola (`index.html` `#qi`)
Quando `cerca_molecola` trova hit, esporre anche SMILES in `window.__lastMolSMILES` così Spectra può fare subito `disegna_molecola`.

---

### PRIORITÀ BASSA (nice-to-have)
- Cache analisi molecole in `localStorage`
- Voice-out dei picchi principali
- Modalità “esame orale su questa molecola” che parte da SMILES corrente

---

## 3. File da toccare (ordine consigliato)

1. **`rdkit_lab.html`** — listener `message` + `window.bsiRDKitAPI` + eventuale fix id pannello spettri  
2. **`bsi-ai-hub.js`** — già aggiornato in questo pack (tool + prompt + fallback + proxy); verificare integrazione API  
3. **`index.html`** — solo se serve esporre SMILES dalla scheda molecola o migliorare `openRDKitLab(smiles)`  
4. Test end-to-end su Chrome/Firefox

---

## 4. Proxy (Claude / Grok)

Vedi `ISTRUZIONI_PROXY_SPECTRA.md` e `cloudflare-worker-proxy.js`.  
Senza proxy, Claude e Grok falliscono per CORS; Groq/Gemini/OpenRouter di solito funzionano diretti.

---

## 5. Criteri di accettazione

- [ ] Prompt “Disegna CCO e mostra spettri” → apre RDKit con etanolo + pannello spettri  
- [ ] Prompt “Aspirina: struttura e IR/NMR/MS” → analisi in chat + disegno + spettri  
- [ ] Fallback: se Claude fallisce, passa a Groq con messaggio visibile  
- [ ] Tool-calling multi-round (≥3 tool in un turno) senza crash  
- [ ] Nessun errore console su postMessage cross-origin same-parent

---

## 6. Contenuto di questo pack

| File | Ruolo |
|---|---|
| `bsi-ai-hub.js` | Spectra v2+ (proxy, fallback, tool potenti, prompt agentico) |
| `cloudflare-worker-proxy.js` | Worker CORS-free per Claude/Grok |
| `ISTRUZIONI_PROXY_SPECTRA.md` | Setup proxy |
| `GUIDA_CODEX_SPECTRA_POTENTE.md` | Questo documento |

---

## 7. Messaggio pronto per Claude Codex

Copia-incolla nel task Codex:

```
Implementa in BioSpecInfo il supporto completo tool Spectra → RDKit Lab.

1) In rdkit_lab.html aggiungi listener window.message per:
   - type bsi-load-smiles {smiles, name}
   - type bsi-load-spectra {smiles, name, specType}
   che caricano lo SMILES, aprono il pannello corretto e lanciano analyzeMol / specAnalyze.

2) Esporre window.bsiRDKitAPI = { loadSMILES, runSpectra, getAnalysis }.

3) Verificare che bsi-ai-hub.js (tool disegna_molecola e mostra_spettri) comunichi correttamente via postMessage all’iframe creato da openRDKitLab.

4) Espandere il DB di analizza_molecola con almeno 15 molecole d’esame.

5) Test: "Disegna l'aspirina e mostrami NMR, IR e MS con interpretazione".

Segui GUIDA_CODEX_SPECTRA_POTENTE.md nel repo.
```

---

*Fine guida — pronta per essere committata e data in pasto a Codex.*
