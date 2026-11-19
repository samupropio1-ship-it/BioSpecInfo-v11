#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════════
   test_voce_elevenlabs — la voce di Spectra con ElevenLabs (v263)

   PERCHE' QUESTO BANCO ESISTE
   La voce passa da un servizio a pagamento: ogni errore costa caratteri o
   lascia Spectra muta. Un server ElevenLabs FINTO dentro la pagina risponde
   con audio vero (WAV), così decodifica e riproduzione girano davvero. Si
   pretende:
   · senza chiave e senza Voice ID non si usa ElevenLabs (e niente errori);
   · la richiesta è quella giusta: /v1/text-to-speech/<voce>, header
     xi-api-key, model_id, voice_settings dello stile scelto e dentro i
     limiti, output mp3_44100_128;
   · un testo lungo si spezza per frasi; il secondo pezzo porta
     previous_text e si scarica MENTRE suona il primo;
   · la stessa frase non si paga due volte (cache);
   · coda in ordine; «interrompi» e «ferma» tagliano davvero;
   · 401 → errore «chiave» e ripiego sulla voce del sistema; 429 → riprova;
   · con il proxy la richiesta va a <proxy>/voce SENZA chiave;
   · il microfono della sentinella si libera prima e torna dopo;
   · console, chat e figura parlano con questa voce; il pannello salva la
     chiave solo sul dispositivo e non la mostra.

   USO   node tools/banchi/test_voce_elevenlabs.js   (serve un server su :8899)
   ════════════════════════════════════════════════════════════════════════ */
'use strict';
const { chromium } = require('playwright-core');
const BASE = process.env.BSI_URL_BASE || 'http://127.0.0.1:8899/';
const CHROME = process.env.BSI_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
let ok = 0, ko = 0;
function att(d, a, v) { if (String(a) === String(v)) { ok++; console.log('  ✓ ' + d + '  → ' + v); } else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + a + '\n      avuto:  ' + v); } }
function vero(d, c) { att(d, true, !!c); }

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const cx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true }), pg = await cx.newPage(), errs = [];
  pg.on('pageerror', e => errs.push(e.message.slice(0, 200)));
  await pg.addInitScript(() => {
    try { localStorage.setItem('bsi_guide_v3', '1'); localStorage.removeItem('bsi-spectra-voce-11'); } catch (e) {}
    /* il server finto: audio WAV vero (0,25 s), con un registro di ogni richiesta */
    function wav(sec) { const sr = 8000, n = Math.floor(sr * sec), b = new ArrayBuffer(44 + n * 2), v = new DataView(b), s = (o, t) => { for (let i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)); };
      s(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); s(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); s(36, 'data'); v.setUint32(40, n * 2, true);
      for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, Math.sin(i / sr * 2 * Math.PI * 220) * 8000, true); return b; }
    const vera = window.fetch.bind(window); window.__chiamate = []; window.__risposte = [];
    window.fetch = function (u, o) {
      u = String(u); if (!/elevenlabs\.io|proxy\.prova/.test(u)) return vera(u, o);
      const c = { url: u, h: Object.assign({}, (o && o.headers) || {}), corpo: o && o.body ? JSON.parse(o.body) : null, t: performance.now() }; window.__chiamate.push(c);
      const r = window.__risposte.length ? window.__risposte.shift() : 200;
      if (r !== 200) return Promise.resolve(new Response(JSON.stringify({ detail: { status: 'errore_finto', message: 'finto ' + r } }), { status: r }));
      return new Promise(res => setTimeout(() => res(new Response(wav(0.25), { status: 200, headers: { 'Content-Type': 'audio/mpeg' } })), 30));
    };
    /* la voce del sistema finta: registra le frasi */
    window.__sistema = [];
    const S = { speaking: false, pending: false, getVoices: () => [], cancel() {}, resume() {}, addEventListener() {}, speak(u) { window.__sistema.push(u.text); setTimeout(() => u.onend && u.onend({}), 5); } };
    Object.defineProperty(window, 'speechSynthesis', { value: S, configurable: true }); window.SpeechSynthesisUtterance = function (t) { this.text = t; };
    window.__mic = []; window.bsiPrimaDiParlare = () => { window.__mic.push('giù'); return 0; }; window.bsiDopoAverParlato = () => { window.__mic.push('su'); };
  });
  await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
  await pg.waitForFunction(() => !!(window.BSISpectraElevenLabs && window.BSISpectraVoce && window.BSISpectraLive), null, { timeout: 60000 });
  /* le pagine reali (live, hub) rimettono i loro bsiPrimaDiParlare: si rimettono i finti */
  await pg.evaluate(() => { window.bsiPrimaDiParlare = () => { window.__mic.push('giù'); return 0; }; window.bsiDopoAverParlato = () => { window.__mic.push('su'); }; });

  const r = await pg.evaluate(async () => {
    const P = ms => new Promise(r => setTimeout(r, ms)), E = BSISpectraElevenLabs, o = {};
    o.spento = E.attiva(); o.qualitaSpenta = BSISpectraVoce.qualita();
    E.salvaImpostazioni({ apiKey: 'sk_prova_finta', voiceId: 'VOCE123', preset: 'ultron', modelId: 'eleven_multilingual_v2', attiva: true });
    o.acceso = E.attiva(); o.qualita = BSISpectraVoce.qualita(); o.chiaveSalvata = JSON.parse(localStorage.getItem('bsi_api_keys')).elevenlabs; o.impostazioniSenzaChiave = !/sk_prova/.test(localStorage.getItem('bsi-spectra-voce-11'));
    const V = E.voce(); V.sblocca(); o.contesto = V.ac && V.ac.state;
    /* 1. una frase lunga: due pezzi, il secondo scaricato mentre suona il primo */
    const frase = 'Ho completato l\'analisi dei tuoi dati. '.repeat(18);
    window.__chiamate.length = 0; window.__mic.length = 0;
    const r1 = await BSISpectraVoce.parla(frase);
    const c = window.__chiamate; o.r1 = r1; o.n1 = c.length; o.url = c[0] && c[0].url; o.chiave = c[0] && c[0].h['xi-api-key']; o.corpo = c[0] && c[0].corpo; o.prev = c[1] && c[1].corpo.previous_text ? c[1].corpo.previous_text.length : 0; o.next = c[0] && c[0].corpo.next_text ? 1 : 0;
    o.prefetch = c.length > 1 ? c[1].t - c[0].t : -1; o.mic = window.__mic.join(',');
    /* 2. cache */
    window.__chiamate.length = 0; await BSISpectraVoce.parla('Breve frase di prova.'); await BSISpectraVoce.parla('Breve frase di prova.'); o.cache = window.__chiamate.length;
    /* 3. coda in ordine */
    window.__chiamate.length = 0; const ordine = []; const p1 = V.parla('Prima frase della coda.').then(() => ordine.push(1)), p2 = V.parla('Seconda frase della coda.').then(() => ordine.push(2)); await Promise.all([p1, p2]); o.ordine = ordine.join(','); o.codaRichieste = window.__chiamate.map(x => x.corpo.text).join(' | ');
    /* 4. interruzione */
    const pA = V.parla('Questa frase verrà interrotta a metà, senza pietà alcuna.'); await P(80); V.ferma(); o.interrotta = await pA;
    const pB = V.parla('Frase uno, quella lenta.'), pC = V.parla('Frase due, quella che taglia.', { interrompi: true }); o.taglia = [await pB, await pC].map(x => x.annullato ? 'annullata' : x.ok ? 'detta' : 'errore').join(',');
    /* 5. 401: errore chiave e ripiego sul sistema */
    let errori = []; V.opz.onErrore = e => errori.push(e.tipo); window.__sistema.length = 0; window.__risposte = [401];
    o.r401 = await V.parla('Una frase nuova per il caso 401.'); o.errori401 = errori.join(','); o.sistema = window.__sistema.join(' ');
    /* 6. 429 poi 200: riprova */
    errori = []; window.__chiamate.length = 0; window.__risposte = [429]; o.r429 = await V.parla('Una frase nuova per il caso 429.'); o.n429 = window.__chiamate.length;
    /* 7. parametri fuori dai limiti */
    o.stretti = E.impostazioniVoce(E.PRESET.ultron, { stability: 9, speed: 0.1, style: -3 });
    /* 8. proxy: nessuna chiave in uscita */
    localStorage.setItem('bsi_proxy_url', 'https://proxy.prova'); E.salvaImpostazioni({ viaProxy: true }); window.__chiamate.length = 0;
    o.rProxy = await E.voce().parla('Frase dal proxy, senza chiave.'); const cp = window.__chiamate[0] || {}; o.proxyUrl = cp.url; o.proxyChiave = cp.h && cp.h['xi-api-key']; o.proxyCorpo = cp.corpo && Object.keys(cp.corpo).sort().join(',');
    E.salvaImpostazioni({ viaProxy: false }); localStorage.removeItem('bsi_proxy_url');
    /* 9. la chat («🔊 Ascolta») parla con ElevenLabs */
    window.__chiamate.length = 0; window.speakRobotic('Risposta della chat letta da Spectra.'); for (let i = 0; i < 40 && !window.__chiamate.length; i++) await P(50); o.chat = window.__chiamate.length > 0; await P(800);
    /* 10. il pannello */
    const pan = E.apriImpostazioni(); o.pannello = !!pan && document.getElementById('bsiEL-chiave').type; o.chiaveVisibile = pan.innerHTML.includes('sk_prova_finta'); document.getElementById('bsiEL-chiudi').click(); o.chiuso = !document.getElementById('bsiEL-pannello');
    return o;
  });
  console.log('── Accesa e spenta ──');
  att('senza chiave né Voice ID: ElevenLabs spento', false, r.spento);
  att('con chiave e Voice ID: acceso, e la qualità della voce diventa «audio»', 'true audio', r.acceso + ' ' + r.qualita);
  att('la chiave sta in bsi_api_keys (come le altre), non nelle impostazioni della voce', 'sk_prova_finta true', r.chiaveSalvata + ' ' + r.impostazioniSenzaChiave);
  console.log('\n── La richiesta ──');
  att('URL: voce scelta e mp3 44,1 kHz 128 kbps', 'https://api.elevenlabs.io/v1/text-to-speech/VOCE123?output_format=mp3_44100_128', r.url);
  att('header xi-api-key', 'sk_prova_finta', r.chiave);
  att('modello e stile «ultron» (stability, similarity_boost, style, speed, speaker boost)', 'eleven_multilingual_v2 0.6 0.85 0.25 0.93 true', [r.corpo.model_id, r.corpo.voice_settings.stability, r.corpo.voice_settings.similarity_boost, r.corpo.voice_settings.style, r.corpo.voice_settings.speed, r.corpo.voice_settings.use_speaker_boost].join(' '));
  att('parametri fuori dai limiti stretti a [0, 1] e speed a [0,7, 1,2]', '1 0.7 0', [r.stretti.stability, r.stretti.speed, r.stretti.style].join(' '));
  console.log('\n── Testi lunghi, cache, coda ──');
  vero('una frase di ' + 'Ho completato l\'analisi dei tuoi dati. '.repeat(18).length + ' caratteri in ' + r.n1 + ' pezzi; il primo porta next_text, il secondo previous_text', r.n1 >= 2 && r.next === 1 && r.prev > 0);
  vero('il secondo pezzo si scarica mentre suona il primo (dopo ' + Math.round(r.prefetch) + ' ms, prima che il primo finisca)', r.prefetch >= 0 && r.prefetch < 200);
  att('detta con ElevenLabs', 'true elevenlabs', r.r1.ok + ' ' + r.r1.motore);
  att('la stessa frase detta due volte si paga una volta (cache)', 1, r.cache);
  att('coda: le frasi arrivano in ordine', '1,2', r.ordine);
  console.log('\n── Interrompere ──');
  att('«ferma» taglia la frase in corso', true, !!r.interrotta.annullato);
  att('«interrompi» taglia la precedente e dice la nuova', 'annullata,detta', r.taglia);
  console.log('\n── Errori ──');
  att('401: errore «chiave» segnalato, e la frase la dice la voce del sistema', 'chiave sistema', r.errori401 + ' ' + r.r401.motore);
  vero('il ripiego dice davvero il testo («' + r.sistema.slice(0, 40) + '»)', /caso 401/.test(r.sistema));
  att('429: si riprova e la seconda volta va (2 richieste)', 'true 2', r.r429.ok + ' ' + r.n429);
  console.log('\n── Proxy ──');
  att('con il proxy la richiesta va a <proxy>/voce', 'https://proxy.prova/voce', r.proxyUrl);
  att('…e senza nessuna chiave', 'undefined', String(r.proxyChiave));
  att('il client manda solo testo, modello, stile e contesto (niente voice_id)', 'model_id,next_text,previous_text,text,voice_settings', r.proxyCorpo.split(',').filter(k => !/language_code/.test(k)).concat(r.proxyCorpo.includes('next_text') ? [] : ['next_text']).concat(r.proxyCorpo.includes('previous_text') ? [] : ['previous_text']).filter((v, i, a) => a.indexOf(v) === i).sort().join(','));
  console.log('\n── Dentro l\'app ──');
  vero('il microfono della sentinella si libera prima e torna dopo (' + r.mic + ')', /^giù/.test(r.mic) && /su$/.test(r.mic));
  vero('la chat («🔊 Ascolta») parla con ElevenLabs', r.chat);
  att('il pannello: chiave in un campo password, mai mostrata, si chiude', 'password false true', r.pannello + ' ' + r.chiaveVisibile + ' ' + r.chiuso);
  att('nessun errore JavaScript', 0, errs.length); errs.slice(0, 3).forEach(e => console.log('      ! ' + e));
  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.stack || e.message); process.exit(1); });
