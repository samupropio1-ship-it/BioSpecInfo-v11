/* ═══════════════════════════════════════════════════════════════════════
   bsi-bio-lab3d-dati.js — 🧬 Biochimica 3D Lab: i dati e i modelli (v264)
   BioSpecInfo · © Samuele Pio Provenzano

   Quattro cose, tutte verificabili dal banco test_biolab3d senza browser:

   1. VIE — otto vie metaboliche passo per passo (glicolisi, PDH, Krebs,
      β-ossidazione, gluconeogenesi, sintesi degli acidi grassi, ciclo
      dell'urea), ogni passo con enzima, classe EC, cofattori, ΔG°′,
      reversibilità, regolazione e — soprattutto — i CARBONI: ogni carbonio
      ha una chiave che resta la stessa da un passo all'altro (g1…g6 sono i
      carboni del glucosio, a1/a2 quelli dell'acetile, o1…o4 quelli
      dell'ossalacetato), così il 3D può seguirli e il banco può pretendere
      che nessun carbonio nasca o sparisca: quelli che escono escono come
      CO₂, quelli che entrano entrano come HCO₃⁻ o CO₂.
   2. CAPITOLI — i 12 capitoli della dispensa d'esame dell'autore
      (Biochimica, «definitivo mese»): sintesi, perché, errori da non dire,
      domande del professore, risposta da dare all'orale.
   3. MODELLI — Michaelis–Menten con i quattro inibitori reversibili e la
      cinetica allosterica (Hill); l'ossigrafo (elettrodo di Clark) con
      ADP, oligomicina, disaccoppiante e cianuro; il rotore dell'ATP
      sintasi (c-anello di 8 subunità nell'uomo: 8 H⁺ per giro, 3 ATP per
      giro); i conti degli ATP (C8 = 50, palmitato = 106, glucosio 30–32).
   4. REGOLATI — la tabella del capitolo 12 per il quiz.

   ONESTA': le strutture nel 3D sono SCHEMI A CATENA APERTA (si leggono i
   carboni, non la conformazione); i ΔG°′ sono quelli della dispensa
   (Lehninger); l'ossigrafo è un MODELLO qualitativo con numeri
   INDICATIVI; il rapporto H⁺/ATP viene dalla geometria del rotore
   (c/3 + 1 per il trasporto di Pᵢ e ADP).
   ═══════════════════════════════════════════════════════════════════════ */
(function (g) {
  'use strict';

  /* ═══ 1 · molecole: «chiave|gruppo|bandiere» ══════════════════════════════
     bandiere: P = fosfato sul carbonio · ^k = ramo attaccato al carbonio k
     · S N R = zolfo, azoto, «resto» (CoA, TPP, ACP, Lys…: non è un carbonio) */
  function mol(it, en, atomi) {
    return { nome: [it, en], atomi: atomi.map(function (s) {
      var p = s.split('|'), f = p[2] || '', a = { k: p[0], g: p[1] || '', el: 'C', P: false, su: null };
      f.split(',').forEach(function (b) { if (b === 'P') a.P = true; else if (b === 'S' || b === 'N' || b === 'R') a.el = b; else if (b.charAt(0) === '^') a.su = b.slice(1); });
      return a;
    }) };
  }
  /* glicolisi: carboni del glucosio g1…g6, poi i triosi t1 (C3·C4) t2 (C2·C5) t3 (C1·C6) */
  var GLC = mol('Glucosio', 'Glucose', ['g1|CHO', 'g2|CHOH', 'g3|CHOH', 'g4|CHOH', 'g5|CHOH', 'g6|CH₂OH']);
  var G6P = mol('Glucosio-6-P', 'Glucose 6-P', ['g1|CHO', 'g2|CHOH', 'g3|CHOH', 'g4|CHOH', 'g5|CHOH', 'g6|CH₂O|P']);
  var F6P = mol('Fruttosio-6-P', 'Fructose 6-P', ['g1|CH₂OH', 'g2|C=O', 'g3|CHOH', 'g4|CHOH', 'g5|CHOH', 'g6|CH₂O|P']);
  var F16 = mol('Fruttosio-1,6-bisP', 'Fructose 1,6-bisP', ['g1|CH₂O|P', 'g2|C=O', 'g3|CHOH', 'g4|CHOH', 'g5|CHOH', 'g6|CH₂O|P']);
  var DHAP = mol('DHAP', 'DHAP', ['g1|CH₂O|P', 'g2|C=O', 'g3|CH₂OH']);
  var GAPb = mol('Gliceraldeide-3-P', 'Glyceraldehyde 3-P', ['g4|CHO', 'g5|CHOH', 'g6|CH₂O|P']);
  var GAPa = mol('Gliceraldeide-3-P', 'Glyceraldehyde 3-P', ['g3|CHO', 'g2|CHOH', 'g1|CH₂O|P']);
  var GAP = mol('Gliceraldeide-3-P (×2)', 'Glyceraldehyde 3-P (×2)', ['t1|CHO', 't2|CHOH', 't3|CH₂O|P']);
  var BPG = mol('1,3-bisfosfoglicerato', '1,3-bisphosphoglycerate', ['t1|C(=O)O|P', 't2|CHOH', 't3|CH₂O|P']);
  var PG3 = mol('3-fosfoglicerato', '3-phosphoglycerate', ['t1|COO⁻', 't2|CHOH', 't3|CH₂O|P']);
  var PG2 = mol('2-fosfoglicerato', '2-phosphoglycerate', ['t1|COO⁻', 't2|CHO|P', 't3|CH₂OH']);
  var PEP = mol('Fosfoenolpiruvato', 'Phosphoenolpyruvate', ['t1|COO⁻', 't2|C–O|P', 't3|=CH₂']);
  var PIR = mol('Piruvato', 'Pyruvate', ['t1|COO⁻', 't2|C=O', 't3|CH₃']);
  /* PDH */
  var TPP = mol('TPP (E1)', 'TPP (E1)', ['TPP|TPP|R']);
  var HETPP = mol('Idrossietil-TPP', 'Hydroxyethyl-TPP', ['TPP|TPP|R', 't2|C–OH', 't3|CH₃']);
  var LIP = mol('Lipoamide (E2)', 'Lipoamide (E2)', ['Lip|Lys–lipoile|R', 'S1|S|S', 'S2|S|S']);
  var ACLIP = mol('Acetil-diidrolipoamide', 'Acetyl-dihydrolipoamide', ['Lip|Lys–lipoile|R', 'S2|SH|S', 'S1|S|S', 't2|C=O', 't3|CH₃']);
  var COA = mol('CoA-SH', 'CoA-SH', ['CoA|CoA|R', 'Sc|SH|S']);
  var ACCOA_P = mol('Acetil-CoA', 'Acetyl-CoA', ['CoA|CoA|R', 'Sc|S|S', 't2|C=O', 't3|CH₃']);
  var DHLIP = mol('Diidrolipoamide', 'Dihydrolipoamide', ['Lip|Lys–lipoile|R', 'S1|SH|S', 'S2|SH|S']);
  /* Krebs: acetile a1 (carbonile) a2 (metile), ossalacetato o1…o4 */
  var ACCOA = mol('Acetil-CoA', 'Acetyl-CoA', ['CoA|CoA|R', 'Sc|S|S', 'a1|C=O', 'a2|CH₃']);
  var OAA = mol('Ossalacetato', 'Oxaloacetate', ['o1|COO⁻', 'o2|C=O', 'o3|CH₂', 'o4|COO⁻']);
  var CIT = mol('Citrato', 'Citrate', ['a1|COO⁻', 'a2|CH₂', 'o2|C–OH', 'o3|CH₂', 'o4|COO⁻', 'o1|COO⁻|^o2']);
  var ISO = mol('Isocitrato', 'Isocitrate', ['a1|COO⁻', 'a2|CH₂', 'o2|CH', 'o3|CHOH', 'o4|COO⁻', 'o1|COO⁻|^o2']);
  var AKG = mol('α-chetoglutarato', 'α-ketoglutarate', ['a1|COO⁻', 'a2|CH₂', 'o2|CH₂', 'o3|C=O', 'o4|COO⁻']);
  var SUCOA = mol('Succinil-CoA', 'Succinyl-CoA', ['a1|COO⁻', 'a2|CH₂', 'o2|CH₂', 'o3|C=O', 'Sc|S|S', 'CoA|CoA|R']);
  var SUC = mol('Succinato', 'Succinate', ['a1|COO⁻', 'a2|CH₂', 'o2|CH₂', 'o3|COO⁻']);
  var FUM = mol('Fumarato', 'Fumarate', ['a1|COO⁻', 'a2|=CH', 'o2|=CH', 'o3|COO⁻']);
  var MAL = mol('L-malato', 'L-malate', ['a1|COO⁻', 'a2|CH₂', 'o2|CHOH', 'o3|COO⁻']);
  var OAA2 = mol('Ossalacetato (nuovo giro)', 'Oxaloacetate (next turn)', ['a1|COO⁻', 'a2|CH₂', 'o2|C=O', 'o3|COO⁻']);
  /* β-ossidazione di un acil-CoA: R = il resto della catena */
  var ACIL = mol('Ottanoil-CoA (C8)', 'Octanoyl-CoA (C8)', ['R|C₅H₁₁–|R', 'b|CH₂', 'a|CH₂', 'c1|C=O', 'Sx|S|S', 'CoA|CoA|R']);
  var ENOIL = mol('trans-Δ²-enoil-CoA', 'trans-Δ²-enoyl-CoA', ['R|C₅H₁₁–|R', 'b|=CH', 'a|=CH', 'c1|C=O', 'Sx|S|S', 'CoA|CoA|R']);
  var IDROSSI = mol('L-β-idrossiacil-CoA', 'L-β-hydroxyacyl-CoA', ['R|C₅H₁₁–|R', 'b|CHOH', 'a|CH₂', 'c1|C=O', 'Sx|S|S', 'CoA|CoA|R']);
  var CHETO = mol('β-chetoacil-CoA', 'β-ketoacyl-CoA', ['R|C₅H₁₁–|R', 'b|C=O', 'a|CH₂', 'c1|C=O', 'Sx|S|S', 'CoA|CoA|R']);
  var ESA = mol('Esanoil-CoA (C6)', 'Hexanoyl-CoA (C6)', ['R|C₅H₁₁–|R', 'b|C=O', 'Sy|S|S', 'CoA2|CoA|R']);
  var ACB = mol('Acetil-CoA', 'Acetyl-CoA', ['a|CH₃', 'c1|C=O', 'Sx|S|S', 'CoA|CoA|R']);
  var COA2 = mol('CoA-SH', 'CoA-SH', ['CoA2|CoA|R', 'Sy|SH|S']);
  /* gluconeogenesi: x1 è il carbonio della CO₂ aggiunta e poi tolta */
  var OAAg = mol('Ossalacetato', 'Oxaloacetate', ['t1|COO⁻', 't2|C=O', 't3|CH₂', 'x1|COO⁻']);
  /* sintesi degli acidi grassi: innesco p1/p2, malonile a1/a2/m1 */
  var ACCOAs = mol('Acetil-CoA', 'Acetyl-CoA', ['CoA|CoA|R', 'Sc|S|S', 'a1|C=O', 'a2|CH₃']);
  var MALCOA = mol('Malonil-CoA', 'Malonyl-CoA', ['CoA|CoA|R', 'Sc|S|S', 'a1|C=O', 'a2|CH₂', 'm1|COO⁻']);
  var ACACP = mol('Acetil-ACP (innesco)', 'Acetyl-ACP (primer)', ['ACP|ACP|R', 'Sp|S|S', 'p1|C=O', 'p2|CH₃']);
  var MALACP = mol('Malonil-ACP', 'Malonyl-ACP', ['ACP2|ACP|R', 'Sm|S|S', 'a1|C=O', 'a2|CH₂', 'm1|COO⁻']);
  var AAACP = mol('Acetoacetil-ACP', 'Acetoacetyl-ACP', ['ACP2|ACP|R', 'Sm|S|S', 'a1|C=O', 'a2|CH₂', 'p1|C=O', 'p2|CH₃']);
  var DIDR = mol('D-β-idrossibutirril-ACP', 'D-β-hydroxybutyryl-ACP', ['ACP2|ACP|R', 'Sm|S|S', 'a1|C=O', 'a2|CH₂', 'p1|CHOH', 'p2|CH₃']);
  var CROT = mol('Crotonil-ACP (trans)', 'Crotonyl-ACP (trans)', ['ACP2|ACP|R', 'Sm|S|S', 'a1|C=O', 'a2|=CH', 'p1|=CH', 'p2|CH₃']);
  var BUT = mol('Butirril-ACP (C4)', 'Butyryl-ACP (C4)', ['ACP2|ACP|R', 'Sm|S|S', 'a1|C=O', 'a2|CH₂', 'p1|CH₂', 'p2|CH₃']);
  var ACPv = mol('ACP libero', 'Free ACP', ['ACP|ACP|R', 'Sp|SH|S']);
  /* urea: cU = il carbonio del bicarbonato, n1 = NH₄⁺, n2 = l'azoto dell'aspartato */
  var CARB = mol('Carbamil fosfato', 'Carbamoyl phosphate', ['n1|H₂N|N', 'cU|C=O|P']);
  var ORN = mol('Ornitina', 'Ornithine', ['Orn|Orn|R', 'nd|NH₂|N']);
  var CITR = mol('Citrullina', 'Citrulline', ['Orn|Orn|R', 'nd|NH|N', 'cU|C=O', 'n1|NH₂|N']);
  var ASP = mol('Aspartato', 'Aspartate', ['Asp|Asp|R', 'n2|NH₂|N']);
  var AS = mol('Argininosuccinato', 'Argininosuccinate', ['Orn|Orn|R', 'nd|NH|N', 'cU|C', 'n1|NH₂|N', 'n2|=N|N,^cU', 'Asp|succ.|R,^n2']);
  var ARG = mol('Arginina', 'Arginine', ['Orn|Orn|R', 'nd|NH|N', 'cU|C', 'n1|NH₂|N', 'n2|=NH₂⁺|N,^cU']);
  var FUMu = mol('Fumarato → Krebs', 'Fumarate → Krebs', ['Asp|fumarato|R']);
  var UREA = mol('Urea', 'Urea', ['n1|H₂N|N', 'cU|C=O', 'n2|NH₂|N']);
  var ORN2 = mol('Ornitina (rientra)', 'Ornithine (back in)', ['Orn|Orn|R', 'nd|NH₂|N']);

  /* ═══ 2 · le vie, passo per passo ═══════════════════════════════════════
     in/out: gettoni che entrano ed escono («2 ATP» vale due); volte: quante
     volte avviene per glucosio (le reazioni 6–10 della glicolisi: 2). */
  var CL = { ox: ['ossidoreduttasi (EC 1)', 'oxidoreductase (EC 1)'], tr: ['transferasi (EC 2)', 'transferase (EC 2)'], id: ['idrolasi (EC 3)', 'hydrolase (EC 3)'], li: ['liasi (EC 4)', 'lyase (EC 4)'], is: ['isomerasi (EC 5)', 'isomerase (EC 5)'], lg: ['ligasi (EC 6)', 'ligase (EC 6)'] };
  function P(o) { o.in = o.in || []; o.out = o.out || []; o.mod = o.mod || []; o.volte = o.volte || 1; return o; }
  var VIE = [
    { id: 'glicolisi', nome: ['Glicolisi', 'Glycolysis'], dove: ['citosol di tutte le cellule', 'cytosol of every cell'], cap: 3, sezione: 'sglic',
      bilancio: ['glucosio + 2 NAD⁺ + 2 ADP + 2 Pᵢ → 2 piruvato + 2 NADH + 2 H⁺ + 2 ATP + 2 H₂O · ΔG′° ≈ −85 kJ/mol', 'glucose + 2 NAD⁺ + 2 ADP + 2 Pᵢ → 2 pyruvate + 2 NADH + 2 H⁺ + 2 ATP + 2 H₂O · ΔG′° ≈ −85 kJ/mol'],
      passi: [
        P({ n: 1, enz: ['Esochinasi (fegato: glucochinasi)', 'Hexokinase (liver: glucokinase)'], cl: 'tr', cof: 'Mg²⁺', dG: -16.7, rev: false, reg: true, prima: [GLC], dopo: [G6P], in: ['ATP'], out: ['ADP'], mod: ['g6'],
          car: ['Il fosfato si lega all\'ossigeno del C6.', 'The phosphate binds the oxygen on C6.'],
          come: ['L\'–OH del C6 attacca il fosfato γ dell\'ATP. L\'enzima si chiude sul glucosio (adattamento indotto) ed esclude l\'acqua, così non idrolizza l\'ATP. Il G6P è carico: resta intrappolato nella cellula.', 'The C6 –OH attacks the γ phosphate of ATP. The enzyme closes on glucose (induced fit) and excludes water, so it does not hydrolyse ATP. G6P is charged: it is trapped in the cell.'] }),
        P({ n: 2, enz: ['Fosfoglucosio isomerasi', 'Phosphoglucose isomerase'], cl: 'is', cof: 'Mg²⁺', dG: 1.7, rev: true, prima: [G6P], dopo: [F6P], mod: ['g1', 'g2'],
          car: ['Il C1 aldeidico diventa –CH₂OH, il C2 diventa chetonico.', 'The aldehyde C1 becomes –CH₂OH, C2 becomes a ketone.'],
          come: ['Apre l\'anello e sposta un protone fra C1 e C2 passando per un enediolo. Serve un C1 libero da fosforilare e un chetone in C2 che permetterà di spezzare la molecola in due metà uguali.', 'Opens the ring and moves a proton between C1 and C2 through an enediol. It frees C1 for phosphorylation and puts a ketone on C2 so the molecule can split into two equal halves.'] }),
        P({ n: 3, enz: ['Fosfofruttochinasi-1 (PFK-1)', 'Phosphofructokinase-1 (PFK-1)'], cl: 'tr', cof: 'Mg²⁺', dG: -14.2, rev: false, reg: true, prima: [F6P], dopo: [F16], in: ['ATP'], out: ['ADP'], mod: ['g1'],
          car: ['Il fosfato si lega al C1: un fosfato per ogni estremità.', 'The phosphate binds C1: one phosphate at each end.'],
          come: ['Come la reazione 1. È la tappa di impegno: da qui lo zucchero è destinato alla glicolisi. La PFK-1 è allosterica (sigmoide) ed è il principale punto di controllo: + AMP, ADP, F-2,6-BP; − ATP, citrato, H⁺.', 'Like reaction 1. The committed step: from here the sugar is bound for glycolysis. PFK-1 is allosteric (sigmoid) and the main control point: + AMP, ADP, F-2,6-BP; − ATP, citrate, H⁺.'] }),
        P({ n: 4, enz: ['Aldolasi', 'Aldolase'], cl: 'li', cof: '—', dG: 23.8, rev: true, prima: [F16], dopo: [DHAP, GAPb], mod: ['g3', 'g4'],
          car: ['Si rompe il legame C3–C4: C1–C3 diventano DHAP, C4–C6 gliceraldeide-3-P.', 'The C3–C4 bond breaks: C1–C3 become DHAP, C4–C6 glyceraldehyde 3-P.'],
          come: ['Aldolica al contrario: una lisina forma una base di Schiff con il C2 chetonico, che «tira» gli elettroni e permette di spezzare C3–C4. ΔG°′ positivo, ma nella cellula procede perché i prodotti vengono consumati subito.', 'A reverse aldol: a lysine forms a Schiff base with the C2 ketone, which pulls electrons and lets C3–C4 break. ΔG°′ is positive, but in the cell it runs because the products are used at once.'] }),
        P({ n: 5, enz: ['Trioso fosfato isomerasi', 'Triose phosphate isomerase'], cl: 'is', cof: '—', dG: 7.5, rev: true, prima: [DHAP, GAPb], dopo: [GAPa, GAPb], mod: ['g3', 'g2'],
          car: ['Dal DHAP (C1, C2, C3) nasce una seconda gliceraldeide-3-P: il C3 diventa l\'aldeide, il C1 porta il fosfato. Da qui tutto avviene due volte.', 'DHAP (C1, C2, C3) becomes a second glyceraldehyde 3-P: C3 becomes the aldehyde, C1 carries the phosphate. From here everything happens twice.'],
          come: ['Passa per un enediolo, come la reazione 2. È un enzima «perfetto»: kcat/Km al limite della diffusione.', 'Goes through an enediol like reaction 2. A «perfect» enzyme: kcat/Km at the diffusion limit.'] }),
        P({ n: 6, enz: ['Gliceraldeide-3-P deidrogenasi (GAPDH)', 'Glyceraldehyde 3-P dehydrogenase (GAPDH)'], cl: 'ox', cof: 'NAD⁺, Cys', dG: 6.3, rev: true, volte: 2, prima: [GAP], dopo: [BPG], in: ['NAD⁺', 'Pi'], out: ['NADH'], mod: ['t1'],
          car: ['Il C1 aldeidico (C3·C4 del glucosio) è ossidato ad acido e legato a un fosfato: acil-fosfato.', 'The aldehyde C1 (glucose C3·C4) is oxidised to an acid and bound to a phosphate: an acyl phosphate.'],
          come: ['(1) lo –SH della cisteina attacca l\'aldeide (tioemiacetale); (2) un idruro passa al NAD⁺ → tioestere; (3) il Pᵢ attacca il tioestere e libera l\'1,3-BPG. L\'arseniato al posto del Pᵢ disaccoppia la reazione.', '(1) the cysteine –SH attacks the aldehyde (thiohemiacetal); (2) a hydride goes to NAD⁺ → thioester; (3) Pᵢ attacks the thioester and releases 1,3-BPG. Arsenate instead of Pᵢ uncouples the reaction.'] }),
        P({ n: 7, enz: ['Fosfoglicerato chinasi', 'Phosphoglycerate kinase'], cl: 'tr', cof: 'Mg²⁺', dG: -18.5, rev: true, volte: 2, prima: [BPG], dopo: [PG3], in: ['ADP'], out: ['ATP'], mod: ['t1'],
          car: ['Il fosfato del C1 passa all\'ADP; il C1 resta –COO⁻.', 'The C1 phosphate goes to ADP; C1 stays –COO⁻.'],
          come: ['L\'1,3-BPG ha un potenziale di trasferimento del fosfato più alto dell\'ATP (−49,3 contro −30,5 kJ/mol): fosforilazione a livello del substrato.', '1,3-BPG has a higher phosphoryl-transfer potential than ATP (−49.3 vs −30.5 kJ/mol): substrate-level phosphorylation.'] }),
        P({ n: 8, enz: ['Fosfoglicerato mutasi', 'Phosphoglycerate mutase'], cl: 'is', cof: 'Mg²⁺, 2,3-BPG', dG: 4.4, rev: true, volte: 2, prima: [PG3], dopo: [PG2], mod: ['t2', 't3'],
          car: ['Il fosfato passa dal C3 al C2.', 'The phosphate moves from C3 to C2.'],
          come: ['Un\'istidina fosforilata cede il fosfato al C2 (per un attimo 2,3-BPG) e riprende quello del C3.', 'A phosphorylated histidine gives its phosphate to C2 (briefly 2,3-BPG) and takes back the one on C3.'] }),
        P({ n: 9, enz: ['Enolasi', 'Enolase'], cl: 'li', cof: 'Mg²⁺', dG: 7.5, rev: true, volte: 2, prima: [PG2], dopo: [PEP], out: ['H₂O'], mod: ['t2', 't3'],
          car: ['Esce acqua fra C2 e C3: doppio legame C2=C3, fosfato enolico.', 'Water leaves between C2 and C3: a C2=C3 double bond, an enol phosphate.'],
          come: ['Il PEP diventa la molecola con il fosfato più ricco di energia (idrolisi −61,9 kJ/mol). Il fluoruro inibisce l\'enolasi.', 'PEP becomes the molecule with the most energetic phosphate (hydrolysis −61.9 kJ/mol). Fluoride inhibits enolase.'] }),
        P({ n: 10, enz: ['Piruvato chinasi', 'Pyruvate kinase'], cl: 'tr', cof: 'Mg²⁺, K⁺', dG: -31.4, rev: false, reg: true, volte: 2, prima: [PEP], dopo: [PIR], in: ['ADP'], out: ['ATP'], mod: ['t2', 't3'],
          car: ['Il fosfato del C2 passa all\'ADP; il C2 diventa chetonico, il C3 un metile.', 'The C2 phosphate goes to ADP; C2 becomes a ketone, C3 a methyl.'],
          come: ['Si forma l\'enolpiruvato, che subito passa alla forma chetonica (tautomeria): è questo a rendere la reazione così favorita. + F-1,6-BP (a valle); − ATP, alanina, acetil-CoA; glucagone la spegne nel fegato.', 'Enolpyruvate forms and at once tautomerises to the keto form: that is what makes the reaction so favourable. + F-1,6-BP (feed-forward); − ATP, alanine, acetyl-CoA; glucagon switches it off in the liver.'] })
      ] },
    { id: 'pdh', nome: ['Piruvato deidrogenasi', 'Pyruvate dehydrogenase'], dove: ['matrice mitocondriale', 'mitochondrial matrix'], cap: 4,
      bilancio: ['Piruvato + CoA-SH + NAD⁺ → Acetil-CoA + CO₂ + NADH + H⁺ · ΔG′° = −33,4 kJ/mol', 'Pyruvate + CoA-SH + NAD⁺ → Acetyl-CoA + CO₂ + NADH + H⁺ · ΔG′° = −33.4 kJ/mol'],
      passi: [
        P({ n: 1, enz: ['E1 · piruvato deidrogenasi', 'E1 · pyruvate dehydrogenase'], cl: 'li', cof: 'TPP (B1)', dG: null, rev: false, reg: true, prima: [PIR, TPP], dopo: [HETPP], out: ['CO₂'], mod: ['t2'],
          car: ['Il C1 (carbossile; C3·C4 del glucosio) esce come CO₂; C2 e C3 restano sulla TPP come idrossietile.', 'C1 (carboxyl; glucose C3·C4) leaves as CO₂; C2 and C3 stay on TPP as hydroxyethyl.'],
          come: ['Il C2 dell\'anello tiazolico perde un H⁺ e diventa un carbanione che attacca il carbonile del piruvato. L\'anello positivo fa da «pozzo di elettroni» e rende possibile la decarbossilazione.', 'The thiazolium C2 loses H⁺ and becomes a carbanion that attacks the pyruvate carbonyl. The positive ring is an «electron sink» that makes decarboxylation possible.'] }),
        P({ n: 2, enz: ['E1 → E2', 'E1 → E2'], cl: 'ox', cof: 'lipoamide', dG: null, rev: false, prima: [HETPP, LIP], dopo: [ACLIP, TPP], mod: ['t2', 'S1', 'S2'],
          car: ['L\'idrossietile è ossidato ad acetile e passa sul lipoato.', 'The hydroxyethyl is oxidised to acetyl and moves onto lipoate.'],
          come: ['Il ponte S–S della lipoamide accetta l\'idrossietile: uno zolfo lega l\'acetile (tioestere), l\'altro diventa –SH. Gli elettroni dell\'ossidazione hanno ridotto il disolfuro. La TPP è libera.', 'The lipoamide S–S takes the hydroxyethyl: one sulfur holds the acetyl (thioester), the other becomes –SH. The oxidation electrons reduced the disulfide. TPP is free again.'] }),
        P({ n: 3, enz: ['E2 · diidrolipoil transacetilasi', 'E2 · dihydrolipoyl transacetylase'], cl: 'tr', cof: 'CoA (B5)', dG: null, rev: false, prima: [ACLIP, COA], dopo: [ACCOA_P, DHLIP], mod: ['t2', 'Sc'],
          car: ['L\'acetile passa dal lipoato al CoA: esce l\'acetil-CoA.', 'The acetyl moves from lipoate to CoA: acetyl-CoA leaves.'],
          come: ['Il –SH del CoA attacca il tioestere (transesterificazione). Resta la diidrolipoamide con due –SH.', 'The CoA –SH attacks the thioester (transesterification). Dihydrolipoamide with two –SH remains.'] }),
        P({ n: 4, enz: ['E3 · diidrolipoil deidrogenasi', 'E3 · dihydrolipoyl dehydrogenase'], cl: 'ox', cof: 'FAD (B2)', dG: null, rev: false, prima: [DHLIP], dopo: [LIP], in: ['FAD'], out: ['FADH₂'], mod: ['S1', 'S2'],
          car: ['Nessun carbonio: si rigenera il cofattore.', 'No carbon: the cofactor is regenerated.'],
          come: ['I due –SH cedono 2 e⁻ e 2 H⁺ al FAD di E3: si riforma il ponte S–S.', 'The two –SH give 2 e⁻ and 2 H⁺ to the FAD of E3: the S–S bridge re-forms.'] }),
        P({ n: 5, enz: ['E3', 'E3'], cl: 'ox', cof: 'NAD⁺ (B3)', dG: null, rev: false, prima: [], dopo: [], in: ['FADH₂', 'NAD⁺'], out: ['FAD', 'NADH'],
          car: ['Nessun carbonio.', 'No carbon.'],
          come: ['Il FADH₂ legato all\'enzima cede gli elettroni al NAD⁺; il NADH va alla catena respiratoria (≈ 2,5 ATP). Il braccio della lipoamide (≈ 14 Å) porta il gruppo da un sito all\'altro: canalizzazione del substrato.', 'Enzyme-bound FADH₂ passes its electrons to NAD⁺; NADH goes to the respiratory chain (≈ 2.5 ATP). The lipoamide arm (≈ 14 Å) carries the group between sites: substrate channelling.'] })
      ] },
    { id: 'krebs', nome: ['Ciclo di Krebs', 'Krebs cycle'], dove: ['matrice mitocondriale', 'mitochondrial matrix'], cap: 5, sezione: 'skrebs',
      bilancio: ['Acetil-CoA + 3 NAD⁺ + FAD + GDP + Pᵢ + 2 H₂O → 2 CO₂ + 3 NADH + FADH₂ + GTP + CoA-SH (≈ 10 ATP)', 'Acetyl-CoA + 3 NAD⁺ + FAD + GDP + Pᵢ + 2 H₂O → 2 CO₂ + 3 NADH + FADH₂ + GTP + CoA-SH (≈ 10 ATP)'],
      passi: [
        P({ n: 1, enz: ['Citrato sintasi', 'Citrate synthase'], cl: 'tr', cof: '—', dG: -32.2, rev: false, reg: true, prima: [ACCOA, OAA], dopo: [CIT], in: ['H₂O'], out: ['CoA-SH'], mod: ['a2', 'o2'],
          car: ['Il metile dell\'acetile (rosso) si lega al C=O dell\'ossalacetato: 2 C + 4 C = 6 C.', 'The acetyl methyl (red) bonds to the oxaloacetate C=O: 2 C + 4 C = 6 C.'],
          come: ['Il metile perde un H⁺ e attacca il carbonile; poi il tioestere è idrolizzato e il CoA esce. L\'idrolisi rende la reazione molto favorita: serve perché l\'ossalacetato nella cellula è pochissimo.', 'The methyl loses H⁺ and attacks the carbonyl; then the thioester is hydrolysed and CoA leaves. Hydrolysis makes it very favourable, needed because cellular oxaloacetate is scarce.'] }),
        P({ n: 2, enz: ['Aconitasi', 'Aconitase'], cl: 'is', cof: '[4Fe-4S]', dG: 13.3, rev: true, prima: [CIT], dopo: [ISO], mod: ['o2', 'o3'],
          car: ['L\'–OH si sposta dal carbonio centrale a quello vicino.', 'The –OH moves from the central carbon to its neighbour.'],
          come: ['Toglie acqua (cis-aconitato) e la riaggiunge al contrario: da un –OH terziario (non ossidabile) a uno secondario, ossidabile a chetone.', 'Removes water (cis-aconitate) and adds it back the other way: from a tertiary –OH (not oxidisable) to a secondary one that can become a ketone.'] }),
        P({ n: 3, enz: ['Isocitrato deidrogenasi', 'Isocitrate dehydrogenase'], cl: 'ox', cof: 'NAD⁺, Mn²⁺', dG: -20.9, rev: false, reg: true, prima: [ISO], dopo: [AKG], in: ['NAD⁺'], out: ['NADH', 'CO₂'], mod: ['o3', 'o2'],
          car: ['L\'–OH diventa C=O e il carbossile in β (arancio, viene dall\'ossalacetato) esce come CO₂: 6 C → 5 C.', 'The –OH becomes C=O and the β carboxyl (orange, from oxaloacetate) leaves as CO₂: 6 C → 5 C.'],
          come: ['Ossida l\'alcol a chetone (ossalosuccinato, legato all\'enzima), poi il carbossile in β si stacca. − ATP, NADH; + ADP, Ca²⁺.', 'Oxidises the alcohol to a ketone (enzyme-bound oxalosuccinate), then the β carboxyl leaves. − ATP, NADH; + ADP, Ca²⁺.'] }),
        P({ n: 4, enz: ['α-chetoglutarato deidrogenasi', 'α-ketoglutarate dehydrogenase'], cl: 'ox', cof: 'TPP, lipoato, CoA, FAD, NAD⁺', dG: -33.5, rev: false, reg: true, prima: [AKG], dopo: [SUCOA], in: ['NAD⁺', 'CoA-SH'], out: ['NADH', 'CO₂'], mod: ['o3'],
          car: ['Il carbossile vicino al chetone esce come CO₂: 5 C → 4 C. Anche questa CO₂ viene dall\'ossalacetato.', 'The carboxyl next to the ketone leaves as CO₂: 5 C → 4 C. This CO₂ also comes from oxaloacetate.'],
          come: ['Stesso meccanismo e stessi 5 cofattori della PDH. L\'energia resta nel tioestere del succinil-CoA. − succinil-CoA, NADH; + Ca²⁺.', 'Same mechanism and the same 5 cofactors as PDH. The energy is kept in the succinyl-CoA thioester. − succinyl-CoA, NADH; + Ca²⁺.'] }),
        P({ n: 5, enz: ['Succinil-CoA sintetasi', 'Succinyl-CoA synthetase'], cl: 'lg', cof: 'His-P', dG: -2.9, rev: true, prima: [SUCOA], dopo: [SUC], in: ['GDP', 'Pi'], out: ['GTP', 'CoA-SH'], mod: ['o3'],
          car: ['Il tioestere si rompe e resta il succinato, simmetrico: da qui i carboni dell\'acetile non si distinguono più dagli altri.', 'The thioester breaks, leaving symmetric succinate: from here the acetyl carbons can no longer be told apart.'],
          come: ['L\'energia del tioestere passa a un fosfato su un\'istidina e poi al GDP: fosforilazione a livello del substrato.', 'The thioester energy goes to a phosphate on a histidine and then to GDP: substrate-level phosphorylation.'] }),
        P({ n: 6, enz: ['Succinato deidrogenasi (complesso II)', 'Succinate dehydrogenase (complex II)'], cl: 'ox', cof: 'FAD legato', dG: 0, rev: true, prima: [SUC], dopo: [FUM], in: ['FAD'], out: ['FADH₂'], mod: ['a2', 'o2'],
          car: ['Un H a ciascuno dei due CH₂ centrali: doppio legame trans (fumarato).', 'One H from each of the two central CH₂: a trans double bond (fumarate).'],
          come: ['L\'unico enzima del ciclo nella membrana interna: è il complesso II. Usa il FAD perché C–C → C=C non basta a ridurre il NAD⁺. Il malonato è il suo inibitore competitivo.', 'The only cycle enzyme in the inner membrane: complex II. It uses FAD because C–C → C=C cannot reduce NAD⁺. Malonate is its competitive inhibitor.'] }),
        P({ n: 7, enz: ['Fumarasi', 'Fumarase'], cl: 'li', cof: '—', dG: -3.8, rev: true, prima: [FUM], dopo: [MAL], in: ['H₂O'], mod: ['o2', 'a2'],
          car: ['L\'acqua si aggiunge al doppio legame: un carbonio prende –OH, l\'altro –H.', 'Water adds across the double bond: one carbon gets –OH, the other –H.'],
          come: ['Stereospecifica: solo L-malato. (Il succinato è simmetrico: metà delle volte l\'–OH va sull\'altro carbonio; qui ne mostriamo una.)', 'Stereospecific: only L-malate. (Succinate is symmetric: half the time the –OH goes to the other carbon; one case is shown.)'] }),
        P({ n: 8, enz: ['Malato deidrogenasi', 'Malate dehydrogenase'], cl: 'ox', cof: 'NAD⁺', dG: 29.7, rev: true, prima: [MAL], dopo: [OAA2], in: ['NAD⁺'], out: ['NADH'], mod: ['o2'],
          car: ['L\'–OH diventa C=O: torna l\'ossalacetato. I carboni dell\'acetile (rossi) sono ancora dentro: usciranno nei giri successivi.', 'The –OH becomes C=O: oxaloacetate is back. The acetyl carbons (red) are still inside: they leave in later turns.'],
          come: ['ΔG°′ = +29,7 kJ/mol: procede solo perché la citrato sintasi consuma subito l\'ossalacetato. Le reazioni 6–7–8 sono la stessa sequenza della β-ossidazione: FAD → acqua → NAD⁺.', 'ΔG°′ = +29.7 kJ/mol: it runs only because citrate synthase uses oxaloacetate at once. Reactions 6–7–8 are the β-oxidation sequence: FAD → water → NAD⁺.'] })
      ] },
    { id: 'beta', nome: ['β-ossidazione (un giro)', 'β-oxidation (one turn)'], dove: ['matrice mitocondriale', 'mitochondrial matrix'], cap: 7, sezione: 'sbeta',
      bilancio: ['Cn-acil-CoA + FAD + NAD⁺ + H₂O + CoA-SH → Cn−2-acil-CoA + FADH₂ + NADH + H⁺ + acetil-CoA', 'Cn-acyl-CoA + FAD + NAD⁺ + H₂O + CoA-SH → Cn−2-acyl-CoA + FADH₂ + NADH + H⁺ + acetyl-CoA'],
      passi: [
        P({ n: 1, enz: ['Acil-CoA deidrogenasi', 'Acyl-CoA dehydrogenase'], cl: 'ox', cof: 'FAD → ETF → CoQ', dG: null, rev: true, prima: [ACIL], dopo: [ENOIL], in: ['FAD'], out: ['FADH₂'], mod: ['a', 'b'],
          car: ['Tolti 2 H a Cα e Cβ: doppio legame trans-Δ².', '2 H removed from Cα and Cβ: a trans-Δ² double bond.'],
          come: ['Una base dell\'enzima toglie H⁺ al Cα; un idruro dal Cβ va al FAD.', 'An enzyme base removes H⁺ from Cα; a hydride from Cβ goes to FAD.'] }),
        P({ n: 2, enz: ['Enoil-CoA idratasi', 'Enoyl-CoA hydratase'], cl: 'li', cof: 'H₂O', dG: null, rev: true, prima: [ENOIL], dopo: [IDROSSI], in: ['H₂O'], mod: ['b', 'a'],
          car: ['–OH sul Cβ: L-β-idrossiacil-CoA.', '–OH on Cβ: L-β-hydroxyacyl-CoA.'],
          come: ['L\'O dell\'acqua attacca il Cβ; gli elettroni del doppio legame vanno verso il carbonile (enolato), che riprende H⁺ sul Cα.', 'Water oxygen attacks Cβ; the double-bond electrons move toward the carbonyl (enolate), which takes H⁺ back on Cα.'] }),
        P({ n: 3, enz: ['β-idrossiacil-CoA deidrogenasi', 'β-hydroxyacyl-CoA dehydrogenase'], cl: 'ox', cof: 'NAD⁺', dG: null, rev: true, prima: [IDROSSI], dopo: [CHETO], in: ['NAD⁺'], out: ['NADH'], mod: ['b'],
          car: ['L\'–OH del Cβ diventa C=O: β-chetoacil-CoA.', 'The Cβ –OH becomes C=O: β-ketoacyl-CoA.'],
          come: ['La base toglie H⁺ all\'–OH, si forma il C=O e un idruro dal Cβ va al NAD⁺. NADH/NAD⁺ alto la inibisce.', 'The base removes H⁺ from –OH, C=O forms and a hydride from Cβ goes to NAD⁺. High NADH/NAD⁺ inhibits it.'] }),
        P({ n: 4, enz: ['Tiolasi', 'Thiolase'], cl: 'tr', cof: 'CoA-SH, Cys', dG: null, rev: true, prima: [CHETO, COA2], dopo: [ACB, ESA], mod: ['a', 'b'],
          car: ['Si rompe Cα–Cβ: esce l\'acetil-CoA (C1–C2) e l\'acil-CoA è più corto di 2 C.', 'Cα–Cβ breaks: acetyl-CoA (C1–C2) leaves and the acyl-CoA is 2 C shorter.'],
          come: ['La cisteina dell\'enzima attacca il carbonile del Cβ, il legame Cα–Cβ (fra due carbonili) si rompe, poi un nuovo CoA–S⁻ riprende l\'acile. Acetil-CoA alto inibisce la tiolasi.', 'The enzyme cysteine attacks the Cβ carbonyl, the Cα–Cβ bond (between two carbonyls) breaks, then a new CoA–S⁻ takes the acyl. High acetyl-CoA inhibits thiolase.'] })
      ] },
    { id: 'gluconeo', nome: ['Gluconeogenesi (le deviazioni)', 'Gluconeogenesis (the bypasses)'], dove: ['fegato e rene: mitocondrio, citosol, RE', 'liver and kidney: mitochondrion, cytosol, ER'], cap: 8, sezione: 'sgluco',
      bilancio: ['2 piruvato + 4 ATP + 2 GTP + 2 NADH → glucosio · ΔG′ ≈ −38 kJ/mol', '2 pyruvate + 4 ATP + 2 GTP + 2 NADH → glucose · ΔG′ ≈ −38 kJ/mol'],
      passi: [
        P({ n: 1, enz: ['Piruvato carbossilasi', 'Pyruvate carboxylase'], cl: 'lg', cof: 'biotina, ATP', dG: null, rev: false, reg: true, volte: 2, prima: [PIR], dopo: [OAAg], in: ['HCO₃⁻', 'ATP'], out: ['ADP', 'Pi'], mod: ['t3'],
          car: ['Il bicarbonato aggiunge un carbonio (x) al metile: 3 C → 4 C.', 'Bicarbonate adds a carbon (x) to the methyl: 3 C → 4 C.'],
          come: ['La biotina porta la CO₂; l\'enzima è nel mitocondrio ed è attivato dall\'acetil-CoA (segnale: si bruciano acidi grassi, il piruvato va al glucosio). L\'ossalacetato esce come malato.', 'Biotin carries CO₂; the enzyme is mitochondrial and activated by acetyl-CoA (signal: fats are burning, pyruvate goes to glucose). Oxaloacetate leaves as malate.'] }),
        P({ n: 2, enz: ['PEP carbossichinasi (PEPCK)', 'PEP carboxykinase (PEPCK)'], cl: 'li', cof: 'GTP', dG: null, rev: false, reg: true, volte: 2, prima: [OAAg], dopo: [PEP], in: ['GTP'], out: ['GDP', 'CO₂'], mod: ['t2', 't3'],
          car: ['Esce proprio il carbonio appena aggiunto: la CO₂ serve solo a «spingere» la reazione.', 'The very carbon just added leaves: the CO₂ only «pushes» the reaction.'],
          come: ['Decarbossilazione e fosforilazione insieme: il PEP aggira la piruvato chinasi. Il glucagone ne aumenta la trascrizione.', 'Decarboxylation and phosphorylation together: PEP bypasses pyruvate kinase. Glucagon raises its transcription.'] }),
        P({ n: 3, enz: ['Fruttosio-1,6-bisfosfatasi (FBPasi-1)', 'Fructose 1,6-bisphosphatase (FBPase-1)'], cl: 'id', cof: 'H₂O', dG: null, rev: false, reg: true, prima: [F16], dopo: [F6P], in: ['H₂O'], out: ['Pi'], mod: ['g1'],
          car: ['Il fosfato del C1 se ne va come Pᵢ (idrolisi, non ATP).', 'The C1 phosphate leaves as Pᵢ (hydrolysis, no ATP).'],
          come: ['Aggira la PFK-1. È inibita da F-2,6-BP e AMP: lo stesso segnale che accende la PFK-1 spegne lei, così non c\'è ciclo futile.', 'Bypasses PFK-1. Inhibited by F-2,6-BP and AMP: the signal that turns PFK-1 on turns it off, so there is no futile cycle.'] }),
        P({ n: 4, enz: ['Glucosio-6-fosfatasi', 'Glucose 6-phosphatase'], cl: 'id', cof: 'H₂O', dG: null, rev: false, prima: [G6P], dopo: [GLC], in: ['H₂O'], out: ['Pi'], mod: ['g6'],
          car: ['Il fosfato del C6 se ne va: il glucosio libero può uscire nel sangue.', 'The C6 phosphate leaves: free glucose can go out into the blood.'],
          come: ['Nel reticolo endoplasmatico, solo in fegato e rene: per questo il glicogeno muscolare non aiuta la glicemia.', 'In the endoplasmic reticulum, only in liver and kidney: that is why muscle glycogen does not help blood glucose.'] })
      ] },
    { id: 'sintesiag', nome: ['Sintesi degli acidi grassi (primo giro)', 'Fatty acid synthesis (first turn)'], dove: ['citosol (fegato), dopo il pasto', 'cytosol (liver), after a meal'], cap: 10,
      bilancio: ['8 acetil-CoA + 7 ATP + 14 NADPH → palmitato + 7 CO₂ + 14 NADP⁺', '8 acetyl-CoA + 7 ATP + 14 NADPH → palmitate + 7 CO₂ + 14 NADP⁺'],
      passi: [
        P({ n: 1, enz: ['Acetil-CoA carbossilasi (ACC)', 'Acetyl-CoA carboxylase (ACC)'], cl: 'lg', cof: 'biotina, ATP', dG: null, rev: false, reg: true, prima: [ACCOAs], dopo: [MALCOA], in: ['HCO₃⁻', 'ATP'], out: ['ADP', 'Pi'], mod: ['a2'],
          car: ['Il bicarbonato (m) si lega al metile: malonil-CoA, 3 C. Quel carbonio non resterà nell\'acido grasso.', 'Bicarbonate (m) binds the methyl: malonyl-CoA, 3 C. That carbon will not stay in the fatty acid.'],
          come: ['La tappa regolata: + citrato (polimerizza l\'enzima), insulina; − palmitoil-CoA, glucagone, AMPK. Il malonil-CoA blocca anche la CPT I.', 'The regulated step: + citrate (polymerises the enzyme), insulin; − palmitoyl-CoA, glucagon, AMPK. Malonyl-CoA also blocks CPT I.'] }),
        P({ n: 2, enz: ['Acido grasso sintasi · condensazione (KS)', 'Fatty acid synthase · condensation (KS)'], cl: 'tr', cof: '—', dG: null, rev: false, prima: [ACACP, MALACP], dopo: [AAACP, ACPv], out: ['CO₂'], mod: ['a2', 'p1'],
          car: ['Acetile (2 C) + malonile (3 C) → acetoacetile (4 C) + CO₂: esce proprio il carbonio del bicarbonato.', 'Acetyl (2 C) + malonyl (3 C) → acetoacetyl (4 C) + CO₂: the very bicarbonate carbon leaves.'],
          come: ['La decarbossilazione «spinge» la condensazione. La catena cresce legata all\'ACP (fosfopanteteina), non al CoA.', 'Decarboxylation drives the condensation. The chain grows on ACP (phosphopantetheine), not on CoA.'] }),
        P({ n: 3, enz: ['Riduzione (KR)', 'Reduction (KR)'], cl: 'ox', cof: 'NADPH', dG: null, rev: false, prima: [AAACP], dopo: [DIDR], in: ['NADPH'], out: ['NADP⁺'], mod: ['p1'],
          car: ['C=O → –OH (D, non L come nella β-ossidazione).', 'C=O → –OH (D, not L as in β-oxidation).'],
          come: ['Il riducente è il NADPH (via dei pentosi, enzima malico), non il NADH.', 'The reductant is NADPH (pentose pathway, malic enzyme), not NADH.'] }),
        P({ n: 4, enz: ['Disidratazione (DH)', 'Dehydration (DH)'], cl: 'li', cof: '—', dG: null, rev: false, prima: [DIDR], dopo: [CROT], out: ['H₂O'], mod: ['p1', 'a2'],
          car: ['Esce acqua: doppio legame trans.', 'Water leaves: a trans double bond.'],
          come: ['È l\'idratasi della β-ossidazione al contrario.', 'The β-oxidation hydratase in reverse.'] }),
        P({ n: 5, enz: ['Riduzione (ER)', 'Reduction (ER)'], cl: 'ox', cof: 'NADPH', dG: null, rev: false, prima: [CROT], dopo: [BUT], in: ['NADPH'], out: ['NADP⁺'], mod: ['p1', 'a2'],
          car: ['C=C → C–C: butirrile (4 C). Al giro dopo entra un altro malonile, fino al palmitato (7 giri).', 'C=C → C–C: butyryl (4 C). Next turn another malonyl comes in, up to palmitate (7 turns).'],
          come: ['Corrisponde all\'acil-CoA deidrogenasi (FAD) della β-ossidazione, ma con NADPH.', 'Matches β-oxidation acyl-CoA dehydrogenase (FAD), but with NADPH.'] })
      ] },
    { id: 'urea', nome: ['Ciclo dell\'urea', 'Urea cycle'], dove: ['fegato: mitocondrio (1–2) e citosol (3–5)', 'liver: mitochondrion (1–2) and cytosol (3–5)'], cap: 9, sezione: 'surea',
      bilancio: ['NH₄⁺ + HCO₃⁻ + aspartato + 3 ATP → urea + fumarato + 2 ADP + AMP + PPᵢ + 2 Pᵢ (4 legami ad alta energia)', 'NH₄⁺ + HCO₃⁻ + aspartate + 3 ATP → urea + fumarate + 2 ADP + AMP + PPᵢ + 2 Pᵢ (4 high-energy bonds)'],
      passi: [
        P({ n: 1, enz: ['Carbamil fosfato sintetasi I', 'Carbamoyl phosphate synthetase I'], cl: 'lg', cof: 'N-acetilglutammato', dG: null, rev: false, reg: true, prima: [], dopo: [CARB], in: ['HCO₃⁻', 'NH₄⁺', '2 ATP'], out: ['2 ADP', 'Pi'], mod: ['cU', 'n1'],
          car: ['Il carbonio dell\'urea viene dal bicarbonato; il 1° azoto dall\'NH₄⁺.', 'The urea carbon comes from bicarbonate; the 1st nitrogen from NH₄⁺.'],
          come: ['Nel mitocondrio. Attivata dall\'N-acetilglutammato (acetil-CoA + glutammato, la cui sintesi è attivata dall\'arginina).', 'In the mitochondrion. Activated by N-acetylglutamate (acetyl-CoA + glutamate, whose synthesis arginine activates).'] }),
        P({ n: 2, enz: ['Ornitina transcarbamilasi', 'Ornithine transcarbamoylase'], cl: 'tr', cof: '—', dG: null, rev: false, prima: [CARB, ORN], dopo: [CITR], out: ['Pi'], mod: ['cU', 'nd'],
          car: ['Il carbamile passa sull\'ornitina: citrullina, che esce nel citosol.', 'The carbamoyl moves onto ornithine: citrulline, which leaves for the cytosol.'],
          come: ['Il fosfato è il gruppo uscente che rende la reazione favorita.', 'Phosphate is the leaving group that makes it favourable.'] }),
        P({ n: 3, enz: ['Argininosuccinato sintetasi', 'Argininosuccinate synthetase'], cl: 'lg', cof: 'ATP → AMP', dG: null, rev: false, prima: [CITR, ASP], dopo: [AS], in: ['ATP'], out: ['AMP', 'PPi'], mod: ['cU', 'n2'],
          car: ['L\'aspartato porta il 2° azoto.', 'Aspartate brings the 2nd nitrogen.'],
          come: ['ATP → AMP + PPᵢ (due legami ad alta energia): l\'ossigeno della citrullina è attivato come AMP e sostituito dall\'azoto dell\'aspartato.', 'ATP → AMP + PPᵢ (two high-energy bonds): the citrulline oxygen is activated as AMP and replaced by the aspartate nitrogen.'] }),
        P({ n: 4, enz: ['Argininosuccinasi', 'Argininosuccinase'], cl: 'li', cof: '—', dG: null, rev: true, prima: [AS], dopo: [ARG, FUMu], mod: ['n2'],
          car: ['Lo scheletro dell\'aspartato se ne va come fumarato; l\'azoto resta.', 'The aspartate skeleton leaves as fumarate; the nitrogen stays.'],
          come: ['La «bicicletta di Krebs»: il fumarato → malato → ossalacetato → (transaminazione) di nuovo aspartato.', 'The «Krebs bicycle»: fumarate → malate → oxaloacetate → (transamination) aspartate again.'] }),
        P({ n: 5, enz: ['Arginasi', 'Arginase'], cl: 'id', cof: 'Mn²⁺', dG: null, rev: false, prima: [ARG], dopo: [UREA, ORN2], in: ['H₂O'], mod: ['cU'],
          car: ['L\'acqua stacca l\'urea (C dal bicarbonato, N da NH₄⁺ e aspartato); l\'ornitina rientra nel mitocondrio.', 'Water cleaves off urea (C from bicarbonate, N from NH₄⁺ and aspartate); ornithine goes back into the mitochondrion.'],
          come: ['Solo il fegato ha tutto il ciclo: l\'urea va al rene. Dopo pasti proteici o nel digiuno lungo gli enzimi aumentano.', 'Only the liver has the whole cycle: urea goes to the kidney. After protein meals or long fasting the enzymes increase.'] })
      ] }
  ];

  /* ═══ 3 · i conti ═══════════════════════════════════════════════════════ */
  var CARBONIO_ENTRA = { 'CO₂': 1, 'HCO₃⁻': 1 };
  function gettone(s) { var m = /^(\d+)\s+(.+)$/.exec(s); return m ? { n: +m[1], s: m[2] } : { n: 1, s: s }; }
  function carboni(lista) { var n = 0; lista.forEach(function (m) { m.atomi.forEach(function (a) { if (a.el === 'C') n++; }); }); return n; }
  /** bilancio dei carboni di un passo: prima + entrati = dopo + usciti */
  function bilancioCarboni(p) {
    var ent = 0, usc = 0; p.in.forEach(function (s) { var t = gettone(s); ent += (CARBONIO_ENTRA[t.s] || 0) * t.n; }); p.out.forEach(function (s) { var t = gettone(s); usc += (CARBONIO_ENTRA[t.s] || 0) * t.n; });
    return { prima: carboni(p.prima), dopo: carboni(p.dopo), entrati: ent, usciti: usc, ok: carboni(p.prima) + ent === carboni(p.dopo) + usc };
  }
  var CONTA = ['ATP', 'NADH', 'FADH₂', 'GTP', 'CO₂', 'NADPH'];
  /** il conto della via fino al passo k (compreso): +uscito −entrato, per le «volte» */
  function conto(via, k) {
    var c = {}; CONTA.forEach(function (x) { c[x] = 0; });
    via.passi.slice(0, k == null ? via.passi.length : k + 1).forEach(function (p) {
      p.out.forEach(function (s) { var t = gettone(s); if (t.s in c) c[t.s] += t.n * p.volte; });
      p.in.forEach(function (s) { var t = gettone(s); if (t.s === 'HCO₃⁻') c['CO₂'] -= t.n * p.volte; else if (t.s in c) c[t.s] -= t.n * p.volte; });
    });
    return c;
  }
  function deltaG(via) { var s = 0; via.passi.forEach(function (p) { if (p.dG != null) s += p.dG * p.volte; }); return Math.round(s * 10) / 10; }

  /** ATP da un acido grasso saturo pari Cn (P/O 2,5 e 1,5; attivazione −2) */
  function atpAcidoGrasso(n) { var giri = n / 2 - 1, ac = n / 2; return { giri: giri, acetilCoA: ac, daGiri: giri * 4, daKrebs: ac * 10, attivazione: -2, totale: giri * 4 + ac * 10 - 2 }; }
  /** ATP da un glucosio: navetta 'ma' (malato–aspartato, 2,5) o 'g3p' (glicerolo-3-P, 1,5) */
  function atpGlucosio(navetta) { var n = navetta === 'g3p' ? 1.5 : 2.5, glic = 2 + 2 * n, pdh = 2 * 2.5, krebs = 2 * (3 * 2.5 + 1.5 + 1); return { glicolisi: glic, pdh: pdh, krebs: krebs, totale: glic + pdh + krebs }; }

  /* ═══ 4 · cinetica: Michaelis–Menten, inibitori, allosteria ══════════════ */
  /** parametri apparenti: α = 1 + [I]/Ki (su E), α′ = 1 + [I]/Ki′ (su ES) */
  function apparenti(o) {
    var I = o.I || 0, a = 1 + I / (o.Ki || 1), a2 = 1 + I / (o.Ki2 || o.Ki || 1), Vm = o.Vmax || 1, Km = o.Km || 1;
    switch (o.tipo) {
      case 'competitivo': return { Vmax: Vm, Km: Km * a, a: a, a2: 1 };
      case 'noncompetitivo': return { Vmax: Vm / a, Km: Km, a: a, a2: a };
      case 'incompetitivo': return { Vmax: Vm / a2, Km: Km / a2, a: 1, a2: a2 };
      case 'misto': return { Vmax: Vm / a2, Km: Km * a / a2, a: a, a2: a2 };
      default: return { Vmax: Vm, Km: Km, a: 1, a2: 1 };
    }
  }
  function velocita(S, o) {
    if (o.tipo === 'allosterico') { var K = (o.K05 || 1) * (o.effettore || 1), n = o.n || 2.5; return (o.Vmax || 1) * Math.pow(S, n) / (Math.pow(K, n) + Math.pow(S, n)); }
    var p = apparenti(o); return p.Vmax * S / (p.Km + S);
  }
  /** Lineweaver–Burk: 1/V = (Km/Vmax)(1/[S]) + 1/Vmax */
  function lb(o) { var p = apparenti(o); return { pendenza: p.Km / p.Vmax, intercettaY: 1 / p.Vmax, intercettaX: -1 / p.Km }; }
  /** frazioni all'equilibrio rapido di E, ES, EI, ESI */
  function frazioni(S, o) {
    var I = o.I || 0, Km = o.Km || 1, e = 1, es = S / Km, ei = 0, esi = 0;
    if (o.tipo === 'competitivo') ei = I / (o.Ki || 1);
    else if (o.tipo === 'noncompetitivo') { ei = I / (o.Ki || 1); esi = es * I / (o.Ki || 1); }
    else if (o.tipo === 'incompetitivo') esi = es * I / (o.Ki2 || o.Ki || 1);
    else if (o.tipo === 'misto') { ei = I / (o.Ki || 1); esi = es * I / (o.Ki2 || 1); }
    var tot = e + es + ei + esi; return { E: e / tot, ES: es / tot, EI: ei / tot, ESI: esi / tot };
  }
  var ENZIMI = [
    { id: 'generico', nome: ['Enzima generico (Km 1 mM)', 'Generic enzyme (Km 1 mM)'], Km: 1, Vmax: 1, kcat: 100 },
    { id: 'esochinasi', nome: ['Esochinasi (Km ≈ 0,1 mM)', 'Hexokinase (Km ≈ 0.1 mM)'], Km: 0.1, Vmax: 1, kcat: 60 },
    { id: 'glucochinasi', nome: ['Glucochinasi (K₀,₅ ≈ 8 mM, sigmoide)', 'Glucokinase (K₀.₅ ≈ 8 mM, sigmoid)'], tipo: 'allosterico', K05: 8, n: 1.7, Km: 8, Vmax: 1, kcat: 60 },
    { id: 'pfk1', nome: ['PFK-1 (allosterica)', 'PFK-1 (allosteric)'], tipo: 'allosterico', K05: 1, n: 3, Km: 1, Vmax: 1, kcat: 100 },
    { id: 'tpi', nome: ['Trioso fosfato isomerasi («perfetta»)', 'Triose phosphate isomerase («perfect»)'], Km: 0.47, Vmax: 1, kcat: 4300 }
  ];

  /* ═══ 5 · ATP sintasi e ossigrafo ═══════════════════════════════════════ */
  /** dal rotore ai contatori: c subunità c nell'anello (8 nell'uomo), 3 β */
  function rotore(angolo, c) { c = c || 8; var giri = angolo / (2 * Math.PI); return { giri: giri, protoni: Math.floor(giri * c + 1e-9), atp: Math.floor(giri * 3 + 1e-9), hPerAtp: c / 3, hPerAtpTot: c / 3 + 1, PO_NADH: 10 / (c / 3 + 1), PO_FADH2: 6 / (c / 3 + 1) }; }
  /** stato della β numero i (0, 1, 2) quando il fusto γ è all'angolo θ: L, T, O (Boyer) */
  function statoBeta(theta, i) { var r = ((theta - i * 2 * Math.PI / 3) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI); return r < 2 * Math.PI / 3 ? 'L' : r < 4 * Math.PI / 3 ? 'T' : 'O'; }
  /** l'ossigrafo: un passo dt (s) del modello. Unità INDICATIVE (nmol, mV). */
  function nuovaCamera() { return { t: 0, O2: 230, dp: 140, ADP: 0, atp: 0, oligo: false, dnp: false, cn: false, substrato: 1, c: 8, angolo: 0, eventi: [], traccia: [[0, 230]] }; }
  function passoOssigrafo(s, dt) {
    var DPMAX = 220, back = Math.max(0, (DPMAX - s.dp) / DPMAX), ossigeno = s.O2 > 0.5 ? 1 : s.O2 / 0.5;
    var Je = s.cn ? 0 : 2.2 * s.substrato * Math.max(0.04, back) * ossigeno;           /* coppie di e⁻ → O, nmol/s */
    var hPerAtp = s.c / 3 + 1, Jsyn = (!s.oligo && s.ADP > 0) ? 0.95 * Math.max(0, s.dp - 110) / 60 * Math.min(1, s.ADP / 40) : 0;  /* ATP/s */
    var Jleak = 0.9 * s.dp / 180 * (s.dnp ? 30 : 1);                                       /* H⁺/s */
    var pompa = 10 * Je, rientro = Jsyn * hPerAtp + Jleak;
    s.dp = Math.max(0, Math.min(DPMAX, s.dp + (pompa - rientro) * dt * 6));
    var dATP = Math.min(s.ADP, Jsyn * dt); s.ADP -= dATP; s.atp += dATP;
    s.O2 = Math.max(0, s.O2 - Je / 2 * dt); s.t += dt;
    s.Je = Je; s.Jsyn = Jsyn; s.Jleak = Jleak; s.consumoO2 = Je / 2;
    /* il rotore gira di 120° per ATP: è lui che fa i contatori */
    s.angolo += Jsyn * dt * 2 * Math.PI / 3;
    return s;
  }
  function aggiungi(s, cosa) {
    if (cosa === 'ADP') s.ADP += 150; else if (cosa === 'oligomicina') s.oligo = true; else if (cosa === 'dnp') s.dnp = true; else if (cosa === 'cianuro') s.cn = true; else if (cosa === 'substrato') s.substrato = Math.max(s.substrato, 1);
    s.eventi.push([s.t, cosa]); return s;
  }
  /** consumo di O₂ a regime (dopo 60 s) in una condizione: per il banco e per la pagina */
  function regime(cond) { var s = nuovaCamera(); (cond || []).forEach(function (c) { aggiungi(s, c); }); for (var i = 0; i < 600; i++) passoOssigrafo(s, 0.1); return { consumoO2: s.consumoO2, Jsyn: s.Jsyn, dp: s.dp }; }

  /* ═══ 6 · i 12 capitoli (dalla dispensa dell'autore) ═══════════════════ */
  function Q(qi, ai, qe, ae) { return { q: [qi, qe], a: [ai, ae] }; }
  var CAPITOLI = [
    { n: 1, id: 'enzimi', titolo: ['Enzimi e cinetica enzimatica', 'Enzymes and enzyme kinetics'], badge: ['sempre la prima domanda', 'always the first question'], lab: ['enzimi'],
      sintesi: ['Una reazione deve superare una collina di energia (energia di attivazione). L\'enzima abbassa la collina: la reazione diventa molto più veloce ma arriva allo stesso punto (stesso ΔG, stesso equilibrio). La cinetica misura quanto è veloce: legge di Michaelis–Menten.', 'A reaction has to climb an energy hill (activation energy). The enzyme lowers the hill: the reaction gets much faster but ends at the same place (same ΔG, same equilibrium). Kinetics measures the speed: the Michaelis–Menten law.'],
      punti: [['Catalizzatori biologici, quasi tutti proteine globulari (ribozimi: RNA): accelerano da 10⁵ a 10¹⁷ volte, lavorano a T e pH del corpo, specifici, regolabili.', 'Biological catalysts, almost all globular proteins (ribozymes: RNA): speed-ups of 10⁵–10¹⁷, body temperature and pH, specific, regulated.'],
        ['Cofattore (Mg²⁺, Zn²⁺…), coenzima (NAD⁺, FAD, CoA, TPP, PLP), gruppo prostetico (legato stabilmente), apoenzima + cofattore = oloenzima.', 'Cofactor (Mg²⁺, Zn²⁺…), coenzyme (NAD⁺, FAD, CoA, TPP, PLP), prosthetic group (tightly bound), apoenzyme + cofactor = holoenzyme.'],
        ['Classi EC: 1 ossidoreduttasi, 2 transferasi, 3 idrolasi, 4 liasi, 5 isomerasi, 6 ligasi.', 'EC classes: 1 oxidoreductases, 2 transferases, 3 hydrolases, 4 lyases, 5 isomerases, 6 ligases.'],
        ['k = (k_B·T/h)·e^(−ΔG‡/RT): abbassare ΔG‡ di ≈ 5,7 kJ/mol rende la reazione 10 volte più veloce.', 'k = (k_B·T/h)·e^(−ΔG‡/RT): lowering ΔG‡ by ≈ 5.7 kJ/mol makes it 10 times faster.'],
        ['Catalisi acido–base, covalente, con ioni metallici, per avvicinamento e orientamento: si sommano.', 'Acid–base, covalent, metal-ion catalysis and proximity/orientation: they add up.'],
        ['V₀ = Vmax[S]/(Km + [S]); Km = (k₋₁ + k₂)/k₁; Vmax = k₂[Et]; kcat/Km = efficienza (limite 10⁸–10⁹ M⁻¹s⁻¹).', 'V₀ = Vmax[S]/(Km + [S]); Km = (k₋₁ + k₂)/k₁; Vmax = k₂[Et]; kcat/Km = efficiency (limit 10⁸–10⁹ M⁻¹s⁻¹).'],
        ['Lineweaver–Burk: 1/V₀ = (Km/Vmax)(1/[S]) + 1/Vmax; intercetta y = 1/Vmax, intercetta x = −1/Km.', 'Lineweaver–Burk: 1/V₀ = (Km/Vmax)(1/[S]) + 1/Vmax; y-intercept 1/Vmax, x-intercept −1/Km.'],
        ['Inibitori: competitivo (Km ↑, Vmax =), non competitivo puro (Km =, Vmax ↓), misto, incompetitivo (entrambi ↓, rette parallele).', 'Inhibitors: competitive (Km ↑, Vmax =), pure non-competitive (Km =, Vmax ↓), mixed, uncompetitive (both ↓, parallel lines).'],
        ['Allosterici: più subunità, cooperatività, curva sigmoide, K₀,₅; modelli concertato (Monod, T ⇄ R) e sequenziale (Koshland).', 'Allosteric: several subunits, cooperativity, sigmoid curve, K₀.₅; concerted (Monod, T ⇄ R) and sequential (Koshland) models.']],
      perche: [['Perché è favorito l\'adattamento indotto? Se il sito fosse perfetto per il substrato, ES cadrebbe in una buca profonda e la salita verso ‡ sarebbe più alta. Se le interazioni migliori si formano nello stato di transizione, l\'energia di legame si libera proprio dove serve. Prova: gli analoghi dello stato di transizione si legano molto più forte del substrato.', 'Why induced fit? If the site fitted the substrate perfectly, ES would sit in a deep well and the climb to ‡ would be higher. If the best contacts form in the transition state, binding energy is released exactly where it is needed. Evidence: transition-state analogues bind far more tightly than the substrate.'],
        ['Km è «affinità» solo se k₂ ≪ k₋₁ (allora Km ≈ Kd). Con più tappe o più substrati è una combinazione di costanti.', 'Km means «affinity» only if k₂ ≪ k₋₁ (then Km ≈ Kd). With more steps or substrates it is a mix of constants.']],
      nonDire: [['«l\'enzima abbassa il ΔG della reazione e la rende più spontanea»', '«the enzyme lowers the reaction ΔG and makes it more spontaneous»'], ['«l\'enzima sposta la reazione verso destra»', '«the enzyme shifts the reaction to the right»'], ['«nell\'adattamento indotto cambia la forma del substrato» (cambia soprattutto quella dell\'enzima)', '«in induced fit the substrate changes shape» (mostly the enzyme does)'], ['«Km piccola = buona cooperazione»: si dice affinità', '«small Km = good cooperation»: it is affinity'], ['«Vmax dipende dall\'affinità»: dipende da kcat e [Et]', '«Vmax depends on affinity»: it depends on kcat and [Et]'], ['confondere Km con −1/Km nella Lineweaver–Burk', 'mixing up Km and −1/Km in Lineweaver–Burk']],
      domande: [Q('Cosa aumenta nel grafico un inibitore competitivo?', 'La Km apparente (di un fattore α = 1 + [I]/Ki): la curva si sposta a destra; nella LB aumenta la pendenza. Vmax uguale: con tanto substrato l\'inibitore è spostato. Esempio: malonato sulla succinato DH.', 'What does a competitive inhibitor increase on the plot?', 'The apparent Km (by α = 1 + [I]/Ki): the curve shifts right; in LB the slope rises. Vmax unchanged: lots of substrate displaces the inhibitor. Example: malonate on succinate DH.'),
        Q('Le 3 ipotesi di Michaelis–Menten?', 'Velocità iniziale ([P] ≈ 0); eccesso di substrato ([S] ≫ [E]); stato stazionario di ES (Briggs–Haldane).', 'The 3 Michaelis–Menten assumptions?', 'Initial rate ([P] ≈ 0); substrate excess ([S] ≫ [E]); ES steady state (Briggs–Haldane).'),
        Q('Esochinasi e glucochinasi?', 'Esochinasi Km ≈ 0,1 mM, satura anche a digiuno; glucochinasi del fegato K₀,₅ 8–10 mM, lavora solo quando la glicemia sale.', 'Hexokinase vs glucokinase?', 'Hexokinase Km ≈ 0.1 mM, saturated even when fasting; liver glucokinase K₀.₅ 8–10 mM, works only when blood glucose rises.')],
      orale: ['Gli enzimi sono catalizzatori biologici, quasi tutti proteine, specifici e regolabili, che spesso richiedono cofattori o coenzimi derivati dalle vitamine. Accelerano le reazioni abbassando l\'energia di attivazione ΔG‡: le interazioni deboli col substrato liberano energia di legame che stabilizza lo stato di transizione. Non cambiano il ΔG°′ né l\'equilibrio. Il sito attivo è complementare allo stato di transizione, per cui è favorito l\'adattamento indotto. Per lo schema E + S ⇄ ES → E + P, misurando la velocità iniziale e assumendo lo stato stazionario di ES, si ricava V₀ = Vmax[S]/(Km + [S]), un\'iperbole. Km = (k₋₁ + k₂)/k₁ è la concentrazione di substrato a cui V₀ è metà di Vmax, si misura in molarità e indica l\'affinità solo se k₂ ≪ k₋₁; Vmax = k₂[Et] dipende dalla quantità di enzima. Un inibitore competitivo aumenta la Km apparente lasciando invariata la Vmax. Gli enzimi allosterici, come la PFK-1, hanno cinetica sigmoide.',
        'Enzymes are biological catalysts, almost all proteins, specific and regulated, often needing cofactors or vitamin-derived coenzymes. They speed reactions by lowering the activation energy ΔG‡: weak interactions with the substrate release binding energy that stabilises the transition state. They change neither ΔG°′ nor the equilibrium. The active site is complementary to the transition state, so induced fit is favoured. For E + S ⇄ ES → E + P, measuring the initial rate and assuming an ES steady state gives V₀ = Vmax[S]/(Km + [S]), a hyperbola. Km = (k₋₁ + k₂)/k₁ is the substrate concentration at half Vmax, in molar units, and means affinity only if k₂ ≪ k₋₁; Vmax = k₂[Et] depends on the amount of enzyme. A competitive inhibitor raises the apparent Km and leaves Vmax unchanged. Allosteric enzymes such as PFK-1 show sigmoid kinetics.'] },
    { n: 2, id: 'cofattori', titolo: ['Cofattori e vitamine', 'Cofactors and vitamins'], badge: ['servono in ogni via', 'needed in every pathway'], lab: ['vie', 'pdh'],
      sintesi: ['Molti enzimi usano un coenzima che trasporta qualcosa (elettroni, un gruppo, CO₂). Quasi tutti derivano da una vitamina del gruppo B: capisci cosa trasporta ogni coenzima e capisci metà del metabolismo.', 'Many enzymes use a coenzyme that carries something (electrons, a group, CO₂). Almost all come from a B vitamin: know what each carries and you know half of metabolism.'],
      punti: [['NAD⁺/NADH (niacina, B3): idruro sul C4 della nicotinammide · GAPDH, LDH, PDH, Krebs, β-ossidazione.', 'NAD⁺/NADH (niacin, B3): hydride on nicotinamide C4 · GAPDH, LDH, PDH, Krebs, β-oxidation.'],
        ['NADP⁺/NADPH (B3): idruro per le sintesi · pentosi, enzima malico, sintesi AG.', 'NADP⁺/NADPH (B3): hydride for synthesis · pentose pathway, malic enzyme, FA synthesis.'],
        ['FAD/FADH₂, FMN (riboflavina, B2): 2 e⁻ + 2 H⁺ (anche uno alla volta) su N1 e N5 · E3 della PDH, succinato DH, acil-CoA DH, complesso I.', 'FAD/FADH₂, FMN (riboflavin, B2): 2 e⁻ + 2 H⁺ (also one at a time) on N1 and N5 · PDH E3, succinate DH, acyl-CoA DH, complex I.'],
        ['TPP (tiamina, B1): carbanione sul C2 tiazolico; decarbossilazioni degli α-chetoacidi · PDH E1, α-KG DH, transchetolasi.', 'TPP (thiamine, B1): carbanion on thiazolium C2; α-keto-acid decarboxylations · PDH E1, α-KG DH, transketolase.'],
        ['Lipoato: ponte S–S, acile + 2 e⁻ · PDH E2, α-KG DH.  Coenzima A (pantotenato, B5): –SH terminale, tioesteri.', 'Lipoate: S–S bridge, acyl + 2 e⁻ · PDH E2, α-KG DH.  Coenzyme A (pantothenate, B5): terminal –SH, thioesters.'],
        ['Biotina (B7): CO₂ sull\'N dell\'anello · carbossilasi. PLP (B6): base di Schiff, gruppi amminici · transaminasi, glicogeno fosforilasi. THF (B9): unità a 1 C. B12: riarrangiamenti (metilmalonil-CoA mutasi).', 'Biotin (B7): CO₂ on a ring N · carboxylases. PLP (B6): Schiff base, amino groups · transaminases, glycogen phosphorylase. THF (B9): 1-C units. B12: rearrangements (methylmalonyl-CoA mutase).']],
      perche: [['Perché NAD⁺ e NADP⁺? Il fosfato in più fa da «etichetta»: chi demolisce usa NAD⁺ (nella cellula soprattutto ossidato, pronto a ricevere), chi costruisce usa NADPH (soprattutto ridotto, pronto a dare). I due sistemi non si ostacolano.', 'Why NAD⁺ and NADP⁺? The extra phosphate is a «label»: breakdown uses NAD⁺ (mostly oxidised, ready to accept), synthesis uses NADPH (mostly reduced, ready to give). The two pools do not interfere.']],
      nonDire: [],
      domande: [Q('Il trucco per le reazioni?', 'Deidrogenasi = NAD⁺ (alcol/aldeide) o FAD (crea C=C); chinasi = ATP con Mg²⁺; decarbossilazione di un α-chetoacido = TPP; carbossilasi = biotina + ATP; transaminasi = PLP.', 'The trick for reactions?', 'Dehydrogenase = NAD⁺ (alcohol/aldehyde) or FAD (makes C=C); kinase = ATP with Mg²⁺; α-keto-acid decarboxylation = TPP; carboxylase = biotin + ATP; transaminase = PLP.')],
      orale: ['I coenzimi trasportano elettroni o gruppi e derivano quasi tutti dalle vitamine B: NAD⁺ e NADP⁺ dalla niacina portano un idruro, il primo nelle vie cataboliche e il secondo nelle sintesi; FAD dalla riboflavina porta due elettroni anche uno alla volta; la TPP dalla tiamina decarbossila gli α-chetoacidi grazie al carbanione del C2; il coenzima A dal pantotenato forma tioesteri; la biotina porta la CO₂ nelle carbossilasi; il PLP dalla piridossina lega i gruppi amminici come base di Schiff nelle transaminasi.',
        'Coenzymes carry electrons or groups and almost all come from B vitamins: NAD⁺ and NADP⁺ from niacin carry a hydride, the first in catabolism and the second in synthesis; FAD from riboflavin carries two electrons, even one at a time; TPP from thiamine decarboxylates α-keto acids through its C2 carbanion; coenzyme A from pantothenate forms thioesters; biotin carries CO₂ in carboxylases; PLP from pyridoxine binds amino groups as a Schiff base in transaminases.'] },
    { n: 3, id: 'glicolisi', titolo: ['Glicolisi', 'Glycolysis'], badge: ['chiesta spesso, con la regolazione', 'often asked, with regulation'], lab: ['vie', 'glicolisi'], sezione: 'sglic',
      sintesi: ['Nel citosol il glucosio (6 C) diventa 2 piruvati (3 C): spendo 2 ATP per caricarlo, poi guadagno 4 ATP e 2 NADH. Netto 2 ATP + 2 NADH, anche senza ossigeno.', 'In the cytosol glucose (6 C) becomes 2 pyruvate (3 C): spend 2 ATP to prime it, then gain 4 ATP and 2 NADH. Net 2 ATP + 2 NADH, even without oxygen.'],
      punti: [['Fase di investimento (1–5): esochinasi, isomerasi, PFK-1, aldolasi, TPI. Fase di recupero (6–10, due volte): GAPDH, PGK, mutasi, enolasi, piruvato chinasi.', 'Investment phase (1–5): hexokinase, isomerase, PFK-1, aldolase, TPI. Payoff phase (6–10, twice): GAPDH, PGK, mutase, enolase, pyruvate kinase.'],
        ['Carboni del piruvato: C1 (–COO⁻) dai C3 e C4 del glucosio, C2 (C=O) da C2 e C5, C3 (–CH₃) da C1 e C6.', 'Pyruvate carbons: C1 (–COO⁻) from glucose C3 and C4, C2 (C=O) from C2 and C5, C3 (–CH₃) from C1 and C6.'],
        ['Si regolano solo 1, 3, 10: le tre lontane dall\'equilibrio, irreversibili, quelle che la gluconeogenesi aggira.', 'Only 1, 3, 10 are regulated: the three far from equilibrium, irreversible, the ones gluconeogenesis bypasses.'],
        ['Senza O₂: LDH (piruvato → lattato) rigenera NAD⁺; lieviti: piruvato decarbossilasi (TPP) + alcol DH → etanolo + CO₂.', 'Without O₂: LDH (pyruvate → lactate) regenerates NAD⁺; yeast: pyruvate decarboxylase (TPP) + alcohol DH → ethanol + CO₂.']],
      perche: [['Perché ATP e citrato spengono la PFK-1? Segnalano che c\'è energia e che il Krebs è pieno. Perché l\'AMP la accende? Si accumula quando si consuma ATP: è il segnale più sensibile di carenza.', 'Why do ATP and citrate switch PFK-1 off? They signal plenty of energy and a full Krebs cycle. Why does AMP switch it on? It builds up when ATP is used: the most sensitive low-energy signal.']],
      nonDire: [['«il fruttosio-2,6-bisfosfato attiva la piruvato chinasi»: attiva la PFK-1; la piruvato chinasi è attivata dal fruttosio-1,6-bisfosfato', '«fructose 2,6-bisphosphate activates pyruvate kinase»: it activates PFK-1; pyruvate kinase is activated by fructose 1,6-bisphosphate']],
      domande: [Q('Perché gli eritrociti producono lattato anche con l\'ossigeno?', 'Non hanno mitocondri: la glicolisi è la loro unica fonte di ATP e la LDH l\'unico modo di rigenerare NAD⁺.', 'Why do red cells make lactate even with oxygen?', 'They have no mitochondria: glycolysis is their only ATP source and LDH the only way to regenerate NAD⁺.'),
        Q('Perché 10 passaggi e non uno?', 'Per recuperare l\'energia in piccole quantità (ATP, NADH) invece di disperderla come calore, e per avere più punti di controllo.', 'Why 10 steps and not one?', 'To capture energy in small packets (ATP, NADH) instead of losing it as heat, and to have more control points.'),
        Q('Che cinetica segue la PFK-1?', 'Allosterica, sigmoide.', 'What kinetics does PFK-1 follow?', 'Allosteric, sigmoid.')],
      orale: ['La glicolisi avviene nel citosol e trasforma il glucosio in due molecole di piruvato con un guadagno netto di 2 ATP e 2 NADH, anche in assenza di ossigeno. Nella fase di investimento l\'esochinasi fosforila il glucosio sul C6, l\'isomerasi lo trasforma in fruttosio-6-fosfato e la PFK-1 lo fosforila sul C1; l\'aldolasi rompe il legame C3–C4 dando DHAP e gliceraldeide-3-fosfato, interconvertite dalla trioso fosfato isomerasi. Nella fase di recupero la GAPDH ossida l\'aldeide producendo NADH e un acil-fosfato; la fosfoglicerato chinasi e la piruvato chinasi producono ATP per fosforilazione a livello del substrato. Le tappe regolate sono le tre irreversibili: esochinasi, inibita dal glucosio-6-fosfato; PFK-1, allosterica, inibita da ATP e citrato e attivata da AMP e fruttosio-2,6-bisfosfato, controllato da insulina e glucagone; piruvato chinasi, attivata dal fruttosio-1,6-bisfosfato e inibita da ATP e alanina.',
        'Glycolysis takes place in the cytosol and turns glucose into two pyruvates with a net gain of 2 ATP and 2 NADH, even without oxygen. In the investment phase hexokinase phosphorylates glucose on C6, the isomerase makes fructose 6-phosphate and PFK-1 phosphorylates C1; aldolase breaks the C3–C4 bond into DHAP and glyceraldehyde 3-phosphate, interconverted by triose phosphate isomerase. In the payoff phase GAPDH oxidises the aldehyde making NADH and an acyl phosphate; phosphoglycerate kinase and pyruvate kinase make ATP by substrate-level phosphorylation. The regulated steps are the three irreversible ones: hexokinase, inhibited by glucose 6-phosphate; PFK-1, allosteric, inhibited by ATP and citrate and activated by AMP and fructose 2,6-bisphosphate, controlled by insulin and glucagon; pyruvate kinase, activated by fructose 1,6-bisphosphate and inhibited by ATP and alanine.'] },
    { n: 4, id: 'pdh', titolo: ['Piruvato deidrogenasi (PDH)', 'Pyruvate dehydrogenase (PDH)'], badge: ['chiesta all\'ultimo orale', 'asked at the last oral'], lab: ['vie', 'pdh'],
      sintesi: ['Il ponte fra glicolisi e Krebs: nella matrice il piruvato (3 C) diventa acetil-CoA (2 C), il carbossile esce come CO₂ e intanto si forma NADH: decarbossilazione ossidativa, irreversibile.', 'The bridge between glycolysis and Krebs: in the matrix pyruvate (3 C) becomes acetyl-CoA (2 C), the carboxyl leaves as CO₂ and NADH forms: oxidative decarboxylation, irreversible.'],
      punti: [['Il piruvato entra con le porine (membrana esterna) e con l\'MPC (interna, simporto con H⁺).', 'Pyruvate enters through porins (outer membrane) and MPC (inner, symport with H⁺).'],
        ['3 enzimi, 5 cofattori: E1 (TPP), E2 (lipoato, CoA), E3 (FAD, NAD⁺). Nucleo di 60 E2, più copie di E1 ed E3, una chinasi e una fosfatasi.', '3 enzymes, 5 cofactors: E1 (TPP), E2 (lipoate, CoA), E3 (FAD, NAD⁺). A core of 60 E2, copies of E1 and E3, a kinase and a phosphatase.'],
        ['TPP e lipoato catalitici, CoA e NAD⁺ stechiometrici (substrati), FAD catalitico.', 'TPP and lipoate catalytic, CoA and NAD⁺ stoichiometric (substrates), FAD catalytic.'],
        ['Regolazione: prodotti (acetil-CoA, NADH) e fosforilazione — la PDH chinasi (+ ATP, NADH, acetil-CoA) la spegne, la fosfatasi (+ Ca²⁺, Mg²⁺, insulina) la accende.', 'Regulation: products (acetyl-CoA, NADH) and phosphorylation — PDH kinase (+ ATP, NADH, acetyl-CoA) switches it off, the phosphatase (+ Ca²⁺, Mg²⁺, insulin) on.'],
        ['Clinica: carenza di B1 (beriberi, Wernicke) → acidosi lattica; l\'arsenito lega i due –SH della diidrolipoamide e blocca E2.', 'Clinic: B1 deficiency (beriberi, Wernicke) → lactic acidosis; arsenite binds the two dihydrolipoamide –SH and blocks E2.']],
      perche: [['Perché un complesso e non tre enzimi? Il braccio della lipoamide (≈ 14 Å) porta il gruppo da E1 a E2 a E3 senza che si stacchi: canalizzazione del substrato, più veloce, niente perdite né reazioni laterali. Lo stesso schema è nell\'α-chetoglutarato DH.', 'Why a complex and not three enzymes? The lipoamide arm (≈ 14 Å) carries the group from E1 to E2 to E3 without letting go: substrate channelling, faster, no losses or side reactions. The same design is in α-ketoglutarate DH.'],
        ['Perché l\'insulina la attiva? Dopo il pasto il glucosio in eccesso diventa acetil-CoA per fare acidi grassi. A digiuno la β-ossidazione produce acetil-CoA e NADH che la spengono: il piruvato resta per la gluconeogenesi.', 'Why does insulin activate it? After a meal extra glucose becomes acetyl-CoA for fatty acids. When fasting, β-oxidation makes acetyl-CoA and NADH that switch it off: pyruvate is kept for gluconeogenesis.']],
      nonDire: [],
      domande: [Q('Quale carbonio del piruvato diventa CO₂?', 'Il C1, il carbossile (che nel glucosio era il C3 o il C4).', 'Which pyruvate carbon becomes CO₂?', 'C1, the carboxyl (glucose C3 or C4).'),
        Q('Quali sono i 3 enzimi e i 5 cofattori?', 'E1 (TPP), E2 (lipoato, CoA), E3 (FAD, NAD⁺).', 'The 3 enzymes and 5 cofactors?', 'E1 (TPP), E2 (lipoate, CoA), E3 (FAD, NAD⁺).'),
        Q('Quale altro enzima funziona allo stesso modo?', 'L\'α-chetoglutarato deidrogenasi del ciclo di Krebs.', 'Which other enzyme works the same way?', 'α-ketoglutarate dehydrogenase of the Krebs cycle.')],
      orale: ['La piruvato deidrogenasi si trova nella matrice mitocondriale, dove il piruvato arriva con il trasportatore MPC. È un complesso di tre enzimi e cinque cofattori che catalizza la decarbossilazione ossidativa irreversibile del piruvato ad acetil-CoA, con produzione di CO₂ e NADH. E1, con la tiamina pirofosfato, decarbossila il piruvato: il carbanione della TPP attacca il carbonile e il C1 esce come CO₂, formando idrossietil-TPP. L\'idrossietile viene ossidato e trasferito alla lipoamide di E2 come acetile; E2 lo cede al coenzima A formando acetil-CoA e lascia la diidrolipoamide. E3 la riossida con il FAD, e il FADH₂ cede gli elettroni al NAD⁺ formando NADH. Il braccio della lipoamide permette la canalizzazione del substrato. La PDH è inibita dai prodotti, acetil-CoA e NADH, e dalla fosforilazione operata dalla PDH chinasi; la PDH fosfatasi, attivata da Ca²⁺ e insulina, la riattiva.',
        'Pyruvate dehydrogenase sits in the mitochondrial matrix, where pyruvate arrives through the MPC carrier. It is a complex of three enzymes and five cofactors catalysing the irreversible oxidative decarboxylation of pyruvate to acetyl-CoA, making CO₂ and NADH. E1, with thiamine pyrophosphate, decarboxylates pyruvate: the TPP carbanion attacks the carbonyl and C1 leaves as CO₂, giving hydroxyethyl-TPP. The hydroxyethyl is oxidised and transferred to E2 lipoamide as acetyl; E2 hands it to coenzyme A forming acetyl-CoA and leaves dihydrolipoamide. E3 reoxidises it with FAD, and FADH₂ passes its electrons to NAD⁺ forming NADH. The lipoamide arm allows substrate channelling. PDH is inhibited by its products, acetyl-CoA and NADH, and by phosphorylation by PDH kinase; PDH phosphatase, activated by Ca²⁺ and insulin, reactivates it.'] },
    { n: 5, id: 'krebs', titolo: ['Ciclo di Krebs', 'Krebs cycle'], badge: ['', ''], lab: ['vie', 'krebs'], sezione: 'skrebs',
      sintesi: ['Nella matrice l\'acetile (2 C) si unisce all\'ossalacetato (4 C) e forma citrato (6 C). In 8 reazioni il ciclo perde 2 CO₂, torna all\'ossalacetato e raccoglie 3 NADH + 1 FADH₂ + 1 GTP (≈ 10 ATP).', 'In the matrix acetyl (2 C) joins oxaloacetate (4 C) to form citrate (6 C). In 8 reactions the cycle loses 2 CO₂, returns to oxaloacetate and collects 3 NADH + 1 FADH₂ + 1 GTP (≈ 10 ATP).'],
      punti: [['Le due CO₂ di un giro vengono dai carboni dell\'ossalacetato, non dall\'acetile appena entrato; l\'acetile esce nei giri successivi. Il bilancio non cambia: nessun ossalacetato in più (l\'acetil-CoA non dà glucosio).', 'The two CO₂ of a turn come from oxaloacetate carbons, not from the acetyl just added; the acetyl leaves in later turns. The balance is the same: no net oxaloacetate (acetyl-CoA gives no glucose).'],
        ['Glucosio completo: glicolisi 2 ATP + 2 NADH (3 o 5 ATP), 2 PDH = 5, 2 giri di Krebs = 20 → 30–32 ATP.', 'Whole glucose: glycolysis 2 ATP + 2 NADH (3 or 5 ATP), 2 PDH = 5, 2 Krebs turns = 20 → 30–32 ATP.'],
        ['Regolate 1, 3, 4: inibite da ATP, NADH, succinil-CoA (citrato sulla sintasi); attivate da ADP e Ca²⁺.', 'Regulated 1, 3, 4: inhibited by ATP, NADH, succinyl-CoA (citrate on the synthase); activated by ADP and Ca²⁺.'],
        ['Anfibolico: citrato → acidi grassi; α-KG → glutammato; succinil-CoA → eme; ossalacetato → aspartato, glucosio. Anaplerosi: piruvato carbossilasi.', 'Amphibolic: citrate → fatty acids; α-KG → glutamate; succinyl-CoA → heme; oxaloacetate → aspartate, glucose. Anaplerosis: pyruvate carboxylase.']],
      perche: [['Le reazioni 6–7–8 sono quelle della β-ossidazione: ossida con FAD (doppio legame) → aggiungi acqua (–OH) → ossida con NAD⁺ (C=O). Imparate qui, si sanno anche là.', 'Reactions 6–7–8 are the β-oxidation ones: oxidise with FAD (double bond) → add water (–OH) → oxidise with NAD⁺ (C=O). Learn them here and you know them there.']],
      nonDire: [],
      domande: [Q('Perché la malato deidrogenasi procede con ΔG°′ positivo?', 'Perché l\'ossalacetato viene consumato subito dalla citrato sintasi.', 'Why does malate DH run with a positive ΔG°′?', 'Because citrate synthase uses the oxaloacetate at once.'),
        Q('Che si fa con il citrato accumulato?', 'Esce nel citosol: l\'ATP-citrato liasi dà acetil-CoA per la sintesi degli acidi grassi; nel citosol inibisce la PFK-1 e attiva l\'ACC.', 'What happens to excess citrate?', 'It goes to the cytosol: ATP-citrate lyase gives acetyl-CoA for fatty acid synthesis; there it inhibits PFK-1 and activates ACC.')],
      orale: ['Il ciclo di Krebs avviene nella matrice mitocondriale. La citrato sintasi condensa l\'acetil-CoA con l\'ossalacetato formando citrato; l\'aconitasi lo isomerizza a isocitrato; l\'isocitrato deidrogenasi e l\'α-chetoglutarato deidrogenasi, quest\'ultima con gli stessi cofattori della PDH, catalizzano due decarbossilazioni ossidative che producono 2 CO₂ e 2 NADH; la succinil-CoA sintetasi produce GTP per fosforilazione a livello del substrato; succinato deidrogenasi, fumarasi e malato deidrogenasi rigenerano l\'ossalacetato producendo FADH₂ e NADH. Per ogni acetil-CoA si ottengono 3 NADH, 1 FADH₂ e 1 GTP, circa 10 ATP. Le tappe regolate sono le tre irreversibili, inibite da ATP, NADH e succinil-CoA e attivate da ADP e Ca²⁺. Il ciclo è anfibolico e viene rifornito dalla piruvato carbossilasi.',
        'The Krebs cycle takes place in the mitochondrial matrix. Citrate synthase condenses acetyl-CoA with oxaloacetate to form citrate; aconitase isomerises it to isocitrate; isocitrate dehydrogenase and α-ketoglutarate dehydrogenase, the latter with the same cofactors as PDH, catalyse two oxidative decarboxylations making 2 CO₂ and 2 NADH; succinyl-CoA synthetase makes GTP by substrate-level phosphorylation; succinate dehydrogenase, fumarase and malate dehydrogenase regenerate oxaloacetate making FADH₂ and NADH. Each acetyl-CoA gives 3 NADH, 1 FADH₂ and 1 GTP, about 10 ATP. The regulated steps are the three irreversible ones, inhibited by ATP, NADH and succinyl-CoA and activated by ADP and Ca²⁺. The cycle is amphibolic and refilled by pyruvate carboxylase.'] },
    { n: 6, id: 'catena', titolo: ['Catena respiratoria e fosforilazione ossidativa', 'Respiratory chain and oxidative phosphorylation'], badge: ['l\'ossigrafo è chiesto all\'orale', 'the oxygraph is asked at the oral'], lab: ['atp'], sezione: 'setc',
      sintesi: ['NADH e FADH₂ cedono gli elettroni a una catena di complessi nella membrana interna; gli elettroni scendono fino all\'O₂ (acqua) e l\'energia pompa H⁺ nello spazio intermembrana. Gli H⁺ rientrano dall\'ATP sintasi, che fa ATP: teoria chemiosmotica di Mitchell.', 'NADH and FADH₂ hand electrons to a chain of complexes in the inner membrane; the electrons fall to O₂ (water) and the energy pumps H⁺ into the intermembrane space. H⁺ flow back through ATP synthase, which makes ATP: Mitchell\'s chemiosmotic theory.'],
      punti: [['Complessi: I (NADH → CoQ, FMN e Fe-S, 4 H⁺, rotenone), II (succinato → CoQ, 0 H⁺, malonato), III (CoQH₂ → cit c, ciclo Q, 4 H⁺, antimicina A), IV (cit c → O₂, 2 H⁺ + 2 consumati, cianuro, CO, azide), V (ATP sintasi, oligomicina).', 'Complexes: I (NADH → CoQ, FMN and Fe-S, 4 H⁺, rotenone), II (succinate → CoQ, 0 H⁺, malonate), III (CoQH₂ → cyt c, Q cycle, 4 H⁺, antimycin A), IV (cyt c → O₂, 2 H⁺ + 2 consumed, cyanide, CO, azide), V (ATP synthase, oligomycin).'],
        ['E′° da −0,32 V (NADH) a +0,82 V (O₂): ΔG = −nFΔE.', 'E′° from −0.32 V (NADH) to +0.82 V (O₂): ΔG = −nFΔE.'],
        ['Navette: glicerolo-3-P (muscolo, cervello; FAD → CoQ, 1,5 ATP) e malato–aspartato (fegato, rene, cuore; 2,5 ATP).', 'Shuttles: glycerol 3-P (muscle, brain; FAD → CoQ, 1.5 ATP) and malate–aspartate (liver, kidney, heart; 2.5 ATP).'],
        ['ATP sintasi: F₀ nella membrana (anello c che ruota, canale degli H⁺), F₁ nella matrice (3 coppie αβ, fusto γ che ruota). Catalisi rotazionale di Boyer: ogni β passa per L (lega ADP + Pᵢ), T (forma ATP), O (rilascia). L\'energia serve a rilasciare l\'ATP.', 'ATP synthase: F₀ in the membrane (rotating c ring, H⁺ channel), F₁ in the matrix (3 αβ pairs, rotating γ stalk). Boyer\'s rotational catalysis: each β goes through L (binds ADP + Pᵢ), T (makes ATP), O (releases). The energy is spent releasing ATP.'],
        ['P/O: NADH 10 H⁺ / 4 = 2,5; FADH₂ 6 H⁺ / 4 = 1,5 (≈ 3 H⁺ al rotore + 1 per il trasporto di ADP e Pᵢ).', 'P/O: NADH 10 H⁺ / 4 = 2.5; FADH₂ 6 H⁺ / 4 = 1.5 (≈ 3 H⁺ for the rotor + 1 for ADP and Pᵢ transport).']],
      perche: [['Controllo respiratorio: la catena va veloce solo se c\'è ADP. Senza ADP l\'ATP sintasi si ferma, il gradiente diventa massimo e il consumo di O₂ si ferma: è il bisogno di ATP a decidere quanto ossigeno si consuma.', 'Respiratory control: the chain runs fast only with ADP. Without ADP ATP synthase stops, the gradient maxes out and O₂ use stops: the need for ATP decides how much oxygen is used.'],
        ['Termogenesi: nel tessuto adiposo bruno la UCP1 (termogenina) fa rientrare gli H⁺ senza ATP sintasi: l\'energia diventa calore.', 'Thermogenesis: in brown fat UCP1 (thermogenin) lets H⁺ back without ATP synthase: the energy becomes heat.']],
      nonDire: [['dire che il complesso II pompa protoni: non pompa', 'saying complex II pumps protons: it does not'], ['dire che l\'oligomicina blocca la catena: blocca l\'ATP sintasi; la catena si ferma solo di conseguenza', 'saying oligomycin blocks the chain: it blocks ATP synthase; the chain stops only as a consequence'], ['dire che il disaccoppiante blocca il consumo di O₂: lo aumenta', 'saying an uncoupler blocks O₂ use: it increases it']],
      domande: [Q('L\'esperimento all\'ossigrafo?', 'Mitocondri + succinato: poco O₂. + ADP: il consumo sale e si fa ATP. + oligomicina: si fermano ATP e consumo. + disaccoppiante (DNP, FCCP): l\'O₂ si consuma di nuovo, niente ATP. + cianuro: si ferma tutto. Trasporto di elettroni e sintesi di ATP sono accoppiati dal gradiente.', 'The oxygraph experiment?', 'Mitochondria + succinate: little O₂ use. + ADP: use rises and ATP is made. + oligomycin: ATP and O₂ use stop. + uncoupler (DNP, FCCP): O₂ use resumes, no ATP. + cyanide: everything stops. Electron transport and ATP synthesis are coupled by the gradient.'),
        Q('Chi è l\'accettore finale?', 'L\'O₂, ridotto ad acqua dal complesso IV.', 'The final acceptor?', 'O₂, reduced to water by complex IV.'),
        Q('Cosa regola la fosforilazione ossidativa?', 'La disponibilità di ADP (controllo respiratorio).', 'What regulates oxidative phosphorylation?', 'ADP availability (respiratory control).')],
      orale: ['La fosforilazione ossidativa avviene nella membrana mitocondriale interna. Il NADH della matrice viene da PDH, Krebs e β-ossidazione; quello della glicolisi entra con le navette: il malato-aspartato rende 2,5 ATP, il glicerolo-3-fosfato, che dà gli elettroni al CoQ tramite FAD, 1,5. Gli elettroni passano dal complesso I al coenzima Q, al complesso III, al citocromo c e al complesso IV che riduce l\'ossigeno ad acqua; I, III e IV pompano protoni. Il gradiente elettrochimico, secondo la teoria chemiosmotica, fa ruotare l\'ATP sintasi, che sintetizza ATP con meccanismo rotazionale. Il processo è regolato dalla disponibilità di ADP; all\'ossigrafo l\'oligomicina blocca sia la sintesi di ATP sia il consumo di ossigeno, mentre un disaccoppiante ripristina il consumo senza produrre ATP.',
        'Oxidative phosphorylation takes place in the inner mitochondrial membrane. Matrix NADH comes from PDH, Krebs and β-oxidation; glycolytic NADH enters through the shuttles: malate–aspartate gives 2.5 ATP, glycerol 3-phosphate, which passes electrons to CoQ via FAD, 1.5. Electrons go from complex I to coenzyme Q, complex III, cytochrome c and complex IV, which reduces oxygen to water; I, III and IV pump protons. The electrochemical gradient, according to chemiosmotic theory, turns ATP synthase, which makes ATP by a rotary mechanism. The process is regulated by ADP availability; in the oxygraph oligomycin blocks both ATP synthesis and oxygen use, while an uncoupler restores oxygen use without making ATP.'] },
    { n: 7, id: 'acidigrassi', titolo: ['Acidi grassi: lipolisi, trasporto, β-ossidazione, corpi chetonici', 'Fatty acids: lipolysis, transport, β-oxidation, ketone bodies'], badge: ['chiesti all\'orale', 'asked at the oral'], lab: ['vie', 'beta'], sezione: 'sbeta',
      sintesi: ['La forma di energia più concentrata. Si libera dai trigliceridi, viaggia con l\'albumina, si attiva col CoA, entra nel mitocondrio con la carnitina e si taglia a pezzi da 2 C: ogni taglio dà 1 FADH₂ + 1 NADH + 1 acetil-CoA.', 'The most concentrated energy store. Released from triglycerides, carried by albumin, activated with CoA, brought into the mitochondrion by carnitine and cut into 2-C pieces: each cut gives 1 FADH₂ + 1 NADH + 1 acetyl-CoA.'],
      punti: [['Lipolisi: glucagone/adrenalina → cAMP → PKA → perilipina e HSL fosforilate; ATGL → HSL → MAG lipasi. L\'insulina la spegne (fosfodiesterasi).', 'Lipolysis: glucagon/adrenaline → cAMP → PKA → perilipin and HSL phosphorylated; ATGL → HSL → MAG lipase. Insulin switches it off (phosphodiesterase).'],
        ['Attivazione: acil-CoA sintetasi (membrana esterna), ATP → AMP + PPᵢ = 2 ATP. Shuttle: CPT I (esterna, inibita dal malonil-CoA) → translocasi (interna) → CPT II.', 'Activation: acyl-CoA synthetase (outer membrane), ATP → AMP + PPᵢ = 2 ATP. Shuttle: CPT I (outer, inhibited by malonyl-CoA) → translocase (inner) → CPT II.'],
        ['β-ossidazione: acil-CoA DH (FAD), enoil-CoA idratasi, β-idrossiacil-CoA DH (NAD⁺), tiolasi.', 'β-oxidation: acyl-CoA DH (FAD), enoyl-CoA hydratase, β-hydroxyacyl-CoA DH (NAD⁺), thiolase.'],
        ['ATP da un Cn pari: giri = n/2 − 1; ATP = 4·(n/2 − 1) + 10·(n/2) − 2. C8 = 50, C16 = 106.', 'ATP from an even Cn: turns = n/2 − 1; ATP = 4·(n/2 − 1) + 10·(n/2) − 2. C8 = 50, C16 = 106.'],
        ['Dispari: propionil-CoA → metilmalonil-CoA → succinil-CoA (biotina, B12). Insaturi: isomerasi e 2,4-dienoil-CoA reduttasi. > C22: perossisomi.', 'Odd: propionyl-CoA → methylmalonyl-CoA → succinyl-CoA (biotin, B12). Unsaturated: isomerase and 2,4-dienoyl-CoA reductase. > C22: peroxisomes.'],
        ['Corpi chetonici (fegato a digiuno): 2 acetil-CoA → acetoacetil-CoA → HMG-CoA (sintasi regolata) → acetoacetato → β-idrossibutirrato (o acetone). Il fegato non li usa: non ha la tioforasi.', 'Ketone bodies (fasting liver): 2 acetyl-CoA → acetoacetyl-CoA → HMG-CoA (regulated synthase) → acetoacetate → β-hydroxybutyrate (or acetone). The liver cannot use them: no thiophorase.']],
      perche: [['Perché tutto il giro della carnitina? La membrana interna non lascia passare CoA e acil-CoA: così il CoA del citosol (sintesi) resta separato da quello della matrice (ossidazione). Il malonil-CoA blocca la CPT I: gli acidi grassi appena fatti non vengono bruciati.', 'Why the carnitine detour? The inner membrane lets neither CoA nor acyl-CoA through: cytosolic CoA (synthesis) stays apart from matrix CoA (oxidation). Malonyl-CoA blocks CPT I: newly made fatty acids are not burned.'],
        ['Perché gli animali non fanno glucosio dagli acidi grassi? La PDH è irreversibile e nel Krebs per ogni acetile escono 2 CO₂. Piante e batteri hanno il ciclo del gliossilato.', 'Why can animals not make glucose from fatty acids? PDH is irreversible and Krebs loses 2 CO₂ per acetyl. Plants and bacteria have the glyoxylate cycle.']],
      nonDire: [['dire che la CPT fa attraversare la membrana: lo fa la translocasi', 'saying CPT carries it across the membrane: the translocase does'], ['dire «2 NADH per giro»: 1 FADH₂ + 1 NADH', 'saying «2 NADH per turn»: 1 FADH₂ + 1 NADH'], ['contare 4 giri per un C8: sono 3', 'counting 4 turns for a C8: it is 3'], ['dimenticare i −2 ATP dell\'attivazione', 'forgetting the −2 ATP of activation']],
      domande: [Q('Quanti ATP da un C8?', '3 giri, 4 acetil-CoA: 12 + 40 − 2 = 50 ATP.', 'How much ATP from a C8?', '3 turns, 4 acetyl-CoA: 12 + 40 − 2 = 50 ATP.'),
        Q('Chi trasporta gli acidi grassi nel sangue?', 'L\'albumina, prodotta dal fegato.', 'What carries fatty acids in blood?', 'Albumin, made by the liver.'),
        Q('Perché il fegato non usa i corpi chetonici?', 'Manca la tioforasi.', 'Why does the liver not use ketone bodies?', 'It lacks thiophorase.')],
      orale: ['Nel digiuno glucagone e adrenalina, tramite cAMP e PKA, fosforilano perilipina e lipasi ormono-sensibile e attivano la lipolisi nel citosol dell\'adipocita: ATGL, HSL e MAG lipasi liberano glicerolo e tre acidi grassi. Gli acidi grassi viaggiano nel sangue legati all\'albumina prodotta dal fegato. Nella cellula vengono attivati ad acil-CoA dall\'acil-CoA sintetasi, al costo di 2 ATP, ed entrano nel mitocondrio con lo shuttle della carnitina: CPT I, translocasi e CPT II; la CPT I è inibita dal malonil-CoA. Nella matrice la β-ossidazione ripete quattro reazioni: deidrogenazione con FAD, idratazione, deidrogenazione con NAD⁺ e tiolisi, liberando un acetil-CoA, un FADH₂ e un NADH per giro. Un acido grasso a 8 carboni fa 3 giri e dà 4 acetil-CoA, per un totale di 50 ATP. L\'acetil-CoA entra nel Krebs o, nel fegato a digiuno, forma i corpi chetonici.',
        'During fasting glucagon and adrenaline, via cAMP and PKA, phosphorylate perilipin and hormone-sensitive lipase and switch on lipolysis in the adipocyte cytosol: ATGL, HSL and MAG lipase release glycerol and three fatty acids. Fatty acids travel in blood bound to albumin made by the liver. In the cell they are activated to acyl-CoA by acyl-CoA synthetase, at a cost of 2 ATP, and enter the mitochondrion through the carnitine shuttle: CPT I, translocase and CPT II; CPT I is inhibited by malonyl-CoA. In the matrix β-oxidation repeats four reactions: dehydrogenation with FAD, hydration, dehydrogenation with NAD⁺ and thiolysis, releasing one acetyl-CoA, one FADH₂ and one NADH per turn. An 8-carbon fatty acid makes 3 turns and gives 4 acetyl-CoA, 50 ATP in total. Acetyl-CoA enters Krebs or, in the fasting liver, forms ketone bodies.'] },
    { n: 8, id: 'gluconeo', titolo: ['Gluconeogenesi', 'Gluconeogenesis'], badge: ['', ''], lab: ['vie', 'gluconeo'], sezione: 'sgluco',
      sintesi: ['A digiuno il fegato (e un po\' il rene) costruisce glucosio da lattato, alanina, glicerolo e propionil-CoA. Usa 7 enzimi della glicolisi al contrario e aggira le 3 tappe irreversibili con 4 enzimi diversi.', 'When fasting the liver (and some kidney) builds glucose from lactate, alanine, glycerol and propionyl-CoA. It runs 7 glycolytic enzymes backwards and bypasses the 3 irreversible steps with 4 different enzymes.'],
      punti: [['Piruvato chinasi → piruvato carbossilasi (biotina, ATP, mitocondrio, + acetil-CoA) + PEPCK (GTP). PFK-1 → FBPasi-1 (− F-2,6-BP, AMP). Esochinasi → glucosio-6-fosfatasi (RE, solo fegato e rene).', 'Pyruvate kinase → pyruvate carboxylase (biotin, ATP, mitochondrion, + acetyl-CoA) + PEPCK (GTP). PFK-1 → FBPase-1 (− F-2,6-BP, AMP). Hexokinase → glucose 6-phosphatase (ER, liver and kidney only).'],
        ['L\'ossalacetato non attraversa la membrana interna: esce come malato e nel citosol torna ossalacetato liberando il NADH che servirà alla GAPDH.', 'Oxaloacetate cannot cross the inner membrane: it leaves as malate and becomes oxaloacetate again in the cytosol, releasing the NADH that GAPDH will need.'],
        ['Costo: 4 ATP + 2 GTP + 2 NADH per glucosio (la glicolisi ne restituisce 2): ΔG′ ≈ −38 kJ/mol.', 'Cost: 4 ATP + 2 GTP + 2 NADH per glucose (glycolysis gives back 2): ΔG′ ≈ −38 kJ/mol.']],
      perche: [['Perché la regolazione opposta? Glicolisi e gluconeogenesi insieme sarebbero un ciclo futile (F6P → F-1,6-BP → F6P) che consuma ATP e fa calore. Lo stesso segnale accende una via e spegne l\'altra.', 'Why opposite regulation? Both together would be a futile cycle (F6P → F-1,6-BP → F6P) burning ATP into heat. The same signal turns one on and the other off.']],
      nonDire: [],
      domande: [Q('Gli enzimi diversi dalla glicolisi?', 'Piruvato carbossilasi, PEPCK, fruttosio-1,6-bisfosfatasi, glucosio-6-fosfatasi.', 'The enzymes not shared with glycolysis?', 'Pyruvate carboxylase, PEPCK, fructose 1,6-bisphosphatase, glucose 6-phosphatase.'),
        Q('Perché il muscolo non rilascia glucosio?', 'Non ha la glucosio-6-fosfatasi.', 'Why does muscle not release glucose?', 'It has no glucose 6-phosphatase.'),
        Q('Si fa glucosio dagli acidi grassi?', 'No (pari): solo dal glicerolo e dal propionil-CoA dei dispari.', 'Can glucose be made from fatty acids?', 'No (even ones): only from glycerol and the propionyl-CoA of odd ones.')],
      orale: ['La gluconeogenesi avviene nel fegato e nel rene durante il digiuno, partendo da lattato, alanina, glicerolo e propionil-CoA, mai dall\'acetil-CoA. Usa gli enzimi reversibili della glicolisi e aggira le tre tappe irreversibili: la piruvato carbossilasi, con biotina e attivata dall\'acetil-CoA, e la PEP carbossichinasi trasformano il piruvato in PEP; la fruttosio-1,6-bisfosfatasi e la glucosio-6-fosfatasi sostituiscono PFK-1 ed esochinasi. È regolata in modo opposto alla glicolisi, soprattutto dal fruttosio-2,6-bisfosfato, che attiva la PFK-1 e inibisce la FBPasi, per evitare cicli futili.',
        'Gluconeogenesis takes place in liver and kidney during fasting, starting from lactate, alanine, glycerol and propionyl-CoA, never from acetyl-CoA. It uses the reversible glycolytic enzymes and bypasses the three irreversible steps: pyruvate carboxylase, with biotin and activated by acetyl-CoA, and PEP carboxykinase turn pyruvate into PEP; fructose 1,6-bisphosphatase and glucose 6-phosphatase replace PFK-1 and hexokinase. It is regulated opposite to glycolysis, mainly by fructose 2,6-bisphosphate, which activates PFK-1 and inhibits FBPase, avoiding futile cycles.'] },
    { n: 9, id: 'urea', titolo: ['Proteine, amminoacidi e ciclo dell\'urea', 'Proteins, amino acids and the urea cycle'], badge: ['', ''], lab: ['vie', 'urea'], sezione: 'surea',
      sintesi: ['Le proteine diventano amminoacidi; l\'azoto si raccoglie sul glutammato, si libera come NH₄⁺ (tossico) e nel fegato diventa urea. Lo scheletro diventa piruvato, acetil-CoA o intermedi del Krebs.', 'Proteins become amino acids; nitrogen collects on glutamate, is released as NH₄⁺ (toxic) and becomes urea in the liver. The skeleton becomes pyruvate, acetyl-CoA or Krebs intermediates.'],
      punti: [['Ubiquitina–proteasoma: E1 (ATP), E2, E3 ligasi; ≥ 4 ubiquitine → proteasoma 26S. Lisosomi: proteine extracellulari, autofagia.', 'Ubiquitin–proteasome: E1 (ATP), E2, E3 ligase; ≥ 4 ubiquitins → 26S proteasome. Lysosomes: extracellular proteins, autophagy.'],
        ['Transaminasi (ALT, AST; PLP, ping-pong): amminoacido + α-KG → α-chetoacido + glutammato. Glutammato DH (mitocondrio epatico): glutammato → α-KG + NH₄⁺.', 'Transaminases (ALT, AST; PLP, ping-pong): amino acid + α-KG → α-keto acid + glutamate. Glutamate DH (liver mitochondria): glutamate → α-KG + NH₄⁺.'],
        ['Trasporto: glutammina dai tessuti (glutammina sintetasi), alanina dal muscolo (ciclo glucosio–alanina).', 'Transport: glutamine from tissues (glutamine synthetase), alanine from muscle (glucose–alanine cycle).'],
        ['Urea: CPS I (+ N-acetilglutammato), OTC, argininosuccinato sintetasi, argininosuccinasi, arginasi. 4 legami ad alta energia per urea.', 'Urea: CPS I (+ N-acetylglutamate), OTC, argininosuccinate synthetase, argininosuccinase, arginase. 4 high-energy bonds per urea.'],
        ['Scheletri glucogenici (→ piruvato o Krebs) e chetogenici (→ acetil-CoA; solo Leu e Lys puramente chetogenici).', 'Glucogenic skeletons (→ pyruvate or Krebs) and ketogenic (→ acetyl-CoA; only Leu and Lys purely ketogenic).']],
      perche: [['La «bicicletta di Krebs»: il fumarato del ciclo dell\'urea diventa malato → ossalacetato → aspartato, che porta il 2° azoto. Così i due cicli sono collegati.', 'The «Krebs bicycle»: urea-cycle fumarate becomes malate → oxaloacetate → aspartate, which brings the 2nd nitrogen. The two cycles are linked.']],
      nonDire: [],
      domande: [Q('Da dove vengono i 2 azoti dell\'urea?', 'Il 1° dall\'NH₄⁺ (carbamil fosfato), il 2° dall\'aspartato. Il carbonio dal HCO₃⁻.', 'Where do the 2 urea nitrogens come from?', 'The 1st from NH₄⁺ (carbamoyl phosphate), the 2nd from aspartate. The carbon from HCO₃⁻.'),
        Q('Che cofattore usano le transaminasi?', 'PLP (B6), meccanismo ping-pong.', 'What cofactor do transaminases use?', 'PLP (B6), ping-pong mechanism.'),
        Q('Come arriva l\'azoto al fegato?', 'Come glutammina dai tessuti, come alanina dal muscolo.', 'How does nitrogen reach the liver?', 'As glutamine from tissues, as alanine from muscle.')],
      orale: ['Le proteine intracellulari sono degradate dal sistema ubiquitina–proteasoma. Il gruppo amminico degli amminoacidi viene trasferito all\'α-chetoglutarato dalle aminotransferasi, che usano il piridossal fosfato, formando glutammato; nel fegato la glutammato deidrogenasi libera NH₄⁺. Dai tessuti l\'azoto arriva come glutammina, dal muscolo come alanina. Nel ciclo dell\'urea la carbamil fosfato sintetasi I, attivata dall\'N-acetilglutammato, porta il primo azoto; l\'aspartato porta il secondo; l\'arginasi libera l\'urea e rigenera l\'ornitina. Il fumarato collega il ciclo dell\'urea al ciclo di Krebs.',
        'Intracellular proteins are degraded by the ubiquitin–proteasome system. The amino group is transferred to α-ketoglutarate by aminotransferases, which use pyridoxal phosphate, forming glutamate; in the liver glutamate dehydrogenase releases NH₄⁺. Nitrogen arrives from tissues as glutamine and from muscle as alanine. In the urea cycle carbamoyl phosphate synthetase I, activated by N-acetylglutamate, brings the first nitrogen; aspartate brings the second; arginase releases urea and regenerates ornithine. Fumarate links the urea cycle to the Krebs cycle.'] },
    { n: 10, id: 'sintesiag', titolo: ['Biosintesi degli acidi grassi', 'Fatty acid biosynthesis'], badge: ['', ''], lab: ['vie', 'sintesiag'],
      sintesi: ['Dopo un pasto ricco (insulina) l\'acetil-CoA in eccesso diventa palmitato (C16): la β-ossidazione al contrario, ma nel citosol, con il malonil-CoA come donatore di 2 C, il NADPH come riducente e la catena legata all\'ACP.', 'After a rich meal (insulin) excess acetyl-CoA becomes palmitate (C16): β-oxidation in reverse, but in the cytosol, with malonyl-CoA as 2-C donor, NADPH as reductant and the chain on ACP.'],
      punti: [['L\'acetil-CoA esce come citrato (citrato sintasi) e l\'ATP-citrato liasi lo libera nel citosol; l\'ossalacetato torna piruvato (malato DH → enzima malico) producendo NADPH.', 'Acetyl-CoA leaves as citrate (citrate synthase) and ATP-citrate lyase frees it in the cytosol; oxaloacetate returns to pyruvate (malate DH → malic enzyme) making NADPH.'],
        ['ACC (biotina): acetil-CoA + HCO₃⁻ + ATP → malonil-CoA. + citrato, insulina; − palmitoil-CoA, glucagone, AMPK.', 'ACC (biotin): acetyl-CoA + HCO₃⁻ + ATP → malonyl-CoA. + citrate, insulin; − palmitoyl-CoA, glucagon, AMPK.'],
        ['Acido grasso sintasi: condensazione, riduzione (NADPH), disidratazione, riduzione (NADPH). Palmitato: 8 acetil-CoA + 7 ATP + 14 NADPH.', 'Fatty acid synthase: condensation, reduction (NADPH), dehydration, reduction (NADPH). Palmitate: 8 acetyl-CoA + 7 ATP + 14 NADPH.'],
        ['β-ossidazione / sintesi: matrice / citosol; CoA / ACP; esce acetil-CoA / entra malonil-CoA; FAD, NAD⁺ / NADPH; L / D; glucagone / insulina.', 'β-oxidation / synthesis: matrix / cytosol; CoA / ACP; acetyl-CoA out / malonyl-CoA in; FAD, NAD⁺ / NADPH; L / D; glucagon / insulin.']],
      perche: [['Perché i carboidrati in eccesso fanno ingrassare? Glucosio → piruvato → acetil-CoA (PDH accesa dall\'insulina) → citrato → acetil-CoA nel citosol → malonil-CoA → palmitato → trigliceridi. Intanto il malonil-CoA blocca la CPT I.', 'Why does extra carbohydrate make fat? Glucose → pyruvate → acetyl-CoA (PDH on with insulin) → citrate → cytosolic acetyl-CoA → malonyl-CoA → palmitate → triglycerides. Meanwhile malonyl-CoA blocks CPT I.']],
      nonDire: [],
      domande: [Q('Da dove viene il NADPH?', 'Via dei pentosi ed enzima malico.', 'Where does NADPH come from?', 'Pentose pathway and malic enzyme.'),
        Q('Cosa succede al citrato in eccesso?', 'Esce dal mitocondrio, fornisce acetil-CoA (ATP-citrato liasi) e attiva l\'ACC.', 'What happens to excess citrate?', 'It leaves the mitochondrion, provides acetyl-CoA (ATP-citrate lyase) and activates ACC.')],
      orale: ['La sintesi degli acidi grassi avviene nel citosol, soprattutto nel fegato, dopo il pasto sotto il controllo dell\'insulina. L\'acetil-CoA esce dal mitocondrio come citrato e viene liberato dall\'ATP-citrato liasi. L\'acetil-CoA carbossilasi, enzima regolato con biotina, forma il malonil-CoA: è attivata dal citrato e dall\'insulina e inibita dal palmitoil-CoA e dalla fosforilazione indotta da glucagone. L\'acido grasso sintasi ripete condensazione, riduzione, disidratazione e riduzione con NADPH, aggiungendo 2 carboni per giro fino al palmitato, che costa 7 ATP e 14 NADPH. Il malonil-CoA inibisce la CPT I, evitando che gli acidi grassi appena sintetizzati vengano ossidati.',
        'Fatty acid synthesis takes place in the cytosol, mainly in the liver, after a meal under insulin control. Acetyl-CoA leaves the mitochondrion as citrate and is freed by ATP-citrate lyase. Acetyl-CoA carboxylase, the regulated biotin enzyme, makes malonyl-CoA: activated by citrate and insulin, inhibited by palmitoyl-CoA and glucagon-driven phosphorylation. Fatty acid synthase repeats condensation, reduction, dehydration and reduction with NADPH, adding 2 carbons per turn up to palmitate, which costs 7 ATP and 14 NADPH. Malonyl-CoA inhibits CPT I, so newly made fatty acids are not oxidised.'] },
    { n: 11, id: 'glicogeno', titolo: ['Glicogeno, via dei pentosi, pasto e digiuno', 'Glycogen, pentose pathway, fed and fasted'], badge: ['', ''], lab: ['teoria'], sezione: 'sppp',
      sintesi: ['Il glicogeno è la riserva rapida di glucosio (fegato: per il sangue; muscolo: per sé). La via dei pentosi fa NADPH e ribosio-5-P. Tutto è coordinato da insulina (pasto) e glucagone/adrenalina (digiuno, stress).', 'Glycogen is the fast glucose store (liver: for the blood; muscle: for itself). The pentose pathway makes NADPH and ribose 5-P. Everything is coordinated by insulin (fed) and glucagon/adrenaline (fasting, stress).'],
      punti: [['Glicogeno fosforilasi (PLP): taglia α-1,4 con Pᵢ → glucosio-1-P; deramificante; fosfoglucomutasi → G6P. Glicogeno sintasi: UDP-glucosio; ramificante α-1,6 ogni 8–12; innesco glicogenina.', 'Glycogen phosphorylase (PLP): cleaves α-1,4 with Pᵢ → glucose 1-P; debranching enzyme; phosphoglucomutase → G6P. Glycogen synthase: UDP-glucose; branching α-1,6 every 8–12; primer glycogenin.'],
        ['cAMP → PKA → fosforilasi chinasi → fosforilasi a (accesa); sintasi fosforilata (spenta). L\'insulina attiva la PP1 che fa il contrario.', 'cAMP → PKA → phosphorylase kinase → phosphorylase a (on); synthase phosphorylated (off). Insulin activates PP1, which does the reverse.'],
        ['Pentosi: fase ossidativa (G6P DH regolata da NADP⁺/NADPH, lattonasi, 6-fosfogluconato DH: 2 NADPH + CO₂) e non ossidativa (transchetolasi con TPP, transaldolasi). Carenza di G6PD: favismo.', 'Pentose: oxidative phase (G6P DH regulated by NADP⁺/NADPH, lactonase, 6-phosphogluconate DH: 2 NADPH + CO₂) and non-oxidative (transketolase with TPP, transaldolase). G6PD deficiency: favism.'],
        ['Pasto: fegato glicolisi, glicogeno, acidi grassi; muscolo GLUT4. Digiuno: glicogenolisi, gluconeogenesi, β-ossidazione, lipolisi. Prolungato: corpi chetonici, il cervello fino a ⅔ da chetoni.', 'Fed: liver glycolysis, glycogen, fatty acids; muscle GLUT4. Fasting: glycogenolysis, gluconeogenesis, β-oxidation, lipolysis. Prolonged: ketone bodies, the brain up to ⅔ from ketones.']],
      perche: [['Una sola fosforilazione, due effetti opposti: la PKA accende la fosforilasi e spegne la sintasi, così non si costruisce e si smonta il glicogeno insieme.', 'One phosphorylation, two opposite effects: PKA turns phosphorylase on and synthase off, so glycogen is not built and broken at once.']],
      nonDire: [],
      domande: [Q('Perché il glicogeno muscolare non aiuta la glicemia?', 'Il muscolo non ha la glucosio-6-fosfatasi.', 'Why does muscle glycogen not help blood glucose?', 'Muscle has no glucose 6-phosphatase.'),
        Q('Precursore ed enzima regolato della via dei pentosi?', 'Glucosio-6-P; glucosio-6-P deidrogenasi.', 'Pentose pathway precursor and regulated enzyme?', 'Glucose 6-P; glucose 6-P dehydrogenase.'),
        Q('Cosa fa il glucagone nel fegato?', 'cAMP → PKA: glicogenolisi e gluconeogenesi accese; glicolisi (F-2,6-BP, piruvato chinasi) e sintesi di glicogeno spente.', 'What does glucagon do in the liver?', 'cAMP → PKA: glycogenolysis and gluconeogenesis on; glycolysis (F-2,6-BP, pyruvate kinase) and glycogen synthesis off.')],
      orale: ['Il glicogeno è demolito dalla glicogeno fosforilasi, che usa il PLP e libera glucosio-1-fosfato, ed è sintetizzato dalla glicogeno sintasi a partire dall\'UDP-glucosio. Glucagone e adrenalina, tramite cAMP e PKA, attivano la fosforilasi e inibiscono la sintasi; l\'insulina, tramite la PP1, fa il contrario. Il fegato libera glucosio nel sangue grazie alla glucosio-6-fosfatasi, il muscolo no. La via dei pentosi, regolata dalla glucosio-6-fosfato deidrogenasi, produce NADPH per le sintesi e il glutatione, e ribosio-5-fosfato per i nucleotidi.',
        'Glycogen is broken down by glycogen phosphorylase, which uses PLP and releases glucose 1-phosphate, and made by glycogen synthase from UDP-glucose. Glucagon and adrenaline, via cAMP and PKA, activate phosphorylase and inhibit synthase; insulin, via PP1, does the reverse. The liver releases glucose into the blood thanks to glucose 6-phosphatase, muscle does not. The pentose pathway, regulated by glucose 6-phosphate dehydrogenase, makes NADPH for synthesis and glutathione, and ribose 5-phosphate for nucleotides.'] },
    { n: 12, id: 'riepilogo', titolo: ['Riepilogo: gli enzimi regolati', 'Summary: the regulated enzymes'], badge: ['da ripassare l\'ultima settimana', 'review in the last week'], lab: ['quiz'],
      sintesi: ['Ogni via è controllata nelle tappe irreversibili. Molta energia (ATP, NADH, acetil-CoA, citrato) spegne le vie che la producono; poca energia (AMP, ADP, Ca²⁺) le accende. Insulina = immagazzina; glucagone = libera.', 'Every pathway is controlled at its irreversible steps. Plenty of energy (ATP, NADH, acetyl-CoA, citrate) switches off the pathways that make it; low energy (AMP, ADP, Ca²⁺) switches them on. Insulin = store; glucagon = release.'],
      punti: [['Piano: settimana 1 capitoli 1–2 (rifare la derivazione a mano); 2: capitoli 3–5 (disegnare ogni via con strutture, enzimi, cofattori e carboni); 3: capitoli 6–8 (i conti degli ATP); 4: capitoli 9–12 e ripasso ad alta voce delle risposte all\'orale.', 'Plan: week 1 chapters 1–2 (redo the derivation by hand); 2: chapters 3–5 (draw each pathway with structures, enzymes, cofactors and carbons); 3: chapters 6–8 (the ATP sums); 4: chapters 9–12 and say the oral answers out loud.']],
      perche: [], nonDire: [], domande: [],
      orale: ['Le vie si regolano nelle tappe irreversibili, lontane dall\'equilibrio. La logica è sempre la stessa: quando c\'è molta energia, cioè ATP, NADH, acetil-CoA e citrato, si spengono le vie che la producono; quando l\'energia è poca, con AMP, ADP e Ca²⁺, si accendono. L\'insulina fa immagazzinare, il glucagone fa liberare.',
        'Pathways are regulated at their irreversible steps, far from equilibrium. The logic is always the same: with plenty of energy, that is ATP, NADH, acetyl-CoA and citrate, the pathways that make it switch off; with little energy, AMP, ADP and Ca²⁺, they switch on. Insulin stores, glucagon releases.'] }
  ];

  /* la tabella del capitolo 12 (per il quiz): via, enzima, attivatori, inibitori */
  var REGOLATI = [
    ['Glicolisi', 'esochinasi', '—', 'glucosio-6-P'], ['Glicolisi', 'PFK-1', 'AMP, ADP, F-2,6-BP', 'ATP, citrato'], ['Glicolisi', 'piruvato chinasi', 'F-1,6-BP', 'ATP, alanina, acetil-CoA; glucagone (fegato)'],
    ['Ponte', 'PDH', 'AMP, CoA, NAD⁺; fosfatasi (Ca²⁺, insulina)', 'acetil-CoA, NADH, ATP; PDH chinasi'], ['Krebs', 'citrato sintasi', 'ADP', 'NADH, succinil-CoA, citrato, ATP'], ['Krebs', 'isocitrato DH', 'ADP, Ca²⁺', 'ATP, NADH'], ['Krebs', 'α-KG DH', 'Ca²⁺', 'succinil-CoA, NADH'],
    ['Gluconeogenesi', 'piruvato carbossilasi', 'acetil-CoA', 'ADP'], ['Gluconeogenesi', 'FBPasi-1', 'citrato', 'F-2,6-BP, AMP'], ['Glicogeno', 'glicogeno fosforilasi', 'glucagone, adrenalina, AMP, Ca²⁺', 'insulina, glucosio, ATP'], ['Glicogeno', 'glicogeno sintasi', 'insulina, G6P', 'glucagone, adrenalina'],
    ['Pentosi', 'G6P deidrogenasi', 'NADP⁺', 'NADPH'], ['Lipolisi', 'HSL / ATGL', 'glucagone, adrenalina (PKA)', 'insulina'], ['β-ossidazione', 'CPT I', '—', 'malonil-CoA'], ['Chetogenesi', 'HMG-CoA sintasi', 'glucagone, digiuno', 'insulina'],
    ['Sintesi AG', 'acetil-CoA carbossilasi', 'citrato, insulina', 'palmitoil-CoA, glucagone, AMPK'], ['Urea', 'carbamil fosfato sintetasi I', 'N-acetilglutammato', '—'], ['Fosf. ossidativa', 'ATP sintasi', 'ADP, Pᵢ', 'oligomicina']
  ];

  g.BSIBioDati = { VIE: VIE, CAPITOLI: CAPITOLI, REGOLATI: REGOLATI, CL: CL, ENZIMI: ENZIMI, CONTA: CONTA,
    perVia: function (id) { return VIE.filter(function (v) { return v.id === id; })[0]; },
    bilancioCarboni: bilancioCarboni, conto: conto, deltaG: deltaG, gettone: gettone, carboni: carboni,
    atpAcidoGrasso: atpAcidoGrasso, atpGlucosio: atpGlucosio,
    apparenti: apparenti, velocita: velocita, lb: lb, frazioni: frazioni,
    rotore: rotore, statoBeta: statoBeta, nuovaCamera: nuovaCamera, passoOssigrafo: passoOssigrafo, aggiungi: aggiungi, regime: regime,
    FONTI: ['Dispensa d\'esame dell\'autore «Biochimica — definitivo mese» (12 capitoli)', 'Nelson D. L., Cox M. M., Lehninger Principles of Biochemistry, 8ª ed. (capitoli 6, 14–19, 21)', 'Boyer P. D. (1997), Annu. Rev. Biochem. 66, 717 — la catalisi rotazionale', 'Watt I. N. et al. (2010), PNAS 107, 16823 — l\'anello c dei mammiferi ha 8 subunità', 'PDB 8H9T — ATP sintasi umana in crio-microscopia elettronica (la struttura del video di riferimento)'] };
})(typeof window !== 'undefined' ? window : globalThis);
