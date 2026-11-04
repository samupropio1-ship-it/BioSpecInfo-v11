# Test Documentation — BioSpecInfo

| Field | Value |
|-------|--------|
| **Software** | BioSpecInfo |
| **Version described** | `bsi-v240` |
| **Purpose** | Describe how the tests are organised, how to run them, what they cover and where they leave gaps. |

---

## 1. Kinds of test present

| Kind | Present | Notes |
|---|:---:|---|
| **End-to-end (E2E)** | ✅ | Playwright on headless Chromium against a local HTTP server. It is the prevailing form. |
| **Data verification** | ✅ | Scientific data compared against an independent source |
| **Stability tests** | ✅ | Long sessions, exhausted storage, degraded network |
| **Documentation/code consistency** | ✅ | Verifies that what the documentation promises really exists |
| **Isolated unit tests** | ❌ | See §6 |
| **Instrumented code coverage** | ✅ | `audit_copertura`, with Chromium's profiler: no build, no source rewritten. See §6 |

### Why E2E and not unit tests

The application is made of classic scripts operating directly on the DOM, with
no modules and no dependency injection: there are no units that could be
isolated without a deep rewrite. The defects that actually occurred — a blurred
canvas, a button unreachable because its container is collapsed, an AI provider
that stops answering — **would not have surfaced** from a unit test anyway: they
live in the integration between code, DOM and browser.

The choice is therefore reasoned, not endured. Its limits remain, and are
declared in §6.

---

## 2. How to run the tests

### Requirements

```bash
npm install                      # playwright-core only
python3 -m http.server 8899 &    # RDKit WASM requires an HTTP context
```

> Without a server every test fails: opening the files over `file://` prevents
> the WebAssembly modules from loading.

### The whole battery, with a report

```bash
node tools/genera-evidenza.js
```

It runs every bench, transcribes its full output and produces
`docs/evidence/RAPPORTO-VERIFICA.md` with environment, commit and SHA-256
digests. It exits with code `0` only if no bench fails.

```bash
node tools/genera-evidenza.js --veloce   # skips the benches that need a browser
```

The `--veloce` option is useful for a quick check but **is not sufficient for an
attestation**: the benches it skips are precisely the ones measuring real
behaviour.

### A single bench

```bash
node tools/verifica-farmaci.js           # a stand-alone tool
node tools/verifica-farmaci.js --json    # machine-readable output

cd tools/banchi && node test_spettri.js  # one E2E bench
```

The E2E benches live in **`tools/banchi/`**, versioned like the rest of the
repository; the `BSI_BANCHI` variable allows another folder to be pointed at.

> **It has not always been so, and that is worth saying.** Up to version
> `bsi-v168` the default folder was the working area of the session in which the
> benches had been written: **32 of the 39 benches were not in the repository**.
> Whoever cloned it and ran the documented command found seven, and received no
> warning — because a missing bench was counted but did not make the battery
> fail, which closed with "CONFORMANT" and zero failures.
>
> Both things have been corrected: the benches are versioned, and **a missing
> bench makes the outcome NON-CONFORMANT**. A bench that is not there is not a
> bench that passed.

---

## 3. Composition of the battery

**82 benches**, grouped by what they demonstrate.

### 3.1 Scientific data

| Bench | Verifies | Checks |
|---|---|---:|
| `audit_farmaci` | Structure ⟷ weight, duplicates, and the **formula rebuilt from the graph** against ChEMBL's for every entry declaring a provenance | 263 entries, 36 with a source |
| `test_spettri` | Functional-group recognition on reference molecules | 36 |
| `test_spettri_ui` | Grafting of the engine into the app's spectrum-drawing points | 16 |
| `test_assi` | Axis conventions in the SVG spectra | 13 |
| `test_assi_canvas` | Axis conventions in the canvas spectra | 6 |
| `test_costanti` | Physical-constant lookup and refusal of ambiguities | 45 |
| `audit_dati` | Consistency of the tabulated data | 29 |
| `test_farm_ui` | That the Drug Atlas **draws** every drug it holds in memory, category by category, and that a **never-labelled** category still appears | 11 |
| `test_astro` | The astrochemistry data: molecular weight ⟷ formula for the 30 interstellar molecules against IUPAC atomic weights, no repeated celestial body, every quiz question with a valid answer among its options | 13 |
| `test_datasci` | The maths the Data Science section **displays**: R² on an exact relation, standardised weights in the true ratio, ROC on hand-computable values, behaviour on pure noise, and that **no section is left unreachable** | 23 |
| `test_simmetria` | Point groups, normal modes, IR/Raman selection rules | 26 |
| `test_cheminfo` | The cheminformatics engine: Tanimoto and Dice against hand-computable values, Morgan and MACCS fingerprints, Butina clustering, Bemis–Murcko scaffolds, PCA, kernel ridge, scaffold split, **null model by label scrambling**, grouped cross-validation, CSV and SDF exports, **contrast of the nine panels**, agreement between lab and engine, fragmentation, **matched pairs against known effects**, substructure search, SAR table, model comparison in both directions, enrichment (EF and BEDROC) on hand-computable cases, conformal intervals and their **refusal on classification** | 189 |
| `test_spettrolettore` | The spectrum reader and the models that follow from it: ASDF symbol by symbol, explicit and DIF/DUP-compressed JCAMP, prominence peaks on **built** spectra **and on pure noise**, curve versus peak list, neutral losses on toluene, ESOL against four experimental values, four drug-likeness filters reported separately, random forest both ways, **a single entry point** (one button, empty `accept`, routing checked on PDF/`.docx`/`.txt`/`.jdx`/`.csv`/a disguised binary/an image) and the version badge compared with `BSI_APP_VERSION`. **And the relationship between the two IR tables**: `SPEC_DATA.ir` is for studying, `BANDE_IR` for assigning, they are not a duplicate — but the assignment umbrella must **cover** the reference for each of the 23 groups present in both, and not be arbitrarily wider (margin derived from the data, not invented) | 66 |
| `test_nmr` | Per-atom NMR prediction: two separate molecule sets (tuning and **validation**, the latter never used to choose parameters), the signal count on molecules whose count is known, refusals on an unreadable SMILES and on an empty string, the **history** with duplicate detection by InChI key, and the **peak ↔ structure ↔ 3D** sync verified on the indices, not on how many atoms light up | 64 |
| `test_nmr2d` | Correlation maps counted on the graph: HSQC with inverted sign on CH₂, COSY between non-equivalent protons, HMBC two and three bonds away. **In both directions**: hexafluorobenzene gives no HSQC spots, benzene **no** off-diagonal COSY spots, methane **no** HMBC spots despite having four protons | 40 |
| `test_digitalizza` | A spectrum extracted from a **figure**, over seven constructed images whose Gaussian centres are known to the cm⁻¹: bare figure, with frame and labels, with a grey grid, with a black grid, with frame **and** grid, dashed, in %T. **Mean 2.2 cm⁻¹** deviation, **worst 7.3** — one column is worth ~4 cm⁻¹, which is the limit of the figure and not of the method. **In both directions**: from a blank sheet and from the app icon **no** curve comes out; the crude fallback on the same framed figure finds **one** peak instead of three; on a logarithmic axis the midpoint is the geometric mean and on a linear axis the arithmetic one. %T→A conversion on exact values (50 %T → A = 0.301) and a **full round trip** of the exported JCAMP, read back by the reader itself | 45 |
| `test_fisica` | The eight **physics** sections against literature numbers: Schrödinger (harmonic oscillator, infinite well, exact Morse, Crank-Nicolson norm), **STO-3G Hartree-Fock** (Szabo-Ostlund H₂ and HeH⁺, Crawford H₂O to 10⁻⁶ Eh), rovibrational (HCl rₑ, B from combination differences, odd J of O₂ Raman), **NIST-JANAF** standard entropies of eight gases, molecular dynamics (energy conserved, g(r) peak), Hückel, FFT, Runge-Kutta, Arrhenius, the 2θ angles of NaCl/Si/Cu/Fe with absences, Bateman (⁹⁹ᵐTc), ¹⁴C, Weizsäcker; then in the browser every section and tab on two viewports, nothing overflowing at 390 px, the simulation stopped when the section is closed, the buttons translated. **92 checks**, declared minimum 90 | 92 |
| `test_matematica` | The eight **mathematics** sections and the **symbolic engine** against independent values: simplifications, table derivatives and a complicated derivative checked by finite differences, verified antiderivatives (by parts, by substitution) and the Gaussian that must **not** have one, ∫e^(−x²) = √π, Taylor series (1/120, 17/315), standard limits and left/right ones; significant figures, pH, acetic acid from the quadratic formula, eˣ = 3 − x against Lambert's W; function analysis; **the integer inverse of the Hilbert matrix** and det 1/2160, a 4×4 det recomputed separately, eigenvalues 2 ± √2, **balanced reactions** (permanganate, redox with charges, Wöhler); the order of Euler, Heun and RK4 measured; Lotka-Volterra and Brusselator equilibria; critical points and the Maxwell relation; e^(iπ) = −1, Gibbs, Parseval; t, F and Grubbs from the tables, **the Miller & Miller calibration line**, propagation against Monte Carlo. Then every section and tab in the browser on two viewports, a real interaction and the translations |
| `test_esami` | The **exam solvers** for Chemistry (40 models on four levels), Mathematics (Istituzioni I and II plus the advanced level) and Physics (General I and II plus modern physics) and the new physical-chemistry sections: domains, limits, partial fractions, improper integrals, series, constrained extrema, double integrals, differential forms, ODEs with Cauchy checked against SymPy or hand calculation; the 48 physics models against independent formulas; Tafel, Eyring, BET, Langmuir, Mn/Mw, quantum yields; every exercise of the solved papers must produce a working. In the browser the four sections, an opened paper, the solver recomputing, translations |
| `test_assistente` | The **assistant of the three macro-areas**: over 80 natural-language questions, the kind of exercise or model understood, the data read with units (M vs m, μC, km/h, solar masses, percentages), the result compared with SymPy or an independent formula; the inverse problem; the symbolic engine additions verified by differentiation; in the browser the three areas, a question typed into the box, catalogue, search, levels, Spectra's tools, 390 px and English |
| `test_grafica3d` | **What is shown is right**: orbitals (nodes, exact ⟨r⟩ on the sampled cloud, lobe fraction), Kepler and Lorenz, crystals (content, packing, Miller planes, NaCl peak), fields (Gauss, loop); in the browser the 3D Laboratory on two screens, the gestures, chart animations ending identical to the direct drawing, the crosshair, «reduce motion», 3Dmol viewers with bar and quality |
| `test_laboratori` | **Simulations recover the exact answer**: projectile in vacuum, collisions, pendulum with the elliptic integral, normal modes, lenses, grating, RLC transients (Kirchhoff), filters, cycles (ΔU = ΔS = 0, efficiencies), disc gas (Maxwell-Boltzmann, virial), numerical method orders, Runge, conics, skew lines, kinetic equilibrium and Le Chatelier both ways; in the browser the 22 tabs on two screens and a perturbation in the page |
| `test_scienze` | **Astrophysics, relativity, fluids, vector calculus, complex kinetics** against known values (age of the universe, Planck = σT⁴, Hohmann, transits, twins, Poiseuille, Green, vortex, Brusselator) and the **animation engine**: pause, speed, off-screen stop, «reduce motion», on three browser configurations |
| `test_esplorazioni` | **Probability, visual mathematics, electromagnetism, sound, semiconductors, distillation, voltammetry** against known results (Bayes, central limit, Fourier, logistic map, dipole, n_i, V_bi, Antoine, azeotrope, Fenske, Randles-Ševčík, Nicholson); in the browser the 24 tabs on two screens, a hand drawing rebuilt by epicycles, dragged charges |
| `test_approfondimenti` | **Numbers, graphs, gravitation, heat, Ising, phase diagrams, LEPS surface** against known results or a second method (π(x), RSA, Li(x), Floyd–Warshall, Prim, figure-eight, Lagrange, Onsager, IAPWS, Span–Wagner, measured eutectic, H₃ saddle); in the browser the 25 tabs on two screens; the **subject buttons** (visible groups, icons, remembered subject, no section unreachable) |
| `test_pareggio` | The **twelve sections** that bring mathematics and physics to the level of chemistry: runs the twelve scripts in `verifiche/` (462 checks against known results or a second method), opens the 47 tabs on two screens, checks every tab opens in under 100 ms and that mathematics and physics have the declared number of sections |
| `test_v237` | The **twenty new sections** (ten astrophysics, five physics laboratories, five mathematics laboratories): runs their twenty scripts in `verifiche/` (705 checks against published values or a second method, §3.1-bis) and those of the study kits and resources; in the browser opens every tab at **1280 and 390 px**; tests Spectra's face, emotions and mind and the section names in English. Requires at least 900 checks | 1061 |
| `test_3d238` | The **new 3D tabs of 29 sections** of chemistry, physics and mathematics: runs their 29 scripts in `verifiche/` (311 checks against known values, a closed form or a second method, §3.1-ter); in the browser opens every tab of the 29 sections at **1280 and 390 px** and requires full tabs, no ⚠, canvases drawn and named, the last tab a 3D scene that draws, synchronous work on click under **250 ms**; nothing overflows at 390 px; no JavaScript error | 488 |
| `test_sellingua` | The round language switcher, on **two viewports** (1280 and 390 px): the button is visible, round, top right, **at the measured title height** as the overlap of the two boxes, with an accessible name that says what it does; the disc with the fourteen flags on two shells **inside the screen**; and **both ways** the language actually changing, the flag following, the disc closing and, going back to Italian, the text identical to before. **30 checks**, declared minimum 30 | 30 |
| `audit_statico` | The classes of bug this project has already had, searched across **all** files instead of where they showed up: `calc()` without spaces (the browser drops the rule), secrets in logs, API keys in the code, plaintext passwords, `target="_blank"` without `noopener`, duplicate ids in the markup, unbalanced scripts. The report **flags and does not block**, because those classes have false positives. Three measures **do** block, and have a written baseline: verbatim duplicated code blocks (**0**), redefined global functions (**11**, the file's declared "additive patch" style), of which with identical bodies (**0**). If they grow, the battery fails | 3 gates |
| `test_articoli` | That no function has two entry points, and that the articles are not hand-written. Ten tabs inside a single Spectra centre, with each identifier present in the document **exactly once**; no repeated id, no duplicate button, no section reachable by two roads; Spectra out of the menu and with its dedicated button. Then the articles: the links tested as **pure functions** of the identifier, the Nobel explanations matched to the topic of the motivation and **none** invented when it is not recognised, and the decisive proof — an **injected** response with a name that exists nowhere, which must appear on screen. **Three distinct failures**: failed request, empty answer, unrecognised shape | 58 |
| `test_geom3d` | The 3D geometry built from the graph, measured against literature values: bonds, valence angles, alkyne linearity. **In both directions**: benzene comes out planar and cyclohexane does **not**. And the proof that makes the peak↔atom link legitimate: every heavy atom has **the same index and element** as the predictor's | 29 |
| `test_documento` | Opening any document and working through the problem inside: PDF, Word and text genuinely opened and the content verified; the data recognised **with their provenance**. **In both directions**: an image declares there is no optical character recognition and invents no working, an unknown format is refused rather than guessed, CDCl₃ does not become the compound's formula, without an MS label there are no masses | 47 |


> **A bench that verifies a model must also verify it when the model is
> supposed to fail.** `test_cheminfo` exercises the null model in both
> directions: on a learnable signal the true R² (0.394) beats all eight
> label-scrambled twins, with a margin of 0.287; on the **same molecules with
> random labels** the R² (−0.199) does **not** beat them. A check that verifies
> only the first case would pass even if the guard were wired to "true".

> **A "contrast 0" that did not cover the new surface.**
> `verifica-accessibilita` measures what is visible, and the six panels of the
> Cheminformatics section stay hidden until the analysis has been run: it had
> never seen them. `test_cheminfo` now runs the analysis, opens the panels in
> turn and measures contrast over **460 text elements**, with the WCAG formulas
> rewritten inside the bench — asking the code under test how good its own
> contrast is, is not measuring. The bench also demands that more than 250 were
> measured: if the panels failed to open, the zero would be empty and the check
> would fail.

> **Three peaks found prove nothing on their own.** A detector that is too
> sensitive finds thirty where there are three; one that is too strict finds
> none. Neither case raises an error. `test_spettrolettore` starts from three
> Gaussians **built** at 1715, 2950 and 3400 cm⁻¹ under noise and demands that
> the reader find three — 1716, 2952, 3402 — and then, on the **same noise
> without the Gaussians**, that it find **zero**. Without the second check the
> first would pass even with a detector that marked every wiggle. The same holds
> for the random forest: out-of-bag R² 0.90 on the real relationship and
> **−0.16 on pure noise**.

> **The defect was in my counter, not in the data.** The first run of
> `verifica_farmaci_v187` returned **0 formulas out of 36**: every molecule came
> out as `C<n>`, all carbons and no hydrogens. RDKit's `get_json` format is
> **commonchem**, where an atom carries only the fields that **differ** from the
> defaults — `z` is 6 and `impHs` is 0 — so that an atom written `{}` is a
> carbon. I was reading `a.element`, which does not exist in that format.
> Thirty-six data points that look wrong all at once are almost always a wrong
> counter.

### 3.1-bis The twenty v237 sections: what is verified

Each section has a script `tools/banchi/verifiche/verifica-<id>.js` that can be
run on its own with `node` and that sets the computations against published
values or an independent second method. Two or three examples per section,
with the value the script prints:

| Section | Script | Checks | Examples |
|---|---|---:|---|
| 🪐 Solar system 3D | `verifica-sastrosole` | 36 | Kepler solved with residual < 10⁻¹² up to e = 0.97 and confirmed by bisection; Julian date of 1957 Oct 4.81 = 2436116.31 (Meeus, ex. 7.a); Mars 2003 at 0.3730 AU on 27 August (true: 0.3727) |
| 🛰️ Orbital mechanics 3D | `verifica-sastroorbite` | 26 | elements → state → elements over 2000 random orbits (400 hyperbolic), error 2.8·10⁻¹⁴; Curtis ex. 4.3 (h = 58,312 km²/s, i = 153.25°, e = 0.1712); Hohmann LEO → GEO 3.893 km/s |
| 📐 Celestial mathematics | `verifica-sastromat` | 34 | Newton, fixed point and Bessel series agree within 10⁻¹²; Laplace limit 0.6627434; q v q* = R(q) v over 500 random rotations |
| ⭐ Life of stars 3D | `verifica-sastrostelle` | 32 | first Lane–Emden zeros: √6, π, 3.65375, 6.89685; numerical solutions equal to the exact ones within 10⁻¹³; Chandrasekhar mass from the n = 3 polytrope, 1.4563 M☉ |
| 🕳️ Black holes | `verifica-sastrobh` | 30 | ISCO at 6M and photon sphere at 3M from the effective potential; Mercury's perihelion 42.982″ per century; GPS +45.72 and −7.21 μs/day |
| 〰️ Gravitational waves | `verifica-sastrogw` | 29 | GW150914 chirp mass 28.096 M☉; f ∝ (t_c − t)^(−3/8), slope −0.375; Peters coalescence time equal to integrating da/dt |
| 🌌 Galaxies 3D | `verifica-sastrogal` | 32 | modified Bessel functions against the tables (I₀(1) = 1.2660659); Freeman disc peak at 2.150 R_d; NFW M(r) closed form against the integral, 7.6·10⁻¹² |
| 🌠 Cosmology 3D | `verifica-sastrocosmo` | 38 | age with Planck parameters 13.791 Gyr; Einstein–de Sitter 2/(3H₀); maximum D_A at z = 5/4 in Einstein–de Sitter |
| 🔭 Planetarium 3D | `verifica-sastrocielo` | 30 | GMST of Meeus ex. 12.a and 12.b; sidereal day 86,164.091 s; equation of time: +16.45 min around 3 November, −14.20 min around 11 February |
| 🌍 Exoplanets 3D | `verifica-sastroeso` | 27 | the Sun's habitable zone 0.95–1.67 AU; Earth's T_eq 254.8 K; transit depths of Earth and Jupiter 84.1 ppm and 1.056 % |
| 🌀 Spin, qubits and entanglement | `verifica-sfisspin` | 30 | HZH = X, HXH = Z, S² = Z, T² = S; Bloch vector norm 1 after 2000 random gates; measured frequency against cos²(θ/2) within 3σ |
| 🎲 Statistical mechanics | `verifica-sfisstat` | 30 | Schottky peak at kT = 0.41678 Δ, C = 0.43923 k; N₂ v_rms at 300 K = 516.84 m/s; energy conserved over 19,527 elastic collisions |
| ☢️ Nuclei and reactions | `verifica-sfisnuclei` | 28 | B/A of ⁵⁶Fe 8.7903 MeV from the masses; ⁶²Ni with the highest B/A; Q of D + T 17.589 MeV, 14.049 of it to the neutron |
| 🧱 Elasticity and materials | `verifica-sfismateriali` | 27 | elastic slope of steel = E = 207 GPa; closed-form moments of inertia against the strip integral; numerical cantilever deflections equal to the closed forms |
| 🔌 Electronics | `verifica-sfiselettronica` | 27 | simulated ripple against the exact computation in the rectifiers; diode with Newton = closed form with Lambert's W (0.650463089 V); Zener with Newton = bisection |
| 🌊 Partial differential equations | `verifica-smatedp` | 46 | J₀(1) and J₁(1) from the tables within 10⁻¹⁴; twelve Bessel zeros; square membrane with ω₁₂ = ω₂₁ and ω₁₂/ω₁₁ = √(5/2) |
| 🌀 Complex analysis | `verifica-smatanalcomp` | 49 | e^(iπ) + 1 = 1.2·10⁻¹⁶; 2π jump of the logarithm across the cut; Cauchy–Riemann on nine functions |
| 🔗 Markov chains | `verifica-smatmarkov` | 51 | stationary distribution by powers = linear system = Cramer's rule; Ehrenfest with the binomial and detailed balance; periods 2 and 3 recognised |
| 🧩 SVD | `verifica-smatsvd` | 41 | ‖A − UΣVᵀ‖/‖A‖ ≈ 1.6·10⁻¹⁵ on matrices up to 12×12; σ of [[3,0],[4,5]] = 3√5 and √5; σ of the shear = φ and 1/φ |
| 📡 Codes and elliptic curves | `verifica-smatcodici` | 62 | Hamming(7,4): distance 3, 112 single errors corrected, 336 double ones decoded wrongly; CRC-32("123456789") = 0xCBF43926 |

On top of these come `verifica-studio` (167 checks on the kit engine),
`verifica-studio-fisica` and `verifica-studio-matematica` (schema and minimum
quantities; for mathematics **264 answers recomputed** out of 346 questions)
and `verifica-risorse` (87 checks: citation formats and table proofs).

> **Two time thresholds, and why.** In the browser `test_v237` measures how
> long the page stays blocked on the click of each tab. **2D** tabs must open
> within **250 ms**; those that create a **3D** scene within **6 s**. The
> difference is not leniency: in the battery the browser has no graphics card,
> and WebGL runs in the **SwiftShader** software rasteriser, where creating a
> context and compiling the shaders costs 0.2 to 4 seconds. On a device with a
> GPU it is a matter of milliseconds. A tight threshold on the 3D tabs would
> measure SwiftShader, not the app; a loose one on the 2D tabs would let a
> real stall through.

### 3.1-ter The v238 3D tabs: what is verified

Twenty-nine sections receive, at the end, a 3D tab built on the section's
model. Each tab has a script `tools/banchi/verifiche/verifica-<id>-3d.js` (for
Topology and Non-Euclidean geometries the checks were added to the section's
own script) that runs on its own with `node`. Two examples per tab, with the
value the script prints:

| Section · 3D tab | Script | Checks | Examples |
|---|---|---:|---|
| 🏔️ Potential energy surface · 🧊 3D surface | `verifica-schipes-3d` | 9 | at the saddle a single negative curvature: 2116 and −2022 cm⁻¹ (imaginary frequency); the model's ω(H₂) 4396.6 cm⁻¹ against 4401 measured |
| 🧊 Phase diagrams · 🧊 P–V–T surface | `verifica-schifasi-3d` | 8 | acentric factor from the vapour curve: water 0.3443, CO₂ 0.2249; equal Maxwell areas on the dome within 5.5·10⁻¹² |
| 🌀 Complex kinetics · 🧊 Molecular collisions | `verifica-schicinet-3d` | 7 | kinetic energy conserved after 6000 steps and 2993 collisions (1.8·10⁻¹⁵); fraction of collisions above E₀/kT = 2.5 equal to e^(−2.5) within 3σ (0.0812 against 0.0821) |
| ⚖️ Equilibrium and Le Chatelier · 🧊 3D box | `verifica-schiequil-3d` | 7 | A ⇌ B: measured K 2.9976 against 2.9951 theoretical (within 1.5 %); halving the volume lowers the dissociation degree of N₂O₄ from 0.177 to 0.129 |
| 💎 Crystallography and X-rays · 🧊 Cells in 3D | `verifica-scristalli-3d` | 9 | coordination numbers 6, 8, 12, 12, 6, 8, 4 for SC, BCC, FCC, HCP, NaCl, CsCl, diamond; d(hkl) = 1/\|G\| equal to `dSpaziatura` within 4.4·10⁻¹⁶ |
| 🌊 Schrödinger laboratory · 🧊 3D cloud \|ψ\|² | `verifica-sschrod-3d` | 10 | degeneracies of the 3D oscillator 1, 3, 6, 10; fraction of the cloud outside the classical region 0.1107 against P(χ²₃ > 6) = 0.1116 |
| 🧮 Live Hartree-Fock · 🧊 Orbitals in 3D | `verifica-shf-3d` | 9 | H₂ at 1.4 bohr: E = −1.116714 Eh (Szabo-Ostlund); ∫\|ψ\|² over the grid = 1.0000 for σg and σu |
| 🎻 Rovibrational spectroscopy · 🧊 3D rotation and vibration | `verifica-srotovib-3d` | 10 | T + V = G(v) along the classical motion within 9.5·10⁻⁹; CO₂: ν₁ IR-inactive, ν₂ and ν₃ active |
| 🎱 Molecular dynamics · 🧊 3D box | `verifica-sdinmol-3d` | 7 | NVE: \|ΔE\| per particle 9.6·10⁻⁴ over 2000 steps; thermostat: ⟨T⟩ = 1.400 like the bath |
| 🎯 Mechanics in motion · 🌬️ 3D launch with wind | `verifica-sfismecc-3d` | 7 | in vacuum R = v₀² sin 2θ/g = 91.774 m even with 15 m/s of wind; terminal speed √(g/k) = 22.145 m/s (measured 22.1435) |
| ⚡ Electromagnetism in motion · 🌀 3D fields and Lorentz | `verifica-sfisem-3d` | 8 | Larmor radius mv⊥/qB = 0.61538 (measured 0.61539); E×B drift = (0, −0.5) the same for q = +1 and q = −1 |
| 〰️ Waves and optics · 🌊 3D ripple tank | `verifica-sfisonde-3d` | 6 | d = 3λ gives 6 nodal lines, d = 0.4λ none; far minima at arcsin((m + ½)λ/d) within 2.1·10⁻⁵ rad |
| 🪐 Gravitation · 🕳️ 3D potential well | `verifica-sfisgrav-3d` | 8 | \|∇U\| at the five Lagrange points 1.1·10⁻¹⁵; measured period 7.2779 = 2π a^(3/2) |
| ⏱️ Special relativity · 🔦 3D light cone | `verifica-sfisrel-3d` | 6 | invariant interval in (x, y, ct) within 2.7·10⁻¹³; boost composition Λ(β₂)Λ(β₁) = Λ((β₁ + β₂)/(1 + β₁β₂)) within 5.3·10⁻¹⁵ |
| 🌊 Fluids · 🌀 3D flow past an obstacle | `verifica-sfisfluidi-3d` | 7 | sphere: v = 1.5U and C_p = −1.25; cylinder: v = 2U and C_p = −3; lift −ρUΓ = −5988 N/m |
| 🔥 Thermodynamics in motion · 🗻 3D p-V-T surface | `verifica-sfistermo-3d` | 8 | van der Waals critical point: p = 1, ∂p/∂V and ∂²p/∂V² zero; at T = 0.9 p_sat 0.6470, V_l 0.6034, V_g 2.3488 |
| 💡 Semiconductors · 🔷 3D Brillouin zone | `verifica-sfissolido-3d` | 7 | fcc zone: 24 vertices, 36 edges, 14 faces (V − E + F = 2); m*_dos(Si) = 1.084 m₀ |
| 🧲 Ising model · 🧊 3D Ising | `verifica-sfisising-3d` | 6 | ground state e = −3, m = 1 (with h = 0.4: e = −3.4); \|m\| 0.946 at T = 3, 0.052 at T = 5.5 (T_c ≈ 4.5115) |
| ⚛️ Particle physics · 🔭 3D detector | `verifica-sfispart-3d` | 6 | helix in 3.8 T: R = p_T/(0.3 B) = 0.8772 m; invariant mass reconstructed from 200 Z → μμ pairs equal to the generated one within 1.6·10⁻⁵ |
| 🗻 Functions of several variables · 🧊 Tangent plane in 3D | `verifica-smatmulti-3d` | 9 | x² + y² at (1, 2): f = 5, ∇f = (2, 4); second-order deviation from the tangent plane (ratio 4.0445) |
| ∇ Vector calculus · 🧊 3D field and divergence | `verifica-smatvett-3d` | 8 | F = (x, y, z), r = 1.2: flux = ∭3 dV = 4πr³ = 21.7146884216; point charge: flux 4π with the origin inside, 0 outside |
| ∫ Derivatives, integrals and series · 🧊 Solids of revolution | `verifica-smatcalc-3d` | 8 | unit sphere V = 4π/3 = 4.188790204786; spindle of sin x V = π²/2 |
| 🔲 Linear algebra · 🧊 Space transformations | `verifica-smatlin-3d` | 9 | det = triple product = Πλ = 6; reflection: det −1 and det M(1/2) = 0 |
| 🌀 Differential equations · 🧊 Chaos in 3D phase space | `verifica-smatode-3d` | 9 | Lorenz Lyapunov exponent 0.9036 against 0.9056; RK4: error ratio 16.04 when halving the step |
| 🎲 Probability in motion · 🧊 Bivariate normal 3D | `verifica-smatprob-3d` | 7 | ∬ xy f = ρσxσy = 0.546; samples inside Q ≤ 1: 39.37 % against 39.35 % |
| 🍩 Topology and surfaces · 🧊 Surfaces in 3D: χ and orientability | `verifica-smattopo` | 45 (3 from v238) | triangulations of five surfaces at four refinements with χ equal to the mesh's; Möbius: n(2π)·n₀ = −1 and n(4π)·n₀ = +1 |
| 🌐 Non-Euclidean geometries · 🧊 Sphere and hyperboloid in 3D | `verifica-smatnoneucl` | 56 (4 from v238) | hyperboloid and Poincaré disc with the same angles and sides within 1.2·10⁻¹⁵; Gauss–Bonnet on the hyperboloid: π − Σ = area (1.0700757) |
| ℂ Complex numbers and Fourier · 🧊 Riemann sphere | `verifica-smatcompl-3d` | 7 | sphere rotations = SU(2) Möbius maps on 4 axes × 3 angles × 30 points within 5.5·10⁻¹⁶; rotation by π about x: f(z) = 1/z and f(0) = ∞ |
| 🎢 Calculus of variations · 🧊 Soap film in 3D | `verifica-smatvariaz-3d` | 8 | h*/R = 1.32549 (u* tanh u* = 1); h/R = 1.36 tears, h/R = 1.30 stays a catenoid |

All the scripts, run while writing this document: **311 checks passed,
0 failed**. The counts for `smattopo` and `smatnoneucl` include the checks that
existed before v238.

> **One time threshold for the new 3D tabs.** `test_v237` allowed the 3D tabs
> 6 s, because the scene was built inside the click handler and in the battery
> WebGL runs in SwiftShader (§3.1-bis). The v238 tabs build text and controls at
> once and the scene **after** the handler returns: the synchronous work on
> click must stay under **250 ms**, as for 2D tabs. Measured in the trial runs:
> a few tens of milliseconds at most.

### 3.2 AI agent

| Bench | Condition simulated |
|---|---|
| `test_404` | The provider has retired the model |
| `test_503` | Temporary overload |
| `test_ko` · `browser_ko` | Provider unreachable from the browser |
| `test_firma` | Opaque reasoning signatures to be returned |
| `test_tetto` | Token ceiling learned from the error |
| `test_attesa` · `test_attesalunga` | Timeouts and imposed waits |
| `test_doppioinvio` | Two overlapping submissions |
| `browser_prova` | Reachability measurement without a key |
| `test_nucleo` · `browser_prov` | Agentic loop and provider selection |
| `caccia_ai` | Malformed answers, truncated stream, 502 with HTML, Stop during the answer, panel closed halfway, hostile text |

### 3.3 Stability

| Bench | What it puts to the test |
|---|---|
| `audit_stabilita` | 194 sections opened 5 times, full storage, corrupted data, bursts of clicks |
| `audit_promesse` | Rejected and unhandled promises, with a healthy network and a dead one |
| `audit_quota` | `localStorage.setItem` forced to fail on 10 pages |
| `test_sw` | Offline, degraded network, update while working |
| `test_filemanager` | Store unavailable, space exhausted, failed writes |
| `test_visore3d` | WebGL context consumption while browsing molecules |

### 3.4 Interface

`browser_reset` · `browser_proxy` · `browser_proxyui` · `browser_rdkit` ·
`browser_lab` · `browser_frontiera` · `test_aggiorna` · `test_controllaagg` ·
`test_spectra238` · `test_lezione` · `test_spectra_studio` · `test_spectra_rig` ·
`test_guidaproxy` ·
`test_fluidita` · `test_lingue` · `test_mol3d` · `test_spettrolettore`

**`test_spectra238` — 66 checks.** It comes from reports made with a phone
screenshot: with the app installed, Android's status bar and navigation keys
covered the controls of the Spectra Live console, and the model attribution
overlapped the dialogue. Since v239 it also checks, first of all, that Spectra
has **a single visible button**: the circle with the face (`#bsiJV-fab`) is
visible, the «Spectra» pill (`#bsi-spectra-fab`) is not, and the circle is
round (`border-radius: 50%`). The rest of the bench works in four parts:

| Part | What it requires |
|---|---|
| Layout | On a simulated phone (412×915, touch, full-screen window) the safe-margin class is active, the first button at the top is at least **34 px** from the edge and the controls at the bottom at least **46 px**; the telemetry is in two columns and does not cover the face. On a large screen no forced margins. On both: header above the face, face above the state, state above the dialogue, dialogue above shortcuts and controls, attribution inside the control bar; at least four shortcuts with a section open |
| Navigator | For chemistry, physics and mathematics the 🧭 navigator lists **exactly** the sections of the bar (more than 20 per subject), at least four quick tools and ten phrases; opening a section of another subject switches subject, closes the console and leaves the Spectra Live button |
| Level and concentration | An advanced-course question weighs more than a sum (gap > 0.2); «in simple words» lowers it; the same question weighs more (gap > 0.3) in a PhD-level section than in a high-school one, and the declared level is the path's |
| Creator, eyes, sleep | «who created you?» names Samuele Pio Provenzano; «I am your creator» asks for proof and the field becomes a password field; a wrong phrase is rejected, the field goes back to normal and the phrase remains neither in the dialogue, nor in the page, nor in memory; after three attempts the wait; recognised (the bench writes the `bsi-spectra-creatore-v1` mark in `localStorage`: the phrase does not appear in the bench): greeting by name, telemetry «SAMUELE · CREATOR», context for the model and the mind; «forget that I am your creator» removes it. Eyes: joy narrows them (< 0.8), surprise widens them (> 1.25), doubt makes them asymmetric, `#1a3050` at rest, four emotions give four tints, concentration narrows and brightens them, the blink closes the eyelids (< 0.2); after two minutes without contact it sleeps, at the first touch it wakes with surprise |

Still outside, as `docs/08` §6 declares (AI-13): voice, continuous listening and
the other local commands, which cannot be tested in the battery's headless Chromium.

**`test_lezione` — 30 checks.** It comes from the request for an interactive
lesson «for every section» (`bsi-lezione.js`). Since the lesson is not written
by hand but built from the section, the bench does not test one lesson: it
tests them all.

| Part | What it requires |
|---|---|
| All sections | It opens the sections of the bar one by one in the three subjects (switching subject when needed) and requires at least 190 of them to be visited (**194** at the time of writing). For each: the lesson exists and runs from the opening to the summary; the «🎓 Guided lesson» button is there; if the section has tabs (**99**), the chapters are one per tab plus opening, summary and the check if any. At least 60 lessons must have a check question (**79** at the time of writing). No JavaScript errors |
| The player, at 390 and 1280 px | On 〰️ Waves and optics: the button opens the lesson from the opening; floating buttons go from visible to hidden; at the first slider the value really changes (at least four different values in 4.5 s) and the spotlight is on; skipping ahead half-way the slider returns to its starting value; a select goes through at least two options and returns to the starting one; the check shows the right answer and an explanation longer than 20 characters; the summary lists the chapters; nothing overflows; on closing the panel disappears, the `bsiLZ-aperto` class is removed and the floating buttons are visible again; `BSISpectraLive.comando('fammi lezione')` answers and starts the lesson; no JavaScript errors |

Still outside: the lesson's voice (there is no speech synthesis in headless
Chromium) and the teaching quality of the texts, which depends on the sections'
explanations and has to be judged by reading.

**`test_spectra_studio` — 79 checks (85 with the rigged body present
locally).** It tests embodied Spectra
(`spectra-studio.html`, `bsi-spectra-corpo.js`, `bsi-spectra-voce.js`,
`bsi-spectra-studio-lezioni.js`; design in
[`docs/spectra/02`](../spectra/02-Architettura.md)).

| Part | What it requires |
|---|---|
| Computations (23) | Runs `verifiche/verifica-studio-spectra.js`, also standalone with `node`: fall from 20 m in √(2h/g) = 2.0193 s for both spheres, range 12.116 m, with air (k = 0.02 m⁻¹) the thrown one lands later (2.1789 vs 2.1563 s), halved step changing the time by less than 10⁻⁴; VSEPR: tetrahedron 109.471°, trigonal 120°, linear 180°, water 104.40° with w = 1.25 (calibrated), ammonia 106.69° with the same w (prediction), angle decreasing as w grows; Basel: S(100 000) within the tail of π²/6, tail between 1/(N+1) and 1/N for N = 10, 100, 1000, Fourier series of x² at π and at 1, harmonic series as ln N + γ, coprimes → 6/π² within 3σ; for each lesson exactly one right answer, every option explained, at least three proof steps, exercises on four levels |
| Body (11) | On the mannequin: bones 22/23 (no jaw), blendshapes 14/14, hair found and turned black (RGB 0.039 0.039 0.047); arms down from the T-pose; pointing (forearm on the target, 1.7° off); thinking (hand 20.8 cm from the head); gaze to the right; walking (0.96 m, legs at 24°); sitting (hips down 42 cm); joy → smile, worry → mouth corners down and smile at zero; lip sync from audio (jaw 0.75); blink (eyelids closed) |
| Voice (3) | In an offline audio context: at 80 Hz the bass comes out boosted (6.9 dB), the reverb leaves a tail after the sound ends; without a key `qualita()` is `'sistema'` |
| Lessons, at 1280 and 390 px | The «Noir» face resting on the neck (on the mannequin the chin is 1.0 cm above the head bone; on the rigged body the reference is the neck bone plus 4.5 cm, where the chin rests on the collar); for fall, water and Basel the measurements in the scene (2.019 s, 109.47° and 104.4°, S₁₀₀₀ = 1.64393 and coprimes 0.6079), four predictions, formulas in the proof, the reveal with the right answer and four exercises of which one recommended, the memory remembering the prediction and the exercise opened; at 390 px nothing overflows; no JavaScript errors |
| Rigged body, at 1280 and 390 px (3 + 3) | Only if `models/spectra-corpo.glb` is present locally. **Face–hood sync**: while Spectra walks, makes the «spiega» gesture and looks at 24 different points, the face position measured in the head bone's frame moves by no more than 1 mm (measured 0.0 mm); **of the «Noir» model only the face is visible** (only `Object_2`, `Object_3`, `Object_4` are visible: mask, eyes, details); the face is **«solidale»** (head movement is done by the body, and the face does not do its own breathing inside the hood) |
| Body from the device, at 1280 and 390 px (3 + 3) | The «🧍 Corpo» button is there and its file input accepts `.glb` (`.glb,model/gltf-binary`); a body written to and read back from IndexedDB (`bsi-spectra-modelli`) comes back identical (round trip); a file that is not a model is rejected with a message, without JavaScript errors |
| Voice and data (2) | The muted voice stays muted after a reload; «Clear data → Persistent memory» removes `bsi-spectra-studio-v1` and `bsi-spectra-studio-voce` |
| Without WebGL | No scene, but the lesson gives the measurements (2.019 s); no JavaScript errors |

Still outside: the «Bounty Hunter» body in the public battery, because
`models/spectra-corpo.glb` is not in the repository (it comes from CGTrader,
and the Royalty Free licence does not allow third parties to be able to
retrieve the file): without the file
the six rigged-body checks are skipped and the bench tests the mannequin;
loading the «cyberpunk» model (`models/spectra-cyberpunk.glb`, also outside
the repository); the call to OpenAI and listening to the voice (the bench does
not reach OpenAI and does not listen); the visual quality of the body and
gestures, which has to be judged by looking.

**`test_spectra_rig` — 30 checks.** It tests the automatic rig
(`bsi-spectra-rig.js`), which gives a skeleton, skin weights and the app's
colours to a humanoid figure without bones. The real model is not in the
repository, so the bench builds in code a **synthetic humanoid in A-pose**, a
single mesh: torso, arms and legs as continuous tubes, a head with a hood. The
hard case is deliberate: the hanging hand is a few centimetres from the flank,
and as the crow flies the flank is closer to the arm bones than to the torso's.

| Part | What it requires |
|---|---|
| Skeleton (5) | Rig built in under 3 s; **27 bones** (20 weighted and 7 tips); Mixamo names (`Hips`, `Spine2`, `Neck`, `Head`, `LeftArm`, `RightForeArm`…); the body driver recognises them (at least 20 of 23) and can make it walk |
| Weights (5) | Weights sum to 1 on every vertex; the hand's vertices go to the hand and the forearm; **the torso flank next to the hanging hand gets no arm weight at all** (the defect that tore the torso when an arm was raised); a leg never takes weight from the other leg's bones; the left leg goes to its own bones (over 99 %) |
| Movement (3) | In the «spiega» gesture the hand moves (half a metre) and the flank stays still (1 mm); walking moves the body |
| Head and hood (8) | Without a head the triangles above the neck are removed; with the hood fewer are removed, because the back of the head stays; with the head none; **with the face only, no triangle is removed**: the opening is an ellipse computed per pixel in the shader, on the rest pose, so it follows the head; with the `visiera: false` option (available, not used by the studio, which keeps the glossy black visor) the helmet under the hood becomes matte shadow without removing vertices; through the opening the inside of the helmet is visible (double side), not empty space; the hood is rigid with the head bone (all its vertices) |
| Colours (5) | Mid grey becomes night blue; shadows stay almost black; highlights stay light, slightly blue; turquoise becomes teal emissive light `#00c9b7` (0, 201, 183); grey emits no light |
| Definition (3) | With Phong tessellation (`suddividi: 1`) every triangle becomes four; the weights stay normalised on the new vertices too; the skin stays closed: open border edges only double (each border edge becomes two), no seam opens |
| Errors (1) | No JavaScript errors |

Still outside: the real model (`models/spectra-corpo.glb`), which is not in the
repository; the visual quality of the folds (elbows, knees, armpits) and of the
hood, which has to be judged by looking.

**`test_controllaagg` — 12 checks.** It comes from a report: «trying to update,
nothing comes up». It was true. The 🔄 Updates window looked in `sw.js` for a
`CACHE_VERSION` line that no longer exists (`sw.js` declares
`var CACHE = 'bsi-vNNN'`) and looked for it on `raw.githubusercontent.com`: the
published version was never read. `test_aggiorna` opened the window but did not
press «Check», which is why the defect survived. The new bench presses the
button in three cases, obtained by intercepting only the check request
(`sw.js?controllo=`):

| Case | How it is produced | Expected answer |
|---|---|---|
| Same version | `sw.js` served as is | «You already have the latest published version», with the number; no «Update now» |
| New version | `sw.js` served with a higher cache name (v999) | «New version available» with both versions, and «Update now» |
| Site unreachable | request aborted, and the GitHub fallback too | «Cannot check now» |

In the same three cases it tests `BSIAggiorna.controlla()` (`'aggiornata'`,
`'nuova'`, `'offline'`), its pop-up notice and, in the second, that it asks the
service worker to update.

**`test_fluidita` — 15 checks.** It measures how long the page stays *blocked*
at every section switch, across all 91. It found three defects no other bench
could see: the "3D PRO Viewer" froze the page for **797 ms** on the first click
— the profiler attributes them to 3Dmol's first `render()`, which compiles the
WebGL context's shaders; the **296 figures** in "Synthesis" (5,351 SVG nodes)
were all drawn before anything was shown, while three are visible on opening;
and **296 timers 40 ms apart** were scheduled when that section opened —
eleven and a half seconds of wake-ups, each calling `getTotalLength()` on every
stroke of every figure, including those off screen.

After the fixes: median switch **16 ms**, worst **87 ms**, **no section above
100 ms** (there were two, the worst at 1,166 ms).

At version `bsi-v188` the same bench caught two things. First: with 263 drugs
instead of 233, «Pharmacology» blocked the page for **159 ms** and the count of
sections over 100 ms went back to **three** — the battery had passed by a hair
the time before, and a limit exceeded intermittently protects nothing. The cards
are now drawn in 8 ms slices: **55 ms**, zero sections over 100.

Second concerns the bench itself. The viewer threshold was **80 ms absolute**;
with the same published code, on different containers, the same click measured
14, 22, 98, 105 and 192 ms, because WebGL here is **SwiftShader** and the cost is
shader compilation. Such a threshold measures the machine: it fails on identical
code and would pass on worsened code. Even a **ratio** against a calibration
taken in the same run does not hold — by the time the bench reaches the viewer
WebGL is already warm (2.9 ms) while the viewer pays the cold cost: the ratio
swung between 14× and 36×. The claim became **structural**, which is also the
original defect: immediately after the click handler returns the WebGL context
**must not exist**, shortly after it **must**. Measured 0 and 1; and the
measurement is not vacuous, because on a second click — when the canvas is
already there — it returns 1.

**`test_lingue` — 64 checks.** It watches two new features and two different
ways of lying without noticing.

*The language.* A switch that "translates the application" is easy to write and
hard to keep honest: someone changes an Italian label and its translation is no
longer found. The defect is invisible — the label stays Italian in the middle of
English — unless someone counts. The bench counts: **160 skeleton elements, 160
translated, none left**. It also demands the two opposite proofs: that switching
to English **actually changes** the text (an empty dictionary would pass
"everything translated" without moving a letter) and that switching back to
Italian restores it **character for character**.

*The molecular languages.* Conversions are checked against external facts —
seven literature InChI keys **written inside the bench** — and the full
SMILES → molfile → SMILES round-trip is required. Formulas are counted by hand.

*The IUPAC namer.* 26 names written by hand in two languages, and seven
molecules that **must be refused**: a namer that never refuses is a namer that
invents.

Tested in both directions: restoring the `trim()` that breaks molfiles and
removing one translation makes the bench fail three checks out of twenty.

*The doors.* Since v184 the bench also checks that the two features are
**reachable**: a navigation button, a section that really draws, and — a check
born from a real defect — that neither shows the "🚧 Section under
construction" placeholder that the empty-section fallback stamps 800 ms after a
click into any section left empty. It also checks that the ✨ menu entry
**navigates** to the section rather than opening an overlay window, and that no
duplicate id exists with both sections drawn.

*The six languages.* For each one two things are demanded together: full
skeleton coverage (**162 of 162**) and that the text **really changes** — an
empty dictionary would pass "everything translated" without moving a letter.

**`test_mol3d` — 46 checks.** It watches the molecule-formation animation and
the bond-angle measurement, two additions with two different ways of looking
right without being right.

*The animation.* "It is there" or "it is not" cannot be seen by inspecting the
code: a loop that spins and redraws the same thing passes any check on the
function's existence. The bench looks at the **pixels**: at 130 ms the canvas
must be nearly empty — dust — and at 2.3 s there must be a molecule. Measured:
**532 lit pixels → 2,334**. If the two numbers were equal there would be no
animation, however the program is written. It also checks that the loop
**stops** when stopped: a removed canvas with the loop still running is a drain
paid in battery.

*The angles.* A number with a "°" next to it looks like a measurement. They are
checked on hand-built geometries whose value is known **by construction**, not
taken from a table: regular tetrahedron **109.4712°**, water 104.47°, CO₂ 180°,
BF₃ 120°, ammonia 106.13°. Tolerance 0.05°.

*The refusal.* On a **flat** structure (z = 0) the angles button must be
disabled and the reason written: on 2D coordinates a bond angle is not a bond
angle, and showing it would be the worse of the two errors because it looks
like data. Tested both ways: a structure with z ≠ 0 must not be mistaken for
flat, or no angle would ever be shown.

The first draft of this bench read the control bar **after** stopping the loop,
which removes it: it found zero buttons and then declared "each has an
accessible name" over an empty set. A check that passes because it has nothing
to look at is exactly the defect this project chases; the check now demands two
buttons **and** two names.

*The selection.* The viewer chooses the angle by clicking atoms: one shows all
the angles at that atom, two the bond length, three the angle with the vertex at
the second click, four the **dihedral**. The bench checks all four cases on
ethanol — C–C 1.509 Å, C–C–O 111.9°, H–C–C–O 60.7° — and demands that two
**unbonded** atoms be declared as such rather than passed off as a bond: a
distance is not a bond.

*The dihedrals.* Checked on four hand-built conformations: eclipsed 0°, gauche
60°, orthogonal 90°, anti 180°. Here too the hand-written table corrected an
error of mine, not of the program: with the coordinates I had chosen the
dihedral is 120°, not 60°, because looking along the central bond the projected
vector sits at (−0.5, 0.866).

*The arrival order.* "Skeleton first, hydrogens after" is a **measurable**
property, not an intention: the bench reads each atom's progress halfway through
the formation and requires every heavy atom to be ahead of every hydrogen. That
check found a real defect: the elastic function that produces the bounce is not
monotonic, and using it as the progress too meant an atom that started earlier
could look "less arrived" than one that started later. The two quantities are
now separate — the progress is monotonic, the elastic factor only does the
bounce — and the bounce, previously clipped away, is visible.

Half the checks are the *opposite proofs*, because a page that builds nothing
is instantaneous: the WebGL canvas must appear anyway, all 296 figures must
exist shortly after, no frame may stay empty, printing must not come out mute,
and the search must filter even cards whose figure is not yet born. And the
bench counts the sections it traversed: on ten instead of 89 the timings would
be excellent and the measurement worthless.

### 3.5 Security and accessibility

| Bench | Verifies |
|---|---|
| `verifica-sicurezza` | API keys in tracked files, clear-text passwords, secrets in `wrangler.toml`, telemetry, scripts from external domains |
| `audit_storia` | That no credential has EVER entered the repository: **1,551 distinct versions of text files** across **390 commits**, with 9 patterns. It refuses to pass on a shallow clone |
| `verifica-accessibilita` | WCAG AA contrast, accessible names, field labels, alternative text, heading hierarchy, `lang` attribute — across 13 pages |
| `audit_mobile` | That at **390 px** the page does not scroll horizontally, across all 194 sections — **and** that no section clips content into unreachability: an element wider than its section, with no scrolling ancestor, is text that is present and cannot be read. A wide table inside a scrolling container is not reported |
| `audit_rete` | That **no user data leaves the device**: a canary value seeded into 71 stores, the app used across 6 pages and 194 sections, the URL, headers and body of every request inspected |
| `audit_copertura` | How many bytes of JavaScript are **actually executed** while walking the application: 49.89 %, recorded and defended |

**`audit_storia` — 6 checks.** `verifica-sicurezza` examines *tracked* files,
i.e. the present state: it answers "there is no key in the repository today",
not the question that matters for a public repository. A key added in one
commit and removed in the next passes `verifica-sicurezza` forever and stays
readable to anyone who clones, because git does not forget. If that happens,
the remedy is not a fix-up commit: it is revoking the key.

This bench examines every *version* of every text file ever committed. Result:
**zero credentials across 1,551 versions and 390 commits**.

Two defences against itself, because here a perfect number can come from less
surface or from a blind pattern:

- **The clone must not be shallow.** A `--depth 1` holds a fraction of the
  history: the bench would run, find nothing, and claim "no credential anywhere
  in history" having seen a tenth of it. If it finds `.git/shallow` it fails and
  names the command to run.
- **The patterns are tested before being trusted.** A wrong pattern finds
  nothing and is indistinguishable from a clean repository: each of the 9 must
  match a crafted example and must *reject* a near-miss, and both are tested
  inside a tail of noise containing digits, as a real file would have.

The second defence was born from a defect in this very bench. The AWS pattern
required a digit via `(?=.*\d)` — always satisfied in a large file, because the
digit lies further ahead: it found 53 matches, all the same string
`AKIAAAAAAAAAAAAAAAAA`, sixteen "A"s, the zero region of a base64 image. The
near-miss did not catch it because it was too short to contain digits. An AWS
identifier is now judged by the *variety* of its sixteen characters, and the
near-misses carry their tail.

Tested in the other direction too: with a local commit containing a
well-formed AWS key the bench fails naming the blob; once the commit is
removed, it passes again.

> **The obstacle belonged to the tool, not to the problem.** For three versions
> code coverage was declared unmeasurable, with this reason: "instrumenting
> would require introducing a build, which the application does not have". That
> was true of `c8` and `istanbul`, which rewrite the source before running it.
> But **Chromium collects it by itself**, inside the engine, without touching a
> byte of the file served: `Profiler.startPreciseCoverage`, which Playwright
> exposes as `page.coverage.startJSCoverage()`. No build was needed: what was
> needed was noticing that the constraint belonged to the tools chosen.
>
> **The first result was 100 % on every file**, including 3.6 MB of
> `index.html`. That was the bench measuring nothing, in its most insidious
> form: a perfect number. V8 emits, for each function, an outer range with the
> number of entries, and inside it ranges with `count: 0` for what was not
> executed. Summing the positive ranges sums the whole file. One does the
> opposite: start from the total and subtract the union of the empty ranges.
>
> The real number is **49.89 %**, and it holds the same pact as the
> accessibility debt: recorded, and the bench fails if it falls. An absolute
> threshold ("80 %") would be an invented figure; "it must not get worse" is a
> promise that can be kept.

> **Why a canary and not a list of requests.** SEC-02 — "no personal data
> leaves the device" — was verified by checking the two *mechanisms* of exit:
> empty telemetry variable, no script from an external domain. That is real
> evidence but indirect: it says "I cannot see how it would leave", which is not
> "it did not leave". Looking instead at the list of hosts contacted would be
> just as weak, because it concludes from absence of evidence.
>
> The canary reverses the burden. An unrepeatable string is written into the
> user's own data — notes, chats, API keys, settings, progress — then the
> application is **used**, and every outgoing request is opened and read. If the
> string appears nowhere, it is because it really did not leave.
>
> ```bash
> BSI_PROVA_FUGA=1 node tools/banchi/audit_rete.js   # must FAIL
> ```
>
> The bench carries its own proof of working: with that variable it causes a
> leak on purpose, towards a **declared** host — contacting it is legitimate,
> sending it the user's data is not. If it does not fail then, the instrument is
> the thing that is broken.

> **Why a bench on horizontal overflow.** UI-03 says "the app must work at
> 390 px", and the matrix gave it as verified by `audit_stabilita`, which in a
> phone viewport looks at **JavaScript errors**: a page can have not a single
> one and still run a hundred and sixty-three pixels off the screen. It was a
> requirement declared covered and not measured. The bench measures the
> document's `scrollWidth` — exactly what makes the scrollbar appear — and not
> any element wider than the screen, which inside a container built to scroll is
> correct and would fill the output with noise until nobody reads it any more.

> **What the accessibility check does not cover**, and it must be said: text
> inside SVGs (the colour comes from `fill`, the background is a drawn shape)
> and text on gradient backgrounds (they do not have *a* colour). The skipped
> elements are counted and reported, not hidden.

> **One section at a time.** The inspection skips elements that are not visible
> — and rightly so: a hidden element has no contrast to measure. But
> `index.html` alternates 194 sections and shows only one: out of **19,751** text
> elements the bench was looking at **41**, and printing "0 defects". It was not
> a false result, it was a result on a sample nobody had declared. The sections
> are now opened one by one, and **the number of sections traversed is
> printed**.
>
> That count earned its keep on the very first run: the first attempt traversed
> **zero** — Playwright's click waits for the element to be visible, and the
> buttons sit inside collapsed navigation groups — and the bench said so ("87
> sections present, none traversed") instead of printing another reassuring
> zero.

### 3.5-bis The accessibility debt, and the pact that it must not grow

Walking every section, **1,069** contrast defects surfaced. Today they are
**zero** — the list of causes and remedies is in `docs/09` §4 — and unlabelled
fields have fallen from 40 to **zero**.

The mechanism described below remains, and matters more than the number it
guards. Demanding zero *from the outset* would have left only two roads, both
bad: a verification red for ever, or one loosened until it turned green again.
The third road is to **declare the number** and forbid it from growing, whatever
it is. That is how 1,069 became zero: every step recorded, none of them
reversible in silence.

| File | Role |
|---|---|
| `docs/evidence/accessibilita-riferimento.json` | The recorded count |

| Situation | Bench outcome |
|---|---|
| The count **rises** | ✗ FAILED — it is a regression |
| The count **falls** | ✓ passes, and asks for the baseline to be updated |
| The count is **unchanged** | ✓ passes silently: debt declared, not grown — today that value is **0**, and the bench defends it |

```bash
node tools/verifica-accessibilita.js --aggiorna-riferimento
```

To be used **only after reducing** the defects, never to turn a regression
green. Even at zero this is not full WCAG conformance: text inside SVGs and text
over gradients stay outside, which automation cannot judge and which the bench
**counts and reports** on every run (`docs/09` D-09). It is the honest measure of
what can be measured, with the guarantee that it will not silently get worse.

### 3.6 Consistency

| Bench | Verifies |
|---|---|
| `verifica_guida` | That the documentation's promises exist in the code; absence of conflict markers across 58 files |
| `verifica-documenti` | Internal links, version alignment, index consistency, justification of the deviations, **internal consistency of the traceability matrix** (no duplicated identifiers, coverage totals equal to the identifiers actually defined) |
| `genera-pacchetti` | Rewrites the references of the extracted documents and **verifies that no link is left broken** in the three delivery packages. It also verifies that **no PDF is older than the document it comes from** and that the bundled verification report declares **this** version: a typeset document or an evidence report from the previous version, inside a current package, is a silent lie |
| `genera-pdf` | Converts the documents to PDF and fails if a file falls below the plausibility threshold (empty conversion) |
| `verifica-affermazioni` | Compares every number declared in the documents — sections, drugs, diseases, tumours, strategies, modules — with the one **measured in the running application**, in Italian *and* in English |
| `test_stack` | That the React/FastAPI stack runs **the same files** as the application: it compares the SHA-256 fingerprints `GET /salute` declares with those of the files on disk, checks the numbers match the browser's, and that **no `.ts`/`.tsx` file contains a shift table** — because that is where the second engine would be born |

> **Why numbers must be measured, not remembered.** The technical dossier opens
> with figures: "63 diseases (23 tumours)", "46 strategies", "25 modules". They
> are the first thing an assessor reads, and they are enough for everything else
> to be believed or doubted. Nobody was checking them: written once, they stayed
> put while the application changed. And indeed `chimorga.html` declared **"25
> modules"** at the top and **"17 modules"** further down — two statements about
> the same object, in the same file, one of them false.
>
> **A lesson paid for while writing the bench.** I had already concluded that
> "63 diseases" was an exaggeration: in the source I had found a `DISEASES`
> array with 12 entries, and I was about to "correct" the document. Measuring in
> the DOM I saw that the menu really does list 63 — the array I had found was a
> different, smaller one. **A count on the source is not a measurement: it is a
> clue.** That is why the bench opens the page, opens the section, and counts.
>
> It also checks that the documents agree **with one another**: two documents
> saying different things about the same object are a defect even when one of
> them is right. The English translation counts as one of those documents —
> `docs/en/05` had been left at "84 sections" while the app had 87, and had
> been stuck at version `bsi-v146` for three releases — and no bench saw it,
> because none looked at the English set.

> **Why a check on the matrix.** The matrix declared `SCI-10` twice — once as a
> requirement verified at 100 %, once as an explicitly **unverified** one — and
> the summary table added up to 36 requirements while 37 were defined in the
> document. Both errors sat in the number an assessor reads first. The bench now
> counts the identifiers actually present and fails if the totals written do not
> match: the proof that the check really measures something is that, with the
> two errors reintroduced one at a time, it reports both.

---

## 4. Notable test cases

Some benches deserve a mention because they verify properties a functional test
does not observe.

| Case | Method | Measured result |
|---|---|---|
| **Memory leaks** | 194 sections × 5 rounds, DOM nodes counted each round | +26,876 on the first round (construction), **+0** on the four that follow |
| **Exhausted storage** | `setItem` replaced with a function that always throws | 10 pages out of 10 stay operational |
| **Degraded ≠ absent network** | Requests held for 20 s, interception at context level | Answer from cache in **3,507 ms** (threshold 3,500) |
| **Spectrum reproducibility** | Drawn twice, compared byte for byte | Identical |
| **WebGL contexts** | Viewer constructions over 10 consecutive molecules | From **7 to 1** |
| **Corrupted history** | Two `Enter` presses 500 ms apart | `user,assistant` instead of `user,user,assistant,assistant` |
| **Text contrast** | WCAG formula on every element with text of its own, 13 pages **and 194 sections** | 19,751 elements examined (it was 41): **1,069** defects surfaced, **1,069 corrected**, **0 recorded** as a value that must not grow |
| **Immediate cancellation** | Stop pressed at 1.5 s, state sampled every second | Send button available from the **1st** second (it was the 10th) |

---

## 5. How to add a bench

### Minimal structure

```javascript
/* A comment explaining WHAT this bench demonstrates and why it is needed. */
const { chromium } = require('playwright-core');
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

(async () => {
  const b = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  // serviceWorkers:'block' if the bench modifies files: without it the SW
  // might serve a cached copy and the old file would be measured
  const ctx = await b.newContext({ serviceWorkers: 'block' });
  const pg = await ctx.newPage();
  const err = [];
  pg.on('pageerror', e => err.push(e.message));

  let ok = 0, ko = 0;
  const att = (d, atteso, avuto) => {
    if (String(atteso) === String(avuto)) { ok++; console.log('  ✓ ' + d + '  → ' + avuto); }
    else { ko++; console.log('  ✗ ' + d + '\n      expected: ' + atteso + '\n      got:      ' + avuto); }
  };

  await pg.goto('http://127.0.0.1:8899/index.html', { waitUntil: 'load', timeout: 60000 });
  await pg.waitForTimeout(2500);

  // … measurements …

  att('no JS error', 0, err.length);
  await b.close();
  console.log('\n' + (ko ? '✗ ' + ko + ' FAILED, ' : '') + ok + ' passed');
  process.exit(ko ? 1 : 0);   // the exit code is what counts
})();
```

The name is then added to the appropriate family in `tools/genera-evidenza.js`.

### The rule that matters

> **A bench that measures nothing passes.** It is the most insidious way to
> obtain a false guarantee: no alarm, no failure, and no verification.

Therefore **every bench that simulates a condition must count how many times the
simulation actually fired, and fail if that count is zero.**

Traps actually met while building the battery:

| Trap | How it showed itself |
|---|---|
| `page.route` does not intercept Service Worker requests (`context.route` is needed) | The "degraded network" test measured a healthy network and concluded in 16 ms instead of 3,500 |
| Probing exhausted `localStorage` with a one-byte write | After saturation one byte always finds room: the bench "passed" |
| Looking for `[data-tab]` where navigation uses `[data-s]` | Zero tabs found, therefore zero measurements — and zero failures |
| The ticks of an axis on `<canvas>` are not text | They must be collected by intercepting `fillText`; and the bottom-most line is the axis *title*, not a tick |
| A probe installed on a library loaded **afterwards** | It is replaced along with the library: zero calls counted while the code was working |
| A `var` inside an IIFE is not `window.something` | Assigning it from outside creates a different variable |

---

## 6. Coverage gaps

Declared. The coverage reported in
[`08-Traceability-Matrix.md`](08-Traceability-Matrix.md) measures **how many
requirements have a bench**, not how many lines of code are executed: they are
two different things and must not be confused.

| Gap | Current situation | Recommendation |
|---|---|---|
| **Code coverage** | Measured: **49.89 %** of statements over the widest path. What stays outside is whole-battery coverage and **branch** coverage: an `if` entered from one side only counts as covered | Extend collection to every bench, and move from statement coverage to branch coverage |
| **Accessibility** | Automated over 13 pages and all 194 sections: WCAG contrast, accessible names, labels, alternative text, heading hierarchy. Text inside SVGs and over gradients stay outside, and are **counted** on every run | Add `axe-core` alongside, for the rules this bench does not implement (ARIA roles, tab order, focus management) |
| **Security** | `verifica-sicurezza` runs 10 checks over 565 tracked files and covers SEC-01, SEC-03, SEC-05, SEC-06; SEC-04 is covered by `verifica_guida`. **SEC-02 remains indirect**: see `docs/09` D-03 | Observe the network traffic during real use, the only direct verification of SEC-02 |
| **Browsers other than Chromium** | No automatic test on Firefox or WebKit | Extend the main benches to `webkit`, where the differences on IndexedDB and Service Worker are greatest |
| **Performance** | Manual cross-device testing | Automatic measurement of first-paint time |
| **Visual regression** | Absent | Screenshot comparison for the charts, which are the heart of the product |
| **Spectra Live and quick tools** | Since v238 `test_spectra238` covers the console layout, the navigator, the level, the face and the creator commands; since v239 the single button, and `test_lezione` the guided lesson and «fammi lezione»; `test_spectra_studio` the body, the voice (without OpenAI) and Spectra Studio, `test_spectra_rig` the automatic rig on a synthetic humanoid. Still without a bench: the rest of the local commands, voice, the tools that act on the page and the per-subject ✨ menu (UI-21, AI-13). Speech recognition and synthesis do not exist in headless Chromium | Test the local commands as pure functions (`BSISpectraLive.comando`) and the quick tools in node, as is already done with the sections' computations |

---

## 7. Acceptance criteria

A version is not published if even one of these is unsatisfied.

- [ ] `node tools/genera-evidenza.js` closes with **0 failures**
- [ ] `tools/verifica-farmaci.js`: no defect, every deviation recorded with its reason
- [ ] `verifica_guida`: no promise in the documentation without a counterpart
- [ ] No non-network JavaScript error on any page
- [ ] Evidence report regenerated against the commit being published

---

_Document updated to version `bsi-v240`._
