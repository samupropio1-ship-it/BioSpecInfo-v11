/* Il client del ponte in Node: carica biospecinfo-strumenti.js con un'app finta, registra gli strumenti su un WebMCP finto e
   sul rele' vero del servizio, e serve le chiamate finche' non gli si dice di smettere. Lo lancia prove/test_ponte.py. */
const path = require('path');
const [url, gettone] = process.argv.slice(2);
const registrati = [];
globalThis.window = globalThis;
globalThis.document = { readyState: 'complete', createElement() { let h = ''; return { set innerHTML(v) { h = v; }, get textContent() { return String(h).replace(/<[^>]+>/g, ''); } }; }, addEventListener() {} };
/* `navigator` in Node e' di sola lettura: lo si ridefinisce con il contesto WebMCP finto */
Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { modelContext: { registerTool(t) { registrati.push(t); } } } });
globalThis.localStorage = { getItem: k => ({ 'bsi-spectra2-url': url, 'bsi-spectra2-gettone': gettone })[k] || null };
/* l'app finta: un catalogo di tre sezioni, un navigatore, un risolutore */
globalThis.BSISpiega = { catalogo: () => [{ id: 'stitr', nome: '🧪 Titolazione', gruppo: 'Chimica Fisica', materia: 'chimica' }, { id: 'sirvis', nome: '📈 IR Visivi', gruppo: 'Spettroscopia', materia: 'chimica' }, { id: 'sastroorbite', nome: '🪐 Meccanica orbitale 3D', gruppo: 'Astrofisica', materia: 'fisica' }] };
const aperte = [];
globalThis.BSISpectraLive = { calcolo: { apriSezione: id => { const x = BSISpiega.catalogo().find(s => s.id === id); if (x) aperte.push(id); return x ? { ok: true, id, nome: x.nome } : { ok: false }; } }, schermo: () => ({ sezione: aperte[aperte.length - 1] || null, titolo: 'IR Visivi', materia: 'chimica' }), contesto: () => 'banda a 1715 cm⁻¹' };
globalThis.BSIAssistente = { rispondi: t => /pH/.test(t) ? { titolo: 'pH di un acido forte', passi: [{ titolo: 'Dissociazione', html: '<b>[H₃O⁺]</b> = C = 0,01 M' }], risultati: [{ nome: 'pH', v: 2, u: '' }] } : { errore: true } };
require(path.join(__dirname, '..', 'ponte', 'biospecinfo-strumenti.js'));
(async () => {
  await new Promise(r => setTimeout(r, 400));
  const S = BSISpectra2;
  const fuori = {
    webmcp: registrati.map(t => t.name), forma: registrati.every(t => t.description && t.inputSchema && t.inputSchema.type === 'object' && typeof t.execute === 'function'),
    webmcpEsito: await registrati.find(t => t.name === 'cerca_sezione').execute({ domanda: 'orbit' }),
    nonValidi: await S.esegui('apri_sezione', {}), sconosciuto: await S.esegui('cancella_tutto', {}), campoInPiu: await S.esegui('cerca_sezione', { domanda: 'x', altro: 1 }),
    esercizio: await S.esegui('risolvi_esercizio', { testo: 'calcola il pH di HCl 0,01 M' }), stato: S.stato()
  };
  console.log('PRONTO ' + JSON.stringify(fuori));
  process.stdin.on('data', () => { console.log('APERTE ' + JSON.stringify(aperte)); S.scollega(); process.exit(0); });
})();
