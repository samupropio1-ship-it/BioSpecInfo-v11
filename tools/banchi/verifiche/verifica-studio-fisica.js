/* valida-fisica.js — il controllo del kit di studio di FISICA (bsi-studio-fisica.js)
   1) carica bsi-fisica-comune.js + bsi-studio.js + bsi-studio-fisica.js in una vm di node
      e chiede a BSIStudio.valida(dati, {quantita:true}) l'elenco dei problemi (deve essere vuoto);
   2) controlla i minimi del capitolato (65/320/260/220/260, ≥ 4 riassunti e ≥ 20 quiz per argomento,
      nessuna posizione della risposta giusta oltre il 32 %);
   3) RICALCOLA ogni domanda numerica del quiz con le costanti CODATA e confronta il risultato
      col numero dell'opzione all'indice k (e verifica che nessun'altra opzione sia giusta).
   Uso: node _prove/valida-fisica.js   (esce con codice 1 se qualcosa non va) */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const RADICE = path.join(__dirname, '..', '..', '..');

/* ═══ costanti (CODATA 2018) ═══ */
const c = 299792458, h = 6.62607015e-34, hbar = h / (2 * Math.PI), e = 1.602176634e-19, kB = 1.380649e-23,
  NA = 6.02214076e23, G = 6.67430e-11, eps0 = 8.8541878128e-12, me = 9.1093837015e-31, mp = 1.67262192369e-27,
  g = 9.81, mu0 = 1.25663706212e-6, R = NA * kB, sigma = 5.670374419e-8, ke = 1 / (4 * Math.PI * eps0),
  u = 1.66053906660e-27, mn = 1.67492749804e-27, uMeV = 931.49410242, eV = e, MeV = 1e6 * e,
  Msun = 1.98847e30, AU = 1.495978707e11, ly = 9.4607304725808e15, pc = 3.0856775814913673e16, Rsun = 6.957e8,
  Lsun = 3.828e26, Mearth = 5.9722e24, Rearth = 6.371e6, a0 = 5.29177210903e-11, Ry = 13.605693122994, b_wien = 2.897771955e-3;
const PI = Math.PI, sqrt = Math.sqrt, ln = Math.log, log10 = Math.log10, exp = Math.exp, sin = (x) => Math.sin(x * PI / 180),
  cos = (x) => Math.cos(x * PI / 180), tan = (x) => Math.tan(x * PI / 180), asin = (x) => Math.asin(x) * 180 / PI,
  atan = (x) => Math.atan(x) * 180 / PI, acos = (x) => Math.acos(x) * 180 / PI;

/* ═══ le domande numeriche: { q: pezzo univoco del testo, v: valore atteso (nell'unità dell'opzione), tol } ═══ */
const NUM = [
  /* mecc */
  { q: 'cade da fermo da 20 m', v: sqrt(2 * g * 20) },
  { q: 'lanciato da terra a 30 m/s con un angolo di 45°', v: 30 * 30 * sin(90) / g },
  { q: 'curva piana di raggio 50 m a 72 km/h', v: 20 * 20 / (g * 50) },
  { q: 'forza orizzontale di 10 N agisce su una massa di 2 kg', v: 10 / 2 },
  { q: 'piano inclinato liscio di 30°', v: g * sin(30) },
  { q: 'coefficiente di attrito dinamico 0,20', v: g * (sin(30) - 0.2 * cos(30)) },
  { q: 'costante elastica 200 N/m è compressa di 10 cm', v: 0.5 * 200 * 0.1 * 0.1 },
  { q: 'auto di 1200 kg passa da 0 a 100 km/h', v: 0.5 * 1200 * Math.pow(100 / 3.6, 2) / 8 / 1000 },
  { q: 'proiettile di 10 g a 400 m/s', v: 0.01 * 400 / 2.01 },
  { q: '120 giri al minuto', v: 2 * PI * 2 },
  { q: 'raggio 5 m alla velocità costante di 10 m/s', v: 100 / 5 },
  { q: 'accelera verso l’alto a 2,0 m/s²', v: 70 * (g + 2) },
  { q: 'verticalmente verso l’alto a 15 m/s', v: 15 * 15 / (2 * g) },
  { q: 'espelle i gas a 2500 m/s', v: exp(5000 / 2500) },
  { q: 'corpo di 3,0 kg che sale di 2,0 m', v: -3 * g * 2 },
  { q: 'circonferenza verticale di raggio 1,0 m', v: sqrt(g * 1) },
  /* rigido */
  { q: 'disco pieno omogeneo di 2,0 kg e raggio 0,10 m', v: 0.5 * (0.5 * 2 * 0.01) * 900 },
  { q: 'sfera piena rotola senza strisciare giù da un piano inclinato', v: sqrt(10 * g * 1 / 7) },
  { q: 'pattinatrice ruota a 2,0 giri/s', v: 2 * 4 / 1.6 },
  { q: 'momento torcente costante di 10 N·m', v: 10 / 2 * 3 },
  { q: 'trave omogenea di 20 kg', v: (20 * g * 2 + 50 * g * 3) / 4 },
  { q: 'due sfere di 1000 kg', v: G * 1e6 / 1 },
  { q: 'velocità di fuga dalla superficie terrestre', v: sqrt(2 * G * 5.97e24 / 6.371e6) / 1000 },
  { q: 'raggio dell’orbita geostazionaria', v: Math.cbrt(3.986e14 * 86160 * 86160 / (4 * PI * PI)) / 1000, tol: 0.01 },
  { q: 'massa doppia e raggio doppio della Terra', v: g * 2 / 4 },
  { q: 'orbita circolare a 400 km di quota', v: sqrt(3.986e14 / 6.771e6) / 1000 },
  { q: 'porta larga 0,80 m', v: 0.8 * 20 },
  /* fluidi */
  { q: '10 m di profondità nel mare', v: 1025 * g * 10 },
  { q: 'pistoni hanno aree di 10 cm² e 500 cm²', v: 200 * 50 },
  { q: 'cubo di legno di densità 600 kg/m³', v: 600 / 1000 },
  { q: 'volume di un iceberg', v: 100 * (1 - 917 / 1025) },
  { q: 'pesa 10,0 N in aria e 7,5 N', v: 1000 * 10 / 2.5 },
  { q: 'diametro di 4,0 cm a uno di 2,0 cm', v: 1.0 * 4 },
  { q: 'foro posto 5,0 m sotto la superficie', v: sqrt(2 * g * 5) },
  { q: 'tubo di Venturi orizzontale', v: 0.5 * 1000 * (36 - 4) / 1000 },
  { q: 'numero di Reynolds per acqua', v: 1000 * 0.5 * 0.02 / 1e-3 },
  { q: 'bolla di sapone di raggio 2,0 cm', v: 4 * 0.025 / 0.02 },
  { q: 'capillare di vetro di raggio 0,50 mm', v: 100 * 2 * 0.073 / (1000 * g * 5e-4) },
  { q: 'colonna di mercurio di un barometro', v: 101325 / (13595.1 * 9.80665) * 1000 },
  { q: 'tubo di Pitot misura in aria', v: sqrt(2 * 600 / 1.2) },
  { q: 'pallone contiene 1,0 m³ di elio', v: (1.2 - 0.18) * g },
  { q: 'pressione assoluta a 20 m di profondità', v: 1.013e5 + 1000 * g * 20 },
  /* termo */
  { q: 'scaldare 2,0 kg d’acqua da 20 °C a 80 °C', v: 2 * 4186 * 60 },
  { q: 'fondere 0,50 kg di ghiaccio', v: 0.5 * 3.34e5 },
  { q: 'volume occupa 1,00 mol di gas ideale a 0 °C', v: R * 273.15 / 101325 * 1000 },
  { q: 'molecole di azoto N₂', v: sqrt(3 * R * 300 / 0.028) },
  { q: 'sorgenti a 500 K e 300 K', v: 100 * (1 - 300 / 500) },
  { q: 'espansione isoterma reversibile a 300 K da 10 L a 30 L', v: 2 * R * 300 * ln(3) / 1000 },
  { q: 'compresso in modo adiabatico e reversibile fino a un decimo', v: 300 * Math.pow(10, 0.4) },
  { q: 'entropia di 1,0 kg di ghiaccio', v: 3.34e5 / 273.15 },
  { q: 'frigorifero che lavora fra −10 °C e 25 °C', v: 263.15 / 35 },
  { q: 'monoatomico scaldate a volume costante', v: 2 * 1.5 * R * 100 / 1000 },
  { q: 'sfera di raggio 0,10 m che si comporta come un corpo nero', v: sigma * 4 * PI * 0.01 * 1e12 / 1000 },
  { q: 'vetro di 1,0 m² spesso 4,0 mm', v: 0.8 * 1 * 10 / 0.004 / 1000 },
  { q: 'si espande liberamente nel vuoto', v: R * ln(2) },
  { q: 'sbarra d’acciaio', v: 1.2e-5 * 10 * 40 * 1000 },
  { q: '1,0 kg d’acqua a 80 °C e 3,0 kg', v: (80 + 60) / 4 },
  /* onde */
  { q: 'm = 0,50 kg e k = 200 N/m', v: 2 * PI * sqrt(0.5 / 200) },
  { q: 'pendolo semplice lungo 1,00 m', v: 2 * PI * sqrt(1 / g) },
  { q: 'corda tesa con 100 N', v: sqrt(100 / 0.01) },
  { q: 'corda lunga 0,65 m', v: 286 / 1.3 },
  { q: 'intensità di 1,0 × 10⁻⁵ W/m²', v: 10 * log10(1e-5 / 1e-12) },
  { q: 'sirena a 700 Hz', v: 700 * 343 / (343 - 30) },
  { q: 'diapason a 440 Hz e 444 Hz', v: 4 },
  { q: 'tubo lungo 0,85 m chiuso', v: 340 / (4 * 0.85) },
  { q: 'ampiezza 5,0 cm e pulsazione 10 rad/s', v: 10 * 0.05 },
  { q: 'nell’aria a 20 °C, considerata gas ideale', v: sqrt(1.4 * R * 293.15 / 0.02897) },
  { q: 'sulla Luna (g = 1,62 m/s²)', v: 2 * PI * sqrt(1 / 1.62) },
  { q: 'y(x, t) = 0,02 sin(4πx − 200πt)', v: 200 * PI / (4 * PI) },
  { q: '10 m da una sorgente sonora puntiforme', v: 1 / (4 * PI * 100) },
  { q: 'osservatore si avvicina a 20 m/s', v: 500 * 360 / 340 },
  /* elettro */
  { q: 'due cariche di 1,0 μC poste a 10 cm', v: ke * 1e-12 / 0.01 },
  { q: '0,50 m da una carica puntiforme di 2,0 nC', v: ke * 2e-9 / 0.25 },
  { q: 'piano infinito carico con densità superficiale 1,0 μC/m²', v: 1e-6 / (2 * eps0) },
  { q: 'armature di 100 cm² distanti 1,0 mm', v: eps0 * 0.01 / 0.001 * 1e12 },
  { q: 'condensatore di 10 μF caricato a 100 V', v: 0.5 * 1e-5 * 1e4 },
  { q: 'accelerato da una differenza di potenziale di 1000 V', v: sqrt(2 * e * 1000 / me) },
  { q: 'tre resistori da 6 Ω', v: 2 },
  { q: 'resistenza di 50 Ω percorsa', v: 50 * 4 },
  { q: 'R = 10 kΩ e C = 100 μF', v: 1e4 * 1e-4 },
  { q: 'tempo uguale alla costante di tempo', v: 100 * exp(-1) },
  { q: 'filo di rame (ρ = 1,68 × 10⁻⁸ Ω·m)', v: 1.68e-8 * 10 / 1e-6 },
  { q: 'racchiude una carica di 1,0 nC', v: 1e-9 / eps0 },
  { q: 'da 4 μF e 12 μF collegati in serie', v: 1 / (1 / 4 + 1 / 12) },
  { q: 'carica di 2,0 μC da un punto a 0 V', v: 2e-6 * 500 },
  { q: 'vertici di un quadrato di lato 1,0 m', v: 4 * ke * 1e-9 / (sqrt(2) / 2) },
  { q: 'fem 12 V e resistenza interna 0,50 Ω', v: 12 / 6 },
  /* magn */
  { q: 'protone che si muove a 1,0 × 10⁶ m/s perpendicolarmente', v: mp * 1e6 / (e * 0.1) * 100 },
  { q: 'frequenza di ciclotrone di un elettrone', v: e * 1 / (2 * PI * me) / 1e9 },
  { q: '5,0 cm da un lungo filo rettilineo percorso da 10 A', v: mu0 * 10 / (2 * PI * 0.05) * 1e6 },
  { q: '1000 spire per metro percorso da 2,0 A', v: mu0 * 1000 * 2 * 1000 },
  { q: 'spira di 0,020 m²', v: 0.5 * 0.02 / 0.1 },
  { q: 'sbarra conduttrice lunga 0,50 m', v: 0.2 * 0.5 * 4 },
  { q: 'solenoide lungo 0,50 m, con 500 spire', v: mu0 * 500 * 500 * 4e-4 / 0.5 * 1000 },
  { q: 'induttore di 0,20 H percorso da 3,0 A', v: 0.5 * 0.2 * 9 },
  { q: 'L = 10 mH e C = 1,0 μF', v: 1 / (2 * PI * sqrt(0.01 * 1e-6)) / 1000 },
  { q: '1000 spire al primario', v: 230 * 50 / 1000 },
  { q: 'condensatore da 10 μF alla frequenza di 50 Hz', v: 1 / (2 * PI * 50 * 1e-5) },
  { q: 'bobina di 100 spire di 10 cm²', v: 100 * 0.5 * 1e-3 * 0.2 },
  { q: 'L = 2,0 H e R = 100 Ω', v: 2 / 100 * 1000 },
  { q: 'E = 1,0 × 10⁴ V/m e B = 0,050 T', v: 1e4 / 0.05 },
  { q: 'distanti 1,0 m e percorsi ciascuno da 1,0 A', v: mu0 / (2 * PI) },
  /* ottica */
  { q: 'vetro con indice di rifrazione 1,50', v: c / 1.5 },
  { q: 'dall’aria all’acqua (n = 1,33) con un angolo di incidenza di 45°', v: asin(sin(45) / 1.33) },
  { q: 'angolo limite per la riflessione totale fra vetro', v: asin(1 / 1.5) },
  { q: 'oggetto è posto a 30 cm da una lente convergente', v: 1 / (1 / 10 - 1 / 30) },
  { q: 'forma l’immagine reale di un oggetto posto a 30 cm', v: -(1 / (1 / 10 - 1 / 30)) / 30 },
  { q: 'focale di 50 cm', v: 1 / 0.5 },
  { q: 'fenditure distano 0,20 mm', v: 6e-7 * 1 / 2e-4 * 1000 },
  { q: '500 righe per millimetro', v: asin(500e-9 / 2e-6) },
  { q: 'lamina di sapone (n = 1,33)', v: 532 / (4 * 1.33) },
  { q: 'forma 60° con la direzione di polarizzazione', v: 100 * cos(60) * cos(60) },
  { q: 'angolo di Brewster per la riflessione dall’aria', v: atan(1.5) },
  { q: 'apertura di 2,4 m a 550 nm', v: 1.22 * 550e-9 / 2.4 },
  { q: 'raggio di curvatura 40 cm', v: 20 },
  { q: 'fenditura larga 0,10 mm', v: 2 * 500e-9 / 1e-4 },
  { q: 'lente d’ingrandimento di focale 5,0 cm', v: 25 / 5 },
  { q: 'nucleo con n₁ = 1,48', v: sqrt(1.48 * 1.48 - 1.46 * 1.46) },
  { q: 'obiettivo di focale 1200 mm', v: 1200 / 25 },
  { q: 'biconvessa simmetrica di vetro', v: 1 / (0.5 * (1 / 20 + 1 / 20)) },
  /* rel */
  { q: 'si muove a 0,80c', v: 1 / sqrt(1 - 0.64) },
  { q: 'vita media propria di 2,2 μs', v: 2.2 / sqrt(1 - 0.995 * 0.995) },
  { q: 'lunga 100 m nel suo riferimento', v: 100 * sqrt(1 - 0.36) },
  { q: 'lancia in avanti una sonda a 0,60c', v: 1.2 / 1.36 },
  { q: 'contenuta in 1,0 g di materia', v: 1e-3 * c * c },
  { q: 'energia a riposo dell’elettrone?', v: me * c * c / MeV },
  { q: 'tre volte la sua energia a riposo', v: sqrt(1 - 1 / 9) },
  { q: 'energia cinetica 1,0 MeV (m_ec² = 0,511 MeV)', v: sqrt(Math.pow(1 + me * c * c / MeV, 2) - Math.pow(me * c * c / MeV, 2)) },
  { q: 'emette luce di 600 nm', v: 600 * sqrt(1.6 / 0.4) },
  { q: 'raggio di Schwarzschild di un corpo', v: 2 * G * 1.989e30 / (c * c) / 1000 },
  { q: 'corpo di 1,0 kg che si muove a 0,60c', v: (1 / sqrt(1 - 0.36) - 1) * c * c },
  { q: 'il fattore di Lorentz vale 2', v: sqrt(3) / 2 },
  { q: 'Due fotoni di 1,0 MeV', v: 2 },
  { q: 'velocità della luce nel vuoto?', v: c, tol: 1e-9 },
  { q: 'sfiora il bordo del Sole', v: 4 * G * Msun / (c * c * Rsun) * 180 / PI * 3600 },
  /* quanti */
  { q: 'fotone di lunghezza d’onda 500 nm', v: h * c / 500e-9 },
  { q: 'fotone di lunghezza d’onda 620 nm', v: h * c / 620e-9 / e },
  { q: 'Luce di 250 nm colpisce un metallo', v: h * c / 250e-9 / e - 4 },
  { q: 'accelerato da fermo con una differenza di potenziale di 100 V', v: h / sqrt(2 * me * e * 100) * 1e9 },
  { q: 'stato fondamentale dell’atomo di idrogeno?', v: -Ry },
  { q: 'riga Hα dell’idrogeno', v: 1e9 / (1.0973731568e7 / (1 + me / mp) * (1 / 4 - 1 / 9)) },
  { q: 'diffusione Compton su un elettrone libero', v: 2 * h / (me * c) * 1e12 },
  { q: 'localizzato in una regione di 0,10 nm', v: hbar / (2 * 1e-10) / me, tol: 0.03 },
  { q: 'buca di potenziale infinita larga 1,0 nm', v: h * h / (8 * me * 1e-18) / e },
  { q: 'guscio con numero quantico principale n = 3', v: 18 },
  { q: 'corpo nero a 310 K', v: b_wien / 310 * 1e6 },
  { q: 'ione He⁺ (Z = 2)', v: 4 * Ry },
  { q: 'Quanto vale il raggio di Bohr', v: a0 * 1e9 },
  { q: 'laser da 1,0 mW emette a 633 nm', v: 1e-3 * 633e-9 / (h * c) },
  { q: 'numero quantico magnetico m_l per l = 2', v: 5 },
  /* nucl */
  { q: 'nucleo di alluminio-27', v: 1.2 * Math.cbrt(27) },
  { q: 'energia di legame del deuterone', v: (1.007276 + 1.008665 - 2.013553) * uMeV },
  { q: 'iodio-131', v: 100 * Math.pow(0.5, 24 / 8) },
  { q: '1,0 g di radio-226', v: ln(2) / (1600 * 365.25 * 86400) * NA / 226 },
  { q: '25 % dell’attività di carbonio-14', v: 5730 * log10(4) / log10(2) },
  { q: 'una fissione di uranio-235?', v: 200 },
  { q: 'fusione D + T → ⁴He + n?', v: (2.014102 + 3.016049 - 4.002602 - 1.008665) * uMeV },
  { q: 'spessore emivalente?', v: ln(2) / 0.77 },
  { q: 'creare una coppia elettrone-positrone', v: 2 * me * c * c / MeV },
  { q: '1,0 GW di potenza termica per un anno', v: 1e9 * 365.25 * 86400 / (200 * MeV) / NA * 0.235 },
  { q: 'tempo di dimezzamento di 10 minuti', v: 10 / ln(2) },
  /* stat */
  { q: 'separati da 0,10 eV', v: exp(-0.1 * e / (kB * 300)) },
  { q: 'k_BT alla temperatura di 300 K', v: kB * 300 / e },
  { q: 'Raggi X di 0,154 nm', v: asin(0.154 / (2 * 0.282)) },
  { q: 'legge di Dulong e Petit, quanto vale', v: 3 * R },
  { q: 'silicio (gap 1,12 eV)', v: h * c / (1.12 * e) * 1e6 },
  { q: 'energia di Fermi di 7,0 eV', v: 7 * e / kB },
  { q: '100 spin ½ indipendenti', v: (function () { let r = 1; for (let i = 1; i <= 50; i++) r = r * (50 + i) / i; return r; })() },
  { q: 'cella convenzionale del reticolo cubico a facce centrate', v: 4 },
  /* astro */
  { q: 'A quanti anni luce corrisponde circa un parsec', v: pc / ly },
  { q: 'parallasse annua di 0,10″', v: 1 / 0.1 },
  { q: 'differenza di 5 magnitudini', v: Math.pow(10, 0.4 * 5) },
  { q: 'magnitudine apparente m = 10', v: Math.pow(10, (10 - 0 + 5) / 5) },
  { q: 'il massimo a 290 nm', v: b_wien / 290e-9 },
  { q: 'raggio doppio e temperatura superficiale doppia', v: 4 * 16 },
  { q: 'galassia distante 100 Mpc', v: 70 * 100 },
  { q: 'tempo di Hubble 1/H₀', v: pc * 1e6 / 1000 / 70 / (365.25 * 86400) / 1e9 },
  { q: 'temperatura della radiazione cosmica di fondo?', v: 2.725, tol: 0.001 },
  { q: 'redshift z = 1.', v: 2 },
  { q: 'redshift z = 0,010', v: c / 1000 * 0.01 },
  { q: 'massa del Sole si ricava', v: 4 * PI * PI * Math.pow(1.496e11, 3) / (G * 3.156e7 * 3.156e7) },
  { q: 'stella di 10 masse solari', v: 1e10 * Math.pow(10, -2.5) },
  { q: 'redshift z = 1100', v: 2.725 * 1101 },
  { q: 'unità astronomica, la distanza media', v: AU },
  { q: 'arrivano 1361 W/m²', v: 4 * PI * AU * AU * 1361 },
  { q: 'albedo 0,30', v: Math.pow(1361 * 0.7 / (4 * sigma), 0.25) },
  /*@@NUM@@*/
];

/* ═══ caricamento ═══ */
const ctx = { console, setTimeout, clearTimeout, setInterval, clearInterval, addEventListener() { }, removeEventListener() { } };
vm.createContext(ctx);
for (const f of ['bsi-fisica-comune.js', 'bsi-studio.js', 'bsi-studio-fisica.js'])
  vm.runInContext(fs.readFileSync(path.join(RADICE, f), 'utf8'), ctx, { filename: f });
const S = ctx.BSIStudio, D = S.dati('fisica');
let errori = 0;
function ko(s) { errori++; console.log('  ✗ ' + s); }

console.log('── BSIStudio.valida(dati, {quantita:true}) ──');
const prob = S.valida(D, { quantita: true });
if (prob.length) prob.forEach(ko); else console.log('  ✓ nessun problema');

console.log('── quantità ──');
const MIN = { riassunti: 65, quiz: 320, flash: 260, formule: 220, glossario: 260 };
for (const k of Object.keys(MIN)) {
  const n = D[k].length;
  console.log('  ' + (n >= MIN[k] ? '✓' : '✗') + ' ' + k + ': ' + n + ' (minimo ' + MIN[k] + ')');
  if (n < MIN[k]) errori++;
}
console.log('  per argomento (riassunti / quiz [liv1,liv2,liv3] / flash / formule):');
for (const a of D.argomenti) {
  const r = D.riassunti.filter((x) => x.arg === a.k).length, q = D.quiz.filter((x) => x.arg === a.k),
    fl = D.flash.filter((x) => x.arg === a.k).length, fo = D.formule.filter((x) => x.arg === a.k).length;
  const lv = [1, 2, 3].map((l) => q.filter((x) => x.liv === l).length);
  console.log('    ' + a.k.padEnd(8) + String(r).padStart(3) + ' / ' + String(q.length).padStart(3) + ' [' + lv + '] / ' + String(fl).padStart(3) + ' / ' + String(fo).padStart(3));
  if (r < 4) ko(a.k + ': solo ' + r + ' riassunti');
  if (q.length < 20) ko(a.k + ': solo ' + q.length + ' quiz');
  if (lv.some((x) => x === 0)) ko(a.k + ': manca un livello nei quiz');
}
const pos = [0, 0, 0, 0];
D.quiz.forEach((x) => pos[x.k]++);
console.log('  posizioni di k: ' + pos.map((n, i) => i + ': ' + n + ' (' + (100 * n / D.quiz.length).toFixed(1) + ' %)').join(', '));
pos.forEach((n, i) => { if (n / D.quiz.length > 0.32) ko('posizione ' + i + ' oltre il 32 %'); });
D.quiz.forEach((x, i) => { if (x.r.length !== 4) ko('quiz n. ' + (i + 1) + ': ' + x.r.length + ' risposte'); });

/* ═══ i numeri nelle opzioni ═══ */
const SUP = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-' };
function numero(s) {
  let t = String(s).replace(/<[^>]*>/g, '').replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]/g, (x) => SUP[x]).replace(/−/g, '-').replace(/(\d)\s(?=\d{3}\b)/g, '$1');
  const m = /(-?\d+(?:,\d+)?)(?:\s*×\s*10(-?\d+))?/.exec(t);
  if (!m) return NaN;
  return parseFloat(m[1].replace(',', '.')) * (m[2] ? Math.pow(10, +m[2]) : 1);
}
function vicino(a, b, tol) { return Math.abs(a - b) <= tol * Math.max(Math.abs(b), 1e-300); }

console.log('── controllo numerico (' + NUM.length + ' domande) ──');
const usate = new Set();
let okN = 0;
for (const n of NUM) {
  const trovate = D.quiz.filter((x) => x.d.indexOf(n.q) >= 0);
  if (trovate.length !== 1) { ko('«' + n.q + '»: ' + trovate.length + ' domande trovate'); continue; }
  const x = trovate[0], atteso = n.v, tol = n.tol || 0.02, giusto = numero(x.r[x.k]);
  usate.add(x);
  if (!vicino(giusto, atteso, tol)) { ko('«' + n.q + '»: l’opzione giusta dice ' + giusto + ' ma il calcolo dà ' + atteso.toPrecision(5)); continue; }
  const altre = x.r.filter((o, j) => j !== x.k && vicino(numero(o), atteso, Math.max(tol, 0.03)));
  if (altre.length) { ko('«' + n.q + '»: anche un’altra opzione coincide col calcolo (' + altre.join(' | ') + ')'); continue; }
  okN++;
}
console.log('  ✓ ' + okN + ' domande numeriche confermate su ' + NUM.length);

console.log(errori ? '\n✗ ' + errori + ' problemi' : '\n✓ tutto in ordine');
process.exit(errori ? 1 : 0);
