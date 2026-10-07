/* ═══════════════════════════════════════════════════════════════════════════
   BSI NMR 2D — COSY, HSQC, HMBC

   PERCHE' SI PUO' FARE ADESSO E NON PRIMA

   Uno spettro bidimensionale non è un disegno più complicato: è una mappa di
   CORRELAZIONI fra due nuclei. Ogni macchia dice «questo protone e questo
   carbonio sono legati da un cammino di tanti legami». Per disegnarla servono
   due cose che fino a `bsi-v189` non c'erano insieme:

     · lo spostamento di OGNI protone e di OGNI carbonio, non di ogni gruppo;
     · l'indice dell'ATOMO che porta quel segnale, per sapere chi correla con
       chi camminando il grafo.

   Il predittore per atomo le dà entrambe. Da lì le tre mappe escono senza
   inventare niente: sono la topologia della molecola, letta con gli
   spostamenti che il predittore prevede.

   LE TRE MAPPE, E CHE COSA DICE CIASCUNA

   · HSQC — un protone e il carbonio A CUI E' LEGATO (¹J, un legame).
     È la mappa che assegna: ogni macchia dice «questo H sta su questo C».
     Nella versione «editata» i CH₂ hanno segno opposto a CH e CH₃, ed è
     così che si contano i CH₂ in una catena senza ambiguità.

   · COSY — due protoni separati da TRE legami (H–C–C–H).
     È la mappa che collega: dice quali protoni sono vicini di casa, e
     seguendo le macchie si ricostruisce la catena.

   · HMBC — un protone e i carboni a DUE o TRE legami.
     È la mappa che attraversa i quaternari e gli eteroatomi: un carbonile
     non ha protoni suoi, ma si vede dalle macchie dei protoni vicini. È il
     modo in cui si incollano fra loro i pezzi trovati col COSY.

   CHE COSA NON FA, E VA DETTO

   Non simula l'esperimento: non ci sono intensità calcolate, non c'è
   evoluzione dei nuclei, non ci sono artefatti, né accoppiamento residuo, né
   la dipendenza dal tempo di miscelamento. Le macchie dicono DOVE ci si
   aspetta una correlazione, con gli spostamenti previsti, e sono grandi tutte
   uguali tranne il segno dell'HSQC. In un HMBC vero le correlazioni a tre
   legami sono spesso più forti di quelle a due, e alcune non si vedono
   affatto: qui ci sono tutte.

   Gli spostamenti ereditano l'incertezza del predittore — misurata, 0,9 ppm
   sul ¹³C e 0,06 sul ¹H — e quindi una macchia è nel posto giusto con quella
   tolleranza, non meglio.

   USO   BSINMR2D.prevedi('CCOC(C)=O', { tipo: 'HSQC' })
         → { tipo, assi, picchi:[{x, y, atomi, segno, etichetta}], ... }

   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';

  function ling() {
    return (globale.BSILingue && globale.BSILingue.corrente &&
            globale.BSILingue.corrente() === 'en') ? 'en' : 'it';
  }
  function t(it, en) { return ling() === 'en' ? en : it; }

  /* ═════════════════════════════════════════════════════════════════════════
     §1 · Da quale atomo viene quale segnale

     Il predittore restituisce SEGNALI, e ogni segnale porta la lista degli
     atomi che lo producono — i sei carboni di un benzene sono un segnale
     solo. Qui si gira la cosa: per ogni atomo, qual è il suo segnale. Senza
     questa mappa non si può camminare il grafo e chiedere «e il vicino, dove
     risuona?».
     ═════════════════════════════════════════════════════════════════════════ */
  function perAtomo(ris) {
    var m = {};
    if (!ris || !ris.segnali) return m;
    ris.segnali.forEach(function (s) {
      (s.atomi || []).forEach(function (a) {
        /* Un atomo può comparire in DUE segnali: i due protoni di un =CH₂
           terminale stanno sullo stesso carbonio e sono cis e trans. Si
           tengono entrambi, perché in un COSY danno due macchie diverse. */
        if (!m[a]) m[a] = [];
        m[a].push(s);
      });
    });
    return m;
  }

  /* la distanza topologica fra atomi pesanti, fino a `max` legami */
  function distanze(gr, da, max) {
    var d = {};
    d[da] = 0;
    var coda = [da];
    while (coda.length) {
      var u = coda.shift();
      if (d[u] >= max) continue;
      for (var k = 0; k < gr.atomi[u].vicini.length; k++) {
        var v = gr.atomi[u].vicini[k];
        if (d[v] !== undefined) continue;
        d[v] = d[u] + 1;
        coda.push(v);
      }
    }
    return d;
  }

  /* Un O–H o un N–H si scambia col solvente e non dà correlazioni
     osservabili: in un COSY non compare, e in un HMBC nemmeno. Escluderli
     non è un dettaglio — in un alcol il protone dell'OH darebbe una macchia
     che in uno spettro vero non c'è. */
  function scambiabile(gr, i) {
    var s = gr.atomi[i].sim;
    return (s === 'O' || s === 'N' || s === 'S');
  }

  /* ═════════════════════════════════════════════════════════════════════════
     §2 · Le tre mappe
     ═════════════════════════════════════════════════════════════════════════ */

  function hsqc(gr, mH, mC) {
    var picchi = [], visti = {};
    Object.keys(mH).forEach(function (k) {
      var i = +k;
      if (scambiabile(gr, i)) return;
      if (gr.atomi[i].sim !== 'C') return;
      var sc = mC[i];
      if (!sc || !sc.length) return;
      mH[i].forEach(function (sh) {
        /* Una macchia per COPPIA DI SEGNALI, non per atomo. I sei carboni
           del benzene sono un segnale ¹³C e un segnale ¹H: in uno spettro
           vero c'è UNA macchia, e contarne sei vorrebbe dire disegnare sei
           volte lo stesso punto e dichiarare sei correlazioni dove ce n'è
           una. Il toluene ne dava sei invece di quattro per la stessa
           ragione. */
        var ch = sc[0].nome + '|' + sh.nome;
        if (visti[ch]) return;
        visti[ch] = 1;
        /* Il SEGNO dell'HSQC editato: i CH₂ escono dalla parte opposta di CH
           e CH₃. È l'informazione che permette di contare i CH₂ di una
           catena senza doverli dedurre dalle integrazioni. */
        var nH = gr.atomi[i].h;
        picchi.push({
          x: sc[0].ppm, y: sh.ppm,
          atomi: [i],
          segno: (nH === 2) ? -1 : 1,
          etichetta: sc[0].nome + ' / ' + sh.nome,
          dettaglio: (nH === 2 ? 'CH₂' : (nH === 1 ? 'CH' : 'CH₃')) +
                     ' · ¹J(C,H)'
        });
      });
    });
    return picchi;
  }

  function cosy(gr, mH, segnali1H) {
    var picchi = [], diagonale = [];
    /* La DIAGONALE porta ogni segnale ¹H, scambiabili compresi: in uno
       spettro vero l'O–H di un alcol la sua macchia sulla diagonale ce
       l'ha — è un protone come gli altri. Quello che non ha sono le macchie
       FUORI diagonale, perché si scambia col solvente troppo in fretta
       perché l'accoppiamento si veda. Escluderlo da entrambe faceva sparire
       un segnale dallo spettro: l'etanolo mostrava due protoni invece di
       tre. */
    (segnali1H || []).forEach(function (s) {
      diagonale.push({ x: s.ppm, y: s.ppm, atomi: (s.atomi || []).slice(),
                       nome: s.nome, etichetta: s.nome });
    });
    var atomi = Object.keys(mH).map(Number).filter(function (i) {
      return !scambiabile(gr, i) && gr.atomi[i].h > 0;
    });
    var visti = {};
    atomi.forEach(function (i) {
      gr.atomi[i].vicini.forEach(function (j) {
        if (atomi.indexOf(j) < 0) return;
        mH[i].forEach(function (si) {
          mH[j].forEach(function (sj) {
            /* Due protoni CHIMICAMENTE EQUIVALENTI non danno una macchia
               fuori diagonale: il loro accoppiamento non è osservabile. Il
               benzene, dove tutti e sei sono lo stesso segnale, ha un COSY
               con la sola diagonale — ed è la prova che distingue una mappa
               calcolata da una disegnata a caso. */
            if (si.nome === sj.nome) return;
            var ch = si.nome + '|' + sj.nome;
            if (visti[ch]) return;
            visti[ch] = 1; visti[sj.nome + '|' + si.nome] = 1;
            var at = si.atomi.concat(sj.atomi);
            picchi.push({ x: si.ppm, y: sj.ppm, atomi: at, segno: 1,
                          etichetta: si.nome + ' ↔ ' + sj.nome,
                          dettaglio: '³J(H,H)' });
            picchi.push({ x: sj.ppm, y: si.ppm, atomi: at, segno: 1,
                          etichetta: sj.nome + ' ↔ ' + si.nome,
                          dettaglio: '³J(H,H)' });
          });
        });
      });
    });
    return { picchi: picchi, diagonale: diagonale };
  }

  function hmbc(gr, mH, mC) {
    var picchi = [], visti = {};
    Object.keys(mH).forEach(function (k) {
      var i = +k;
      if (scambiabile(gr, i) || !gr.atomi[i].h) return;
      var d = distanze(gr, i, 3);
      Object.keys(d).forEach(function (k2) {
        var c = +k2, n = d[c];
        /* un legame solo è ¹J, e quello lo dice l'HSQC: qui si guarda a due
           e tre legami, che è dove l'HMBC serve */
        if (n < 2 || n > 3) return;
        if (gr.atomi[c].sim !== 'C') return;
        var sc = mC[c];
        if (!sc || !sc.length) return;
        mH[i].forEach(function (sh) {
          var ch = sc[0].nome + '|' + sh.nome + '|' + n;
          if (visti[ch]) return;
          visti[ch] = 1;
          picchi.push({
            x: sc[0].ppm, y: sh.ppm,
            atomi: sh.atomi.concat(sc[0].atomi),
            segno: 1,
            etichetta: sh.nome + ' → ' + sc[0].nome,
            dettaglio: (n === 2 ? '²J' : '³J') + '(C,H)'
          });
        });
      });
    });
    return picchi;
  }

  /* ═════════════════════════════════════════════════════════════════════════
     §3 · L'ingresso pubblico
     ═════════════════════════════════════════════════════════════════════════ */
  var TIPI = ['HSQC', 'COSY', 'HMBC'];

  function prevedi(smiles, opz) {
    opz = opz || {};
    var tipo = String(opz.tipo || 'HSQC').toUpperCase();
    if (TIPI.indexOf(tipo) < 0) tipo = 'HSQC';
    var R = globale.__rdkit, N = globale.BSINMR;
    if (!R || !N) return null;
    if (!smiles || !String(smiles).trim()) return null;

    var pH = N.predici(smiles, { nucleo: '1H' });
    var pC = N.predici(smiles, { nucleo: '13C' });
    if (!pH || !pC) return null;
    if (pH.errore || pC.errore) {
      return { tipo: tipo, picchi: [], diagonale: [],
               errore: pH.errore || pC.errore };
    }

    var mol = null, esito;
    try { mol = R.get_mol(String(smiles)); } catch (e) { return null; }
    if (!mol) return null;
    try {
      var gr = N.grafoDa(mol);
      var mH = perAtomo(pH), mC = perAtomo(pC);
      var picchi = [], diagonale = [];
      if (tipo === 'HSQC') picchi = hsqc(gr, mH, mC);
      else if (tipo === 'HMBC') picchi = hmbc(gr, mH, mC);
      else { var c = cosy(gr, mH, pH.segnali); picchi = c.picchi; diagonale = c.diagonale; }

      var asseC = { nucleo: '13C', min: 0, max: 220, nome: 'δ ¹³C (ppm)' };
      var asseH = { nucleo: '1H', min: -0.5, max: 12, nome: 'δ ¹H (ppm)' };
      esito = {
        tipo: tipo,
        smiles: (function () { try { return mol.get_smiles(); } catch (e) { return smiles; } })(),
        picchi: picchi,
        diagonale: diagonale,
        asseX: (tipo === 'COSY') ? asseH : asseC,
        asseY: asseH,
        segnali1H: pH.segnali,
        segnali13C: pC.segnali,
        metodo: (tipo === 'HSQC')
          ? t('un protone e il carbonio a cui è legato (¹J); segno invertito sui CH₂, come in un HSQC editato',
              'a proton and the carbon it is bonded to (¹J); inverted sign on CH₂, as in an edited HSQC')
          : (tipo === 'COSY')
            ? t('due protoni separati da tre legami (H–C–C–H); i protoni equivalenti non danno macchie fuori diagonale',
                'two protons three bonds apart (H–C–C–H); equivalent protons give no off-diagonal spots')
            : t('un protone e i carboni a due o tre legami (²J e ³J); il legame singolo lo dice l’HSQC',
                'a proton and the carbons two or three bonds away (²J and ³J); the one-bond link is the HSQC’s job'),
        limiti: t(
          'Non è una simulazione dell’esperimento: non ci sono intensità calcolate, ' +
          'artefatti né dipendenza dal tempo di miscelamento. Le macchie dicono DOVE ' +
          'ci si aspetta una correlazione, con gli spostamenti previsti — che portano ' +
          'con sé l’incertezza del predittore, 0,9 ppm sul ¹³C e 0,06 sul ¹H. In un ' +
          'HMBC vero alcune correlazioni a due legami non si vedono: qui ci sono tutte.',
          'This is not a simulation of the experiment: there are no computed intensities, ' +
          'no artefacts and no mixing-time dependence. The spots say WHERE a correlation ' +
          'is expected, with the predicted shifts — which carry the predictor’s ' +
          'uncertainty, 0.9 ppm on ¹³C and 0.06 on ¹H. In a real HMBC some two-bond ' +
          'correlations are not seen: here they all are.')
      };
    } catch (e) {
      esito = { tipo: tipo, picchi: [], diagonale: [],
                errore: (e && e.message) ? e.message : String(e),
                pila: (e && e.stack) ? String(e.stack).split('\n').slice(0, 4).join(' | ') : '' };
    }
    try { mol.delete(); } catch (e) {}
    return esito;
  }

  /* ═════════════════════════════════════════════════════════════════════════
     §4 · Il disegno

     Una mappa 2D si legge con le PROIEZIONI sui bordi: lo spettro 1D di
     ciascun asse, disegnato lungo il suo lato. Senza quelle, una macchia è
     un punto in un rettangolo vuoto e non si sa a quale segnale appartiene.
     ═════════════════════════════════════════════════════════════════════════ */
  function finestra(valori, asse) {
    if (!valori.length) return [asse.min, asse.max];
    var mn = Math.min.apply(null, valori), mx = Math.max.apply(null, valori);
    var m = Math.max(2, (mx - mn) * 0.12);
    return [Math.max(asse.min, mn - m), Math.min(asse.max, mx + m)];
  }

  function disegna(tela, ris, opz) {
    if (!tela || !tela.getContext) return;
    opz = opz || {};
    var ctx = (typeof globale.bsiNitido === 'function')
      ? globale.bsiNitido(tela) : tela.getContext('2d');
    if (!ctx) return;
    var W = tela.width, H = tela.height;
    var ml = 54, mb = 34, mt = 34, mr = 12;      /* margini: proiezioni fuori */
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#06141f';
    ctx.fillRect(0, 0, W, H);
    if (!ris || ris.errore) {
      ctx.fillStyle = '#ff6b6b';
      ctx.font = '12px ui-monospace,monospace';
      ctx.fillText(ris && ris.errore ? ris.errore : 'nessun dato', 12, 20);
      return;
    }
    var tutti = ris.picchi.concat(ris.diagonale || []);
    var vx = opz.vistaX || finestra(tutti.map(function (p) { return p.x; }), ris.asseX);
    var vy = opz.vistaY || finestra(tutti.map(function (p) { return p.y; }), ris.asseY);

    /* entrambi gli assi vanno a DESTRA→SINISTRA e ALTO→BASSO decrescenti,
       come si disegna un NMR: il TMS sta in basso a destra */
    function X(v) { return ml + (vx[1] - v) / (vx[1] - vx[0]) * (W - ml - mr); }
    function Y(v) { return mt + (vy[1] - v) / (vy[1] - vy[0]) * (H - mt - mb); }

    /* griglia e numeri */
    ctx.strokeStyle = '#13293d'; ctx.lineWidth = 1;
    ctx.fillStyle = '#7a8aa0'; ctx.font = '10px ui-monospace,monospace';
    var passoX = scegliPasso(vx[1] - vx[0]), passoY = scegliPasso(vy[1] - vy[0]);
    for (var gx = Math.ceil(vx[0] / passoX) * passoX; gx <= vx[1]; gx += passoX) {
      var px = X(gx);
      ctx.beginPath(); ctx.moveTo(px, mt); ctx.lineTo(px, H - mb); ctx.stroke();
      ctx.textAlign = 'center';
      ctx.fillText(arrotonda(gx), px, H - mb + 13);
    }
    for (var gy = Math.ceil(vy[0] / passoY) * passoY; gy <= vy[1]; gy += passoY) {
      var py = Y(gy);
      ctx.beginPath(); ctx.moveTo(ml, py); ctx.lineTo(W - mr, py); ctx.stroke();
      ctx.textAlign = 'right';
      ctx.fillText(arrotonda(gy), ml - 6, py + 3);
    }
    ctx.strokeStyle = '#1d3c52';
    ctx.strokeRect(ml, mt, W - ml - mr, H - mt - mb);

    /* le proiezioni sui bordi: lo spettro 1D di ciascun asse */
    function proietta(segnali, orizzontale) {
      if (!segnali) return;
      ctx.strokeStyle = '#2f6f86'; ctx.lineWidth = 1;
      segnali.forEach(function (s) {
        if (orizzontale) {
          var x = X(s.ppm);
          if (x < ml || x > W - mr) return;
          ctx.beginPath(); ctx.moveTo(x, mt - 4); ctx.lineTo(x, mt - 22); ctx.stroke();
        } else {
          var y = Y(s.ppm);
          if (y < mt || y > H - mb) return;
          ctx.beginPath(); ctx.moveTo(ml - 4, y); ctx.lineTo(ml - 30, y); ctx.stroke();
        }
      });
    }
    proietta(ris.asseX.nucleo === '13C' ? ris.segnali13C : ris.segnali1H, true);
    proietta(ris.segnali1H, false);

    /* la diagonale del COSY */
    if (ris.tipo === 'COSY') {
      ctx.strokeStyle = '#22455c';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(X(vx[0]), Y(vx[0])); ctx.lineTo(X(vx[1]), Y(vx[1]));
      ctx.stroke();
      ctx.setLineDash([]);
    }

    function macchia(p, acceso, diag) {
      var x = X(p.x), y = Y(p.y);
      if (x < ml || x > W - mr || y < mt || y > H - mb) return;
      var r = acceso ? 9 : (diag ? 5 : 7);
      var col = diag ? '#5d7d93' : (p.segno < 0 ? '#ff8fa3' : '#00c9b7');
      if (acceso) col = '#ffd93d';
      /* un alone, perché una macchia di un 2D vero non ha un bordo netto */
      var g = ctx.createRadialGradient(x, y, 0, x, y, r * 2);
      g.addColorStop(0, col);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, r * 2, 0, 2 * Math.PI); ctx.fill();
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(x, y, r * 0.45, 0, 2 * Math.PI); ctx.fill();
    }

    (ris.diagonale || []).forEach(function (p) { macchia(p, false, true); });
    ris.picchi.forEach(function (p) {
      macchia(p, opz.acceso && p.etichetta === opz.acceso, false);
    });

    /* i nomi degli assi */
    ctx.fillStyle = '#9fb3c8'; ctx.font = '11px system-ui,sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(ris.asseX.nome, (ml + W - mr) / 2, H - 6);
    ctx.save();
    ctx.translate(12, (mt + H - mb) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(ris.asseY.nome, 0, 0);
    ctx.restore();
    ctx.textAlign = 'left';
    ctx.fillStyle = '#00c9b7'; ctx.font = 'bold 12px system-ui,sans-serif';
    ctx.fillText(ris.tipo, ml + 4, 16);
    return { X: X, Y: Y, vistaX: vx, vistaY: vy, ml: ml, mt: mt, mr: mr, mb: mb };
  }

  function scegliPasso(ampiezza) {
    var g = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100];
    for (var i = 0; i < g.length; i++) if (ampiezza / g[i] <= 10) return g[i];
    return 100;
  }
  function arrotonda(v) {
    return (Math.abs(v) < 10) ? (Math.round(v * 10) / 10).toString()
                              : Math.round(v).toString();
  }

  /* la macchia più vicina a un punto della tela, per il clic */
  function vicinoA(ris, mappa, px, py, raggio) {
    if (!ris || !mappa) return null;
    var best = null, bd = raggio || 16;
    ris.picchi.forEach(function (p) {
      var dx = mappa.X(p.x) - px, dy = mappa.Y(p.y) - py;
      var d = Math.sqrt(dx * dx + dy * dy);
      if (d < bd) { bd = d; best = p; }
    });
    return best;
  }

  function csvDa(ris) {
    if (!ris || !ris.picchi) return '';
    var r = [['tipo', 'x_ppm', 'y_ppm', 'segno', 'correlazione', 'cammino', 'atomi'].join(',')];
    ris.picchi.forEach(function (p) {
      r.push([ris.tipo, p.x.toFixed(2), p.y.toFixed(2), p.segno,
              '"' + String(p.etichetta || '').replace(/"/g, '""') + '"',
              '"' + String(p.dettaglio || '') + '"',
              '"' + (p.atomi || []).join(' ') + '"'].join(','));
    });
    return r.join('\n');
  }

  globale.BSINMR2D = {
    prevedi: prevedi,
    disegna: disegna,
    vicinoA: vicinoA,
    csvDa: csvDa,
    TIPI: TIPI,
    versione: '1.0'
  };

})(typeof window !== 'undefined' ? window : globalThis);
