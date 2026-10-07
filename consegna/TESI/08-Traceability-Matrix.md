# Matrice di tracciabilità — BioSpecInfo

| Campo | Valore |
|-------|--------|
| **Software** | BioSpecInfo |
| **Autore** | Samuele Pio Provenzano |
| **Versione descritta** | `bsi-v189` |
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
| **SCI-01** | La struttura di un farmaco deve venire da una fonte esterna e coincidere con quella fonte, non solo pesare giusto | `FARM_DATA` in `index.html` — **263 voci**, 36 con identificativo ChEMBL e formula dichiarati | `audit_farmaci` — la formula viene **ricostruita contando gli atomi del grafo** e confrontata con quella di ChEMBL: 36 su 36. Il solo peso non bastava: tre voci preesistenti (lenalidomide, palbociclib, aripiprazolo) erano **isomeri** — stesso peso, molecola diversa — e sono state sostituite. Due cricche: provenienza verificata ≥ 36, strutture leggibili ≥ 240 |
| **SCI-02** | I gruppi funzionali devono essere riconosciuti sulla struttura, non sul testo dello SMILES | `bsi-spettri.js` §1, pattern SMARTS via RDKit | `test_spettri` — 8 molecole di riferimento, riconoscimento additivo |
| **SCI-03** | Una molecola con più gruppi funzionali deve mostrarli tutti | `bandeDaGruppi()`, costruzione additiva | `test_spettri` §1 — acido acetilsalicilico: estere **e** acido |
| **SCI-04** | Gli spettri devono rispettare le convenzioni della tecnica | `svgIR()`, `makeNMRsvg()`, `drawUVSpectrum()`, `drawMSSpectrum()` | `test_assi` (SVG), `test_assi_canvas` (canvas) |
| **SCI-05** | Uno spettro calcolato deve essere riproducibile | rimozione di ogni `Math.random()` dalle tracce | `test_assi` §3, `test_spettri` §8 — confronto byte a byte |
| **SCI-06** | L'altezza dei picchi ¹H deve rappresentare l'integrazione o non essere asserita | `makeNMRsvg()`; `_nmrSvg()` disegna fasce a altezza uniforme | `test_assi` §4 |
| **SCI-07** | La coniugazione deve agire sul singolo carbonile | SMARTS `acidoConiug`, `estereConiug`, `chetoneConiug`, `aldeideConiug` | `test_spettri` §1 — aspirina 1760/1690; acetofenone 1690 |
| **SCI-08** | Una costante fisica ambigua non deve essere risolta arbitrariamente | `costante_fisica` in `bsi-ai-hub.js` — raccoglie tutte le candidate | `test_costanti` — 45 controlli, compresi i rifiuti per ambiguità |
| **SCI-09** | I limiti dei predittori devono essere dichiarati all'utente | intestazione dei grafici; `docs/06` §3.5 | `verifica_guida` — coerenza fra promesse e codice |
| **SCI-10** | La simmetria molecolare deve determinare correttamente le regole di selezione | sezione `ssimm` in `index.html` | `test_simmetria` — 26 controlli: modi normali, centro di inversione, esclusione mutua |
| **SCI-12** | Un cromatogramma deve discendere dai parametri, non essere disegnato | sezione `scroma`: σ = t<sub>R</sub>/√N, R<sub>s</sub> da distanza e larghezze | `audit_stabilita` (apertura e disegno), ispezione dei valori contro le definizioni |
| **SCI-13** | Una retta di taratura deve dichiarare l'incertezza dei suoi coefficienti e riconoscere i due modi in cui inganna | sezione `staratura`: minimi quadrati ordinari, test F retta⟷parabola, residuo cancellato | Verificato sui tre insiemi di esempio inclusi: lineare (F = 0,3), non lineare (F = 186,6 > 7,71), con punto anomalo (1 rilevato) |
| **SCI-14** | Un modello QSAR deve essere valutato su scheletri mai visti, non su analoghi dello stesso insieme | `bsi-cheminfo.js` §9 — `divisionePerScaffold()` accanto a `divisioneCasuale()` | `test_cheminfo` — la divisione per scheletro non lascia nessuno scheletro in comune fra addestramento e prova |
| **SCI-15** | Un punteggio di modello deve essere confrontato con il caso, non presentato da solo | `bsi-cheminfo.js` §9 — riaddestramento su etichette rimescolate, otto ripetizioni | `test_cheminfo` — verificato **nei due versi**: su un segnale apprendibile R² 0,394 batte tutti gli otto sosia (margine 0,287); su etichette casuali R² −0,199 **non** li batte |
| **SCI-16** | Due scritture della stessa molecola non devono contarsi due volte né finire da parti opposte della divisione | `bsi-cheminfo.js` §1 — deduplicazione sullo SMILES canonico dopo il frammento maggiore | `test_cheminfo` — `OC(=O)C` e `CC(=O)O` collassano in una voce; i sali perdono il controione |
| **SCI-17** | La similarità fra molecole deve essere calcolata, non stimata | `bsi-cheminfo.js` §3 — Tanimoto e Dice su impronte Morgan, RDKit, pattern, MACCS | `test_cheminfo` — confronto con valori calcolabili a mano, compresa la convenzione 0/0 = 1 |
| **SCI-18** | Una validazione su una divisione sola, su un insieme piccolo, è un numero rumoroso: va accompagnata dalla sua dispersione | `bsi-cheminfo.js` §9-bis — `validazioneIncrociata()` su pieghe **raggruppate per scheletro** | `test_cheminfo` — le pieghe coprono ogni molecola una volta sola, **nessuno scheletro sta in due pieghe**, e con lo stesso seme le pieghe sono le stesse |
| **SCI-19** | Un risultato che cambia a ogni esecuzione non è verificabile da nessuno | generatore mulberry32 seminato per divisioni, rimescolamenti e pieghe; il seme è scritto nel rapporto | `test_cheminfo` — due chiamate con lo stesso seme danno pieghe identiche; il rapporto di metodo dichiara il seme |
| **SCI-20** | I risultati devono poter uscire dallo strumento, e il metodo deve uscire con loro | `bsi-cheminfo.js` §9-ter — `esportaCsv()` e `rapportoMetodo()`, entrambi formati in memoria nel browser | `test_cheminfo` — colonne coerenti con l'intestazione, nome con virgola citato, residuo calcolato, cella vuota per l'attività mancante; il rapporto contiene seme, fingerprint, verdetto, limiti |
| **SCI-21** | Un numero presentato come similarità strutturale deve venire da un fingerprint, e una sola implementazione deve calcolarlo | `rdkit_lab.html` carica `bsi-cheminfo.js` e ne usa `tanimoto()` e `fingerprint()`; la similarità a otto bit è stata rimossa | `test_cheminfo` — la pagina e il motore danno lo stesso Tanimoto su tutte e **28 le coppie**, scarto **esattamente 0**; le funzioni della similarità finta non esistono più; ogni struttura di riferimento è valida e ha la **massa monoisotopica** del farmaco che dichiara |
| **SCI-22** | Le conversioni fra linguaggi molecolari devono essere verificate contro una fonte esterna o contro il calcolo a mano, e le coordinate scritte in un file devono essere vere e dichiarate | `bsi-molingue.js` — **venticinque uscite**, da SMILES a CML e alle sei impronte | `test_lingue` — 7 chiavi InChI **di letteratura**, giro completo SMILES → molfile → SMILES, 26 nomi a mano, **7 rifiuti pretesi**; composizione in massa contro il calcolo a mano (alanina C 40,44%, aspirina C 60,00%); XYZ e PDB con coordinate non nulle **e** dichiarate 2D |
| **SCI-23** | Angoli, lunghezze e diedri si misurano sulle coordinate, e su coordinate piatte non si mostrano | prodotto scalare per gli angoli, prodotto vettoriale per i diedri | `test_mol3d` — tetraedro **109,4712°**, acqua 104,47°, CO₂ 180°, BF₃ 120°, ammoniaca 106,13°; diedri 0°, 60°, 90°, 180°; C–C dell'etanolo 1,509 Å; e il rifiuto provato nei due versi |
| **SCI-24** | Uno spettro letto da un file deve essere decodificato secondo il formato, e i picchi trovati devono essere quelli che ci sono — né più né meno | `bsi-spettrolettore.js` — JCAMP-DX con ASDF completo (PMAI, DIF, DUP) e il controllo di integrità che il formato prevede; picchi per **prominenza**, rumore da MAD × 1,4826 | `test_spettrolettore` — **39 controlli**. Su tre gaussiane costruite a 1715, 2950, 3400 cm⁻¹ sotto rumore ne trova tre: 1716, 2952, 3402. **Nei due versi**: su rumore puro ne trova **zero**. ASDF verificato simbolo per simbolo (`abcdefghi` = −1…−9; `n` = −5, non −4) |
| **SCI-25** | Una banda deve essere dichiarata *compatibile con*, mai assegnata a una sola possibilità | `BANDE_IR` — 24 intervalli, `assegnaIR()` restituisce **tutte** le assegnazioni compatibili | `test_spettrolettore` — a 1715 cm⁻¹ compaiono sia C=O chetonico sia C=O di acido carbossilico; la sezione dichiara di non dedurre la struttura |
| **SCI-26** | Un modello pubblicato va verificato contro il **suo** errore dichiarato, e un modello appreso contro il caso | `bsi-cheminfo.js` §10 — ESOL (Delaney 2004) con incertezza, quattro filtri di drug-likeness separati, foresta casuale con errore fuori sacco | `test_spettrolettore` §4-5 — ESOL contro quattro valori sperimentali, scarto medio **0,68** entro l'errore dichiarato di ~1 unità logaritmica; foresta R² fuori sacco **0,90** su una relazione non lineare e **−0,16** su puro rumore; deterministica a parità di seme e diversa con seme diverso |
| **SCI-27** | Una struttura senza fonte non deve entrare, nemmeno quando la si conosce | raccolta da ChEMBL, `tools/dati/farmaci_v187.json` con l'identificativo di ogni voce | **Due rifiuti**: ivermectina (`structure_type NONE`, miscela di omologhi) e semaglutide (proteina, `SEQ`). E due nomi tenuti con il nome del **record** e non della domanda: «morphine» → apomorfina, «levothyroxine» → liotironina |
| **SCI-28** | Uno spettro previsto deve dire QUALI atomi producono ogni segnale, e lo scarto va misurato su molecole che non hanno scelto i parametri | `bsi-pretsch.js` — le tabelle di stima trascritte intere dalla fonte (Pretsch 4ª ed.: 91 righe ¹³C e 66 ¹H per i benzeni, 42 per gli etileni, 31 per gli alcani, 24 per gli alifatici ¹³C, correzioni steriche 4×4); `bsi-nmr.js` — il ragionamento che le applica: posizione nell'anello ricavata camminando il ciclo, schema additivo con composto di riferimento ciclico, equivalenza chimica per codice d'intorno a gusci | `test_nmr` — **56 controlli**. Due insiemi separati: taratura **0,71 ppm** su 9 molecole, **validazione 0,92 ppm** su 22 mai usate per tarare, caso peggiore **4,9 ppm**, ¹H **0,06 ppm** (0,03 sui soli aromatici). Il banco pretende che la validazione resti **peggiore** della taratura: se diventassero uguali, qualcuno avrebbe spostato una molecola fra i due insiemi |
| **SCI-29** | Atomi chimicamente equivalenti devono dare UN segnale, non uno per atomo | codice d'intorno a gusci concentrici per distanza (principio dei codici HOSE), con i legami aromatici scritti come tali e non in forma di Kekulé | `test_nmr` — otto molecole di cui si sa quanti segnali danno: benzene **1** (non sei), toluene 5, p-xilene 3, naftalene 3, difenile 4, aspirina 9. Tutte giuste |
| **SCI-30** | Da un'immagine si può recuperare la FORMA di uno spettro, non la sua taratura | `bsi-spettrolettore.js` §6-bis — estrazione della traccia dai pixel colonna per colonna, sfondo stimato dalla mediana, colonne vuote interpolate | `test_spettrolettore` — su una figura **costruita** con gaussiane a 1715/2950/3400 cm⁻¹ legge **1713/2947/3403** dai soli pixel; **nei due versi**, su un foglio bianco rifiuta invece di inventare una traccia; e dichiara che la scala degli assi non sta nei pixel |

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
| **STA-01** | Una sessione lunga non deve accumulare nodi DOM né timer | gestione del ciclo di vita delle sezioni | `audit_stabilita` §1 — 92 sezioni × 5 giri |
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
| **UI-03** | L'app deve funzionare a 390 px di larghezza | griglie `auto-fit`, nessuna colonna fissa | `audit_mobile` — `scrollWidth` del documento su tutte le 92 sezioni a 390 px; `audit_stabilita` per gli errori in viewport telefono |
| **UI-04** | L'utente deve poter sapere quale versione sta usando e forzare l'aggiornamento | voce «Aggiornamenti» nel pannello ✨ | `test_aggiorna` — 9 controlli |
| **UI-05** | La cancellazione dei dati deve essere selettiva e reversibile nelle scelte | `bsiCancellaDati()` per gruppi | `browser_reset` — 24 controlli |
| **UI-08** | Anche le superfici che compaiono solo dopo un'azione devono rispettare il contrasto WCAG AA | i sei pannelli della sezione Chemioinformatica | `test_cheminfo` — l'analisi viene eseguita, i pannelli aperti a turno, **460 elementi di testo misurati, 0 difetti**, con le formule WCAG riscritte dentro il banco |
| **UI-09** | Aprire una sezione non deve bloccare la pagina | primo `render()` di 3Dmol fuori dal click; le 296 figure di sintesi **e le 263 carte dei farmaci** disegnate a fette da 8 ms | `test_fluidita` — **92 sezioni attraversate**, cambio mediano 16 ms, peggiore 87 ms, **0 sezioni oltre 100 ms** (erano 3 con i farmaci nuovi, a 159 ms); e le prove contrarie: la tela WebGL compare comunque, le 296 figure esistono tutte poco dopo, la stampa non esce muta. Sul visore l'affermazione è **strutturale e non temporale**: subito dopo il ritorno del gestore del click il contesto WebGL non deve esistere, poco dopo deve — perché una soglia in millisecondi misurava SwiftShader e non il codice (14…192 ms a codice identico) |
| **UI-10** | L'interfaccia deve poter cambiare lingua fra molte, dichiarando per ognuna quanto è tradotta, portando con sé il verso di scrittura | `bsi-lingue.js` con **quattordici lingue**, selezionatore con ricerca, `dir="rtl"` per l'arabo | `test_lingue` — **170 elementi di scheletro su 170 in ognuna delle tredici lingue**, copertura calcolata applicando il dizionario e contando; verso di scrittura provato nei due versi; categorie della barra e segnaposto della ricerca compresi |
| **UI-11** | La molecola deve mostrare come sta insieme, e l'angolo lo deve scegliere chi guarda | `bsi-mol3d.js`: formazione dalla polvere con arrivo scaglionato, e selezione degli atomi con un clic | `test_mol3d` — i **pixel** della tela a 130 ms e a 2,3 s, l'ordine d'arrivo (scheletro prima degli idrogeni) misurato sull'avanzamento di ogni atomo, e la selezione di 1, 2, 3 e 4 atomi |

---

## 5. Requisiti di sicurezza e riservatezza

| ID | Requisito | Implementazione | Banco di verifica |
|---|---|---|---|
| **SEC-01** | Nessuna chiave API deve essere presente nel repository | chiavi solo in `localStorage` o nei segreti del Worker | `tools/verifica-sicurezza.js` — 307 file tracciati, 8 forme di credenziale |
| **SEC-02** | Nessun dato personale deve lasciare il dispositivo senza azione esplicita | architettura local-first, telemetria disattivata | `audit_rete` — **verifica diretta**: un valore spia seminato in 71 depositi dei dati utente, l'applicazione usata per 92 sezioni su 6 pagine, e URL, intestazioni e corpo di ogni richiesta ispezionati. Più `verifica-sicurezza` sui due meccanismi di uscita |
| **SEC-03** | Le password non devono comparire in chiaro nel sorgente | SHA-256 in `file_manager.html` | `tools/verifica-sicurezza.js` |
| **SEC-07** | Nessuna credenziale deve essere MAI entrata nel repository, nemmeno in un commit poi corretto | nessuna chiave è mai stata committata; le chiavi stanno in `localStorage` o nei segreti del Worker | `audit_storia` — **1 551 versioni distinte di file di testo su 390 commit**, 9 schemi provati nei due versi; fallisce su un clone superficiale, perché misurerebbe meno superficie |
| **SEC-04** | Nessun marcatore di conflitto deve raggiungere la pubblicazione | — | `verifica_guida` §12 — 58 file di testo |

> **SEC-03 — limite dichiarato.** GitHub Pages serve file statici: qualunque
> controllo di accesso lato pagina è aggirabile da chi legge il sorgente. La
> protezione del File Manager è un deterrente, **non** un controllo di sicurezza,
> e la documentazione lo afferma. Inoltre la password in chiaro è rimasta nella
> cronologia git fino alla sua rimozione, e togliere un segreto dai file non lo
> toglie dalla storia: `git log -p` lo restituisce a chiunque. L'unico rimedio
> effettivo era cambiarla, ed **è stato fatto** alla versione `bsi-v189`.
> Quella vecchia resta nella cronologia e non apre più niente.

---

## 6. Requisiti non ancora verificati automaticamente

Dichiarati per completezza. Sono coperti da ispezione documentale o da prova
manuale, e la loro automazione è in programma.

| ID | Requisito | Copertura attuale |
|---|---|---|
| **UI-06** | Conformità WCAG 2.1 AA completa | la parte meccanica è automatizzata su **13 pagine e 92 sezioni** (`tools/verifica-accessibilita.js`, **38 407** elementi di testo: erano 19 751 prima che il testo su gradiente entrasse nella misura, e 37 409 prima della sezione «Lettore spettri»). **Dei 1 069 difetti di contrasto emersi non ne resta nessuno: 0 misurati** sulle stesse 92 sezioni, e il valore è registrato come riferimento che il banco difende. I campi senza etichetta sono **zero**: vedi il riquadro in `docs/09` §4. Restano fuori il testo dentro gli SVG e quello su una vera immagine di sfondo, contati a ogni esecuzione (D-09) |
| **PERF-01** | Tempo di primo disegno su dispositivo di fascia bassa | prova manuale cross-device (`docs/02` §4) |
| **SCI-11** | Strutture di 2 voci che non sono molecole singole (erano 6) | **non rappresentabili**: Ivermectina è una miscela di omologhi, Coartem un'associazione di due principi attivi. Le altre quattro sono state chiuse riprendendo la struttura da ChEMBL, vedi `docs/06` §2.4 |
| **PERF-02** | Copertura di codice dei banchi di prova | **misurata parzialmente**: 49,89 % di istruzioni sul percorso più ampio (`audit_copertura`). Resta non misurata la copertura dell'intera batteria e quella di rami; vedi §8 |
| **UI-07** | Comportamento su Firefox e WebKit | **non verificato** — la batteria gira solo su Chromium; vedi §8 |

---

## 7. Copertura complessiva

| Categoria | Requisiti | Verificati da banco | Copertura |
|---|---:|---:|---:|
| Scientifici (SCI-01…30) | 29 | 29 | 100 % |
| Agente AI (AI-01…10) | 10 | 10 | 100 % |
| Stabilità (STA-01…08) | 8 | 8 | 100 % |
| Interfaccia (UI-01…11) | 9 | 9 | 100 % |
| Sicurezza (SEC-01…07) | 5 | 5 | 100 % |
| **Totale automatizzato** | **61** | **61** | **100 %** |
| Non automatizzati (§6) | 5 | 0 | 0 % |
| **Totale dichiarato** | **66** | **61** | **92 %** |

La copertura è calcolata sui requisiti **dichiarati in questo documento** e non
va confusa con una copertura di codice: misura quanti requisiti hanno un banco
che li verifica, non quante righe vengono eseguite durante i test.

> **Perché due totali.** Riportare solo il 100 % dei requisiti automatizzati
> sarebbe vero e fuorviante insieme: è il 100 % di ciò che si è scelto di
> automatizzare. Il numero che conta per chi valuta è il secondo — **54
> requisiti verificati su 59 dichiarati** — e i cinque che mancano sono elencati
> per nome in §6, non riassunti in una percentuale.
>
> Questa tabella è controllata da `tools/verifica-documenti.js`, che conta gli
> identificativi realmente presenti nel documento e fallisce se i totali qui
> scritti non corrispondono. È un controllo nato da un errore reale: i totali
> dicevano 36 su 9 categorie scientifiche mentre gli identificativi definiti
> erano 10, e `SCI-10` compariva due volte — una come requisito verificato e
> una come requisito non verificato.

---

## 8. Lacune di copertura dichiarate

Non sono difetti: sono cose che **non sono state misurate**, e che quindi non
possono essere affermate.

| Lacuna | Che cosa comporta | Perché è così |
|---|---|---|
| **Copertura di codice parziale** | Misurata: **49,89 %** di istruzioni sul percorso più ampio che un banco compie. Non è la copertura dell'intera batteria, ed è di istruzioni, non di rami | Il profilatore di Chromium la raccoglie nel motore, senza build e senza riscrivere il sorgente: l'ostacolo era dello strumento (c8, istanbul), non del problema. Valore registrato, `audit_copertura` fallisce se scende |
| **Solo Chromium** | Il comportamento su Firefox e WebKit è verificato a mano, non da banco | La batteria usa `playwright-core`, che scarica un motore solo. Nell'ambiente di verifica la CDN degli altri motori risponde **403** alla politica di rete: non sono installabili lì |
| **Nessuna regressione visiva** | Un cambiamento grafico involontario non verrebbe intercettato | Gli spettri sono deterministici e confrontabili byte a byte (SCI-05): il confronto esiste sulle tracce, non sull'intera pagina |
| **2 voci senza struttura** | Due voci su 178 non hanno una struttura da mostrare: Ivermectina è una miscela di omologhi, Coartem un'associazione di due principi attivi. Erano sei | Vedi `06-Scientific-Accuracy-Data-Provenance.md` §2.4 |
| **Prestazioni su dispositivi lenti** | Il tempo di primo disegno non è misurato su hardware di fascia bassa | Richiede dispositivi fisici; la prova è manuale |

---

_Documento aggiornato alla versione `bsi-v189`._
