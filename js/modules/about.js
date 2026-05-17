// About module
'use strict';

export default {
  async render(container) {
    container.innerHTML = `
      <div class="section-title">ℹ️ Informazioni</div>

      <div class="panel">
        <div class="ph">🧪 BioSpecInfo v11.0</div>
        <div class="pb">
          <p style="margin-bottom:10px"><strong>Piattaforma di Chimica Interattiva</strong> — Tesi di laurea in Chimica e Tecnologie Farmaceutiche</p>
          <p>Sviluppata da <strong>Samuele Pio Provenzano</strong> come strumento didattico gratuito per studenti universitari di chimica, biochimica e farmacologia.</p>
        </div>
      </div>

      <div class="panel">
        <div class="ph">🎯 Cosa contiene</div>
        <div class="pb">
          <ul style="padding-left:20px;line-height:2">
            <li><strong>143 farmaci</strong> con schede cliniche complete (meccanismo, dose, effetti avversi)</li>
            <li><strong>289 reazioni</strong> organiche raggruppate per categoria con meccanismi</li>
            <li><strong>118 elementi</strong> della tavola periodica con dati fisico-chimici</li>
            <li><strong>20 amminoacidi</strong> standard con proprietà</li>
            <li><strong>Spettroscopia</strong> ¹H/¹³C-NMR, IR, MS con tabelle di riferimento</li>
            <li><strong>Chimica Analitica II</strong> — appunti universitari (5 capitoli)</li>
            <li><strong>Ricerca PubChem</strong> integrata per qualsiasi molecola</li>
            <li><strong>File Manager</strong> personale con IndexedDB (offline)</li>
            <li><strong>Note personali</strong> sincronizzate sul dispositivo</li>
          </ul>
        </div>
      </div>

      <div class="panel">
        <div class="ph">⚡ Tecnologie</div>
        <div class="pb">
          <div style="display:flex;flex-wrap:wrap;gap:6px">
            <span class="pill">HTML5</span>
            <span class="pill">JavaScript ES Modules</span>
            <span class="pill">CSS3</span>
            <span class="pill">Service Worker</span>
            <span class="pill">PWA</span>
            <span class="pill">IndexedDB</span>
            <span class="pill">localStorage</span>
            <span class="pill">Fetch API</span>
            <span class="pill">PubChem REST API</span>
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="ph">📲 Installazione</div>
        <div class="pb">
          <p style="margin-bottom:10px">BioSpecInfo è una <strong>Progressive Web App</strong> (PWA): può essere installata come app sul tuo dispositivo e funziona offline.</p>
          <button class="btn btn-primary" onclick="if(window.PWA)window.PWA.triggerInstall()">📲 Installa l'app</button>
        </div>
      </div>

      <div class="panel">
        <div class="ph">🔗 Link utili</div>
        <div class="pb">
          <div style="display:flex;flex-direction:column;gap:8px">
            <a class="btn" href="https://pubchem.ncbi.nlm.nih.gov/" target="_blank" rel="noopener">PubChem (NCBI)</a>
            <a class="btn" href="https://www.rcsb.org/" target="_blank" rel="noopener">RCSB Protein Data Bank</a>
            <a class="btn" href="https://www.wolframalpha.com/" target="_blank" rel="noopener">WolframAlpha (bilanciamento)</a>
            <a class="btn" href="https://github.com/samupropio1-ship-it/BioSpecInfo-" target="_blank" rel="noopener">📦 GitHub Repository</a>
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="ph">📚 Riferimento accademico</div>
        <div class="pb" style="font-size:.85rem;color:var(--text2)">
          Longo, A. (2023). "Symmetry-Adapted Tools in Spectroscopy and Chemoinformatics".
          <em>Symmetry</em>, 15(2), 357. DOI: <a href="https://doi.org/10.3390/sym15020357" target="_blank" rel="noopener" style="color:var(--g700)">10.3390/sym15020357</a>
        </div>
      </div>

      <div style="text-align:center;color:var(--text3);font-size:.75rem;margin:20px 0;padding:10px">
        © 2025 Samuele Pio Provenzano · Versione 11.0 · BioSpecInfo
      </div>
    `;
  }
};
