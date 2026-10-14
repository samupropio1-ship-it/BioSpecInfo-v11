/* Audit statico: le classi di bug che questo progetto ha gia' avuto, cercate
   in TUTTI i file invece che nel punto dove si sono manifestate. */
const fs=require('fs'), path=require('path');
const R='/home/user/BioSpecInfo-v11';
const pagine=fs.readdirSync(R).filter(f=>f.endsWith('.html'));
let problemi=[];
function seg(f,riga,cosa,testo){ problemi.push({f,riga,cosa,testo}); }

pagine.forEach(function(f){
  const t=fs.readFileSync(path.join(R,f),'utf8'), righe=t.split('\n');

  righe.forEach(function(l,i){
    const n=i+1;
    // 1) calc() senza spazi attorno a + e - : il browser SCARTA la regola
    let m=/calc\([^)]*[a-z0-9)]\s*[+\-]\s*[a-z0-9(]/gi.exec(l);
    if(m && /calc\([^)]*[a-z0-9)][+\-][a-z0-9(]/i.test(l)) seg(f,n,'calc() senza spazi',l.trim().slice(0,110));
    // 2) == invece di === su confronti con null/undefined non intenzionali: rumoroso, salto
    // 3) console.log dimenticati con dati sensibili
    if(/console\.log\([^)]*(apiKey|api_key|password|token|chiave)/i.test(l)) seg(f,n,'log di un segreto',l.trim().slice(0,110));
    // 4) chiavi API vere finite nel codice
    if(/(sk-ant-[A-Za-z0-9\-_]{20,}|sk-proj-[A-Za-z0-9]{20,}|AIza[A-Za-z0-9_\-]{30,}|gsk_[A-Za-z0-9]{40,}|xai-[A-Za-z0-9]{40,})/.test(l))
      seg(f,n,'CHIAVE API NEL CODICE',l.trim().slice(0,80));
    // 5) password in chiaro
    if(/password\s*[:=]\s*['"][^'"]{3,}['"]/i.test(l) && !/hash|sha|===\s*['"]\s*['"]/i.test(l))
      seg(f,n,'password in chiaro',l.trim().slice(0,110));
    // 6) innerHTML con concatenazione di variabile non escapata (campione)
    // troppo rumoroso su 44k righe: si controlla altrove
    // 7) setInterval senza clearInterval nella stessa pagina: candidato a consumo batteria
    // 8) target="_blank" senza rel=noopener
    if(/target=["']_blank["']/.test(l) && !/rel=["'][^"']*noopener/.test(l)) seg(f,n,'_blank senza noopener',l.trim().slice(0,110));
  });

  // 9) id duplicati nel markup statico
  const ids={}, dup=[];
  let m2, re=/\sid=["']([^"']+)["']/g;
  while((m2=re.exec(t))) { ids[m2[1]]=(ids[m2[1]]||0)+1; }
  Object.keys(ids).forEach(k=>{ if(ids[k]>1) dup.push(k+'×'+ids[k]); });
  if(dup.length) seg(f,0,'id duplicati ('+dup.length+')',dup.slice(0,6).join(', '));

  // 10) tag <script> non chiusi / sbilanciati
  /* ATTENZIONE: contare le occorrenze di «<script» non basta, e per diverse
     versioni questo controllo ha segnalato index.html come «sbilanciato di 1»
     a ogni esecuzione. Era un FALSO POSITIVO, e un rapporto che mostra sempre
     lo stesso problema inesistente insegna a non leggerlo.
     Il motivo: index.html contiene un `<script type="text/html">` che porta
     dentro un DOCUMENTO HTML COMPLETO — il laboratorio quantistico, 99,7 kB —
     iniettato poi come `srcdoc` di un iframe. Le sue `</script>` interne sono
     scritte con un sentinella (`</SCRIPTBSIQ>`) che il codice sostituisce
     prima di iniettarle; ma i suoi `<script` interni sono testo, e il conteggio
     li contava come tag veri.
     Si misura quindi l'ANNIDAMENTO ignorando il contenuto dei modelli
     `type="text/html"`: è quello che fa il parser del browser, ed è la
     domanda vera — «qualche script resta aperto?». */
  const senzaModelli = t.replace(/<script\b[^>]*type=["']text\/html["'][^>]*>[\s\S]*?<\/script>/gi, '');
  const ap=(senzaModelli.match(/<script\b/g)||[]).length;
  const ch=(senzaModelli.match(/<\/script>/g)||[]).length;
  if(ap!==ch) seg(f,0,'script sbilanciati','aperti '+ap+' chiusi '+ch+' (modelli text/html esclusi)');
});

const perTipo={};
problemi.forEach(p=>{ (perTipo[p.cosa]=perTipo[p.cosa]||[]).push(p); });
Object.keys(perTipo).sort().forEach(function(k){
  console.log('\n### ' + k + '  (' + perTipo[k].length + ')');
  perTipo[k].slice(0,8).forEach(p=>console.log('   ' + p.f + (p.riga?':'+p.riga:'') + '  ' + p.testo));
  if(perTipo[k].length>8) console.log('   … e altri ' + (perTipo[k].length-8));
});
if(!problemi.length) console.log('nessun problema nelle classi cercate');

/* ═══════════════════════════════════════════════════════════════════════════
   DUE MISURE CON UN RIFERIMENTO DICHIARATO, E QUESTE FANNO FALLIRE

   Il resto di questo file e' un RAPPORTO: segnala e non blocca, perche' le
   classi che cerca hanno dei falsi positivi. Le due misure qui sotto no: sono
   conteggi esatti, e hanno un riferimento scritto. Se crescono, la batteria
   fallisce — e' il modo in cui questo progetto tiene un problema grande senza
   fingere di averlo risolto tutto in una volta.

   1 · BLOCCHI DI CODICE DUPLICATI VERBATIM. Trovato cosi' un blocco di 403
       righe (28 kB) incollato due volte in index.html: «AGGIUNTE FINALI»,
       flashcard personalizzate piu' quiz piu' diagrammi di fase. La seconda
       copia era un incollaggio TRONCATO della prima — confrontate riga per
       riga, la prima definiva 42 righe in piu' e la seconda non definiva
       niente che la prima non avesse. E' stata rimossa, e togliere il
       riferimento a zero impedisce che un'altra ricompaia.

   2 · FUNZIONI GLOBALI DEFINITE PIU' DI UNA VOLTA. Ce ne sono undici, e NON
       sono un difetto: sono lo stile dichiarato di questo file, il «patch
       additivo» che non modifica il codice esistente ma lo sovrascrive piu'
       in basso (es. `window.initTheory` che salva `_origInitTheory` e lo
       richiama). Quattro invece avevano corpi IDENTICI, cioe' erano pura
       ridondanza, e sono spariti con il blocco duplicato. Il riferimento
       tiene fermo il numero: una ridefinizione nuova va spiegata, non
       aggiunta di nascosto.
   ═══════════════════════════════════════════════════════════════════════════ */
var RIFERIMENTO = { blocchiDuplicati: 0, funzioniRidefinite: 11, corpiIdentici: 0 };

function misuraDuplicati(file) {
  var testo = fs.readFileSync(path.join(R, file), 'utf8');
  var righe = testo.split('\n');
  var norm = function (r) { return r.replace(/\s+/g, ' ').trim(); };
  var N = righe.map(norm);
  /* i punti di partenza: righe sostanziose e non troppo frequenti */
  var dove = {};
  N.forEach(function (r, i) { if (r.length > 25) { (dove[r] = dove[r] || []).push(i); } });
  var MIN = 25, gia = {}, trovati = [];
  Object.keys(dove).forEach(function (k) {
    var pos = dove[k];
    if (pos.length < 2 || pos.length > 8) return;
    for (var x = 0; x < pos.length - 1; x++) {
      for (var y = x + 1; y < pos.length; y++) {
        var a = pos[x], b = pos[y];
        if (gia[a + ':' + b]) continue;
        var n = 0;
        while (a + n < N.length && b + n < N.length && N[a + n] === N[b + n]) n++;
        if (n < MIN) continue;
        for (var q = 0; q < n; q++) gia[(a + q) + ':' + (b + q)] = 1;
        trovati.push({ a: a + 1, b: b + 1, n: n, testa: N[a].slice(0, 70) });
      }
    }
  });
  /* i blocchi contenuti in uno piu' grande non si contano due volte */
  trovati.sort(function (p, q) { return q.n - p.n; });
  var puliti = [];
  trovati.forEach(function (t) {
    var dentro = puliti.some(function (p) {
      return t.a >= p.a && t.a + t.n <= p.a + p.n && t.b >= p.b && t.b + t.n <= p.b + p.n;
    });
    if (!dentro) puliti.push(t);
  });
  /* le funzioni globali ridefinite, e se i corpi coincidono */
  var def = {};
  righe.forEach(function (r, i) {
    var m = r.match(/^window\.([a-zA-Z0-9_]+)\s*=\s*function/);
    if (m) (def[m[1]] = def[m[1]] || []).push(i + 1);
  });
  function corpo(nRiga) {
    var pos = 0, k;
    for (k = 0; k < nRiga - 1; k++) pos += righe[k].length + 1;
    var i = testo.indexOf('{', pos);
    if (i < 0) return '';
    var liv = 0, j = i;
    for (; j < testo.length; j++) {
      var c = testo[j];
      if (c === '{') liv++;
      else if (c === '}') { liv--; if (liv === 0) { j++; break; } }
    }
    return testo.slice(i, j);
  }
  function pulisci(x) {
    return x.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')
            .replace(/\s+/g, ' ').trim();
  }
  var ridefinite = [], identici = [];
  Object.keys(def).forEach(function (k) {
    if (def[k].length < 2) return;
    ridefinite.push(k + ' ×' + def[k].length);
    var corpi = def[k].map(corpo).map(pulisci);
    if (corpi.every(function (c) { return c === corpi[0]; })) identici.push(k);
  });
  return { blocchi: puliti, ridefinite: ridefinite, identici: identici };
}

console.log('\n### Duplicazioni, con riferimento dichiarato');
var m = misuraDuplicati('index.html');
var fallito = 0;
function confronta(nome, atteso, avuto, dettagli) {
  var segno = (avuto <= atteso) ? '  \u2713 ' : '  \u2717 ';
  if (avuto > atteso) fallito++;
  console.log(segno + nome + ': ' + avuto + '  (riferimento ' + atteso + ')');
  (dettagli || []).slice(0, 6).forEach(function (d) { console.log('        ' + d); });
}
confronta('blocchi duplicati verbatim (\u2265 25 righe)', RIFERIMENTO.blocchiDuplicati,
          m.blocchi.length,
          m.blocchi.map(function (t) {
            return t.n + ' righe: ' + t.a + ' \u2194 ' + t.b + '  ' + t.testa; }));
confronta('funzioni globali ridefinite', RIFERIMENTO.funzioniRidefinite,
          m.ridefinite.length, m.ridefinite);
confronta('  \u00b7 di cui con corpi IDENTICI (pura ridondanza)',
          RIFERIMENTO.corpiIdentici, m.identici.length, m.identici);
if (fallito) {
  console.log('\n\u2717 ' + fallito + ' misure sono cresciute oltre il riferimento.');
  console.log('  Se la crescita e\' voluta, si aggiorna RIFERIMENTO e si spiega perche\'.');
  process.exit(1);
}
console.log('  nessuna delle tre misure e\' cresciuta');
