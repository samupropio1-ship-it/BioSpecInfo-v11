/* ═══════════════════════════════════════════════════════════════════════════
   bsi-chi-fasi.js — 🧊 diagrammi di fase
   BioSpecInfo · © Samuele Pio Provenzano

   · SOSTANZA PURA: il diagramma P–T di acqua e CO₂ con le curve di
     riferimento (IAPWS per l'acqua: Wagner–Pruss per la tensione di vapore,
     sublimazione e fusione del ghiaccio Ih; Span–Wagner per la CO₂), punto
     triplo e punto critico; un punto (T, P) mobile dice in che fase si trova;
     ΔH di vaporizzazione dalla pendenza (Clausius–Clapeyron);
   · EUTETTICO: due componenti miscibili da liquidi e immiscibili da solidi;
     le curve del liquidus dall'equazione di Schröder–van Laar
     ln x = −ΔH_fus/R (1/T − 1/T_fus); il punto eutettico; la regola della
     leva; la curva di raffreddamento con la sosta all'eutettico;
   · CLAPEYRON E REGOLA DELLE FASI: dP/dT = ΔH/(TΔV) per la fusione del
     ghiaccio (pendenza negativa), varianza F = C − P + 2;
   · SUPERFICIE P–V–T (v238): l'equazione di Peng–Robinson con Tc, Pc e il
     fattore acentrico ricavati dalle curve qui sopra, la cupola liquido–
     vapore dalla costruzione di Maxwell (fugacita' uguali), il punto critico
     e la linea tripla; un'isoterma percorsa da un punto che condensa.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, fmt = F.fmt, R = 8.314462618;
  function griglia(div) { var G = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), dx = F.el('div'); G.appendChild(pan); G.appendChild(dx); div.appendChild(G); return { pan: pan, dx: dx }; }
  function nota(pan) { var n = F.el('div', { 'class': 'bsiFX-nota' }); pan.appendChild(n); return n; }

  /* ═══ calcoli: sostanze pure ════════════════════════════════════════════ */
  var SOST = {
    acqua: {
      nome: ['acqua', 'water'], Tt: 273.16, Pt: 611.657, Tc: 647.096, Pc: 22.064e6,
      vap: function (T) { var c = 1 - T / 647.096; return 22.064e6 * Math.exp(647.096 / T * (-7.85951783 * c + 1.84408259 * Math.pow(c, 1.5) - 11.7866497 * Math.pow(c, 3) + 22.6807411 * Math.pow(c, 3.5) - 15.9618719 * Math.pow(c, 4) + 1.80122502 * Math.pow(c, 7.5))); },
      sub: function (T) { var th = T / 273.16; return 611.657 * Math.exp((-21.2144006 * (1 - Math.pow(th, -1.5)) + 27.3203819 * (1 - Math.pow(th, -1.25))) / th); },
      fus: function (T) { var th = T / 273.16; return 611.657 * (1 - 0.626000e6 * (1 - Math.pow(th, -3)) + 0.197135e6 * (1 - Math.pow(th, 21.2))); },
      fusMin: 251.165, Tmin: 190, Tmax: 700
    },
    co2: {
      nome: ['anidride carbonica', 'carbon dioxide'], Tt: 216.592, Pt: 0.51795e6, Tc: 304.1282, Pc: 7.3773e6,
      vap: function (T) { var c = 1 - T / 304.1282; return 7.3773e6 * Math.exp(304.1282 / T * (-7.0602087 * c + 1.9391218 * Math.pow(c, 1.5) - 1.6463597 * Math.pow(c, 2) - 3.2995634 * Math.pow(c, 4))); },
      sub: function (T) { var c = 1 - T / 216.592; return 0.51795e6 * Math.exp(216.592 / T * (-14.740846 * c + 2.4327015 * Math.pow(c, 1.9) - 5.3061778 * Math.pow(c, 2.9))); },
      fus: function (T) { var d = T / 216.592 - 1; return 0.51795e6 * (1 + 1955.539 * d + 2055.4593 * d * d); },
      Tmin: 150, Tmax: 360
    }
  };
  /* la fase di un punto (T in K, P in Pa) */
  function fase(s, T, P) {
    var S = SOST[s];
    if (T >= S.Tc && P >= S.Pc) return 'supercritico';
    if (T < S.Tt) {
      if (s === 'acqua' && T >= S.fusMin && P > S.fus(T)) return 'liquido';
      return P > S.sub(T) ? 'solido' : 'gas';
    }
    if (s === 'co2' && P > S.fus(T)) return 'solido';
    if (T >= S.Tc) return 'gas';
    return P > S.vap(T) ? 'liquido' : 'gas';
  }
  /* ΔH di vaporizzazione apparente dalla pendenza di ln P contro 1/T */
  function dHvap(s, T) { var S = SOST[s], h = 0.01; return -R * (Math.log(S.vap(T + h)) - Math.log(S.vap(T - h))) / (1 / (T + h) - 1 / (T - h)); }

  /* ═══ calcoli: eutettico ideale ═════════════════════════════════════════ */
  var COPPIE = {
    bicd: { nome: ['bismuto – cadmio', 'bismuth – cadmium'], A: ['Bi', 544.55, 11.3e3], B: ['Cd', 594.22, 6.19e3], sper: [0.55, 419] },
    benzna: { nome: ['benzene – naftalene', 'benzene – naphthalene'], A: ['C₆H₆', 278.68, 9.87e3], B: ['C₁₀H₈', 353.4, 19.0e3], sper: [0.13, 269.6] },
    salghi: { nome: ['ghiaccio – urea', 'ice – urea'], A: ['H₂O', 273.15, 6.01e3], B: ['urea', 405.8, 14.6e3], sper: [0.126, 261.6] }
  };
  /* liquidus: la frazione del componente che cristallizza, in equilibrio con il suo solido puro */
  function xLiq(comp, T) { return Math.exp(-comp[2] / R * (1 / T - 1 / comp[1])); }
  function liquidus(c, xB) { /* la temperatura del liquidus alla composizione xB */
    var A = c.A, B = c.B, TA = 1 / (1 / A[1] - R * Math.log(1 - xB) / A[2]), TB = 1 / (1 / B[1] - R * Math.log(xB) / B[2]);
    return { T: Math.max(TA, TB), lato: TA > TB ? 'A' : 'B' };
  }
  function eutettico(c) { /* bisezione su xB dove i due rami si incontrano */
    var a = 1e-6, b = 1 - 1e-6;
    for (var k = 0; k < 100; k++) { var m = (a + b) / 2, TA = 1 / (1 / c.A[1] - R * Math.log(1 - m) / c.A[2]), TB = 1 / (1 / c.B[1] - R * Math.log(m) / c.B[2]); if (TA > TB) a = m; else b = m; }
    var x = (a + b) / 2; return { x: x, T: 1 / (1 / c.A[1] - R * Math.log(1 - x) / c.A[2]) };
  }
  /* regola della leva: a (xB, T) fra liquidus ed eutettico, le frazioni di solido puro e di liquido */
  function leva(c, xB, T) {
    var E = eutettico(c), L = liquidus(c, xB);
    if (T >= L.T) return { stato: 'liquido', fl: 1, fs: 0 };
    if (T < E.T) return { stato: 'solido', fl: 0, fs: 1 };
    var xl = L.lato === 'A' ? 1 - xLiq(c.A, T) : xLiq(c.B, T); /* composizione del liquido sul ramo giusto */
    var fl = L.lato === 'A' ? xB / xl : (1 - xB) / (1 - xl);
    return { stato: 'misto', lato: L.lato, xl: xl, fl: fl, fs: 1 - fl };
  }
  /* curva di raffreddamento: entalpia H = Cp T − (solidificato)·ΔH, Newton verso T_amb, T ricavata da H per bisezione */
  function raffreddamento(c, xB, T0, Tamb, durata, n) {
    var E = eutettico(c), Cp = 30, k = 0.02, dt = durata / n, out = [];
    function Hdi(T) {
      if (T < E.T) return Cp * T - ((1 - xB) * c.A[2] + xB * c.B[2]);
      var lv = leva(c, xB, T), dH = lv.lato === 'A' ? c.A[2] : c.B[2];
      return Cp * T - lv.fs * dH;
    }
    var Hsotto = Cp * E.T - ((1 - xB) * c.A[2] + xB * c.B[2]), Hsopra = Hdi(E.T + 1e-9);
    function Tdi(H) {
      if (H <= Hsotto) return H / Cp + ((1 - xB) * c.A[2] + xB * c.B[2]) / Cp;
      if (H <= Hsopra) return E.T;
      var a = E.T, b = T0 + 50; for (var j = 0; j < 60; j++) { var m = (a + b) / 2; if (Hdi(m) > H) b = m; else a = m; } return (a + b) / 2;
    }
    var H = Hdi(T0), T = T0;
    for (var i = 0; i <= n; i++) { out.push([i * dt, T]); H -= k * Cp * (T - Tamb) * dt; T = Tdi(H); }
    return out;
  }
  function varianza(C, P) { return C - P + 2; }

  /* ═══ calcoli: la superficie P–V–T (v238) ══════════════════════════════
     Peng–Robinson: P = RT/(V − b) − aα(T)/(V² + 2bV − b²), con
     a = 0,45724 R²Tc²/Pc, b = 0,07780 RTc/Pc, α = [1 + κ(1 − √(T/Tc))]²,
     κ = 0,37464 + 1,54226ω − 0,26992ω². Il fattore acentrico ω viene dalla
     curva di vapore della sezione: ω = −log₁₀(P_vap(0,7 Tc)/Pc) − 1.
     Sotto Tc l'isoterma di PR ha il ciclo di van der Waals: la pressione
     di saturazione e' quella in cui liquido e vapore hanno la stessa
     fugacita' (equivalente alle aree uguali di Maxwell). */
  function omega(s) { var S = SOST[s]; return -Math.log10(S.vap(0.7 * S.Tc) / S.Pc) - 1; }
  function parametriPR(s) {
    var S = SOST[s], w = omega(s);
    return { a: 0.45724 * R * R * S.Tc * S.Tc / S.Pc, b: 0.07780 * R * S.Tc / S.Pc, k: 0.37464 + 1.54226 * w - 0.26992 * w * w, Tc: S.Tc, Pc: S.Pc, w: w };
  }
  function alfaPR(p, T) { var q = 1 + p.k * (1 - Math.sqrt(T / p.Tc)); return q * q; }
  function pressionePR(p, T, V) { return R * T / (V - p.b) - p.a * alfaPR(p, T) / (V * V + 2 * p.b * V - p.b * p.b); }
  /* radici reali del cubico in Z, ordinate */
  function radiciZ(A, B) {
    var c2 = -(1 - B), c1 = A - 3 * B * B - 2 * B, c0 = -(A * B - B * B - B * B * B);
    var q = (3 * c1 - c2 * c2) / 9, r = (9 * c2 * c1 - 27 * c0 - 2 * c2 * c2 * c2) / 54, D = q * q * q + r * r, out = [];
    if (D > 0) { var sq = Math.sqrt(D); out.push(Math.cbrt(r + sq) + Math.cbrt(r - sq) - c2 / 3); }
    else { var th = Math.acos(r / Math.sqrt(-q * q * q)), m = 2 * Math.sqrt(-q); for (var k = 0; k < 3; k++) out.push(m * Math.cos((th + 2 * Math.PI * k) / 3) - c2 / 3); }
    return out.filter(function (z) { return z > B; }).sort(function (x, y) { return x - y; });
  }
  function lnPhi(Z, A, B) { var s2 = Math.SQRT2; return Z - 1 - Math.log(Z - B) - A / (2 * s2 * B) * Math.log((Z + (1 + s2) * B) / (Z + (1 - s2) * B)); }
  /* saturazione a T < Tc: P con fugacita' uguali, e i volumi molari delle due fasi */
  function saturazione(s, T) {
    var p = parametriPR(s), S = SOST[s]; if (T >= p.Tc) return null;
    var P = S.vap(T), aa = p.a * alfaPR(p, T);
    for (var it = 0; it < 200; it++) {
      var A = aa * P / (R * R * T * T), B = p.b * P / (R * T), z = radiciZ(A, B);
      if (z.length < 2) {
        /* fuori dal ciclo: si sposta P verso l'interno, dove le radici sono tre */
        var zz = z[0]; if (zz * R * T / P < 3 * p.b) P *= 0.97; else P *= 1.03; continue;
      }
      var fl = lnPhi(z[0], A, B), fv = lnPhi(z[z.length - 1], A, B), Pn = P * Math.exp(fl - fv);
      if (Math.abs(Pn / P - 1) < 1e-12) { P = Pn; break; }
      P = Pn;
    }
    A = aa * P / (R * R * T * T); B = p.b * P / (R * T); z = radiciZ(A, B);
    if (z.length < 2) return null;
    return { P: P, Vl: z[0] * R * T / P, Vv: z[z.length - 1] * R * T / P, rif: S.vap(T) };
  }
  /* ∫ P dV lungo l'isoterma di PR fra V1 e V2 (per controllare le aree uguali) */
  function lavoroPR(p, T, V1, V2) {
    var aa = p.a * alfaPR(p, T), s2 = Math.SQRT2, F2 = function (V) { return R * T * Math.log(V - p.b) - aa / (2 * s2 * p.b) * Math.log((V + p.b - s2 * p.b) / (V + p.b + s2 * p.b)); };
    return F2(V2) - F2(V1);
  }
  /* la pressione della superficie: PR fuori dalla cupola, la pressione di saturazione dentro */
  function superficiePVT(s, T, V, sat) {
    var p = parametriPR(s); sat = sat === undefined ? saturazione(s, T) : sat;
    if (sat && V > sat.Vl && V < sat.Vv) return { P: sat.P, regione: 'coesistenza', xl: (sat.Vv - V) / (sat.Vv - sat.Vl) };
    var Pv = pressionePR(p, T, V);
    return { P: Pv, regione: T >= p.Tc ? (Pv >= p.Pc ? 'supercritico' : 'gas') : sat && V <= sat.Vl ? 'liquido' : 'gas', xl: sat && V <= sat.Vl ? 1 : 0 };
  }
  F.calcolo.fasi = { SOST: SOST, fase: fase, dHvap: dHvap, COPPIE: COPPIE, liquidus: liquidus, eutettico: eutettico, leva: leva, raffreddamento: raffreddamento, varianza: varianza,
    omega: omega, parametriPR: parametriPR, pressionePR: pressionePR, radiciZ: radiciZ, saturazione: saturazione, lavoroPR: lavoroPR, superficiePVT: superficiePVT };

  var NOMEFASE = { solido: ['solido', 'solid'], liquido: ['liquido', 'liquid'], gas: ['gas', 'gas'], supercritico: ['fluido supercritico', 'supercritical fluid'] };
  function fmtP(P) { return P >= 1e6 ? fmt(P / 1e6) + ' MPa' : P >= 1e3 ? fmt(P / 1e3) + ' kPa' : fmt(P) + ' Pa'; }

  /* ═══ 1. sostanza pura ══════════════════════════════════════════════════ */
  function schedaPura(div) {
    var G = griglia(div), st = { s: 'acqua', T: 300, lp: 5 }, info = nota(G.pan), cT, cP;
    F.scelta(G.pan, ['Sostanza', 'Substance'], [['acqua', t('acqua', 'water')], ['co2', 'CO₂']], st.s, function (v) { st.s = v; var S = SOST[v]; st.T = v === 'acqua' ? 300 : 250; st.lp = v === 'acqua' ? 5 : 6; cT.min = S.Tmin; cT.max = S.Tmax; cT.value = st.T; cP.value = st.lp; cT.dispatchEvent(new Event('input')); cP.dispatchEvent(new Event('input')); disegna(); });
    cT = F.cursore(G.pan, ['temperatura (K)', 'temperature (K)'], 190, 700, 0.5, st.T, function (v) { st.T = v; disegna(); }, function (v) { return v.toFixed(1) + ' K = ' + (v - 273.15).toFixed(1) + ' °C'; });
    cP = F.cursore(G.pan, ['pressione (log₁₀ Pa)', 'pressure (log₁₀ Pa)'], 1, 9, 0.01, st.lp, function (v) { st.lp = v; disegna(); }, function (v) { return fmtP(Math.pow(10, v)); });
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.7);
    function disegna() {
      var S = SOST[st.s], serie = [], xs, ys, T;
      xs = []; ys = []; for (T = S.Tt; T <= S.Tc; T += (S.Tc - S.Tt) / 300) { xs.push(T); ys.push(Math.log10(S.vap(T))); } serie.push({ x: xs, y: ys, col: '#6bcfff', larg: 2.5, etich: t('vaporizzazione', 'vaporisation') });
      xs = []; ys = []; for (T = S.Tmin; T <= S.Tt; T += (S.Tt - S.Tmin) / 200) { var ps = S.sub(T); if (ps > 10) { xs.push(T); ys.push(Math.log10(ps)); } } serie.push({ x: xs, y: ys, col: '#c9b9ff', larg: 2.5, etich: t('sublimazione', 'sublimation') });
      xs = []; ys = [];
      if (st.s === 'acqua') { for (T = S.Tt; T >= S.fusMin; T -= 0.05) { xs.push(T); ys.push(Math.log10(S.fus(T))); } }
      else { for (T = S.Tt; T <= S.Tmax; T += 0.5) { var pf = S.fus(T); if (pf > 1e9) break; xs.push(T); ys.push(Math.log10(pf)); } }
      serie.push({ x: xs, y: ys, col: '#ffd24a', larg: 2.5, etich: t('fusione', 'melting') });
      var P = Math.pow(10, st.lp), fa = fase(st.s, st.T, P);
      F.grafico(cv, { serie: serie, punti: [{ x: S.Tt, y: Math.log10(S.Pt), col: '#5eead4', r: 5 }, { x: S.Tc, y: Math.log10(S.Pc), col: '#ff8a80', r: 5 }, { x: st.T, y: st.lp, col: '#ffffff', r: 6 }], linee: [{ y: 5.0057, col: '#46607a', etich: '1 atm' }], xmin: S.Tmin, xmax: S.Tmax, ymin: 1, ymax: 9, xl: ['T (K)', 'T (K)'], yl: ['log₁₀ P (Pa)', 'log₁₀ P (Pa)'], legenda: [{ col: '#6bcfff', etich: ['liquido ⇄ gas', 'liquid ⇄ gas'] }, { col: '#c9b9ff', etich: ['solido ⇄ gas', 'solid ⇄ gas'] }, { col: '#ffd24a', etich: ['solido ⇄ liquido', 'solid ⇄ liquid'] }, { col: '#5eead4', etich: ['punto triplo', 'triple point'] }, { col: '#ff8a80', etich: ['punto critico', 'critical point'] }] });
      var dh = st.T > S.Tt && st.T < S.Tc - 5 ? dHvap(st.s, st.T) : null;
      info.innerHTML = t('Al punto scelto: ', 'At the chosen point: ') + '<b class="bsiFX-num">' + F.tt(NOMEFASE[fa]) + '</b><br>' + t('Punto triplo ', 'Triple point ') + S.Tt + ' K, ' + fmtP(S.Pt) + ' · ' + t('punto critico ', 'critical point ') + S.Tc + ' K, ' + fmtP(S.Pc) +
        (dh ? '<br>' + t('Pendenza della curva di vapore (Clausius–Clapeyron): ', 'Slope of the vapour curve (Clausius–Clapeyron): ') + 'ΔH_vap ≈ ' + fmt(dh / 1000) + ' kJ/mol' : '') + '<br>' +
        (st.s === 'acqua' ? t('La curva di fusione dell’acqua pende all’indietro: il ghiaccio è meno denso del liquido, quindi la pressione lo fa fondere. A 1 atm il ghiaccio fonde a 0 °C e l’acqua bolle a 100 °C.', 'Water’s melting curve leans backwards: ice is less dense than the liquid, so pressure melts it. At 1 atm ice melts at 0 °C and water boils at 100 °C.') : t('Il punto triplo della CO₂ è sopra 1 atm: a pressione ambiente il ghiaccio secco sublima a −78,5 °C senza mai diventare liquido. Sopra 31 °C e 74 bar è un fluido supercritico, usato per decaffeinare il caffè.', 'The CO₂ triple point is above 1 atm: at ambient pressure dry ice sublimes at −78.5 °C without ever becoming liquid. Above 31 °C and 74 bar it is a supercritical fluid, used to decaffeinate coffee.'));
    }
    disegna(); F.alRidimensiona(disegna);
  }

  /* ═══ 2. eutettico ══════════════════════════════════════════════════════ */
  function schedaEutettico(div) {
    var G = griglia(div), st = { c: 'bicd', x: 0.3, T: 480 }, info = nota(G.pan), cT;
    F.scelta(G.pan, ['Sistema', 'System'], Object.keys(COPPIE).map(function (k) { return [k, F.tt(COPPIE[k].nome)]; }), st.c, function (v) { st.c = v; var c = COPPIE[v], E = eutettico(c); cT.min = Math.floor(E.T - 40); cT.max = Math.ceil(Math.max(c.A[1], c.B[1]) + 20); st.T = Math.round((E.T + Math.max(c.A[1], c.B[1])) / 2); cT.value = st.T; cT.dispatchEvent(new Event('input')); disegna(); });
    F.cursore(G.pan, ['composizione x_B', 'composition x_B'], 0, 1, 0.005, st.x, function (v) { st.x = v; disegna(); }, function (v) { return v.toFixed(3); });
    cT = F.cursore(G.pan, ['temperatura (K)', 'temperature (K)'], 380, 615, 0.5, st.T, function (v) { st.T = v; disegna(); }, function (v) { return v.toFixed(1) + ' K'; });
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.6), cr = F.tela(G.dx, 0.4);
    function disegna() {
      var c = COPPIE[st.c], E = eutettico(c), xa = [], ya = [], xb = [], yb = [], x;
      for (x = 0; x <= E.x; x += E.x / 150) { xa.push(x); ya.push(1 / (1 / c.A[1] - R * Math.log(1 - x) / c.A[2])); }
      for (x = E.x; x <= 1; x += (1 - E.x) / 150) { xb.push(x); yb.push(1 / (1 / c.B[1] - R * Math.log(Math.max(x, 1e-9)) / c.B[2])); }
      var lv = leva(c, st.x, st.T), ymin = E.T - 40, ymax = Math.max(c.A[1], c.B[1]) + 20, serie = [{ x: xa, y: ya, col: '#6bcfff', larg: 2.5, etich: 'liquidus A' }, { x: xb, y: yb, col: '#ffc45a', larg: 2.5, etich: 'liquidus B' }, { x: [0, 1], y: [E.T, E.T], col: '#ff8a80', larg: 1.5, etich: t('eutettico', 'eutectic') }];
      if (lv.stato === 'misto') serie.push({ x: [lv.lato === 'A' ? 0 : 1, lv.xl], y: [st.T, st.T], col: '#e6fffb', tratt: true, larg: 1.5, etich: t('leva', 'lever') });
      F.grafico(cv, { serie: serie, punti: [{ x: st.x, y: st.T, col: '#ffffff', r: 6 }, { x: E.x, y: E.T, col: '#ff8a80', r: 5 }, { x: c.sper[0], y: c.sper[1], col: '#5eead4', r: 4 }], xmin: 0, xmax: 1, ymin: ymin, ymax: ymax, xl: ['x_B (' + F.tt(c.B[0]) + ')', 'x_B'], yl: ['T (K)', 'T (K)'], legenda: [{ col: '#ff8a80', etich: ['eutettico ideale', 'ideal eutectic'] }, { col: '#5eead4', etich: ['eutettico misurato', 'measured eutectic'] }] });
      var curva = raffreddamento(c, st.x, ymax, ymin - 40, 400, 800);
      F.grafico(cr, { serie: [{ x: curva.map(function (p) { return p[0]; }), y: curva.map(function (p) { return p[1]; }), col: '#ff8a80', larg: 2.5, etich: 'T(t)' }], linee: [{ y: E.T, col: '#46607a', etich: 'T_e' }], xl: [t('tempo (u.a.)', 'time (a.u.)'), 'time (a.u.)'], yl: ['T (K)', 'T (K)'], descr: ['curva di raffreddamento', 'cooling curve'] });
      var s = lv.stato === 'liquido' ? t('tutto liquido', 'all liquid') : lv.stato === 'solido' ? t('tutto solido (cristalli di A e B mescolati)', 'all solid (mixed crystals of A and B)') : t('liquido ', 'liquid ') + '<b class="bsiFX-num">' + (100 * lv.fl).toFixed(1) + ' %</b> (x_B = ' + lv.xl.toFixed(3) + ') + ' + t('solido ', 'solid ') + F.tt(lv.lato === 'A' ? c.A[0] : c.B[0]) + ' ' + (100 * lv.fs).toFixed(1) + ' %';
      info.innerHTML = s + '<br>' + t('Eutettico ideale: ', 'Ideal eutectic: ') + 'x_B = ' + E.x.toFixed(3) + ', T = ' + E.T.toFixed(1) + ' K · ' + t('misurato: ', 'measured: ') + c.sper[0] + ', ' + c.sper[1] + ' K<br>' + t('Il liquidus viene da Schröder–van Laar, ln x = −ΔH_fus/R (1/T − 1/T_fus): è l’abbassamento crioscopico portato fino in fondo. Nella curva di raffreddamento il liquidus è un ginocchio, l’eutettico una sosta orizzontale: così si costruiscono i diagrammi in laboratorio. Le leghe per saldature e il sale sulle strade sfruttano lo stesso fenomeno.', 'The liquidus comes from Schröder–van Laar, ln x = −ΔH_fus/R (1/T − 1/T_fus): it is freezing-point depression carried all the way. In the cooling curve the liquidus is a knee and the eutectic a horizontal arrest: that is how the diagrams are built in the lab. Solder alloys and road salt use the same phenomenon.');
    }
    disegna(); F.alRidimensiona(disegna);
  }

  /* ═══ 3. Clapeyron e regola delle fasi ══════════════════════════════════ */
  function schedaRegola(div) {
    var G = griglia(div), st = { C: 1, P: 1, dT: 5 }, info = nota(G.pan);
    F.cursore(G.pan, ['componenti C', 'components C'], 1, 3, 1, st.C, function (v) { st.C = v; disegna(); });
    F.cursore(G.pan, ['fasi P', 'phases P'], 1, 5, 1, st.P, function (v) { st.P = v; disegna(); });
    F.cursore(G.pan, ['ghiaccio: gradi sotto zero', 'ice: degrees below zero'], 0.5, 20, 0.5, st.dT, function (v) { st.dT = v; disegna(); }, function (v) { return '−' + v.toFixed(1) + ' °C'; });
    G.pan.appendChild(info);
    var cv = F.tela(G.dx, 0.45);
    var ESEMPI = { '1,1': ['acqua liquida in un recipiente: puoi scegliere T e P', 'liquid water in a vessel: you can choose T and P'], '1,2': ['acqua che bolle: scelta T, la pressione è fissata (curva)', 'boiling water: once T is chosen the pressure is fixed (curve)'], '1,3': ['il punto triplo: nessuna libertà, è un punto', 'the triple point: no freedom, it is a point'], '2,1': ['una soluzione di sale: T, P e concentrazione', 'a salt solution: T, P and concentration'], '2,2': ['acqua salata che bolle: T e P fissano la composizione del vapore', 'boiling salt water: T and P fix the vapour composition'], '2,3': ['la soluzione satura che bolle, con il sale sul fondo', 'the saturated solution boiling, with salt on the bottom'], '2,4': ['il punto eutettico quadruplo: ghiaccio, sale, soluzione e vapore', 'the quadruple eutectic point: ice, salt, solution and vapour'], '3,2': ['un sistema acqua–alcol–sale con due liquidi', 'a water–alcohol–salt system with two liquids'] };
    function disegna() {
      var V = varianza(st.C, st.P), dHf = 6010, Vl = 18.015 / 0.99984, Vs = 18.015 / 0.9167, dV = (Vl - Vs) * 1e-6, dPdT = dHf / (273.15 * dV), Pserve = -dPdT * st.dT, Pfus = SOST.acqua.fus(273.16 - st.dT);
      var xs = [], ys = []; for (var d = 0; d <= 20; d += 0.25) { xs.push(-d); ys.push((SOST.acqua.fus(273.16 - d) - 611.657) / 1e6); }
      F.grafico(cv, { serie: [{ x: xs, y: ys, col: '#ffd24a', larg: 2.5, etich: t('fusione del ghiaccio', 'ice melting') }, { x: xs, y: xs.map(function (x) { return -dPdT * -x / 1e6; }), col: '#6bcfff', tratt: true, etich: 'Clapeyron' }], punti: [{ x: -st.dT, y: (Pfus - 611.657) / 1e6, col: '#ffffff', r: 5 }], xmin: -20, xmax: 0, ymin: 0, ymax: 220, xl: ['T (°C)', 'T (°C)'], yl: ['P (MPa)', 'P (MPa)'], legenda: [{ col: '#ffd24a', etich: ['IAPWS (misura)', 'IAPWS (measured)'] }, { col: '#6bcfff', etich: ['retta di Clapeyron', 'Clapeyron line'] }] });
      var es = ESEMPI[st.C + ',' + st.P];
      info.innerHTML = t('Regola delle fasi di Gibbs: ', 'Gibbs phase rule: ') + 'F = C − P + 2 = <b class="bsiFX-num">' + V + '</b>' + (V < 0 ? ' — ' + t('impossibile: troppe fasi in equilibrio', 'impossible: too many phases in equilibrium') : ' ' + t('variabili libere', 'free variables')) + (es ? '<br>' + F.tt(es) : '') + '<br><br>' +
        'Clapeyron: dP/dT = ΔH/(T ΔV) = 6,01 kJ/mol / (273 K × ' + fmt(dV * 1e6) + ' cm³/mol) = <b>' + fmt(dPdT / 1e6) + ' MPa/K</b><br>' + t('Per fondere il ghiaccio a ', 'To melt ice at ') + '−' + st.dT.toFixed(1) + ' °C ' + t('servono', 'you need') + ' ≈ ' + fmt(Pfus / 1e6) + ' MPa (' + t('Clapeyron lineare', 'linear Clapeyron') + ' ' + fmt(Pserve / 1e6) + ' MPa). ' + t('Un pattinatore di 70 kg su una lama di 2 cm² preme circa 3,4 MPa: basta per −0,25 °C. Il ghiaccio è scivoloso per lo strato liquido superficiale e l’attrito, non per la pressione.', 'A 70 kg skater on a 2 cm² blade presses about 3.4 MPa: enough for −0.25 °C. Ice is slippery because of the surface liquid layer and friction, not pressure.');
    }
    disegna(); F.alRidimensiona(disegna);
  }

  /* ═══ 4. la superficie P–V–T in 3D (v238) ═══════════════════════════════ */
  var MENO_MOTO = false; try { MENO_MOTO = !!(globale.matchMedia && globale.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { }
  /* il pannello subito, la scena dopo (three.js al primo uso, il contesto WebGL e il contenuto in compiti separati) */
  function scheda3D(costruisci) {
    return function (div) {
      var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), destra = F.el('div', { style: 'min-width:0' });
      g.appendChild(pan); g.appendChild(destra); div.appendChild(g);
      var L3 = globale.BSILab3D, attesa = F.el('div', { 'class': 'bsiFX-nota', testo: t('Caricamento del motore 3D…', 'Loading the 3D engine…') });
      destra.appendChild(attesa);
      var ctx = costruisci(pan, destra);
      if (!L3) { attesa.textContent = t('Il motore 3D non è disponibile in questa pagina.', 'The 3D engine is not available on this page.'); return; }
      L3.stile();
      L3.caricaThree().then(function () {
        setTimeout(function () {
          attesa.remove();
          var S = new L3.Scena(destra, 0.75);
          var adatta = S.adatta; S.adatta = function () { if (this.box.offsetParent === null) return; adatta.call(this); };
          destra.insertBefore(S.box, destra.firstChild);
          S.box.setAttribute('role', 'group'); S.box.setAttribute('aria-label', F.tt(ctx.nome));
          div._scena = S;
          setTimeout(function () { ctx.tre(S, globale.THREE, L3); }, 0);
        }, 0);
      }).catch(function (e) { attesa.textContent = t('Motore 3D non disponibile: ', '3D engine unavailable: ') + e.message; });
    };
  }
  var COL_REG = { liquido: [0.25, 0.55, 1.0], gas: [0.36, 0.9, 0.78], coesistenza: [0.72, 0.55, 1.0], supercritico: [1.0, 0.68, 0.42] };
  var NOME_REG = { liquido: ['liquido', 'liquid'], gas: ['vapore', 'vapour'], coesistenza: ['liquido + vapore', 'liquid + vapour'], supercritico: ['fluido supercritico', 'supercritical fluid'] };
  function schedaPVT3D(pan) {
    var st = { s: 'co2', fT: 0.85, pausa: MENO_MOTO }, cb = {}, mod = null, cT = null;
    F.scelta(pan, ['Sostanza', 'Substance'], [['co2', 'CO₂'], ['acqua', t('acqua', 'water')]], st.s, function (v) { st.s = v; modello(); if (cb.nuova) cb.nuova(); });
    cT = F.cursore(pan, ['isoterma percorsa (T / Tc)', 'isotherm traced (T / Tc)'], 0.45, 1.25, 0.01, st.fT, function (v) { st.fT = v; isoterma(); if (cb.isoterma) cb.isoterma(); }, function (v) { return v.toFixed(2) + ' · ' + (mod ? (v * mod.p.Tc).toFixed(1) + ' K' : ''); });
    var bp = F.bottone(pan, st.pausa ? ['▶ Comprimi', '▶ Compress'] : ['⏸ Pausa', '⏸ Pause'], function () { st.pausa = !st.pausa; bp.textContent = F.tt(st.pausa ? ['▶ Comprimi', '▶ Compress'] : ['⏸ Pausa', '⏸ Pause']); if (cb.sveglia) cb.sveglia(); });
    var info = nota(pan), vivo = nota(pan), spiega = nota(pan);
    spiega.innerHTML = t('Sull’asse orizzontale il volume molare (scala logaritmica), in profondità la temperatura, in alto la pressione (logaritmica). La superficie viene dall’equazione di stato di Peng–Robinson con Tc, Pc e il fattore acentrico presi dalle curve della prima scheda; dove l’isoterma di PR ondeggia (il ciclo di van der Waals) la sostituisce il piano orizzontale della coesistenza, alla pressione in cui liquido e vapore hanno la stessa fugacità (le aree di Maxwell sono uguali). La cupola viola si chiude nel punto critico rosso; la linea gialla è la linea tripla, sotto la quale c’è il solido (non modellato da PR). Il punto bianco percorre un’isoterma comprimendo il vapore: sotto Tc a un certo volume compaiono le prime gocce, la pressione resta ferma mentre il vapore condensa, poi il liquido quasi incomprimibile fa salire la pressione di colpo.',
      'Horizontally the molar volume (log scale), in depth the temperature, upwards the pressure (log). The surface comes from the Peng–Robinson equation of state with Tc, Pc and the acentric factor taken from the curves of the first tab; where the PR isotherm wiggles (the van der Waals loop) it is replaced by the flat coexistence plane, at the pressure where liquid and vapour have the same fugacity (Maxwell’s equal areas). The purple dome closes at the red critical point; the yellow line is the triple line, below which there is the solid (not modelled by PR). The white point travels along an isotherm compressing the vapour: below Tc, at some volume the first droplets appear, the pressure stays put while the vapour condenses, then the nearly incompressible liquid makes the pressure shoot up.');
    function modello() {
      var S = SOST[st.s], p = parametriPR(st.s), satT = saturazione(st.s, S.Tt);
      mod = { p: p, S: S, satT: satT, lvmin: Math.log10(1.12 * p.b), lvmax: Math.log10(R * S.Tt / (0.5 * satT.P)), lpmin: Math.log10(0.5 * satT.P), lpmax: Math.log10(4 * S.Pc), Tmin: S.Tt, Tmax: 1.3 * S.Tc };
      cT.dispatchEvent(new Event('input'));
      isoterma();
    }
    function isoterma() {
      var p = mod.p, T = st.fT * p.Tc, sat = saturazione(st.s, T), Vc = 0.3074 * R * p.Tc / p.Pc;
      mod.T = T; mod.sat = sat;
      info.innerHTML = '<b>' + (st.s === 'co2' ? 'CO₂' : t('Acqua', 'Water')) + '</b> · Peng–Robinson: ω = ' + p.w.toFixed(4) + ' (' + t('dalla curva di vapore', 'from the vapour curve') + '), b = ' + (p.b * 1e6).toFixed(2) + ' cm³/mol<br>' +
        t('Punto critico ', 'Critical point ') + p.Tc + ' K, ' + fmtP(p.Pc) + ', V_c(PR) = ' + (Vc * 1e6).toFixed(1) + ' cm³/mol (Z_c = 0,307)<br>' +
        (sat ? t('A ', 'At ') + T.toFixed(1) + ' K: P_sat(PR) = <b class="bsiFX-num">' + fmtP(sat.P) + '</b> ' + t('contro ', 'versus ') + fmtP(sat.rif) + t(' della curva di riferimento (', ' of the reference curve (') + ((sat.P / sat.rif - 1) * 100).toFixed(1) + ' %)<br>' +
          'V_liq = <b class="bsiFX-num">' + (sat.Vl * 1e6).toFixed(1) + ' cm³/mol</b> · V_vap = <b class="bsiFX-num">' + (sat.Vv * 1e3).toFixed(3) + ' L/mol</b> · ' + t('rapporto ', 'ratio ') + Math.round(sat.Vv / sat.Vl) + '<br>' + t('Aree di Maxwell: ∫P dV / [P_sat (V_vap − V_liq)] = ', 'Maxwell areas: ∫P dV / [P_sat (V_vap − V_liq)] = ') + (lavoroPR(p, T, sat.Vl, sat.Vv) / (sat.P * (sat.Vv - sat.Vl))).toFixed(6)
          : t('Sopra Tc non c’è cupola: comprimendo, il gas diventa denso senza mai condensare.', 'Above Tc there is no dome: on compression the gas becomes dense without ever condensing.'));
    }
    modello();
    return {
      nome: ['Superficie P–V–T con la cupola liquido–vapore', 'P–V–T surface with the liquid–vapour dome'],
      tre: function (S, T3, L3) {
        var T = T3, gr = new T.Group(), gIso = new T.Group(), punto = null, u = 0;
        S.aggiungi(gr); S.aggiungi(gIso);
        function X(lv) { return -3.6 + 7.2 * (lv - mod.lvmin) / (mod.lvmax - mod.lvmin); }
        function Y(Tk) { return -3 + 6 * (Tk - mod.Tmin) / (mod.Tmax - mod.Tmin); }
        function Z(P) { var lp = P > 0 ? Math.log10(P) : mod.lpmin; lp = Math.max(mod.lpmin, Math.min(mod.lpmax, lp)); return -1.9 + 3.8 * (lp - mod.lpmin) / (mod.lpmax - mod.lpmin); }
        function libera(g) { while (g.children.length) { var o = g.children.pop(); o.traverse(function (x) { if (x.geometry) x.geometry.dispose(); if (x.material) { if (x.material.map) x.material.map.dispose(); x.material.dispose(); } }); } }
        cb.sveglia = function () { S.avvia(); };
        cb.nuova = function () {
          libera(gr);
          var nV = 120, nT = 60, pos = new Float32Array((nV + 1) * (nT + 1) * 3), col = new Float32Array(pos.length), idx = [], sats = [];
          for (var j = 0; j <= nT; j++) {
            var Tk = mod.Tmin + (mod.Tmax - mod.Tmin) * j / nT, sat = Tk < mod.p.Tc * 0.9995 ? saturazione(st.s, Tk) : null; sats.push([Tk, sat]);
            for (var i = 0; i <= nV; i++) {
              var lv = mod.lvmin + (mod.lvmax - mod.lvmin) * i / nV, q = superficiePVT(st.s, Tk, Math.pow(10, lv), sat), k = j * (nV + 1) + i, c = COL_REG[q.regione];
              pos[3 * k] = X(lv); pos[3 * k + 1] = Y(Tk); pos[3 * k + 2] = Z(q.P);
              var sh = 0.55 + 0.45 * (Z(q.P) + 1.9) / 3.8; col[3 * k] = c[0] * sh; col[3 * k + 1] = c[1] * sh; col[3 * k + 2] = c[2] * sh;
            }
          }
          for (j = 0; j < nT; j++) for (i = 0; i < nV; i++) { var a = j * (nV + 1) + i, b = a + nV + 1; idx.push(a, a + 1, b + 1, a, b + 1, b); }
          var geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setAttribute('color', new T.BufferAttribute(col, 3)); geo.setIndex(idx); geo.computeVertexNormals();
          gr.add(new T.Mesh(geo, new T.MeshStandardMaterial({ vertexColors: true, side: T.DoubleSide, roughness: 0.7, metalness: 0.02, transparent: true, opacity: 0.93 })));
          /* qualche isoterma sulla superficie, l'isoterma critica in evidenza */
          [0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.2].forEach(function (f) {
            var Tk = f * mod.p.Tc; if (Tk < mod.Tmin) return; var sat = Tk < mod.p.Tc * 0.9995 ? saturazione(st.s, Tk) : null, pts = [];
            for (var i2 = 0; i2 <= 200; i2++) { var lv = mod.lvmin + (mod.lvmax - mod.lvmin) * i2 / 200; pts.push([X(lv), Y(Tk), Z(superficiePVT(st.s, Tk, Math.pow(10, lv), sat).P) + 0.015]); }
            gr.add(L3.linea(T, pts, f === 1 ? 0xff8a80 : 0x0b1a2a, f === 1 ? 1 : 0.6));
          });
          /* la cupola: i due rami fino al punto critico */
          var lq = [], vp = [];
          sats.forEach(function (q2) { if (!q2[1]) return; lq.push([X(Math.log10(q2[1].Vl)), Y(q2[0]), Z(q2[1].P) + 0.03]); vp.push([X(Math.log10(q2[1].Vv)), Y(q2[0]), Z(q2[1].P) + 0.03]); });
          var Vc = 0.3074 * R * mod.p.Tc / mod.p.Pc, pc = [X(Math.log10(Vc)), Y(mod.p.Tc), Z(mod.p.Pc) + 0.03];
          gr.add(L3.linea(T, lq.concat([pc]).concat(vp.reverse()), 0xffffff, 0.95));
          gr.add(L3.sfera(T, 0.1, 0xff6b6b, pc[0], pc[1], pc[2], true));
          var ec = L3.testo3d(T, t('punto critico', 'critical point'), '#ff8a80', 0.26); ec.position.set(pc[0], pc[1], pc[2] + 0.4); gr.add(ec);
          /* la linea tripla */
          var st3 = mod.satT, a3 = [X(Math.log10(st3.Vl)), Y(mod.Tmin), Z(st3.P) + 0.04], b3 = [X(Math.log10(st3.Vv)), Y(mod.Tmin), Z(st3.P) + 0.04];
          gr.add(L3.linea(T, [a3, b3], 0xffd24a)); var et = L3.testo3d(T, t('linea tripla', 'triple line'), '#ffd24a', 0.24); et.position.set((a3[0] + b3[0]) / 2, a3[1] - 0.35, a3[2] + 0.2); gr.add(et);
          /* assi con qualche tacca */
          var o = [-3.6, -3, -1.9];
          gr.add(L3.linea(T, [o, [3.6, -3, -1.9]], 0x8494a8)); gr.add(L3.linea(T, [o, [-3.6, 3, -1.9]], 0x8494a8)); gr.add(L3.linea(T, [o, [-3.6, -3, 1.9]], 0x8494a8));
          [-4, -3, -2, -1, 0].forEach(function (e) { if (e < mod.lvmin || e > mod.lvmax) return; var l = L3.testo3d(T, (Math.pow(10, e + 3) >= 1 ? fmt(Math.pow(10, e + 3)) : fmt(Math.pow(10, e + 3))) + ' L', '#9fb1c6', 0.2); l.position.set(X(e), -3.35, -1.9); gr.add(l); });
          [3, 4, 5, 6, 7, 8].forEach(function (e) { if (e < mod.lpmin || e > mod.lpmax) return; var l = L3.testo3d(T, fmtP(Math.pow(10, e)), '#9fb1c6', 0.2); l.position.set(-4.1, -3, Z(Math.pow(10, e))); gr.add(l); });
          [mod.Tmin, mod.p.Tc, mod.Tmax].forEach(function (Tk) { var l = L3.testo3d(T, Math.round(Tk) + ' K', '#9fb1c6', 0.2); l.position.set(-4.1, Y(Tk), -1.9); gr.add(l); });
          var ex = L3.testo3d(T, t('V molare', 'molar V'), '#ff8a80', 0.27); ex.position.set(0, -3.8, -1.9); gr.add(ex);
          var ey = L3.testo3d(T, 'T', '#5eead4', 0.3); ey.position.set(-3.9, 3.3, -1.9); gr.add(ey);
          var ez = L3.testo3d(T, 'P', '#6bcfff', 0.3); ez.position.set(-3.6, -3, 2.25); gr.add(ez);
          cb.isoterma();
        };
        cb.isoterma = function () {
          libera(gIso); var pts = [];
          for (var i = 0; i <= 240; i++) { var lv = mod.lvmin + (mod.lvmax - mod.lvmin) * i / 240; pts.push([X(lv), Y(mod.T), Z(superficiePVT(st.s, mod.T, Math.pow(10, lv), mod.sat).P) + 0.05]); }
          gIso.add(L3.linea(T, pts, 0xffffff)); punto = L3.sfera(T, 0.12, 0xffffff, 0, 0, 0, true); gIso.add(punto); u = 0; muovi(); S.sporca = true; S.avvia();
        };
        function muovi() {
          /* da V grande a V piccolo in 8 s (scala logaritmica), poi ricomincia */
          var lv = mod.lvmax - (mod.lvmax - mod.lvmin) * 0.97 * u, V = Math.pow(10, lv), q = superficiePVT(st.s, mod.T, V, mod.sat);
          punto.position.set(X(lv), Y(mod.T), Z(q.P) + 0.08);
          vivo.innerHTML = 'V = <b class="bsiFX-num">' + (V * 1e3 < 0.1 ? (V * 1e6).toFixed(1) + ' cm³/mol' : (V * 1e3).toFixed(3) + ' L/mol') + '</b> · P = <b class="bsiFX-num">' + fmtP(q.P) + '</b> · ' + F.tt(NOME_REG[q.regione]) + (q.regione === 'coesistenza' ? ' — ' + t('liquido ', 'liquid ') + '<b class="bsiFX-num">' + (q.xl * 100).toFixed(1) + ' %</b> ' + t('(regola della leva)', '(lever rule)') : '');
          S.didascalia.textContent = (st.s === 'co2' ? 'CO₂' : t('Acqua', 'Water')) + ' · T = ' + mod.T.toFixed(1) + ' K · ' + F.tt(NOME_REG[q.regione]);
        }
        cb.nuova();
        S.ogniFotogramma(function (dt) { if (st.pausa) return false; u += dt / 8; if (u > 1) u = 0; muovi(); return true; });
        S.inquadra(13, -1.05, 1.0);
      }
    };
  }

  F.sezione('schifasi', {
    titolo: ['🧊 Diagrammi di fase', '🧊 Phase diagrams'],
    sotto: ['Il diagramma P–T di acqua e CO₂ con punto triplo e critico, l’eutettico binario con la regola della leva e la curva di raffreddamento, l’equazione di Clapeyron e la regola delle fasi di Gibbs.', 'The P–T diagram of water and CO₂ with triple and critical points, the binary eutectic with the lever rule and the cooling curve, the Clapeyron equation and Gibbs’ phase rule.'],
    schede: [
      { nome: ['💧 Sostanza pura', '💧 Pure substance'], costruisci: schedaPura },
      { nome: ['🔩 Eutettico', '🔩 Eutectic'], costruisci: schedaEutettico },
      { nome: ['📐 Clapeyron e Gibbs', '📐 Clapeyron and Gibbs'], costruisci: schedaRegola },
      { nome: ['🧊 Superficie P–V–T', '🧊 P–V–T surface'], costruisci: scheda3D(schedaPVT3D) }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
