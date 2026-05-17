// Spectroscopy module - NMR, IR, MS tables
'use strict';

const TABS = [
  {id:'h-nmr', label:'¹H-NMR', icon:'🧪'},
  {id:'c-nmr', label:'¹³C-NMR', icon:'🧬'},
  {id:'ir', label:'IR', icon:'📊'},
  {id:'coupling', label:'Costanti J', icon:'🔗'},
  {id:'ms', label:'MS', icon:'⚡'},
];

const DATA = {
  'h-nmr': {
    title: 'Chemical Shifts ¹H-NMR (δ ppm)',
    rows: [
      ['Alcani (CH4, CH3, CH2, CH)', '0.7–1.4', 'sp3, schermati'],
      ['Allilico (CH-C=C)', '1.7–2.0', 'effetto C=C'],
      ['α-Carbonile (CH-C=O)', '2.0–2.4', 'effetto C=O'],
      ['α-Etere (CH-O)', '3.3–4.0', 'effetto O induttivo'],
      ['α-Estere/alcol (CH-OR)', '3.6–4.1', ''],
      ['Vinilico (=CH)', '5.0–6.5', 'sp2 alchene'],
      ['Aromatico (Ar-H)', '6.5–8.5', 'effetto ring current'],
      ['Aldeide (CHO)', '9.5–10.0', 'deschermato fortemente'],
      ['Acido (COOH)', '10–13', 'molto deschermato, scambiabile'],
      ['Alcol (OH)', '0.5–5 (variabile)', 'scambiabile con D2O'],
      ['Ammina (NH2)', '0.5–4 (variabile)', 'scambiabile, broad'],
      ['Tiolo (SH)', '1–2', 'scambiabile'],
    ]
  },
  'c-nmr': {
    title: 'Chemical Shifts ¹³C-NMR (δ ppm)',
    rows: [
      ['Alcani sp3 (CH3, CH2, CH)', '0–50', 'segnali stretti'],
      ['α-Eteri/alcoli', '50–90', 'effetto O'],
      ['Alchini (C≡C)', '65–90', ''],
      ['Aromatici/alcheni', '100–150', 'sp2'],
      ['Aromatici quaternari', '125–150', 'C ipso più alto'],
      ['Esteri/ammidi (C=O)', '160–185', ''],
      ['Acidi carbossilici (COOH)', '170–185', ''],
      ['Chetoni (C=O)', '195–220', 'più deschermato'],
      ['Aldeidi (CHO)', '190–205', ''],
    ]
  },
  'ir': {
    title: 'Bande IR caratteristiche (cm⁻¹)',
    rows: [
      ['O-H (alcoli/fenoli, libero)', '3600–3650', 'stretto, intenso'],
      ['O-H (alcoli, legato H)', '3200–3550', 'broad, intenso'],
      ['O-H (acidi carbossilici)', '2500–3300', 'very broad'],
      ['N-H (ammine primarie)', '3300–3500', 'doppietto'],
      ['N-H (ammine secondarie)', '3300–3500', 'singola banda'],
      ['C-H (alchini ≡C-H)', '3260–3320', 'stretto'],
      ['C-H (alcheni =C-H)', '3000–3100', ''],
      ['C-H (aromatici)', '3000–3100', ''],
      ['C-H (alcani sp3)', '2850–2960', 'forti'],
      ['C-H (aldeidi, 2 bande)', '2700–2900', 'caratteristico'],
      ['C≡C (alchini)', '2100–2260', 'debole'],
      ['C≡N (nitrili)', '2200–2260', 'medio-forte'],
      ['C=O (aldeidi)', '1720–1740', 'forte'],
      ['C=O (chetoni)', '1705–1725', 'forte'],
      ['C=O (acidi)', '1700–1725', 'forte, broad'],
      ['C=O (esteri)', '1735–1750', 'forte'],
      ['C=O (ammidi)', '1630–1690', 'amide I'],
      ['C=C (alcheni)', '1620–1680', 'medio'],
      ['C=C (aromatici)', '1450–1600', 'multipli'],
      ['NO2 (asimm./simm.)', '1300/1550', 'doppia banda'],
      ['C-O (esteri/eteri)', '1000–1300', 'forte'],
      ['C-N (ammine)', '1000–1250', ''],
      ['Fingerprint', '600–1500', 'identificazione composto'],
    ]
  },
  'coupling': {
    title: 'Costanti di Accoppiamento ¹H-¹H (Hz)',
    rows: [
      ['Geminale CH2 (sp3)', '-12 / -15', 'in cicli a 6'],
      ['Geminale =CH2', '0–3', 'piccola'],
      ['Vicinale (3J alcani libero)', '6–8', 'Karplus'],
      ['Vicinale (assiale-assiale)', '8–14', 'cicloesano'],
      ['Vicinale (assiale-equatoriale)', '2–5', ''],
      ['Vicinale (equatoriale-equatoriale)', '2–3', ''],
      ['Alchene cis (Z)', '6–14', ''],
      ['Alchene trans (E)', '11–18', ''],
      ['Aromatico orto', '6–10', ''],
      ['Aromatico meta', '1–3', ''],
      ['Aromatico para', '0–1', ''],
      ['Allilico (4J)', '0–3', 'piccola'],
      ['W-coupling (4J)', '1–3', 'cicli rigidi'],
    ]
  },
  'ms': {
    title: 'Frammentazione MS — Picchi caratteristici',
    rows: [
      ['M+ molecolare', 'massa molecolare', 'a volte debole o assente'],
      ['M+•+1 (¹³C)', 'M+1', '~1.1% per C'],
      ['M+•+2 (Cl, Br)', 'M+2', 'Cl: M:M+2 3:1; Br: 1:1'],
      ['α-cleavage (carbonile)', 'M-RCO', 'tipico chetoni'],
      ['McLafferty', '6-membered TS', 'γ-H trasferimento'],
      ['Perdita CO (28)', 'M-28', 'carbonili'],
      ['Perdita CHO (29)', 'M-29', 'aldeidi'],
      ['Perdita H2O (18)', 'M-18', 'alcoli'],
      ['Perdita CH3 (15)', 'M-15', 'alcani metilati'],
      ['Tropilio C7H7+', '91', 'molto stabile'],
      ['Acilio CH3CO+', '43', 'chetoni metilici'],
      ['Allile/iminio', '41', ''],
    ]
  }
};

export default {
  async render(container) {
    container.innerHTML = `
      <div class="section-title">📊 Spettroscopia — NMR, IR, MS</div>

      <div class="tabs" id="spec-tabs"></div>
      <div id="spec-content"></div>
    `;

    const tabsEl = document.getElementById('spec-tabs');
    const content = document.getElementById('spec-content');

    let active = TABS[0].id;

    function renderTabs() {
      tabsEl.innerHTML = TABS.map(t =>
        `<button class="tab ${t.id===active?'active':''}" data-tab="${t.id}">${t.icon} ${t.label}</button>`
      ).join('');
      tabsEl.querySelectorAll('.tab').forEach(b => {
        b.onclick = () => { active = b.dataset.tab; renderTabs(); renderContent(); };
      });
    }

    function renderContent() {
      const data = DATA[active];
      content.innerHTML = `
        <div class="panel">
          <div class="ph">${data.title}</div>
          <div class="pb" style="padding:0">
            <table>
              <thead>
                <tr>
                  <th style="width:50%">Gruppo funzionale</th>
                  <th style="width:25%">Range</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                ${data.rows.map(r => `
                  <tr>
                    <td><strong>${r[0]}</strong></td>
                    <td><code>${r[1]}</code></td>
                    <td style="font-size:.82rem;color:var(--text2)">${r[2]||'–'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        ${active === 'coupling' ? `
          <div class="panel">
            <div class="ph">📐 Equazione di Karplus</div>
            <div class="pb">
              <p>La costante <strong>3J(H,H)</strong> dipende dall'angolo diedro Φ:</p>
              <p style="background:var(--g50);padding:10px;border-radius:8px;text-align:center;font-family:monospace;margin:10px 0">
                3J = A cos²Φ + B cosΦ + C
              </p>
              <p>Per H-C-C-H: A≈4.22, B≈-0.5, C≈4.5</p>
              <p><strong>Casi limite:</strong></p>
              <ul style="padding-left:20px">
                <li>Φ = 0° (eclissato): J ≈ 8 Hz</li>
                <li>Φ = 60° (gauche): J ≈ 2 Hz</li>
                <li>Φ = 90°: J ≈ 0 Hz</li>
                <li>Φ = 180° (anti): J ≈ 12 Hz</li>
              </ul>
            </div>
          </div>` : ''}
      `;
    }

    renderTabs();
    renderContent();
  }
};
