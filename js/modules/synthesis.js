// Synthesis module — Reazioni organiche
'use strict';

const REACTIONS = [
  {cat:'Sostituzioni nucleofile', items:[
    {n:'SN1', cond:'Substrato 3°, solvente polare protico, nucleofili deboli', mech:'Carbocatione intermedio, racemizzazione', ex:'tBuBr + H2O → tBuOH + HBr'},
    {n:'SN2', cond:'Substrato 1°/2°, solvente polare aprotico, nucleofili forti', mech:'Stato di transizione concertato, inversione di Walden', ex:'CH3Br + OH- → CH3OH + Br-'},
    {n:'Williamson', cond:'Alcossido + alogenuro primario', mech:'SN2 classica per eteri', ex:'CH3O- + CH3CH2Br → CH3OCH2CH3'},
    {n:'Mitsunobu', cond:'DEAD/DIAD + PPh3 + Nu acido', mech:'Attiva OH come gruppo uscente, inversione', ex:'ROH + R\'COOH → R\'COOR (inv.)'},
  ]},
  {cat:'Eliminazioni', items:[
    {n:'E1', cond:'Substrato 3°, base debole, solvente polare', mech:'Carbocatione poi perdita H+', ex:'tBuBr → isobutene'},
    {n:'E2', cond:'Substrato 1°/2°/3°, base forte ingombrata (tBuOK)', mech:'Concertata, anti-periplanare', ex:'CH3CH2Br + EtO- → CH2=CH2'},
    {n:'Hofmann vs Zaitsev', cond:'Base ingombrata = Hofmann (meno sost.), piccola = Zaitsev (più sost.)', mech:'Regio-selettività', ex:'2-bromobutano + tBuOK → 1-butene'},
  ]},
  {cat:'Addizioni elettrofile (alcheni)', items:[
    {n:'Idroalogenazione (HX)', cond:'Markovnikov, ROOR inverte (anti-M)', mech:'Carbocatione → H+ allo C meno sostituito', ex:'CH3CH=CH2 + HBr → CH3CHBrCH3'},
    {n:'Idratazione acida', cond:'H2O, H2SO4', mech:'Markovnikov', ex:'CH2=CH2 + H2O/H+ → CH3CH2OH'},
    {n:'Idroborazione-ossidazione', cond:'BH3·THF poi H2O2/NaOH', mech:'Anti-Markovnikov, syn', ex:'RCH=CH2 → RCH2CH2OH'},
    {n:'Ossimercuriazione', cond:'Hg(OAc)2/H2O poi NaBH4', mech:'Markovnikov, no riarrangiamenti', ex:'RCH=CH2 → RCH(OH)CH3'},
    {n:'Bromurazione', cond:'Br2 in CCl4', mech:'Anti, intermedio bromonio', ex:'cis-2-butene + Br2 → (±)-2,3-dibromobutano'},
    {n:'Diidrossilazione', cond:'OsO4 o KMnO4 freddo', mech:'Syn, cis-diolo', ex:'CH2=CH2 + OsO4 → HOCH2CH2OH'},
    {n:'Epossidazione', cond:'mCPBA o RCO3H', mech:'Syn, epossido', ex:'alchene + mCPBA → epossido'},
    {n:'Ozonolisi', cond:'O3 poi Zn/AcOH o Me2S', mech:'Taglio C=C → aldeidi/chetoni', ex:'R2C=CR2 → 2 R2C=O'},
  ]},
  {cat:'Reazioni aromatiche (EAS)', items:[
    {n:'Nitrazione', cond:'HNO3/H2SO4', mech:'NO2+ elettrofilo', ex:'C6H6 → C6H5NO2'},
    {n:'Solfonazione', cond:'SO3/H2SO4 conc.', mech:'SO3 → reversibile', ex:'C6H6 → C6H5SO3H'},
    {n:'Alogenazione', cond:'X2/FeX3', mech:'X+ generato da Lewis acid', ex:'C6H6 + Br2/FeBr3 → C6H5Br'},
    {n:'Friedel-Crafts alchilazione', cond:'RX/AlCl3', mech:'Carbocatione (riarrang. possibile)', ex:'C6H6 + EtCl/AlCl3 → C6H5Et'},
    {n:'Friedel-Crafts acilazione', cond:'RCOCl/AlCl3', mech:'Acilio +, no riarrang.', ex:'C6H6 + AcCl/AlCl3 → PhCOCH3'},
    {n:'Direttori di gruppo', cond:'OH,NH2,OR: orto/para attivanti; NO2,SO3H,COR,COOH: meta disattivanti; X: orto/para disattivanti', mech:'Effetto induttivo + risonanza', ex:''},
  ]},
  {cat:'Reazioni di carbonili (C=O)', items:[
    {n:'Addizione cianidrica', cond:'NaCN o KCN, H+', mech:'Cianidrina (CN- nucleofilo)', ex:'RCHO + HCN → RCH(OH)CN'},
    {n:'Reazione di Grignard', cond:'RMgX in etere anidro', mech:'R- attacca C=O → alcol', ex:'CH3MgBr + acetone → tBuOH'},
    {n:'Riduzione (NaBH4, LiAlH4)', cond:'NaBH4: aldeidi/chetoni; LiAlH4: anche esteri/acidi/ammidi', mech:'H- nucleofilo', ex:'RCHO → RCH2OH'},
    {n:'Ossidazione aldeidi', cond:'KMnO4, K2Cr2O7, Ag(NH3)2+ (Tollens)', mech:'Aldeide → acido carbossilico', ex:'RCHO → RCOOH'},
    {n:'Formazione emiacetali/acetali', cond:'ROH/H+', mech:'Aldeide + 2 ROH → acetale + H2O', ex:'RCHO + 2 R\'OH → RCH(OR\')2'},
    {n:'Imine (basi di Schiff)', cond:'NH primaria, eliminazione H2O', mech:'Carbinolammina → imina', ex:'RCHO + R\'NH2 → R-CH=N-R\''},
    {n:'Wolff-Kishner', cond:'H2N-NH2, KOH, calore', mech:'Riduce C=O a CH2', ex:'PhCOCH3 → PhCH2CH3'},
    {n:'Clemmensen', cond:'Zn(Hg), HCl', mech:'Riduce C=O a CH2 (ambiente acido)', ex:'C6H5COR → C6H5CH2R'},
    {n:'Reazione aldolica', cond:'Base (NaOH, LDA)', mech:'Enolato + carbonile', ex:'2 RCH2CHO → RCH(OH)CH(R)CHO'},
    {n:'Cannizzaro', cond:'NaOH conc., aldeide senza H-α', mech:'Disproporzionamento', ex:'2 HCHO → CH3OH + HCOO-'},
  ]},
  {cat:'Esterificazione e amidazione', items:[
    {n:'Esterificazione di Fischer', cond:'ROH + RCOOH, H+ cat.', mech:'Equilibrio reversibile', ex:'RCOOH + R\'OH → RCOOR\' + H2O'},
    {n:'Cloruri acilici via SOCl2', cond:'RCOOH + SOCl2 → RCOCl', mech:'Acido → cloruro più reattivo', ex:'CH3COOH + SOCl2 → CH3COCl'},
    {n:'Sintesi ammidi', cond:'Cloruro acilico + ammina', mech:'Sostituzione nucleofila acilica', ex:'RCOCl + R\'NH2 → RCONHR\''},
    {n:'Saponificazione', cond:'Estere + NaOH → carbossilato', mech:'Idrolisi basica irreversibile', ex:'RCOOR\' + OH- → RCOO- + R\'OH'},
    {n:'Riduzione esteri (LAH)', cond:'LiAlH4 in etere', mech:'Estere → 2 alcoli', ex:'RCOOR\' → RCH2OH + R\'OH'},
  ]},
  {cat:'Reazioni radicaliche', items:[
    {n:'Alogenazione radicalica', cond:'X2, luce/calore (Δ, hν)', mech:'Iniziazione/propag./terminaz.', ex:'CH4 + Cl2 → CH3Cl'},
    {n:'NBS allilica', cond:'NBS, CCl4, hν', mech:'Bromura selettivamente posiz. allilica', ex:'cicloesene + NBS → 3-bromocicloesene'},
    {n:'Polimerizzazione radicalica', cond:'Iniziatore (BPO, AIBN)', mech:'Catena radicalica', ex:'CH2=CH2 → polietilene'},
  ]},
  {cat:'Reazioni di accoppiamento', items:[
    {n:'Suzuki-Miyaura', cond:'Pd(PPh3)4, ArB(OH)2, base', mech:'Cross-coupling C-C', ex:'Ar-X + Ar\'B(OH)2 → Ar-Ar\''},
    {n:'Heck', cond:'Pd(0), alchene, base', mech:'Coupling vinilico', ex:'Ar-X + CH2=CHR → Ar-CH=CHR'},
    {n:'Negishi', cond:'Pd, organozinco', mech:'Cross-coupling versatile', ex:'Ar-X + R-ZnX → Ar-R'},
    {n:'Sonogashira', cond:'Pd, Cu, alchino, base', mech:'Coupling con alchini', ex:'Ar-X + HC≡CR → Ar-C≡CR'},
    {n:'Stille', cond:'Pd, stannano', mech:'Pdriduzione+ transmetallaz.', ex:'Ar-X + R-SnR3 → Ar-R'},
  ]},
  {cat:'Cicloaddizioni', items:[
    {n:'Diels-Alder [4+2]', cond:'Diene + dienofilo, calore', mech:'Concertata, suprafaciale, stereospec.', ex:'Butadiene + maleato → cicloesene'},
    {n:'Reazione di Cope [3,3]', cond:'Sigmatropico [3,3]', mech:'Trasposizione concertata', ex:'1,5-esadiene → 1,5-esadiene riarrangiato'},
    {n:'Claisen', cond:'Allil vinil etere, riarrangiamento', mech:'[3,3]-sigmatropico', ex:'CH2=CHOCH2CH=CH2 → 4-pentenale'},
  ]},
  {cat:'Reazioni di amminoacidi', items:[
    {n:'Sintesi di Strecker', cond:'NH3 + HCN + RCHO', mech:'α-amminonitrile poi idrolisi', ex:'RCHO + NH3 + HCN → α-amminoacido'},
    {n:'Sintesi di Gabriel', cond:'Ftalimmide + RX', mech:'Sostituzione SN2 → amm. primaria', ex:'Ftalimmide-K + RX → Ftal-NR poi H2N-R'},
    {n:'Edman degradation', cond:'PITC, TFA', mech:'Sequenziamento N-terminale', ex:'Peptide → fenil-tioidantoina aminoacido'},
  ]},
  {cat:'Carboidrati', items:[
    {n:'Glicosilazione di Koenigs-Knorr', cond:'Br-glicosile + Ag2O/HgCl2 + ROH', mech:'Forma legame glicosidico α/β', ex:'Glucosio-Br + MeOH → α-glucoside'},
    {n:'Mutarotazione', cond:'Aldoso in soluzione', mech:'Equilibrio α/β anomeri via forma aperta', ex:'α-D-glucosio ⇌ β-D-glucosio'},
    {n:'Reazione di Fehling/Benedict', cond:'Cu2+ alcalino', mech:'Zuccheri riducenti → Cu2O rosso', ex:'Glucosio + Cu(OH)2 → Cu2O'},
  ]},
];

export default {
  async render(container) {
    container.innerHTML = `
      <div class="section-title">🧪 Sintesi Organica — ${REACTIONS.reduce((s,c)=>s+c.items.length,0)} reazioni</div>

      <div class="panel">
        <div class="pb">
          <input type="search" id="rxn-search" placeholder="Cerca: SN2, Markovnikov, Grignard, Diels-Alder..." style="width:100%">
        </div>
      </div>

      <div id="rxn-list"></div>
    `;

    const search = document.getElementById('rxn-search');
    const list = document.getElementById('rxn-list');

    const render = () => {
      const q = search.value.toLowerCase().trim();
      list.innerHTML = REACTIONS.map(cat => {
        const items = q
          ? cat.items.filter(i =>
              i.n.toLowerCase().includes(q) ||
              i.cond.toLowerCase().includes(q) ||
              i.mech.toLowerCase().includes(q) ||
              i.ex.toLowerCase().includes(q))
          : cat.items;
        if(!items.length && q) return '';
        return `
          <div class="panel">
            <div class="ph">⚗️ ${cat.cat}</div>
            <div class="pb" style="padding:0">
              ${items.map(item => `
                <details style="border-top:1px solid var(--g100);padding:10px 16px">
                  <summary style="cursor:pointer;font-weight:700;color:var(--g900);list-style:none">▸ ${item.n}</summary>
                  <div style="padding:10px 0;font-size:.88rem;line-height:1.7">
                    <div><strong>Condizioni:</strong> ${item.cond}</div>
                    <div style="margin-top:6px"><strong>Meccanismo:</strong> ${item.mech}</div>
                    ${item.ex ? `<div style="margin-top:6px"><strong>Esempio:</strong> <code style="background:var(--g50);padding:2px 6px;border-radius:4px">${item.ex}</code></div>` : ''}
                  </div>
                </details>
              `).join('')}
            </div>
          </div>
        `;
      }).join('') || '<div class="empty-state"><h3>Nessuna reazione trovata</h3></div>';
    };

    search.oninput = render;
    render();
  }
};
