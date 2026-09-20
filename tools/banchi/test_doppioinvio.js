/* Due invii sovrapposti.
   sendBtn.disabled ferma il PULSANTE, non il tasto Invio: il gestore di
   keydown chiama send() direttamente. Chi scrive in fretta e batte Invio due
   volte fa partire due turni insieme sulla stessa chat — e i due si pestano
   i piedi mentre salvano la cronologia. */
const { chromium } = require('playwright-core');
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  let ok = 0, ko = 0;
  const att = (d, a, v) => {
    if (String(a) === String(v)) { ok++; console.log('  ✓ ' + d + '  → ' + v); }
    else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + a + '\n      avuto:  ' + v); }
  };

  const ctx = await b.newContext({ serviceWorkers: 'block' });
  const pg = await ctx.newPage();
  const err = [];
  pg.on('pageerror', e => err.push(e.message));
  pg.on('console', m => {
    if (m.type() === 'error' && !/Failed to load resource|favicon/.test(m.text())) err.push('console: ' + m.text());
  });
  await pg.addInitScript(() => {
    try {
      localStorage.setItem('bsi_ai_provider', 'groq');
      localStorage.setItem('bsi_api_keys', JSON.stringify({ groq: 'gsk_finta' }));
    } catch (e) {}
  });
  await pg.goto('http://127.0.0.1:8899/index.html', { waitUntil: 'load', timeout: 60000 });
  await pg.waitForTimeout(2500);
  await pg.evaluate(() => document.getElementById('bsi-spectra-fab').click());
  await pg.waitForTimeout(1200);

  // Risposta lenta: due secondi di stream, cosi' i due turni si sovrappongono
  // davvero invece di accodarsi per caso.
  await pg.route('**/*', async r => {
    const u = r.request().url();
    if (u.indexOf('127.0.0.1:8899') >= 0) return r.continue();
    if (/groq\.com/.test(u)) {
      await new Promise(res => setTimeout(res, 2000));
      return r.fulfill({
        status: 200, contentType: 'text/event-stream',
        headers: { 'access-control-allow-origin': '*' },
        body: 'data: {"choices":[{"delta":{"content":"risposta"}}]}\n\ndata: [DONE]\n\n'
      });
    }
    return r.continue();
  });

  console.log('\nDue Invio di fila, a mezzo secondo di distanza');
  await pg.evaluate(async () => {
    const inp = document.getElementById('bsi-hub-input');
    const batti = () => inp.dispatchEvent(new KeyboardEvent('keydown',
      { key: 'Enter', shiftKey: false, bubbles: true, cancelable: true }));
    inp.value = 'prima domanda';
    batti();
    await new Promise(r => setTimeout(r, 500));
    inp.value = 'seconda domanda';   // l'utente riscrive mentre la prima e' in volo
    batti();
  });
  await pg.waitForTimeout(6000);

  const stato = await pg.evaluate(() => {
    // La chiave vera e' bsi_ai_threads: indovinarla sbagliata faceva leggere
    // un oggetto vuoto, e il banco "passava" senza aver guardato niente.
    const d = JSON.parse(localStorage.getItem('bsi_ai_threads') || '{}');
    const th = Array.isArray(d.threads) ? d.threads : [];
    const t = th.find(x => x && x.id === d.activeId) || th[0] || { messages: [] };
    const ruoli = (t.messages || []).map(m => m.role);
    // due 'user' senza un 'assistant' in mezzo: e' la cronologia rotta che
    // Claude rifiuta al turno successivo
    let consecutivi = 0;
    for (let i = 1; i < ruoli.length; i++) if (ruoli[i] === 'user' && ruoli[i - 1] === 'user') consecutivi++;
    return {
      ruoli: ruoli.join(','),
      testi: (t.messages || []).map(m => String(m.content).slice(0, 24)).join(' | '),
      consecutivi,
      // il secondo testo non deve essere stato mangiato: chi lo ha scritto
      // deve poterlo rimandare con un solo Invio
      restaNellaCasella: document.getElementById('bsi-hub-input').value,
      bolleVive: document.querySelectorAll('#bsi-hub-msgs .bsi-msg.assistant .bsi-typing').length,
      sendVisibile: getComputedStyle(document.getElementById('bsi-hub-send')).display,
      stopVisibile: getComputedStyle(document.getElementById('bsi-hub-stop')).display
    };
  });
  console.log('    · ruoli salvati: ' + stato.ruoli);
  console.log('    · testi:         ' + stato.testi);
  att('nessun doppio turno "user" consecutivo', 0, stato.consecutivi);
  att('la cronologia resta alternata e pulita', 'user,assistant', stato.ruoli);
  att('il secondo testo non e\' andato perso', 'seconda domanda', stato.restaNellaCasella);
  att('non resta nessuna bolla in attesa', 0, stato.bolleVive);
  att('il pulsante Invia e\' di nuovo visibile', true, stato.sendVisibile !== 'none');
  att('il pulsante Stop e\' sparito', 'none', stato.stopVisibile);
  att('nessun errore JS', 0, err.length);
  err.slice(0, 4).forEach(e => console.log('     ! ' + e.slice(0, 160)));

  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' passati');
  process.exit(ko ? 1 : 0);
})();
