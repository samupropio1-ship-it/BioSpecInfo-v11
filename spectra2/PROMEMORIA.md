# Promemoria per riprendere il lavoro su Spectra

Da incollare (o far leggere) all'inizio di una nuova conversazione. Dice dove
siamo, che cosa è deciso, che cosa manca.

## Che cos'è

Spectra è l'intelligenza artificiale personale di Samuele Pio Provenzano:
esperto di chimica e assistente di ogni giorno, con memoria persistente, una
sola conversazione su tutti i dispositivi, voce maschile fredda e robotica.
Il codice è nella cartella `spectra2/` del repository BioSpecInfo.

## Che cosa è deciso (non ridiscutere)

- Un **servizio** sempre acceso (Python 3.11, solo libreria standard) con un
  file SQLite di memoria; computer, telefono, occhiali e l'app BioSpecInfo sono
  client. Il modello linguistico è sostituibile (più fornitori, con riserva).
- Tutti i nomi nel codice e i testi sono in **italiano**.
- Le chiavi e il gettone stanno in variabili d'ambiente, **mai** nel repository.
- Voce: tono 0,58, velocità 0,88; sul server Piper + FFmpeg.
- Spectra **non dichiara** di essere vivo o cosciente; la continuità è fatta di
  meccanismi verificabili (vedi `IDENTITA.md`).
- Ogni cosa consegnata dice che cosa è provato e che cosa no.
- Sugli occhiali «Hey Meta» resta di Meta; Spectra risponde al suo nome con
  l'ascolto sul telefono («modalità Spectra»).

## Dove siamo

| Parte | Stato |
|---|---|
| Memoria (5 tipi, recupero, oblio, cura notturna, modello di sé, obiettivi, lacune) | fatta, provata |
| Agenda (promemoria, compiti, eventi, date in italiano, ricorrenze) | fatta, provata |
| Continuità (`[CONTINUITÀ]`, battito, una sessione su più dispositivi) | fatta, provata |
| Servizio HTTP (turno, eventi, agenda, relè degli strumenti, client statico) | fatto, provato dal vivo in locale |
| Client web (`client/index.html`: computer, Android, iPhone; nome «Spectra») | fatto, provato in Chromium con voce e microfono finti |
| Ponte BioSpecInfo (`ponte/biospecinfo-strumenti.js`) | fatto, provato in Node; **non ancora inserito nell'app** |
| Ponte occhiali (`ponte/android/PonteOcchiali.kt`) | scritto, **mai compilato**; `OcchialiMeta` ha tre punti da completare |
| Un turno con un modello vero | **mai fatto** (nessuna chiave nell'ambiente di sviluppo) |
| **La via senza installazione** (BioSpecInfo v251, `bsi-spectra-agenda.js`): agenda, promemoria, continuità e memoria esportabile dentro l'app | fatta, provata (`test_agenda`, 59 controlli). È la via che Samuele usa: il servizio qui sopra resta per quando ci sarà una macchina sempre accesa |

Prove: 60, con `python3 -m unittest discover -s prove` dalla cartella `spectra2/`.

## Una cosa da sapere prima

Samuele non riesce a seguire i passi di installazione del servizio. Non
riproporglieli: ciò che serve va fatto dentro l'app BioSpecInfo, che apre già
dal telefono. I passi qui sotto valgono solo se e quando ci sarà qualcuno che
può accendere il servizio su un computer.

## I prossimi passi, in ordine

1. **Accendere il servizio** su una macchina di Samuele e fare il primo turno
   vero (`GUIDA.md`, passi 1–5). Annotare ciò che non va.
2. **Aprire il client** da telefono e computer, sulla rete privata (passi 6–8).
3. **La voce sul server** con Piper; tarare il timbro a orecchio (passo 9).
4. **Inserire il ponte in BioSpecInfo**: casella «Spectra 2.0» nelle
   impostazioni, la chat dell'app che usa `/turno` quando è configurato.
5. **Gli occhiali**: progetto Android, prima con `OcchialiFinti`, poi con il
   Mock Device Kit di Meta, poi con gli occhiali; completare `OcchialiMeta` sul
   riferimento della versione del toolkit installata.
6. Collegamenti dell'assistente: calendario, posta, note. Uno alla volta.
7. Incorporatore neurale locale per la ricerca per significato.

## Che cosa serve da Samuele

- Quale macchina resta accesa (un PC, un mini-PC, un Raspberry Pi).
- Almeno una chiave di un fornitore di modelli.
- Per gli occhiali: l'accesso al Wearables Device Access Toolkit di Meta e un
  computer con Android Studio.

## Come chiedere di continuare

> Continua il lavoro su Spectra dal file `spectra2/PROMEMORIA.md`. Siamo al
> passo N. Ecco che cosa è successo quando ho provato: …
