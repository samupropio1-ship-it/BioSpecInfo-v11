#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   test_impronta — il creatore riconosciuto dall'impronta, e la voce che parte

   PERCHE' QUESTO BANCO ESISTE

   Segnalazioni dell'autore sulla v242: «non sento la voce» e «vorrei che
   fossi io con un riconoscimento impronta o qualcosa del genere, però solo
   con me».

   L'IMPRONTA (bsi-spectra-creatore.js, WebAuthn). Il telefono vero non si
   può toccare da qui: Chromium offre un AUTENTICATORE VIRTUALE (protocollo
   DevTools, dominio WebAuthn) che fa la parte del sensore, con la persona
   verificata o no. Il banco pretende:
   · l'impronta si lega SOLO dopo la frase segreta (prima: rifiuto);
   · legata, il riconoscimento non basta più ricordato nel browser: in una
     sessione nuova Spectra aspetta l'impronta;
   · l'impronta giusta, con la persona verificata, riconosce il creatore;
   · un sensore che non verifica la persona, o un altro autenticatore (un
     altro telefono, un'altra credenziale), non lo riconoscono;
   · nella console: il comando «attiva l'impronta», il pulsante «👆 Sono io»
     all'apertura quando l'impronta è attesa, il saluto per nome dopo;
   · «dimentica che sono il tuo creatore» toglie anche l'impronta.

   LA VOCE (bsi-spectra-live.js). Causa trovata: se il motore vocale del
   telefono metteva più di 1,2 s a partire, la frase veniva annullata e
   restava il solo labiale. Con una sintesi finta e LENTA (parte dopo 2,5 s,
   senza «onstart», come certi motori Android) il banco pretende che
   nessuna frase venga annullata e che tutte arrivino in fondo; con una
   sintesi che non parte affatto, il labiale porta avanti il discorso.
   E il comando «prova la voce» dice quante voci vede.

   NON PROVATO: il sensore vero di un telefono e l'audio che si sente.

   USO   node tools/banchi/test_impronta.js    (serve un server su :8899)
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';
const { chromium } = require('playwright-core');
/* WebAuthn non accetta un indirizzo IP come dominio: si usa «localhost» (contesto sicuro anche senza https) */
const BASE = (process.env.BSI_URL_BASE || 'http://127.0.0.1:8899/').replace('127.0.0.1', 'localhost');
const CHROME = process.env.BSI_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let ok = 0, ko = 0;
function att(d, atteso, avuto) {
  if (String(atteso) === String(avuto)) { ok++; console.log('  ✓ ' + d + '  → ' + avuto); }
  else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + '\n      avuto:  ' + avuto); }
}
function vero(d, c) { att(d, true, !!c); }

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true });
  const pg = await ctx.newPage(), errs = [];
  pg.on('pageerror', e => errs.push(e.message));
  await pg.addInitScript(() => { try { localStorage.setItem('bsi_guide_v3', '1'); } catch (e) {} });
  /* il sensore virtuale */
  const cdp = await ctx.newCDPSession(pg); await cdp.send('WebAuthn.enable');
  const nuovo = async () => (await cdp.send('WebAuthn.addVirtualAuthenticator', { options: { protocol: 'ctap2', transport: 'internal', hasResidentKey: true, hasUserVerification: true, isUserVerified: true, automaticPresenceSimulation: true } })).authenticatorId;
  let aut = await nuovo();
  await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
  await pg.waitForFunction(() => !!(window.BSISpectraCreatore && window.BSISpectraLive), null, { timeout: 60000 });

  console.log('\n── L\'impronta del creatore ──');
  const a = await pg.evaluate(async () => {
    const C = BSISpectraCreatore, o = {};
    localStorage.removeItem('bsi-spectra-creatore-v1'); localStorage.removeItem('bsi-spectra-creatore-impronta-v1'); sessionStorage.clear();
    o.disponibile = await C.improntaDisponibile();
    o.senzaFrase = (await C.attivaImpronta()).motivo;
    /* la frase segreta non si conosce (solo la sua impronta SHA-256 sta nel codice): una frase sbagliata e' rifiutata,
       il riconoscimento con la frase giusta si simula scrivendo il segno che verifica() lascia */
    o.fraseSbagliata = (await C.verifica('non è la frase')).ok;
    localStorage.setItem('bsi-spectra-creatore-v1', JSON.stringify({ ok: true, dal: Date.now(), ultima: Date.now() }));
    o.primaSenzaImpronta = C.riconosciuto();
    const r = await C.attivaImpronta(); o.attiva = r.ok; o.ha = C.haImpronta();
    o.salvato = Object.keys(JSON.parse(localStorage.getItem('bsi-spectra-creatore-impronta-v1') || '{}')).sort().join(',');
    o.dopoAttiva = C.riconosciuto();
    sessionStorage.clear(); o.nuovaSessione = C.riconosciuto(); o.attesa = C.inAttesaImpronta();
    const u = await C.conImpronta(); o.usa = u.ok; o.dopoUsa = C.riconosciuto();
    o.contesto = /riconosciuto/.test(C.contesto()) && !/NON e' stato riconosciuto/.test(C.contesto());
    return o;
  });
  vero('il telefono simulato offre il sensore (impronta o volto)', a.disponibile);
  att('senza la frase segreta l\'impronta non si lega', 'frase', a.senzaFrase);
  att('una frase sbagliata non riconosce', false, a.fraseSbagliata);
  vero('riconosciuto con la frase (prima dell\'impronta)', a.primaSenzaImpronta);
  vero('dopo la frase l\'impronta si lega', a.attiva && a.ha);
  att('si conserva solo l\'identificativo della credenziale e la data, nessuna impronta', 'dal,id', a.salvato);
  vero('appena legata, il creatore resta riconosciuto', a.dopoAttiva);
  vero('in una sessione nuova il ricordo del browser non basta: Spectra aspetta l\'impronta', !a.nuovaSessione && a.attesa);
  vero('l\'impronta giusta, persona verificata: riconosciuto', a.usa && a.dopoUsa);
  vero('il modello sa che parla con il creatore', a.contesto);

  /* un sensore che non verifica la persona */
  await cdp.send('WebAuthn.setUserVerified', { authenticatorId: aut, isUserVerified: false });
  const nv = await pg.evaluate(async () => { sessionStorage.clear(); const r = await BSISpectraCreatore.conImpronta(); return { ok: r.ok, ric: BSISpectraCreatore.riconosciuto() }; });
  vero('persona NON verificata dal sensore: non riconosciuto', !nv.ok && !nv.ric);
  /* un altro telefono: un altro autenticatore, senza la credenziale legata */
  await cdp.send('WebAuthn.removeVirtualAuthenticator', { authenticatorId: aut }); aut = await nuovo();
  const al = await pg.evaluate(async () => { sessionStorage.clear(); const r = await BSISpectraCreatore.conImpronta(); return { ok: r.ok, ric: BSISpectraCreatore.riconosciuto() }; });
  vero('un altro sensore (un\'altra persona, un altro telefono): non riconosciuto', !al.ok && !al.ric);

  console.log('\n── Nella console di Spectra ──');
  const c = await pg.evaluate(async () => {
    const pausa = ms => new Promise(r => setTimeout(r, ms)), C = BSISpectraCreatore, L = BSISpectraLive, o = {};
    /* che cosa dice Spectra: l'evento che la voce manda alla figura (la console chiama la sua voce interna) */
    const detti = []; document.addEventListener('bsi-spectra-dice', e => detti.push(e.detail && e.detail.testo || ''));
    /* rilegata sul nuovo sensore, con la frase */
    C.togliImpronta(); localStorage.setItem('bsi-spectra-creatore-v1', JSON.stringify({ ok: true, dal: Date.now(), ultima: Date.now() })); sessionStorage.setItem('bsi-spectra-creatore-sessione', '1');
    L.apri({ briefing: false }); await pausa(800);
    L.elabora('attiva l\'impronta'); for (let k = 0; k < 40 && !C.haImpronta(); k++) await pausa(100); await pausa(300);
    o.attivata = C.haImpronta(); o.detto = detti.join(' ').slice(0, 120) || (document.getElementById('bsiJV-dial') || {}).textContent;
    L.chiudi && L.chiudi(); await pausa(500);
    /* nuova sessione: all'apertura la console chiede l'impronta con un pulsante */
    sessionStorage.clear(); L.apri(); await pausa(1200);
    const bt = document.querySelector('#bsiJV-dial [data-bsi-impronta="usa"]'); o.pulsante = !!bt; o.chiede = (document.getElementById('bsiJV-dial') || {}).textContent || '';
    detti.length = 0; if (bt) bt.click(); for (let k = 0; k < 40 && !C.riconosciuto(); k++) await pausa(100); await pausa(400);
    o.riconosciuto = C.riconosciuto(); o.saluto = detti.join(' ');
    /* «prova la voce» */
    detti.length = 0; L.elabora('prova la voce'); await pausa(300); o.prova = detti.join(' ');
    o.statoVoce = L.statoVoce();
    /* «dimentica che sono il tuo creatore» toglie anche l'impronta */
    L.elabora('dimentica che sono il tuo creatore'); await pausa(300); o.dimenticato = !C.riconosciuto() && !C.haImpronta();
    L.taci(); L.chiudi && L.chiudi(); return o;
  });
  vero('«attiva l\'impronta» la lega e Spectra lo dice (' + c.detto.slice(0, 60) + '…)', c.attivata && /impronta/i.test(c.detto));
  vero('aperta in una sessione nuova, la console chiede l\'impronta con «👆 Sono io» (' + c.chiede.slice(0, 50) + ')', c.pulsante && /impronta/i.test(c.chiede));
  vero('toccato il pulsante: riconosciuto e salutato per nome (' + c.saluto.slice(0, 60) + '…)', c.riconosciuto && /Samuele/.test(c.saluto));
  vero('«prova la voce» dice quante voci vede o cosa fare (' + c.prova.slice(0, 70) + '…)', /voce|voci|voice/i.test(c.prova));
  vero('lo stato della voce si legge (attiva, voci, motore)', c.statoVoce && c.statoVoce.attiva === true && typeof c.statoVoce.voci === 'number');
  vero('«dimentica che sono il tuo creatore» toglie anche l\'impronta', c.dimenticato);

  console.log('\n── La voce che parte tardi non si annulla ──');
  const v = await pg.evaluate(async () => {
    const pausa = ms => new Promise(r => setTimeout(r, ms)), o = {};
    /* una sintesi finta e LENTA: ogni frase parte dopo 2,5 s, SENZA «onstart», dura 0,6 s, poi «onend» */
    const S = { speaking: false, pending: false, coda: [], annullate: 0, finite: 0, _t: 0,
      getVoices() { return []; }, resume() {}, addEventListener() {},
      cancel() { if (this.speaking || this.pending) this.annullate++; this.coda = []; this.speaking = this.pending = false; clearTimeout(this._t); },
      speak(u) { this.pending = true; this.coda.push(u); const me = this;
        if (u.volume === 0) { me.pending = false; me.coda.shift(); return; }
        this._t = setTimeout(() => { me.pending = false; me.speaking = true; setTimeout(() => { me.speaking = false; me.finite++; me.coda.shift(); u.onend && u.onend(); }, 600); }, 2500); } };
    const vero0 = window.speechSynthesis; Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: S });
    let fine = false; BSISpectraLive.parla('Prima frase. Seconda frase.', () => { fine = true; });
    for (let k = 0; k < 120 && !fine; k++) await pausa(100);
    o.finito = fine; o.annullate = S.annullate; o.finite = S.finite;
    /* una sintesi che non parte mai: dopo l'attesa il labiale porta avanti il discorso */
    const M = { speaking: false, pending: false, getVoices() { return []; }, resume() {}, cancel() {}, speak() {}, addEventListener() {} };
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: M });
    let fine2 = false; BSISpectraLive.parla('Una frase sola.', () => { fine2 = true; });
    for (let k = 0; k < 80 && !fine2; k++) await pausa(100);
    o.muta = fine2;
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: vero0 });
    return o;
  });
  vero('una sintesi lenta (parte dopo 2,5 s, senza «onstart») NON viene annullata: ' + v.annullate + ' annullate', v.annullate === 0);
  vero('e tutte le frasi arrivano in fondo (' + v.finite + '/2)', v.finito && v.finite === 2);
  vero('una sintesi che non parte affatto non blocca il discorso: il labiale lo porta avanti', v.muta);

  console.log('\n── Dalla scheda 💬 Chat, e con Gemini sovraccarico ──');
  const h = await pg.evaluate(async () => {
    const pausa = ms => new Promise(r => setTimeout(r, ms)), o = {};
    /* «sono il tuo creatore» scritto nella Chat: non va al modello, apre la console col campo nascosto */
    let chiamate = 0; const fetch0 = window.fetch; window.fetch = function (u) { if (/generativelanguage|groq|openai|anthropic/.test(String(u))) chiamate++; return fetch0.apply(this, arguments); };
    localStorage.removeItem('bsi-spectra-creatore-v1'); localStorage.removeItem('bsi-spectra-creatore-impronta-v1'); sessionStorage.clear();
    window.bsiOpenAIHub('chat'); await pausa(1200);
    const inp = document.getElementById('bsi-hub-input'); inp.value = 'sono il tuo creatore';
    const invia = document.getElementById('bsi-hub-send') || [...document.querySelectorAll('#bsi-hub-ov button')].find(b => /invia|send/i.test(b.textContent + (b.title || '') + (b.getAttribute('aria-label') || '')));
    if (invia) invia.click(); else inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await pausa(1800);
    const jv = document.getElementById('bsiJV'), campo = document.getElementById('bsiJV-in') || (jv && jv.querySelector('input'));
    o.console = !!(jv && jv.classList.contains('aperto')) && !document.getElementById('bsi-hub-ov').classList.contains('open');
    o.password = campo ? campo.type : ''; o.chiamate = chiamate; o.invia = !!invia;
    window.fetch = fetch0; BSISpectraLive.chiudi && BSISpectraLive.chiudi(); await pausa(400);
    /* Gemini: il primo modello risponde 503 «high demand», gli altri rispondono: si passa da soli a un altro modello */
    const visti = [];
    window.fetch = async function (u) {
      u = String(u);
      if (/generativelanguage/.test(u) && /\/models\?/.test(u)) return new Response(JSON.stringify({ models: ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'].map(n => ({ name: 'models/' + n, supportedGenerationMethods: ['generateContent', 'streamGenerateContent'] })) }), { status: 200, headers: { 'content-type': 'application/json' } });
      const m = (u.match(/models\/([^:]+):streamGenerateContent/) || [])[1];
      if (m) { visti.push(m);
        if (visti.length === 1) return new Response(JSON.stringify({ error: { code: 503, message: 'This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.', status: 'UNAVAILABLE' } }), { status: 503, headers: { 'content-type': 'application/json' } });
        return new Response('data: ' + JSON.stringify({ candidates: [{ content: { parts: [{ text: 'Eccomi.' }] }, finishReason: 'STOP' }] }) + '\n\n', { status: 200, headers: { 'content-type': 'text/event-stream' } }); }
      return fetch0.apply(this, arguments);
    };
    const t0 = Date.now(); let testo = '', errore = '';
    try { testo = await window.bsiStreamChat('gemini', 'AIzaFINTA-chiave-di-prova-000000000000', [{ role: 'user', content: 'ciao' }], 'sii breve', { onToken: () => {}, onDone: () => {} }); } catch (e) { errore = e.message; }
    o.gemini = { testo, errore: errore.slice(0, 90), visti: visti.join(' → '), ms: Date.now() - t0 };
    window.fetch = fetch0; return o;
  });
  vero('«sono il tuo creatore» scritto nella Chat apre la console col campo nascosto, senza chiamare il modello (' + h.password + ', ' + h.chiamate + ' chiamate)', h.invia && h.console && h.password === 'password' && h.chiamate === 0);
  vero('Gemini sovraccarico (503) su un modello: si passa da soli a un altro modello con la stessa chiave (' + h.gemini.visti + ', ' + h.gemini.ms + ' ms, «' + h.gemini.testo + '» ' + h.gemini.errore + ')', h.gemini.testo === 'Eccomi.' && h.gemini.visti.split(' → ').length === 2 && h.gemini.visti.split(' → ')[0] !== h.gemini.visti.split(' → ')[1]);
  vero('…subito, senza le quattro attese (< 5 s)', h.gemini.ms < 5000);

  att('nessun errore JavaScript', 0, errs.length);
  errs.slice(0, 3).forEach(e => console.log('      ! ' + e.slice(0, 200)));
  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
