# Documentazione dei test — BioSpecInfo

| Campo | Valore |
|-------|--------|
| **Software** | BioSpecInfo |
| **Versione descritta** | `bsi-v165` |
| **Scopo** | Descrivere come sono organizzati i test, come eseguirli, che cosa coprono e dove restano scoperti. |

---

## 1. Tipologie presenti

| Tipo | Presente | Note |
|---|:---:|---|
| **End-to-end (E2E)** | ✅ | Playwright su Chromium headless contro un server HTTP locale. È la forma prevalente. |
| **Verifica dei dati** | ✅ | Confronto dei dati scientifici con una fonte indipendente |
| **Prove di stabilità** | ✅ | Sessioni lunghe, memoria esaurita, rete degradata |
| **Coerenza documentazione/codice** | ✅ | Verifica che ciò che la documentazione promette esista davvero |
| **Unit test isolati** | ❌ | Vedi §6 |
| **Copertura di codice strumentata** | ❌ | Vedi §6 |

### Perché E2E e non unit test

L'applicazione è composta da script classici che operano direttamente sul DOM,
senza moduli né iniezione delle dipendenze: non esistono unità isolabili senza
una riscrittura profonda. I difetti che si sono effettivamente verificati —
un canvas sfocato, un pulsante irraggiungibile perché il contenitore è nascosto,
un fornitore AI che smette di rispondere — **non sarebbero comunque emersi** da
un test unitario: vivono nell'integrazione fra codice, DOM e browser.

La scelta è quindi motivata, non subita. Ne restano i limiti, dichiarati al §6.

---

## 2. Come eseguire i test

### Requisiti

```bash
npm install                      # solo playwright-core
python3 -m http.server 8899 &    # RDKit WASM richiede contesto HTTP
```

> Senza server i test falliscono tutti: aprire i file con `file://` impedisce il
> caricamento dei moduli WebAssembly.

### Tutta la batteria, con rapporto

```bash
node tools/genera-evidenza.js
```

Esegue ogni banco, ne trascrive l'uscita integrale e produce
`docs/evidence/RAPPORTO-VERIFICA.md` con ambiente, commit e impronte SHA-256.
Esce con codice `0` solo se nessun banco fallisce.

```bash
node tools/genera-evidenza.js --veloce   # salta i banchi con browser
```

L'opzione `--veloce` è utile per un controllo rapido ma **non è sufficiente per
un'attestazione**: i banchi saltati sono proprio quelli che misurano il
comportamento reale.

### Un singolo banco

```bash
node tools/verifica-farmaci.js           # incluso nel repository
node tools/verifica-farmaci.js --json    # uscita leggibile da programma

node <cartella-banchi>/test_spettri.js   # banchi E2E
```

La cartella dei banchi E2E si indica con la variabile `BSI_BANCHI`.

---

## 3. Composizione della batteria

**34 banchi**, raggruppati per ciò che dimostrano.

### 3.1 Dati scientifici

| Banco | Verifica | Controlli |
|---|---|---:|
| `verifica-farmaci` | Struttura ⟷ peso molecolare, duplicati, deviazioni registrate | 178 voci |
| `test_spettri` | Riconoscimento dei gruppi funzionali su molecole di riferimento | 36 |
| `test_spettri_ui` | Innesto del motore nei punti dell'app che disegnano spettri | 16 |
| `test_assi` | Convenzioni degli assi negli spettri SVG | 13 |
| `test_assi_canvas` | Convenzioni degli assi negli spettri su canvas | 6 |
| `test_costanti` | Ricerca delle costanti fisiche e rifiuto delle ambiguità | 45 |
| `audit_dati` | Coerenza dei dati tabulati | 29 |

### 3.2 Agente AI

| Banco | Condizione simulata |
|---|---|
| `test_404` | Il fornitore ha ritirato il modello |
| `test_503` | Sovraccarico temporaneo |
| `test_ko` · `browser_ko` | Fornitore irraggiungibile dal browser |
| `test_firma` | Firme di ragionamento opache da restituire |
| `test_tetto` | Tetto di token appreso dall'errore |
| `test_attesa` · `test_attesalunga` | Timeout e attese imposte |
| `test_doppioinvio` | Due invii sovrapposti |
| `browser_prova` | Misura di raggiungibilità senza chiave |
| `test_nucleo` · `browser_prov` | Ciclo agentico e selezione del fornitore |

### 3.3 Stabilità

| Banco | Cosa mette alla prova |
|---|---|
| `audit_stabilita` | 84 sezioni aperte 5 volte, memoria piena, dati corrotti, raffiche di clic |
| `audit_promesse` | Promesse rifiutate e non gestite, con rete sana e con rete morta |
| `audit_quota` | `localStorage.setItem` forzato a fallire su 10 pagine |
| `test_sw` | Offline, rete degradata, aggiornamento durante il lavoro |
| `test_filemanager` | Archivio non disponibile, spazio esaurito, scritture fallite |
| `test_visore3d` | Consumo di contesti WebGL sfogliando molecole |

### 3.4 Interfaccia

`browser_reset` · `browser_proxy` · `browser_proxyui` · `browser_rdkit` ·
`browser_lab` · `browser_frontiera` · `test_aggiorna` · `test_guidaproxy`

### 3.5 Coerenza

| Banco | Verifica |
|---|---|
| `verifica_guida` | Che le promesse della documentazione esistano nel codice; assenza di marcatori di conflitto su 58 file |

---

## 4. Casi di prova notevoli

Alcuni banchi meritano una menzione perché verificano proprietà che un test
funzionale non osserva.

| Caso | Metodo | Risultato misurato |
|---|---|---|
| **Perdite di memoria** | 84 sezioni × 5 giri, nodi DOM contati a ogni giro | +26 876 al primo giro (costruzione), **+0** nei quattro successivi |
| **Memoria esaurita** | `setItem` sostituito con una funzione che lancia sempre | 10 pagine su 10 restano operative |
| **Rete degradata ≠ assente** | Richieste sospese 20 s, intercettazione a livello di contesto | Risposta dalla cache in **3 507 ms** (soglia 3 500) |
| **Riproducibilità degli spettri** | Doppio disegno, confronto byte a byte | Identici |
| **Contesti WebGL** | Costruzioni del visore su 10 molecole consecutive | Da **7 a 1** |
| **Cronologia corrotta** | Due `Invio` a 500 ms di distanza | `user,assistant` anziché `user,user,assistant,assistant` |

---

## 5. Come aggiungere un banco

### Struttura minima

```javascript
/* Un commento che spiega COSA dimostra questo banco e perché serve. */
const { chromium } = require('playwright-core');
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  // serviceWorkers:'block' se il banco modifica i file: senza, il SW
  // potrebbe servire una copia in cache e si misurerebbe il file vecchio
  const ctx = await b.newContext({ serviceWorkers: 'block' });
  const pg = await ctx.newPage();
  const err = [];
  pg.on('pageerror', e => err.push(e.message));

  let ok = 0, ko = 0;
  const att = (d, atteso, avuto) => {
    if (String(atteso) === String(avuto)) { ok++; console.log('  ✓ ' + d + '  → ' + avuto); }
    else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + '\n      avuto:  ' + avuto); }
  };

  await pg.goto('http://127.0.0.1:8899/index.html', { waitUntil: 'load', timeout: 60000 });
  await pg.waitForTimeout(2500);

  // … misure …

  att('nessun errore JS', 0, err.length);
  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' passati');
  process.exit(ko ? 1 : 0);   // il codice di uscita è ciò che conta
})();
```

Poi si aggiunge il nome alla famiglia opportuna in `tools/genera-evidenza.js`.

### La regola che conta

> **Un banco che non misura nulla passa.** È il modo più insidioso di ottenere
> una falsa garanzia: nessun allarme, nessun fallimento, e nessuna verifica.

Perciò **ogni banco che simula una condizione deve contare quante volte la
simulazione è realmente scattata, e fallire se il conteggio è zero.**

Casi realmente incontrati durante lo sviluppo della batteria:

| Trappola | Come si manifestava |
|---|---|
| `page.route` non intercetta le richieste del Service Worker (serve `context.route`) | La prova «rete degradata» misurava una rete sana e concludeva in 16 ms invece di 3 500 |
| Sondare `localStorage` esaurito con una scrittura di un byte | Dopo la saturazione un byte trova sempre posto: il banco «passava» |
| Cercare `[data-tab]` dove la navigazione usa `[data-s]` | Zero schede trovate, quindi zero misure — e zero fallimenti |
| Le tacche di un asse su `<canvas>` non sono testo | Vanno raccolte intercettando `fillText`; e la riga più in basso è il *titolo* dell'asse, non le tacche |
| Sonda installata su una libreria caricata **dopo** | Viene sostituita insieme alla libreria: zero chiamate contate mentre il codice funzionava |
| Una `var` dentro una IIFE non è `window.qualcosa` | Assegnarla da fuori crea una variabile diversa |

---

## 6. Lacune di copertura

Dichiarate. La copertura riportata in
[`08-Traceability-Matrix.md`](08-Traceability-Matrix.md) misura **quanti
requisiti hanno un banco**, non quante righe di codice vengono eseguite: sono
due cose diverse e non vanno confuse.

| Lacuna | Situazione attuale | Raccomandazione |
|---|---|---|
| **Copertura di codice** | Non strumentata: non si sa quali rami non vengano mai eseguiti | Introdurre `c8` o la copertura di Playwright, anche solo per misurare il punto di partenza |
| **Accessibilità** | Verificata a campione | Automatizzare con `axe-core` su tutte le sezioni |
| **Sicurezza** | 2 requisiti su 4 coperti da banco; gli altri per ispezione | Banco dedicato all'assenza di chiavi nei file versionati |
| **Browser diversi da Chromium** | Nessuna prova automatica su Firefox o WebKit | Estendere i banchi principali a `webkit`, dove le differenze su IndexedDB e Service Worker sono maggiori |
| **Prestazioni** | Prove manuali cross-device | Misura automatica del tempo di primo disegno |
| **Regressione visiva** | Assente | Confronto di schermate per i grafici, che sono il cuore del prodotto |

---

## 7. Criteri di accettazione

Una versione non viene pubblicata se uno solo di questi non è soddisfatto.

- [ ] `node tools/genera-evidenza.js` si chiude con **0 falliti**
- [ ] `tools/verifica-farmaci.js`: nessun difetto, ogni deviazione registrata con il motivo
- [ ] `verifica_guida`: nessuna promessa della documentazione priva di riscontro
- [ ] Nessun errore JavaScript non di rete su tutte le pagine
- [ ] Rapporto di evidenza rigenerato sul commit che si pubblica

---

_Documento aggiornato alla versione `bsi-v165`._
