/* ═══════════════════════════════════════════════════════════════════════
   BSI SPETTRI — predizione IR/NMR su base strutturale, non su testo SMILES
   ═══════════════════════════════════════════════════════════════════════

   PERCHE' ESISTE QUESTO FILE.
   La versione precedente riconosceva i gruppi funzionali con espressioni
   regolari applicate alla stringa SMILES, dentro catene di else if. Due
   difetti gravi, e non teorici:

     · else if = un gruppo solo. L'aspirina, CC(=O)Oc1ccccc1C(=O)O, ha un
       estere E un acido carbossilico. Il ramo dell'estere scattava per
       primo e quello dell'acido non veniva nemmeno provato: lo spettro
       usciva senza l'O–H largo a ~3000 e senza il C=O acido a 1710, cioe'
       senza le due bande piu' caratteristiche della molecola. Su una
       molecola che sta in ogni libro di testo.

     · la regex non legge la struttura, legge il testo. "C(=O)O" seguito da
       una "c" veniva scambiato per un estere, e la stessa svista mandava a
       zero il protone del COOH nell'NMR.

   Qui i gruppi si trovano con SMARTS attraverso RDKit, che lavora sul grafo
   molecolare vero: additivo per costruzione (una molecola puo' avere tutti
   i gruppi che vuole) e cieco alla forma in cui lo SMILES e' scritto.

   COSA E' E COSA NON E'. Questo e' un PREDITTORE: mostra dove cadono le
   bande dei gruppi presenti, con posizioni e intensita' da tabella. Non e'
   uno spettro misurato e non sostituisce un database sperimentale — il
   grafico lo dice a chiare lettere. Ma dev'essere giusto: un predittore che
   sbaglia l'aspirina non serve a nessuno.
   ═══════════════════════════════════════════════════════════════════════ */
(function(){
'use strict';

/* ─────────────────────────────────────────────────────────────────────
   1. RICONOSCIMENTO DEI GRUPPI FUNZIONALI
   ───────────────────────────────────────────────────────────────────── */

/* Ogni voce: SMARTS + nome. Gli SMARTS sono scritti in modo da NON
   sovrapporsi dove non devono: [OX2H1] e' un ossidrile vero, [OX2H0] un
   ossigeno etereo/esterificato, e cosi' via. */
var SMARTS = {
  acidoCarbossilico: '[CX3](=[OX1])[OX2H1]',
  estere:            '[CX3](=[OX1])[OX2H0][#6]',
  anidride:          '[CX3](=[OX1])[OX2H0][CX3](=[OX1])',
  cloruroAcile:      '[CX3](=[OX1])[Cl]',
  ammidePrim:        '[CX3](=[OX1])[NX3H2]',
  ammideSec:         '[CX3](=[OX1])[NX3H1][#6]',
  ammideTerz:        '[CX3](=[OX1])[NX3H0]([#6])[#6]',
  aldeide:           '[CX3H1](=[OX1])[#6]',
  chetone:           '[#6][CX3](=[OX1])[#6]',
  alcolPrim:         '[CX4H2][OX2H1]',
  alcolSec:          '[CX4H1][OX2H1]',
  alcolTerz:         '[CX4H0][OX2H1]',
  fenolo:            '[c][OX2H1]',
  etere:             '[#6][OX2H0][#6]',
  amminaPrim:        '[NX3H2][CX4]',
  amminaSec:         '[NX3H1]([#6])[#6]',
  amminaAr:          '[NX3;H2,H1,H0][c]',
  nitrile:           '[NX1]#[CX2]',
  nitro:             '[$([NX3](=O)=O),$([NX3+](=O)[O-])]',
  alchene:           '[CX3]=[CX3]',
  alchino:           '[CX2]#[CX2]',
  alchinoTerm:       '[CX2H1]#[CX2]',
  aromatico:         'c1ccccc1',
  eteroaromN:        '[nX2,nX3]',
  tiolo:             '[SX2H1]',
  solfossido:        '[SX3](=[OX1])',
  solfone:           '[SX4](=[OX1])(=[OX1])',
  fosfato:           '[PX4](=[OX1])',
  alogenoCl:         '[#6][Cl]',
  alogenoBr:         '[#6][Br]',
  alogenoF:          '[#6][F]',
  alogenoI:          '[#6][I]',
  // idrogeni su carbonio saturo / insaturo: servono per le bande C–H
  chSp3:             '[CX4;H1,H2,H3]',
  ch3:               '[CX4H3]',
  ch2:               '[CX4H2]',
  chSp2:             '[CX3;H1,H2]=[CX3]',
  chAr:              '[cH]',
  // sostituzione dell'anello: determina le bande "oop" fra 900 e 690
  arMono:            'c1ccccc1[!#1]',
  arOrto:            'c1ccc([!#1])c([!#1])c1',
  arMeta:            'c1cc([!#1])cc([!#1])c1',
  arPara:            'c1cc([!#1])ccc1[!#1]',
  /* CONIUGAZIONE, UNA PER CARBONILE.
     Non basta chiedere "c'e' un carbonile coniugato?" e poi abbassarli
     tutti: nell'aspirina l'acido e' attaccato all'anello e scende a ~1690,
     mentre l'estere acetilico NON e' coniugato al suo carbonio acilico e
     resta a ~1750. Applicare uno sconto unico li avrebbe spostati insieme,
     cancellando proprio la coppia di bande che identifica la molecola.
     Serve quindi un SMARTS per ciascun tipo di carbonile. */
  acidoConiug:   '[CX3](=[OX1])([OX2H1])[$(c),$([CX3]=[CX3])]',
  estereConiug:  '[CX3](=[OX1])([OX2H0][#6])[$(c),$([CX3]=[CX3])]',
  chetoneConiug: '[#6][CX3](=[OX1])[$(c),$([CX3]=[CX3])]',
  aldeideConiug: '[CX3H1](=[OX1])[$(c),$([CX3]=[CX3])]',
  /* L'estere di un fenolo va nella direzione opposta: l'ossigeno legato
     all'anello sottrae densita' e il C=O SALE a ~1765. */
  estereArilico: '[CX3](=[OX1])[OX2H0][c]'
};

var _qmolCache = null;

/* Conta le occorrenze di ogni SMARTS nella molecola. Restituisce un oggetto
   {nomeGruppo: quante volte}. Le voci a zero non ci sono. */
function contaGruppi(RD, mol){
  if(!_qmolCache){
    _qmolCache = {};
    for(var k in SMARTS){
      if(!SMARTS.hasOwnProperty(k)) continue;
      try{ _qmolCache[k] = RD.get_qmol(SMARTS[k]); }
      catch(e){ _qmolCache[k] = null; }
    }
  }
  var out = {};
  for(var nome in _qmolCache){
    if(!_qmolCache.hasOwnProperty(nome) || !_qmolCache[nome]) continue;
    try{
      var m = JSON.parse(mol.get_substruct_matches(_qmolCache[nome]) || '[]');
      if(m.length) out[nome] = m.length;
    }catch(e){ /* uno SMARTS che non compila non deve fermare gli altri */ }
  }
  return out;
}

/* Un chetone e' anche "C(=O) fra due carboni": lo sono pero' anche l'estere
   e l'ammide letti male. Qui si tolgono le doppie contature, una volta sola
   e in un posto solo, invece di sparpagliare eccezioni nelle tabelle. */
function ripulisci(g){
  var carbonili = (g.acidoCarbossilico||0) + (g.estere||0) + (g.anidride||0) +
                  (g.cloruroAcile||0) + (g.ammidePrim||0) + (g.ammideSec||0) +
                  (g.ammideTerz||0) + (g.aldeide||0);
  if(g.chetone){
    g.chetone = Math.max(0, g.chetone - carbonili);
    if(!g.chetone) delete g.chetone;
  }
  // l'anidride viene vista anche come due esteri: si scala
  if(g.anidride && g.estere){
    g.estere = Math.max(0, g.estere - 2*g.anidride);
    if(!g.estere) delete g.estere;
  }
  // il fenolo non e' un alcol alifatico
  if(g.fenolo && g.alcolTerz){
    g.alcolTerz = Math.max(0, g.alcolTerz - g.fenolo);
    if(!g.alcolTerz) delete g.alcolTerz;
  }
  // l'alchino terminale e' un sottoinsieme degli alchini
  if(g.alchinoTerm && g.alchino) g.alchino = Math.max(1, g.alchino);
  return g;
}

/* ─────────────────────────────────────────────────────────────────────
   2. TABELLA DELLE BANDE IR
   ───────────────────────────────────────────────────────────────────── */

/* pk = numero d'onda in cm⁻¹, w = larghezza a meta' altezza, i = intensita'
   relativa (1 = fortissima), f = forma ('L' lorentziana, stretta e con code
   lunghe come la maggior parte delle bande; 'G' gaussiana, per le bande
   allargate dai legami a idrogeno, che sono davvero campane larghe).
   I valori vengono dalle tabelle standard di spettroscopia IR. */
function bandeDaGruppi(g){
  var b = [];
  function add(nome, pk, w, i, f){ b.push({ n:nome, pk:pk, w:w, i:i, f:f||'L' }); }

  // ── zona O–H / N–H / C–H, 3600–2500 ──
  if(g.acidoCarbossilico){
    /* La banda piu' riconoscibile dell'intero IR: larghissima, appoggiata
       sopra le C–H, si estende da 3300 fino a 2500. Larga si', ma non un
       burrone: in uno spettro vero il fondo risale fra il 40 e il 60% di
       trasmittanza, e le bande piu' profonde restano i carbonili. Una
       prima taratura la faceva scendere al 5% e schiacciava tutto il
       resto dello spettro. */
    add('O–H acido (molto larga)', 3000, 420, 0.40, 'G');
  }
  if(g.fenolo)    add('O–H fenolo (larga)', 3300, 230, 0.55, 'G');
  if(g.alcolPrim || g.alcolSec || g.alcolTerz)
    add('O–H alcol (larga, legame H)', 3340, 210, 0.62, 'G');
  if(g.ammidePrim){ add('N–H ammide asim.', 3350, 70, 0.55); add('N–H ammide sim.', 3180, 70, 0.48); }
  if(g.ammideSec)   add('N–H ammide', 3300, 90, 0.52);
  if(g.amminaPrim){ add('N–H₂ asim.', 3380, 60, 0.42); add('N–H₂ sim.', 3300, 60, 0.38); }
  if(g.amminaSec)   add('N–H ammina 2ª', 3320, 60, 0.32);
  if(g.eteroaromN && !g.amminaPrim && !g.amminaSec) add('N–H eteroaromatico', 3400, 80, 0.45, 'G');
  if(g.alchinoTerm) add('≡C–H terminale', 3300, 25, 0.55);
  /* L'intensita' delle C–H dipende da QUANTI gruppi ci sono, non dal fatto
     che ce ne sia almeno uno. L'aspirina ha un solo CH₃ e nel suo spettro
     vero le C–H sono una spalla modesta; un'esadecano ne ha quattordici e
     la banda a 2925 e' la piu' profonda di tutte. Con un valore fisso, le
     tre C–H sommate scavavano un burrone da 3600 a 2500 che sotterrava
     perfino i carbonili — misurato sull'aspirina, dove finivano al 5% di
     trasmittanza contro il 40% reale. */
  var nAlif = (g.ch3||0) + (g.ch2||0);
  var iCH = Math.min(0.66, 0.16 + 0.11*nAlif);
  if(g.chAr)        add('=C–H aromatico', 3050, 30, Math.min(0.42, 0.12 + 0.05*(g.chAr||0)));
  if(g.chSp2 && !g.aromatico) add('=C–H alchenico', 3080, 30, 0.32);
  if(g.ch3) add('C–H asim. (CH₃)', 2960, 40, iCH);
  if(g.ch2) add('C–H asim. (CH₂)', 2925, 40, iCH * 1.04);
  if(g.ch3 || g.ch2) add('C–H sim.', 2870, 40, iCH * 0.78);
  if(g.aldeide){
    // Doppietto di Fermi: due bande, ed e' proprio la coppia a identificare
    // l'aldeide quando il C=O da solo sarebbe ambiguo.
    add('C–H aldeide (Fermi)', 2820, 30, 0.30);
    add('C–H aldeide (Fermi)', 2720, 30, 0.28);
  }
  if(g.tiolo) add('S–H tiolo (debole)', 2560, 30, 0.22);

  // ── tripli legami, 2300–2100 ──
  if(g.nitrile) add('C≡N nitrile', 2250, 22, 0.72);
  if(g.alchino) add('C≡C alchino', 2120, 24, 0.30);

  // ── carbonili, 1850–1630 ──
  // La coniugazione con un C=C o un anello abbassa il C=O di ~25 cm⁻¹ (e'
  // cio' che distingue un chetone α,β-insaturo da uno saturo), ma l'effetto
  // va applicato AL SINGOLO carbonile: vedi la nota sugli SMARTS sopra.
  if(g.anidride){ add('C=O anidride asim.', 1820, 26, 0.92); add('C=O anidride sim.', 1755, 26, 0.85); }
  if(g.cloruroAcile) add('C=O cloruro acilico', 1800, 24, 1.00);
  if(g.estere){
    var pkE = 1735;
    if(g.estereArilico) pkE += 25;          // estere fenolico: sale
    if(g.estereConiug)  pkE -= 25;          // acile coniugato: scende
    add('C=O estere' + (g.estereArilico ? ' (arilico)' : ''), pkE, 26, 1.00);
  }
  if(g.aldeide)           add('C=O aldeide', 1725 + (g.aldeideConiug ? -25 : 0), 26, 1.00);
  if(g.chetone)           add('C=O chetone', 1715 + (g.chetoneConiug ? -25 : 0), 26, 1.00);
  if(g.acidoCarbossilico) add('C=O acido',   1710 + (g.acidoConiug   ? -20 : 0), 30, 0.98);
  if(g.ammidePrim || g.ammideSec || g.ammideTerz){
    add('C=O ammide (banda I)', 1655, 34, 0.95);
    if(g.ammidePrim || g.ammideSec) add('N–H flessione (banda II)', 1550, 40, 0.68);
  }

  // ── doppi legami e flessioni, 1650–1300 ──
  if(g.alchene && !g.aromatico) add('C=C alchene', 1650, 28, 0.32);
  if(g.aromatico){
    add('C=C aromatico', 1600, 26, 0.55);
    add('C=C aromatico', 1500, 26, 0.48);
    add('C=C aromatico', 1450, 26, 0.35);
  }
  if(g.amminaPrim) add('N–H₂ flessione', 1615, 40, 0.40);
  if(g.nitro){ add('N=O nitro asim.', 1520, 34, 0.88); add('N=O nitro sim.', 1345, 34, 0.80); }
  if(g.ch2) add('C–H flessione (CH₂ scissoring)', 1465, 28, 0.38);
  if(g.ch3) add('C–H flessione (CH₃)', 1375, 24, 0.32);
  if(g.solfone){ add('S=O solfone asim.', 1350, 40, 0.85); add('S=O solfone sim.', 1150, 40, 0.80); }

  // ── impronta digitale, 1300–650 ──
  if(g.acidoCarbossilico){ add('C–O acido', 1280, 50, 0.68); add('O–H fuori piano', 930, 70, 0.40, 'G'); }
  if(g.estere){ add('C–O–C estere asim.', 1240, 55, 0.85); add('C–O–C estere sim.', 1100, 45, 0.62); }
  if(g.fosfato) add('P=O fosfato', 1250, 55, 0.90);
  if(g.fenolo)  add('C–O fenolo', 1230, 50, 0.65);
  if(g.etere && !g.estere) add('C–O–C etere', 1120, 50, 0.68);
  if(g.alcolTerz) add('C–O alcol 3°', 1150, 45, 0.65);
  if(g.alcolSec)  add('C–O alcol 2°', 1100, 45, 0.68);
  if(g.alcolPrim) add('C–O alcol 1°', 1050, 45, 0.70);
  if(g.amminaPrim || g.amminaSec || g.amminaAr) add('C–N ammina', 1080, 50, 0.35);
  if(g.solfossido) add('S=O solfossido', 1045, 45, 0.80);
  // Le bande fuori dal piano dicono COME e' sostituito l'anello: e' il modo
  // classico di distinguere orto, meta e para guardando sotto 900 cm⁻¹.
  if(g.arOrto)      add('C–H oop (orto-disostituito)', 750, 40, 0.60);
  else if(g.arMeta){ add('C–H oop (meta-disostituito)', 780, 40, 0.55); add('C–H oop (meta)', 690, 40, 0.50); }
  else if(g.arPara)  add('C–H oop (para-disostituito)', 820, 40, 0.62);
  else if(g.arMono){ add('C–H oop (monosostituito)', 750, 40, 0.62); add('C–H oop (monosost.)', 690, 40, 0.58); }
  // Catena lunga: le CH₂ in fila oscillano insieme e danno la banda di
  // "rocking" a 722 cm⁻¹. E' il modo di dire, guardando lo spettro, che si
  // ha davanti un alchile lungo e non un metile.
  if((g.ch2||0) >= 4) add('CH₂ rocking (catena lunga)', 722, 20, 0.42);
  if(g.alogenoCl) add('C–Cl', 720, 55, 0.45);
  if(g.alogenoBr) add('C–Br', 600, 55, 0.42);
  if(g.alogenoF)  add('C–F', 1150, 60, 0.70);
  if(g.alogenoI)  add('C–I', 550, 55, 0.40);

  return b;
}

/* ─────────────────────────────────────────────────────────────────────
   3. DISEGNO — in TRASMITTANZA, come ogni spettro IR di questo mondo
   ───────────────────────────────────────────────────────────────────── */

/* Il grafico precedente mostrava l'assorbanza verso l'alto. Nessuno spettro
   IR si presenta cosi': strumenti, libri e articoli usano la trasmittanza
   percentuale, con le bande che scendono verso il basso e la linea di base
   in alto al 100%. Un chimico che vede i picchi all'insu' capisce subito
   che sta guardando qualcosa di fatto male, ancora prima di leggere i
   numeri. */

/* Le bande arrivano in DUE formati. Quelle di questo motore usano w
   (larghezza) e i (intensita'); quelle del predittore vecchio, che resta in
   funzione finche' RDKit non e' carico, usano fw e h. Leggere solo w e i
   dava undefined su quelle vecchie, undefined finiva nei conti e il
   disegno usciva con "M58.0,NaN" — cioe' un grafico vuoto, ma solo nei
   pochi secondi prima che RDKit arrivasse, quindi difficile da vedere a
   occhio. L'ha trovato il banco di stabilita', che legge la console. */
function larghezza(b){
  var w = (typeof b.w === 'number') ? b.w : b.fw;
  return (typeof w === 'number' && isFinite(w) && w > 0) ? w : 30;
}
function intensita(b){
  var i = (typeof b.i === 'number') ? b.i : b.h;
  return (typeof i === 'number' && isFinite(i)) ? i : 0;
}

function assorbanzaA(bande, wn){
  var A = 0;
  if(!bande || !bande.length) return 0;
  for(var k=0;k<bande.length;k++){
    var b = bande[k];
    if(!b || typeof b.pk !== 'number' || !isFinite(b.pk)) continue;
    var w = larghezza(b), it = intensita(b);
    if(b.f === 'G'){
      var s = w/2.3548;                         // FWHM → sigma
      A += it * Math.exp(-(wn-b.pk)*(wn-b.pk)/(2*s*s));
    } else {
      var hw = w/2;                             // lorentziana: code lunghe,
      var d = (wn-b.pk)/hw;                     // come le bande vere
      A += it / (1 + d*d);
    }
  }
  return isFinite(A) ? A : 0;
}

function esc(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;')
                  .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function svgIR(bande, opz){
  opz = opz || {};
  var colore = opz.colore || '#c62828';
  var VW=820, VH=300, PL=58, PR=16, PT=20, PB=52;
  var CW=VW-PL-PR, CH=VH-PT-PB;
  var WN_MAX=4000, WN_MIN=400, PASSO=2;

  var x = function(wn){ return PL + ((WN_MAX-wn)/(WN_MAX-WN_MIN))*CW; };
  var y = function(T){  return PT + CH*(1 - T/100); };   // 100% in alto

  /* Nessun rumore casuale. Prima ne veniva aggiunto un pizzico ad ogni
     ridisegno: lo stesso identico composto usciva ogni volta diverso, e due
     spettri della stessa molecola non erano confrontabili. Uno spettro
     calcolato deve essere riproducibile — se serve un fondo realistico si
     usa una funzione del numero d'onda, non Math.random(). */
  var punti = [], Amax = 0, wn, A;
  for(wn=WN_MAX; wn>=WN_MIN; wn-=PASSO){
    A = assorbanzaA(bande, wn);
    if(A > Amax) Amax = A;
    punti.push([wn, A]);
  }
  if(Amax < 1e-6) Amax = 1;

  // La banda piu' forte scende al 4% di trasmittanza: e' l'aspetto tipico
  // di uno spettro registrato bene, ne' saturo ne' schiacciato.
  var scala = Math.log(100/4) / Amax;
  var d = '';
  for(var i=0;i<punti.length;i++){
    var T = 100*Math.exp(-scala*punti[i][1]);
    if(!isFinite(T)) T = 100;          // cintura: mai un NaN dentro il path
    var px = x(punti[i][0]), py = y(T);
    if(!isFinite(px) || !isFinite(py)) continue;
    d += (d?'L':'M') + px.toFixed(1) + ',' + py.toFixed(1);
  }

  var s = '<svg viewBox="0 0 '+VW+' '+VH+'" width="100%" xmlns="http://www.w3.org/2000/svg" '+
          'font-family="system-ui,-apple-system,Segoe UI,sans-serif" role="img" '+
          'aria-label="Spettro infrarosso previsto, trasmittanza percentuale">';
  s += '<rect x="0" y="0" width="'+VW+'" height="'+VH+'" fill="#fff"/>';

  // griglia e assi
  var tick;
  for(tick=4000; tick>=400; tick-=500){
    s += '<line x1="'+x(tick).toFixed(1)+'" y1="'+PT+'" x2="'+x(tick).toFixed(1)+'" y2="'+(PT+CH)+
         '" stroke="#e3e7ea" stroke-width="1"/>';
    s += '<text x="'+x(tick).toFixed(1)+'" y="'+(PT+CH+18)+'" font-size="11" fill="#555" '+
         'text-anchor="middle">'+tick+'</text>';
  }
  for(var t=0; t<=100; t+=20){
    s += '<line x1="'+PL+'" y1="'+y(t).toFixed(1)+'" x2="'+(PL+CW)+'" y2="'+y(t).toFixed(1)+
         '" stroke="#eef1f3" stroke-width="1"/>';
    s += '<text x="'+(PL-8)+'" y="'+(y(t)+4).toFixed(1)+'" font-size="11" fill="#555" '+
         'text-anchor="end">'+t+'</text>';
  }
  // La regione sotto 1500 cm⁻¹ e' l'impronta digitale: si segna, perche'
  // e' li' che si riconosce la molecola e non solo la classe.
  s += '<rect x="'+x(1500).toFixed(1)+'" y="'+PT+'" width="'+(x(400)-x(1500)).toFixed(1)+
       '" height="'+CH+'" fill="#f2b8b8" opacity="0.13"/>';
  // La scritta va in BASSO: in alto finiva addosso ai numeri delle bande
  // dell'impronta digitale, che sono tanti e proprio li'.
  s += '<text x="'+((x(1500)+x(400))/2).toFixed(1)+'" y="'+(PT+CH-7)+'" font-size="10" '+
       'fill="#a06060" text-anchor="middle">impronta digitale</text>';
  s += '<rect x="'+PL+'" y="'+PT+'" width="'+CW+'" height="'+CH+'" fill="none" stroke="#c8ced3"/>';

  // la traccia
  s += '<path d="'+d+'" fill="none" stroke="'+colore+'" stroke-width="1.6" '+
       'stroke-linejoin="round" vector-effect="non-scaling-stroke"/>';

  /* Etichette: solo le bande che si vedono davvero, e mai una sopra
     l'altra. Prima erano tutte, e a 1735/1600/1500 i numeri finivano
     scritti uno addosso all'altro. */
  var forti = bande.filter(function(b){ return b && typeof b.pk === 'number' && intensita(b) >= 0.40; })
                   .sort(function(p,q){ return intensita(q) - intensita(p); });
  var presi = [];
  forti.forEach(function(b){
    var px = x(b.pk);
    for(var k=0;k<presi.length;k++) if(Math.abs(presi[k]-px) < 34) return;
    if(presi.length >= 9) return;
    presi.push(px);
    var Tb = 100*Math.exp(-scala*assorbanzaA(bande, b.pk));
    var py = y(Tb);
    s += '<line x1="'+px.toFixed(1)+'" y1="'+(py-4).toFixed(1)+'" x2="'+px.toFixed(1)+
         '" y2="'+(PT+15)+'" stroke="'+colore+'" stroke-width="0.7" opacity="0.45" '+
         'stroke-dasharray="2,2"/>';
    s += '<text x="'+px.toFixed(1)+'" y="'+(PT+11)+'" font-size="10" fill="'+colore+
         '" text-anchor="middle">'+Math.round(b.pk)+'</text>';
  });

  s += '<text x="'+(PL+CW/2)+'" y="'+(VH-10)+'" font-size="12" fill="#333" '+
       'text-anchor="middle">Numero d\'onda (cm⁻¹)</text>';
  s += '<text x="16" y="'+(PT+CH/2)+'" font-size="12" fill="#333" text-anchor="middle" '+
       'transform="rotate(-90 16 '+(PT+CH/2)+')">Trasmittanza (%)</text>';
  s += '</svg>';
  return s;
}

/* La legenda delle assegnazioni: senza, un grafico di bande e' solo un
   disegno. Con, diventa uno strumento per studiare. */
function legendaIR(bande){
  if(!bande.length) return '';
  var ord = bande.slice().sort(function(a,b){ return b.pk - a.pk; });
  var h = '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">';
  ord.forEach(function(b){
    var forza = b.i >= 0.8 ? 'forte' : (b.i >= 0.45 ? 'media' : 'debole');
    h += '<span style="background:rgba(198,40,40,.09);border:1px solid rgba(198,40,40,.25);'+
         'border-radius:6px;padding:3px 8px;font-size:.76rem;color:#7a2020">'+
         '<b>'+Math.round(b.pk)+'</b> cm⁻¹ · '+esc(b.n)+' <i style="opacity:.7">('+forza+')</i></span>';
  });
  return h + '</div>';
}

/* ─────────────────────────────────────────────────────────────────────
   3-bis. ¹H NMR — gli stessi gruppi, letti come intorni protonici
   ─────────────────────────────────────────────────────────────────────
   Il predittore NMR precedente aveva esattamente lo stesso difetto dell'IR,
   e per la stessa riga di codice: isAcid veniva calcolato con
   has(smi,/C\(=O\)O/) && !has(smi,/C\(=O\)O[Cc]/). Nell'aspirina il
   "C(=O)O" e' seguito da una "c", quindi isAcid risultava falso e il
   protone del COOH — quello a 11,7 ppm, il piu' inconfondibile dello
   spettro — non veniva mostrato affatto.

   Qui ogni intorno protonico ha il suo SMARTS e viene contato per quanti
   protoni vale davvero, cosi' le integrazioni hanno un senso. */
var SMARTS_H = [
  // [chiave, SMARTS, ppm, molteplicita', H per corrispondenza, etichetta]
  ['cooh',  '[CX3](=[OX1])[OX2H1]',        11.6, 'br s', 1, '–COOH (acido carbossilico)'],
  ['cho',   '[CX3H1](=[OX1])',              9.75, 's',    1, '–CHO (aldeide)'],
  ['nhAmm', '[CX3](=[OX1])[NX3;H1,H2]',     7.60, 'br s', 1, 'N–H ammidico'],
  ['arH',   '[cH]',                         7.26, 'm',    1, 'H aromatici'],
  ['vinil', '[CX3H1]=[CX3]',                5.35, 'm',    1, 'H vinilico (C=C)'],
  ['ohFen', '[c][OX2H1]',                   5.20, 'br s', 1, 'O–H fenolico (variabile)'],
  ['ocOch2','[CX3](=[OX1])[OX2][CX4H2]',    4.12, 'q',    2, 'O–CH₂ di estere'],
  ['ocOch3','[CX3](=[OX1])[OX2][CX4H3]',    3.68, 's',    3, 'O–CH₃ di estere'],
  ['arOch3','[c][OX2][CX4H3]',              3.80, 's',    3, 'O–CH₃ arilico (metossi)'],
  ['ohCh2', '[OX2H1][CX4H2]',               3.62, 't',    2, 'H–C–OH (carbinolico)'],
  ['nch2',  '[NX3][CX4H2]',                 2.70, 'm',    2, 'N–CH₂'],
  ['coch2', '[CX3](=[OX1])[CX4H2]',         2.42, 'm',    2, 'CH₂ in α al carbonile'],
  ['arch3', '[c][CX4H3]',                   2.32, 's',    3, 'Ar–CH₃ (benzilico)'],
  ['coch3', '[CX3](=[OX1])[CX4H3]',         2.12, 's',    3, 'CH₃ in α al carbonile'],
  ['ohAlc', '[CX4][OX2H1]',                 2.00, 'br s', 1, 'O–H alcolico (variabile)'],
  ['nh2',   '[NX3H2][CX4]',                 1.45, 'br s', 2, 'N–H₂ amminico (variabile)'],
  ['ch2',   '[CX4H2]',                      1.30, 'm',    2, '–CH₂– alifatici'],
  /* Un metile attaccato a un carbonio che porta O o N sente l'elettro-
     negativita' di rimbalzo e scende a ~1,25 invece di 0,9: e' la
     differenza fra il CH₃ dell'etanolo (1,2) e quello di un alcano (0,9).
     Senza questa riga l'etile dell'acetato di etile usciva a 0,92 contro
     l'1,26 reale. */
  ['ch3b',  '[CX4H3][CX4;$([CX4][OX2]),$([CX4][NX3])]', 1.24, 't', 3, '–CH₃ in β a O/N'],
  ['ch3',   '[CX4H3]',                      0.92, 't',    3, '–CH₃ alifatici']
];

/* Alcuni SMARTS si contengono a vicenda: ogni CH₃ legato a un carbonile e'
   anche un CH₃ alifatico. Se non si scala, l'integrazione conta due volte
   gli stessi protoni e i rapporti — l'unica cosa che in un ¹H NMR si legge
   davvero — vengono sbagliati. */
var SOTTRAI_H = {
  ch3:  ['arch3', 'coch3', 'ocOch3', 'arOch3', 'ch3b'],
  ch2:  ['nch2', 'coch2', 'ocOch2', 'ohCh2'],
  ohAlc:['ohFen']
};

function picchiH(RD, mol){
  var conta = {};
  SMARTS_H.forEach(function(r){
    try{
      var q = RD.get_qmol(r[1]);
      if(!q) return;
      var m = JSON.parse(mol.get_substruct_matches(q) || '[]');
      conta[r[0]] = m.length;
      if(q.delete) q.delete();
    }catch(e){ conta[r[0]] = 0; }
  });
  for(var base in SOTTRAI_H){
    if(!SOTTRAI_H.hasOwnProperty(base)) continue;
    SOTTRAI_H[base].forEach(function(fig){
      conta[base] = Math.max(0, (conta[base]||0) - (conta[fig]||0));
    });
  }
  var picchi = [];
  SMARTS_H.forEach(function(r){
    var n = conta[r[0]] || 0;
    if(!n) return;
    picchi.push({ ppm: r[2], mult: r[3], nH: n * r[4], lbl: r[5] });
  });
  return picchi.sort(function(a,b){ return b.ppm - a.ppm; });
}

/* ─────────────────────────────────────────────────────────────────────
   4. API
   ───────────────────────────────────────────────────────────────────── */

/* Restituisce i gruppi funzionali via RDKit. Se RDKit non e' disponibile
   (offline al primo avvio, o WASM bloccato) si chiama la richiamata con
   null: il chiamante decide se ripiegare sul metodo vecchio o dire che non
   puo' calcolare. Non si finge un risultato che non si ha. */
/* I gruppi trovati restano in memoria: RDKit va interrogato una volta sola
   per molecola. Serve anche perche' i sei punti dell'app che disegnano uno
   spettro lo fanno in modo SINCRONO — con la cache calda rispondono subito
   con i dati buoni, senza dover riscrivere sei percorsi diversi. */
var _cache = {};
var _inCorso = {};

function gruppiSync(smiles){
  return Object.prototype.hasOwnProperty.call(_cache, smiles) ? _cache[smiles] : null;
}

/* Chi vuole essere avvisato quando l'analisi di una molecola e' pronta:
   serve a ridisegnare lo spettro con i dati veri appena arrivano, invece di
   lasciare a schermo quello di ripiego. */
var _ascoltatori = [];
function quandoPronto(fn){ if(typeof fn === 'function') _ascoltatori.push(fn); }
function avvisa(smiles){
  for(var i=0;i<_ascoltatori.length;i++){
    try{ _ascoltatori[i](smiles); }catch(e){}
  }
}

/* Scalda RDKit senza che nessuno stia aspettando, cosi' la prima molecola
   guardata trova gia' tutto pronto invece di passare dal ripiego. */
function precarica(){
  if(typeof window.bsiLoadRDKit === 'function'){
    try{ window.bsiLoadRDKit(function(){}); }catch(e){}
  }
}

function gruppi(smiles, cb){
  cb = cb || function(){};
  var giaFatto = gruppiSync(smiles);
  if(giaFatto !== null){ cb(giaFatto); return; }
  if(_inCorso[smiles]){ _inCorso[smiles].push(cb); return; }
  _inCorso[smiles] = [cb];
  var consegna = function(g){
    _cache[smiles] = g;
    var lista = _inCorso[smiles] || [];
    delete _inCorso[smiles];
    for(var i=0;i<lista.length;i++){ try{ lista[i](g); }catch(e){} }
    if(g) avvisa(smiles);
  };
  cb = consegna;
  if(!smiles || typeof window.bsiLoadRDKit !== 'function'){ cb(null); return; }
  var risposto = false;
  var scaduto = setTimeout(function(){ if(!risposto){ risposto = true; cb(null); } }, 20000);
  try{
    window.bsiLoadRDKit(function(RD){
      if(risposto) return;
      risposto = true; clearTimeout(scaduto);
      var mol = null;
      try{ mol = RD.get_mol(smiles); }catch(e){ mol = null; }
      if(!mol){ cb(null); return; }
      var g;
      try{
        g = ripulisci(contaGruppi(RD, mol));
        // I picchi ¹H si calcolano ORA, finche' la molecola RDKit e' viva:
        // dopo mol.delete() non si potrebbe piu' interrogarla.
        try{ g.__protoni = picchiH(RD, mol); }catch(e){ g.__protoni = null; }
      }
      catch(e){ g = null; }
      try{ if(mol.delete) mol.delete(); }catch(e){}
      cb(g);
    });
  }catch(e){ if(!risposto){ risposto = true; clearTimeout(scaduto); cb(null); } }
}

window.BSISpettri = {
  gruppi: gruppi,
  gruppiSync: gruppiSync,
  quandoPronto: quandoPronto,
  precarica: precarica,
  bandeDaGruppi: bandeDaGruppi,
  svgIR: svgIR,
  legendaIR: legendaIR,
  assorbanzaA: assorbanzaA,
  SMARTS: SMARTS
};

/* ─────────────────────────────────────────────────────────────────────
   5. INNESTO SULLE FUNZIONI ESISTENTI
   ─────────────────────────────────────────────────────────────────────
   Nell'app sei punti diversi disegnano uno spettro IR, e tutti passano da
   irBandList() e makeIRsvg(). Invece di ricablarli uno per uno — sei
   occasioni di sbagliarne uno e lasciarlo indietro — si sostituiscono le
   due funzioni: chi le chiama non cambia una riga e ottiene lo spettro
   giusto. Le versioni vecchie restano come rete di sicurezza per quando
   RDKit non e' ancora arrivato. */
function innesta(){
  var vecchiaBande = window.irBandList;
  var vecchioSvg   = window.makeIRsvg;
  if(typeof vecchiaBande !== 'function' || typeof vecchioSvg !== 'function') return false;

  window.irBandList = function(smi){
    var g = gruppiSync(smi);
    if(g) return bandeDaGruppi(g);
    // Non ancora analizzata: si avvia l'analisi (che al termine avvisa e fa
    // ridisegnare) e per ora si risponde col metodo vecchio, cosi' non
    // resta un riquadro vuoto in attesa.
    if(smi) gruppi(smi, function(){});
    return vecchiaBande.call(this, smi);
  };

  window.makeIRsvg = function(bande, colore){
    // Il disegno non ha bisogno di RDKit: e' solo una funzione delle bande.
    // Quindi la convenzione giusta (trasmittanza, niente rumore casuale)
    // vale SEMPRE, anche quando le bande vengono dal metodo vecchio.
    try{ return svgIR(bande || [], { colore: colore }); }
    catch(e){ return vecchioSvg.call(this, bande, colore); }
  };

  window.BSISpettri.irBandListLegacy = vecchiaBande;
  window.BSISpettri.makeIRsvgLegacy  = vecchioSvg;

  // Stessa sostituzione per l'NMR protonico, che soffriva dello stesso
  // difetto e per la stessa identica riga di codice.
  var vecchiPicchi = window.nmrPeakList;
  if(typeof vecchiPicchi === 'function'){
    window.nmrPeakList = function(smi){
      var g = gruppiSync(smi);
      if(g && g.__protoni && g.__protoni.length) return g.__protoni;
      if(smi) gruppi(smi, function(){});
      return vecchiPicchi.call(this, smi);
    };
    window.BSISpettri.nmrPeakListLegacy = vecchiPicchi;
  }
  return true;
}

/* irBandList e makeIRsvg vivono in uno <script> della pagina che potrebbe
   non essere ancora stato eseguito: si prova subito e, se non ci sono, si
   riprova al caricamento. */
if(!innesta()){
  window.addEventListener('DOMContentLoaded', function(){ innesta(); });
  window.addEventListener('load', function(){ innesta(); });
}
// RDKit si scalda con calma, quando la pagina ha finito le sue cose.
window.addEventListener('load', function(){ setTimeout(precarica, 1500); });

})();
