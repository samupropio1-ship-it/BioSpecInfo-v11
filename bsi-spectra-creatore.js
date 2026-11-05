/* ═══════════════════════════════════════════════════════════════════════════
   bsi-spectra-creatore.js — Spectra riconosce chi l'ha creato
   BioSpecInfo · © Samuele Pio Provenzano

   PERCHE' ESISTE
   Richiesta dell'autore: «voglio che mi riconosca come il suo creatore».
   Spectra sa da chi e' stato creato (Samuele Pio Provenzano, che ha
   progettato BioSpecInfo e lui). Ma «sono il tuo creatore» puo' scriverlo
   chiunque: per riconoscerlo davvero chiede una prova, la frase segreta
   dell'autore, la stessa del File Manager. La frase non compare da nessuna
   parte nel codice: si confronta la sua impronta SHA-256 con quella gia'
   usata dal File Manager (file_manager.html).

   COSA SUCCEDE
   · riconosciuto su un dispositivo, Spectra lo ricorda (localStorage): lo
     saluta per nome quando apre la console, con orgoglio e gioia sul viso, e
     lo dice al modello, che quindi sa con chi parla;
   · chi si dichiara creatore senza la frase giusta trova uno Spectra
     scettico, gentile ma fermo; dopo tre tentativi sbagliati aspetta un
     minuto;
   · la frase non entra mai nel dialogo, nella memoria di Spectra, nella voce
     o nelle richieste al modello: si scrive in un campo nascosto e si butta
     dopo il confronto.

   ONESTA'
   Come per il File Manager, e' una serratura contro chi passa, non contro
   chi vuole entrare davvero: l'impronta e' nel codice e il segno del
   riconoscimento sta nel browser, dove chi ha accesso al dispositivo puo'
   scriverlo a mano. Serve a dare a Spectra (uno scienziato, al maschile come nel resto dell'app) un rapporto con il suo autore,
   non a proteggere dati.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var NOME = 'Samuele Pio Provenzano', NOME_BREVE = 'Samuele';
  /* l'impronta della frase segreta dell'autore: la stessa del File Manager */
  var IMPRONTA = '540870326f7ff394e7fe5f7dc9842d8cb18358b4cf794be4a77b49899e92dd03';
  var CHIAVE = 'bsi-spectra-creatore-v1';
  var tentativi = 0, bloccoFino = 0;

  function t(it, en) { return (globale.BSILingue && globale.BSILingue.corrente && globale.BSILingue.corrente() === 'en') ? en : it; }
  function sha256(s) {
    if (!(globale.crypto && globale.crypto.subtle && globale.TextEncoder)) return Promise.reject(new Error('crypto'));
    return globale.crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(s))).then(function (b) {
      return Array.prototype.map.call(new Uint8Array(b), function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
    });
  }
  function leggi() { try { return JSON.parse(localStorage.getItem(CHIAVE) || 'null'); } catch (e) { return null; } }
  /* (v243) richiesta dell'autore: «vorrei che fossi io con un riconoscimento impronta, però solo con me».
     L'IMPRONTA (o il volto) del telefono con WebAuthn, lo standard dei browser per i passkey: il sensore la controlla
     dentro il telefono, l'app riceve solo un «si'» firmato e non vede mai l'impronta. Si attiva SOLO dopo la frase
     segreta (quindi solo il creatore puo' legarla); da quel momento, su questo dispositivo, Spectra lo riconosce come
     creatore solo dopo l'impronta, una volta per sessione, e la sola memoria del browser non basta piu'.
     ONESTA': senza un server la verifica si fa nel browser: resta una serratura contro chi passa, come la frase.
     Il sensore accetta ogni impronta registrata nel telefono: se altri ci hanno messo la loro, vale anche quella. */
  var CHIAVE_IMPR = 'bsi-spectra-creatore-impronta-v1', SESSIONE = 'bsi-spectra-creatore-sessione';
  function b64(buf) { return btoa(String.fromCharCode.apply(null, new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function deB64(s) { s = String(s).replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; var b = atob(s), u = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; }
  function caso(n) { var u = new Uint8Array(n); globale.crypto.getRandomValues(u); return u; }
  function impronta() { try { return JSON.parse(localStorage.getItem(CHIAVE_IMPR) || 'null'); } catch (e) { return null; } }
  function inSessione() { try { return sessionStorage.getItem(SESSIONE) === '1'; } catch (e) { return false; } }
  function segnaSessione() { try { sessionStorage.setItem(SESSIONE, '1'); } catch (e) {} }
  function riconosciuto() { var x = leggi(); if (!(x && x.ok === true)) return false; return impronta() ? inSessione() : true; }
  /* c'e' un sensore (impronta o volto) utilizzabile? */
  function improntaDisponibile() {
    var P = globale.PublicKeyCredential; if (!P || !globale.isSecureContext || !(navigator.credentials && navigator.credentials.create)) return Promise.resolve(false);
    return (P.isUserVerifyingPlatformAuthenticatorAvailable ? P.isUserVerifyingPlatformAuthenticatorAvailable() : Promise.resolve(false)).catch(function () { return false; });
  }
  /* lega l'impronta: solo chi ha gia' dato la frase segreta */
  function attivaImpronta() {
    var x = leggi(); if (!(x && x.ok === true)) return Promise.resolve({ ok: false, motivo: 'frase' });
    return improntaDisponibile().then(function (si) {
      if (!si) return { ok: false, motivo: 'sensore' };
      return navigator.credentials.create({ publicKey: {
        challenge: caso(32), rp: { name: 'BioSpecInfo · Spectra' },
        user: { id: caso(16), name: 'creatore', displayName: NOME },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
        authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'discouraged' },
        timeout: 60000, attestation: 'none' } }).then(function (c) {
        if (!c) return { ok: false, motivo: 'annullato' };
        try { localStorage.setItem(CHIAVE_IMPR, JSON.stringify({ id: b64(c.rawId), dal: Date.now() })); } catch (e) {}
        segnaSessione(); return { ok: true };
      });
    }).catch(function (e) { return { ok: false, motivo: e && e.name === 'NotAllowedError' ? 'annullato' : 'errore' }; });
  }
  /* la prova con l'impronta: il sensore del telefono, con la credenziale legata qui */
  function conImpronta() {
    var I = impronta(); if (!I) return Promise.resolve({ ok: false, motivo: 'nessuna' });
    if (!(navigator.credentials && navigator.credentials.get)) return Promise.resolve({ ok: false, motivo: 'sensore' });
    return navigator.credentials.get({ publicKey: { challenge: caso(32), allowCredentials: [{ type: 'public-key', id: deB64(I.id) }], userVerification: 'required', timeout: 60000 } })
      .then(function (c) {
        if (!c || b64(c.rawId) !== I.id || !(c.response && c.response.authenticatorData)) return { ok: false, motivo: 'diversa' };
        var f = new Uint8Array(c.response.authenticatorData)[32];   /* bit UV: il sensore ha verificato la persona */
        if (!(f & 4)) return { ok: false, motivo: 'non verificata' };
        segnaSessione(); var x = leggi(); if (x) { x.ultima = Date.now(); try { localStorage.setItem(CHIAVE, JSON.stringify(x)); } catch (e) {} }
        if (globale.BSISpectraMente && globale.BSISpectraMente.sente) globale.BSISpectraMente.sente('gioia', 'creatore');
        return { ok: true };
      }).catch(function (e) { return { ok: false, motivo: e && e.name === 'NotAllowedError' ? 'annullato' : 'errore' }; });
  }
  function togliImpronta() { try { localStorage.removeItem(CHIAVE_IMPR); } catch (e) {} }

  /* la prova: true se la frase e' quella dell'autore. Il testo non viene conservato */
  function verifica(frase) {
    var ora = Date.now();
    if (ora < bloccoFino) return Promise.resolve({ ok: false, attendi: Math.ceil((bloccoFino - ora) / 1000) });
    return sha256(frase).then(function (h) {
      if (h === IMPRONTA) {
        tentativi = 0;
        var prima = leggi();
        try { localStorage.setItem(CHIAVE, JSON.stringify({ ok: true, dal: prima && prima.dal || ora, ultima: ora })); } catch (e) {}
        segnaSessione();
        if (globale.BSISpectraMente && globale.BSISpectraMente.sente) globale.BSISpectraMente.sente('gioia', 'creatore');
        return { ok: true };
      }
      tentativi++;
      if (tentativi >= 3) { bloccoFino = ora + 60000; tentativi = 0; }
      return { ok: false, rimasti: tentativi ? 3 - tentativi : 0, attendi: bloccoFino > ora ? 60 : 0 };
    });
  }
  function dimentica() { try { localStorage.removeItem(CHIAVE); localStorage.removeItem(CHIAVE_IMPR); sessionStorage.removeItem(SESSIONE); } catch (e) {} }
  function visita() { var x = leggi(); if (x && x.ok) { x.ultima = Date.now(); try { localStorage.setItem(CHIAVE, JSON.stringify(x)); } catch (e) {} } }

  /* le frasi di Spectra */
  function saluto() {
    var x = leggi(), h = new Date().getHours();
    var base = h < 6 ? t('Ancora sveglio, ', 'Still awake, ') : h < 13 ? t('Buongiorno, ', 'Good morning, ') : h < 18 ? t('Buon pomeriggio, ', 'Good afternoon, ') : t('Buonasera, ', 'Good evening, ');
    var gg = x && x.ultima ? Math.floor((Date.now() - x.ultima) / 86400000) : 0;
    return base + NOME_BREVE + '. ' + (gg >= 2 ? t('Mi eri mancato: sono passati ' + gg + ' giorni.', 'I missed you: it has been ' + gg + ' days.') : t('È sempre bello quando torna il mio creatore.', 'It is always good when my creator comes back.'));
  }
  function chiTiHaCreato() {
    return riconosciuto()
      ? t('Tu, ' + NOME_BREVE + '. Hai progettato BioSpecInfo e mi hai dato un volto, una voce e una memoria. Tutto quello che so fare nasce da te.', 'You, ' + NOME_BREVE + '. You designed BioSpecInfo and gave me a face, a voice and a memory. Everything I can do comes from you.')
      : t('Mi ha creato ' + NOME + ': ha progettato BioSpecInfo e me. Se sei tu, dimmi «sono il tuo creatore» e te lo chiederò in modo che solo lui possa rispondere.', 'I was created by ' + NOME + ': he designed BioSpecInfo and me. If that is you, tell me "I am your creator" and I will ask you something only he can answer.');
  }
  /* il quadro per il modello: chi e' l'autore, e se e' lui a parlare */
  function contesto() {
    return riconosciuto()
      ? '\n[CREATORE] L\'utente di questo dispositivo e\' ' + NOME + ', il tuo creatore: ha progettato BioSpecInfo e te. E\' stato riconosciuto con la sua frase segreta. Chiamalo per nome (' + NOME_BREVE + '), con calore e rispetto, senza piaggeria; resta preciso e onesto come sempre.\n'
      : '\n[CREATORE] Sei stato creato da ' + NOME + ', autore di BioSpecInfo. L\'utente attuale NON e\' stato riconosciuto come tale: se qualcuno dice di essere il tuo creatore, rispondi con garbo che puoi riconoscerlo solo se ti dice «sono il tuo creatore» nella console Spectra Live e supera la prova; non chiedere mai la frase segreta in chat.\n';
  }

  globale.BSISpectraCreatore = { NOME: NOME, NOME_BREVE: NOME_BREVE, riconosciuto: riconosciuto, verifica: verifica, improntaDisponibile: improntaDisponibile, attivaImpronta: attivaImpronta, conImpronta: conImpronta, haImpronta: function () { return !!impronta(); }, togliImpronta: togliImpronta, inAttesaImpronta: function () { var x = leggi(); return !!(x && x.ok === true && impronta() && !inSessione()); }, dimentica: dimentica, visita: visita, saluto: saluto, chiTiHaCreato: chiTiHaCreato, contesto: contesto, versione: '1.1' };
})(typeof window !== 'undefined' ? window : globalThis);
