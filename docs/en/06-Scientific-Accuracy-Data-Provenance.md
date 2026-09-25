# Scientific Accuracy and Data Provenance — BioSpecInfo

| Field | Value |
|-------|--------|
| **Software** | BioSpecInfo |
| **Author** | Samuele Pio Provenzano |
| **Version described** | `bsi-v174` |
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

## 2. Pharmacological database — 178 entries

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
`bsi-v174` the bench also fails in the opposite case: an entry listed in the
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

### 3-bis.2 The three things that make a QSAR honest

A QSAR model is extremely easy to make look good. The three precautions below
are what separate a number from a measurement, and all three are verified by
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

### 3-bis.3 Declared limits

| Limit | Consequence |
|---|---|
| The example sets are **small** (28 and 40 molecules) | They exist to show the method, not to produce a usable model. On sets that size, the null model is the only serious defence — which is why it is there |
| The model is **linear in the kernel** (kernel ridge, Tanimoto kernel) or logistic | No neural network, no gradient boosting: on a few hundred molecules these give no demonstrable advantage, and the cost would be a model one cannot inspect |
| **PAINS are not a verdict** | A PAINS pattern signals that the compound has often been a false positive in fluorescence assays, not that it is inactive. The panel writes this next to every flag |
| The **PCA is on the descriptors**, not on the fingerprints | On binary fingerprints PCA is not very informative; loadings on descriptors can be read, and are shown |
| There is no **large-scale substructure search** | The workbench is sized for the sets one pastes in by hand, not for a library of millions of compounds |

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
| `tools/verifica-farmaci.js` | structure ⟷ molecular weight, duplicates, recorded deviations | 178 entries |
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
`bsi-v174` the residual errors on the drug database are **zero**: the 21
deviations that remain are entries without a structure, each with its own
recorded reason, not errors passed over in silence.

Where a datum is not verifiable with the instruments available, that is
declared rather than presented as verified.

---

_Document updated to version `bsi-v174`._
