/* studio-demo.js — dati di prova per il motore bsi-studio.js: tre voci per tipo.
   Non sono i dati veri (quelli stanno in bsi-studio-fisica.js e
   bsi-studio-matematica.js): servono solo al banco _prove/prova-studio.js. */
(function (globale) {
  'use strict';
  var DATI = {
    argomenti: [
      { k: 'mecc', nm: ['Meccanica', 'Mechanics'] },
      { k: 'term', nm: ['Termodinamica', 'Thermodynamics'] },
      { k: 'elet', nm: ['Elettromagnetismo', 'Electromagnetism'] },
      { k: 'onde', nm: ['Onde', 'Waves'] },
      { k: 'otti', nm: ['Ottica', 'Optics'] },
      { k: 'rela', nm: ['Relatività', 'Relativity'] },
      { k: 'quan', nm: ['Fisica quantistica', 'Quantum physics'] },
      { k: 'nucl', nm: ['Fisica nucleare', 'Nuclear physics'] }
    ],
    riassunti: [
      { arg: 'mecc', tit: 'Le leggi di Newton', testo: '<p>La <b>prima legge</b> (principio d’inerzia) afferma che un corpo non soggetto a forze, o soggetto a forze la cui risultante è nulla, resta in quiete oppure si muove di moto rettilineo uniforme. Vale nei sistemi di riferimento inerziali.</p><p>La <b>seconda legge</b> lega la forza risultante all’accelerazione: <i>F</i> = <i>m</i>·<i>a</i>. La massa inerziale misura quanto un corpo resiste alle variazioni di velocità; nel Sistema Internazionale la forza si misura in newton (1 N = 1 kg·m/s<sup>2</sup>).</p><p>La <b>terza legge</b> (azione e reazione) dice che se un corpo A esercita una forza su B, allora B esercita su A una forza uguale e opposta. Le due forze agiscono su corpi diversi e quindi non si annullano a vicenda.</p><ul><li>Inerzia: nessuna forza, nessun cambio di velocità.</li><li>Dinamica: la forza è causa dell’accelerazione.</li><li>Reazione: le forze nascono sempre a coppie.</li></ul>' },
      { arg: 'term', tit: 'Il primo principio della termodinamica', testo: '<p>Il <b>primo principio</b> è la conservazione dell’energia applicata ai sistemi termodinamici: la variazione di energia interna di un sistema è uguale al calore assorbito meno il lavoro compiuto, Δ<i>U</i> = <i>Q</i> − <i>L</i>. L’energia interna è una funzione di stato: dipende solo dallo stato iniziale e da quello finale, non dal cammino seguito.</p><p>Calore e lavoro, invece, dipendono dalla trasformazione. In una trasformazione <b>isocora</b> il volume è costante e il lavoro è nullo; in una <b>isobara</b> il lavoro vale <i>p</i>·Δ<i>V</i>; in una <b>isoterma</b> di un gas perfetto l’energia interna non cambia e tutto il calore assorbito diventa lavoro; in una <b>adiabatica</b> non c’è scambio di calore.</p><p>Il principio esclude il moto perpetuo di prima specie: nessuna macchina può produrre lavoro dal nulla.</p>' },
      { arg: 'elet', tit: 'La legge di Coulomb e il campo elettrico', testo: '<p>Due cariche puntiformi <i>q</i><sub>1</sub> e <i>q</i><sub>2</sub> poste a distanza <i>r</i> si attraggono o si respingono con una forza diretta lungo la congiungente, di intensità <i>F</i> = <i>k</i>·<i>q</i><sub>1</sub><i>q</i><sub>2</sub>/<i>r</i><sup>2</sup>, dove <i>k</i> vale circa 8,99·10<sup>9</sup> N·m<sup>2</sup>/C<sup>2</sup> nel vuoto. Cariche dello stesso segno si respingono, cariche di segno opposto si attraggono.</p><p>Il <b>campo elettrico</b> è la forza per unità di carica di prova: <i>E</i> = <i>F</i>/<i>q</i>. Si misura in newton su coulomb, o in volt su metro. Le linee di campo escono dalle cariche positive ed entrano in quelle negative; dove sono fitte il campo è intenso.</p><p>Il principio di sovrapposizione permette di sommare vettorialmente i campi prodotti da più cariche.</p>' }
    ],
    quiz: [
      { arg: 'mecc', liv: 1, d: 'Che cosa misura la massa inerziale di un corpo?', r: ['La sua resistenza alle variazioni di velocità', 'Il suo volume', 'La sua carica elettrica', 'La sua temperatura'], k: 0, sp: 'Per la seconda legge di Newton, a parità di forza un corpo di massa maggiore accelera di meno.' },
      { arg: 'term', liv: 2, d: 'In un’espansione isoterma di un gas perfetto, quanto vale la variazione di energia interna?', r: ['È uguale al calore assorbito', 'È zero', 'È uguale al lavoro compiuto', 'È negativa'], k: 1, sp: 'L’energia interna di un gas perfetto dipende solo dalla temperatura: se T non cambia, ΔU = 0 e Q = L.' },
      { arg: 'elet', liv: 3, d: 'Se la distanza fra due cariche raddoppia, la forza di Coulomb diventa…', r: ['Il doppio', 'La metà', 'Un quarto', 'Quattro volte'], k: 2, sp: 'La forza va come 1/r<sup>2</sup>: raddoppiando r si divide per 4.' }
    ],
    flash: [
      { arg: 'mecc', f: 'Enunciato del principio d’inerzia', b: 'Un corpo non soggetto a forze resta in quiete o in moto rettilineo uniforme.' },
      { arg: 'term', f: 'Che cos’è una funzione di stato?', b: 'Una grandezza che dipende solo dallo stato del sistema, non dal cammino: per esempio l’energia interna.' },
      { arg: 'elet', f: 'Unità di misura del campo elettrico', b: 'Newton su coulomb (N/C), equivalente a volt su metro (V/m).' }
    ],
    formule: [
      { arg: 'mecc', nm: 'Secondo principio della dinamica', f: 'F = m·a', note: 'Forza risultante uguale a massa per accelerazione.' },
      { arg: 'term', nm: 'Primo principio', f: 'ΔU = Q − L', note: 'Convenzione: L positivo se compiuto dal sistema.' },
      { arg: 'elet', nm: 'Legge di Coulomb', f: 'F = k·q<sub>1</sub>q<sub>2</sub>/r<sup>2</sup>', note: 'k ≈ 8,99·10<sup>9</sup> N·m<sup>2</sup>/C<sup>2</sup> nel vuoto.' }
    ],
    glossario: [
      { t: 'Accelerazione', d: 'Variazione della velocità nell’unità di tempo; si misura in m/s<sup>2</sup>.' },
      { t: 'Entropia', d: 'Funzione di stato che misura il disordine di un sistema; nei processi spontanei di un sistema isolato non diminuisce.' },
      { t: 'Ëone di prova', d: 'Voce con l’iniziale accentata, per verificare che l’indice la metta sotto la lettera E.' }
    ]
  };
  function registra() { globale.BSIStudio.registra('fisica', DATI); }
  if (globale.BSIStudio) registra(); else (globale.BSIStudioCoda = globale.BSIStudioCoda || []).push(registra);
})(typeof window !== 'undefined' ? window : globalThis);
