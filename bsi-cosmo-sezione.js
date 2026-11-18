/* bsi-cosmo-sezione.js — 🎞️ la sezione «Simulazioni cosmiche» (v258): la griglia delle simulazioni registrate con BSICosmo. BioSpecInfo · © Samuele Pio Provenzano */
(function (g) {
  'use strict';
  var F = g.BSIFisica; if (!F || !g.BSICosmo) return;
  F.sezione('scosmo', {
    titolo: ['🎞️ Simulazioni cosmiche', '🎞️ Cosmic simulations'],
    sotto: ['Reel scientifici che sono simulazioni vere: la fisica si calcola mentre guardi, con l\'HUD dei numeri, la sequenza cinematica e la registrazione video verticale.', 'Science reels that are real simulations: the physics is computed as you watch, with a numeric HUD, the cinematic sequence and vertical video recording.'],
    schede: [{ nome: ['🎞️ Le simulazioni', '🎞️ The simulations'], costruisci: function (div) { g.BSICosmo.schedaSezione(div); } }]
  });
})(typeof window !== 'undefined' ? window : globalThis);
