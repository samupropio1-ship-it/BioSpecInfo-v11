# Matrice di tracciabilità — BioSpecInfo

| Campo | Valore |
|-------|--------|
| **Software** | BioSpecInfo |
| **Autore** | Samuele Pio Provenzano |
| **Versione descritta** | `bsi-v166` |
| **Scopo** | Collegare ogni requisito dichiarato all'implementazione che lo realizza e al banco di prova che lo verifica. |

> **Come leggere questa matrice.** Ogni riga è una catena chiusa: un requisito,
> il punto del codice che lo realizza, e il banco che ne verifica il
> funzionamento. Una riga senza banco è un requisito **non verificato** e viene
> dichiarata come tale, non nascosta: l'utilità di una matrice sta esattamente
> nel rendere visibili le lacune.
>
> Gli esiti dei banchi citati sono riportati per esteso, con l'uscita integrale,
> in [`evidence/RAPPORTO-VERIFICA.md`](evidence/RAPPORTO-VERIFICA.md), generato
> automaticamente.

---

## 1. Requisiti scientifici

| ID | Requisito | Implementazione | Banco di verifica |
|---|---|---|---|
| **SCI-01** | I dati strutturali dei farmaci devono essere coerenti con il peso molecolare dichiarato | `FARM_DATA` in `index.html` | `tools/verifica-farmaci.js` — confronto RDKit ⟷ letteratura su 178 voci |
| **SCI-02** | I gruppi funzionali devono essere riconosciuti sulla struttura, non sul testo dello SMILES | `bsi-spettri.js` §1, pattern SMARTS via RDKit | `test_spettri` — 8 molecole di riferimento, riconoscimento additivo |
| **SCI-03** | Una molecola con più gruppi funzionali deve mostrarli tutti | `bandeDaGruppi()`, costruzione additiva | `test_spettri` §1 — acido acetilsalicilico: estere **e** acido |
| **SCI-04** | Gli spettri devono rispettare le convenzioni della tecnica | `svgIR()`, `makeNMRsvg()`, `drawUVSpectrum()`, `drawMSSpectrum()` | `test_assi` (SVG), `test_assi_canvas` (canvas) |
| **SCI-05** | Uno spettro calcolato deve essere riproducibile | rimozione di ogni `Math.random()` dalle tracce | `test_assi` §3, `test_spettri` §8 — confronto byte a byte |
| **SCI-06** | L'altezza dei picchi ¹H deve rappresentare l'integrazione o non essere asserita | `makeNMRsvg()`; `_nmrSvg()` disegna fasce a altezza uniforme | `test_assi` §4 |
| **SCI-07** | La coniugazione deve agire sul singolo carbonile | SMARTS `acidoConiug`, `estereConiug`, `chetoneConiug`, `aldeideConiug` | `test_spettri` §1 — aspirina 1760/1690; acetofenone 1690 |
| **SCI-08** | Una costante fisica ambigua non deve essere risolta arbitrariamente | `costante_fisica` in `bsi-ai-hub.js` — raccoglie tutte le candidate | `test_costanti` — 45 controlli, compresi i rifiuti per ambiguità |
| **SCI-09** | I limiti dei predittori devono essere dichiarati all'utente | intestazione dei grafici; `docs/06` §3.5 | `verifica_guida` — coerenza fra promesse e codice |

---

## 2. Requisiti dell'agente AI

| ID | Requisito | Implementazione | Banco di verifica |
|---|---|---|---|
| **AI-01** | Un modello ritirato dal fornitore non deve bloccare l'assistente | `modelloSuggeritoDaErrore()`, lista nera `bsi_modelli_ko` | `test_404` — 36 controlli |
| **AI-02** | Un fornitore irraggiungibile dal browser deve essere ricordato e retrocesso | `bsi_prov_ko`, TTL 24 h, `providerUtilizzabili()` | `test_ko` (35), `browser_ko` (37) |
| **AI-03** | Un sovraccarico temporaneo deve produrre un nuovo tentativo, non un errore | `erroreTemporaneo()`, `TENTATIVI_TEMPORANEO` | `test_503` — 40 controlli |
| **AI-04** | Un'attesa imposta superiore a 10 s deve far cambiare fornitore se ve n'è uno pronto | `ATTESA_TROPPO_LUNGA_MS` | `test_attesalunga` — 14 controlli |
| **AI-05** | Il tetto di token del fornitore deve essere appreso dall'errore, non codificato | `tettoDaErrore()`, `MARGINE_TETTO` | `test_tetto` — 32 controlli |
| **AI-06** | Le firme di ragionamento opache devono essere restituite al fornitore | cattura e replay in `appendAgentTurn()` | `test_firma` — 31 controlli |
| **AI-07** | Due invii sovrapposti non devono corrompere la cronologia | `_turnoInCorso` in `send()` | `test_doppioinvio` — 7 controlli |
| **AI-08** | L'utente deve poter misurare quali fornitori raggiunge davvero | `provaTuttiIFornitori()` | `browser_prova` — 29 controlli |
| **AI-09** | I fornitori a pagamento non devono essere proposti come gratuiti | separazione per `PROVIDERS[id].free` | `browser_prova` §D2 |
| **AI-10** | Deve esistere una via documentata per eliminare CORS e limiti | `proxy/spectra-proxy.js` + guida in-app | `test_guidaproxy` (12), `browser_proxy` (15), `browser_proxyui` (17) |

---

## 3. Requisiti di stabilità

| ID | Requisito | Implementazione | Banco di verifica |
|---|---|---|---|
| **STA-01** | Una sessione lunga non deve accumulare nodi DOM né timer | gestione del ciclo di vita delle sezioni | `audit_stabilita` §1 — 84 sezioni × 5 giri |
| **STA-02** | L'esaurimento di `localStorage` non deve rendere inutilizzabile l'app | scritture protette; avviso persistente nel File Manager | `audit_quota` (10), `test_filemanager` (15) |
| **STA-03** | Nessuna promessa rifiutata deve restare non gestita | `.catch()` sistematici | `audit_promesse` — 22 controlli, rete sana e rete morta |
| **STA-04** | Dati salvati corrotti non devono impedire l'avvio | `loadJSON()` con ripiego | `audit_stabilita` §4 |
| **STA-05** | Una rete lenta non deve essere trattata come una rete assente | `ATTESA_RETE_MS = 3500` in `sw.js` | `test_sw` §3 e §3-bis — misurato 3 507 ms |
| **STA-06** | Un aggiornamento non deve distruggere il lavoro in corso | messaggio `BSI_SW_UPDATED`, decisione lato pagina | `test_sw` §4 |
| **STA-07** | Sfogliare molecole non deve esaurire i contesti WebGL | riuso del visore 3D nei 5 punti di creazione | `test_visore3d` — da 7 costruzioni a 1 |
| **STA-08** | L'archivio IndexedDB non disponibile deve essere dichiarato, non fatale | `dbStore()` su promessa; avviso persistente | `test_filemanager` §2 |

---

## 4. Requisiti di interfaccia e accessibilità

| ID | Requisito | Implementazione | Banco di verifica |
|---|---|---|---|
| **UI-01** | Ogni pagina deve aprirsi senza errori JavaScript | — | `audit_stabilita` §5 — 14 pagine |
| **UI-02** | I grafici devono essere nitidi su schermi ad alta densità | `bsiNitido()` sui contesti canvas | `audit_grafici` — 40 canvas |
| **UI-03** | L'app deve funzionare a 390 px di larghezza | griglie `auto-fit`, nessuna colonna fissa | `audit_stabilita`, viewport telefono |
| **UI-04** | L'utente deve poter sapere quale versione sta usando e forzare l'aggiornamento | voce «Aggiornamenti» nel pannello ✨ | `test_aggiorna` — 9 controlli |
| **UI-05** | La cancellazione dei dati deve essere selettiva e reversibile nelle scelte | `bsiCancellaDati()` per gruppi | `browser_reset` — 24 controlli |

---

## 5. Requisiti di sicurezza e riservatezza

| ID | Requisito | Implementazione | Banco di verifica |
|---|---|---|---|
| **SEC-01** | Nessuna chiave API deve essere presente nel repository | chiavi solo in `localStorage` o nei segreti del Worker | `verifica_guida` — ispezione dei file tracciati |
| **SEC-02** | Nessun dato personale deve lasciare il dispositivo senza azione esplicita | architettura local-first, telemetria disattivata | ispezione documentale (`docs/03`) |
| **SEC-03** | Le password non devono comparire in chiaro nel sorgente | SHA-256 in `file_manager.html` | ispezione documentale |
| **SEC-04** | Nessun marcatore di conflitto deve raggiungere la pubblicazione | — | `verifica_guida` §12 — 58 file di testo |

> **SEC-03 — limite dichiarato.** GitHub Pages serve file statici: qualunque
> controllo di accesso lato pagina è aggirabile da chi legge il sorgente. La
> protezione del File Manager è un deterrente, **non** un controllo di sicurezza,
> e la documentazione lo afferma. Inoltre la password in chiaro è rimasta nella
> cronologia git fino alla sua rimozione: l'unico rimedio effettivo è cambiarla.

---

## 6. Requisiti non ancora verificati automaticamente

Dichiarati per completezza. Sono coperti da ispezione documentale o da prova
manuale, e la loro automazione è in programma.

| ID | Requisito | Copertura attuale |
|---|---|---|
| **UI-06** | Conformità WCAG 2.1 AA su tutte le sezioni | contrasto e ruoli ARIA verificati a campione |
| **SEC-02** | Assenza di trasmissione dati non richiesta | ispezione del codice, nessun banco dedicato |
| **PERF-01** | Tempo di primo disegno su dispositivo di fascia bassa | prova manuale cross-device (`docs/02` §4) |
| **SCI-10** | Strutture di 6 farmaci ad alta complessità | **non verificate** — voci lasciate senza struttura, vedi `docs/06` §2.4 |

---

## 7. Copertura complessiva

| Categoria | Requisiti | Verificati da banco | Copertura |
|---|---:|---:|---:|
| Scientifici | 9 | 9 | 100 % |
| Agente AI | 10 | 10 | 100 % |
| Stabilità | 8 | 8 | 100 % |
| Interfaccia | 5 | 5 | 100 % |
| Sicurezza | 4 | 2 | 50 % |
| **Totale dichiarato** | **36** | **34** | **94 %** |
| Non automatizzati (§6) | 4 | 0 | — |

La copertura è calcolata sui requisiti **dichiarati in questo documento** e non
va confusa con una copertura di codice: misura quanti requisiti hanno un banco
che li verifica, non quante righe vengono eseguite durante i test.

---

_Documento aggiornato alla versione `bsi-v166`._
