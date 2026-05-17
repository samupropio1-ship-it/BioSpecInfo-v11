// Periodic table - 118 elements interactive
'use strict';

const ELEMENTS = [
  {z:1,s:'H',n:'Idrogeno',m:1.008,g:1,p:1,cat:'NonM',ec:'1s1',eN:2.20},
  {z:2,s:'He',n:'Elio',m:4.003,g:18,p:1,cat:'GN',ec:'1s2',eN:null},
  {z:3,s:'Li',n:'Litio',m:6.94,g:1,p:2,cat:'AM',ec:'[He]2s1',eN:0.98},
  {z:4,s:'Be',n:'Berillio',m:9.012,g:2,p:2,cat:'AeM',ec:'[He]2s2',eN:1.57},
  {z:5,s:'B',n:'Boro',m:10.81,g:13,p:2,cat:'Meta',ec:'[He]2s2 2p1',eN:2.04},
  {z:6,s:'C',n:'Carbonio',m:12.01,g:14,p:2,cat:'NonM',ec:'[He]2s2 2p2',eN:2.55},
  {z:7,s:'N',n:'Azoto',m:14.01,g:15,p:2,cat:'NonM',ec:'[He]2s2 2p3',eN:3.04},
  {z:8,s:'O',n:'Ossigeno',m:16.00,g:16,p:2,cat:'NonM',ec:'[He]2s2 2p4',eN:3.44},
  {z:9,s:'F',n:'Fluoro',m:19.00,g:17,p:2,cat:'Alog',ec:'[He]2s2 2p5',eN:3.98},
  {z:10,s:'Ne',n:'Neon',m:20.18,g:18,p:2,cat:'GN',ec:'[He]2s2 2p6',eN:null},
  {z:11,s:'Na',n:'Sodio',m:22.99,g:1,p:3,cat:'AM',ec:'[Ne]3s1',eN:0.93},
  {z:12,s:'Mg',n:'Magnesio',m:24.31,g:2,p:3,cat:'AeM',ec:'[Ne]3s2',eN:1.31},
  {z:13,s:'Al',n:'Alluminio',m:26.98,g:13,p:3,cat:'PoM',ec:'[Ne]3s2 3p1',eN:1.61},
  {z:14,s:'Si',n:'Silicio',m:28.09,g:14,p:3,cat:'Meta',ec:'[Ne]3s2 3p2',eN:1.90},
  {z:15,s:'P',n:'Fosforo',m:30.97,g:15,p:3,cat:'NonM',ec:'[Ne]3s2 3p3',eN:2.19},
  {z:16,s:'S',n:'Zolfo',m:32.06,g:16,p:3,cat:'NonM',ec:'[Ne]3s2 3p4',eN:2.58},
  {z:17,s:'Cl',n:'Cloro',m:35.45,g:17,p:3,cat:'Alog',ec:'[Ne]3s2 3p5',eN:3.16},
  {z:18,s:'Ar',n:'Argon',m:39.95,g:18,p:3,cat:'GN',ec:'[Ne]3s2 3p6',eN:null},
  {z:19,s:'K',n:'Potassio',m:39.10,g:1,p:4,cat:'AM',ec:'[Ar]4s1',eN:0.82},
  {z:20,s:'Ca',n:'Calcio',m:40.08,g:2,p:4,cat:'AeM',ec:'[Ar]4s2',eN:1.00},
  {z:21,s:'Sc',n:'Scandio',m:44.96,g:3,p:4,cat:'TM',ec:'[Ar]3d1 4s2',eN:1.36},
  {z:22,s:'Ti',n:'Titanio',m:47.87,g:4,p:4,cat:'TM',ec:'[Ar]3d2 4s2',eN:1.54},
  {z:23,s:'V',n:'Vanadio',m:50.94,g:5,p:4,cat:'TM',ec:'[Ar]3d3 4s2',eN:1.63},
  {z:24,s:'Cr',n:'Cromo',m:52.00,g:6,p:4,cat:'TM',ec:'[Ar]3d5 4s1',eN:1.66},
  {z:25,s:'Mn',n:'Manganese',m:54.94,g:7,p:4,cat:'TM',ec:'[Ar]3d5 4s2',eN:1.55},
  {z:26,s:'Fe',n:'Ferro',m:55.85,g:8,p:4,cat:'TM',ec:'[Ar]3d6 4s2',eN:1.83},
  {z:27,s:'Co',n:'Cobalto',m:58.93,g:9,p:4,cat:'TM',ec:'[Ar]3d7 4s2',eN:1.88},
  {z:28,s:'Ni',n:'Nichel',m:58.69,g:10,p:4,cat:'TM',ec:'[Ar]3d8 4s2',eN:1.91},
  {z:29,s:'Cu',n:'Rame',m:63.55,g:11,p:4,cat:'TM',ec:'[Ar]3d10 4s1',eN:1.90},
  {z:30,s:'Zn',n:'Zinco',m:65.38,g:12,p:4,cat:'TM',ec:'[Ar]3d10 4s2',eN:1.65},
  {z:31,s:'Ga',n:'Gallio',m:69.72,g:13,p:4,cat:'PoM',ec:'[Ar]3d10 4s2 4p1',eN:1.81},
  {z:32,s:'Ge',n:'Germanio',m:72.63,g:14,p:4,cat:'Meta',ec:'[Ar]3d10 4s2 4p2',eN:2.01},
  {z:33,s:'As',n:'Arsenico',m:74.92,g:15,p:4,cat:'Meta',ec:'[Ar]3d10 4s2 4p3',eN:2.18},
  {z:34,s:'Se',n:'Selenio',m:78.97,g:16,p:4,cat:'NonM',ec:'[Ar]3d10 4s2 4p4',eN:2.55},
  {z:35,s:'Br',n:'Bromo',m:79.90,g:17,p:4,cat:'Alog',ec:'[Ar]3d10 4s2 4p5',eN:2.96},
  {z:36,s:'Kr',n:'Cripto',m:83.80,g:18,p:4,cat:'GN',ec:'[Ar]3d10 4s2 4p6',eN:3.00},
  {z:37,s:'Rb',n:'Rubidio',m:85.47,g:1,p:5,cat:'AM',ec:'[Kr]5s1',eN:0.82},
  {z:38,s:'Sr',n:'Stronzio',m:87.62,g:2,p:5,cat:'AeM',ec:'[Kr]5s2',eN:0.95},
  {z:39,s:'Y',n:'Ittrio',m:88.91,g:3,p:5,cat:'TM',ec:'[Kr]4d1 5s2',eN:1.22},
  {z:40,s:'Zr',n:'Zirconio',m:91.22,g:4,p:5,cat:'TM',ec:'[Kr]4d2 5s2',eN:1.33},
  {z:41,s:'Nb',n:'Niobio',m:92.91,g:5,p:5,cat:'TM',ec:'[Kr]4d4 5s1',eN:1.6},
  {z:42,s:'Mo',n:'Molibdeno',m:95.96,g:6,p:5,cat:'TM',ec:'[Kr]4d5 5s1',eN:2.16},
  {z:43,s:'Tc',n:'Tecnezio',m:98,g:7,p:5,cat:'TM',ec:'[Kr]4d5 5s2',eN:1.9},
  {z:44,s:'Ru',n:'Rutenio',m:101.07,g:8,p:5,cat:'TM',ec:'[Kr]4d7 5s1',eN:2.2},
  {z:45,s:'Rh',n:'Rodio',m:102.91,g:9,p:5,cat:'TM',ec:'[Kr]4d8 5s1',eN:2.28},
  {z:46,s:'Pd',n:'Palladio',m:106.42,g:10,p:5,cat:'TM',ec:'[Kr]4d10',eN:2.20},
  {z:47,s:'Ag',n:'Argento',m:107.87,g:11,p:5,cat:'TM',ec:'[Kr]4d10 5s1',eN:1.93},
  {z:48,s:'Cd',n:'Cadmio',m:112.41,g:12,p:5,cat:'TM',ec:'[Kr]4d10 5s2',eN:1.69},
  {z:49,s:'In',n:'Indio',m:114.82,g:13,p:5,cat:'PoM',ec:'[Kr]4d10 5s2 5p1',eN:1.78},
  {z:50,s:'Sn',n:'Stagno',m:118.71,g:14,p:5,cat:'PoM',ec:'[Kr]4d10 5s2 5p2',eN:1.96},
  {z:51,s:'Sb',n:'Antimonio',m:121.76,g:15,p:5,cat:'Meta',ec:'[Kr]4d10 5s2 5p3',eN:2.05},
  {z:52,s:'Te',n:'Tellurio',m:127.60,g:16,p:5,cat:'Meta',ec:'[Kr]4d10 5s2 5p4',eN:2.1},
  {z:53,s:'I',n:'Iodio',m:126.90,g:17,p:5,cat:'Alog',ec:'[Kr]4d10 5s2 5p5',eN:2.66},
  {z:54,s:'Xe',n:'Xeno',m:131.29,g:18,p:5,cat:'GN',ec:'[Kr]4d10 5s2 5p6',eN:2.60},
  {z:55,s:'Cs',n:'Cesio',m:132.91,g:1,p:6,cat:'AM',ec:'[Xe]6s1',eN:0.79},
  {z:56,s:'Ba',n:'Bario',m:137.33,g:2,p:6,cat:'AeM',ec:'[Xe]6s2',eN:0.89},
  {z:57,s:'La',n:'Lantanio',m:138.91,g:0,p:6,cat:'Lan',ec:'[Xe]5d1 6s2',eN:1.10},
  {z:58,s:'Ce',n:'Cerio',m:140.12,g:0,p:6,cat:'Lan',ec:'[Xe]4f1 5d1 6s2',eN:1.12},
  {z:59,s:'Pr',n:'Praseodimio',m:140.91,g:0,p:6,cat:'Lan',ec:'[Xe]4f3 6s2',eN:1.13},
  {z:60,s:'Nd',n:'Neodimio',m:144.24,g:0,p:6,cat:'Lan',ec:'[Xe]4f4 6s2',eN:1.14},
  {z:61,s:'Pm',n:'Promezio',m:145,g:0,p:6,cat:'Lan',ec:'[Xe]4f5 6s2',eN:1.13},
  {z:62,s:'Sm',n:'Samario',m:150.36,g:0,p:6,cat:'Lan',ec:'[Xe]4f6 6s2',eN:1.17},
  {z:63,s:'Eu',n:'Europio',m:151.96,g:0,p:6,cat:'Lan',ec:'[Xe]4f7 6s2',eN:1.2},
  {z:64,s:'Gd',n:'Gadolinio',m:157.25,g:0,p:6,cat:'Lan',ec:'[Xe]4f7 5d1 6s2',eN:1.2},
  {z:65,s:'Tb',n:'Terbio',m:158.93,g:0,p:6,cat:'Lan',ec:'[Xe]4f9 6s2',eN:1.2},
  {z:66,s:'Dy',n:'Disprosio',m:162.50,g:0,p:6,cat:'Lan',ec:'[Xe]4f10 6s2',eN:1.22},
  {z:67,s:'Ho',n:'Olmio',m:164.93,g:0,p:6,cat:'Lan',ec:'[Xe]4f11 6s2',eN:1.23},
  {z:68,s:'Er',n:'Erbio',m:167.26,g:0,p:6,cat:'Lan',ec:'[Xe]4f12 6s2',eN:1.24},
  {z:69,s:'Tm',n:'Tulio',m:168.93,g:0,p:6,cat:'Lan',ec:'[Xe]4f13 6s2',eN:1.25},
  {z:70,s:'Yb',n:'Itterbio',m:173.05,g:0,p:6,cat:'Lan',ec:'[Xe]4f14 6s2',eN:1.1},
  {z:71,s:'Lu',n:'Lutezio',m:174.97,g:3,p:6,cat:'Lan',ec:'[Xe]4f14 5d1 6s2',eN:1.27},
  {z:72,s:'Hf',n:'Afnio',m:178.49,g:4,p:6,cat:'TM',ec:'[Xe]4f14 5d2 6s2',eN:1.3},
  {z:73,s:'Ta',n:'Tantalio',m:180.95,g:5,p:6,cat:'TM',ec:'[Xe]4f14 5d3 6s2',eN:1.5},
  {z:74,s:'W',n:'Tungsteno',m:183.84,g:6,p:6,cat:'TM',ec:'[Xe]4f14 5d4 6s2',eN:2.36},
  {z:75,s:'Re',n:'Renio',m:186.21,g:7,p:6,cat:'TM',ec:'[Xe]4f14 5d5 6s2',eN:1.9},
  {z:76,s:'Os',n:'Osmio',m:190.23,g:8,p:6,cat:'TM',ec:'[Xe]4f14 5d6 6s2',eN:2.2},
  {z:77,s:'Ir',n:'Iridio',m:192.22,g:9,p:6,cat:'TM',ec:'[Xe]4f14 5d7 6s2',eN:2.20},
  {z:78,s:'Pt',n:'Platino',m:195.08,g:10,p:6,cat:'TM',ec:'[Xe]4f14 5d9 6s1',eN:2.28},
  {z:79,s:'Au',n:'Oro',m:196.97,g:11,p:6,cat:'TM',ec:'[Xe]4f14 5d10 6s1',eN:2.54},
  {z:80,s:'Hg',n:'Mercurio',m:200.59,g:12,p:6,cat:'TM',ec:'[Xe]4f14 5d10 6s2',eN:2.00},
  {z:81,s:'Tl',n:'Tallio',m:204.38,g:13,p:6,cat:'PoM',ec:'[Xe]4f14 5d10 6s2 6p1',eN:1.62},
  {z:82,s:'Pb',n:'Piombo',m:207.2,g:14,p:6,cat:'PoM',ec:'[Xe]4f14 5d10 6s2 6p2',eN:2.33},
  {z:83,s:'Bi',n:'Bismuto',m:208.98,g:15,p:6,cat:'PoM',ec:'[Xe]4f14 5d10 6s2 6p3',eN:2.02},
  {z:84,s:'Po',n:'Polonio',m:209,g:16,p:6,cat:'Meta',ec:'[Xe]4f14 5d10 6s2 6p4',eN:2.0},
  {z:85,s:'At',n:'Astato',m:210,g:17,p:6,cat:'Alog',ec:'[Xe]4f14 5d10 6s2 6p5',eN:2.2},
  {z:86,s:'Rn',n:'Radon',m:222,g:18,p:6,cat:'GN',ec:'[Xe]4f14 5d10 6s2 6p6',eN:null},
  {z:87,s:'Fr',n:'Francio',m:223,g:1,p:7,cat:'AM',ec:'[Rn]7s1',eN:0.7},
  {z:88,s:'Ra',n:'Radio',m:226,g:2,p:7,cat:'AeM',ec:'[Rn]7s2',eN:0.9},
  {z:89,s:'Ac',n:'Attinio',m:227,g:0,p:7,cat:'Act',ec:'[Rn]6d1 7s2',eN:1.1},
  {z:90,s:'Th',n:'Torio',m:232.04,g:0,p:7,cat:'Act',ec:'[Rn]6d2 7s2',eN:1.3},
  {z:91,s:'Pa',n:'Protoattinio',m:231.04,g:0,p:7,cat:'Act',ec:'[Rn]5f2 6d1 7s2',eN:1.5},
  {z:92,s:'U',n:'Uranio',m:238.03,g:0,p:7,cat:'Act',ec:'[Rn]5f3 6d1 7s2',eN:1.38},
  {z:93,s:'Np',n:'Nettunio',m:237,g:0,p:7,cat:'Act',ec:'[Rn]5f4 6d1 7s2',eN:1.36},
  {z:94,s:'Pu',n:'Plutonio',m:244,g:0,p:7,cat:'Act',ec:'[Rn]5f6 7s2',eN:1.28},
  {z:95,s:'Am',n:'Americio',m:243,g:0,p:7,cat:'Act',ec:'[Rn]5f7 7s2',eN:1.3},
  {z:96,s:'Cm',n:'Curio',m:247,g:0,p:7,cat:'Act',ec:'[Rn]5f7 6d1 7s2',eN:1.3},
  {z:97,s:'Bk',n:'Berkelio',m:247,g:0,p:7,cat:'Act',ec:'[Rn]5f9 7s2',eN:1.3},
  {z:98,s:'Cf',n:'Californio',m:251,g:0,p:7,cat:'Act',ec:'[Rn]5f10 7s2',eN:1.3},
  {z:99,s:'Es',n:'Einsteinio',m:252,g:0,p:7,cat:'Act',ec:'[Rn]5f11 7s2',eN:1.3},
  {z:100,s:'Fm',n:'Fermio',m:257,g:0,p:7,cat:'Act',ec:'[Rn]5f12 7s2',eN:1.3},
  {z:101,s:'Md',n:'Mendelevio',m:258,g:0,p:7,cat:'Act',ec:'[Rn]5f13 7s2',eN:1.3},
  {z:102,s:'No',n:'Nobelio',m:259,g:0,p:7,cat:'Act',ec:'[Rn]5f14 7s2',eN:1.3},
  {z:103,s:'Lr',n:'Laurenzio',m:266,g:3,p:7,cat:'Act',ec:'[Rn]5f14 7s2 7p1',eN:1.3},
  {z:104,s:'Rf',n:'Rutherfordio',m:267,g:4,p:7,cat:'TM',ec:'[Rn]5f14 6d2 7s2',eN:null},
  {z:105,s:'Db',n:'Dubnio',m:268,g:5,p:7,cat:'TM',ec:'',eN:null},
  {z:106,s:'Sg',n:'Seaborgio',m:269,g:6,p:7,cat:'TM',ec:'',eN:null},
  {z:107,s:'Bh',n:'Bohrio',m:270,g:7,p:7,cat:'TM',ec:'',eN:null},
  {z:108,s:'Hs',n:'Hassio',m:269,g:8,p:7,cat:'TM',ec:'',eN:null},
  {z:109,s:'Mt',n:'Meitnerio',m:278,g:9,p:7,cat:'TM',ec:'',eN:null},
  {z:110,s:'Ds',n:'Darmstadtio',m:281,g:10,p:7,cat:'TM',ec:'',eN:null},
  {z:111,s:'Rg',n:'Roentgenio',m:282,g:11,p:7,cat:'TM',ec:'',eN:null},
  {z:112,s:'Cn',n:'Copernicio',m:285,g:12,p:7,cat:'TM',ec:'',eN:null},
  {z:113,s:'Nh',n:'Nihonio',m:286,g:13,p:7,cat:'PoM',ec:'',eN:null},
  {z:114,s:'Fl',n:'Flerovio',m:289,g:14,p:7,cat:'PoM',ec:'',eN:null},
  {z:115,s:'Mc',n:'Moscovio',m:289,g:15,p:7,cat:'PoM',ec:'',eN:null},
  {z:116,s:'Lv',n:'Livermorio',m:293,g:16,p:7,cat:'PoM',ec:'',eN:null},
  {z:117,s:'Ts',n:'Tennesso',m:294,g:17,p:7,cat:'Alog',ec:'',eN:null},
  {z:118,s:'Og',n:'Oganesson',m:294,g:18,p:7,cat:'GN',ec:'',eN:null},
];

const COLORS = {
  AM:'#e57373',AeM:'#ffb74d',TM:'#ffd54f',Lan:'#aed581',Act:'#4db6ac',
  PoM:'#81c784',Meta:'#ba68c8',NonM:'#64b5f6',Alog:'#f06292',GN:'#a1887f',
};
const CAT_NAMES = {
  AM:'Alcalini',AeM:'Alcalino-terrosi',TM:'Trans.',Lan:'Lantanidi',Act:'Attinidi',
  PoM:'Post-trans.',Meta:'Metalloidi',NonM:'Non-metalli',Alog:'Alogeni',GN:'Gas nobili'
};

export default {
  async render(container) {
    container.innerHTML = `
      <div class="section-title">⬡ Tavola Periodica — 118 elementi</div>

      <div class="panel">
        <div class="pb">
          <input type="search" id="el-search" placeholder="Cerca: simbolo, nome, gruppo..." style="width:100%">
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;font-size:.78rem">
            ${Object.entries(CAT_NAMES).map(([k,v])=>`
              <span style="background:${COLORS[k]};color:#000;padding:3px 10px;border-radius:10px;font-weight:700">${v}</span>
            `).join('')}
          </div>
        </div>
      </div>

      <div style="overflow-x:auto;background:var(--white);border-radius:var(--radius);padding:10px;margin:14px 0;box-shadow:var(--shadow)">
        <div id="pt-grid" style="display:grid;grid-template-columns:repeat(18,minmax(30px,1fr));gap:2px;min-width:540px"></div>
        <div style="margin-top:8px"><div id="pt-lan" style="display:grid;grid-template-columns:repeat(15,minmax(30px,1fr));gap:2px;min-width:480px;margin-left:auto"></div></div>
        <div style="margin-top:2px"><div id="pt-act" style="display:grid;grid-template-columns:repeat(15,minmax(30px,1fr));gap:2px;min-width:480px;margin-left:auto"></div></div>
      </div>

      <div id="pt-detail"></div>
    `;

    const grid = document.getElementById('pt-grid');
    const lanRow = document.getElementById('pt-lan');
    const actRow = document.getElementById('pt-act');
    const detail = document.getElementById('pt-detail');
    const search = document.getElementById('el-search');

    function makeCell(el) {
      const c = document.createElement('button');
      c.style.cssText = `background:${COLORS[el.cat]||'#ccc'};border:1px solid #999;padding:2px;cursor:pointer;text-align:center;font-family:inherit;border-radius:3px;min-height:38px`;
      c.innerHTML = `<div style="font-size:8px;color:#555">${el.z}</div><div style="font-weight:900;font-size:13px;color:#000">${el.s}</div>`;
      c.title = `${el.n} — ${el.m}`;
      c.onclick = () => showDetail(el);
      return c;
    }

    function showDetail(el) {
      detail.innerHTML = `
        <div class="panel">
          <div class="ph" style="background:${COLORS[el.cat]||'#ccc'};color:#000">
            <strong>${el.s}</strong> — ${el.n} (Z=${el.z})
          </div>
          <div class="pb">
            <table>
              <tbody>
                <tr><th>Massa atomica</th><td>${el.m} u</td></tr>
                <tr><th>Gruppo</th><td>${el.g || 'Lan/Act'}</td></tr>
                <tr><th>Periodo</th><td>${el.p}</td></tr>
                <tr><th>Categoria</th><td>${CAT_NAMES[el.cat] || el.cat}</td></tr>
                <tr><th>Config. elettronica</th><td><code>${el.ec}</code></td></tr>
                <tr><th>Elettronegatività</th><td>${el.eN ?? 'N/D'} (Pauling)</td></tr>
              </tbody>
            </table>
          </div>
        </div>`;
      detail.scrollIntoView({behavior:'smooth', block:'start'});
    }

    function render(filter) {
      grid.innerHTML = '';
      lanRow.innerHTML = '';
      actRow.innerHTML = '';

      const q = (filter || '').toLowerCase().trim();
      const visible = q ? ELEMENTS.filter(e =>
        e.s.toLowerCase().includes(q) || e.n.toLowerCase().includes(q) || String(e.z) === q
      ) : ELEMENTS;
      const visibleSet = new Set(visible.map(e => e.z));

      // Main grid
      const positions = {};
      for(const el of ELEMENTS) {
        if(el.cat === 'Lan' && el.z >= 58) continue;
        if(el.cat === 'Act' && el.z >= 90) continue;
        positions[`${el.p}-${el.g}`] = el;
      }

      for(let p = 1; p <= 7; p++) {
        for(let g = 1; g <= 18; g++) {
          const el = positions[`${p}-${g}`];
          if(el) {
            const cell = makeCell(el);
            if(!visibleSet.has(el.z)) cell.style.opacity = '0.15';
            grid.appendChild(cell);
          } else {
            // Lan/Act placeholder
            if((p === 6 && g === 3) || (p === 7 && g === 3)) {
              const placeholder = document.createElement('div');
              placeholder.style.cssText = 'background:#ddd;border-radius:3px;text-align:center;font-size:10px;color:#666;padding:6px;min-height:38px;display:flex;align-items:center;justify-content:center';
              placeholder.textContent = p === 6 ? '57-71' : '89-103';
              grid.appendChild(placeholder);
            } else {
              const empty = document.createElement('div');
              grid.appendChild(empty);
            }
          }
        }
      }

      // Lanthanides row
      ELEMENTS.filter(e => e.z >= 58 && e.z <= 71).forEach(e => {
        const cell = makeCell(e);
        if(!visibleSet.has(e.z)) cell.style.opacity = '0.15';
        lanRow.appendChild(cell);
      });

      // Actinides row
      ELEMENTS.filter(e => e.z >= 90 && e.z <= 103).forEach(e => {
        const cell = makeCell(e);
        if(!visibleSet.has(e.z)) cell.style.opacity = '0.15';
        actRow.appendChild(cell);
      });
    }

    search.oninput = () => render(search.value);
    render();

    // Show first element as example
    showDetail(ELEMENTS[5]); // Carbon
  }
};
