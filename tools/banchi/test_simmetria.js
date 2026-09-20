/* La sezione sulla simmetria molecolare.
   Non basta che si apra: i contenuti sono scientifici e vanno verificati.
   Le regole di selezione qui non sono decorazione — determinano quali
   bande l'utente si aspetta di vedere in uno spettro. */
const { chromium } = require('playwright-core');
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const ctx = await b.newContext({ serviceWorkers: 'block' });
  const pg = await ctx.newPage();
  const err = [];
  pg.on('pageerror', e => err.push(e.message));
  pg.on('console', m => {
    if (m.type() === 'error' && !/Failed to load resource|favicon/.test(m.text())) err.push('console: ' + m.text());
  });
  let ok = 0, ko = 0;
  const att = (d, a, v) => {
    if (String(a) === String(v)) { ok++; console.log('  ✓ ' + d + '  → ' + v); }
    else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + a + '\n      avuto:  ' + v); }
  };

  await pg.goto('http://127.0.0.1:8899/index.html', { waitUntil: 'load', timeout: 60000 });
  await pg.waitForTimeout(2500);

  console.log('\n1) La sezione esiste e si apre dal menu');
  const apre = await pg.evaluate(() => {
    const btn = document.querySelector('[data-s="ssimm"]');
    if (btn) btn.click();
    const sec = document.getElementById('ssimm');
    return {
      voce: !!btn,
      visibile: !!(sec && getComputedStyle(sec).display !== 'none'),
      molecole: document.getElementById('simmSel') ? document.getElementById('simmSel').options.length - 1 : 0,
      gruppi: document.querySelectorAll('#simmGruppiBtn button').length
    };
  });
  att('la voce di menu c\'è', true, apre.voce);
  att('la sezione si apre', true, apre.visibile);
  att('le molecole di esempio sono caricate', 14, apre.molecole);
  att('le tavole dei caratteri sono selezionabili', 8, apre.gruppi);

  console.log('\n2) Il numero di modi normali è calcolato, non scritto a mano');
  /* 3N−6 per le non lineari, 3N−5 per le lineari. È la formula che ogni
     studente deve saper applicare, e sbagliarla qui sarebbe grave. */
  const modi = await pg.evaluate(() => {
    const sel = document.getElementById('simmSel');
    const leggi = f => {
      sel.value = f; sel.onchange();
      const t = document.getElementById('simmEsito').textContent;
      const m = t.match(/Modi normali\s*(\d+)/);
      return m ? parseInt(m[1], 10) : null;
    };
    return { acqua: leggi('H₂O'), co2: leggi('CO₂'), metano: leggi('CH₄'), benzene: leggi('C₆H₆') };
  });
  att('H₂O (non lineare, 3 atomi): 3N−6 = 3', 3, modi.acqua);
  att('CO₂ (lineare, 3 atomi): 3N−5 = 4', 4, modi.co2);
  att('CH₄ (5 atomi): 3N−6 = 9', 9, modi.metano);
  att('C₆H₆ (12 atomi): 3N−6 = 30', 30, modi.benzene);

  console.log('\n3) Il centro di inversione è riconosciuto correttamente');
  const centro = await pg.evaluate(() => {
    const sel = document.getElementById('simmSel');
    const ha = f => { sel.value = f; sel.onchange();
      return /esclusione mutua/.test(document.getElementById('simmEsito').textContent); };
    return { co2: ha('CO₂'), acqua: ha('H₂O'), sf6: ha('SF₆'), nh3: ha('NH₃'), benzene: ha('C₆H₆') };
  });
  att('CO₂ è centrosimmetrica', true, centro.co2);
  att('SF₆ è centrosimmetrica', true, centro.sf6);
  att('C₆H₆ è centrosimmetrico', true, centro.benzene);
  att('H₂O NON lo è', false, centro.acqua);
  att('NH₃ NON lo è', false, centro.nh3);

  console.log('\n4) Le regole di selezione nelle tavole dei caratteri');
  const tav = await pg.evaluate(() => {
    const scegli = g => {
      const b = Array.from(document.querySelectorAll('#simmGruppiBtn button')).find(x => x.dataset.g === g);
      if (b) b.click();
      return document.getElementById('simmTavola').textContent;
    };
    return {
      c2v: scegli('C₂ᵥ'),
      c2h: scegli('C₂ₕ'),
      dinfh: scegli('D∞ₕ'),
      td: scegli('Tᵈ')
    };
  });
  // In C₂ᵥ (acqua) nessuna vibrazione è inattiva: tutte IR e Raman
  att('C₂ᵥ: nessuna specie risulta inattiva', false, /inattiva/.test(tav.c2v));
  // In C₂ₕ e D∞ₕ (centrosimmetriche) nessuna specie può essere IR e Raman insieme
  const esclusione = await pg.evaluate(() => {
    const controlla = g => {
      const b = Array.from(document.querySelectorAll('#simmGruppiBtn button')).find(x => x.dataset.g === g);
      if (b) b.click();
      const righe = Array.from(document.querySelectorAll('#simmTavola tbody tr'));
      // una riga viola l'esclusione se porta ENTRAMBE le etichette
      return righe.filter(r => {
        const t = r.lastElementChild.textContent;
        return /IR/.test(t) && /Raman/.test(t);
      }).length;
    };
    return { c2h: controlla('C₂ₕ'), dinfh: controlla('D∞ₕ'), oh: controlla('Oₕ'),
             c2v: controlla('C₂ᵥ'), c3v: controlla('C₃ᵥ') };
  });
  att('C₂ₕ: nessuna specie è IR e Raman insieme', 0, esclusione.c2h);
  att('D∞ₕ: nessuna specie è IR e Raman insieme', 0, esclusione.dinfh);
  att('Oₕ: nessuna specie è IR e Raman insieme', 0, esclusione.oh);
  // nelle non centrosimmetriche invece la sovrapposizione DEVE esistere
  att('C₂ᵥ: alcune specie sono attive in entrambe', true, esclusione.c2v > 0);
  att('C₃ᵥ: alcune specie sono attive in entrambe', true, esclusione.c3v > 0);

  console.log('\n5) Tᵈ: solo T₂ è attiva in IR');
  const td = await pg.evaluate(() => {
    const b = Array.from(document.querySelectorAll('#simmGruppiBtn button')).find(x => x.dataset.g === 'Tᵈ');
    if (b) b.click();
    const righe = Array.from(document.querySelectorAll('#simmTavola tbody tr'));
    return righe.filter(r => /IR/.test(r.lastElementChild.textContent))
                .map(r => r.firstElementChild.textContent.trim());
  });
  att('una sola specie IR-attiva nel gruppo tetraedrico', 1, td.length);
  att('ed è T₂', 'T₂', td[0]);

  console.log('\n6) Le quattro regole di selezione sono spiegate');
  const reg = await pg.evaluate(() => document.getElementById('simmRegole').textContent);
  att('attività IR (momento di dipolo)', true, /momento di dipolo/i.test(reg));
  att('attività Raman (polarizzabilità)', true, /polarizzabilit/i.test(reg));
  att('dipolo permanente solo in C₁/Cₛ/Cₙ/Cₙᵥ', true, /C₁, Cₛ, Cₙ o Cₙᵥ/.test(reg));
  att('chiralità: assenza di assi impropri', true, /asse improprio|Sₙ/.test(reg));

  att('nessun errore JS', 0, err.length);
  err.slice(0, 4).forEach(e => console.log('     ! ' + e.slice(0, 160)));

  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' passati');
  process.exit(ko ? 1 : 0);
})();
