// verifica di F.calcolo.codici con i vettori di prova ufficiali e metodi indipendenti
const C = require('./carica.js')(['bsi-mat-codici.js']);
const K = C.codici;
let ok = 0, ko = 0;
function chk(nome, val, atteso, tol) { const p = Math.abs(val - atteso) <= (tol || 0); p ? ok++ : ko++; console.log((p ? 'OK ' : 'KO ') + nome + ': ' + val + ' (atteso ' + atteso + (tol ? ' ± ' + tol : '') + ')'); }
function vero(nome, c, det) { c ? ok++ : ko++; console.log((c ? 'OK ' : 'KO ') + nome + (det ? ' — ' + det : '')); }

// ── Hamming(7,4) ──
(function () {
  const W = K.tutteLeParole(); let dmin = 99; for (let i = 0; i < 16; i++) for (let j = i + 1; j < 16; j++) dmin = Math.min(dmin, K.distanzaHamming(W[i], W[j]));
  chk('distanza minima fra le 16 parole', dmin, 3);
  let peso = 99; W.forEach(w => { const s = w.reduce((a, b) => a + b, 0); if (s) peso = Math.min(peso, s); }); chk('peso minimo non nullo = distanza minima (codice lineare)', peso, 3);
  const G = K.matriceG(), H = K.matriceH(); let z = 0; G.forEach(g => H.forEach(h => { z += g.reduce((s, v, i) => s + v * h[i], 0) % 2; })); chk('G·Hᵀ = 0 (mod 2)', z, 0);
  let corr = 0, sind = 0; W.forEach((w, k) => { for (let i = 0; i < 7; i++) { const r = w.slice(); r[i] ^= 1; const d = K.hammingDecodifica(r); if (d.corretto.join('') === w.join('')) corr++; if (d.sindrome === i + 1) sind++; } });
  chk('tutti i 112 errori singoli corretti', corr, 112); chk('la sindrome è la posizione dell’errore (112 casi)', sind, 112);
  let doppi = 0; W.forEach(w => { for (let i = 0; i < 7; i++) for (let j = i + 1; j < 7; j++) { const r = w.slice(); r[i] ^= 1; r[j] ^= 1; if (K.hammingDecodifica(r).corretto.join('') !== w.join('')) doppi++; } });
  chk('errori doppi: tutti e 336 decodificati male (capacità 1)', doppi, 336);
  const viste = new Set(); W.forEach(w => { viste.add(w.join('')); for (let i = 0; i < 7; i++) { const r = w.slice(); r[i] ^= 1; viste.add(r.join('')); } }); chk('codice perfetto: le sfere di raggio 1 coprono tutti i 2⁷ vettori', viste.size, 128);
  chk('esempio: dati 1011 → 0110011', +(K.hammingCodifica([1, 0, 1, 1]).join('') === '0110011'), 1);
  const p = 0.1, e = K.erroreBlocco(p), s = K.simulaCanale(p, 200000, 9);
  chk('canale p = 0,1: errore di blocco Hamming simulato vs formula', s.hamming, e.hamming, 4 * Math.sqrt(e.hamming * (1 - e.hamming) / 200000)); chk('canale p = 0,1: senza codice simulato vs 1 − 0,9⁴', s.senza, 1 - Math.pow(0.9, 4), 0.005);
  chk('distanza di Hamming "karolin"/"kathrin" = 3', K.distanzaHamming('karolin', 'kathrin'), 3);
})();

// ── CRC-32 ──
(function () {
  chk('CRC-32("123456789") = 0xCBF43926', K.crc32(K.utf8('123456789')), 0xCBF43926);
  chk('CRC-32("") = 0', K.crc32([]), 0);
  chk('CRC-32("The quick brown fox jumps over the lazy dog") = 0x414FA339', K.crc32(K.utf8('The quick brown fox jumps over the lazy dog')), 0x414FA339);
  chk('CRC-32("a") = 0xE8B7BE43', K.crc32(K.utf8('a')), 0xE8B7BE43);
  const r = K.mulberry32(5); let diff = 0; for (let n = 0; n < 300; n++) { const b = Array.from({ length: Math.floor(r() * 200) }, () => Math.floor(r() * 256)); if (K.crc32(b) !== K.crc32Bit(b)) diff++; } chk('300 messaggi casuali: tabella = bit per bit', diff, 0);
  const L = 64, a = Array.from({ length: L }, () => Math.floor(r() * 256)), b = Array.from({ length: L }, () => Math.floor(r() * 256)), c = Array.from({ length: L }, () => Math.floor(r() * 256)), x = a.map((v, i) => v ^ b[i] ^ c[i]);
  chk('affinità: CRC(a⊕b⊕c) = CRC(a)⊕CRC(b)⊕CRC(c)', (K.crc32(x) ^ K.crc32(a) ^ K.crc32(b) ^ K.crc32(c)) >>> 0, 0);
  const c0 = K.crc32(a); let mancati = 0; for (let i = 0; i < L * 8; i++) { const d = a.slice(); d[i >> 3] ^= 1 << (i & 7); if (K.crc32(d) === c0) mancati++; } chk('tutti i 512 errori di un bit rilevati', mancati, 0);
  let mb = 0; for (let k = 0; k < 2000; k++) { const d = a.slice(), start = Math.floor(r() * (L * 8 - 32)), len = 1 + Math.floor(r() * 32); for (let i = start; i < start + len; i++) if (i === start || i === start + len - 1 || r() < 0.5) d[i >> 3] ^= 1 << (i & 7); if (K.crc32(d) === c0) mb++; } chk('2000 raffiche ≤ 32 bit: tutte rilevate', mb, 0);
})();

// ── ISBN-13 e Luhn ──
(function () {
  vero('ISBN 978-0-306-40615-7 valido', K.isbnValido('978-0-306-40615-7')); vero('ISBN 978-3-16-148410-0 valido', K.isbnValido('978-3-16-148410-0'));
  chk('cifra di controllo di 978030640615 = 7', K.isbnCifra(K.cifre('978030640615')), 7); vero('ISBN 978-0-306-40615-6 non valido', !K.isbnValido('9780306406156'));
  vero('Luhn 79927398713 valido', K.luhnValido('79927398713')); chk('Luhn: cifra per 7992739871 = 3', K.luhnCifra('7992739871'), 3); vero('Luhn 4539 1488 0343 6467 valido', K.luhnValido('4539 1488 0343 6467')); vero('Luhn 79927398710 non valido', !K.luhnValido('79927398710'));
  let si = 0, sl = 0; const base = K.cifre('9780306406157'), bl = K.cifre('79927398713');
  for (let i = 0; i < 13; i++) for (let v = 0; v < 10; v++) { if (v === base[i]) continue; const d = base.slice(); d[i] = v; if (K.isbnValido(d.join(''))) si++; }
  for (let i = 0; i < bl.length; i++) for (let v = 0; v < 10; v++) { if (v === bl[i]) continue; const d = bl.slice(); d[i] = v; if (K.luhnValido(d.join(''))) sl++; }
  chk('ISBN: tutti gli errori su una cifra rilevati', si, 0); chk('Luhn: tutti gli errori su una cifra rilevati', sl, 0);
  const MI = K.scambiNonRilevati('isbn'), ML = K.scambiNonRilevati('luhn'); let okI = true, nl = []; for (let a = 0; a < 10; a++) for (let b = 0; b < 10; b++) { if (MI[a][b] !== (a !== b && Math.abs(a - b) === 5)) okI = false; if (ML[a][b]) nl.push('' + a + b); }
  vero('ISBN: sfuggono esattamente gli scambi con |a − b| = 5', okI); vero('Luhn: sfuggono solo gli scambi 09 ↔ 90', nl.join(',') === '09,90', nl.join(','));
})();

// ── curve su ℝ ──
(function () {
  const a = -2, b = 2, f = x => [x, Math.sqrt(x * x * x + a * x + b)], P = f(0.3), Q = f(1.4), R = K.sommaReale(P, Q, a);
  chk('P + Q sulla curva', K.sullaCurvaReale(R, a, b), 0, 1e-12);
  const l = (Q[1] - P[1]) / (Q[0] - P[0]); chk('−(P + Q) sta sulla retta PQ', -R[1] - (P[1] + l * (R[0] - P[0])), 0, 1e-12);
  const h = 1e-7, Qh = f(0.3 + h), D1 = K.sommaReale(P, P, a), Dh = K.sommaReale(P, Qh, a); chk('2P = limite di P + Q per Q → P (tangente)', Math.hypot(D1[0] - Dh[0], D1[1] - Dh[1]), 0, 1e-5);
  const r = K.mulberry32(8), pts = Array.from({ length: 60 }, () => f(-1.7 + 4 * r())).filter(p => isFinite(p[1])); let m = 0; for (let k = 0; k + 2 < pts.length; k += 3) { const A = pts[k], B = pts[k + 1], Cc = pts[k + 2], x1 = K.sommaReale(K.sommaReale(A, B, a), Cc, a), x2 = K.sommaReale(A, K.sommaReale(B, Cc, a), a); m = Math.max(m, Math.hypot(x1[0] - x2[0], x1[1] - x2[1]) / (1 + Math.hypot(x1[0], x1[1]))); }
  chk('associatività su ℝ (20 terne)', m, 0, 1e-8);
  chk('P + (−P) = O', K.sommaReale(P, [P[0], -P[1]], a) === null ? 1 : 0, 1);
  chk('discriminante di y² = x³ − 3x + 2 (nodo) = 0', K.discriminante(-3, 2), 0);
})();

// ── curve su F_p ──
(function () {
  const p = 17, a = 2, b = 2, pts = K.puntiCurva(a, b, p);
  chk('y² = x³ + 2x + 2 su F₁₇: #E = 19 (enumerazione)', pts.length + 1, 19); chk('… = 19 (simbolo di Legendre)', K.ordineLegendre(a, b, p), 19);
  chk('(5, 1) ha ordine 19', K.ordinePunto([5, 1], a, p), 19);
  chk('2·(5,1) = (6, 3)', +(K.uguali(K.somma([5, 1], [5, 1], a, p), [6, 3])), 1); chk('19·(5,1) = O', K.multiplo(19, [5, 1], a, p) === null ? 1 : 0, 1);
  const E = pts.concat([null]); let ass = 0, comm = 0, chiuso = 0; for (const X of E) for (const Y of E) { const s = K.somma(X, Y, a, p); if (!K.uguali(s, K.somma(Y, X, a, p))) comm++; if (s && pts.findIndex(q => K.uguali(q, s)) < 0) chiuso++; for (const Z of E) if (!K.uguali(K.somma(K.somma(X, Y, a, p), Z, a, p), K.somma(X, K.somma(Y, Z, a, p), a, p))) ass++; }
  chk('F₁₇: associatività su tutte le 8000 terne', ass, 0); chk('F₁₇: commutatività e chiusura', comm + chiuso, 0);
  let hasse = 0, legendre = 0, lagrange = 0, prove = 0; [23, 31, 61, 97, 101, 151, 199].forEach(q => { for (let bb = 0; bb < 12; bb++) for (const aa of [0, 1, 2, 5]) { if ((4 * aa ** 3 + 27 * bb * bb) % q === 0) continue; const P = K.puntiCurva(aa, bb, q), n = P.length + 1; prove++; if (Math.abs(n - q - 1) > 2 * Math.sqrt(q)) hasse++; if (n !== K.ordineLegendre(aa, bb, q)) legendre++; if (P.length && n % K.ordinePunto(P[Math.floor(P.length / 2)], aa, q, n + 1) !== 0) lagrange++; } });
  chk(prove + ' curve: limite di Hasse sempre rispettato', hasse, 0); chk(prove + ' curve: enumerazione = Legendre', legendre, 0); chk(prove + ' curve: l’ordine di un punto divide #E (Lagrange)', lagrange, 0);
})();

// ── ECDH e logaritmo discreto ──
(function () {
  Object.keys(K.CURVE).forEach(k => { const c = K.CURVE[k]; if (c.p <= 10007) chk(c.nome + ': #E (Legendre) = ' + c.n, K.ordineLegendre(c.a, c.b, c.p), c.n); vero(c.nome + ': #E primo', K.primo(c.n)); });
  const c = K.CURVE.c1009, G = K.generatore(c), A = K.multiplo(123, G, c.a, c.p), B = K.multiplo(456, G, c.a, c.p);
  vero('ECDH: aB = bA', K.uguali(K.multiplo(123, B, c.a, c.p), K.multiplo(456, A, c.a, c.p)));
  vero('ECDH: aB = (ab mod n)G', K.uguali(K.multiplo(123, B, c.a, c.p), K.multiplo(123 * 456 % c.n, G, c.a, c.p)));
  chk('nG = O (G genera un gruppo di ordine n)', K.multiplo(c.n, G, c.a, c.p) === null ? 1 : 0, 1);
  chk('logaritmo discreto per forza bruta = 123', K.logForzaBruta(G, A, c.a, c.p, c.n).k, 123);
  const c2 = K.CURVE.c100003, G2 = K.generatore(c2), A2 = K.multiplo(77777, G2, c2.a, c2.p), bs = K.logBSGS(G2, A2, c2.a, c2.p, c2.n);
  chk('n = 99907: nG = O sulla curva mod 100003', K.multiplo(c2.n, G2, c2.a, c2.p) === null ? 1 : 0, 1);
  chk('passo-piccolo passo-gigante su n = 99907: ritrova 77777', bs.k, 77777); vero('BSGS: al più 2⌈√n⌉ somme', bs.passi <= 2 * Math.ceil(Math.sqrt(c2.n)) + 1, bs.passi + ' somme');
  chk('raddoppia e somma = somma ripetuta (37G)', +K.uguali(K.multiplo(37, G, c.a, c.p), Array.from({ length: 37 }).reduce(R => K.somma(R, G, c.a, c.p), null)), 1);
})();

console.log(ok + ' superati, ' + ko + ' falliti');
process.exit(ko ? 1 : 0);
