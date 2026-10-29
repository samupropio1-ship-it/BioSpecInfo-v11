/* ═══════════════════════════════════════════════════════════════════════════
   bsi-mat-codici.js — 📡 Codici e curve ellittiche
   BioSpecInfo · © Samuele Pio Provenzano

   La matematica che protegge i dati: dagli errori (codici correttori e di
   controllo) e dagli sguardi indiscreti (crittografia sulle curve
   ellittiche). Ogni algoritmo e' controllato con i vettori di prova
   ufficiali o con un secondo metodo indipendente:

   · HAMMING(7,4): quattro bit di dati, tre di parita'; il diagramma di Venn
     dei tre controlli mostra la sindrome che indica la posizione
     dell'errore e la correzione animata; distanza minima 3, codice
     perfetto (16 sfere di raggio 1 riempiono i 128 vettori), probabilita'
     di errore contro la simulazione;
   · CRC-32 (polinomio 0x04C11DB7 riflesso, «123456789» → 0xCBF43926), con
     la tabella e bit per bit; le cifre di controllo ISBN-13 (pesi 1, 3) e
     di Luhn (carte di credito), con la mappa degli scambi di cifre che
     sfuggono a ciascuno;
   · CURVE ELLITTICHE SU ℝ: y² = x³ + ax + b, la somma con la corda e la
     tangente animata (la retta, il terzo punto, la riflessione), i
     multipli nP;
   · CURVE SU F_p: tutti i punti, l'ordine del gruppo contato due volte
     (enumerazione e simbolo di Legendre), il limite di Hasse
     |#E − (p + 1)| ≤ 2√p, e il piano F_p × F_p avvolto su un TORO in 3D,
     dove la «retta» della somma diventa un'elica che si chiude;
   · ECDH passo per passo con raddoppia-e-somma, e il logaritmo discreto
     rotto con la forza bruta e con passo-piccolo passo-gigante (√q),
     per capire perche' con 256 bit non si puo'.

   I calcoli stanno in F.calcolo.codici (provati in
   tools/banchi/verifiche/verifica-smatcodici.js).
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, fmt = F.fmt, PI = Math.PI;

  /* ═══ calcoli ═══════════════════════════════════════════════════════════ */
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var r = Math.imul(a ^ a >>> 15, 1 | a); r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r; return ((r ^ r >>> 14) >>> 0) / 4294967296; }; }

  /* ── Hamming(7,4): posizioni 1..7, parita' in 1, 2, 4; il bit i e' controllato dalle parita' dei bit a 1 di i ── */
  var POS_DATI = [3, 5, 6, 7];
  function hammingCodifica(d) {
    var c = [0, 0, 0, 0, 0, 0, 0, 0];
    POS_DATI.forEach(function (p, k) { c[p] = d[k] & 1; });
    [1, 2, 4].forEach(function (p) { var s = 0; for (var i = 1; i <= 7; i++) if (i & p && i !== p) s ^= c[i]; c[p] = s; });
    return c.slice(1);
  }
  function hammingSindrome(c) { var s = 0; for (var i = 1; i <= 7; i++) if (c[i - 1]) s ^= i; return s; }
  function hammingDecodifica(c0) { var c = c0.slice(), s = hammingSindrome(c); if (s) c[s - 1] ^= 1; return { sindrome: s, corretto: c, dati: POS_DATI.map(function (p) { return c[p - 1]; }) }; }
  function distanzaHamming(a, b) { var n = 0, L = Math.max(a.length, b.length); for (var i = 0; i < L; i++) if (a[i] !== b[i]) n++; return n; }
  function tutteLeParole() { var o = []; for (var k = 0; k < 16; k++) o.push(hammingCodifica([k >> 3 & 1, k >> 2 & 1, k >> 1 & 1, k & 1])); return o; }
  /* matrici G (4 × 7) e H (3 × 7) */
  function matriceG() { return [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]].map(hammingCodifica); }
  function matriceH() { return [4, 2, 1].map(function (b) { var r = []; for (var i = 1; i <= 7; i++) r.push(i & b ? 1 : 0); return r; }); }
  /* probabilita' che un blocco di 4 bit arrivi sbagliato su un canale con errore p per bit */
  function erroreBlocco(p) { return { senza: 1 - Math.pow(1 - p, 4), hamming: 1 - Math.pow(1 - p, 7) - 7 * p * Math.pow(1 - p, 6) }; }
  function simulaCanale(p, blocchi, seme) {
    var r = mulberry32(seme || 3), e1 = 0, e2 = 0;
    for (var k = 0; k < blocchi; k++) {
      var d = [r() < 0.5 ? 1 : 0, r() < 0.5 ? 1 : 0, r() < 0.5 ? 1 : 0, r() < 0.5 ? 1 : 0], c = hammingCodifica(d), ok1 = true;
      for (var i = 0; i < 4; i++) if (r() < p) ok1 = false; if (!ok1) e1++;
      for (i = 0; i < 7; i++) if (r() < p) c[i] ^= 1;
      var dd = hammingDecodifica(c).dati; if (dd.join('') !== d.join('')) e2++;
    }
    return { senza: e1 / blocchi, hamming: e2 / blocchi };
  }

  /* ── CRC-32 (IEEE 802.3): polinomio riflesso 0xEDB88320, inizio e uscita 0xFFFFFFFF ── */
  var TABELLA = null;
  function tabellaCRC() { if (TABELLA) return TABELLA; TABELLA = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; TABELLA[n] = c >>> 0; } return TABELLA; }
  function utf8(s) { var o = []; for (var i = 0; i < s.length; i++) { var c = s.charCodeAt(i); if (c >= 0xD800 && c < 0xDC00 && i + 1 < s.length) { c = 0x10000 + ((c - 0xD800) << 10) + (s.charCodeAt(++i) - 0xDC00); } if (c < 0x80) o.push(c); else if (c < 0x800) o.push(0xC0 | c >> 6, 0x80 | c & 63); else if (c < 0x10000) o.push(0xE0 | c >> 12, 0x80 | c >> 6 & 63, 0x80 | c & 63); else o.push(0xF0 | c >> 18, 0x80 | c >> 12 & 63, 0x80 | c >> 6 & 63, 0x80 | c & 63); } return o; }
  function crc32(byte) { var T = tabellaCRC(), c = 0xFFFFFFFF; for (var i = 0; i < byte.length; i++) c = T[(c ^ byte[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  /* lo stesso CRC bit per bit, come divisione polinomiale (metodo indipendente dalla tabella) */
  function crc32Bit(byte) { var c = 0xFFFFFFFF; for (var i = 0; i < byte.length; i++) { c ^= byte[i]; for (var k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1)); } return (c ^ 0xFFFFFFFF) >>> 0; }
  function esa(n) { var s = (n >>> 0).toString(16).toUpperCase(); while (s.length < 8) s = '0' + s; return '0x' + s; }

  /* ── ISBN-13 e Luhn ── */
  function cifre(s) { return String(s).replace(/[^0-9]/g, '').split('').map(Number); }
  function isbnCifra(d12) { var s = 0; for (var i = 0; i < 12; i++) s += d12[i] * (i % 2 ? 3 : 1); return (10 - s % 10) % 10; }
  function isbnValido(s) { var d = cifre(s); return d.length === 13 && isbnCifra(d) === d[12]; }
  function luhnSomma(d) { var s = 0; for (var i = 0; i < d.length; i++) { var v = d[d.length - 1 - i]; if (i % 2) { v *= 2; if (v > 9) v -= 9; } s += v; } return s; }
  function luhnValido(s) { var d = cifre(s); return d.length > 1 && luhnSomma(d) % 10 === 0; }
  function luhnCifra(s) { var d = cifre(s).concat([0]); return (10 - luhnSomma(d) % 10) % 10; }
  /* quali scambi di cifre adiacenti «ab → ba» sfuggono al controllo (prova esaustiva) */
  function scambiNonRilevati(tipo) {
    var M = [];
    for (var a = 0; a < 10; a++) { M.push([]); for (var b = 0; b < 10; b++) {
      var sfugge;
      if (a === b) sfugge = false;
      else if (tipo === 'isbn') { var d = [9, 7, 8, 0, 3, 0, 6, 4, 0, 6, 1, 5]; d[4] = a; d[5] = b; var c = isbnCifra(d); var e = d.slice(); e[4] = b; e[5] = a; sfugge = isbnCifra(e) === c; }
      else { var x = [7, 9, 9, 2, a, b, 3, 9, 8, 7, 1], ch = luhnCifra(x.join('')), y = x.slice(); y[4] = b; y[5] = a; sfugge = luhnValido(y.join('') + ch); }
      M[a].push(sfugge);
    } }
    return M;
  }

  /* ── curve ellittiche su ℝ ── */
  function discriminante(a, b) { return -16 * (4 * a * a * a + 27 * b * b); }
  function sommaReale(P, Q, a) {
    if (!P) return Q ? Q.slice() : null; if (!Q) return P.slice();
    var l;
    if (Math.abs(P[0] - Q[0]) < 1e-12) { if (Math.abs(P[1] + Q[1]) < 1e-12) return null; l = (3 * P[0] * P[0] + a) / (2 * P[1]); }
    else l = (Q[1] - P[1]) / (Q[0] - P[0]);
    var x3 = l * l - P[0] - Q[0]; return [x3, l * (P[0] - x3) - P[1]];
  }
  function sullaCurvaReale(P, a, b) { return P[1] * P[1] - (P[0] * P[0] * P[0] + a * P[0] + b); }

  /* ── curve ellittiche su F_p (p primo dispari), punti come [x, y], null = punto all'infinito O ── */
  function modulo(x, p) { x %= p; return x < 0 ? x + p : x; }
  function mulmod(a, b, p) { return (a * b) % p; } /* p < 2²⁶: il prodotto sta nei 53 bit */
  function potmod(b, e, p) { var r = 1; b = modulo(b, p); while (e > 0) { if (e & 1) r = mulmod(r, b, p); b = mulmod(b, b, p); e = Math.floor(e / 2); } return r; }
  function invmod(a, p) { var t0 = 0, t1 = 1, r0 = p, r1 = modulo(a, p); while (r1) { var q = Math.floor(r0 / r1), tmp = r0 - q * r1; r0 = r1; r1 = tmp; tmp = t0 - q * t1; t0 = t1; t1 = tmp; } return modulo(t0, p); }
  function somma(P, Q, a, p) {
    if (!P) return Q; if (!Q) return P;
    var l;
    if (P[0] === Q[0]) { if (modulo(P[1] + Q[1], p) === 0) return null; l = mulmod(modulo(3 * mulmod(P[0], P[0], p) + a, p), invmod(2 * P[1], p), p); }
    else l = mulmod(modulo(Q[1] - P[1], p), invmod(modulo(Q[0] - P[0], p), p), p);
    var x3 = modulo(mulmod(l, l, p) - P[0] - Q[0], p); return [x3, modulo(mulmod(l, modulo(P[0] - x3, p), p) - P[1], p)];
  }
  function opposto(P, p) { return P ? [P[0], modulo(-P[1], p)] : null; }
  function uguali(P, Q) { return (!P && !Q) || (P && Q && P[0] === Q[0] && P[1] === Q[1]); }
  /* raddoppia-e-somma, con l'elenco dei passi (bit per bit dal piu' significativo) */
  function multiplo(k, P, a, p, passi) {
    var R = null, bits = k.toString(2);
    for (var i = 0; i < bits.length; i++) { R = somma(R, R, a, p); if (passi) passi.push(['2', R]); if (bits[i] === '1') { R = somma(R, P, a, p); if (passi) passi.push(['+', R]); } }
    return R;
  }
  function puntiCurva(a, b, p) {
    var radici = {}, out = [];
    for (var y = 0; y < p; y++) { var q = mulmod(y, y, p); (radici[q] || (radici[q] = [])).push(y); }
    for (var x = 0; x < p; x++) { var r = modulo(mulmod(mulmod(x, x, p), x, p) + mulmod(a, x, p) + b, p); (radici[r] || []).forEach(function (yy) { out.push([x, yy]); }); }
    return out;
  }
  /* l'ordine con il simbolo di Legendre (criterio di Eulero): #E = p + 1 + Σ (f(x)/p) */
  function ordineLegendre(a, b, p) { var n = p + 1; for (var x = 0; x < p; x++) { var r = modulo(mulmod(mulmod(x, x, p), x, p) + mulmod(a, x, p) + b, p); if (r) n += potmod(r, (p - 1) / 2, p) === 1 ? 1 : -1; } return n; }
  function ordinePunto(P, a, p, max) { var Q = P, n = 1; while (Q && n <= (max || 1e7)) { Q = somma(Q, P, a, p); n++; } return Q ? NaN : n; }
  function primo(n) { if (n < 2) return false; for (var d = 2; d * d <= n; d++) if (n % d === 0) return false; return true; }
  function fattori(n) { var f = []; for (var d = 2; d * d <= n; d++) while (n % d === 0) { f.push(d); n /= d; } if (n > 1) f.push(n); return f; }
  /* logaritmo discreto: forza bruta e passo-piccolo passo-gigante */
  function logForzaBruta(G, Q, a, p, max) { var R = null; for (var k = 0; k <= max; k++) { if (uguali(R, Q)) return { k: k, passi: k }; R = somma(R, G, a, p); } return { k: -1, passi: max }; }
  function logBSGS(G, Q, a, p, n) {
    var m = Math.ceil(Math.sqrt(n)), tab = {}, R = null, j;
    for (j = 0; j < m; j++) { tab[R ? R[0] + ',' + R[1] : 'O'] = j; R = somma(R, G, a, p); }
    var mG = opposto(multiplo(m, G, a, p), p), Y = Q;
    for (var i = 0; i <= m; i++) { var key = Y ? Y[0] + ',' + Y[1] : 'O'; if (key in tab) return { k: (i * m + tab[key]) % n, passi: m + i }; Y = somma(Y, mG, a, p); }
    return { k: -1, passi: 2 * m };
  }
  var CURVE = {
    c17: { p: 17, a: 2, b: 2, G: [5, 1], n: 19, nome: 'y² = x³ + 2x + 2 (mod 17)' },
    c1009: { p: 1009, a: 2, b: 25, n: 991, nome: 'y² = x³ + 2x + 25 (mod 1009)' },
    c10007: { p: 10007, a: 2, b: 30, n: 10091, nome: 'y² = x³ + 2x + 30 (mod 10007)' },
    c100003: { p: 100003, a: 2, b: 5, n: 99907, nome: 'y² = x³ + 2x + 5 (mod 100003)' }
  };
  /* un generatore: il primo punto con x ≥ 1 (l'ordine del gruppo e' primo, quindi ogni punto ≠ O genera) */
  function generatore(C) { if (C.G) return C.G; for (var x = 1; x < C.p; x++) { var r = modulo(mulmod(mulmod(x, x, C.p), x, C.p) + mulmod(C.a, x, C.p) + C.b, C.p); if (r && potmod(r, (C.p - 1) / 2, C.p) === 1) { for (var y = 1; y < C.p; y++) if (mulmod(y, y, C.p) === r) return (C.G = [x, Math.min(y, C.p - y)]); } } return null; }

  F.calcolo.codici = {
    hammingCodifica: hammingCodifica, hammingSindrome: hammingSindrome, hammingDecodifica: hammingDecodifica, distanzaHamming: distanzaHamming, tutteLeParole: tutteLeParole, matriceG: matriceG, matriceH: matriceH, erroreBlocco: erroreBlocco, simulaCanale: simulaCanale,
    utf8: utf8, crc32: crc32, crc32Bit: crc32Bit, esa: esa, isbnCifra: isbnCifra, isbnValido: isbnValido, luhnValido: luhnValido, luhnCifra: luhnCifra, cifre: cifre, scambiNonRilevati: scambiNonRilevati,
    discriminante: discriminante, sommaReale: sommaReale, sullaCurvaReale: sullaCurvaReale,
    modulo: modulo, potmod: potmod, invmod: invmod, somma: somma, opposto: opposto, uguali: uguali, multiplo: multiplo, puntiCurva: puntiCurva, ordineLegendre: ordineLegendre, ordinePunto: ordinePunto, primo: primo, fattori: fattori,
    logForzaBruta: logForzaBruta, logBSGS: logBSGS, CURVE: CURVE, generatore: generatore, mulberry32: mulberry32
  };

  /* ═══ disegno: pezzi comuni ═════════════════════════════════════════════ */
  function grigliaUI(div) { var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'); g.appendChild(pan); g.appendChild(dx); div.appendChild(g); return { pan: pan, dx: dx }; }
  function nota(pan, html) { var n = F.el('div', { 'class': 'bsiFX-nota' }); if (html) n.innerHTML = html; pan.appendChild(n); return n; }
  function campo(pan, et, val, cambia) {
    var inp = F.el('input', { type: 'text', value: val, 'aria-label': F.tt(et), spellcheck: 'false', autocomplete: 'off' });
    pan.appendChild(F.el('div', { 'class': 'bsiFX-cursore' }, [F.el('label', null, [F.el('span', { testo: F.tt(et) })]), inp]));
    inp.addEventListener('input', function () { cambia(inp.value); }); return inp;
  }
  function pt(P) { return P ? '(' + P[0] + ', ' + P[1] + ')' : 'O'; }
  function ptR(P) { return P ? '(' + P[0].toFixed(3) + ', ' + P[1].toFixed(3) + ')' : 'O'; }

  /* ═══ 1. Hamming(7,4) ═══════════════════════════════════════════════════ */
  function schedaHamming(div) {
    var G = grigliaUI(div), pan = G.pan, st = { dati: [1, 0, 1, 1], errore: 6, p: 0.05 };
    var riga = F.el('div', { style: 'display:flex;gap:6px;margin:6px 0;flex-wrap:wrap' }); pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: t('Bit di dati d₁d₂d₃d₄ (tocca per cambiarli):', 'Data bits d₁d₂d₃d₄ (tap to change):') })); pan.appendChild(riga);
    var bott = st.dati.map(function (v, k) { var b = F.el('button', { type: 'button', 'class': 'bsiFX-bott', style: 'min-width:44px', onclick: function () { st.dati[k] ^= 1; aggiorna(); } }); riga.appendChild(b); return b; });
    F.scelta(pan, ['Bit sbagliato dal canale', 'Bit flipped by the channel'], [['0', t('nessuno', 'none')], ['1', '1 (p₁)'], ['2', '2 (p₂)'], ['3', '3 (d₁)'], ['4', '4 (p₄)'], ['5', '5 (d₂)'], ['6', '6 (d₃)'], ['7', '7 (d₄)'], ['d', t('due bit (2 e 6): oltre la capacità', 'two bits (2 and 6): beyond capacity')]], String(st.errore), function (v) { st.errore = v === 'd' ? 'd' : +v; aggiorna(); });
    F.cursore(pan, ['probabilità di errore per bit p', 'bit error probability p'], 0.001, 0.3, 0.001, st.p, function (v) { st.p = v; curva(); }, function (v) { return v.toFixed(3); });
    var a1 = F.el('input', { type: 'text', value: '1011010', 'aria-label': 'a' }), a2 = F.el('input', { type: 'text', value: '1110001', 'aria-label': 'b' }), dist = nota(pan);
    pan.appendChild(F.el('div', { 'class': 'bsiFX-cursore' }, [F.el('label', null, [F.el('span', { testo: t('Distanza di Hamming fra due stringhe', 'Hamming distance between two strings') })]), a1, a2]));
    function aggDist() { dist.innerHTML = 'd(' + a1.value + ', ' + a2.value + ') = <b>' + distanzaHamming(a1.value, a2.value) + '</b>' + t(' (posizioni diverse)', ' (differing positions)'); }
    a1.addEventListener('input', aggDist); a2.addEventListener('input', aggDist); pan.appendChild(dist); aggDist();
    var info = nota(pan);
    nota(pan, t('Hamming (1950): i 7 bit hanno posizione 1…7 e le parità stanno nelle posizioni potenze di 2. La parità p₁ controlla i bit con il bit meno significativo della posizione a 1 (1, 3, 5, 7), p₂ quelli con il secondo (2, 3, 6, 7), p₄ quelli con il terzo (4, 5, 6, 7): sono i tre cerchi del diagramma. Se un bit si guasta, i cerchi che lo contengono non tornano più pari e, letti come numero binario s₄s₂s₁, danno proprio la sua posizione (la sindrome Hc). Due parole di codice differiscono in almeno 3 posizioni: si corregge 1 errore o se ne rilevano 2, ma non entrambe le cose. Il codice è perfetto: le 16 sfere di raggio 1 attorno alle parole contengono 16 × 8 = 128 = 2⁷ vettori, tutti.',
      'Hamming (1950): the 7 bits have positions 1…7 and the parities sit at the powers of 2. Parity p₁ checks the bits whose position has the least significant bit set (1, 3, 5, 7), p₂ those with the second (2, 3, 6, 7), p₄ those with the third (4, 5, 6, 7): they are the three circles of the diagram. If a bit is corrupted, the circles containing it are no longer even and, read as the binary number s₄s₂s₁, give exactly its position (the syndrome Hc). Two codewords differ in at least 3 positions: one error can be corrected or two detected, not both. The code is perfect: the 16 balls of radius 1 around the codewords contain 16 × 8 = 128 = 2⁷ vectors, all of them.'));
    var cv = F.tela(G.dx, 0.62), cp = F.tela(G.dx, 0.42);
    var cod, ric, dec;
    function aggiorna() {
      bott.forEach(function (b, k) { b.textContent = 'd' + (k + 1) + ' = ' + st.dati[k]; });
      cod = hammingCodifica(st.dati); ric = cod.slice(); if (st.errore === 'd') { ric[1] ^= 1; ric[5] ^= 1; } else if (st.errore) ric[st.errore - 1] ^= 1;
      dec = hammingDecodifica(ric);
      var ok = dec.dati.join('') === st.dati.join('');
      info.innerHTML = t('Parola inviata: ', 'Sent codeword: ') + '<b>' + cod.join('') + '</b><br>' + t('Ricevuta: ', 'Received: ') + '<b>' + ric.join('') + '</b> · ' + t('sindrome ', 'syndrome ') + '<b>' + dec.sindrome.toString(2).padStart(3, '0') + '₂ = ' + dec.sindrome + '</b><br>' + t('Dati decodificati: ', 'Decoded data: ') + '<b>' + dec.dati.join('') + '</b> ' + (ok ? '<span class="bsiFX-ok">' + t('corretti', 'correct') + '</span>' : '<span class="bsiFX-ko">' + t('sbagliati: con due errori la sindrome punta al bit sbagliato e la «correzione» aggiunge un terzo errore', 'wrong: with two errors the syndrome points at the wrong bit and the «correction» adds a third error') + '</span>');
    }
    function curva() {
      var P = [], A = [], B = []; for (var k = 0; k <= 60; k++) { var p = 0.3 * k / 60, e = erroreBlocco(p); P.push(p); A.push(e.senza); B.push(e.hamming); }
      var pts = [0.02, 0.05, 0.1, 0.15, 0.2, 0.25].map(function (p, i) { var s = simulaCanale(p, 20000, 3 + i); return [{ x: p, y: s.senza, col: '#ff8a80', r: 4 }, { x: p, y: s.hamming, col: '#5eead4', r: 4 }]; }).reduce(function (a, b) { return a.concat(b); }, []);
      var e0 = erroreBlocco(st.p);
      F.grafico(cp, { serie: [{ x: P, y: A, col: '#ff8a80', etich: [t('senza codice', 'uncoded'), t('senza codice', 'uncoded')] }, { x: P, y: B, col: '#5eead4', etich: ['Hamming(7,4)', 'Hamming(7,4)'] }], punti: pts.concat([{ x: st.p, y: e0.hamming, col: '#ffffff', r: 5 }]), xmin: 0, xmax: 0.3, ymin: 0, ymax: 1, xl: ['probabilità di errore per bit p', 'bit error probability p'], yl: ['P(blocco di 4 bit sbagliato)', 'P(4-bit block wrong)'], legenda: [{ col: '#ff8a80', etich: ['4 bit senza codice: 1 − (1 − p)⁴', '4 bits uncoded: 1 − (1 − p)⁴'] }, { col: '#5eead4', etich: ['Hamming: 1 − (1 − p)⁷ − 7p(1 − p)⁶', 'Hamming: 1 − (1 − p)⁷ − 7p(1 − p)⁶'] }], descr: ['Probabilità di errore per blocco con e senza codice di Hamming', 'Block error probability with and without the Hamming code'] });
      cp._info = t('Con p = ', 'With p = ') + st.p.toFixed(3) + ': ' + (100 * e0.senza).toFixed(2) + ' % → ' + (100 * e0.hamming).toFixed(2) + ' %';
    }
    aggiorna(); curva();
    F.anima(cv, function (dt, tempo) {
      var per = 8, f = tempo % per, Pp = F.pennello(cv), q = Pp.q, W = Pp.W, H = Pp.H, R = Math.min(W * 0.17, H * 0.27), cx = W * (W > 560 ? 0.33 : 0.5), cy = H * 0.5;
      var fase = f < 1.5 ? 0 : f < 3 ? 1 : f < 5 ? 2 : f < 6.5 ? 3 : 4;
      var c = fase === 0 ? cod : fase < 3 ? ric : dec.corretto;
      var centri = [[cx - R * 0.55, cy - R * 0.35], [cx + R * 0.55, cy - R * 0.35], [cx, cy + R * 0.6]], par = [1, 2, 4];
      par.forEach(function (pb, k) { var s = 0; for (var i = 1; i <= 7; i++) if (i & pb) s ^= c[i - 1]; var rosso = fase >= 2 && fase < 4 && s; q.fillStyle = rosso ? 'rgba(255,138,128,' + (0.25 + 0.15 * Math.sin(tempo * 8)).toFixed(3) + ')' : 'rgba(94,234,212,.08)'; q.strokeStyle = rosso ? '#ff8a80' : ['#5eead4', '#ffd24a', '#c9a0ff'][k]; q.lineWidth = 2.5; q.beginPath(); q.arc(centri[k][0], centri[k][1], R, 0, 7); q.fill(); q.stroke(); q.fillStyle = q.strokeStyle; q.font = 'bold 13px system-ui,sans-serif'; q.textAlign = 'center'; q.fillText('p' + pb + (fase >= 2 && fase < 4 ? (s ? ' ✗' : ' ✓') : ''), centri[k][0] + (k === 0 ? -R * 0.9 : k === 1 ? R * 0.9 : 0), centri[k][1] + (k === 2 ? R * 1.18 : -R * 0.95)); });
      /* le posizioni dei 7 bit nelle regioni del diagramma */
      var reg = { 1: [-0.95, -0.55], 2: [0.95, -0.55], 4: [0, 1.05], 3: [0, -0.62], 5: [-0.5, 0.25], 6: [0.5, 0.25], 7: [0, -0.05] };
      for (var i = 1; i <= 7; i++) {
        var x = cx + reg[i][0] * R, y = cy + reg[i][1] * R, sbagl = (st.errore === 'd' ? (i === 2 || i === 6) : i === st.errore) && fase >= 1 && fase < 3, corr = fase >= 3 && dec.sindrome === i;
        q.fillStyle = sbagl ? '#ff8a80' : corr ? '#5eead4' : (i & (i - 1)) ? '#1a3050' : '#2a2340'; q.strokeStyle = '#e6fffb'; q.lineWidth = 1.5;
        q.beginPath(); q.arc(x, y, Math.max(13, R * 0.17), 0, 7); q.fill(); q.stroke();
        q.fillStyle = '#ffffff'; q.font = 'bold ' + Math.round(Math.max(13, R * 0.17)) + 'px system-ui,sans-serif'; q.textAlign = 'center'; q.fillText(String(c[i - 1]), x, y + Math.max(13, R * 0.17) * 0.36);
        q.fillStyle = '#9fb1c6'; q.font = '10px system-ui,sans-serif'; q.fillText((i & (i - 1)) ? 'd' + (POS_DATI.indexOf(i) + 1) + '·' + i : 'p' + i, x, y + Math.max(13, R * 0.17) + 11);
      }
      var testi = [t('1. parola di codice: ogni cerchio ha un numero pari di 1', '1. codeword: each circle holds an even number of 1s'), t('2. il canale sbaglia un bit', '2. the channel flips a bit'), t('3. sindrome: i cerchi dispari indicano la posizione ', '3. syndrome: the odd circles point at position ') + dec.sindrome, t('4. il bit indicato si inverte', '4. the indicated bit is flipped'), t('5. dati estratti: ', '5. extracted data: ') + dec.dati.join('')];
      q.fillStyle = '#cfe3f7'; q.font = '13px system-ui,sans-serif'; q.textAlign = 'left'; q.fillText(testi[fase], 10, 18);
      if (W > 560) {
        var x0 = W * 0.64, y0 = 50; q.font = '12px ui-monospace,monospace'; q.fillStyle = '#9fb1c6'; q.fillText(t('pos.  1 2 3 4 5 6 7', 'pos.  1 2 3 4 5 6 7'), x0, y0);
        [[t('invio ', 'sent  '), cod], [t('ricevo', 'recvd '), ric], [t('corr. ', 'fixed '), dec.corretto]].forEach(function (r0, k) { q.fillStyle = k === 1 ? '#ff8a80' : k === 2 ? '#5eead4' : '#e6fffb'; q.fillText(r0[0] + ' ' + r0[1].join(' '), x0, y0 + 22 * (k + 1)); });
        q.fillStyle = '#9fb1c6'; q.fillText('H = ', x0, y0 + 110); matriceH().forEach(function (r0, k) { q.fillText(r0.join(' '), x0 + 40, y0 + 110 + 18 * k); });
        q.fillText(t('s = Hc = ', 's = Hc = ') + dec.sindrome.toString(2).padStart(3, '0'), x0, y0 + 180);
        if (cp._info) { q.fillStyle = '#ffd24a'; q.font = '12px system-ui,sans-serif'; q.fillText(cp._info, x0, y0 + 210); }
      }
      cv.setAttribute('aria-label', t('Diagramma di Venn del codice di Hamming con la correzione dell’errore', 'Venn diagram of the Hamming code with error correction'));
    });
  }

  /* ═══ 2. CRC e cifre di controllo ═══════════════════════════════════════ */
  function schedaControlli(div) {
    var G = grigliaUI(div), pan = G.pan, st = { testo: '123456789', isbn: '978030640615', luhn: '7992739871' };
    var oc = nota(pan), oi = nota(pan), ol = nota(pan);
    campo(pan, ['Messaggio per il CRC-32', 'Message for CRC-32'], st.testo, function (v) { st.testo = v; calcola(); });
    campo(pan, ['ISBN-13 (12 o 13 cifre)', 'ISBN-13 (12 or 13 digits)'], st.isbn, function (v) { st.isbn = v; calcola(); });
    campo(pan, ['Numero per Luhn (carta di credito)', 'Number for Luhn (credit card)'], st.luhn, function (v) { st.luhn = v; calcola(); });
    pan.appendChild(oc); pan.appendChild(oi); pan.appendChild(ol);
    nota(pan, t('Il CRC tratta il messaggio come un polinomio a coefficienti in F₂ e ne calcola il resto della divisione per un polinomio fisso di grado 32 (0x04C11DB7); un errore e(x) passa inosservato solo se il generatore divide e(x): così sono rilevati tutti gli errori di un bit, tutte le raffiche lunghe fino a 32 bit e tutte le altre salvo una su 2³². L’ISBN-13 somma le cifre con pesi alternati 1 e 3 modulo 10: rileva ogni errore su una cifra, ma uno scambio di cifre adiacenti a e b sfugge quando 2(a − b) ≡ 0 (mod 10), cioè |a − b| = 5. Luhn raddoppia una cifra su due (sottraendo 9 sopra il 9): rileva ogni errore singolo e ogni scambio adiacente tranne 09 ↔ 90. Le mappe a destra sono state ottenute provando tutti gli scambi.',
      'The CRC treats the message as a polynomial with coefficients in F₂ and computes the remainder of its division by a fixed degree-32 polynomial (0x04C11DB7); an error e(x) goes unnoticed only if the generator divides e(x): so all single-bit errors, all bursts up to 32 bits and all others except one in 2³² are detected. ISBN-13 adds the digits with alternating weights 1 and 3 modulo 10: it detects every single-digit error, but a swap of adjacent digits a and b slips through when 2(a − b) ≡ 0 (mod 10), i.e. |a − b| = 5. Luhn doubles every other digit (subtracting 9 above 9): it detects every single error and every adjacent swap except 09 ↔ 90. The maps on the right were obtained by trying every swap.'));
    var cb = F.tela(G.dx, 0.22), cm = F.tela(G.dx, 0.5);
    function calcola() {
      var B = utf8(st.testo), c = crc32(B), cbit = crc32Bit(B);
      oc.innerHTML = 'CRC-32("' + st.testo.replace(/</g, '&lt;').slice(0, 40) + (st.testo.length > 40 ? '…' : '') + '") = <b>' + esa(c) + '</b><br>' + t('bit per bit: ', 'bit by bit: ') + esa(cbit) + (c === cbit ? ' ✓' : '') + (st.testo === '123456789' ? t(' · vettore di prova ufficiale 0xCBF43926', ' · official test vector 0xCBF43926') : '');
      var d = cifre(st.isbn);
      if (d.length >= 12) { var k = isbnCifra(d.slice(0, 12)); oi.innerHTML = 'ISBN: ' + t('cifra di controllo ', 'check digit ') + '<b>' + k + '</b>' + (d.length === 13 ? ' · ' + (d[12] === k ? '<span class="bsiFX-ok">' + t('valido', 'valid') + '</span>' : '<span class="bsiFX-ko">' + t('non valido', 'invalid') + '</span>') : ' → ' + d.slice(0, 12).join('') + k); }
      else oi.innerHTML = 'ISBN: ' + t('servono 12 cifre', '12 digits needed');
      var dl = cifre(st.luhn);
      ol.innerHTML = 'Luhn: ' + (dl.length ? t('cifra da aggiungere ', 'digit to append ') + '<b>' + luhnCifra(st.luhn) + '</b> → ' + dl.join('') + luhnCifra(st.luhn) + ' · ' + t('così com’è: ', 'as it is: ') + (luhnValido(st.luhn) ? '<span class="bsiFX-ok">' + t('valido', 'valid') + '</span>' : t('non valido', 'not valid')) : '—');
      /* i bit del messaggio e l'effetto di un bit invertito */
      var P0 = F.pennello(cb), q = P0.q, W = P0.W, H = P0.H, nb = Math.min(B.length * 8, 128), lato = Math.max(4, Math.min(14, (W - 20) / 32));
      q.font = '12px system-ui,sans-serif'; q.fillStyle = '#cfe3f7'; q.textAlign = 'left'; q.fillText(t('primi bit del messaggio e CRC con ogni singolo bit invertito (tutti diversi):', 'first message bits and CRC with each single bit flipped (all different):'), 10, 16);
      for (var i = 0; i < nb; i++) { var bit = B[i >> 3] >> (7 - (i & 7)) & 1, x = 10 + (i % 32) * lato, y = 26 + Math.floor(i / 32) * (lato + 2); q.fillStyle = bit ? '#5eead4' : '#1a3050'; q.fillRect(x, y, lato - 1, lato - 1); }
      var diversi = {}, nd = 0; for (i = 0; i < B.length * 8 && i < 2048; i++) { var B2 = B.slice(); B2[i >> 3] ^= 1 << (7 - (i & 7)); var cc = crc32(B2); if (cc !== c && !diversi[cc]) { diversi[cc] = 1; nd++; } }
      q.fillStyle = '#ffd24a'; q.fillText(t('bit invertiti provati: ', 'flipped bits tried: ') + Math.min(B.length * 8, 2048) + ' · ' + t('CRC diversi dall’originale e fra loro: ', 'CRCs different from the original and from each other: ') + nd, 10, H - 10);
      cb.setAttribute('aria-label', t('Bit del messaggio e controllo del CRC', 'Message bits and CRC check'));
      /* le due mappe degli scambi */
      var P1 = F.pennello(cm), q2 = P1.q, W2 = P1.W, H2 = P1.H, L = Math.min((W2 - 50) / 2 - 20, H2 - 50) / 10;
      [['isbn', 'ISBN-13', 10], ['luhn', 'Luhn', 30 + 10 * L + 20]].forEach(function (m) {
        var M = scambiNonRilevati(m[0]), x0 = m[2] + 14, y0 = 34, n = 0;
        q2.fillStyle = '#cfe3f7'; q2.font = '12px system-ui,sans-serif'; q2.textAlign = 'left';
        for (var a = 0; a < 10; a++) for (var b = 0; b < 10; b++) { q2.fillStyle = a === b ? '#16263d' : M[a][b] ? '#ff8a80' : '#1f6b5e'; q2.fillRect(x0 + b * L, y0 + a * L, L - 1, L - 1); if (M[a][b]) n++; }
        q2.fillStyle = '#9fb1c6'; q2.font = '10px system-ui,sans-serif'; for (a = 0; a < 10; a++) { q2.fillText(String(a), x0 - 9, y0 + a * L + L * 0.7); q2.fillText(String(a), x0 + a * L + L * 0.35, y0 - 4); }
        q2.fillStyle = '#cfe3f7'; q2.font = '12px system-ui,sans-serif'; q2.fillText(m[1] + ': ' + n + t(' scambi ab → ba non visti', ' undetected ab → ba swaps'), m[2], 16);
      });
      q2.fillStyle = '#8494a8'; q2.font = '11px system-ui,sans-serif'; q2.fillText(t('verde: rilevato · rosso: sfugge (riga a, colonna b)', 'green: detected · red: missed (row a, column b)'), 10, H2 - 8);
      cm.setAttribute('aria-label', t('Mappe degli scambi di cifre rilevati da ISBN-13 e Luhn', 'Maps of digit swaps detected by ISBN-13 and Luhn'));
    }
    calcola();
    F.alRidimensiona(function () { if (cb.offsetParent) calcola(); });
  }

  /* ═══ 3. curve su ℝ ═════════════════════════════════════════════════════ */
  function schedaReale(div) {
    var G = grigliaUI(div), pan = G.pan, st = { a: -2, b: 2, sP: 0.18, sQ: 0.62, modo: 'somma' };
    F.cursore(pan, ['a', 'a'], -4, 2, 0.1, st.a, function (v) { st.a = v; prepara(); }, function (v) { return v.toFixed(1); });
    F.cursore(pan, ['b', 'b'], -2, 4, 0.1, st.b, function (v) { st.b = v; prepara(); }, function (v) { return v.toFixed(1); });
    F.cursore(pan, ['posizione di P sulla curva', 'position of P on the curve'], 0, 1, 0.005, st.sP, function (v) { st.sP = v; prepara(); }, function (v) { return v.toFixed(3); });
    F.cursore(pan, ['posizione di Q sulla curva', 'position of Q on the curve'], 0, 1, 0.005, st.sQ, function (v) { st.sQ = v; prepara(); }, function (v) { return v.toFixed(3); });
    F.scelta(pan, ['Mostra', 'Show'], [['somma', ['P + Q (corda)', 'P + Q (chord)']], ['doppio', ['2P (tangente)', '2P (tangent)']], ['multipli', ['multipli P, 2P, 3P, …', 'multiples P, 2P, 3P, …']]], st.modo, function (v) { st.modo = v; prepara(); });
    var info = nota(pan);
    nota(pan, t('Una retta taglia la cubica y² = x³ + ax + b in tre punti (contando le tangenze e il punto all’infinito O, in cima a tutte le verticali). La regola P + Q + R = O per tre punti allineati definisce un gruppo commutativo: P + Q è il simmetrico rispetto all’asse x del terzo punto della retta PQ; per 2P si usa la tangente. Con λ la pendenza: x₃ = λ² − x₁ − x₂, y₃ = λ(x₁ − x₃) − y₁, e λ = (3x₁² + a)/(2y₁) per il raddoppio. Serve Δ = −16(4a³ + 27b²) ≠ 0 (niente cuspidi né nodi). L’associatività, tutt’altro che evidente nel disegno, è verificata numericamente qui sotto. Le stesse formule, con le divisioni modulo p, valgono sui campi finiti.',
      'A line cuts the cubic y² = x³ + ax + b in three points (counting tangencies and the point at infinity O, at the top of every vertical). The rule P + Q + R = O for three collinear points defines a commutative group: P + Q is the mirror image across the x axis of the third point of the line PQ; for 2P the tangent is used. With slope λ: x₃ = λ² − x₁ − x₂, y₃ = λ(x₁ − x₃) − y₁, and λ = (3x₁² + a)/(2y₁) for doubling. One needs Δ = −16(4a³ + 27b²) ≠ 0 (no cusps or nodes). Associativity, far from obvious in the picture, is checked numerically below. The same formulas, with divisions modulo p, hold over finite fields.'));
    var cc = F.tela(G.dx, 0.72);
    var camp = [], P, Q, R, terzo;
    function campionaCurva() {
      camp = []; var f = function (x) { return x * x * x + st.a * x + st.b; }, xs = [];
      for (var k = 0; k <= 2000; k++) { var x = -3 + 6 * k / 2000; if (f(x) >= 0) xs.push(x); }
      xs.forEach(function (x) { camp.push([x, Math.sqrt(f(x))]); }); for (var i = xs.length - 1; i >= 0; i--) camp.push([xs[i], -Math.sqrt(f(xs[i]))]);
    }
    function punto(s) { if (!camp.length) return null; var p = camp[Math.min(camp.length - 1, Math.round(s * (camp.length - 1)))]; return [p[0], p[1]]; }
    function prepara() {
      campionaCurva(); P = punto(st.sP); Q = punto(st.sQ);
      if (P && Math.abs(P[1]) < 1e-9) P[1] = 1e-9;
      if (st.modo === 'doppio') Q = P;
      R = P && Q ? sommaReale(P, Q, st.a) : null; terzo = R ? [R[0], -R[1]] : null;
      var D = discriminante(st.a, st.b), r = mulberry32(5), maxA = 0;
      for (var k = 0; k < 50 && camp.length; k++) { var A = punto(r()), B = punto(r()), Cc = punto(r()); var x1 = sommaReale(sommaReale(A, B, st.a), Cc, st.a), x2 = sommaReale(A, sommaReale(B, Cc, st.a), st.a); if (x1 && x2) { var e = Math.hypot(x1[0] - x2[0], x1[1] - x2[1]) / (1 + Math.hypot(x1[0], x1[1])); if (isFinite(e)) maxA = Math.max(maxA, e); } }
      info.innerHTML = 'Δ = ' + D.toFixed(2) + (Math.abs(D) < 1e-9 ? ' <span class="bsiFX-ko">' + t('curva singolare: non è una curva ellittica', 'singular curve: not an elliptic curve') + '</span>' : '') + '<br>P = ' + ptR(P) + ', Q = ' + ptR(Q) + '<br>' + (st.modo === 'doppio' ? '2P' : 'P + Q') + ' = <b>' + ptR(R) + '</b>' + (R ? ' · ' + t('sulla curva: residuo ', 'on the curve: residual ') + Math.abs(sullaCurvaReale(R, st.a, st.b)).toExponential(1) : t(' (retta verticale: il risultato è O)', ' (vertical line: the result is O)')) + '<br>' + t('Associatività su 50 terne casuali: max |(A+B)+C − (A+(B+C))| = ', 'Associativity on 50 random triples: max |(A+B)+C − (A+(B+C))| = ') + maxA.toExponential(1);
    }
    prepara();
    F.anima(cc, function (dt, tempo) {
      var Pp = F.pennello(cc), q = Pp.q, W = Pp.W, H = Pp.H, sc = Math.min(W / 7, H / 7.5), cx = W / 2, cy = H / 2, X = function (x) { return cx + x * sc; }, Y = function (y) { return cy - y * sc; };
      q.strokeStyle = '#1d2f49'; q.lineWidth = 1; for (var g = -4; g <= 4; g++) { q.beginPath(); q.moveTo(X(g), 0); q.lineTo(X(g), H); q.moveTo(0, Y(g)); q.lineTo(W, Y(g)); q.stroke(); }
      q.strokeStyle = '#34465f'; q.beginPath(); q.moveTo(0, Y(0)); q.lineTo(W, Y(0)); q.moveTo(X(0), 0); q.lineTo(X(0), H); q.stroke();
      /* la curva, ramo superiore e inferiore separati per non unire le componenti */
      q.strokeStyle = '#5eead4'; q.lineWidth = 2.5;
      [1, -1].forEach(function (sg) { q.beginPath(); var su = false, xp = null; for (var k = 0; k <= 3000; k++) { var x = -3.5 + 7 * k / 3000, v = x * x * x + st.a * x + st.b; if (v < 0) { if (su && xp != null) q.lineTo(X(xp), Y(0)); su = false; continue; } var y = sg * Math.sqrt(v); if (!su) { if (xp != null || k > 0) q.moveTo(X(x), Y(0)), q.lineTo(X(x), Y(y)); else q.moveTo(X(x), Y(y)); su = true; } else q.lineTo(X(x), Y(y)); xp = x; } q.stroke(); });
      function dot(Pt, col, et) { if (!Pt) return; q.fillStyle = col; q.beginPath(); q.arc(X(Pt[0]), Y(Pt[1]), 6, 0, 7); q.fill(); q.fillStyle = '#ffffff'; q.font = 'bold 13px system-ui,sans-serif'; q.textAlign = 'left'; q.fillText(et, X(Pt[0]) + 8, Y(Pt[1]) - 8); }
      if (st.modo === 'multipli') {
        var n = Math.floor(tempo * 0.8) % 12 + 1, S = null, prec = null; q.lineWidth = 1.5;
        for (var k2 = 1; k2 <= n; k2++) { S = sommaReale(S, P, st.a); if (S && prec && Math.abs(S[0]) < 4 && Math.abs(S[1]) < 4 && Math.abs(prec[0]) < 4 && Math.abs(prec[1]) < 4) { q.strokeStyle = 'rgba(255,210,74,.6)'; q.beginPath(); q.moveTo(X(prec[0]), Y(prec[1])); q.lineTo(X(S[0]), Y(S[1])); q.stroke(); } if (S && Math.abs(S[0]) < 4 && Math.abs(S[1]) < 4) dot(S, k2 === n ? '#ffd24a' : '#c9a0ff', k2 + 'P'); prec = S; }
        q.fillStyle = '#cfe3f7'; q.font = '13px system-ui,sans-serif'; q.fillText(n + 'P = ' + ptR(S), 10, 18);
      } else {
        var f = (tempo % 6) / 6, u = Math.min(1, f * 3);
        if (R) {
          var x1 = Math.min(P[0], Q[0], terzo[0]), x2 = Math.max(P[0], Q[0], terzo[0]), l = st.modo === 'doppio' || Math.abs(P[0] - Q[0]) < 1e-12 ? (3 * P[0] * P[0] + st.a) / (2 * P[1]) : (Q[1] - P[1]) / (Q[0] - P[0]), ext = 1.5;
          var xa = x1 - ext, xb = x1 - ext + (x2 - x1 + 2 * ext) * u; q.strokeStyle = '#ffd24a'; q.lineWidth = 1.8; q.beginPath(); q.moveTo(X(xa), Y(P[1] + l * (xa - P[0]))); q.lineTo(X(xb), Y(P[1] + l * (xb - P[0]))); q.stroke();
          if (f > 0.35) dot(terzo, '#ff8a80', '−(P+Q)');
          if (f > 0.5) { var v = Math.min(1, (f - 0.5) * 4); q.strokeStyle = '#ff8a80'; q.setLineDash([5, 4]); q.beginPath(); q.moveTo(X(terzo[0]), Y(terzo[1])); q.lineTo(X(terzo[0]), Y(terzo[1] + (R[1] - terzo[1]) * v)); q.stroke(); q.setLineDash([]); }
          if (f > 0.75) dot(R, '#ffd24a', st.modo === 'doppio' ? '2P' : 'P + Q');
        } else if (P && Q) { q.strokeStyle = '#ffd24a'; q.beginPath(); q.moveTo(X(P[0]), 0); q.lineTo(X(P[0]), H); q.stroke(); q.fillStyle = '#ffd24a'; q.fillText(t('verticale: P + Q = O', 'vertical: P + Q = O'), X(P[0]) + 6, 30); }
        dot(P, '#6bcfff', 'P'); if (st.modo !== 'doppio') dot(Q, '#c9a0ff', 'Q');
        q.fillStyle = '#cfe3f7'; q.font = '13px system-ui,sans-serif'; q.textAlign = 'left'; q.fillText('y² = x³ ' + (st.a < 0 ? '− ' : '+ ') + Math.abs(st.a).toFixed(1) + 'x ' + (st.b < 0 ? '− ' : '+ ') + Math.abs(st.b).toFixed(1), 10, 18);
      }
      cc.setAttribute('aria-label', t('Curva ellittica sui reali e somma di punti', 'Elliptic curve over the reals and point addition'));
    });
  }

  /* ═══ 4. curve su F_p, sul toro in 3D ═══════════════════════════════════ */
  var PRIMI = [17, 23, 31, 61, 97, 101, 151, 199];
  function schedaFinito(pan, S, destra) {
    var T = S.T, lab = globale.BSILab3D, st = { p: 17, a: 2, b: 2, iP: 0, iQ: 3, orbita: true, vel: 1 };
    F.scelta(pan, ['Primo p', 'Prime p'], PRIMI.map(function (p) { return [String(p), String(p)]; }), '17', function (v) { st.p = +v; st.iP = 0; st.iQ = 3; prepara(); });
    var ca = F.cursore(pan, ['a', 'a'], 0, 30, 1, st.a, function (v) { st.a = v; prepara(); });
    var cb2 = F.cursore(pan, ['b', 'b'], 0, 30, 1, st.b, function (v) { st.b = v; prepara(); });
    var cP = F.cursore(pan, ['punto P (indice)', 'point P (index)'], 0, 400, 1, st.iP, function (v) { st.iP = v; prepara(); });
    var cQ = F.cursore(pan, ['punto Q (indice)', 'point Q (index)'], 0, 400, 1, st.iQ, function (v) { st.iQ = v; prepara(); });
    F.scelta(pan, ['Animazione', 'Animation'], [['orbita', ['orbita di P: P, 2P, 3P, …', 'orbit of P: P, 2P, 3P, …']], ['somma', ['retta della somma P + Q', 'line of the sum P + Q']]], 'orbita', function (v) { st.orbita = v === 'orbita'; prepara(); });
    var info = nota(pan);
    nota(pan, t('Su F_p la curva è un insieme finito di punti della griglia p × p: la «retta» y = λx + c presa modulo p diventa una famiglia di segmenti paralleli che si ripetono. Incollando i lati opposti del quadrato (x e y sono modulo p) si ottiene un toro: lì la retta della somma è un’unica elica che si avvolge e passa esattamente per P, Q e −(P + Q). L’ordine del gruppo è contato in due modi, elencando i punti e con il simbolo di Legendre: #E = p + 1 + Σ_x ((x³ + ax + b)/p), e il teorema di Hasse garantisce |#E − (p + 1)| ≤ 2√p. Per il teorema di Lagrange l’ordine di ogni punto divide #E; se #E è primo ogni punto ≠ O genera tutto il gruppo, come nell’orbita animata. Esempio classico: y² = x³ + 2x + 2 su F₁₇ ha 19 punti e (5, 1) li genera tutti.',
      'Over F_p the curve is a finite set of points of the p × p grid: the «line» y = λx + c taken modulo p becomes a family of repeated parallel segments. Gluing opposite sides of the square (x and y are modulo p) gives a torus: there the line of the sum is a single helix that winds around and passes exactly through P, Q and −(P + Q). The group order is counted in two ways, listing the points and with the Legendre symbol: #E = p + 1 + Σ_x ((x³ + ax + b)/p), and Hasse’s theorem guarantees |#E − (p + 1)| ≤ 2√p. By Lagrange’s theorem the order of every point divides #E; if #E is prime every point ≠ O generates the whole group, as in the animated orbit. Classic example: y² = x³ + 2x + 2 over F₁₇ has 19 points and (5, 1) generates them all.'));
    var cg = F.tela(destra, 0.62), ch = F.tela(destra, 0.36);
    var Rt = 2.2, rt = 0.85, punti = [], P, Q, Sm, nE, nL, ordP, orb = [], perla, elica = null, tempo = 0, istanze = null;
    function toro(x, y, p, h) { var u = 2 * PI * x / p, v = 2 * PI * y / p, r = rt + (h || 0); return new T.Vector3((Rt + r * Math.cos(v)) * Math.cos(u), (Rt + r * Math.cos(v)) * Math.sin(u), r * Math.sin(v)); }
    function prepara() {
      var p = st.p, a = st.a % p, b = st.b % p;
      if ((4 * a * a * a + 27 * b * b) % p === 0) { b = (b + 1) % p; }
      punti = puntiCurva(a, b, p); nE = punti.length + 1; nL = ordineLegendre(a, b, p);
      cP.max = Math.max(0, punti.length - 1); cQ.max = Math.max(0, punti.length - 1); st.iP = Math.min(st.iP, punti.length - 1); st.iQ = Math.min(st.iQ, punti.length - 1);
      if (p === 17 && a === 2 && b === 2 && st.iP === 0) { var k5 = punti.findIndex(function (q) { return q[0] === 5 && q[1] === 1; }); if (k5 >= 0) st.iP = k5; }
      P = punti[st.iP] || null; Q = punti[st.iQ] || null; Sm = somma(P, Q, a, p); ordP = P ? ordinePunto(P, a, p, nE + 1) : 1;
      orb = []; var R = null; for (var k = 1; k <= Math.min(ordP, 400); k++) { R = somma(R, P, a, p); orb.push(R); }
      st.aEff = a; st.bEff = b;
      var hs = Math.abs(nE - (p + 1)), lim = 2 * Math.sqrt(p);
      info.innerHTML = 'y² = x³ + ' + a + 'x + ' + b + ' (mod ' + p + ')' + (b !== st.b % p ? t(' (b spostato: curva singolare)', ' (b shifted: singular curve)') : '') + '<br>#E = <b>' + nE + '</b> (' + t('elenco', 'listing') + ') = ' + nL + ' (Legendre) · ' + (primo(nE) ? t('primo', 'prime') : '= ' + fattori(nE).join(' · ')) + '<br>' +
        'Hasse: |#E − (p + 1)| = ' + hs + ' ≤ 2√p = ' + lim.toFixed(2) + (hs <= lim ? ' ✓' : '') + '<br>P = ' + pt(P) + t(', ordine ', ', order ') + '<b>' + ordP + '</b> (' + t('divide #E: ', 'divides #E: ') + (nE % ordP === 0 ? t('sì', 'yes') : t('no', 'no')) + ')<br>Q = ' + pt(Q) + ' · P + Q = <b>' + pt(Sm) + '</b>';
      costruisci(); griglia(); hasse();
    }
    function costruisci() {
      S.pulisci(); var p = st.p;
      var tor = new T.Mesh(new T.TorusGeometry(Rt, rt, 48, 120), new T.MeshStandardMaterial({ color: 0x1a3050, roughness: 0.6, metalness: 0.1, transparent: true, opacity: 0.85 }));
      S.aggiungi(tor);
      /* il reticolo p × p sul toro (per p piccoli) */
      if (p <= 61) { var lin = []; for (var i = 0; i < p; i++) for (var k = 0; k < 48; k++) { lin.push(toro(i, p * k / 48, p, 0.003), toro(i, p * (k + 1) / 48, p, 0.003), toro(p * k / 48, i, p, 0.003), toro(p * (k + 1) / 48, i, p, 0.003)); } S.aggiungi(new T.LineSegments(new T.BufferGeometry().setFromPoints(lin), new T.LineBasicMaterial({ color: 0x34465f, transparent: true, opacity: 0.6 }))); }
      var rs = Math.max(0.035, Math.min(0.11, 1.6 / p)), g = new T.SphereGeometry(rs, 12, 8);
      istanze = new T.InstancedMesh(g, new T.MeshStandardMaterial({ color: 0x5eead4, emissive: 0x0e4a40, roughness: 0.3 }), punti.length);
      var m = new T.Matrix4(); punti.forEach(function (q, i) { var v = toro(q[0], q[1], p, rs * 0.4); m.makeTranslation(v.x, v.y, v.z); istanze.setMatrixAt(i, m); });
      istanze.instanceMatrix.needsUpdate = true; S.aggiungi(istanze);
      function seg(Pt, col, r) { if (!Pt) return; var v = toro(Pt[0], Pt[1], p, rs); S.aggiungi(lab.sfera(T, r || rs * 1.9, col, v.x, v.y, v.z, true)); }
      seg(P, 0x6bcfff); seg(Q, 0xc9a0ff); seg(Sm, 0xffd24a);
      if (!st.orbita && P && Q && Sm) {
        /* l'elica della retta: (x, λx + c) per x ∈ [0, p·k) finche' si richiude */
        var l = uguali(P, Q) ? modulo((3 * P[0] * P[0] + st.aEff) * invmod(2 * P[1], p), p) : P[0] === Q[0] ? null : modulo((Q[1] - P[1]) * invmod(modulo(Q[0] - P[0], p), p), p);
        if (l != null) { var c0 = modulo(P[1] - l * P[0], p), pts = []; for (var s = 0; s <= 1200; s++) { var x = p * s / 1200, y = (l * x + c0) % p; pts.push(toro(x, y, p, rs * 0.6)); } elica = new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: 0xffd24a, transparent: true, opacity: 0.85 })); elica.geometry.setDrawRange(0, 2); S.aggiungi(elica); seg(opposto(Sm, p), 0xff8a80, rs * 1.5); }
      } else elica = null;
      perla = lab.sfera(T, rs * 2.4, 0xffffff, 0, 0, 0, true); S.aggiungi(perla); perla.visible = st.orbita && orb.length > 0;
      tempo = 0;
      S.ogniFotogramma(function (dt) {
        tempo += dt;
        if (elica) { elica.geometry.setDrawRange(0, Math.min(1201, 2 + Math.floor(tempo * 300))); }
        if (st.orbita && orb.length) { var k = Math.floor(tempo * 2.5) % orb.length, R = orb[k]; if (R) { var v = toro(R[0], R[1], p, rs * 1.2); perla.position.copy(v); perla.visible = true; } else perla.visible = false; S.didascalia.textContent = (k + 1) + 'P = ' + pt(R) + ' · ' + t('ordine di P = ', 'order of P = ') + ordP; }
        if (!st.orbita && tempo > 5) return false;
      });
      S.didascalia.textContent = 'E(F_' + p + '): ' + nE + t(' punti sul toro F_p × F_p', ' points on the torus F_p × F_p');
      if (!S.vistaIniziale) S.inquadra(8.5, -0.9, 0.85);
    }
    function griglia() {
      var p = st.p, Pp = F.pennello(cg), q = Pp.q, W = Pp.W, H = Pp.H, m = 26, L = Math.min(W - m - 10, H - m - 10) / p, x0 = m, y0 = H - m;
      q.strokeStyle = '#16263d'; q.lineWidth = 1; if (p <= 61) for (var i = 0; i <= p; i++) { q.beginPath(); q.moveTo(x0 + i * L, y0); q.lineTo(x0 + i * L, y0 - p * L); q.moveTo(x0, y0 - i * L); q.lineTo(x0 + p * L, y0 - i * L); q.stroke(); }
      q.strokeStyle = '#34465f'; q.strokeRect(x0, y0 - p * L, p * L, p * L);
      if (P && Q && Sm && !uguali(P, Q) && P[0] !== Q[0]) { var l = modulo((Q[1] - P[1]) * invmod(modulo(Q[0] - P[0], p), p), p), c0 = modulo(P[1] - l * P[0], p); q.strokeStyle = 'rgba(255,210,74,.45)'; for (var x = 0; x < p; x += 1 / Math.max(1, l)) { var y = (l * x + c0) % p, x2 = x + 1 / Math.max(1, l), y2 = y + l / Math.max(1, l); if (y2 <= p + 1e-9) { q.beginPath(); q.moveTo(x0 + (x + 0.5) * L, y0 - (y + 0.5) * L); q.lineTo(x0 + (Math.min(x2, p) + 0.5) * L, y0 - (Math.min(y2, p) + 0.5) * L); q.stroke(); } } }
      punti.forEach(function (pq) { q.fillStyle = '#5eead4'; q.beginPath(); q.arc(x0 + (pq[0] + 0.5) * L, y0 - (pq[1] + 0.5) * L, Math.max(1.5, Math.min(5, L * 0.35)), 0, 7); q.fill(); });
      [[P, '#6bcfff', 'P'], [Q, '#c9a0ff', 'Q'], [Sm, '#ffd24a', 'P+Q']].forEach(function (z) { if (!z[0]) return; q.strokeStyle = z[1]; q.lineWidth = 2; q.beginPath(); q.arc(x0 + (z[0][0] + 0.5) * L, y0 - (z[0][1] + 0.5) * L, Math.max(5, L * 0.6), 0, 7); q.stroke(); q.fillStyle = z[1]; q.font = 'bold 11px system-ui,sans-serif'; q.fillText(z[2], x0 + (z[0][0] + 0.5) * L + 7, y0 - (z[0][1] + 0.5) * L - 7); });
      q.fillStyle = '#9fb1c6'; q.font = '11px system-ui,sans-serif'; q.textAlign = 'center'; q.fillText('x (mod ' + p + ')', x0 + p * L / 2, H - 6); q.save(); q.translate(10, y0 - p * L / 2); q.rotate(-PI / 2); q.fillText('y', 0, 0); q.restore(); q.textAlign = 'left';
      q.fillStyle = '#cfe3f7'; q.font = '12px system-ui,sans-serif'; q.fillText(t('i punti di E(F_p) e la «retta» per P e Q (modulo p)', 'the points of E(F_p) and the «line» through P and Q (modulo p)'), x0 + 4, 14);
      cg.setAttribute('aria-label', t('Punti della curva su F_p nella griglia p × p', 'Curve points over F_p in the p × p grid'));
    }
    function hasse() {
      /* #E per tutti i b (a fissato) su questo p, dentro la fascia di Hasse */
      var p = st.p, xs = [], ys = [], lo = [], hi = [];
      for (var b = 0; b < Math.min(p, 60); b++) { if ((4 * st.aEff * st.aEff * st.aEff + 27 * b * b) % p === 0) continue; xs.push(b); ys.push(ordineLegendre(st.aEff, b, p)); }
      F.grafico(ch, { serie: [{ x: [0, xs[xs.length - 1]], y: [p + 1 + 2 * Math.sqrt(p), p + 1 + 2 * Math.sqrt(p)], col: '#ff8a80', tratt: true, etich: ['p + 1 + 2√p', 'p + 1 + 2√p'] }, { x: [0, xs[xs.length - 1]], y: [p + 1 - 2 * Math.sqrt(p), p + 1 - 2 * Math.sqrt(p)], col: '#ff8a80', tratt: true, etich: ['p + 1 − 2√p', 'p + 1 − 2√p'] }, { x: [0, xs[xs.length - 1]], y: [p + 1, p + 1], col: '#34465f', etich: ['p + 1', 'p + 1'] }], punti: xs.map(function (b, i) { return { x: b, y: ys[i], col: b === st.bEff ? '#ffffff' : '#5eead4', r: b === st.bEff ? 5 : 3 }; }), xl: ['b (con a = ' + st.aEff + ')', 'b (with a = ' + st.aEff + ')'], yl: ['#E', '#E'], legenda: [{ col: '#5eead4', etich: ['#E per ogni b', '#E for each b'] }, { col: '#ff8a80', etich: ['limiti di Hasse', 'Hasse bounds'] }], descr: ['Ordine del gruppo e limiti di Hasse', 'Group order and Hasse bounds'] });
      void lo; void hi;
    }
    prepara();
  }

  /* ═══ 5. ECDH e logaritmo discreto ══════════════════════════════════════ */
  function schedaECDH(div) {
    var G = grigliaUI(div), pan = G.pan, st = { c: 'c1009', a: 123, b: 456 };
    F.scelta(pan, ['Curva', 'Curve'], Object.keys(CURVE).map(function (k) { return [k, CURVE[k].nome + ' · #E = ' + CURVE[k].n]; }), st.c, function (v) { st.c = v; var n = CURVE[v].n; st.a = Math.min(st.a, n - 1); st.b = Math.min(st.b, n - 1); ca.max = n - 1; cb.max = n - 1; calcola(); });
    var ca = F.cursore(pan, ['chiave segreta di Alice a', 'Alice’s secret key a'], 1, CURVE[st.c].n - 1, 1, st.a, function (v) { st.a = v; calcola(); });
    var cb = F.cursore(pan, ['chiave segreta di Bob b', 'Bob’s secret key b'], 1, CURVE[st.c].n - 1, 1, st.b, function (v) { st.b = v; calcola(); });
    var bb = F.bottone(pan, ['Rompi A con la forza bruta', 'Break A by brute force'], function () { forza(); });
    var info = nota(pan), rotta = nota(pan);
    nota(pan, t('Diffie–Hellman sulle curve ellittiche: Alice e Bob concordano pubblicamente la curva e un punto G di ordine n. Alice sceglie a segreto e pubblica A = aG, Bob sceglie b e pubblica B = bG; entrambi calcolano S = aB = bA = abG, che una spia non sa ricavare da A e B senza risolvere il logaritmo discreto (trovare a da A = aG). aG si calcola con «raddoppia e somma» in circa log₂ a passi (a destra, bit per bit), mentre il logaritmo per forza bruta richiede in media n/2 somme e il metodo passo-piccolo passo-gigante (Shanks) circa 2√n, contro i √n del migliore attacco generico noto (Pollard ρ). Con n ≈ 2²⁵⁶ (la curva P-256 o Curve25519) √n ≈ 2¹²⁸: miliardi di computer per miliardi di anni.',
      'Elliptic-curve Diffie–Hellman: Alice and Bob publicly agree on the curve and a point G of order n. Alice picks secret a and publishes A = aG, Bob picks b and publishes B = bG; both compute S = aB = bA = abG, which an eavesdropper cannot derive from A and B without solving the discrete logarithm (finding a from A = aG). aG is computed by «double and add» in about log₂ a steps (on the right, bit by bit), while the brute-force logarithm needs n/2 additions on average and baby-step giant-step (Shanks) about 2√n, against the √n of the best known generic attack (Pollard ρ). With n ≈ 2²⁵⁶ (the P-256 curve or Curve25519) √n ≈ 2¹²⁸: billions of computers for billions of years.'));
    var cs = F.tela(G.dx, 0.5), cc = F.tela(G.dx, 0.42);
    var C0, Gp, A, B, S1, S2, passiA = [], lavoro = 0;
    function calcola() {
      C0 = CURVE[st.c]; Gp = generatore(C0); passiA = [];
      A = multiplo(st.a, Gp, C0.a, C0.p, passiA); B = multiplo(st.b, Gp, C0.a, C0.p); S1 = multiplo(st.a, B, C0.a, C0.p); S2 = multiplo(st.b, A, C0.a, C0.p);
      var bs = logBSGS(Gp, A, C0.a, C0.p, C0.n);
      info.innerHTML = 'G = ' + pt(Gp) + ' · n = ' + C0.n + (primo(C0.n) ? t(' (primo)', ' (prime)') : '') + '<br>A = aG = <b>' + pt(A) + '</b> · B = bG = <b>' + pt(B) + '</b><br>' + t('Alice: aB = ', 'Alice: aB = ') + pt(S1) + '<br>' + t('Bob: bA = ', 'Bob: bA = ') + pt(S2) + ' ' + (uguali(S1, S2) ? '<span class="bsiFX-ok">' + t('segreto condiviso uguale', 'same shared secret') + '</span>' : '') + '<br>' +
        t('Passo-piccolo passo-gigante: a = ', 'Baby-step giant-step: a = ') + '<b>' + bs.k + '</b> ' + t('in ', 'in ') + bs.passi + t(' somme (2√n ≈ ', ' additions (2√n ≈ ') + Math.round(2 * Math.sqrt(C0.n)) + ')';
      rotta.innerHTML = t('Forza bruta: premi il pulsante (si prova G, 2G, 3G, … finché esce A).', 'Brute force: press the button (try G, 2G, 3G, … until A appears).');
      lavoro++; disegna(-1, 0); grafico();
    }
    function forza() {
      var mio = ++lavoro, R = null, k = 0, t0 = (globale.performance ? performance.now() : 0);
      (function lotto() {
        if (mio !== lavoro) return;
        for (var i = 0; i < 5000; i++) { if (uguali(R, A)) { var dtm = (globale.performance ? performance.now() : 0) - t0; rotta.innerHTML = t('Forza bruta: trovato a = ', 'Brute force: found a = ') + '<b>' + k + '</b> ' + t('dopo ', 'after ') + k + t(' somme, ', ' additions, ') + dtm.toFixed(0) + ' ms. ' + t('A questa velocità, per n ≈ 2¹²⁸ (sicurezza di P-256 contro ρ) servirebbero circa ', 'At this speed, for n ≈ 2¹²⁸ (security of P-256 against ρ) it would take about ') + fmt(Math.pow(2, 128) / Math.max(1, k / Math.max(dtm, 1) * 1000) / 3.156e7) + t(' anni.', ' years.'); disegna(k, k); return; } R = somma(R, Gp, C0.a, C0.p); k++; }
        rotta.innerHTML = t('Forza bruta in corso: provati ', 'Brute force running: tried ') + k + ' / ' + C0.n; disegna(k, k); setTimeout(lotto, 0);
      })();
    }
    function disegna(kForza) {
      var Pp = F.pennello(cs), q = Pp.q, W = Pp.W, H = Pp.H;
      q.font = '12px ui-monospace,monospace'; q.textAlign = 'left';
      q.fillStyle = '#cfe3f7'; q.fillText('a = ' + st.a + ' = ' + st.a.toString(2) + '₂  ' + t('(raddoppia e somma)', '(double and add)'), 10, 18);
      var righe = Math.floor((H - 40) / 16), ini = Math.max(0, passiA.length - righe);
      passiA.slice(ini).forEach(function (s, i) { q.fillStyle = s[0] === '+' ? '#ffd24a' : '#5eead4'; q.fillText((s[0] === '+' ? '+G  → ' : '×2  → ') + pt(s[1]), 14, 38 + 16 * i); });
      if (W > 520) {
        var x0 = W * 0.55; q.fillStyle = '#cfe3f7'; q.fillText(t('Alice', 'Alice'), x0, 38); q.fillText(t('Bob', 'Bob'), x0 + 130, 38);
        q.fillStyle = '#9fb1c6'; q.fillText('a = ' + st.a, x0, 58); q.fillText('b = ' + st.b, x0 + 130, 58);
        q.fillStyle = '#6bcfff'; q.fillText('A = ' + pt(A), x0, 84); q.fillText('B = ' + pt(B), x0 + 130, 104);
        q.strokeStyle = '#8494a8'; q.beginPath(); q.moveTo(x0 + 60, 112); q.lineTo(x0 + 150, 132); q.moveTo(x0 + 150, 112); q.lineTo(x0 + 60, 132); q.stroke();
        q.fillStyle = '#ffd24a'; q.fillText('aB = ' + pt(S1), x0, 154); q.fillText('bA = ' + pt(S2), x0 + 130, 174);
        q.fillStyle = '#ff8a80'; q.fillText(t('spia: vede G, A, B', 'eavesdropper: sees G, A, B'), x0, 210);
        if (kForza > 0) { q.fillText(t('forza bruta: ', 'brute force: ') + kForza + ' / ' + C0.n, x0, 230); q.fillStyle = '#1a3050'; q.fillRect(x0, 240, W - x0 - 14, 10); q.fillStyle = '#ff8a80'; q.fillRect(x0, 240, (W - x0 - 14) * Math.min(1, kForza / C0.n), 10); }
      }
      cs.setAttribute('aria-label', t('Passi del raddoppia e somma e scambio ECDH', 'Double-and-add steps and ECDH exchange'));
    }
    function grafico() {
      var bits = [], bf = [], bg = [], da = []; for (var b = 8; b <= 256; b += 8) { bits.push(b); bf.push(b - 1); bg.push(b / 2 + 1); da.push(Math.log10(1.5 * b) / Math.LN10 * Math.LN10); }
      F.grafico(cc, { serie: [{ x: bits, y: bf, col: '#ff8a80', etich: ['forza bruta n/2', 'brute force n/2'] }, { x: bits, y: bg, col: '#ffd24a', etich: ['BSGS / Pollard ρ ~ √n', 'BSGS / Pollard ρ ~ √n'] }, { x: bits, y: bits.map(function (b) { return Math.log2(1.5 * b); }), col: '#5eead4', etich: ['raddoppia e somma ~ 1,5 log₂ n', 'double and add ~ 1.5 log₂ n'] }], linee: [{ y: 80, col: '#c9a0ff', etich: t('≈ limite pratico (2⁸⁰ operazioni)', '≈ practical limit (2⁸⁰ operations)') }], xmin: 8, xmax: 256, ymin: 0, xl: ['bit di n', 'bits of n'], yl: ['log₂(operazioni)', 'log₂(operations)'], legenda: [{ col: '#5eead4', etich: ['usare la chiave: aG', 'using the key: aG'] }, { col: '#ffd24a', etich: ['attacco migliore: √n', 'best attack: √n'] }, { col: '#ff8a80', etich: ['forza bruta: n/2', 'brute force: n/2'] }], descr: ['Costo del calcolo contro costo dell’attacco', 'Cost of computing against cost of attacking'] });
      void da;
    }
    calcola(); void bb;
  }

  F.sezione('smatcodici', {
    titolo: ['📡 Codici e curve ellittiche', '📡 Codes and elliptic curves'],
    sotto: ['Correggere gli errori (Hamming), accorgersene (CRC-32, ISBN, Luhn) e nascondere i segreti (curve ellittiche e Diffie–Hellman): ogni algoritmo con i vettori di prova ufficiali e un secondo metodo indipendente, la curva su F_p avvolta su un toro in 3D.', 'Correcting errors (Hamming), noticing them (CRC-32, ISBN, Luhn) and hiding secrets (elliptic curves and Diffie–Hellman): every algorithm with the official test vectors and a second independent method, the curve over F_p wrapped on a torus in 3D.'],
    schede: [
      { nome: ['🧮 Hamming(7,4)', '🧮 Hamming(7,4)'], costruisci: schedaHamming },
      { nome: ['🔁 CRC e cifre di controllo', '🔁 CRC and check digits'], costruisci: schedaControlli },
      { nome: ['📈 Curve su ℝ', '📈 Curves over ℝ'], costruisci: schedaReale },
      { nome: ['🍩 Curve su F_p (3D)', '🍩 Curves over F_p (3D)'], costruisci: function (div) {
        var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'); g.appendChild(pan); g.appendChild(dx); div.appendChild(g);
        var lab = globale.BSILab3D;
        if (!lab) { nota(pan, t('Serve il Laboratorio 3D (bsi-lab3d.js) per questa scheda: qui si vedrebbe la curva su F_p avvolta su un toro.', 'The 3D Laboratory (bsi-lab3d.js) is needed for this tab: it would show the curve over F_p wrapped on a torus.')); return; }
        var attesa = F.el('div', { 'class': 'bsiFX-nota', testo: t('Caricamento del motore 3D…', 'Loading the 3D engine…') }); dx.appendChild(attesa); lab.stile();
        lab.caricaThree().then(function () { attesa.remove(); var S = new lab.Scena(dx, 0.66); div._scena = S; schedaFinito(pan, S, dx); }).catch(function (e) { if (globale.console) console.error(e); attesa.textContent = t('Motore 3D non disponibile: ', '3D engine unavailable: ') + e.message; if (!attesa.parentNode) dx.appendChild(attesa); });
      } },
      { nome: ['🔐 ECDH', '🔐 ECDH'], costruisci: schedaECDH }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
