// Pharma module — 143 farmaci con schede
'use strict';

let DRUGS = null;

export default {
  async render(container) {
    container.innerHTML = `
      <div class="section-title">💊 Farmaci</div>
      <div class="loading">⏳ Caricamento dati...</div>
    `;

    if(!DRUGS) {
      try {
        const r = await fetch('./assets/data/farmaci.json');
        DRUGS = await r.json();
      } catch(e) {
        container.innerHTML = `<div class="error-state"><h3>Errore caricamento farmaci</h3><p>${e.message}</p></div>`;
        return;
      }
    }

    container.innerHTML = `
      <div class="section-title">💊 Farmaci — ${DRUGS.length} schede cliniche</div>

      <div class="panel">
        <div class="pb">
          <div class="search-bar">
            <input type="search" id="farm-search" placeholder="Cerca farmaco, categoria, indicazione...">
            <button class="btn btn-primary" id="farm-clear">×</button>
          </div>
          <div id="farm-categories" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px"></div>
        </div>
      </div>

      <div id="farm-count" style="margin:10px 0;color:var(--text2);font-size:.88rem"></div>
      <div id="farm-list"></div>
    `;

    const input = document.getElementById('farm-search');
    const list = document.getElementById('farm-list');
    const count = document.getElementById('farm-count');
    const cats = document.getElementById('farm-categories');

    // Unique categories
    const categories = [...new Set(DRUGS.map(d => d.cat))].sort();
    let activeCategory = null;

    cats.innerHTML = '<button class="pill" data-cat="">Tutti</button>' +
      categories.map(c => `<button class="pill" data-cat="${c}">${c}</button>`).join('');

    cats.onclick = (e) => {
      const btn = e.target.closest('[data-cat]');
      if(!btn) return;
      activeCategory = btn.dataset.cat || null;
      cats.querySelectorAll('.pill').forEach(p => {
        p.style.background = p.dataset.cat === (activeCategory || '') ? 'var(--g900)' : '';
        p.style.color = p.dataset.cat === (activeCategory || '') ? '#fff' : '';
      });
      render();
    };

    const render = () => {
      const q = input.value.toLowerCase().trim();
      let filtered = DRUGS;
      if(activeCategory) filtered = filtered.filter(d => d.cat === activeCategory);
      if(q) filtered = filtered.filter(d =>
        d.n.toLowerCase().includes(q) ||
        d.cat.toLowerCase().includes(q) ||
        d.uso.toLowerCase().includes(q) ||
        d.f.toLowerCase().includes(q)
      );

      count.textContent = `${filtered.length} farmaci trovati`;

      if(!filtered.length) {
        list.innerHTML = '<div class="empty-state"><h3>Nessun risultato</h3></div>';
        return;
      }

      list.innerHTML = filtered.map((d, i) => `
        <details class="panel" ${i < 3 ? 'open' : ''}>
          <summary style="cursor:pointer;padding:14px 16px;font-weight:800;color:var(--g900);background:linear-gradient(135deg,var(--g100),var(--g50));list-style:none">
            <span style="display:flex;align-items:center;justify-content:space-between;gap:10px">
              <span>💊 ${d.n}</span>
              <span class="badge">${d.cat}</span>
            </span>
          </summary>
          <div class="pb">
            <table>
              <tbody>
                <tr><th>Formula</th><td><code>${d.f}</code></td></tr>
                <tr><th>Meccanismo</th><td>${d.mech}</td></tr>
                <tr><th>Uso clinico</th><td>${d.uso}</td></tr>
                <tr><th>Dose</th><td>${d.dose}</td></tr>
                <tr><th>Effetti avversi</th><td>${d.ae}</td></tr>
              </tbody>
            </table>
            ${d.cid ? `
              <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">
                <a class="btn" href="https://pubchem.ncbi.nlm.nih.gov/compound/${d.cid}" target="_blank" rel="noopener">🔗 PubChem CID ${d.cid}</a>
                <button class="btn" onclick="location.hash='molecules';setTimeout(()=>{var i=document.getElementById('mol-search');if(i){i.value='${d.n}';document.getElementById('mol-search-btn').click();}},500)">🔬 Cerca 3D</button>
              </div>
            ` : ''}
          </div>
        </details>
      `).join('');
    };

    input.oninput = render;
    document.getElementById('farm-clear').onclick = () => { input.value = ''; render(); };

    render();
  }
};
