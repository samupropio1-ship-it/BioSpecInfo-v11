/* ═══════════════════════════════════════════════════════════════════════════
   bsi-spectra-agenda.js — Spectra come assistente di ogni giorno, dentro l'app
   BioSpecInfo · © Samuele Pio Provenzano

   Quello che il servizio Spectra 2.0 (cartella spectra2/) fa su un computer
   sempre acceso, qui gira nel browser, senza installare nulla:

   · AGENDA: promemoria, compiti, eventi. «Ricordami domani alle 18 di
     chiamare il relatore» funziona anche senza chiave e senza rete: la data
     la capisce questo file. Una data non capita NON viene indovinata: si
     chiede.
   · PROMEMORIA CHE ARRIVANO: un battito ogni 15 secondi; all'ora giusta
     Spectra lo scrive, lo dice a voce e, se le notifiche sono permesse,
     manda una notifica. Quelli scaduti mentre l'app era chiusa vengono detti
     alla riapertura.
   · CONTINUITA': a ogni domanda il modello riceve quanto tempo e' passato
     dall'ultima conversazione, l'ultima cosa detta e l'agenda.
   · LA MEMORIA SI PORTA VIA: «esporta la memoria» scarica un file con tutto
     cio' che Spectra sa (ricordi, episodi, agenda); «importa la memoria» lo
     carica su un altro dispositivo.

   I LIMITI, detti chiari
   · A app CHIUSA un promemoria non suona: una pagina web non puo' svegliarsi
     da sola (servirebbe un server che manda la notifica: e' cio' che fa
     Spectra 2.0). Alla riapertura, pero', non si perde.
   · La memoria sta su questo dispositivo. Fra due dispositivi passa con il
     file, non da sola.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';
  var CHIAVE = 'bsi-spectra-agenda-v1', CHIAVE_MENTE = 'bsi-spectra-mente-v1', CHIAVE_RICORDI = 'bsi_ai_memory';
  var D = g.document;
  var A = { voci: [], n: 0, visto: 0 };

  function adesso() { return Date.now(); }
  function carica() { try { var x = JSON.parse(g.localStorage.getItem(CHIAVE) || 'null'); if (x && Array.isArray(x.voci)) A = { voci: x.voci, n: x.n || x.voci.length, visto: x.visto || 0 }; } catch (e) {} }
  function salva() { try { g.localStorage.setItem(CHIAVE, JSON.stringify(A)); } catch (e) {} if (pannello) disegna(); }
  function senzaAccenti(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’`]/g, "'"); }

  /* ── 1. le date dette a parole ─────────────────────────────────────────
     La stessa regola di spectra2/spectra/memoria/agenda.py, con le stesse prove.
     Restituisce i millisecondi, oppure null: mai una data inventata. */
  var GIORNI = { domenica: 0, lunedi: 1, martedi: 2, mercoledi: 3, giovedi: 4, venerdi: 5, sabato: 6 };
  var PARTI = { mattina: 9, stamattina: 9, pomeriggio: 15, sera: 20, stasera: 20, stanotte: 23, mezzogiorno: 12, mezzanotte: 0 };
  var MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];

  function oraIn(t) {
    var m = /\balle?\s+(\d{1,2})(?:[:.](\d{2}))?\b/.exec(t) || /\b(\d{1,2})[:.](\d{2})\b/.exec(t);
    if (m) {
      var h = +m[1], mi = +(m[2] || 0);
      if (h >= 0 && h <= 23 && mi >= 0 && mi <= 59) {
        if (h < 12 && h >= 1 && /\b(pomeriggio|sera|stasera)\b/.test(t)) h += 12;
        return [h, mi];
      }
    }
    for (var p in PARTI) if (new RegExp('\\b' + p + '\\b').test(t)) return [PARTI[p], 0];
    return null;
  }
  function giornoValido(a, me, gi) { var d = new Date(a, me, gi); return d.getFullYear() === a && d.getMonth() === me && d.getDate() === gi ? d : null; }

  function capisciQuando(testo, ora) {
    var t = senzaAccenti(testo).trim(); if (!t) return null;
    var base = new Date(ora == null ? adesso() : ora), m;
    if ((m = /^(\d{4})-(\d{2})-(\d{2})(?:[t ](\d{2}):(\d{2}))?/.exec(t))) {
      var di = giornoValido(+m[1], +m[2] - 1, +m[3]); if (!di) return null;
      di.setHours(m[4] != null ? +m[4] : 9, m[5] != null ? +m[5] : 0, 0, 0); return di.getTime();
    }
    if ((m = /\b(?:fra|tra|in)\s+(\d+|un|una|mezz)\s*'?\s*(minut[oi]|or[ae]|giorn[oi]|settiman[ae]|mes[ei])/.exec(t))) {
      var n = m[1] === 'mezz' ? 0.5 : (m[1] === 'un' || m[1] === 'una') ? 1 : +m[1], u = m[2];
      var min = /^minut/.test(u) ? n : /^or/.test(u) ? n * 60 : /^giorn/.test(u) ? n * 1440 : /^settiman/.test(u) ? n * 10080 : n * 43200;
      return base.getTime() + min * 60000;
    }
    var hm = oraIn(t), giorno = null, oggi = new Date(base.getFullYear(), base.getMonth(), base.getDate());
    var piu = function (k) { return new Date(oggi.getFullYear(), oggi.getMonth(), oggi.getDate() + k); };
    if (/\bdopodomani\b/.test(t)) giorno = piu(2);
    else if (/\bdomani\b/.test(t)) giorno = piu(1);
    else if (/\b(oggi|stasera|stanotte|stamattina)\b/.test(t)) giorno = piu(0);
    else for (var nome in GIORNI) if (new RegExp('\\b' + nome + '\\b').test(t)) { giorno = piu(((GIORNI[nome] - base.getDay()) % 7 + 7) % 7 || 7); break; }
    if (!giorno && (m = new RegExp('\\b(\\d{1,2})\\s+(' + MESI.join('|') + ')(?:\\s+(\\d{4}))?').exec(t))) {
      var a = +(m[3] || base.getFullYear()), me = MESI.indexOf(m[2]);
      giorno = giornoValido(a, me, +m[1]); if (!giorno) return null;
      if (!m[3] && giorno < oggi) giorno = giornoValido(a + 1, me, +m[1]);
      if (!giorno) return null;
    }
    if (!giorno && !hm) return null;
    if (!giorno) { giorno = piu(0); if (new Date(giorno.getFullYear(), giorno.getMonth(), giorno.getDate(), hm[0], hm[1]) <= base) giorno = piu(1); }
    return new Date(giorno.getFullYear(), giorno.getMonth(), giorno.getDate(), hm ? hm[0] : 9, hm ? hm[1] : 0).getTime();
  }

  function prossima(quando, ripeti) {
    var d = new Date(quando);
    if (ripeti === 'giorno') d.setDate(d.getDate() + 1);
    else if (ripeti === 'settimana') d.setDate(d.getDate() + 7);
    else { var gi = d.getDate(); d.setDate(1); d.setMonth(d.getMonth() + 1); d.setDate(Math.min(gi, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate())); }
    return d.getTime();
  }

  /* ── 2. le voci ──────────────────────────────────────────────────────── */
  function quandoATesto(q, ora) {
    if (q == null) return 'senza data';
    var d = new Date(q), o = new Date(ora == null ? adesso() : ora), hh = ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
    var g0 = new Date(o.getFullYear(), o.getMonth(), o.getDate()).getTime(), gd = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(), diff = Math.round((gd - g0) / 86400000);
    var giorno = diff === 0 ? 'oggi' : diff === 1 ? 'domani' : diff === -1 ? 'ieri' : (diff > 1 && diff < 7) ? ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'][d.getDay()]
      : d.getDate() + ' ' + MESI[d.getMonth()] + (d.getFullYear() !== o.getFullYear() ? ' ' + d.getFullYear() : '');
    return giorno + ' alle ' + hh;
  }
  function riga(v, ora) { return v.testo + ' — ' + quandoATesto(v.quando, ora) + (v.ripeti ? ' (ogni ' + v.ripeti + ')' : ''); }

  /** Aggiunge una voce. `quando`: millisecondi, oppure testo («domani alle 18»). Lancia un errore se la data non si capisce. */
  function aggiungi(testo, opz) {
    opz = opz || {}; testo = String(testo || '').trim().replace(/[.!]+$/, '');
    if (!testo) throw new Error('manca il testo dell\'impegno');
    var genere = /^(promemoria|compito|evento)$/.test(opz.genere) ? opz.genere : 'promemoria', q = null;
    if (opz.quando != null && opz.quando !== '') {
      q = typeof opz.quando === 'number' ? opz.quando : capisciQuando(opz.quando, opz.ora);
      if (q == null || isNaN(q)) throw new Error('non capisco quando: «' + opz.quando + '». Dimmi una data e un\'ora, per esempio «domani alle 18» o «fra due ore».');
    }
    if (genere === 'promemoria' && q == null) throw new Error('un promemoria ha bisogno di un\'ora: quando te lo devo ricordare?');
    var v = { id: 'i' + (++A.n) + '-' + Math.random().toString(36).slice(2, 6), genere: genere, testo: testo.slice(0, 240), quando: q, anticipo: Math.max(0, +opz.anticipoMinuti || 0) * 60000,
              ripeti: /^(giorno|settimana|mese)$/.test(opz.ripeti) ? opz.ripeti : null, stato: 'aperto', creato: opz.ora == null ? adesso() : opz.ora };
    A.voci.push(v); salva(); return v;
  }
  function aperti(entroMs, ora) {
    var o = ora == null ? adesso() : ora;
    return A.voci.filter(function (v) { return (v.stato === 'aperto' || v.stato === 'avvisato') && (entroMs == null || v.quando == null || v.quando <= o + entroMs); })
      .sort(function (a, b) { return (a.quando == null ? Infinity : a.quando) - (b.quando == null ? Infinity : b.quando); });
  }
  function daAvvisare(ora) { var o = ora == null ? adesso() : ora; return A.voci.filter(function (v) { return v.stato === 'aperto' && v.quando != null && v.quando - v.anticipo <= o; }); }
  function leggi(id) { return A.voci.filter(function (v) { return v.id === id; })[0] || null; }
  function completa(id, ora) {
    var v = leggi(id); if (!v) return null;
    v.stato = 'fatto'; v.chiuso = ora == null ? adesso() : ora; var seguente = null;
    if (v.ripeti && v.quando != null) {
      var q = prossima(v.quando, v.ripeti), o = v.chiuso; while (q <= o) q = prossima(q, v.ripeti);      // completato in ritardo: il prossimo e' nel futuro
      seguente = { id: 'i' + (++A.n) + '-' + Math.random().toString(36).slice(2, 6), genere: v.genere, testo: v.testo, quando: q, anticipo: v.anticipo, ripeti: v.ripeti, stato: 'aperto', creato: o };
      A.voci.push(seguente);
    }
    pota(); salva(); return seguente;
  }
  function rimanda(id, quando, ora) {
    var v = leggi(id), q = typeof quando === 'number' ? quando : capisciQuando(quando, ora);
    if (!v) return null; if (q == null) throw new Error('non capisco quando: «' + quando + '».');
    v.quando = q; v.stato = 'aperto'; salva(); return v;
  }
  function annulla(id) { var v = leggi(id); if (!v) return false; v.stato = 'annullato'; v.chiuso = adesso(); pota(); salva(); return true; }
  function pota() { var chiuse = A.voci.filter(function (v) { return v.stato === 'fatto' || v.stato === 'annullato'; }); if (chiuse.length > 60) { var via = chiuse.slice(0, chiuse.length - 60); A.voci = A.voci.filter(function (v) { return via.indexOf(v) < 0; }); } }
  function parole(s) { return senzaAccenti(s).replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(function (p) { return p.length > 2 && !/^(che|del|della|dei|delle|per|con|una|uno|gli|alla|alle|allo|nel|nella|mio|mia|miei|promemoria|impegno|compito)$/.test(p); }); }
  /** Le voci aperte che contengono tutte le parole della richiesta. */
  function trova(cosa) {
    var p = parole(cosa); if (!p.length) return [];
    return aperti().filter(function (v) { var t = ' ' + parole(v.testo).join(' ') + ' '; return p.every(function (x) { return t.indexOf(x) >= 0; }); });
  }
  function estratto(ora) {
    var o = ora == null ? adesso() : ora, v = aperti(null, o);
    if (!v.length) return '(niente in agenda)';
    return v.slice(0, 12).map(function (x) { return (x.quando != null && x.quando < o ? '! ' : '- ') + '[' + x.genere + '] ' + riga(x, o) + (x.quando != null && x.quando < o ? ' (scaduto)' : ''); }).join('\n');
  }

  /* ── 3. i comandi detti o scritti, capiti qui senza modello ──────────── */
  var PARTE = '(?:\\s+(?:di\\s+)?(?:mattina|pomeriggio|sera))?', ORA = 'alle?\\s+\\d{1,2}(?:[:.]\\d{2})?';
  var TEMPO = '(?:(?:fra|tra)\\s+mezz\'?\\s*ora|(?:fra|tra)\\s+\\S+\\s+\\S+' +
    '|(?:dopodomani|domani|oggi|stasera|stanotte|stamattina|lunedi|martedi|mercoledi|giovedi|venerdi|sabato|domenica|il\\s+\\d{1,2}\\s+[a-z]+(?:\\s+\\d{4})?)' + PARTE + '(?:\\s+' + ORA + ')?' + PARTE +
    '|' + ORA + PARTE + '|\\d{4}-\\d{2}-\\d{2}(?:[t ]\\d{2}:\\d{2})?)';
  /** Separa il quando dalla cosa. Si cerca sul testo senza accenti e si taglia l'originale (stessa lunghezza), cosi' la cosa resta scritta com'era.
      «domani alle 18 di chiamare il relatore» · «di chiamare il relatore domani alle 18» · «che venerdì alle 9:30 ho l'esame» · «l'esame domani alle 9» */
  function dividi(resto) {
    var o = String(resto || '').trim().replace(/[.!?]+$/, ''), s = senzaAccenti(o), m, q;
    var taglia = function (da, a) { return o.slice(da, a).trim(); };
    if ((m = new RegExp('^(' + TEMPO + ')\\s+(?:di\\s+|che\\s+|d\')(.+)$').exec(s)) && (q = capisciQuando(m[1])) != null) return { quando: q, cosa: taglia(s.length - m[2].length) };
    if ((m = new RegExp('^(?:di\\s+|che\\s+|d\')?(.+?)\\s+(' + TEMPO + ')$').exec(s)) && (q = capisciQuando(m[2])) != null) return { quando: q, cosa: taglia(s.length - m[2].length - m[1].length - 1 < 0 ? 0 : s.indexOf(m[1]), s.length - m[2].length) };
    if ((m = new RegExp('^(?:che\\s+)?(' + TEMPO + ')\\s+(.+)$').exec(s)) && (q = capisciQuando(m[1])) != null) return { quando: q, cosa: taglia(s.length - m[2].length) };
    if ((m = /^(?:di\s+|che\s+|d')(.+)$/.exec(s))) return { quando: null, cosa: taglia(s.length - m[1].length) };      // «ricordami di…» senza un'ora: si chiede
    return null;                                                                                                       // «ricordami la formula del benzene»: e' una domanda, non un promemoria
  }
  /** Restituisce {testo} se la frase riguarda l'agenda o la memoria da portare via; null se non e' cosa sua. */
  function comando(frase) {
    /* prima il risveglio, il meteo, la rete neurale (bsi-spectra-risveglio.js) */
    var R = g.BSISpectraRisveglio; if (R && R.comando) { var rr = R.comando(frase); if (rr) return rr; }
    var Te = g.BSITeoria; if (Te && Te.comando) { var rt = Te.comando(frase); if (rt) return rt; }
    var Me = g.BSIMemoria; if (Me && Me.comando) { var rm = Me.comando(frase); if (rm) return rm; }      /* (v254) «preferisco…», «cosa ricordi di me», «dimentica…» */      /* (v253) «teoria di…», «indice della teoria» */
    var o = String(frase || '').trim(), t = senzaAccenti(o).replace(/^(ehi |hey |ok )?(spectra|spettra)[\s,]*/, '').replace(/^(per favore |puoi |potresti )/, '').replace(/[?!.]+$/, '').trim(), m;
    if ((m = /^(?:ricordami|ricorda mi|fammi ricordare|avvisami|avvertimi|metti un promemoria|segna un promemoria|promemoria)\b[\s,:]*(.*)$/.exec(t))) {
      if (!m[1]) return { testo: 'Che cosa devo ricordarti, e quando?' };
      var d = dividi(o.replace(/[?!.]+$/, '').slice(-m[1].length));      // dall'originale: la cosa resta scritta com'era
      if (!d || !d.cosa) return null;
      if (d.quando == null) return { testo: 'Quando te lo devo ricordare? Dimmelo così: «ricordami domani alle 18 di ' + d.cosa + '».' };
      var v = aggiungi(d.cosa, { quando: d.quando, ripeti: /\bogni giorno\b|\btutti i giorni\b/.test(t) ? 'giorno' : /\bogni settimana\b/.test(t) ? 'settimana' : /\bogni mese\b/.test(t) ? 'mese' : null });
      chiediNotifiche();
      return { testo: 'Segnato: ' + riga(v) + '.' + (d.quando < adesso() ? ' È già passato: te lo dico subito.' : '') };
    }
    if (/^(agenda|la mia agenda|apri (l )?'?agenda|i miei impegni|i miei promemoria|promemoria|impegni|cosa ho da fare|che cosa ho da fare|cosa devo fare( oggi| domani)?|che impegni ho( oggi| domani)?)$/.test(t)) {
      var a = aperti(); apri();
      if (!a.length) return { testo: 'Niente in agenda. Dimmi «ricordami…» e lo segno.' };
      return { testo: (a.length === 1 ? 'Hai un impegno: ' : 'Hai ' + a.length + ' impegni. Il primo: ') + riga(a[0]) + '.' };
    }
    if ((m = /^(?:ho fatto|fatto|ho finito|completato|segna (?:come )?fatto|ho gia fatto)\s+(.+)$/.exec(t))) {
      var c = trova(m[1]);
      if (c.length === 1) { var s = completa(c[0].id); return { testo: 'Fatto: ' + c[0].testo + '.' + (s ? ' Il prossimo: ' + quandoATesto(s.quando) + '.' : '') }; }
      return null;                                            // non e' un impegno in agenda: e' una frase per il modello
    }
    if ((m = /^(?:annulla|cancella|togli|elimina)\s+(?:il |l'|la |lo )?(?:promemoria|impegno|compito|evento)\s*(?:di |per |del |della |su )?(.+)$/.exec(t))) {
      var k = trova(m[1]);
      if (k.length === 1) { annulla(k[0].id); return { testo: 'Annullato: ' + k[0].testo + '.' }; }
      return { testo: k.length ? 'Ne ho più di uno così: ' + k.slice(0, 4).map(function (x) { return x.testo; }).join('; ') + '. Quale?' : 'Non trovo quel promemoria in agenda.' };
    }
    if (/^(esporta|salva|scarica) (la )?(memoria|mia memoria|tua memoria)$/.test(t)) { esporta(); return { testo: 'Ho scaricato il file con tutto ciò che so di te. Portalo sull\'altro dispositivo e dimmi «importa la memoria».' }; }
    if (/^(importa|carica) (la )?(memoria|mia memoria|tua memoria)$/.test(t)) { scegliFile(); return { testo: 'Scegli il file della memoria che avevi esportato.' }; }
    return null;
  }

  /* ── 4. il battito: i promemoria arrivano da soli ────────────────────── */
  function chiediNotifiche() { try { if (g.Notification && g.Notification.permission === 'default') g.Notification.requestPermission(); } catch (e) {} }
  function notifica(testo) {
    try {
      if (!g.Notification || g.Notification.permission !== 'granted') return false;
      var opz = { body: testo, tag: 'spectra-promemoria', icon: './icon-192.png' };
      if (g.navigator.serviceWorker && g.navigator.serviceWorker.ready) g.navigator.serviceWorker.ready.then(function (r) { return r.showNotification('Spectra', opz); }).catch(function () { try { new g.Notification('Spectra', opz); } catch (e) {} });
      else new g.Notification('Spectra', opz);
      return true;
    } catch (e) { return false; }
  }
  function di(testo) { try { var L = g.BSISpectraLive; if (L && L.parla) L.parla(testo); else if (g.bsiVoceRobotica && g.speakRobotic) g.speakRobotic(testo); } catch (e) {} }
  function avviso(testo, classe) {
    stile();
    var n = D.createElement('div'); n.className = 'bsiAG-avviso' + (classe ? ' ' + classe : ''); n.setAttribute('role', 'alert');
    var s = D.createElement('span'); s.textContent = testo; n.appendChild(s);
    var b = D.createElement('button'); b.type = 'button'; b.textContent = 'OK'; b.onclick = function () { if (n.parentNode) n.parentNode.removeChild(n); }; n.appendChild(b);
    D.body.appendChild(n); setTimeout(function () { if (n.parentNode) n.parentNode.removeChild(n); }, 60000);
    return n;
  }
  var detti = [];
  function battito(ora) {
    var o = ora == null ? adesso() : ora, v = daAvvisare(o); if (!v.length) return [];
    var frasi = v.map(function (x) {
      var ritardo = o - x.quando, f = (x.genere === 'evento' ? 'Evento: ' : x.genere === 'compito' ? 'Scadenza: ' : 'Promemoria: ') + x.testo +
        (ritardo > 10 * 60000 ? ' — era per ' + quandoATesto(x.quando, o) + '.' : x.quando - o > 60000 ? ' — ' + quandoATesto(x.quando, o) + '.' : '.');
      x.stato = 'avvisato'; return f;
    });
    salva();
    var testo = frasi.join(' ');
    detti.push({ quando: o, testo: testo }); if (detti.length > 20) detti.shift();
    avviso('🔔 ' + testo); notifica(testo); di(testo);
    try { D.dispatchEvent(new CustomEvent('bsi-spectra-promemoria', { detail: { testo: testo, voci: v.map(function (x) { return x.id; }) } })); } catch (e) {}
    return frasi;
  }

  /* ── 5. la continuita': cio' che il modello riceve a ogni domanda ────── */
  function durata(ms) {
    var min = Math.round(ms / 60000);
    if (min < 2) return 'pochi istanti'; if (min < 60) return min + ' minuti';
    var h = Math.round(min / 60); if (h < 24) return h === 1 ? 'un\'ora' : h + ' ore';
    var gg = Math.round(h / 24); return gg === 1 ? 'un giorno' : gg + ' giorni';
  }
  function continuita(ora) {
    var o = ora == null ? adesso() : ora, ep = null, nato = null, n = 0;
    try { var M = JSON.parse(g.localStorage.getItem(CHIAVE_MENTE) || 'null'); if (M) { nato = M.nato || null; n = (M.episodi || []).length; ep = n ? M.episodi[n - 1] : null; } } catch (e) {}
    return { passato: ep ? o - ep.t : null, filo: ep ? ep.d : null, conversazioni: n, nato: nato, ritorno: !!(ep && o - ep.t > 4 * 3600000), primoIncontro: !n };
  }
  function blocco(ora) {
    var c = continuita(ora), o = ora == null ? adesso() : ora, r = ['\n[CONTINUITÀ]'];
    if (c.primoIncontro) r.push('È la prima conversazione su questo dispositivo: non hai ancora ricordi di lui qui.');
    else {
      r.push('Dall\'ultima volta che vi siete parlati: ' + durata(c.passato) + '. Conversazioni avute finora: ' + c.conversazioni + '.');
      if (c.filo) r.push('L\'ultima cosa che ti ha chiesto: «' + String(c.filo).slice(0, 140) + '»');
      if (c.ritorno) r.push('È un ritorno dopo ore: se è naturale, riprendi il filo in una frase prima di rispondere. Non salutare come se fosse la prima volta.');
    }
    r.push('Adesso: ' + new Date(o).toLocaleString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + '.');
    r.push('[AGENDA] (la curi con gli strumenti segna_impegno, leggi_agenda, chiudi_impegno; conferma sempre giorno e ora esatti)');
    r.push(estratto(o));
    return r.join('\n') + '\n';
  }

  /* ── 6. gli strumenti per il modello ─────────────────────────────────── */
  var STRUMENTI = [
    { name: 'segna_impegno',
      description: "Segna nell'agenda dell'utente un promemoria (una cosa da ricordargli a un'ora precisa), un compito (una cosa da fare, con o senza scadenza) o un evento (esame, appuntamento). Usalo quando dice «ricordami…», «devo…», «ho un appuntamento…», «l'esame è il…». Il momento passalo come lo ha detto lui («domani alle 18», «fra 2 ore», «venerdì alle 9:30», «il 12 febbraio alle 9») o come data ISO. Se lo strumento risponde che non capisce la data, CHIEDI all'utente: non indovinare.",
      parameters: { type: 'object', properties: {
        testo: { type: 'string', description: 'Che cosa, in poche parole.' },
        genere: { type: 'string', enum: ['promemoria', 'compito', 'evento'] },
        quando: { type: 'string', description: 'Quando: «domani alle 18», «fra 2 ore», oppure 2026-02-12T09:00. Obbligatorio per i promemoria.' },
        anticipo_minuti: { type: 'number', description: 'Quanti minuti prima avvisare (predefinito 0).' },
        ripeti: { type: 'string', enum: ['giorno', 'settimana', 'mese'] } }, required: ['testo', 'genere'] },
      execute: function (a) {
        try { var v = aggiungi(a && a.testo, { genere: a.genere, quando: a.quando, anticipoMinuti: a.anticipo_minuti, ripeti: a.ripeti }); chiediNotifiche(); return { ok: true, segnato: riga(v), id: v.id }; }
        catch (e) { return { ok: false, error: e.message }; }
      } },
    { name: 'leggi_agenda',
      description: "Legge gli impegni aperti dell'utente (promemoria, compiti, eventi), in ordine di tempo. Usalo quando chiede che cosa ha da fare.",
      parameters: { type: 'object', properties: { giorni: { type: 'number', description: 'Solo gli impegni entro questo numero di giorni.' } } },
      execute: function (a) { var v = aperti(a && a.giorni ? a.giorni * 86400000 : null); return { ok: true, totale: v.length, impegni: v.slice(0, 20).map(function (x) { return { genere: x.genere, cosa: x.testo, quando: quandoATesto(x.quando), scaduto: x.quando != null && x.quando < adesso() }; }) }; } },
    { name: 'chiudi_impegno',
      description: "Segna un impegno come fatto, lo annulla o lo rimanda. Usalo quando l'utente dice che una cosa è fatta, saltata o spostata.",
      parameters: { type: 'object', properties: {
        cosa: { type: 'string', description: "Parole dell'impegno da trovare." },
        azione: { type: 'string', enum: ['fatto', 'annulla', 'rimanda'] },
        quando: { type: 'string', description: 'Solo per «rimanda»: il nuovo momento.' } }, required: ['cosa', 'azione'] },
      execute: function (a) {
        var c = trova(a && a.cosa);
        if (c.length !== 1) return { ok: false, error: c.length ? 'più impegni corrispondono: ' + c.slice(0, 5).map(function (x) { return x.testo; }).join('; ') : 'impegno non trovato' };
        try {
          if (a.azione === 'fatto') { var s = completa(c[0].id); return { ok: true, fatto: c[0].testo, prossimo: s ? quandoATesto(s.quando) : null }; }
          if (a.azione === 'annulla') { annulla(c[0].id); return { ok: true, annullato: c[0].testo }; }
          if (!a.quando) return { ok: false, error: 'per rimandare serve «quando»' };
          return { ok: true, rimandato: riga(rimanda(c[0].id, a.quando)) };
        } catch (e) { return { ok: false, error: e.message }; }
      } }
  ];
  function registraStrumenti() {
    var T = g.BSI_AI_TOOLS; if (!T || !T.push) return false;
    STRUMENTI.forEach(function (s) { if (!T.some(function (x) { return x.name === s.name; })) T.push(s); });
    return true;
  }

  /* ── 7. la memoria che si porta via ──────────────────────────────────── */
  var PORTATE = [CHIAVE, CHIAVE_MENTE, CHIAVE_RICORDI, 'bsi-spectra-risveglio-v1'];
  function pacchetto() {
    var dati = {}; PORTATE.forEach(function (k) { try { var v = g.localStorage.getItem(k); if (v != null) dati[k] = v; } catch (e) {} });
    try { if (g.BSIMemoria) dati['bsi-spectra-memoria'] = g.BSIMemoria.esportaTesto(); } catch (e) {}      /* (v254) l'archivio a cinque livelli */
    return { cosa: 'memoria-di-spectra', versione: 1, esportato: new Date().toISOString(), dati: dati };
  }
  function esporta() {
    try {
      var b = new Blob([JSON.stringify(pacchetto())], { type: 'application/json' }), a = D.createElement('a');
      a.href = URL.createObjectURL(b); a.download = 'spectra-memoria-' + new Date().toISOString().slice(0, 10) + '.json';
      D.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); if (a.parentNode) a.parentNode.removeChild(a); }, 2000); return true;
    } catch (e) { return false; }
  }
  /** Carica un pacchetto esportato. Accetta solo le tre chiavi note, e solo se sono JSON valido: un file qualunque non scrive nulla. */
  function importa(testo) {
    var p; try { p = JSON.parse(testo); } catch (e) { throw new Error('il file non è una memoria di Spectra'); }
    if (!p || p.cosa !== 'memoria-di-spectra' || !p.dati || typeof p.dati !== 'object') throw new Error('il file non è una memoria di Spectra');
    var n = 0;
    PORTATE.forEach(function (k) {
      var v = p.dati[k]; if (typeof v !== 'string' || v.length > 4000000) return;
      try { JSON.parse(v); } catch (e) { return; }
      g.localStorage.setItem(k, v); n++;
    });
    if (typeof p.dati['bsi-spectra-memoria'] === 'string' && g.BSIMemoria) { try { if (g.BSIMemoria.importaTesto(p.dati['bsi-spectra-memoria']) > 0) n++; } catch (e) {} }
    if (!n) throw new Error('il file non contiene nulla da caricare');
    carica(); if (pannello) disegna();
    return { chiavi: n, impegni: aperti().length, del: p.esportato || null };
  }
  function scegliFile() {
    var i = D.createElement('input'); i.type = 'file'; i.accept = 'application/json,.json'; i.style.display = 'none';
    i.onchange = function () {
      var f = i.files && i.files[0]; if (!f) return;
      var r = new FileReader();
      r.onload = function () { try { var e = importa(String(r.result)); avviso('✅ Memoria caricata' + (e.del ? ' (del ' + e.del.slice(0, 10) + ')' : '') + '. Ricarico l\'app…', 'ok'); setTimeout(function () { g.location.reload(); }, 1800); } catch (er) { avviso('⚠️ ' + er.message); } };
      r.readAsText(f);
    };
    D.body.appendChild(i); i.click(); setTimeout(function () { if (i.parentNode) i.parentNode.removeChild(i); }, 60000);
  }

  /* ── 8. il pannello ──────────────────────────────────────────────────── */
  var pannello = null;
  function stile() {
    if (D.getElementById('bsiAG-stile')) return;
    var s = D.createElement('style'); s.id = 'bsiAG-stile';
    s.textContent =
      '.bsiAG-avviso{position:fixed;left:50%;top:calc(12px + env(safe-area-inset-top,0px));transform:translateX(-50%);z-index:100050;max-width:min(560px,calc(100vw - 24px));display:flex;gap:12px;align-items:center;' +
      'background:#06121f;color:#e8f4ff;border:1px solid #2f8fd0;border-radius:12px;padding:12px 14px;font:600 .95rem/1.4 system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.45)}' +
      '.bsiAG-avviso.ok{border-color:#1fb58f}.bsiAG-avviso button{flex:none;min-width:44px;min-height:36px;border-radius:8px;border:1px solid #2f8fd0;background:#0d2a44;color:#e8f4ff;font:inherit;cursor:pointer}' +
      '#bsiAG{position:fixed;inset:0;z-index:100040;background:rgba(2,8,16,.72);display:flex;align-items:flex-end;justify-content:center}' +
      '#bsiAG .scheda{width:min(620px,100vw);max-height:min(88vh,88dvh);overflow:auto;-webkit-overflow-scrolling:touch;background:#07121f;color:#e8f4ff;border:1px solid #1d4f78;border-radius:16px 16px 0 0;padding:16px 16px calc(18px + env(safe-area-inset-bottom,0px));font:400 .95rem/1.45 system-ui,sans-serif}' +
      '@media (min-width:700px){#bsiAG{align-items:center}#bsiAG .scheda{border-radius:16px}}' +
      '#bsiAG h2{margin:0;font-size:1.1rem;letter-spacing:.04em}#bsiAG .testa{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px}' +
      '#bsiAG button{min-height:40px;border-radius:9px;border:1px solid #2a6b9c;background:#0d2a44;color:#e8f4ff;font:600 .88rem system-ui,sans-serif;padding:6px 12px;cursor:pointer}' +
      '#bsiAG button.primo{background:#1670b8;border-color:#3d9be0}#bsiAG button:focus-visible,#bsiAG input:focus-visible{outline:2px solid #7cc8ff;outline-offset:2px}' +
      '#bsiAG form{display:flex;gap:8px;margin:8px 0 4px}#bsiAG input[type=text]{flex:1;min-width:0;min-height:42px;border-radius:9px;border:1px solid #2a6b9c;background:#04101c;color:#e8f4ff;font:inherit;padding:6px 10px}' +
      '#bsiAG .esito{min-height:1.3em;font-size:.85rem;color:#9fd0f5;margin-bottom:8px}#bsiAG ul{list-style:none;margin:0;padding:0}' +
      '#bsiAG li{display:flex;gap:10px;align-items:center;justify-content:space-between;border-top:1px solid #153550;padding:10px 0}#bsiAG li.scaduto .q{color:#ffb86b}' +
      '#bsiAG li .t{font-weight:600;overflow-wrap:anywhere}#bsiAG li .q{font-size:.83rem;color:#9fc3e0}#bsiAG li .az{display:flex;gap:6px;flex:none}' +
      '#bsiAG .vuoto{color:#9fc3e0;padding:14px 0}#bsiAG .piede{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px;border-top:1px solid #153550;padding-top:12px}#bsiAG .nota{font-size:.8rem;color:#8db0cc;margin:10px 0 0}';
    D.head.appendChild(s);
  }
  function el(tag, attr, testo) { var e = D.createElement(tag); for (var k in attr || {}) e.setAttribute(k, attr[k]); if (testo != null) e.textContent = testo; return e; }
  function disegna() {
    if (!pannello) return;
    var ul = pannello.querySelector('ul'), v = aperti(), o = adesso(); ul.textContent = '';
    if (!v.length) ul.appendChild(el('li', { class: 'vuoto' }, 'Niente in agenda. Scrivi qui sopra, o di\' a Spectra «ricordami…».'));
    v.forEach(function (x) {
      var li = el('li', x.quando != null && x.quando < o ? { class: 'scaduto' } : {}), sx = el('div'), az = el('div', { class: 'az' });
      sx.appendChild(el('div', { class: 't' }, x.testo));
      sx.appendChild(el('div', { class: 'q' }, (x.genere === 'promemoria' ? '🔔 ' : x.genere === 'evento' ? '📅 ' : '☑️ ') + quandoATesto(x.quando, o) + (x.ripeti ? ' · ogni ' + x.ripeti : '') + (x.quando != null && x.quando < o ? ' · scaduto' : '')));
      var f = el('button', { type: 'button', 'aria-label': 'Fatto: ' + x.testo }, '✓ Fatto'); f.onclick = function () { completa(x.id); };
      var c = el('button', { type: 'button', 'aria-label': 'Annulla: ' + x.testo }, '✕'); c.onclick = function () { annulla(x.id); };
      az.appendChild(f); az.appendChild(c); li.appendChild(sx); li.appendChild(az); ul.appendChild(li);
    });
  }
  function apri() {
    if (pannello) { disegna(); return pannello; }
    stile();
    pannello = el('div', { id: 'bsiAG', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Agenda di Spectra' });
    var s = el('div', { class: 'scheda' }), testa = el('div', { class: 'testa' });
    testa.appendChild(el('h2', {}, '🗓️ Agenda di Spectra'));
    var x = el('button', { type: 'button', 'aria-label': 'Chiudi' }, 'Chiudi'); x.onclick = chiudi; testa.appendChild(x); s.appendChild(testa);
    var form = el('form'), campo = el('input', { type: 'text', placeholder: 'domani alle 18 di chiamare il relatore', 'aria-label': 'Nuovo promemoria: quando e che cosa', autocomplete: 'off' });
    var ok = el('button', { type: 'submit', class: 'primo' }, 'Ricordamelo'), esito = el('div', { class: 'esito', role: 'status' });
    form.appendChild(campo); form.appendChild(ok);
    form.onsubmit = function (e) {
      e.preventDefault(); var t = campo.value.trim(); if (!t) return;
      var d = dividi(t.replace(/^ricordami\s*/i, ''));
      try {
        if (!d || d.quando == null) { esito.textContent = 'Scrivi anche quando: «domani alle 18 di…», «fra 2 ore di…».'; return; }
        var v = aggiungi(d.cosa, { quando: d.quando }); chiediNotifiche(); campo.value = ''; esito.textContent = 'Segnato: ' + riga(v) + '.';
      } catch (er) { esito.textContent = er.message; }
    };
    s.appendChild(form); s.appendChild(esito); s.appendChild(el('ul'));
    var piede = el('div', { class: 'piede' });
    var be = el('button', { type: 'button' }, '⬇️ Esporta la memoria'); be.onclick = function () { esito.textContent = esporta() ? 'File scaricato: contiene ricordi, episodi e agenda.' : 'Non sono riuscito a creare il file.'; };
    var bi = el('button', { type: 'button' }, '⬆️ Importa la memoria'); bi.onclick = scegliFile;
    piede.appendChild(be); piede.appendChild(bi); s.appendChild(piede);
    s.appendChild(el('p', { class: 'nota' }, 'I promemoria arrivano quando l\'app è aperta; quelli scaduti ad app chiusa te li dico alla riapertura. La memoria resta su questo dispositivo: per portarla su un altro, esporta qui e importa là.'));
    pannello.appendChild(s); pannello.addEventListener('click', function (e) { if (e.target === pannello) chiudi(); });
    D.body.appendChild(pannello); disegna(); setTimeout(function () { try { campo.focus({ preventScroll: true }); } catch (e) {} }, 60);
    return pannello;
  }
  function chiudi() { if (pannello && pannello.parentNode) pannello.parentNode.removeChild(pannello); pannello = null; }
  D.addEventListener('keydown', function (e) { if (e.key === 'Escape' && pannello) chiudi(); });

  /* ── avvio ───────────────────────────────────────────────────────────── */
  var timer = null;
  function avvia() {
    carica();
    if (!registraStrumenti()) { var k = 0, t = setInterval(function () { if (registraStrumenti() || ++k > 40) clearInterval(t); }, 500); }
    /* il quadro per il modello: quello della mente, piu' continuita' e agenda */
    var innesta = function () {
      var prima = g._bsiMente; if (prima && prima._conAgenda) return true;
      var f = function () { var a = ''; try { a = prima ? prima() : ''; } catch (e) {} return a + blocco(); }; f._conAgenda = true; g._bsiMente = f; return !!prima;
    };
    if (!innesta()) setTimeout(innesta, 1500);
    setTimeout(function () { battito(); }, 4000);          // cio' che e' scaduto ad app chiusa
    timer = setInterval(function () { if (!D.hidden) battito(); }, 15000);
    D.addEventListener('visibilitychange', function () { if (!D.hidden) battito(); });
  }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', avvia); else avvia();

  g.BSISpectraAgenda = {
    capisciQuando: capisciQuando, aggiungi: aggiungi, aperti: aperti, daAvvisare: daAvvisare, completa: completa, rimanda: rimanda, annulla: annulla, trova: trova, estratto: estratto,
    riga: riga, quandoATesto: quandoATesto, comando: comando, dividi: dividi, battito: battito, continuita: continuita, blocco: blocco, strumenti: STRUMENTI,
    pacchetto: pacchetto, esporta: esporta, importa: importa, apri: apri, chiudi: chiudi, avviso: avviso, notifica: notifica, detti: function () { return detti.slice(); },
    azzera: function () { A = { voci: [], n: 0, visto: 0 }; salva(); }, ricarica: carica
  };
})(typeof window !== 'undefined' ? window : globalThis);
