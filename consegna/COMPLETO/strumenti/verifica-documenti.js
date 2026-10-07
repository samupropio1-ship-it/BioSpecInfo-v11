#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════
   VERIFICA DELLA DOCUMENTAZIONE — BioSpecInfo
   ═══════════════════════════════════════════════════════════════════════

   Una documentazione che rimanda a file inesistenti, o che cita numeri di
   versione che nessuno ha piu' aggiornato, smette di essere documentazione e
   diventa un'affermazione non verificabile — il difetto che tutto il resto di
   questo lavoro cerca di evitare.

   Questo controllo verifica che:
     · ogni collegamento relativo punti a un file che esiste;
     · la versione citata nei documenti coincida con quella del codice;
     · i documenti dichiarati nell'indice esistano davvero, e viceversa;
     · gli strumenti citati siano presenti ed eseguibili.

   USO   node tools/verifica-documenti.js
   ═══════════════════════════════════════════════════════════════════════ */
'use strict';

const fs = require('fs');
const path = require('path');

const RADICE = path.resolve(__dirname, '..');
let ok = 0, ko = 0;

function att(desc, atteso, avuto){
  if (String(atteso) === String(avuto)) { ok++; console.log('  ✓ ' + desc); }
  else { ko++; console.log('  ✗ ' + desc + '\n      atteso: ' + atteso + '\n      avuto:  ' + avuto); }
}

function versioneCodice(){
  const m = fs.readFileSync(path.join(RADICE, 'sw.js'), 'utf8').match(/CACHE\s*=\s*'([^']+)'/);
  return m ? m[1] : null;
}

/* Raccoglie i documenti Markdown del progetto, escludendo le traduzioni e i
   generati (che si rigenerano, non si correggono a mano). */
function documenti(){
  const out = [];
  const guarda = (dir, prof) => {
    if (prof > 2) return;
    for (const f of fs.readdirSync(path.join(RADICE, dir), { withFileTypes: true })) {
      const rel = path.join(dir, f.name);
      if (f.isDirectory()) {
        /* `docs/en` ENTRA: era escluso, e per questo la traduzione inglese
           ha potuto restare ferma alla versione bsi-v146 per tre rilasci
           senza che nessun banco se ne accorgesse. Restano fuori solo le
           cartelle che non contengono prosa da controllare. */
        if (/node_modules|\.git|^docs\/(pdf|candidatura)$/.test(rel)) continue;
        guarda(rel, prof + 1);
      } else if (f.name.endsWith('.md')) out.push(rel);
    }
  };
  out.push('README.md', 'DOCUMENTATION.md', 'CHANGELOG.md');
  guarda('docs', 0);
  guarda('proxy', 0);
  return out.filter((v, i, a) => a.indexOf(v) === i)
            .filter(f => fs.existsSync(path.join(RADICE, f)));
}

console.log('Verifica della documentazione\n');

const ver = versioneCodice();
console.log('Versione del codice (sw.js): ' + ver + '\n');

/* ── 1. i collegamenti relativi puntano a file esistenti ── */
console.log('── Collegamenti interni ──');
const rotti = [];
documenti().forEach(function(doc){
  /* I blocchi di codice vanno via PRIMA di cercare collegamenti: lo SMILES
     dell'alanina, `C[C@@H](N)C(=O)O`, ha la forma esatta di un collegamento
     Markdown verso un file chiamato «N», e il controllo segnalava un
     collegamento rotto che non esiste. Dentro un blocco di codice non ci sono
     collegamenti per definizione. */
  const testo = fs.readFileSync(path.join(RADICE, doc), 'utf8')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`\n]*`/g, '');
  const dir = path.dirname(path.join(RADICE, doc));
  const re = /\[[^\]]*\]\(([^)#\s]+)(?:#[^)]*)?\)/g;
  let m;
  while ((m = re.exec(testo)) !== null) {
    const dest = m[1];
    if (/^(https?:|mailto:|#)/.test(dest)) continue;
    const p = path.resolve(dir, decodeURI(dest));
    if (!fs.existsSync(p)) rotti.push(doc + ' → ' + dest);
  }
});
att('nessun collegamento interno rotto', 0, rotti.length);
rotti.slice(0, 12).forEach(r => console.log('      ! ' + r));

/* ── 2. la versione citata coincide con quella del codice ── */
/* ── Le formule che collocano un fatto NEL PASSATO ────────────────────────
   «Fino alla versione bsi-v168 il banco guardava una sezione su 87» DEVE
   nominare una versione vecchia: e' il suo contenuto. «La password e' stata
   cambiata alla versione bsi-v188» pure.

   L'elenco sta qui, in un posto solo, perche' lo usano due controlli con
   intenzioni opposte — vedi il commento accanto a `reStoria`. */
const FORMULE_STORICHE =
  'fino alla versione|fino a|antecedente(?:mente)? alla versione|' +
  'prima della versione|alla versione|dalla versione|nella versione|' +
  'aggiunt[eoia] in|rimast[oa] a(?:lla versione)?|ferm[oa] a(?:lla versione)?|' +
  '(?:\u00e8|e\') stat[oa] (?:fatto|fatta|cambiat[oa]|spostat[oa])[^.\\n]{0,60}versione|' +
  'cambiat[ao]\\*{0,2} alla versione|a quello della|' +
  'up to version|stuck at(?: version)?|left at(?: version)?|since version|' +
  'in version|at version|added in|introduced in|' +
  'was \\*{0,2}(?:changed|done|moved|added)\\*{0,2}[^.\\n]{0,60}(?:at |in |to the )version|' +
  'has been \\*{0,2}done\\*{0,2}[^.\\n]{0,60}at version|' +
  'to the';

/* e una versione fra parentesi in fondo a un titolo marca la sezione con la
   versione in cui quel fatto e' accaduto: «... scritta nel dato (bsi-v188)» */
const RE_TITOLO_DATATO = /^#{1,6} .*\((bsi-v\d+)\)\s*$/;

console.log('\n── Versione dichiarata nei documenti ──');
const disallineati = [];
documenti().forEach(function(doc){
  const testo = fs.readFileSync(path.join(RADICE, doc), 'utf8');
  const versioni = [...new Set((testo.match(/bsi-v\d+/g) || []))];
  // Il changelog cita di proposito tutte le versioni passate.
  /* I documenti GENERATI sono fotografie di un'esecuzione: dichiarano la
     versione a cui sono stati prodotti, ed e' corretto che sia cosi'. In piu'
     il rapporto di verifica viene scritto DOPO i controlli, quindi durante la
     batteria conterrebbe sempre la versione precedente: controllarlo li'
     sarebbe circolare, e faceva fallire la verifica a ogni cambio di
     versione. Che il rapporto sia aggiornato si vede dal commit che dichiara,
     non dal numero di versione. */
  if (/CHANGELOG|RAPPORTO-VERIFICA|07-SBOM/.test(doc)) return;

  /* ── Un riferimento al passato non e' una versione dimenticata ──
     «Fino alla versione bsi-v168 il banco guardava una sezione su 87»
     e' una frase che DEVE nominare una versione vecchia: e' il suo
     contenuto. Trattarla come una dimenticanza obbligherebbe a
     riscrivere la storia a ogni rilascio — cioe' a cancellarla, che e'
     esattamente il contrario di quello che questi documenti servono a
     fare.
     L'esenzione e' stretta: vale solo per la versione nominata DENTRO
     una formula che la colloca esplicitamente nel passato. Un
     «Versione descritta: bsi-v167» rimasto indietro continua a
     fallire. */
  const storiche = new Set();
  /* «rimasto a bsi-v146» colloca la versione nel passato tanto quanto
     «fino alla versione bsi-v146»: e' la stessa frase con il verbo
     dall'altra parte. Resta stretta — un'intestazione «Versione
     descritta: bsi-v167» rimasta indietro non contiene nessuno di
     questi verbi e continua a fallire. */
  /* ── UNA SOLA definizione di «frase storica» ─────────────────────────
     Serve a DUE controlli che guardano in versi opposti:

       · qui sotto, per ESENTARE una versione vecchia nominata dentro una
         frase che parla del passato — riscriverla la renderebbe falsa;
       · piu' avanti (§2-bis), per BOCCIARE una di queste stesse frasi che
         nomini la versione CORRENTE, perche' quella e' la firma di una
         sostituzione cieca che ha riscritto la storia.

     Tenerne due elenchi diversi li fa divergere, e divergendo i due
     controlli si contraddicono: uno pretende che la frase nomini una
     versione vecchia, l'altro la segnala come dimenticata. E' successo, e
     la correzione e' questa riga sola. */
  const reStoria = new RegExp('(?:' + FORMULE_STORICHE + ')\\s+>?\\s*`?(bsi-v\\d+)`?', 'gi');
  /* `>?` perche' dentro una citazione Markdown la frase va a capo con un
     `> ` davanti: «Up to version\n> `bsi-v168`». Senza, l'esenzione
     dipendeva da dove cadeva l'a capo. */
  let ms;
  while ((ms = reStoria.exec(testo)) !== null) storiche.add(ms[1]);
  testo.split(/\r?\n/).forEach(function (riga) {
    const t = riga.match(RE_TITOLO_DATATO);
    if (t) storiche.add(t[1]);
  });

  /* ── E una versione nominata dentro una RIGA DI DIFFORMITA' ────────────
     Le righe che cominciano con `| **D-nn**` sono il registro delle
     difformita' dichiarate: una versione che compare lì e' il SOGGETTO
     della difformita', non una dichiarazione rimasta indietro. La D-10
     dice che il tag `bsi-v181` punta al commit sbagliato: e' una frase che
     DEVE nominare quella versione.

     L'esenzione e' POSIZIONALE, non per documento. Il primo tentativo
     aggiungeva la versione a `storiche`, cioe' la esentava in TUTTO il
     documento: da quel momento un `bsi-v181` rimasto indietro altrove in
     `docs/09` sarebbe passato in silenzio. Provando la guardia opposta non
     scattava — e non scattava perche' l'esenzione era troppo larga, non
     perche' il caso fosse coperto. Qui le righe di difformita' vengono
     TOLTE dal testo prima di cercarci le versioni: fuori da quelle righe
     ogni versione superata continua a fallire. */
  const senzaDifformita = testo.split(/\r?\n/)
    .filter(function (riga) { return !/^\s*\|\s*\*\*D-\d+\*\*/.test(riga); })
    .join('\n');
  const versioniFuori = [...new Set((senzaDifformita.match(/bsi-v\d+/g) || []))];

  const altre = versioniFuori.filter(v => v !== ver && !storiche.has(v));
  if (altre.length) disallineati.push(doc + ' cita ' + altre.join(', '));
});
att('nessun documento cita una versione superata', 0, disallineati.length);
disallineati.forEach(d => console.log('      ! ' + d));

/* ── 2-bis · Nessun fatto PASSATO attribuito alla versione CORRENTE ───────
   Il controllo qui sopra guarda il verso sbagliato. Trova una versione
   rimasta indietro; non trova una frase storica a cui qualcuno ha cambiato
   la versione SOTTO, lasciando intatto il resto.

   È successo per tre rilasci di fila, con una sostituzione cieca
   `bsi-vNNN` → `bsi-vNNN+1` su tutti i documenti. Il risultato stava dentro
   una dichiarazione di conformità firmata:

     «La password è stata **cambiata** alla versione bsi-v191»  — era la v188
     «ha spostato quel tag al commit della bsi-v191»            — era la v188
     «Le trentasei voci aggiunte in bsi-v191»                   — erano la v188

   Nessun controllo poteva accorgersene: ogni riga citava una versione che
   ESISTE, nel documento che descrive quella versione. Erano tutte false, e
   due di quelle frasi raccontavano un incidente di sicurezza.

   La firma del guasto è precisa: una formula che colloca il fatto NEL
   PASSATO che nomina la versione CORRENTE. Un documento che descrive la
   versione N non ha motivo di dire «fatto alla versione N»: o il fatto è di
   prima, e allora la versione è un'altra, oppure è di adesso, e allora lo
   dice il CHANGELOG. Scriverlo nominando la cosa invece del numero — «dalle
   tabelle di Pretsch», non «dalla bsi-v189» — è anche più leggibile, e non
   invecchia. */
console.log('\n── Fatti passati attribuiti alla versione corrente ──');
const retrodatati = [];
const rePassato = new RegExp(
  '(?:' + FORMULE_STORICHE + ')\\s+>?\\s*`?' + ver.replace('-', '\\-') + '`?', 'gi');

/* Una riga che DICHIARA la versione del documento non è un fatto passato:
   «Documento aggiornato alla versione N», «stato alla versione N», «Il
   sottoscritto dichiara che la versione N». Sono esattamente le righe che
   `tools/porta-versione.js` ha il compito di aggiornare, e devono nominare
   la versione corrente. Senza questa esenzione il controllo bocciava il
   piede di ogni documento — e un controllo che grida sempre si spegne. */
const reDichiarazione = new RegExp(
  'aggiornat[oa] alla versione|aggiornata alla versione|' +
  'updated to version|prodotto alla versione|produced at version|' +
  'stato alla versione|state at version|' +
  'dichiara che la versione|declares that version|' +
  '^\\s*_?Versione\\s+`|^\\s*_?Version\\s+`', 'i');
documenti().forEach(function (doc) {
  if (/CHANGELOG|RAPPORTO-VERIFICA/.test(doc)) return;
  const righe = fs.readFileSync(path.join(RADICE, doc), 'utf8').split(/\r?\n/);
  righe.forEach(function (riga, i) {
    rePassato.lastIndex = 0;
    if (reDichiarazione.test(riga)) return;
    const td = riga.match(RE_TITOLO_DATATO);
    if (rePassato.test(riga) || (td && td[1] === ver)) {
      retrodatati.push(doc + ':' + (i + 1) + '  ' + riga.trim().slice(0, 120));
    }
  });
});
att('nessuna frase al passato nomina la versione corrente', 0, retrodatati.length);
retrodatati.forEach(r => console.log('      ! ' + r));

/* ── 2-ter · Nessun esempio che mostra una cosa uguale a se stessa ────────
   La stessa sostituzione cieca aveva ridotto l'esempio del README del proxy
   a «incrementa CACHE (es. bsi-v188 → bsi-v188)»: un'istruzione che mostra
   il prima identico al dopo. È rimasta così per almeno tre versioni. */
const degeneri = [];
documenti().forEach(function (doc) {
  const righe = fs.readFileSync(path.join(RADICE, doc), 'utf8').split(/\r?\n/);
  righe.forEach(function (riga, i) {
    const m = riga.match(/`?(bsi-v\d+)`?\s*(?:→|->|a)\s*`?(bsi-v\d+)`?/);
    if (m && m[1] === m[2]) {
      degeneri.push(doc + ':' + (i + 1) + '  ' + riga.trim().slice(0, 120));
    }
  });
});
att('nessun esempio di aggiornamento mostra la stessa versione due volte',
    0, degeneri.length);
degeneri.forEach(r => console.log('      ! ' + r));

/* ── 3. index.html dichiara la stessa versione di sw.js ── */
console.log('\n── Le due righe della versione ──');
const idx = fs.readFileSync(path.join(RADICE, 'index.html'), 'utf8')
  .match(/BSI_APP_VERSION\s*=\s*'([^']+)'/);
att('BSI_APP_VERSION coincide con CACHE', ver, idx ? idx[1] : '(non trovata)');

/* ── 4. gli strumenti citati esistono ── */
console.log('\n── Strumenti citati ──');
['tools/genera-evidenza.js', 'tools/genera-sbom.js', 'tools/verifica-farmaci.js',
 'docs/evidence/deviazioni-note.json', 'docs/evidence/sbom.cdx.json',
 'docs/evidence/RAPPORTO-VERIFICA.md'].forEach(function(f){
  att('esiste ' + f, true, fs.existsSync(path.join(RADICE, f)));
});

/* ── 5. l'indice elenca tutti i documenti numerati, e solo quelli ── */
console.log('\n── Coerenza dell\'indice ──');
const indice = fs.readFileSync(path.join(RADICE, 'DOCUMENTATION.md'), 'utf8');
const suDisco = fs.readdirSync(path.join(RADICE, 'docs'))
  .filter(f => /^\d\d-.*\.md$/.test(f)).sort();
const nonIndicizzati = suDisco.filter(f => indice.indexOf(f) < 0);
att('ogni documento numerato è nell\'indice', 0, nonIndicizzati.length);
nonIndicizzati.forEach(f => console.log('      ! ' + f + ' non compare in DOCUMENTATION.md'));
console.log('      (' + suDisco.length + ' documenti numerati)');

/* ── 6. il registro delle deviazioni e' leggibile e motivato ── */
console.log('\n── Registro delle deviazioni ──');
try {
  const reg = JSON.parse(fs.readFileSync(
    path.join(RADICE, 'docs', 'evidence', 'deviazioni-note.json'), 'utf8'));
  let senzaMotivo = 0, totali = 0;
  ['farmaci_senza_struttura', 'farmaci_biologici'].forEach(function(k){
    (reg[k] && reg[k].voci ? reg[k].voci : []).forEach(function(v){
      totali++;
      if (!v.motivo || v.motivo.length < 10) senzaMotivo++;
    });
  });
  att('ogni deviazione porta un motivo scritto', 0, senzaMotivo);
  console.log('      (' + totali + ' deviazioni registrate)');
} catch (e) {
  ko++; console.log('  ✗ registro non leggibile: ' + e.message);
}

/* ── 7. la matrice di tracciabilita' non si contraddice ──
   Un identificativo di requisito e' una promessa: «questa cosa specifica e'
   verificata da questo banco specifico». Se lo stesso identificativo compare
   due volte, una delle due promesse e' falsa e non si sa quale. Ed e'
   successo davvero: SCI-10 era insieme un requisito verificato al 100 % (la
   simmetria molecolare) e un requisito dichiarato NON verificato (sei
   strutture di farmaci). La tabella riassuntiva, intanto, sommava 36
   requisiti su 37 realmente definiti, perche' contava 9 requisiti
   scientifici quando ne erano stati scritti 10.

   Un errore di conteggio in una tabella di copertura non e' un dettaglio
   formale: e' la cifra che un valutatore legge per prima. */
console.log('\n── Matrice di tracciabilità ──');
try {
  const mat = fs.readFileSync(
    path.join(RADICE, 'docs', '08-Traceability-Matrix.md'), 'utf8');

  /* Gli identificativi definiti sono quelli in grassetto nella prima cella
     di una riga di tabella: `| **SCI-01** | ...`. Citarne uno nel testo non
     lo definisce. */
  const definiti = [];
  const re = /^\|\s*\*\*([A-Z]{2,4}-\d{2})\*\*\s*\|/gm;
  let m;
  while ((m = re.exec(mat)) !== null) definiti.push(m[1]);

  const doppioni = definiti.filter((v, i) => definiti.indexOf(v) !== i);
  att('nessun identificativo di requisito definito due volte', 0,
      [...new Set(doppioni)].length);
  [...new Set(doppioni)].forEach(d => console.log('      ! ' + d + ' definito più volte'));

  /* ── Le due lingue devono definire GLI STESSI requisiti ──────────────────
     Il documento 09 dichiara, alla voce D-08, che «un disaccordo fra le due
     lingue fa fallire la batteria». Era un'intenzione, non una prova: nessun
     controllo confrontava i due documenti, e la matrice inglese e' rimasta
     indietro di TRE requisiti (SCI-28, SCI-29, SCI-30) senza che niente lo
     dicesse. Chi legge solo l'inglese non trovava la predizione NMR, la
     equivalenza chimica e il lettore d'immagini — proprio le cose piu'
     recenti.

     Qui la frase diventa vera: i due documenti devono definire lo stesso
     insieme di identificativi, e la differenza viene stampata in chiaro nei
     due versi — chi manca all'inglese e chi manca all'italiano. */
  try {
    const matEn = fs.readFileSync(
      path.join(RADICE, 'docs', 'en', '08-Traceability-Matrix.md'), 'utf8');
    const definitiEn = [];
    const reEn = /^\|\s*\*\*([A-Z]{2,4}-\d{2})\*\*\s*\|/gm;
    let mEn;
    while ((mEn = reEn.exec(matEn)) !== null) definitiEn.push(mEn[1]);
    const soloIt = definiti.filter(d => definitiEn.indexOf(d) < 0);
    const soloEn = definitiEn.filter(d => definiti.indexOf(d) < 0);
    att('le due lingue definiscono gli stessi requisiti', 0,
        soloIt.length + soloEn.length);
    soloIt.forEach(d => console.log('      ! ' + d + ' manca nella matrice inglese'));
    soloEn.forEach(d => console.log('      ! ' + d + ' manca nella matrice italiana'));
    console.log('      (' + definiti.length + ' in italiano, ' +
                definitiEn.length + ' in inglese)');
  } catch (e) {
    att('la matrice inglese è leggibile', true, false);
  }

  /* Il conteggio dichiarato nella tabella riassuntiva deve corrispondere a
     quanti identificativi esistono davvero nel documento. */
  const perFamiglia = {};
  definiti.forEach(function(d){
    const f = d.split('-')[0];
    perFamiglia[f] = (perFamiglia[f] || 0) + 1;
  });

  /* Le famiglie automatizzate sono quelle elencate nella tabella di §7, che
     le nomina esplicitamente: `| Scientifici (SCI-01…10) | 10 | 10 | ...` */
  let sommaDichiarata = 0, sommaReale = 0, disallineate = 0;
  const rTab = /^\|\s*[^|]*\(([A-Z]{2,4})-\d{2}…\d{2}\)\s*\|\s*(\d+)\s*\|\s*(\d+)\s*\|/gm;
  let r, famiglieLette = 0;
  while ((r = rTab.exec(mat)) !== null) {
    famiglieLette++;
    const fam = r[1], dichiarati = +r[2];
    /* i requisiti non automatizzati stanno in §6 e non appartengono al conteggio
       per famiglia: si contano gli identificativi della famiglia meno quelli
       elencati fra i non automatizzati */
    const nonAuto = (mat.split('## 6.')[1] || '').split('## 7.')[0] || '';
    const esclusi = (nonAuto.match(new RegExp('\\*\\*' + fam + '-\\d{2}\\*\\*', 'g')) || []).length;
    const reali = (perFamiglia[fam] || 0) - esclusi;
    sommaDichiarata += dichiarati;
    sommaReale += reali;
    if (dichiarati !== reali) {
      disallineate++;
      console.log('      ! ' + fam + ': la tabella dichiara ' + dichiarati +
                  ', nel documento ce ne sono ' + reali);
    }
  }

  /* Un controllo che non legge nessuna riga passerebbe comunque. */
  att('la tabella di copertura è stata letta', true, famiglieLette >= 5);
  att('ogni famiglia dichiara il numero di requisiti che ha davvero', 0, disallineate);

  const tot = mat.match(/\|\s*\*\*Totale automatizzato\*\*\s*\|\s*\*\*(\d+)\*\*/);
  att('il totale automatizzato coincide con la somma delle famiglie',
      sommaDichiarata, tot ? +tot[1] : '(assente)');
  console.log('      (' + definiti.length + ' identificativi definiti, ' +
              sommaReale + ' automatizzati)');
} catch (e) {
  ko++; console.log('  ✗ matrice non leggibile: ' + e.message);
}

console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
process.exit(ko ? 1 : 0);
