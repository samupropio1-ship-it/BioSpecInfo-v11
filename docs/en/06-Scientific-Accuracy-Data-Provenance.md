# Scientific Accuracy and Data Provenance — BioSpecInfo

| Field | Value |
|-------|--------|
| **Software** | BioSpecInfo |
| **Author** | Samuele Pio Provenzano |
| **Version described** | `bsi-v181` |
| **Purpose** | Document how the scientific data shown by the application are generated, by what method they are verified, and what the declared limits are. |

> **Why this document exists.** A chemistry teaching application can be
> impeccable from a software point of view and wrong from a scientific one, and
> the user has no way of noticing: a plausible molecular weight, a
> convincing-looking spectrum and a wrong structure all present themselves in
> the same way. This document describes the checks that make that error
> **visible and automatic**, and declares what stays beyond their reach.

---

## 1. Principle: every scientific datum must be open to contradiction

The criterion adopted throughout the application is that a scientific datum is
not considered verified because it *looks* right, but because **a second,
independent datum exists that would confirm or refute it**. Where that second
datum does not exist, the limit is declared instead of being filled with an
estimate presented as a measurement.

Three concrete applications of this principle:

| Domain | First statement | Second, independent statement | Check |
|---|---|---|---|
| Drug database | structure (SMILES) | molecular weight from the literature | the weight recomputed from the structure must agree |
| IR / NMR spectra | functional groups recognised | molecular structure via RDKit | groups are sought on the graph, not on the text of the SMILES |
| Physical constants | tabulated value | symbol and unit of measure | the lookup refuses ambiguous matches instead of picking one |

---

## 2. Pharmacological database — 233 entries

### 2.1 The verification method

Every entry declares **two** properties of the same molecule: the structure, in
SMILES notation, and the molecular weight. They are independent statements — the
first describes atomic connectivity, the second is a number taken from the
literature — and therefore comparable:

```
weight computed by RDKit from the structure   ⟷   weight declared in the table
```

A discrepancy above **0.6 u** (a tolerance that covers rounding and small
differences between atomic-mass tables, but not a real error, which is worth
tens of units) indicates that at least one of the two statements is wrong.

The check is automated (`tools/verifica-farmaci.js`, runnable by anyone holding
the repository) and requires no human judgement: it does not ask anyone to trust
a source, it compares two numbers.

### 2.2 What it found

Applied to the 143 pre-existing entries, the check identified **89 errors**.
The distribution is significant: the **molecular weights were correct** — taken
from the literature — while the **structures were wrong**.

| Drug | Structure declared |
|---|---|
| Ketamine | an unrelated pyrrolidinone |
| Morphine | non-matching structure (in two separate entries) |
| Lorazepam | missing the 3-position hydroxyl that defines its identity |
| Atorvastatin | missing the anilide group |
| Testosterone | missing the Δ⁴ double bond of ring A |

Plus **7 duplicated drugs** in different categories, with data that sometimes
diverged between the two copies.

### 2.3 The discrepancy as a diagnostic instrument

The numerical value of the difference is not merely an alarm: it indicates
**which** fragment is missing or superfluous.

| Δ (u) | Interpretation | Real case |
|---|---|---|
| 28.05 | C₂H₄ | ketamine, fentanyl, morphine |
| 16.00 | one oxygen atom | tetracycline (one hydroxyl too many) |
| 14.02 | a CH₂ group | doxycycline |
| 2.02 | a missing double bond | testosterone (Δ⁴) |
| 0.98 | cytosine ⟷ uracil | **sofosbuvir** |

The last case deserves a note: a discrepancy of 0.98 u corresponds exactly to
replacing an −NH group with an oxygen atom, that is, to the difference between
cytosine and uracil. Sofosbuvir is a **uridine** analogue, and the proposed
structure contained the wrong base. The number showed where to look.

### 2.4 Current state and declared limits

| | |
|---|---|
| Drugs in the database | **178** (it was 143) |
| With a verified structure | **157** (it was 153) |
| Defects | **0** |
| Declared and accepted deviations | **21** (it was 25) |

Verification is **conformant**: no entry presents a structure that contradicts
its own molecular weight. The 21 deviations are entries **without a structure**,
each recorded with its own reason in
[`../evidence/deviazioni-note.json`](../evidence/deviazioni-note.json) and
reported in the verification report.

**Defect versus deviation.** The check distinguishes two situations that must
not be confused:

- a structure that **contradicts** its own weight is a defect, and fails
  verification;
- an **absent** structure may be an acceptable deviation — but only if
  explicitly recorded, with its reason. An entry without a structure and **not**
  recorded fails verification like any other defect.

Recording a deviation is therefore a deliberate decision, traced in git and
visible in the report, not a way of silencing a check.

And it must also be **revoked** when it is no longer needed. From version
`bsi-v181` the bench also fails in the opposite case: an entry listed in the
registry that **does** have a verified structure is a permission left switched
on for nothing, and tomorrow it would silently cover a wrong structure put in
its place.

### 2.4-bis Four entries that left the registry

Of the six entries without a structure, four were closed by taking the structure
from **ChEMBL** — a source independent of this project — and verifying it with
the same structure ⟷ molecular weight comparison that applies to all the others.

| Entry | ChEMBL | Formula | Weight declared | Weight computed |
|---|---|---|---:|---:|
| Digoxin | `CHEMBL1751` | C₄₁H₆₄O₁₄ | 780.94 | 780.95 |
| Vincristine | `CHEMBL90555` | C₄₆H₅₆N₄O₁₀ | 824.96 | 824.97 |
| Tacrolimus topical (Protopic) | `CHEMBL269732` | C₄₄H₆₉NO₁₂ | 804.02 | 804.03 |
| Tacrolimus systemic (Prograf) | `CHEMBL269732` | C₄₄H₆₉NO₁₂ | 804.02 | 804.03 |

The reason recorded for digoxin said "every structure tried departs by 14-30 u
from the literature weight": the declared weight was right, it was the
structures tried that were wrong. That the comparison is real and not
complacent can be seen by adding a single carbon to the correct structure — the
bench reports **Δ 14.04** and fails.

**The two that remain are not single molecules**, and no SMILES notation
represents them:

- **Ivermectin** is a mixture of homologues: at least 80 % B1a (C₄₈H₇₄O₁₄) and no
  more than 20 % B1b (C₄₇H₇₂O₁₄). The declared weight, 875.10, is that of the B1a
  component alone. Showing its structure would pass off the majority homologue as
  the whole drug.
- **Artemether/Lumefantrine (Coartem)** is a combination of two distinct active
  ingredients.

In neither case is a structure missing: there is no single one to show.

| Group | Entries | Nature |
|---|---:|---|
| **D-01** — not single molecules | 2 | ivermectin (mixture of B1a/B1b homologues) and artemether/lumefantrine (combination of two active ingredients). It was six: the other four were closed with the structure from ChEMBL, see §2.4-bis. |
| **D-02** — not representable in SMILES | 19 | monoclonal antibodies, proteins and peptides (trastuzumab, pembrolizumab, insulin, semaglutide, ciclosporin A…). The absence is correct, not a gap. |

> The choice is deliberate: a wrong datum replaced by another wrong datum is no
> progress, and a declared absence is preferable to an unverified presence.

---

## 3. Spectral prediction

### 3.1 Structural, not textual, recognition

Functional groups are identified with **SMARTS patterns applied to the molecular
graph** through RDKit (`bsi-spettri.js`), not with regular expressions applied to
the SMILES string.

The difference is not stylistic. The earlier textual method had two structural
defects:

1. **Exclusivity.** The checks were organised in `else if` chains, so **only one
   functional group per molecule** was recognised.
2. **Blindness to structure.** A regex reads characters, not bonds.

The emblematic case is **acetylsalicylic acid** (`CC(=O)Oc1ccccc1C(=O)O`), which
contains both an ester and a carboxylic acid. Textual recognition identified only
the ester; the resulting IR spectrum lacked the broad O–H band at ~3000 cm⁻¹ and
the acid C=O at ~1690 cm⁻¹ — the two bands that identify the molecule — and the
¹H NMR spectrum lacked the carboxylic proton signal at 11.6 ppm.

Graph-based recognition is **additive by construction**: a molecule may present
every group it possesses.

### 3.2 Representation conventions

Axis conventions are not uniform across techniques, and are verified
automatically (`test_assi.js`, `test_assi_canvas.js`) by extracting the tick
labels from the drawing produced:

| Technique | Abscissa | Direction | Ordinate |
|---|---|---|---|
| IR | wavenumber (cm⁻¹) | decreasing, 4000 → 400 | **% transmittance**, bands pointing down |
| ¹H NMR | δ (ppm) | decreasing, 14 → 0 | intensity, TMS reference at 0 |
| UV-Vis | λ (nm) | increasing, 200 → 400 | absorbance |
| MS | m/z | increasing | relative abundance |

### 3.3 Determinism

No spectrum contains random components. Earlier versions added pseudo-random
noise to the trace on every redraw, with the consequence that the same molecule
produced a different spectrum each time and two spectra were not comparable. A
computed profile must be **reproducible**: where a realistic baseline is needed,
a deterministic function of the wavenumber is used.

Likewise, in the NMR predictor the peak heights were generated at random. In a
¹H spectrum the height **is** the quantitative information — the integration —
and inventing it is worse than omitting it. Currently:

- where the number of protons is known, the height is the real integration and
  the label reports it (e.g. `7.26 (4H)`);
- where the prediction is a **range** (e.g. "6.5–8.5 ppm"), the band of the range
  is drawn with a mark on the typical value and a uniform height: the chart shows
  *where* the signal falls without asserting how intense it is.

### 3.4 Chemical effects modelled

| Effect | Implementation |
|---|---|
| Carbonyl conjugation | a ~25 cm⁻¹ lowering applied **to the individual carbonyl**, not globally |
| Phenolic ester | raising to ~1760 cm⁻¹ |
| C–H intensity | proportional to the number of CH₂/CH₃ groups present |
| Aromatic ring substitution | "out of plane" bands 900–690 cm⁻¹ distinguished for ortho/meta/para/mono |
| Aldehyde Fermi doublet | bands at 2820 and 2720 cm⁻¹ |
| Amide bands I and II | 1655 and 1550 cm⁻¹ |

Verification: acetylsalicylic acid produces an aryl ester at 1760 cm⁻¹ and a
conjugated acid at 1690 cm⁻¹ — the two values that identify it — while
acetophenone (conjugated ketone, 1690) and ethyl acetate (unconjugated ester,
1735) confirm that the effect is applied selectively and not indiscriminately.

### 3.5 Declared limits

> The spectra produced are **predictions based on functional-group tables**, not
> measured spectra nor quantum-mechanical simulations. They indicate where the
> bands of the groups present fall, with tabulated positions and intensities.
> **They do not replace an experimental database** (SDBS, NIST) nor an
> instrumental measurement, and the chart says so.

In particular the following are not modelled: second-order spin-spin couplings,
solvent and concentration effects, combination bands and overtones, solid-state
polymorphism.

---

## 3-bis. Cheminformatics and QSAR models

### 3-bis.1 Where the methods come from

None of the methods in the **Cheminformatics** section was invented for the
occasion. They are the ones in use, with the references that define them.

| Method | Reference | How it is implemented here |
|---|---|---|
| **Tanimoto coefficient** | Rogers & Tanimoto, 1960 | Bits in common over bits in union, with the 0/0 = 1 convention declared in the code |
| **Morgan / ECFP fingerprints** | Rogers & Hahn, *J. Chem. Inf. Model.* 50 (2010) 742 | From RDKit MinimalLib, radius 2, 2048 bits |
| **MACCS keys** | Durant *et al.*, *J. Chem. Inf. Comput. Sci.* 42 (2002) 1273 | From RDKit MinimalLib, 166 keys |
| **Rule of five** | Lipinski *et al.*, *Adv. Drug Deliv. Rev.* 23 (1997) 3 | Over the RDKit descriptors, with the violation count |
| **Veber filter** | Veber *et al.*, *J. Med. Chem.* 45 (2002) 2615 | Rotatable bonds ≤ 10, TPSA ≤ 140 Å² |
| **QED** | Bickerton *et al.*, *Nat. Chem.* 4 (2012) 90 | **Recomputed**: MinimalLib exposes 43 descriptors but not QED. The desirability-function parameters are those of the paper |
| **Butina clustering** | Butina, *J. Chem. Inf. Comput. Sci.* 39 (1999) 747 | Threshold on the Tanimoto distance, leaders chosen by neighbour count |
| **Bemis–Murcko scaffolds** | Bemis & Murcko, *J. Med. Chem.* 39 (1996) 2887 | Ring systems plus the bonds that connect them |
| **PAINS** | Baell & Holloway, *J. Med. Chem.* 53 (2010) 2719 | A subset of the SMARTS patterns, with the reason for the flag |
| **Brenk alerts** | Brenk *et al.*, *ChemMedChem* 3 (2008) 435 | Likewise |
| **SALI** | Guha & Van Drie, *J. Chem. Inf. Model.* 48 (2008) 646 | Δactivity / (1 − Tanimoto), over the pairs above the similarity threshold |

### 3-bis.2 The four things that make a QSAR honest

A QSAR model is extremely easy to make look good. The four precautions below
are what separate a number from a measurement, and all four are verified by
the `test_cheminfo` bench.

**Scaffold split.** With a random split, close analogues from the same series
end up on both sides: the model recovers what it has already seen. The scaffold
split groups the molecules by Bemis–Murcko scaffold and assigns **whole
scaffolds** to one side only. The R² that comes out is lower — and it is the one
that survives the new molecule.

**Null model by scrambling.** The same model is retrained eight times on
shuffled labels. If the true score does not exceed the best of the twins, the
model has learnt nothing transferable, and the panel says so in those words. It
is the check most often missing: without it, an R² of 0.4 over thirty molecules
is indistinguishable from chance.

**Applicability domain.** A prediction on a molecule far from everything the
model has seen is an extrapolation, not a prediction. The distance to the
nearest training neighbour is shown next to every predicted value.

**Scaffold-grouped cross-validation.** A single split, over a small set, is a
noisy number: on 28 molecules at 25 % the test set holds seven, and moving one
shifts the R² by tenths. The folds group by scaffold — no scaffold sits in two
folds — and the result is given as **mean ± deviation**, not as a single figure.

> **How much this matters, measured on the 28-inhibitor example.** The single
> split gives R² **0.861**. Five-fold validation gives **0.605 ± 0.452**, with
> the individual folds at 0.861 · 0.538 · 0.795 · **−0.150** · 0.980. The single
> split had drawn the lucky fold. Together the two figures say what neither says
> alone: the model works, but it depends appreciably on which molecules it gets
> for training — and on a set of twenty-eight molecules that is exactly what one
> should expect.

### 3-bis.3 Declared limits

| Limit | Consequence |
|---|---|
| The example sets are **small** (28 and 40 molecules) | They exist to show the method, not to produce a usable model. On sets that size, the null model is the only serious defence — which is why it is there |
| The model is **linear in the kernel** (kernel ridge, Tanimoto kernel) or logistic | No neural network, no gradient boosting: on a few hundred molecules these give no demonstrable advantage, and the cost would be a model one cannot inspect |
| **PAINS are not a verdict** | A PAINS pattern signals that the compound has often been a false positive in fluorescence assays, not that it is inactive. The panel writes this next to every flag |
| The **PCA is on the descriptors**, not on the fingerprints | On binary fingerprints PCA is not very informative; loadings on descriptors can be read, and are shown |
| There is no **large-scale substructure search** | The workbench is sized for the sets one pastes in by hand, not for a library of millions of compounds |

---

### 3-bis.4 Two surfaces, two roles — and a number that was false

The application has **two** places where cheminformatics happens, and they
serve different purposes. The distinction is written here because an assessor
who opens the wrong page first would form the wrong impression.

| | `rdkit_lab.html` — "RDKit Lab" | **Cheminformatics** section |
|---|---|---|
| **Who it is for** | Someone studying: one molecule at a time, to see what RDKit can say about it | Someone working: a set of molecules, to derive a defensible model |
| **Input** | One SMILES | A pasted set, with the measured activity |
| **QSAR** | **Empirical** estimates from the descriptors, declared as such in the panel | A model **trained** on the supplied data, with scaffold split, cross-validation and null model |
| **Output** | What is on screen | CSV and method report |

> **A number that was false, and how the bench caught it.** The lab's "Pharma
> Pro" panel compared the molecule against eight reference drugs and displayed
> a similarity percentage. That percentage did not come from a fingerprint: it
> came from **eight bits of thresholded descriptors** — "has aromatic rings",
> "HBA > 4", "weight between 200 and 500" — over which a Tanimoto was computed.
> Measured: **caffeine against metformin gave 0.75**, while on Morgan
> fingerprints it is **0.024**. Two molecules with no fragments in common,
> shown at 75 %, on a page called "RDKit Lab" where RDKit was already loaded.
>
> Alongside that, three of the eight reference fingerprints were **written by
> hand** and had the "aromatic" bit wrong (caffeine, which has two aromatic
> rings, morphine and amoxicillin which have one), and the **SMILES for
> omeprazole was not omeprazole**: `COc1ccc2[nH]c(=S)cc2c1OC` is a structure
> RDKit rejects.
>
> All corrected: the comparison uses the Morgan fingerprint with the shared
> engine's Tanimoto, the fingerprints are computed rather than typed in, and
> omeprazole is omeprazole (monoisotopic mass 345.11, three aromatic rings —
> both verified). The two functions of the fake similarity were **removed**,
> not bypassed: leaving them around would have put them back in use at the
> first edit, and the bench checks that they no longer exist.

**One implementation of Tanimoto.** The lab had its own, which agreed with the
engine's on ordinary cases but answered 0 where the engine answers 1 (two empty
fingerprints). The page now loads `bsi-cheminfo.js` and calls that:
`test_cheminfo` compares the two routes over all 28 reference pairs and demands
a deviation of **exactly zero**.

---

## 3-ter. Alternative text for figures is not invented

The biochemistry guide carries **98 figures**. On replacing it, the
accessibility bench rejected it: none had an `alt` attribute.

The easy way out was `alt=""`, and the bench would have accepted it — the
comment in its code says, correctly, that for a **decorative** image this is
the right thing: it tells the screen reader to skip it. But these are
biochemistry figures, that is, information. Marking them decorative would have
passed the check by telling screen-reader users to ignore 98 diagrams: a hollow
green, of the same family as the "contrast 0" that did not cover the new panels
(§3-bis) and the 100 % coverage that summed the wrong ranges.

The honest way was available: every image sits inside a `<figure>` with its own
`<figcaption>`, and **the captions were written by the document's author**.

| | |
|---|---|
| Figures | 62, holding 98 images |
| Single-image figures | 26 — the alt is the caption, minus the "Figura N." label |
| Two-panel figures | 36 |
| Pair captions split between the two panels | **33 out of 36** |
| Pairs sharing one caption | 3 — they do not split unambiguously |

All 36 pair captions distinguish the two panels with "a sinistra" (left) and
"a destra" (right): where the split is unambiguous, each image receives its own
half of the sentence. Where it is not, the two images share the whole caption —
verbose to listen to, but **it cannot be wrong**, and a wrong description of a
figure is worse than a verbose one.

> **Why not attempt a more aggressive split.** The remaining 3 could have been
> squeezed out with looser regular expressions. A split that goes wrong produces
> "this image shows X" next to an image that shows Y, and the screen reader
> reads it with the same confidence as the correct ones. The fallback is noisy;
> the error is invisible.

Measured after the change: **98 out of 98 with alternative text, none empty**,
contrast **0** over 1,897 text elements.

---

## 3-quater. From prototype to working tool

The functions described in §3-bis were enough to say something defensible
about a set of molecules. They were not enough to **work** with it: on day one,
a cheminformatics group asks to search a substructure across the whole set, to
see the SAR table, and to know what happens to activity when a chlorine is
replaced by a methyl.

### 3-quater.1 What the library had, and what it does not

Before designing anything, MinimalLib 2025.03.4 was **probed at runtime**
rather than assumed. Probing first changed the design: three of the
capabilities below had gone unused because nobody knew they were there.

| Present | What it is for |
|---|---|
| `SubstructLibrary` | Substructure search with a pattern fingerprint: it discards in bulk the molecules that cannot match, instead of attempting isomorphism on each |
| `get_rxn` · `Reaction.run_reactants` | Chemical transformations. This is what makes it possible to **cut** a bond, and from there come matched pairs and the SAR table |
| `generate_aligned_coords` | Aligning molecules to a common core |
| `get_molblock` · `get_v3Kmolblock` | **SDF** export, the format in which sets are exchanged between groups and programs |

| Absent | Declared consequence |
|---|---|
| `cleanup`, `neutralize` | Standardisation stops at the largest fragment and the canonical SMILES: **charges are not neutralised** |
| `canonical_tautomer` | Two tautomers written differently remain two distinct entries |
| `FragmentOnBonds`, `RWMol` | No direct molecule editing: cutting goes through a reaction |
| Maximum common substructure (MCS) | A SAR table's core must be **supplied**, not deduced. The panel offers eight ready cores and a free field |

### 3-quater.2 The cut, and why two rules are needed

A reaction SMARTS breaks a bond and marks both ends with a dummy atom. Verified
at runtime: `CCOc1ccccc1` gives three cuts under the fine rule (CH₃–CH₂, CH₂–O,
O–aryl) and two under the coarse one; benzene and methane give none.

| Rule | Cuts | When it is needed |
|---|---|---|
| **fine** (default) | Any acyclic single bond, **including terminal substituents** Cl, CH₃, OH, F | SAR table and fine transformations (Cl → CH₃) |
| **coarse** (BRICS-style) | Excludes terminal atoms | Large sets, where fine cuts are too many; produces larger variable parts ("chlorophenyl → phenyl") |

> **The fine rule was born of a defect.** The first draft used only the coarse
> one, and the SAR table of the test series **lost the chlorine on the ring**:
> it found the substituent on the nitrogen and missed exactly the column that
> matters, because chlorine is terminal. The fine rule is a superset of the
> coarse one: every cut the coarse rule finds, the fine one finds too.

### 3-quater.3 Matched molecular pairs

Two molecules form a pair when, cutting one bond in each, they are left with
the **same context** and two different variable parts. The activity difference
is attributed to that substitution and to nothing else — which is why this
reading beats a correlation over the whole set, which averages over molecules
differing in ten ways.

Verified on a series **built with known effects**: if the analysis does not
recover them, it is not usable on real data.

| Transformation | Expected | Found | Concordant pairs |
|---|---:|---:|---|
| chlorophenyl → phenyl | −1.0 | **−1.0** | 2 of 2 |
| methylphenyl → phenyl | −0.5 | **−0.5** | 2 of 2 |
| methyl → chlorine | +0.5 | **+0.5** | 2 of 2 |
| ethylamide → propylamide | +0.2 | **+0.2** | 3 of 3 |

On the 28 example inhibitors, taken from ChEMBL: **449 pairs, 98
transformations** seen at least twice, 199 seen once, in 133 ms. At the top,
**CF₃ → SO₂NH₂ with a median Δ of −2.65** over two concordant pairs.

Two declared choices:

- the **direction is normalised** on the alphabetical order of the two parts.
  Without it the same effect would appear twice, with opposite medians, and
  neither would carry the right pair count;
- transformations seen **fewer than twice** are excluded from the table and
  counted separately. A transformation seen once with Δ = +3 is not a
  discovery: it is an anecdote, and putting it at the top would have decisions
  made on it.

> **The "concordant" column is the one that decides whether to trust it.** A
> median of +1.0 over three pairs one of which is −2.0 is not the same as +1.0
> over three pairs all positive, and the median alone does not say so.

### 3-quater.4 The SAR table, and how the position is found

The hard part is not finding the substituents: it is knowing which **position**
each occupies. With no MCS and no molecule editing, the solution exploits a
property of the cut: **the fragment containing the core carries the dummy atom
exactly at the attachment point**. Matching the core onto that fragment reveals
which of its atoms the dummy hangs off, and therefore which position the
substituent occupies.

This also yields a necessary and free filter: if the dummy is **not** attached
to a core atom, the cut happened inside a substituent and that piece is not the
whole substituent. It is discarded.

On the 28 inhibitors, with a benzamide core: **20 molecules with the core, 2
positions, 8 excluded**. The excluded ones do not appear in the table: showing
them with empty cells would make them look like part of the series with
substituents that were not found.

> **A naming defect, and how it showed itself.** `scaffoldMurcko()` returned
> its result in a field called `smiles`, but that value **is not a SMILES**: it
> is a canonical fingerprint of the scaffold, built so that two molecules with
> the same scaffold produce the same string. It serves to **group** — folds,
> scaffold split — not to query. The SAR panel took it for a SMILES and
> proposed `6,6,6,6,7,…|0-13:1,…` as the core; decomposition answered "core not
> interpretable".
>
> The field is now called `chiave` (key) and declares `eUnoSmiles: false`;
> `smiles` remains as an alias. The bench pins that equal scaffolds give the
> same key, that different scaffolds give different keys, and that the key
> **does not read back as a SMILES**. A field's wrong name is a defect like any
> other.

### 3-quater.5 The rigour an assessor demands

Five things a modelling group puts in every report, and whose absence is the
first objection in a meeting.

| | Method | Why |
|---|---|---|
| **Model comparison** | Trivial reference (predict the mean), kNN over Tanimoto, kernel ridge — all on the **same folds**, grouped by scaffold | Comparing a model evaluated on one split with another evaluated on a different split is not a comparison. And the trivial reference sits at the top of the list, because it is the number every other must beat |
| **Nested validation** | Hyperparameters (k, lambda) are chosen on folds **internal to the training set** | Trying ten of them on the test set and reporting the best inflates the score: that number is not a prediction, it is the maximum of ten attempts |
| **Conformal intervals** | Split-conformal, quantile ⌈(n+1)(1−α)⌉ of the absolute residuals on a calibration portion split **by scaffold** | "7.2" and "7.2 ± 0.3" are two different pieces of information, and only the second says whether synthesis is worth it. Calibrating on analogues of the training set would give intervals too narrow precisely on new molecules |
| **Enrichment** | EF at 1 %, 5 %, 10 % with the **maximum achievable** alongside; BEDROC (Truchon & Bayly, *J. Chem. Inf. Model.* 47 (2007) 488) | In a screen one does not look at the whole list. A ROC-AUC of 0.80 can hide a top-of-list with not a single active, because AUC also rewards the ordering in the tail, which nobody will buy |
| **Learning curve** | Score against training-set size, with the test set **whole** at every point | It answers the only question that matters when the model is mediocre: more chemistry or more data? |

**The comparison's verdict is proven in both directions**, like the null model.
On a real signal — activity proportional to halogen count, over ten distinct
cores — kernel ridge reaches R² 0.943 with a margin of 0.943 against a
dispersion of 0.035, and the verdict is *beats it*. On the **same molecules with
random labels** the best stops at −0.265, margin −0.034, and the verdict is
*does not beat it*. A guard that never fires and one that always fires are the
same defect.

Enrichment is verified on the three cases where the right value is computable
by hand:

| Ordering (2 actives of 10) | AUC | EF@20 % | BEDROC |
|---|---:|---:|---:|
| Perfect: both actives on top | 1 | **5** — and it is the maximum achievable | **1** |
| Worst: both actives last | 0 | 0 | **0**, not a negative |
| Actives at ranks 2 and 5 | **0.75** = 12/16 | **2.5** = 1/0.4 | 0.119 |

The worst case is the one that counts: without it one would not know whether
BEDROC reaches zero or goes below, and a negative BEDROC is the sign that the
formula's additive term is missing.

### 3-quater.6 Limits of this block

| Limit | Consequence |
|---|---|
| Pairs grow with the **square** of the molecule count | Measured: 6 molecules 45 ms, 40 molecules 227 ms with 1,255 pairs. Beyond 300 molecules the panel refuses to start and says so, instead of freezing the page |
| The cut is **single** | A pair differing by two substitutions at once is not found. This is the limit of the single-cut scheme, shared with the standard tools |
| The same transformation appears in **several forms** | Cuts at different positions give different contexts for the same chemical change (`*CC>>*CCC`, `*NCC>>*NCCC`, `*C(=O)NCC>>*C(=O)NCCC`). This is expected redundancy in the single-cut scheme, not an error |
| Charges are **not** neutralised and tautomers not canonicalised | MinimalLib does not allow it (§3-quater.1). A set mixing neutral and ionic forms of the same molecule counts them as distinct entries |
| The SAR table's core must be **supplied** | No MCS available. The panel proposes nothing automatically, because a wrong proposal is worse than no proposal |

---

## 4. Physical constants and tabulated data

The lookup of physical constants proceeds by decreasing specificity (exact match
→ symbol → significant words → substring of at least 4 characters) and
**collects every candidate**: if more than one remains, the request is refused
with the list of possibilities rather than arbitrarily returning the first. A
wrong physical value returned with confidence is worse than a request for
clarification.

The exam molecules (`MOLECOLE_ESAME`) are tabulated with verified values; the
recognition of groups from SMILES uses a `consuma` field, so that each group
removes the portion of structure it has explained and no overlapping counts are
produced.

---

## 5. Automation of the verification

All the checks described are runnable and repeatable. At the time of writing the
battery includes, among others:

| Bench | Subject | Checks |
|---|---|---|
| `tools/verifica-farmaci.js` | structure ⟷ molecular weight, duplicates, recorded deviations | 233 entries |
| `test_spettri` | group recognition on reference molecules | 36 |
| `test_assi` / `test_assi_canvas` | axis conventions (SVG and canvas) | 19 |
| `test_costanti` | physical-constant lookup and refusal of ambiguities | 45 |
| `audit_dati` | consistency of the tabulated data | 29 |
| `verifica_guida` | correspondence between what the documentation promises and what the code does | 71 |

The last bench deserves a mention: it verifies that the statements contained in
the user documentation correspond to the real behaviour of the code. A promise
the documentation does not keep is a defect on a par with a computational error,
and is treated as such.

---

## 6. Transparency statement

This document describes checks that are **actually implemented and runnable**,
with the results actually obtained and the limits of the predictors. At version
`bsi-v181` the residual errors on the drug database are **zero**: the 21
deviations that remain are entries without a structure, each with its own
recorded reason, not errors passed over in silence.

Where a datum is not verifiable with the instruments available, that is
declared rather than presented as verified.

---

_Document updated to version `bsi-v181`._
