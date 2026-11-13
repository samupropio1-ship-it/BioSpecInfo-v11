#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   test_risveglio — «Svegliati, Spectra»: avvio, meteo, punto alle 8 e alle 20,
   batteria, rete neurale, scorciatoie

   PERCHE' QUESTO BANCO ESISTE

   Richiesta dell'autore (v251): un Spectra che si comporti come il «Jarvis»
   dei video che gli piacciono, ma senza installare nulla e senza costi: si
   sveglia con una sequenza di avvio e dice il punto della situazione (meteo,
   impegni di oggi e di domani), ti saluta quando torni a casa, fa il punto da
   solo alle 8 e alle 20, cambia colore quando la batteria è bassa, mostra la
   sua memoria come una rete di neuroni e si apre da Siri o dalla Home.

   Il servizio del meteo è finto (le richieste a Open-Meteo sono intercettate
   e ricevono numeri fissi), così il banco non dipende dalla rete né dal tempo
   che fa. La sintesi vocale è finta e registra ogni frase.

   NON PROVATO: Siri e il lanciatore di Android veri (si prova l'indirizzo che
   aprono e il manifesto che li dichiara), il suono dell'allarme, la batteria
   di un telefono vero (si prova la reazione ai livelli), Open-Meteo vero.

   USO   node tools/banchi/test_risveglio.js    (serve un server su :8899)
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

function sintesiFinta() {
  const S = { speaking: false, pending: false, frasi: [], _t: 0, getVoices() { return [{ name: 'Luca', lang: 'it-IT' }]; }, addEventListener() {}, removeEventListener() {}, resume() {}, pause() {},
    cancel() { clearTimeout(this._t); this.speaking = this.pending = false; },
    speak(u) { this.frasi.push({ t: u.text, p: u.pitch, r: u.rate, v: u.volume }); if (u.volume === 0) return; const me = this; me.speaking = true; me._t = setTimeout(() => { me.speaking = false; if (u.onend) u.onend(); }, 20); } };
  Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: S });
  window.SpeechSynthesisUtterance = function (t) { this.text = t; this.pitch = 1; this.rate = 1; this.volume = 1; this.voice = null; this.lang = ''; };
  try { localStorage.setItem('bsi_guide_v3', '1'); } catch (e) {}
}

const CITTA = { milano: { name: 'Milano', latitude: 45.46, longitude: 9.19, country: 'Italia' }, roma: { name: 'Roma', latitude: 41.89, longitude: 12.48, country: 'Italia' } };
const METEO = { '45.46': { t: 13.2, p: 11.1, u: 80, c: 3, v: 9, d: [[3, 15.4, 8.6, 40], [61, 12.2, 7.1, 85]] }, '41.89': { t: 18, p: 18, u: 60, c: 0, v: 12, d: [[1, 21, 12, 5], [2, 20, 11, 10]] } };
async function meteoFinto(ctx, stato) {
  await ctx.route(/open-meteo\.com/, async r => {
    const u = new URL(r.request().url()); stato.chiamate.push(u.hostname + u.pathname + '?' + (u.searchParams.get('name') || u.searchParams.get('latitude')));
    if (stato.giu) return r.abort('failed');
    if (/geocoding/.test(u.hostname)) { const c = CITTA[(u.searchParams.get('name') || '').toLowerCase()]; return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(c ? { results: [c] } : {}) }); }
    const m = METEO[u.searchParams.get('latitude')];
    return r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ current: { temperature_2m: m.t, apparent_temperature: m.p, relative_humidity_2m: m.u, precipitation: 0, weather_code: m.c, wind_speed_10m: m.v },
      daily: { weather_code: m.d.map(x => x[0]), temperature_2m_max: m.d.map(x => x[1]), temperature_2m_min: m.d.map(x => x[2]), precipitation_probability_max: m.d.map(x => x[3]) } }) });
  });
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true, timezoneId: 'Europe/Rome', locale: 'it-IT' });
  const stato = { chiamate: [], giu: false }; await meteoFinto(ctx, stato);
  const pg = await ctx.newPage(), errs = [], ai = [];
  pg.on('pageerror', e => errs.push(e.message));
  pg.on('request', r => { if (/generativelanguage|anthropic|groq|openrouter|api\.x\.ai/.test(r.url())) ai.push(r.url()); });
  await pg.addInitScript(sintesiFinta);
  await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
  await pg.waitForFunction(() => !!(window.BSISpectraRisveglio && window.BSISpectraAgenda && window.BSISpectraLive && window.bsiOpenAIHub), null, { timeout: 60000 });

  console.log('\n── Il meteo ──');
  const m = await pg.evaluate(async () => {
    const R = BSISpectraRisveglio, A = BSISpectraAgenda, o = {}, risp = async f => { const r = A.comando(f); return r && r.promessa ? await r.promessa : r && r.testo; };
    R.imposta({ citta: null, lat: null, lon: null, meteo: null });
    o.senza = await risp('che tempo fa?');
    o.citta = await risp('Spectra, abito a Milano');
    o.oggi = await risp('che tempo fa');
    o.domani = await risp('che tempo fa domani');
    o.roma = await risp('che tempo fa a Roma?');
    o.ignota = await risp('che tempo fa a Atlantide');
    o.cieli = [0, 3, 45, 63, 75, 95, 1234].map(R.cielo).join('|');
    o.stato = R.stato().citta;
    return o;
  });
  vero('senza città la chiede: «' + m.senza + '»', /^Dimmi dove sei/.test(m.senza));
  att('«abito a Milano»', 'Segnato: Milano, Italia. Ti dirò il meteo da lì.', m.citta);
  att('«che tempo fa»: adesso e oggi, in gradi e a parole', 'A Milano ci sono 13 gradi, cielo coperto, percepiti 11 gradi. Oggi fra 9 gradi e 15 gradi, pioggia al 40 per cento.', m.oggi);
  att('«che tempo fa domani»', 'Domani a Milano: pioggia debole, fra 7 gradi e 12 gradi, pioggia al 85 per cento.', m.domani);
  att('un\'altra città, senza cambiare la propria', 'A Roma ci sono 18 gradi, cielo sereno. Oggi fra 12 gradi e 21 gradi.', m.roma);
  att('una città che non esiste', 'Non trovo «atlantide».', m.ignota);
  att('i codici del cielo (WMO) a parole', 'cielo sereno|cielo coperto|nebbia|pioggia|neve forte|temporale|condizioni non classificate', m.cieli);
  att('la città resta la sua', 'Milano', m.stato);
  const giu = await (async () => { stato.giu = true; const x = await pg.evaluate(async () => { BSISpectraRisveglio.imposta({ meteo: null }); const r = BSISpectraAgenda.comando('che tempo fa'); return await r.promessa; }); stato.giu = false; return x; })();
  vero('senza rete lo dice, non inventa: «' + giu + '»', /non risponde/.test(giu));

  console.log('\n── Il punto della situazione ──');
  const p = await pg.evaluate(async () => {
    const R = BSISpectraRisveglio, A = BSISpectraAgenda, o = {}; A.azzera(); R.imposta({ meteo: null });
    const ORA = new Date(2026, 10, 12, 8, 5).getTime();
    o.vuoto = R.fraseImpegni('domani', ORA);
    A.aggiungi('lezione di Organica 2', { genere: 'evento', quando: new Date(2026, 10, 12, 10, 30).getTime() });
    A.aggiungi('chiamare il relatore', { quando: new Date(2026, 10, 12, 18, 0).getTime() });
    A.aggiungi('esame di Spettroscopia', { genere: 'evento', quando: new Date(2026, 10, 13, 9, 0).getTime() });
    o.oggi = R.fraseImpegni('oggi', ORA); o.domani = R.fraseImpegni('domani', ORA);
    o.casa = await R.punto('casa', ORA);
    /* alle 8 e alle 20, solo dopo il primo risveglio, una volta per fascia */
    R.imposta({ armato: false, briefing: true, fatti: {} });
    o.nonArmato = R.controllaPunto(ORA);
    R.imposta({ armato: true });
    const pm = R.controllaPunto(ORA); o.mattina = pm ? await pm : null;
    o.ancora = R.controllaPunto(ORA + 30 * 60000);
    o.pomeriggio = R.controllaPunto(new Date(2026, 10, 12, 15, 0).getTime());
    const ps = R.controllaPunto(new Date(2026, 10, 12, 20, 10).getTime()); o.sera = ps ? await ps : null;
    o.avviso = [...document.querySelectorAll('.bsiAG-avviso')].map(n => n.textContent).join(' || ');
    await new Promise(r => setTimeout(r, 400));
    o.detto = speechSynthesis.frasi.map(f => f.t).join(' ');
    R.imposta({ briefing: false, fatti: {} }); o.spento = R.controllaPunto(ORA);
    o.disattiva = A.comando('disattiva il punto').testo; o.attiva = A.comando('attiva il punto').testo; o.dopo = R.stato().briefing;
    R.imposta({ fatti: {}, armato: false });
    document.querySelectorAll('.bsiAG-avviso').forEach(n => n.remove()); A.azzera();
    return o;
  });
  att('domani senza impegni', 'Domani non hai impegni segnati.', p.vuoto);
  att('gli impegni di oggi', 'Oggi hai 2 impegni: lezione di Organica 2 alle 10:30; chiamare il relatore alle 18.', p.oggi);
  att('e quelli di domani', 'Domani hai un impegno: esame di Spettroscopia alle 9.', p.domani);
  vero('«sono a casa»: bentornato, meteo, oggi, domani — «' + p.casa.slice(0, 70) + '…»', /^Bentornato a casa\. Fuori, a Milano ci sono 13 gradi/.test(p.casa) && /Oggi hai 2 impegni/.test(p.casa) && /Domani hai un impegno/.test(p.casa));
  att('prima del primo risveglio, nessun punto automatico', null, p.nonArmato);
  vero('alle 8:05 il punto del mattino: «' + (p.mattina || '').slice(0, 60) + '…»', /^Buongiorno\. Fuori, a Milano/.test(p.mattina || '') && /Oggi hai 2 impegni/.test(p.mattina || '') && !/Domani/.test(p.mattina || ''));
  att('una volta sola nella fascia', null, p.ancora);
  att('il pomeriggio niente', null, p.pomeriggio);
  vero('alle 20:10 il punto della sera, con domani e il meteo di domani', /^Buonasera\. Il punto della sera\. Domani hai un impegno: esame di Spettroscopia alle 9\. Domani a Milano: pioggia debole/.test(p.sera || ''));
  vero('scritto sullo schermo', /🌅 Buongiorno/.test(p.avviso) && /🌙 Buonasera/.test(p.avviso));
  /* il secondo punto interrompe il primo, come deve: di ciascuno si sente almeno l'inizio */
  vero('e detto a voce («' + p.detto.slice(0, 60) + '…»)', /Buongiorno\./.test(p.detto) && /punto della sera/.test(p.detto));
  att('spento, tace', null, p.spento);
  vero('si spegne e si riaccende a parole', /niente punto/.test(p.disattiva) && /alle 8 il punto del mattino/.test(p.attiva) && p.dopo === true);

  console.log('\n── Il risveglio ──');
  const r = await pg.evaluate(async () => {
    const pausa = ms => new Promise(r => setTimeout(r, ms)), R = BSISpectraRisveglio, A = BSISpectraAgenda, o = {};
    speechSynthesis.frasi.length = 0;
    localStorage.setItem('bsi_ai_memory', JSON.stringify([{ fatto: 'Prepara l\'esame di Spettroscopia molecolare', categoria: 'esame' }]));
    const x = A.comando('Spectra, svegliati!'); o.risposta = x && x.testo; o.muto = x && x.muto;
    await pausa(150);
    const P = document.getElementById('bsiRV'); o.aperto = !!P;
    o.dialogo = P && P.getAttribute('role') === 'dialog';
    o.righe = [...P.querySelectorAll('ol.stato li')].map(li => [...li.children].map(s => s.textContent).join(' ').replace(/\s+/g, ' ').trim());
    await pausa(4200);
    o.visibili = P.querySelectorAll('ol.stato li.vis').length;
    o.guidaVisibile = [...P.querySelectorAll('.scorciatoie li')].every(li => getComputedStyle(li).opacity === '1');
    o.messaggio = P.querySelector('.messaggio').textContent;
    o.detto = speechSynthesis.frasi.map(f => f.t).join(' ');
    o.parametri = [...new Set(speechSynthesis.frasi.map(f => f.p + '/' + f.r))].join(' ');
    o.armato = R.stato().armato;
    o.largo = document.documentElement.scrollWidth <= innerWidth + 1 && P.scrollWidth <= P.clientWidth + 1;
    o.tasti = [...P.querySelectorAll('.azioni button')].every(b => b.getBoundingClientRect().height >= 40);
    const bs = [...P.querySelectorAll('button')].filter(b => /Siri/.test(b.textContent))[0]; bs.click(); await pausa(50);
    const sc = P.querySelector('.scorciatoie'); o.siri = !sc.hasAttribute('hidden') && /Ehi Siri, sveglia Spectra/.test(sc.textContent) && /index\.html\?spectra=sveglia$/.test(sc.querySelector('code').textContent);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); o.chiuso = !document.getElementById('bsiRV');
    localStorage.removeItem('bsi_ai_memory');
    return o;
  });
  att('il comando', 'Sequenza di risveglio avviata.', r.risposta);
  vero('la schermata di avvio, come dialogo', r.aperto && r.dialogo);
  vero('le righe: ' + r.righe.join(' / '), r.righe.length === 6 && /^Inizializzazione dei sistemi completata/.test(r.righe[0]) && /^Rete neurale online · \d+ neuron[ei], \d+ collegament[oi]/.test(r.righe[1]) && /^Memoria 1 ricordo · /.test(r.righe[3]) && /^Meteo Milano$/.test(r.righe[4]) && /^Sintesi vocale pronta$/.test(r.righe[5]));
  vero('senza chiave lo dice: «' + r.righe[2] + '»', /in locale/.test(r.righe[2]));
  att('le righe compaiono una dopo l\'altra', 6, r.visibili);
  vero('e lo stile delle righe non nasconde gli elenchi della guida', r.guidaVisibile);
  vero('il punto sullo schermo: «' + r.messaggio.slice(0, 70) + '…»', /^(Buongiorno|Buon pomeriggio|Buonasera|Ancora sveglio)\. Fuori, a Milano ci sono 13 gradi/.test(r.messaggio));
  vero('e a voce, dall\'avvio: «' + r.detto.slice(0, 80) + '…»', /Inizializzazione dei sistemi completata\. Rete neurale online\. Lavoro in locale/.test(r.detto) && /Sintesi vocale pronta/.test(r.detto) && /13 gradi/.test(r.detto));
  att('con la voce di Spectra', '0.58/0.88', r.parametri);
  vero('da ora il punto delle 8 e delle 20 è attivo', r.armato);
  vero('nessuno scorrimento orizzontale sul telefono', r.largo);
  vero('pulsanti da un dito', r.tasti);
  vero('le istruzioni per Siri e la Home, con il link giusto', r.siri);
  vero('Esc chiude', r.chiuso);

  console.log('\n── La batteria ──');
  const t = await pg.evaluate(async () => {
    const pausa = ms => new Promise(r => setTimeout(r, ms)), R = BSISpectraRisveglio, o = {};
    document.querySelectorAll('.bsiAG-avviso').forEach(n => n.remove());
    R.batteria(0.42, false); o.normale = document.body.classList.contains('bsi-batteria-bassa');
    R.risveglio({ rapido: true }); await pausa(100);
    const icona = document.querySelector('#bsiRV .bsiRV-batt'); o.icona = icona.getAttribute('aria-label'); o.colore42 = icona.querySelector('.liv').style.background;
    o.bassa = R.batteria(0.15, false).bassa; await pausa(50);
    o.classe = document.body.classList.contains('bsi-batteria-bassa');
    o.filtro = getComputedStyle(document.getElementById('bsiRV')).filter;
    o.colore15 = document.querySelector('#bsiRV .bsiRV-batt .liv').style.background;
    o.avvisi = [...document.querySelectorAll('.bsiAG-avviso')].map(n => n.textContent).filter(x => /Batteria/.test(x));
    R.batteria(0.14, false); o.ripetuto = [...document.querySelectorAll('.bsiAG-avviso')].filter(n => /Batteria/.test(n.textContent)).length;
    o.comando = BSISpectraAgenda.comando('quanta batteria ho?').testo;
    R.batteria(0.16, true); o.inCarica = document.body.classList.contains('bsi-batteria-bassa');
    R.chiudi(); document.querySelectorAll('.bsiAG-avviso').forEach(n => n.remove());
    return o;
  });
  att('al 42% il tema resta ciano', false, t.normale);
  att('l\'icona dice livello e stato', 'Batteria al 42 per cento', t.icona);
  vero('e il colore cambia col livello (' + t.colore42 + ' → ' + t.colore15 + ')', t.colore42 !== t.colore15 && /rgb\((2\d\d|1\d\d), (\d\d|1\d\d)/.test(t.colore15));
  vero('sotto il 20% senza caricatore: tema rosso', t.bassa && t.classe && /hue-rotate/.test(t.filtro));
  vero('con un avviso: «' + (t.avvisi[0] || '') + '»', t.avvisi.length === 1 && /Batteria al 15 per cento\. Collega il caricatore\./.test(t.avvisi[0]));
  att('l\'avviso non si ripete a ogni punto percentuale', 1, t.ripetuto);
  att('«quanta batteria ho?»', 'Batteria al 14 per cento. Collega il caricatore.', t.comando);
  att('col caricatore torna ciano', false, t.inCarica);

  console.log('\n── La rete neurale ──');
  const n = await pg.evaluate(async () => {
    const pausa = ms => new Promise(r => setTimeout(r, ms)), R = BSISpectraRisveglio, A = BSISpectraAgenda, o = {}, ora = Date.now();
    const K = 'bsi-spectra-mente-v1', primaM = localStorage.getItem(K); A.azzera();
    localStorage.setItem('bsi_ai_memory', JSON.stringify([{ fatto: 'Prepara l\'esame di Spettroscopia molecolare', categoria: 'esame' }, { fatto: 'Fatica con i meccanismi delle pericicliche', categoria: 'difficolta' }]));
    localStorage.setItem(K, JSON.stringify({ nato: ora - 9e8, episodi: [
      { t: ora - 3e6, m: 'chimica', s: 'sirvis', d: 'Come si legge uno spettro infrarosso del carbonile?', e: 'modello' },
      { t: ora - 2.9e6, m: 'chimica', s: 'sirvis', d: 'E nello spettro infrarosso di un estere?', e: 'modello' },
      { t: ora - 1e5, m: 'chimica', s: null, d: 'Spiegami le reazioni pericicliche e la regola di Woodward', e: 'modello' } ],
      sezioni: { sirvis: { s: 900, n: 3, ultima: ora, materia: 'chimica' } }, ore: new Array(24).fill(0), materie: { chimica: 900, fisica: 0, matematica: 0 } }));
    A.aggiungi('esame di Spettroscopia molecolare', { genere: 'evento', quando: 'domani alle 9' });
    const G = R.grafo(); o.neuroni = G.neuroni.length; o.tipi = G.neuroni.map(x => x.tipo[0]).join('');
    o.legami = G.collegamenti.map(l => G.neuroni[l.a].tipo[0] + G.neuroni[l.b].tipo[0]).sort().join(',');
    o.esame = G.collegamenti.some(l => /Spettroscopia/.test(G.neuroni[l.a].testo) && /Spettroscopia/.test(G.neuroni[l.b].testo) && G.neuroni[l.a].tipo !== G.neuroni[l.b].tipo);
    o.pericicliche = G.collegamenti.some(l => /pericicliche/i.test(G.neuroni[l.a].testo) && /pericicliche/i.test(G.neuroni[l.b].testo));
    o.sezione = G.collegamenti.some(l => (G.neuroni[l.a].tipo === 'sezione') !== (G.neuroni[l.b].tipo === 'sezione'));
    const x = A.comando('mostrami la tua rete neurale'); o.risposta = x.testo; await pausa(400);
    const P = document.getElementById('bsiRN'), cv = P.querySelector('canvas'), rc = cv.getBoundingClientRect();
    o.conta = P.querySelector('.conta').textContent; o.tela = rc.width > 300 && rc.height > 250 && cv.width >= rc.width;
    const px = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let acceso = 0; for (let i = 3; i < px.length; i += 4) if (px[i] > 0) acceso++; o.disegnata = acceso > 200;
    /* tocca il neurone più collegato */
    const N = R.grafo().neuroni; let trovato = ''; for (let yy = 10; yy < rc.height && !trovato; yy += 6) for (let xx = 10; xx < rc.width && !trovato; xx += 6) {
      cv.dispatchEvent(new PointerEvent('pointerdown', { clientX: rc.left + xx, clientY: rc.top + yy, bubbles: true }));
      const s = P.querySelector('.scelto').textContent; if (/—/.test(s)) trovato = s; }
    o.tocco = trovato;
    o.largo = document.documentElement.scrollWidth <= innerWidth + 1;
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); o.chiusa = !document.getElementById('bsiRN');
    localStorage.removeItem('bsi_ai_memory'); if (primaM == null) localStorage.removeItem(K); else localStorage.setItem(K, primaM); A.azzera();
    const V = R.apriRete(); o.vuota = /ancora vuota/.test(V.el.querySelector('.scelto').textContent) || V.grafo.neuroni.length > 0; R.chiudiRete();
    return o;
  });
  att('i neuroni sono i ricordi veri: 2 ricordi, 3 conversazioni, 1 impegno, 1 sezione', 'rrccciS'.toLowerCase(), n.tipi.toLowerCase().replace(/s$/, 's'));
  vero('l\'esame (ricordo) e l\'impegno dell\'esame sono collegati', n.esame);
  vero('le pericicliche (ricordo e domanda) sono collegate', n.pericicliche);
  vero('le domande sull\'IR sono collegate alla sezione dove sono state fatte', n.sezione);
  vero('«mostrami la tua rete neurale»: ' + n.risposta, /^La mia rete: 7 neuroni e \d+ collegament[oi]\./.test(n.risposta));
  vero('il conteggio sullo schermo: ' + n.conta, /^7 neuroni · \d+ collegament[oi]$/.test(n.conta));
  vero('la tela ha la sua misura ed è disegnata', n.tela && n.disegnata);
  vero('toccando un neurone si legge il ricordo: «' + n.tocco.slice(0, 70) + '»', /^(🧠 Ricordo|💬 Conversazione|🗓️ Impegno|📚 Sezione) — /.test(n.tocco));
  vero('nessuno scorrimento orizzontale', n.largo);
  vero('Esc chiude; vuota, lo dice', n.chiusa && n.vuota);

  console.log('\n── Per il modello, nella Chat e nella console ──');
  const s = await pg.evaluate(async () => {
    const pausa = ms => new Promise(r => setTimeout(r, ms)), R = BSISpectraRisveglio, T = window.BSI_AI_TOOLS, o = {};
    o.strumento = T.filter(x => x.name === 'meteo').length; o.totale = T.length;
    o.esegui = await T.filter(x => x.name === 'meteo')[0].execute({ citta: 'Roma', giorno: 'domani' });
    const c = R.stato(); R.imposta({ citta: null }); o.senza = await T.filter(x => x.name === 'meteo')[0].execute({}); R.imposta({ citta: c.citta });
    localStorage.removeItem('bsi_api_keys');
    bsiOpenAIHub('chat'); await pausa(1200);
    const i = document.getElementById('bsi-hub-input'); i.value = 'che tempo fa a Roma?'; await _bsiHubChatInternal.send(); await pausa(300);
    const msg = [...document.querySelectorAll('#bsi-hub-msgs .bsi-msg.assistant')].map(n => n.textContent.trim());
    o.chat = msg[msg.length - 1] || '';
    const ch = document.getElementById('bsi-hub-close'); if (ch) ch.click(); await pausa(200);
    const L = BSISpectraLive.comando('Spectra, sono a casa'); o.console = L && L.testo; o.consolePromessa = L && L.promessa ? await L.promessa : null;
    return o;
  });
  att('lo strumento «meteo» registrato una volta', 1, s.strumento);
  att('53 strumenti in tutto (con leggi_teoria e cerca_nella_memoria)', 53, s.totale);
  vero('lo strumento risponde con dati e frase: ' + (s.esegui.frase || ''), s.esegui.ok && s.esegui.citta === 'Roma' && s.esegui.domani.max === 20 && /^Domani a Roma/.test(s.esegui.frase));
  vero('senza città dice al modello di chiederla', s.senza.ok === false && /chiedigliela/.test(s.senza.error));
  vero('nella Chat, senza chiave: «' + s.chat.slice(0, 60) + '»', /^A Roma ci sono 18 gradi/.test(s.chat));
  att('nessuna chiamata a un fornitore di modelli', 0, ai.length);
  vero('nella console: «' + s.console + '» poi «' + (s.consolePromessa || '').slice(0, 40) + '…»', s.console === 'Bentornato.' && /^Bentornato a casa\./.test(s.consolePromessa || ''));

  console.log('\n── Dalla Home e da Siri ──');
  const man = await pg.evaluate(async () => (await (await fetch('manifest.json')).json()).shortcuts || []);
  att('il manifesto dichiara quattro scorciatoie (le mostra Android tenendo premuta l\'icona)', 'Sveglia Spectra=./index.html?spectra=sveglia|Spectra in ascolto=./index.html?spectra=ascolto|Agenda di Spectra=./index.html?spectra=agenda|Rete neurale di Spectra=./index.html?spectra=rete', man.map(x => x.name + '=' + x.url).join('|'));
  const pg2 = await ctx.newPage(); pg2.on('pageerror', e => errs.push(e.message)); await pg2.addInitScript(sintesiFinta);
  /* aperta da Siri o dalla Home la pagina non ha ancora avuto un gesto dell'utente (il browser di prova invece lo segna sempre come avvenuto) */
  await pg2.addInitScript(() => { try { Object.defineProperty(navigator, 'userActivation', { configurable: true, value: { hasBeenActive: false, isActive: false } }); } catch (e) {} });
  await pg2.addInitScript(() => localStorage.setItem('bsi-spectra-risveglio-v1', JSON.stringify({ citta: 'Milano', lat: 45.46, lon: 9.19, armato: true, briefing: false, fatti: {} })));
  await pg2.goto(BASE + 'index.html?spectra=sveglia', { waitUntil: 'load', timeout: 120000 });
  await pg2.waitForSelector('#bsiRV', { timeout: 30000 });
  await pg2.waitForSelector('#bsiRV .tocca', { timeout: 15000 });
  const u = await pg2.evaluate(() => ({ url: location.search, detto: speechSynthesis.frasi.length, testo: document.querySelector('#bsiRV .tocca').textContent }));
  att('l\'indirizzo della scorciatoia apre il risveglio e si ripulisce', '', u.url);
  vero('aperta da Siri la pagina non può parlare da sola: chiede un tocco («' + u.testo + '»)', u.detto === 0 && /Tocca per svegliare Spectra/.test(u.testo));
  await pg2.click('#bsiRV .tocca'); await pg2.waitForFunction(() => speechSynthesis.frasi.length > 0, null, { timeout: 10000 });
  vero('dopo il tocco parla', /Inizializzazione dei sistemi completata/.test(await pg2.evaluate(() => speechSynthesis.frasi.map(f => f.t).join(' '))));
  const pg3 = await ctx.newPage(); pg3.on('pageerror', e => errs.push(e.message)); await pg3.addInitScript(sintesiFinta);
  await pg3.goto(BASE + 'index.html?spectra=rete', { waitUntil: 'load', timeout: 120000 }); await pg3.waitForSelector('#bsiRN', { timeout: 30000 });
  vero('?spectra=rete apre la rete neurale', true);
  /* (v252) il menu ✨ VERO, quello che si apre dal pulsante sul telefono: prima le voci stavano in un elenco che non si vedeva */
  const mn = await pg.evaluate(async () => {
    const pausa = ms => new Promise(r => setTimeout(r, ms)), o = {}, apri = async () => { document.getElementById('bsi14-fab').click(); await pausa(250); return document.getElementById('bsi14-sheet'); };
    const sh = await apri(); o.aperto = sh.classList.contains('open');
    /* in testa ci sono gli strumenti rapidi della materia aperta; poi le sezioni del menu, e la prima è Spectra */
    const secs = [...sh.querySelectorAll('.bsi14-sec')], sp = secs.filter(x => x.textContent === '🤖 Spectra')[0];
    o.sezione = sp ? sp.textContent : ''; o.primaSezione = sp && secs.filter(x => x.getBoundingClientRect().height > 0 && !/al volo/.test(x.textContent))[0] === sp;      // le sezioni «al volo» sono gli strumenti della materia, le altre nascoste
    const dopo = []; for (let n = sp && sp.nextElementSibling; n && !n.classList.contains('bsi14-sec'); n = n.nextElementSibling) dopo.push(n);
    o.prime = dopo.map(r => r.getAttribute('data-key')).join(',');
    o.visibili = dopo.length === 4 && dopo.every(r => { const b = r.getBoundingClientRect(); return b.height >= 40 && b.width > 200; });
    const tocca = async (k, sel) => { const s2 = await apri(); s2.querySelector('.bsi14-row[data-key="' + k + '"]').click(); await pausa(500); const x = !!document.querySelector(sel); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); BSISpectraAgenda.chiudi(); BSISpectraRisveglio.chiudi(); BSISpectraRisveglio.chiudiRete(); BSISpectraRisveglio.chiudiGuida(); await pausa(150); return x; };
    o.sveglia = await tocca('sveglia', '#bsiRV'); o.occhiali = await tocca('occhiali', '#bsiRD'); o.agenda = await tocca('agenda', '#bsiAG'); o.rete = await tocca('rete', '#bsiRN');
    return o;
  });
  vero('il menu ✨ vero si apre dal suo pulsante', mn.aperto);
  att('la sezione «🤖 Spectra» con le quattro voci', '🤖 Spectra|sveglia,occhiali,agenda,rete', mn.sezione + '|' + mn.prime);
  vero('ed è la prima sezione del menu, prima delle funzioni chimiche', mn.primaSezione);
  vero('righe grandi abbastanza da toccare', mn.visibili);
  vero('toccandole si aprono davvero: risveglio, occhiali, agenda, rete neurale', mn.sveglia && mn.occhiali && mn.agenda && mn.rete);
  /* le novità: a chi ha già parlato con Spectra, una volta sola */
  const nv = await pg.evaluate(async () => {
    const pausa = ms => new Promise(r => setTimeout(r, ms)), R = BSISpectraRisveglio, o = {}, K = 'bsi-spectra-mente-v1', prima = localStorage.getItem(K);
    localStorage.removeItem('bsi-spectra-novita-v252'); localStorage.setItem(K, JSON.stringify({ nato: 1, episodi: [] }));
    o.nuovo = R.novita() === null;
    localStorage.setItem(K, JSON.stringify({ nato: 1, episodi: [{ t: 1, d: 'a' }, { t: 2, d: 'b' }, { t: 3, d: 'c' }] }));
    const P = R.novita(); o.mostrate = !!P && P.querySelectorAll('.tasti button').length === 4;
    const r = P.getBoundingClientRect(); o.dentro = r.left >= 0 && r.right <= innerWidth && r.bottom <= innerHeight;
    P.querySelectorAll('.tasti button')[1].click(); await pausa(150); o.guida = !!document.getElementById('bsiRD') && !document.getElementById('bsiRV-novita'); R.chiudiGuida();
    o.unaVolta = R.novita() === null;
    if (prima == null) localStorage.removeItem(K); else localStorage.setItem(K, prima);
    return o;
  });
  vero('le novità non disturbano chi apre l\'app per la prima volta', nv.nuovo);
  vero('a chi ha già parlato con Spectra compaiono, con i quattro pulsanti, dentro lo schermo', nv.mostrate && nv.dentro);
  vero('un pulsante delle novità apre la sua finestra e le chiude', nv.guida);
  vero('e compaiono una volta sola', nv.unaVolta);
  vero('Open-Meteo è stato chiamato solo per le città chieste (' + stato.chiamate.length + ' richieste)', stato.chiamate.every(c => /geocoding-api\.open-meteo\.com\/v1\/search\?(Milano|Roma|Atlantide)$|api\.open-meteo\.com\/v1\/forecast\?(45\.46|41\.89)$/i.test(c)));


  console.log('\n── Gli occhiali e il nome «Spectra» ──');
  /* il riconoscimento vocale e il blocco dello schermo, finti: si registra ciò che la pagina chiede e le si fa «sentire» una frase */
  const finti = () => {
    window._ric = []; window._wl = { chieste: 0, rilasciate: 0 };
    window.SpeechRecognition = window.webkitSpeechRecognition = function () { window._ric.push(this); this.start = () => { this.attivo = true; }; this.abort = () => { this.attivo = false; }; this.stop = () => { this.attivo = false; }; };
    window._senti = frase => { const r = window._ric.filter(x => x.attivo && x.continuous).pop(); if (!r) return false; r.onresult({ resultIndex: 0, results: [Object.assign([{ transcript: frase }], { isFinal: true })] }); return true; };
    window._nega = () => { const r = window._ric.filter(x => x.attivo && x.continuous).pop(); if (r) { r.attivo = false; r.onerror({ error: 'not-allowed' }); } };
    try { Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: { request: () => { window._wl.chieste++; return Promise.resolve({ release() { window._wl.rilasciate++; return Promise.resolve(); }, addEventListener() {} }); } } }); } catch (e) {}
  };
  const pg4 = await ctx.newPage(); pg4.on('pageerror', e => errs.push(e.message)); await pg4.addInitScript(sintesiFinta); await pg4.addInitScript(finti);
  await pg4.addInitScript(() => { if (!sessionStorage.getItem('fatto')) { sessionStorage.setItem('fatto', '1'); localStorage.setItem('bsi-spectra-risveglio-v1', JSON.stringify({ citta: 'Milano', lat: 45.46, lon: 9.19, armato: false, briefing: false, fatti: {} })); } });
  await pg4.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
  await pg4.waitForFunction(() => !!(window.BSISpectraRisveglio && window.BSISpectraLive && window.BSISpectraAgenda), null, { timeout: 60000 });
  const o = await pg4.evaluate(async () => {
    const pausa = ms => new Promise(r => setTimeout(r, ms)), R = BSISpectraRisveglio, A = BSISpectraAgenda, L = BSISpectraLive, o = {};
    o.accesa = A.comando('Spectra, modalità occhiali').testo; await pausa(100);
    const rec = window._ric.filter(x => x.attivo && x.continuous).pop();
    o.ascolta = !!rec && rec.continuous === true && rec.lang === 'it-IT';
    o.chip = (document.querySelector('#bsiRV-chip.on') || {}).textContent || '';
    o.schermo = window._wl.chieste; o.ricordata = R.stato().ascolto;
    /* «sveglia Spectra», detto agli occhiali */
    window._senti('sveglia Spectra'); await pausa(150); o.sveglia = !!document.getElementById('bsiRV'); R.chiudi(); L.taci && L.taci(); await pausa(100);
    window._senti('Spectra svegliati'); await pausa(150); o.sveglia2 = !!document.getElementById('bsiRV'); R.chiudi(); L.taci && L.taci(); await pausa(100);
    /* una frase senza il nome non fa niente; con il nome, la domanda */
    speechSynthesis.frasi.length = 0; window._senti('domani vado a spettrometria di massa'); await pausa(300);
    o.ignorata = !document.getElementById('bsiJV') || !document.getElementById('bsiJV').classList.contains('aperto');
    window._senti('Spectra, che tempo fa?'); for (let k = 0; k < 60 && !speechSynthesis.frasi.some(f => /13 gradi/.test(f.t)); k++) await pausa(100);
    o.console = document.getElementById('bsiJV') && document.getElementById('bsiJV').classList.contains('aperto');
    o.risposta = speechSynthesis.frasi.map(f => f.t).join(' ');
    L.taci && L.taci(); L.chiudi && L.chiudi(); await pausa(200);
    /* mentre parla non ascolta: non sente se stesso */
    L.parla('Questa è una frase lunga. E questa è la seconda. E la terza. E la quarta. E la quinta.');
    window._senti('Spectra, cosa ho da fare?'); await pausa(200); o.seStesso = !document.getElementById('bsiAG');
    L.taci && L.taci(); await pausa(200);
    /* il browser ferma il microfono: compare il pulsante per riprendere */
    window._nega(); await pausa(100);
    o.fermo = !!document.querySelector('#bsiRV-chip.fermo .riprendi');
    document.querySelector('#bsiRV-chip.fermo .riprendi').click(); await pausa(100); o.ripresa = !!document.querySelector('#bsiRV-chip.on') && window._ric.some(x => x.attivo && x.continuous);
    o.largo = document.documentElement.scrollWidth <= innerWidth + 1; const cr = document.getElementById('bsiRV-chip').getBoundingClientRect(); o.chipDentro = cr.left >= 0 && cr.right <= innerWidth && cr.bottom <= innerHeight;
    return o;
  });
  vero('«modalità occhiali»: ' + o.accesa.slice(0, 70) + '…', /^Modalità occhiali accesa/.test(o.accesa));
  vero('ascolta in continuo, in italiano', o.ascolta);
  vero('lo dice in basso: «' + o.chip + '»', /In ascolto: di' «Spectra…»/.test(o.chip));
  vero('tiene lo schermo acceso (blocco dello schermo chiesto)', o.schermo >= 1);
  vero('e se lo ricorda', o.ricordata === true);
  vero('«sveglia Spectra» detto agli occhiali apre il risveglio', o.sveglia);
  vero('anche «Spectra svegliati»', o.sveglia2);
  vero('«domani vado a spettrometria» non lo chiama', o.ignorata);
  vero('«Spectra, che tempo fa?» apre la console e risponde a voce: «' + o.risposta.slice(0, 50) + '…»', o.console && /A Milano ci sono 13 gradi/.test(o.risposta));
  vero('mentre parla non sente se stesso', o.seStesso);
  vero('se il browser ferma il microfono compare «Tocca per riprendere l\'ascolto», e il tocco lo riprende', o.fermo && o.ripresa);
  vero('il segnale in basso sta nello schermo del telefono', o.largo && o.chipDentro);

  /* riaperta l'app, la modalità riparte da sola */
  await pg4.reload({ waitUntil: 'load' }); await pg4.waitForFunction(() => !!window.BSISpectraRisveglio, null, { timeout: 60000 });
  await pg4.waitForSelector('#bsiRV-chip.on', { timeout: 15000 });
  const q = await pg4.evaluate(async () => {
    const pausa = ms => new Promise(r => setTimeout(r, ms)), R = BSISpectraRisveglio, A = BSISpectraAgenda, o = {};
    o.riparte = window._ric.some(x => x.attivo && x.continuous) && window._wl.chieste >= 1;
    o.spenta = A.comando('smetti di ascoltare').testo; await pausa(100);
    o.dopo = !document.getElementById('bsiRV-chip') && !window._ric.some(x => x.attivo && x.continuous) && window._wl.rilasciate >= 1 && R.stato().ascolto === false;
    /* la guida */
    o.guida = A.comando('come ti sveglio?').testo; await pausa(100);
    const G = document.getElementById('bsiRD'); o.sezioni = [...G.querySelectorAll('h3')].map(h => h.textContent).join(' | ');
    o.link = /index\.html\?spectra=sveglia$/.test(G.querySelector('code').textContent);
    const [bo, ba] = G.querySelectorAll('.interruttori button');
    bo.click(); await pausa(100); o.toggleOcchiali = bo.getAttribute('aria-pressed') === 'true' && !!document.querySelector('#bsiRV-chip.on');
    bo.click(); await pausa(100); o.toggleOcchiali2 = bo.getAttribute('aria-pressed') === 'false' && !document.getElementById('bsiRV-chip');
    ba.click(); await pausa(50); o.apertura = ba.getAttribute('aria-pressed') === 'true' && R.stato().avvioSveglia === true;
    o.largo = document.documentElement.scrollWidth <= innerWidth + 1 && G.scrollWidth <= G.clientWidth + 1;
    o.tasti = [...G.querySelectorAll('button')].every(b => b.getBoundingClientRect().height >= 40);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); o.chiusa = !document.getElementById('bsiRD');
    return o;
  });
  vero('riaperta l\'app, la modalità occhiali riparte da sola (ascolto e schermo)', q.riparte);
  vero('«smetti di ascoltare» spegne tutto: ' + q.spenta, /^Ascolto spento/.test(q.spenta) && q.dopo);
  vero('«come ti sveglio?» apre la guida: ' + q.sezioni, /Dagli occhiali Meta/.test(q.sezioni) && /Ehi Siri, sveglia Spectra/.test(q.sezioni) && /Ok Google, apri BioSpecInfo/.test(q.sezioni) && /Computer/.test(q.sezioni) && q.link);
  vero('l\'interruttore della modalità occhiali accende e spegne davvero', q.toggleOcchiali && q.toggleOcchiali2);
  vero('«Sveglia Spectra a ogni apertura» si accende', q.apertura);
  vero('la guida sta nel telefono, con pulsanti da un dito', q.largo && q.tasti);
  vero('Esc chiude la guida', q.chiusa);

  /* con «sveglia all'apertura»: «Ok Google, apri BioSpecInfo» → Spectra si sveglia */
  await pg4.addInitScript(() => { try { Object.defineProperty(navigator, 'userActivation', { configurable: true, value: { hasBeenActive: false, isActive: false } }); } catch (e) {} });
  await pg4.reload({ waitUntil: 'load' });
  await pg4.waitForSelector('#bsiRV .tocca', { timeout: 20000 });
  vero('con «sveglia a ogni apertura», aprire l\'app sveglia Spectra (e chiede un tocco per parlare)', true);
  const pg5 = await ctx.newPage(); pg5.on('pageerror', e => errs.push(e.message)); await pg5.addInitScript(sintesiFinta); await pg5.addInitScript(finti);
  await pg5.goto(BASE + 'index.html?spectra=ascolto', { waitUntil: 'load', timeout: 120000 }); await pg5.waitForSelector('#bsiRV-chip', { timeout: 20000 });
  vero('la scorciatoia «Spectra in ascolto» (?spectra=ascolto) accende la modalità occhiali', await pg5.evaluate(() => window._ric.some(x => x.continuous)));
  const pg6 = await ctx.newPage(); pg6.on('pageerror', e => errs.push(e.message)); await pg6.addInitScript(sintesiFinta);
  await pg6.addInitScript(() => { try { delete window.SpeechRecognition; delete window.webkitSpeechRecognition; } catch (e) {} window.SpeechRecognition = undefined; window.webkitSpeechRecognition = undefined; });
  await pg6.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 }); await pg6.waitForFunction(() => !!window.BSISpectraAgenda, null, { timeout: 60000 });
  const senza = await pg6.evaluate(() => BSISpectraAgenda.comando('modalità occhiali').testo);
  vero('un browser senza riconoscimento vocale lo dice: «' + senza.slice(0, 60) + '…»', /non riconosce la voce in continuo/.test(senza));

  att('nessun errore JavaScript', 0, errs.length);
  errs.slice(0, 3).forEach(x => console.log('      ! ' + x.slice(0, 200)));
  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
