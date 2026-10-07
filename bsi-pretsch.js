/* ═══════════════════════════════════════════════════════════════════════════
   BSI PRETSCH — le tabelle di stima, trascritte dalla fonte

   PERCHE' UN FILE SOLO DI NUMERI

   Fino a ieri `bsi-nmr.js` conteneva venticinque incrementi benzenici scelti
   a mano, quattro correzioni steriche e una manciata di «valori di classe»
   per i carboni sp3. Funzionavano, ma erano un RIASSUNTO: dove il riassunto
   non arrivava, il predittore restituiva il valore del benzene nudo e
   taceva. Un H aromatico usciva sempre a 7,26 — qualunque fosse il
   sostituente — e un H vinilico sempre a 5,35.

   Qui stanno le tabelle INTERE, trascritte da:

     E. Pretsch, P. Bühlmann, M. Badertscher,
     «Structure Determination of Organic Compounds — Tables of Spectral
     Data», 4ª ed., Springer.
       · §4.1  pp. 82-83   ¹³C alifatici: Zi, correzioni steriche Sj,
                           correzioni conformazionali Kk
       · §4.1.2 p. 84      ¹J(C,H) additiva
       · §4.5  pp. 100-102 ¹³C dei benzeni monosostituiti
       · §5.1  p. 170      ¹H degli alcani sostituiti
       · §5.2  pp. 178-179 ¹H degli etileni sostituiti
       · §5.3  p. 182      ¹H degli alchini sostituiti
       · §5.5  pp. 188-189 ¹H dei benzeni monosostituiti

   Stanno in un file loro per tre ragioni pratiche:

   1. Si possono CONTROLLARE riga per riga contro la pagina stampata senza
      leggere il codice che le usa.
   2. Il motore in `bsi-nmr.js` resta un ragionamento: cerca i sostituenti,
      misura le distanze, somma. Non contiene piu' numeri.
   3. Se una riga e' sbagliata, si corregge qui e basta.

   LO SCHEMA DI OGNI TABELLA

   Ogni riga e' [SMARTS, ...incrementi, nome]. Lo SMARTS descrive il
   SOSTITUENTE, e il suo primo atomo e' quello che si attacca allo scheletro
   — cosi' la distanza si misura da li'. Le righe vanno dalla piu' specifica
   alla piu' generica: la PRIMA che corrisponde vince, e le altre non vengono
   provate su quel sostituente. Un metile corrisponde sia a `[CX4H3]` sia al
   generico `[CX4]`; senza questa regola prenderebbe due incrementi.

   CHE COSA NON C'E', E VA DETTO

   · Gli ETEROAROMATICI SOSTITUITI non hanno, in questa fonte, una tabella di
     incrementi per posizione come l'hanno i benzeni. Per il furano, il
     tiofene, il pirrolo e la piridina restano i valori per posizione del
     composto non sostituito, in `bsi-nmr.js`. Un furano con un sostituente
     resta quindi la previsione meno affidabile del modulo, ed e' dichiarata
     come tale.
   · Le correzioni conformazionali Kk richiedono di sapere la conformazione,
     che da uno SMILES non si ricava. Sono trascritte per completezza e per
     chi legge, ma il motore usa «non fissata» → 0,0.

   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';

  /* ═════════════════════════════════════════════════════════════════════════
     §1 · ¹³C dei benzeni monosostituiti        δ(Ci) = 128,5 + Zi
          [SMARTS, Z1 ipso, Z2 orto, Z3 meta, Z4 para, nome]
          Pretsch §4.5, pp. 100-102
     ═════════════════════════════════════════════════════════════════════════ */
  var AR13C = [
    /* ── alogeni (atomo singolo: nessuna ambiguita') ───────────────────────── */
    ['F',  33.6, -13.0,  1.6, -4.4, 'F'],
    ['Cl',  5.3,   0.4,  1.4, -1.9, 'Cl'],
    ['Br', -5.4,   3.3,  2.2, -1.0, 'Br'],
    ['I',  -31.2,  8.9,  1.6, -1.1, 'I'],

    /* ── carbonio sp3 sostituito: prima le catene con un gruppo in β ──────── */
    ['[CX4H2][OX2H1]',                12.4, -1.2,  0.2, -1.1, 'CH₂OH'],
    ['[CX4H2][OX2][CX4]',              8.7, -0.9, -0.1, -0.9, 'CH₂OR'],
    ['[CX4H2][NX3H2]',                14.9, -1.4, -0.2, -2.0, 'CH₂NH₂'],
    ['[CX4H2][NX3H1][CX4]',           12.6, -0.3, -0.3, -1.8, 'CH₂NHR'],
    ['[CX4H2][NX3]([CX4])[CX4]',       7.8,  0.5, -0.3, -1.5, 'CH₂NR₂'],
    ['[CX4H2][$([NX3](=[OX1])=[OX1]),$([NX3+](=[OX1])[OX1-])]',
                                       2.2,  2.2,  2.2,  1.2, 'CH₂NO₂'],
    ['[CX4H2][CX2]#[NX1]',             1.6,  0.5, -0.8, -0.7, 'CH₂CN'],
    ['[CX4H2][SX2H1]',                12.5, -0.6,  0.0, -1.6, 'CH₂SH'],
    ['[CX4H2][SX2][CX4]',              9.8,  0.4, -0.1, -1.6, 'CH₂SR'],
    ['[CX4H2][SX3](=[OX1])[CX4]',      0.8,  1.5,  0.4, -0.2, 'CH₂S(O)R'],
    ['[CX4H2][SX4](=[OX1])(=[OX1])[CX4]',
                                      -0.1,  2.1,  0.6,  0.6, 'CH₂SO₂R'],
    ['[CX4H2][CX3H1]=[OX1]',           7.4,  1.3,  0.5, -1.1, 'CH₂CHO'],
    ['[CX4H2][CX3](=[OX1])[CX4]',      5.8,  0.8,  0.1, -1.6, 'CH₂COR'],
    ['[CX4H2][CX3](=[OX1])[OX2H1]',    6.5,  1.4,  0.4, -1.2, 'CH₂COOH'],
    ['[CX4H2]F',                       8.5, -0.7,  0.4,  0.5, 'CH₂F'],
    ['[CX4](F)(F)F',                   2.5, -3.2,  0.3,  3.3, 'CF₃'],
    ['[CX4H2]Cl',                      9.3,  0.3,  0.2,  0.0, 'CH₂Cl'],
    ['[CX4H1](Cl)Cl',                 11.9, -2.4,  0.1,  1.2, 'CHCl₂'],
    ['[CX4](Cl)(Cl)Cl',               16.3, -1.7, -0.1,  1.8, 'CCl₃'],
    ['[CX4H2]Br',                      9.5,  0.7,  0.3,  0.2, 'CH₂Br'],
    ['[CX4H2]I',                      10.5,  0.0,  0.0, -0.9, 'CH₂I'],

    /* ── alchili semplici ──────────────────────────────────────────────────── */
    ['[CX4;r3]',                      15.1, -3.3, -0.6, -3.6, 'ciclopropile'],
    ['[CX4H1;r5]',                    17.8, -1.5, -0.4, -2.9, 'ciclopentile'],
    ['[CX4H1;r6]',                    16.3, -1.8, -0.3, -2.8, 'cicloesile'],
    ['[CX4H3]',                        9.2,  0.7, -0.1, -3.0, 'CH₃'],
    ['[CX4H2][CX4H3]',                11.7, -0.6, -0.1, -2.8, 'CH₂CH₃'],
    ['[CX4H2][CX4H2][CX4H3]',         10.3, -0.2,  0.1, -2.7, 'CH₂CH₂CH₃'],
    ['[CX4H1]([CX4H3])[CX4H3]',       20.2, -2.2, -0.3, -2.8, 'CH(CH₃)₂'],
    ['[CX4H0]([CX4H3])([CX4H3])[CX4H3]',
                                      18.6, -3.3, -0.4, -3.1, 'C(CH₃)₃'],
    ['[CX4H2]',                       10.9, -0.2, -0.2, -2.8, 'CH₂R (alchile 1°)'],
    ['[CX4H1]',                       20.2, -2.2, -0.3, -2.8, 'CHR₂ (alchile 2°)'],
    ['[CX4H0]',                       18.6, -3.3, -0.4, -3.1, 'CR₃ (alchile 3°)'],

    /* ── insaturi e aromatici ──────────────────────────────────────────────── */
    ['[CX3H1]=[CX3H2]',                8.9, -2.3, -0.1, -0.8, 'CH=CH₂'],
    ['[CX3]([CX4H3])=[CX3H2]',        12.6, -3.1, -0.4, -1.2, 'C(CH₃)=CH₂'],
    ['[CX3]=[CX3]',                    8.9, -2.3, -0.1, -0.8, 'vinile'],
    ['[CX2H1]#[CX2]',                 -6.2,  3.6, -0.4, -0.3, 'C≡CH'],
    ['[c;$(c:[nX2])]',                11.2, -1.4,  0.5, -1.4, '2-piridile'],
    ['[c]',                            8.1, -1.1,  0.5, -1.1, 'fenile'],

    /* ── ossigeno ──────────────────────────────────────────────────────────── */
    ['[OX2][CX3](=[OX1])[#6]',        22.4, -7.1,  0.4, -3.2, 'OCOR'],
    ['[OX2][Si]',                     26.8, -8.4,  0.9, -7.1, 'OSi(CH₃)₃'],
    ['[OX2;$([OX2]([c])[c])]',        27.6, -11.2, -0.3, -6.9, 'O-fenile'],
    ['[OX2][CX3]=[CX3]',              28.2, -11.5, 0.7, -5.8, 'OCH=CH₂'],
    ['[OX2H1]',                       28.8, -12.8, 1.4, -7.4, 'OH'],
    ['[OX2][CX4H3]',                  33.5, -14.4, 1.0, -7.7, 'OCH₃'],
    ['[OX2]',                         33.5, -14.4, 1.0, -7.7, 'OR'],

    /* ── azoto (il nitro e il nitrile PRIMA delle ammine) ──────────────────── */
    ['[$([NX3](=[OX1])=[OX1]),$([NX3+](=[OX1])[OX1-])]',
                                      19.9, -4.9,  0.9,  6.1, 'NO₂'],
    ['[NX2]=[OX1]',                   37.4, -7.6,  0.8,  7.1, 'NO'],
    ['[CX2]#[NX1]',                  -16.0,  3.5,  0.7,  4.3, 'C≡N'],
    ['[NX2]=[CX2]=[OX1]',              5.1, -3.7,  1.1, -2.8, 'NCO'],
    ['[NX2]=[CX2]=[SX1]',              3.0, -2.7,  1.3, -1.0, 'NCS'],
    ['[NX3][CX3]=[OX1]',               9.7, -8.1,  0.2, -4.4, 'NHCOR'],
    ['[NX3][OX2H1]',                  21.5, -13.1, -2.2, -5.3, 'NHOH'],
    ['[NX3][NX3]',                    22.8, -16.5, 0.5, -9.6, 'NHNH₂'],
    ['[NX2]=[CX3]',                   24.7, -6.5,  1.3, -1.5, 'N=CHR'],
    ['[NX3H1;$([NX3H1]([c])[c])]',    14.7, -10.6, 0.9, -10.5, 'NH-fenile'],
    ['[NX3;$([NX3]([c])([c])[c])]',   13.1, -7.0,  0.9, -5.6, 'N(fenile)₂'],
    ['[NX3H1][CX4H3]',                15.0, -16.2, 0.8, -11.6, 'NHCH₃'],
    ['[NX3]([CX4])[CX4]',             16.0, -15.4, 0.9, -10.5, 'N(CH₃)₂'],
    ['[NX3H2]',                       18.2, -13.4, 0.8, -10.0, 'NH₂'],
    ['[NX4+]',                        19.5, -7.3,  2.5,  2.4, 'N⁺(CH₃)₃'],
    ['[NX3]',                         18.2, -13.4, 0.8, -10.0, 'N'],

    /* ── zolfo ─────────────────────────────────────────────────────────────── */
    ['[SX4](=[OX1])(=[OX1])Cl',       15.6, -1.7,  1.2,  6.8, 'SO₂Cl'],
    ['[SX4](=[OX1])(=[OX1])[OX2H1]',  15.0, -2.2,  1.3,  3.8, 'SO₂OH'],
    ['[SX4](=[OX1])(=[OX1])[OX2]',     6.4, -0.6,  1.5,  5.9, 'SO₂OCH₃'],
    ['[SX4](=[OX1])(=[OX1])[NX3]',    10.8, -3.0,  0.3,  3.2, 'SO₂NH₂'],
    ['[SX4](=[OX1])(=[OX1])',         12.3, -1.4,  0.8,  5.1, 'SO₂CH₃'],
    ['[SX3](=[OX1])',                 17.6, -5.0,  1.1,  2.4, 'S(O)CH₃'],
    ['[SX2][CX2]#[NX1]',              -3.7,  2.5,  2.2,  2.2, 'SCN'],
    ['[SX2][SX2]',                     7.5, -1.3,  0.8, -1.1, 'S-S-fenile'],
    ['[SX2;$([SX2]([c])[c])]',         7.3,  2.5,  0.6, -1.5, 'S-fenile'],
    ['[SX2][CX3]=[CX3]',               5.8,  2.0,  0.2, -1.8, 'SCH=CH₂'],
    ['[SX2H1]',                        4.0,  0.7,  0.3, -3.2, 'SH'],
    ['[SX2]',                         10.0, -1.9,  0.2, -3.6, 'SR'],

    /* ── carbonili ─────────────────────────────────────────────────────────── */
    ['[CX3H1]=[OX1]',                  8.2,  1.2,  0.5,  5.8, 'CHO'],
    ['[CX3](=[OX1])[CX4](F)(F)F',     -5.6,  1.8,  0.7,  6.7, 'COCF₃'],
    ['[CX3;$([CX3](=[OX1])([c])[c])]', 9.3,  1.6, -0.3,  3.7, 'CO-fenile'],
    ['[CX3](=[OX1])[OX2H1]',           2.1,  1.6, -0.1,  5.2, 'COOH'],
    ['[CX3](=[OX1])[OX2][#6]',         2.0,  1.2, -0.1,  4.3, 'COOR'],
    ['[CX3](=[OX1])[NX3H2]',           5.0, -1.2,  0.1,  3.4, 'CONH₂'],
    ['[CX3](=[OX1])[NX3]',             6.0, -1.5, -0.2,  1.0, 'CONR₂'],
    ['[CX3](=[OX1])Cl',                4.7,  2.7,  0.3,  6.6, 'COCl'],
    ['[CX3](=[OX1])[#6]',              8.9,  0.1, -0.1,  4.4, 'COR'],

    /* ── eteroatomi pesanti ────────────────────────────────────────────────── */
    ['[Si]',                          11.6,  4.9, -0.7,  0.4, 'Si(CH₃)₃'],
    ['[PX4]',                          2.5,  1.1,  0.1,  3.0, 'PO(CH₃)₂'],
    ['[PX3]',                          8.9,  5.2,  0.0,  0.1, 'P(fenile)₂'],
    ['[Li]',                         -43.2, -12.7, 2.4,  3.1, 'Li'],
    ['[Sn]',                          13.2,  7.2, -0.4, -0.4, 'Sn(CH₃)₃']
  ];

  /* ═════════════════════════════════════════════════════════════════════════
     §2 · ¹H dei benzeni monosostituiti         δ(Hi) = 7,34 + Zi
          [SMARTS, Z2 orto, Z3 meta, Z4 para, nome]
          Pretsch §5.5, pp. 188-189

     Questa tabella e' una CAPACITA' NUOVA: prima ogni H aromatico usciva a
     7,26 qualunque fosse il sostituente. La benzaldeide ha i suoi tre H a
     7,88 / 7,52 / 7,60 e la previsione piatta ne sbagliava due su tre di
     oltre mezzo ppm — su uno spettro ¹H, mezzo ppm e' la differenza fra
     riconoscere un aldeide aromatica e non riconoscerla.
     ═════════════════════════════════════════════════════════════════════════ */
  var AR1H = [
    ['F',  -0.31, -0.03, -0.21, 'F'],
    ['Cl', -0.01, -0.06, -0.12, 'Cl'],
    ['Br',  0.15, -0.12, -0.06, 'Br'],
    ['I',   0.36, -0.24, -0.02, 'I'],

    ['[CX4](F)(F)F',                   0.19, -0.07,  0.00, 'CF₃'],
    ['[CX4](Cl)(Cl)Cl',                0.55, -0.07, -0.09, 'CCl₃'],
    ['[CX4H2][OX2H1]',                -0.07, -0.07, -0.07, 'CH₂OH'],
    ['[CX4H3]',                       -0.17, -0.09, -0.17, 'CH₃'],
    ['[CX4H2][CX4H3]',                -0.14, -0.05, -0.18, 'CH₂CH₃'],
    ['[CX4H1]([CX4H3])[CX4H3]',       -0.13, -0.08, -0.18, 'CH(CH₃)₂'],
    ['[CX4H0]([CX4H3])([CX4H3])[CX4H3]',
                                       0.05, -0.04, -0.18, 'C(CH₃)₃'],
    ['[CX4H2]',                       -0.14, -0.05, -0.18, 'CH₂R'],
    ['[CX4H1]',                       -0.13, -0.08, -0.18, 'CHR₂'],
    ['[CX4]',                         -0.17, -0.09, -0.17, 'alchile'],

    ['[CX3H1]=[CX3H1][c]',             0.16,  0.00, -0.15, 'CH=CH-fenile'],
    ['[CX3]=[CX3]',                    0.08, -0.02, -0.09, 'CH=CH₂'],
    ['[CX2H1]#[CX2]',                  0.16, -0.01, -0.01, 'C≡CH'],
    ['[CX2]#[CX2][c]',                 0.20, -0.04, -0.07, 'C≡C-fenile'],
    ['[c;$(c:[nX2])]',                 0.73,  0.09,  0.02, '2-piridile'],
    ['[c]',                            0.22,  0.06, -0.04, 'fenile'],

    ['[OX2][CX3](=[OX1])[c]',         -0.12,  0.10, -0.06, 'OCO-fenile'],
    ['[OX2][CX3]=[OX1]',              -0.26,  0.03, -0.12, 'OCOCH₃'],
    ['[OX2;$([OX2]([c])[c])]',        -0.33, -0.02, -0.25, 'O-fenile'],
    ['[OX2H1]',                       -0.51, -0.10, -0.41, 'OH'],
    ['[OX2][CX4H3]',                  -0.44, -0.05, -0.40, 'OCH₃'],
    ['[OX2]',                         -0.44, -0.05, -0.40, 'OR'],

    ['[$([NX3](=[OX1])=[OX1]),$([NX3+](=[OX1])[OX1-])]',
                                       0.93,  0.26,  0.39, 'NO₂'],
    ['[NX2]=[OX1]',                    0.55,  0.29,  0.35, 'NO'],
    ['[CX2]#[NX1]',                    0.32,  0.14,  0.28, 'C≡N'],
    ['[NX2]=[CX2]=[SX1]',             -0.11,  0.04, -0.02, 'NCS'],
    ['[NX3][CX3H1]=[OX1]',            -0.25,  0.03, -0.13, 'NHCHO'],
    ['[NX3][CX3]=[OX1]',               0.15, -0.02, -0.23, 'NHCOCH₃'],
    ['[NX3][NX3]',                    -0.60, -0.08, -0.55, 'NHNH₂'],
    ['[NX2]=[NX2][c]',                 0.67,  0.20,  0.20, 'N=N-fenile'],
    ['[NX3;$([NX3]([c])([c])[c])]',   -0.26, -0.10, -0.34, 'N(fenile)₂'],
    ['[NX3H1][CX4H3]',                -0.73, -0.16, -0.64, 'NHCH₃'],
    ['[NX3]([CX4])[CX4]',             -0.60, -0.10, -0.62, 'N(CH₃)₂'],
    ['[NX3H2]',                       -0.67, -0.20, -0.59, 'NH₂'],
    ['[NX4+]',                         0.72,  0.40,  0.34, 'N⁺(CH₃)₃'],
    ['[NX3]',                         -0.67, -0.20, -0.59, 'N'],

    ['[SX4](=[OX1])(=[OX1])Cl',        0.68,  0.27,  0.37, 'SO₂Cl'],
    ['[SX4](=[OX1])(=[OX1])[OX2]',     0.60,  0.26,  0.28, 'SO₂OCH₃'],
    ['[SX4](=[OX1])(=[OX1])[NX3]',     0.51,  0.28,  0.24, 'SO₂NH₂'],
    ['[SX4](=[OX1])(=[OX1])',          0.70,  0.37,  0.41, 'SO₂CH₃'],
    ['[SX3;$([SX3](=[OX1])([c])[c])]', 0.29,  0.09,  0.13, 'S(O)-fenile'],
    ['[SX3](=[OX1])',                  0.28,  0.15,  0.15, 'S(O)R'],
    ['[SX2][SX2]',                     0.13, -0.05, -0.10, 'S-S-fenile'],
    ['[SX2;$([SX2]([c])[c])]',        -0.06, -0.20, -0.26, 'S-fenile'],
    ['[SX2H1]',                       -0.08, -0.16, -0.22, 'SH'],
    ['[SX2]',                         -0.08, -0.10, -0.24, 'SR'],

    ['[CX3H1]=[OX1]',                  0.54,  0.19,  0.29, 'CHO'],
    ['[CX3;$([CX3](=[OX1])([c])[c])]', 0.56,  0.12,  0.23, 'CO-fenile'],
    ['[CX3](=[OX1])[OX2H1]',           0.79,  0.14,  0.28, 'COOH'],
    ['[CX3;$([CX3](=[OX1])[OX2][c])]', 0.87,  0.18,  0.30, 'COO-fenile'],
    ['[CX3](=[OX1])[OX2][#6]',         0.70,  0.09,  0.21, 'COOR'],
    ['[CX3](=[OX1])[NX3]',             0.48,  0.11,  0.19, 'CONH₂'],
    ['[CX3](=[OX1])F',                 0.71,  0.21,  0.38, 'COF'],
    ['[CX3](=[OX1])Cl',                0.77,  0.15,  0.35, 'COCl'],
    ['[CX3](=[OX1])Br',                0.70,  0.15,  0.32, 'COBr'],
    ['[CX3H1]=[NX2][c]',               0.64,  0.24,  0.24, 'CH=N-fenile'],
    ['[CX3](=[OX1])[CX4H2][CX4H3]',    0.61,  0.11,  0.21, 'COCH₂CH₃'],
    ['[CX3](=[OX1])[#6]',              0.62,  0.12,  0.22, 'COCH₃'],

    ['[Si]',                           0.19,  0.00,  0.00, 'Si(CH₃)₃'],
    ['[PX4]',                          0.46,  0.14,  0.22, 'PO(OCH₃)₂'],
    ['[PX3]',                          0.00,  0.00,  0.00, 'P(fenile)₂'],
    ['[Li]',                           0.77,  0.26, -0.29, 'Li']
  ];

  /* ═════════════════════════════════════════════════════════════════════════
     §3 · ¹H degli etileni sostituiti
          δ(C=CH) = 5,25 + Zgem + Zcis + Ztrans
          [SMARTS, Zgem, Zcis, Ztrans, nome]
          Pretsch §5.2, pp. 178-179

     Anche questa e' nuova: prima un H vinilico usciva a 5,35 e un =CH₂
     terminale a 5,05, senza guardare che cosa ci fosse attaccato. Lo stirene
     ha i suoi tre H a 6,72 / 5,74 / 5,23: con tre valori fissi due erano
     sbagliati di piu' di un ppm.
     ═════════════════════════════════════════════════════════════════════════ */
  var ETILENE1H = [
    ['F',  1.54, -0.40, -1.02, 'F'],
    ['Cl', 1.08,  0.18,  0.13, 'Cl'],
    ['Br', 1.07,  0.45,  0.55, 'Br'],
    ['I',  1.14,  0.81,  0.88, 'I'],

    ['[CX4H2][c]',                     1.05, -0.29, -0.32, 'CH₂-aromatico'],
    ['[CX4H2][F,Cl,Br]',               0.70,  0.11, -0.04, 'CH₂X'],
    ['[CX4H1](F)F',                    0.66,  0.32,  0.21, 'CHF₂'],
    ['[CX4](F)(F)F',                   0.66,  0.61,  0.32, 'CF₃'],
    ['[CX4H2][OX2]',                   0.64, -0.01, -0.02, 'CH₂O-'],
    ['[CX4H2][NX3]',                   0.58, -0.10, -0.08, 'CH₂N<'],
    ['[CX4H2][CX2]#[NX1]',             0.69, -0.08, -0.06, 'CH₂CN'],
    ['[CX4H2][SX2]',                   0.71, -0.13, -0.22, 'CH₂S-'],
    ['[CX4H2][CX3]=[OX1]',             0.69, -0.08, -0.06, 'CH₂CO-'],
    ['[CX4;R]',                        0.69, -0.25, -0.28, 'alchile in anello'],
    ['[CX4]',                          0.45, -0.22, -0.28, 'alchile'],

    ['[CX3]=[CX3][!#1]',               1.24,  0.02, -0.05, 'C=C coniugato'],
    ['[CX3]=[CX3]',                    1.00, -0.09, -0.23, 'C=C'],
    ['[CX2]#[CX2]',                    0.47,  0.38,  0.12, 'C≡C'],
    /* «o-sostituito» vuol dire che l'anello porta un sostituente in ORTO al
       punto d'attacco — non che il punto d'attacco sia sostituito, cosa che
       e' vera per definizione. Scritto `[c;$(c(:c)-[!#1])]` corrispondeva a
       qualunque fenile: lo stirene prendeva 1,65 invece di 1,38 e i suoi tre
       H vinilici sbagliavano tutti. */
    ['[c;$(c:c-[!#1])]',               1.65,  0.19,  0.09, 'aromatico o-sostituito'],
    ['[c]',                            1.38,  0.36, -0.07, 'aromatico'],

    ['[OX2][CX3]=[OX1]',               2.11, -0.35, -0.64, 'OCO-'],
    ['[OX2][CX3]=[CX3]',               1.21, -0.60, -1.00, 'OC= (sp²)'],
    ['[OX2][c]',                       1.21, -0.60, -1.00, 'O-aromatico'],
    ['[OX2]',                          1.22, -1.07, -1.21, 'OC≤ (sp³)'],
    ['[PX4]',                          1.33, -0.34, -0.66, 'OP(O)(OEt)₂'],

    ['[$([NX3](=[OX1])=[OX1]),$([NX3+](=[OX1])[OX1-])]',
                                       1.87,  1.30,  0.62, 'NO₂'],
    ['[NX2]=[NX2][c]',                 2.39,  1.11,  0.67, 'N=N-fenile'],
    ['[CX2]#[NX1]',                    0.27,  0.75,  0.55, 'C≡N'],
    ['[NX3][CX3]=[OX1]',               2.08, -0.57, -0.72, 'NCO-R'],
    ['[NX3][CX3]=[CX3]',               1.17, -0.53, -0.99, 'NR- (sp²)'],
    ['[NX3]',                          0.80, -1.26, -1.21, 'NR₂'],

    ['[SX4](=[OX1])(=[OX1])',          1.55,  1.16,  0.93, 'S(O)₂-'],
    ['[SX3](=[OX1])',                  1.27,  0.67,  0.41, 'S(O)-'],
    ['[SX2][CX3]=[OX1]',               1.41,  0.06,  0.02, 'SCO-'],
    ['[SX2][CX2]#[NX1]',               0.94,  0.45,  0.41, 'SCN'],
    ['[SX2]',                          1.11, -0.29, -0.13, 'S-'],

    ['[CX3H1]=[OX1]',                  1.02,  0.95,  1.17, 'CHO'],
    ['[CX3](=[OX1])[OX2H1]',           0.97,  1.41,  0.71, 'COOH'],
    ['[CX3](=[OX1])[OX2][#6]',         0.80,  1.18,  0.55, 'COOR'],
    ['[CX3](=[OX1])[NX3]',             1.37,  0.98,  0.46, 'CON<'],
    ['[CX3](=[OX1])Cl',                1.11,  1.46,  1.01, 'COCl'],
    ['[CX3](=[OX1])[#6]',              1.10,  1.12,  0.87, 'CO-']
  ];

  /* ═════════════════════════════════════════════════════════════════════════
     §4 · ¹H degli alcani sostituiti
          δ(CH₃) = 0,86 + ΣZα + ΣZβ
          δ(CH₂) = 1,37 + ΣZα + ΣZβ
          δ(CH)  = 1,50 + ΣZα + ΣZβ
          [SMARTS, CH₃α, CH₃β, CH₂α, CH₂β, CHα, CHβ, nome]
          Pretsch §5.1, p. 170

     Prima c'era un elenco di ventiquattro intorni con un valore fisso
     ciascuno: `CH₂–O` valeva sempre 3,62, che fosse un alcol o un etere o un
     estere. Qui il valore si COSTRUISCE, e tiene conto anche del secondo
     sostituente, che in una molecola vera c'e' quasi sempre.
     ═════════════════════════════════════════════════════════════════════════ */
  var BASE_ALCANI1H = { 3: 0.86, 2: 1.37, 1: 1.50 };   /* per numero di H */

  var ALCANI1H = [
    ['F',  3.41, 0.41, 2.76, 0.16, 1.83, 0.27, 'F'],
    ['Cl', 2.20, 0.63, 2.05, 0.24, 1.98, 0.31, 'Cl'],
    ['Br', 1.83, 0.83, 1.97, 0.46, 2.44, 0.41, 'Br'],
    ['I',  1.30, 1.02, 1.80, 0.53, 2.46, 0.15, 'I'],

    ['[CX3]=[CX3]',   0.85, 0.20, 0.63,  0.00, 0.68,  0.03, 'C=C'],
    ['[CX2]#[CX2]',   0.94, 0.32, 0.70,  0.13, 1.04,  0.00, 'C≡C'],
    ['[c]',           1.51, 0.38, 1.22,  0.29, 1.28,  0.38, 'fenile'],

    ['[OX2][CX3]=[OX1]', 2.81, 0.44, 2.83, 0.24, 2.47, 0.59, 'O-CO-'],
    ['[OX2][c]',         2.87, 0.47, 2.61, 0.38, 2.20, 0.50, 'O-fenile'],
    ['[OX2][CX3]=[CX3]', 2.64, 0.36, 2.63, 0.33, 2.00, 0.30, 'OC=C'],
    ['[OX2H1]',          2.53, 0.25, 2.20, 0.15, 1.73, 0.08, 'OH'],
    ['[OX2]',            2.38, 0.25, 2.04, 0.13, 1.85, 0.32, 'O-C≤'],

    ['[$([NX3](=[OX1])=[OX1]),$([NX3+](=[OX1])[OX1-])]',
                         3.43, 0.65, 3.08, 0.58, 2.31, 0.00, 'NO₂'],
    ['[CX2]#[NX1]',      1.12, 0.45, 1.08, 0.33, 1.00, 0.00, 'C≡N'],
    ['[NX2]=[CX2]=[SX1]',2.51, 0.54, 2.20, 0.36, 1.94, 0.60, 'NCS'],
    ['[NX3][CX3]=[OX1]', 1.88, 0.34, 1.63, 0.22, 2.10, 0.62, 'N-CO-'],
    ['[NX4+]',           2.44, 0.39, 1.91, 0.40, 1.78, 0.56, 'N⁺≤'],
    ['[NX3]',            1.61, 0.14, 1.32, 0.22, 1.13, 0.23, 'N<'],

    ['[SX4](=[OX1])(=[OX1])', 1.98, 0.42, 2.08, 0.52, 1.50, 0.40, 'S(O)₂-'],
    ['[SX3](=[OX1])',         1.64, 0.36, 1.24, 0.30, 1.25, 0.00, 'S(O)-'],
    ['[SX2][CX2]#[NX1]',      1.75, 0.66, 1.62, 0.00, 1.64, 0.00, 'SCN'],
    ['[SX2][CX3]=[OX1]',      1.41, 0.37, 1.54, 0.63, 1.31, 0.19, 'S-CO-'],
    ['[SX2]',                 1.14, 0.45, 1.23, 0.26, 1.06, 0.31, 'S-'],

    ['[CX3H1]=[OX1]',              1.34, 0.21, 1.07, 0.29, 0.86, 0.22, 'CHO'],
    ['[CX3](=[OX1])[OX2H1]',       1.22, 0.23, 0.90, 0.23, 0.87, 0.32, 'COOH'],
    ['[CX3](=[OX1])[OX2][#6]',     1.15, 0.28, 0.92, 0.35, 0.83, 0.63, 'COO-'],
    ['[CX3](=[OX1])[NX3]',         1.16, 0.28, 0.85, 0.24, 0.94, 0.30, 'CO-N<'],
    ['[CX3](=[OX1])Cl',            1.94, 0.22, 1.51, 0.25, 0.00, 0.00, 'COCl'],
    ['[CX3](=[OX1])[#6]',          1.23, 0.20, 1.12, 0.24, 0.00, 0.00, 'CO-'],

    ['[Si]',          0.00, 0.00,  0.00,  0.00, 0.00,  0.00, 'Si'],
    ['[CX4]',         0.00, 0.05,  0.00, -0.06, 0.17, -0.01, 'C≤']
  ];

  /* ═════════════════════════════════════════════════════════════════════════
     §5 · ¹H degli alchini terminali   R–C≡C–H
          [SMARTS del sostituente R, δ(Ha), nome]
          Pretsch §5.3, p. 182 — valori diretti, non incrementi
     ═════════════════════════════════════════════════════════════════════════ */
  var ALCHINI1H = [
    ['[CX4](F)(F)F',            2.95, 'CF₃'],
    ['[CX4H0]([CX4])([CX4])[CX4]', 2.07, 'C(CH₃)₃'],
    ['[CX4H2][CX4H3]',          1.97, 'CH₂CH₃'],
    ['[CX4H3]',                 1.91, 'CH₃'],
    ['[CX4]',                   1.97, 'alchile'],
    ['[CX3]=[CX3]',             3.07, 'CH=CH₂'],
    ['[CX2]#[CX2]',             2.16, 'C≡CH'],
    ['[c]',                     3.07, 'fenile'],
    ['F',                       1.74, 'F'],
    ['Cl',                      2.05, 'Cl'],
    ['Br',                      2.32, 'Br'],
    ['I',                       2.34, 'I'],
    ['[OX2][CX3]=[CX3]',        2.04, 'OCH=CH₂'],
    ['[OX2][c]',                2.07, 'O-fenile'],
    ['[OX2]',                   1.48, 'OR'],
    ['[CX2]#[NX1]',             2.63, 'C≡N'],
    ['[NX3]([c])[c]',           2.86, 'N(fenile)₂'],
    ['[NX3]',                   2.30, 'NR₂'],
    ['[SX4](=[OX1])(=[OX1])',   3.95, 'S(O)₂R'],
    ['[SX2][c]',                3.28, 'S-fenile'],
    ['[SX2][CX3]=[CX3]',        3.26, 'SCH=CH₂'],
    ['[SX2]',                   2.79, 'SR'],
    ['[CX3](=[OX1])[OX2H1]',    3.17, 'COOH'],
    ['[CX3](=[OX1])[OX2][#6]',  2.90, 'COOR'],
    ['[CX3](=[OX1])[NX3]',      3.05, 'CONH₂'],
    ['[CX3](=[OX1])[c]',        3.48, 'CO-fenile'],
    ['[CX3](=[OX1])[#6]',       3.65, 'COCH₃'],
    ['[Si]',                    2.34, 'Si(CH₃)₃'],
    ['[PX4]',                   3.33, 'P(O)R₂'],
    ['[PX3]',                   2.85, 'PR₂']
  ];

  /* ═════════════════════════════════════════════════════════════════════════
     §6 · ¹³C dei composti alifatici
          δ = -2,3 + ΣZi + ΣSj + ΣKk
          [SMARTS del gruppo, Zα, Zβ, Zγ, Zδ, nome, asteriscato]
          Pretsch §4.1, p. 82

     «Asteriscato» e' la colonna marcata con * nella tabella: per quei
     sostituenti si applica anche la correzione sterica S, che dipende da
     quanti sostituenti porta l'atomo α.

     DUE REGOLE DI SCRITTURA, NESSUNA DELLE DUE NEGOZIABILE.

     PRIMA: lo SMARTS deve comprendere SOLO gli atomi del gruppo, mai un
     carbonio dello scheletro. Gli atomi del gruppo vengono esclusi dal
     conteggio dei carboni semplici; se lo SMARTS ne inghiottisse uno, quel
     carbonio sparirebbe dal conteggio e la previsione perderebbe nove ppm.

     SECONDA: lo SMARTS deve comprendere TUTTI gli atomi del gruppo. La riga
     dell'acido carbossilico era scritta `[CX3;$(...)]=[OX1]` e lasciava
     fuori l'ossidrile: quell'ossigeno restava libero, la riga generica
     dell'etere se lo prendeva, e il CH₂ dell'acido propanoico riceveva
     l'incremento α del COOH (+20,1) PIU' l'incremento β di un ossigeno
     etereo (+10,1). Usciva a 37,0 contro i 27,6 misurati. Una riga troppo
     stretta e una riga troppo larga sbagliano nello stesso modo.

     L'ALTERNATIVA (`alt`), per i gruppi che si guardano da due lati. Un
     estere visto dal lato alcolico vale 56,5 in α; visto dal lato acilico
     vale 22,6. Sono lo STESSO gruppo di tre atomi: scegliere il valore in
     base a quale atomo del gruppo e' piu' vicino al carbonio osservato e'
     l'unica cosa che funziona. `alt` e' [indice dell'atomo nella
     corrispondenza, Zα, Zβ, Zγ, Zδ, nome]: se l'atomo piu' vicino e' quello,
     valgono questi incrementi invece dei primi. Senza di cio' l'OCH₂
     dell'acetato di etile usciva a 29,4 invece di 60,4.
     ═════════════════════════════════════════════════════════════════════════ */
  var CARBONIO_SEMPLICE = [9.1, 9.4, -2.5, 0.3];      /* –C*≤  */

  /* –fenile. NON e' una riga con uno SMARTS, e la ragione e' il naftalene: due
     anelli condivisi fanno due corrispondenze di `c1ccccc1` che si
     SOVRAPPONGONO su due atomi, e un sostituente alifatico prenderebbe
     l'incremento due volte (+44 invece di +22). Il sistema aromatico si trova
     sul grafo, come componente connessa di atomi aromatici: un sistema, un
     gruppo, un incremento. */
  var AROMATICO = [22.1, 9.3, -2.6, 0.3];             /* –fenile */

  /* I CICLOALCANI come COMPOSTI DI RIFERIMENTO — Pretsch §4.1, p. 83:
     «One can also use the chemical shifts of a reference compound as the base
     value if its structure is closely related to that assumed for the
     unknown. The increments corresponding to the structural elements missing
     in the reference compound are then added to the base value, while those
     of structural elements present in the reference but absent in the
     unknown are subtracted.»

     Serve perche' in un anello lo schema additivo conta i carboni due volte,
     girando dalle due parti: per il cicloesano da' 32,2 contro i 26,9
     misurati. Un valore di classe fisso lo rimediava per il cicloesano nudo
     ma non per i suoi derivati — nel cicloesanone i carboni in α al
     carbonile uscivano a 26,9 invece di 41,9, quindici ppm di errore sul
     segnale piu' diagnostico della molecola.

     Qui il valore di partenza e' il cicloalcano PARENTE e si sottraggono gli
     incrementi dei carboni d'anello che il parente ha gia': per il
     cicloalcano nudo il conto torna esatto per costruzione, e per un suo
     derivato resta corretto. Spostamenti misurati, in ppm. */
  var CICLOALCANI = { 3: -2.8, 4: 22.4, 5: 25.6, 6: 26.9, 7: 28.5, 8: 26.9 };

  var ALIFATICI13C = [
    /* ── carbonili: il gruppo e' il carbonio piu' TUTTI i suoi eteroatomi ──── */
    ['[CX3](=[OX1])[OX2H1]',                      20.1,  2.0, -2.8,  0.0, 'COOH',  false],
    ['[CX3;$([CX3](=[OX1])[OX2][#6])](=[OX1])[OX2]',
                                                  22.6,  2.0, -2.8,  0.0, 'COO-',  false,
                                                  [2, 56.5, 6.5, -6.0, 0.0, 'OCO-']],
    ['[CX3](=[OX1])[NX3]',                        22.0,  2.6, -3.2, -0.4, 'CO-N<', false,
                                                  [2, 28.3, 11.3, -5.1, 0.0, 'N-CO-']],
    ['[CX3](=[OX1])Cl',                           33.1,  2.3, -3.6,  0.0, 'COCl',  false],
    ['[CX3H1]=[OX1]',                             29.9, -0.6, -2.7,  0.0, 'CHO',   false],
    ['[CX3;$([CX3](=[OX1])([#6])[#6])]=[OX1]',    22.5,  3.0, -3.0,  0.0, 'CO-',   false],
    ['[CX2]#[NX1]',                                3.1,  2.4, -3.3, -0.5, 'C≡N',   false],

    /* ── ossigeno ──────────────────────────────────────────────────────────── */
    ['[OX2;H0,H1;!$([OX2]=*)]',                   49.0, 10.1, -6.2,  0.3, 'O-',    true],

    /* ── azoto ─────────────────────────────────────────────────────────────── */
    ['[$([NX3](=[OX1])=[OX1]),$([NX3+](=[OX1])[OX1-])]',
                                                  61.6,  3.1, -4.6, -1.0, 'NO₂',   false],
    ['[NX4+]',                                    30.7,  5.4, -7.2, -1.4, 'N⁺≤',   true],
    ['[NX3;!$([NX3](=[OX1])=[OX1])]',             28.3, 11.3, -5.1,  0.0, 'N<',    true],

    /* ── zolfo ─────────────────────────────────────────────────────────────── */
    ['[SX4](=[OX1])(=[OX1])Cl',                   54.5,  3.4, -3.0,  0.0, 'SO₂Cl', false],
    ['[SX4](=[OX1])(=[OX1])',                     30.3,  7.0, -3.7,  0.3, 'S(O)₂-',true],
    ['[SX3](=[OX1])',                             31.1,  7.0, -3.5,  0.5, 'S(O)-', true],
    ['[SX2;$([SX2][CX3]=[OX1])]',                 17.0,  6.5, -3.1,  0.0, 'SCO-',  false],
    ['[SX2]',                                     10.6, 11.4, -3.6, -0.4, 'S-',    true],

    /* ── alogeni ───────────────────────────────────────────────────────────── */
    ['F',   70.1,  7.8, -6.8,  0.0, 'F',  false],
    ['Cl',  31.0, 10.0, -5.1, -0.5, 'Cl', false],
    ['Br',  18.9, 11.0, -3.8, -0.7, 'Br', false],
    ['I',   -7.2, 10.9, -1.5, -0.9, 'I',  false],

    /* ── carbonio insaturo ─────────────────────────────────────────────────── */
    ['[CX3]=[CX3]',           19.5,  6.9, -2.1,  0.4, 'C=C',       false],
    ['[CX2]#[CX2]',            4.4,  5.6, -3.4, -0.6, 'C≡C',       false],

    ['[Si]',  -5.2,  4.0, -0.3,  0.0, 'Si', false],
    ['[Sn]',  -5.2,  4.0, -0.3,  0.0, 'Sn', false]
  ];

  /* Correzioni steriche Sj — Pretsch §4.1, p. 83.
     Righe: grado del carbonio OSSERVATO (1 = primario … 4 = quaternario).
     Colonne: numero di sostituenti non-idrogeno sull'atomo α.
     Si applicano una volta per ogni atomo α asteriscato. */
  var STERICI13C = {
    1: [ 0.0,  0.0,  -1.1,  -3.4],
    2: [ 0.0,  0.0,  -2.5,  -6.0],
    3: [ 0.0, -3.7,  -8.5, -10.0],
    4: [-1.5, -8.0, -10.0, -12.5]
  };

  /* Correzioni conformazionali Kk per i sostituenti γ — Pretsch §4.1, p. 83.
     Trascritte per chi legge: il motore usa «non fissata» perche' da uno
     SMILES la conformazione non si ricava, e inventarla sarebbe peggio che
     ometterla. */
  var CONFORMAZIONALI13C = {
    sinperiplanare: -4.0,
    sinclinale:     -1.0,
    anticlinale:     0.0,
    antiperiplanare: 2.0,
    nonFissata:      0.0
  };

  /* ═════════════════════════════════════════════════════════════════════════
     §7 · ¹J(C,H) additiva      J = 125,0 + ΣZi
          [SMARTS del sostituente, Zi, nome]
          Pretsch §4.1.2, p. 84

     CHCl₃: 125,0 + 3 × 27,0 = 206 Hz contro 209 misurati.
     ═════════════════════════════════════════════════════════════════════════ */
  var JCH = [
    ['[CX4H0]([CX4H3])([CX4H3])[CX4H3]', -3.0, 'C(CH₃)₃'],
    ['[CX4H2]Cl',   3.0, 'CH₂Cl'],
    ['[CX4H2]Br',   3.0, 'CH₂Br'],
    ['[CX4H2]I',    7.0, 'CH₂I'],
    ['[CX4H1](Cl)Cl',  6.0, 'CHCl₂'],
    ['[CX4](Cl)(Cl)Cl', 9.0, 'CCl₃'],
    ['[CX2]#[CX2]', 7.0, 'C≡C'],
    ['[c]',         1.0, 'fenile'],
    ['F',          24.0, 'F'],
    ['Cl',         27.0, 'Cl'],
    ['Br',         27.0, 'Br'],
    ['I',          26.0, 'I'],
    ['[OX2H1]',    18.0, 'OH'],
    ['[OX2][c]',   18.0, 'O-fenile'],
    ['[OX2]',      18.0, 'OR'],
    ['[NX3H2]',     8.0, 'NH₂'],
    ['[NX3H1][CX4]', 7.0, 'NHCH₃'],
    ['[NX3]([CX4])[CX4]', 6.0, 'N(CH₃)₂'],
    ['[CX2]#[NX1]', 11.0, 'C≡N'],
    ['[SX3](=[OX1])', 13.0, 'S(O)CH₃'],
    ['[CX3H1]=[OX1]', 2.0, 'CHO'],
    ['[CX3](=[OX1])[OX2H1]', 5.5, 'COOH'],
    ['[CX3](=[OX1])[#6]', -1.0, 'COCH₃'],
    ['[CX4]',       1.0, 'CH₃']
  ];

  globale.BSIPretsch = {
    AR13C: AR13C,
    AR1H: AR1H,
    ETILENE1H: ETILENE1H,
    ALCANI1H: ALCANI1H,
    BASE_ALCANI1H: BASE_ALCANI1H,
    ALCHINI1H: ALCHINI1H,
    ALIFATICI13C: ALIFATICI13C,
    CARBONIO_SEMPLICE: CARBONIO_SEMPLICE,
    AROMATICO: AROMATICO,
    CICLOALCANI: CICLOALCANI,
    STERICI13C: STERICI13C,
    CONFORMAZIONALI13C: CONFORMAZIONALI13C,
    JCH: JCH,
    BASE_AR13C: 128.5,
    BASE_AR1H: 7.34,
    BASE_ETILENE1H: 5.25,
    BASE_ALIF13C: -2.3,
    fonte: 'Pretsch, Bühlmann, Badertscher — Structure Determination of ' +
           'Organic Compounds, 4ª ed., Springer: §4.1 pp. 82-84, §4.5 pp. 100-102, ' +
           '§5.1 p. 170, §5.2 pp. 178-179, §5.3 p. 182, §5.5 pp. 188-189',
    versione: '1.0'
  };

})(typeof window !== 'undefined' ? window : globalThis);
