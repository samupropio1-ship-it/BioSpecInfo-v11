/* ═══════════════════════════════════════════════════════════════════════════
   bsi-sellingua — il cambio lingua in intestazione, tondo

   CHE COS'E'

   Un pulsante rotondo in alto a destra, all'altezza del titolo, con la
   bandiera della lingua in uso. Si apre in un disco: le quattordici bandiere
   disposte su DUE GUSCI, sei dentro e otto fuori — e la scelta non e'
   decorativa, e' l'anello benzenico e il suo guscio esterno. In un'app di
   chimica una corona di sei si riconosce.

   Al centro del disco compare il nome della lingua su cui si passa e
   QUANTO E' TRADOTTA, misurata: non una percentuale scritta a mano, ma il
   conto che fa `bsi-lingue.js` applicando il dizionario e contando quello che
   resta in italiano.

   PERCHE' NON E' UN DOPPIONE DELLA SEZIONE «LINGUA»

   La sezione `slingua` resta, e fa un'altra cosa: spiega le lingue, mostra la
   copertura di ognuna e dichiara che l'arabo porta con se' il verso di
   scrittura. Quella INFORMA; questo AGISCE. E' la stessa distinzione fra il
   File Manager degli appunti e la pagina protetta: due nomi diversi per due
   lavori diversi, invece di due porte per la stessa cosa.

   Il cambio di lingua vero non lo fa questo file: lo fa `BSILingue.imposta()`,
   che e' l'unica casa di quella funzione. Qui c'e' solo il modo di chiamarla.

   USO   si innesta da se'; `BSISelLingua` per il banco.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';

  var APERTO = false;
  var copertureNote = null;      /* misurate una volta: costano un giro di dizionari */

  function L() { return globale.BSILingue; }
  function lingue() { return (L() && L().lingue()) ? L().lingue() : []; }
  function attuale() { return (L() && L().corrente()) ? L().corrente() : 'it'; }
  function diCodice(c) {
    var t = lingue().filter(function (x) { return x.codice === c; });
    return t[0] || { codice: c, nome: c, bandiera: '🏳️' };
  }

  function stile() {
    if (document.getElementById('bsiSL-stile')) return;
    var s = document.createElement('style');
    s.id = 'bsiSL-stile';
    s.textContent = [
      /* ── il pulsante ──────────────────────────────────────────────── */
      '#bsiSL-btn{position:relative;width:40px;height:40px;border-radius:50%;',
      ' border:1.5px solid rgba(94,234,212,.55);background:',
      ' radial-gradient(circle at 32% 28%,rgba(94,234,212,.22),rgba(10,22,40,.95) 68%);',
      ' cursor:pointer;display:flex;align-items:center;justify-content:center;',
      ' font-size:19px;line-height:1;padding:0;flex-shrink:0;',
      ' box-shadow:0 2px 10px rgba(0,0,0,.35),inset 0 0 0 1px rgba(255,255,255,.05);',
      ' transition:transform .18s cubic-bezier(.34,1.56,.64,1),border-color .18s}',
      '#bsiSL-btn:hover,#bsiSL-btn:focus-visible{transform:scale(1.08);',
      ' border-color:#5eead4;outline:none}',
      '#bsiSL-btn.on{border-color:#5eead4;transform:scale(1.04)}',
      /* l'anello che gira: un orbitale, non un caricamento */
      '#bsiSL-btn::after{content:"";position:absolute;inset:-5px;border-radius:50%;',
      ' border:1px dashed rgba(94,234,212,.4);opacity:0;transition:opacity .2s}',
      '#bsiSL-btn.on::after{opacity:1;animation:bsiSLgira 9s linear infinite}',
      '@keyframes bsiSLgira{to{transform:rotate(360deg)}}',
      /* ── il disco ─────────────────────────────────────────────────── */
      '#bsiSL-disco{position:fixed;z-index:10000;width:260px;height:260px;',
      ' border-radius:50%;display:none;',
      ' background:radial-gradient(circle at 50% 42%,rgba(13,30,52,.98),rgba(6,13,26,.99) 72%);',
      ' border:1px solid rgba(94,234,212,.3);',
      ' box-shadow:0 18px 50px rgba(0,0,0,.6),inset 0 0 40px rgba(94,234,212,.06);',
      ' backdrop-filter:blur(7px);animation:bsiSLapri .22s cubic-bezier(.34,1.4,.64,1)}',
      '#bsiSL-disco.on{display:block}',
      '@keyframes bsiSLapri{from{opacity:0;transform:scale(.82)}to{opacity:1;transform:scale(1)}}',
      /* i due gusci, disegnati: sei dentro come un anello benzenico */
      '#bsiSL-disco .bsiSL-guscio{position:absolute;border-radius:50%;',
      ' border:1px solid rgba(94,234,212,.13);pointer-events:none}',
      '.bsiSL-f{position:absolute;width:34px;height:34px;margin:-17px 0 0 -17px;',
      ' left:50%;top:50%;border-radius:50%;border:1px solid rgba(255,255,255,.12);',
      ' background:rgba(12,28,48,.92);cursor:pointer;font-size:17px;line-height:1;',
      ' display:flex;align-items:center;justify-content:center;padding:0;',
      ' transition:transform .16s cubic-bezier(.34,1.6,.64,1),border-color .16s,',
      ' box-shadow .16s}',
      '.bsiSL-f:hover,.bsiSL-f:focus-visible{transform:scale(1.34);border-color:#5eead4;',
      ' box-shadow:0 0 0 3px rgba(94,234,212,.18);outline:none;z-index:3}',
      '.bsiSL-f.ora{border-color:#5eead4;box-shadow:0 0 0 3px rgba(94,234,212,.3)}',
      /* il centro: nome e copertura */
      '#bsiSL-centro{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);',
      ' width:118px;text-align:center;pointer-events:none}',
      '#bsiSL-nome{font-size:13.5px;font-weight:800;color:#eaf6ff;line-height:1.25}',
      '#bsiSL-cop{font-size:10.5px;color:#9fe8da;margin-top:3px;line-height:1.3}',
      '#bsiSL-sug{font-size:9.5px;color:#9fb3c8;margin-top:5px;line-height:1.3}'
    ].join('');
    document.head.appendChild(s);
  }

  /* ── il pulsante in intestazione ───────────────────────────────────── */
  function pulsante() {
    var b = document.getElementById('bsiSL-btn');
    if (b) return b;
    /* DOVE VA, E PERCHE' NON NEL GRUPPO DELLE ICONE.
       Il primo tentativo l'aveva messo in `#hdr-actions`, che sembra il posto
       giusto — e che è `display:none`. Non per colpa mia: tutte e nove le
       icone di quel gruppo (condividi, scarica, installa, pomodoro…) sono
       nascoste, e il pulsante nuovo è finito invisibile con loro, larghezza
       zero. Misurato, non intuito.
       Il posto giusto è `.hdr-inner`, che è un flex con
       `justify-content:space-between`: il logo sta a sinistra, l'ultimo
       figlio finisce all'estremo destro — all'altezza del titolo, che è
       quello che serve. `align-self:center` perché su telefono quel flex
       allinea in alto. */
    var host = document.querySelector('.hdr-inner') ||
               document.getElementById('hdr') ||
               document.getElementById('hdr-actions');
    if (!host) return null;
    b = document.createElement('button');
    b.id = 'bsiSL-btn';
    b.type = 'button';
    host.appendChild(b);
    allineaAlTitolo();
    b.onclick = function (e) { e.stopPropagation(); APERTO ? chiudi() : apri(); };
    aggiorna();
    return b;
  }

  /* «ALL'ALTEZZA DEL TITOLO» SI MISURA, NON SI SPERA.
     Con `align-self:center` sul flex dell'intestazione il pulsante usciva
     allineato su schermo grande e NON su telefono: là il flex allinea in
     alto e il blocco del logo è alto due righe (nome + sottotitolo), quindi
     il centro dell'intestazione non è il centro del titolo.
     Qui si legge dove sta davvero la riga del titolo e ci si allinea sopra.
     `#hdr` è `position:sticky`, che è un valore posizionato: un figlio
     assoluto si riferisce a lui. */
  function allineaAlTitolo() {
    var b = document.getElementById('bsiSL-btn');
    var hdr = document.getElementById('hdr');
    var titolo = document.querySelector('.logo-name');
    if (!b) return false;
    if (!hdr || !titolo) { b.style.alignSelf = 'center'; b.style.marginLeft = 'auto'; return false; }
    var rh = hdr.getBoundingClientRect(), rt = titolo.getBoundingClientRect();
    if (!rt.height) { b.style.alignSelf = 'center'; b.style.marginLeft = 'auto'; return false; }
    b.style.position = 'absolute';
    b.style.right = '14px';
    b.style.top = Math.max(2, Math.round(rt.top - rh.top + rt.height / 2 - 20)) + 'px';
    b.style.marginLeft = '0';
    return true;
  }

  function aggiorna() {
    var b = document.getElementById('bsiSL-btn');
    if (!b) return;
    var l = diCodice(attuale());
    b.textContent = l.bandiera;
    /* IL NOME ACCESSIBILE NON E' LA BANDIERA. Un lettore di schermo che
       incontra 🇮🇹 legge «bandiera dell'Italia», che non dice che cosa fa il
       pulsante. */
    b.setAttribute('aria-label', 'Cambia lingua — attuale: ' + l.nome);
    b.setAttribute('aria-haspopup', 'menu');
    b.setAttribute('aria-expanded', APERTO ? 'true' : 'false');
    b.title = 'Lingua: ' + l.nome;
  }

  /* ── il disco ──────────────────────────────────────────────────────── */
  function coperture() {
    if (copertureNote) return copertureNote;
    try {
      /* Misurata, non promessa: `coperturaPerLingua` applica ogni dizionario
         e conta quello che resta in italiano. Si fa una volta sola perché
         costa un giro completo su quattordici lingue. */
      copertureNote = L() && L().coperturaPerLingua ? L().coperturaPerLingua() : {};
    } catch (e) { copertureNote = {}; }
    return copertureNote;
  }

  function percentuale(c) {
    var k = coperture()[c];
    if (!k || !k.totali) return null;
    return Math.round(k.tradotti / k.totali * 100);
  }

  function centro(testo, cop, sug) {
    var n = document.getElementById('bsiSL-nome');
    var p = document.getElementById('bsiSL-cop');
    var s = document.getElementById('bsiSL-sug');
    if (n) n.textContent = testo || '';
    if (p) p.textContent = cop || '';
    if (s) s.textContent = sug || '';
  }

  function disco() {
    var d = document.getElementById('bsiSL-disco');
    if (d) return d;
    d = document.createElement('div');
    d.id = 'bsiSL-disco';
    d.setAttribute('role', 'menu');
    d.setAttribute('aria-label', 'Scegli la lingua dell’interfaccia');
    d.innerHTML =
      '<div class="bsiSL-guscio" style="inset:34px"></div>' +
      '<div class="bsiSL-guscio" style="inset:76px"></div>' +
      '<div id="bsiSL-centro"><div id="bsiSL-nome"></div>' +
      '<div id="bsiSL-cop"></div><div id="bsiSL-sug"></div></div>';
    document.body.appendChild(d);
    d.onclick = function (e) { e.stopPropagation(); };
    return d;
  }

  function disponi() {
    var d = disco();
    [].forEach.call(d.querySelectorAll('.bsiSL-f'), function (n) { n.remove(); });
    var tutte = lingue();
    var ora = attuale();
    /* DUE GUSCI: sei dentro, il resto fuori. Sei perché un anello di sei, in
       un'applicazione di chimica, si riconosce — e perché quattordici
       bandiere su un solo cerchio si toccherebbero. */
    var dentro = tutte.slice(0, 6), fuori = tutte.slice(6);
    function metti(elenco, raggio, sfasamento) {
      elenco.forEach(function (l, i) {
        var ang = sfasamento + (2 * Math.PI * i / elenco.length);
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'bsiSL-f' + (l.codice === ora ? ' ora' : '');
        b.setAttribute('role', 'menuitem');
        b.setAttribute('data-bsi-lingua', l.codice);
        b.setAttribute('aria-label', l.nome +
          (l.codice === ora ? ' (lingua attuale)' : '') +
          (l.rtl ? ' — si scrive da destra a sinistra' : ''));
        b.textContent = l.bandiera;
        b.style.left = (50 + (raggio * Math.cos(ang)) / 2.6) + '%';
        b.style.top = (50 + (raggio * Math.sin(ang)) / 2.6) + '%';
        function mostra() {
          var p = percentuale(l.codice);
          centro(l.nome,
                 l.codice === 'it' ? 'lingua originale'
                   : (p === null ? '' : 'tradotta al ' + p + '%'),
                 l.rtl ? 'porta con sé il verso di scrittura' : '');
        }
        b.onmouseenter = mostra;
        b.onfocus = mostra;
        b.onclick = function (e) { e.stopPropagation(); scegli(l.codice); };
        d.appendChild(b);
      });
    }
    /* lo sfasamento mette la prima bandiera in alto, non a destra */
    metti(dentro, 96, -Math.PI / 2);
    metti(fuori, 196, -Math.PI / 2 + Math.PI / fuori.length);
    var l0 = diCodice(ora);
    centro(l0.nome, l0.codice === 'it' ? 'lingua originale' : 'in uso', 'tocca una bandiera');
  }

  function posiziona() {
    var b = document.getElementById('bsiSL-btn'), d = disco();
    if (!b) return;
    var r = b.getBoundingClientRect();
    var lato = 260;
    /* si apre sotto il pulsante, e si tiene dentro lo schermo: su un telefono
       un disco da 260 px ancorato a destra uscirebbe dal bordo */
    var x = Math.min(Math.max(8, r.right - lato), window.innerWidth - lato - 8);
    var y = Math.min(r.bottom + 10, window.innerHeight - lato - 8);
    d.style.left = Math.max(8, x) + 'px';
    d.style.top = Math.max(8, y) + 'px';
  }

  function apri() {
    stile(); disco(); disponi(); posiziona();
    document.getElementById('bsiSL-disco').classList.add('on');
    var b = document.getElementById('bsiSL-btn');
    if (b) b.classList.add('on');
    APERTO = true; aggiorna();
    var prima = document.querySelector('.bsiSL-f.ora') || document.querySelector('.bsiSL-f');
    if (prima) prima.focus();
  }

  function chiudi() {
    var d = document.getElementById('bsiSL-disco');
    if (d) d.classList.remove('on');
    var b = document.getElementById('bsiSL-btn');
    if (b) b.classList.remove('on');
    APERTO = false; aggiorna();
  }

  function scegli(codice) {
    if (L() && L().imposta) L().imposta(codice);
    chiudi();
    aggiorna();
    var b = document.getElementById('bsiSL-btn');
    if (b) b.focus();
  }

  /* ── innesto ───────────────────────────────────────────────────────── */
  function avvia() {
    stile();
    pulsante();
    document.addEventListener('click', function () { if (APERTO) chiudi(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && APERTO) {
        chiudi();
        var b = document.getElementById('bsiSL-btn');
        if (b) b.focus();
      }
    });
    window.addEventListener('resize', function () {
      allineaAlTitolo();
      if (APERTO) posiziona();
    });
    /* l'intestazione può essere ricostruita da altro codice: si riprova a
       tratti, come fanno gli altri moduli di questo progetto */
    [400, 1200, 2600].forEach(function (ms) {
      setTimeout(function () { pulsante(); allineaAlTitolo(); }, ms);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', avvia);
  } else avvia();

  document.addEventListener('bsi-lingua', function () {
    aggiorna();
    if (APERTO) disponi();
  });

  globale.BSISelLingua = {
    apri: apri, chiudi: chiudi, scegli: scegli, aggiorna: aggiorna,
    allineaAlTitolo: allineaAlTitolo,
    /* per il banco: che cosa c'è, misurato nel documento */
    stato: function () {
      var b = document.getElementById('bsiSL-btn');
      var d = document.getElementById('bsiSL-disco');
      var r = b ? b.getBoundingClientRect() : null;
      var logo = document.querySelector('.logo-name');
      var rl = logo ? logo.getBoundingClientRect() : null;
      return {
        pulsanteEsiste: !!b,
        pulsanteVisibile: !!(b && getComputedStyle(b).display !== 'none' && r.width > 0),
        tondo: !!(b && getComputedStyle(b).borderRadius === '50%'),
        inAlto: !!(r && r.top < 90),
        aDestra: !!(r && r.left > window.innerWidth / 2),
        /* «all'altezza del titolo»: i due riquadri si sovrappongono in verticale */
        allAltezzaDelTitolo: !!(r && rl && r.bottom > rl.top && r.top < rl.bottom),
        bandiera: b ? b.textContent : '',
        nomeAccessibile: b ? b.getAttribute('aria-label') : null,
        aperto: APERTO,
        discoAperto: !!(d && d.classList.contains('on')),
        bandiereNelDisco: d ? d.querySelectorAll('.bsiSL-f').length : 0,
        gusci: d ? d.querySelectorAll('.bsiSL-guscio').length : 0,
        /* il disco sta dentro lo schermo? su un telefono è la domanda vera */
        dentroLoSchermo: (function () {
          if (!d || !d.classList.contains('on')) return null;
          var q = d.getBoundingClientRect();
          return q.left >= 0 && q.top >= 0 &&
                 q.right <= window.innerWidth + 1 && q.bottom <= window.innerHeight + 1;
        })(),
        attuale: attuale()
      };
    },
    versione: '1.0'
  };

})(typeof window !== 'undefined' ? window : globalThis);
