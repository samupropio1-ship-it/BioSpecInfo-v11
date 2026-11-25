/* ═══════════════════════════════════════════════════════════════════════════
   bsi-centro-organica.js — ⚗️ Centro di Chimica Organica (hub)
   BioSpecInfo · © Samuele Pio Provenzano

   PERCHE' ESISTE (v271)
   Richiesta dell'autore: «una sezione per l'organica, senza ripetizioni». I
   pezzi della chimica organica — i meccanismi (statici, animati, con le frecce
   curve), la retrosintesi, la sintesi, l'equazione di Hammett, il bilanciamento
   e i gradi di insaturazione — erano pulsanti sparsi fra due menù. Qui, con la
   stessa fabbrica del Centro spettri (bsi-hub.js), diventano schede di un unico
   hub: i pannelli sono SPOSTATI (una sola copia), i pulsanti NASCOSTI (restano
   nel DOM, così navigazione, catalogo, teoria e Spectra non cambiano).
   ═══════════════════════════════════════════════════════════════════════════ */
(function (globale) {
  'use strict';
  var F = globale.BSIFisica, H = globale.BSIHub;
  if (!F || !H) return;
  var t = F.t;

  var hub = H.crea({
    id: 'scentrorganica',
    gruppo: 'navGroup0',                 /* 🔬 Chimica */
    pulsante: ['⚗️ Chimica organica', '⚗️ Organic chemistry'],
    titolo: ['⚗️ Chimica organica', '⚗️ Organic chemistry'],
    intro: [
      'Il ragionamento della chimica organica in un posto solo: come si muovono gli elettroni in un meccanismo, ' +
      'come si pianifica una sintesi all\'indietro, come un sostituente cambia la reattività. Le schede qui sotto ' +
      'sono gli stessi pannelli di prima — <b>spostati</b>, non copiati: non esiste una seconda copia di niente.',
      'The reasoning of organic chemistry in one place: how electrons move in a mechanism, how a synthesis is planned ' +
      'backwards, how a substituent changes reactivity. The tabs below are the same panels as before — <b>moved</b>, ' +
      'not copied: there is no second copy of anything.'],
    schede: [
      { id: 'smecc3d', ic: '🧪', nm: ['Meccanismi 3D', '3D mechanisms'], nota: t('le frecce nello spazio', 'the arrows in space') },
      { id: 'sanimmech', ic: '🎬', nm: ['Meccanismi animati', 'Animated mechanisms'], nota: t('passo per passo', 'step by step') },
      { id: 'sarrowlab', ic: '✏️', nm: ['Arrow Lab', 'Arrow Lab'], nota: t('frecce curve e retrosintesi', 'curly arrows and retrosynthesis') },
      { id: 'sretro', ic: '🔄', nm: ['Retrosintesi', 'Retrosynthesis'], nota: t('dal bersaglio ai reagenti', 'from target to reagents') },
      { id: 'ssyn', ic: '🧬', nm: ['Sintesi organica', 'Organic synthesis'], nota: t('reazioni e trasformazioni', 'reactions and transformations') },
      { id: 'shammett', ic: 'σ', nm: ['Hammett', 'Hammett'], nota: t('sostituenti e reattività', 'substituents and reactivity') },
      { id: 'srxnbal', ic: '⚖️', nm: ['Bilanciamento', 'Balancing'], nota: t('reazioni e redox', 'reactions and redox') },
      { id: 'sdbe', ic: '📐', nm: ['Insaturazioni (DBE)', 'Unsaturation (DBE)'], nota: t('gradi dalla formula', 'degrees from the formula') }
    ]
  });

  globale.BSICentroOrganica = hub;
})(typeof window !== 'undefined' ? window : globalThis);
