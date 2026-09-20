# Dichiarazione di conformità di rilascio — BioSpecInfo

| Campo | Valore |
|-------|--------|
| **Software** | BioSpecInfo |
| **Versione** | `bsi-v165` |
| **Autore e responsabile del rilascio** | Samuele Pio Provenzano |
| **Repository** | `github.com/samupropio1-ship-it/BioSpecInfo-v11` |
| **Distribuzione** | GitHub Pages — `samupropio1-ship-it.github.io/BioSpecInfo-v11/` |
| **Natura del software** | Progressive Web App client-side, senza backend |

---

## 1. Oggetto della dichiarazione

Il sottoscritto dichiara che la versione `bsi-v165` di BioSpecInfo è stata
sottoposta alla procedura di verifica descritta in
[`02-Verification-Validation-Report.md`](02-Verification-Validation-Report.md)
e che gli esiti sono quelli riportati, senza selezione, in
[`evidence/RAPPORTO-VERIFICA.md`](evidence/RAPPORTO-VERIFICA.md) — documento
generato automaticamente da `tools/genera-evidenza.js`, che trascrive l'uscita
dei banchi senza intervento manuale.

Questa dichiarazione **non** attesta l'assenza di difetti. Attesta che:

1. esiste una procedura di verifica automatizzata e riproducibile da terzi;
2. l'esito riportato è quello realmente prodotto, compresi i fallimenti;
3. i limiti noti sono dichiarati in modo esplicito e non presentati come
   funzionalità.

---

## 2. Destinazione d'uso e limitazioni

### 2.1 Destinazione dichiarata

BioSpecInfo è uno strumento **didattico e di supporto allo studio** per chimica,
biochimica, farmacologia e astrochimica. È progettato per studenti universitari
e per la preparazione di esami.

### 2.2 Ciò per cui il software NON è destinato

Queste esclusioni sono parte integrante della dichiarazione.

| Ambito | Esclusione |
|---|---|
| **Uso clinico** | Non è un dispositivo medico ai sensi del Regolamento (UE) 2017/745. Non supporta diagnosi, prescrizione, dosaggio né decisioni terapeutiche. I dati farmacologici hanno finalità esclusivamente didattica e l'applicazione lo dichiara in apertura della sezione. |
| **Uso analitico certificato** | Gli spettri sono **predizioni** da tabelle di gruppi funzionali, non misure né simulazioni quantomeccaniche. Non sostituiscono un database sperimentale (SDBS, NIST) né una determinazione strumentale, e non sono utilizzabili per identificazione formale di sostanze. |
| **Ambiente regolamentato GxP** | Non è validato per uso in ambiente GLP/GMP. L'allineamento a GAMP 5 descritto in `docs/03` è metodologico, non una qualifica formale. |
| **Controllo di accesso** | Il File Manager protegge i contenuti con un deterrente lato client. Su un sito statico non esiste controllo di accesso effettivo: chi legge il sorgente lo aggira. Non va usato per materiale riservato. |

---

## 3. Sintesi degli esiti di verifica

Gli esiti integrali, con l'uscita testuale di ogni banco, l'ambiente di
esecuzione, il commit e le impronte SHA-256, sono in
[`evidence/RAPPORTO-VERIFICA.md`](evidence/RAPPORTO-VERIFICA.md).

| Famiglia | Cosa dimostra |
|---|---|
| Dati scientifici | I dati chimici sono verificati contro una fonte indipendente |
| Agente AI | L'assistente resta utilizzabile quando il fornitore esterno si guasta |
| Stabilità | L'app regge sessioni lunghe, memoria esaurita, rete degradata |
| Interfaccia | I pannelli rispondono come documentato |
| Coerenza documentazione/codice | Ciò che la documentazione promette esiste nel codice |

---

## 4. Difformità note alla data del rilascio

Elencate per esteso. Nessuna è stata rimossa dalla verifica per farla passare.

| # | Difformità | Impatto | Trattamento |
|---|---|---|---|
| **D-01** | 6 farmaci ad alta complessità molecolare senza struttura verificata (elencati in `evidence/deviazioni-note.json`) | Per queste voci non è disponibile la rappresentazione 2D/3D né la predizione spettrale | Voci lasciate **senza SMILES**: i dati farmacologici restano, la struttura non è mostrata. Preferito all'inserimento di una struttura non verificata. |
| **D-02** | 19 voci prive di SMILES per natura (anticorpi monoclonali, peptidi) | Nessuno: per queste molecole la notazione SMILES non è la rappresentazione appropriata | Non è una difformità sostanziale; elencata per completezza |
| **D-03** | Copertura automatica dei requisiti di sicurezza al 50 % | SEC-02 e parte di SEC-03 coperti da ispezione documentale, non da banco | Dichiarato in `docs/08` §6 |
| **D-04** | Password del File Manager presente nella cronologia git antecedente alla rimozione | Il deterrente è noto a chi consulti la cronologia | Documentato; rimedio effettivo: sostituzione della password |
| **D-05** | Conformità WCAG 2.1 AA verificata a campione, non sistematicamente | Possibili difetti di accessibilità non rilevati | Dichiarato in `docs/08` §6 |

---

## 5. Criteri di accettazione applicati

Una versione è pubblicata solo se **tutti** i criteri seguenti sono soddisfatti.

- [x] Nessun errore JavaScript non di rete su tutte le pagine
- [x] `tools/verifica-farmaci.js` — nessun difetto; ogni deviazione registrata
- [x] `verifica_guida` — nessuna promessa della documentazione priva di riscontro nel codice
- [x] Nessun marcatore di conflitto nei file tracciati
- [x] Versione della cache del Service Worker incrementata e allineata a `BSI_APP_VERSION`
- [x] Difformità note elencate al §4 di questo documento
- [x] Rapporto di evidenza rigenerato sul commit pubblicato

---

## 6. Gestione delle modifiche

| Aspetto | Procedura |
|---|---|
| **Tracciabilità** | Ogni modifica passa da una pull request con descrizione del difetto, della causa e della verifica |
| **Versionamento** | La versione applicativa coincide con la versione della cache del Service Worker (`bsi-vNNN`), incrementata a ogni pubblicazione |
| **Distribuzione** | Automatica da `main` via GitHub Pages; il Service Worker segnala la nuova versione alle sessioni aperte senza interromperle |
| **Regressione** | La batteria completa è rieseguita prima di ogni unione in `main` |
| **Reversibilità** | Ogni versione corrisponde a un commit; il ripristino è un `git revert` |

---

## 7. Proprietà intellettuale e licenze

Tutti i componenti di terze parti sono distribuiti con licenze **permissive**
(MIT, BSD-3-Clause, CC0, Public Domain), reciprocamente compatibili e prive di
vincoli copyleft forti. La distinta completa, con impronte e obblighi residui, è
in [`07-SBOM.md`](07-SBOM.md) e nel formato CycloneDX
[`evidence/sbom.cdx.json`](evidence/sbom.cdx.json).

Il codice proprio del progetto è opera dell'autore.

---

## 8. Trattamento dei dati

L'applicazione è **local-first**: non esiste un backend, non vengono raccolti
dati personali e non è presente alcun identificativo persistente. I dati
generati dall'utente (note, chat, chiavi API, file caricati) restano nel
`localStorage` e nell'IndexedDB del dispositivo e sono cancellabili dalla stessa
interfaccia, in modo selettivo.

Le chiamate di rete sono opzionali e dirette a servizi pubblici documentati
(§4 di `07-SBOM.md`). Se l'utente configura il proxy, le chiavi API risiedono
sul Worker di sua proprietà e non sul dispositivo.

Dettaglio in [`03-Security-Privacy-Compliance.md`](03-Security-Privacy-Compliance.md).

---

## 9. Firma

Il presente documento è redatto dall'autore del software, che ne assume la
responsabilità. Non costituisce certificazione da parte di un organismo terzo, e
non viene presentato come tale.

Chiunque può verificare quanto dichiarato rieseguendo la procedura del §5 di
[`evidence/RAPPORTO-VERIFICA.md`](evidence/RAPPORTO-VERIFICA.md) sul commit
indicato, e confrontando le impronte SHA-256 dei file.

**Samuele Pio Provenzano**
_Versione `bsi-v165`._
