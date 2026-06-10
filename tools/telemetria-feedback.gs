/**
 * BioSpecInfo — Telemetria accessi/errori/allerte + Questionario & Feedback
 * ============================================================================
 * Riceve i dati inviati da window._bsiTelemetry(...) (vedi index.html, blocco
 * "BioSpecInfo v21") e li registra in fogli separati di un Google Sheet.
 *
 * SETUP (5 minuti, una tantum):
 *  1. Crea un nuovo foglio su https://sheets.google.com (es. "BioSpecInfo - Log").
 *  2. Nel foglio: menu Estensioni → Apps Script.
 *  3. Cancella il contenuto di Code.gs e incolla l'intero contenuto di questo file.
 *  4. Salva (icona dischetto). Nella barra in alto seleziona la funzione "setup"
 *     ed eseguila una volta (autorizza l'accesso quando richiesto): crea i
 *     fogli "Accessi", "Feedback", "Allerte", "Errori" con le intestazioni.
 *  5. Distribuisci → Nuova distribuzione → tipo "App web":
 *       - Esegui come: Me
 *       - Chi ha accesso: Chiunque
 *     Clicca "Distribuisci" e copia l'URL dell'app web (termina con /exec).
 *  6. In index.html (vicino alla riga con window.BSI_EDITION), incolla l'URL:
 *       window.BSI_TELEMETRY_URL='https://script.google.com/macros/s/.../exec';
 *
 * Da quel momento ogni accesso, errore JS, allerta (es. licenza PRO modificata,
 * DevTools aperti) e ogni feedback inviato dal "Questionario & Feedback"
 * verranno registrati automaticamente in righe separate per tipo nel foglio.
 */

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var type = data.type || 'altro';
    var sheetName = {
      accesso: 'Accessi',
      feedback: 'Feedback',
      allerta: 'Allerte',
      errore: 'Errori'
    }[type] || 'Altro';

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(headersFor(type));
      sheet.setFrozenRows(1);
    }
    sheet.appendRow(rowFor(type, data));
  } catch (err) {
    // Payload malformato: ignora silenziosamente per non rompere il client.
  }
  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function headersFor(type) {
  switch (type) {
    case 'accesso':  return ['Data/ora', 'Dispositivo', 'Edizione', 'Versione app', 'Lingua', 'Schermo', 'Referrer', 'User Agent'];
    case 'feedback': return ['Data/ora', 'Dispositivo', 'Edizione', 'Voto (1-5)', 'Categoria', 'Messaggio', 'Email'];
    case 'allerta':  return ['Data/ora', 'Dispositivo', 'Edizione', 'Tipo', 'Dettagli'];
    case 'errore':   return ['Data/ora', 'Dispositivo', 'Edizione', 'Messaggio', 'Sorgente', 'Riga', 'Stack'];
    default:         return ['Data/ora', 'Dati JSON'];
  }
}

function rowFor(type, d) {
  var ts = d.ts || new Date().toISOString();
  switch (type) {
    case 'accesso':  return [ts, d.device || '', d.edition || '', d.appVersion || '', d.lang || '', d.screen || '', d.referrer || '', d.ua || ''];
    case 'feedback': return [ts, d.device || '', d.edition || '', d.voto || '', d.categoria || '', d.messaggio || '', d.email || ''];
    case 'allerta':  return [ts, d.device || '', d.edition || '', d.tipo || '', d.dettagli || ''];
    case 'errore':   return [ts, d.device || '', d.edition || '', d.messaggio || '', d.sorgente || '', d.riga || '', d.stack || ''];
    default:         return [ts, JSON.stringify(d)];
  }
}

/** Esegui questa funzione UNA VOLTA dall'editor Apps Script per creare i fogli. */
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var typeBySheet = { Accessi: 'accesso', Feedback: 'feedback', Allerte: 'allerta', Errori: 'errore' };
  Object.keys(typeBySheet).forEach(function (name) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.appendRow(headersFor(typeBySheet[name]));
      sheet.setFrozenRows(1);
    }
  });
}
