/* Il File Manager davanti a un archivio che non c'e'.
   Tre scenari veri: (1) si clicca prima che IndexedDB abbia finito di aprirsi,
   (2) IndexedDB non si apre MAI (Safari privato / dati bloccati),
   (3) l'archivio si apre ma le scritture falliscono per spazio esaurito. */
const { chromium } = require('playwright-core');
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const PW = 'SamuEle25';

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  let ok = 0, ko = 0;
  const att = (d, a, v) => {
    if (String(a) === String(v)) { ok++; console.log('  ✓ ' + d + '  → ' + v); }
    else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + a + '\n      avuto:  ' + v); }
  };

  async function apri(seed) {
    const ctx = await b.newContext({ serviceWorkers: 'block' });
    const pg = await ctx.newPage();
    const err = [];
    pg.on('pageerror', e => err.push(e.message));
    pg.on('console', m => {
      if (m.type() === 'error' && !/Failed to load resource|favicon/.test(m.text()))
        err.push('console: ' + m.text());
    });
    if (seed) await pg.addInitScript(seed);
    await pg.goto('http://127.0.0.1:8899/file_manager.html', { waitUntil: 'load', timeout: 60000 });
    await pg.waitForTimeout(600);
    return { pg, ctx, err };
  }
  const entra = async pg => {
    await pg.evaluate(p => {
      const i = document.getElementById('pw-input');
      if (i) { i.value = p; }
      const f = document.getElementById('login-form');
      if (f) f.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      else { const b = document.querySelector('#login-screen button'); if (b) b.click(); }
    }, PW);
    await pg.waitForTimeout(400);
  };

  // ── 1. clic immediato, prima che il database sia pronto ──
  console.log('\n1) Si clicca PRIMA che l\'archivio sia aperto');
  {
    const a = await apri();
    await entra(a.pg);
    // nessuna attesa: si va addosso alle funzioni mentre initDB e' in volo
    const eccez = await a.pg.evaluate(async () => {
      const fuori = [];
      for (const f of ['renderPhotos', 'renderSections', 'updateStats', 'renderDocs', 'loadNote']) {
        try { if (window[f]) await window[f](); } catch (e) { fuori.push(f + ': ' + e.message); }
      }
      return fuori;
    });
    att('nessuna funzione esplode sul database non ancora aperto', 0, eccez.length);
    eccez.forEach(e => console.log('     ! ' + e));
    await a.pg.waitForTimeout(1200);
    att('nessun errore JS', 0, a.err.length);
    a.err.slice(0, 4).forEach(e => console.log('     ! ' + e.slice(0, 160)));
    await a.ctx.close();
  }

  // ── 2. IndexedDB inesistente: come Safari in navigazione privata ──
  console.log('\n2) IndexedDB non disponibile (navigazione privata)');
  {
    const a = await apri(() => {
      // open() lancia: e' il comportamento di Safari coi dati dei siti bloccati
      try {
        Object.defineProperty(window, 'indexedDB', {
          configurable: true,
          get() { return { open() { throw new Error('accesso negato'); } }; }
        });
      } catch (e) {}
    });
    await entra(a.pg);
    await a.pg.waitForTimeout(1500);
    const stato = await a.pg.evaluate(async () => {
      const out = { eccez: [] };
      for (const f of ['renderPhotos', 'renderSections', 'updateStats', 'renderDocs', 'loadNote']) {
        try { if (window[f]) await window[f](); } catch (e) { out.eccez.push(f + ': ' + e.message); }
      }
      const av = document.getElementById('db-guasto');
      out.avviso = !!av;
      out.testoAvviso = av ? av.textContent.slice(0, 80) : '';
      // e salvare una nota deve dire chiaramente che NON e' stata salvata
      const na = document.getElementById('notes-area');
      if (na) na.value = 'prova';
      try { if (window.saveNote) await window.saveNote(); } catch (e) { out.eccez.push('saveNote: ' + e.message); }
      const t = document.getElementById('toast');
      out.toast = t ? t.textContent : '';
      return out;
    });
    att('nessuna funzione esplode', 0, stato.eccez.length);
    stato.eccez.forEach(e => console.log('     ! ' + e));
    att('compare l\'avviso che nulla verra\' conservato', true, stato.avviso);
    console.log('    · avviso: ' + stato.testoAvviso);
    att('salvare una nota NON dice "salvata"', false, /✅|salvata!/.test(stato.toast));
    att('e dice invece che non e\' stata salvata', true, /NON salvata/.test(stato.toast));
    console.log('    · messaggio: ' + stato.toast);
    att('nessun errore JS', 0, a.err.length);
    a.err.slice(0, 4).forEach(e => console.log('     ! ' + e.slice(0, 160)));
    await a.ctx.close();
  }

  // ── 3. archivio aperto ma scritture rifiutate (spazio esaurito) ──
  console.log('\n3) Spazio esaurito: le scritture vengono rifiutate');
  {
    const a = await apri();
    await entra(a.pg);
    await a.pg.waitForTimeout(1500);
    const stato = await a.pg.evaluate(async () => {
      // si intercetta add/put a valle: la transazione parte, la richiesta no
      const proto = IDBObjectStore.prototype;
      const boom = () => { const e = new Error('spazio'); e.name = 'QuotaExceededError'; throw e; };
      proto.add = boom; proto.put = boom;
      const out = { eccez: [] };
      const na = document.getElementById('notes-area');
      if (na) na.value = 'testo che non entrera\' mai';
      try { await window.saveNote(); } catch (e) { out.eccez.push('saveNote: ' + e.message); }
      const t = document.getElementById('toast');
      out.toast = t ? t.textContent : '';
      // e la barra di avanzamento delle foto non deve restare accesa
      const finto = new File([new Uint8Array([137, 80, 78, 71])], 'a.png', { type: 'image/png' });
      try { await window.uploadPhotos([finto]); } catch (e) { out.eccez.push('uploadPhotos: ' + e.message); }
      const prog = document.getElementById('photo-prog');
      out.barra = prog ? getComputedStyle(prog).display : 'assente';
      return out;
    });
    att('nessuna eccezione sfugge', 0, stato.eccez.length);
    stato.eccez.forEach(e => console.log('     ! ' + e));
    att('dice che la nota non e\' stata salvata', true, /NON salvata|spazio esaurito/.test(stato.toast));
    console.log('    · messaggio: ' + stato.toast);
    att('la barra di avanzamento NON resta bloccata accesa', 'none', stato.barra);
    att('nessun errore JS', 0, a.err.length);
    a.err.slice(0, 4).forEach(e => console.log('     ! ' + e.slice(0, 160)));
    await a.ctx.close();
  }

  // ── 4. il percorso normale continua a funzionare ──
  console.log('\n4) Il caso normale non e\' stato rotto dalle protezioni');
  {
    const a = await apri();
    await entra(a.pg);
    await a.pg.waitForTimeout(1500);
    const stato = await a.pg.evaluate(async () => {
      const na = document.getElementById('notes-area');
      na.value = 'nota vera';
      await window.saveNote();
      const t = document.getElementById('toast').textContent;
      // riletta dall'archivio, non dal campo
      const note = await window.dbGetAll('notes');
      const n = note.find(x => x.key === 'main');
      return { toast: t, salvata: n ? n.text : '(niente)', avviso: !!document.getElementById('db-guasto') };
    });
    att('conferma il salvataggio', true, /✅.*salvata/.test(stato.toast));
    att('e la nota c\'e\' davvero nell\'archivio', 'nota vera', stato.salvata);
    att('nessun avviso di guasto quando tutto va bene', false, stato.avviso);
    att('nessun errore JS', 0, a.err.length);
    a.err.slice(0, 4).forEach(e => console.log('     ! ' + e.slice(0, 160)));
    await a.ctx.close();
  }

  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' passati');
  process.exit(ko ? 1 : 0);
})();
