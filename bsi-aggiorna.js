/* ═══════════════════════════════════════════════════════════════════════════
   bsi-aggiorna.js — «Controlla aggiornamenti», con una risposta sempre
   BioSpecInfo · © Samuele Pio Provenzano

   PERCHE' ESISTE
   L'aggiornamento era silenzioso: il service worker scaricava la versione
   nuova e solo allora compariva la barra «Nuova versione disponibile». Se la
   versione pubblicata era la stessa che si aveva gia', ricaricare o riaprire
   l'app non mostrava nulla, e non c'era modo di sapere se il controllo fosse
   avvenuto. La finestra «🔄 Aggiornamenti» del menu ✨ usa queste funzioni, e
   controlla() le riassume in un avviso a comparsa (usato anche da Spectra):
   · dice quale versione si sta usando (la chiede al service worker attivo);
   · scarica sw.js dalla rete senza cache e legge la versione pubblicata;
   · se e' la stessa lo dice («gia' aggiornata»); se e' diversa forza il
     controllo del service worker, dice che la sta scaricando, e appena e'
     pronta compare la barra di sempre (o la pagina si ricarica, se non c'e'
     lavoro aperto);
   · senza rete lo dice, invece di non fare niente.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  function t(it, en) { return (globale.BSILingue && globale.BSILingue.corrente && globale.BSILingue.corrente() !== 'it') ? en : it; }

  /* la versione del service worker attivo (il nome della sua cache) */
  function versioneInUso() {
    return new Promise(function (ok) {
      var sw = navigator.serviceWorker && navigator.serviceWorker.controller;
      if (!sw || !globale.MessageChannel) return ok(null);
      var canale = new MessageChannel(), fatto = false;
      canale.port1.onmessage = function (e) { fatto = true; ok(e.data && e.data.cache || null); };
      try { sw.postMessage({ type: 'BSI_VERSIONE' }, [canale.port2]); } catch (e) { return ok(null); }
      setTimeout(function () { if (!fatto) ok(null); }, 1500);
    });
  }
  /* la versione pubblicata: si legge in sw.js, scaricato senza cache */
  function versionePubblicata() {
    return fetch('./sw.js?controllo=' + Date.now(), { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    }).then(function (s) { var m = s.match(/var CACHE = '([^']+)'/); return m ? m[1] : null; });
  }
  function bella(v) { return v ? v.replace(/^bsi-v/, 'v') : '?'; }

  var avviso = null;
  function mostra(testo, tipo) {
    if (!avviso || !avviso.isConnected) {
      avviso = document.createElement('div'); avviso.id = 'bsi-agg-esito'; avviso.setAttribute('role', 'status'); avviso.setAttribute('aria-live', 'polite');
      avviso.style.cssText = 'position:fixed;left:12px;right:12px;bottom:calc(76px + env(safe-area-inset-bottom,0px));z-index:100001;max-width:560px;margin:0 auto;' +
        'background:#0d2a3a;color:#e9eef6;border:1px solid #1a3050;border-radius:12px;padding:11px 14px;font:600 13px/1.45 system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.45)';
      document.body.appendChild(avviso);
    }
    avviso.style.borderColor = tipo === 'ok' ? '#1fd39a' : tipo === 'nuova' ? '#00c9b7' : tipo === 'ko' ? '#ff6b9d' : '#6bcfff';
    avviso.textContent = testo;
    clearTimeout(mostra._t);
    mostra._t = setTimeout(function () { if (avviso && avviso.parentNode) avviso.parentNode.removeChild(avviso); avviso = null; }, tipo === 'nuova' ? 12000 : 7000);
  }

  function controlla() {
    mostra(t('🔄 Controllo se c\'è una versione nuova…', '🔄 Checking for a new version…'), 'info');
    var inUso;
    return versioneInUso().then(function (v) { inUso = v; return versionePubblicata(); }).then(function (pub) {
      if (!pub) throw new Error('versione illeggibile');
      if (inUso && pub === inUso) {
        mostra(t('✅ BioSpecInfo è già aggiornata: stai usando l\'ultima versione pubblicata (' + bella(pub) + ').', '✅ BioSpecInfo is up to date: you are on the latest published version (' + bella(pub) + ').'), 'ok');
        return 'aggiornata';
      }
      mostra(t('⬇️ Trovata la versione ' + bella(pub) + (inUso ? ' (hai la ' + bella(inUso) + ')' : '') + ': la sto scaricando. Quando è pronta compare «Aggiorna ora».', '⬇️ Found version ' + bella(pub) + (inUso ? ' (you have ' + bella(inUso) + ')' : '') + ': downloading it. "Update now" appears when it is ready.'), 'nuova');
      if (navigator.serviceWorker) navigator.serviceWorker.getRegistration().then(function (r) { if (r) r.update(); }).catch(function () {});
      /* senza service worker (o prima che ne esista uno) basta ricaricare dalla rete */
      if (!inUso) setTimeout(function () { if (globale._bsiAggiornamentoPronto) globale._bsiAggiornamentoPronto(); }, 1500);
      return 'nuova';
    }).catch(function () {
      mostra(t('📡 Non riesco a raggiungere il sito: controlla la connessione e riprova. L\'app continua a funzionare offline.', '📡 I cannot reach the site: check your connection and try again. The app keeps working offline.'), 'ko');
      return 'offline';
    });
  }

  globale.BSIAggiorna = { controlla: controlla, versioneInUso: versioneInUso, versionePubblicata: versionePubblicata, versione: '1.0' };
})(typeof window !== 'undefined' ? window : globalThis);
