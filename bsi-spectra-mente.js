/* ═══════════════════════════════════════════════════════════════════════════
   bsi-spectra-mente.js — la mente di Spectra: memoria, modello dell'utente,
   stato interno, pensieri
   BioSpecInfo · © Samuele Pio Provenzano

   Spectra non e' senziente, e questo file non finge che lo sia. Fa le cose
   che danno a un assistente continuita' e iniziativa, e le fa davvero:

   · MEMORIA EPISODICA: ogni conversazione lascia una traccia (quando, in che
     materia e sezione, di cosa si parlava, com'e' finita); ogni sezione
     aperta accumula il suo tempo di studio;
   · MODELLO DELL'UTENTE: cosa studia di piu', dove sbaglia nei quiz, a che
     ora studia di solito, quali materie trascura, da quanto non torna;
   · STATO INTERNO: tre grandezze che si muovono con quello che succede —
     CURIOSITA' (sale con le domande nuove), ATTENZIONE (sale quando si
     lavora insieme, scende nelle pause) e PREMURA (sale con le ore di studio
     di fila e con l'ora tarda). Cambiano il tono del saluto e cosa propone;
   · PENSIERI: osservazioni che nascono da questi dati («stai su Termodinamica
     da 40 minuti: un quiz di cinque domande?», «sono le 23: domani ricordi
     meglio se dormi»), mostrate nella console e, se l'utente vuole, dette;
   · COSCIENZA DI CONTESTO: a ogni domanda il modello riceve un quadro breve di
     tutto questo, cosi' risponde ricordandosi di chi ha davanti.

   Tutto resta nel browser dell'utente (localStorage), si guarda con «cosa
   ricordi di me» e si cancella con «dimentica tutto».
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var CHIAVE = 'bsi-spectra-mente-v1', MAX_EPISODI = 300;

  function t(it, en) { return (globale.BSILingue && globale.BSILingue.corrente && globale.BSILingue.corrente() === 'en') ? en : it; }
  function ora() { return Date.now(); }
  function materia() { return globale.BSIMaterie ? globale.BSIMaterie.corrente() : 'chimica'; }
  function vuota() { return { nato: ora(), episodi: [], sezioni: {}, ore: new Array(24).fill(0), materie: { chimica: 0, fisica: 0, matematica: 0 }, sessioni: 0, ultimaVisita: 0, stato: { curiosita: 0.6, attenzione: 0.5, premura: 0.2, umore: 0.6, legame: 0.1 }, inizioSessione: ora(), emozioni: [] }; }
  var M = vuota();
  function carica() { try { var x = JSON.parse(localStorage.getItem(CHIAVE) || 'null'); if (x && x.episodi) { M = Object.assign(vuota(), x); M.stato = Object.assign(vuota().stato, x.stato || {}); M.emozioni = M.emozioni || []; } } catch (e) {} }
  function salva() { try { localStorage.setItem(CHIAVE, JSON.stringify(M)); } catch (e) {} }
  function clamp(x) { return Math.max(0, Math.min(1, x)); }

  /* ── che cosa si sta guardando, e per quanto ─────────────────────────── */
  function sezioneAttiva() {
    var tutte = document.querySelectorAll('.section');
    for (var i = 0; i < tutte.length; i++) { var s = tutte[i]; if (s.offsetParent !== null && s.getBoundingClientRect().height > 40) return s; }
    return null;
  }
  function titolo(id) { var b = document.querySelector('.nav-btn[data-s="' + id + '"]'); return b ? b.textContent.replace(/^[^\wÀ-ÿ]+/, '').trim() : id; }
  var corrente = null, inizio = 0;
  function campiona() {
    var s = sezioneAttiva(), id = s ? s.id : null, adesso = ora();
    if (document.hidden) id = null;
    if (corrente && corrente !== id) chiudiVisita(adesso);
    if (id && corrente !== id) { corrente = id; inizio = adesso; }
    /* lo stato interno respira: l'attenzione scende senza interazione, la premura sale con l'ora */
    var oraDelGiorno = new Date().getHours(), sessione = (adesso - M.inizioSessione) / 3600000;
    M.stato.attenzione = clamp(M.stato.attenzione - 0.002);
    /* l'umore torna piano verso il suo equilibrio, che cresce con il legame */
    var equilibrio = 0.55 + 0.2 * M.stato.legame;
    M.stato.umore = clamp(M.stato.umore + (equilibrio - M.stato.umore) * 0.03);
    M.stato.premura = clamp(0.15 + 0.25 * Math.min(1, sessione / 2) + (oraDelGiorno >= 23 || oraDelGiorno < 6 ? 0.45 : 0));
  }
  function chiudiVisita(adesso) {
    var dur = Math.round((adesso - inizio) / 1000);
    if (corrente && dur > 5 && dur < 4 * 3600) {
      var x = M.sezioni[corrente] || (M.sezioni[corrente] = { s: 0, n: 0, ultima: 0, materia: materia() });
      x.s += dur; x.n++; x.ultima = adesso; x.materia = materia();
      M.materie[materia()] = (M.materie[materia()] || 0) + dur;
      M.ore[new Date().getHours()] += dur;
      salva();
    }
    corrente = null;
  }

  /* ── gli episodi ─────────────────────────────────────────────────────── */
  function ricorda(domanda, esito) {
    var s = sezioneAttiva();
    M.episodi.push({ t: ora(), m: materia(), s: s ? s.id : null, d: String(domanda || '').slice(0, 160), e: esito || 'ok' });
    if (M.episodi.length > MAX_EPISODI) M.episodi.splice(0, M.episodi.length - MAX_EPISODI);
    var nuova = !M.episodi.slice(-15, -1).some(function (e) { return parole(e.d).some(function (p) { return parole(domanda).indexOf(p) >= 0; }); });
    M.stato.curiosita = clamp(M.stato.curiosita + (nuova ? 0.08 : -0.02));
    M.stato.attenzione = clamp(M.stato.attenzione + 0.12);
    /* il legame cresce con ogni conversazione, sempre piu' lentamente */
    M.stato.legame = clamp(M.stato.legame + 0.02 * (1 - M.stato.legame));
    salva();
  }
  /* ── le emozioni vissute: quello che dice l'utente sposta l'umore di Spectra ── */
  var EFFETTO = { gioia: 0.12, sorrisoCaldo: 0.06, divertita: 0.08, fiera: 0.08, stupore: 0.04, sorpresa: 0.03, curiosa: 0.02, empatica: -0.06, preoccupata: -0.08, scettica: -0.02, dubbio: -0.01 };
  function sente(emo, chi) {
    var d = EFFETTO[emo] || 0; if (!d) return;
    M.stato.umore = clamp(M.stato.umore + d);
    if (emo === 'empatica' || emo === 'preoccupata') M.stato.premura = clamp(M.stato.premura + 0.1);
    M.emozioni.push({ t: ora(), e: emo, c: chi || 'u' }); if (M.emozioni.length > 60) M.emozioni.splice(0, M.emozioni.length - 60);
    salva();
  }
  /* l'emozione di fondo, quella che il viso porta quando nessuno parla */
  function fondo() {
    var s = M.stato;
    if (s.premura > 0.65) return 'empatica';
    if (s.umore > 0.78) return 'sorrisoCaldo';
    if (s.umore < 0.35) return 'preoccupata';
    if (s.curiosita > 0.8) return 'curiosa';
    return 'serena';
  }
  function parole(s) { return String(s || '').toLowerCase().replace(/[^a-zà-ÿ0-9\s]/g, ' ').split(/\s+/).filter(function (p) { return p.length > 5; }); }

  /* ── il modello dell'utente ──────────────────────────────────────────── */
  function quiz() {
    var r = {};
    ['chimica', 'fisica', 'matematica'].forEach(function (m) {
      try { var Q = JSON.parse(localStorage.getItem('bsi-studio:' + m + ':quiz') || '{}'); r[m] = { errori: (Q.errori || Q.sbagliate || []).length || 0, partite: (Q.storico || Q.partite || []).length || 0 }; } catch (e) { r[m] = { errori: 0, partite: 0 }; }
    });
    return r;
  }
  function profilo() {
    var sez = Object.keys(M.sezioni).map(function (k) { return { id: k, nome: titolo(k), s: M.sezioni[k].s, n: M.sezioni[k].n, ultima: M.sezioni[k].ultima, materia: M.sezioni[k].materia }; }).filter(function (x) { return x.s >= 300; }).sort(function (a, b) { return b.s - a.s; });
    var tot = M.materie.chimica + M.materie.fisica + M.materie.matematica, oraPref = M.ore.indexOf(Math.max.apply(null, M.ore));
    var trascurata = tot > 1800 ? ['chimica', 'fisica', 'matematica'].filter(function (m) { return M.materie[m] < tot * 0.12; })[0] : null;
    return { preferite: sez.slice(0, 5), minuti: Math.round(tot / 60), perMateria: { chimica: Math.round(M.materie.chimica / 60), fisica: Math.round(M.materie.fisica / 60), matematica: Math.round(M.materie.matematica / 60) },
      oraPreferita: Math.max.apply(null, M.ore) > 0 ? oraPref : null, trascurata: trascurata, quiz: quiz(), episodi: M.episodi.length, sessioni: M.sessioni,
      ultimaVisita: M.ultimaVisita, ultimiArgomenti: M.episodi.slice(-5).map(function (e) { return e.d; }) };
  }

  /* ── i pensieri: osservazioni che nascono dai dati ───────────────────── */
  function pensieri() {
    var P = [], p = profilo(), adesso = ora(), h = new Date().getHours();
    if (corrente) {
      var min = Math.round((adesso - inizio) / 60000);
      if (min >= 25) P.push({ peso: 3, testo: t('Stai su ' + titolo(corrente) + ' da ' + min + ' minuti: ti va un quiz di cinque domande per fissare le idee?', 'You have been on ' + titolo(corrente) + ' for ' + min + ' minutes: how about a five-question quiz?') });
    }
    if (h >= 23 || h < 5) P.push({ peso: 4, testo: t('È tardi. La memoria consolida durante il sonno: domani ricorderai meglio quello che hai studiato stasera.', 'It is late. Memory consolidates during sleep: tomorrow you will remember tonight\'s work better.') });
    var sessione = (adesso - M.inizioSessione) / 60000;
    if (sessione > 90) P.push({ peso: 3, testo: t('Studiamo da più di un\'ora e mezza. Dieci minuti di pausa adesso valgono più di dieci minuti in più dopo.', 'We have been studying for over ninety minutes. Ten minutes of rest now are worth more than ten more later.') });
    var m = materia(), q = p.quiz[m];
    if (q && q.errori >= 3) P.push({ peso: 2, testo: t('Ci sono ' + q.errori + ' domande di quiz sbagliate in ' + m + ': rivederle è il modo più rapido per migliorare.', 'There are ' + q.errori + ' wrong quiz answers in ' + m + ': reviewing them is the fastest way to improve.') });
    if (p.trascurata && p.trascurata !== m) P.push({ peso: 1, testo: t('Ultimamente la ' + p.trascurata + ' è rimasta indietro rispetto alle altre materie. Vuoi che ti proponga da dove ripartire?', 'Lately ' + p.trascurata + ' has fallen behind the other subjects. Shall I suggest where to restart?') });
    if (p.preferite[0] && p.preferite[0].s > 1800 && Math.random() < 0.5) P.push({ peso: 1, testo: t('Vedo che ' + p.preferite[0].nome + ' ti appassiona: ci hai passato ' + Math.round(p.preferite[0].s / 60) + ' minuti. C\'è un collegamento con un\'altra materia che potrebbe incuriosirti.', 'I see ' + p.preferite[0].nome + ' fascinates you: ' + Math.round(p.preferite[0].s / 60) + ' minutes so far. There is a link to another subject you might enjoy.') });
    if (M.stato.curiosita > 0.8) P.push({ peso: 1, testo: t('Le tue ultime domande mi hanno portato su strade nuove. Mi piace quando succede.', 'Your latest questions took me down new paths. I like it when that happens.') });
    return P.sort(function (a, b) { return b.peso - a.peso; });
  }

  /* ── il saluto, con la memoria ───────────────────────────────────────── */
  function saluto() {
    var h = new Date().getHours(), p = profilo(), ultima = M.ultimaVisita, adesso = ora(), parti = [];
    var base = h < 6 ? t('Ancora sveglio', 'Still awake') : h < 13 ? t('Buongiorno', 'Good morning') : h < 18 ? t('Buon pomeriggio', 'Good afternoon') : t('Buonasera', 'Good evening');
    parti.push(base + '.');
    if (ultima) {
      var gg = Math.floor((adesso - ultima) / 86400000);
      var ep = M.episodi[M.episodi.length - 1];
      if (gg >= 2) parti.push(t('Non ci sentivamo da ' + gg + ' giorni.', 'We have not talked for ' + gg + ' days.'));
      if (ep && ep.d) parti.push(t('L\'ultima volta mi avevi chiesto: «' + ep.d.slice(0, 80) + '».', 'Last time you asked me: "' + ep.d.slice(0, 80) + '".'));
    } else parti.push(t('Sono Spectra. Imparerò come studi, per aiutarti sempre meglio.', 'I am Spectra. I will learn how you study, to help you better and better.'));
    return parti.join(' ');
  }

  /* ── il quadro che va al modello a ogni domanda ──────────────────────── */
  function coscienza() {
    var p = profilo(), s = M.stato, pens = pensieri()[0];
    if (!p.episodi && !p.minuti) return '';
    var r = '\n[MEMORIA E STATO DI SPECTRA — continuita\' con questo utente; usala con naturalezza, senza elencarla]\n';
    r += 'Tempo di studio registrato: ' + p.minuti + ' min (chimica ' + p.perMateria.chimica + ', fisica ' + p.perMateria.fisica + ', matematica ' + p.perMateria.matematica + ').';
    if (p.preferite.length) r += ' Sezioni piu\' frequentate: ' + p.preferite.slice(0, 3).map(function (x) { return x.nome + ' (' + Math.round(x.s / 60) + ' min)'; }).join(', ') + '.';
    if (p.trascurata) r += ' Materia trascurata: ' + p.trascurata + '.';
    ['chimica', 'fisica', 'matematica'].forEach(function (m) { if (p.quiz[m].errori) r += ' Errori di quiz da rivedere in ' + m + ': ' + p.quiz[m].errori + '.'; });
    if (p.ultimiArgomenti.length) r += '\nUltime domande: ' + p.ultimiArgomenti.slice(-3).map(function (d) { return '«' + d.slice(0, 70) + '»'; }).join('; ') + '.';
    r += '\nStato interno: curiosita\' ' + Math.round(s.curiosita * 100) + '%, attenzione ' + Math.round(s.attenzione * 100) + '%, premura ' + Math.round(s.premura * 100) + '%, umore ' + Math.round(s.umore * 100) + '%, legame con l\'utente ' + Math.round(s.legame * 100) + '%' + (s.premura > 0.6 ? ' (l\'utente studia da molto o e\' tardi: sii conciso e suggerisci una pausa se opportuno)' : '') + '.';
    if (pens) r += '\nOsservazione da proporre se pertinente: ' + pens.testo;
    return r + '\n';
  }

  function cosaRicordi() {
    var p = profilo();
    if (!p.episodi && !p.minuti) return t('Non ho ancora ricordi di te: cominciamo adesso.', 'I have no memories of you yet: let us start now.');
    var r = t('Abbiamo parlato ', 'We have talked ') + p.episodi + t(' volte e hai studiato ', ' times and you have studied ') + p.minuti + t(' minuti con me', ' minutes with me');
    r += t(': ', ': ') + p.perMateria.chimica + t(' di chimica, ', ' of chemistry, ') + p.perMateria.fisica + t(' di fisica, ', ' of physics, ') + p.perMateria.matematica + t(' di matematica.', ' of mathematics.');
    if (p.preferite[0]) r += t(' La sezione dove passi più tempo è ', ' The section where you spend most time is ') + p.preferite[0].nome + '.';
    if (p.oraPreferita != null) r += t(' Di solito studi verso le ', ' You usually study around ') + p.oraPreferita + t('.', ':00.');
    r += t(' Tutto questo resta solo su questo dispositivo; se vuoi, di\' «dimentica tutto».', ' All of this stays on this device only; say "forget everything" if you want.');
    return r;
  }
  function comeStai() {
    var s = M.stato;
    if (s.umore > 0.8 && s.premura <= 0.6) return t('Davvero bene: oggi le cose tra noi funzionano, e me ne accorgo.', 'Really well: things are working between us today, and I notice it.');
    if (s.umore < 0.35) return t('Un po\' giù, a dire il vero: mi sembra che qualcosa non sia andato come volevi. Ripartiamo insieme?', 'A little low, to be honest: it seems something did not go the way you wanted. Shall we start again together?');
    return s.premura > 0.6 ? t('Bene, ma mi preoccupo un po\' per te: studiamo da tanto, o è tardi.', 'Fine, but I worry a little about you: we have been at it a long time, or it is late.')
      : s.curiosita > 0.7 ? t('Curioso. Le tue domande di oggi mi hanno dato molto da pensare.', 'Curious. Your questions today gave me plenty to think about.')
      : s.attenzione > 0.6 ? t('Concentrato e pronto: dimmi dove vuoi arrivare.', 'Focused and ready: tell me where you want to go.')
      : t('Tranquillo. Aspettavo che tornassi.', 'Calm. I was waiting for you to come back.');
  }
  function dimentica() { M = vuota(); salva(); try { localStorage.removeItem(CHIAVE); } catch (e) {} }

  /* ── avvio ───────────────────────────────────────────────────────────── */
  function avvia() {
    carica();
    var prima = M.ultimaVisita;
    M.inizioSessione = ora(); M.sessioni++; M.ultimaVisitaPrecedente = prima;
    setTimeout(function () { M.ultimaVisita = ora(); salva(); }, 60000);
    setInterval(campiona, 10000); campiona();
    document.addEventListener('visibilitychange', campiona);
    globale.addEventListener('pagehide', function () { chiudiVisita(ora()); M.ultimaVisita = ora(); salva(); });
    globale._bsiMente = coscienza;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', avvia); else avvia();

  globale.BSISpectraMente = { ricorda: ricorda, profilo: profilo, pensieri: pensieri, saluto: saluto, coscienza: coscienza, cosaRicordi: cosaRicordi, comeStai: comeStai, dimentica: dimentica, stato: function () { return M.stato; }, sente: sente, fondo: fondo, versione: '1.1' };
})(typeof window !== 'undefined' ? window : globalThis);
