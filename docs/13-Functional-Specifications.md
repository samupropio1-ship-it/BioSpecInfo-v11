# Specifiche funzionali — BioSpecInfo

| Campo | Valore |
|-------|--------|
| **Software** | BioSpecInfo |
| **Versione descritta** | `bsi-v167` |
| **Scopo** | Descrivere cosa fa il prodotto, per chi, con quali regole e con quali limiti. |

---

## 1. Descrizione del prodotto

BioSpecInfo è una piattaforma di **chemioinformatica interattiva** per lo studio
universitario di chimica, biochimica, farmacologia e astrochimica.

L'intera logica scientifica — interpretazione delle strutture molecolari,
predizione spettrale, calcoli, visualizzazione 2D e 3D — viene eseguita **nel
browser dello studente**. Non esiste un server: l'applicazione si installa come
app, funziona senza rete e non trasmette dati.

### 1.1 Obiettivi

| Obiettivo | Come viene perseguito |
|---|---|
| **Accessibilità totale** | Nessuna registrazione, nessun costo, nessun server. Chi apre il collegamento la sta già usando. |
| **Indipendenza dalla rete** | Tutto il necessario è incluso e messo in cache: funziona in aula, in treno, in biblioteca senza campo. |
| **Correttezza verificabile** | I dati scientifici sono sottoposti a controlli automatici; i limiti dei modelli sono dichiarati anziché nascosti. |
| **Riservatezza per costruzione** | Non esiste un backend che possa raccogliere dati: l'assenza di raccolta non è una promessa, è una conseguenza dell'architettura. |

### 1.2 Cosa il prodotto non è

| | |
|---|---|
| **Non è un dispositivo medico** | Non supporta diagnosi, prescrizione né dosaggio (Reg. UE 2017/745) |
| **Non è uno strumento analitico certificato** | Gli spettri sono predizioni, non misure |
| **Non è una piattaforma collaborativa** | Nessun account, nessuna condivisione, nessuna sincronizzazione fra dispositivi |

---

## 2. Attori

| Attore | Descrizione | Cosa può fare |
|---|---|---|
| **Studente** | Utente principale. Studia per un esame universitario. | Tutte le funzioni: consultazione, calcolo, quiz, ripetizione spaziata, assistente AI |
| **Docente** | Usa l'app come supporto alla didattica | Le stesse funzioni; caricamento di materiale proprio nel File Manager |
| **Valutatore tecnico** | Azienda o commissione che esamina il lavoro | Consultazione della documentazione e riesecuzione dei banchi di verifica |

Non esistono ruoli tecnici: non c'è autenticazione, quindi non c'è distinzione
di permessi. Il File Manager ha una protezione locale che è un **deterrente**,
non un controllo d'accesso (vedi §6).

---

## 3. Aree funzionali

L'applicazione conta **70 sezioni**, raggruppate per area di studio.

### 3.1 Spettroscopia

| Funzione | Descrizione |
|---|---|
| **Centro spettroscopico** | Si inserisce una molecola (SMILES, nome, formula) e si ottengono IR, ¹H/¹³C NMR, MS, UV-Vis, Raman, struttura 2D e 3D, gruppi funzionali |
| **Spettri IR visivi** | Bande caratteristiche per classe di composti |
| **Spettro di massa** | Schemi di frammentazione e regole diagnostiche |
| **UV-Vis** | Cromofori, λmax, regole di Woodward |
| **NOE e NMR 2D** | Correlazioni spaziali |
| **Tabelle di riferimento** | Valori tabulati per la consultazione rapida |
| **Quiz spettri** | Riconoscimento del gruppo funzionale da uno spettro |

### 3.2 Chimica generale e fisica

Tavola periodica interattiva · calcolatore chimico · bilanciamento di reazioni ·
gradi di insaturazione · diagrammi di distribuzione · VSEPR · orbitali
molecolari · termodinamica avanzata · elettrochimica (Nernst) · pKa e tamponi ·
calcolatore di laboratorio · costanti e formule.

### 3.3 Chimica organica

Retrosintesi (98 esercizi) · sintesi e meccanismi con frecce elettroniche ·
meccanismi animati · editor di strutture · modulo *Chimica Organica 1+2* con 25
moduli.

### 3.4 Biochimica

Amminoacidi · biomolecole · vie metaboliche animate · cinetica enzimatica
(Michaelis-Menten) · macromolecole 3D · strutture biologiche interattive ·
guida di biochimica · biochimica d'esame.

### 3.5 Farmacologia

| Funzione | Descrizione |
|---|---|
| **Atlante 3D** | Si sceglie zona del corpo, malattia e farmaco: il modello evidenzia l'organo bersaglio |
| **Banca dati** | **178 farmaci** con struttura, peso molecolare, meccanismo, indicazioni, effetti avversi, classe |
| **Interazioni** | Verifica delle interazioni fra principi attivi |
| **Farmacocinetica** | Calcolatore di emivita, clearance, volume di distribuzione |
| **Casi clinici** | Percorsi diagnosi-terapia a scopo didattico |

### 3.6 Astrochimica

Molecole del mezzo interstellare · esopianeti e dati JWST · nebulose · spettri
stellari · nucleosintesi · chimica cometaria · quiz.

### 3.7 Strumenti di studio

| Funzione | Descrizione |
|---|---|
| **Ripetizione spaziata** | Algoritmo SM-2 su schede generate dai contenuti |
| **Quiz** | Per materia, con punteggio e storico |
| **Percorso di studio** | Sequenza guidata di argomenti |
| **Note** | Globali e per sezione |
| **Pomodoro** | Timer di studio |
| **File Manager** | Archivio personale di foto, documenti e pagine HTML |

### 3.8 Assistente «Spectra»

Agente AI con **35 strumenti** che può interrogare l'applicazione stessa:
calcolare descrittori, generare spettri, cercare costanti, bilanciare reazioni,
aprire sezioni. Supporta dieci fornitori, e resta utilizzabile quando uno di
essi si guasta (§5.2).

---

## 4. Flussi principali

### 4.1 Analizzare una molecola

```
1. Si apre il Centro spettroscopico
2. Si inserisce la molecola:
     · SMILES              → uso diretto
     · nome o formula      → risoluzione via PubChem (richiede rete)
     · disegno nell'editor → SMILES generato
3. L'applicazione mostra: struttura 2D, gruppi funzionali, descrittori,
   spettri previsti (IR, NMR, MS, UV-Vis), drug-likeness
4. La struttura 3D si carica se c'è rete (conformero da PubChem)
```

**Senza rete:** i punti 3 restano completi per gli SMILES inseriti
direttamente; la risoluzione per nome e la struttura 3D non sono disponibili, e
l'applicazione lo dichiara invece di restare in attesa.

### 4.2 Chiedere all'assistente

```
1. Si tocca il pulsante «Spectra»
2. Al primo uso: si sceglie un fornitore e si inserisce una chiave API,
   oppure si collega un proxy (e allora nessuna chiave serve)
3. Si scrive la domanda
4. L'assistente risponde, usando i propri strumenti quando servono:
   ogni strumento usato è mostrato, non nascosto
```

**Se il fornitore non risponde:** l'assistente lo annota, lo retrocede nella
scelta per 24 ore e passa a un altro fornitore configurato. Il pulsante
**🔌 Prova** misura in pochi secondi quali fornitori il dispositivo raggiunge
davvero, **senza bisogno di alcuna chiave**.

### 4.3 Studiare con la ripetizione spaziata

```
1. Si apre la sezione di studio
2. Si genera un mazzo dai contenuti
3. Per ogni scheda si valuta quanto la si ricordava
4. L'algoritmo SM-2 calcola quando riproporla
5. Alla riapertura compaiono solo le schede in scadenza
```

### 4.4 Archiviare materiale proprio

```
1. File Manager → password locale
2. Caricamento di foto, documenti o pagine HTML
3. Il materiale resta NEL DISPOSITIVO (IndexedDB), non viene trasmesso
```

---

## 5. Regole di business

### 5.1 Dati scientifici

| Regola | Motivazione |
|---|---|
| Una struttura molecolare entra in banca dati solo se il peso ricalcolato coincide con quello di letteratura (±0,6 u) | Un dato plausibile ma sbagliato è indistinguibile da uno corretto per l'utente |
| Se una struttura non supera la verifica, la voce resta **senza struttura** | Un dato sbagliato sostituito da un altro sbagliato non è un progresso |
| Ogni assenza deve essere **registrata con il motivo** | Un'eccezione non motivata diventa una scorciatoia |
| Gli spettri sono deterministici | Due spettri della stessa molecola devono essere confrontabili |
| Una costante fisica ambigua non viene risolta a caso | Un valore sbagliato dato con sicurezza è peggio di una domanda di chiarimento |

### 5.2 Assistente AI

| Regola | Comportamento |
|---|---|
| Un fornitore che non risponde viene ricordato **24 ore** | Poi si ritenta: un guasto di oggi non è una condanna |
| Un modello ritirato viene appreso dal messaggio d'errore | Le liste codificate a mano invecchiano |
| Un'attesa imposta superiore a **10 secondi** fa cambiare fornitore, se ce n'è uno pronto | Oltre quella soglia l'utente crede che l'app sia bloccata |
| Un turno alla volta | Due invii sovrapposti corrompono la cronologia |
| I fornitori a pagamento non vengono proposti come gratuiti | Senza fatturazione attiva si sbatte sul limite alla prima domanda |

### 5.3 Dati dell'utente

| Regola | Comportamento |
|---|---|
| Massimo 30 conversazioni, 100 messaggi ciascuna | Oltre, `localStorage` si riempie e **ogni** salvataggio successivo fallisce |
| Immagini fino a 20 MB | Oltre, rifiuto esplicito; le altre proseguono |
| Cancellazione selettiva per gruppi | Azzerare tutto per liberare spazio è una perdita evitabile |
| Una scrittura fallita **deve** essere dichiarata | «✅ Salvato» quando non è vero è peggio di un errore |

---

## 6. Limitazioni attuali

Dichiarate, non nascoste. Il dettaglio è in
[`09-Release-Conformance-Statement.md`](09-Release-Conformance-Statement.md) §4.

| # | Limitazione | Conseguenza pratica |
|---|---|---|
| 1 | **6 farmaci senza struttura verificata** | Per digossina, vincristina, tacrolimus, ivermectina e artemetere/lumefantrina mancano 2D/3D e spettri previsti |
| 2 | **Spettri predetti, non misurati** | Utili per riconoscere i gruppi funzionali; non per identificazione formale |
| 3 | **Nessuna sincronizzazione** | I dati non passano da un dispositivo all'altro, e non esistono copie sul server |
| 4 | **File Manager: deterrente, non sicurezza** | Su un sito statico chi legge il sorgente aggira qualunque controllo lato pagina |
| 5 | **Funzioni che richiedono rete** | Nome IUPAC, CAS, GHS, conformeri 3D, assistente AI |
| 6 | **Accessibilità verificata a campione** | Conformità WCAG 2.1 AA non verificata sistematicamente |

---

## 7. Sviluppi possibili

Non impegni: direzioni coerenti con l'architettura.

| Area | Proposta | Perché |
|---|---|---|
| Dati | Verificare le 6 strutture residue | Chiude l'unica lacuna dichiarata sui dati |
| Spettri | Confronto con database sperimentali (SDBS/NIST) dentro l'app | Renderebbe visibile la distanza fra predizione e misura |
| Accessibilità | Verifica WCAG sistematica e automatizzata | Trasformerebbe un controllo a campione in un banco |
| Esportazione | Esportazione completa dei dati utente | Unico rimedio possibile all'assenza di copie di sicurezza |
| Assistente | Proxy preconfigurato per chi non vuole pubblicarne uno | Toglierebbe l'ultima barriera d'accesso all'AI |

---

_Documento aggiornato alla versione `bsi-v167`._
