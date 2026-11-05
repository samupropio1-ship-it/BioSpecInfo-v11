#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════════════════════
   test_spectra_esplora — «⚡ Esplora con Spectra», una sezione per materia
   (bsi-spectra-esplora.js)

   PERCHE' QUESTO BANCO ESISTE
   Richiesta dell'autore: per ogni materia una sezione come la lezione
   esplorabile di every-joule. Il banco controlla che:
   · in node: le tre materie abbiano dieci capitoli ciascuna, dalla scuola
     superiore al PhD avanzato, con previsioni ben formate (quattro risposte,
     l'indice della giusta, un perche' per ognuna) e che i numeri dei cursori
     siano quelli delle formule (pH con l'autoprotolisi, Henderson–Hasselbalch,
     t½, Marcus, caduta, gittata, pendolo, Carnot, particella in una scatola,
     tunnel, γ dei muoni, derivata, e, ln, Basilea, armonica, autovalori, Gibbs,
     calore);
   · nel browser, a 412 e 1280 px: le tre sezioni nella barra della loro
     materia, ogni capitolo collegato a una sezione che esiste; Spectra col corpo
     nella sezione, fermo in alto mentre si scorre; il capitolo davanti diventa
     attivo e l'ologramma prende la sua scena; prevedere segna la giusta, spiega
     ogni risposta, Spectra reagisce e la memoria ricorda; il cursore ricalcola;
     «Guardalo dal vivo» apre la sezione dietro la finestra di Spectra; niente
     sborda, nessun errore JavaScript.

   USO   node tools/banchi/test_spectra_esplora.js    (serve un server su :8899)
   ═══════════════════════════════════════════════════════════════════════════ */
'use strict';
const path = require('path');
const { chromium } = require('playwright-core');
const BASE = process.env.BSI_URL_BASE || 'http://127.0.0.1:8899/';
const CHROME = process.env.BSI_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
let ok = 0, ko = 0;
function att(d, atteso, avuto) {
  if (String(atteso) === String(avuto)) { ok++; console.log('  ✓ ' + d + '  → ' + avuto); }
  else { ko++; console.log('  ✗ ' + d + '\n      atteso: ' + atteso + '\n      avuto:  ' + avuto); }
}
function vero(d, c) { att(d, true, !!c); }
function vicino(d, x, y, tol) { vero(d + ' (' + (typeof x === 'number' ? x.toPrecision(6) : x) + ' ≈ ' + y + ')', typeof x === 'number' && Math.abs(x - y) <= tol); }

(async () => {
  console.log('── I capitoli e i numeri (node) ──');
  global.window = undefined; global.document = undefined;
  const E = require(path.join(__dirname, '..', '..', 'bsi-spectra-esplora.js')) || globalThis.BSIEsplora;
  const X = globalThis.BSIEsplora;
  for (const m of ['chimica', 'fisica', 'matematica']) {
    const C = X.CAPITOLI[m];
    att(m + ': dieci capitoli', 10, C.length);
    vero(m + ': dalla scuola superiore (livello 0) al PhD avanzato (livello 4), in ordine', C[0].liv === 0 && C[C.length - 1].liv === 4 && C.every((c, i) => i === 0 || c.liv >= C[i - 1].liv));
    vero(m + ': ogni previsione ha 4 risposte, la giusta e un perché per ognuna', C.every(c => c.pred.o.length === 4 && c.pred.p.length === 4 && c.pred.g >= 0 && c.pred.g < 4 && c.pred.p.every(p => p.length > 8)));
    vero(m + ': gli identificativi sono unici', new Set(C.map(c => c.id)).size === C.length);
  }
  const v = (id, x) => X.calcola(id, x).v;
  vicino('pH di HCl 10⁻⁸ M con l\'autoprotolisi dell\'acqua', v('c-ph', 8), 6.978, 0.002);
  vicino('pH di HCl 10⁻² M', v('c-ph', 2), 2.000, 0.001);
  vicino('Henderson–Hasselbalch, rapporto 1: pH = pKa', v('c-tampone', 0), 4.76, 1e-9);
  vicino('t½ = ln 2 / k con k = 0,1 s⁻¹', v('c-cinetica', 0.1), 6.9315, 1e-3);
  vicino('Marcus: barriera nulla a ΔG° = −λ', v('c-marcus', -1), 0, 1e-12);
  vicino('Marcus: regione invertita, ΔG° = −2λ dà ΔG‡ = λ/4', v('c-marcus', -2), 0.25, 1e-12);
  vicino('caduta da 20 m: t = √(2h/g)', v('f-caduta', 20), 2.0193, 1e-3);
  vicino('gittata a 45°, v₀ = 20 m/s', v('f-gittata', 45), 40.775, 1e-2);
  vicino('periodo del pendolo da 1 m', v('f-pendolo', 1), 2.0061, 1e-3);
  vicino('Carnot fra 600 K e 300 K', v('f-carnot', 600), 0.5, 1e-12);
  vicino('particella in una scatola di 1 nm: E₁ (eV)', v('f-scatola', 1), 0.376, 1e-3);
  vicino('dimezzando la scatola l\'energia quadruplica', v('f-scatola', 0.5) / v('f-scatola', 1), 4, 1e-9);
  vicino('tunnel: raddoppiando lo spessore T diventa il suo quadrato', v('f-tunnel', 1.0), Math.pow(v('f-tunnel', 0.5), 2), 1e-12);
  vicino('γ dei muoni a 0,9995c', v('f-relat', 0.9995), 31.63, 0.02);
  vicino('derivata di x³ in 2', v('m-deriv', 2), 12, 1e-9);
  vicino('(1 + 1/n)ⁿ con n = 10⁶ → e', v('m-e', 6), Math.E, 2e-6);
  vicino('∫₁ᵉ dx/x = 1', X.calcola('m-int', Math.E).v, 1, 1e-12);
  vicino('Basilea con 10⁵ termini → π²/6 (meno la coda)', v('m-basilea', 5), Math.PI * Math.PI / 6 - 1e-5, 1e-6);
  vicino('serie armonica con 1000 termini', v('m-armonica', 3), 7.4855, 1e-4);
  vicino('autovalori della rotazione di 90°: ±i (parte immaginaria 1)', v('m-autoval', 90), 1, 1e-12);
  vicino('Gibbs con 201 termini: massimo ≈ 1,179', v('m-gibbs', 201), 1.179, 0.004);
  vicino('equazione del calore: k = 2 a t = 0,1 → e^(−0,4)', v('m-calore', 2), Math.exp(-0.4), 1e-12);

  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  for (const [nome, opz] of [['telefono', { viewport: { width: 412, height: 915 }, isMobile: true, hasTouch: true }], ['schermo grande', { viewport: { width: 1280, height: 860 } }]]) {
    console.log('\n── Le sezioni, ' + nome + ' ──');
    const ctx = await b.newContext(Object.assign({ serviceWorkers: 'block' }, opz)), pg = await ctx.newPage(), errs = [];
    pg.on('pageerror', e => errs.push(e.message));
    await pg.addInitScript(() => { try { localStorage.setItem('bsi_guide_v3', '1'); localStorage.removeItem('bsi-esplora-v1'); } catch (e) {} });
    await pg.goto(BASE + 'index.html', { waitUntil: 'load', timeout: 120000 });
    await pg.waitForFunction(() => !!window.BSIEsplora, null, { timeout: 60000 });
    await pg.waitForTimeout(2000);
    const barra = await pg.evaluate(() => [['sesplchim', 'chimica'], ['sesplfis', 'fisica'], ['sesplmat', 'matematica']].map(([id, m]) => {
      const bt = document.querySelector('.nav-btn[data-s="' + id + '"]'), pan = bt && bt.closest('[id^="navGroup"]'), g = pan ? +pan.id.replace('navGroup', '') : -1;
      const caps = BSIEsplora.CAPITOLI[m], mancanti = caps.filter(c => !document.querySelector('[data-s="' + c.sez + '"]')).map(c => c.sez);
      return id + ':' + (BSIMaterie.materiaDi(g) === m ? 'ok' : 'no') + (mancanti.length ? ' mancano ' + mancanti.join(',') : '');
    }).join(' '));
    att('le tre sezioni nella barra della loro materia, ogni capitolo collegato a una sezione esistente', 'sesplchim:ok sesplfis:ok sesplmat:ok', barra);
    for (const [id, m] of [['sesplchim', 'chimica'], ['sesplfis', 'fisica'], ['sesplmat', 'matematica']]) {
      await pg.evaluate(id => document.querySelector('[data-s="' + id + '"]').click(), id);
      await pg.waitForFunction(id => { const F = window.BSISpectraFigura && BSISpectraFigura.figura; return F && document.getElementById(id).contains(F.box) && F.spectra.rig && F.spectra.volto; }, id, { timeout: 120000 }).catch(() => {});
      await pg.waitForTimeout(600);
      const r = await pg.evaluate(async ([id, m]) => {
        const pausa = ms => new Promise(r => setTimeout(r, ms)), s = document.getElementById(id), F = BSISpectraFigura.figura, o = {};
        o.cap = s.querySelectorAll('.cap').length; o.dentro = s.contains(F.box); o.sticky = getComputedStyle(F.box).position === 'sticky';
        const k = s.querySelectorAll('.cap')[4]; k.scrollIntoView({ block: 'center' }); for (let w = 0; w < 40 && !k.classList.contains('attivo'); w++) await pausa(100); await pausa(400);
        const fb = F.box.getBoundingClientRect(), top = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bsiEX-top')) || 0;
        o.inScena = fb.top >= top - 2 && fb.top <= top + 40 && fb.bottom > 0;
        const c = BSIEsplora.CAPITOLI[m][4]; o.attivo = k.classList.contains('attivo'); o.scena = F.olo.attuale === c.scena;
        const sbagliata = (c.pred.g + 1) % 4; k.querySelectorAll('.opz button')[sbagliata].click(); await pausa(300);
        o.segnata = k.querySelectorAll('.opz .giusta').length === 1 && k.querySelectorAll('.opz .sbagliata').length === 1 && k.querySelectorAll('.perche p').length === 5;
        o.reazione = F.spectra.corpo.emo; o.memoria = (JSON.parse(localStorage.getItem('bsi-esplora-v1') || '{}')[c.id] || {}).giusta === false;
        o.barra = s.querySelector('.conta').textContent;
        const P = s.querySelector('.cap .prova input'); if (P) { const a = P.closest('.prova').querySelector('.misura').textContent; P.value = P.max; P.dispatchEvent(new Event('input')); o.cursore = a !== P.closest('.prova').querySelector('.misura').textContent; }
        o.sborda = document.documentElement.scrollWidth - document.documentElement.clientWidth;
        return o;
      }, [id, m]);
      vero(m + ': dieci capitoli e Spectra col corpo nella sezione, fermo in alto mentre si scorre', r.cap === 10 && r.dentro && r.sticky && r.inScena);
      vero(m + ': il capitolo davanti è attivo e l\'ologramma prende la sua scena', r.attivo && r.scena);
      vero(m + ': prevedere segna la giusta e la sbagliata, con il perché di ogni risposta; Spectra reagisce (' + r.reazione + ')', r.segnata && r.reazione === 'sorpresa');
      vero(m + ': la memoria ricorda e la barra avanza (' + r.barra + ')', r.memoria && r.barra === '1/10');
      vero(m + ': il cursore ricalcola', r.cursore);
      if (nome === 'telefono') att(m + ': a 412 px niente sborda', 0, r.sborda);
    }
    const vivo = await pg.evaluate(async () => {
      const k = document.querySelector('#sesplmat .cap'), c = BSIEsplora.CAPITOLI.matematica[0];
      [...k.querySelectorAll('.az button')].find(b => /dal vivo|live/i.test(b.textContent)).click(); await new Promise(r => setTimeout(r, 2600));
      const o = { finestra: document.getElementById('bsi-hub-ov').classList.contains('open'), dietro: (BSISpectraLive.schermo() || {}).sezione, atteso: c.sez, olo: BSISpectraFigura.figura.olo.attuale };
      document.getElementById('bsi-hub-close').click(); await new Promise(r => setTimeout(r, 2000)); o.ritorno = (BSISpectraLive.schermo() || {}).sezione; return o;
    });
    vero('«📺 Guardalo dal vivo» apre la sezione (' + vivo.dietro + ') dietro la finestra di Spectra, e l\'ologramma la mostra', vivo.finestra && vivo.dietro === vivo.atteso && vivo.olo === 'schermo');
    att('chiusa la finestra, si torna alla sezione Esplora', 'sesplmat', vivo.ritorno);
    att(nome + ': nessun errore JavaScript', 0, errs.length);
    errs.slice(0, 3).forEach(e => console.log('      ! ' + e.slice(0, 200)));
    await ctx.close();
  }
  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FALLITI, ' : '') + ok + ' controlli passati');
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
