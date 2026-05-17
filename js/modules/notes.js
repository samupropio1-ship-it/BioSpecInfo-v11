// Notes module - personal notes via localStorage
'use strict';

const STORAGE_KEY = 'bsi_v11_notes';

export default {
  async render(container) {
    container.innerHTML = `
      <div class="section-title">📝 Note Personali</div>

      <div class="panel">
        <div class="ph">Nuova nota</div>
        <div class="pb">
          <input type="text" id="note-title" placeholder="Titolo (es. Ciclo di Krebs)" style="margin-bottom:8px">
          <textarea id="note-body" rows="5" placeholder="Scrivi qui i tuoi appunti..." style="width:100%;padding:10px;border:1px solid var(--g200);border-radius:8px;font-family:inherit;font-size:.92rem"></textarea>
          <div style="margin-top:8px;display:flex;gap:8px">
            <select id="note-cat" style="width:auto;flex:0 0 auto">
              <option>Chimica Generale</option>
              <option>Chimica Organica</option>
              <option>Chimica Fisica</option>
              <option>Analitica</option>
              <option>Biochimica</option>
              <option>Spettroscopia</option>
              <option>Farmacologia</option>
              <option>Altro</option>
            </select>
            <button class="btn btn-primary" id="note-save">💾 Salva</button>
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="pb">
          <input type="search" id="note-search" placeholder="Cerca note..." style="margin-bottom:6px">
          <select id="note-filter" style="width:auto">
            <option value="">Tutte le categorie</option>
            <option>Chimica Generale</option>
            <option>Chimica Organica</option>
            <option>Chimica Fisica</option>
            <option>Analitica</option>
            <option>Biochimica</option>
            <option>Spettroscopia</option>
            <option>Farmacologia</option>
            <option>Altro</option>
          </select>
        </div>
      </div>

      <div id="note-count" style="margin:10px 0;color:var(--text2)"></div>
      <div id="notes-list"></div>

      <div class="panel" style="margin-top:14px">
        <div class="ph">📥 Import/Export</div>
        <div class="pb" style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn" id="export-notes">📤 Esporta tutte (JSON)</button>
          <label class="btn" style="cursor:pointer">
            📥 Importa
            <input type="file" id="import-notes" accept=".json" style="display:none">
          </label>
        </div>
      </div>
    `;

    let notes = [];
    try { notes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch(e) {}

    const titleInp = document.getElementById('note-title');
    const bodyInp = document.getElementById('note-body');
    const catInp = document.getElementById('note-cat');
    const search = document.getElementById('note-search');
    const filter = document.getElementById('note-filter');
    const list = document.getElementById('notes-list');
    const count = document.getElementById('note-count');

    function save() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    }

    function render() {
      const q = search.value.toLowerCase().trim();
      const cat = filter.value;
      let filtered = notes;
      if(cat) filtered = filtered.filter(n => n.cat === cat);
      if(q) filtered = filtered.filter(n => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q));

      count.textContent = `${filtered.length} note ${notes.length !== filtered.length ? `(su ${notes.length} totali)` : ''}`;

      if(!filtered.length) {
        list.innerHTML = '<div class="empty-state"><span class="icon">📝</span><h3>Nessuna nota</h3><p>Aggiungi la tua prima nota usando il modulo sopra.</p></div>';
        return;
      }

      list.innerHTML = filtered.sort((a,b)=>b.date-a.date).map(n => `
        <div class="panel">
          <div class="ph" style="display:flex;justify-content:space-between;align-items:center;gap:10px">
            <span>${n.title || '(senza titolo)'}</span>
            <span style="display:flex;gap:6px">
              <span class="badge">${n.cat}</span>
              <button class="btn btn-danger" data-del="${n.id}" style="padding:4px 10px;min-height:auto" aria-label="Elimina">🗑️</button>
            </span>
          </div>
          <div class="pb" style="white-space:pre-wrap">${n.body}</div>
          <div style="padding:6px 14px;color:var(--text3);font-size:.75rem;border-top:1px solid var(--g100)">
            ${new Date(n.date).toLocaleString('it-IT')}
          </div>
        </div>
      `).join('');

      list.querySelectorAll('[data-del]').forEach(btn => {
        btn.onclick = () => {
          if(confirm('Eliminare questa nota?')) {
            notes = notes.filter(x => x.id !== btn.dataset.del);
            save();
            render();
          }
        };
      });
    }

    document.getElementById('note-save').onclick = () => {
      const title = titleInp.value.trim();
      const body = bodyInp.value.trim();
      if(!title && !body) {
        if(window.App) window.App.toast('Inserisci almeno titolo o testo');
        return;
      }
      notes.push({
        id: Date.now() + '_' + Math.random().toString(36).slice(2),
        title, body,
        cat: catInp.value,
        date: Date.now()
      });
      save();
      titleInp.value = '';
      bodyInp.value = '';
      if(window.App) window.App.toast('✅ Nota salvata');
      render();
    };

    search.oninput = render;
    filter.onchange = render;

    document.getElementById('export-notes').onclick = () => {
      const blob = new Blob([JSON.stringify(notes, null, 2)], {type:'application/json'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `biospec-notes-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    document.getElementById('import-notes').onchange = (e) => {
      const file = e.target.files[0];
      if(!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const imported = JSON.parse(reader.result);
          if(Array.isArray(imported)) {
            notes = [...notes, ...imported];
            save();
            render();
            if(window.App) window.App.toast(`✅ ${imported.length} note importate`);
          }
        } catch(err) {
          alert('Errore importazione: ' + err.message);
        }
      };
      reader.readAsText(file);
    };

    render();
  }
};
