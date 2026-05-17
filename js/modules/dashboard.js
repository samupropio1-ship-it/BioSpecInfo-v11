// Dashboard module
'use strict';

export default {
  async render(container) {
    container.innerHTML = `
      <div class="section-title">🏠 Dashboard</div>

      <div style="background:linear-gradient(135deg,var(--g900),var(--g700));color:#fff;padding:20px;border-radius:var(--radius);margin-bottom:16px">
        <h2 style="margin-bottom:6px;font-size:1.3rem">Benvenuto in BioSpecInfo</h2>
        <p style="opacity:.9;font-size:.92rem">Piattaforma chimica gratuita per studenti universitari</p>
      </div>

      <div class="grid grid-3" id="stat-cards"></div>

      <div class="panel" style="margin-top:14px">
        <div class="ph">🚀 Inizia subito</div>
        <div class="pb">
          <div class="grid grid-2" id="quick-actions"></div>
        </div>
      </div>

      <div class="panel">
        <div class="ph">ℹ️ Cosa puoi fare</div>
        <div class="pb">
          <ul style="padding-left:20px;line-height:2">
            <li><strong>Cerca molecole</strong> su PubChem con visualizzazione 3D</li>
            <li><strong>143 farmaci</strong> con schede cliniche complete</li>
            <li><strong>289 sintesi</strong> organiche con meccanismi</li>
            <li><strong>Tavola periodica</strong> interattiva (118 elementi)</li>
            <li><strong>Spettri NMR/IR</strong> con tabelle di riferimento</li>
            <li><strong>Chimica Analitica II</strong> — appunti universitari</li>
            <li><strong>File Manager</strong> — carica e gestisci i tuoi PDF</li>
            <li><strong>Note personali</strong> sincronizzate sul dispositivo</li>
          </ul>
        </div>
      </div>

      <div class="panel">
        <div class="ph">📲 Installa l'app</div>
        <div class="pb">
          <p style="margin-bottom:10px">Installa BioSpecInfo come app sul tuo dispositivo per accedervi velocemente e usarla offline.</p>
          <button class="btn btn-primary" onclick="if(window.PWA)window.PWA.triggerInstall()">📲 Installa Ora</button>
        </div>
      </div>
    `;

    // Stat cards
    const cards = [
      {icon: '💊', value: 143, label: 'Farmaci', target: 'pharma'},
      {icon: '🧪', value: 289, label: 'Sintesi', target: 'synthesis'},
      {icon: '⬡', value: 118, label: 'Elementi', target: 'periodic'},
      {icon: '🧬', value: 67, label: 'Aminoacidi', target: 'amino'},
      {icon: '📊', value: 5, label: 'Spettri', target: 'spectroscopy'},
      {icon: '📚', value: 5, label: 'Capitoli Analitica', target: 'analytics'},
    ];
    const statGrid = container.querySelector('#stat-cards');
    cards.forEach(c => {
      const btn = document.createElement('button');
      btn.className = 'stat-card';
      btn.setAttribute('aria-label', `${c.label}: ${c.value}, vai alla sezione`);
      btn.innerHTML = `
        <span class="stat-icon" aria-hidden="true">${c.icon}</span>
        <span class="stat-value">${c.value}</span>
        <span class="stat-label">${c.label}</span>
      `;
      btn.onclick = () => location.hash = c.target;
      statGrid.appendChild(btn);
    });

    // Quick actions
    const quickActions = [
      {label: '🔬 Cerca Molecola', target: 'molecules'},
      {label: '💊 Sfoglia Farmaci', target: 'pharma'},
      {label: '⬡ Tavola Periodica', target: 'periodic'},
      {label: '📝 Note Personali', target: 'notes'},
      {label: '📁 File Manager', target: 'filemanager'},
      {label: '📚 Analitica II', target: 'analytics'},
    ];
    const qa = container.querySelector('#quick-actions');
    quickActions.forEach(a => {
      const btn = document.createElement('button');
      btn.className = 'btn btn-secondary';
      btn.textContent = a.label;
      btn.onclick = () => location.hash = a.target;
      qa.appendChild(btn);
    });
  }
};
