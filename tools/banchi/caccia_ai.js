/* CACCIA AI DIFETTI DELL'AGENTE — condizioni mai sondate finora.
   I banchi esistenti coprono i guasti del FORNITORE (404, 503, CORS, tetti,
   attese). Qui si provano cose diverse: risposte malformate, strumenti che
   falliscono, interruzioni, input ostili. Sono i casi in cui un agente
   smette di essere utile senza che nessun test se ne accorga. */
const { chromium } = require('playwright-core');
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  let ok = 0, ko = 0;
  const att = (d, a, v) => {
    if (String(a) === String(v)) { ok++; console.log('  ✓ ' + d + '  → ' + v); }
    else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + a + '\n      avuto:  ' + v); }
  };

  async function apri(seed) {
    const ctx = await b.newContext({ serviceWorkers: 'block' });
    const pg = await ctx.newPage();
    const err = [];
    pg.on('pageerror', e => err.push(e.message));
    pg.on('console', m => {
      if (m.type() === 'error' && !/Failed to load resource|favicon/.test(m.text()))
        err.push('console: ' + m.text());
    });
    await pg.addInitScript(() => {
      try {
        localStorage.setItem('bsi_ai_provider', 'groq');
        localStorage.setItem('bsi_api_keys', JSON.stringify({ groq: 'gsk_finta' }));
      } catch (e) {}
    });
    if (seed) await pg.addInitScript(seed);
    await pg.goto('http://127.0.0.1:8899/index.html', { waitUntil: 'load', timeout: 60000 });
    await pg.waitForTimeout(2500);
    await pg.evaluate(() => document.getElementById('bsi-spectra-fab').click());
    await pg.waitForTimeout(1200);
    return { pg, ctx, err };
  }

  // risponde con un corpo arbitrario
  async function rispondi(pg, corpo, tipo, stato) {
    await pg.route('**/*', r => {
      const u = r.request().url();
      if (u.indexOf('127.0.0.1:8899') >= 0) return r.continue();
      if (/groq\.com/.test(u)) return r.fulfill({
        status: stato || 200, contentType: tipo || 'text/event-stream',
        headers: { 'access-control-allow-origin': '*' }, body: corpo
      });
      return r.continue();
    });
  }

  const chiedi = async (pg, testo, attesa) => {
    await pg.evaluate(t => {
      document.getElementById('bsi-hub-input').value = t;
      document.getElementById('bsi-hub-send').click();
    }, testo);
    await pg.waitForTimeout(attesa || 5000);
  };

  const stato = pg => pg.evaluate(() => ({
    msg: document.getElementById('bsi-hub-msgs').textContent.slice(-400),
    sendVisibile: getComputedStyle(document.getElementById('bsi-hub-send')).display !== 'none',
    stopVisibile: getComputedStyle(document.getElementById('bsi-hub-stop')).display !== 'none',
    inAttesa: document.querySelectorAll('#bsi-hub-msgs .bsi-typing').length
  }));

  // ── 1. il fornitore risponde con JSON rotto a metà ──
  console.log('\n1) Risposta troncata a metà (connessione caduta durante lo stream)');
  {
    const a = await apri();
    await rispondi(a.pg, 'data: {"choices":[{"delta":{"content":"La risposta ini');
    await chiedi(a.pg, 'ciao');
    const s = await stato(a.pg);
    att('il pulsante Invia torna disponibile', true, s.sendVisibile);
    att('lo Stop sparisce', false, s.stopVisibile);
    att('nessuna bolla resta in attesa', 0, s.inAttesa);
    att('nessun errore JS', 0, a.err.length);
    a.err.slice(0, 3).forEach(e => console.log('     ! ' + e.slice(0, 160)));
    await a.ctx.close();
  }

  // ── 2. il fornitore risponde HTML invece di JSON (pagina di errore del proxy) ──
  console.log('\n2) Il fornitore risponde con una pagina HTML di errore (502)');
  {
    const a = await apri();
    await rispondi(a.pg, '<!doctype html><html><body><h1>502 Bad Gateway</h1></body></html>',
                   'text/html', 502);
    await chiedi(a.pg, 'ciao', 6000);
    const s = await stato(a.pg);
    /* Un 502 NON deve produrre subito un errore: e' un guasto temporaneo e
       l'app ritenta con attese crescenti (misurate: 12 s, poi 24 s). Il
       requisito e' che lo DICA mentre aspetta, invece di restare muta —
       non che si arrenda in fretta. Una prima versione di questo banco
       pretendeva uno stato finale dopo 5 secondi, cioe' mentre il primo
       tentativo era ancora in volo. */
    att('avvisa che sta ritentando, invece di restare muto', true,
      /sovraccarico|riprovo|aspetto/i.test(s.msg));
    att('e dice quanto aspetta', true, /\d+(\.\d+)?s/.test(s.msg));
    att('nessun errore JS', 0, a.err.length);
    a.err.slice(0, 3).forEach(e => console.log('     ! ' + e.slice(0, 160)));
    await a.ctx.close();
  }

  // ── 3. risposta vuota: 200 OK senza alcun contenuto ──
  console.log('\n3) Risposta 200 completamente vuota');
  {
    const a = await apri();
    await rispondi(a.pg, '');
    await chiedi(a.pg, 'ciao');
    const s = await stato(a.pg);
    att('non resta una bolla vuota in attesa', 0, s.inAttesa);
    att('il pulsante Invia torna disponibile', true, s.sendVisibile);
    att('nessun errore JS', 0, a.err.length);
    a.err.slice(0, 3).forEach(e => console.log('     ! ' + e.slice(0, 160)));
    await a.ctx.close();
  }

  // ── 4. lo Stop durante la risposta ──
  console.log('\n4) L\'utente preme Stop mentre la risposta arriva');
  {
    const a = await apri();
    await a.pg.route('**/*', async r => {
      const u = r.request().url();
      if (u.indexOf('127.0.0.1:8899') >= 0) return r.continue();
      if (/groq\.com/.test(u)) {
        await new Promise(res => setTimeout(res, 8000));
        return r.fulfill({ status: 200, contentType: 'text/event-stream',
          headers: { 'access-control-allow-origin': '*' },
          body: 'data: {"choices":[{"delta":{"content":"tardi"}}]}\n\ndata: [DONE]\n\n' });
      }
      return r.continue();
    });
    await a.pg.evaluate(() => {
      document.getElementById('bsi-hub-input').value = 'domanda lunga';
      document.getElementById('bsi-hub-send').click();
    });
    await a.pg.waitForTimeout(1500);
    await a.pg.evaluate(() => document.getElementById('bsi-hub-stop').click());
    await a.pg.waitForTimeout(1500);
    const s = await stato(a.pg);
    att('lo Stop riporta subito il pulsante Invia', true, s.sendVisibile);
    att('e nasconde se stesso', false, s.stopVisibile);
    att('la bolla non resta a puntini per sempre', 0, s.inAttesa);
    // la cronologia deve restare alternata anche dopo un'interruzione
    const ruoli = await a.pg.evaluate(() => {
      const d = JSON.parse(localStorage.getItem('bsi_ai_threads') || '{}');
      const th = Array.isArray(d.threads) ? d.threads : [];
      const t = th.find(x => x && x.id === d.activeId) || th[0] || { messages: [] };
      return (t.messages || []).map(m => m.role).join(',');
    });
    console.log('    · cronologia: ' + ruoli);
    att('la cronologia resta alternata dopo lo Stop', false, /user,user/.test(ruoli));
    att('nessun errore JS', 0, a.err.length);
    a.err.slice(0, 3).forEach(e => console.log('     ! ' + e.slice(0, 160)));
    await a.ctx.close();
  }

  // ── 5. chiusura del pannello mentre risponde ──
  console.log('\n5) Si chiude il pannello mentre la risposta è in corso');
  {
    const a = await apri();
    await a.pg.route('**/*', async r => {
      const u = r.request().url();
      if (u.indexOf('127.0.0.1:8899') >= 0) return r.continue();
      if (/groq\.com/.test(u)) {
        await new Promise(res => setTimeout(res, 5000));
        return r.fulfill({ status: 200, contentType: 'text/event-stream',
          headers: { 'access-control-allow-origin': '*' },
          body: 'data: {"choices":[{"delta":{"content":"ok"}}]}\n\ndata: [DONE]\n\n' });
      }
      return r.continue();
    });
    await a.pg.evaluate(() => {
      document.getElementById('bsi-hub-input').value = 'domanda';
      document.getElementById('bsi-hub-send').click();
    });
    await a.pg.waitForTimeout(1200);
    await a.pg.evaluate(() => {
      const c = document.getElementById('bsi-hub-close');
      if (c) c.click();
    });
    /* Chiudere il pannello NON deve annullare la risposta: chi lo richiude
       per guardare altro deve ritrovare la risposta al suo posto. Si aspetta
       quindi che il turno finisca davvero — la rotta ritarda DUE chiamate in
       sequenza (risoluzione del modello e chat), non una, quindi servono piu'
       dei 5 s del singolo ritardo. Una prima versione di questo banco
       misurava a meta' volo e dichiarava guasto un comportamento corretto. */
    await a.pg.waitForTimeout(12000);
    att('nessun errore JS a pannello chiuso', 0, a.err.length);
    a.err.slice(0, 3).forEach(e => console.log('     ! ' + e.slice(0, 160)));
    const riapre = await a.pg.evaluate(() => {
      document.getElementById('bsi-spectra-fab').click();
      const s = document.getElementById('bsi-hub-send');
      return { send: getComputedStyle(s).display !== 'none',
               attesa: document.querySelectorAll('#bsi-hub-msgs .bsi-typing').length,
               testo: document.getElementById('bsi-hub-msgs').textContent };
    });
    att('la risposta arriva comunque, a pannello chiuso', true, /risposta|ok/i.test(riapre.testo));
    att('riaprendo, il pulsante Invia è a posto', true, riapre.send);
    att('e non ci sono bolle in attesa', 0, riapre.attesa);
    await a.ctx.close();
  }

  // ── 6. testo ostile nell'input ──
  console.log('\n6) Testo che potrebbe rompere il rendering');
  {
    const a = await apri();
    await rispondi(a.pg,
      'data: {"choices":[{"delta":{"content":"<img src=x onerror=\\"window.__xss=1\\">"}}]}\n\ndata: [DONE]\n\n');
    await chiedi(a.pg, '<script>window.__xssInput=1</script>');
    const s = await a.pg.evaluate(() => ({
      xssRisposta: !!window.__xss,
      xssInput: !!window.__xssInput,
      msg: document.getElementById('bsi-hub-msgs').textContent.slice(-200)
    }));
    att('lo script nella RISPOSTA non viene eseguito', false, s.xssRisposta);
    att('lo script nella DOMANDA non viene eseguito', false, s.xssInput);
    att('nessun errore JS', 0, a.err.length);
    a.err.slice(0, 3).forEach(e => console.log('     ! ' + e.slice(0, 160)));
    await a.ctx.close();
  }

  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' passati');
  process.exit(ko ? 1 : 0);
})();
