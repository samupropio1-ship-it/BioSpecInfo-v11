/* ═══════════════════════════════════════════════════════════════════════════
   bsi-astro-cielo.js — 🔭 Planetario 3D
   BioSpecInfo · © Samuele Pio Provenzano

   Il cielo vero, visto da dentro la sfera celeste, da un luogo e a un'ora
   qualsiasi (di partenza: Bari, 41,12° N 16,87° E, adesso):

   · IL CIELO: circa 170 stelle luminose con α, δ (J2000), magnitudine e
     colore da B − V, le linee di 28 costellazioni, la Via Lattea lungo
     l'equatore galattico, l'orizzonte con i punti cardinali, il cielo che
     schiarisce di giorno. La sfera ruota con il tempo siderale
     (GMST = 280,46061837° + 360,98564736629°·(JD − 2451545) + …): la
     trasformazione da equatoriali a orizzontali e' una sola matrice di
     rotazione. I pianeti con gli elementi orbitali approssimati del JPL
     (Standish) e l'equazione di Keplero; Sole e Luna con le formule a bassa
     precisione dell'Astronomical Almanac, la Luna con la sua fase.
   · LE COORDINATE: un clic su una stella da' α, δ, altezza, azimut,
     angolo orario e gli istanti di levata, culminazione e tramonto
     (cos H₀ = (sin h₀ − sin φ sin δ)/(cos φ cos δ), h₀ = −0,567° per la
     rifrazione), oppure «circumpolare» / «mai visibile».
   · LA PRECESSIONE: il polo celeste gira attorno al polo dell'eclittica su
     un cerchio di raggio ε ≈ 23,44° in ~25 800 anni (50,29″/anno); Polaris
     oggi, Vega fra ~12 000 anni, Thuban ai tempi delle piramidi.
   · L'ANALEMMA: il Sole fotografato ogni giorno alla stessa ora media
     disegna un otto: in verticale la declinazione, in orizzontale
     l'equazione del tempo (da +16,4 min a inizio novembre a −14,2 min a
     meta' febbraio), somma dell'eccentricita' dell'orbita e
     dell'inclinazione dell'eclittica.

   Precisione: stelle e pianeti a qualche centesimo di grado nel periodo
   1800–2050; i moti propri delle stelle sono trascurati. I calcoli
   (F.calcolo.cielo) sono funzioni pure: il banco li prova in node.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica;
  if (!F) return;
  var t = F.t, fmt = F.fmt;
  var RAD = Math.PI / 180, DEG = 180 / Math.PI;
  function mod(x, m) { return ((x % m) + m) % m; }
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var r = Math.imul(a ^ a >>> 15, 1 | a); r = r + Math.imul(r ^ r >>> 7, 61 | r) ^ r; return ((r ^ r >>> 14) >>> 0) / 4294967296; }; }
  function gauss(rnd) { var u = rnd() || 1e-12, v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

  /* ═══ le stelle: nome, α (ore), δ (gradi), V, B − V (J2000, valori arrotondati) ═══ */
  var STELLE = [
    ['Sirio', 'Sirius', 6.7525, -16.716, -1.46, 0.00], ['Canopo', 'Canopus', 6.3992, -52.696, -0.74, 0.15], ['Arturo', 'Arcturus', 14.2610, 19.182, -0.05, 1.23],
    ['Rigil Kentaurus', 'Rigil Kentaurus', 14.6600, -60.834, -0.27, 0.71], ['Vega', 'Vega', 18.6156, 38.784, 0.03, 0.00], ['Capella', 'Capella', 5.2782, 45.998, 0.08, 0.80],
    ['Rigel', 'Rigel', 5.2423, -8.202, 0.13, -0.03], ['Procione', 'Procyon', 7.6550, 5.225, 0.34, 0.42], ['Achernar', 'Achernar', 1.6286, -57.237, 0.46, -0.16],
    ['Betelgeuse', 'Betelgeuse', 5.9195, 7.407, 0.50, 1.85], ['Hadar', 'Hadar', 14.0637, -60.373, 0.61, -0.23], ['Altair', 'Altair', 19.8464, 8.868, 0.77, 0.22],
    ['Acrux', 'Acrux', 12.4433, -63.099, 0.77, -0.24], ['Aldebaran', 'Aldebaran', 4.5987, 16.509, 0.85, 1.54], ['Antares', 'Antares', 16.4901, -26.432, 0.96, 1.83],
    ['Spica', 'Spica', 13.4199, -11.161, 0.97, -0.23], ['Polluce', 'Pollux', 7.7553, 28.026, 1.14, 1.00], ['Fomalhaut', 'Fomalhaut', 22.9608, -29.622, 1.16, 0.09],
    ['Deneb', 'Deneb', 20.6905, 45.280, 1.25, 0.09], ['Mimosa', 'Mimosa', 12.7954, -59.689, 1.25, -0.23], ['Regolo', 'Regulus', 10.1395, 11.967, 1.35, -0.11],
    ['Adhara', 'Adhara', 6.9771, -28.972, 1.50, -0.21], ['Castore', 'Castor', 7.5767, 31.888, 1.58, 0.03], ['Gacrux', 'Gacrux', 12.5194, -57.113, 1.63, 1.60],
    ['Shaula', 'Shaula', 17.5601, -37.104, 1.62, -0.22], ['Bellatrix', 'Bellatrix', 5.4189, 6.350, 1.64, -0.22], ['Elnath', 'Elnath', 5.4382, 28.608, 1.65, -0.13],
    ['Miaplacidus', 'Miaplacidus', 9.2200, -69.717, 1.67, 0.07], ['Alnilam', 'Alnilam', 5.6036, -1.202, 1.69, -0.18], ['Alnair', 'Alnair', 22.1372, -46.961, 1.74, -0.07],
    ['Alnitak', 'Alnitak', 5.6793, -1.943, 1.77, -0.21], ['Alioth', 'Alioth', 12.9005, 55.960, 1.77, -0.02], ['Dubhe', 'Dubhe', 11.0621, 61.751, 1.79, 1.07],
    ['Mirfak', 'Mirfak', 3.4054, 49.861, 1.79, 0.48], ['Wezen', 'Wezen', 7.1399, -26.393, 1.84, 0.68], ['Kaus Australis', 'Kaus Australis', 18.4029, -34.385, 1.85, -0.03],
    ['Avior', 'Avior', 8.3752, -59.510, 1.86, 1.28], ['Alkaid', 'Alkaid', 13.7923, 49.313, 1.86, -0.19], ['Sargas', 'Sargas', 17.6220, -42.998, 1.87, 0.40],
    ['Menkalinan', 'Menkalinan', 5.9921, 44.948, 1.90, 0.03], ['Atria', 'Atria', 16.8111, -69.028, 1.91, 1.45], ['Alhena', 'Alhena', 6.6285, 16.399, 1.93, 0.00],
    ['Peacock', 'Peacock', 20.4275, -56.735, 1.94, -0.20], ['Polare', 'Polaris', 2.5303, 89.264, 1.98, 0.60], ['Mirzam', 'Mirzam', 6.3783, -17.956, 1.98, -0.23],
    ['Alphard', 'Alphard', 9.4598, -8.659, 1.98, 1.44], ['Hamal', 'Hamal', 2.1196, 23.462, 2.00, 1.15], ['Diphda', 'Diphda', 0.7265, -17.987, 2.04, 1.02],
    ['Nunki', 'Nunki', 18.9211, -26.297, 2.05, -0.13], ['Menkent', 'Menkent', 14.1114, -36.370, 2.06, 1.01], ['Alpheratz', 'Alpheratz', 0.1398, 29.090, 2.06, -0.11],
    ['Mirach', 'Mirach', 1.1622, 35.621, 2.05, 1.58], ['Saiph', 'Saiph', 5.7959, -9.670, 2.07, -0.17], ['Kochab', 'Kochab', 14.8451, 74.156, 2.08, 1.47],
    ['Rasalhague', 'Rasalhague', 17.5822, 12.560, 2.08, 0.15], ['Algol', 'Algol', 3.1361, 40.956, 2.09, -0.05], ['Almach', 'Almach', 2.0650, 42.330, 2.10, 1.37],
    ['Denebola', 'Denebola', 11.8177, 14.572, 2.14, 0.09], ['Navi', 'Navi (γ Cas)', 0.9451, 60.717, 2.47, -0.15], ['Schedar', 'Schedar', 0.6751, 56.537, 2.24, 1.17],
    ['Caph', 'Caph', 0.1529, 59.150, 2.28, 0.34], ['Ruchbah', 'Ruchbah', 1.4302, 60.235, 2.68, 0.13], ['Segin', 'Segin', 1.9066, 63.670, 3.38, -0.15],
    ['Merak', 'Merak', 11.0307, 56.382, 2.37, -0.02], ['Phecda', 'Phecda', 11.8972, 53.695, 2.44, 0.04], ['Megrez', 'Megrez', 12.2571, 57.033, 3.31, 0.08],
    ['Mizar', 'Mizar', 13.3988, 54.925, 2.23, 0.02], ['Sadr', 'Sadr', 20.3705, 40.257, 2.23, 0.67], ['Gienah Cygni', 'Gienah Cygni', 20.7702, 33.970, 2.48, 1.03],
    ['Albireo', 'Albireo', 19.5120, 27.960, 3.08, 1.13], ['δ Cyg', 'δ Cyg', 19.7496, 45.131, 2.87, -0.03], ['ζ Cyg', 'ζ Cyg', 21.2156, 30.227, 3.21, 0.99],
    ['η Cyg', 'η Cyg', 19.9384, 35.083, 3.89, 1.02], ['Sheliak', 'Sheliak', 18.8347, 33.363, 3.52, 0.00], ['Sulafat', 'Sulafat', 18.9824, 32.690, 3.25, -0.05],
    ['ζ Lyr', 'ζ Lyr', 18.7462, 37.605, 4.36, 0.19], ['δ² Lyr', 'δ² Lyr', 18.9084, 36.899, 4.30, 1.68],
    ['Dschubba', 'Dschubba', 16.0056, -22.622, 2.29, -0.12], ['Acrab', 'Acrab', 16.0906, -19.806, 2.62, -0.07], ['π Sco', 'π Sco', 15.9809, -26.114, 2.89, -0.19],
    ['σ Sco', 'σ Sco', 16.3531, -25.593, 2.89, 0.13], ['τ Sco', 'τ Sco', 16.5980, -28.216, 2.82, -0.25], ['Larawag', 'Larawag (ε Sco)', 16.8361, -34.293, 2.29, 1.15],
    ['μ¹ Sco', 'μ¹ Sco', 16.8645, -38.048, 3.08, -0.20], ['ζ² Sco', 'ζ² Sco', 16.9097, -42.362, 3.62, 1.37], ['η Sco', 'η Sco', 17.2025, -43.239, 3.33, 0.41],
    ['ι¹ Sco', 'ι¹ Sco', 17.7930, -40.127, 2.99, 0.51], ['κ Sco', 'κ Sco', 17.7081, -39.030, 2.39, -0.22], ['Lesath', 'Lesath', 17.5127, -37.296, 2.70, -0.22],
    ['Mintaka', 'Mintaka', 5.5334, -0.299, 2.23, -0.22], ['Meissa', 'Meissa', 5.5855, 9.934, 3.39, -0.16], ['π³ Ori', 'π³ Ori', 4.8301, 6.961, 3.19, 0.45],
    ['Algieba', 'Algieba', 10.3329, 19.842, 2.08, 1.15], ['Zosma', 'Zosma', 11.2351, 20.524, 2.56, 0.12], ['Chertan', 'Chertan', 11.2373, 15.430, 3.33, 0.00],
    ['η Leo', 'η Leo', 10.1222, 16.763, 3.49, -0.03], ['ε Leo', 'ε Leo', 9.7642, 23.774, 2.98, 0.81], ['μ Leo', 'μ Leo', 9.8794, 26.007, 3.88, 1.22], ['Adhafera', 'Adhafera', 10.2782, 23.417, 3.44, 0.31],
    ['Tejat', 'Tejat', 6.3827, 22.514, 2.87, 1.64], ['Mebsuta', 'Mebsuta', 6.7322, 25.131, 2.98, 1.38], ['Wasat', 'Wasat', 7.3354, 21.982, 3.53, 0.34], ['Propus', 'Propus', 6.2479, 22.507, 3.28, 1.60],
    ['Alcyone', 'Alcyone (Pleiadi)', 3.7914, 24.105, 2.87, -0.09], ['ζ Tau', 'ζ Tau', 5.6274, 21.143, 3.00, -0.19], ['θ² Tau', 'θ² Tau', 4.4776, 15.871, 3.40, 0.18],
    ['γ Tau', 'γ Tau', 4.3297, 15.628, 3.65, 0.99], ['ε Tau', 'ε Tau', 4.4769, 19.180, 3.53, 1.01], ['λ Tau', 'λ Tau', 4.0110, 12.490, 3.47, -0.12],
    ['Aludra', 'Aludra', 7.4016, -29.303, 2.45, -0.08], ['θ Aur', 'θ Aur', 5.9954, 37.213, 2.65, -0.08], ['Hassaleh', 'Hassaleh', 4.9498, 33.166, 2.69, 1.53], ['ε Aur', 'ε Aur', 5.0328, 43.823, 2.99, 0.54],
    ['Pherkad', 'Pherkad', 15.3455, 71.834, 3.05, 0.05], ['Yildun', 'Yildun', 17.5369, 86.586, 4.36, 0.02], ['ε UMi', 'ε UMi', 16.7662, 82.037, 4.21, 0.89], ['ζ UMi', 'ζ UMi', 15.7343, 77.795, 4.32, 0.04], ['η UMi', 'η UMi', 16.2918, 75.755, 4.95, 0.37],
    ['Tarazed', 'Tarazed', 19.7710, 10.613, 2.72, 1.52], ['Alshain', 'Alshain', 19.9219, 6.407, 3.71, 0.86], ['ζ Aql', 'ζ Aql', 19.0901, 13.863, 2.99, 0.01], ['δ Aql', 'δ Aql', 19.4249, 3.115, 3.36, 0.32],
    ['λ Aql', 'λ Aql', 19.1041, -4.882, 3.44, -0.09], ['θ Aql', 'θ Aql', 20.1884, -0.822, 3.23, -0.07],
    ['Imai', 'Imai (δ Cru)', 12.2524, -58.749, 2.79, -0.23], ['ε Cru', 'ε Cru', 12.3564, -60.401, 3.59, 1.42],
    ['ε Cen', 'ε Cen', 13.6648, -53.466, 2.30, -0.17], ['η Cen', 'η Cen', 14.5918, -42.158, 2.31, -0.16], ['γ Cen', 'γ Cen', 12.6919, -48.960, 2.17, -0.01], ['δ Cen', 'δ Cen', 12.1393, -50.722, 2.52, -0.12], ['ζ Cen', 'ζ Cen', 13.9257, -47.288, 2.55, -0.18],
    ['Ascella', 'Ascella', 19.0435, -29.880, 2.60, 0.08], ['Kaus Media', 'Kaus Media', 18.3499, -29.828, 2.70, 1.38], ['Kaus Borealis', 'Kaus Borealis', 18.4662, -25.422, 2.81, 1.04],
    ['φ Sgr', 'φ Sgr', 18.7609, -26.991, 3.17, -0.11], ['Alnasl', 'Alnasl', 18.0968, -30.424, 2.99, 1.00], ['τ Sgr', 'τ Sgr', 19.1157, -27.671, 3.32, 1.19],
    ['Markab', 'Markab', 23.0793, 15.205, 2.49, -0.04], ['Scheat', 'Scheat', 23.0629, 28.083, 2.42, 1.67], ['Algenib', 'Algenib', 0.2206, 15.184, 2.83, -0.23], ['Enif', 'Enif', 21.7364, 9.875, 2.38, 1.52],
    ['Homam', 'Homam', 22.6910, 10.831, 3.40, -0.09], ['Matar', 'Matar', 22.7167, 30.221, 2.94, 0.86], ['δ And', 'δ And', 0.6555, 30.861, 3.27, 1.28],
    ['ε Per', 'ε Per', 3.9642, 40.010, 2.89, -0.18], ['ζ Per', 'ζ Per', 3.9022, 31.884, 2.85, 0.12], ['δ Per', 'δ Per', 3.7154, 47.788, 3.01, -0.13], ['γ Per', 'γ Per', 3.0799, 53.506, 2.93, 0.70],
    ['Izar', 'Izar', 14.7498, 27.074, 2.37, 0.97], ['Muphrid', 'Muphrid', 13.9114, 18.398, 2.68, 0.58], ['Seginus', 'Seginus', 14.5347, 38.308, 3.04, 0.19], ['δ Boo', 'δ Boo', 15.2584, 33.315, 3.46, 0.95],
    ['Nekkar', 'Nekkar', 15.0324, 40.390, 3.50, 0.97], ['ρ Boo', 'ρ Boo', 14.5302, 30.371, 3.57, 1.30],
    ['Porrima', 'Porrima', 12.6943, -1.449, 2.74, 0.36], ['Vindemiatrix', 'Vindemiatrix', 13.0363, 10.959, 2.85, 0.94], ['δ Vir', 'δ Vir', 12.9268, 3.397, 3.38, 1.58], ['β Vir', 'β Vir', 11.8448, 1.765, 3.61, 0.55], ['ζ Vir', 'ζ Vir', 13.5783, -0.596, 3.37, 0.11],
    ['Alphecca', 'Alphecca', 15.5781, 26.715, 2.23, -0.02],
    ['Kornephoros', 'Kornephoros', 16.5037, 21.490, 2.77, 0.95], ['ζ Her', 'ζ Her', 16.6881, 31.603, 2.81, 0.65], ['π Her', 'π Her', 17.2508, 36.809, 3.16, 1.44], ['η Her', 'η Her', 16.7149, 38.922, 3.48, 0.92],
    ['ε Her', 'ε Her', 17.0047, 30.926, 3.92, -0.01], ['δ Her', 'δ Her', 17.2505, 24.839, 3.14, 0.08], ['Rasalgethi', 'Rasalgethi', 17.2441, 14.390, 3.06, 1.16],
    ['Eltanin', 'Eltanin', 17.9434, 51.489, 2.24, 1.52], ['Rastaban', 'Rastaban', 17.5072, 52.301, 2.79, 0.98], ['η Dra', 'η Dra', 16.3999, 61.514, 2.74, 0.91], ['Thuban', 'Thuban', 14.0731, 64.376, 3.65, -0.05],
    ['ξ Dra', 'ξ Dra', 17.8921, 56.873, 3.73, 1.18], ['δ Dra', 'δ Dra', 19.2093, 67.662, 3.07, 1.00], ['ζ Dra', 'ζ Dra', 17.1464, 65.715, 3.17, -0.12], ['ι Dra', 'ι Dra', 15.4155, 58.966, 3.29, 1.16],
    ['κ Dra', 'κ Dra', 12.5581, 69.788, 3.87, -0.13], ['λ Dra', 'λ Dra', 11.5232, 69.331, 3.84, 1.62],
    ['Sabik', 'Sabik', 17.1730, -15.725, 2.43, 0.06], ['ζ Oph', 'ζ Oph', 16.6193, -10.567, 2.56, 0.02], ['δ Oph', 'δ Oph', 16.2391, -3.694, 2.73, 1.58], ['Cebalrai', 'Cebalrai', 17.7245, 4.567, 2.77, 1.16],
    ['κ Oph', 'κ Oph', 16.9612, 9.375, 3.20, 1.15], ['ε Oph', 'ε Oph', 16.3053, -4.692, 3.24, 0.97],
    ['Gomeisa', 'Gomeisa', 7.4525, 8.289, 2.89, -0.09], ['Sheratan', 'Sheratan', 1.9107, 20.808, 2.64, 0.13], ['Mesarthim', 'Mesarthim', 1.8925, 19.294, 3.88, -0.04],
    ['Menkar', 'Menkar', 3.0380, 4.090, 2.54, 1.64], ['Cursa', 'Cursa', 5.1309, -5.086, 2.79, 0.13], ['β Gru', 'β Gru', 22.7111, -46.885, 2.07, 1.60],
    ['Aspidiske', 'Aspidiske', 9.2848, -59.275, 2.21, 0.18], ['γ² Vel', 'γ² Vel', 8.1589, -47.337, 1.83, -0.22], ['δ Vel', 'δ Vel', 8.7450, -54.709, 1.96, 0.04], ['Suhail', 'Suhail', 9.1333, -43.433, 2.21, 1.66],
    ['κ Vel', 'κ Vel', 9.3680, -55.011, 2.47, -0.18], ['Naos', 'Naos', 8.0597, -40.003, 2.21, -0.27],
    ['Gienah Corvi', 'Gienah Corvi', 12.2634, -17.542, 2.59, -0.11], ['Kraz', 'Kraz', 12.5733, -23.397, 2.65, 0.89], ['Algorab', 'Algorab', 12.4977, -16.515, 2.95, -0.05], ['ε Crv', 'ε Crv', 12.1688, -22.620, 3.00, 1.33],
    ['α Lup', 'α Lup', 14.6988, -47.388, 2.30, -0.15], ['Zubeneschamali', 'Zubeneschamali', 15.2834, -9.383, 2.61, -0.07], ['Zubenelgenubi', 'Zubenelgenubi', 14.8480, -16.042, 2.75, 0.15],
    ['Deneb Algedi', 'Deneb Algedi', 21.7840, -16.127, 2.85, 0.29], ['Sadalsuud', 'Sadalsuud', 21.5260, -5.571, 2.90, 0.83], ['Sadalmelik', 'Sadalmelik', 22.0964, -0.320, 2.95, 0.97]
  ];
  var IDX = {}; STELLE.forEach(function (s, i) { IDX[s[0]] = i; });
  /* costellazioni: spezzate di stelle */
  var COSTELLAZIONI = [
    [['Orione', 'Orion'], [['Betelgeuse', 'Meissa', 'Bellatrix'], ['Betelgeuse', 'Alnitak', 'Alnilam', 'Mintaka', 'Bellatrix', 'π³ Ori'], ['Alnitak', 'Saiph'], ['Mintaka', 'Rigel']]],
    [['Orsa Maggiore (Grande Carro)', 'Ursa Major (Big Dipper)'], [['Dubhe', 'Merak', 'Phecda', 'Megrez', 'Dubhe'], ['Megrez', 'Alioth', 'Mizar', 'Alkaid']]],
    [['Orsa Minore', 'Ursa Minor'], [['Polare', 'Yildun', 'ε UMi', 'ζ UMi', 'Kochab', 'Pherkad', 'η UMi', 'ζ UMi']]],
    [['Cassiopea', 'Cassiopeia'], [['Caph', 'Schedar', 'Navi', 'Ruchbah', 'Segin']]],
    [['Cigno', 'Cygnus'], [['Deneb', 'Sadr', 'η Cyg', 'Albireo'], ['δ Cyg', 'Sadr', 'Gienah Cygni', 'ζ Cyg']]],
    [['Lira', 'Lyra'], [['Vega', 'ζ Lyr', 'Sheliak', 'Sulafat', 'δ² Lyr', 'ζ Lyr']]],
    [['Aquila', 'Aquila'], [['ζ Aql', 'Tarazed', 'Altair', 'Alshain'], ['Altair', 'δ Aql', 'λ Aql'], ['δ Aql', 'θ Aql']]],
    [['Scorpione', 'Scorpius'], [['Acrab', 'Dschubba', 'π Sco'], ['Dschubba', 'σ Sco', 'Antares', 'τ Sco', 'Larawag', 'μ¹ Sco', 'ζ² Sco', 'η Sco', 'Sargas', 'ι¹ Sco', 'κ Sco', 'Shaula', 'Lesath']]],
    [['Leone', 'Leo'], [['Regolo', 'η Leo', 'Algieba', 'Adhafera', 'μ Leo', 'ε Leo'], ['Algieba', 'Zosma', 'Denebola', 'Chertan', 'Regolo'], ['Zosma', 'Chertan']]],
    [['Gemelli', 'Gemini'], [['Castore', 'Mebsuta', 'Tejat', 'Propus'], ['Polluce', 'Wasat', 'Alhena'], ['Castore', 'Polluce']]],
    [['Toro', 'Taurus'], [['ζ Tau', 'Aldebaran', 'θ² Tau', 'γ Tau', 'ε Tau', 'Elnath'], ['γ Tau', 'λ Tau']]],
    [['Cane Maggiore', 'Canis Major'], [['Mirzam', 'Sirio', 'Wezen', 'Adhara'], ['Wezen', 'Aludra']]],
    [['Auriga', 'Auriga'], [['Capella', 'Menkalinan', 'θ Aur', 'Elnath', 'Hassaleh', 'Capella'], ['Capella', 'ε Aur']]],
    [['Croce del Sud', 'Southern Cross'], [['Acrux', 'Gacrux'], ['Mimosa', 'Imai']]],
    [['Centauro', 'Centaurus'], [['Rigil Kentaurus', 'Hadar', 'ε Cen', 'γ Cen', 'δ Cen'], ['ε Cen', 'ζ Cen', 'η Cen'], ['ζ Cen', 'Menkent']]],
    [['Sagittario (la Teiera)', 'Sagittarius (the Teapot)'], [['Kaus Australis', 'Kaus Media', 'Kaus Borealis', 'φ Sgr', 'Kaus Media'], ['φ Sgr', 'Nunki', 'τ Sgr', 'Ascella', 'φ Sgr'], ['Ascella', 'Kaus Australis', 'Alnasl', 'Kaus Media']]],
    [['Pegaso e Andromeda', 'Pegasus and Andromeda'], [['Markab', 'Scheat', 'Alpheratz', 'Algenib', 'Markab'], ['Markab', 'Homam', 'Enif'], ['Scheat', 'Matar'], ['Alpheratz', 'δ And', 'Mirach', 'Almach']]],
    [['Perseo', 'Perseus'], [['γ Per', 'Mirfak', 'δ Per', 'ε Per', 'ζ Per'], ['Mirfak', 'Algol']]],
    [['Boote', 'Boötes'], [['Arturo', 'Izar', 'δ Boo', 'Nekkar', 'Seginus', 'ρ Boo', 'Arturo'], ['Arturo', 'Muphrid']]],
    [['Vergine', 'Virgo'], [['β Vir', 'Porrima', 'Spica'], ['Porrima', 'δ Vir', 'Vindemiatrix'], ['Spica', 'ζ Vir', 'δ Vir']]],
    [['Ercole', 'Hercules'], [['ε Her', 'ζ Her', 'η Her', 'π Her', 'ε Her'], ['ζ Her', 'Kornephoros'], ['ε Her', 'δ Her', 'Rasalgethi']]],
    [['Drago', 'Draco'], [['Rastaban', 'Eltanin', 'ξ Dra', 'Rastaban'], ['ξ Dra', 'δ Dra', 'ζ Dra', 'η Dra', 'ι Dra', 'Thuban', 'κ Dra', 'λ Dra']]],
    [['Ofiuco', 'Ophiuchus'], [['Rasalhague', 'κ Oph', 'δ Oph', 'ε Oph'], ['δ Oph', 'ζ Oph', 'Sabik', 'Cebalrai', 'Rasalhague']]],
    [['Corvo', 'Corvus'], [['Gienah Corvi', 'Algorab', 'Kraz', 'ε Crv', 'Gienah Corvi']]],
    [['Ariete', 'Aries'], [['Hamal', 'Sheratan', 'Mesarthim']]],
    [['Vele e Falsa Croce', 'Vela and False Cross'], [['Avior', 'Aspidiske', 'κ Vel', 'δ Vel', 'Avior'], ['γ² Vel', 'δ Vel'], ['γ² Vel', 'Suhail', 'κ Vel']]],
    [['Cane Minore', 'Canis Minor'], [['Procione', 'Gomeisa']]],
    [['Bilancia', 'Libra'], [['Zubenelgenubi', 'Zubeneschamali']]]
  ];
  var LUOGHI = [['bari', 'Bari', 41.12, 16.87], ['roma', 'Roma', 41.90, 12.50], ['milano', 'Milano', 45.46, 9.19], ['palermo', 'Palermo', 38.12, 13.36], ['londra', 'London', 51.48, 0.0], ['newyork', 'New York', 40.71, -74.01], ['sydney', 'Sydney', -33.87, 151.21], ['equatore', t('Equatore (Quito)', 'Equator (Quito)'), -0.18, -78.47], ['polo', t('Polo Nord', 'North Pole'), 89.99, 0], ['tromso', 'Tromsø', 69.65, 18.96]];

  /* ═══ tempo ════════════════════════════════════════════════════════════ */
  function giulianoDa(ms) { return ms / 86400000 + 2440587.5; }
  function msDaGiuliano(jd) { return (jd - 2440587.5) * 86400000; }
  function giuliano(an, me, gi, ore) { /* calendario gregoriano, Meeus cap. 7 */
    if (me <= 2) { an -= 1; me += 12; }
    var A = Math.floor(an / 100), B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (an + 4716)) + Math.floor(30.6001 * (me + 1)) + gi + B - 1524.5 + (ore || 0) / 24;
  }
  /* tempo siderale medio di Greenwich (gradi), IAU 1982 */
  function gmst(jd) { var T = (jd - 2451545) / 36525; return mod(280.46061837 + 360.98564736629 * (jd - 2451545) + 0.000387933 * T * T - T * T * T / 38710000, 360); }
  function lst(jd, lonGradi) { return mod(gmst(jd) + lonGradi, 360); }

  /* ═══ coordinate ═══════════════════════════════════════════════════════ */
  function obliquita(jd) { var T = (jd - 2451545) / 36525; return 23.439291 - 0.0130042 * T; }
  function eclEq(lam, bet, eps) {
    var l = lam * RAD, b = bet * RAD, e = eps * RAD;
    var x = Math.cos(b) * Math.cos(l), y = Math.cos(b) * Math.sin(l) * Math.cos(e) - Math.sin(b) * Math.sin(e), z = Math.cos(b) * Math.sin(l) * Math.sin(e) + Math.sin(b) * Math.cos(e);
    return { ra: mod(Math.atan2(y, x) * DEG, 360), dec: Math.asin(Math.max(-1, Math.min(1, z))) * DEG };
  }
  function eqEcl(ra, dec, eps) {
    var a = ra * RAD, d = dec * RAD, e = eps * RAD;
    var x = Math.cos(d) * Math.cos(a), y = Math.cos(d) * Math.sin(a) * Math.cos(e) + Math.sin(d) * Math.sin(e), z = -Math.cos(d) * Math.sin(a) * Math.sin(e) + Math.sin(d) * Math.cos(e);
    return { lam: mod(Math.atan2(y, x) * DEG, 360), bet: Math.asin(Math.max(-1, Math.min(1, z))) * DEG };
  }
  /* equatoriali → orizzontali: altezza, azimut da nord verso est */
  function altAz(ra, dec, latG, lstG) {
    var H = (lstG - ra) * RAD, d = dec * RAD, f = latG * RAD;
    var up = Math.sin(f) * Math.sin(d) + Math.cos(f) * Math.cos(d) * Math.cos(H), nord = Math.cos(f) * Math.sin(d) - Math.sin(f) * Math.cos(d) * Math.cos(H), est = -Math.cos(d) * Math.sin(H);
    return { alt: Math.asin(Math.max(-1, Math.min(1, up))) * DEG, az: mod(Math.atan2(est, nord) * DEG, 360), H: mod((lstG - ra) / 15 + 12, 24) - 12 };
  }
  /* precessione semplice: rotazione delle longitudini eclittiche di p·(anno − 2000), p = 50,29″/anno, eclittica fissa */
  var P_PREC = 50.29 / 3600;
  function precedi(ra, dec, anni) { var e = eqEcl(ra, dec, 23.4393); return eclEq(e.lam + P_PREC * anni, e.bet, 23.4393); }
  function periodoPrecessione() { return 360 / P_PREC; }
  /* il polo nord celeste dell'anno A nelle coordinate equatoriali J2000 */
  function poloCeleste(anno) {
    var eps = 23.4393 * RAD, psi = -P_PREC * (anno - 2000) * RAD;
    /* nel sistema eclittico J2000 il polo ha latitudine 90° − ε e longitudine 90° (verso il solstizio d'inverno … = 90° − 180°): ruota attorno al polo dell'eclittica */
    var lam = mod(90 + psi * DEG, 360);
    return eclEq(lam, 90 - 23.4393, 23.4393);
  }
  function distanzaAngolare(ra1, d1, ra2, d2) { var c = Math.sin(d1 * RAD) * Math.sin(d2 * RAD) + Math.cos(d1 * RAD) * Math.cos(d2 * RAD) * Math.cos((ra1 - ra2) * RAD); return Math.acos(Math.max(-1, Math.min(1, c))) * DEG; }
  /* galattiche → equatoriali J2000 (polo nord galattico α = 192,85948°, δ = 27,12825°, l del polo celeste 122,93192°) */
  function galEq(l, b) {
    var ag = 192.85948 * RAD, dg = 27.12825 * RAD, ln = 122.93192 * RAD, L = l * RAD, B = b * RAD;
    var sd = Math.sin(dg) * Math.sin(B) + Math.cos(dg) * Math.cos(B) * Math.cos(ln - L);
    var y = Math.cos(B) * Math.sin(ln - L), x = Math.cos(dg) * Math.sin(B) - Math.sin(dg) * Math.cos(B) * Math.cos(ln - L);
    return { ra: mod((ag + Math.atan2(y, x)) * DEG, 360), dec: Math.asin(sd) * DEG };
  }

  /* ═══ levata e tramonto ═══════════════════════════════════════════════ */
  /* per il giorno che inizia a jd0 (0h UT): istanti (in giorni dopo jd0) di culminazione, levata e tramonto */
  function levataTramonto(ra, dec, lat, lon, jd0, h0) {
    h0 = h0 == null ? -0.5667 : h0;
    var c = (Math.sin(h0 * RAD) - Math.sin(lat * RAD) * Math.sin(dec * RAD)) / (Math.cos(lat * RAD) * Math.cos(dec * RAD));
    var tr = mod(ra - lst(jd0, lon), 360) / 360.98564736629;
    if (c < -1) return { culm: tr, circumpolare: true };
    if (c > 1) return { culm: tr, maiSorge: true };
    var H0 = Math.acos(c) * DEG;
    return { culm: tr, levata: mod(tr - H0 / 360.98564736629, 1), tramonto: mod(tr + H0 / 360.98564736629, 1), H0: H0 };
  }

  /* ═══ Sole e Luna (Astronomical Almanac, bassa precisione) ════════════ */
  function sole(jd) {
    var n = jd - 2451545, L = mod(280.460 + 0.9856474 * n, 360), g = mod(357.528 + 0.9856003 * n, 360) * RAD;
    var lam = L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g), eps = 23.439 - 0.0000004 * n, R = 1.00014 - 0.01671 * Math.cos(g) - 0.00014 * Math.cos(2 * g);
    var eq = eclEq(lam, 0, eps), E = L - eq.ra; E = mod(E + 180, 360) - 180;
    return { ra: eq.ra, dec: eq.dec, lam: mod(lam, 360), R: R, eot: 4 * E, eps: eps };
  }
  function equazioneTempo(jd) { return sole(jd).eot; }
  function luna(jd) {
    var T = (jd - 2451545) / 36525, s = function (x) { return Math.sin(x * RAD); };
    var lam = 218.32 + 481267.881 * T + 6.29 * s(135.0 + 477198.87 * T) - 1.27 * s(259.3 - 413335.36 * T) + 0.66 * s(235.7 + 890534.22 * T) + 0.21 * s(269.9 + 954397.74 * T) - 0.19 * s(357.5 + 35999.05 * T) - 0.11 * s(186.5 + 966404.03 * T);
    var bet = 5.13 * s(93.3 + 483202.02 * T) + 0.28 * s(228.2 + 960400.89 * T) - 0.28 * s(318.3 + 6003.15 * T) - 0.17 * s(217.6 - 407332.21 * T);
    var eq = eclEq(mod(lam, 360), bet, obliquita(jd)), S = sole(jd);
    var el = distanzaAngolare(eq.ra, eq.dec, S.ra, S.dec), fase = (1 - Math.cos(el * RAD)) / 2;
    var cresce = mod(lam - S.lam, 360) < 180;
    return { ra: eq.ra, dec: eq.dec, lam: mod(lam, 360), bet: bet, elongazione: el, fase: fase, crescente: cresce, eta: mod(lam - S.lam, 360) / 360 * 29.530589 };
  }

  /* ═══ pianeti: elementi kepleriani approssimati del JPL (Standish), J2000, 1800–2050 ═══ */
  var ELEMENTI = {
    Mercurio: [0.38709927, 0.20563593, 7.00497902, 252.25032350, 77.45779628, 48.33076593, 0.00000037, 0.00001906, -0.00594749, 149472.67411175, 0.16047689, -0.12534081],
    Venere: [0.72333566, 0.00677672, 3.39467605, 181.97909950, 131.60246718, 76.67984255, 0.00000390, -0.00004107, -0.00078890, 58517.81538729, 0.00268329, -0.27769418],
    Terra: [1.00000261, 0.01671123, -0.00001531, 100.46457166, 102.93768193, 0.0, 0.00000562, -0.00004392, -0.01294668, 35999.37244981, 0.32327364, 0.0],
    Marte: [1.52371034, 0.09339410, 1.84969142, -4.55343205, -23.94362959, 49.55953891, 0.00001847, 0.00007882, -0.00813131, 19140.30268499, 0.44441088, -0.29257343],
    Giove: [5.20288700, 0.04838624, 1.30439695, 34.39644051, 14.72847983, 100.47390909, -0.00011607, -0.00013253, -0.00183714, 3034.74612775, 0.21252668, 0.20469106],
    Saturno: [9.53667594, 0.05386179, 2.48599187, 49.95424423, 92.59887831, 113.66242448, -0.00125060, -0.00050991, 0.00193609, 1222.49362201, -0.41897216, -0.28867794],
    Urano: [19.18916464, 0.04725744, 0.77263783, 313.23810451, 170.95427630, 74.01692503, -0.00196176, -0.00004397, -0.00242939, 428.48202785, 0.40805281, 0.04240589],
    Nettuno: [30.06992276, 0.00859048, 1.77004347, -55.12002969, 44.96476227, 131.78422574, 0.00026291, 0.00005105, 0.00035372, 218.45945325, -0.32241464, -0.00508664]
  };
  var PIANETI = [['Mercurio', 'Mercury', 0xc9b8a6], ['Venere', 'Venus', 0xfff2c8], ['Marte', 'Mars', 0xff8a5c], ['Giove', 'Jupiter', 0xffe0b0], ['Saturno', 'Saturn', 0xf2d79a], ['Urano', 'Uranus', 0xb8f0ff], ['Nettuno', 'Neptune', 0x8fb0ff]];
  function kepler(M, e) { var E = M + e * Math.sin(M); for (var k = 0; k < 30; k++) { var d = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E)); E -= d; if (Math.abs(d) < 1e-13) break; } return E; }
  function eliocentrico(nome, jd) {
    var el = ELEMENTI[nome], T = (jd - 2451545) / 36525;
    var a = el[0] + el[6] * T, e = el[1] + el[7] * T, I = (el[2] + el[8] * T) * RAD, L = el[3] + el[9] * T, w = el[4] + el[10] * T, O = (el[5] + el[11] * T) * RAD;
    var om = w * RAD - O, M = mod(L - w + 180, 360) - 180, E = kepler(M * RAD, e);
    var xp = a * (Math.cos(E) - e), yp = a * Math.sqrt(1 - e * e) * Math.sin(E);
    var co = Math.cos(om), so = Math.sin(om), cO = Math.cos(O), sO = Math.sin(O), cI = Math.cos(I), sI = Math.sin(I);
    return [(co * cO - so * sO * cI) * xp + (-so * cO - co * sO * cI) * yp, (co * sO + so * cO * cI) * xp + (-so * sO + co * cO * cI) * yp, (so * sI) * xp + (co * sI) * yp];
  }
  /* coordinate geocentriche equatoriali J2000 (gradi) e distanza (UA) */
  function pianeta(nome, jd) {
    var p = eliocentrico(nome, jd), te = eliocentrico('Terra', jd), x = p[0] - te[0], y = p[1] - te[1], z = p[2] - te[2], d = Math.sqrt(x * x + y * y + z * z);
    var lam = mod(Math.atan2(y, x) * DEG, 360), bet = Math.asin(z / d) * DEG, eq = eclEq(lam, bet, 23.43928);
    return { ra: eq.ra, dec: eq.dec, d: d, r: Math.hypot(p[0], p[1], p[2]) };
  }
  /* il Sole visto dalla Terra con gli elementi del baricentro Terra-Luna (secondo metodo) */
  function soleDaElementi(jd) { var te = eliocentrico('Terra', jd), lam = mod(Math.atan2(-te[1], -te[0]) * DEG, 360); return { lam: lam, R: Math.hypot(te[0], te[1], te[2]) }; }

  F.calcolo.cielo = {
    STELLE: STELLE, COSTELLAZIONI: COSTELLAZIONI, giuliano: giuliano, giulianoDa: giulianoDa, gmst: gmst, lst: lst, obliquita: obliquita,
    eclEq: eclEq, eqEcl: eqEcl, altAz: altAz, precedi: precedi, periodoPrecessione: periodoPrecessione, poloCeleste: poloCeleste, distanzaAngolare: distanzaAngolare, galEq: galEq,
    levataTramonto: levataTramonto, sole: sole, equazioneTempo: equazioneTempo, luna: luna, kepler: kepler, eliocentrico: eliocentrico, pianeta: pianeta, soleDaElementi: soleDaElementi
  };

  /* ═══ grafica ══════════════════════════════════════════════════════════ */
  function L3() { return globale.BSILab3D; }
  function scheda(costruisci) {
    return function (div) {
      var g = F.el('div', { 'class': 'bsiFX-griglia' }), pan = F.el('div', { 'class': 'bsiFX-pannello' }), destra = F.el('div');
      g.appendChild(pan); g.appendChild(destra); div.appendChild(g);
      var lab = L3();
      if (!lab) { pan.appendChild(F.el('div', { 'class': 'bsiFX-nota', testo: t('Serve il Laboratorio 3D (bsi-lab3d.js).', 'The 3D Laboratory (bsi-lab3d.js) is required.') })); return; }
      var attesa = F.el('div', { 'class': 'bsiFX-nota', testo: t('Caricamento del motore 3D…', 'Loading the 3D engine…') }); destra.appendChild(attesa);
      lab.stile();
      lab.caricaThree().then(function () {
        attesa.remove();
        var S = new lab.Scena(destra, 0.68);
        S.cam.near = 0.05; S.cam.far = 500; S.cam.fov = 70; S.cam.updateProjectionMatrix();
        S.ren.setClearColor(0x02050b, 1);
        div._scena = S;
        costruisci(pan, S, destra);
      }).catch(function (e) { attesa.textContent = '⚠ ' + e.message; });
    };
  }
  function nota(pan, html) { var n = F.el('div', { 'class': 'bsiFX-nota' }); if (html) n.innerHTML = html; pan.appendChild(n); return n; }
  function casella(pan, etichetta, valore, cambia) {
    var c = F.el('input', { type: 'checkbox' }); c.checked = !!valore;
    var l = F.el('label', { style: 'display:flex;align-items:center;gap:6px;margin:4px 0;font-size:.84rem;color:#cfe3f7;cursor:pointer' }, [c, F.el('span', { testo: F.tt(etichetta) })]);
    c.addEventListener('change', function () { cambia(c.checked); }); pan.appendChild(l); return c;
  }
  var bagliore = null;
  function texBagliore(T) {
    if (bagliore) return bagliore;
    var c = globale.document.createElement('canvas'); c.width = c.height = 64;
    var q = c.getContext('2d'), gr = q.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.2, 'rgba(255,255,255,.7)'); gr.addColorStop(0.5, 'rgba(255,255,255,.15)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    q.fillStyle = gr; q.fillRect(0, 0, 64, 64);
    bagliore = new T.CanvasTexture(c); return bagliore;
  }
  var BV = [[-0.35, 0.62, 0.72, 1.00], [-0.1, 0.75, 0.82, 1.00], [0.15, 0.90, 0.92, 1.00], [0.45, 1.00, 0.97, 0.92], [0.68, 1.00, 0.92, 0.80], [1.0, 1.00, 0.82, 0.62], [1.4, 1.00, 0.70, 0.45], [1.9, 1.00, 0.58, 0.35]];
  function coloreBV(bv) {
    if (bv <= BV[0][0]) return BV[0].slice(1);
    for (var i = 1; i < BV.length; i++) if (bv <= BV[i][0]) { var a = BV[i - 1], b = BV[i], u = (bv - a[0]) / (b[0] - a[0]); return [a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u, a[3] + (b[3] - a[3]) * u]; }
    return BV[BV.length - 1].slice(1);
  }
  var RCIELO = 100;
  function vettoreEq(raG, decG, r) { var a = raG * RAD, d = decG * RAD; return [r * Math.cos(d) * Math.cos(a), r * Math.cos(d) * Math.sin(a), r * Math.sin(d)]; }
  function vettoreOr(alt, az, r) { var h = alt * RAD, A = az * RAD; return [r * Math.cos(h) * Math.sin(A), r * Math.cos(h) * Math.cos(A), r * Math.sin(h)]; }
  /* matrice equatoriali (della data) → orizzontali (x = est, y = nord, z = zenit) */
  function matriceOr(T, lat, lstG) {
    var f = lat * RAD, c = Math.cos(lstG * RAD), s = Math.sin(lstG * RAD), sf = Math.sin(f), cf = Math.cos(f);
    /* v' = Rz(−LST) v ; E = v'y, N = cosφ v'z − sinφ v'x, U = sinφ v'z + cosφ v'x */
    var m = new T.Matrix4();
    m.set(-s, c, 0, 0,
      -sf * c, -sf * s, cf, 0,
      cf * c, cf * s, sf, 0,
      0, 0, 0, 1);
    return m;
  }
  /* shader delle stelle: grandezza dalla magnitudine, scintillio leggero */
  var VS = 'attribute float aMag; attribute vec3 aCol; uniform float uPx; uniform float uT; varying vec3 vC; varying float vA;' +
    'void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mv; float f = pow(10.0, -0.4 * aMag);' +
    ' float tw = 1.0 + 0.12 * sin(uT * 7.0 + position.x * 13.0 + position.y * 7.0); gl_PointSize = clamp(uPx * (3.2 + 9.0 * sqrt(f)) * tw, 2.0, 40.0);' +
    ' vC = aCol; vA = clamp(0.35 + 0.8 * sqrt(f), 0.3, 1.0); }';
  var FS = 'uniform float uLum; varying vec3 vC; varying float vA; void main(){ vec2 d = gl_PointCoord - 0.5; float r2 = dot(d,d)*4.0; if (r2 > 1.0) discard; float c = exp(-r2*6.0) + 0.5*exp(-r2*40.0); gl_FragColor = vec4(vC * c * vA * uLum, 1.0); }';
  function puntiStelle(T, lista) {
    var n = lista.length, pos = new Float32Array(3 * n), col = new Float32Array(3 * n), mag = new Float32Array(n);
    lista.forEach(function (s, i) { var v = vettoreEq(s.ra, s.dec, RCIELO * 0.98), c = coloreBV(s.bv); pos[3 * i] = v[0]; pos[3 * i + 1] = v[1]; pos[3 * i + 2] = v[2]; col[3 * i] = c[0]; col[3 * i + 1] = c[1]; col[3 * i + 2] = c[2]; mag[i] = s.mag; });
    var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('aCol', new T.BufferAttribute(col, 3)); g.setAttribute('aMag', new T.BufferAttribute(mag, 1));
    var p = new T.Points(g, new T.ShaderMaterial({ uniforms: { uPx: { value: 1 }, uT: { value: 0 }, uLum: { value: 1 } }, vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false, depthTest: false, blending: T.AdditiveBlending }));
    p.frustumCulled = false; p.renderOrder = 3; return p;
  }
  function viaLattea(T, anni) {
    var rnd = mulberry32(11), n = 9000, pos = new Float32Array(3 * n), col = new Float32Array(3 * n);
    for (var i = 0; i < n; i++) {
      var l = rnd() * 360, w = Math.exp(-Math.pow(Math.min(Math.abs(mod(l + 180, 360) - 180), 180) / 70, 2));
      if (rnd() > 0.35 + 0.65 * w) { l = mod(gauss(rnd) * 40, 360); }
      var b = gauss(rnd) * (2.5 + 5 * Math.exp(-Math.pow((mod(l + 180, 360) - 180) / 30, 2))), e = galEq(l, b);
      if (anni) e = precedi(e.ra, e.dec, anni);
      var v = vettoreEq(e.ra, e.dec, RCIELO * 0.99), k = 0.05 + 0.06 * rnd();
      pos[3 * i] = v[0]; pos[3 * i + 1] = v[1]; pos[3 * i + 2] = v[2]; col[3 * i] = k * 0.9; col[3 * i + 1] = k * 0.95; col[3 * i + 2] = k * 1.1;
    }
    var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('color', new T.BufferAttribute(col, 3));
    var p = new T.Points(g, new T.PointsMaterial({ size: 9, sizeAttenuation: false, map: texBagliore(T), vertexColors: true, transparent: true, depthWrite: false, depthTest: false, blending: T.AdditiveBlending }));
    p.frustumCulled = false; p.renderOrder = 1; return p;
  }
  function etichetta(T, s, col, alt) { var e = L3().testo3d(T, s, col, alt); e.renderOrder = 12; return e; }
  /* la Luna con la fase, disegnata su una tela */
  function teleLuna(fase, crescente) {
    var c = globale.document.createElement('canvas'); c.width = c.height = 64; var q = c.getContext('2d');
    q.fillStyle = 'rgba(60,60,70,0.9)'; q.beginPath(); q.arc(32, 32, 28, 0, 7); q.fill();
    q.fillStyle = '#f2efe4'; q.beginPath();
    var k = 1 - 2 * fase; /* terminatore: ellisse di semiasse 28·|k| */
    q.arc(32, 32, 28, -Math.PI / 2, Math.PI / 2, !crescente);
    q.ellipse(32, 32, 28 * Math.abs(k), 28, 0, Math.PI / 2, -Math.PI / 2, crescente ? k > 0 : k < 0);
    q.fill();
    return c;
  }
  function oraLocale(ms) { try { return new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); } catch (e) { return new Date(ms).toISOString().slice(11, 16); } }
  function oraUT(ms) { return new Date(ms).toISOString().slice(11, 16) + ' UT'; }
  function dataISO(ms) { var d = new Date(ms - new Date(ms).getTimezoneOffset() * 60000); return d.toISOString().slice(0, 16); }
  function puntoCardinale(az) { var n = [t('N', 'N'), t('NE', 'NE'), t('E', 'E'), t('SE', 'SE'), t('S', 'S'), t('SO', 'SW'), t('O', 'W'), t('NO', 'NW')]; return n[Math.round(mod(az, 360) / 45) % 8]; }

  /* ─── il motore del planetario: usato dalle schede 1 e 2 ──────────────── */
  function planetario(pan, S, destra, modo) {
    var T = S.T, st = { lat: 41.12, lon: 16.87, ms: Date.now(), vel: 1, pausa: false, linee: true, nomi: true, griglia: modo === 'coord', eqGriglia: modo === 'coord', vl: true, scelta: null, fov: 70 };
    var info = nota(pan), dettagli = nota(pan);
    var luoghiSel = F.scelta(pan, ['Luogo', 'Place'], LUOGHI.map(function (l) { return [l[0], l[1] + ' (' + l[2].toFixed(2) + '°, ' + l[3].toFixed(2) + '°)']; }), 'bari', function (v) { var l = LUOGHI.filter(function (x) { return x[0] === v; })[0]; st.lat = l[2]; st.lon = l[3]; cLat.value = st.lat; cLat.dispatchEvent(new Event('input')); cLon.value = st.lon; cLon.dispatchEvent(new Event('input')); aggiorna(true); });
    var cLat = F.cursore(pan, ['Latitudine (°)', 'Latitude (°)'], -89.9, 89.9, 0.01, st.lat, function (v) { st.lat = v; aggiorna(true); }, function (v) { return v.toFixed(2); });
    var cLon = F.cursore(pan, ['Longitudine (° est)', 'Longitude (° east)'], -180, 180, 0.01, st.lon, function (v) { st.lon = v; aggiorna(true); }, function (v) { return v.toFixed(2); });
    var dataIn = F.el('input', { type: 'datetime-local', 'aria-label': t('Data e ora', 'Date and time'), style: 'width:100%;background:#081522;color:#e6fffb;border:1px solid #1a3050;border-radius:7px;padding:6px 8px;font-size:.85rem;box-sizing:border-box' });
    dataIn.value = dataISO(st.ms);
    dataIn.addEventListener('change', function () { var v = Date.parse(dataIn.value); if (isFinite(v)) { st.ms = v; aggiorna(true); } });
    pan.appendChild(F.el('div', { 'class': 'bsiFX-cursore' }, [F.el('label', null, [F.el('span', { testo: t('Data e ora locali', 'Local date and time') })]), dataIn]));
    var riga = F.el('div', { 'class': 'bsiFX-anim', role: 'group', 'aria-label': t('Scorrere del tempo', 'Flow of time') });
    var bp = F.el('button', { type: 'button' });
    function aggBp() { bp.textContent = st.pausa ? '▶' : '❚❚'; var n = st.pausa ? t('Avvia', 'Play') : t('Pausa', 'Pause'); bp.title = n; bp.setAttribute('aria-label', n); }
    bp.addEventListener('click', function () { st.pausa = !st.pausa; aggBp(); S.avvia(); }); riga.appendChild(bp); aggBp();
    var VEL = [[1, t('tempo reale', 'real time'), '×1'], [60, t('1 min/s', '1 min/s'), '1m'], [600, t('10 min/s', '10 min/s'), '10m'], [3600, t('1 h/s', '1 h/s'), '1h'], [86164.09, t('1 giorno siderale/s', '1 sidereal day/s'), '1d'], [-3600, t('indietro 1 h/s', 'backwards 1 h/s'), '−1h']];
    var bv = [];
    VEL.forEach(function (v) { var b = F.el('button', { type: 'button', testo: v[2], title: v[1], 'aria-label': v[1], onclick: function () { st.vel = v[0]; bv.forEach(function (x) { x[1].setAttribute('aria-pressed', String(x[0] === v[0])); }); S.avvia(); } }); b.setAttribute('aria-pressed', String(v[0] === st.vel)); bv.push([v[0], b]); riga.appendChild(b); });
    pan.appendChild(riga);
    F.bottone(pan, ['Adesso', 'Now'], function () { st.ms = Date.now(); aggiorna(true); });
    var vis = F.el('div'); pan.appendChild(vis);
    ['S', 'E', 'N', 'O'].forEach(function (c, k) { F.bottone(vis, [t('Guarda a ', 'Look ') + ['S', 'E', 'N', t('O', 'W')][k], t('Guarda a ', 'Look ') + ['S', 'E', 'N', 'W'][k]], function () { guarda([180, 90, 0, 270][k], 25); }); });
    F.bottone(vis, ['Zenit', 'Zenith'], function () { guarda(180, 85); });
    casella(pan, ['Linee delle costellazioni', 'Constellation lines'], st.linee, function (v) { st.linee = v; costellazioni.visible = v; S.sporca = true; S.avvia(); });
    casella(pan, ['Nomi', 'Names'], st.nomi, function (v) { st.nomi = v; nomi.visible = v; S.sporca = true; S.avvia(); });
    casella(pan, ['Griglia altazimutale', 'Alt-azimuth grid'], st.griglia, function (v) { st.griglia = v; grigliaOr.visible = v; S.sporca = true; S.avvia(); });
    casella(pan, ['Griglia equatoriale ed eclittica', 'Equatorial grid and ecliptic'], st.eqGriglia, function (v) { st.eqGriglia = v; grigliaEq.visible = v; S.sporca = true; S.avvia(); });
    casella(pan, ['Via Lattea', 'Milky Way'], st.vl, function (v) { st.vl = v; vlat.visible = v; S.sporca = true; S.avvia(); });
    if (modo === 'coord') nota(pan, t('<b>Fai clic su una stella</b> (o su un pianeta, il Sole, la Luna) per le sue coordinate. Sistema equatoriale: ascensione retta α (ore, lungo l’equatore celeste dal punto vernale) e declinazione δ; sistema orizzontale: altezza h e azimut A (da nord verso est). Legame: sin h = sin φ sin δ + cos φ cos δ cos H, con l’angolo orario H = TSL − α e il tempo siderale locale TSL = GMST + λ. Una stella culmina quando H = 0, all’altezza 90° − |φ − δ|; sorge e tramonta quando h = h₀ = −0,567° (la rifrazione solleva l’orizzonte di ~34′): cos H₀ = (sin h₀ − sin φ sin δ)/(cos φ cos δ). Se il secondo membro è < −1 la stella è circumpolare (a Bari δ > +48,3°), se è > 1 non sorge mai (δ < −49,4°). Le stelle anticipano di 3 min 56 s al giorno: il giorno siderale dura 23 h 56 min 4 s.', '<b>Click a star</b> (or a planet, the Sun, the Moon) for its coordinates. Equatorial system: right ascension α (hours, along the celestial equator from the vernal point) and declination δ; horizontal system: altitude h and azimuth A (from north through east). Link: sin h = sin φ sin δ + cos φ cos δ cos H, with hour angle H = LST − α and local sidereal time LST = GMST + λ. A star culminates at H = 0, at altitude 90° − |φ − δ|; it rises and sets when h = h₀ = −0.567° (refraction lifts the horizon by ~34′): cos H₀ = (sin h₀ − sin φ sin δ)/(cos φ cos δ). If the right side is < −1 the star is circumpolar (at Bari δ > +48.3°), if > 1 it never rises (δ < −49.4°). Stars gain 3 min 56 s per day: a sidereal day lasts 23 h 56 min 4 s.'));
    else nota(pan, t('Sei al centro della sfera celeste: trascina per guardarti intorno, la rotellina o due dita stringono il campo visivo. Le stelle sono fissate in coordinate equatoriali (α, δ); la Terra che ruota le fa girare attorno al polo celeste, che sta a un’altezza pari alla latitudine (vicino c’è la Polare). La trasformazione in altezza e azimut è una sola rotazione: prima di −TSL attorno all’asse del polo (il tempo siderale locale), poi di 90° − φ attorno all’asse est-ovest. I pianeti sono calcolati dagli elementi kepleriani del JPL risolvendo l’equazione di Keplero M = E − e sin E; Sole e Luna con le serie a bassa precisione dell’Astronomical Almanac (≈ 0,01° e 0,3°). La fase della Luna è la frazione illuminata k = (1 − cos ψ)/2, ψ l’elongazione dal Sole. Le magnitudini m danno il flusso 10^(−0,4 m); il colore viene da B − V.', 'You are at the centre of the celestial sphere: drag to look around, the wheel or two fingers narrow the field of view. Stars are fixed in equatorial coordinates (α, δ); the rotating Earth turns them around the celestial pole, which stands at an altitude equal to the latitude (Polaris is close by). The transformation to altitude and azimuth is one rotation: first by −LST about the pole axis (local sidereal time), then by 90° − φ about the east-west axis. Planets are computed from JPL Keplerian elements by solving Kepler’s equation M = E − e sin E; Sun and Moon from the low-precision series of the Astronomical Almanac (≈ 0.01° and 0.3°). The Moon’s phase is the illuminated fraction k = (1 − cos ψ)/2, ψ the elongation from the Sun. Magnitudes m give the flux 10^(−0.4 m); colour comes from B − V.'));
    /* oggetti */
    var cielo = new T.Group(); cielo.matrixAutoUpdate = false; S.aggiungi(cielo);
    var anni = 0; /* precessione J2000 → data: si aggiorna con la data */
    var lista = STELLE.map(function (s) { return { nome: F.tt([s[0], s[1]]), ra: s[2] * 15, dec: s[3], mag: s[4], bv: s[5], ra0: s[2] * 15, dec0: s[3] }; });
    var stelle = puntiStelle(T, lista); cielo.add(stelle);
    var vlat = viaLattea(T, 0); cielo.add(vlat);
    var costellazioni = new T.Group(), nomi = new T.Group(), grigliaEq = new T.Group(), grigliaOr = new T.Group();
    cielo.add(costellazioni); cielo.add(nomi); cielo.add(grigliaEq); S.aggiungi(grigliaOr);
    grigliaOr.visible = st.griglia; grigliaEq.visible = st.eqGriglia;
    function lineaSfera(pts, col, opac) { var L = L3().linea(T, pts, col, opac); L.material.depthTest = false; L.renderOrder = 2; return L; }
    function costruisciLinee() {
      while (costellazioni.children.length) { var o = costellazioni.children.pop(); o.geometry.dispose(); o.material.dispose(); }
      COSTELLAZIONI.forEach(function (c) {
        var cen = [0, 0, 0], n = 0;
        c[1].forEach(function (sp) {
          var pts = []; sp.forEach(function (k) { var s = lista[IDX[k]]; if (!s) return; var v = vettoreEq(s.ra, s.dec, RCIELO * 0.97); pts.push(v); cen[0] += v[0]; cen[1] += v[1]; cen[2] += v[2]; n++; });
          /* archi suddivisi, cosi' le linee lunghe seguono la sfera */
          var fini = []; for (var i = 0; i < pts.length - 1; i++) for (var u = 0; u < 8; u++) { var a = pts[i], b = pts[i + 1], f = u / 8, x = a[0] + (b[0] - a[0]) * f, y = a[1] + (b[1] - a[1]) * f, z = a[2] + (b[2] - a[2]) * f, r = RCIELO * 0.97 / Math.hypot(x, y, z); fini.push([x * r, y * r, z * r]); }
          if (pts.length) fini.push(pts[pts.length - 1]);
          costellazioni.add(lineaSfera(fini, 0x5f8fbf, 0.55));
        });
        if (n) { var r = RCIELO * 0.93 / Math.hypot(cen[0], cen[1], cen[2]); var e = etichetta(T, F.tt(c[0]).split(' (')[0], '#7fa6cc', 3.6); e.position.set(cen[0] * r, cen[1] * r, cen[2] * r); costellazioni.add(e); }
      });
    }
    function costruisciNomi() {
      while (nomi.children.length) { var o = nomi.children.pop(); if (o.material.map) o.material.map.dispose(); o.material.dispose(); }
      lista.forEach(function (s) { if (s.mag > 1.6 && s.nome !== 'Polare' && s.nome !== 'Polaris' && s.nome !== 'Thuban') return; var v = vettoreEq(s.ra, s.dec, RCIELO * 0.96), e = etichetta(T, s.nome, '#cfe3f7', 3.0); e.position.set(v[0], v[1], v[2] - 3); nomi.add(e); });
    }
    /* griglia equatoriale + eclittica */
    for (var d = -60; d <= 60; d += 30) { var p = []; for (var a = 0; a <= 360; a += 5) p.push(vettoreEq(a, d, RCIELO * 0.985)); grigliaEq.add(lineaSfera(p, d ? 0x2a5a4a : 0x5eead4, d ? 0.35 : 0.6)); }
    for (var h = 0; h < 24; h += 2) { var pm = []; for (var dd = -85; dd <= 85; dd += 5) pm.push(vettoreEq(h * 15, dd, RCIELO * 0.985)); grigliaEq.add(lineaSfera(pm, 0x2a5a4a, 0.3)); }
    var ecl = []; for (var l = 0; l <= 360; l += 4) { var e = eclEq(l, 0, 23.4393); ecl.push(vettoreEq(e.ra, e.dec, RCIELO * 0.985)); } grigliaEq.add(lineaSfera(ecl, 0xffd24a, 0.5));
    var eEcl = etichetta(T, t('eclittica', 'ecliptic'), '#ffd24a', 2.2); var ve = eclEq(100, 0, 23.4393), vv = vettoreEq(ve.ra, ve.dec, RCIELO * 0.95); eEcl.position.set(vv[0], vv[1], vv[2]); grigliaEq.add(eEcl);
    /* griglia altazimutale */
    for (var hh = 15; hh <= 75; hh += 15) { var pc = []; for (var az = 0; az <= 360; az += 5) pc.push(vettoreOr(hh, az, RCIELO * 0.985)); grigliaOr.add(lineaSfera(pc, 0x6b5a2a, 0.35)); }
    for (var aa = 0; aa < 360; aa += 30) { var pv = []; for (var h2 = 0; h2 <= 88; h2 += 4) pv.push(vettoreOr(h2, aa, RCIELO * 0.985)); grigliaOr.add(lineaSfera(pv, 0x6b5a2a, 0.3)); }
    /* orizzonte: il suolo e i punti cardinali */
    var suolo = new T.Mesh(new T.SphereGeometry(RCIELO * 0.9, 48, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new T.MeshBasicMaterial({ color: 0x0b1410, side: T.BackSide, transparent: true, opacity: 0.93, depthWrite: false }));
    suolo.rotation.x = Math.PI / 2; suolo.renderOrder = 20; S.aggiungi(suolo);
    var orz = []; for (var k = 0; k <= 360; k += 2) orz.push(vettoreOr(0, k, RCIELO * 0.89)); var lOr = L3().linea(T, orz, 0x5eead4, 0.8); lOr.renderOrder = 21; lOr.material.depthTest = false; S.aggiungi(lOr);
    [['N', 0], ['E', 90], ['S', 180], [t('O', 'W'), 270], ['NE', 45], ['SE', 135], [t('SO', 'SW'), 225], [t('NO', 'NW'), 315]].forEach(function (c) { var v = vettoreOr(2, c[1], RCIELO * 0.85), e = etichetta(T, c[0], c[0].length === 1 ? '#5eead4' : '#3e8f86', c[0].length === 1 ? 5 : 3.4); e.position.set(v[0], v[1], v[2]); e.renderOrder = 22; S.aggiungi(e); });
    /* Sole, Luna, pianeti */
    var spSole = new T.Sprite(new T.SpriteMaterial({ map: texBagliore(T), color: 0xfff3c0, transparent: true, depthWrite: false, depthTest: false, blending: T.AdditiveBlending })); spSole.scale.set(14, 14, 1); spSole.renderOrder = 5; S.aggiungi(spSole);
    var texL = new T.CanvasTexture(teleLuna(0.5, true)), spLuna = new T.Sprite(new T.SpriteMaterial({ map: texL, transparent: true, depthWrite: false, depthTest: false })); spLuna.scale.set(6.5, 6.5, 1); spLuna.renderOrder = 6; S.aggiungi(spLuna);
    var etSole = etichetta(T, t('Sole', 'Sun'), '#ffe27a', 3.2), etLuna = etichetta(T, t('Luna', 'Moon'), '#f2efe4', 3.0); S.aggiungi(etSole); S.aggiungi(etLuna);
    var spPian = PIANETI.map(function (p) { var s = new T.Sprite(new T.SpriteMaterial({ map: texBagliore(T), color: p[2], transparent: true, depthWrite: false, depthTest: false, blending: T.AdditiveBlending })); s.scale.set(4.5, 4.5, 1); s.renderOrder = 5; S.aggiungi(s); var e = etichetta(T, F.tt([p[0], p[1]]), '#' + p[2].toString(16), 3.0); S.aggiungi(e); return { s: s, e: e, nome: p[0], nomeT: F.tt([p[0], p[1]]) }; });
    var mira = new T.Mesh(new T.RingGeometry(2.2, 2.6, 40), new T.MeshBasicMaterial({ color: 0xff6b6b, side: T.DoubleSide, transparent: true, depthTest: false })); mira.renderOrder = 11; mira.visible = false; S.aggiungi(mira);
    var corpi = {}, ultimaFaseLuna = -1, oggetti = [];
    function posOr(ra, dec, lstG) { var o = altAz(ra, dec, st.lat, lstG); return { o: o, v: vettoreOr(o.alt, o.az, RCIELO * 0.95) }; }
    function aggiorna(salta) {
      var jd = giulianoDa(st.ms), L = lst(jd, st.lon), nuoviAnni = (jd - 2451545) / 365.25;
      if (salta || Math.abs(nuoviAnni - anni) > 0.5) {
        anni = nuoviAnni;
        lista.forEach(function (s) { var p = precedi(s.ra0, s.dec0, anni); s.ra = p.ra; s.dec = p.dec; });
        var at = stelle.geometry.attributes.position; lista.forEach(function (s, i) { var v = vettoreEq(s.ra, s.dec, RCIELO * 0.98); at.setXYZ(i, v[0], v[1], v[2]); }); at.needsUpdate = true;
        costruisciLinee(); costruisciNomi();
        dataIn.value = dataISO(st.ms);
      }
      cielo.matrix.copy(matriceOr(T, st.lat, L)); cielo.matrixWorldNeedsUpdate = true;
      /* Sole e Luna (della data), pianeti (J2000 → data) */
      var So = sole(jd), Lu = luna(jd), ps = posOr(So.ra, So.dec, L), pl = posOr(Lu.ra, Lu.dec, L);
      spSole.position.set(ps.v[0], ps.v[1], ps.v[2]); etSole.position.set(ps.v[0], ps.v[1], ps.v[2] - 5);
      spLuna.position.set(pl.v[0], pl.v[1], pl.v[2]); etLuna.position.set(pl.v[0], pl.v[1], pl.v[2] - 3.6);
      if (Math.abs(Lu.fase - ultimaFaseLuna) > 0.01) { ultimaFaseLuna = Lu.fase; texL.image = teleLuna(Lu.fase, Lu.crescente); texL.needsUpdate = true; }
      corpi = { sole: { nome: t('Sole', 'Sun'), ra: So.ra, dec: So.dec, o: ps.o, extra: 'R = ' + So.R.toFixed(4) + t(' UA; equazione del tempo ', ' AU; equation of time ') + So.eot.toFixed(1) + ' min' }, luna: { nome: t('Luna', 'Moon'), ra: Lu.ra, dec: Lu.dec, o: pl.o, extra: t('fase ', 'phase ') + Math.round(Lu.fase * 100) + ' %, ' + t('età ', 'age ') + Lu.eta.toFixed(1) + t(' giorni', ' days') } };
      spPian.forEach(function (P) { var g = pianeta(P.nome, jd), pp = precedi(g.ra, g.dec, anni), po = posOr(pp.ra, pp.dec, L); P.s.position.set(po.v[0], po.v[1], po.v[2]); P.e.position.set(po.v[0], po.v[1], po.v[2] - 2.6); corpi[P.nome] = { nome: P.nomeT, ra: pp.ra, dec: pp.dec, o: po.o, extra: t('distanza ', 'distance ') + g.d.toFixed(3) + t(' UA', ' AU') }; });
      /* il cielo di giorno */
      var hs = ps.o.alt, f = Math.max(0, Math.min(1, (hs + 12) / 18));
      var cielo1 = [0.008 + 0.12 * f * f, 0.02 + 0.30 * f * f, 0.043 + 0.55 * f * f];
      S.ren.setClearColor(new T.Color(cielo1[0], cielo1[1], cielo1[2]), 1);
      stelle.material.uniforms.uLum.value = 1 - 0.85 * f; vlat.visible = st.vl && f < 0.3;
      testo(jd, L, So, Lu);
      if (st.scelta) mostraScelta();
      S.sporca = true;
    }
    function testo(jd, L, So, Lu) {
      var d = new Date(st.ms), pol = altAz(lista[IDX['Polare']].ra, lista[IDX['Polare']].dec, st.lat, L);
      var su = Object.keys(corpi).filter(function (k) { return corpi[k].o.alt > 0 && k !== 'sole' && k !== 'luna'; }).map(function (k) { return corpi[k].nome; });
      info.innerHTML = '<b>' + d.toLocaleDateString() + ' ' + oraLocale(st.ms) + '</b> (' + oraUT(st.ms) + ')<br>JD ' + jd.toFixed(4) + t(', tempo siderale locale ', ', local sidereal time ') + '<b>' + fmtOre(L / 15) + '</b><br>' +
        t('Sole: altezza ', 'Sun: altitude ') + corpi.sole.o.alt.toFixed(1) + '°, ' + t('Luna: ', 'Moon: ') + corpi.luna.o.alt.toFixed(1) + '° (' + t('illuminata al ', 'illuminated ') + Math.round(Lu.fase * 100) + ' %, ' + (Lu.crescente ? t('crescente', 'waxing') : t('calante', 'waning')) + ')<br>' +
        t('Pianeti sopra l’orizzonte: ', 'Planets above the horizon: ') + (su.length ? su.join(', ') : t('nessuno', 'none')) + '<br>' + t('Polare a ', 'Polaris at ') + pol.alt.toFixed(2) + '° (' + t('latitudine ', 'latitude ') + st.lat.toFixed(2) + '°)';
      S.didascalia.textContent = t('Cielo da ', 'Sky from ') + st.lat.toFixed(2) + '°, ' + st.lon.toFixed(2) + '° — ' + d.toLocaleString();
    }
    function fmtOre(h) { h = mod(h, 24); var H = Math.floor(h), m = Math.floor((h - H) * 60), s = Math.round(((h - H) * 60 - m) * 60); if (s === 60) { s = 0; m++; } if (m === 60) { m = 0; H = (H + 1) % 24; } return H + 'h ' + (m < 10 ? '0' : '') + m + 'm ' + (s < 10 ? '0' : '') + s + 's'; }
    function fmtGradi(g) { var s = g < 0 ? '−' : '+', a = Math.abs(g), D = Math.floor(a), m = Math.round((a - D) * 60); if (m === 60) { m = 0; D++; } return s + D + '° ' + (m < 10 ? '0' : '') + m + '′'; }
    function mostraScelta() {
      var s = st.scelta, jd = giulianoDa(st.ms), L = lst(jd, st.lon), o = altAz(s.ra, s.dec, st.lat, L), v = vettoreOr(o.alt, o.az, RCIELO * 0.95);
      mira.position.set(v[0], v[1], v[2]); mira.lookAt(0, 0, 0); mira.visible = true;
      var d0 = new Date(st.ms); d0.setHours(0, 0, 0, 0); var jd0 = giulianoDa(d0.getTime()), lt = levataTramonto(s.ra, s.dec, st.lat, st.lon, jd0);
      var ore = function (fr) { var ms = d0.getTime() + fr * 86400000; return oraLocale(ms); };
      var hmax = 90 - Math.abs(st.lat - s.dec);
      dettagli.innerHTML = '<b>' + s.nome + '</b>' + (s.mag != null ? ' (m = ' + s.mag.toFixed(2) + ', B − V = ' + s.bv.toFixed(2) + ')' : '') + '<br>α = ' + fmtOre(s.ra / 15) + ', δ = ' + fmtGradi(s.dec) + t(' (della data)', ' (of date)') + '<br>' +
        'h = ' + o.alt.toFixed(2) + '°, A = ' + o.az.toFixed(2) + '° (' + puntoCardinale(o.az) + '), H = ' + fmtOre(o.H) + '<br>' +
        (lt.circumpolare ? t('Circumpolare: non tramonta mai. ', 'Circumpolar: never sets. ') : lt.maiSorge ? t('Da qui non sorge mai. ', 'Never rises from here. ') : t('Sorge ', 'Rises ') + ore(lt.levata) + ' (A = ' + (Math.acos(Math.max(-1, Math.min(1, Math.sin(s.dec * RAD) / Math.cos(st.lat * RAD)))) * DEG).toFixed(0) + '°), ' + t('tramonta ', 'sets ') + ore(lt.tramonto) + ', ') + t('culmina ', 'culminates ') + ore(lt.culm) + t(' a h = ', ' at h = ') + hmax.toFixed(1) + '°' + (s.extra ? '<br>' + s.extra : '');
    }
    /* clic: la stella piu' vicina sullo schermo */
    var giu = null;
    S.ren.domElement.addEventListener('pointerdown', function (e) { giu = [e.clientX, e.clientY]; });
    S.ren.domElement.addEventListener('pointerup', function (e) {
      if (!giu || Math.hypot(e.clientX - giu[0], e.clientY - giu[1]) > 5) return;
      var r = S.ren.domElement.getBoundingClientRect(), mx = e.clientX - r.left, my = e.clientY - r.top, best = null, bd = 22;
      var jd = giulianoDa(st.ms), L = lst(jd, st.lon), V = new T.Vector3();
      var cand = lista.map(function (s) { return { nome: s.nome, ra: s.ra, dec: s.dec, mag: s.mag, bv: s.bv }; });
      Object.keys(corpi).forEach(function (k) { cand.push({ nome: corpi[k].nome, ra: corpi[k].ra, dec: corpi[k].dec, extra: corpi[k].extra }); });
      cand.forEach(function (s) {
        var o = altAz(s.ra, s.dec, st.lat, L), v = vettoreOr(o.alt, o.az, RCIELO * 0.95); V.set(v[0], v[1], v[2]).project(S.cam);
        if (V.z > 1) return; var x = (V.x + 1) / 2 * r.width, y = (1 - V.y) / 2 * r.height, dd = Math.hypot(x - mx, y - my);
        if (dd < bd) { bd = dd; best = s; }
      });
      if (best) { st.scelta = best; mostraScelta(); S.sporca = true; S.avvia(); }
    });
    function guarda(az, alt) { S.vista.th = Math.atan2(-Math.cos(az * RAD), -Math.sin(az * RAD)); S.vista.ph = Math.PI / 2 + alt * RAD; if (S.vista.ph > Math.PI - 0.05) S.vista.ph = Math.PI - 0.05; S.vista.r = 0.5; S.sporca = true; S.avvia(); }
    /* la Scena gira attorno al centro: con r piccolo equivale a guardarsi intorno; la rotellina diventa il campo visivo */
    var ultimoR = 0.5;
    S.ogniFotogramma(function (dt) {
      if (Math.abs(S.vista.r - 0.5) > 1e-6) { st.fov = Math.max(15, Math.min(110, st.fov * S.vista.r / ultimoR)); S.vista.r = 0.5; S.cam.fov = st.fov; S.cam.updateProjectionMatrix(); }
      ultimoR = 0.5;
      stelle.material.uniforms.uPx.value = S.ren.domElement.height / 520 * Math.pow(70 / st.fov, 0.5);
      stelle.material.uniforms.uT.value += dt;
      if (st.pausa) return false;
      st.ms += dt * 1000 * st.vel;
      aggiorna(false);
      return true;
    });
    S.inquadra(0.5);
    guarda(180, 25);
    aggiorna(true);
    return st;
  }
  function schedaCielo(pan, S, destra) { planetario(pan, S, destra, 'cielo'); }
  function schedaCoordinate(pan, S, destra) { var st = planetario(pan, S, destra, 'coord'); st.pausa = false; st.scelta = null; }

  /* ─── scheda 3: la precessione ────────────────────────────────────────── */
  function schedaPrecessione(pan, S, destra) {
    var T = S.T, st = { anno: 2000, vel: 400, pausa: false };
    var info = nota(pan);
    var cA = F.cursore(pan, ['Anno', 'Year'], -13000, 14000, 50, st.anno, function (v) { st.anno = v; aggiorna(); }, function (v) { return v < 0 ? (-v) + t(' a.C.', ' BC') : v + t(' d.C.', ' AD'); });
    var riga = F.el('div', { 'class': 'bsiFX-anim', role: 'group', 'aria-label': t('Controlli del tempo', 'Time controls') });
    var bp = F.el('button', { type: 'button', onclick: function () { st.pausa = !st.pausa; bp.textContent = st.pausa ? '▶' : '❚❚'; S.avvia(); } }); bp.textContent = '❚❚'; bp.setAttribute('aria-label', t('Pausa / avvia', 'Pause / play')); riga.appendChild(bp);
    [[100, '100'], [400, '400'], [1500, '1500']].forEach(function (v) { riga.appendChild(F.el('button', { type: 'button', testo: v[1] + t(' anni/s', ' yr/s'), onclick: function () { st.vel = v[0]; } })); });
    pan.appendChild(riga);
    nota(pan, t('Il rigonfiamento equatoriale della Terra, tirato dalla Luna e dal Sole, subisce una coppia che fa precedere l’asse di rotazione come una trottola: il polo celeste descrive un cerchio di raggio ε ≈ 23,44° attorno al polo dell’eclittica, a 50,29″ all’anno, cioè un giro in 360°/50,29″ ≈ 25 770 anni. Oggi il polo è a 0,7° dalla Polare (il minimo, 0,45°, verso il 2100); circa 2800 a.C. era vicino a Thuban (α Draconis), la stella polare degli Egizi; fra ~12 000 anni sarà a ~5° da Vega. Il punto vernale scivola lungo l’eclittica di 1° ogni 72 anni: per questo i segni zodiacali non coincidono più con le costellazioni. (Modello semplice: eclittica fissa e velocità costante; si trascurano i moti propri delle stelle, la nutazione e la variazione dell’obliquità.)', 'The Earth’s equatorial bulge, pulled by the Moon and the Sun, feels a torque that makes the spin axis precess like a top: the celestial pole traces a circle of radius ε ≈ 23.44° around the ecliptic pole at 50.29″ per year, i.e. one turn in 360°/50.29″ ≈ 25,770 years. Today the pole is 0.7° from Polaris (minimum 0.45° around 2100); around 2800 BC it was near Thuban (α Draconis), the Egyptians’ pole star; in ~12,000 years it will be ~5° from Vega. The vernal point slides along the ecliptic by 1° every 72 years: that is why the zodiac signs no longer match the constellations. (Simple model: fixed ecliptic and constant rate; stellar proper motions, nutation and the change in obliquity are neglected.)'));
    var cv = F.tela(destra, 0.42);
    /* la vista: guardiamo il polo dell'eclittica dall'interno della sfera (coordinate equatoriali J2000) */
    var gr = new T.Group(); S.aggiungi(gr);
    var lista = STELLE.map(function (s) { return { nome: F.tt([s[0], s[1]]), ra: s[2] * 15, dec: s[3], mag: s[4], bv: s[5] }; });
    gr.add(puntiStelle(T, lista)); gr.add(viaLattea(T, 0));
    var fili = new T.Group(); gr.add(fili);
    COSTELLAZIONI.forEach(function (c) { c[1].forEach(function (sp) { var pts = []; sp.forEach(function (k) { var s = lista[IDX[k]]; pts.push(vettoreEq(s.ra, s.dec, RCIELO * 0.97)); }); var L = L3().linea(T, pts, 0x5f8fbf, 0.45); L.material.depthTest = false; fili.add(L); }); });
    ['Polare', 'Vega', 'Thuban', 'Deneb', 'Alderamin', 'Kochab', 'Eltanin', 'Dubhe', 'Capella', 'Arturo', 'Schedar'].forEach(function (k) { var s = lista[IDX[k]]; if (!s) return; var v = vettoreEq(s.ra, s.dec, RCIELO * 0.95), e = etichetta(T, s.nome, '#cfe3f7', 2.4); e.position.set(v[0], v[1], v[2] - 2.5); gr.add(e); });
    /* il cerchio della precessione con gli anni */
    var cer = []; for (var y = -13000; y <= 14000; y += 100) { var p = poloCeleste(y); cer.push(vettoreEq(p.ra, p.dec, RCIELO * 0.97)); }
    var lc = L3().linea(T, cer, 0xffd24a, 0.8); lc.material.depthTest = false; gr.add(lc);
    [-12000, -8000, -4000, -2800, 0, 2000, 4000, 8000, 12000].forEach(function (y) { var p = poloCeleste(y), v = vettoreEq(p.ra, p.dec, RCIELO * 0.95), e = etichetta(T, y < 0 ? (-y) + t(' a.C.', ' BC') : String(y), '#ffd24a', 2.0); e.position.set(v[0], v[1], v[2] + 2); gr.add(e); });
    var pe = eclEq(0, 90, 23.4393), ve = vettoreEq(pe.ra, pe.dec, RCIELO * 0.95), sp = new T.Sprite(new T.SpriteMaterial({ map: texBagliore(T), color: 0xffd24a, transparent: true, depthTest: false, blending: T.AdditiveBlending })); sp.scale.set(3, 3, 1); sp.position.set(ve[0], ve[1], ve[2]); gr.add(sp);
    var ep = etichetta(T, t('polo dell’eclittica', 'ecliptic pole'), '#ffd24a', 2.2); ep.position.set(ve[0], ve[1], ve[2] - 3); gr.add(ep);
    var polo = new T.Sprite(new T.SpriteMaterial({ map: texBagliore(T), color: 0xff6b6b, transparent: true, depthTest: false, blending: T.AdditiveBlending })); polo.scale.set(6, 6, 1); polo.renderOrder = 9; gr.add(polo);
    var etP = etichetta(T, t('polo nord celeste', 'north celestial pole'), '#ff8a80', 2.4); gr.add(etP);
    /* l'equatore celeste dell'anno scelto */
    var equat = null;
    function aggiorna() {
      var p = poloCeleste(st.anno), v = vettoreEq(p.ra, p.dec, RCIELO * 0.95);
      polo.position.set(v[0], v[1], v[2]); etP.position.set(v[0], v[1], v[2] + 3.4);
      if (equat) { gr.remove(equat); equat.geometry.dispose(); }
      var pts = [], P = new T.Vector3(v[0], v[1], v[2]).normalize(), U = new T.Vector3(0, 0, 1).cross(P).normalize(), W = P.clone().cross(U);
      for (var k = 0; k <= 120; k++) { var a = 2 * Math.PI * k / 120; pts.push([(U.x * Math.cos(a) + W.x * Math.sin(a)) * RCIELO * 0.97, (U.y * Math.cos(a) + W.y * Math.sin(a)) * RCIELO * 0.97, (U.z * Math.cos(a) + W.z * Math.sin(a)) * RCIELO * 0.97]); }
      equat = L3().linea(T, pts, 0x5eead4, 0.5); equat.material.depthTest = false; gr.add(equat);
      var vic = lista.filter(function (s) { return s.mag < 3.5; }).map(function (s) { return [s, distanzaAngolare(s.ra, s.dec, p.ra, p.dec)]; }).sort(function (a, b) { return a[1] - b[1]; })[0];
      var vp = eclEq(mod(-P_PREC * (st.anno - 2000), 360), 0, 23.4393);
      info.innerHTML = t('Anno ', 'Year ') + '<b>' + (st.anno < 0 ? (-st.anno) + t(' a.C.', ' BC') : st.anno) + '</b>: ' + t('polo celeste a α = ', 'celestial pole at α = ') + (p.ra / 15).toFixed(2) + 'h, δ = ' + p.dec.toFixed(2) + '° (J2000)<br>' + t('Stella brillante più vicina: ', 'Nearest bright star: ') + '<b>' + vic[0].nome + '</b> ' + t('a ', 'at ') + vic[1].toFixed(2) + '°<br>' + t('Punto vernale a α = ', 'Vernal point at α = ') + (vp.ra / 15).toFixed(2) + 'h (J2000); ' + t('periodo 360°/p = ', 'period 360°/p = ') + Math.round(periodoPrecessione()) + t(' anni', ' years');
      S.didascalia.textContent = t('Precessione: il polo celeste nell’anno ', 'Precession: the celestial pole in year ') + st.anno;
      S.sporca = true; S.avvia();
    }
    function grafico() {
      var ys = [], dP = [], dV = [], dT = [], P = lista[IDX['Polare']], V = lista[IDX['Vega']], Th = lista[IDX['Thuban']];
      for (var y = -13000; y <= 14000; y += 100) { var p = poloCeleste(y); ys.push(y); dP.push(distanzaAngolare(P.ra, P.dec, p.ra, p.dec)); dV.push(distanzaAngolare(V.ra, V.dec, p.ra, p.dec)); dT.push(distanzaAngolare(Th.ra, Th.dec, p.ra, p.dec)); }
      F.grafico(cv, { serie: [{ x: ys, y: dP, col: '#ffd24a', etich: ['Polare', 'Polaris'] }, { x: ys, y: dV, col: '#6bcfff', etich: ['Vega', 'Vega'] }, { x: ys, y: dT, col: '#ff8a80', etich: ['Thuban', 'Thuban'] }], xmin: -13000, xmax: 14000, ymin: 0, ymax: 50, xl: ['anno', 'year'], yl: ['distanza dal polo (°)', 'distance from the pole (°)'], legenda: [{ col: '#ffd24a', etich: ['Polare', 'Polaris'] }, { col: '#6bcfff', etich: ['Vega', 'Vega'] }, { col: '#ff8a80', etich: ['Thuban', 'Thuban'] }], descr: ['Distanza angolare dal polo celeste di tre stelle polari', 'Angular distance of three pole stars from the celestial pole'] });
    }
    F.alRidimensiona(grafico);
    grafico(); aggiorna();
    /* guardiamo verso il polo dell'eclittica (α = 18h, δ = +66,56°) */
    S.vista.th = Math.atan2(-ve[1], -ve[0]); S.vista.ph = Math.acos(-ve[2] / RCIELO / 0.95); S.inquadra(0.5);
    S.cam.fov = 95; S.cam.updateProjectionMatrix();
    var acc = 0;
    S.ogniFotogramma(function (dt) {
      if (Math.abs(S.vista.r - 0.5) > 1e-6) { S.cam.fov = Math.max(20, Math.min(120, S.cam.fov * S.vista.r / 0.5)); S.vista.r = 0.5; S.cam.updateProjectionMatrix(); }
      if (st.pausa) return false;
      st.anno += dt * st.vel; if (st.anno > 14000) st.anno = -13000;
      acc += dt; if (acc > 0.1) { acc = 0; cA.value = Math.round(st.anno / 50) * 50; cA.dispatchEvent(new Event('input')); }
      return true;
    });
  }

  /* ─── scheda 4: l'analemma ────────────────────────────────────────────── */
  function schedaAnalemma(pan, S, destra) {
    var T = S.T, st = { lat: 41.12, lon: 16.87, ora: 12, anno: new Date().getUTCFullYear(), giorno: 0, pausa: false };
    var info = nota(pan);
    F.cursore(pan, ['Latitudine (°)', 'Latitude (°)'], -66, 66, 0.5, st.lat, function (v) { st.lat = v; disegna(); }, function (v) { return v.toFixed(1); });
    F.cursore(pan, ['Ora solare media locale', 'Local mean solar time'], 7, 17, 0.25, st.ora, function (v) { st.ora = v; disegna(); }, function (v) { var h = Math.floor(v), m = Math.round((v - h) * 60); return h + ':' + (m < 10 ? '0' : '') + m; });
    var bp = F.bottone(pan, ['❚❚ Pausa del Sole che scorre', '❚❚ Pause the moving Sun'], function () { st.pausa = !st.pausa; bp.textContent = st.pausa ? t('▶ Fai scorrere il Sole', '▶ Move the Sun') : t('❚❚ Pausa del Sole che scorre', '❚❚ Pause the moving Sun'); S.avvia(); });
    nota(pan, t('Se si fotografa il Sole ogni giorno alla <b>stessa ora media</b>, non torna nello stesso punto: disegna un otto, l’analemma. In verticale si sposta con la declinazione (±23,44°, dalle stagioni); in orizzontale con l’<b>equazione del tempo</b> E = tempo solare vero − tempo medio, che nasce da due effetti: l’orbita ellittica (la Terra va più veloce al perielio, a inizio gennaio: termine di periodo annuale, ampiezza ~7,7 min) e l’inclinazione dell’eclittica (la proiezione del moto del Sole sull’equatore non è uniforme: termine semestrale, ~9,9 min). La somma ha i due estremi E ≈ +16,4 min a inizio novembre ed E ≈ −14,2 min a metà febbraio, e passa per zero quattro volte (metà aprile, metà giugno, inizio settembre, fine dicembre). Calcolo: E = 4·(L − α) minuti, con L la longitudine media del Sole e α la sua ascensione retta (formule dell’Astronomical Almanac).', 'If you photograph the Sun every day at the <b>same mean time</b>, it does not come back to the same place: it traces a figure eight, the analemma. Vertically it moves with the declination (±23.44°, the seasons); horizontally with the <b>equation of time</b> E = apparent solar time − mean time, which comes from two effects: the elliptical orbit (Earth moves faster at perihelion, early January: an annual term of ~7.7 min amplitude) and the tilt of the ecliptic (the projection of the Sun’s motion onto the equator is not uniform: a semi-annual term, ~9.9 min). Their sum has the two extremes E ≈ +16.4 min in early November and E ≈ −14.2 min in mid February, and crosses zero four times (mid April, mid June, early September, late December). Computed as E = 4·(L − α) minutes, with L the Sun’s mean longitude and α its right ascension (Astronomical Almanac formulae).'));
    var cv = F.tela(destra, 0.45);
    var gr = new T.Group(); S.aggiungi(gr);
    var MESI = [[0xff6b6b, 'gen', 'Jan'], [0xff9f6b, 'feb', 'Feb'], [0xffd24a, 'mar', 'Mar'], [0xd4f06b, 'apr', 'Apr'], [0x8fe36b, 'mag', 'May'], [0x5eead4, 'giu', 'Jun'], [0x6bcfff, 'lug', 'Jul'], [0x6b9fff, 'ago', 'Aug'], [0x9f8fff, 'set', 'Sep'], [0xc98fff, 'ott', 'Oct'], [0xff8fdc, 'nov', 'Nov'], [0xffa0a0, 'dic', 'Dec']];
    var spSole = new T.Sprite(new T.SpriteMaterial({ map: texBagliore(T), color: 0xfff3c0, transparent: true, depthTest: false, blending: T.AdditiveBlending })); spSole.scale.set(9, 9, 1); spSole.renderOrder = 9; S.aggiungi(spSole);
    var dati = [];
    function disegna() {
      while (gr.children.length) { var o = gr.children.pop(); if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map && o.material.map !== texBagliore(T)) o.material.map.dispose(); o.material.dispose(); } }
      /* suolo, orizzonte, cardinali, griglia */
      var suolo = new T.Mesh(new T.SphereGeometry(RCIELO * 0.9, 48, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new T.MeshBasicMaterial({ color: 0x0b1410, side: T.BackSide, transparent: true, opacity: 0.93, depthWrite: false })); suolo.rotation.x = Math.PI / 2; gr.add(suolo);
      var orz = []; for (var k = 0; k <= 360; k += 2) orz.push(vettoreOr(0, k, RCIELO * 0.89)); gr.add(L3().linea(T, orz, 0x5eead4, 0.8));
      [['N', 0], ['E', 90], ['S', 180], [t('O', 'W'), 270]].forEach(function (c) { var v = vettoreOr(2, c[1], RCIELO * 0.85), e = etichetta(T, c[0], '#5eead4', 4); e.position.set(v[0], v[1], v[2]); gr.add(e); });
      for (var hh = 15; hh <= 75; hh += 15) { var pc = []; for (var az = 0; az <= 360; az += 5) pc.push(vettoreOr(hh, az, RCIELO * 0.985)); var Lh = L3().linea(T, pc, 0x6b5a2a, 0.35); gr.add(Lh); }
      /* il Sole alle ore medie scelte, ogni giorno dell'anno: UT = ora − λ/15 */
      dati = []; var pos = [], col = [];
      var jd0 = giuliano(st.anno, 1, 1, 0);
      for (var g = 0; g < 365; g++) {
        var jd = jd0 + g + (st.ora - st.lon / 15) / 24, S0 = sole(jd), o = altAz(S0.ra, S0.dec, st.lat, lst(jd, st.lon)), v = vettoreOr(o.alt, o.az, RCIELO * 0.95), m = new Date(msDaGiuliano(jd)).getUTCMonth(), c = new T.Color(MESI[m][0]);
        pos.push(v[0], v[1], v[2]); col.push(c.r, c.g, c.b); dati.push({ g: g, jd: jd, eot: S0.eot, dec: S0.dec, alt: o.alt, az: o.az, v: v });
      }
      var geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new T.Float32BufferAttribute(col, 3));
      var pts = new T.Points(geo, new T.PointsMaterial({ size: 2.4, map: texBagliore(T), vertexColors: true, transparent: true, depthTest: false, blending: T.AdditiveBlending })); pts.renderOrder = 5; gr.add(pts);
      [0, 59, 120, 181, 243, 304].forEach(function (g) { var d = dati[g], m = new Date(msDaGiuliano(d.jd)).getUTCMonth(), e = etichetta(T, F.tt([MESI[m][1], MESI[m][2]]), '#' + MESI[m][0].toString(16), 2.2); e.position.set(d.v[0] * 0.97 + 3, d.v[1] * 0.97, d.v[2] * 0.97); gr.add(e); });
      /* il meridiano */
      var mer = []; for (var h2 = 0; h2 <= 90; h2 += 2) mer.push(vettoreOr(h2, st.lat >= 0 ? 180 : 0, RCIELO * 0.985)); gr.add(L3().linea(T, mer, 0xffd24a, 0.4));
      var mx = dati.reduce(function (a, b) { return b.eot > a.eot ? b : a; }), mn = dati.reduce(function (a, b) { return b.eot < a.eot ? b : a; });
      var fd = function (d) { return new Date(msDaGiuliano(d.jd)).toLocaleDateString([], { day: 'numeric', month: 'long' }); };
      info.innerHTML = t('Equazione del tempo ', 'Equation of time ') + st.anno + ': ' + t('massimo ', 'maximum ') + '<b>+' + mx.eot.toFixed(1) + ' min</b> (' + fd(mx) + '), ' + t('minimo ', 'minimum ') + '<b>' + mn.eot.toFixed(1) + ' min</b> (' + fd(mn) + ').<br>' + t('Altezza del Sole alle ', 'Sun’s altitude at ') + F.fmt(st.ora) + t(' (ora media): da ', ' (mean time): from ') + Math.min.apply(null, dati.map(function (d) { return d.alt; })).toFixed(1) + '° ' + t('a ', 'to ') + Math.max.apply(null, dati.map(function (d) { return d.alt; })).toFixed(1) + '°.';
      S.didascalia.textContent = t('Analemma: il Sole alle ', 'Analemma: the Sun at ') + F.fmt(st.ora) + t(' ora media, latitudine ', ' mean time, latitude ') + st.lat.toFixed(1) + '°';
      grafico();
      S.sporca = true; S.avvia();
    }
    function grafico() {
      var x = dati.map(function (d) { return d.g + 1; }), y = dati.map(function (d) { return d.eot; });
      var P = F.grafico(cv, { serie: [{ x: x, y: y, col: '#ffd24a', etich: ['E', 'E'] }], punti: [{ x: st.giorno + 1, y: dati[Math.floor(st.giorno)] ? dati[Math.floor(st.giorno)].eot : 0, col: '#ff6b6b', r: 5 }], linee: [{ y: 0, col: '#34465f' }], xmin: 1, xmax: 365, ymin: -16, ymax: 18, xl: ['giorno dell’anno', 'day of year'], yl: ['E (min)', 'E (min)'], descr: ['Equazione del tempo durante l’anno', 'Equation of time through the year'] });
    }
    F.alRidimensiona(function () { if (dati.length) grafico(); });
    disegna();
    var acc = 0;
    S.ogniFotogramma(function (dt) {
      if (Math.abs(S.vista.r - 0.5) > 1e-6) { S.cam.fov = Math.max(20, Math.min(120, S.cam.fov * S.vista.r / 0.5)); S.vista.r = 0.5; S.cam.updateProjectionMatrix(); }
      if (st.pausa || !dati.length) return false;
      st.giorno = (st.giorno + dt * 20) % 365;
      var d = dati[Math.floor(st.giorno)]; spSole.position.set(d.v[0], d.v[1], d.v[2]);
      acc += dt; if (acc > 0.5) { acc = 0; grafico(); }
      return true;
    });
    /* guardiamo a sud (o a nord nell'emisfero australe), un po' in alto */
    S.cam.fov = 85; S.cam.updateProjectionMatrix();
    S.vista.th = Math.PI / 2; S.vista.ph = Math.PI / 2 + 0.6; S.inquadra(0.5);
  }

  F.sezione('sastrocielo', {
    titolo: ['🔭 Planetario 3D', '🔭 Planetarium 3D'],
    sotto: ['Il cielo vero da un luogo e un’ora qualsiasi (di partenza: Bari, adesso): stelle, costellazioni, pianeti, Sole e Luna con la fase, il tempo siderale; le coordinate di ogni stella con levata e tramonto; la precessione degli equinozi in 26 000 anni; l’analemma e l’equazione del tempo. Trascina per guardarti intorno.', 'The real sky from any place and time (starting: Bari, now): stars, constellations, planets, Sun and Moon with its phase, sidereal time; the coordinates of every star with rising and setting; the precession of the equinoxes over 26,000 years; the analemma and the equation of time. Drag to look around.'],
    schede: [
      { nome: ['🌃 Cielo', '🌃 Sky'], costruisci: scheda(schedaCielo) },
      { nome: ['📐 Coordinate', '📐 Coordinates'], costruisci: scheda(schedaCoordinate) },
      { nome: ['🌀 Precessione', '🌀 Precession'], costruisci: scheda(schedaPrecessione) },
      { nome: ['∞ Analemma', '∞ Analemma'], costruisci: scheda(schedaAnalemma) }
    ]
  });
})(typeof window !== 'undefined' ? window : globalThis);
