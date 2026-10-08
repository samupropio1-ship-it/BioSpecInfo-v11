# Traceability Matrix — BioSpecInfo

| Field | Value |
|-------|--------|
| **Software** | BioSpecInfo |
| **Author** | Samuele Pio Provenzano |
| **Version described** | `bsi-v195` |
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
| **SCI-01** | A drug structure must come from an external source and match that source, not merely weigh correctly | `FARM_DATA` in `index.html` — **263 entries**, 36 declaring a ChEMBL identifier and formula | `audit_farmaci` — the formula is **rebuilt by counting the graph's atoms** and compared with ChEMBL's: 36 of 36. Weight alone was not enough: three pre-existing entries (lenalidomide, palbociclib, aripiprazole) were **isomers** — same weight, different molecule — and were replaced. Two ratchets: verified provenance ≥ 36, readable structures ≥ 240 |
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
| **SCI-14** | A QSAR model must be evaluated on scaffolds never seen, not on analogues from the same set | `bsi-cheminfo.js` §9 — `divisionePerScaffold()` alongside `divisioneCasuale()` | `test_cheminfo` — the scaffold split leaves no scaffold shared between training and test |
| **SCI-15** | A model score must be compared against chance, not presented on its own | `bsi-cheminfo.js` §9 — retraining on scrambled labels, eight repetitions | `test_cheminfo` — verified **in both directions**: on a learnable signal R² 0.394 beats all eight twins (margin 0.287); on random labels R² −0.199 does **not** beat them |
| **SCI-16** | Two spellings of the same molecule must not be counted twice, nor land on opposite sides of the split | `bsi-cheminfo.js` §1 — deduplication on the canonical SMILES after the largest fragment | `test_cheminfo` — `OC(=O)C` and `CC(=O)O` collapse into one entry; salts lose the counterion |
| **SCI-17** | Similarity between molecules must be computed, not estimated | `bsi-cheminfo.js` §3 — Tanimoto and Dice over Morgan, RDKit, pattern and MACCS fingerprints | `test_cheminfo` — compared against hand-computable values, including the 0/0 = 1 convention |
| **SCI-18** | A validation on a single split, over a small set, is a noisy number: it must come with its dispersion | `bsi-cheminfo.js` §9-bis — `validazioneIncrociata()` over **scaffold-grouped** folds | `test_cheminfo` — the folds cover every molecule once, **no scaffold sits in two folds**, and the same seed gives the same folds |
| **SCI-19** | A result that changes on every run is verifiable by nobody | seeded mulberry32 generator for splits, scrambles and folds; the seed is written into the report | `test_cheminfo` — two calls with the same seed give identical folds; the method report declares the seed |
| **SCI-20** | Results must be able to leave the tool, and the method must leave with them | `bsi-cheminfo.js` §9-ter — `esportaCsv()` and `rapportoMetodo()`, both formed in memory in the browser | `test_cheminfo` — columns consistent with the header, a name containing a comma quoted, residual computed, empty cell for missing activity; the report carries seed, fingerprint, verdict, limits |
| **SCI-21** | A number presented as structural similarity must come from a fingerprint, and one implementation must compute it | `rdkit_lab.html` loads `bsi-cheminfo.js` and uses its `tanimoto()` and `fingerprint()`; the eight-bit similarity has been removed | `test_cheminfo` — page and engine give the same Tanimoto over all **28 pairs**, deviation **exactly 0**; the fake-similarity functions no longer exist; every reference structure is valid and carries the **monoisotopic mass** of the drug it names |
| **SCI-22** | Conversions between molecular languages must be checked against an external source or against hand calculation, and coordinates written to a file must be real and declared | `bsi-molingue.js` — **seventeen outputs**, from SMILES to CML | `test_lingue` — 7 **literature InChI keys**, full SMILES → molfile → SMILES round-trip, 26 hand-written names, **7 required refusals**; mass composition against hand calculation (alanine C 40.44%, aspirin C 60.00%); XYZ and PDB with non-null coordinates **and** declared 2D |
| **SCI-23** | Angles, lengths and dihedrals are measured on the coordinates, and on flat coordinates they are not shown | dot product for angles, cross product for dihedrals | `test_mol3d` — tetrahedron **109.4712°**, water 104.47°, CO₂ 180°, BF₃ 120°, ammonia 106.13°; dihedrals 0°, 60°, 90°, 180°; ethanol C–C 1.509 Å; and the refusal tested in both directions |
| **SCI-24** | A spectrum read from a file must be decoded according to the format, and the peaks found must be the ones that are there — no more, no fewer | `bsi-spettrolettore.js` — JCAMP-DX with full ASDF (PMAI, DIF, DUP) and the integrity check the format prescribes; peaks by **prominence**, noise from MAD × 1.4826 | `test_spettrolettore` — **39 checks**. On three Gaussians built at 1715, 2950, 3400 cm⁻¹ under noise it finds three: 1716, 2952, 3402. **Both ways**: on pure noise it finds **zero**. ASDF verified symbol by symbol (`abcdefghi` = −1…−9; `n` = −5, not −4) |
| **SCI-25** | A band must be declared *compatible with*, never assigned to a single possibility | `BANDE_IR` — 24 ranges; `assegnaIR()` returns **all** compatible assignments | `test_spettrolettore` — at 1715 cm⁻¹ both a ketone C=O and a carboxylic acid C=O appear; the section states that it does not deduce the structure |
| **SCI-26** | A published model must be checked against **its own** declared error, and a learned model against chance | `bsi-cheminfo.js` §10 — ESOL (Delaney 2004) with its uncertainty, four drug-likeness filters reported separately, random forest with out-of-bag error | `test_spettrolettore` §4-5 — ESOL against four experimental values, mean deviation **0.68**, inside the declared ~1 log unit; forest out-of-bag R² **0.90** on a non-linear relationship and **−0.16** on pure noise; deterministic for a given seed and different for another |
| **SCI-27** | A structure without a source must not get in, not even one that is known | collected from ChEMBL, `tools/dati/farmaci_v187.json` carries each entry's identifier | **Two refusals**: ivermectin (`structure_type NONE`, a mixture of homologues) and semaglutide (a protein, `SEQ`). And two entries kept under the **record's** name rather than the query's: «morphine» → apomorphine, «levothyroxine» → liothyronine |
| **SCI-28** | A predicted spectrum must say WHICH atoms produce each signal, and the deviation must be measured on molecules that did not choose the parameters | `bsi-pretsch.js` — the estimation tables transcribed in full from the source (Pretsch 4th ed.: 91 ¹³C and 66 ¹H rows for benzenes, 42 for ethylenes, 31 for alkanes, 24 for ¹³C aliphatics, 4×4 steric corrections); `bsi-nmr.js` — the reasoning that applies them: ring position obtained by walking the cycle, additive scheme with a cyclic reference compound, chemical equivalence by shell environment code | `test_nmr` — **56 checks**. Two separate sets: tuning **0.71 ppm** over 9 molecules, **validation 0.92 ppm** over 22 never used for tuning, worst case **4.9 ppm**, ¹H **0.06 ppm** (0.03 on the aromatics alone). The bench requires validation to stay **worse** than tuning: were they equal, someone would have moved a molecule between the two sets |
| **SCI-29** | Chemically equivalent atoms must give ONE signal, not one per atom | environment code built as concentric shells by distance (the HOSE-code principle), with aromatic bonds written as such and not in Kekulé form | `test_nmr` — eight molecules whose signal count is known: benzene **1** (not six), toluene 5, p-xylene 3, naphthalene 3, biphenyl 4, aspirin 9. All correct |
| **SCI-30** | From an image one can recover the SHAPE of a spectrum, not its calibration | `bsi-spettrolettore.js` §6-bis — trace extraction from the pixels column by column, background estimated from the median, empty columns interpolated | `test_spettrolettore` — on a **constructed** figure with Gaussians at 1715/2950/3400 cm⁻¹ it reads **1713/2947/3403** from the pixels alone; **in both directions**, on a blank sheet it refuses instead of inventing a trace; and it declares that the axis scale is not in the pixels |
| **SCI-31** | A two-dimensional NMR map must say WHICH atoms produce each correlation, and must not connect what the topology does not connect | `bsi-nmr2d.js` — one-bond HSQC with inverted sign on CH₂, three-bond COSY between non-equivalent protons, two- and three-bond HMBC; exchangeables excluded from off-diagonal spots | `test_nmr2d` — **40 checks**, in both directions: hexafluorobenzene gives no HSQC spots, benzene **no** off-diagonal COSY spots (its six protons are equivalent), methane **no** HMBC spots despite having four protons |
| **SCI-32** | A program-built 3D geometry must carry THE SAME indices as the predictor, otherwise the peak↔atom link lights up the wrong atom | `bsi-geom3d.js` — distance geometry over the `bsi-nmr.js` graph, hydrogens appended at the end, generator seeded from the SMILES | `test_geom3d` — **29 checks**: every heavy atom has the same index and element across five molecules; bonds and angles within tolerance of literature values; **in both directions** benzene comes out planar and cyclohexane does not |
| **SCI-33** | A document must be opened in full, and whatever could NOT be read must be declared — a reader that returns little without saying so makes the document look nearly empty | `bsi-documento.js` — PDF page by page with its text layer (PDF.js), images, text, Office archives opened with `DecompressionStream` and no libraries | `test_documento` — **47 checks**: PDF, Word and text genuinely opened and their content verified; **in both directions** an image declares there is no optical character recognition and produces no working, an unknown format is refused rather than guessed, a binary file named `.txt` is recognised as binary |
| **SCI-34** | Spectroscopic data recognised in a text must carry their PROVENANCE, and the working must declare what it is missing | `bsi-quesito.js` — recognition by section (IR, MS, ¹H, ¹³C) with the boundaries between sections, then `bsi-elucida.js` for the step-by-step working | `test_documento` — formula, bands, masses with intensities, ¹H signals with integral and multiplicity, ¹³C signals; **in both directions**: CDCl₃ does not become the compound, a band outside 400-4000 is not a band, without an MS label there are no masses, a new paragraph closes the section, a text with no spectra produces no data |
| **ING-01** | One function must not have two implementations: the React/FastAPI stack must run THE SAME files as the application | `stack/api/worker/motore.mjs` — a Node process loads the repository modules with RDKit WebAssembly; no Python engine | `test_stack` — **15 checks**: compares the SHA-256 fingerprints declared by `GET /salute` with those of the files on disk, verifies the numbers match the browser's, and that no `.ts`/`.tsx` file contains a shift table |

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
| **STA-01** | A long session must accumulate neither DOM nodes nor timers | section lifecycle management | `audit_stabilita` §1 — 92 sections × 5 rounds |
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
| **UI-03** | The app must work at 390 px width | `auto-fit` grids, no fixed column | `audit_mobile` — the document's `scrollWidth` across all 92 sections at 390 px; `audit_stabilita` for errors in a phone viewport |
| **UI-04** | The user must be able to know which version they are running and force the update | "Updates" entry in the ✨ panel | `test_aggiorna` — 9 checks |
| **UI-05** | Data deletion must be selective and reversible in its choices | `bsiCancellaDati()` by group | `browser_reset` — 24 checks |
| **UI-08** | Surfaces that appear only after an action must also meet WCAG AA contrast | the six panels of the Cheminformatics section | `test_cheminfo` — the analysis is run, the panels opened in turn, **460 text elements measured, 0 defects**, with the WCAG formulas rewritten inside the bench |
| **UI-09** | Opening a section must not block the page | 3Dmol's first `render()` moved out of the click; the 296 synthesis figures **and the 263 drug cards** drawn in 8 ms slices | `test_fluidita` — **92 sections traversed**, median switch 16 ms, worst 87 ms, **0 sections above 100 ms** (there were 3 with the new drugs, at 159 ms); plus the opposite proofs: the WebGL canvas appears anyway, all 296 figures exist shortly after, and printing does not come out mute. For the viewer the claim is **structural, not temporal**: immediately after the click handler returns, the WebGL context must not exist; shortly after it must — because a millisecond threshold was measuring SwiftShader rather than the code (14…192 ms on identical code) |
| **UI-10** | The interface must switch among many languages, declaring how much each is translated, and carrying the writing direction with it | `bsi-lingue.js` with **fourteen languages**, a searchable selector, `dir="rtl"` for Arabic | `test_lingue` — **170 skeleton elements out of 170 in each of the thirteen languages**, coverage computed by applying the dictionary and counting; writing direction tested in both directions; navigation categories and the search placeholder included |
| **UI-11** | The molecule must show how it holds together, and the viewer must choose the angle | `bsi-mol3d.js`: formation from dust with staggered arrival, and atom selection by click | `test_mol3d` — the canvas **pixels** at 130 ms and 2.3 s, the arrival order (skeleton before hydrogens) measured on each atom's progress, and the selection of 1, 2, 3 and 4 atoms |

---

## 5. Security and privacy requirements

| ID | Requirement | Implementation | Verification bench |
|---|---|---|---|
| **SEC-01** | No API key may be present in the repository | keys only in `localStorage` or in the Worker's secrets | `tools/verifica-sicurezza.js` — 362 tracked files, 8 credential shapes |
| **SEC-02** | No personal data may leave the device without an explicit action | local-first architecture, telemetry disabled | `audit_rete` — **direct verification**: a canary value seeded into 71 stores of the user's data, the application used across 92 sections on 6 pages, and the URL, headers and body of every request inspected. Plus `verifica-sicurezza` on the two exit mechanisms |
| **SEC-03** | Passwords must not appear in clear text in the source | SHA-256 in `file_manager.html` | `tools/verifica-sicurezza.js` |
| **SEC-07** | No credential may EVER have entered the repository, not even in a commit later fixed | no key has ever been committed; keys live in `localStorage` or in the Worker's secrets | `audit_storia` — **1,551 distinct versions of text files across 390 commits**, 9 patterns tested in both directions; fails on a shallow clone, because it would measure less surface |
| **SEC-04** | No conflict marker may reach publication | — | `verifica_guida` §12 — 58 text files |

> **SEC-03 — declared limitation.** GitHub Pages serves static files: any
> page-side access control can be bypassed by whoever reads the source. The File
> Manager's protection is a deterrent, **not** a security control, and the
> documentation says so. Furthermore the password remained in clear text in the
> git history until its removal, and taking a secret out of the files does not
> take it out of the history: `git log -p` hands it to anyone. The only effective
> remedy was to change it, and that **has been done** at version `bsi-v188`. The
> old one remains in the history and no longer opens anything.

---

## 6. Requirements not yet verified automatically

Declared for completeness. They are covered by documentary inspection or by
manual testing, and their automation is planned.

| ID | Requirement | Current coverage |
|---|---|---|
| **UI-06** | Full WCAG 2.1 AA conformance | the mechanical part is automated across **13 pages and 92 sections** (`tools/verifica-accessibilita.js`, 38,407 text elements: it was 19,751 before text over gradients entered the measurement, and 37,409 before the «Spectrum reader» section). **Of the 1,069 contrast defects that emerged, none remain: 0 measured** over those same 92 sections, and the value is recorded as a baseline the bench defends. Unlabelled fields are **zero**: see the box in `docs/09` §4. What remains outside is text inside SVGs and text over a real background image, counted on every run (D-09) |
| **PERF-01** | First-paint time on a low-end device | manual cross-device testing (`docs/02` §4) |
| **SCI-11** | Structures of 2 entries that are not single molecules (it was 6) | **not representable**: Ivermectin is a mixture of homologues, Coartem a combination of two active ingredients. The other four were closed by taking the structure from ChEMBL, see `docs/06` §2.4 |
| **PERF-02** | Code coverage of the verification benches | **partially measured**: 49.89 % of statements over the widest path (`audit_copertura`). Whole-battery coverage and branch coverage remain unmeasured; see §8 |
| **UI-07** | Behaviour on Firefox and WebKit | **not verified** — the battery runs on Chromium only; see §8 |

---

## 7. Overall coverage

| Category | Requirements | Verified by a bench | Coverage |
|---|---:|---:|---:|
| Scientific (SCI-01…34) | 33 | 33 | 100 % |
| AI agent (AI-01…10) | 10 | 10 | 100 % |
| Stability (STA-01…08) | 8 | 8 | 100 % |
| Interface (UI-01…11) | 9 | 9 | 100 % |
| Security (SEC-01…07) | 5 | 5 | 100 % |
| Architecture (ING-01…01) | 1 | 1 | 100 % |
| **Automated total** | **66** | **66** | **100 %** |
| Not automated (§6) | 5 | 0 | 0 % |
| **Declared total** | **71** | **66** | **93 %** |

Coverage is computed over the requirements **declared in this document** and
must not be confused with code coverage: it measures how many requirements have
a bench verifying them, not how many lines are executed during the tests.

> **Why two totals.** Reporting only the 100 % of automated requirements would
> be true and misleading at once: it is 100 % of what was *chosen* to be
> automated. The number that matters to an assessor is the second one — **54
> requirements verified out of 59 declared** — and the five that are missing are
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
| **Partial code coverage** | Measured: **49.89 %** of statements over the widest path a bench walks. It is not the coverage of the whole battery, and it is statements, not branches | Chromium's profiler collects it inside the engine, with no build and without rewriting the source: the obstacle belonged to the tool (c8, istanbul), not to the problem. Value recorded; `audit_copertura` fails if it falls |
| **Chromium only** | Behaviour on Firefox and WebKit is verified by hand, not by a bench | The battery uses `playwright-core`, which downloads a single engine. In the verification environment the CDN for the other engines answers **403** to the network policy: they cannot be installed there |
| **No visual regression** | An unintended graphical change would not be caught | Spectra are deterministic and comparable byte for byte (SCI-05): the comparison exists on the traces, not on the whole page |
| **2 entries without a structure** | Two entries out of 178 have no structure to show: Ivermectin is a mixture of homologues, Coartem a combination of two active ingredients. It was six | See `06-Scientific-Accuracy-Data-Provenance.md` §2.4 |
| **Performance on slow devices** | First-paint time is not measured on low-end hardware | It requires physical devices; the test is manual |

---

_Document updated to version `bsi-v195`._
