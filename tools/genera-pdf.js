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
let CONTA_TITOLI = 0;   /* (v248) ogni titolo ha un'ancora, per l'indice di ogni documento */

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
  /* (v248) i pedici, gli apici e gli a capo scritti in HTML nel sorgente (R<sub>s</sub>, m<sup>2</sup>, <br>) si stampavano
     come testo, con le parentesi angolari: ora valgono */
  s = s.replace(/&lt;(\/?)(sub|sup|b|i|strong|em|u)&gt;/gi, '<$1$2>').replace(/&lt;br\s*\/?&gt;/gi, '<br>');
  s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<em>[immagine: $1]</em>');
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*\w])\*([^*\n]+)\*(?=[^*\w]|$)/g, '$1<em>$2</em>');
  /* (v248) il corsivo scritto con i trattini bassi (_cosi'_), a inizio parola: prima si stampavano i trattini */
  s = s.replace(/(^|[\s(«])_([^_\n]+)_(?=[\s).,;:»]|$)/g, '$1<em>$2</em>');
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
      /* (v248) un blocco di codice lungo (la specifica OpenAPI, 300 righe) non puo' stare in una pagina: tenerlo «intero»
         lasciava mezza pagina bianca prima di lui. Solo i blocchi brevi restano interi; i lunghi continuano di pagina. */
      out += '<pre class="codice' + (corpo.length > 30 ? ' lungo' : '') + '"' + (lingua ? ' data-lingua="' + esc(lingua) + '"' : '') +
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
      /* (v248) una tabella «a due colonne senza titoli» (| | | nel sorgente) stampava una riga d'intestazione vuota e
         grigia: se tutte le intestazioni sono vuote, l'intestazione non si stampa */
      out += '<table>\n';
      if (intest.some(function(c){ return String(c).replace(/&nbsp;/g, '').trim() !== ''; })) {
        out += '<thead><tr>';
        intest.forEach(function(c, k){ out += '<th' + (alli[k] || '') + '>' + inline(c) + '</th>'; });
        out += '</tr></thead>\n';
      }
      out += '<tbody>\n';
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
      out += '<h' + liv + (liv === 2 || liv === 3 ? ' id="s' + (++CONTA_TITOLI) + '"' : '') + '>' + inline(t[2]) + '</h' + liv + '>\n';
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
      /* (v248) un riquadro lungo (con tabelle dentro) non puo' restare «intero»: lasciava mezza pagina bianca prima di lui */
      out += '<blockquote' + (corpo.length > 14 ? ' class="lungo"' : '') + '>' + mdToHtml(corpo.join('\n')) + '</blockquote>\n';
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
  /* (v248) la riga di chiusura («Generato il …») non resta sola in una pagina, nemmeno dentro il dossier completo */
  out = out.replace(/<p>(\s*<em>\s*(?:Generato il|Generated on|Generated at)\b)/g, '<p class="chiusa">$1');
  /* la riga finale in corsivo dopo un filo («Documento aggiornato alla versione …»): filo e riga stanno con cio' che precede */
  out = out.replace(/<hr>\s*<p>(\s*<em>[^\n]*<\/em>\.?\s*<\/p>\s*)$/, '<hr class="chiusa"><p class="chiusa">$1');
  return out;
}

/* ─────────────────────────────────────────────────────────────────────
   2. Impaginazione
   ─────────────────────────────────────────────────────────────────── */

const STILE = `
  @page { size: A4; margin: 22mm 18mm 18mm 18mm; }
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
  /* (v248) l'ultima riga di un documento («Generato il …») non resta sola su una pagina: sta con cio' che la precede */
  p.chiusa, hr.chiusa { break-before: avoid; page-break-before: avoid; }
  /* (v248) nel dossier completo ogni documento comincia a pagina nuova. Prima c'era un separatore DOPO ogni documento:
     se il documento finiva proprio in fondo a una pagina, il separatore ne creava una tutta bianca */
  section.documento + section.documento { break-before: page; page-break-before: always; }
  pre.codice.lungo { break-inside: auto; page-break-inside: auto; orphans: 4; widows: 4; }
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
  /* (v248) IMPAGINAZIONE DELLE TABELLE LUNGHE. Prima una riga non poteva mai spezzarsi fra due pagine: nelle matrici
     (tracciabilita', documentazione dei banchi) una riga alta mezza pagina lasciava l'altra mezza BIANCA, pagina dopo
     pagina. Ora una riga puo' continuare nella pagina seguente (l'intestazione si ripete), ma mai lasciando una o due
     righe di testo isolate in cima o in fondo. */
  tr { break-inside: auto; page-break-inside: auto; }
  td, th { orphans: 3; widows: 3; }
  thead { display: table-header-group; }     /* l'intestazione si ripete a ogni pagina */
  blockquote { margin: .8em 0; padding: .5em .9em; background: #f3f7fb;
               border-left: 2.5pt solid #7fa6c9; break-inside: avoid; }
  blockquote p { margin: .3em 0; }
  blockquote.lungo { break-inside: auto; page-break-inside: auto; }
  ul, ol { margin: .5em 0; padding-left: 1.5em; }
  li { margin: .18em 0; }
  hr { border: none; border-top: .5pt solid #ccd8e4; margin: 1.3em 0; }
  .dettagli { border: .5pt solid #cfdae6; border-radius: 3pt; padding: .6em .8em; margin: .8em 0; }
  .riassunto { font-family: "DejaVu Sans", Helvetica, sans-serif; font-weight: 600;
               margin: 0 0 .4em; color: #0d2438; }
  /* (v248) impaginazione formale */
  body > p, section.documento > p, li { text-align: justify; hyphens: auto; }
  td, th, blockquote p, .frontespizio * { text-align: left; hyphens: manual; }
  h1 { letter-spacing: .1pt; }
  h2 { margin-top: 1.7em; }
  .frontespizio { padding-top: 14mm; break-after: page; page-break-after: always; }
  .frontespizio .fascia { font-family: "DejaVu Sans", Helvetica, sans-serif; font-size: 8pt; letter-spacing: 2.2pt;
      color: #ffffff; background: #0d2438; padding: 3.2mm 5mm; }
  .frontespizio .marchio { font-family: "DejaVu Sans", Helvetica, sans-serif; margin-top: 30mm;
      font-size: 30pt; font-weight: 700; color: #0d2438; letter-spacing: .4pt; }
  .frontespizio .sotto { font-size: 10pt; color: #4a5c6b; margin-top: 2mm; font-style: italic; }
  .frontespizio .riga { width: 100%; height: 1.6pt; background: #0d4f8b; margin: 9mm 0 9mm; }
  .frontespizio .titolo { font-family: "DejaVu Sans", Helvetica, sans-serif;
      font-size: 21pt; font-weight: 700; line-height: 1.22; color: #14202c; }
  .frontespizio .nota { font-size: 10pt; color: #4a5c6b; margin-top: 5mm; line-height: 1.5; max-width: 140mm; }
  .frontespizio table.controllo { margin-top: 26mm; width: 100%; font-size: 9.2pt; border-top: 1.2pt solid #0d2438; border-bottom: 1.2pt solid #0d2438; }
  .frontespizio table.controllo caption { caption-side: top; text-align: left; font-family: "DejaVu Sans", Helvetica, sans-serif;
      font-size: 8pt; letter-spacing: 1.4pt; text-transform: uppercase; color: #0d4f8b; padding: 0 0 2mm; font-weight: 700; }
  .frontespizio table.controllo th, .frontespizio table.controllo td { border: none; border-bottom: .4pt solid #d5dee7; padding: 1.9mm 2mm; background: none; }
  .frontespizio table.controllo th { width: 52mm; color: #4a5c6b; font-weight: 600; font-size: 8.6pt; }
  .frontespizio table.controllo tr:last-child th, .frontespizio table.controllo tr:last-child td { border-bottom: none; }
  .frontespizio .avviso { margin-top: 12mm; font-size: 7.8pt; color: #6b7a88; line-height: 1.5; max-width: 150mm; }
  nav.indice { break-after: page; page-break-after: always; }
  nav.indice .indice-t { font-family: "DejaVu Sans", Helvetica, sans-serif; font-size: 16pt; font-weight: 700; color: #0d2438;
      border-bottom: 2pt solid #0d2438; padding-bottom: .3em; margin-bottom: 1em; }
  nav.indice ol { list-style: none; margin: 0; padding: 0; }
  nav.indice li { margin: 0; padding: 1.3mm 0; border-bottom: .3pt dotted #b9c7d4; text-align: left; font-family: "DejaVu Sans", Helvetica, sans-serif; font-size: 9.6pt; }
  nav.indice li.l3 { padding-left: 7mm; font-size: 8.6pt; color: #4a5c6b; border-bottom: none; padding-top: .6mm; padding-bottom: .6mm; }
  nav.indice a { color: inherit; }
`;

const PIEDE = (titolo) => `
  <div style="font-family:'DejaVu Sans',Helvetica,sans-serif;font-size:7pt;color:#7a8896;
              width:100%;padding:0 16mm;display:flex;justify-content:space-between;">
    <span>${VER} · rev. ${SHA} · ${OGGI}</span>
    <span>Samuele Pio Provenzano</span>
    <span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
  </div>`;

/* (v248) la testata di ogni pagina: il titolo del documento a sinistra, il progetto a destra, e un filo */
const TESTA = (titolo) => `
  <div style="font-family:'DejaVu Sans',Helvetica,sans-serif;font-size:7pt;color:#5d6d7c;width:100%;margin:0 16mm;
              padding:0 0 1.6mm;border-bottom:0.4pt solid #b9c7d4;display:flex;justify-content:space-between;">
    <span>${esc(String(titolo).replace(/^BioSpecInfo\s*[—–:-]\s*/, '').replace(/\s*[—–]\s*BioSpecInfo\s*$/, ''))}</span>
    <span style="letter-spacing:.6pt">BIOSPECINFO</span>
  </div>`;

/* ── (v248) IL FRONTESPIZIO FORMALE ─────────────────────────────────────────
   Richiesta dell'autore: «i documenti in PDF, ma con impaginazioni più formali
   e migliori», per l'azienda, il tirocinio e la tesi. Ogni documento apre con:
   la fascia d'intestazione, il titolo, e il RIQUADRO DI CONTROLLO DEL DOCUMENTO
   (identificativo, versione del software descritta, revisione = commit, data di
   emissione, autore, lingua, stato), come nei documenti tecnici d'impresa. I dati
   sono tutti ricavati dal repository: niente è scritto a mano. */
const ETICHETTE = {
  it: { fascia: 'DOCUMENTAZIONE TECNICA DI PROGETTO', sotto: 'Piattaforma web per la chimica computazionale, la fisica e la matematica',
        controllo: 'Controllo del documento', id: 'Identificativo', titolo: 'Titolo', ver: 'Versione del software', rev: 'Revisione (commit)',
        data: 'Data di emissione', autore: 'Autore', lingua: 'Lingua', linguaV: 'Italiano', stato: 'Stato', statoV: 'Emesso con la versione ',
        avviso: 'Documento generato dal sorgente versionato nel repository del progetto. La versione e la revisione riportate qui e nel piè di ogni pagina identificano esattamente lo stato del software descritto.',
        indice: 'Indice', dossier: 'Dossier completo', raccolta: 'Raccolta integrale dei documenti del progetto, nell\'ordine di numerazione. Ogni documento è disponibile anche come PDF separato.', doc: 'Documento' },
  en: { fascia: 'PROJECT TECHNICAL DOCUMENTATION', sotto: 'Web platform for computational chemistry, physics and mathematics',
        controllo: 'Document control', id: 'Identifier', titolo: 'Title', ver: 'Software version', rev: 'Revision (commit)',
        data: 'Date of issue', autore: 'Author', lingua: 'Language', linguaV: 'English', stato: 'Status', statoV: 'Issued with version ',
        avviso: 'Document generated from the versioned source in the project repository. The version and revision shown here and in the footer of every page identify exactly the state of the software described.',
        indice: 'Contents', dossier: 'Full dossier', raccolta: 'Complete collection of the project documents, in numbering order. Each document is also available as a separate PDF.', doc: 'Document' }
};
function codiceDi(file, lang){
  const m = String(file || '').match(/^(\d\d)-/);
  if (m) return 'BSI-DOC-' + m[1] + (lang === 'en' ? '-EN' : '-IT');
  if (/Dossier/i.test(file || '')) return 'BSI-DOS-' + (lang === 'en' ? 'EN' : 'IT');
  return 'BSI-GUIDA-' + String(file || 'X').replace(/\.md$/, '').replace(/^Guida-/, '').replace(/[^A-Za-z0-9]+/g, '-').toUpperCase().slice(0, 24);
}
function frontespizio(titolo, opz){
  opz = opz || {}; const lang = opz.lang === 'en' ? 'en' : 'it', E = ETICHETTE[lang];
  const pulito = String(titolo).replace(/^BioSpecInfo\s*[—–:-]\s*/, '').replace(/\s*[—–]\s*BioSpecInfo\s*$/, '');
  const riga = function(k, v){ return '<tr><th>' + k + '</th><td>' + v + '</td></tr>'; };
  return '<div class="frontespizio">' +
    '<div class="fascia">' + E.fascia + '</div>' +
    '<div class="marchio">BioSpecInfo</div>' +
    '<div class="sotto">' + E.sotto + '</div>' +
    '<div class="riga"></div>' +
    '<div class="titolo">' + esc(pulito) + '</div>' +
    (opz.nota ? '<div class="nota">' + esc(opz.nota) + '</div>' : '') +
    '<table class="controllo"><caption>' + E.controllo + '</caption><tbody>' +
      riga(E.id, '<code>' + esc(codiceDi(opz.file, lang)) + '</code>') +
      riga(E.titolo, esc(pulito)) +
      riga(E.ver, '<strong>' + VER + '</strong>') +
      riga(E.rev, '<code>' + SHA + '</code>') +
      riga(E.data, OGGI) +
      riga(E.autore, 'Samuele Pio Provenzano') +
      riga(E.lingua, E.linguaV) +
      riga(E.stato, E.statoV + VER) +
    '</tbody></table>' +
    '<div class="avviso">' + E.avviso + '</div>' +
  '</div>';
}
/* l'indice di un documento: i suoi capitoli (h2) e paragrafi (h3), con il collegamento. Solo se ne ha almeno quattro. */
function indiceDi(html, lang){
  const voci = []; const re = /<h([23]) id="(s\d+)">([\s\S]*?)<\/h\1>/g; let m;
  while ((m = re.exec(html))) voci.push({ liv: +m[1], id: m[2], t: m[3].replace(/<[^>]+>/g, '') });
  if (voci.filter(function(v){ return v.liv === 2; }).length < 4) return '';
  let o = '<nav class="indice"><div class="indice-t">' + ETICHETTE[lang === 'en' ? 'en' : 'it'].indice + '</div><ol>';
  /* i paragrafi (h3) entrano nell'indice solo se il tutto resta in una pagina */
  const tutti = voci.length <= 34;
  voci.forEach(function(v){ if (v.liv === 3 && !tutti) return; o += '<li class="l' + v.liv + '"><a href="#' + v.id + '">' + v.t + '</a></li>'; });
  return o + '</ol></nav>';
}
/* un documento intero: frontespizio, indice, corpo */
function documento(titolo, corpo, opz){ return frontespizio(titolo, opz) + indiceDi(corpo, opz && opz.lang) + corpo; }

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
function indiceGenerale(voci, lang){
  const E = ETICHETTE[lang === 'en' ? 'en' : 'it'];
  let m = frontespizio(E.dossier, { file: 'Dossier', lang: lang, nota: E.raccolta });
  m += '<h1>' + E.indice + '</h1><table><thead><tr><th style="width:12mm">#</th><th>' + E.doc + '</th></tr></thead><tbody>';
  voci.forEach(function(v, i){
    m += '<tr><td>' + (i + 1) + '</td><td>' + esc(v) + '</td></tr>';
  });
  m += '</tbody></table>';
  return '<section class="documento">' + m + '</section>';
}

async function stampa(pagina, dest, html, titolo){
  await pagina.setContent(html, { waitUntil: 'load' });
  await pagina.pdf({
    path: dest, format: 'A4', printBackground: true,
    displayHeaderFooter: true, headerTemplate: TESTA(titolo), footerTemplate: PIEDE(titolo),
    margin: { top: '22mm', bottom: '18mm', left: '0', right: '0' }
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
                           pagina_html('it', titolo, documento(titolo, corpo, { file: f, lang: 'it' })), titolo);
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
                           pagina_html('it', titolo, documento(titolo, mdToHtml(md), { file: f, lang: 'it' })), titolo);
    prodotti.push([nome, d]); byte += d;
    console.log('  ✓ ' + nome.padEnd(44) + (d / 1024).toFixed(0).padStart(5) + ' kB');
  }

  /* ── dossier completo italiano ── */
  if (!filtro.length && corpiIt.length) {
    const sep = '<div style="break-after:page;page-break-after:always"></div>';
    const nome = 'BioSpecInfo-Dossier-Completo.it.pdf';
    const d = await stampa(pagina, path.join(USCITA, nome),
      pagina_html('it', 'Dossier completo',
                  indiceGenerale(titoliIt, 'it') + corpiIt.map(function(c){ return '<section class="documento">' + c + '</section>'; }).join('')), 'Dossier completo');
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
                             pagina_html('en', titolo, documento(titolo, corpo, { file: f, lang: 'en' })), titolo);
      prodotti.push([nome, d]); byte += d;
      console.log('  ✓ ' + nome.padEnd(44) + (d / 1024).toFixed(0).padStart(5) + ' kB');
    }
    if (corpiEn.length) {
      const sep = '<div style="break-after:page;page-break-after:always"></div>';
      const nome = 'BioSpecInfo-Full-Dossier.en.pdf';
      const d = await stampa(pagina, path.join(USCITA, nome),
        pagina_html('en', 'Full dossier',
                    indiceGenerale(titoliEn, 'en') + corpiEn.map(function(c){ return '<section class="documento">' + c + '</section>'; }).join('')), 'Full dossier');
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
