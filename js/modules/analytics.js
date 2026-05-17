// Chimica Analitica II - Appunti Di Nunno
'use strict';

const CHAPTERS = [
  {
    id: 'crom',
    title: 'Parametri Cromatografici',
    icon: '📊',
    items: [
      {h:'Piatto Teorico (N, H)', t:'<strong>H = σ²/L</strong> (altezza di piatto). <strong>N = L/H = 16(tR/W)²</strong> numero di piatti teorici. Maggiore N → migliore separazione. Un picco cromatografico ha profilo gaussiano. H si misura in mm o cm, N è adimensionale.'},
      {h:'Equazione di Van Deemter', t:'<strong>H = A + B/u + C·u</strong><br>• <strong>A</strong>: eddy diffusion (percorsi multipli nelle particelle), non dipende da u<br>• <strong>B/u</strong>: diffusione longitudinale, diminuisce all\'aumentare della velocità<br>• <strong>C·u</strong>: trasferimento di massa, aumenta con u<br>Velocità ottimale: <strong>u_opt = √(B/C)</strong>. Il minimo di H = A + 2√(BC).'},
      {h:'Fattore di Capacità k\'', t:'<strong>k\' = (tR − tM)/tM = K·(Vs/Vm)</strong><br>Rapporto tra tempo che l\'analita trascorre in fase stazionaria vs mobile. K = costante di distribuzione tra le fasi. <br>• k\' ottimale: <strong>1–10</strong><br>• k\' &lt; 1: scarsa ritenzione, eluizione troppo veloce<br>• k\' &gt; 10: analisi troppo lenta'},
      {h:'Fattore di Selettività α', t:'<strong>α = k\'₂/k\'₁ = K₂/K₁ ≥ 1</strong><br>Misura la separazione relativa tra due componenti. <br>• α = 1: impossibile separare<br>• α &gt; 1.1: separazione possibile<br>Dipende dalla natura delle fasi stazionaria/mobile e dalla temperatura.'},
      {h:'Risoluzione R', t:'<strong>R = 2(tR₂ − tR₁)/(W₁ + W₂)</strong><br>Equazione fondamentale della cromatografia:<br><strong>R = (√N/4) · ((α−1)/α) · (k\'/(1+k\'))</strong><br>• <strong>R &gt; 1.5</strong>: separazione completa (baseline)<br>• R = 1.0: ~98% separazione<br>• R &lt; 1.0: picchi sovrapposti<br>Per migliorare R: aumentare N (colonna più lunga), aumentare α (cambiare fase), ottimizzare k\'.'},
      {h:'Asimmetria del picco (As)', t:'<strong>As = b/a</strong> dove a e b sono le semi-larghezze del picco al 10% di altezza.<br>• As = 1: simmetrico (ideale)<br>• As &gt; 1: tailing (coda posteriore) - tipico di siti attivi residui<br>• As &lt; 1: fronting (coda anteriore) - sovraccarico'},
    ]
  },
  {
    id: 'gc',
    title: 'Gas Cromatografia (GC)',
    icon: '🔬',
    items: [
      {h:'Principio e Volumi di Ritenzione', t:'GC separa miscele volatili. Fase mobile = gas inerte (N₂, He, H₂). <br><strong>VR = F · tR</strong> volume di ritenzione (mL). <strong>VM = F · tM</strong> volume morto.<br>Due meccanismi:<br>• <strong>GLC</strong> (gas-liquido): ripartizione tra gas e liquido<br>• <strong>GSC</strong> (gas-solido): adsorbimento su superficie solida<br>Flusso effettivo: F = FM · (TC/T) · (P-PH₂O)/P (correzione temp/pressione)'},
      {h:'Equazione di Clausius-Clapeyron', t:'<strong>log(Vg) = -ΔHv/(2.303·R)·(1/T) + cost</strong><br>La dipendenza lineare di log(Vg) vs 1/T permette di calcolare l\'entalpia di vaporizzazione ΔHv dalla pendenza della retta.<br>Per separazioni difficili si usa <strong>temperatura programmata</strong>: la T della colonna aumenta durante l\'analisi (es. 50→250°C a 10°C/min), migliorando separazione di miscele con componenti a diversa volatilità.'},
      {h:'Rivelatori GC', t:'<strong>FID</strong> (Fiamma Ionizzazione): universale per composti organici, sensibile (10⁻¹² g/s), non rileva H₂O, CO₂, gas inerti<br><strong>TCD</strong> (Thermal Conductivity): universale, meno sensibile (10⁻⁸ g/s), non distruttivo<br><strong>ECD</strong> (Electron Capture): specifico per alogeni, nitro, perossidi - ppb<br><strong>NPD</strong>: selettivo per N e P<br><strong>FPD</strong>: selettivo per S e P (chemiluminescenza)<br><strong>MS</strong>: identificazione strutturale via spettro di massa'},
      {h:'Colonne in GC', t:'<strong>Impaccate</strong>: diametro 2–4 mm, lunghezza max 3 m, particelle 100–250 μm, N = 10³–10⁴ piatti<br><strong>Capillari WCOT/SCOT</strong>: diametro 0.1–0.53 mm, lunghezza 15–100 m, N = 10⁵–10⁶ piatti<br>Fasi stazionarie comuni:<br>• PDMS (polidimetilsilossano, apolare): idrocarburi<br>• PEG/Carbowax (polare): alcoli, glicoli<br>• Cianopropil-fenil: composti polari'},
    ]
  },
  {
    id: 'hplc',
    title: 'HPLC',
    icon: '💧',
    items: [
      {h:'Principio HPLC', t:'<strong>High Performance Liquid Chromatography</strong>: fase mobile liquida pompata ad alta pressione (5–400 bar). Permette analisi di composti non volatili (proteine, polimeri, ioni).<br>Meccanismi di separazione:<br>• <strong>Fase inversa (RP)</strong>: 70% delle analisi - fase staz. apolare, mobile polare<br>• <strong>Fase normale (NP)</strong>: fase staz. polare, mobile apolare<br>• <strong>Scambio ionico (IEC)</strong>: ioni<br>• <strong>Esclusione dimensionale (SEC/GPC)</strong>: polimeri/proteine in base a MW'},
      {h:'Fase Inversa RP-HPLC', t:'Sistema più usato. <strong>Fase stazionaria</strong>: silice modificata con catene apolari C18 (octadecil) o C8 (octil). <strong>Fase mobile</strong>: H₂O/ACN o H₂O/MeOH.<br>Eluizione:<br>• <strong>Isocratica</strong>: composizione costante<br>• <strong>Gradiente</strong>: % organico aumenta nel tempo<br><strong>Forza eluotropica</strong> ↑ con % solvente organico. Composti più apolari → più ritenuti (eluiscono dopo).'},
      {h:'Componenti HPLC', t:'1. <strong>Serbatoi solventi</strong> con degassatore<br>2. <strong>Pompe reciprocanti a pistone</strong>: flusso costante 0.1–10 mL/min, pressioni 5–400 bar (UHPLC fino a 1300 bar)<br>3. <strong>Iniettore</strong> a loop (20–100 μL)<br>4. <strong>Colonna</strong>: acciaio inox, 15–25 cm × 4.6 mm, silice C18 3–5 μm<br>5. <strong>Rivelatore</strong>: UV/Vis (più comune), DAD, RI, fluorescenza, MS<br>6. <strong>Sistema dati</strong>'},
      {h:'Rivelatori HPLC', t:'<strong>UV/Vis</strong> (fisso, 254 nm): semplice, ma serve gruppo cromoforo<br><strong>DAD</strong> (Diode Array Detector): registra spettro completo 200-800 nm in tempo reale, utile per identificazione/purezza picchi<br><strong>RI</strong> (Refractive Index): universale, non sensibile, non compatibile con gradiente<br><strong>Fluorescenza</strong>: selettivo, molto sensibile (10⁻¹⁰ g)<br><strong>MS</strong> (LC-MS): identificazione strutturale<br>Sensibilità tipica HPLC: 10⁻⁸–10⁻¹⁰ g/mL'},
    ]
  },
  {
    id: 'spatt',
    title: 'Spettroscopia Atomica',
    icon: '⚡',
    items: [
      {h:'AES - Spettroscopia di Emissione', t:'<strong>A* → A + hν</strong>: l\'analita atomizzato emette luce alla lunghezza d\'onda caratteristica.<br>Sorgenti di eccitazione:<br>• <strong>Fiamma</strong> (2000–3000 K): solo elementi facili da eccitare<br>• <strong>ICP</strong> (Inductively Coupled Plasma, Ar, 6000–10000 K): multi-elemento, limiti rilevazione ppb<br>• <strong>Arco/scintilla</strong> (4000–7000 K): solidi<br><strong>Autoassorbimento</strong>: atomi non eccitati assorbono la radiazione emessa, curva non più lineare ad alte concentrazioni.'},
      {h:'AAS - Assorbimento Atomico', t:'<strong>A + hν → A*</strong>: legge di Lambert-Beer: <strong>A = ε·b·c</strong>.<br>Sorgente: <strong>lampada a catodo cavo</strong> (HCL) specifica per elemento.<br>Atomizzatori:<br>• <strong>Fiamma</strong> (C₂H₂/aria 2300 K, C₂H₂/N₂O 2900 K): ppm<br>• <strong>Fornetto di grafite (ETA-AAS)</strong>: 2000–2700 K, 5 stadi (essiccamento, ceneraz., atomizz., pulizia, raffreddam.), ppt<br>Correzione background: <strong>deuterio</strong> o <strong>Zeeman</strong>'},
      {h:'ICP-MS', t:'<strong>ICP accoppiato a spettrometro di massa</strong>: sensibilità sub-ppt (10⁻¹⁵ g/mL), multi-elemento simultaneo, analisi isotopica.<br>Principio: il plasma ICP atomizza e ionizza, gli ioni vengono separati per m/z nello spettrometro di massa (quadrupolo, time-of-flight, doppia focalizzazione).<br><strong>Interferenze poliatomiche</strong>: es. ⁴⁰Ar¹⁶O⁺ (m/z=56) interferisce con ⁵⁶Fe⁺<br><strong>Correzione</strong>: cella di collisione/reazione (DRC con NH₃ o He), risoluzione alta, standard interno (¹⁰³Rh, ¹⁸⁵Re).'},
    ]
  },
  {
    id: 'elett',
    title: 'Elettrochimica',
    icon: '🔋',
    items: [
      {h:'Equazione di Nernst', t:'<strong>E = E° − (RT/nF)·ln(Q)</strong><br>A 25°C: <strong>E = E° − (0.05916/n)·log(Q)</strong><br>Per una semireazione Ox + ne⁻ → Red:<br>E = E° + (0.05916/n)·log([Ox]/[Red])<br>Elettrodi di riferimento:<br>• <strong>NHE</strong> (Standard Hydrogen): E = 0.000 V (definizione)<br>• <strong>SCE</strong> (Calomelano saturo): +0.241 V vs NHE<br>• <strong>Ag/AgCl</strong> (KCl sat.): +0.197 V vs NHE'},
      {h:'ISE - Elettrodi Iono-Selettivi', t:'<strong>Membrana selettiva per uno ione</strong>. Potenziale dipende da attività ionica.<br>• <strong>Vetro pH</strong>: SiO₂·Na₂O·CaO, selettivo per H⁺. Errore alcalino a pH&gt;11 (Na⁺).<br>• <strong>Fluoruro</strong>: cristallo LaF₃ drogato Eu²⁺. Range 10⁻¹–10⁻⁶ M.<br>• <strong>Calcio</strong>: scambiatore liquido<br>Curva di calibrazione: E vs log(a), pendenza ideale <strong>±59.16/z mV/decade</strong> a 25°C (Nernst).<br><strong>TISAB</strong> (Total Ionic Strength Adjustment Buffer): mantiene forza ionica costante.'},
      {h:'Voltammetria', t:'Misura corrente (i) vs potenziale applicato (E). Corrente di diffusione (Fick): <strong>id = nFADC/δ</strong>.<br><strong>Polarografia classica</strong>: elettrodo a goccia di mercurio (DME). Limitata da corrente capacitiva.<br><strong>ASV</strong> (Anodic Stripping Voltammetry): preconcentrazione (riduzione del metallo nel mercurio) + spazzamento anodico (ossidazione). Sensibilità ppb per metalli pesanti (Pb, Cd, Cu, Zn).<br><strong>Voltammetria ciclica</strong>: caratterizzazione coppie redox. <strong>ip = 0.4463·n·F·A·C·√(nFDv/RT)</strong> (eq. Randles-Sevcik a 25°C: ip = 2.69×10⁵·n^(3/2)·A·D^(1/2)·C·v^(1/2))'},
    ]
  },
];

export default {
  async render(container) {
    container.innerHTML = `
      <div class="section-title">📚 Chimica Analitica II — Appunti Di Nunno</div>

      <div class="panel">
        <div class="pb" style="font-size:.88rem;color:var(--text2)">
          📖 Contenuti tratti dagli appunti "Chimica Analitica II" di Daniele Di Nunno (263 pagine).
          Per il PDF completo, carica il file nella sezione 📁 File Manager.
        </div>
      </div>

      <div class="tabs" id="an-tabs"></div>
      <div id="an-content"></div>
    `;

    const tabsEl = document.getElementById('an-tabs');
    const content = document.getElementById('an-content');

    let active = CHAPTERS[0].id;

    function renderTabs() {
      tabsEl.innerHTML = CHAPTERS.map(c =>
        `<button class="tab ${c.id===active?'active':''}" data-id="${c.id}">${c.icon} ${c.title}</button>`
      ).join('');
      tabsEl.querySelectorAll('.tab').forEach(b => {
        b.onclick = () => { active = b.dataset.id; renderTabs(); renderContent(); };
      });
    }

    function renderContent() {
      const ch = CHAPTERS.find(c => c.id === active);
      content.innerHTML = ch.items.map(item => `
        <div class="panel">
          <div class="ph">${item.h}</div>
          <div class="pb">${item.t}</div>
        </div>
      `).join('');
    }

    renderTabs();
    renderContent();
  }
};
