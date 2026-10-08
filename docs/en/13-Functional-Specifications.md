# Functional Specifications — BioSpecInfo

| Field | Value |
|-------|--------|
| **Software** | BioSpecInfo |
| **Version described** | `bsi-v194` |
| **Purpose** | Describe what the product does, for whom, under which rules and with which limits. |

---

## 1. Product description

BioSpecInfo is an **interactive cheminformatics** platform for university study
of chemistry, biochemistry, pharmacology and astrochemistry.

The whole scientific logic — interpretation of molecular structures, spectral
prediction, calculations, 2D and 3D visualisation — runs **in the student's
browser**. There is no server: the application installs as an app, works with no
network, and transmits no data.

### 1.1 Objectives

| Objective | How it is pursued |
|---|---|
| **Total accessibility** | No registration, no cost, no server. Whoever opens the link is already using it. |
| **Independence from the network** | Everything needed is bundled and cached: it works in a lecture hall, on a train, in a library with no signal. |
| **Verifiable correctness** | Scientific data are put through automatic checks; the limits of the models are declared rather than hidden. |
| **Privacy by construction** | There is no backend that could collect data: the absence of collection is not a promise, it is a consequence of the architecture. |

### 1.2 What the product is not

| | |
|---|---|
| **Not a medical device** | It does not support diagnosis, prescription or dosing (Reg. EU 2017/745) |
| **Not a certified analytical instrument** | The spectra are predictions, not measurements |
| **Not a collaborative platform** | No accounts, no sharing, no synchronisation between devices |

---

## 2. Actors

| Actor | Description | What they can do |
|---|---|---|
| **Student** | Primary user. Studying for a university exam. | Every function: consultation, calculation, quizzes, spaced repetition, AI assistant |
| **Teacher** | Uses the app as teaching support | The same functions; uploading their own material into the File Manager |
| **Technical assessor** | A company or committee examining the work | Reading the documentation and re-running the verification benches |

There are no technical roles: there is no authentication, so there is no
distinction of permissions. The File Manager has a local protection that is a
**deterrent**, not an access control (see §6).

---

## 3. Functional areas

The application has **92 sections**, grouped by area of study.

### 3.1 Spectroscopy

| Function | Description |
|---|---|
| **Spectroscopy centre** | A molecule is entered (SMILES, name, formula) and one obtains IR, ¹H/¹³C NMR, MS, UV-Vis, Raman, 2D and 3D structure, functional groups |
| **Visual IR spectra** | Characteristic bands by class of compound |
| **Mass spectrum** | Fragmentation patterns and diagnostic rules |
| **UV-Vis** | Chromophores, λmax, Woodward's rules |
| **Per-atom NMR prediction** | Draw or type a structure and get ¹H and ¹³C with WHICH atoms produce each signal; interrogable spectrum (zoom, intensity, click a peak), assignment table, SMILES/InChI history, CSV/JCAMP-DX/PNG exports |
| **Two-dimensional NMR** | COSY, edited HSQC and HMBC built by walking the graph; clicking a spot highlights the atoms producing it. It is not a simulation of the experiment, and the panel says so |
| **Open a document and have it worked through** | A file of any kind opens — PDF, photograph, Word, OpenDocument, PowerPoint, Excel, text — **everything** it contains is shown (every page drawn, all the text), the recognised spectroscopic data appear in a table **with their provenance**, and the working proceeds step by step. Whatever could not be read is declared |
| **3D model from the drawn structure** | Coordinates built from the graph, carrying the predictor's own indices: a clicked peak lights up the atom in three dimensions too |
| **NOE and 2D NMR (tables)** | Reference values for spatial correlations |
| **Reference tables** | Tabulated values for quick consultation |
| **Spectrum quiz** | Recognising the functional group from a spectrum |

### 3.2 General and physical chemistry

Interactive periodic table · chemical calculator · reaction balancing · degrees
of unsaturation · distribution diagrams · VSEPR · molecular orbitals · advanced
thermodynamics · electrochemistry (Nernst) · pKa and buffers · laboratory
calculator · constants and formulae.

### 3.2-bis Separation — chromatography

**Chromatography** section: a chromatogram computed from the parameters
(theoretical plates, retention factor, selectivity, dead time) with an overview
and an expanded view of the peak pair; a **van Deemter** curve with the three
terms separated and the minimum computed in closed form; a **Kováts retention
index** calculator; a table of the quantities with their working ranges; GC/HPLC
comparison; a guide to detectors; diagnostics for peak-shape defects.

> **Rule applied.** The chromatogram is not an illustration: the Gaussians have
> σ = t<sub>R</sub>/√N and the resolution shown is the one that would be
> measured on those peaks. The section explicitly declares what it does **not**
> do — predict a molecule's retention time from its structure, which would
> require experimental parameters of the stationary phase that cannot be derived
> from the SMILES alone.

### 3.2-ter Calibration and uncertainty

**Calibration** section: ordinary least-squares regression on data pasted from a
spreadsheet, with slope and intercept **accompanied by their standard
deviation**; a plot of the line with a 95 % confidence band and a **residual
plot**; the unknown's concentration with a full confidence interval (the three
sources 1/M, 1/N and distance from the centroid are shown separately); **LOD and
LOQ** per ICH Q2(R1); uncertainty propagation indicating which contribution
dominates; significant-figure rules.

Two diagnostics that an r² does not provide:

| Diagnostic | Method | Why r² is not enough |
|---|---|---|
| **Non-linearity** | F-test between line and parabola on the same data | An r² of 0.984 accompanies an obvious saturation curve: r² measures how much variance the line explains, not whether the line is the right model |
| **Outlier** | **Deleted** residual: the judging line is rebuilt without the point being judged | The naive criterion `|residual| > 3 s(y/x)` does not work — the outlier inflates `s(y/x)` and ends up below its own threshold. Measured: residual 0.0747 against a threshold of 0.1337 |

> **The second row is a trap met while writing the section**, not a textbook
> case: the 3 σ criterion was already written, and the example meant to
> demonstrate it was not being flagged. The check passed without seeing
> anything.

### 3.2-quater Cheminformatics and QSAR

**Cheminformatics** section: a workbench that goes from the raw set to a
verdict on the model, entirely in the browser. SMILES are pasted in — with a
name and an activity, where there are any — and six panels return what a
cheminformatics group produces in a day.

| Panel | What it does |
|---|---|
| **Descriptors** | Standardisation (largest fragment, canonical SMILES, deduplication), 43 RDKit descriptors, Lipinski's rule of five, Veber filter, QED recomputed — MinimalLib does not expose it |
| **Similarity and groups** | Morgan/ECFP4, RDKit, pattern and MACCS fingerprints; Tanimoto and Dice; similarity matrix; nearest neighbours; **Butina clustering** and **MaxMin** selection for diversity |
| **Chemical space** | PCA on the standardised descriptors, with explained variance per component and the **loadings** that say which descriptor moves which axis; **Bemis–Murcko** scaffolds with the molecule count per scaffold |
| **QSAR model** | Kernel ridge (Tanimoto kernel), kNN over Tanimoto or logistic regression; **scaffold split**; **grouped cross-validation** over 3, 5 or 10 folds; **model comparison on identical folds** with the trivial reference at the top; hyperparameters chosen by **nested validation**; **conformal prediction intervals**; **learning curve**; applicability domain |
| **Search** | Substructure search across the whole set with RDKit's `SubstructLibrary`, SMARTS or SMILES query, occurrence counts, eight ready queries |
| **SAR table** | R-group decomposition around a core: one row per molecule, one column per substitution position, with each substituent's median activity. Molecules without the core are **excluded**, not shown with empty cells |
| **Matched pairs** | Pairs differing by a **single** substitution, grouped by transformation with median, range and **number of concordant pairs** |
| **Activity cliffs** | Structurally close pairs with distant activities, ranked by **SALI**: these are the pairs every model gets wrong, and it is honest to show them |
| **Structural alerts** | PAINS and Brenk, with the matched fragment highlighted and the reason it is flagged |

Three choices that separate a workbench from a demonstration:

| Choice | Method | Why |
|---|---|---|
| **Scaffold split** | The test set contains **only scaffolds never seen** in training | A random split puts close analogues on both sides: the model recognises rather than predicts, and the R² that comes out does not survive the first new molecule |
| **Null model by scrambling** | The same model is retrained on **shuffled labels**, eight times; the verdict is the comparison | An R² of 0.4 can arise by chance when the molecules are few. If the random twins reach the same score, the model has learnt nothing — and the panel **says so**, instead of showing only the good number |
| **Deduplication on the canonical form** | `OC(=O)C` and `CC(=O)O` are the same molecule | The same molecule in training and in test is an information leak, and the written string is not enough to see it |

> **The verdict is written out in words, not left to the reader.** The QSAR
> panel does not stop at the metrics: it states whether the model beat all its
> random twins, and by how much. Measured on the 28-inhibitor example: R² 0.861
> against a maximum of 0.574 among the eight twins — margin 0.287. On the same
> molecules with random labels the model does **not** beat the twins, and the
> panel says so in the same way.

### The results can be taken away

Two exports, both formed in memory by the browser: there is no network request,
which is why the note beside the buttons can say that no data leaves the device
without asking anyone to take it on trust.

| Export | Content |
|---|---|
| **CSV table** | One row per molecule: name, canonical and original SMILES, activity, scaffold, nine descriptors, QED, Lipinski violations, Veber outcome, alerts found. With cross-validation active, **predicted** and **residual** are added — and only then, because cross-validation is the one scheme that gives every molecule a prediction from a model that had not seen it |
| **SDF** | The structures with **generated 2D coordinates**, the name on each block's first line and the data fields attached: it is the format in which sets are exchanged between groups and programs. Verified by round-trip |
| **Method report (.md)** | What is needed to **redo** the same analysis: RDKit version, fingerprint, split type, number of molecules and scaffolds, **the seed**, the metrics, the null-model verdict, the folds one by one, and the declared limits |

> **Why the seed is in the report.** Without it, "random split" and "scrambled
> labels" mean nothing: two runs would give different numbers and nobody could
> say which was the right one. The generator is a seeded mulberry32, and the
> same seed gives the same folds.

### A measurement no other bench could make

`verifica-accessibilita` walks the 92 sections and measures what is **visible**.
The six panels of this section live inside a container that stays `display:none`
until the analysis has been run: that bench never saw them, and its "contrast 0"
was not speaking about them.

`test_cheminfo` runs the analysis for real, opens the six panels in turn and
measures WCAG contrast on every piece of text that appears there — **460
elements, 0 defects**. The formulas are rewritten inside the bench rather than
taken from the application: a bench that asked the code under test how good its
own contrast was would be measuring nothing.

The engine lives in `bsi-cheminfo.js`, is exposed as `window.BSIChem` and is
verified by the `test_cheminfo` bench (189 checks) against hand-computable
values.

### 3.3 Organic chemistry

Retrosynthesis (98 exercises) · synthesis and mechanisms with electron arrows ·
animated mechanisms · structure editor · *Organic Chemistry 1+2* module with 25
modules.

### 3.4 Biochemistry

Amino acids · biomolecules · animated metabolic pathways · enzyme kinetics
(Michaelis-Menten) · 3D macromolecules · interactive biological structures ·
biochemistry guide · exam biochemistry.

The **biochemistry guide** is a document of its own
(`Biochimica_Guida_Definitiva.html`, 8.2 MB) loaded into a frame by the section:
12 chapters plus the index, 78 subsections, 98 embedded figures, and two
chapters devoted to the exam — "Oral exam guide" and "Real exam questions and
correct answers". It contains **no scripts and makes no network requests**: it
cannot raise JavaScript errors, and the alternative text of the 98 figures comes
from the captions the author wrote, not from invented descriptions (see
`docs/06` §3-ter).

The document closes with a **self-test of 12 multiple-choice questions**,
recovered from the previous guide — where it was a JavaScript quiz — and
rewritten **without a line of code**: the four options are in plain sight, the
solution sits in a native `<details>` that opens on a click. In print the
`<details>` disappears and a dedicated copy of the solution appears, so the
printed copy does not lose the explanations.

### 3.5 Pharmacology

| Function | Description |
|---|---|
| **3D Atlas** | One chooses a body region, a disease and a drug: the model highlights the target organ |
| **Database** | **263 drugs** with structure, molecular weight, mechanism, indications, adverse effects, class. For **36** the entry carries the ChEMBL identifier and the record's formula, and the formula is rebuilt from the graph and compared |
| **Interactions** | Checking interactions between active ingredients |
| **Pharmacokinetics** | Calculator for half-life, clearance, volume of distribution |
| **Clinical cases** | Diagnosis-therapy paths for teaching purposes |

### 3.6 Astrochemistry

Molecules of the interstellar medium · exoplanets and JWST data · nebulae ·
stellar spectra · nucleosynthesis · cometary chemistry · quizzes.

### 3.6-bis Spectrum reader

You load a file from your own instrument, or paste a text, and it is read.

| Function | Description |
|---|---|
| **Formats** | **JCAMP-DX** (`.jdx`, `.dx`) with full **ASDF** compression — PMAI for digits, DIF for differences, DUP for repeats — or two columns of numbers separated by spaces, commas or tabs |
| **Integrity check** | The JCAMP format prescribes that, after a run of differences, the next value written in full must equal the computed one. That check is performed here |
| **Peak finding** | By **prominence**, with noise estimated from the median absolute deviation (MAD × 1.4826) rather than the standard deviation, which one tall peak inflates |
| **IR assignment** | For each band, **all** compatible assignments among 24 ranges are listed, not the first |
| **Mass spectra** | A peak list is recognised as such; differences between ions are matched against 17 **neutral losses** |
| **NMR** | Integration of areas by chemical-shift region |
| **Drawing** | IR with **decreasing** wavenumbers, the way it is read |

**What it does not do, stated in the section itself:** it does not deduce the
structure. A set of bands is compatible with many molecules, and a program that
produced a name from three peaks would make a claim the data cannot support.

### 3.6-ter Languages and chemical languages

| Function | Description |
|---|---|
| **Interface language** | **14 languages** with a selector and a search field: Italian, English, Spanish, French, German, Portuguese, Dutch, Polish, Romanian, Greek, Russian, Chinese, Japanese, Arabic. Each one's coverage is **measured**, not declared |
| **Writing direction** | Arabic carries `dir="rtl"`; every other language `ltr`, including on the way back |
| **Chemical languages** | **25 outputs** from one SMILES: formula and mass composition, canonical/flat/explicit-hydrogen SMILES, CXSMILES, InChI and InChIKey, the key's skeleton block, Murcko scaffold, CIP stereo tags, SMARTS and CXSMARTS, molfile V2000 (also aromatic) and V3000, XYZ, PDB, CML, JSON, and the **six fingerprints** (Morgan, MACCS, RDKit, atom pairs, topological torsions, pattern) |
| **IUPAC naming** | Over a **declared class** (acyclic, neutral, C H O N F Cl Br I, one kind of principal group, linear substituents). Outside that class it **refuses** instead of guessing |

### 3.7 Study tools

| Function | Description |
|---|---|
| **Spaced repetition** | SM-2 algorithm on cards generated from the contents |
| **Quizzes** | By subject, with score and history |
| **Study path** | A guided sequence of topics |
| **Notes** | Global and per section |
| **Pomodoro** | Study timer |
| **File Manager** | Personal archive of photos, documents and HTML pages |

### 3.8 The "Spectra" assistant

An AI agent with **35 tools** that can interrogate the application itself:
compute descriptors, generate spectra, look up constants, balance reactions,
open sections. It supports ten providers, and stays usable when one of them
fails (§5.2).

---

## 4. Main flows

### 4.1 Analysing a molecule

```
1. Open the Spectroscopy centre
2. Enter the molecule:
     · SMILES                → used directly
     · name or formula       → resolution via PubChem (needs network)
     · drawing in the editor → SMILES generated
3. The application shows: 2D structure, functional groups, descriptors,
   predicted spectra (IR, NMR, MS, UV-Vis), drug-likeness
4. The 3D structure loads if there is a network (conformer from PubChem)
```

**With no network:** point 3 stays complete for SMILES entered directly;
resolution by name and the 3D structure are unavailable, and the application
says so instead of hanging.

### 4.2 Asking the assistant

```
1. Tap the "Spectra" button
2. On first use: choose a provider and enter an API key,
   or connect a proxy (and then no key is needed)
3. Type the question
4. The assistant answers, using its tools when needed:
   every tool used is shown, not hidden
```

**If the provider does not answer:** the assistant notes it, demotes it in the
selection for 24 hours and moves to another configured provider. The
**🔌 Test** button measures in a few seconds which providers the device actually
reaches, **without needing any key**.

### 4.3 Studying with spaced repetition

```
1. Open the study section
2. Generate a deck from the contents
3. For each card, rate how well it was remembered
4. The SM-2 algorithm computes when to show it again
5. On reopening, only the cards that are due appear
```

### 4.4 Archiving your own material

```
1. File Manager → local password
2. Upload photos, documents or HTML pages
3. The material stays ON THE DEVICE (IndexedDB), it is not transmitted
```

---

## 5. Business rules

### 5.1 Scientific data

| Rule | Rationale |
|---|---|
| A molecular structure enters the database only if the recomputed weight agrees with the literature one (±0.6 u) | A plausible but wrong datum is indistinguishable from a correct one for the user |
| If a structure does not pass verification, the entry stays **without a structure** | A wrong datum replaced by another wrong one is no progress |
| Every absence must be **recorded with its reason** | An unjustified exception becomes a shortcut |
| Spectra are deterministic | Two spectra of the same molecule must be comparable |
| An ambiguous physical constant is not resolved at random | A wrong value given with confidence is worse than a request for clarification |

### 5.2 AI assistant

| Rule | Behaviour |
|---|---|
| A provider that does not answer is remembered for **24 hours** | Then it is retried: today's failure is not a sentence |
| A retired model is learned from the error message | Hand-coded lists grow stale |
| An imposed wait longer than **10 seconds** switches provider, if a ready one exists | Beyond that threshold the user believes the app has frozen |
| One turn at a time | Two overlapping submissions corrupt the history |
| Paid providers are not offered as free ones | Without active billing one hits the limit at the first question |

### 5.3 User data

| Rule | Behaviour |
|---|---|
| At most 30 conversations, 100 messages each | Beyond that, `localStorage` fills up and **every** subsequent save fails |
| Images up to 20 MB | Beyond that, explicit refusal; the others proceed |
| Selective deletion by group | Wiping everything to free space is an avoidable loss |
| A failed write **must** be declared | "✅ Saved" when it is not true is worse than an error |

---

## 6. Current limitations

Declared, not hidden. The detail is in
[`09-Release-Conformance-Statement.md`](09-Release-Conformance-Statement.md) §4.

| # | Limitation | Practical consequence |
|---|---|---|
| 1 | **2 entries with no structure to show** (it was 6) | Ivermectin is a mixture of B1a/B1b homologues and Coartem a combination of two active ingredients: a single SMILES notation does not represent them, and for these two the 2D/3D and predicted spectra are missing. Digoxin, vincristine and tacrolimus (topical and systemic) now have their structure, taken from ChEMBL and verified against the molecular weight |
| 2 | **Predicted, not measured, spectra** | Useful for recognising functional groups; not for formal identification |
| 3 | **No synchronisation** | Data do not pass from one device to another, and there are no copies on a server |
| 4 | **File Manager: deterrent, not security** | On a static site, whoever reads the source bypasses any page-side control. The source carries only the SHA-256 digest of the password, never the password |
| 5 | **Functions that need a network** | IUPAC name, CAS, GHS, 3D conformers, AI assistant |
| 6 | **Accessibility automated, not complete** | Contrast, accessible names, labels, heading hierarchy across 13 pages and all 92 sections: **0 defects**, including text over gradients (judged against the worst stop). What stays outside is text inside SVGs and text over a real background image, counted on every run, and everything requiring human judgement |
| 7 | **Chromatography: no retention prediction** | The section computes resolution, efficiency and indices **given** k, α and N; it does not predict k from a structure, which would require experimental parameters of the stationary phase |
| 8 | **Partial code coverage** | Measured: **49.89 %** of statements over the widest path a bench walks. It is not whole-battery coverage, and it is statements, not branches; see `08-Traceability-Matrix.md` §8 |
| 9 | **Verification on Chromium only** | Firefox and WebKit are tested by hand, not by a bench |

---

## 7. Possible developments

Not commitments: directions consistent with the architecture.

| Area | Proposal | Why |
|---|---|---|
| Data | The 2 remaining entries have no structure to show | It is not a gap to close: ivermectin is a mixture, Coartem a combination. At most one could show the **components**, declared as such |
| Spectra | Comparison with experimental databases (SDBS/NIST) inside the app | It would make the distance between prediction and measurement visible |
| Accessibility | Add `axe-core` alongside, for the rules the bench does not implement | ARIA roles, tab order and focus management stay outside the current measurement |
| Export | Full export of the user's data | The only possible remedy for the absence of backups |
| Assistant | A preconfigured proxy for those who do not want to publish one | It would remove the last barrier to AI access |

---

_Document updated to version `bsi-v194`._
