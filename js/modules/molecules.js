// Molecules module — PubChem search with 3D viewer
'use strict';

const PUBCHEM = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug';

export default {
  async render(container) {
    container.innerHTML = `
      <div class="section-title">🔬 Ricerca Molecole — PubChem</div>

      <div class="panel">
        <div class="ph">Cerca per nome, formula o CID</div>
        <div class="pb">
          <div class="search-bar">
            <input type="search" id="mol-search" placeholder="es. aspirina, paracetamolo, C9H8O4, CID 2244" autofocus>
            <button class="btn btn-primary" id="mol-search-btn">Cerca</button>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px">
            <button class="pill" onclick="document.getElementById('mol-search').value='aspirina';document.getElementById('mol-search-btn').click()">aspirina</button>
            <button class="pill" onclick="document.getElementById('mol-search').value='paracetamolo';document.getElementById('mol-search-btn').click()">paracetamolo</button>
            <button class="pill" onclick="document.getElementById('mol-search').value='ibuprofene';document.getElementById('mol-search-btn').click()">ibuprofene</button>
            <button class="pill" onclick="document.getElementById('mol-search').value='caffeina';document.getElementById('mol-search-btn').click()">caffeina</button>
            <button class="pill" onclick="document.getElementById('mol-search').value='glucosio';document.getElementById('mol-search-btn').click()">glucosio</button>
          </div>
        </div>
      </div>

      <div id="mol-result"></div>
    `;

    const input = document.getElementById('mol-search');
    const btn = document.getElementById('mol-search-btn');
    const out = document.getElementById('mol-result');

    btn.onclick = () => this.search(input.value.trim(), out);
    input.onkeydown = (e) => { if(e.key === 'Enter') btn.click(); };
  },

  async search(query, out) {
    if(!query) return;
    out.innerHTML = '<div class="loading">⏳ Ricerca su PubChem...</div>';

    try {
      // Get CID
      let cid;
      if(/^\d+$/.test(query) || /^cid\s*\d+/i.test(query)) {
        cid = query.replace(/[^\d]/g, '');
      } else if(/^[A-Z0-9]+$/i.test(query) && /\d/.test(query)) {
        // Likely formula
        const r = await fetch(`${PUBCHEM}/compound/formula/${encodeURIComponent(query)}/cids/JSON`);
        const d = await r.json();
        cid = d.IdentifierList?.CID?.[0];
      } else {
        // Name search
        const r = await fetch(`${PUBCHEM}/compound/name/${encodeURIComponent(query)}/cids/JSON`);
        const d = await r.json();
        cid = d.IdentifierList?.CID?.[0];
      }

      if(!cid) {
        out.innerHTML = `<div class="empty-state"><span class="icon">❌</span><h3>Nessun risultato</h3><p>"${query}" non trovato su PubChem</p></div>`;
        return;
      }

      // Get properties
      const props = 'MolecularFormula,MolecularWeight,IUPACName,CanonicalSMILES,XLogP,TPSA,HBondDonorCount,HBondAcceptorCount,RotatableBondCount,ExactMass,Charge,InChI,InChIKey';
      const r2 = await fetch(`${PUBCHEM}/compound/cid/${cid}/property/${props}/JSON`);
      const d2 = await r2.json();
      const p = d2.PropertyTable?.Properties?.[0];

      if(!p) throw new Error('Proprietà non disponibili');

      // Get synonyms
      let synonyms = [];
      try {
        const r3 = await fetch(`${PUBCHEM}/compound/cid/${cid}/synonyms/JSON`);
        const d3 = await r3.json();
        synonyms = d3.InformationList?.Information?.[0]?.Synonym?.slice(0, 5) || [];
      } catch(e){}

      out.innerHTML = `
        <div class="panel">
          <div class="ph">🔬 ${p.IUPACName || query} (CID ${cid})</div>
          <div class="pb">
            <div style="text-align:center;margin-bottom:14px">
              <img src="https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/PNG"
                   alt="Struttura ${p.IUPACName}" loading="lazy"
                   style="max-width:300px;width:100%;background:#fff;border-radius:8px;padding:10px;border:1px solid var(--g200)">
            </div>
            <table>
              <tbody>
                <tr><th>Formula</th><td><strong>${p.MolecularFormula || '–'}</strong></td></tr>
                <tr><th>MW</th><td>${p.MolecularWeight ? Math.round(p.MolecularWeight * 100)/100 + ' g/mol' : '–'}</td></tr>
                <tr><th>Exact Mass</th><td>${p.ExactMass ? Math.round(p.ExactMass * 10000)/10000 + ' Da' : '–'}</td></tr>
                <tr><th>LogP</th><td>${p.XLogP ?? '–'}</td></tr>
                <tr><th>TPSA</th><td>${p.TPSA ? p.TPSA + ' Å²' : '–'}</td></tr>
                <tr><th>HBD</th><td>${p.HBondDonorCount ?? '–'}</td></tr>
                <tr><th>HBA</th><td>${p.HBondAcceptorCount ?? '–'}</td></tr>
                <tr><th>Rot. Bonds</th><td>${p.RotatableBondCount ?? '–'}</td></tr>
                <tr><th>SMILES</th><td style="word-break:break-all;font-family:monospace;font-size:.78rem">${p.CanonicalSMILES || '–'}</td></tr>
                <tr><th>InChIKey</th><td style="word-break:break-all;font-family:monospace;font-size:.78rem">${p.InChIKey || '–'}</td></tr>
              </tbody>
            </table>
            ${synonyms.length ? `
              <div style="margin-top:14px">
                <strong>Sinonimi:</strong>
                <div style="margin-top:6px">${synonyms.map(s => `<span class="pill">${s}</span>`).join('')}</div>
              </div>
            ` : ''}
            <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap">
              <a class="btn btn-primary" href="https://pubchem.ncbi.nlm.nih.gov/compound/${cid}" target="_blank" rel="noopener">🔗 Pagina PubChem</a>
              <a class="btn" href="https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/record/SDF/?response_type=display" target="_blank" rel="noopener">📥 SDF 3D</a>
            </div>
          </div>
        </div>
      `;
    } catch(e) {
      out.innerHTML = `<div class="error-state"><h3>❌ Errore</h3><p>${e.message}</p></div>`;
    }
  }
};
