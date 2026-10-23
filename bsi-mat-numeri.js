/* ═══════════════════════════════════════════════════════════════════════════
   bsi-mat-numeri.js — 🔐 numeri e crittografia
   BioSpecInfo · © Samuele Pio Provenzano

   · CRIVELLO DI ERATOSTENE animato: si cancellano i multipli di ogni primo,
     partendo dal suo quadrato; restano i primi;
   · EUCLIDE: il massimo comun divisore passo per passo e l'algoritmo
     esteso, che trova x e y con a x + b y = MCD(a, b) (identita' di Bézout)
     e quindi l'inverso modulare;
   · ARITMETICA MODULARE: la tabellina «sull'orologio» (moltiplicazione per
     k modulo n disegnata come corde: cardioide e nefroide), la potenza
     modulare veloce;
   · RSA: due primi, la chiave pubblica e quella privata, un messaggio
     cifrato e decifrato davvero (con BigInt), e perche' fattorizzare n e'
     difficile;
   · I PRIMI: π(x) contro x/ln x e Li(x) (teorema dei numeri primi).
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, fmt = F.fmt;
  function griglia(div) { var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'); G.appendChild(pan); G.appendChild(dx); div.appendChild(G); return { pan: pan, dx: dx }; }
  function nota(pan) { var n = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(n); return n; }
  function campo(pan, et, val, cambia) { var i = F.el('input', { type: 'text', value: val, 'aria-label': F.tt(et), spellcheck: 'false', autocomplete: 'off' }); pan.appendChild(F.el('div', { 'class': 'bsiFX-cursore' }, [F.el('label', null, [F.el('span', { testo: F.tt(et) })]), i])); i.addEventListener('change', function () { cambia(i.value); }); return i; }

  /* ═══ calcoli ═══════════════════════════════════════════════════════════ */
  function crivello(N) { var c = new Uint8Array(N + 1); c[0] = c[1] = 1; for (var p = 2; p * p <= N; p++) if (!c[p]) for (var m = p * p; m <= N; m += p) c[m] = 1; var out = []; for (var i = 2; i <= N; i++) if (!c[i]) out.push(i); return out; }
  function euclide(a, b) { var passi = []; while (b) { passi.push([a, b, Math.floor(a / b), a % b]); var r = a % b; a = b; b = r; } return { mcd: a, passi: passi }; }
  function esteso(a, b) { var r0 = a, r1 = b, s0 = 1, s1 = 0, t0 = 0, t1 = 1; while (r1) { var q = Math.floor(r0 / r1), tmp; tmp = r0 - q * r1; r0 = r1; r1 = tmp; tmp = s0 - q * s1; s0 = s1; s1 = tmp; tmp = t0 - q * t1; t0 = t1; t1 = tmp; } return { mcd: r0, x: s0, y: t0 }; }
  function inverso(a, n) { var e = esteso(((a % n) + n) % n, n); if (e.mcd !== 1) return null; return ((e.x % n) + n) % n; }
  function potenzaMod(b, e, m) { b = BigInt(b); e = BigInt(e); m = BigInt(m); var r = 1n; b %= m; while (e > 0n) { if (e & 1n) r = r * b % m; b = b * b % m; e >>= 1n; } return r; }
  function rsa(p, q, e) {
    var n = p * q, phi = (p - 1) * (q - 1); if (!e) { e = 65537 < phi ? 65537 : 3; while (esteso(e, phi).mcd !== 1) e += 2; }
    var d = inverso(e, phi); return { n: n, phi: phi, e: e, d: d };
  }
  function cifra(msg, K) { return Array.from(msg).map(function (ch) { return potenzaMod(ch.codePointAt(0), K.e, K.n); }); }
  function decifra(cs, K) { return cs.map(function (c) { return String.fromCodePoint(Number(potenzaMod(c, K.d, K.n))); }).join(''); }
  function pigreco(x, primi) { var k = 0; while (k < primi.length && primi[k] <= x) k++; return k; }
  /* integrale logaritmico da 2: con u = e^s diventa ∫ e^s/s ds, liscio, e Simpson e' esatto a 10⁻⁶ */
  function Li(x) { var a = Math.log(2), b = Math.log(x), n = 2000, h = (b - a) / n, s = 0; for (var i = 0; i <= n; i++) { var v = a + i * h; s += (i === 0 || i === n ? 1 : i % 2 ? 4 : 2) * Math.exp(v) / v; } return s * h / 3; }
  function primo(n) { if (n < 2) return false; for (var i = 2; i * i <= n; i++) if (n % i === 0) return false; return true; }
  F.calcolo.numeri = { crivello: crivello, euclide: euclide, esteso: esteso, inverso: inverso, potenzaMod: potenzaMod, rsa: rsa, cifra: cifra, decifra: decifra, pigreco: pigreco, Li: Li, primo: primo };

  /* ═══ 1. crivello ═══════════════════════════════════════════════════════ */
  function schedaCrivello(div) {
    var G = griglia(div), st = { N: 200 }, info = nota(G.pan), stato, p, m, cancellati;
    F.cursore(G.pan, ['fino a N', 'up to N'], 50, 600, 10, st.N, function (v) { st.N = v; azzera(); ctl.sveglia(); });
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.7);
    function azzera() { stato = new Uint8Array(st.N + 1); stato[0] = stato[1] = 2; p = 2; m = 4; cancellati = 0; }
    azzera();
    var ctl = F.anima(cv, function (dt) {
      var passi = Math.max(1, Math.round(dt * 60 * 3));
      for (var k = 0; k < passi; k++) { if (p * p > st.N) break; if (m <= st.N) { if (!stato[m]) cancellati++; stato[m] = stato[m] || 3 + (p % 8); m += p; } else { p++; while (p * p <= st.N && stato[p]) p++; m = p * p; } }
      var P = F.pennello(cv), q = P.q, W = P.W, H = P.H, col = Math.ceil(Math.sqrt(st.N * W / H)), cw = W / col, rh = Math.min(cw, H / Math.ceil(st.N / col));
      var COL = ['#5eead4', '#34465f', '#34465f', '#7c6fff', '#ff8a80', '#ffd24a', '#6bcfff', '#c49bff', '#a8e07a', '#ffb070', '#ff6b9d'];
      q.font = Math.max(8, Math.min(13, rh * 0.42)) + 'px system-ui'; q.textAlign = 'center';
      for (var n = 1; n <= st.N; n++) {
        var i = (n - 1) % col, j = Math.floor((n - 1) / col), x = i * cw, y = j * rh, s = stato[n], finito = p * p > st.N, primoN = !s && n > 1;
        q.fillStyle = primoN ? (finito ? 'rgba(94,234,212,.85)' : 'rgba(94,234,212,.25)') : s >= 3 ? 'rgba(52,70,95,.5)' : 'rgba(52,70,95,.25)';
        q.fillRect(x + 1, y + 1, cw - 2, rh - 2);
        q.fillStyle = primoN ? '#081522' : '#5b6b80'; q.fillText(String(n), x + cw / 2, y + rh / 2 + 4);
        if (n === p && !finito) { q.strokeStyle = '#ffd24a'; q.lineWidth = 2; q.strokeRect(x + 1, y + 1, cw - 2, rh - 2); q.lineWidth = 1; }
      }
      q.textAlign = 'left';
      cv.setAttribute('aria-label', t('crivello di Eratostene', 'sieve of Eratosthenes'));
      var pr = crivello(st.N);
      info.innerHTML = (p * p > st.N ? t('Finito: i numeri rimasti sono primi. ', 'Done: the remaining numbers are prime. ') + 'π(' + st.N + ') = <b>' + pr.length + '</b>' : t('Si cancellano i multipli di ', 'Crossing out multiples of ') + '<b>' + p + '</b>' + t(', partendo da ', ', starting from ') + p + '² = ' + p * p + t(' (i multipli più piccoli sono già cancellati)', ' (smaller multiples are already crossed out)')) + '<br>' + t('Basta arrivare a √N = ', 'It suffices to reach √N = ') + fmt(Math.sqrt(st.N)) + t(': un numero composto ha sempre un fattore ≤ della sua radice.', ': a composite number always has a factor ≤ its square root.');
      if (p * p > st.N) return false;
    }, { ricomincia: azzera });
  }

  /* ═══ 2. Euclide e Bézout ═══════════════════════════════════════════════ */
  function schedaEuclide(div) {
    var G = griglia(div), st = { a: 252, b: 198 }, info = nota(G.pan), tab = F.el('div', { style: 'overflow-x:auto' });
    campo(G.pan, ['a', 'a'], String(st.a), function (v) { st.a = Math.abs(parseInt(v, 10)) || 1; disegna(); });
    campo(G.pan, ['b', 'b'], String(st.b), function (v) { st.b = Math.abs(parseInt(v, 10)) || 1; disegna(); });
    G.pan.appendChild(info); G.dx.appendChild(tab);
    function disegna() {
      var E = euclide(st.a, st.b), X = esteso(st.a, st.b);
      tab.innerHTML = '<table class="bsiFX-tab"><tr><th>a</th><th>b</th><th>q = ⌊a/b⌋</th><th>r = a − qb</th></tr>' + E.passi.map(function (p) { return '<tr><td class="bsiFX-num">' + p[0] + '</td><td class="bsiFX-num">' + p[1] + '</td><td class="bsiFX-num">' + p[2] + '</td><td class="bsiFX-num">' + p[3] + '</td></tr>'; }).join('') + '</table>';
      var inv = inverso(st.a, st.b);
      info.innerHTML = 'MCD(' + st.a + ', ' + st.b + ') = <b class="bsiFX-num">' + E.mcd + '</b> · mcm = ' + (st.a / E.mcd * st.b) + '<br>' + t('Bézout: ', 'Bézout: ') + st.a + '·(' + X.x + ') + ' + st.b + '·(' + X.y + ') = <b>' + (st.a * X.x + st.b * X.y) + '</b><br>' + (inv !== null ? t('Inverso di ', 'Inverse of ') + st.a + ' mod ' + st.b + ' = <b>' + inv + '</b> (' + st.a + '·' + inv + ' ≡ 1 mod ' + st.b + ')' : st.a + t(' non è invertibile modulo ', ' is not invertible modulo ') + st.b + t(' (MCD ≠ 1)', ' (GCD ≠ 1)')) + '<br>' + t('L’algoritmo ha ', 'The algorithm took ') + E.passi.length + t(' passi: al più circa 5 volte le cifre del numero più piccolo (Lamé). L’inverso modulare è il cuore della chiave privata RSA.', ' steps: at most about 5 times the digits of the smaller number (Lamé). The modular inverse is the heart of the RSA private key.');
    }
    disegna();
  }

  /* ═══ 3. orologio modulare ══════════════════════════════════════════════ */
  function schedaOrologio(div) {
    var G = griglia(div), st = { n: 200, k: 2 }, info = nota(G.pan), mostrate = 0;
    F.cursore(G.pan, ['punti n', 'points n'], 10, 400, 1, st.n, function (v) { st.n = v; mostrate = 0; ctl.sveglia(); });
    F.cursore(G.pan, ['moltiplicatore k', 'multiplier k'], 2, 60, 0.01, st.k, function (v) { st.k = v; mostrate = 0; ctl.sveglia(); }, function (v) { return v.toFixed(2); });
    G.pan.appendChild(info);
    info.innerHTML = t('Si dispongono n punti su un cerchio e si congiunge ogni i con k·i mod n. Con k = 2 nasce una cardioide, con k = 3 una nefroide, con k = 4 una curva a tre lobi: l’aritmetica modulare disegna gli inviluppi di cerchi che rotolano. Muovi k lentamente fra due interi.', 'Place n points on a circle and join each i to k·i mod n. With k = 2 a cardioid appears, with k = 3 a nephroid, with k = 4 a three-lobed curve: modular arithmetic draws the envelopes of rolling circles. Move k slowly between two integers.');
    var cv = F.tela(G.dx, 0.85);
    var ctl = F.anima(cv, function (dt) {
      mostrate = Math.min(st.n, mostrate + dt * 120);
      var P = F.pennello(cv), q = P.q, W = P.W, H = P.H, cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2 - 12;
      q.strokeStyle = '#34465f'; q.beginPath(); q.arc(cx, cy, R, 0, Math.PI * 2); q.stroke();
      for (var i = 0; i < Math.floor(mostrate); i++) { var a = 2 * Math.PI * i / st.n - Math.PI, b = 2 * Math.PI * ((i * st.k) % st.n) / st.n - Math.PI, u = i / st.n; q.strokeStyle = 'hsla(' + Math.round(170 + 140 * u) + ',80%,65%,.55)'; q.beginPath(); q.moveTo(cx + R * Math.cos(a), cy + R * Math.sin(a)); q.lineTo(cx + R * Math.cos(b), cy + R * Math.sin(b)); q.stroke(); }
      cv.setAttribute('aria-label', t('tabellina modulare sul cerchio', 'modular times table on a circle'));
      if (mostrate >= st.n) return false;
    }, { ricomincia: function () { mostrate = 0; } });
  }

  /* ═══ 4. RSA ════════════════════════════════════════════════════════════ */
  function schedaRSA(div) {
    var G = griglia(div), st = { p: 61, q: 53, msg: 'Ciao, chimica!' }, info = nota(G.pan), out = F.el('div', { 'class': 'bsiFX-pannello', style: 'font-family:var(--font-mono,monospace);font-size:.82rem;overflow-wrap:anywhere' });
    campo(G.pan, ['primo p', 'prime p'], String(st.p), function (v) { st.p = parseInt(v, 10) || 2; calcola(); });
    campo(G.pan, ['primo q', 'prime q'], String(st.q), function (v) { st.q = parseInt(v, 10) || 3; calcola(); });
    campo(G.pan, ['messaggio', 'message'], st.msg, function (v) { st.msg = v; calcola(); });
    G.pan.appendChild(info); G.dx.appendChild(out);
    function calcola() {
      if (!primo(st.p) || !primo(st.q) || st.p === st.q) { info.innerHTML = '⚠ ' + t('servono due primi diversi', 'two different primes are needed'); out.textContent = ''; return; }
      var K = rsa(st.p, st.q), msg = st.msg.slice(0, 60);
      if (K.n <= 0x24F) { info.innerHTML = '⚠ ' + t('n = p·q deve superare il codice dei caratteri usati: scegli primi più grandi (es. 61 e 53)', 'n = p·q must exceed the character codes used: choose larger primes (e.g. 61 and 53)'); out.textContent = ''; return; }
      var C = cifra(msg, K), D = decifra(C, K);
      info.innerHTML = 'n = p·q = <b>' + K.n + '</b> · φ(n) = (p − 1)(q − 1) = ' + K.phi + '<br>' + t('chiave pubblica ', 'public key ') + '(e, n) = (<b>' + K.e + '</b>, ' + K.n + ') · ' + t('chiave privata ', 'private key ') + 'd = e⁻¹ mod φ = <b>' + K.d + '</b><br>' + t('Controllo: ', 'Check: ') + 'e·d mod φ = ' + (K.e * K.d % K.phi) + '<br>' + t('Cifrare: c = m^e mod n; decifrare: m = c^d mod n (piccolo teorema di Fermat-Eulero). Chi conosce solo (e, n) dovrebbe fattorizzare n per trovare φ e quindi d: con primi di 300 cifre nessun computer classico ci riesce. Qui i numeri sono piccoli: è un esempio didattico, non sicuro.', 'Encrypt: c = m^e mod n; decrypt: m = c^d mod n (Fermat-Euler). Someone knowing only (e, n) would have to factor n to find φ and hence d: with 300-digit primes no classical computer can. Here numbers are small: a teaching example, not secure.');
      out.innerHTML = '<b>' + t('Messaggio', 'Message') + '</b>: ' + msg.replace(/</g, '&lt;') + '<br><b>' + t('Codici', 'Codes') + '</b>: ' + Array.from(msg).map(function (c) { return c.codePointAt(0); }).join(' ') + '<br><b>' + t('Cifrato', 'Encrypted') + '</b>: ' + C.join(' ') + '<br><b>' + t('Decifrato', 'Decrypted') + '</b>: ' + D.replace(/</g, '&lt;') + (D === msg ? ' ✓' : ' ✗');
    }
    calcola();
  }

  /* ═══ 5. i primi ════════════════════════════════════════════════════════ */
  function schedaPrimi(div) {
    var G = griglia(div), info = nota(G.pan), cv;
    G.pan.appendChild(info);
    cv = F.tela(G.dx, 0.55);
    function disegna() {
      var N = 100000, pr = crivello(N), xs = [], pi = [], xl = [], li = [], k = 0;
      for (var x = 100; x <= N; x += 500) { while (k < pr.length && pr[k] <= x) k++; xs.push(x); pi.push(k); xl.push(x / Math.log(x)); li.push(Li(x)); }
      F.grafico(cv, { serie: [{ x: xs, y: pi, col: '#5eead4', larg: 2.5, etich: 'π(x)' }, { x: xs, y: xl, col: '#ff8a80', tratt: true, etich: 'x/ln x' }, { x: xs, y: li, col: '#ffd24a', tratt: true, etich: 'Li(x)' }], xl: ['x', 'x'], yl: ['numero di primi ≤ x', 'number of primes ≤ x'], legenda: [{ col: '#5eead4', etich: 'π(x)' }, { col: '#ff8a80', etich: 'x/ln x' }, { col: '#ffd24a', etich: 'Li(x)' }] });
      info.innerHTML = 'π(10⁵) = <b class="bsiFX-num">' + pr.length + '</b> · 10⁵/ln 10⁵ = ' + fmt(N / Math.log(N)) + ' · Li(10⁵) = ' + fmt(Li(N)) + '<br>' + t('Teorema dei numeri primi: π(x) ~ x/ln x. Li(x) è molto più preciso: qui sbaglia di ', 'Prime number theorem: π(x) ~ x/ln x. Li(x) is far more accurate: here it is off by ') + fmt(Li(N) - pr.length) + t(' contro ', ' against ') + fmt(pr.length - N / Math.log(N)) + '. ' + t('Vicino a x, circa un numero ogni ln x è primo.', 'Near x, about one number in ln x is prime.');
    }
    disegna(); F.alRidimensiona(disegna);
  }

  F.sezione('smatnumeri', {
    titolo: ['🔐 Numeri e crittografia', '🔐 Numbers and cryptography'],
    sotto: ['Il crivello di Eratostene, Euclide e Bézout con l’inverso modulare, l’aritmetica modulare disegnata sull’orologio, RSA che cifra e decifra davvero, la distribuzione dei numeri primi.', 'The sieve of Eratosthenes, Euclid and Bézout with the modular inverse, modular arithmetic drawn on a clock, RSA really encrypting and decrypting, the distribution of primes.'],
    schede: [
      { nome: ['🧮 Crivello', '🧮 Sieve'], costruisci: schedaCrivello },
      { nome: ['➗ Euclide', '➗ Euclid'], costruisci: schedaEuclide },
      { nome: ['🕐 Orologio modulare', '🕐 Modular clock'], costruisci: schedaOrologio },
      { nome: ['🔐 RSA', '🔐 RSA'], costruisci: schedaRSA },
      { nome: ['📈 Primi', '📈 Primes'], costruisci: schedaPrimi }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
