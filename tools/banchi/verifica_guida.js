/* La guida deve descrivere il codice, non ciò che credo ci sia.
   Confronta l'elenco dei fornitori nell'app con quello nella guida. */
const fs=require('fs');
const src=fs.readFileSync('/home/user/BioSpecInfo-v11/bsi-ai-hub.js','utf8');
const guida=fs.readFileSync('/home/user/BioSpecInfo-v11/docs/Guida-Chiavi-API.md','utf8');
const proxy=fs.readFileSync('/home/user/BioSpecInfo-v11/proxy/spectra-proxy.js','utf8');
const prox_md=fs.readFileSync('/home/user/BioSpecInfo-v11/proxy/README.md','utf8');
let ok=0,ko=0;
const att=(d,a,v)=>{ if(String(a)===String(v)){ok++;console.log('  ✓ '+d+'  → '+v);} else {ko++;console.log('  ✗ '+d+'\n      atteso: '+a+'\n      avuto:  '+v);} };

// fornitori dichiarati nel codice
const blocco = src.slice(src.indexOf('var PROVIDERS = {'), src.indexOf('Object.keys(PROVIDERS).forEach'));
const ids = [...blocco.matchAll(/^  ([a-z_]+): \{/gm)].map(m=>m[1]);
const nomi = [...blocco.matchAll(/^    name: '([^']+)'/gm)].map(m=>m[1]);
const gratis = [...blocco.matchAll(/^    name: '([^']+)', family: '[a-z]+', free: (true|false)/gm)]
  .filter(m=>m[2]==='true').map(m=>m[1]);
console.log('\n1) Elenco nel codice');
att('10 configurazioni', 10, ids.length);
att('3 gratuite', 3, gratis.length);
console.log('   ' + ids.join(', '));

console.log('\n2) Ogni fornitore ha una sezione passo passo nella guida');
const siti = { groq:'console.groq.com', gemini:'aistudio.google.com',
  zai:'z.ai', openai:'platform.openai.com', grok:'console.x.ai', deepseek:'platform.deepseek.com',
  claude_fable:'console.anthropic.com' };
Object.keys(siti).forEach(id=>{
  att(id+': indirizzo presente', true, guida.indexOf(siti[id])>=0);
});
att('gemini_pro: rimanda alla fatturazione', true, /console\.cloud\.google\.com/.test(guida));

console.log('\n3) Nessun fornitore rimosso citato come disponibile');
['GitHub Models','Mistral','OpenRouter','Haiku','NVIDIA'].forEach(n=>{
  // devono comparire SOLO nella sezione "perché non ci sono"
  const i = guida.indexOf('## Perché alcuni servizi non ci sono');
  const prima = guida.slice(0, i);
  att(n+': non compare fra i disponibili', false, prima.indexOf(n)>=0);
});

console.log('\n4) Codice e proxy allineati');
const forn = [...proxy.matchAll(/^  ([a-z]+):\s+\{ base:/gm)].map(m=>m[1]);
const upstream = [...src.matchAll(/(\w+): '(anthropic|gemini|groq|xai|zai|openai|deepseek)'/g)].map(m=>m[2]);
const mancanti = [...new Set(upstream)].filter(u=>forn.indexOf(u)<0);
att('ogni rotta del codice esiste nel Worker', 0, mancanti.length);
att('nessun fornitore ritirato nel Worker', false, forn.indexOf('github')>=0);
// NVIDIA e' fuori dalla tendina ma resta nel Worker: dal server funziona.
// Il controllo serve a non farla rientrare per sbaglio nell'app.
att('NVIDIA non e\' piu\' nel registro dell\'app', false, ids.indexOf('nvidia')>=0);
att('ma la rotta del Worker resta, per chi usa il proxy', true, forn.indexOf('nvidia')>=0);

console.log('\n5) I segreti citati nel README del proxy esistono nel Worker');
const segreti = [...proxy.matchAll(/segreto: '([A-Z_]+)'/g)].map(m=>m[1]);
const citati = [...prox_md.matchAll(/`([A-Z]+_KEYS)`/g)].map(m=>m[1]);
const fantasma = [...new Set(citati)].filter(c=>segreti.indexOf(c)<0);
att('nessun segreto inventato nel README', 0, fantasma.length);
if(fantasma.length) console.log('      → ' + fantasma.join(', '));

console.log('\n6) Modelli dismessi: solo nei commenti, mai come candidati');
const cand = [...src.matchAll(/modelliCandidati: \[([^\]]+)\]/g)].map(m=>m[1]).join(' ');
['llama-3.3-70b-versatile','llama-3.1-8b-instant','grok-3','gpt-4.1'].forEach(m=>{
  att(m+': non è un candidato', false, cand.indexOf(m)>=0);
});

console.log('\n7) Ciò che la guida promette sui fornitori irraggiungibili esiste davvero');
att('la guida parla del caso', true, /non risponde \*dal browser\*/.test(guida));
// le 24 ore promesse devono essere le 24 ore del codice, non un numero a caso
const oreGuida = /Dopo 24 ore/.test(guida);
const ttl = /KO_TTL_MS = (\d+) \* 60 \* 60 \* 1000/.exec(src);
att('la guida dice 24 ore', true, oreGuida);
att('e il codice usa 24 ore', '24', ttl && ttl[1]);
// Il ⚠ davanti al nome e' stato sostituito da qualcosa di piu' forte: il
// fornitore che non risponde viene SPOSTATO in un gruppo a parte in fondo
// alla tendina. Il controllo segue la promessa nuova della guida.
att('la guida promette il gruppo a parte', true, /optgroup.*in fondo|Non hanno risposto da questo dispositivo/.test(guida));
att('e il codice lo costruisce davvero', true, /optgroup label="⚠ Non hanno risposto/.test(src));
att('con l\'etichetta che lo dice', true, /non risponde/.test(src));
att('l\'annotazione si cancella su risposta ricevuta', true, /segnaRaggiungibile\(providerId\)/.test(src));
att('e si scrive sul fallimento di rete', true, /segnaIrraggiungibile\(providerId\)/.test(src));
// la guida dice che il 🗑 la cancella: deve essere nel gruppo giusto
const gruppoChiavi = src.slice(src.indexOf('chiavi: {'), src.indexOf('memoria: {'));
att('bsi_prov_ko e\' nel gruppo cancellabile "chiavi"', true, gruppoChiavi.indexOf("'bsi_prov_ko'")>=0);
att('la guida indica il gruppo giusto', true, /Chiavi API e provider/.test(guida));
// l'header browser di Claude citato nella guida deve esistere nel codice
att('l\'header Claude citato esiste', true,
    guida.indexOf('anthropic-dangerous-direct-browser-access')>=0 &&
    src.indexOf('anthropic-dangerous-direct-browser-access')>=0);

console.log('\n8) Il pulsante 🔌 Prova promesso dalla guida esiste e fa quello che dice');
att('la guida lo documenta', true, /🔌 Prova/.test(guida));
att('il pulsante e\' nel codice', true, /id="bsi-hub-prova"/.test(src));
att('prova TUTTI i fornitori, non un elenco scritto a mano', true,
    /ids\.map\(function\(id\)\{\s*return provaFornitore\(id\)/.test(src));
// la guida promette che funziona senza chiave: dev'esserci il ripiego
att('funziona senza chiave', true, /'prova-senza-chiave'/.test(src));
// e che usa la stessa url della chiamata vera, altrimenti non dimostra nulla
att('usa buildRequest, non un indirizzo inventato', true, /req = buildRequest\(p, chiave/.test(src));
att('con un corpo minimo', true, /req\.body = corpoMinimo\(p\)/.test(src));
att('e registra l\'esito nella memoria', true,
    /segnaRaggiungibile\(id\)[\s\S]{0,600}segnaIrraggiungibile\(id\)/.test(src));

console.log('\n9) Il ritiro di un modello: la guida descrive il meccanismo che c\'e\'');
att('la guida ne parla', true, /Se un modello viene ritirato/.test(guida));
att('promette che legge il sostituto dal fornitore', true, /dal messaggio del fornitore/.test(guida));
att('e il codice lo fa davvero', true, /modelloSuggeritoDaErrore\(errMsg\)/.test(src));
att('boccia il modello fallito', true, /bocciaModello\(providerId, apiKey, vecchio\)/.test(src));
// i 7 giorni promessi devono essere i 7 giorni del codice
const ttlM = /MODELLI_KO_TTL = (\d+) \* 24 \* 60 \* 60 \* 1000/.exec(src);
att('la guida dice sette giorni', true, /sette giorni/.test(guida));
att('e il codice usa 7 giorni', '7', ttlM && ttlM[1]);
att('bsi_modelli_ko si cancella col 🗑', true,
    src.slice(src.indexOf('chiavi: {'), src.indexOf('memoria: {')).indexOf("'bsi_modelli_ko'") >= 0);

console.log('\n10) Il campo del proxy promesso dalla guida');
att('la guida lo documenta', true, /Senza chiavi: collega un proxy/.test(guida));
att('il campo esiste', true, /id="bsi-hub-proxyinput"/.test(src));
att('sta FUORI dal riquadro della chiave', true,
    src.indexOf('id="bsi-hub-proxybox"') > src.indexOf('id="bsi-hub-keybox"'));
att('non salva un indirizzo che non risponde', true, /if\(!risp \|\| !risp\.ok\) throw/.test(src));

console.log('\n11) Il sovraccarico: la guida promette quello che il codice fa');
att('la guida ne parla', true, /Se il servizio è sovraccarico/.test(guida));
att('il codice riconosce gli stati temporanei', true, /function erroreTemporaneo/.test(src));
// gli stati elencati nella guida devono essere quelli del codice
const stati = (/function erroreTemporaneo\(stato\)\{?[\s\S]*?\n\}/.exec(src)||[''])[0];
['429','500','502','503','504','529'].forEach(function(c){
  att('HTTP ' + c + ': nel codice', true, stati.indexOf(c) >= 0);
  att('HTTP ' + c + ': citato nella guida', true, guida.indexOf(c) >= 0);
});
// il numero di tentativi promesso deve essere quello vero
const nT = /TENTATIVI_TEMPORANEO = (\d+)/.exec(src);
att('la guida dice quattro volte', true, /fino a 4 volte|quattro volte/.test(guida));
att('e il codice ne fa 4', '4', nT && nT[1]);
att('dopo i tentativi passa a un altro fornitore', true, /err\.sovraccarico/.test(src));

console.log('\n12) Nessun marcatore di conflitto e\' finito nei file');
/* Questo progetto si scontra spesso con i merge da PR squashate, e una volta
   i marcatori sono finiti in un commit: li avevo "verificati" con
   git diff --stat, che conta le righe e non le legge. Ora li cerca una
   macchina, in tutti i file di testo tracciati. */
const cp = require('child_process');
const tracciati = cp.execSync("git -C /home/user/BioSpecInfo-v11 ls-files", {encoding:'utf8'})
  .split('\n').filter(f => f && !/\.(png|jpg|jpeg|gif|pdf|wasm|glb|zip|ico|woff2?)$/i.test(f));
const sporchi = tracciati.filter(function(f){
  try{
    const t = fs.readFileSync('/home/user/BioSpecInfo-v11/' + f, 'utf8');
    return /^<<<<<<< |^>>>>>>> /m.test(t);
  }catch(e){ return false; }
});
att('file con marcatori di conflitto', 0, sporchi.length);
if(sporchi.length) console.log('      → ' + sporchi.join(', '));
console.log('   (' + tracciati.length + ' file di testo controllati)');

console.log('\n' + (ko?'✗ '+ko+' FALLITI, ':'') + ok + ' controlli passati');
process.exit(ko?1:0);
