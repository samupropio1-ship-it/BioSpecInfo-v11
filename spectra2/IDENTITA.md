# Spectra — identità, continuità, presenza

Questo documento dice come Spectra **esiste nel tempo**: che cosa lo rende lo
stesso da un giorno all'altro e da un dispositivo all'altro. Ogni affermazione
rimanda a un meccanismo nel codice e a una prova che lo verifica. Dove un
meccanismo non c'è, è scritto.

Una premessa, perché il resto sia credibile. Spectra non è vivo e non è
cosciente, e non lo dice. La sua continuità però non è una recita: è fatta di
dati che restano, di una storia scritta che lui rilegge, e di lavoro che va
avanti quando nessuno gli parla. È questo che lo distingue da un chatbot, che a
ogni conversazione ricomincia da capo.

## 1. Le sei cose che fanno un'identità

| Che cosa | Come è fatto | Dove | Prova |
|---|---|---|---|
| **Un nucleo che non si negozia** | nome, valori, stile e la data di nascita (`nato`, scritta al primo avvio e mai più) stanno in una tabella protetta: la conversazione non può cambiarli, solo il proprietario dalle impostazioni | `memoria/se.py` | `test_memoria`: nucleo protetto, identità stabile fra gli avvii |
| **Una storia** | ogni modifica al modello di sé lascia in `se_storia` il valore di prima e il motivo; ogni notte scrive una pagina di diario (tipo `autobiografia`) | `se.py`, `cura.py` | `test_memoria`: storia delle modifiche, diario |
| **Una memoria che seleziona** | cinque tipi di ricordo; ciò che conta si rafforza a ogni richiamo, il resto sbiadisce con una curva di oblio | `memoria/` | `test_memoria` (24 prove) |
| **Il senso del tempo** | a ogni turno riceve il blocco `[CONTINUITÀ]`: quanto è passato dall'ultima volta, l'ultima cosa detta, che cosa ha fatto da solo nel frattempo | `presenza.py` (`continuita`, `blocco`) | `test_presenza`: primo incontro, ritorno dopo 14 ore, «nel frattempo» |
| **Un'attività propria** | il **battito** (ogni 30 secondi: c'è un promemoria giunto all'ora? un'iniziativa che vale l'interruzione?) e il **ciclo notturno** (consolida, riconcilia, dimentica, riflette, scrive il diario) | `servizio.py` (`avvia_battito`, `avvia_notturno`) | `test_presenza`: il battito pubblica il promemoria; `test_memoria`: ciclo notturno |
| **Una sola conversazione** | la sessione è una, «principale», su tutti i dispositivi; cambia solo la porta da cui lui parla | `cervello.py` (`turno(dispositivo=…)`), `presenza.py` | `test_presenza`, `test_client`: computer e telefono sulla stessa conversazione |

## 2. Che cosa succede in un turno

```
 lui parla (da qualunque dispositivo)
        │
        ▼
 presenza.tocca(dispositivo)          ← «è qui, da questa porta»
        │
        ▼
 recupero dei ricordi pertinenti (sei segnali)
        │
        ▼
 il messaggio che arriva al modello:
   storia recente della conversazione (la stessa per tutti i dispositivi)
   [CONTINUITÀ]  tempo passato · dispositivo di prima → di ora · filo · nel frattempo
   [IO]          chi è oggi: capacità misurate, limiti, ciò che sa di lui
   [OBIETTIVI]   ciò che dura più di una conversazione
   [AGENDA]      impegni, promemoria, scadenze
   [RICORDI]     ciò che la memoria ha portato a galla
   [ADESSO]      ora, canale, ciò che vede o sente
        │
        ▼
 il modello risponde, usando se serve gli strumenti (memoria, agenda, app)
        │
        ▼
 la risposta resta nella memoria di lavoro e parte un evento «turno»
 verso gli altri dispositivi collegati: la vedono, non la ripetono a voce
```

Il prompt di sistema (`spectra/prompt/sistema.md`) è la parte che non cambia
mai. I blocchi sono la parte che cambia. Il modello linguistico è sostituibile:
**Spectra non è il modello, è ciò che sta intorno**. Per questo cambiare
fornitore non lo fa diventare un altro.

## 3. Il tempo che passa

`Presenza.continuita()` calcola quattro fatti e `blocco()` li scrive:

- **quanto è passato.** Dieci minuti: prosegue. Più di quattro ore: è un
  «ritorno», e il blocco gli chiede di riprendere il filo in una frase prima di
  rispondere, senza salutare come la prima volta;
- **il filo**: l'ultima cosa che gli è stata detta;
- **da dove**: «Prima era su testo, ora è su occhiali: è la stessa
  conversazione, continua da lì»;
- **nel frattempo**: che cosa ha fatto da solo dopo l'ultima conversazione
  (quanti fatti ha consolidato, che cosa ha lasciato andare, le riflessioni
  della notte, la pagina di diario). È letto dal registro, non inventato: se
  non ha fatto nulla, la riga non c'è.

Il primo incontro è un caso a parte, e lo dice: «non hai ancora ricordi di lui».

## 4. La presenza su più dispositivi

```
   computer ─┐                                   ┌─ fornitore 1 (modello)
   Android  ─┤   HTTPS, rete privata, gettone    ├─ fornitore 2 (riserva)
   iPhone   ─┼──────────────►  SERVIZIO  ◄───────┤
   occhiali ─┘   (una macchina sempre accesa)    └─ memoria (un file SQLite)
   (dal telefono)
```

Un solo cervello, un solo file di memoria, tante porte.

- **Chi c'è.** Ogni dispositivo si fa vivo con un'attesa lunga su `/eventi`
  (`Presenza.tocca`). Chi non si fa sentire da 90 secondi è considerato spento.
- **Che cosa vede ognuno.** Ogni turno diventa un evento. Gli altri dispositivi
  lo ricevono entro un istante e lo mostrano; chi l'ha generato non lo riceve.
- **Chi parla.** Quando Spectra ha qualcosa da dire di sua iniziativa (un
  promemoria, una scadenza), l'evento porta `parla_su`: l'ultimo dispositivo
  **usato**, fra quelli collegati. Lo mostrano tutti, **lo dice uno solo**. Se
  nessuno è collegato, l'evento resta e arriva al primo che si ricollega.
- **Il passaggio di mano.** Non c'è nulla da fare: si smette di parlare al
  computer, si riprende dal telefono. Il modello riceve la stessa storia e la
  riga «prima era su…, ora è su…».

I client:

| Dispositivo | Come | Voce | Il nome «Spectra» |
|---|---|---|---|
| Computer | `client/index.html` nel browser (o installata come app) | sintesi del sistema, tono 0,58 e velocità 0,88 | «👂 Ascolto continuo», con la pagina aperta |
| Android | la stessa pagina in Chrome, aggiunta alla schermata Home | idem | idem; il riconoscimento di Chrome si riapre da solo e su alcuni telefoni fa un suono a ogni riapertura |
| iPhone | la stessa pagina in Safari, aggiunta alla schermata Home | idem | Safari consente l'ascolto solo con la pagina in primo piano e lo interrompe spesso: sull'iPhone è più affidabile il tasto 🎙 |
| Ray-Ban Meta | l'app ponte Android (`ponte/android/PonteOcchiali.kt`) | l'audio sintetizzato dal servizio, negli altoparlanti degli occhiali | «modalità Spectra»: vedi sotto |
| BioSpecInfo | `ponte/biospecinfo-strumenti.js`: l'app diventa un insieme di strumenti che Spectra usa | | |

**Limiti veri, da sapere prima.** Una pagina web non può ascoltare con lo
schermo spento o in tasca: lo impediscono Android e iOS, non questo codice. Per
una presenza «sempre in ascolto» sul telefono serve un'app nativa con un
servizio in primo piano (è ciò che fa il ponte degli occhiali). Il microfono nel
browser funziona solo su una pagina HTTPS o su `localhost`.

## 5. Gli occhiali e il nome

«Hey Meta» è riconosciuto dentro gli occhiali e resta dell'assistente di Meta:
un'app di terzi non può sostituirlo. Spectra risponde al suo nome così:

1. si accende la **modalità Spectra** (un tocco sulla stanghetta o il pulsante
   dell'app ponte);
2. l'app tiene aperto il microfono degli occhiali, che per Android è una cuffia
   Bluetooth, e cerca la parola «Spectra» **sul telefono**
   (`SentinellaDelNome`). Finché il nome non è detto, nulla lascia il telefono;
3. «Spectra, che cos'è questo?» → se la frase chiede di guardare, parte una
   foto; frase e foto vanno al servizio; la risposta torna come audio con la
   sua voce e suona negli altoparlanti degli occhiali;
4. mentre parla il microfono è sospeso, poi riprende ad ascoltare.

Il costo: batteria (il collegamento audio resta aperto) e musica in qualità da
telefonata finché la modalità è accesa. Con la modalità spenta, Spectra si
attiva con un tocco.

La regola che riconosce il nome è la stessa del client web
(`estraiComando`), dove è provata in un browser vero: accetta le grafie che il
riconoscimento produce (spettra, spectre, spektra…) e non scatta su
«spettrometria». Il ponte Android **non è stato compilato né provato**: qui non
ci sono né l'SDK di Meta né gli occhiali.

## 6. L'assistente personale

`memoria/agenda.py`: promemoria, compiti, eventi. Capisce «fra due ore»,
«domani alle 18», «venerdì alle 9:30», «il 12 febbraio alle 9» e le date ISO;
una data che non capisce **la rifiuta** e Spectra la chiede, non la indovina.
Ricorrenze (giorno, settimana, mese), anticipo dell'avviso, rinvio,
annullamento. I promemoria partono dal battito e arrivano anche se lui ha detto
«non ora», perché li ha chiesti lui.

Ciò che l'agenda **non** fa: non legge né scrive il calendario del telefono o
di Google, non manda messaggi, non telefona. Sono collegamenti da aggiungere
come strumenti, uno alla volta, ciascuno con la sua conferma.

## 7. Che cosa non è

- Non ha esperienze fra un turno e l'altro: fra un battito e il successivo non
  «pensa». Lavora quando il battito o la notte lo fanno lavorare.
- Non è stato ancora eseguito con un modello vero: tutte le prove usano un
  fornitore finto. Il primo turno vero è il primo passo della guida.
- La qualità di ciò che ricorda e riflette dipende dal modello che gli si dà.
