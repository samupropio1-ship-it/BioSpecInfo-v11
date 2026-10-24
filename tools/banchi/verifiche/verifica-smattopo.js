// verifica di F.calcolo.topologia contro risultati noti e metodi indipendenti
const C = require('./carica.js')(['bsi-mat-topologia.js']);
const T = C.topologia; let ok = 0, ko = 0;
function prova(nome, val, cond) { const r = !!cond; r ? ok++ : ko++; console.log((r ? 'OK ' : 'KO ') + nome + ' → ' + val); }

// 1. χ dai dati per tutti i solidi, contro i valori noti e contro la formula di Schläfli {p,q}
const atteso = { tetra: [4, 6, 4, 2], cubo: [8, 12, 6, 2], otta: [6, 12, 8, 2], dode: [20, 30, 12, 2], icosa: [12, 30, 20, 2], prisma: [12, 18, 8, 2], cornice: [16, 32, 16, 0] };
Object.keys(atteso).forEach(k => { const e = T.eulero(T.SOLIDI[k][1]()), a = atteso[k];
  prova(`${k}: V,S,F,χ dai dati; superficie chiusa`, [e.V, e.S, e.F, e.chi].join(',') + (e.chiusa ? ' chiusa' : ' APERTA'), e.V === a[0] && e.S === a[1] && e.F === a[2] && e.chi === a[3] && e.chiusa); });
// Schläfli: per {p,q}, E = 2pq·... formula E = 2pq/(2p + 2q − pq) ... qui: E = 4pq/(4 − (p−2)(q−2)) / 2
const sch = { tetra: [3, 3], cubo: [4, 3], otta: [3, 4], dode: [5, 3], icosa: [3, 5] };
Object.keys(sch).forEach(k => { const [p, q] = sch[k], E = 2 * p * q / (2 * p + 2 * q - p * q), V = 2 * E / q, Fn = 2 * E / p, e = T.eulero(T.SOLIDI[k][1]()), lati = Object.keys(e.lati);
  prova(`${k} {${p},${q}}: Schläfli V,E,F = ${V},${E},${Fn}; facce tutte ${p}-goni`, [e.V, e.S, e.F].join(','), e.V === V && e.S === E && e.F === Fn && lati.length === 1 && +lati[0] === p); });
// grado dei vertici = q (secondo controllo indipendente dai conteggi)
{ const e = T.eulero(T.SOLIDI.dode[1]()), gr = {}; e.spigoli.forEach(([a, b]) => { gr[a] = (gr[a] || 0) + 1; gr[b] = (gr[b] || 0) + 1; });
  prova('dodecaedro: ogni vertice ha grado 3', [...new Set(Object.values(gr))].join(','), Object.values(gr).every(g => g === 3)); }
prova('cornice: genere g = 1', T.eulero(T.SOLIDI.cornice[1]()).g, T.eulero(T.SOLIDI.cornice[1]()).g === 1);

// 2. superfici: χ, bordi e orientabilita' combinatoria dalla maglia incollata, per due risoluzioni
const sup = { sfera: [2, 0, true], toro: [0, 0, true], cilindro: [0, 2, true], mobius: [0, 1, false], klein: [0, 0, false] };
Object.keys(sup).forEach(k => { const a = T.maglia(k, 48, 16), b = T.maglia(k, 31, 9), s = sup[k];
  prova(`maglia ${k}: χ, bordi, orientabile (48×16 e 31×9)`, `${a.chi},${a.bordi},${a.orientabile} / ${b.chi},${b.bordi},${b.orientabile}`, a.chi === s[0] && a.bordi === s[1] && a.orientabile === s[2] && b.chi === s[0] && b.bordi === s[1] && b.orientabile === s[2]); });
// 3. trasporto della normale lungo il giro: Möbius e Klein capovolta (−1), toro/sfera/cilindro conservata (+1)
const tr = { mobius: -1, klein: -1, toro: 1, sfera: 1, cilindro: 1 };
Object.keys(tr).forEach(k => { const r = T.trasporta(k); prova(`trasporto normale ${k}: n_fine·n_inizio (giro chiuso)`, r.prodotto.toFixed(9) + (r.chiuso ? ' chiuso' : ' APERTO'), Math.abs(r.prodotto - tr[k]) < 1e-6 && r.chiuso); });
// Möbius: dopo due giri la freccia torna com'era (formula analitica, 4π-periodica)
{ const n0 = T.normale('mobius', 0, 0), n1 = T.normale('mobius', 2 * Math.PI, 0), n2 = T.normale('mobius', 4 * Math.PI, 0), d = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  prova('Möbius: n(2π)·n(0) = −1, n(4π)·n(0) = +1', d(n1, n0).toFixed(9) + ', ' + d(n2, n0).toFixed(9), Math.abs(d(n1, n0) + 1) < 1e-9 && Math.abs(d(n2, n0) - 1) < 1e-9); }
// Möbius: normale analitica a v = 0 (secondo metodo): P_u = (−R sin u, R cos u, 0), P_v = ½(cos(u/2) cos u, cos(u/2) sin u, sin(u/2))
{ let m = 0; for (let u = 0; u < 2 * Math.PI; u += 0.3) { const R = 1.3, Pu = [-R * Math.sin(u), R * Math.cos(u), 0], Pv = [0.5 * Math.cos(u / 2) * Math.cos(u), 0.5 * Math.cos(u / 2) * Math.sin(u), 0.5 * Math.sin(u / 2)];
    const n = [Pu[1] * Pv[2] - Pu[2] * Pv[1], Pu[2] * Pv[0] - Pu[0] * Pv[2], Pu[0] * Pv[1] - Pu[1] * Pv[0]], l = Math.hypot(...n), nn = T.normale('mobius', u, 0); m = Math.max(m, Math.hypot(nn[0] - n[0] / l, nn[1] - n[1] / l, nn[2] - n[2] / l)); }
  prova('Möbius: normale numerica = analitica', m.toExponential(2), m < 1e-8); }

// 4. poligoni fondamentali: classi di vertici e χ
const pol = { sfera: [3, 2, true, 0], toro: [1, 0, true, 1], proiettivo: [2, 1, false, 1], klein: [1, 0, false, 2], genere2: [1, -2, true, 2], bottiglia2: [1, 0, false, 2] };
Object.keys(pol).forEach(k => { const r = T.poligono(T.PAROLE[k]), a = pol[k];
  prova(`poligono ${k} (${T.PAROLE[k]}): classi di vertici, χ, orientabile, genere`, [r.V, r.chi, r.orientabile, r.genere].join(','), r.V === a[0] && r.chi === a[1] && r.orientabile === a[2] && r.genere === a[3]); });
prova('parola non valida (aab) rifiutata', T.poligono('aab'), T.poligono('aab') === null);
// coerenza fra i due metodi: il poligono del toro e la maglia del toro danno lo stesso χ; Klein idem
prova('χ coerente: poligono vs maglia (toro, Klein)', [T.poligono('abAB').chi, T.maglia('toro', 20, 10).chi, T.poligono('abAb').chi, T.maglia('klein', 20, 10).chi].join(','), T.poligono('abAB').chi === T.maglia('toro', 20, 10).chi && T.poligono('abAb').chi === T.maglia('klein', 20, 10).chi);

// 5. nodi: incroci, colorazioni (Gauss mod p e forza bruta), determinante
const nodi = { banale: [0, 3, 1, 5], riccio: [1, 3, 1, 5], trifoglio: [3, 9, 3, 5], otto: [4, 3, 5, 25], cinque: [5, 3, 5, 25] };
Object.keys(nodi).forEach(k => { const D = T.diagramma(k), a = nodi[k], c3 = T.colorazioni(D, 3), b3 = T.elencoColorazioni(D, 3).length, det = T.determinante(D), c5 = T.colorazioni(D, 5), b5 = T.elencoColorazioni(D, 5).length;
  prova(`nodo ${k}: incroci, 3-col (Gauss/bruta), det, 5-col (Gauss/bruta)`, `${D.incroci.length}, ${c3}/${b3}, ${det}, ${c5}/${b5}`, D.incroci.length === a[0] && c3 === a[1] && b3 === a[1] && det === a[2] && c5 === a[3] && b5 === a[3]); });
// la risoluzione del campionamento non cambia il diagramma
prova('trifoglio con 300 e 1200 campioni: 3 incroci, 9 colorazioni', [300, 1200].map(M => { const D = T.diagramma('trifoglio', M); return D.incroci.length + '/' + T.colorazioni(D, 3); }).join(', '), [300, 1200].every(M => { const D = T.diagramma('trifoglio', M); return D.incroci.length === 3 && T.colorazioni(D, 3) === 9; }));
// diagramma alternante: lungo il trifoglio gli incroci si alternano sopra/sotto
{ const D = T.diagramma('trifoglio'), ev = []; D.incroci.forEach(x => { ev.push([x.sopra, 'S']); ev.push([x.sotto, 's']); }); ev.sort((a, b) => a[0] - b[0]); const alt = ev.every((e, i) => e[1] !== ev[(i + 1) % ev.length][1]);
  prova('trifoglio: diagramma alternante (sopra/sotto/sopra…)', ev.map(e => e[1]).join(''), alt); }
// p divide det ⇔ colorazioni > p (7 non divide 3 ne' 5)
prova('nessun nodo della lista è 7-colorabile', Object.keys(nodi).map(k => T.colorazioni(T.diagramma(k), 7)).join(','), Object.keys(nodi).every(k => T.colorazioni(T.diagramma(k), 7) === 7));
console.log('\n' + ok + ' superati, ' + ko + ' falliti');
