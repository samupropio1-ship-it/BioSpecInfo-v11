/* I DATI DEI FARMACI DEVONO ESSERE VERI, NON PLAUSIBILI.
   Ogni voce dichiara uno SMILES e un peso molecolare: due affermazioni
   indipendenti sulla stessa molecola. RDKit calcola il peso dalla struttura
   e, se non coincide con quello scritto a mano, almeno uno dei due e'
   sbagliato. E' un controllo che non chiede di fidarsi di nessuno.

   Si legge l'elenco DAL VIVO: nel sorgente i farmaci stanno in tre array
   diversi piu' dei .concat() che ne aggiungono altri a runtime, e leggendo
   solo i letterali se ne perdevano 38 su 143. */
const { chromium } = require('playwright-core');
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  const pg = await (await b.newContext({ serviceWorkers: 'block' })).newPage();
  await pg.goto('http://127.0.0.1:8899/index.html', { waitUntil: 'load', timeout: 60000 });
  await pg.waitForTimeout(3000);

  const esiti = await pg.evaluate(() => new Promise(res => {
    window.bsiLoadRDKit(function (RD) {
      const out = FARM_DATA.map(f => {
        const r = { nome: f.name, cat: f.cat, smi: f.smi || '', mw: parseFloat(f.mw) };
        if (!r.smi) { r.errore = 'nessuno SMILES'; return r; }
        let mol = null;
        try { mol = RD.get_mol(r.smi); } catch (e) { r.errore = 'SMILES non valido'; }
        if (!mol) { if (!r.errore) r.errore = 'SMILES non interpretabile'; return r; }
        try {
          const d = JSON.parse(mol.get_descriptors() || '{}');
          r.calc = d.amw;
        } catch (e) { r.errore = 'descrittori non calcolabili'; }
        try { mol.delete(); } catch (e) {}
        return r;
      });
      res(out);
    });
  }));

  let gravi = 0, avvisi = 0;
  const p = (s) => console.log(s);

  p('\n── SMILES mancanti o non validi ──');
  const rotti = esiti.filter(e => e.errore);
  if (!rotti.length) p('  ✓ nessuno');
  rotti.forEach(e => {
    // Gli anticorpi monoclonali e i peptidi non HANNO uno SMILES sensato:
    // per loro l'assenza e' corretta, va solo dichiarata come tale.
    const bio = /mab|Insulina|Ciclosporina|glutide|Octreotide|Caspofungina|Entresto/i.test(e.nome);
    if (bio) { avvisi++; p('  ⚠ ' + e.nome + ' — ' + e.errore + '  (biologico/peptide: atteso)'); }
    else { gravi++; p('  ✗ ' + e.nome + ' — ' + e.errore); }
  });

  p('\n── Peso dichiarato vs calcolato dalla struttura ──');
  const scarti = [];
  esiti.forEach(e => {
    if (e.errore || !e.calc || !isFinite(e.mw)) return;
    const d = Math.abs(e.calc - e.mw);
    if (d > 0.6) scarti.push({ e, d });
  });
  if (!scarti.length) p('  ✓ tutti coerenti (entro 0,6 u)');
  scarti.sort((a, b2) => b2.d - a.d).forEach(({ e, d }) => {
    gravi++;
    p('  ✗ ' + e.nome.padEnd(26) + ' dichiarato ' + e.mw.toFixed(2) +
      '  calcolato ' + e.calc.toFixed(2) + '  (Δ ' + d.toFixed(2) + ')');
  });

  p('\n── Doppioni ──');
  const visti = {}, dupl = [];
  esiti.forEach(e => {
    const k = e.nome.toLowerCase().trim();
    if (visti[k]) dupl.push(e.nome); else visti[k] = 1;
  });
  if (!dupl.length) p('  ✓ nessun farmaco ripetuto');
  dupl.forEach(d => { gravi++; p('  ✗ ' + d + ' compare due volte'); });

  await b.close();
  p('\n' + esiti.length + ' farmaci controllati — ' +
    (gravi ? '✗ ' + gravi + ' ERRORI, ' : 'nessun errore, ') + avvisi + ' avvisi');
  process.exit(gravi ? 1 : 0);
})();
