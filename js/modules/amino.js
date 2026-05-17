// Amino acids module
'use strict';

const AAs = [
  {c:'Gly',n:'Glicina',l:'G',m:75.07,pI:5.97,cat:'Apolare',f:'C2H5NO2',r:'H',ess:false},
  {c:'Ala',n:'Alanina',l:'A',m:89.09,pI:6.00,cat:'Apolare',f:'C3H7NO2',r:'CH3',ess:false},
  {c:'Val',n:'Valina',l:'V',m:117.15,pI:5.96,cat:'Apolare',f:'C5H11NO2',r:'CH(CH3)2',ess:true},
  {c:'Leu',n:'Leucina',l:'L',m:131.17,pI:5.98,cat:'Apolare',f:'C6H13NO2',r:'CH2CH(CH3)2',ess:true},
  {c:'Ile',n:'Isoleucina',l:'I',m:131.17,pI:6.02,cat:'Apolare',f:'C6H13NO2',r:'CH(CH3)CH2CH3',ess:true},
  {c:'Pro',n:'Prolina',l:'P',m:115.13,pI:6.30,cat:'Apolare',f:'C5H9NO2',r:'ciclica',ess:false},
  {c:'Met',n:'Metionina',l:'M',m:149.21,pI:5.74,cat:'Apolare',f:'C5H11NO2S',r:'CH2CH2SCH3',ess:true},
  {c:'Phe',n:'Fenilalanina',l:'F',m:165.19,pI:5.48,cat:'Aromatico',f:'C9H11NO2',r:'CH2Ph',ess:true},
  {c:'Trp',n:'Triptofano',l:'W',m:204.23,pI:5.89,cat:'Aromatico',f:'C11H12N2O2',r:'CH2-indolo',ess:true},
  {c:'Tyr',n:'Tirosina',l:'Y',m:181.19,pI:5.66,cat:'Aromatico',f:'C9H11NO3',r:'CH2-C6H4-OH',ess:false},
  {c:'Ser',n:'Serina',l:'S',m:105.09,pI:5.68,cat:'Polare',f:'C3H7NO3',r:'CH2OH',ess:false},
  {c:'Thr',n:'Treonina',l:'T',m:119.12,pI:5.60,cat:'Polare',f:'C4H9NO3',r:'CHOHCH3',ess:true},
  {c:'Cys',n:'Cisteina',l:'C',m:121.16,pI:5.07,cat:'Polare',f:'C3H7NO2S',r:'CH2SH',ess:false},
  {c:'Asn',n:'Asparagina',l:'N',m:132.12,pI:5.41,cat:'Polare',f:'C4H8N2O3',r:'CH2CONH2',ess:false},
  {c:'Gln',n:'Glutammina',l:'Q',m:146.15,pI:5.65,cat:'Polare',f:'C5H10N2O3',r:'CH2CH2CONH2',ess:false},
  {c:'Lys',n:'Lisina',l:'K',m:146.19,pI:9.74,cat:'Basico',f:'C6H14N2O2',r:'(CH2)4NH2',ess:true},
  {c:'Arg',n:'Arginina',l:'R',m:174.20,pI:10.76,cat:'Basico',f:'C6H14N4O2',r:'(CH2)3NHC(NH)NH2',ess:false},
  {c:'His',n:'Istidina',l:'H',m:155.16,pI:7.59,cat:'Basico',f:'C6H9N3O2',r:'CH2-imidazolo',ess:true},
  {c:'Asp',n:'Aspartato',l:'D',m:133.10,pI:2.77,cat:'Acido',f:'C4H7NO4',r:'CH2COOH',ess:false},
  {c:'Glu',n:'Glutammato',l:'E',m:147.13,pI:3.22,cat:'Acido',f:'C5H9NO4',r:'CH2CH2COOH',ess:false},
];

const CAT_COLORS = {
  'Apolare': '#a5d6a7',
  'Aromatico': '#9fa8da',
  'Polare': '#80cbc4',
  'Basico': '#90caf9',
  'Acido': '#ef9a9a',
};

export default {
  async render(container) {
    container.innerHTML = `
      <div class="section-title">🧬 Amminoacidi — 20 standard</div>

      <div class="panel">
        <div class="pb">
          <input type="search" id="aa-search" placeholder="Cerca per nome, codice, categoria..." style="width:100%">
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;font-size:.78rem">
            ${Object.entries(CAT_COLORS).map(([k,v])=>`<span style="background:${v};color:#000;padding:3px 10px;border-radius:10px;font-weight:700">${k}</span>`).join('')}
          </div>
        </div>
      </div>

      <div id="aa-grid" class="grid grid-auto" style="margin-top:14px"></div>
      <div id="aa-detail"></div>
    `;

    const search = document.getElementById('aa-search');
    const grid = document.getElementById('aa-grid');
    const detail = document.getElementById('aa-detail');

    function show(aa) {
      detail.innerHTML = `
        <div class="panel" style="margin-top:14px">
          <div class="ph" style="background:${CAT_COLORS[aa.cat]};color:#000">
            ${aa.n} (${aa.c} / ${aa.l}) — ${aa.cat}
          </div>
          <div class="pb">
            <table>
              <tbody>
                <tr><th>Codice</th><td>${aa.c} (${aa.l})</td></tr>
                <tr><th>Formula</th><td><code>${aa.f}</code></td></tr>
                <tr><th>Massa molecolare</th><td>${aa.m} g/mol</td></tr>
                <tr><th>pI (punto iso.)</th><td>${aa.pI}</td></tr>
                <tr><th>Gruppo R (laterale)</th><td><code>${aa.r}</code></td></tr>
                <tr><th>Essenziale</th><td>${aa.ess ? '✅ Sì' : '❌ No'}</td></tr>
              </tbody>
            </table>
          </div>
        </div>`;
      detail.scrollIntoView({behavior:'smooth'});
    }

    function render() {
      const q = search.value.toLowerCase().trim();
      const list = q
        ? AAs.filter(a => a.n.toLowerCase().includes(q) || a.c.toLowerCase().includes(q) || a.l.toLowerCase() === q || a.cat.toLowerCase().includes(q))
        : AAs;

      grid.innerHTML = list.map(aa => `
        <button class="stat-card" data-aa="${aa.c}" style="background:${CAT_COLORS[aa.cat]};border-color:transparent">
          <span style="font-size:1.5rem;font-weight:900;color:#000">${aa.l}</span>
          <span style="display:block;font-weight:700;color:#000;margin-top:2px">${aa.c}</span>
          <small style="color:#222">${aa.n}</small>
        </button>
      `).join('');

      grid.querySelectorAll('[data-aa]').forEach(btn => {
        btn.onclick = () => show(AAs.find(a => a.c === btn.dataset.aa));
      });
    }

    search.oninput = render;
    render();
  }
};
