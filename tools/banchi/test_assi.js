/* GLI ASSI NON DEVONO ESSERE AL CONTRARIO.
   Ogni tipo di spettro ha la sua convenzione, e non sono tutte uguali:
     · IR      → numero d'onda DECRESCENTE da sinistra (4000 … 400 cm⁻¹)
     · NMR     → δ DECRESCENTE da sinistra (12 … 0 ppm), TMS a destra
     · UV-Vis  → lunghezza d'onda CRESCENTE (200 … 800 nm)
     · MS      → m/z CRESCENTE
   Sbagliarne una sola rende lo spettro irriconoscibile a chi lo sa leggere.
   Qui non si legge il codice: si misura DOVE finisce ogni valore sul
   disegno, e si controlla che l'ordine sia quello giusto. */
const { chromium } = require('playwright-core');
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const ctx = await b.newContext({ serviceWorkers: 'block' });
  const pg = await ctx.newPage();
  const err = [];
  pg.on('pageerror', e => err.push(e.message));
  let ok = 0, ko = 0;
  const att = (d, a, v) => {
    if (String(a) === String(v)) { ok++; console.log('  ✓ ' + d + '  → ' + v); }
    else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + a + '\n      avuto:  ' + v); }
  };
  await pg.goto('http://127.0.0.1:8899/index.html', { waitUntil: 'load', timeout: 60000 });
  await pg.waitForTimeout(3500);

  /* Le tacche numeriche di un SVG dicono tutto: si estraggono i <text> con
     dentro un numero, con la loro x, e si guarda se il numero cresce o cala
     andando verso destra. */
  const direzione = svg => {
    const t = [];
    // x E y: le tacche dell'asse orizzontale sono quelle piu' in basso.
    // Prendendo tutti i <text> ci finivano dentro anche i numeri dell'asse
    // Y, che stanno all'estrema sinistra: "parte da 4000" diventava
    // "parte da 0" per colpa della scala della trasmittanza.
    const re = /<text[^>]*x="([\d.]+)"[^>]*y="([\d.]+)"[^>]*>(-?\d+(?:\.\d+)?)<\/text>/g;
    let m;
    const grezzi = [];
    while ((m = re.exec(svg)) !== null)
      grezzi.push({ x: parseFloat(m[1]), y: parseFloat(m[2]), v: parseFloat(m[3]) });
    if (!grezzi.length) return { n: 0, verso: '(nessuna tacca)' };
    const yMax = Math.max.apply(null, grezzi.map(g => g.y));
    grezzi.forEach(g => { if (yMax - g.y < 12) t.push(g); });
    if (t.length < 3) return { n: t.length, verso: '(poche tacche)' };
    const ord = t.slice().sort((a, c) => a.x - c.x);
    let su = 0, giu = 0;
    for (let i = 1; i < ord.length; i++) {
      if (ord[i].v > ord[i - 1].v) su++; else if (ord[i].v < ord[i - 1].v) giu++;
    }
    return { n: t.length, primo: ord[0].v, ultimo: ord[ord.length - 1].v,
             verso: su > giu ? 'crescente' : (giu > su ? 'decrescente' : 'incerto') };
  };

  console.log('\n1) IR — il numero d\'onda cala da sinistra a destra');
  const ir = await pg.evaluate(() => new Promise(res => {
    window.BSISpettri.gruppi('CC(=O)Oc1ccccc1C(=O)O', g =>
      res(window.BSISpettri.svgIR(window.BSISpettri.bandeDaGruppi(g))));
  }));
  const dIr = direzione(ir);
  console.log('    · da ' + dIr.primo + ' a ' + dIr.ultimo + ' (' + dIr.n + ' tacche)');
  att('asse IR decrescente', 'decrescente', dIr.verso);
  att('parte da 4000', 4000, dIr.primo);
  att('arriva a 500 o meno', true, dIr.ultimo <= 500);
  att('e l\'ordinata e\' la trasmittanza', true, /Trasmittanza/.test(ir));

  console.log('\n2) ¹H NMR — δ cala da sinistra a destra, TMS a destra');
  const nmr = await pg.evaluate(() => {
    const p = window.nmrPeakList('CC(=O)Oc1ccccc1C(=O)O');
    return window.makeNMRsvg(p, '#6a1b9a');
  });
  const dNmr = direzione(nmr);
  console.log('    · da ' + dNmr.primo + ' a ' + dNmr.ultimo + ' (' + dNmr.n + ' tacche)');
  att('asse NMR decrescente', 'decrescente', dNmr.verso);
  att('il riferimento TMS c\'e\'', true, /TMS/.test(nmr));
  att('nessun residuo di lavorazione ("v20")', false, />v20</.test(nmr));
  att('l\'etichetta dell\'asse spiega il verso', true, /valori alti a sinistra/.test(nmr));

  console.log('\n3) Nessuno spettro cambia se lo ridisegni');
  const stab = await pg.evaluate(() => {
    const p = window.nmrPeakList('CCO');
    const a = window.makeNMRsvg(p, '#6a1b9a');
    const c = window.makeNMRsvg(p, '#6a1b9a');
    return a === c;
  });
  att('¹H NMR riproducibile (era con rumore casuale)', true, stab);

  console.log('\n4) Il predittore NMR disegna intervalli, non altezze inventate');
  const pred = await pg.evaluate(() => {
    // due predizioni con intervallo e valore tipico, come quelle vere
    const p = [{ group: 'H aromatici', delta: '6.5–8.5 ppm', typical: '7.2–7.5' },
               { group: 'COOH', delta: '10–13 ppm', typical: '~11.5 ppm' }];
    const s1 = window._bsiNmrSvgProva ? window._bsiNmrSvgProva(p) : null;
    return s1;
  });
  if (pred) {
    att('la fascia dell\'intervallo viene disegnata', true, /<rect[^>]*opacity="0.16"/.test(pred));
    att('e c\'e\' il riferimento TMS', true, /TMS/.test(pred));
    const due = await pg.evaluate(() => {
      const p = [{ group: 'x', delta: '6.5–8.5 ppm', typical: '7.2' }];
      return window._bsiNmrSvgProva(p) === window._bsiNmrSvgProva(p);
    });
    att('due disegni identici (niente altezze casuali)', true, due);
  } else {
    console.log('    · _nmrSvg non e\' esposta: si controlla sul sorgente');
    const src = require('fs').readFileSync('/home/user/BioSpecInfo-v11/index.html', 'utf8');
    att('nessuna altezza casuale nel disegno NMR', false,
      /var intensity\s*=\s*0\.55\s*\+\s*Math\.random\(\)/.test(src));
    att('e la fascia dell\'intervallo viene disegnata', true, /opacity="0\.16"/.test(src));
    att('e si legge l\'intervallo, non solo il primo numero', true, /_leggiPpm/.test(src));
  }

  console.log('\n5) UV-Vis e MS: qui l\'asse va nel verso NORMALE');
  const altri = await pg.evaluate(() => {
    const out = {};
    // si aprono le sezioni che li disegnano e si legge l'SVG prodotto
    ['suvvis', 'sms'].forEach(function (sid) {
      const btn = document.querySelector('[data-s="' + sid + '"]');
      if (btn) btn.click();
    });
    return out;
  });
  await pg.waitForTimeout(1200);
  const uvms = await pg.evaluate(() => {
    const g = id => { const e = document.getElementById(id); return e ? e.innerHTML : ''; };
    return { uv: g('uvChart') || g('uvvisChart') || g('uvBox') || '',
             ms: g('msChart') || g('msBox') || '' };
  });
  [['UV-Vis', uvms.uv, 'crescente'], ['MS', uvms.ms, 'crescente']].forEach(([nome, svg, atteso]) => {
    if (!svg || svg.indexOf('<svg') < 0) { console.log('    · ' + nome + ': nessun grafico da misurare qui'); return; }
    const d = direzione(svg);
    console.log('    · ' + nome + ': da ' + d.primo + ' a ' + d.ultimo);
    att(nome + ' ha l\'asse ' + atteso, atteso, d.verso);
  });

  att('nessun errore JS', 0, err.length);
  err.slice(0, 4).forEach(e => console.log('     ! ' + e.slice(0, 150)));

  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' passati');
  process.exit(ko ? 1 : 0);
})();
