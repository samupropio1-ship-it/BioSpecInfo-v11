/* ═══════════════════════════════════════════════════════════════════════════
   bsi-materie-app.js — tre app in una: chimica, fisica, matematica
   BioSpecInfo · © Samuele Pio Provenzano

   PERCHE' ESISTE

   I pulsanti di `bsi-materie.js` cambiano i gruppi della barra. Non bastava:
   cambiata la materia, restavano di chimica il menu ✨, Spectra, lo Studio e
   le Utility. Chi apriva la fisica si trovava i quiz di chimica, il GHS dei
   reagenti, la ricerca delle molecole e un copilota che parlava di spettri.
   Questo modulo fa di ogni materia un'app intera:

   · la BARRA: in Studio e Utility restano le voci comuni (percorsi, guida,
     note, materiali, articoli…) e quelle della materia; le altre si
     nascondono con una regola CSS legata a `body[data-materia]`, cosi' altro
     codice che ricostruisce la barra non la puo' scavalcare;
   · il MENU ✨: in fisica e matematica il blocco «funzioni chimiche» lascia il
     posto agli strumenti al volo della materia (`bsi-attrezzi.js`); le voci
     comuni (impostazioni, app, stampa) restano;
   · SPECTRA: un'istruzione di sistema per la materia, i suggerimenti
     d'apertura e il saluto (letti da `bsi-ai-hub.js` con `BSIMaterieApp.spectra()`);
   · gli ARTICOLI si aprono sulla materia in cui si e';
   · l'INTESTAZIONE porta il nome della materia, con il suo colore.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';

  function t(it, en) { return (globale.BSILingue && globale.BSILingue.corrente && globale.BSILingue.corrente() === 'en') ? en : it; }
  function M() { return globale.BSIMaterie; }
  function corrente() { return M() ? M().corrente() : 'chimica'; }

  /* ── le voci di Studio e Utility che appartengono a UNA materia ──────── */
  var SOLO = {
    chimica: ['serrori', 'squiz', 'sexam', 'stheory', 'sbiochimx', 'sinorgx', 'slab', 'sghs', 'scompare', 'spubchem',
      'sdiagrammi', 'slabcalc', 'slinguaggi', 'srisorse', 'schiris'],
    fisica: ['sfisriass', 'sfisquiz', 'sfisflash', 'sfisform', 'sfisgloss', 'sfisris', 'sfiscost'],
    matematica: ['smatriass', 'smatquiz', 'smatflash', 'smatform', 'smatgloss', 'smatris', 'smattavole']
  };
  /* i tasti del menu ✨ che sono della chimica anche fuori dal primo blocco */
  var MENU_CHIMICA = ['challenge', 'gloss', 'jconst'];

  function stile() {
    if (document.getElementById('bsi-materie-app-stile')) return;
    var r = [];
    Object.keys(SOLO).forEach(function (m) {
      Object.keys(SOLO).forEach(function (altra) {
        if (altra === m) return;
        SOLO[altra].forEach(function (s) { r.push('body[data-materia="' + m + '"] .nav-btn[data-s="' + s + '"]'); });
      });
      r.push('body[data-materia="' + m + '"] #bsi14-panel [data-bsi-materia]:not([data-bsi-materia="' + m + '"])');
    });
    var s = document.createElement('style');
    s.id = 'bsi-materie-app-stile';
    s.textContent = r.join(',\n') + '{display:none!important}\n' +
      '#bsi-materia-chip{display:inline-block;margin-left:8px;font-size:.5em;font-weight:800;letter-spacing:.06em;text-transform:uppercase;' +
      'vertical-align:middle;padding:3px 8px;border-radius:10px;border:1px solid var(--c);color:var(--c);background:var(--f)}\n' +
      '.bsiAT-row .bsi14-ic{font-weight:800}';
    document.head.appendChild(s);
  }

  /* ── intestazione ─────────────────────────────────────────────────────── */
  function intestazione() {
    var m = corrente(), D = M() && M().MATERIE[m];
    if (!D) return;
    var nome = document.querySelector('#hdr .logo-name');
    if (!nome) return;
    var c = document.getElementById('bsi-materia-chip');
    if (!c) { c = document.createElement('span'); c.id = 'bsi-materia-chip'; nome.appendChild(c); }
    c.style.setProperty('--c', D.col); c.style.setProperty('--f', D.fondo);
    c.textContent = t(D.nm[0], D.nm[1]);
  }

  /* ── il menu ✨ ───────────────────────────────────────────────────────── */
  function adattaMenu() {
    var panel = document.getElementById('bsi14-panel');
    if (!panel) return false;
    /* 1. si marca il blocco della chimica: dalla prima intestazione «funzioni
          chimiche» fino all'intestazione successiva, piu' i tasti chimici sparsi */
    if (!panel.getAttribute('data-bsi-marcato')) {
      var dentro = false;
      [].forEach.call(panel.children, function (el) {
        if (el.classList.contains('bsi14-sec')) dentro = /chimic|chemi/i.test(el.textContent);
        if (dentro) el.setAttribute('data-bsi-materia', 'chimica');
        if (el.classList.contains('bsi14-row') && MENU_CHIMICA.indexOf(el.getAttribute('data-key')) >= 0) el.setAttribute('data-bsi-materia', 'chimica');
      });
      panel.setAttribute('data-bsi-marcato', '1');
    }
    /* 2. i blocchi di fisica e matematica, una volta sola, subito dopo la testata */
    var A = globale.BSIAttrezzi, hd = document.getElementById('bsi14-hd');
    if (A && hd && !panel.querySelector('[data-bsi-materia="fisica"]')) {
      var frammento = document.createDocumentFragment();
      ['fisica', 'matematica'].forEach(function (m) {
        var D = M() && M().MATERIE[m], sec = document.createElement('div');
        sec.className = 'bsi14-sec'; sec.setAttribute('data-bsi-materia', m);
        sec.setAttribute('data-bsi-tit', m);
        frammento.appendChild(sec);
        A.PER_MATERIA[m].forEach(function (k) {
          var r = document.createElement('div');
          r.className = 'bsi14-row hl bsiAT-row'; r.setAttribute('data-bsi-materia', m); r.setAttribute('data-attrezzo', k);
          r.setAttribute('role', 'button'); r.tabIndex = 0;
          r.innerHTML = '<span class="bsi14-ic">' + A.STRUMENTI[k].ic + '</span><div class="bsi14-tx"><div class="bsi14-nm"></div><div class="bsi14-ds"></div></div><span class="bsi14-ar">›</span>';
          r.onclick = function (e) {
            if (e) e.stopPropagation();
            var sh = document.getElementById('bsi14-sheet'); if (sh) sh.classList.remove('open');
            A.apri(k, m);
          };
          r.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); r.onclick(e); } };
          frammento.appendChild(r);
        });
        if (D) sec.style.color = D.col;
      });
      hd.parentNode.insertBefore(frammento, hd.nextSibling);
    }
    testiMenu();
    return true;
  }
  function testiMenu() {
    var panel = document.getElementById('bsi14-panel'), A = globale.BSIAttrezzi;
    if (!panel) return;
    [].forEach.call(panel.querySelectorAll('.bsi14-sec[data-bsi-tit]'), function (s) {
      var m = s.getAttribute('data-bsi-tit');
      s.textContent = m === 'fisica' ? t('⚛️ Strumenti di fisica al volo', '⚛️ Quick physics tools') : t('📐 Strumenti di matematica al volo', '📐 Quick mathematics tools');
    });
    if (A) [].forEach.call(panel.querySelectorAll('.bsiAT-row'), function (r) {
      var S = A.STRUMENTI[r.getAttribute('data-attrezzo')];
      r.querySelector('.bsi14-nm').textContent = t(S.nm[0], S.nm[1]);
      r.querySelector('.bsi14-ds').textContent = t(S.ds[0], S.ds[1]);
    });
    var tit = document.getElementById('bsi14-hd-t'), D = M() && M().MATERIE[corrente()];
    if (tit && D) tit.textContent = '🛠 ' + t('Strumenti', 'Tools') + ' · ' + t(D.nm[0], D.nm[1]);
  }

  /* ── Spectra ──────────────────────────────────────────────────────────── */
  var SPECTRA = {
    chimica: {
      prompt: '',
      intro: ['Ciao, sono <b style="color:#5eead4">Spectra</b> — il copilota AI di BioSpecInfo, ora in modalità <b>chimica</b>. Posso navigare l\'app per te, non solo parlartene. Prova:',
        'Hi, I am <b style="color:#5eead4">Spectra</b> — BioSpecInfo\'s AI copilot, now in <b>chemistry</b> mode. I can navigate the app for you, not just talk about it. Try:'],
      sugg: [['💬', 'Spiega la glicolisi passo per passo'], ['🧭', 'Aprimi la tavola periodica'], ['🔍', 'Cercami la caffeina'], ['🎓', 'Interrogami su biochimica']]
    },
    fisica: {
      prompt: 'MATERIA ATTIVA: FISICA. In questo momento BioSpecInfo e\' l\'app di fisica dell\'utente: rispondi da fisico. ' +
        'Grandezze sempre con unita\' SI e cifre significative sensate; controlla ogni risultato con l\'analisi dimensionale e con l\'ordine di grandezza; ' +
        'parti dalle leggi di conservazione (energia, quantita\' di moto, momento angolare, carica) prima di scrivere le equazioni del moto; descrivi il ' +
        'diagramma delle forze quando serve; distingui sempre il modello (punto materiale, gas ideale, campo uniforme…) dalla realta\' e dichiara le ' +
        'approssimazioni. Per i numeri usa calcola, costante_fisica (valori CODATA), converti_unita; per gli esercizi di fisica usa lo strumento di ' +
        'risoluzione della fisica e mostra lo svolgimento. L\'app ha laboratori di meccanica, onde e ottica, circuiti, termodinamica, fluidi, ' +
        'elettromagnetismo, suono, relativita\', gravitazione, calore, Ising, particelle, meccanica analitica, laser, clima, Schrodinger, materia ' +
        'condensata e un intero gruppo di ASTROFISICA (sistema solare 3D, meccanica orbitale, buchi neri e relativita\' generale, onde gravitazionali, ' +
        'vita delle stelle, galassie, cosmologia, cielo, esopianeti, matematica celeste), piu\' l\'esame di fisica, riassunti, quiz, flashcard, ' +
        'formulario, glossario, costanti e unita\', risorse e bibliografia: aprili con gli strumenti di navigazione quando aiutano a capire. ' +
        'Non portare il discorso sulla chimica se l\'utente non lo chiede.\n\n',
      intro: ['Ciao, sono <b style="color:#9d8cff">Spectra</b>, in modalità <b>fisica</b>: risolvo esercizi con lo svolgimento, controllo unità e ordini di grandezza, e apro i laboratori giusti. Prova:',
        'Hi, I am <b style="color:#9d8cff">Spectra</b>, in <b>physics</b> mode: I solve problems with full working, check units and orders of magnitude, and open the right labs. Try:'],
      sugg: [['🎯', 'Un proiettile è lanciato a 25 m/s con un angolo di 40°: gittata e quota massima?'], ['🕳️', 'Perché nessuna orbita stabile esiste sotto 6M attorno a un buco nero?'], ['🪐', 'Aprimi il sistema solare in 3D'], ['🎓', 'Interrogami su termodinamica']]
    },
    matematica: {
      prompt: 'MATERIA ATTIVA: MATEMATICA. In questo momento BioSpecInfo e\' l\'app di matematica dell\'utente: rispondi da matematico. ' +
        'Definizioni precise; enuncia i teoremi con TUTTE le ipotesi e verifica che siano soddisfatte prima di applicarli; svolgi i passaggi uno per ' +
        'uno senza saltarne; distingui condizioni necessarie e sufficienti; dai un controesempio quando un\'ipotesi manca. Verifica ogni risultato ' +
        '(una primitiva derivandola, una soluzione sostituendola, un limite con un secondo metodo). Per i conti usa calcola, risolvi_equazione e lo ' +
        'strumento di risoluzione della matematica, mai la memoria. L\'app ha sezioni di basi, studio di funzione, derivate e integrali, algebra ' +
        'lineare, equazioni differenziali, piu\' variabili, complessi e Fourier, statistica, metodi numerici, geometria analitica, calcolo vettoriale, ' +
        'probabilita\', matematica visiva, numeri e crittografia, grafi, serie, calcolo delle variazioni, topologia, strutture algebriche, teoria dei ' +
        'giochi, logica, statistica inferenziale, geometrie non euclidee, equazioni alle derivate parziali, analisi complessa, catene di Markov, ' +
        'SVD, codici, matematica celeste, piu\' l\'esame di matematica, riassunti, quiz, flashcard, formulario, glossario, tavole, risorse e ' +
        'bibliografia: aprile quando aiutano. Non portare il discorso sulla chimica se l\'utente non lo chiede.\n\n',
      intro: ['Ciao, sono <b style="color:#ffc45a">Spectra</b>, in modalità <b>matematica</b>: dimostrazioni con le ipotesi verificate, esercizi passo per passo, risultati controllati. Prova:',
        'Hi, I am <b style="color:#ffc45a">Spectra</b>, in <b>mathematics</b> mode: proofs with hypotheses checked, step-by-step exercises, verified results. Try:'],
      sugg: [['∫', 'Calcola l\'integrale di x·e^x tra 0 e 1, con i passaggi'], ['📈', 'Studia la funzione f(x) = x·e^(−x)'], ['🔲', 'Spiegami autovalori e autovettori con un esempio 2×2'], ['🎓', 'Interrogami su serie numeriche']]
    }
  };
  function spectra(m) {
    var S = SPECTRA[m || corrente()] || SPECTRA.chimica;
    return { materia: m || corrente(), prompt: S.prompt, intro: t(S.intro[0], S.intro[1]),
      suggerimenti: S.sugg.map(function (x) { return { icon: x[0], text: x[1] }; }) };
  }

  /* ── applicare la materia ─────────────────────────────────────────────── */
  function applica() {
    var m = corrente();
    document.body.setAttribute('data-materia', m);
    intestazione();
    adattaMenu();
    /* gli Articoli si aprono sulla materia in cui si e' (senza richieste di
       rete se la sezione non e' aperta) */
    var A = globale.BSIArticoli;
    if (A && typeof A.imposta === 'function') { try { A.imposta(m); } catch (e) {} }
    /* Spectra ridisegna saluto e suggerimenti se e' aperta su una chat vuota */
    try { document.dispatchEvent(new CustomEvent('bsi-spectra-materia', { detail: { materia: m } })); } catch (e) {}
  }

  function avvia() {
    stile();
    applica();
    document.addEventListener('bsi-materia', applica);
    document.addEventListener('bsi-lingua', function () { intestazione(); testiMenu(); });
    /* il menu ✨ si costruisce al primo tocco: lo si adatta appena compare */
    try {
      var mo = new MutationObserver(function () { var p = document.getElementById('bsi14-panel'); if (p && !p.getAttribute('data-bsi-marcato')) adattaMenu(); });
      mo.observe(document.body, { childList: true });
    } catch (e) {}
    /* e ogni volta che si apre, perche' i testi seguano la lingua */
    document.addEventListener('click', function (e) { if (e.target && e.target.closest && e.target.closest('#bsi14-fab')) setTimeout(adattaMenu, 0); }, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(avvia, 20); });
  else setTimeout(avvia, 20);

  globale.BSIMaterieApp = { SOLO: SOLO, spectra: spectra, adattaMenu: adattaMenu, applica: applica, versione: '1.0' };
})(typeof window !== 'undefined' ? window : globalThis);
