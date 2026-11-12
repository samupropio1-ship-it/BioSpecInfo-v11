# Functional Specifications — BioSpecInfo

| Field | Value |
|-------|--------|
| **Software** | BioSpecInfo |
| **Version described** | `bsi-v252` |
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

The application has **204 sections**, grouped by area of study.

### 3.1 Spectroscopy

| Function | Description |
|---|---|
| **Spectroscopy centre** | A molecule is entered (SMILES, name, formula) and one obtains IR, ¹H/¹³C NMR, MS, UV-Vis, Raman, 2D and 3D structure, functional groups |
| **Visual IR spectra** | Characteristic bands by class of compound |
| **Mass spectrum** | Fragmentation patterns and diagnostic rules |
| **UV-Vis** | Chromophores, λmax, Woodward's rules |
| **Per-atom NMR prediction** | Draw or type a structure and get ¹H and ¹³C with WHICH atoms produce each signal; interrogable spectrum (zoom, intensity, click a peak), assignment table, SMILES/InChI history, CSV/JCAMP-DX/PNG exports |
| **Two-dimensional NMR** | COSY, edited HSQC and HMBC built by walking the graph; clicking a spot highlights the atoms producing it. It is not a simulation of the experiment, and the panel says so |
| **Open any file, and the program decides** | One entry point, with no extension filter: open what you have and the program **states what it decided the file is**. A document (PDF, photograph, Word, OpenDocument, PowerPoint, Excel, text) opens, **everything** it contains is shown (every page drawn, all the text), the recognised spectroscopic data appear in a table **with their provenance**, and the working proceeds step by step; a JCAMP-DX file or two columns of numbers become a measured spectrum; an image does both. Whatever could not be read is declared |
| **Header language switcher** | A round button top right, at the title's height, with the flag of the language in use; it opens into a disc with the fourteen flags on two shells and, at the centre, the language name and **how much it is translated, measured**. The actual switch stays in the languages module: this is only the way to call it |
| **Spectrum from a figure (digitisation)** | From a photograph of a chart recorder, a crop from a paper or the instrument screen, the trace is extracted from the **pixels**: the axis frame is recognised and only its inside is digitised, the line position is the **darkness-weighted centroid** (sub-pixel), the grid is worked around by continuity and darkness, both axes are calibrated linearly or logarithmically, %T is converted to absorbance with A = −log₁₀T. The chart, the peaks and the assignments appear by themselves and are redone at every change of the calibration; a diagnostics line says what was decided and why. CSV and JCAMP-DX outputs. Measured deviation: mean 2.2 cm⁻¹, worst 7.3 over seven constructed figures |
| **3D model from the drawn structure** | Coordinates built from the graph, carrying the predictor's own indices: a clicked peak lights up the atom in three dimensions too |
| **⚛️ Physics: eight computed sections** | **Schrödinger laboratory** (stationary states of wells, oscillators, Morse and double well; wave packet and tunnelling with Crank-Nicolson; vibrations of HCl, H₂, CO, N₂ in cm⁻¹ compared with experiment); **live Hartree-Fock** (RHF/STO-3G in the browser, eight molecules, orbitals drawn, dissociation curves); **rovibrational spectroscopy** (P and R branches with temperature and isotopes, Raman with spin statistics, bond length from the lines); **statistical thermodynamics** (partition functions, S° and Cp against NIST-JANAF, populations); live Lennard-Jones **molecular dynamics**; **mathematics for chemistry** (FID → spectrum by FFT, Hückel, kinetics by Runge-Kutta, Arrhenius least squares); **crystallography** (14 Bravais lattices, Miller indices, powder pattern with absences); **radiochemistry** (Bateman, dating, Weizsäcker). Every number is checked by `test_fisica` against the literature |
| **📐 Mathematics: eight sections on a symbolic engine** | A computer-algebra engine written for the app (`bsi-mat-cas.js`: exact fractions, canonical form, rule-based derivatives, antiderivatives verified by differentiating them, Taylor series by truncated power-series arithmetic, limits) underpinning: **basics** (significant figures and measurement rules, logarithms and pH, equations from linear to polynomial and the fractional ones of equilibrium, practice with marking); **function analysis** (domain, zeros, extrema, inflections, asymptotes, tangent; families and transformations); **derivatives, integrals and series** (rules used, Riemann, adaptive Simpson, Taylor, left and right limits); **linear algebra** in exact fractions with Gauss-Jordan steps, eigenvalues, plane transformations and reaction balancing as a null space; **differential equations** (direction field, order of methods, phase plane with equilibria classified from the Jacobian); **several variables** (3D surfaces, critical points, Maxwell relations, exact differentials); **complex numbers and Fourier**; **laboratory statistics** (t, F, Grubbs, Dixon, uncertainty propagation, calibration line with LOD/LOQ) |
| **🎓 UniBA exams and advanced physical chemistry** | **Mathematics exam**: Istituzioni di Matematiche I and II syllabi explained, step-by-step solver for 16 exercise types, 16 solved papers (64 exercises), timed simulation. **Physics exam**: General Physics I and II syllabi, 48 standard problems solved with the user's data (laws, substitutions, units), 12 solved papers. **Electrodes and transition state** (Butler-Volmer, Tafel, Eyring) and **photochemistry, surfaces and polymers** (Jablonski, Stern-Volmer, Langmuir/Freundlich/BET, Mn/Mw, Carothers). **Chemistry exam** (🔬 category): 40 standard problems on four levels — basic (General and Inorganic), intermediate (Analytical), advanced (Physical Chemistry), expert (Sackur-Tetrode, Debye-Hückel, Pourbaix) — and 7 solved papers. Mathematics and Physics also gain an **advanced and expert** level (eigenvalues, ODE systems, Fourier, Laplace, triple integrals; driven oscillations, waves, Doppler, photoelectric, Compton, relativity, blackbody, particle in a box, tunnelling). The traces are built on the syllabi, they are not the official papers |
| **🧭 From high school to PhD** | A map of chemistry, physics and mathematics on four levels (high school, bachelor’s, master’s, PhD) with links to the tools. New solvers: **astrophysics** (10 models), **nuclear physics** (9), **quantum physics** (11, with variational and perturbation methods), **organic chemistry, spectroscopy and biochemistry** (10), **PhD** (Marcus, isotope effect, Wigner; residues, heat equation) |
| **🔐 🕸️ ♾️ 🎢 🍩 🔣 ♟️ 🧠 📊 🌐 Mathematics: deeper topics** | **Numbers and cryptography** (sieve, Euclid and Bézout, modular clock, real RSA, π(x) against Li(x)); **Graphs and optimisation** (Dijkstra, Kruskal, gradient descent, linear programming); **Sequences and series** (ε–N limit, convergence tests, rearrangement, radius of convergence); **Calculus of variations** (brachistochrone, catenary, catenoid, Fermat); **Topology** (V − E + F, surfaces and orientability, fundamental polygons, knots and colourings); **Algebraic structures** (dihedral groups, permutations, rings and finite fields, Lagrange); **Game theory** (Nash equilibria, iterated dilemma and replicator, tic-tac-toe with minimax, Nim); **Logic and computability** (truth tables and normal forms, adder circuits, Turing machine, sets); **Statistical inference** (confidence intervals, tests and power, regression with Anscombe's quartet, bootstrap); **Non-Euclidean geometries** (sphere and Girard, Poincaré disk and tilings, curvature and parallel transport) |
| **🪐 🔥 🧲 ⚛️ 🎡 🔦 🌍 Physics: deeper topics** | **Gravitation** (N bodies, Lagrange points, slingshot); **Heat and diffusion**; **Ising model**; **Particles** (Standard Model, conservation laws, Z invariant mass, muon lifetimes); **Analytical mechanics** (phase space and elliptic integral, chaotic double pendulum, bead on a hoop and Noether, Liouville); **Lasers and quantum optics** (rate equations and threshold, cavity modes and mode locking, Rabi and Bloch, photons in a Mach–Zehnder); **Climate physics** (radiative balance and layers, CO₂ forcing, ice–albedo with hysteresis, Coriolis) |
| **🧊 🏔️ Physical chemistry: deeper topics** | **Phase diagrams** (water and CO₂ with the IAPWS and Span–Wagner curves, eutectic and lever rule, Clapeyron and Gibbs); **Potential energy surface** (LEPS for H + H₂, trajectories, reaction path, Polanyi) |
| **🧪 ⚛️ 📐 Subjects and Articles** | Two buttons above Spectra and ✨ switch subject: the bar shows only the chemistry, physics or mathematics groups, plus Study and Utility. The **Articles** section has the same two tabs for all three subjects: latest articles (Crossref) and prizes with a topic explanation — Nobel in Chemistry and in Physics, Abel Prize and Fields Medal for mathematics (Wikidata) |
| **🔭 Astrophysics: a group of twelve sections** | The bar's **🔭 Astrophysics** group gathers 🔭 Astrophysics and 🪐 Gravitation (previously in the physics group) and ten 3D sections: **Solar system 3D** (positions at any date from Standish's JPL Keplerian elements, valid 1800–2050; Earth, Moon and eclipses with Meeus's truncated theory; Jupiter and Saturn); **Orbital mechanics 3D** (elements ↔ state, Hohmann and bi-elliptic manoeuvres, Earth satellites, Lambert and porkchop); **Celestial mathematics** (Kepler's equation with three methods, celestial sphere and quaternions, N-body integrators, Lomb–Scargle and BLS periodograms); **Life of stars 3D** (a star in cross-section, Lane–Emden, evolution, nucleosynthesis); **Black holes and general relativity** (Schwarzschild ray tracing in the shader, geodesics, curvature, deflection and GPS, Hawking radiation); **Gravitational waves** (inspiral, chirp, detector, Hulse–Taylor pulsar); **Galaxies 3D** (Hubble types, rotation curves, collision, Local Group); **Cosmology 3D** (Friedmann–Lemaître expansion, distances, CMB, thermal history); **Planetarium 3D** (about 170 stars and 28 constellations from any place and time, coordinates, precession, analemma); **Exoplanets 3D** (habitable zone, transit, radial velocity, direct imaging and population) |
| **🌀 🎲 ☢️ 🧱 🔌 Physics: five laboratories** | **Spin, qubits and entanglement** (Stern–Gerlach, Bloch sphere, Bell and CHSH, BB84); **Statistical mechanics** (levels and the Schottky anomaly, Maxwell–Boltzmann, Fermi and Bose, Einstein and Debye solids); **Nuclei and reactions** (valley of stability, Q values, barrier and tunnelling, 3D nucleus, reactor); **Elasticity and materials** (tension test, beams, Euler buckling, sound in solids); **Electronics** (rectifiers, diodes and Zener, common emitter, op-amps, ADC, DAC and counters) |
| **🌊 🌀 🔗 🧩 📡 Mathematics: five laboratories** | **Partial differential equations** (string, 3D membrane, heat in 1D and 2D, 3D Laplace, transport and Burgers); **Complex analysis** (domain colouring, 3D landscape of \|f\|, conformal maps, Joukowski, residues, real integrals); **Markov chains and stochastic processes** (chain, PageRank, gambler's ruin, walks in 1, 2 and 3 dimensions, Poisson and queues); **SVD and applied linear algebra** (2×2 and 3×3 SVD, image compression, 3D PCA, least squares); **Codes and elliptic curves** (Hamming(7,4), CRC and check digits, curves over ℝ and over F_p, ECDH) |
| **🧪 ⚛️ 📐 Three apps in one** | The chosen subject also decides the **✨ menu**, **Spectra**, **Study** and **Utility** (`bsi-materie-app.js`). In physics and mathematics the ✨ menu's chemistry block gives way to the **quick tools** (`bsi-attrezzi.js`), opened in a window above the page: 🧮 exact calculator, ∂ derivative and ∫ antiderivative, 📈 graph, 🔢 CODATA constant, 🔁 unit converter, 📐 formula, 📖 glossary and ⚡ lightning quiz taken from the subject's study kit. Spectra receives the subject's system instruction, suggestions and greeting |
| **🧊 3D tabs in the sections (v238)** | Twenty-nine sections (4 chemistry, 15 physics, 10 mathematics) have, after their other tabs, a 3D tab built on the section's model: LEPS surface with the trajectory, P–V–T surface with the dome, molecular collisions in a box, equilibrium molecule by molecule, unit cells with Miller planes, the \|ψ\|² cloud, RHF orbitals, a molecule rotating and vibrating, a Lennard-Jones fluid, a launch with wind, fields and the Lorentz force, a ripple tank, a potential well with the Lagrange points, the light cone, flow past an obstacle, the p-V-T surface, the Brillouin zone, 3D Ising, a particle detector; tangent plane, field and divergence, solids of revolution, space transformations, chaos in phase space, the bivariate normal, surfaces with χ and orientability, sphere and hyperboloid, Riemann sphere, soap film. Text and controls are built on click, the scene right after. Every tab has a verification script (`15-Test-Documentation.md` §3.1-ter). Canvases without a name take the tab's and the section's |
| **🎓 Guided lesson in every section (v239)** | Under the title of every section the «🎓 Guided lesson with Spectra» button starts a lesson in chapters built from the section itself (`bsi-lezione.js`): an opening with title and subtitle; one chapter per tab, in which the tab opens, the explanation is read in pieces, canvases and 3D scenes are highlighted, every slider runs from minimum to maximum and returns where it was, every select goes through its options and returns as it was; a check question from the subject's study kit with the explanation after the answer; a summary. Sections without tabs are read by headings and paragraphs. The player sits on the right on a large screen (the page shifts left) and at the bottom on a phone; it has ◀ ▶, pause, Spectra's voice and a spotlight that dims the rest of the page. During the lesson the floating buttons are hidden. At the time of writing: 194 sections with a lesson, 99 with tabs, 79 with a check question |
| **🌌 Spectra Studio (v239)** | A page of its own (`spectra-studio.html`), opened from the console's 🧭 navigator: a 3D laboratory with Spectra standing next to a holographic bench. Three lessons with the predict → test → prove → reveal method: 🪂 the fall (dropped or thrown, they land together: 2.019 s from 20 m, range 12.12 m), 💧 the shape of water (VSEPR as an energy minimum: tetrahedron 109.47°, water 104.4°, ammonia predicted 106.7°), ∑ the Basel problem (partial sums, tail, Fourier series of x², coprimes → 6/π²). Every option is explained; exercises on four levels with the one recommended by the memory of predictions (`bsi-spectra-studio-v1`). The body is the one chosen by the author, **always present** (since v241 embedded in the app, `models/spectra-corpo.bsi`), rigged, with the «Noir» face on the collar; while it arrives «Spectra sta arrivando…», no substitute; the voice is turned off with 🔊/🔇 and the choice is remembered; the panel holds all the text and the lesson can be followed without WebGL too. Design in [`docs/spectra/`](../spectra/01-Analisi-modello-e-piano.md) |
| **🎲 🎞️ ⚡ 🔊 💡 🌡️ 🔋 Explorations** | **Probability in motion** (Galton, central limit, Monte Carlo, Bayes); **Visual mathematics** (animated linear maps, Fourier epicycles including from a hand drawing, Mandelbrot and Julia with zoom, logistic map and bifurcations); **Electromagnetism in motion** (draggable charges with equipotentials and field lines, induction, generator, EM waves and polarisation); **Sound and acoustics** with audio (harmonics, timbre, beats, Doppler and Mach cone, decibels); **Semiconductors** (Fermi-Dirac, n_i, doping, p-n junction, LEDs); **Distillation** (T-x-y with Antoine and van Laar, azeotrope, McCabe-Thiele, Rayleigh); simulated **Cyclic voltammetry** (diffusion and Butler-Volmer, Randles-Ševčík, scan-rate analysis) |
| **🔭 ⏱️ 🌊 ∇ 🌀 Astrophysics, relativity, fluids, vector calculus, complex kinetics** | **Astrophysics**: H-R diagram with real stars and the main sequence by mass, black body and star colours, animated solar system with Kepler and Hohmann, exoplanet transits with light curve and radial velocity, Friedmann cosmology with the age of the universe and receding galaxies. **Special relativity**: Minkowski, twins, dynamics and Doppler. **Fluids**: Venturi, Poiseuille, Reynolds, Stokes and centrifuges, capillarity. **Vector calculus**: fields with particles, divergence and curl, potential, Green's theorem verified, gradient. **Complex kinetics**: consecutive, parallel and reversible reactions, Brusselator and Hopf bifurcation, Turing patterns. Every animation in the app has pause, restart and speed, stops off-screen and honours «reduce motion» |
| **🎯 〰️ 🔌 🔥 🧮 📐 ⚖️ Laboratories in motion** | Seven sections: **Mechanics in motion** (projectile with air drag and optimal angle, collisions with a coefficient of restitution, the real pendulum with its phase space, coupled oscillators and normal modes); **Waves and optics** (beats, standing waves, group velocity; lenses and mirrors with principal rays; N-slit diffraction in the colour of light); **Circuits** (RC, RL, RLC transients with the three regimes; alternating current with phasors and resonance; filters with the Bode plot); **Thermodynamics in motion** (Carnot, Otto, Diesel and Stirling cycles in the p-V and T-S planes with balances; a gas of particles reaching Maxwell-Boltzmann; Brownian motion); **Numerical methods** (roots, integration, ODEs, interpolation, with measured convergence orders); **Analytic geometry and vectors** (vectors and lines and planes in 3D, conics with the invariants); **Equilibrium and Le Chatelier** (a reaction shifting when disturbed, K as a function of T) |
| **🧊 3D Laboratory and animated charts** | New section in the Physics category: **surfaces** z = f(x, y) with contour lines and critical points, hydrogen-like **orbitals** as a |ψ|² cloud coloured by sign (n ≤ 4, Z from 1 to 6, cut to see the nodes), **motion in space** (helix of a charge in B, inclined Kepler orbit, Lorenz attractor, parametric curve), real **crystal structures** with cell content, coordination, packing and Miller planes with the Bragg angle, **field lines** of charges and of a loop. Rotate with finger or mouse, zoom with two fingers or the wheel, auto-rotate, PNG snapshot, full screen. Every chart in the sections enters with an animation, glides to new values and shows a **crosshair** with the values; molecular 3D views have adjustable quality (ambient occlusion) and a control bar |
| **⚗️ ⚛️ 📐 The three macro-areas** | At the head of the Chemistry, Physics and Mathematics categories. Each has an **assistant** to which you write the problem in natural language (English too): it recognises the kind of exercise or the model, reads numbers with units, formulas, reactions and lists, says what it understood and where each datum comes from, also solves the **inverse problem** and shows the working; the **catalogue** of every tool of the subject with search; the **levels** from high school to PhD. Spectra has the same solvers as tools |
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

`verifica-accessibilita` walks the 194 sections and measures what is **visible**.
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
| **Physics and mathematics study kits** | Five sections per subject (`bsi-studio.js`): 🗺️ summaries with «mark as studied» and progress; ❓ quizzes by topic and level, with shuffled answers, review of mistakes and history; 🃏 flashcards with the five-box Leitner method; 📐 formula sheet; 📖 glossary. Physics: 69 summaries, 325 questions, 273 flashcards, 227 formulas, 273 entries. Mathematics: 66 summaries, 346 questions, 266 flashcards, 224 formulas, 279 entries |
| **Resources and bibliography** | For physics, mathematics and chemistry (`bsi-risorse-materie.js`): web resources by category, a bibliography by level with no years or ISBNs (search links are computed from title and author), citations from a DOI read live from Crossref in APA 7, IEEE, ISO 690 and BibTeX; without network, a form to fill in by hand |
| **🔢 Constants and units**, **📚 Mathematical tables** | CODATA 2018 constants with the exact SI ones marked; a converter that checks dimensions. Tables of derivatives, integrals, series, identities, Laplace and Fourier transforms and constants: every numeric entry carries a proof function that the bench runs |

### 3.8 The "Spectra" assistant

An AI agent with **51 tools** that can interrogate the application itself:
compute descriptors, generate spectra, look up constants, balance reactions,
open sections, read the open tab and act on its controls. It supports ten
providers, and stays usable when one of them fails (§5.2).

**Spectra Live** (`bsi-spectra-live.js`) is its full-screen voice console:
hands-free conversation with the browser's speech recognition and synthesis,
local commands that work without network and without a key (open sections,
switch subject, compute, differentiate, convert, look up constants and
definitions, plot, quiz, move sliders, change tab), and the screen context
added to the questions that go to the model. In the console Spectra has the
**face** of the «Noir» android (model by Skyfox13, CC BY 4.0), with a mouth
that follows the spoken text and 17 emotions; and a **mind**
(`bsi-spectra-mente.js`) that locally remembers episodes and study time and
keeps an internal state of five quantities. It is a simulation of behaviour,
not consciousness: see [`05-AI-Agent-Architecture.md`](05-AI-Agent-Architecture.md)
§4.10–4.12.

The console is the main entry point. Since v239 Spectra has **a single
button**, the face in a circle, present on every screen in place of the
«Spectra» pill: it opens the console, and from the console 💬 opens the chat.
The circle shows a drawn face at once and, once the page has loaded, the
portrait. On a
full-screen phone it respects the margins of the status bar and of Android's
keys (at least 34 and 46 px when the system does not report them) and lays out
face, state, dialogue and controls without overlaps. The 🧭 navigator lists
every section per subject, the quick tools and the recognised phrases; the
context shortcuts (Explain this section, Guide me, What am I looking at?, Quiz
me, Review, and since v239 🎓 Lesson) change with the screen; 💬 opens the
chat. «Give me a lesson» («fammi lezione») starts the guided lesson of the open
section. The **difficulty** of a
question starts from the study level of the open section in the paths (high
school, bachelor, master, PhD) and grows with advanced-course words, symbols
and length; it becomes the face's **concentration** (eyes half closed and
brighter). The face (v3.0) has eyelids, an eye tint per emotion, muscle
springs, micro-expressions and sleep after two minutes without contact. With
the console silent for more than a minute Spectra may voice an important
thought from the mind unprompted.

**The creator** (`bsi-spectra-creatore.js`). Spectra knows it was created by
Samuele Pio Provenzano. Recognition requires the File Manager's secret phrase,
compared as a SHA-256 fingerprint and never stored; once recognised, the author
is greeted by name and the model knows it. It is a deterrent, not an access
control (§6).

**The quality voice** (`bsi-spectra-voce.js`, v239). With an OpenAI key saved
in the app, Spectra speaks in the console, in the guided lesson and in Spectra
Studio with a deep, metallic voice: the text goes to OpenAI
(`gpt-4o-mini-tts`), the audio comes back and goes through an effects chain,
and the mouth follows the audio. Without a key the browser's speech synthesis
remains. The spoken text leaves the device only in this case
([`03-Security-Privacy-Compliance.md`](03-Security-Privacy-Compliance.md) §1.2).

**The body** (`bsi-spectra-corpo.js`, v239). A generic driver for humanoid
avatars (bones, ARKit blendshapes, black hair, gaze, gestures, walking,
sitting), used by `bsi-spectra-figura.js` (v240) in Spectra Studio and in the
AI sections. The body chosen by the author (the «Bounty Hunter», free on
CGTrader, Royalty Free licence) is, since v241, **always there, for everyone,
without loading it**: it is embedded in the app as a packed block
(`models/spectra-corpo.bsi`) that only the app's code reopens, because the
licence allows using the model inside the product but not offering it as a
standalone `.glb` file. While it arrives «Spectra sta arrivando…» («Spectra is
on the way…») appears; if there is no network at the first start, «Spectra non
è arrivato: serve la rete la prima volta» with «↻ Riprova»; after the first
load it stays in the cache and works offline. The «🧍 Corpo» button and the
invitation to load the body are gone; no substitute (§6).

**Spectra with the body in the AI sections** (`bsi-spectra-figura.js`, v240).
In Spectra AI and in the three areas with the assistant, under the title, a
lab-style frame shows Spectra standing: it thinks while the model works,
explains with its hands and lip sync when the answer arrives, speaks with
Spectra Live and explains the working when the local assistant solves an
exercise; buttons «🎙️ Parla con me», «🧠 Spiega», «🎓 Studio».
One figure for the whole app. Spectra's icon is the face only. The buttons sit
in a bar under the scene.

**Spectra with the body in the Spectra Live console** (`bsi-spectra-figura.js`,
v242). The author's request, looking at the console: «it still comes out like
this (the bust)». While the console is open, the face-only bust is replaced by
Spectra with the body and the hologram (the same figure, moved into the
console, between the telemetry and the dialogue; on a large screen on the
right). The console's state drives the figure: while listening it is curious,
while working it is concentrated with its hand on its chin, then it speaks.
With the console closed, the figure returns to the section it came from.

**The hologram** (`bsi-spectra-figura.js`, v240). To Spectra's right (the
viewer's right) a holographic screen shows live scenes, computed rather than
recorded: four planets on Kepler orbits (Kepler's equation solved every frame,
faster at perihelion), benzene with its π cloud, an IR spectrum tracing itself,
the surface z = sin(r − t)/r, the 3d_z² orbital rotating, a Schrödinger wave
packet spreading; or the section open behind the Spectra window, live. The
scene follows the subject of the question and the answer (orbits → planets,
spectrum → IR, orbital → 3d_z²…); with «📺 Includi lo schermo» it shows the open
section; at rest the scenes alternate every 14 s. The label at top right
(«🪐 Orbite di Keplero · apri ›»…) opens the matching section with one tap
**without removing Spectra's figure**: the AI section is not left; the Spectra
window opens on «🧠 Spiega» (if it is not open already) with the section behind
it, so Spectra stays visible in front and the section is seen live in the
hologram. When the window is closed, if Spectra opened other sections (the
catalogue, «🎞️ Mostrami tutto», a question naming a topic, the label), the app
returns to the AI section the user started from, where the figure is, and the
tour stops. When
answering, Spectra first points at the hologram and then explains with the
hands. **Every section is showable**: a section without graphs (text, tables,
controls) is projected as a card drawn on the hologram (title, open tab, up to
six controls with their values, visible text) instead of falling back to the
planets.

**«🧠 Spiega»** (`bsi-spectra-spiega.js`, v240). In the Spectra window the
**«🧠 Spiega»** tab is the second one, after «💬 Chat» (then Esame Orale,
Ripassa Oggi, Genera Guida). It gives an **exhaustive explanation** of any
chemistry, physics or mathematics question, at one of five levels (High school,
Bachelor, Master, PhD, Advanced PhD · frontier), without simplifying below the
chosen level and without leaving out anything relevant. The answer has a
mandatory structure: in short; what you are looking at (with the screen: the
quantitative reading of the graph — for an NMR spectrum every signal with δ,
multiplicity, J, integral and assignment, for IR, MS and UV-Vis bands,
fragments and transitions; for a 3D scene geometry, symmetry, nodes, critical
points and isosurfaces; for a mathematical graph domain, asymptotes, extrema,
inflections, convergence); theoretical foundations; formalism and full
derivation; computed numerical examples; limiting cases, approximations and
common errors; links between the three subjects; applications and research
frontier; three self-check questions with answers. With **«📺 Includi lo
schermo»** the explanation is about what is open: the model receives the
section's text (controls with values, tables, text) and an image of the graphs
and 3D scenes. Quick prompts: «📈 Spiegami questo grafico», «🧪 Lo spettro,
picco per picco», «🧊 La scena 3D», «∴ Dimostrazione completa», «🔭 Frontiera
della ricerca»; «↺ Nuova spiegazione» starts over. A configured AI provider is
needed: without one, the tab says so and shows what the app knows on its own
(the local assistant for numeric exercises, the chapters of the section's
guided lesson, the screen data). Spectra with the body moves into the tab,
thinks while the model writes and then explains with voice and gestures.

**The catalogue: every section in the hologram** (`bsi-spectra-spiega.js`,
v240). The author's request: «ogni sezione della chimica, della fisica e della
matematica deve esserci, non deve mancare nulla in questo ologramma: deve
esserci tutto spiegabile e mostrabile» (every section of chemistry, physics
and mathematics must be there, nothing may be missing from this hologram:
everything must be explainable and showable). The catalogue is not written by
hand: it is read from the app bar (every section button, with its group —
Chimica, Spettroscopia, Biochimica, Farmacologia, Chimica Fisica, Studio,
Utility, Fisica, Matematica, Astrofisica — and its subject): 204 sections
(chemistry 79, physics 64, mathematics 32, shared 29, since v242); a new section appears by
itself. In the «🧠 Spiega» tab the collapsible card **«🗂️ Tutte le sezioni
nell'ologramma»** lists them by group, with a search box and a subject
filter; one tap opens the section behind the Spectra window (switching subject
if needed), the hologram shows it live and «📺 Includi lo schermo» is checked,
so the explanation uses its data. **«🎞️ Mostrami tutto»** runs every section
of the chosen subject (or all of them) through the hologram, one every 7 s,
with the counter «n/N · name»; it can be stopped. **A question that names a
topic finds its section** (the meaningful words of the section names looked
for in the question, also by stem; the acronyms MS, IR, UV, NMR, MO… weigh
more; synonyms such as «spettro di massa» → MS, «infrarosso» → IR, «risonanza
magnetica» → NMR, «orbitali molecolari» → MO; ties go to the shorter name):
asking in «🧠 Spiega» without the screen included, the named section opens
behind the window, is shown in the hologram and the explanation includes its
screen data. **A box unchecked by the user is respected**: if the user
unchecked «📺 Includi lo schermo», the section named or chosen from the
catalogue still opens and is shown, but the box stays unchecked and the model
receives only the question, with no screen text or image; the quick prompts
about the screen check it again (explicit choice). Examples: titolazioni → Titolazione, Schrödinger → the
Schrödinger equation, integrali per parti → «Derivate, integrali e serie»,
spettro di massa → Spettro MS, spettro infrarosso → IR Visivi, meccanica
orbitale → 3D orbital mechanics; «ciao come stai» → none.

**The interactive hologram, «⛶ Interagisci»** (`bsi-spectra-olointerattivo.js`,
v242). The author's request: select the hologram and interact with it, with
every step explained aloud by Spectra and in writing. The **«⛶ Interagisci»**
(interact) button sits on the hologram wherever the figure is (AI sections,
Explore sections, the «🧠 Spiega» window, the Spectra Live console) and opens a
full-screen window with Spectra with the body, the big hologram and the steps
panel; the app's floating buttons hide. The mode starts from what the hologram
was showing:

| Mode | What you do | What the steps explain |
|---|---|---|
| 🧪 Spectra | IR, ¹H-NMR (field 60–600 MHz, with the selected multiplet zoomed in), ¹³C-NMR, mass (EI), UV-Vis; one of six reference molecules (acetone, ethanol, acetic acid, benzene, toluene, ethyl acetate) or a written trace («1715 s, 2950 m, 3300 br», «2.17 s 6H; 1.2 t 3H J=7», «58 30, 43 100», «254 200»), redrawn while you type | For each signal position, shape, assignment and why (group frequencies, chemical shifts, neutral losses; a narrow band is never a carboxylic O–H); for molecules formula, molar mass, degree of unsaturation |
| 🪐 Universe | The eight planets in 3D (NASA data, Kepler orbits, distances compressed as √a); tap a planet, or write an orbit («a=2 e=0,6») | Kepler's third law, perihelion and aphelion, vis-viva speeds and the (1+e)/(1−e) ratio, surface gravity, escape velocity |
| 📐 Mathematics, ⚛️ Physics and chemistry | Write the question; the app's own assistant (`bsi-assistente.js`, `bsi-mat-cas.js`) solves it and the graph follows: function and derivative with zeros and stationary points; projectile trajectory; swinging pendulum | The steps computed by the assistant, not written by a model |

**«🔊 Spectra spiega i passaggi»** reads them one by one, highlighting each in
the text and on the hologram; tapping a peak, a planet or a step jumps there and
Spectra says it; **«🧠 Approfondisci»** opens «🧠 Spiega» with the hologram's
data. With the window closed, Spectra returns to the section. The reference
spectra are typical literature values for teaching, not measured spectra; from
a trace the interpreter proposes candidate assignments taken from tables, it
does not determine a structure.

**⚡ Explore with Spectra** (`bsi-spectra-esplora.js`, v242). The author's
request: «there is no section for each subject like every-joule». Three
sections, one per subject, in their subject's bar right after the «Area … ·
assistente» button: **«⚡ Esplora la chimica con Spectra»**, **«⚡ Esplora la
fisica con Spectra»**, **«⚡ Esplora la matematica con Spectra»**. Each is a
page to scroll, in the style of explorable lessons: Spectra with the body stays
on stage at the top while scrolling (right under the app header; shorter on a
phone) and the hologram changes with the chapter in front. Ten chapters per
subject, from high school to advanced PhD · frontier:

| Subject | Chapters |
|---|---|
| Chemistry | the atom and ionisation energy · the shape of molecules (VSEPR) · the pH of a very dilute strong acid · buffers and Henderson–Hasselbalch · first-order kinetics · IR spectroscopy · ¹H-NMR and spin–spin coupling · molecular orbitals: why O₂ is magnetic · Marcus theory and the inverted region · the frontier: the delocalisation error of DFT |
| Physics | falling bodies · projectile motion · Kepler's laws · the pendulum · Carnot efficiency · two-slit interference · the particle in a box · tunnelling · time dilation and muons · the frontier: gravitational waves (GW150914) |
| Mathematics | the derivative as a slope · the number e · the integral and the logarithm · the Basel series · the harmonic series · eigenvalues: the rotation of the plane · Fourier series and the Gibbs phenomenon · complex analysis and residues · the heat equation · the frontier: the Riemann hypothesis |

Each chapter: the phenomenon in a few exact lines; **🔮 Prevedi** (predict),
four answers including the most common misconceptions, then the reveal (right
or wrong, and why each answer is right or wrong) and Spectra reacts (joy or
surprise); **🧪 Prova** (try), in 19 chapters out of 30, a slider that
recomputes the real quantity (pH with water autoprotolysis,
Henderson–Hasselbalch, t½, Marcus ΔG‡ and relative rate, fall time, range,
pendulum period, Carnot, the box's E₁, tunnelling transmission, muon γ and mean
path, derivative, (1+1/n)ⁿ, ln b, Basel sums with the tail, H_N against
ln N + γ, rotation eigenvalues, the computed Gibbs maximum, the decay of a heat
mode); **«📺 Guardalo dal vivo»** (watch it live) opens the linked section
behind the Spectra window («🧠 Spiega» tab) and the hologram shows it live, and
closing the window returns to the Explore section; **«🧠 Spiegamelo tutto»**
(explain it all) asks «🧠 Spiega» for the explanation at the chapter's level,
with the section's screen (an AI provider is needed); **«🔊 Ascolta Spectra»**
reads the chapter with the Spectra Live voice. While scrolling, the chapter
crossing the middle of the free space under Spectra becomes «active» (even when
taller than the screen): Spectra tells it, with lip-sync and gestures, and the
hologram takes its scene. Predictions stay on the device (`bsi-esplora-v1`)
with the «n/10» progress bar, and are erased by «Cancella dati → Memoria
persistente».

Body, face and mind are a
simulation of behaviour, not consciousness.

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
1. Tap Spectra's face (the circle at the bottom right), then 💬
   for the chat
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

### 4.5 Checking for updates

```
1. ✨ menu → 🔄 Updates → «Check for updates»
2. The app asks the active service worker which version it is serving
   (BSI_VERSIONE message) and downloads sw.js from the same site, with no
   cache; if that fails, it tries the copy on GitHub
3. It always answers, in one of three ways:
     · same version      → «You already have the latest published version», with the number
     · new version       → announces it with both versions and offers «Update now»
     · site unreachable  → says so; the app keeps working offline
```

### 4.6 Following a guided lesson

```
1. Open a section and tap «🎓 Guided lesson with Spectra»
   (or say or type «give me a lesson» to Spectra)
2. The lesson advances by itself, chapter by chapter: it opens the tabs,
   highlights the charts, moves the sliders and selects and puts them back
3. ◀ ▶ move one step, pause stops the advance, 🔊/🔇 the voice,
   ✕ or Esc close
4. At the check question the lesson waits for the answer, then shows
   the explanation
5. The summary lists the chapters and offers «Replay the lesson» and
   «Ask Spectra»
```

### 4.7 Learning in Spectra Studio

```
1. Spectra's console → 🧭 → «Spectra Studio» (at the top)
2. Choose a lesson: 🪂 The fall, 💧 The shape of water,
   ∑ The Basel problem
3. PREDICT — choose an answer; the prediction is recorded
4. TEST    — the simulation runs on the holographic bench, with measurements
5. PROVE   — the derivation, one step at a time (◀ and «Passo successivo ▶»)
6. REVEAL  — why each option is right or wrong, the connections,
             exercises on four levels (one recommended)
7. Spectra speaks, looks at the scene, points and gestures; dragging turns
   the camera. Without WebGL the panel with all the text remains
```

### 4.8 Exploring a subject with Spectra (v242)

```
1. Subject bar → «⚡ Esplora la chimica / la fisica / la matematica con
   Spectra» (right after the area with the assistant)
2. Scroll: Spectra stays at the top, the chapter in front becomes active,
   Spectra tells it and the hologram takes its scene
3. PREDICT — tap one of the four answers; the reveal explains each one,
             Spectra reacts, the «n/10» bar advances
4. TRY     — move the slider: the quantity is recomputed
5. «📺 Guardalo dal vivo» — the linked section behind the Spectra window,
   live on the hologram; closing returns here
6. «🧠 Spiegamelo tutto» — the full explanation at the chapter's level;
   «🔊 Ascolta Spectra» — the chapter read aloud
```

### 4.9 Interacting with the hologram (v242)

```
1. On Spectra's hologram → «⛶ Interagisci»: full-screen window
2. Choose the mode: 🧪 Spectra · 🪐 Universe · 📐 Mathematics ·
   ⚛️ Physics and chemistry
3. Change the spectrum type or molecule, write a trace, tap a planet or
   write the question: the hologram is redrawn and the steps redone
4. «🔊 Spectra spiega i passaggi» — one by one, highlighted; tapping a
   peak, a planet or a step jumps there
5. «🧠 Approfondisci» — «🧠 Spiega» with the hologram's data
6. With the window closed, Spectra returns to the section
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
| 6 | **Accessibility automated, not complete** | Contrast, accessible names, labels, heading hierarchy across 13 pages and all 194 sections: **0 defects**, including text over gradients (judged against the worst stop). What stays outside is text inside SVGs and text over a real background image, counted on every run, and everything requiring human judgement |
| 7 | **Chromatography: no retention prediction** | The section computes resolution, efficiency and indices **given** k, α and N; it does not predict k from a structure, which would require experimental parameters of the stationary phase |
| 8 | **Partial code coverage** | Measured: **49.89 %** of statements over the widest path a bench walks. It is not whole-battery coverage, and it is statements, not branches; see `08-Traceability-Matrix.md` §8 |
| 9 | **Verification on Chromium only** | Firefox and WebKit are tested by hand, not by a bench |
| 10 | **Spectra's mind is a simulation** | Memory and internal state are data and rules in the browser, not understanding or feelings. The mind's summary and the screen context go to the provider with the question, when the question goes to the model |
| 11 | **Some astrophysics data are illustrative** | The exoplanet population is not a catalogue; the rotation-curve «observations» are a model with noise; the CMB map is synthesised from an illustrative power spectrum. The sections say so |
| 12 | **Spectra Live and the quick tools have no bench** | Since v238 `test_spectra238` tests layout, navigator, level, face and creator commands, since v239 also the single button, and `test_lezione` the guided lesson and «fammi lezione»; voice, the other local commands, the tools that act on the page and the per-subject ✨ menu are tested by hand (`08-Traceability-Matrix.md` §6, UI-21 and AI-13) |
| 13 | **Spectra's face weighs about 8 MB** | `models/spectra-noir.glb` is not in the service worker's precache: it is downloaded the first time the app derives Spectra's icon (a few seconds after the first start, if WebGL is available) or opens the console. If it does not arrive, the console uses the fallback face |
| 14 | **Creator recognition is not an access control** | The SHA-256 fingerprint is in the code and the recognition mark (`bsi-spectra-creatore-v1`) is in `localStorage`: whoever holds the device can write it by hand. Like the File Manager password, it is a deterrent and protects no data |
| 15 | **The guided lesson comes from the page, not from an author** | The lesson reads the section's explanations, canvases and controls: where a tab has little text, the chapter says little. The check question is chosen by words in common with the section and may be only close to the topic; 115 sections out of 194 have none. The voice is not tested by the bench. The model it is inspired by (Every Joule's interactive lesson) was not reachable during development: the lesson is an interpretation of it |
| 16 | **Spectra Studio is a first prototype; the body needs the network at first start** | Three lessons only. The body chosen by the author (CGTrader Royalty Free licence) is embedded in the app as a packed block (`models/spectra-corpo.bsi`, 4.40 MB) and is downloaded the first time: with no network at the first start «Spectra non è arrivato: serve la rete la prima volta» appears with «↻ Riprova»; no substitute. The packing is not absolute protection: the published file is not a reusable `.glb`, but someone reading the code can rebuild it. Black hair is guaranteed by the driver but tested only on the mannequin of its bench. The studio's interface texts are in Italian |
| 17 | **With an OpenAI key and the voice on, the spoken text goes to OpenAI** | The quality voice sends OpenAI the text Spectra speaks, even when the chat uses another provider and without going through the proxy. It is avoided by turning the voice off (🔇) in the console, in the guided lesson or in Spectra Studio, where the choice is remembered, or by not saving an OpenAI key |

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

_Document updated to version `bsi-v252`._
