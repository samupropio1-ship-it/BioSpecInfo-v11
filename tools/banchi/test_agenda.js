#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   test_agenda — Spectra come assistente di ogni giorno, dentro l'app

   PERCHE' QUESTO BANCO ESISTE

   Richiesta dell'autore (v251): Spectra deve essere una presenza continua e
   un assistente personale, e deve funzionare SENZA installare nulla: l'autore
   non riesce a mettere in piedi il servizio su un computer. Quindi agenda,
   promemoria, continuita' e memoria trasportabile girano nel browser
   (bsi-spectra-agenda.js).

   Il banco pretende:
   · le date dette a parole capite come nel servizio Python (tredici casi), e
     quelle non capite RIFIUTATE, mai inventate;
   · «ricordami domani alle 18 di…» segnato senza modello, senza chiave e
     senza rete, dalla Chat e dalla console; «ricordami la formula del
     benzene» NON scambiata per un promemoria;
   · il promemoria che arriva all'ora: scritto, detto a voce con i parametri
     di Spectra, una volta sola; quello scaduto ad app chiusa detto alla
     riapertura;
   · ricorrenze, rinvio, annullamento, fine mese;
   · i tre strumenti per il modello registrati, con l'errore di data che
     torna al modello;
   · il blocco [CONTINUITA'] e [AGENDA] dentro il quadro che va al modello;
   · la memoria esportata e reimportata; un file qualunque non scrive nulla;
   · il pannello sul telefono: senza scorrimento orizzontale, con i pulsanti
     «Fatto» e «Annulla», aperto dal menu.

   NON PROVATO: la notifica di sistema vera, il suono di un telefono, e cio'
   che per costruzione non puo' accadere: un promemoria ad app chiusa.

   USO   node tools/banchi/test_agenda.js    (serve un server su :8899)
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
    speak(u) { this.frasi.push({ t: u.text, p: u.pitch, r: u.rate, v: u.volume }); if (u.volume === 0) return; const me = this; me.speaking = true; me._t = setTimeout(() => { me.speaking = false; if (u.onend) u.onend(); }, 30); } };
  Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: S });
  window.SpeechSynthesisUtterance = function (t) { this.text = t; this.pitch = 1; this.rate = 1; this.volume = 1; this.voice = null; this.lang = ''; };
  try { localStorage.setItem('bsi_guide_v3', '1'); } catch (e) {}
}

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const ctx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true, timezoneId: 'Europe/Rome', locale: 'it-IT' });
  const pg = await ctx.newPage(), errs = [], rete = [];
  pg.on('pageerror', e => errs.push(e.message));
  pg.on('request', r => { if (/googleapis|anthropic|groq|openrouter|x\.ai/.test(r.url())) rete.push(r.url()); });
  await pg.addInitScript(sintesiFinta);
  await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
  await pg.waitForFunction(() => !!(window.BSISpectraAgenda && window.bsiOpenAIHub && window.BSISpectraLive && window.BSI_AI_TOOLS), null, { timeout: 60000 });

  console.log('\n── Le date dette a parole ──');
  const d = await pg.evaluate(() => {
    const A = BSISpectraAgenda, MER = new Date(2026, 10, 11, 14, 0).getTime();      // mercoledi' 11 novembre 2026, ore 14
    const f = q => q == null ? null : new Date(q).toLocaleString('it-IT', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', '');
    const casi = ['fra 2 ore', "tra mezz'ora", 'domani alle 18', 'venerdì alle 9:30', 'stasera', 'il 12 febbraio alle 9', '2026-12-01T08:15', '2026-12-01', 'alle 10', 'alle 16', 'dopodomani mattina', 'mercoledì', 'alle 6 di sera'];
    return { capite: casi.map(c => f(A.capisciQuando(c, MER))), rifiutate: ['boh', '', 'quando capita', 'il 31 febbraio', '2026-02-31'].map(c => A.capisciQuando(c, MER)) };
  });
  att('tredici modi di dire una data, capiti come nel servizio',
    'mer 11/11/2026 16:00|mer 11/11/2026 14:30|gio 12/11/2026 18:00|ven 13/11/2026 09:30|mer 11/11/2026 20:00|ven 12/02/2027 09:00|mar 01/12/2026 08:15|mar 01/12/2026 09:00|gio 12/11/2026 10:00|mer 11/11/2026 16:00|ven 13/11/2026 09:00|mer 18/11/2026 09:00|mer 11/11/2026 18:00',
    d.capite.join('|'));
  att('una data non capita resta non capita: mai inventata', 'null,null,null,null,null', d.rifiutate.map(String).join(','));

  console.log('\n── I comandi, senza modello ──');
  const c = await pg.evaluate(() => {
    const A = BSISpectraAgenda, o = {}; A.azzera();
    const hm = v => { const x = new Date(v.quando); return x.getHours() + ':' + ('0' + x.getMinutes()).slice(-2); };
    o.uno = A.comando('Spectra, ricordami domani alle 18 di chiamare il relatore.').testo;
    o.due = A.comando('ricordami di comprare i guanti in nitrile fra 2 ore').testo;
    o.tre = A.comando("Ricordami che venerdì alle 9:30 ho l'esame di Organica").testo;
    o.voci = A.aperti().map(v => v.testo + ' @' + hm(v));
    o.senzaOra = A.comando('ricordami di telefonare a casa').testo;
    o.domanda = A.comando('ricordami la formula del benzene');
    o.altro = A.comando('spiegami la Diels-Alder') || A.comando('ho fatto un errore nel bilanciamento');
    o.fatto = A.comando('ho fatto: comprare i guanti') || A.comando('ho fatto comprare i guanti');
    o.annulla = A.comando('annulla il promemoria del relatore').testo;
    o.restano = A.aperti().length;
    o.elenco = A.comando('cosa ho da fare?').testo; o.pannello = !!document.getElementById('bsiAG'); A.chiudi();
    o.assurda = (() => { try { A.aggiungi('x', { quando: 'quando capita' }); return 'accettata'; } catch (e) { return e.message.slice(0, 18); } })();
    o.senzaData = (() => { try { A.aggiungi('x', { genere: 'promemoria' }); return 'accettato'; } catch (e) { return 'rifiutato'; } })();
    return o;
  });
  vero('«ricordami domani alle 18 di chiamare il relatore» → ' + c.uno, /^Segnato: chiamare il relatore — domani alle 18:00\.$/.test(c.uno));
  vero('l\'ora detta DOPO la cosa → ' + c.due, /^Segnato: comprare i guanti in nitrile — /.test(c.due));
  vero('«ricordami che venerdì alle 9:30 ho l\'esame» → ' + c.tre, /^Segnato: ho l'esame di Organica — .* alle 09:30\.$/.test(c.tre));
  att('tre voci, con le ore giuste', 3, c.voci.length);
  vero('senza un\'ora, lo chiede: «' + c.senzaOra.slice(0, 40) + '…»', /^Quando te lo devo ricordare/.test(c.senzaOra));
  att('«ricordami la formula del benzene» non è un promemoria: va al modello', null, c.domanda);
  att('una frase qualunque non è cosa dell\'agenda', null, c.altro);
  vero('«ho fatto comprare i guanti» lo chiude', c.fatto && /^Fatto: comprare i guanti/.test(c.fatto.testo));
  att('«annulla il promemoria del relatore»', 'Annullato: chiamare il relatore.', c.annulla);
  att('resta un impegno', 1, c.restano);
  vero('«cosa ho da fare?» lo dice e apre il pannello: ' + c.elenco, /^Hai un impegno: ho l'esame/.test(c.elenco) && c.pannello);
  att('una data assurda è rifiutata', 'non capisco quando', c.assurda);
  att('un promemoria senza ora è rifiutato', 'rifiutato', c.senzaData);

  console.log('\n── Il promemoria che arriva ──');
  const p = await pg.evaluate(async () => {
    const pausa = ms => new Promise(r => setTimeout(r, ms)), A = BSISpectraAgenda, S = speechSynthesis, o = {}; A.azzera(); S.frasi.length = 0;
    let evento = null; document.addEventListener('bsi-spectra-promemoria', e => { evento = e.detail; });
    const T = Date.now(), v = A.aggiungi('uscire per il laboratorio', { quando: T + 3600000, anticipoMinuti: 15 });
    o.prima = A.battito(T).length;
    o.entro = A.battito(T + 46 * 60000);                      // 14 minuti prima: dentro l'anticipo
    await pausa(500);
    o.avviso = (document.querySelector('.bsiAG-avviso') || {}).textContent || '';
    o.detto = S.frasi.filter(f => f.v !== 0).map(f => f.t).join(' '); o.parametri = [...new Set(S.frasi.filter(f => f.v !== 0).map(f => f.p + '/' + f.r))].join(' ');
    o.evento = evento && evento.voci.length;
    o.ancora = A.battito(T + 50 * 60000).length; o.aperto = A.aperti().length;
    /* scaduto ad app chiusa: alla riapertura si dice «era per…» */
    A.azzera(); A.aggiungi('prendere la pastiglia', { quando: T - 3 * 3600000 });
    o.tardi = A.battito(T)[0];
    /* ricorrenze */
    A.azzera(); const MER = new Date(2026, 10, 11, 14, 0).getTime(), f = q => new Date(q).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', '');
    const g = A.aggiungi('ripasso delle flashcard', { quando: 'alle 21', ripeti: 'giorno', ora: MER });
    const s1 = A.completa(g.id, MER + 8 * 3600000); o.giorno = f(s1.quando);
    o.inRitardo = A.completa(s1.id, MER + 5 * 86400000).quando > MER + 5 * 86400000;
    const m = A.aggiungi('affitto', { genere: 'compito', quando: '2027-01-31T10:00', ripeti: 'mese' }); o.mese = f(A.completa(m.id, MER).quando);
    const r = A.aggiungi('consegnare la relazione', { genere: 'compito', quando: 'venerdì alle 12', ora: MER }); o.rimandato = f(A.rimanda(r.id, 'lunedì alle 9', MER).quando);
    o.estratto = A.estratto(MER + 6 * 86400000).split('\n')[0];
    A.azzera(); document.querySelectorAll('.bsiAG-avviso').forEach(n => n.remove());
    return o;
  });
  att('prima dell\'ora non dice nulla', 0, p.prima);
  vero('dentro l\'anticipo lo dice: «' + p.entro[0] + '»', /^Promemoria: uscire per il laboratorio — oggi alle|^Promemoria: uscire per il laboratorio — domani alle/.test(p.entro[0] || ''));
  vero('compare scritto sullo schermo', /uscire per il laboratorio/.test(p.avviso));
  vero('ed è detto a voce: «' + p.detto.slice(0, 50) + '»', /uscire per il laboratorio/.test(p.detto));
  att('con la voce di Spectra (tono/velocità)', '0.58/0.88', p.parametri);
  att('parte l\'evento per il resto dell\'app', 1, p.evento);
  att('detto una volta sola', 0, p.ancora);
  att('ma resta aperto finché non è fatto', 1, p.aperto);
  vero('scaduto ad app chiusa: alla riapertura dice quando era: «' + p.tardi + '»', /^Promemoria: prendere la pastiglia — era per oggi alle|era per ieri alle/.test(p.tardi || ''));
  att('ogni giorno: il prossimo è domani alla stessa ora', '12/11/2026 21:00', p.giorno);
  vero('completato con giorni di ritardo: il prossimo è nel futuro', p.inRitardo);
  att('ogni mese dal 31 gennaio: l\'ultimo giorno di febbraio', '28/02/2027 10:00', p.mese);
  att('rimandato a lunedì alle 9', '16/11/2026 09:00', p.rimandato);
  vero('nell\'estratto lo scaduto è segnato: ' + p.estratto, /^! /.test(p.estratto));

  console.log('\n── Per il modello: strumenti e continuità ──');
  const m = await pg.evaluate(() => {
    const A = BSISpectraAgenda, T = window.BSI_AI_TOOLS, o = {}, st = n => T.filter(x => x.name === n)[0];
    o.strumenti = ['segna_impegno', 'leggi_agenda', 'chiudi_impegno'].filter(n => st(n) && st(n).parameters && typeof st(n).execute === 'function').length;
    o.doppi = T.filter(x => x.name === 'segna_impegno').length;
    o.segna = st('segna_impegno').execute({ testo: 'ricevimento con il relatore', genere: 'evento', quando: 'domani alle 11' });
    o.errata = st('segna_impegno').execute({ testo: 'boh', genere: 'promemoria', quando: 'quando capita' });
    o.leggi = st('leggi_agenda').execute({});
    o.chiudi = st('chiudi_impegno').execute({ cosa: 'relatore', azione: 'rimanda', quando: 'dopodomani alle 15' });
    o.ignoto = st('chiudi_impegno').execute({ cosa: 'dentista', azione: 'fatto' });
    /* la continuita': un episodio di 14 ore fa nella mente */
    const K = 'bsi-spectra-mente-v1', prima = localStorage.getItem(K), ora = Date.now();
    localStorage.setItem(K, JSON.stringify({ nato: ora - 40 * 86400000, episodi: [{ t: ora - 14 * 3600000, m: 'chimica', s: null, d: 'Come si orienta il dienofilo nella Diels-Alder?', e: 'modello' }] }));
    o.blocco = A.blocco(ora); o.c = A.continuita(ora);
    o.mente = typeof window._bsiMente === 'function' ? window._bsiMente() : '';
    localStorage.setItem(K, JSON.stringify({ nato: ora, episodi: [] })); o.primo = A.blocco(ora);
    if (prima == null) localStorage.removeItem(K); else localStorage.setItem(K, prima);
    A.azzera(); return o;
  });
  att('i tre strumenti dell\'agenda registrati fra quelli del modello', 3, m.strumenti);
  att('registrati una volta sola', 1, m.doppi);
  vero('segna_impegno: ' + JSON.stringify(m.segna).slice(0, 90), m.segna.ok && /ricevimento con il relatore — domani alle 11:00/.test(m.segna.segnato));
  vero('una data non capita torna al modello come errore, che la chiede: «' + (m.errata.error || '').slice(0, 44) + '…»', m.errata.ok === false && /non capisco quando/.test(m.errata.error));
  vero('leggi_agenda: ' + JSON.stringify(m.leggi).slice(0, 90), m.leggi.totale === 1 && m.leggi.impegni[0].genere === 'evento');
  vero('chiudi_impegno rimanda: ' + m.chiudi.rimandato, m.chiudi.ok && /alle 15:00/.test(m.chiudi.rimandato));
  att('un impegno che non c\'è: non trovato', 'impegno non trovato', m.ignoto.error);
  vero('il blocco dice il tempo passato («14 ore») e il filo', /\[CONTINUITÀ\]/.test(m.blocco) && /14 ore/.test(m.blocco) && /dienofilo/.test(m.blocco));
  vero('dopo ore è un ritorno: riprendere il filo, non salutare da capo', m.c.ritorno === true && /Non salutare come se fosse la prima volta/.test(m.blocco));
  vero('e porta l\'agenda', /\[AGENDA\]/.test(m.blocco) && /ricevimento con il relatore/.test(m.blocco));
  vero('il quadro che va al modello lo contiene', /\[CONTINUITÀ\]/.test(m.mente) && /\[AGENDA\]/.test(m.mente));
  vero('il primo incontro è detto com\'è', /prima conversazione/.test(m.primo));

  console.log('\n── La memoria che si porta via ──');
  const e = await pg.evaluate(() => {
    const A = BSISpectraAgenda, o = {}; A.azzera();
    A.aggiungi('esame di Organica 2', { genere: 'evento', quando: 'il 12 febbraio alle 9' });
    localStorage.setItem('bsi_ai_memory', JSON.stringify([{ fatto: 'prepara Organica 2', categoria: 'esame', quando: '2026-11-12' }]));
    const P = A.pacchetto(); o.chiavi = Object.keys(P.dati).sort().join(','); o.cosa = P.cosa;
    A.azzera(); localStorage.removeItem('bsi_ai_memory');
    P.dati['bsi_api_keys'] = '{"gemini":"x"}'; P.dati['altro'] = '1';                       // chiavi estranee nel file: non devono entrare
    const prima = localStorage.getItem('bsi_api_keys');
    o.importa = A.importa(JSON.stringify(P));
    o.tornato = A.aperti().map(v => v.testo).join(); o.ricordi = JSON.parse(localStorage.getItem('bsi_ai_memory'))[0].fatto;
    o.estranee = localStorage.getItem('bsi_api_keys') === prima && localStorage.getItem('altro') === null;
    o.rifiuti = ['ciao', '{"cosa":"altro"}', '{"cosa":"memoria-di-spectra","dati":{"bsi-spectra-agenda-v1":"non json"}}'].map(t => { try { A.importa(t); return 'accettato'; } catch (x) { return 'rifiutato'; } }).join();
    A.azzera(); localStorage.removeItem('bsi_ai_memory'); return o;
  });
  vero('il file porta agenda, ricordi (e la mente, se c\'è): ' + e.chiavi, /bsi-spectra-agenda-v1/.test(e.chiavi) && /bsi_ai_memory/.test(e.chiavi) && e.cosa === 'memoria-di-spectra');
  att('reimportato: l\'impegno è tornato', 'esame di Organica 2', e.tornato);
  att('e il ricordo anche', 'prepara Organica 2', e.ricordi);
  vero('le chiavi estranee nel file non entrano (le chiavi API non si toccano)', e.estranee);
  att('un file qualunque non scrive nulla', 'rifiutato,rifiutato,rifiutato', e.rifiuti);

  console.log('\n── Nella Chat e nella console, senza chiave ──');
  const h = await pg.evaluate(async () => {
    const pausa = ms => new Promise(r => setTimeout(r, ms)), A = BSISpectraAgenda, o = {}; A.azzera();
    localStorage.removeItem('bsi_api_keys');
    bsiOpenAIHub('chat'); await pausa(1200);
    const i = document.getElementById('bsi-hub-input'); i.value = 'Spectra, ricordami fra 2 ore di bere'; _bsiHubChatInternal.send(); await pausa(400);
    const msg = [...document.querySelectorAll('#bsi-hub-msgs .bsi-msg.assistant')].map(n => n.textContent.trim());
    o.risposta = msg[msg.length - 1] || ''; o.vuoto = i.value === ''; o.voci = A.aperti().length;
    const ch = document.getElementById('bsi-hub-close'); if (ch) ch.click(); await pausa(300);
    const r = BSISpectraLive.comando('ricordami domani alle 9:30 di portare il camice'); o.console = r && r.testo;
    A.azzera(); return o;
  });
  vero('nella Chat, senza chiave: «' + h.risposta.slice(0, 60) + '»', /Segnato: bere — oggi alle|Segnato: bere — domani alle/.test(h.risposta) && h.vuoto && h.voci === 1);
  att('nessuna chiamata a un fornitore di modelli', 0, rete.length);
  att('nella console, con i due punti dell\'ora', 'Segnato: portare il camice — domani alle 09:30.', h.console);

  console.log('\n── Il pannello, sul telefono ──');
  const u = await pg.evaluate(async () => {
    const pausa = ms => new Promise(r => setTimeout(r, ms)), A = BSISpectraAgenda, o = {}; A.azzera();
    A.apri(); await pausa(200);
    const P = document.getElementById('bsiAG'), campo = P.querySelector('input[type=text]'), form = P.querySelector('form');
    o.dialogo = P.getAttribute('role') === 'dialog' && !!P.getAttribute('aria-label');
    campo.value = 'boh'; form.dispatchEvent(new Event('submit', { cancelable: true })); o.senza = P.querySelector('.esito').textContent;
    campo.value = 'domani alle 8 di consegnare la relazione di laboratorio molto lunga con un titolo che non finisce più'; form.dispatchEvent(new Event('submit', { cancelable: true }));
    campo.value = 'fra 3 giorni di ritirare gli occhiali'; form.dispatchEvent(new Event('submit', { cancelable: true })); await pausa(100);
    o.righe = P.querySelectorAll('li:not(.vuoto)').length;
    o.largo = document.documentElement.scrollWidth <= window.innerWidth + 1 && P.querySelector('.scheda').scrollWidth <= P.querySelector('.scheda').clientWidth + 1;
    o.tasti = [...P.querySelectorAll('button')].every(b => b.getBoundingClientRect().height >= 36);
    P.querySelector('li button').click(); await pausa(100); o.dopoFatto = P.querySelectorAll('li:not(.vuoto)').length;
    P.querySelectorAll('li button')[1].click(); await pausa(100); o.vuoto = !!P.querySelector('li.vuoto');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); o.chiuso = !document.getElementById('bsiAG');
    o.menu = /key==='agenda'/.test(document.documentElement.innerHTML) && /Agenda di Spectra/.test(document.documentElement.innerHTML);
    return o;
  });
  vero('è un dialogo con il suo nome', u.dialogo);
  vero('senza un\'ora lo dice: «' + u.senza + '»', /Scrivi anche quando/.test(u.senza));
  att('due impegni aggiunti dal campo', 2, u.righe);
  vero('nessuno scorrimento orizzontale, anche con un testo lungo', u.largo);
  vero('i pulsanti si toccano con un dito', u.tasti);
  att('«Fatto» ne toglie uno', 1, u.dopoFatto);
  vero('«✕» toglie l\'altro: agenda vuota', u.vuoto);
  vero('Esc lo chiude', u.chiuso);
  vero('c\'è la voce «Agenda di Spectra» nel menu', u.menu);

  att('nessun errore JavaScript', 0, errs.length);
  errs.slice(0, 3).forEach(x => console.log('      ! ' + x.slice(0, 200)));
  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
