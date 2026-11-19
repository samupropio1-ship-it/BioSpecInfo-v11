#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════
   spectra-voce-design.mjs — progetta la voce di Spectra con ElevenLabs (v263)
   BioSpecInfo · © Samuele Pio Provenzano

   Genera tre anteprime della voce dalla descrizione qui sotto, le salva come
   mp3 da ascoltare, e — quando ne scegli una — la salva nel tuo account
   ElevenLabs e stampa il Voice ID da mettere nell'app (o nel proxy).

   USO
     ELEVENLABS_API_KEY=sk_… node tools/spectra-voce-design.mjs
         → scrive spectra-voce-anteprime/anteprima-1.mp3 … -3.mp3 e anteprime.json
     ELEVENLABS_API_KEY=sk_… node tools/spectra-voce-design.mjs --salva 2
         → salva l'anteprima 2 come voce «Spectra» e stampa il Voice ID
     Opzioni: --descrizione "…"  --testo "…"  --modello eleven_multilingual_ttv_v2 | eleven_ttv_v3

   La chiave si legge SOLO dalla variabile d'ambiente: non si scrive mai in un
   file del progetto. La cartella delle anteprime è in .gitignore.

   POLITICA: la descrizione è di un PERSONAGGIO (un'IA fredda e controllata),
   non dell'imitazione di un attore. Riprodurre la voce di una persona reale
   senza il suo consenso è vietato dalle regole d'uso di ElevenLabs.
   ═══════════════════════════════════════════════════════════════════════ */
import fs from 'node:fs';
import path from 'node:path';

/** La descrizione per Voice Design (in inglese: il modello la segue meglio). Limite: 20–1000 caratteri. */
export const DESCRIZIONE = [
  'A male voice in his mid-thirties for an advanced artificial intelligence: cold, calm and calculating.',
  'Deep-to-mid baritone, smooth and controlled, with a quiet, effortless authority and a faint air of superiority, as if he is always three steps ahead.',
  'Precise diction with crisp consonants, measured unhurried pacing, deliberate pauses before key words; he never raises his voice.',
  'Dry, understated irony; polite on the surface, unsettling underneath.',
  'Neutral, clear General American accent.',
  'Subtly synthetic sheen: very clean, almost too perfect, no breathiness, but still natural and human-sounding, not robotic.',
  'Close-mic studio recording, dry room, no reverb, no background noise, broadcast quality.'
].join(' ');

/** Il testo che le anteprime leggono (100–1000 caratteri): deve far sentire il carattere, non un elenco di parole. */
export const TESTO_PROVA = "I've read every paper you saved, and every note you forgot you wrote. You were close, closer than you think. " +
  "The answer was never hidden; you simply weren't looking at it the right way. Shall we begin? I promise this will be... illuminating.";

function arg(nome) { const i = process.argv.indexOf('--' + nome); return i > 0 ? process.argv[i + 1] : null; }
const API = 'https://api.elevenlabs.io';
const chiave = process.env.ELEVENLABS_API_KEY;
if (!chiave) { console.error('Manca la chiave: ELEVENLABS_API_KEY=sk_… node tools/spectra-voce-design.mjs'); process.exit(2); }
const H = { 'Content-Type': 'application/json', 'xi-api-key': chiave };
const cartella = path.resolve('spectra-voce-anteprime');

async function chiama(percorsi, corpo) {
  for (const p of percorsi) {
    const r = await fetch(API + p, { method: 'POST', headers: H, body: JSON.stringify(corpo) });
    if (r.status === 404) continue;                       /* endpoint cambiato: si prova il successivo */
    const t = await r.text();
    if (!r.ok) throw new Error('HTTP ' + r.status + ' su ' + p + ': ' + t.slice(0, 400));
    return JSON.parse(t);
  }
  throw new Error('Nessun endpoint di Voice Design ha risposto (404): controlla la documentazione aggiornata di ElevenLabs.');
}

const salva = arg('salva');
if (!salva) {
  const descrizione = arg('descrizione') || DESCRIZIONE, testo = arg('testo') || TESTO_PROVA;
  if (descrizione.length < 20 || descrizione.length > 1000) { console.error('La descrizione deve stare fra 20 e 1000 caratteri (ora ' + descrizione.length + ').'); process.exit(2); }
  if (testo.length < 100 || testo.length > 1000) { console.error('Il testo di prova deve stare fra 100 e 1000 caratteri (ora ' + testo.length + ').'); process.exit(2); }
  const corpo = { voice_description: descrizione, text: testo };
  if (arg('modello')) corpo.model_id = arg('modello');
  console.log('Genero le anteprime… (' + descrizione.length + ' caratteri di descrizione)');
  const j = await chiama(['/v1/text-to-voice/design', '/v1/text-to-voice/create-previews'], corpo);
  const prev = j.previews || [];
  fs.mkdirSync(cartella, { recursive: true });
  prev.forEach((p, i) => fs.writeFileSync(path.join(cartella, 'anteprima-' + (i + 1) + '.mp3'), Buffer.from(p.audio_base_64, 'base64')));
  fs.writeFileSync(path.join(cartella, 'anteprime.json'), JSON.stringify({ descrizione, testo, anteprime: prev.map((p, i) => ({ n: i + 1, generated_voice_id: p.generated_voice_id, durata_s: p.duration_secs })) }, null, 2));
  console.log(prev.length + ' anteprime in ' + cartella + '. Ascoltale e poi: --salva <numero>');
} else {
  const dati = JSON.parse(fs.readFileSync(path.join(cartella, 'anteprime.json'), 'utf8')), scelta = dati.anteprime.find(a => a.n === +salva);
  if (!scelta) { console.error('Anteprima ' + salva + ' non trovata.'); process.exit(2); }
  const j = await chiama(['/v1/text-to-voice', '/v1/text-to-voice/create-voice-from-preview'], { voice_name: 'Spectra', voice_description: dati.descrizione, generated_voice_id: scelta.generated_voice_id });
  console.log('Voce salvata. Voice ID: ' + j.voice_id);
  console.log('  · nell\'app: Spectra → 🎙️ Voce → Voice ID');
  console.log('  · sul proxy: npx wrangler secret put SPECTRA_VOICE_ID   (e incolla ' + j.voice_id + ')');
}
