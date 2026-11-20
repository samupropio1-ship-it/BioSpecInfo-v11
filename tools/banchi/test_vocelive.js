#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════════
   test_vocelive — 🎙️ Spectra Prime: voce full-duplex (v267)

   PERCHE' QUESTO BANCO ESISTE
   L'autore ha chiesto un assistente vocale full-duplex di livello assoluto,
   collegato al Quantum Studio (SPECTRA_3D_BRIDGE), con AudioWorklet, VAD,
   barge-in, HUD olografico e controllo 3D a voce. La voce vera passa per un
   WebSocket «Live» che qui non si può raggiungere; ma tutto il resto si
   verifica senza rete, con un WebSocket finto:
   · gli strumenti puri dell'audio: Float32 ⇄ Int16 ⇄ base64 tornano
     identici, l'RMS è giusto, il codice dell'AudioWorklet registra il
     processore;
   · i tre strumenti vocali coprono le 13 aree; i nomi della proposta
     originale (biologia_molecolare, spazi_iperdimensionali, …) sono mappati
     sulle aree reali; assembled/cutaway/exploded diventano rappresentazioni;
   · con un WebSocket finto: alla connessione parte il setup giusto (modello,
     voce, strumenti); un toolCall «apri_sezione qm_qubit» apre davvero il
     modulo nel Quantum Studio e rimanda il toolResponse; imposta_parametro
     e cambia_vista pilotano il ponte; un messaggio «interrupted» ferma la
     riproduzione (barge-in); la riconnessione ha tentativi crescenti;
   · la console (sezione svocelive) costruisce l'HUD con orb, stato,
     barge-in, soglia VAD, scelta voce, parola di attivazione e registro.
   Nessun errore, non sborda.

   USO   node tools/banchi/test_vocelive.js   (serve un server su :8899)
   ════════════════════════════════════════════════════════════════════════ */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const { chromium } = require('playwright-core');
const RADICE = path.join(__dirname, '..', '..');
const BASE = process.env.BSI_URL_BASE || 'http://127.0.0.1:8899/';
const CHROME = process.env.BSI_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
let ok = 0, ko = 0;
function att(d, a, v) { if (String(a) === String(v)) { ok++; console.log('  ✓ ' + d + '  → ' + v); } else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + a + '\n      avuto:  ' + v); } }
function vero(d, c) { att(d, true, !!c); }
const vicino = (a, b, e) => Math.abs(a - b) <= (e || 1e-9);

(async () => {
  console.log('── Gli strumenti puri ──');
  const ctx = { Math, Object, Array, String, Number, isFinite, JSON, Float32Array, Int16Array, Uint8Array, ArrayBuffer, Buffer, setInterval: () => 0, clearInterval() {} };
  ctx.window = ctx; ctx.globalThis = ctx; ctx.btoa = s => Buffer.from(s, 'binary').toString('base64'); ctx.atob = s => Buffer.from(s, 'base64').toString('binary');
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(RADICE, 'bsi-quantum-studio-dati.js'), 'utf8'), ctx);
  vm.runInContext(fs.readFileSync(path.join(RADICE, 'bsi-spectra-voce-live.js'), 'utf8'), ctx);
  const V = ctx.BSISpectraVoceLive;
  { const f = new Float32Array([0, 0.5, -0.5, 0.999, -0.999, 0.1234, -0.3]); const bb = V.util.abToB64(V.util.floatToInt16(f).buffer); const back = V.util.int16ToFloat(new Int16Array(V.util.b64ToAb(bb)));
    let e = 0; for (let i = 0; i < f.length; i++) e = Math.max(e, Math.abs(f[i] - back[i]));
    vero('PCM Float32 → Int16 → base64 → Float32 torna identico (errore ' + e.toExponential(1) + ' < un passo di quantizzazione)', e < 2 / 32768); }
  vero('RMS giusto (onda quadra ±1 → 1; silenzio → 0)', vicino(V.util.rms(new Float32Array([1, -1, 1, -1])), 1) && vicino(V.util.rms(new Float32Array([0, 0, 0])), 0));
  vero('il codice dell\'AudioWorklet registra il processore e converte in Int16 con RMS', /registerProcessor\("bsi-pcm16"/.test(V.codiceWorklet()) && /Int16Array/.test(V.codiceWorklet()) && /postMessage/.test(V.codiceWorklet()));
  att('tre strumenti vocali', 'apri_sezione,imposta_parametro,cambia_vista', V.STRUMENTI.map(s => s.name).join(','));
  { const d = V.strumentiGemini()[0].functionDeclarations; vero('nel formato Gemini: 3 dichiarazioni, tipi in MAIUSCOLO (OBJECT/STRING/NUMBER)', d.length === 3 && d[0].parameters.type === 'OBJECT' && d[0].parameters.properties.sezione.type === 'STRING' && d[1].parameters.properties.valore.type === 'NUMBER'); }
  const aree = ctx.BSIQuantumDati.AREE.map(a => a.id);
  vero('ogni area del Quantum Studio è raggiungibile a voce (13 aree)', aree.length === 13 && aree.every(a => { const m = V.mapSezione(a); return m && m.area === a; }));
  { const leg = { biologia_molecolare: 'biomol', spazi_iperdimensionali: 'quantistica', chimica_computazionale: 'insilico', biofisica_membrana: 'biofisica', termodinamica_cinetica: 'termodinamica', laboratorio_3d: 'laboratorio' };
    vero('i nomi della proposta originale sono mappati sulle aree reali', Object.keys(leg).every(k => { const m = V.mapSezione(k); return m && m.area === leg[k]; }));
    vero('un id di modulo apre quel modulo (qm_qubit, bio_atp)', V.mapSezione('qm_qubit').modulo === 'qm_qubit' && V.mapSezione('bio_atp').modulo === 'bio_atp'); }
  att('assembled/cutaway/exploded → rappresentazioni', 'atomi cutaway→schema proiezione', V.mapVista('assembled', ['atomi', 'densita']) + ' cutaway→' + V.mapVista('cutaway', ['densita', 'schema']) + ' ' + V.mapVista('exploded', ['atomi', 'proiezione']));
  vero('il prompt di sistema cita gli strumenti e la parsimonia vocale', /apri_sezione/.test(V.PROMPT) && /imposta_parametro/.test(V.PROMPT) && /cambia_vista/.test(V.PROMPT));

  console.log('\n── Il motore, con un WebSocket finto (senza rete) ──');
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const cx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true }), pg = await cx.newPage(), errs = [];
  pg.on('pageerror', e => errs.push(e.message.slice(0, 200)));
  await pg.addInitScript(() => { try { localStorage.setItem('bsi_guide_v3', '1'); } catch (e) {}
    /* un WebSocket finto: registra ciò che gli viene mandato, e lascia che il test lo piloti */
    window.__wsInv = [];
    window.MockWS = function (url) { this.url = url; this.readyState = 0; window.__wsUltimo = this; };
    window.MockWS.prototype.send = function (m) { try { window.__wsInv.push(JSON.parse(m)); } catch (e) { window.__wsInv.push(m); } };
    window.MockWS.prototype.close = function () { this.readyState = 3; if (this.onclose) this.onclose(); };
    window.MockWS.prototype.apri = function () { this.readyState = 1; if (this.onopen) this.onopen(); };
    window.MockWS.prototype.ricevi = function (o) { if (this.onmessage) this.onmessage({ data: JSON.stringify(o) }); };
  });
  await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
  await pg.waitForFunction(() => !!(window.BSISpectraVoceLive && window.SPECTRA_3D_BRIDGE && window.BSISpectraLive && window.BSIQuantumDati), null, { timeout: 60000 });
  vero('il pulsante «Spectra Prime» è nella barra', await pg.evaluate(() => !!document.querySelector('.nav-btn[data-s="svocelive"]')));
  vero('Spectra ha lo strumento voce_dal_vivo', await pg.evaluate(() => (window.BSI_AI_TOOLS || []).some(t => t.name === 'voce_dal_vivo')));
  const r = await pg.evaluate(async () => {
    const P = ms => new Promise(r => setTimeout(r, ms)), o = {};
    /* la console */
    BSISpectraLive.calcolo.apriSezione('svocelive'); await P(600);
    const sec = document.getElementById('svocelive');
    o.hud = { orb: !!sec.querySelector('.bsiVL-orb'), pill: !!sec.querySelector('.bsiVL-pill'), conn: !!sec.querySelector('.bsiVL-conn'), barge: !!sec.querySelector('.bsiVL-barge'), vad: !!sec.querySelector('.bsiVL-vad'), voce: !!sec.querySelector('.bsiVL-voce'), wake: !!sec.querySelector('.bsiVL-wake'), log: !!sec.querySelector('.bsiVL-log') };
    /* il motore con WebSocket finto, senza audio */
    const m = new BSISpectraVoceLive.Motore({ noHUD: true, noVisual: true, noAudio: true, WebSocket: window.MockWS, apiKey: 'FINTA' });
    window.__wsInv.length = 0;
    await m.connetti(); const ws = window.__wsUltimo; ws.apri(); await P(50);
    const setup = window.__wsInv.find(x => x && x.setup);
    o.setup = setup ? { tools: !!(setup.setup.tools && setup.setup.tools[0].functionDeclarations.length === 3), voce: setup.setup.generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName, modello: setup.setup.model, prompt: /Spectra Prime/.test(setup.setup.systemInstruction.parts[0].text) } : null;
    o.connesso = m.s.connesso;
    /* un toolCall: apri qm_qubit */
    window.__wsInv.length = 0;
    ws.ricevi({ toolCall: { functionCalls: [{ id: 'a', name: 'apri_sezione', args: { sezione: 'qm_qubit' } }] } }); await P(700);
    const tp = document.querySelector('#squantum [role="tabpanel"]');
    o.apri = { modulo: tp && tp._qs && tp._qs.modulo, risposta: window.__wsInv.some(x => x.toolResponse && x.toolResponse.functionResponses[0].response.result.status === 'ok') };
    /* imposta_parametro */
    ws.ricevi({ toolCall: { functionCalls: [{ id: 'b', name: 'imposta_parametro', args: { chiave: 'detuning', valore: 1.5 } }] } }); await P(400);
    o.param = tp._qs.stato.params.detuning;
    /* apri un modulo con più rappresentazioni (bio_atp: densità/schema), poi cambia_vista cutaway → schema */
    ws.ricevi({ toolCall: { functionCalls: [{ id: 'c', name: 'apri_sezione', args: { sezione: 'bio_atp' } }] } }); await P(700);
    const primaRappr = tp._qs.stato.rappr;
    ws.ricevi({ toolCall: { functionCalls: [{ id: 'd', name: 'cambia_vista', args: { modo: 'cutaway' } }] } }); await P(500);
    o.vista = { prima: primaRappr, dopo: tp._qs.stato.rappr, comandi: m.s.comandi };
    /* barge-in: interrupted ferma la riproduzione */
    m.s.parla = true; ws.ricevi({ serverContent: { interrupted: true } }); await P(50); o.bargeIn = m.s.parla === false;
    /* riconnessione a tentativi crescenti */
    o.backoff = [m.backoff(1), m.backoff(2), m.backoff(3)].join(',');
    m.distruggi();
    o.sb = document.documentElement.scrollWidth - document.documentElement.clientWidth; return o;
  });
  vero('la console costruisce l\'HUD: orb, stato, barge-in, soglia VAD, voce, parola di attivazione, registro', Object.values(r.hud).every(Boolean));
  vero('alla connessione parte il setup giusto (3 strumenti, voce ' + (r.setup && r.setup.voce) + ', modello, prompt di Spectra Prime)', r.setup && r.setup.tools && r.setup.voce === 'Aoede' && /models\//.test(r.setup.modello) && r.setup.prompt && r.connesso);
  vero('un comando vocale «apri_sezione qm_qubit» apre davvero il modulo nel Quantum Studio e rimanda la risposta', r.apri.modulo === 'qm_qubit' && r.apri.risposta);
  vero('«imposta_parametro detuning 1,5» pilota il ponte (valore ' + r.param + ')', vicino(r.param, 1.5, 1e-9));
  vero('«cambia_vista cutaway» cambia la rappresentazione (' + r.vista.prima + ' → ' + r.vista.dopo + '), 4 comandi eseguiti', r.vista.prima === 'densita' && r.vista.dopo === 'schema' && r.vista.comandi === 4);
  vero('un messaggio «interrupted» ferma subito la riproduzione (barge-in)', r.bargeIn);
  att('riconnessione a tentativi crescenti (ms)', '1200,2400,3600', r.backoff);
  att('non sborda', 0, r.sb);
  att('nessun errore JavaScript', 0, errs.length); errs.slice(0, 4).forEach(e => console.log('      ! ' + e));
  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.stack || e.message); process.exit(1); });
