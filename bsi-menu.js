/* ═══════════════════════════════════════════════════════════════════════════
   BSI MENU — Utility nel menù ✨, e le lingue per conto loro

   CHE COSA CAMBIA

   La barra di navigazione aveva sette categorie, e la settima — «🛠️ Utility» —
   raccoglieva diciotto voci che con la chimica non c'entrano: l'assistente, il
   laboratorio, le note, il File Manager, le statistiche, il Pomodoro, le
   lingue. Occupava una categoria intera accanto a Chimica, Spettroscopia e
   Farmacologia, e spingeva fuori schermo quelle che si usano davvero.

   Ora quelle voci stanno nel menù ✨, in due blocchi SEPARATI:
     · 🛠️ Utility — gli strumenti;
     · 🌍 Lingue e linguaggi — la lingua dell'interfaccia e i linguaggi
       chimici, che non sono uno strumento fra gli altri: sono il modo in cui
       si legge tutto il resto.

   DUE DECISIONI CHE VALE LA PENA SPIEGARE

   1. I PULSANTI RESTANO NEL DOM, nascosti. Cancellarli sarebbe stato più
      pulito a vedersi e sbagliato: decine di punti dell'applicazione aprono
      una sezione con `document.querySelector('[data-s=...]').click()`, e
      `goSection()` fa esattamente quello. Toglierli avrebbe rotto quei
      collegamenti in silenzio, uno per uno, senza che niente lo dicesse.
      Restano, in un pannello che non si mostra, e il menù li clicca.

   2. LE ETICHETTE SI LEGGONO DAI PULSANTI, non si riscrivono. Se le copiassi
      qui diventerebbero stringhe nuove da tradurre in tredici lingue, e la
      prossima volta che qualcuno cambia il nome di una sezione il menù
      resterebbe indietro. Leggendole dal pulsante, il menù dice sempre quello
      che dice la sezione — e la traduzione la fa già `bsi-lingue.js` sui
      pulsanti.

   IL RISCHIO CHE QUESTA MODIFICA PORTA, E LA GUARDIA CHE LO COPRE

   Una sezione raggiungibile solo da un menù è una sezione che sparisce se il
   menù si rompe. È già successo in questo progetto: le due sezioni delle
   lingue erano SOLO voci del menù ✨, e su telefono — dove il menù era
   nascosto — non si raggiungevano affatto. Per questo il banco non si
   accontenta che il pulsante esista nel DOM: pretende che ogni sezione
   spostata compaia NEL MENÙ e che cliccandola si apra davvero.

   IL MENU GIUSTO NON ERA QUELLO CHE SEMBRAVA

   Il primo tentativo agganciava `#bsi105-fab` e `#bsi13-panel`, che sono il
   pulsante ✨ e il pannello «vecchi»: esistono ancora nel documento ma sono
   `display:none` su OGNI schermo, grande e piccolo. Il menù che si vede
   davvero è `#bsi14-fab` con `#bsi14-panel`. Il banco l'ha detto subito
   — «il pulsante ✨ c'è ed è visibile → false» su entrambe le misure — e
   senza quel controllo la categoria Utility sarebbe finita in un menù che
   nessuno può aprire: irraggiungibile, come le lingue prima di lei.

   USO   si innesta da sé; `BSIMenu` per il banco.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';

  /* Le due liste. L'ordine è quello in cui stavano nella barra, perché è
     quello a cui chi usa l'applicazione è abituato. */
  var UTILITY = ['sai', 'slab', 'sghs', 'smap', 'scompare', 'spubchem',
    'sdiagrammi', 'srisorse', 'smateriali', 'snotes', 'sfilemanager',
    'sstats', 'sdatasci', 'spomo', 'slabcalc', 'sspettrolettore'];
  var LINGUE = ['slingua', 'slinguaggi'];

  function t(it, en) {
    return (globale.BSILingue && globale.BSILingue.corrente &&
            globale.BSILingue.corrente() === 'en') ? en : it;
  }

  function pulsanteDi(sid) {
    return document.querySelector('.nav-btn[data-s="' + sid + '"]');
  }

  /* L'etichetta del pulsante, senza l'icona iniziale se è un'emoji isolata:
     nel menù l'icona sta in una colonna sua. */
  function etichettaDi(b) {
    var testo = (b.textContent || '').trim().replace(/\s+/g, ' ');
    var m = testo.match(/^([\u{1F300}-\u{1FAFF}☀-➿⬀-⯿️‍]+)\s*(.*)$/u);
    if (m && m[2]) return { ic: m[1], nm: m[2] };
    /* Spectra ha un SVG al posto dell'emoji */
    return { ic: '✦', nm: testo || b.getAttribute('data-s') };
  }

  /* ── 1. la categoria sparisce dalla barra ──────────────────────────────── */
  function nascondiCategoria() {
    var tab = document.querySelector('.nav-group-tab[data-group="6"]');
    var pan = document.getElementById('navGroup6');
    if (tab) {
      tab.style.display = 'none';
      tab.setAttribute('aria-hidden', 'true');
      tab.tabIndex = -1;
    }
    if (pan) {
      /* Il pannello resta, con i suoi pulsanti: sono il bersaglio di decine
         di `[data-s=...]`.click() sparsi nell'applicazione. Nascosto sì,
         rimosso no. */
      pan.style.display = 'none';
      pan.setAttribute('aria-hidden', 'true');
      pan.setAttribute('data-bsi-spostato', 'menu');
    }
    return !!(tab && pan);
  }

  /* ── 2. le voci entrano nel pannello del menù ✨ ───────────────────────── */
  function riga(sid) {
    var b = pulsanteDi(sid);
    if (!b) return '';
    var e = etichettaDi(b);
    return '<div class="bsi14-row bsiMenu-sp" data-bsi-sez="' + sid + '">' +
      '<span class="bsi14-ic">' + e.ic + '</span>' +
      '<div class="bsi14-tx"><div class="bsi14-nm">' + e.nm + '</div></div>' +
      '<span class="bsi14-ar">›</span></div>';
  }

  function inserisci() {
    var pan = document.getElementById('bsi14-panel');
    if (!pan) return false;
    /* se ci sono già, si rifanno: la lingua può essere cambiata */
    [].forEach.call(pan.querySelectorAll('.bsiMenu-sez, .bsiMenu-sp'),
                    function (n) { n.remove(); });

    var h = '<div class="bsi14-sec bsiMenu-sez">🛠️ ' + t('Utility', 'Utility') + '</div>';
    var quante = 0;
    UTILITY.forEach(function (s) { var r = riga(s); if (r) { h += r; quante++; } });
    h += '<div class="bsi14-sec bsiMenu-sez">🌍 ' +
         t('Lingue e linguaggi', 'Languages') + '</div>';
    LINGUE.forEach(function (s) { var r = riga(s); if (r) { h += r; quante++; } });

    /* Si raccolgono i nodi NELL'ORDINE voluto prima di toccare il pannello,
       e poi si inseriscono uno dopo l'altro con un riferimento che avanza.
       Il primo tentativo li inseriva tutti subito dopo l'intestazione e poi
       provava a rimetterli in ordine: ogni inserimento li rovesciava, e il
       secondo giro li rovesciava di nuovo — il menù usciva con «Lingue»
       prima di «Utility» e ogni blocco al contrario. */
    var d = document.createElement('div');
    d.innerHTML = h;
    var nodi = [].slice.call(d.childNodes);
    var rif = pan.querySelector('#bsi13-hd');
    if (!rif) { nodi.forEach(function (n) { pan.appendChild(n); }); }
    else {
      nodi.forEach(function (n) {
        pan.insertBefore(n, rif.nextSibling);
        rif = n;
      });
    }

    [].forEach.call(pan.querySelectorAll('.bsiMenu-sp'), function (r) {
      r.onclick = function (ev) {
        ev.stopPropagation();
        var sid = r.getAttribute('data-bsi-sez');
        if (typeof globale._closeSheet === 'function') globale._closeSheet();
        else {
          var s = document.getElementById('bsi14-sheet');
          if (s) s.classList.remove('open');
        }
        setTimeout(function () {
          var b = pulsanteDi(sid);
          if (b) b.click();
        }, 60);
      };
    });
    return quante;
  }

  /* ── 3. quando ─────────────────────────────────────────────────────────── */
  function applica() {
    nascondiCategoria();
    return inserisci();
  }

  /* Il pannello viene costruito al primo clic sul ✨, non all'avvio: si
     aspetta che esista invece di indovinare quando. */
  var osservatore = null;
  function sorveglia() {
    if (document.getElementById('bsi14-panel')) { applica(); return; }
    if (osservatore) return;
    osservatore = new MutationObserver(function () {
      if (document.getElementById('bsi14-panel')) {
        applica();
        osservatore.disconnect();
        osservatore = null;
      }
    });
    osservatore.observe(document.body, { childList: true, subtree: false });
  }

  function avvia() {
    nascondiCategoria();
    sorveglia();
    /* il clic sul ✨ costruisce il pannello: subito dopo si inserisce */
    document.addEventListener('click', function (e) {
      var f = e.target && e.target.closest ? e.target.closest('#bsi14-fab') : null;
      if (!f) return;
      setTimeout(function () { applica(); }, 40);
    }, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', avvia);
  } else avvia();
  /* la barra può essere ricostruita da altro codice: si riapplica a tratti
     nei primi secondi, poi si smette */
  [300, 900, 2000, 4000].forEach(function (ms) { setTimeout(nascondiCategoria, ms); });

  document.addEventListener('bsi-lingua', function () {
    if (document.getElementById('bsi14-panel')) inserisci();
  });

  globale.BSIMenu = {
    UTILITY: UTILITY, LINGUE: LINGUE,
    applica: applica, inserisci: inserisci, nascondiCategoria: nascondiCategoria,
    /* per il banco: che cosa è dove */
    stato: function () {
      var pan = document.getElementById('bsi14-panel');
      var tab = document.querySelector('.nav-group-tab[data-group="6"]');
      return {
        categoriaNascosta: !!(tab && getComputedStyle(tab).display === 'none'),
        pulsantiAncoraNelDom: UTILITY.concat(LINGUE)
          .filter(function (s) { return !!pulsanteDi(s); }).length,
        vociNelMenu: pan ? pan.querySelectorAll('.bsiMenu-sp').length : 0,
        sezioniNelMenu: pan ? [].map.call(pan.querySelectorAll('.bsiMenu-sp'),
          function (r) { return r.getAttribute('data-bsi-sez'); }) : [],
        intestazioni: pan ? [].map.call(pan.querySelectorAll('.bsiMenu-sez'),
          function (r) { return r.textContent; }) : []
      };
    }
  };

})(typeof window !== 'undefined' ? window : globalThis);
