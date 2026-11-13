#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   test_memoria — la memoria di Spectra a cinque livelli, nell'app (v254)

   PERCHE' QUESTO BANCO ESISTE
   Fase 1 del progetto (progetto/PROGETTO-BIOSPECINFO-SPECTRA.md §2): un solo
   archivio con episodi, fatti, procedure e diario, un recupero che sceglie i
   ricordi pertinenti, una cura giornaliera. Il banco pretende:
   · SCRITTURA: lo stesso ricordo non si duplica, si rafforza (la stabilità
     cresce); i tipi sconosciuti sono rifiutati;
   · RECUPERO: per «il punto equivalente della titolazione» torna l'episodio
     giusto prima di quelli estranei; la sezione aperta pesa; un ricordo
     archiviato non torna; due ricordi quasi uguali non tornano insieme; ogni
     risultato dice i suoi segnali;
   · CURA, a date fissate: gli episodi della mente entrano nell'archivio; un
     concetto che torna in tre domande su due giorni diventa un fatto; la fascia
     oraria di studio diventa una procedura; il diario ha una pagina per ogni
     giorno passato e il mese chiuso un capitolo; l'episodio sbiadito di sei mesi
     fa viene archiviato, quello fissato no;
   · COMANDI: «preferisco…», «cosa ricordi di me», «dimentica…»;
   · AL MODELLO: nella Chat la richiesta a Gemini (intercettata) contiene
     [RICORDI] con il ricordo pertinente, [PROCEDURE], [STORIA], e ancora
     [CONTINUITÀ] e [AGENDA] (la catena non si è rotta); lo strumento
     cerca_nella_memoria c'è; «ricorda» della Chat scrive anche qui;
   · PERSISTENZA: ricaricata la pagina, i ricordi ci sono (IndexedDB);
     esportati e reimportati, tornano.

   USO   node tools/banchi/test_memoria.js    (serve un server su :8899)
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';
const { chromium } = require('playwright-core');
const BASE = process.env.BSI_URL_BASE || 'http://127.0.0.1:8899/';
const CHROME = process.env.BSI_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
let ok = 0, ko = 0;
function att(d, atteso, avuto) { if (String(atteso) === String(avuto)) { ok++; console.log('  ✓ ' + d + '  → ' + avuto); } else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + '\n      avuto:  ' + avuto); } }
function vero(d, c) { att(d, true, !!c); }

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const cx = await b.newContext({ serviceWorkers: 'block', viewport: { width: 412, height: 915 }, isMobile: true, timezoneId: 'Europe/Rome', locale: 'it-IT' });
  const pg = await cx.newPage(), errs = [];
  pg.on('pageerror', e => errs.push(e.message.slice(0, 200)));
  await pg.addInitScript(() => { try { localStorage.setItem('bsi_guide_v3', '1'); } catch (e) {} });
  await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
  await pg.waitForFunction(() => window.BSIMemoria && window.BSI_AI_TOOLS && window.bsiOpenAIHub, null, { timeout: 60000 });
  await pg.evaluate(() => BSIMemoria.pronta());

  console.log('── Scrittura e recupero ──');
  const r = await pg.evaluate(() => {
    const M = BSIMemoria, o = {}, ora = Date.now(), G = 86400000; M.azzera();
    const e1 = M.scrivi('episodio', 'Ha sbagliato il pH al punto equivalente della titolazione dell\'ammoniaca con HCl', { sezione: 'stitr', importanza: 0.7, creato: ora - 2 * G });
    M.scrivi('episodio', 'Ha chiesto la configurazione elettronica del ferro', { sezione: 'spt', creato: ora - G });
    M.scrivi('episodio', 'Ha chiesto della curvatura dello spaziotempo vicino a un buco nero', { sezione: 'sastrowh', creato: ora - 3 * G });
    M.scrivi('fatto', 'Ha l\'esame di Chimica Analitica il 12 febbraio', { fonte: 'utente', fiducia: 0.9, importanza: 0.8 });
    const s0 = M.elenco('fatto')[0].stabilita; M.scrivi('fatto', 'Ha l\'esame di Chimica Analitica il 12 febbraio'); o.nonDuplica = M.elenco('fatto').length === 1 && M.elenco('fatto')[0].stabilita > s0;
    o.rifiuto = M.scrivi('inventato', 'x') === null;
    const c = M.cerca('come si calcola il punto equivalente nella titolazione?', { sezione: null });
    o.primo = c[0] && c[0].testo; o.segnali = c[0] && Object.keys(c[0].segnali).sort().join(',');
    o.estraneo = c.some(x => /spaziotempo/.test(x.testo));
    const c2 = M.cerca('ferro', { sezione: 'spt' }); o.sezione = c2[0] && /ferro/.test(c2[0].testo);
    e1.archiviato = true; o.archiviato = !M.cerca('punto equivalente titolazione', { sezione: null }).some(x => x.id === e1.id); e1.archiviato = false;
    M.scrivi('episodio', 'Ha sbagliato il pH al punto equivalente della titolazione dell\'ammoniaca con HCl di nuovo', { sezione: 'stitr' });
    const c3 = M.cerca('punto equivalente titolazione ammoniaca', { sezione: null }); o.diversi = c3.filter(x => /punto equivalente/.test(x.testo)).length;
    return o;
  });
  vero('lo stesso fatto non si duplica: si rafforza', r.nonDuplica);
  vero('un tipo che non esiste è rifiutato', r.rifiuto);
  vero('«come si calcola il punto equivalente…» trova l\'episodio giusto: «' + (r.primo || '').slice(0, 60) + '…»', /punto equivalente/.test(r.primo || ''));
  att('ogni risultato dice i suoi sei segnali', 'importanza,obiettivi,parole,recenza,sezione,significato', r.segnali);
  vero('l\'episodio estraneo (spaziotempo) non torna', !r.estraneo);
  vero('la sezione aperta pesa (ferro in Tavola periodica)', r.sezione);
  vero('un ricordo archiviato non torna', r.archiviato);
  att('due ricordi quasi uguali non tornano insieme', 1, r.diversi);

  console.log('\n── La cura, a date fissate ──');
  const k = await pg.evaluate(() => {
    const M = BSIMemoria, o = {}, G = 86400000, ora = new Date(2026, 10, 13, 9, 0).getTime(); M.azzera(); localStorage.removeItem('bsi-spectra-memoria-stato');
    const ottobre = new Date(2026, 9, 10, 20).getTime();
    localStorage.setItem('bsi-spectra-mente-v1', JSON.stringify({ nato: ora - 60 * G, episodi: [
      { t: ottobre, m: 'chimica', s: 'stitr', d: 'Perché il pH al punto equivalente non è 7?', e: 'modello' },
      { t: ottobre + 2 * G, m: 'chimica', s: 'stitr', d: 'Come scelgo un indicatore per la titolazione?', e: 'modello' },
      { t: ora - 3 * G, m: 'chimica', s: 'stitr', d: 'Titolazione dell\'ammoniaca: il punto equivalente è acido?', e: 'modello' },
      { t: ora - 2 * G, m: 'chimica', s: 'stitr', d: 'Rifammi la titolazione con acido acetico', e: 'modello' },
      { t: ora - 2 * G + 3600000, m: 'chimica', s: 'stitr', d: 'Titolazione: quando uso Henderson Hasselbalch?', e: 'modello' },
      { t: ora - 1 * G, m: 'fisica', s: 'sfoucault', d: 'Quanto ruota il pendolo di Foucault a Milano?', e: 'modello' } ],
      sezioni: { stitr: { s: 2400, n: 6, ultima: ora - G, materia: 'chimica' } }, ore: Array.from({ length: 24 }, (_, h) => h >= 20 && h <= 23 ? 900 : 60), materie: { chimica: 2400, fisica: 300, matematica: 0 } }));
    const vecchio = M.scrivi('episodio', 'Una domanda di sei mesi fa sul benzene', { creato: ora - 180 * G, importanza: 0.3 });
    const fissato = M.scrivi('episodio', 'Una cosa vecchia ma fissata', { creato: ora - 180 * G, importanza: 0.3, fissato: true });
    const rap = M.consolida(ora); o.rap = rap;
    o.ricorrente = M.elenco('fatto').filter(f => /torna spesso su «titolazion/.test(f.testo)).map(f => f.testo.slice(0, 80))[0];
    o.procedura = (M.elenco('procedura')[0] || {}).testo;
    o.diario = M.elenco('autobiografia').filter(a => /^diario:/.test(a.chiave)).length;
    o.capitolo = (M.elenco('autobiografia').filter(a => /^capitolo:/.test(a.chiave))[0] || {}).testo;
    o.archiviato = M.elenco('episodio', true).filter(e => e.id === vecchio.id)[0].archiviato; o.fissato = M.elenco('episodio', true).filter(e => e.id === fissato.id)[0].archiviato;
    const rap2 = M.consolida(ora); o.secondaVolta = rap2.episodi + rap2.diario + rap2.capitolo;
    return o;
  });
  vero('gli episodi della mente entrano nell\'archivio (' + k.rap.episodi + ')', k.rap.episodi === 6);
  vero('un concetto ricorrente diventa un fatto: «' + (k.ricorrente || '') + '…»', !!k.ricorrente);
  vero('la fascia di studio diventa una procedura: «' + (k.procedura || '').slice(0, 60) + '…»', /la sera/.test(k.procedura || ''));
  vero('una pagina di diario per ogni giorno passato con attività (' + k.diario + ': cinque giorni di studio e quello di sei mesi fa)', k.diario === 6);
  vero('il mese chiuso ha il suo capitolo: «' + (k.capitolo || '').slice(0, 70) + '…»', /^Capitolo di ottobre 2026: 2 giorni/.test(k.capitolo || ''));
  vero('l\'episodio sbiadito di sei mesi fa è archiviato, quello fissato no', k.archiviato === true && k.fissato === false);
  att('rifatta la cura, niente si duplica', 0, k.secondaVolta);

  console.log('\n── Comandi ──');
  const c = await pg.evaluate(() => {
    const A = BSISpectraAgenda, M = BSIMemoria, o = {};
    o.pref = A.comando('Spectra, preferisco fare prima un esercizio e poi la spiegazione').testo; o.proc = M.elenco('procedura').filter(p => /esercizio/.test(p.testo)).map(p => p.fiducia)[0];
    o.ricordi = (A.comando('cosa ricordi di me?') || {}).testo || '';
    const prima = M.quanti(); o.dim = A.comando('dimentica il pendolo di Foucault').testo; o.dopo = prima - M.quanti();
    return o;
  });
  vero('«preferisco…» diventa una procedura con fiducia alta (' + c.proc + ')', /terrò presente/.test(c.pref) && c.proc >= 0.9);
  vero('«cosa ricordi di me» racconta fatti, procedure e diario', /Di te so:/.test(c.ricordi) && /Come studi:/.test(c.ricordi) && /diario/.test(c.ricordi));
  vero('«dimentica il pendolo di Foucault» cancella davvero (' + c.dopo + ')', /Dimenticato: \d/.test(c.dim) && c.dopo >= 1);

  console.log('\n── Al modello, nella Chat ──');
  let corpo = '';
  await pg.route(/generativelanguage\.googleapis\.com/, async r2 => {
    const u = r2.request().url();
    if (/\/models\?/.test(u)) return r2.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ models: [{ name: 'models/gemini-2.5-flash', supportedGenerationMethods: ['generateContent', 'streamGenerateContent'] }] }) });
    if (r2.request().method() === 'POST') corpo = r2.request().postData() || '';
    return r2.fulfill({ status: 200, contentType: 'text/event-stream', body: 'data: ' + JSON.stringify({ candidates: [{ content: { parts: [{ text: 'Al punto equivalente resta NH₄⁺: il pH è acido.' }] }, finishReason: 'STOP' }] }) + '\n\n' });
  });
  const h = await pg.evaluate(async () => {
    const pausa = ms => new Promise(r => setTimeout(r, ms)), o = {};
    const kk = JSON.parse(localStorage.getItem('bsi_api_keys') || '{}'); kk.gemini = 'chiave-finta-di-prova'; localStorage.setItem('bsi_api_keys', JSON.stringify(kk));
    bsiOpenAIHub('chat'); await pausa(1200);
    const ps = document.getElementById('bsi-hub-provsel'); if (ps) { ps.value = 'gemini'; ps.dispatchEvent(new Event('change')); } await pausa(200);
    const i = document.getElementById('bsi-hub-input'); i.value = 'Ricordami perché il punto equivalente della titolazione dell\'ammoniaca è acido'; await _bsiHubChatInternal.send(); await pausa(800);
    const T = window.BSI_AI_TOOLS; o.strumento = T.filter(x => x.name === 'cerca_nella_memoria').length; o.totale = T.length;
    o.tool = T.filter(x => x.name === 'cerca_nella_memoria')[0].execute({ domanda: 'titolazione' });
    T.filter(x => x.name === 'ricorda')[0].execute({ fatto: 'Vuole fare il dottorato in chimica analitica', categoria: 'obiettivo' });
    o.ricordaQui = BSIMemoria.elenco('fatto').some(f => /dottorato/.test(f.testo));
    const ch = document.getElementById('bsi-hub-close'); if (ch) ch.click();
    return o;
  });
  const sys = (() => { try { const j = JSON.parse(corpo); return (j.systemInstruction && j.systemInstruction.parts || []).map(p => p.text).join('\n'); } catch (e) { return corpo; } })();
  vero('il modello riceve [RICORDI] con il ricordo pertinente (titolazione dell\'ammoniaca)', /\[RICORDI\][\s\S]*titolazion/i.test(sys));
  vero('e [PROCEDURE] e [STORIA]', /\[PROCEDURE\][\s\S]*esercizio/.test(sys) && /\[STORIA\]/.test(sys));
  vero('la catena non si è rotta: ci sono ancora [CONTINUITÀ] e [AGENDA]', /\[CONTINUITÀ\]/.test(sys) && /\[AGENDA\]/.test(sys));
  att('lo strumento cerca_nella_memoria registrato una volta, 53 strumenti', '1 53', h.strumento + ' ' + h.totale);
  vero('lo strumento risponde con i ricordi e la data', h.tool.ok && h.tool.ricordi.length >= 1 && /^\d{4}-\d\d-\d\d$/.test(h.tool.ricordi[0].quando));
  vero('«ricorda» della Chat scrive anche nell\'archivio', h.ricordaQui);

  console.log('\n── Persistenza ──');
  const n0 = await pg.evaluate(() => BSIMemoria.quanti());
  await pg.reload({ waitUntil: 'load' }); await pg.waitForFunction(() => window.BSIMemoria, null, { timeout: 60000 }); await pg.evaluate(() => BSIMemoria.pronta());
  const p = await pg.evaluate(async () => {
    const o = { dopo: BSIMemoria.quanti() };
    const P = BSISpectraAgenda.pacchetto(); o.nelFile = typeof P.dati['bsi-spectra-memoria'] === 'string' && JSON.parse(P.dati['bsi-spectra-memoria']).length;
    const n = BSIMemoria.quanti(); BSIMemoria.azzera(); o.vuota = BSIMemoria.quanti();
    BSISpectraAgenda.importa(JSON.stringify(P)); o.tornati = BSIMemoria.quanti() === n;
    o.vettori = BSIMemoria.cerca('titolazione', { sezione: null }).length > 0;
    BSIRisveglio = window.BSISpectraRisveglio; const G = BSIRisveglio.grafo(); o.rete = G.neuroni.filter(x => x.tipo === 'procedura' || x.tipo === 'autobiografia').length;
    return o;
  });
  att('ricaricata la pagina, i ricordi ci sono tutti (IndexedDB)', n0, p.dopo);
  vero('«esporta la memoria» porta l\'archivio (' + p.nelFile + ' ricordi)', p.nelFile === p.dopo);
  vero('azzerata e reimportata, la memoria torna com\'era e si interroga', p.vuota === 0 && p.tornati && p.vettori);
  vero('la rete neurale mostra anche procedure e pagine di diario (' + p.rete + ')', p.rete >= 3);
  att('nessun errore JavaScript', 0, errs.length); errs.slice(0, 3).forEach(e => console.log('      ! ' + e));
  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
