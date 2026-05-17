// File Manager module - IndexedDB for large file storage
'use strict';

const DB_NAME = 'BioSpecInfoFiles_v11';
const STORE = 'files';
let db = null;

function openDB() {
  return new Promise((res, rej) => {
    if(db) { res(db); return; }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const idb = e.target.result;
      if(!idb.objectStoreNames.contains(STORE)) {
        idb.createObjectStore(STORE, {keyPath: 'id'});
      }
    };
    req.onsuccess = (e) => { db = e.target.result; res(db); };
    req.onerror = () => rej(new Error('IndexedDB failed'));
  });
}

async function tx(mode) {
  const idb = await openDB();
  return idb.transaction(STORE, mode).objectStore(STORE);
}

async function saveFile(name, cat, buf, mime) {
  const store = await tx('readwrite');
  const id = Date.now() + '_' + Math.random().toString(36).slice(2);
  return new Promise((res, rej) => {
    const req = store.put({
      id, name, cat, mime,
      data: buf,
      size: buf.byteLength,
      date: new Date().toISOString()
    });
    req.onsuccess = () => res(id);
    req.onerror = () => rej(req.error);
  });
}

async function getAllFiles() {
  const store = await tx('readonly');
  return new Promise((res, rej) => {
    const req = store.getAll();
    req.onsuccess = () => res(req.result || []);
    req.onerror = () => rej(req.error);
  });
}

async function getFile(id) {
  const store = await tx('readonly');
  return new Promise((res, rej) => {
    const req = store.get(id);
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
}

async function deleteFile(id) {
  const store = await tx('readwrite');
  return new Promise((res, rej) => {
    const req = store.delete(id);
    req.onsuccess = () => res();
    req.onerror = () => rej(req.error);
  });
}

export default {
  async render(container) {
    container.innerHTML = `
      <div class="section-title">📁 File Manager — I tuoi appunti</div>

      <div class="panel">
        <div class="ph">📤 Carica file</div>
        <div class="pb">
          <label class="btn btn-primary" style="width:100%;cursor:pointer;padding:14px">
            <strong>📤 Seleziona file (PDF, immagini, Word...)</strong>
            <input type="file" id="fm-input" multiple accept=".pdf,.png,.jpg,.jpeg,.txt,.docx,.xlsx,.pptx" style="display:none">
          </label>
          <div style="margin-top:10px">
            <label style="font-size:.85rem;color:var(--text2);font-weight:700">Categoria:</label>
            <select id="fm-cat" style="margin-top:4px">
              <option>Appunti</option>
              <option>Libri di Testo</option>
              <option>Esercizi</option>
              <option>Dispense</option>
              <option>Esami</option>
              <option>Altro</option>
            </select>
          </div>
          <div id="fm-progress" style="margin-top:8px;color:var(--g700);font-weight:600;min-height:20px"></div>
        </div>
      </div>

      <div id="fm-list"></div>
    `;

    const fileInput = document.getElementById('fm-input');
    const catSel = document.getElementById('fm-cat');
    const progress = document.getElementById('fm-progress');
    const list = document.getElementById('fm-list');

    fileInput.onchange = async () => {
      const files = Array.from(fileInput.files);
      if(!files.length) return;
      const cat = catSel.value;
      let done = 0;
      progress.textContent = `⏳ Caricamento di ${files.length} file...`;

      for(const file of files) {
        try {
          const buf = await file.arrayBuffer();
          await saveFile(file.name, cat, buf, file.type);
          done++;
          progress.textContent = `⏳ ${done}/${files.length} caricati...`;
        } catch(e) {
          console.error('Errore upload:', e);
        }
      }

      progress.textContent = `✅ ${done} file salvati!`;
      fileInput.value = '';
      setTimeout(() => { progress.textContent = ''; renderList(); }, 2000);
    };

    async function renderList() {
      list.innerHTML = '<div class="loading">⏳ Caricamento...</div>';

      try {
        const files = await getAllFiles();

        if(!files.length) {
          list.innerHTML = `
            <div class="empty-state">
              <span class="icon">📂</span>
              <h3>Nessun file caricato</h3>
              <p>Usa il pulsante sopra per caricare i tuoi appunti, libri, dispense.<br>I file restano nel tuo dispositivo (anche offline) e nessuno può accedervi.</p>
            </div>`;
          return;
        }

        // Total size
        const totalSize = files.reduce((s,f) => s + f.size, 0);
        const totalMB = Math.round(totalSize / 1048576 * 10) / 10;

        // Group by category
        const byCat = {};
        files.forEach(f => {
          if(!byCat[f.cat]) byCat[f.cat] = [];
          byCat[f.cat].push(f);
        });

        let html = `
          <div style="background:var(--g100);padding:10px 14px;border-radius:10px;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
            <strong style="color:var(--g900)">📊 ${files.length} file · ${totalMB} MB</strong>
          </div>
        `;

        for(const [cat, items] of Object.entries(byCat)) {
          html += `<div class="panel"><div class="ph">📂 ${cat} (${items.length})</div><div class="pb" style="padding:8px">`;
          for(const f of items) {
            const ext = f.name.split('.').pop().toLowerCase();
            const icon = ext === 'pdf' ? '📄' : ['png','jpg','jpeg'].includes(ext) ? '🖼️' : ext === 'docx' ? '📝' : '📎';
            const size = f.size > 1048576 ? Math.round(f.size/104857.6)/10 + 'MB' : Math.round(f.size/1024) + 'KB';
            html += `
              <div style="display:flex;align-items:center;gap:10px;padding:10px 6px;border-bottom:1px solid var(--g100)">
                <span style="font-size:1.5rem">${icon}</span>
                <div style="flex:1;min-width:0">
                  <div style="font-weight:700;color:var(--g900);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${f.name}</div>
                  <div style="font-size:.75rem;color:var(--text2)">${size} · ${new Date(f.date).toLocaleDateString('it-IT')}</div>
                </div>
                <div style="display:flex;gap:4px;flex-shrink:0">
                  ${ext === 'pdf' ? `<button class="btn" data-open="${f.id}" style="padding:6px 10px;min-height:auto" aria-label="Apri">👁️</button>` : ''}
                  <button class="btn btn-primary" data-download="${f.id}" style="padding:6px 10px;min-height:auto" aria-label="Scarica">⬇️</button>
                  <button class="btn btn-danger" data-delete="${f.id}" style="padding:6px 10px;min-height:auto" aria-label="Elimina">🗑️</button>
                </div>
              </div>`;
          }
          html += '</div></div>';
        }

        list.innerHTML = html;

        // Bind buttons
        list.querySelectorAll('[data-open]').forEach(btn => {
          btn.onclick = async () => {
            const f = await getFile(btn.dataset.open);
            if(f) {
              const blob = new Blob([f.data], {type: f.mime || 'application/pdf'});
              window.open(URL.createObjectURL(blob), '_blank');
            }
          };
        });

        list.querySelectorAll('[data-download]').forEach(btn => {
          btn.onclick = async () => {
            const f = await getFile(btn.dataset.download);
            if(f) {
              const blob = new Blob([f.data], {type: f.mime || 'application/octet-stream'});
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = f.name;
              a.click();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
            }
          };
        });

        list.querySelectorAll('[data-delete]').forEach(btn => {
          btn.onclick = async () => {
            if(confirm('Eliminare questo file?')) {
              await deleteFile(btn.dataset.delete);
              renderList();
              if(window.App) window.App.toast('File eliminato');
            }
          };
        });
      } catch(e) {
        list.innerHTML = `<div class="error-state"><h3>Errore IndexedDB</h3><p>${e.message}</p></div>`;
      }
    }

    renderList();
  }
};
