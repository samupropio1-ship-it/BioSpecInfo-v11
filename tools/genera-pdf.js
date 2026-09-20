#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════
   GENERAZIONE DEI PDF — BioSpecInfo
   ═══════════════════════════════════════════════════════════════════════

   In `docs/pdf/` c'erano quindici PDF fermi ai documenti 00-05 e a una
   versione di mesi prima. Un PDF non dice da sé di essere vecchio: si
   apre, si legge, e chi lo legge crede a quello che c'è scritto. Un
   allegato obsoleto e' peggio di un allegato mancante, perche' il primo
   afferma cose false con l'aria di essere autorevole.

   Qui i PDF sono GENERATI dai Markdown a ogni giro, con la versione e il
   commit stampati in ogni piè di pagina. Se il documento cambia, il PDF
   cambia; se non viene rigenerato, la versione stampata in fondo lo
   denuncia.

   Non serve nessuna dipendenza nuova: Chromium è già presente per i
   banchi di prova, e sa stampare. Il Markdown viene convertito in HTML
   da un convertitore minimo scritto qui — i documenti usano un
   sottoinsieme preciso di Markdown (titoli, tabelle, elenchi, codice,
   citazioni), e per quel sottoinsieme una libreria esterna aggiungerebbe
   superficie senza aggiungere risultato.

   USO   node tools/genera-pdf.js            tutti i documenti
         node tools/genera-pdf.js 06 09      solo quelli indicati
   ═══════════════════════════════════════════════════════════════════════ */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { chromium } = require('playwright-core');

const RADICE = path.resolve(__dirname, '..');
const FONTE  = path.join(RADICE, 'docs');
const USCITA = path.join(FONTE, 'pdf');

function versione(){
  try {
    const m = fs.readFileSync(path.join(RADICE, 'sw.js'), 'utf8').match(/CACHE\s*=\s*'([^']+)'/);
    return m ? m[1] : 'sconosciuta';
  } catch (e) { return 'sconosciuta'; }
}
function commit(){
  try { return execSync('git rev-parse --short HEAD', { cwd: RADICE, encoding: 'utf8' }).trim(); }
  catch (e) { return 'non versionato'; }
}
const VER = versione(), SHA = commit();
const OGGI = new Date().toISOString().slice(0, 10);

/* ─────────────────────────────────────────────────────────────────────
   1. Markdown → HTML
   ─────────────────────────────────────────────────────────────────────
   Ordine obbligato: i blocchi di codice vengono messi da parte PRIMA di
   qualunque altra trasformazione, altrimenti un asterisco dentro un
   esempio di codice diventerebbe corsivo. Vengono reintrodotti alla fine.
   ───────────────────────────────────────────────────────────────────── */

function esc(s){
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inline(s){
  const codici = [];
  s = s.replace(/`([^`]+)`/g, function(_, c){
    codici.push('<code>' + esc(c) + '</code>');
    return '\u0000C' + (codici.length - 1) + '\u0000';
  });
  s = esc(s);
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<em>[immagine: $1]</em>');
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*\w])\*([^*\n]+)\*(?=[^*\w]|$)/g, '$1<em>$2</em>');
  s = s.replace(/~~([^~]+)~~/g, '<del>$1</del>');
  return s.replace(/\u0000C(\d+)\u0000/g, function(_, i){ return codici[+i]; });
}

function allineamento(sep){
  const s = sep.trim();
  if (/^:-+:$/.test(s)) return ' style="text-align:center"';
  if (/^-+:$/.test(s))  return ' style="text-align:right"';
  return '';
}

function celle(riga){
  let r = riga.trim();
  if (r.startsWith('|')) r = r.slice(1);
  if (r.endsWith('|'))   r = r.slice(0, -1);
  /* la pipe protetta da backslash e' un carattere, non un separatore */
  return r.split(/(?<!\\)\|/).map(c => c.trim().replace(/\\\|/g, '|'));
}

function mdToHtml(md){
  const righe = md.replace(/\r\n/g, '\n').split('\n');
  let out = '', i = 0;
  let inLista = null;   // 'ul' | 'ol' | null

  function chiudiLista(){ if (inLista) { out += '</' + inLista + '>\n'; inLista = null; } }

  while (i < righe.length) {
    const r = righe[i];

    /* blocco di codice recintato */
    if (/^\s*```/.test(r)) {
      chiudiLista();
      const lingua = r.replace(/^\s*```/, '').trim();
      const corpo = [];
      i++;
      while (i < righe.length && !/^\s*```/.test(righe[i])) { corpo.push(righe[i]); i++; }
      i++;
      out += '<pre class="codice"' + (lingua ? ' data-lingua="' + esc(lingua) + '"' : '') +
             '><code>' + esc(corpo.join('\n')) + '</code></pre>\n';
      continue;
    }

    /* tabella: una riga con pipe seguita da una riga di separatori */
    if (/\|/.test(r) && i + 1 < righe.length && /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(righe[i + 1])
        && /-/.test(righe[i + 1])) {
      chiudiLista();
      const intest = celle(r);
      const alli = celle(righe[i + 1]).map(allineamento);
      i += 2;
      out += '<table>\n<thead><tr>';
      intest.forEach(function(c, k){ out += '<th' + (alli[k] || '') + '>' + inline(c) + '</th>'; });
      out += '</tr></thead>\n<tbody>\n';
      while (i < righe.length && /\|/.test(righe[i]) && righe[i].trim() !== '') {
        const c = celle(righe[i]);
        out += '<tr>';
        for (let k = 0; k < intest.length; k++)
          out += '<td' + (alli[k] || '') + '>' + inline(c[k] === undefined ? '' : c[k]) + '</td>';
        out += '</tr>\n';
        i++;
      }
      out += '</tbody></table>\n';
      continue;
    }

    /* titoli */
    const t = r.match(/^(#{1,6})\s+(.*)$/);
    if (t) {
      chiudiLista();
      const liv = t[1].length;
      out += '<h' + liv + '>' + inline(t[2]) + '</h' + liv + '>\n';
      i++; continue;
    }

    /* riga orizzontale */
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(r)) {
      chiudiLista(); out += '<hr>\n'; i++; continue;
    }

    /* citazione (piu' righe consecutive = un solo blocco) */
    if (/^\s*>/.test(r)) {
      chiudiLista();
      const corpo = [];
      while (i < righe.length && /^\s*>/.test(righe[i])) {
        corpo.push(righe[i].replace(/^\s*>\s?/, '')); i++;
      }
      out += '<blockquote>' + mdToHtml(corpo.join('\n')) + '</blockquote>\n';
      continue;
    }

    /* elenchi */
    const pe = r.match(/^\s*[-*+]\s+(.*)$/);
    const pn = r.match(/^\s*\d+[.)]\s+(.*)$/);
    if (pe || pn) {
      const tipo = pe ? 'ul' : 'ol';
      if (inLista && inLista !== tipo) chiudiLista();
      if (!inLista) { out += '<' + tipo + '>\n'; inLista = tipo; }
      let testo = (pe ? pe[1] : pn[1]);
      /* casella di spunta: nei documenti sono liste di controllo */
      testo = testo.replace(/^\[([ xX])\]\s*/, function(_, s){
        return (s === ' ' ? '☐' : '☑') + ' ';
      });
      out += '<li>' + inline(testo) + '</li>\n';
      i++; continue;
    }

    /* dettagli richiudibili: in un PDF non si possono aprire, quindi
       vengono stampati sempre aperti */
    if (/^\s*<details>/.test(r)) { chiudiLista(); out += '<div class="dettagli">\n'; i++; continue; }
    if (/^\s*<\/details>/.test(r)) { out += '</div>\n'; i++; continue; }
    const su = r.match(/^\s*<summary>(.*)<\/summary>\s*$/);
    if (su) { out += '<p class="riassunto">' + inline(su[1]) + '</p>\n'; i++; continue; }

    /* riga vuota */
    if (r.trim() === '') { chiudiLista(); i++; continue; }

    /* paragrafo: righe consecutive non vuote e non speciali */
    chiudiLista();
    const par = [];
    while (i < righe.length && righe[i].trim() !== ''
           && !/^\s*(#{1,6}\s|>|```|[-*+]\s|\d+[.)]\s|<details|<\/details|<summary)/.test(righe[i])
           && !/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(righe[i])
           && !(/\|/.test(righe[i]) && i + 1 < righe.length
                && /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(righe[i + 1]) && /-/.test(righe[i + 1]))) {
      par.push(righe[i]); i++;
    }
    if (par.length) out += '<p>' + inline(par.join(' ')) + '</p>\n';
  }
  chiudiLista();
  return out;
}

/* ─────────────────────────────────────────────────────────────────────
   2. Impaginazione
   ─────────────────────────────────────────────────────────────────── */

const STILE = `
  @page { size: A4; margin: 20mm 16mm 18mm 16mm; }
  * { box-sizing: border-box; }
  body { font: 10.5pt/1.55 "DejaVu Serif", Georgia, "Times New Roman", serif;
         color: #14202c; margin: 0; }
  h1, h2, h3, h4, h5, h6 {
    font-family: "DejaVu Sans", Helvetica, Arial, sans-serif;
    color: #0d2438; line-height: 1.25; margin: 1.5em 0 .5em;
    break-after: avoid; page-break-after: avoid; }
  h1 { font-size: 20pt; margin-top: 0; border-bottom: 2pt solid #0d2438; padding-bottom: .3em; }
  h2 { font-size: 14.5pt; border-bottom: .6pt solid #b9c7d4; padding-bottom: .22em; }
  h3 { font-size: 12pt; }
  h4, h5, h6 { font-size: 10.8pt; }
  p { margin: .55em 0; orphans: 3; widows: 3; }
  a { color: #0d4f8b; text-decoration: none; }
  code { font-family: "DejaVu Sans Mono", Consolas, monospace; font-size: .86em;
         background: #eef3f8; padding: .1em .32em; border-radius: 2pt; }
  pre.codice { background: #f5f8fb; border: .5pt solid #cfdae6; border-left: 2.5pt solid #0d4f8b;
       padding: .7em .9em; border-radius: 3pt; overflow-wrap: break-word; white-space: pre-wrap;
       font-size: 8.6pt; line-height: 1.42; break-inside: avoid; page-break-inside: avoid; }
  pre.codice code { background: none; padding: 0; font-size: inherit; }
  table { border-collapse: collapse; width: 100%; margin: .8em 0; font-size: 8.9pt;
          break-inside: auto; }
  th, td { border: .5pt solid #c3d0dc; padding: .35em .5em; text-align: left;
           vertical-align: top; }
  th { background: #e8eef5; font-family: "DejaVu Sans", Helvetica, sans-serif;
       font-weight: 600; font-size: 8.6pt; }
  tr { break-inside: avoid; page-break-inside: avoid; }
  thead { display: table-header-group; }     /* l'intestazione si ripete a ogni pagina */
  blockquote { margin: .8em 0; padding: .5em .9em; background: #f3f7fb;
               border-left: 2.5pt solid #7fa6c9; break-inside: avoid; }
  blockquote p { margin: .3em 0; }
  ul, ol { margin: .5em 0; padding-left: 1.5em; }
  li { margin: .18em 0; }
  hr { border: none; border-top: .5pt solid #ccd8e4; margin: 1.3em 0; }
  .dettagli { border: .5pt solid #cfdae6; border-radius: 3pt; padding: .6em .8em; margin: .8em 0; }
  .riassunto { font-family: "DejaVu Sans", Helvetica, sans-serif; font-weight: 600;
               margin: 0 0 .4em; color: #0d2438; }
  .frontespizio { text-align: center; padding-top: 55mm; break-after: page; page-break-after: always; }
  .frontespizio .marchio { font-family: "DejaVu Sans", Helvetica, sans-serif;
      font-size: 27pt; font-weight: 700; color: #0d2438; letter-spacing: .5pt; }
  .frontespizio .titolo { font-family: "DejaVu Sans", Helvetica, sans-serif;
      font-size: 16pt; margin-top: 9mm; color: #24404f; }
  .frontespizio .riga { width: 55mm; height: 2pt; background: #0d4f8b; margin: 8mm auto; }
  .frontespizio .dati { font-size: 9.5pt; color: #4a5c6b; line-height: 1.85; }
  .frontespizio .avviso { margin-top: 26mm; font-size: 8pt; color: #6b7a88;
      max-width: 120mm; margin-left: auto; margin-right: auto; line-height: 1.5; }
`;

const PIEDE = (titolo) => `
  <div style="font-family:'DejaVu Sans',Helvetica,sans-serif;font-size:7pt;color:#7a8896;
              width:100%;padding:0 16mm;display:flex;justify-content:space-between;">
    <span>${esc(titolo)} · ${VER} · ${SHA}</span>
    <span>pag. <span class="pageNumber"></span> / <span class="totalPages"></span></span>
  </div>`;

const TESTA = `<div style="font-size:1px;color:#fff;padding:0;margin:0;">&nbsp;</div>`;

function frontespizio(titolo){
  return '<div class="frontespizio">' +
    '<div class="marchio">BioSpecInfo</div>' +
    '<div class="titolo">' + esc(titolo) + '</div>' +
    '<div class="riga"></div>' +
    '<div class="dati">' +
      'Samuele Pio Provenzano<br>' +
      'Versione <strong>' + VER + '</strong> · commit <code>' + SHA + '</code><br>' +
      'Generato il ' + OGGI +
    '</div>' +
    '<div class="avviso">Documento generato automaticamente dal sorgente Markdown ' +
      'versionato nel repository. La versione e il commit stampati in ogni piè di ' +
      'pagina identificano esattamente lo stato del software descritto.</div>' +
  '</div>';
}

/* Il titolo di un documento e' il suo primo h1; il nome del file e' un
   ripiego, non una scelta. */
function titoloDi(md, nomeFile){
  const m = md.match(/^#\s+(.+)$/m);
  if (m) return m[1].replace(/[*`]/g, '').trim();
  return nomeFile.replace(/\.md$/, '').replace(/^\d+-/, '').replace(/-/g, ' ');
}

/* ─────────────────────────────────────────────────────────────────────
   3. Esecuzione
   ─────────────────────────────────────────────────────────────────── */

function trovaChromium(){
  const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  const candidati = [path.join(base, 'chromium')];
  try {
    fs.readdirSync(base).forEach(function(d){
      candidati.push(path.join(base, d, 'chrome-linux', 'chrome'));
      candidati.push(path.join(base, d, 'chrome-linux', 'headless_shell'));
    });
  } catch (e) {}
  for (const c of candidati) { try { if (fs.statSync(c).isFile()) return c; } catch (e) {} }
  return null;
}

/* L'indice del dossier completo: un PDF di duecento pagine senza indice si
   sfoglia, non si consulta. I numeri di pagina non sono noti prima della
   stampa, quindi l'indice elenca i documenti nell'ordine in cui compaiono. */
function indiceGenerale(voci){
  let m = '<div class="frontespizio"><div class="marchio">BioSpecInfo</div>' +
    '<div class="titolo">Dossier completo</div><div class="riga"></div>' +
    '<div class="dati">Samuele Pio Provenzano<br>Versione <strong>' + VER +
    '</strong> · commit <code>' + SHA + '</code><br>Generato il ' + OGGI + '</div>' +
    '<div class="avviso">Raccolta integrale dei documenti del progetto, nell\'ordine ' +
    'di numerazione. Ogni documento è disponibile anche come PDF separato.</div></div>';
  m += '<h1>Indice</h1><table><thead><tr><th>#</th><th>Documento</th></tr></thead><tbody>';
  voci.forEach(function(v, i){
    m += '<tr><td>' + (i + 1) + '</td><td>' + esc(v) + '</td></tr>';
  });
  m += '</tbody></table><div style="break-after:page;page-break-after:always"></div>';
  return m;
}

async function stampa(pagina, dest, html, titolo){
  await pagina.setContent(html, { waitUntil: 'load' });
  await pagina.pdf({
    path: dest, format: 'A4', printBackground: true,
    displayHeaderFooter: true, headerTemplate: TESTA, footerTemplate: PIEDE(titolo),
    margin: { top: '20mm', bottom: '18mm', left: '0', right: '0' }
  });
  return fs.statSync(dest).size;
}

function pagina_html(lang, titolo, corpo){
  return '<!doctype html><html lang="' + lang + '"><head><meta charset="utf-8">' +
         '<title>' + esc(titolo) + '</title><style>' + STILE + '</style></head><body>' +
         corpo + '</body></html>';
}

async function main(){
  const filtro = process.argv.slice(2).filter(a => a !== '--nopurga');
  const purga  = !process.argv.includes('--nopurga') && !filtro.length;

  fs.mkdirSync(USCITA, { recursive: true });
  console.log('Generazione PDF — ' + VER + ' (' + SHA + ')\n');

  const exe = trovaChromium();
  const browser = await chromium.launch(exe ? { executablePath: exe } : {});
  const pagina = await browser.newPage();

  const prodotti = [];     // [nome file, dimensione]
  let byte = 0;

  /* ── documenti numerati, italiano ── */
  const itDocs = fs.readdirSync(FONTE)
    .filter(f => /^\d\d-.*\.md$/.test(f))
    .filter(f => !filtro.length || filtro.some(x => f.startsWith(x)))
    .sort();

  const corpiIt = [], titoliIt = [];
  for (const f of itDocs) {
    const md = fs.readFileSync(path.join(FONTE, f), 'utf8');
    const titolo = titoloDi(md, f);
    const corpo = mdToHtml(md);
    corpiIt.push(corpo); titoliIt.push(titolo);
    const nome = f.replace(/\.md$/, '.pdf');
    const d = await stampa(pagina, path.join(USCITA, nome),
                           pagina_html('it', titolo, frontespizio(titolo) + corpo), titolo);
    prodotti.push([nome, d]); byte += d;
    console.log('  ✓ ' + nome.padEnd(44) + (d / 1024).toFixed(0).padStart(5) + ' kB');
  }

  /* ── guide pratiche ── */
  for (const f of ['Guida-Chiavi-API.md', 'Guida-DataScience-Corsi-Progetti.md']) {
    if (filtro.length) break;
    const src = path.join(FONTE, f);
    if (!fs.existsSync(src)) continue;
    const md = fs.readFileSync(src, 'utf8');
    const titolo = titoloDi(md, f);
    const nome = f.replace(/\.md$/, '.pdf');
    const d = await stampa(pagina, path.join(USCITA, nome),
                           pagina_html('it', titolo, frontespizio(titolo) + mdToHtml(md)), titolo);
    prodotti.push([nome, d]); byte += d;
    console.log('  ✓ ' + nome.padEnd(44) + (d / 1024).toFixed(0).padStart(5) + ' kB');
  }

  /* ── dossier completo italiano ── */
  if (!filtro.length && corpiIt.length) {
    const sep = '<div style="break-after:page;page-break-after:always"></div>';
    const nome = 'BioSpecInfo-Dossier-Completo.it.pdf';
    const d = await stampa(pagina, path.join(USCITA, nome),
      pagina_html('it', 'Dossier completo',
                  indiceGenerale(titoliIt) + corpiIt.join(sep)), 'Dossier completo');
    prodotti.push([nome, d]); byte += d;
    console.log('  ✓ ' + nome.padEnd(44) + (d / 1024).toFixed(0).padStart(5) + ' kB');
  }

  /* ── traduzioni inglesi, per quanto esistono ── */
  const dirEn = path.join(FONTE, 'en');
  const corpiEn = [], titoliEn = [];
  if (!filtro.length && fs.existsSync(dirEn)) {
    for (const f of fs.readdirSync(dirEn).filter(x => /^\d\d-.*\.md$/.test(x)).sort()) {
      const md = fs.readFileSync(path.join(dirEn, f), 'utf8');
      const titolo = titoloDi(md, f);
      const corpo = mdToHtml(md);
      corpiEn.push(corpo); titoliEn.push(titolo);
      const nome = f.replace(/\.md$/, '.en.pdf');
      const d = await stampa(pagina, path.join(USCITA, nome),
                             pagina_html('en', titolo, frontespizio(titolo) + corpo), titolo);
      prodotti.push([nome, d]); byte += d;
      console.log('  ✓ ' + nome.padEnd(44) + (d / 1024).toFixed(0).padStart(5) + ' kB');
    }
    if (corpiEn.length) {
      const sep = '<div style="break-after:page;page-break-after:always"></div>';
      const nome = 'BioSpecInfo-Full-Dossier.en.pdf';
      const d = await stampa(pagina, path.join(USCITA, nome),
        pagina_html('en', 'Full dossier',
                    indiceGenerale(titoliEn) + corpiEn.join(sep)), 'Full dossier');
      prodotti.push([nome, d]); byte += d;
      console.log('  ✓ ' + nome.padEnd(44) + (d / 1024).toFixed(0).padStart(5) + ' kB');
    }
  }

  await browser.close();

  /* ── purga dei PDF non rigenerati ──
     È così che sono nati i quindici PDF obsoleti: un file rimasto in
     cartella dopo che il documento da cui veniva era stato rinominato.
     Nessuno lo cancella, e continua a essere allegato. */
  if (purga) {
    const attesi = new Set(prodotti.map(p => p[0]));
    const vecchi = fs.readdirSync(USCITA).filter(f => f.endsWith('.pdf') && !attesi.has(f));
    vecchi.forEach(function(f){
      fs.unlinkSync(path.join(USCITA, f));
      console.log('  ⌫ rimosso (non più generato): ' + f);
    });
  }

  /* Un PDF vuoto pesa circa 5 kB: se uno dei documenti pesasse meno di
     quella soglia, la conversione sarebbe fallita senza dirlo. */
  const vuoti = prodotti.filter(r => r[1] < 8 * 1024);
  console.log('\n' + prodotti.length + ' PDF generati · ' +
              (byte / 1024 / 1024).toFixed(1) + ' MB complessivi');
  if (!prodotti.length) { console.log('✗ nessun PDF prodotto'); process.exit(1); }
  if (vuoti.length) {
    console.log('✗ ' + vuoti.length + ' file sospetti (sotto 8 kB, probabile conversione a vuoto):');
    vuoti.forEach(r => console.log('    ! ' + r[0]));
    process.exit(1);
  }
  console.log('✓ nessun file vuoto');
}

main().catch(function(e){ console.error(e); process.exit(1); });
