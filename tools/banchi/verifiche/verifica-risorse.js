/* verifica-risorse — sfisris, smatris, schiris, sfiscost, smattavole (bsi-risorse-materie.js)
   citazioni su record Crossref fatti a mano, normalizzazione dei DOI, conversioni di unita',
   costanti CODATA contro relazioni indipendenti, tavole matematiche controllate numericamente
   (differenze finite, quadratura tanh-sinh, somme di serie), link sintatticamente validi e unici */
'use strict';
const C = require('./carica.js')(['bsi-risorse-materie.js']);
const Ci = C.citazioni, U = C.unita, T = C.tavole, R = C.risorse;
let ok = 0, ko = 0;
function att(d, atteso, avuto) { if (String(atteso) === String(avuto)) { ok++; console.log('  ✓ ' + d + '  → ' + avuto); } else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + '\n      avuto:  ' + avuto); } }
function vero(d, c, info) { if (c) { ok++; console.log('  ✓ ' + d + (info ? '  → ' + info : '')); } else { ko++; console.log('  ✗ ' + d + (info ? '\n      ' + info : '')); } }
function vicino(d, atteso, avuto, rel) { const e = Math.abs(avuto - atteso) / Math.max(Math.abs(atteso), 1e-300); vero(d, e <= (rel || 1e-12), avuto + ' (err. rel. ' + e.toExponential(1) + ')'); }

/* ── quadratura tanh-sinh: regge le singolarita' agli estremi; g(x, x−a, b−x) ── */
function ts(g, a, b) {
  const c = (a + b) / 2, d = (b - a) / 2, h = 1 / 64;
  let s = 0;
  for (let k = -6 * 64; k <= 6 * 64; k++) {
    const t = k * h, u = Math.PI / 2 * Math.sinh(t), ch = Math.cosh(u);
    const w = Math.PI / 2 * Math.cosh(t) / (ch * ch);
    if (!(w > 1e-300)) continue;
    const da = d * 2 / (1 + Math.exp(-2 * u)), db = d * 2 / (1 + Math.exp(2 * u));
    if (da <= 0 || db <= 0) continue;
    const x = u < 0 ? a + da : b - db;
    const v = g(x, da, db);
    if (isFinite(v)) s += w * v;
  }
  return s * d * h;
}
function integra(f, a, b) {
  if (a === -Infinity && b === Infinity) return integra(f, -Infinity, 0) + integra(f, 0, Infinity);
  if (a === -Infinity) return integra(x => f(-x), -b, Infinity);
  if (b === Infinity) return ts((s, sa, sb) => f(a + s / sb) / (sb * sb), 0, 1);   /* x = a + s/(1−s) */
  return ts(x => f(x), a, b);
}
/* composita di Gauss-Legendre a 10 punti, per le oscillanti di Fourier su [−L, L] */
const GLx = [-0.9739065285171717, -0.8650633666889845, -0.6794095682990244, -0.4333953941292472, -0.1488743389816312, 0.1488743389816312, 0.4333953941292472, 0.6794095682990244, 0.8650633666889845, 0.9739065285171717];
const GLw = [0.0666713443086881, 0.1494513491505806, 0.2190863625159820, 0.2692667193099963, 0.2955242247147529, 0.2955242247147529, 0.2692667193099963, 0.2190863625159820, 0.1494513491505806, 0.0666713443086881];
function gl(f, a, b, n) { let s = 0; const hh = (b - a) / n; for (let i = 0; i < n; i++) { const c = a + (i + 0.5) * hh; for (let j = 0; j < 10; j++) s += GLw[j] * f(c + GLx[j] * hh / 2); } return s * hh / 2; }

/* ═══ 1. CITAZIONI ═══ */
console.log('── Citazioni: record Crossref fatti a mano ──');
const R1 = { status: 'ok', 'message-type': 'work', message: {
  DOI: '10.1234/abcd.2021.5678', type: 'journal-article', title: ['<i>In vivo</i> imaging of H<sub>2</sub>O &amp; D<sub>2</sub>O exchange'],
  author: [{ given: 'Maria Luisa', family: 'Rossi', sequence: 'first' }, { given: 'Jean-Luc', family: 'Bianchi', sequence: 'additional' }],
  'container-title': ['Journal of Imaginary Chemistry'], volume: '12', issue: '3', 'article-number': 'e01234',
  'published-online': { 'date-parts': [[2021, 3, 9]] }, publisher: 'Esempio Press', URL: 'https://doi.org/10.1234/abcd.2021.5678' } };
const r1 = Ci.daCrossref(R1);
att('R1 lettura: titolo senza marcatori, 2 autori, anno e mese dalla data online', 'In vivo imaging of H2O & D2O exchange|2|2021|3', [r1.titolo, r1.autori.length, r1.anno, r1.mese].join('|'));
att('R1 APA 7 (testo)', 'Rossi, M. L., & Bianchi, J.-L. (2021). In vivo imaging of H2O & D2O exchange. Journal of Imaginary Chemistry, 12(3), Article e01234. https://doi.org/10.1234/abcd.2021.5678', Ci.apa(r1));
att('R1 APA 7 in HTML: rivista e volume in corsivo, & escapato', 'Rossi, M. L., &amp; Bianchi, J.-L. (2021). In vivo imaging of H2O &amp; D2O exchange. <i>Journal of Imaginary Chemistry</i>, <i>12</i>(3), Article e01234. https://doi.org/10.1234/abcd.2021.5678', Ci.apa(r1, true));
att('R1 IEEE «M. L. Rossi and J.-L. Bianchi»', 'M. L. Rossi and J.-L. Bianchi, “In vivo imaging of H2O & D2O exchange,” Journal of Imaginary Chemistry, vol. 12, no. 3, Art. no. e01234, Mar. 2021, doi: 10.1234/abcd.2021.5678.', Ci.ieee(r1));
att('R1 IEEE in HTML: rivista in corsivo', true, Ci.ieee(r1, true).indexOf('<i>Journal of Imaginary Chemistry</i>') > 0);
att('R1 ISO 690', 'ROSSI, Maria Luisa and Jean-Luc BIANCHI. In vivo imaging of H2O & D2O exchange. Journal of Imaginary Chemistry. 2021, vol. 12, no. 3, art. e01234. DOI 10.1234/abcd.2021.5678.', Ci.iso690(r1));
att('R1 BibTeX (chiave, & protetto)', '@article{rossi2021vivo,\n  author = {Rossi, Maria Luisa and Bianchi, Jean-Luc},\n  title = {{In vivo imaging of H2O \\& D2O exchange}},\n  journal = {Journal of Imaginary Chemistry},\n  year = {2021},\n  volume = {12},\n  number = {3},\n  pages = {e01234},\n  doi = {10.1234/abcd.2021.5678}\n}', Ci.bibtex(r1));

const autori25 = []; for (let i = 1; i <= 25; i++) autori25.push({ given: 'Nome' + String.fromCharCode(64 + i), family: 'Autore' + i });
const R2 = { message: { DOI: '10.5555/grande.collab.25', type: 'journal-article', title: 'Observation of an imaginary resonance', author: autori25,
  'container-title': 'Physical Imaginary Letters', volume: 130, page: '101801-101805', issued: { 'date-parts': [[2023]] } } };
const r2 = Ci.daCrossref(R2);
const apa2 = Ci.apa(r2);
vero('R2 APA 7 con 25 autori: i primi 19, poi «. . .», poi l’ultimo, senza «&»', apa2.startsWith('Autore1, N., Autore2, N.,') && apa2.indexOf('Autore19, N., . . . Autore25, N. (2023).') > 0 && apa2.indexOf('Autore20') < 0 && apa2.indexOf('&') < 0, apa2.slice(150, 260));
const r20 = Object.assign({}, r2, { autori: r2.autori.slice(0, 20) });
const apa20 = Ci.apa(r20);
vero('APA 7 con 20 autori: tutti, «& Autore20»', apa20.indexOf(', & Autore20, N. (2023)') > 0 && apa20.indexOf('. . .') < 0);
att('R2 IEEE con 25 autori: «N. Autore1 et al.»; volume numerico e titolo stringa letti', 'N. Autore1 et al., “Observation of an imaginary resonance,” Physical Imaginary Letters, vol. 130, pp. 101801–101805, 2023, doi: 10.5555/grande.collab.25.', Ci.ieee(r2));
att('R2 ISO 690: primo autore ed «et al.»', 'AUTORE1, NomeA et al. Observation of an imaginary resonance. Physical Imaginary Letters. 2023, vol. 130, pp. 101801–101805. DOI 10.5555/grande.collab.25.', Ci.iso690(r2));
const bib2 = Ci.bibtex(r2);
att('R2 BibTeX: 25 autori (24 «and»), pagine con «--», chiave autore2023observation (solo lettere dal cognome)', '24|true|autore2023observation', [(bib2.match(/ and /g) || []).length, bib2.indexOf('pages = {101801--101805}') > 0, Ci.chiaveBibtex(r2)].join('|'));

const R3 = { status: 'ok', message: { type: 'book', title: ['Laboratory Biosafety Manual'], author: [{ name: 'World Health Organization', sequence: 'first' }],
  publisher: 'World Health Organization', 'published-print': { 'date-parts': [[2020, 12]] }, DOI: '10.9999/who.lbm' } };
const r3 = Ci.daCrossref(R3);
att('R3 ente autore, APA: «World Health Organization. (2020).», titolo in corsivo, editore uguale all’autore omesso', 'World Health Organization. (2020). <i>Laboratory Biosafety Manual</i>. https://doi.org/10.9999/who.lbm', Ci.apa(r3, true));
att('R3 IEEE libro con ente', 'World Health Organization, Laboratory Biosafety Manual. World Health Organization, 2020, doi: 10.9999/who.lbm.', Ci.ieee(r3));
att('R3 BibTeX: @book, ente fra graffe doppie, chiave world2020laboratory', true, /^@book\{world2020laboratory,\n  author = \{\{World Health Organization\}\},/.test(Ci.bibtex(r3)) && Ci.bibtex(r3).indexOf('publisher = {World Health Organization}') > 0);
const misto = Ci.daCrossref({ message: { title: ['Collab paper'], author: [{ given: 'Ada', family: 'Lovelace' }, { name: 'ATLAS Collaboration' }], DOI: '10.1/2', type: 'journal-article', 'container-title': ['J'], issued: { 'date-parts': [[2012]] } } });
att('autori misti persona + ente: APA e IEEE', 'Lovelace, A., & ATLAS Collaboration. (2012).|A. Lovelace and ATLAS Collaboration,', Ci.apa(misto).slice(0, 44) + '|' + Ci.ieee(misto).slice(0, 36));
att('iniziali: «Jean-Paul» → J.-P., «Maria  Luisa» → M. L., «Émile» → É.', 'J.-P.|M. L.|É.', [Ci.iniziali('Jean-Paul'), Ci.iniziali('Maria  Luisa'), Ci.iniziali('Émile')].join('|'));
att('lettura tollerante: risposta d’altra forma (lista vuota), null, testo → null', 'null|null|null', [Ci.daCrossref({ status: 'ok', message: { items: [] } }), Ci.daCrossref(null), Ci.daCrossref('<html>')].map(String).join('|'));
att('senza anno: APA scrive (n.d.)', true, Ci.apa({ tipo: 'articolo', titolo: 'X', autori: [{ cognome: 'Neri', nome: 'Ugo' }] }).indexOf('Neri, U. (n.d.). X.') === 0);

console.log('── DOI ──');
const casi = [
  ['10.1103/PhysRev.47.777', '10.1103/PhysRev.47.777'],
  ['https://doi.org/10.1103/PhysRev.47.777', '10.1103/PhysRev.47.777'],
  ['http://dx.doi.org/10.1000/xyz123', '10.1000/xyz123'],
  ['doi:10.1000/xyz123.', '10.1000/xyz123'],
  ['DOI: 10.1000/xyz123', '10.1000/xyz123'],
  ['  10.1021/ja00001a001  ', '10.1021/ja00001a001'],
  ['https://doi.org/10.1002%2Fanie.201915678', '10.1002/anie.201915678'],
  ['doi.org/10.1038/nature14539', '10.1038/nature14539'],
  ['(vedi 10.1016/0006-2952(75)90175-2)', null],
  ['10.1016/0006-2952(75)90175-2)', '10.1016/0006-2952(75)90175-2'],
  ['10.1002/(SICI)1097-4636(199707)35:1<1::AID-JBM1>3.0.CO;2-T', '10.1002/(SICI)1097-4636(199707)35:1<1::AID-JBM1>3.0.CO;2-T'],
  ['11.1000/x', null], ['10.12/abc', null], ['ciao', null], ['', null], ['10.1000/ab cd', null], [null, null]
];
const esitiDoi = casi.map(c => Ci.normalizzaDoi(c[0]) === c[1]);
att('normalizzazione dei DOI: ' + casi.length + ' casi', casi.length, esitiDoi.filter(Boolean).length);
casi.forEach((c, i) => { if (!esitiDoi[i]) console.log('      caso fallito: ' + JSON.stringify(c[0]) + ' → ' + Ci.normalizzaDoi(c[0])); });
att('URL Crossref: barra non codificata, mailto presente', 'https://api.crossref.org/works/10.1002/(SICI)1097-4636(199707)35%3A1%3C1%3A%3AAID-JBM1%3E3.0.CO%3B2-T?mailto=biospecinfo@users.noreply.github.com', Ci.urlCrossref('10.1002/(SICI)1097-4636(199707)35:1<1::AID-JBM1>3.0.CO;2-T'));

/* ═══ 2. UNITA' E COSTANTI ═══ */
console.log('── Conversioni ──');
att('1 eV = 1.602176634e-19 J esatto', 1.602176634e-19, U.converti(1, 'eV', 'J'));
att('1 cal = 4.184 J', 4.184, U.converti(1, 'cal', 'J'));
att('1 atm = 101325 Pa', 101325, U.converti(1, 'atm', 'Pa'));
vicino('1 Hartree = 27.211386245988 eV', 27.211386245988, U.converti(1, 'Eh', 'eV'), 2e-14);
vicino('1 cm⁻¹ = 1.239841984e-4 eV (10 cifre stampate)', 1.239841984e-4, U.converti(1, 'cm-1', 'eV'), 5e-10);
vicino('1 eV = 8065.543937 cm⁻¹ (inverso)', 8065.543937, U.converti(1, 'eV', 'cm-1'), 1e-10);
att('0 °C = 273.15 K; −40 °C = −40 °F; 0 K = −459.67 °F', '273.15|-40|-459.67', [U.converti(0, '°C', 'K'), +U.converti(-40, '°C', '°F').toFixed(10), +U.converti(0, 'K', '°F').toFixed(10)].join('|'));
vicino('1 eV ↔ K tramite k_B: 11604.51812 K (K risolto come energia perché eV lo è)', 11604.51812, U.converti(1, 'eV', 'K'), 1e-9);
vicino('1 kcal/mol = 0.0433641 eV', 0.04336410, U.converti(1, 'kcal/mol', 'eV'), 1e-6);
vicino('1 kWh = 3.6e6 J, 1 erg = 1e-7 J', 3.6e6 + 1e-7, U.converti(1, 'kWh', 'J') + U.converti(1, 'erg', 'J'), 1e-15);
vicino('760 Torr = 1 atm; 1 psi = 6894.757293168 Pa', 1 + 6894.757293168, U.converti(760, 'Torr', 'atm') + U.converti(1, 'psi', 'Pa'), 1e-12);
vicino('1 G = 1e-4 T; 1 hp = 745.69987158227 W', 1e-4 + 745.69987158227, U.converti(1, 'G', 'T') + U.converti(1, 'hp', 'W'), 1e-13);
vicino('1 pc = 206264.806 au; 1 au = 149597870700 m', 206264.80624709636, U.converti(1, 'pc', 'au'), 1e-14);
vicino('180° = π rad; 1 Ah = 3600 C', Math.PI + 3600, U.converti(180, '°', 'rad') + U.converti(1, 'Ah', 'C'), 1e-15);
{
  let errori = [], n = 0;
  Object.keys(U.GRANDEZZE).forEach(g => { const uu = U.GRANDEZZE[g].unita; uu.forEach(p => uu.forEach(q => { n++; const v = 1.2345; const r = U.converti(U.converti(v, g + ':' + p.k, g + ':' + q.k), g + ':' + q.k, g + ':' + p.k); if (Math.abs(r - v) > 1e-12 * Math.abs(v)) errori.push(g + ' ' + p.k + '↔' + q.k); })); });
  vero('andata e ritorno su tutte le ' + n + ' coppie di unità di ogni grandezza', !errori.length, errori.slice(0, 5).join(', ') || n + ' coppie');
  let dim = 0, rif = 0;
  [['eV', 'm'], ['J', 'Pa'], ['°C', 'eV'], ['T', 'C'], ['rad', 's'], ['kg', 'u2']].forEach(c => { try { U.converti(1, c[0], c[1]); } catch (e) { if (e.incompatibili) dim++; else rif++; } });
  att('controllo dimensionale: 5 coppie incompatibili rifiutate come tali, 1 unità sconosciuta', '5|1', dim + '|' + rif);
  att('«energia:K» e «temperatura:K» si distinguono', '1.380649e-23|1', [U.converti(1, 'energia:K', 'J'), U.converti(1, 'temperatura:K', '°C') === -272.15 ? 1 : 0].join('|'));
  const nomi = Object.keys(U.GRANDEZZE).every(g => Array.isArray(U.GRANDEZZE[g].nm) && U.GRANDEZZE[g].unita.every(u => u.k && typeof u.nm === 'string'));
  vero('forma esportata: GRANDEZZE.<k>.nm [it,en], unita [{k, nm}]; 10 grandezze', nomi && Object.keys(U.GRANDEZZE).length === 10, Object.keys(U.GRANDEZZE).join(','));
}

console.log('── Costanti CODATA 2018 ──');
const K = {}; U.COSTANTI.forEach(c => { K[c.k] = c; });
vero('almeno 35 costanti, campi completi', U.COSTANTI.length >= 35 && U.COSTANTI.every(c => c.k && c.nm.length === 2 && c.simbolo && isFinite(c.valore) && isFinite(c.incertezza) && c.unita && typeof c.esatta === 'boolean'), U.COSTANTI.length + ' costanti');
att('le 7 costanti definitorie del SI sono esatte con incertezza 0', 'c,h,e,kB,NA,nuCs,Kcd', U.COSTANTI.filter(c => c.def && c.esatta && c.incertezza === 0).map(c => c.k).join(','));
vero('ogni costante esatta ha incertezza 0, ogni misurata > 0', U.COSTANTI.every(c => c.esatta ? c.incertezza === 0 : c.incertezza > 0));
/* le esatte derivate, calcolate nel modulo, contro i valori stampati da CODATA */
[['hbar', 1.054571817e-34], ['R', 8.314462618], ['F', 96485.33212], ['sigma', 5.670374419e-8], ['Phi0', 2.067833848e-15], ['G0', 7.748091729e-5], ['KJ', 483597.8484e9], ['RK', 25812.80745], ['c1', 3.741771852e-16], ['c2', 1.438776877e-2], ['Vm', 22.41396954e-3], ['n0', 2.686780111e25]]
  .forEach(p => vicino('esatta derivata ' + p[0] + ' = valore CODATA stampato (troncato a 10 cifre)', p[1], K[p[0]].valore, 1e-9));
/* le misurate contro relazioni indipendenti */
const c = K.c.valore, h = K.h.valore, hb = K.hbar.valore, e = K.e.valore, me = K.me.valore, al = K.alpha.valore;
vicino('Wien: b = c₂ / x, x radice di x = 5(1 − e^(−x))', K.b.valore, K.c2.valore / 4.965114231744276, 1e-9);
vicino('α⁻¹ = 1/α', K.alphainv.valore, 1 / al, 1e-10);
vicino('R∞ = α² m_e c / (2h)', K.Rinf.valore, al * al * me * c / (2 * h), 1e-9);
vicino('a₀ = ħ / (m_e c α)', K.a0.valore, hb / (me * c * al), 1e-9);
vicino('E_h = 2 R∞ h c; E_h/e = valore in eV', K.Eh.valore + K.EheV.valore, 2 * K.Rinf.valore * h * c + 2 * K.Rinf.valore * h * c / e, 1e-11);
vicino('μ_B = eħ/(2m_e); μ_N = eħ/(2m_p)', K.muB.valore + K.muN.valore * 1e3, e * hb / (2 * me) + e * hb / (2 * K.mp.valore) * 1e3, 1e-9);
vicino('r_e = α² a₀; λ_C = h/(m_e c); σ_e = (8π/3) r_e²', K.re.valore * 1e15 + K.lC.valore * 1e12 + K.sigmae.valore * 1e29, al * al * K.a0.valore * 1e15 + h / (me * c) * 1e12 + 8 * Math.PI / 3 * Math.pow(K.re.valore, 2) * 1e29, 1e-9);
vicino('ε₀ = 1/(μ₀ c²); Z₀ = μ₀ c', K.eps0.valore * 1e12 + K.Z0.valore, 1 / (K.mu0.valore * c * c) * 1e12 + K.mu0.valore * c, 1e-10);
vicino('m_e c²/e = 0.51099895 MeV; m_p/m_e', K.mec2.valore + K.mpme.valore, me * c * c / e / 1e6 + K.mp.valore / me, 1e-9);
vicino('μ_e = (g_e/2) μ_B', K.mue.valore, K.ge.valore / 2 * K.muB.valore, 1e-9);
vicino('M_u = N_A m_u', K.Mu.valore, K.NA.valore * K.mu.valore, 1e-9);

/* ═══ 3. TAVOLE ═══ */
console.log('── Tavole matematiche ──');
{
  let n = 0, bad = [];
  T.DERIVATE.forEach(v => { if (!v.prova) return; v.prova.x.forEach(x => { n++; const f = v.prova.f, hh = 1e-3 * Math.max(1, Math.abs(x)); const num = (8 * (f(x + hh) - f(x - hh)) - (f(x + 2 * hh) - f(x - 2 * hh))) / (12 * hh); const an = v.prova.df(x); if (Math.abs(num - an) > 1e-7 * Math.max(1, Math.abs(an))) bad.push(v.nm[0] + ' x=' + x + ' ' + num + ' vs ' + an); }); });
  vero('derivate: ' + T.DERIVATE.filter(v => v.prova).length + ' formule in ' + n + ' punti contro le differenze finite (Richardson)', !bad.length, bad.join('; ') || n + ' punti');
}
{
  const ind = T.INTEGRALI.filter(v => v.prova && v.prova.F), def = T.INTEGRALI.filter(v => v.prova && v.prova.valore != null);
  vero('almeno 40 integrali in tavola', T.INTEGRALI.length >= 40, T.INTEGRALI.length + ' voci, ' + ind.length + ' indefiniti e ' + def.length + ' definiti con prova');
  let bad = [];
  ind.forEach(v => { const p = v.prova, q = integra(p.f, p.a, p.b), an = p.F(p.b) - p.F(p.a); if (Math.abs(q - an) > 1e-10 * Math.max(1, Math.abs(an))) bad.push(v.nm[0] + ': ' + q + ' vs ' + an); });
  vero('integrali indefiniti: F(b) − F(a) = quadratura di f su [a, b] (' + ind.length + ')', !bad.length, bad.join('; ') || 'tutti entro 1e-10');
  bad = [];
  def.forEach(v => { const p = v.prova, q = integra(p.f, p.a, p.b); if (Math.abs(q - p.valore) > 1e-9 * Math.max(1, Math.abs(p.valore))) bad.push(v.nm[0] + ': ' + q + ' vs ' + p.valore); });
  vero('integrali definiti (anche impropri e singolari) per quadratura (' + def.length + ')', !bad.length, bad.join('; ') || 'tutti entro 1e-9');
}
{
  let bad = [], n = 0, raggi = [];
  T.SERIE.forEach(v => {
    if (!v.prova) return;
    const p = v.prova, cf = typeof p.c === 'function' ? p.c : (k => k < p.c.length ? p.c[k] : 0), N = typeof p.c === 'function' ? 80 : p.c.length;
    p.x.forEach(x => { n++; let s = 0; for (let k = 0; k < N; k++) s += cf(k) * Math.pow(x, k); const f = p.f(x), tol = typeof p.c === 'function' ? 1e-12 : 1e-8; if (Math.abs(s - f) > tol * Math.max(1, Math.abs(f))) bad.push(v.nm[0] + ' x=' + x + ': ' + s + ' vs ' + f); });
    if (typeof p.c === 'function') {
      /* raggio di convergenza: Cauchy-Hadamard su un coefficiente lontano non nullo */
      /* per R = ∞ la stima |c_k|^(−1/k) deve crescere senza limite (raddoppiando k cresce di più del 30 %) */
      const stimaDi = k0 => { let k = k0; while (cf(k) === 0) k++; return Math.pow(Math.abs(cf(k)), -1 / k); };
      const stima = v.raggio === '∞' ? stimaDi(120) / stimaDi(60) : stimaDi(801);
      const giusto = v.raggio === '∞' ? stima > 1.3 : Math.abs(stima - 1) < 0.02;
      raggi.push(giusto); if (!giusto) bad.push(v.nm[0] + ': raggio stimato ' + stima + ' per ' + v.raggio);
    }
  });
  vero('serie: somme parziali contro la funzione in ' + n + ' punti; raggio di Cauchy-Hadamard coerente in ' + raggi.length + ' serie', !bad.length, bad.join('; ') || 'ok');
}
{
  const r = (s => () => { s = (s + 0x6D2B79F5) >>> 0; let q = Math.imul(s ^ (s >>> 15), 1 | s); q = (q + Math.imul(q ^ (q >>> 7), 61 | q)) ^ q; return ((q ^ (q >>> 14)) >>> 0) / 4294967296; })(237);
  let bad = [], n = 0;
  T.IDENTITA.forEach(v => { if (!v.prova) return; for (let i = 0; i < 50; i++) { const x = -0.7 + 1.4 * r(), y = -0.7 + 1.4 * r(); n++; const l = v.prova.l(x, y), rr = v.prova.r(x, y); if (Math.abs(l - rr) > 1e-12 * Math.max(1, Math.abs(l))) bad.push(v.nm[0]); } });
  vero('identità trigonometriche e iperboliche: ' + T.IDENTITA.filter(v => v.prova).length + ' in ' + n + ' punti casuali', !bad.length, bad.slice(0, 4).join(', ') || n + ' punti');
}
{
  const conProva = T.LAPLACE.filter(v => v.prova);
  let bad = [];
  conProva.forEach(v => { const s = 2, g = t => v.prova.f(t) * Math.exp(-s * t); const q = integra(g, 0, 1) + integra(g, 1, Infinity), an = v.prova.F(s); if (Math.abs(q - an) > 1e-9 * Math.max(1, Math.abs(an))) bad.push(v.nm[0] + ': ' + q + ' vs ' + an); });
  vero('Laplace: ' + conProva.length + ' coppie (≥ 25) per integrazione numerica a s = 2', conProva.length >= 25 && !bad.length, bad.join('; ') || 'tutte entro 1e-9');
}
{
  const conProva = T.FOURIER.filter(v => v.prova);
  let bad = [];
  conProva.forEach(v => { const p = v.prova; [0.4, 1.3, 2.7].forEach(w => {
    const a = p.a != null ? p.a : -(p.f(1000) > 1e-12 ? 40000 : 60), b = p.b != null ? p.b : -a, n = Math.ceil((b - a) * 4);
    const re = gl(t => p.f(t) * Math.cos(w * t), a, b, n), im = gl(t => -p.f(t) * Math.sin(w * t), a, b, n);
    if (Math.abs(re - p.re(w)) > 2e-7 || Math.abs(im - p.im(w)) > 2e-7) bad.push(v.nm[0] + ' ω=' + w + ': ' + re + (im >= 0 ? '+' : '') + im + 'i vs ' + p.re(w) + (p.im(w) >= 0 ? '+' : '') + p.im(w) + 'i');
  }); });
  vero('Fourier: ' + conProva.length + ' coppie (parte reale e immaginaria) a ω = 0,4; 1,3; 2,7', !bad.length, bad.join('; ') || 'ok');
}
{
  const V = {}; T.COSTANTI_MAT.forEach(x => { V[x.simbolo] = +x.valore; });
  let H = 0; const n = 1000; for (let k = 1; k <= n; k++) H += 1 / k;
  let z3 = 0; for (let k = 1; k <= 1000; k++) z3 += 1 / (k * k * k); z3 += 1 / (2e6) - 1 / (2e9) + 1 / (4e12);
  let G = 0, Gp = 0; for (let k = 0; k <= 100000; k++) { Gp = G; G += (k % 2 ? -1 : 1) / ((2 * k + 1) * (2 * k + 1)); }
  /* Glaisher: ln A = (γ + ln 2π − 6 ζ′(2)/π²)/12, con −ζ′(2) = Σ ln k / k² e la coda di Eulero-Maclaurin */
  const gam = H - Math.log(n) - 1 / (2 * n) + 1 / (12 * n * n) - 1 / (120 * Math.pow(n, 4));
  let S2 = 0; const N2 = 1000; for (let k = 2; k <= N2; k++) S2 += Math.log(k) / (k * k);
  const LN = Math.log(N2); S2 += (LN + 1) / N2 - LN / (2 * N2 * N2) - (1 - 2 * LN) / (12 * Math.pow(N2, 3)) + (26 - 24 * LN) / (720 * Math.pow(N2, 5));
  const lnA = (gam + Math.log(2 * Math.PI) + 6 * S2 / (Math.PI * Math.PI)) / 12;
  const rif = { 'π': Math.PI, 'e': Math.E, 'γ': H - Math.log(n) - 1 / (2 * n) + 1 / (12 * n * n) - 1 / (120 * Math.pow(n, 4)), '√2': Math.SQRT2, '√3': Math.sqrt(3), 'φ': (1 + Math.sqrt(5)) / 2, 'ln 2': Math.LN2, 'ln 10': Math.LN10, 'ζ(2) = π²/6': Math.PI * Math.PI / 6, 'ζ(3)': z3, 'G': (G + Gp) / 2, 'e^π': Math.exp(Math.PI), 'A': Math.exp(lnA) };
  const bad = Object.keys(rif).filter(k => !(Math.abs(V[k] - rif[k]) <= 6e-15 * Math.abs(rif[k])));
  vero('costanti matematiche: ' + Object.keys(rif).length + ' ricalcolate (γ, ζ(3), G e A per serie con correzioni di Eulero-Maclaurin) entro 15 cifre', !bad.length, bad.map(k => k + ' ' + V[k] + ' vs ' + rif[k]).join('; ') || 'ok');
  vero('ogni costante matematica ha esattamente 15 cifre significative', T.COSTANTI_MAT.every(x => x.valore.replace(/^0\.0*|\./g, '').length === 15));
}
vero('forma delle tavole: ogni voce ha { nm, f, nota } o { nm, valore }', ['DERIVATE', 'INTEGRALI', 'SERIE', 'LAPLACE', 'FOURIER', 'IDENTITA', 'COSTANTI_MAT'].every(k => T[k].length && T[k].every(v => v.nm && (v.f != null && v.nota != null || v.valore != null))));

/* ═══ 4. LINK E LIBRI ═══ */
console.log('── Link e bibliografia ──');
{
  const tutti = [];
  ['fisica', 'matematica', 'chimica'].forEach(m => { R.LINK[m].forEach(x => tutti.push([m, x])); });
  att('link per materia ≥ 45 (fisica, matematica, chimica)', 'true,true,true', ['fisica', 'matematica', 'chimica'].map(m => R.LINK[m].length >= 45).join(','));
  console.log('      ' + ['fisica', 'matematica', 'chimica'].map(m => m + ' ' + R.LINK[m].length).join(', '));
  const malformati = tutti.filter(p => { try { const u = new URL(p[1].url); return u.protocol !== 'https:' || !/\./.test(u.hostname) || /\s/.test(p[1].url); } catch (e) { return true; } });
  vero('tutti i ' + tutti.length + ' indirizzi sono https sintatticamente validi', !malformati.length, malformati.map(p => p[1].url).join(' ') || 'ok');
  const visti = {}, doppi = []; tutti.forEach(p => { const k = p[1].url.replace(/\/$/, '').toLowerCase(); if (visti[k]) doppi.push(p[1].url); visti[k] = 1; });
  vero('nessun indirizzo ripetuto (anche fra materie)', !doppi.length, doppi.join(' ') || 'ok');
  vero('ogni link ha nome, descrizione italiana e categoria nota', tutti.every(p => p[1].nm && p[1].d && p[1].d.length > 10 && R.CATEGORIE[p[1].cat]));
  const tr = tutti.map(p => R.linkTradotto(p[1].url));
  vero('link «leggi in italiano»: https, host *.translate.goog, _x_tr_tl=it, unici', tr.every(u => { const x = new URL(u); return x.protocol === 'https:' && /\.translate\.goog$/.test(x.hostname) && x.searchParams.get('_x_tr_tl') === 'it'; }) && new Set(tr).size === tr.length);
  att('traduzione: trattini raddoppiati, query e ancora conservate', 'https://www--nds-iaea-org.translate.goog/relnsd/v.html?a=1&_x_tr_sl=auto&_x_tr_tl=it&_x_tr_hl=it#sez', R.linkTradotto('https://www-nds.iaea.org/relnsd/v.html?a=1#sez'));
}
{
  const ok35 = ['fisica', 'matematica', 'chimica'].map(m => R.LIBRI[m].length >= 35);
  att('libri per materia ≥ 35', 'true,true,true', ok35.join(','));
  console.log('      ' + ['fisica', 'matematica', 'chimica'].map(m => m + ' ' + R.LIBRI[m].length).join(', '));
  const libri = [].concat(R.LIBRI.fisica, R.LIBRI.matematica, R.LIBRI.chimica);
  vero('tutti i livelli presenti per ogni materia', ['fisica', 'matematica', 'chimica'].every(m => Object.keys(R.LIVELLI).every(l => R.LIBRI[m].some(b => b.livello === l))));
  const conAnni = libri.filter(b => /\b(1[4-9]|20)\d\d\b|ISBN|97[89][- ]?\d/.test(b.autori + ' ' + b.titolo + ' ' + b.editore));
  vero('nessun anno e nessun ISBN nei libri', !conAnni.length, conAnni.map(b => b.titolo).join('; ') || libri.length + ' libri');
  const url = []; libri.forEach(b => { const c = R.cercaLibro(b); url.push(c.google, c.worldcat, c.sbn); });
  vero('ricerche dei libri (Google Libri, WorldCat, OPAC SBN): ' + url.length + ' indirizzi https validi e unici', url.every(u => { try { return new URL(u).protocol === 'https:'; } catch (e) { return false; } }) && new Set(url).size === url.length);
  att('cercaLibro: titolo senza note fra parentesi + primo cognome', 'Physics Halliday|https://www.worldcat.org/search?q=Physics%20Halliday', (() => { const c = R.cercaLibro(R.LIBRI.fisica[0]); return c.q + '|' + c.worldcat; })());
}

console.log(`\n${ok} superati, ${ko} falliti`);
process.exit(ko ? 1 : 0);
