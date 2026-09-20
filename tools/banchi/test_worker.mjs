/* Il Worker eseguito davvero, con fetch verso i fornitori simulato. */
import worker from '/home/user/BioSpecInfo-v11/proxy/spectra-proxy.js';

const ORIGINE = 'https://samupropio1-ship-it.github.io';
const ENV = { ORIGINI: ORIGINE, GROQ_KEYS: 'k1,k2', GEMINI_KEYS: 'g1',
              NVIDIA_KEYS: 'nv1', ZAI_KEYS: 'z1',
              LIMITE_IP: '5', TETTO_GIORNO: '100' };

let upstream = [];
let rispondi = () => new Response('{"ok":true}', { status: 200 });
globalThis.fetch = async (u, o) => { upstream.push({ url: String(u), o }); return rispondi(upstream.length); };

function req(path, opts = {}){
  return new Request('https://proxy.test' + path, {
    method: opts.method || 'POST',
    headers: Object.assign({ Origin: opts.origin === null ? undefined : (opts.origin || ORIGINE),
                             'CF-Connecting-IP': opts.ip || '1.2.3.4' }, opts.headers || {}),
    body: (opts.method === 'GET') ? undefined : (opts.body || '{"a":1}')
  });
}

let ok=0, ko=0;
function att(d, atteso, avuto){
  if(String(atteso)===String(avuto)){ ok++; console.log('  ✓ '+d+'  → '+avuto); }
  else { ko++; console.log('  ✗ '+d+'\n      atteso: '+atteso+'\n      avuto:  '+avuto); }
}

console.log('\n1) /stato elenca i fornitori con chiave, senza rivelarle');
let r = await worker.fetch(req('/stato', { method:'GET' }), ENV);
let j = await r.json();
att('fornitori', 'gemini,groq,nvidia,zai', j.fornitori.join(','));
att('nessuna chiave nel corpo', false, JSON.stringify(j).includes('k1'));

console.log('\n2) Inoltro con iniezione della chiave');
upstream = []; rispondi = () => new Response('dati', { status:200, headers:{'Content-Type':'text/event-stream'} });
r = await worker.fetch(req('/groq/openai/v1/chat/completions', { ip:'10.0.0.2' }), ENV);
att('stato', 200, r.status);
att('destinazione', 'https://api.groq.com/openai/v1/chat/completions', upstream[0].url);
att('Bearer iniettato', 'Bearer k1', upstream[0].o.headers.get('Authorization'));
att('CORS all\'origine giusta', ORIGINE, r.headers.get('Access-Control-Allow-Origin'));

console.log('\n3) Gemini: la chiave va nell\'URL, non in un header');
upstream = [];
r = await worker.fetch(req('/gemini/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse', { ip:'10.0.0.3' }), ENV);
att('chiave come parametro', true, upstream[0].url.includes('key=g1'));
att('alt=sse conservato', true, upstream[0].url.includes('alt=sse'));

console.log('\n4) Quota finita sulla prima chiave → passa alla seconda');
upstream = [];
rispondi = (n) => n === 1 ? new Response('{"error":"quota"}', { status:429 })
                          : new Response('ok', { status:200 });
r = await worker.fetch(req('/groq/openai/v1/chat/completions', { ip:'10.0.0.4' }), ENV);
att('due tentativi', 2, upstream.length);
att('la seconda chiave', 'Bearer k2', upstream[1].o.headers.get('Authorization'));
att('esito finale buono', 200, r.status);

console.log('\n5) Errore 400 → NON ritenta (si ripeterebbe identico)');
upstream = []; rispondi = () => new Response('{"error":"corpo errato"}', { status:400 });
r = await worker.fetch(req('/groq/openai/v1/chat/completions', { ip:'10.0.0.5' }), ENV);
att('un solo tentativo', 1, upstream.length);
att('errore riportato', 400, r.status);

console.log('\n6) Tutte le chiavi esaurite → riporta l\'ultimo errore');
upstream = []; rispondi = () => new Response('{"error":"quota"}', { status:429 });
r = await worker.fetch(req('/groq/openai/v1/chat/completions', { ip:'10.0.0.6' }), ENV);
att('provate entrambe', 2, upstream.length);
att('stato 429', 429, r.status);

console.log('\n7) Origine estranea respinta');
r = await worker.fetch(req('/groq/openai/v1/chat/completions', { origin:'https://sito-cattivo.example' }), ENV);
att('403', 403, r.status);

console.log('\n8) Fornitore senza chiave configurata');
r = await worker.fetch(req('/xai/v1/chat/completions'), ENV);
att('503 con istruzione', 503, r.status);
att('dice cosa fare', true, (await r.text()).includes('wrangler secret put XAI_KEYS'));

console.log('\n9) Il client non puo\' far passare una chiave propria');
upstream = []; rispondi = () => new Response('ok', { status:200 });
r = await worker.fetch(req('/groq/openai/v1/chat/completions?key=CHIAVE_DEL_CLIENT',
      { ip:'10.0.0.9', headers: { Authorization: 'Bearer RUBATA', 'x-api-key': 'RUBATA2' } }), ENV);
att('key= del client scartata', false, upstream[0].url.includes('CHIAVE_DEL_CLIENT'));
att('Authorization sovrascritta', 'Bearer k1', upstream[0].o.headers.get('Authorization'));
att('x-api-key non inoltrata', null, upstream[0].o.headers.get('x-api-key'));

console.log('\n10) Limite per IP');
upstream = [];
let stati = [];
for(let i=0;i<7;i++){
  const rr = await worker.fetch(req('/groq/openai/v1/chat/completions', { ip:'9.9.9.9' }), ENV);
  stati.push(rr.status);
}
att('le prime 5 passano', '200,200,200,200,200', stati.slice(0,5).join(','));
att('la sesta e\' frenata', 429, stati[5]);

console.log('\n11) Un altro IP non e\' penalizzato');
r = await worker.fetch(req('/groq/openai/v1/chat/completions', { ip:'8.8.8.8' }), ENV);
att('passa', 200, r.status);

console.log('\n12) Preflight CORS');
r = await worker.fetch(new Request('https://proxy.test/anthropic/v1/messages', {
  method:'OPTIONS', headers:{ Origin: ORIGINE } }), ENV);
att('204', 204, r.status);
att('consente anthropic-version', true,
    (r.headers.get('Access-Control-Allow-Headers')||'').includes('anthropic-version'));

console.log('\n12b) I gratuiti inoltrano al posto giusto');
for(const [rotta, atteso, chiave] of [
  ['/nvidia/v1/chat/completions', 'https://integrate.api.nvidia.com/v1/chat/completions', 'Bearer nv1'],
  ['/zai/api/paas/v4/chat/completions', 'https://api.z.ai/api/paas/v4/chat/completions', 'Bearer z1']]){
  upstream = []; rispondi = () => new Response('ok', { status:200 });
  const rr = await worker.fetch(req(rotta, { ip:'10.1.'+Math.random().toString().slice(2,5)+'.1' }), ENV);
  att(rotta.split('/')[1]+': destinazione', atteso, upstream[0] && upstream[0].url);
  att(rotta.split('/')[1]+': chiave iniettata', chiave, upstream[0] && upstream[0].o.headers.get('Authorization'));
}

console.log('\n12c) Le GET passano col percorso intatto (serve alla risoluzione)');
upstream = []; rispondi = () => new Response('[]', { status:200 });
await worker.fetch(req('/nvidia/v1/models', { method:'GET', ip:'10.2.0.1' }), ENV);
att('percorso conservato', 'https://integrate.api.nvidia.com/v1/models', upstream[0] && upstream[0].url);
att('metodo GET', 'GET', upstream[0] && upstream[0].o.method);

console.log('\n13) Senza ORIGINI configurate, passa chiunque (documentato)');
r = await worker.fetch(req('/groq/openai/v1/chat/completions', { origin:'https://qualsiasi.example', ip:'7.7.7.7' }),
                       Object.assign({}, ENV, { ORIGINI: '' }));
att('ammesso', 200, r.status);

console.log('\n' + (ko ? '✗ '+ko+' FALLITI, ' : '') + ok + ' passati');
process.exit(ko ? 1 : 0);
