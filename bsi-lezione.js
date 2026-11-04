/* ═══════════════════════════════════════════════════════════════════════════
   bsi-lezione.js — una lezione guidata per ogni sezione
   BioSpecInfo · © Samuele Pio Provenzano

   PERCHE' ESISTE
   Richiesta dell'autore: «qualcosa come la lezione interattiva di Every Joule,
   ma per ogni sezione dell'app». Ogni sezione diventa una lezione in capitoli:
   la simulazione vera resta sullo schermo e si muove da sola mentre la
   narrazione la spiega.

   COME E' FATTA UNA LEZIONE
   Non e' scritta a mano per ognuna delle quasi duecento sezioni: nasce dalla
   sezione stessa, letta come la leggerebbe un insegnante.
   · APERTURA: titolo e sottotitolo della sezione.
   · PER OGNI SCHEDA: si apre la scheda; la sua spiegazione si legge a pezzi di
     una o due frasi; ogni CURSORE viene mostrato al lavoro (scorre dal minimo al
     massimo e torna dov'era, mentre il grafico o la scena 3D cambiano davanti a
     chi guarda); ogni SCELTA passa in rassegna le sue opzioni; le TELE e le
     SCENE 3D vengono illuminate con un riflettore («guarda qui»).
   · VERIFICA: una domanda presa dal kit di studio della materia, la piu' vicina
     all'argomento della sezione (parole in comune con titolo, sottotitolo e
     schede), con la spiegazione dopo la risposta.
   · CHIUSURA: i capitoli percorsi, e la strada per continuare (Spectra, quiz).
   Le sezioni piu' vecchie, senza schede, si leggono per titoli e paragrafi e
   illuminano i loro grafici e i loro comandi allo stesso modo.

   IL LETTORE
   Un pannello che non copre la sezione (a destra sullo schermo grande, in basso
   sul telefono) con l'avanzamento per capitoli, il testo che compare, i tasti
   ◀ ▶ ⏯ e la voce. Il riflettore oscura il resto della pagina e lascia luce
   solo sul pezzo di cui si parla. La voce e' quella di Spectra (bsi-spectra-
   live.js) se c'e'; altrimenti la sintesi del browser; senza voce, il tempo di
   lettura dipende dalla lunghezza del testo. Con «riduci movimento» i cursori
   saltano al valore invece di scorrere e il riflettore non pulsa.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var D = document;
  function t(it, en) { return (globale.BSILingue && globale.BSILingue.corrente && globale.BSILingue.corrente() === 'en') ? en : it; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function pulito(s) { return String(s || '').replace(/\s+/g, ' ').trim(); }
  function senzaIcona(s) { return pulito(s).replace(/^[^\wÀ-ÿ(]+/, ''); }
  function lento() { return globale.matchMedia && globale.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function visibile(el) { return !!(el && el.offsetParent !== null && el.getBoundingClientRect().width > 4); }
  function materia() { return globale.BSIMaterie ? globale.BSIMaterie.corrente() : 'chimica'; }

  /* ═══ 1. LEGGERE LA SEZIONE ═══════════════════════════════════════════════ */
  function sezioneAttiva() {
    /* la sezione visibile piu' interna (alcune sezioni ne contengono altre) */
    var vis = [].filter.call(D.querySelectorAll('.section'), function (s) { return s.offsetParent !== null && s.getBoundingClientRect().height > 40; });
    var interne = vis.filter(function (s) { return !vis.some(function (x) { return x !== s && s.contains(x); }); });
    return interne[0] || vis[0] || null;
  }
  /* il testo spezzato in pezzi da una o due frasi, al massimo ~260 caratteri */
  function pezzi(testo, max) {
    var frasi = pulito(testo).match(/[^.!?;:]+[.!?;:]*(\s|$)/g) || [], out = [], cur = '';
    frasi.forEach(function (f) { f = f.trim(); if (!f) return; if ((cur + ' ' + f).length > 260 && cur) { out.push(cur); cur = f; } else cur = cur ? cur + ' ' + f : f; });
    if (cur) out.push(cur);
    return out.slice(0, max || 4);
  }
  function etichetta(c) {
    var l = c.getAttribute('aria-label'); if (l) return pulito(l);
    var box = c.closest('.bsiFX-cursore, label'); if (box) { var sp = box.querySelector('span'); return pulito(sp ? sp.textContent : box.textContent).slice(0, 80); }
    var lab = c.id && D.querySelector('label[for="' + c.id + '"]'); return lab ? pulito(lab.textContent) : (c.name || '');
  }
  function contenitore(c) { return c.closest('.bsiFX-cursore, label, .bsiFX-riga') || c.parentNode || c; }
  /* i passi di una scheda (o di una sezione senza schede) */
  function passiDelPannello(pan, capitolo, P) {
    var nota = pan.querySelector('.bsiFX-nota, .bsiFX-sotto, p');
    var spiegazione = nota ? nota.textContent : '';
    pezzi(spiegazione, 3).forEach(function (p, i) { P.push({ tipo: 'testo', cap: capitolo, testo: p, el: i === 0 ? nota : null }); });
    var tele = [].filter.call(pan.querySelectorAll('canvas'), visibile);
    if (tele.length) {
      var tela = tele[0], tre = !tela.getContext('2d');
      P.push({ tipo: 'tela', cap: capitolo, el: tela.closest('[aria-label]') || tela, testo: tre
        ? t('Guarda la scena 3D: puoi ruotarla trascinando e avvicinarti con la rotella o con due dita. Adesso la facciamo cambiare.', 'Look at the 3D scene: drag to rotate it and zoom with the wheel or two fingers. Now we will make it change.')
        : t('Guarda qui: questo grafico è calcolato in tempo reale dal modello della sezione. Adesso lo facciamo cambiare.', 'Look here: this chart is computed live from the section\'s model. Now we will make it change.') });
    }
    var n = 0;
    [].forEach.call(pan.querySelectorAll('input[type=range], select'), function (c) {
      if (!visibile(c) || n >= 4) return; n++;
      var et = etichetta(c) || t('questo comando', 'this control');
      if (c.tagName === 'SELECT') P.push({ tipo: 'scelta', cap: capitolo, el: contenitore(c), ctl: c, testo: t('Qui scegli «', 'Here you choose «') + et + t('». Le passo in rassegna: guarda come cambia la simulazione con ognuna.', '». Let me go through them: watch how the simulation changes with each one.') });
      else P.push({ tipo: 'cursore', cap: capitolo, el: contenitore(c), ctl: c, testo: t('Questo cursore regola «', 'This slider sets «') + et + t('». Lo porto dal minimo al massimo: osserva che cosa cresce, che cosa cala e che cosa resta uguale.', '». I will take it from minimum to maximum: watch what grows, what shrinks and what stays the same.') });
    });
  }
  /* la domanda di verifica: dal kit di studio, quella con piu' parole in comune con la sezione */
  function domandaPer(sez, testoSezione) {
    var S = globale.BSIStudio, K = S && S.dati && S.dati(materia()); if (!K || !K.quiz || !K.quiz.length) return null;
    var parole = {}; pulito(testoSezione).toLowerCase().replace(/[^a-zà-ÿ0-9 ]/g, ' ').split(' ').forEach(function (w) { if (w.length > 4) parole[w] = 1; });
    var migliore = null, punti = 0;
    K.quiz.forEach(function (q) {
      if (!q || !q.r || q.k == null) return;
      var s = 0; String(q.d).toLowerCase().replace(/<[^>]+>/g, ' ').replace(/[^a-zà-ÿ0-9 ]/g, ' ').split(' ').forEach(function (w) { if (parole[w]) s++; });
      var arg = K.argomenti && K.argomenti.filter(function (a) { return a.k === q.arg; })[0];
      if (arg) String(arg.nm[0]).toLowerCase().split(/\s+/).forEach(function (w) { if (parole[w]) s += 2; });
      if (s > punti) { punti = s; migliore = q; }
    });
    return punti >= 2 ? migliore : null;
  }
  function costruisci(sez) {
    /* una sezione nascosta (un pulsante rimasto in una sezione chiusa) non fa lezione: si usa quella sullo schermo */
    if (!sez || sez.offsetParent === null) sez = sezioneAttiva(); if (!sez) return null;
    var P = [], tit = sez.querySelector('.bsiFX-tit, .section-title, h2, h3'), sotto = sez.querySelector('.bsiFX-sotto');
    var titolo = senzaIcona(tit ? tit.textContent : sez.id);
    var schede = [].slice.call(sez.querySelectorAll('.bsiFX-schede button'));
    var testoSezione = titolo + ' ' + (sotto ? sotto.textContent : '') + ' ' + schede.map(function (b) { return b.textContent; }).join(' ');
    P.push({ tipo: 'titolo', cap: 0, titolo: titolo, testo: sotto ? pezzi(sotto.textContent, 1)[0] : t('Una lezione in pochi capitoli, con la simulazione davanti agli occhi.', 'A lesson in a few chapters, with the simulation right in front of you.'), el: tit });
    var capitoli = [t('Introduzione', 'Introduction')];
    if (schede.length) {
      schede.forEach(function (b, i) {
        capitoli.push(senzaIcona(b.textContent));
        P.push({ tipo: 'scheda', cap: i + 1, bottone: b, testo: t('Capitolo ', 'Chapter ') + (i + 1) + ': ' + senzaIcona(b.textContent) + '.', el: b });
        P.push({ tipo: 'leggi', cap: i + 1, bottone: b });   /* segnaposto: i passi della scheda si leggono quando e' aperta */
      });
    } else {
      /* sezioni senza schede: titoli e paragrafi, poi grafici e comandi */
      capitoli.push(t('Esploriamo', 'Let us explore'));
      var blocchi = [].filter.call(sez.querySelectorAll('h3, h4, p'), visibile).slice(0, 6);
      blocchi.forEach(function (b) { var tx = pulito(b.textContent); if (tx.length > 30) P.push({ tipo: 'testo', cap: 1, testo: pezzi(tx, 1)[0], el: b }); });
      passiDelPannello(sez, 1, P);
    }
    var q = domandaPer(sez, testoSezione);
    if (q) { capitoli.push(t('Verifica', 'Check')); P.push({ tipo: 'quiz', cap: capitoli.length - 1, q: q, testo: q.d }); }
    capitoli.push(t('Riepilogo', 'Summary'));
    P.push({ tipo: 'fine', cap: capitoli.length - 1, titolo: titolo, testo: t('Abbiamo percorso ', 'We went through ') + (capitoli.length - 2) + t(' capitoli di «', ' chapters of «') + titolo + t('». Ora tocca a te: muovi i comandi, oppure chiedi a Spectra di approfondire un punto.', '». Now it is your turn: move the controls, or ask Spectra to go deeper on any point.') });
    return { sezione: sez, titolo: titolo, capitoli: capitoli, passi: P };
  }

  /* ═══ 2. IL LETTORE ═══════════════════════════════════════════════════════ */
  var L = null;   /* la lezione in corso */
  function stile() {
    if (D.getElementById('bsiLZ-stile')) return;
    var s = D.createElement('style'); s.id = 'bsiLZ-stile';
    s.textContent = [
      '#bsiLZ{position:fixed;z-index:2147483600;right:16px;top:calc(76px + env(safe-area-inset-top,0px));bottom:calc(16px + env(safe-area-inset-bottom,0px));width:min(400px,calc(100vw - 32px));display:flex;flex-direction:column;background:linear-gradient(165deg,rgba(10,22,48,.97),rgba(5,11,30,.98));border:1px solid rgba(143,176,255,.45);border-radius:18px;box-shadow:0 24px 70px rgba(0,0,0,.6),0 0 0 1px rgba(47,107,255,.15);color:#e6edff;font-family:system-ui,sans-serif;overflow:hidden}',
      '@media (max-width:760px){#bsiLZ{left:8px;right:8px;width:auto;top:auto;height:min(46vh,420px);bottom:calc(8px + env(safe-area-inset-bottom,0px));border-radius:16px}}',
      '#bsiLZ header{display:flex;align-items:center;gap:10px;padding:12px 14px 8px}',
      '#bsiLZ header .ico{width:40px;height:40px;flex:none;border-radius:50%;overflow:hidden;box-shadow:0 0 0 1px rgba(143,176,255,.5),0 0 14px rgba(47,107,255,.4)}',
      '#bsiLZ header .tt{flex:1;min-width:0}#bsiLZ header .k{font:800 10.5px/1.2 ui-monospace,monospace;letter-spacing:.16em;color:#8fb0ff;text-transform:uppercase}',
      '#bsiLZ header .n{font:700 15px/1.25 system-ui;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '#bsiLZ .cap{display:flex;gap:4px;padding:0 14px 8px}#bsiLZ .cap i{flex:1;height:4px;border-radius:2px;background:rgba(143,176,255,.18);overflow:hidden;position:relative}',
      '#bsiLZ .cap i b{position:absolute;inset:0;width:0;background:linear-gradient(90deg,#2f6bff,#6bcfff);transition:width .5s ease}',
      '#bsiLZ .capn{padding:0 14px 6px;font:600 12px/1.3 system-ui;color:#9db4f0}',
      '#bsiLZ .corpo{flex:1;overflow:auto;padding:6px 16px 10px}',
      '#bsiLZ .corpo h3{margin:4px 0 8px;font:800 20px/1.25 system-ui;color:#fff}',
      '#bsiLZ .corpo p{margin:0 0 10px;font:500 15.5px/1.6 system-ui;color:#dbe6ff}',
      '#bsiLZ .corpo p .w{opacity:0;transition:opacity .25s ease}#bsiLZ .corpo p .w.on{opacity:1}',
      '#bsiLZ .val{display:inline-block;margin-top:2px;padding:4px 10px;border-radius:8px;background:rgba(47,107,255,.18);border:1px solid rgba(143,176,255,.35);font:700 13px ui-monospace,monospace;color:#cfe0ff}',
      '#bsiLZ .opz{display:grid;gap:7px;margin-top:6px}#bsiLZ .opz button{text-align:left;background:rgba(16,32,64,.85);border:1px solid rgba(143,176,255,.3);color:#e6edff;border-radius:10px;padding:9px 11px;font:600 14px/1.35 system-ui;cursor:pointer}',
      '#bsiLZ .opz button.giusta{border-color:#1fd39a;background:rgba(31,211,154,.18)}#bsiLZ .opz button.sbagliata{border-color:#ff6b9d;background:rgba(255,107,157,.15)}',
      '#bsiLZ .sp{margin-top:8px;padding:9px 11px;border-left:3px solid #6bcfff;background:rgba(107,207,255,.08);border-radius:0 8px 8px 0;font:500 13.5px/1.5 system-ui;color:#cfe3f7}',
      '#bsiLZ .ricap{margin:4px 0 10px;padding-left:18px;font:500 14px/1.6 system-ui;color:#cfe0ff}',
      '#bsiLZ footer{display:flex;gap:6px;align-items:center;padding:8px 12px 12px;border-top:1px solid rgba(143,176,255,.15)}',
      '#bsiLZ footer button,#bsiLZ .az button{background:rgba(16,32,64,.85);border:1px solid rgba(143,176,255,.4);color:#e6edff;border-radius:10px;padding:8px 12px;font:700 13px/1 system-ui;cursor:pointer;min-width:42px}',
      '#bsiLZ footer button:hover,#bsiLZ footer button:focus-visible,#bsiLZ .az button:focus-visible,#bsiLZ .opz button:focus-visible{border-color:#8fb0ff;background:rgba(47,107,255,.3);outline:none}',
      '#bsiLZ footer .sp1{flex:1;text-align:center;font:600 12px ui-monospace,monospace;color:#8fa8e0}',
      '#bsiLZ .az{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}',
      /* il riflettore: un anello che segue il pezzo di cui si parla e oscura il resto */
      '#bsiLZ-luce{position:fixed;z-index:2147483590;pointer-events:none;border-radius:14px;box-shadow:0 0 0 9999px rgba(2,6,16,.58),0 0 0 2px rgba(143,176,255,.95),0 0 26px 6px rgba(47,107,255,.55);transition:left .45s ease,top .45s ease,width .45s ease,height .45s ease,opacity .3s;opacity:0}',
      '#bsiLZ-luce.on{opacity:1}',
      '@media (prefers-reduced-motion:no-preference){#bsiLZ-luce.on{animation:bsiLZpulsa 2.2s ease-in-out infinite}}',
      '@keyframes bsiLZpulsa{0%,100%{box-shadow:0 0 0 9999px rgba(2,6,16,.58),0 0 0 2px rgba(143,176,255,.95),0 0 22px 4px rgba(47,107,255,.45)}50%{box-shadow:0 0 0 9999px rgba(2,6,16,.58),0 0 0 3px rgba(143,176,255,1),0 0 34px 10px rgba(47,107,255,.7)}}',
      /* durante la lezione: niente pulsanti flottanti sopra il pannello; sullo schermo grande la pagina si sposta a sinistra */
      'body.bsiLZ-aperto [id$="-fab"],body.bsiLZ-aperto #bsi14-fab,body.bsiLZ-aperto #bsiJV-fab,body.bsiLZ-aperto #bsi-spectra-fab,body.bsiLZ-aperto #bsi105-fab,body.bsiLZ-aperto #bsi-materie,body.bsiLZ-aperto #bsi-scroll-top{visibility:hidden!important;pointer-events:none!important}',
      '@media (min-width:1100px){body.bsiLZ-aperto #main{margin-right:430px!important;transition:margin-right .35s ease}}',
      '.bsiLZ-avvia{margin:6px 0 10px;background:linear-gradient(135deg,rgba(47,107,255,.25),rgba(107,207,255,.12));border:1px solid rgba(143,176,255,.55);color:#e6edff;border-radius:999px;padding:7px 14px;font:700 13px/1 system-ui;cursor:pointer}',
      '.bsiLZ-avvia:hover,.bsiLZ-avvia:focus-visible{background:rgba(47,107,255,.4);outline:none;border-color:#8fb0ff}'
    ].join('\n');
    D.head.appendChild(s);
  }
  function luce(el) {
    var l = D.getElementById('bsiLZ-luce');
    if (!l) { l = D.createElement('div'); l.id = 'bsiLZ-luce'; l.setAttribute('aria-hidden', 'true'); D.body.appendChild(l); }
    L && (L.luceSu = el || null);
    if (!el || !visibile(el)) { l.classList.remove('on'); return; }
    posizionaLuce();
    l.classList.add('on');
  }
  function posizionaLuce() {
    var l = D.getElementById('bsiLZ-luce'); if (!l || !L || !L.luceSu) return;
    var r = L.luceSu.getBoundingClientRect(), m = 8;
    l.style.left = Math.round(r.left - m) + 'px'; l.style.top = Math.round(r.top - m) + 'px'; l.style.width = Math.round(r.width + 2 * m) + 'px'; l.style.height = Math.round(r.height + 2 * m) + 'px';
  }
  /* porta il pezzo nello spazio libero: sopra il pannello sul telefono, a sinistra sullo schermo grande */
  function mostra(el) {
    if (!el) return;
    var pan = D.getElementById('bsiLZ'), pr = pan ? pan.getBoundingClientRect() : null, r = el.getBoundingClientRect();
    var basso = pr && pr.top > innerHeight * 0.4 ? pr.top : innerHeight, centro = (Math.max(70, 0) + basso) / 2;
    var y = globale.scrollY + r.top + r.height / 2 - centro;
    try { globale.scrollTo({ top: Math.max(0, y), behavior: lento() ? 'auto' : 'smooth' }); } catch (e) { globale.scrollTo(0, Math.max(0, y)); }
  }
  /* la voce: quella di Spectra (che con una chiave OpenAI usa la voce profonda e metallica di
     bsi-spectra-voce.js); senza console di Spectra, direttamente bsi-spectra-voce.js, che a sua volta
     ripiega sulla sintesi del browser */
  function voce(testo, fatto) {
    if (!L || !L.voce) return false;
    var S = globale.BSISpectraLive;
    if (S && S.parla) { try { if (S.parla(testo, fatto) !== false) return true; } catch (e) {} }
    var V = globale.BSISpectraVoce;
    if (V && V.qualita() !== 'testo') { V.parla(testo).then(function (r) { if (!(r && r.annullato) && fatto) fatto(); }); return true; }
    return false;
  }
  function taci() { var S = globale.BSISpectraLive; if (S && S.taci) try { S.taci(); } catch (e) {} else if (globale.speechSynthesis) try { speechSynthesis.cancel(); } catch (e) {} }

  function apriPannello() {
    stile();
    var p = D.getElementById('bsiLZ');
    if (!p) {
      p = D.createElement('section'); p.id = 'bsiLZ'; p.setAttribute('role', 'dialog'); p.setAttribute('aria-live', 'polite');
      p.innerHTML = '<header><span class="ico"></span><div class="tt"><div class="k"></div><div class="n"></div></div><button type="button" class="x" style="background:none;border:0;color:#9db4f0;font-size:20px;cursor:pointer;padding:4px 6px">✕</button></header>' +
        '<div class="cap"></div><div class="capn"></div><div class="corpo"></div>' +
        '<footer><button type="button" class="ind">◀</button><button type="button" class="play">⏸</button><span class="sp1"></span><button type="button" class="voce">🔊</button><button type="button" class="avanti">▶</button></footer>';
      D.body.appendChild(p);
      p.querySelector('.x').onclick = function () { chiudi(); };
      p.querySelector('.ind').onclick = function () { vai(L.i - 1, true); };
      p.querySelector('.avanti').onclick = function () { vai(L.i + 1, true); };
      p.querySelector('.play').onclick = function () { L.auto = !L.auto; aggiornaTasti(); if (L.auto) programma(800); else clearTimeout(L.timer); };
      p.querySelector('.voce').onclick = function () { L.voce = !L.voce; if (!L.voce) taci(); aggiornaTasti(); };
      p.addEventListener('keydown', function (e) { if (e.key === 'Escape') chiudi(); else if (e.key === 'ArrowRight') vai(L.i + 1, true); else if (e.key === 'ArrowLeft') vai(L.i - 1, true); });
      globale.addEventListener('resize', posizionaLuce); globale.addEventListener('scroll', posizionaLuce, { passive: true });
    }
    var ico = p.querySelector('.ico'); ico.innerHTML = typeof globale.bsiSpectraIcon === 'function' ? globale.bsiSpectraIcon(40) : '🎓';
    p.querySelector('.k').textContent = t('Lezione con Spectra', 'Lesson with Spectra');
    p.querySelector('.n').textContent = L.lez.titolo;
    p.querySelector('.cap').innerHTML = L.lez.capitoli.map(function () { return '<i><b></b></i>'; }).join('');
    p.setAttribute('aria-label', t('Lezione: ', 'Lesson: ') + L.lez.titolo);
    [['.x', t('Chiudi la lezione', 'Close the lesson')], ['.ind', t('Passo precedente', 'Previous step')], ['.avanti', t('Passo successivo', 'Next step')]].forEach(function (x) { p.querySelector(x[0]).setAttribute('aria-label', x[1]); });
    return p;
  }
  function aggiornaTasti() {
    var p = D.getElementById('bsiLZ'); if (!p || !L) return;
    var pl = p.querySelector('.play'); pl.textContent = L.auto ? '❚❚' : '▷'; pl.setAttribute('aria-label', L.auto ? t('Metti in pausa', 'Pause') : t('Riprendi', 'Resume'));
    var vo = p.querySelector('.voce'); vo.textContent = L.voce ? '🔊' : '🔇'; vo.setAttribute('aria-label', L.voce ? t('Voce attiva', 'Voice on') : t('Voce spenta', 'Voice off'));
    p.querySelector('.sp1').textContent = (L.i + 1) + ' / ' + L.lez.passi.length;
    var capAtt = L.lez.passi[L.i] ? L.lez.passi[L.i].cap : 0;
    [].forEach.call(p.querySelectorAll('.cap i b'), function (b, k) { b.style.width = k < capAtt ? '100%' : k === capAtt ? '55%' : '0'; });
    p.querySelector('.capn').textContent = L.lez.capitoli[capAtt] ? t('Capitolo ', 'Chapter ') + (capAtt + 1) + ' / ' + L.lez.capitoli.length + ' · ' + L.lez.capitoli[capAtt] : '';
  }
  /* il testo compare parola per parola, come se lo si stesse dicendo */
  function scrivi(corpo, testo, intestazione) {
    var parole = String(testo).split(/(\s+)/), html = parole.map(function (w) { return /^\s+$/.test(w) ? w : '<span class="w">' + esc(w) + '</span>'; }).join('');
    corpo.innerHTML = (intestazione ? '<h3>' + esc(intestazione) + '</h3>' : '') + '<p>' + html + '</p>';
    var ww = corpo.querySelectorAll('.w'), k = 0, passo = lento() ? 0 : Math.max(18, Math.min(70, 2600 / Math.max(1, ww.length)));
    if (!passo) { [].forEach.call(ww, function (w) { w.classList.add('on'); }); return; }
    (function prossima() { if (!L || k >= ww.length) return; ww[k++].classList.add('on'); L.scrittura = setTimeout(prossima, passo); })();
  }
  /* il cursore al lavoro: dal valore attuale al minimo, al massimo, e di nuovo dov'era */
  function dimostraCursore(c, val, durata, fatto) {
    var lo = parseFloat(c.min), hi = parseFloat(c.max), v0 = parseFloat(c.value), step = parseFloat(c.step) || 0;
    if (!isFinite(lo) || !isFinite(hi) || hi <= lo) { fatto(); return; }
    var imposta = function (v) { if (step > 0) v = Math.round((v - lo) / step) * step + lo; v = Math.max(lo, Math.min(hi, v)); c.value = v; c.dispatchEvent(new Event('input', { bubbles: true })); if (val) val.textContent = (etichetta(c) || '') + ' = ' + c.value; };
    if (lento()) { imposta(hi); setTimeout(function () { imposta(v0); fatto(); }, 1200); return; }
    var t0 = performance.now(), tappe = [v0, lo, hi, v0];
    L.ripristina = function () { imposta(v0); c.dispatchEvent(new Event('change', { bubbles: true })); };
    (function giro(ora) {
      if (!L || L.annulla) { imposta(v0); return; }
      var f = Math.min(1, (ora - t0) / durata), seg = Math.min(2, Math.floor(f * 3)), u = f * 3 - seg, e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      imposta(tappe[seg] + (tappe[seg + 1] - tappe[seg]) * e);
      if (f < 1) L.raf = requestAnimationFrame(giro); else { L.ripristina = null; c.dispatchEvent(new Event('change', { bubbles: true })); fatto(); }
    })(t0);
  }
  function dimostraScelta(c, val, fatto) {
    var orig = c.selectedIndex, n = Math.min(c.options.length, 5), i = 0;
    L.ripristina = function () { c.selectedIndex = orig; c.dispatchEvent(new Event('change', { bubbles: true })); };
    (function prossima() {
      if (!L || L.annulla) { c.selectedIndex = orig; c.dispatchEvent(new Event('change', { bubbles: true })); return; }
      if (i >= n) { L.ripristina = null; c.selectedIndex = orig; c.dispatchEvent(new Event('change', { bubbles: true })); if (val) val.textContent = pulito(c.options[orig] ? c.options[orig].textContent : ''); fatto(); return; }
      c.selectedIndex = i; c.dispatchEvent(new Event('change', { bubbles: true })); if (val) val.textContent = '→ ' + pulito(c.options[i].textContent); i++;
      L.timer2 = setTimeout(prossima, lento() ? 900 : 1400);
    })();
  }

  function programma(ms) { clearTimeout(L.timer); if (L.auto) L.timer = setTimeout(function () { vai(L.i + 1, false); }, ms); }
  function durataLettura(testo) { return Math.max(3200, Math.min(11000, 1400 + String(testo).length * 52)); }

  function vai(i, manuale) {
    if (!L) return;
    clearTimeout(L.timer); clearTimeout(L.timer2); clearTimeout(L.scrittura); if (L.raf) cancelAnimationFrame(L.raf);
    if (manuale) taci();
    /* una dimostrazione interrotta riporta il comando dov'era */
    if (L.ripristina) { try { L.ripristina(); } catch (e) {} L.ripristina = null; }
    var P = L.lez.passi;
    i = Math.max(0, Math.min(P.length - 1, i)); L.i = i;
    var p = P[i];
    /* il segnaposto di una scheda: la si apre e si sostituisce con i suoi passi veri */
    if (p.tipo === 'leggi') {
      var nuovi = []; var pan = [].filter.call(L.lez.sezione.querySelectorAll('[role=tabpanel]'), visibile)[0] || L.lez.sezione;
      passiDelPannello(pan, p.cap, nuovi);
      if (!nuovi.length) nuovi.push({ tipo: 'testo', cap: p.cap, testo: t('Questa scheda si esplora meglio con le mani: prova i suoi comandi.', 'This tab is best explored hands-on: try its controls.') });
      P.splice.apply(P, [i, 1].concat(nuovi)); p = P[i];
    }
    var corpo = D.querySelector('#bsiLZ .corpo'); aggiornaTasti();
    var tempo = durataLettura(p.testo || ''), finito = false;
    var avanti = function () { if (finito) return; finito = true; if (L && L.i === i) programma(600); };
    var detto = voce(p.testo || '', function () { if (L && L.i === i) avanti(); });
    if (p.tipo === 'titolo') { scrivi(corpo, p.testo, p.titolo); luce(p.el); mostra(p.el); if (!detto) L.timer = setTimeout(avanti, tempo); }
    else if (p.tipo === 'scheda') {
      if (p.bottone && p.bottone.getAttribute('aria-selected') !== 'true') p.bottone.click();
      scrivi(corpo, p.testo); luce(p.el); mostra(p.el); if (!detto) L.timer = setTimeout(avanti, 2600);
    }
    else if (p.tipo === 'testo' || p.tipo === 'tela') { scrivi(corpo, p.testo); luce(p.el); mostra(p.el); if (!detto) L.timer = setTimeout(avanti, tempo); }
    else if (p.tipo === 'cursore' || p.tipo === 'scelta') {
      scrivi(corpo, p.testo); corpo.insertAdjacentHTML('beforeend', '<div class="val"></div>');
      var val = corpo.querySelector('.val'); val.textContent = etichetta(p.ctl) + ' = ' + (p.ctl.tagName === 'SELECT' ? pulito(p.ctl.options[p.ctl.selectedIndex] ? p.ctl.options[p.ctl.selectedIndex].textContent : '') : p.ctl.value);
      luce(p.el); mostra(p.el);
      /* la dimostrazione parte dopo un attimo, cosi' si vede da dove parte */
      L.timer2 = setTimeout(function () {
        var fatto = function () { if (!detto) avanti(); };
        if (p.tipo === 'cursore') dimostraCursore(p.ctl, val, 4200, fatto); else dimostraScelta(p.ctl, val, fatto);
      }, 900);
    }
    else if (p.tipo === 'quiz') {
      luce(null);
      var q = p.q;
      corpo.innerHTML = '<h3>' + esc(t('Verifica', 'Check')) + '</h3><p></p><div class="opz"></div>';
      corpo.querySelector('p').textContent = pulito(String(q.d).replace(/<[^>]+>/g, ' '));
      var opz = corpo.querySelector('.opz');
      q.r.forEach(function (r, k) {
        var b = D.createElement('button'); b.type = 'button'; b.textContent = pulito(String(r).replace(/<[^>]+>/g, ' '));
        b.onclick = function () {
          if (opz.dataset.fatto) return; opz.dataset.fatto = '1';
          [].forEach.call(opz.children, function (x, j) { if (j === q.k) x.classList.add('giusta'); });
          if (k !== q.k) b.classList.add('sbagliata');
          var esito = k === q.k ? t('Esatto. ', 'Correct. ') : t('Non proprio. ', 'Not quite. ');
          corpo.insertAdjacentHTML('beforeend', '<div class="sp"></div>'); corpo.querySelector('.sp').textContent = esito + pulito(String(q.sp || '').replace(/<[^>]+>/g, ' '));
          if (L.voce) voce(esito + pulito(String(q.sp || '').replace(/<[^>]+>/g, ' ')), function () {});
          L.risposta = k === q.k;
          programma(durataLettura(q.sp || '') + 800);
        };
        opz.appendChild(b);
      });
      /* durante la verifica la lezione aspetta la risposta */
      clearTimeout(L.timer);
    }
    else if (p.tipo === 'fine') {
      luce(null);
      corpo.innerHTML = '<h3>' + esc(t('Riepilogo', 'Summary')) + '</h3><p></p><ol class="ricap"></ol><div class="az"></div>';
      corpo.querySelector('p').textContent = p.testo;
      L.lez.capitoli.slice(1, -1).forEach(function (c) { var li = D.createElement('li'); li.textContent = c; corpo.querySelector('.ricap').appendChild(li); });
      var az = corpo.querySelector('.az');
      [[t('↺ Ripeti la lezione', '↺ Replay the lesson'), function () { var s = L.lez.sezione; chiudi(); avvia(s); }],
       [t('🤖 Chiedi a Spectra', '🤖 Ask Spectra'), function () { chiudi(); var S = globale.BSISpectraLive; if (S && S.apri) S.apri({ briefing: false }); }]
      ].forEach(function (x) { var b = D.createElement('button'); b.type = 'button'; b.textContent = x[0]; b.onclick = x[1]; az.appendChild(b); });
      L.auto = false; aggiornaTasti();
      try { var Mn = globale.BSISpectraMente; if (Mn && Mn.sente) Mn.sente('fiera', 'lezione'); } catch (e) {}
    }
  }

  /* il ✨ ha visibility:visible !important scritto in linea da un altro script: nessuna regola CSS lo
     batte, quindi lo si nasconde in linea durante la lezione e si rimette com'era alla fine */
  var FAB = ['bsi14-fab', 'bsiJV-fab', 'bsi-spectra-fab', 'bsi105-fab', 'bsi-materie'];
  function fab(nascondi) {
    FAB.forEach(function (id) {
      var e = D.getElementById(id); if (!e) return;
      if (nascondi) { if (e.dataset.bsiLzVis == null) e.dataset.bsiLzVis = e.style.getPropertyValue('visibility') + '|' + e.style.getPropertyPriority('visibility'); e.style.setProperty('visibility', 'hidden', 'important'); }
      else if (e.dataset.bsiLzVis != null) { var v = e.dataset.bsiLzVis.split('|'); if (v[0]) e.style.setProperty('visibility', v[0], v[1]); else e.style.removeProperty('visibility'); delete e.dataset.bsiLzVis; }
    });
  }
  function avvia(sez, opz) {
    var lez = costruisci(sez); if (!lez) return false;
    if (L) chiudi();
    L = { lez: lez, i: 0, auto: true, voce: !(opz && opz.muta) && 'speechSynthesis' in globale, timer: 0 };
    apriPannello(); aggiornaTasti(); D.body.classList.add('bsiLZ-aperto'); fab(true);
    clearInterval(avvia.guardia); avvia.guardia = setInterval(function () { if (L) fab(true); else clearInterval(avvia.guardia); }, 1000);
    vai(0, false);
    setTimeout(function () { var p = D.getElementById('bsiLZ'); if (p) { var b = p.querySelector('.avanti'); try { b.focus({ preventScroll: true }); } catch (e) {} } }, 50);
    return true;
  }
  function chiudi() {
    if (!L) return;
    L.annulla = true; clearTimeout(L.timer); clearTimeout(L.timer2); clearTimeout(L.scrittura); if (L.raf) cancelAnimationFrame(L.raf);
    if (L.ripristina) { try { L.ripristina(); } catch (e) {} }
    taci(); L = null; D.body.classList.remove('bsiLZ-aperto'); clearInterval(avvia.guardia); fab(false);
    var p = D.getElementById('bsiLZ'); if (p) p.remove();
    var l = D.getElementById('bsiLZ-luce'); if (l) l.classList.remove('on');
  }

  /* ═══ 3. IL PULSANTE IN OGNI SEZIONE ══════════════════════════════════════ */
  function pulsanti() {
    /* tutte le sezioni visibili (a volte ce n'e' piu' d'una, una dentro l'altra); quelle vecchie senza
       titolo standard ricevono il pulsante in cima */
    [].forEach.call(D.querySelectorAll('.section'), function (sez) {
      if (sez.offsetParent === null || sez.getBoundingClientRect().height < 40) return;
      /* un contenitore che ha dentro una sezione visibile lascia il pulsante a quella (la piu' interna) */
      if ([].some.call(sez.querySelectorAll('.section'), function (x) { return x.offsetParent !== null && x.getBoundingClientRect().height >= 40; })) return;
      var gia = sez.querySelector('.bsiLZ-avvia'); if (gia && gia.closest('.section') === sez) return;
      pulsante(sez);
    });
  }
  function pulsante(sez) {
    var tit = sez.querySelector('.bsiFX-tit, .section-title') || [].filter.call(sez.querySelectorAll('h1, h2, h3'), visibile)[0];
    stile();
    var b = D.createElement('button'); b.type = 'button'; b.className = 'bsiLZ-avvia';
    b.textContent = t('🎓 Lezione guidata con Spectra', '🎓 Guided lesson with Spectra');
    b.setAttribute('aria-label', t('Avvia la lezione guidata di questa sezione', 'Start the guided lesson for this section'));
    b.onclick = function () { avvia(sez); };
    if (tit && sez.contains(tit)) tit.insertAdjacentElement('afterend', b); else sez.insertBefore(b, sez.firstChild);
  }
  function inizia() { setInterval(pulsanti, 1200); D.addEventListener('click', function () { setTimeout(pulsanti, 250); }, true); }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', inizia); else inizia();

  globale.BSILezione = { avvia: avvia, chiudi: chiudi, costruisci: costruisci, vai: function (i) { vai(i, true); }, stato: function () { return L ? { i: L.i, passi: L.lez.passi.length, tipo: L.lez.passi[L.i].tipo, capitoli: L.lez.capitoli.slice(), auto: L.auto } : null; }, versione: '1.0' };
})(typeof window !== 'undefined' ? window : globalThis);
