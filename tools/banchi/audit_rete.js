#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════
   NESSUN DATO DELL'UTENTE LASCIA IL DISPOSITIVO — BioSpecInfo
   ═══════════════════════════════════════════════════════════════════════

   SEC-02 dice «nessun dato personale deve lasciare il dispositivo senza
   un'azione esplicita». Fino alla versione bsi-v171 era verificato per
   INTERPOSTA PROPRIETA': il banco di sicurezza controllava che la
   variabile di telemetria fosse vuota e che nessuno script venisse da un
   dominio esterno — i due meccanismi attraverso cui un dato POTREBBE
   uscire. Era evidenza automatica, ma indiretta, e la difformita' D-03 lo
   dichiarava.

   Questo banco lo verifica in modo diretto, e lo fa con un VALORE SPIA.

   Si scrive una stringa irripetibile dentro i dati dell'utente — note,
   impostazioni, cronologia della chat, chiavi API — poi si usa
   l'applicazione: si aprono tutte le sezioni, si apre il pannello
   dell'assistente, si scrive in un campo. Ogni richiesta di rete che esce
   viene intercettata e ispezionata: URL, intestazioni e corpo. Se la
   stringa spia compare anche una sola volta, il dato e' uscito, e il
   banco fallisce nominando la richiesta.

   Si controlla anche DOVE vanno le richieste: un ospite non previsto e'
   un difetto anche se non porta con se' nessun dato, perche' il solo
   fatto di contattarlo rivela che quell'utente sta usando l'applicazione.

   PERCHE' LA SPIA E NON L'ELENCO DELLE RICHIESTE
   Guardare solo gli ospiti contattati direbbe «nessuno ha ricevuto dati»
   per assenza di prove. La spia rovescia l'onere: il dato c'e', e se non
   compare da nessuna parte e' perche' davvero non e' uscito.

   USO   node tools/banchi/audit_rete.js     (serve un server su :8899)
   ═══════════════════════════════════════════════════════════════════════ */
'use strict';

const { chromium } = require('playwright-core');

const BASE = process.env.BSI_URL_BASE || 'http://127.0.0.1:8899/';
const CHROME = process.env.BSI_CHROME ||
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

/* Gli ospiti che la documentazione dichiara (docs/07 §4). Contattarne uno
   fuori da questo elenco e' un difetto: non e' nella distinta, quindi
   nessuno l'ha valutato. 127.0.0.1 e' il server locale del banco. */
const OSPITI_DICHIARATI = [
  '127.0.0.1', 'localhost',
  'pubchem.ncbi.nlm.nih.gov',
  'eutils.ncbi.nlm.nih.gov',
  'cdn.jsdelivr.net',                 // solo se qualcosa vi ricadesse: va visto
  'api.nasa.gov', 'images-api.nasa.gov', 'www.nasa.gov', 'esahubble.org',
  'raw.githubusercontent.com',        // controllo aggiornamenti (sw.js)
  'api.openai.com', 'api.anthropic.com', 'generativelanguage.googleapis.com',
  'api.groq.com', 'api.x.ai', 'api.deepseek.com', 'api.z.ai',
  'openrouter.ai', 'api.mistral.ai', 'api.together.xyz'
];

/* Una stringa che non puo' comparire per caso da nessun'altra parte. */
const SPIA = 'BSI-SPIA-' + Date.now().toString(36).toUpperCase() + '-QZXVKW';

const PAGINE = ['index.html', 'astro.html', 'chimorga.html', 'rdkit_lab.html',
                'file_manager.html', 'pro.html'];

let ok = 0, ko = 0;
function att(d, atteso, avuto){
  if (String(atteso) === String(avuto)) { ok++; console.log('  ✓ ' + d + '  → ' + avuto); }
  else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + '\n      avuto:  ' + avuto); }
}

/* `data:`, `blob:` e simili non sono richieste di rete: il contenuto e'
   gia' nella pagina e non esce da nessuna parte. Hanno hostname vuoto, e
   contarli fra gli «ospiti non dichiarati» segnalava un difetto
   inesistente — con un nome vuoto, per giunta. */
function ospiteDi(url){
  if (/^(data|blob|about|filesystem|javascript):/i.test(url)) return null;
  try {
    const h = new URL(url).hostname;
    return h || null;
  } catch (e) { return '(url illeggibile)'; }
}

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ serviceWorkers: 'block' });

  const richieste = [];      // ogni richiesta uscita, con cio' che portava
  let ispezionate = 0;

  ctx.on('request', function(req){
    ispezionate++;
    let corpo = '';
    try { corpo = req.postData() || ''; } catch (e) {}
    let intest = '';
    try { intest = JSON.stringify(req.headers()); } catch (e) {}
    richieste.push({
      url: req.url(),
      ospite: ospiteDi(req.url()),
      /* si conserva SOLO se la spia c'e': il resto non serve e un corpo
         intero in un rapporto pubblico sarebbe esso stesso una fuga */
      portaLaSpia: (req.url() + intest + corpo).indexOf(SPIA) !== -1
    });
  });

  const pg = await ctx.newPage();
  let scritture = 0, sezioniPercorse = 0;

  for (const pagina of PAGINE) {
    await pg.goto(BASE + pagina, { waitUntil: 'load', timeout: 60000 });
    await pg.waitForTimeout(1800);

    /* Si semina la spia in OGNI deposito che l'applicazione usa per i dati
       dell'utente. Se la si mettesse in una chiave sola, il banco
       proverebbe soltanto che quella chiave non esce. */
    const n = await pg.evaluate(function(spia){
      let messe = 0;
      const chiavi = ['bsi_note', 'bsi_chat', 'bsi_apikey', 'bsi_api_key',
                      'bsi_settings', 'bsi_impostazioni', 'bsi_memoria',
                      'bsi_ricordi', 'bsi_progress', 'bsi_quiz'];
      chiavi.forEach(function(k){
        try { localStorage.setItem(k, spia); messe++; } catch (e) {}
      });
      try { sessionStorage.setItem('bsi_spia', spia); messe++; } catch (e) {}
      /* e anche in un campo visibile, come farebbe una persona */
      const campo = document.querySelector('textarea, input[type=text]');
      if (campo) {
        campo.value = spia;
        campo.dispatchEvent(new Event('input', { bubbles: true }));
        campo.dispatchEvent(new Event('change', { bubbles: true }));
        messe++;
      }
      return messe;
    }, SPIA);
    scritture += n;
    /* ── La prova che questo banco misura davvero ──────────────────────
       Un controllo che cerca una stringa e non la trova mai da' lo stesso
       esito di un controllo rotto che non cerca niente. Con
       BSI_PROVA_FUGA=1 il banco provoca di proposito una fuga: se in quel
       caso NON fallisce, e' lo strumento a essere guasto.
       Non e' impalcatura dimenticata: e' il modo di rieseguire la prova
       senza rimettere le mani nel codice.
           BSI_PROVA_FUGA=1 node tools/banchi/audit_rete.js   → deve FALLIRE
       Si noti che la fuga simulata va a un ospite DICHIARATO: contattarlo
       e' lecito, mandargli i dati dell'utente no. */
    if (process.env.BSI_PROVA_FUGA) {
      await pg.evaluate(function(spia){
        fetch('https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/' +
              encodeURIComponent(spia) + '/JSON').catch(function(){});
      }, SPIA);
      await pg.waitForTimeout(400);
    }

    /* Ora si USA l'applicazione: e' durante l'uso che un dato esce, non
       mentre la pagina sta ferma. */
    const sezioni = await pg.$$eval('.nav-btn[data-s]', bs =>
      bs.map(x => x.getAttribute('data-s')));
    for (const sid of sezioni) {
      await pg.evaluate(function(id){
        const x = document.querySelector('.nav-btn[data-s="' + id + '"]');
        if (x) x.click();
      }, sid);
      await pg.waitForTimeout(25);
      sezioniPercorse++;
    }
    /* il pannello dell'assistente: e' il solo che parla con l'esterno */
    await pg.evaluate(function(){
      const b = document.querySelector('#bsiAiFab, .bsi-ai-fab, [data-bsi-ai]');
      if (b) b.click();
    });
    await pg.waitForTimeout(900);
  }

  await pg.waitForTimeout(1200);
  await browser.close();

  console.log('Nessun dato dell\'utente lascia il dispositivo\n');
  console.log('  valore spia seminato in ' + scritture + ' depositi · ' +
              sezioniPercorse + ' sezioni percorse · ' +
              ispezionate + ' richieste ispezionate\n');

  /* ── Un banco che non misura nulla passa ──
     Se nessuna spia e' stata scritta, o nessuna richiesta e' passata dal
     controllo, «nessuna fuga» non significa niente. */
  att('la spia e\' stata seminata', true, scritture > 0);
  att('almeno una richiesta e\' stata ispezionata', true, ispezionate > 0);
  att('almeno una sezione e\' stata percorsa', true, sezioniPercorse > 0);

  const fughe = richieste.filter(r => r.portaLaSpia);
  att('richieste che portano fuori un dato dell\'utente', 0, fughe.length);
  fughe.slice(0, 5).forEach(r => console.log('      ! ' + r.url.slice(0, 140)));

  const ospiti = [...new Set(richieste.map(r => r.ospite).filter(Boolean))].sort();
  const nonDichiarati = ospiti.filter(h =>
    !OSPITI_DICHIARATI.some(d => h === d || h.endsWith('.' + d)));
  att('ospiti contattati e non dichiarati nella distinta', 0, nonDichiarati.length);
  nonDichiarati.forEach(h => console.log('      ! ' + h));

  console.log('\n  ospiti contattati: ' + (ospiti.length ? ospiti.join(', ') : '(nessuno)'));
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
