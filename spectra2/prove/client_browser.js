/* La prova del client nel browser vero: due dispositivi (un computer e un iPhone) sulla stessa conversazione.
   Lo lancia test_client.py, che gli passa l'indirizzo del servizio. Voce e riconoscimento sono finti: si registra cio' che
   la pagina DIREBBE e le si fa «sentire» cio' che si vuole. */
const { chromium, devices } = require('playwright');
const base = process.argv[2];
const righe = []; process.stdin.setEncoding('utf8'); let attese = [];
process.stdin.on('data', d => { d.split('\n').filter(Boolean).forEach(r => { const a = attese.shift(); a ? a(r) : righe.push(r); }); });
const riga = () => righe.length ? Promise.resolve(righe.shift()) : new Promise(r => attese.push(r));

function finti(a) {
  const id = a.id, tipo = a.tipo;
  localStorage.setItem('spectra-client-v1', JSON.stringify({ url: location.origin, gettone: 'g', id: id, nome: id, tipo: tipo, voce: true }));
  window._detto = [];
  const sintesi = { speaking: false, pending: false, cancel() {}, resume() {}, getVoices() { return []; },
    speak(u) { window._detto.push({ testo: u.text, pitch: u.pitch, rate: u.rate, lang: u.lang }); setTimeout(() => u.onend && u.onend(), 5); } };
  Object.defineProperty(window, 'speechSynthesis', { value: sintesi, configurable: true });
  window.SpeechSynthesisUtterance = function (t) { this.text = t; };
  window._ric = [];
  window.SpeechRecognition = window.webkitSpeechRecognition = function () { window._ric.push(this); this.start = () => { this.attivo = true; }; this.abort = () => { this.attivo = false; if (this.onend) this.onend(); }; };
  window._senti = function (frase) {          // il riconoscimento «sente» una frase finale
    const r = window._ric.filter(x => x.attivo).pop(); if (!r) return false;
    const e = { resultIndex: 0, results: [Object.assign([{ transcript: frase }], { isFinal: true })] }; r.onresult(e); return true;
  };
}

(async () => {
  const b = await chromium.launch();
  const out = {};
  const pc = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const cTel = await b.newContext({ ...devices['iPhone 13'] }); const tel = await cTel.newPage();
  const errori = []; for (const p of [pc, tel]) p.on('pageerror', e => errori.push(String(e)));
  await pc.addInitScript(finti, { id: 'pc', tipo: 'computer' }); await tel.addInitScript(finti, { id: 'tel', tipo: 'iphone' });
  await pc.goto(base + '/'); await tel.goto(base + '/');
  const testi = (p, cl) => p.$$eval('#dialogo .m' + (cl ? '.' + cl : ''), n => n.map(x => x.firstChild.textContent));
  const detto = p => p.evaluate(() => window._detto.map(x => x.testo));
  await pc.waitForFunction(() => document.getElementById('stato').textContent === 'presente');
  await tel.waitForFunction(() => document.getElementById('stato').textContent === 'presente');

  out.nome = await pc.evaluate(() => { const f = window.SpectraClient.estraiComando; return [
    f('Spectra, che ore sono?'), f('ehi Spectra'), f('domani vado a spettrometria'), f('senti spettra quanto pesa il benzene'), f('Ok Spectre. Apri la tavola periodica'),
    f('dimmi una cosa spectra: cos’è un chetone'), f('lo spettro è pronto'), f('SPEKTRA apri astro'), f('') ]; });
  out.tipi = await pc.evaluate(() => { const f = window.SpectraClient.tipoDi; return [f('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'), f('Mozilla/5.0 (Linux; Android 14; Pixel 8)'), f('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')]; });
  out.telefono = await tel.evaluate(() => ({ largo: document.documentElement.scrollWidth <= window.innerWidth, imp: document.getElementById('impostazioni').classList.contains('aperto'),
    tasto: document.getElementById('b-invia').getBoundingClientRect().height >= 40, manifesto: !!document.querySelector('link[rel=manifest]') }));

  // 1. dal computer, per iscritto
  await pc.fill('#testo', "Quanto vale il pKa dell'acido acetico?"); await pc.click('#b-invia');
  await pc.waitForFunction(() => document.querySelectorAll('#dialogo .m.lui').length === 1);
  await tel.waitForFunction(() => document.querySelectorAll('#dialogo .m.lui').length === 1);      // arriva anche al telefono…
  await pc.waitForFunction(() => window._detto.length >= 1);
  out.uno = { pc: await testi(pc), tel: await testi(tel), dettoPc: await detto(pc), dettoTel: await detto(tel), voce: await pc.evaluate(() => window._detto[0]) };

  // 2. dal telefono, la stessa conversazione
  await tel.fill('#testo', 'Ti ricordi di cosa parlavamo?'); await tel.press('#testo', 'Enter');
  await tel.waitForFunction(() => document.querySelectorAll('#dialogo .m.lui').length === 2);
  await pc.waitForFunction(() => document.querySelectorAll('#dialogo .m.lui').length === 2);
  out.due = { tel: await testi(tel, 'lui'), pc: await testi(pc, 'lui'), dettoPc: (await detto(pc)).length };

  // 3. un promemoria giunge all'ora: lo mostrano tutti, lo dice solo l'ultimo dispositivo usato (il telefono)
  const dP = (await detto(pc)).length, dT = (await detto(tel)).length;
  console.log('PROMEMORIA'); await riga();
  await pc.waitForFunction(() => document.querySelectorAll('#dialogo .m.promemoria').length === 1);
  await tel.waitForFunction(() => document.querySelectorAll('#dialogo .m.promemoria').length === 1);
  await tel.waitForFunction(n => window._detto.length > n, dT); await pc.waitForTimeout(300);
  out.tre = { testo: (await testi(tel, 'promemoria'))[0], dettoTel: (await detto(tel)).slice(dT), dettoPc: (await detto(pc)).slice(dP) };

  // 4. il nome come parola di attivazione, al computer
  await pc.click('#b-continuo');
  await pc.waitForFunction(() => window._ric.some(x => x.attivo));
  out.quattro = { premuto: await pc.getAttribute('#b-continuo', 'aria-pressed'), continuo: await pc.evaluate(() => window._ric.filter(x => x.attivo).pop().continuous) };
  await pc.evaluate(() => window._senti('domani vado a spettrometria di massa')); await pc.waitForTimeout(300);
  out.quattro.ignorata = (await testi(pc, 'io')).length;
  await pc.evaluate(() => window._senti('Spectra, quanto fa due più due'));
  await pc.waitForFunction(() => document.querySelectorAll('#dialogo .m.lui').length === 3);
  out.quattro.comando = (await testi(pc, 'io')).pop(); out.quattro.risposta = (await testi(pc, 'lui')).pop();
  await pc.waitForFunction(() => window._ric.filter(x => x.attivo).length > 0 && document.getElementById('nucleo').className === 'ascolta', null, { timeout: 15000 });   // dopo aver parlato torna ad ascoltare
  const n = (await detto(pc)).length;
  await pc.evaluate(() => window._senti('ehi Spectra'));                                             // solo il nome…
  await pc.waitForFunction(k => window._detto.length > k, n);
  out.quattro.si = (await detto(pc)).pop();
  await pc.waitForFunction(() => window._ric.filter(x => x.attivo).length > 0 && document.getElementById('nucleo').className === 'ascolta', null, { timeout: 15000 });
  await pc.evaluate(() => window._senti('apri la tavola periodica'));                                // …e la frase dopo e' il comando
  await pc.waitForFunction(() => document.querySelectorAll('#dialogo .m.lui').length === 4);
  out.quattro.dopoIlNome = (await testi(pc, 'io')).pop();

  // 5. un gettone sbagliato si vede, non si nasconde
  const altro = await (await b.newContext()).newPage();
  await altro.addInitScript(() => localStorage.setItem('spectra-client-v1', JSON.stringify({ url: location.origin, gettone: 'sbagliato', id: 'x', nome: 'x', tipo: 'browser', voce: false })));
  await altro.goto(base + '/'); await altro.waitForFunction(() => document.getElementById('stato').textContent === 'gettone non valido');
  out.cinque = await altro.textContent('#stato');
  out.errori = errori;
  console.log('ESITO ' + JSON.stringify(out));
  await b.close(); process.exit(0);
})().catch(e => { console.log('ERRORE ' + (e && e.stack || e)); process.exit(1); });
