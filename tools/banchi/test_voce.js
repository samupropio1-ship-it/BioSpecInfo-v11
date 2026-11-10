#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   test_voce — la voce robotica di Spectra nella scheda 💬 Chat

   PERCHE' QUESTO BANCO ESISTE

   Richiesta dell'autore (v246): ogni risposta di Spectra deve potersi
   ascoltare con una voce MASCHILE ROBOTICA, bassa e fredda («stile Ultron»),
   solo con la Web Speech API (niente librerie né servizi a pagamento, anche
   offline): pitch 0,58, rate 0,88, volume 1; voce italiana maschile, se c'è;
   un pulsante 🔊 su ogni risposta; l'interruttore «Leggi automaticamente»
   salvato in localStorage; la voce si ferma chiudendo la chat o cambiando
   sezione; senza sintesi vocale, nessun pulsante.

   Il banco sostituisce speechSynthesis con una FINTA che registra ogni frase
   (testo, pitch, rate, volume, voce) e offre voci italiane e inglesi,
   maschili e femminili, e una risposta di Gemini con una rete finta. Pretende:
   · la voce scelta è l'italiana maschile («Luca»), non la femminile né
     l'inglese;
   · ogni frase con pitch 0,58, rate 0,88, volume 1;
   · la risposta letta PER INTERO (prima si leggevano 600 caratteri), a frasi;
   · nessun annullamento quando non c'è niente in corso (su Android fa cadere
     la frase);
   · il pulsante 🔊 c'è su ogni risposta, diventa «⏹ Ferma» e la ferma;
   · l'interruttore c'è, si ricorda (spectraAutoSpeak) e, acceso, una
     risposta appena arrivata si legge da sola;
   · chiusa la finestra o cambiata sezione, la voce si ferma;
   · la console Spectra Live usa gli stessi parametri;
   · senza speechSynthesis non compare nessun pulsante.

   NON PROVATO: il suono vero di una voce di un telefono.

   USO   node tools/banchi/test_voce.js    (serve un server su :8899)
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';
const { chromium } = require('playwright-core');
const BASE = process.env.BSI_URL_BASE || 'http://127.0.0.1:8899/';
const CHROME = process.env.BSI_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let ok = 0, ko = 0;
function att(d, atteso, avuto) {
  if (String(atteso) === String(avuto)) { ok++; console.log('  ✓ ' + d + '  → ' + avuto); }
  else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + '\n      avuto:  ' + avuto); }
}
function vero(d, c) { att(d, true, !!c); }

/* la sintesi vocale finta, prima che l'app si carichi */
function sintesiFinta() {
  const voci = [
    { name: 'Google UK English Male', lang: 'en-GB' },
    { name: 'Alice', lang: 'it-IT' },
    { name: 'Luca', lang: 'it-IT' },
    { name: 'Samantha', lang: 'en-US' }
  ];
  const S = { speaking: false, pending: false, frasi: [], annullate: 0, _t: 0,
    getVoices() { return voci; }, addEventListener() {}, removeEventListener() {}, resume() {}, pause() {},
    cancel() { if (this.speaking || this.pending) this.annullate++; clearTimeout(this._t); this.speaking = this.pending = false; },
    speak(u) {
      this.frasi.push({ t: u.text, p: u.pitch, r: u.rate, v: u.volume, voce: u.voice ? u.voice.name : '' });
      if (u.volume === 0) return;
      const me = this; me.speaking = true;
      me._t = setTimeout(() => { me.speaking = false; if (u.onend) u.onend(); }, 40);
    } };
  Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: S });
  window.SpeechSynthesisUtterance = function (t) { this.text = t; this.pitch = 1; this.rate = 1; this.volume = 1; this.voice = null; this.lang = ''; };
  try { localStorage.setItem('bsi_guide_v3', '1'); } catch (e) {}
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true });
  const pg = await ctx.newPage(), errs = [];
  pg.on('pageerror', e => errs.push(e.message));
  await pg.addInitScript(sintesiFinta);
  await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
  await pg.waitForFunction(() => !!(window.speakRobotic && window.bsiOpenAIHub && window.BSISpectraLive), null, { timeout: 60000 });

  console.log('\n── La voce e i suoi parametri ──');
  const a = await pg.evaluate(async () => {
    const pausa = ms => new Promise(r => setTimeout(r, ms)), S = speechSynthesis, o = {};
    o.voce = (bsiVoceRobotica.voce() || {}).name;
    S.frasi.length = 0; S.annullate = 0;
    /* una risposta lunga, con markdown e formule, ben oltre i 600 caratteri di prima */
    const lunga = Array.from({ length: 14 }, (_, i) => '**Passo ' + (i + 1) + '.** La concentrazione di H₂O cresce di ' + (i + 2) + ' mol/L e la costante resta invariata.').join(' ');
    o.lunghezza = lunga.length;
    speakRobotic(lunga); for (let k = 0; k < 200 && !S.frasi.some(f => /15 mol/.test(f.t)); k++) await pausa(50); await pausa(200);
    const F = S.frasi.filter(f => f.v !== 0);
    o.frasi = F.length; o.ultima = (F[F.length - 1] || {}).t || ''; o.tutto = F.map(f => f.t).join(' ');
    o.parametri = [...new Set(F.map(f => f.p + '/' + f.r + '/' + f.v + '/' + f.voce))].join(' ');
    o.markdown = F.some(f => /\*\*/.test(f.t));
    o.annullate = S.annullate;
    return o;
  });
  att('la voce scelta è l\'italiana maschile (non la femminile né l\'inglese)', 'Luca', a.voce);
  att('ogni frase con pitch 0,58 · rate 0,88 · volume 1, voce Luca', '0.58/0.88/1/Luca', a.parametri);
  vero('la risposta letta PER INTERO, a frasi (' + a.frasi + ' frasi su ' + a.lunghezza + ' caratteri; l\'ultima: «' + a.ultima.slice(0, 40) + '…»)', a.frasi >= 14 && /Passo 14/.test(a.tutto) && /15 mol/.test(a.ultima) && /Passo 1\b/.test(a.tutto));
  vero('il markdown non si legge («**»)', !a.markdown);
  att('nessun annullamento quando non c\'era niente in corso', 0, a.annullate);

  console.log('\n── Nella scheda 💬 Chat ──');
  /* la rete finta: Gemini risponde «Il pH dell'acqua pura è 7. A 25 gradi.» */
  await pg.route(/generativelanguage\.googleapis\.com/, async r => {
    const u = r.request().url();
    if (/\/models\?/.test(u)) return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ models: [{ name: 'models/gemini-2.5-flash', supportedGenerationMethods: ['generateContent', 'streamGenerateContent'] }] }) });
    return r.fulfill({ status: 200, contentType: 'text/event-stream', body: 'data: ' + JSON.stringify({ candidates: [{ content: { parts: [{ text: 'Il pH dell\'acqua pura è 7. A 25 gradi.' }] }, finishReason: 'STOP' }] }) + '\n\n' });
  });
  const c = await pg.evaluate(async () => {
    const pausa = ms => new Promise(r => setTimeout(r, ms)), S = speechSynthesis, o = {};
    const k = JSON.parse(localStorage.getItem('bsi_api_keys') || '{}'); k.gemini = 'chiave-finta-di-prova'; localStorage.setItem('bsi_api_keys', JSON.stringify(k));
    bsiOpenAIHub('chat'); await pausa(1200);
    const ps = document.getElementById('bsi-hub-provsel'); if (ps) { ps.value = 'gemini'; ps.dispatchEvent(new Event('change')); }
    const tg = document.getElementById('spectra-auto-speak-toggle'); o.interruttore = !!tg;
    /* acceso: la risposta che arriva si legge da sola */
    tg.checked = true; tg.dispatchEvent(new Event('change')); o.salvato = localStorage.getItem('spectraAutoSpeak');
    S.frasi.length = 0;
    document.getElementById('bsi-hub-input').value = 'qual è il pH dell\'acqua?'; document.getElementById('bsi-hub-send').click();
    for (let i = 0; i < 100 && !S.frasi.some(f => /pH/.test(f.t)); i++) await pausa(100);
    o.auto = S.frasi.filter(f => f.v !== 0).map(f => f.t).join(' | ');
    await pausa(300);
    const bts = document.querySelectorAll('#bsi-hub-msgs .spectra-speak-btn'); o.pulsanti = bts.length;
    /* il pulsante: legge, diventa «⏹ Ferma», ferma */
    tg.checked = false; tg.dispatchEvent(new Event('change')); o.spento = localStorage.getItem('spectraAutoSpeak');
    const bt = bts[bts.length - 1]; S.frasi.length = 0;
    /* frasi lente per vedere lo stato «in corso» */
    const sp0 = S.speak; S.speak = function (u) { this.frasi.push({ t: u.text, p: u.pitch, r: u.rate, v: u.volume }); this.speaking = true; const me = this; me._t = setTimeout(() => { me.speaking = false; u.onend && u.onend(); }, 1500); };
    bt.click(); await pausa(200);
    o.inCorso = bt.textContent.trim() + ' ' + bt.classList.contains('speaking') + ' ' + bt.getAttribute('aria-pressed');
    bt.click(); await pausa(200);
    o.fermato = bt.textContent.trim() + ' ' + bt.classList.contains('speaking') + ' annullate:' + S.annullate;
    /* chiusa la finestra, la voce si ferma */
    bt.click(); await pausa(200); const prima = S.annullate;
    document.getElementById('bsi-hub-close').click(); await pausa(300);
    o.chiusa = S.annullate > prima;
    /* cambiata sezione, la voce si ferma */
    speakRobotic('Prima frase lunga. Seconda frase.'); await pausa(200); const prima2 = S.annullate;
    const nb = document.querySelector('.nav-btn[data-s="sstoria"], .nav-btn[data-s]'); nb.click(); await pausa(300);
    o.sezione = S.annullate > prima2;
    S.speak = sp0; return o;
  });
  vero('l\'interruttore «🔊 Leggi automaticamente» c\'è nella barra della Chat', c.interruttore);
  att('acceso, si ricorda in localStorage (spectraAutoSpeak)', 'true', c.salvato);
  vero('acceso, la risposta appena arrivata si legge da sola (' + c.auto.slice(0, 60) + ')', /pH dell'acqua pura/.test(c.auto) && /25 gradi/.test(c.auto));
  vero('ogni risposta di Spectra ha il suo pulsante 🔊 (' + c.pulsanti + ')', c.pulsanti >= 1);
  att('spento, si ricorda spento', 'false', c.spento);
  att('toccato, il pulsante diventa «⏹ Ferma» (testo, classe, aria-pressed)', '⏹ Ferma true true', c.inCorso);
  vero('toccato di nuovo, ferma la lettura e torna «🔊 Ascolta» (' + c.fermato + ')', /^🔊 Ascolta false annullate:[1-9]/.test(c.fermato));
  vero('chiusa la finestra dell\'AI, la voce si ferma', c.chiusa);
  vero('cambiata sezione, la voce si ferma', c.sezione);

  console.log('\n── La console usa la stessa voce ──');
  const v = await pg.evaluate(async () => {
    const pausa = ms => new Promise(r => setTimeout(r, ms)), S = speechSynthesis;
    S.frasi.length = 0; BSISpectraLive.parla('Sono Spectra. Ti ascolto.'); for (let k = 0; k < 40 && S.frasi.filter(f => f.v !== 0).length < 2; k++) await pausa(50);
    BSISpectraLive.taci(); return [...new Set(S.frasi.filter(f => f.v !== 0).map(f => f.p + '/' + f.r))].join(' ');
  });
  att('Spectra Live: pitch 0,58 · rate 0,88', '0.58/0.88', v);

  console.log('\n── Senza sintesi vocale ──');
  const pg2 = await ctx.newPage();
  await pg2.addInitScript(() => { try { delete window.speechSynthesis; Object.defineProperty(window, 'speechSynthesis', { configurable: true, get() { return undefined; } }); } catch (e) {} });
  await pg2.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
  await pg2.waitForFunction(() => !!window.createSpeakButton, null, { timeout: 60000 });
  const n = await pg2.evaluate(() => ({ bottone: createSpeakButton('ciao'), parla: speakRobotic('ciao') }));
  vero('nessun pulsante 🔊 e nessun errore: la voce semplicemente non c\'è', n.bottone === null && n.parla === false);

  att('nessun errore JavaScript', 0, errs.length);
  errs.slice(0, 3).forEach(e => console.log('      ! ' + e.slice(0, 200)));
  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
