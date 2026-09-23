# Traceability Matrix — BioSpecInfo

| Field | Value |
|-------|--------|
| **Software** | BioSpecInfo |
| **Author** | Samuele Pio Provenzano |
| **Version described** | `bsi-v173` |
| **Purpose** | Connect every declared requirement to the implementation that realises it and to the bench that verifies it. |

> **How to read this matrix.** Every row is a closed chain: a requirement, the
> point in the code that realises it, and the bench that verifies it works. A
> row without a bench is an **unverified** requirement and is declared as such,
> not hidden: the usefulness of a matrix lies precisely in making the gaps
> visible.
>
> The outcomes of the benches cited here are reported in full, with their
> complete output, in [`../evidence/RAPPORTO-VERIFICA.md`](../evidence/RAPPORTO-VERIFICA.md),
> which is generated automatically.

---

## 1. Scientific requirements

| ID | Requirement | Implementation | Verification bench |
|---|---|---|---|
| **SCI-01** | Structural data for drugs must be consistent with the declared molecular weight | `FARM_DATA` in `index.html` | `tools/verifica-farmaci.js` — RDKit ⟷ literature comparison over 178 entries |
| **SCI-02** | Functional groups must be recognised on the structure, not on the text of the SMILES | `bsi-spettri.js` §1, SMARTS patterns via RDKit | `test_spettri` — 8 reference molecules, additive recognition |
| **SCI-03** | A molecule with several functional groups must show them all | `bandeDaGruppi()`, additive construction | `test_spettri` §1 — acetylsalicylic acid: ester **and** acid |
| **SCI-04** | Spectra must respect the conventions of their technique | `svgIR()`, `makeNMRsvg()`, `drawUVSpectrum()`, `drawMSSpectrum()` | `test_assi` (SVG), `test_assi_canvas` (canvas) |
| **SCI-05** | A computed spectrum must be reproducible | every `Math.random()` removed from the traces | `test_assi` §3, `test_spettri` §8 — byte-for-byte comparison |
| **SCI-06** | The height of ¹H peaks must represent the integration, or not be asserted at all | `makeNMRsvg()`; `_nmrSvg()` draws bands of uniform height | `test_assi` §4 |
| **SCI-07** | Conjugation must act on the individual carbonyl | SMARTS `acidoConiug`, `estereConiug`, `chetoneConiug`, `aldeideConiug` | `test_spettri` §1 — aspirin 1760/1690; acetophenone 1690 |
| **SCI-08** | An ambiguous physical constant must not be resolved arbitrarily | `costante_fisica` in `bsi-ai-hub.js` — collects every candidate | `test_costanti` — 45 checks, including the refusals for ambiguity |
| **SCI-09** | The limits of the predictors must be declared to the user | chart headers; `docs/06` §3.5 | `verifica_guida` — consistency between promises and code |
| **SCI-10** | Molecular symmetry must determine the selection rules correctly | `ssimm` section in `index.html` | `test_simmetria` — 26 checks: normal modes, centre of inversion, mutual exclusion |
| **SCI-12** | A chromatogram must follow from the parameters, not be drawn by hand | `scroma` section: σ = t<sub>R</sub>/√N, R<sub>s</sub> from distance and widths | `audit_stabilita` (opening and drawing), inspection of the values against the definitions |
| **SCI-13** | A calibration line must declare the uncertainty of its coefficients and recognise the two ways it misleads | `staratura` section: ordinary least squares, F-test line⟷parabola, deleted residual | Verified on the three example sets included: linear (F = 0.3), non-linear (F = 186.6 > 7.71), with an outlier (1 detected) |

---

## 2. AI agent requirements

| ID | Requirement | Implementation | Verification bench |
|---|---|---|---|
| **AI-01** | A model retired by the provider must not block the assistant | `modelloSuggeritoDaErrore()`, `bsi_modelli_ko` blacklist | `test_404` — 36 checks |
| **AI-02** | A provider unreachable from the browser must be remembered and demoted | `bsi_prov_ko`, 24 h TTL, `providerUtilizzabili()` | `test_ko` (35), `browser_ko` (37) |
| **AI-03** | A temporary overload must produce a retry, not an error | `erroreTemporaneo()`, `TENTATIVI_TEMPORANEO` | `test_503` — 40 checks |
| **AI-04** | An imposed wait longer than 10 s must switch provider if a ready one exists | `ATTESA_TROPPO_LUNGA_MS` | `test_attesalunga` — 14 checks |
| **AI-05** | The provider's token ceiling must be learned from the error, not hard-coded | `tettoDaErrore()`, `MARGINE_TETTO` | `test_tetto` — 32 checks |
| **AI-06** | Opaque reasoning signatures must be returned to the provider | capture and replay in `appendAgentTurn()` | `test_firma` — 31 checks |
| **AI-07** | Two overlapping submissions must not corrupt the history | `_turnoInCorso` in `send()` | `test_doppioinvio` — 7 checks |
| **AI-08** | The user must be able to measure which providers they can actually reach | `provaTuttiIFornitori()` | `browser_prova` — 29 checks |
| **AI-09** | Paid providers must not be offered as free ones | separation by `PROVIDERS[id].free` | `browser_prova` §D2 |
| **AI-10** | A documented route must exist to remove CORS and rate limits | `proxy/spectra-proxy.js` + in-app guide | `test_guidaproxy` (12), `browser_proxy` (15), `browser_proxyui` (17) |

---

## 3. Stability requirements

| ID | Requirement | Implementation | Verification bench |
|---|---|---|---|
| **STA-01** | A long session must accumulate neither DOM nodes nor timers | section lifecycle management | `audit_stabilita` §1 — 87 sections × 5 rounds |
| **STA-02** | Exhausting `localStorage` must not make the app unusable | guarded writes; persistent warning in the File Manager | `audit_quota` (10), `test_filemanager` (15) |
| **STA-03** | No rejected promise may remain unhandled | systematic `.catch()` | `audit_promesse` — 22 checks, healthy network and dead network |
| **STA-04** | Corrupted saved data must not prevent startup | `loadJSON()` with fallback | `audit_stabilita` §4 |
| **STA-05** | A slow network must not be treated as an absent one | `ATTESA_RETE_MS = 3500` in `sw.js` | `test_sw` §3 and §3-bis — measured 3,507 ms |
| **STA-06** | An update must not destroy work in progress | `BSI_SW_UPDATED` message, decision taken page-side | `test_sw` §4 |
| **STA-07** | Browsing molecules must not exhaust the WebGL contexts | reuse of the 3D viewer at all 5 creation points | `test_visore3d` — from 7 constructions down to 1 |
| **STA-08** | An unavailable IndexedDB store must be declared, not fatal | `dbStore()` over a promise; persistent warning | `test_filemanager` §2 |

---

## 4. Interface and accessibility requirements

| ID | Requirement | Implementation | Verification bench |
|---|---|---|---|
| **UI-01** | Every page must open without JavaScript errors | — | `audit_stabilita` §5 — 14 pages |
| **UI-02** | Charts must be sharp on high-density screens | `bsiNitido()` on the canvas contexts | `audit_grafici` — 40 canvases |
| **UI-03** | The app must work at 390 px width | `auto-fit` grids, no fixed column | `audit_mobile` — the document's `scrollWidth` across all 87 sections at 390 px; `audit_stabilita` for errors in a phone viewport |
| **UI-04** | The user must be able to know which version they are running and force the update | "Updates" entry in the ✨ panel | `test_aggiorna` — 9 checks |
| **UI-05** | Data deletion must be selective and reversible in its choices | `bsiCancellaDati()` by group | `browser_reset` — 24 checks |

---

## 5. Security and privacy requirements

| ID | Requirement | Implementation | Verification bench |
|---|---|---|---|
| **SEC-01** | No API key may be present in the repository | keys only in `localStorage` or in the Worker's secrets | `tools/verifica-sicurezza.js` — 235 tracked files, 8 credential shapes |
| **SEC-02** | No personal data may leave the device without an explicit action | local-first architecture, telemetry disabled | `audit_rete` — **direct verification**: a canary value seeded into 71 stores of the user's data, the application used across 87 sections on 6 pages, and the URL, headers and body of every request inspected. Plus `verifica-sicurezza` on the two exit mechanisms |
| **SEC-03** | Passwords must not appear in clear text in the source | SHA-256 in `file_manager.html` | `tools/verifica-sicurezza.js` |
| **SEC-04** | No conflict marker may reach publication | — | `verifica_guida` §12 — 58 text files |

> **SEC-03 — declared limitation.** GitHub Pages serves static files: any
> page-side access control can be bypassed by whoever reads the source. The File
> Manager's protection is a deterrent, **not** a security control, and the
> documentation says so. Furthermore the password remained in clear text in the
> git history until its removal, and taking a secret out of the files does not
> take it out of the history: `git log -p` hands it to anyone. The only effective
> remedy was to change it, and that **has been done** at version `bsi-v173`. The
> old one remains in the history and no longer opens anything.

---

## 6. Requirements not yet verified automatically

Declared for completeness. They are covered by documentary inspection or by
manual testing, and their automation is planned.

| ID | Requirement | Current coverage |
|---|---|---|
| **UI-06** | Full WCAG 2.1 AA conformance | the mechanical part is automated across **13 pages and 87 sections** (`tools/verifica-accessibilita.js`, 33,642 text elements: it was 19,751 before text over gradients entered the measurement). **Of the 1,069 contrast defects that emerged, none remain: 0 measured** over those same 87 sections, and the value is recorded as a baseline the bench defends. Unlabelled fields are **zero**: see the box in `docs/09` §4. What remains outside is text inside SVGs and text over a real background image, counted on every run (D-09) |
| **PERF-01** | First-paint time on a low-end device | manual cross-device testing (`docs/02` §4) |
| **SCI-11** | Structures of 2 entries that are not single molecules (it was 6) | **not representable**: Ivermectin is a mixture of homologues, Coartem a combination of two active ingredients. The other four were closed by taking the structure from ChEMBL, see `docs/06` §2.4 |
| **PERF-02** | Code coverage of the verification benches | **partially measured**: 49.79 % of statements over the widest path (`audit_copertura`). Whole-battery coverage and branch coverage remain unmeasured; see §8 |
| **UI-07** | Behaviour on Firefox and WebKit | **not verified** — the battery runs on Chromium only; see §8 |

---

## 7. Overall coverage

| Category | Requirements | Verified by a bench | Coverage |
|---|---:|---:|---:|
| Scientific (SCI-01…13) | 12 | 12 | 100 % |
| AI agent (AI-01…10) | 10 | 10 | 100 % |
| Stability (STA-01…08) | 8 | 8 | 100 % |
| Interface (UI-01…05) | 5 | 5 | 100 % |
| Security (SEC-01…04) | 4 | 4 | 100 % |
| **Automated total** | **39** | **39** | **100 %** |
| Not automated (§6) | 5 | 0 | 0 % |
| **Declared total** | **44** | **39** | **89 %** |

Coverage is computed over the requirements **declared in this document** and
must not be confused with code coverage: it measures how many requirements have
a bench verifying them, not how many lines are executed during the tests.

> **Why two totals.** Reporting only the 100 % of automated requirements would
> be true and misleading at once: it is 100 % of what was *chosen* to be
> automated. The number that matters to an assessor is the second one — **39
> requirements verified out of 44 declared** — and the five that are missing are
> listed by name in §6, not summarised into a percentage.
>
> This table is checked by `tools/verifica-documenti.js`, which counts the
> identifiers actually present in the document and fails if the totals written
> here do not match. It is a check born of a real error: the totals said 36 over
> 9 scientific categories while the identifiers defined were 10, and `SCI-10`
> appeared twice — once as a verified requirement and once as an unverified one.

---

## 8. Declared coverage gaps

These are not defects: they are things that have **not been measured**, and
that therefore cannot be asserted.

| Gap | What it entails | Why it is so |
|---|---|---|
| **Partial code coverage** | Measured: **49.79 %** of statements over the widest path a bench walks. It is not the coverage of the whole battery, and it is statements, not branches | Chromium's profiler collects it inside the engine, with no build and without rewriting the source: the obstacle belonged to the tool (c8, istanbul), not to the problem. Value recorded; `audit_copertura` fails if it falls |
| **Chromium only** | Behaviour on Firefox and WebKit is verified by hand, not by a bench | The battery uses `playwright-core`, which downloads a single engine. In the verification environment the CDN for the other engines answers **403** to the network policy: they cannot be installed there |
| **No visual regression** | An unintended graphical change would not be caught | Spectra are deterministic and comparable byte for byte (SCI-05): the comparison exists on the traces, not on the whole page |
| **2 entries without a structure** | Two entries out of 178 have no structure to show: Ivermectin is a mixture of homologues, Coartem a combination of two active ingredients. It was six | See `06-Scientific-Accuracy-Data-Provenance.md` §2.4 |
| **Performance on slow devices** | First-paint time is not measured on low-end hardware | It requires physical devices; the test is manual |

---

_Document updated to version `bsi-v173`._
