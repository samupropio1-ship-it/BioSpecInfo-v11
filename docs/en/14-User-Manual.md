# A guide for the people who use it — BioSpecInfo

_This guide is written for people who study, not for people who program. You do
not need to know anything about computing._

---

## What it is

BioSpecInfo is an application for studying chemistry, biochemistry, pharmacology
and astrochemistry. It opens like a website, but you can **install** it on your
phone or computer and it works **without internet** too.

Three things to know straight away:

- **No sign-up needed.** No account, no email, no password.
- **It costs nothing.**
- **Your data stay yours.** Notes, files and conversations never leave your
  device: there is no server they could reach.

👉 **[samupropio1-ship-it.github.io/BioSpecInfo-v11](https://samupropio1-ship-it.github.io/BioSpecInfo-v11/)**

---

## Installing it (optional, but worth it)

Installing gives you an icon on your screen, full-screen opening and offline
operation.

| Device | How to do it |
|---|---|
| **Android / Chrome** | ⋮ menu → *Install app* (or *Add to Home screen*) |
| **iPhone / iPad** | Share button → *Add to Home Screen* |
| **Computer** | Install icon in the address bar, on the right |

After installing, open the app once with the network on: it will download
everything it needs. From then on it works with no signal too.

---

## Finding your way around

| Element | Where it is | What it is for |
|---|---|---|
| **🔍 Search** | At the top | Searches the whole app. Shortcut: `Ctrl+K` |
| **Section menu** | Navigation bar | The 201 sections, grouped by subject |
| **✨** | Bottom right | Tools, settings and updates |
| **Spectra** | Bottom right, the face in a circle | The assistant that answers questions: a tap opens the console, and from there 💬 the chat |
| **🎓 Guided lesson** | Under the title of every section | A lesson in chapters on the section, led by Spectra |

---

## The things you will do most often

### Analysing a molecule

1. Open the **Spectroscopy centre**
2. Type the molecule into the box. You can use:
   - the **name** — `aspirin`, `caffeine`
   - the **SMILES formula** — `CC(=O)Oc1ccccc1C(=O)O`
   - or **draw it** with the editor
3. Press Enter

You get the 2D and 3D structure, the functional groups, the molecular weight,
the predicted spectra (IR, NMR, mass, UV-Vis) and the pharmacological
properties.

> **If you have no network:** searching by *name* does not work, because it has
> to consult an external database. The SMILES formula, on the other hand, always
> works.

### Reading an IR spectrum

The spectrum is drawn as on a real instrument: the scale at the bottom runs from
4000 to 400 cm⁻¹ (**from left to right the numbers go down**) and the bands
point **downwards**.

The coloured area below 1500 cm⁻¹ is the **fingerprint region**: that is where
the specific molecule is recognised, not just its class. Below the chart you
will find the list of bands with their assignment.

> The spectra are **predicted** from the structure, not measured in a
> laboratory. They are there to help you recognise functional groups and to
> understand the link between structure and spectrum. For experimental data, the
> app sends you to the official databases.

### Everything about spectra, in one place

What you do with a spectrum used to live in **nine sections** across two
different menus. Now there is **🔬 Spectra centre**, a single section with ten
tabs:

| tab | what it is for |
|---|---|
| **Read your spectrum** | a file, a photo, a PDF |
| **Predict NMR** | ¹H and ¹³C assigned per atom |
| **2D NMR and NOE** | COSY, HSQC, HMBC |
| **Mass** | fragmentation and neutral losses |
| **IR** | bands and functional groups |
| **UV-Vis** | chromophores and λmax |
| **Reference tables** | ¹H, ¹³C, IR, J constants |
| **Everything on one molecule** | editor, spectra, groups, comparison |
| **Elucidate a structure** | from the data to a proposal |
| **Practise** | recognise the group from the spectrum |

The panels are the same ones as before: they were **moved**, not copied — there
is no second copy of anything. The old links still work: if something in the
application used to take you to "Mass spectrum", it now opens the Spectra
centre on the **Mass** tab.

> **Two tables of J constants, with different numbers.** There were two: one
> gave the aromatic ortho ³J as 6–9 Hz, the other as 7–10. Whoever looked that
> number up got a different answer depending on where they came in. **One**
> remains, the one inside the Spectra centre, which sits in the section with
> its own reference list.

### Changing language: the round button, top right

At the title's height, at the far right, there is a **round button** with the
flag of the language in use. It opens into a **disc**: the fourteen flags on two
shells — six inside, like a benzene ring, and eight outside — and at the centre
appears the name of the language you are moving to and **how much it is
translated**. That percentage is not hand-written: it is measured by applying
the dictionary and counting what stays in Italian.

Touch a flag and the interface changes at once. `Esc` closes the disc.

> The **🌍 Language** section remains, and does something else: it explains the
> languages, shows each one's coverage and says that Arabic carries the writing
> direction with it. That one **informs**, this one **acts**.

### ⚛️ Physics: eight computed sections

In the **⚛️ Physics** category of the bar there are eight sections where the
physics underneath chemistry is **computed**, not narrated. Every number you see
is compared by the bench with an independent literature value.

| section | what you do |
|---|---|
| 🌊 **Schrödinger** | pick a potential (well, harmonic oscillator, Morse, double well) and see levels and wavefunctions with the exact solution beside them; launch a wave packet at a barrier (tunnelling); see the vibrations of HCl, H₂, CO and N₂ in cm⁻¹ |
| 🧮 **Hartree-Fock** | a real ab initio calculation (RHF/STO-3G) on eight molecules: energy, orbitals with their energies, Mulliken charges, a map of the chosen orbital, the dissociation curve |
| 🎻 **Rovibrational** | the IR spectrum of a gaseous diatomic with its P and R branches: change temperature, resolution, isotope; rotational Raman of N₂, O₂, H₂, CO₂; from the lines to the bond length |
| 🎲 **Statistical thermodynamics** | entropy and heat capacity of nine gases computed from molecular constants, contribution by contribution, and rotational and vibrational populations |
| 🎱 **Molecular dynamics** | live Lennard-Jones particles: heat, compress and watch gas, liquid and crystal, with the speed distribution and g(r) |
| ∑ **Mathematics for chemistry** | from FID to spectrum by Fourier transform; Hückel on twelve π systems; kinetics by Runge-Kutta; the Arrhenius line with errors from your data |
| 💎 **Crystallography** | the 14 Bravais lattices to rotate, Miller planes, the powder pattern of eleven crystals with absences |
| ☢️ **Radiochemistry** | decay chains (the hospitals' technetium generator), dating with ¹⁴C, K-Ar and U-Pb, nuclear binding energy |

### 📐 Mathematics: from basics to advanced

The **📐 Mathematics** category holds eight sections that run on a real
computer-algebra engine: type expressions as you would by hand
(`2x² + sin(3x)`, `√(x+1)`, `e^(-k*t)`, `ln(x)/x`) and the results are
**exact** — 1/3 stays 1/3. Antiderivatives appear only if differentiating them
gives the original function back.

| section | what you do |
|---|---|
| 🔢 **Mathematics basics** | count significant figures and apply the measurement rules; logarithms and pH; solve equations with the working, from linear to polynomials (complex roots too) and the fractional equations of equilibrium (weak acid); practise with ever-new marked exercises |
| 📈 **Function analysis** | type f(x): domain, symmetry, zeros, exact derivatives, maxima, minima, inflections, vertical, horizontal and oblique asymptotes, a moving tangent; and function families with a·f(b(x−c))+d |
| ∫ **Derivatives, integrals and series** | the derivative with the list of rules used; the antiderivative and the definite integral with Riemann sums; the degree-n Taylor polynomial; left and right limits |
| 🔲 **Linear algebra** | systems, determinant, inverse, rank, null space, eigenvalues, in exact fractions with every Gauss-Jordan step; plane transformations; balancing a reaction (redox with charges too) as the null space of the composition matrix |
| 🌀 **Differential equations** | the direction field of y′ = f(x, y) with solutions starting where you tap; Euler, Heun and RK4 compared; the phase plane of predator-prey, pendulum, Van der Pol, Brusselator, SIR, with classified equilibria |
| 🗻 **Functions of several variables** | 3D surfaces to rotate and contour maps, gradient, Hessian, minima, maxima and saddles (the transition state), gradient descent; state functions, the Maxwell relation, exact differentials |
| ℂ **Complex numbers and Fourier** | complex numbers on the Argand plane, n-th roots, Euler's formula, Fourier series with the Gibbs phenomenon |
| 📏 **Laboratory statistics** | mean, standard deviation, confidence interval; Grubbs and Dixon for outliers; t and F tests with p-values; uncertainty propagation; calibration line with LOD, LOQ and the sample uncertainty |

### 🎓 UniBA exams: Chemistry, Mathematics and Physics, from basic to expert

**🎓 Chemistry exam** (🔬 Chemistry category) has 40 standard problems on four levels: basic (moles, stoichiometry, gases, solutions, thermochemistry, kinetics, equilibria, acids and bases, solubility, electrochemistry, the atom), intermediate (analytical: titrations, Beer-Lambert, gravimetry, EDTA, polyprotic acids), advanced (physical chemistry: van ’t Hoff, Clausius-Clapeyron, polyenes, rotor and oscillator, Michaelis-Menten) and expert (Sackur-Tetrode, Debye-Hückel, Pourbaix). Reactions balance themselves. In Mathematics and Physics level **A** goes beyond the two courses: eigenvalues, ODE systems, Fourier, Laplace, triple integrals; waves, modern and quantum physics.


**🎓 Mathematics exam** (📐 category) and **🎓 Physics exam** (⚛️ category) follow the syllabi of the Chemistry degree at the University of Bari. Each has the **syllabus** explained topic by topic with the method; the **solver**, which writes the step-by-step working with your data; **solved papers** in the style of the written exam (built on the syllabi: not the official papers). Mathematics also has a timed **exam simulation**. ⚛️ Physics also gains **⚡ Electrodes and transition state** and **🌟 Photochemistry, surfaces and polymers**.

### 🧪 ⚛️ 📐 Switching subject

Above **Spectra** and **✨** there are two round buttons: the two subjects you are not in — the **flask** for chemistry, the **atom** for physics, the **Σ** for mathematics. Tapping one, the bar shows only that subject's groups (plus 📚 Study and 🛠️ Utility, which serve all) and opens its Area. The choice is kept when you reopen the app; if you open a section of another subject, for instance from search or from Spectra, the bar follows by itself.

The subject does not change only the bar: it changes the whole app. In **📚 Study** and **🛠️ Utility** the common entries stay and the subject's own appear (for physics, for instance, the physics summaries, quizzes and constants); Spectra gets the subject's instructions, suggestions and greeting; in physics and mathematics the **✨** menu shows the **quick tools**, which open in a window above the page without losing your place:

| Tool | What it does |
|---|---|
| 🧮 **Calculator** | Exact computation: fractions and roots stay as they are, then the decimal |
| ∂ **Derivative** and ∫ **antiderivative** | With the app's symbolic engine |
| 📈 **Graph** | One or more functions of x |
| 🔢 **Constant** and 🔁 **units** | CODATA constants and unit conversion with a dimension check |
| 📐 **Formula**, 📖 **glossary**, ⚡ **lightning quiz** | Taken from the subject's study kit |

If a piece of data a tool needs is not loaded, the tool says so instead of making something up.

### 🔭 The Astrophysics group

The bar has an **🔭 Astrophysics** group with twelve sections: **🔭 Astrophysics** and **🪐 Gravitation**, which used to be in ⚛️ Physics, and ten 3D sections — 🪐 Solar system 3D (pick a date and see where the planets are), 🛰️ Orbital mechanics 3D, 📐 Celestial mathematics, ⭐ Life of stars 3D, 🕳️ Black holes and general relativity, 〰️ Gravitational waves, 🌌 Galaxies 3D, 🌠 Cosmology 3D, 🔭 Planetarium 3D (the sky from Bari or a place you choose, at any time; a click on a star gives its coordinates and times) and 🌍 Exoplanets 3D. Scenes rotate by dragging and zoom with two fingers or the wheel. On a slow phone the 3D scenes may take a moment to open. Some data are illustrative and the section says so: the exoplanet population is not a catalogue, and the cosmic microwave background map is synthesised.

### 🌀 The new physics and mathematics laboratories

In **⚛️ Physics**: 🌀 Spin, qubits and entanglement, 🎲 Statistical mechanics, ☢️ Nuclei and reactions, 🧱 Elasticity and materials, 🔌 Electronics. In **📐 Mathematics**: 🌊 Partial differential equations, 🌀 Complex analysis, 🔗 Markov chains and stochastic processes, 🧩 SVD and applied linear algebra, 📡 Codes and elliptic curves. As in the other laboratories, the sliders sit next to the simulation and the note below explains what you see.

### 🗺️ Physics and mathematics study kits and resources

With physics or mathematics chosen, **📚 Study** has five sections: **🗺️ Summaries** (mark the ones you have studied and watch your progress), **❓ Quiz** (choose topic, level and number of questions; keys 1–4 and Enter; at the end the score by topic and a review of mistakes), **🃏 Flashcards** (five-box Leitner method: a card you miss goes back to the first box), **📐 Formula sheet** (with «copy») and **📖 Glossary**. **🛠️ Utility** has **🌐 Resources and bibliography** (links by category, books by level, and the **Citations** tab: paste a DOI and get the citation in APA 7, IEEE, ISO 690 or BibTeX), plus **🔢 Constants and units** for physics and **📚 Mathematical tables** for mathematics. Chemistry has its own 📚 Bibliography and citations section. Your progress stays on this device only.

### 📰 Articles for the three subjects

In **📰 Articles** choose 🧪 Chemistry, ⚛️ Physics or 📐 Mathematics at the top. Each subject has the **latest articles** (eight topics) and its **prizes**: the Nobel for chemistry and physics, the **Abel Prize** and the **Fields Medal** for mathematics, which has no Nobel. Years, names and motivations arrive live from the Nobel Foundation and Wikidata; every prize has an explanation written for its topic.

### 🔐 The deeper topics

In **📐 Mathematics**: Numbers and cryptography (in the RSA tab you type a message and watch it encrypted and decrypted), Graphs and optimisation, Sequences and series, Calculus of variations, Topology (solids rotate when dragged), Algebraic structures, Game theory (play tic-tac-toe against a perfect opponent, and Nim), Logic and computability (type a formula and get its truth table), Statistical inference (regression points can be dragged) and Non-Euclidean geometries. In **⚛️ Physics**: Gravitation, Heat and diffusion (on the plate a tap moves the source), Ising model, Particle physics, Analytical mechanics, Lasers and quantum optics and Climate physics. In **⚗️ Physical Chemistry**: Phase diagrams and Potential energy surface.

### 🎲 The explorations

In **📐 Mathematics**: **🎲 Probability in motion** and **🎞️ Visual mathematics** (in the Fourier epicycles you can choose «draw it yourself» and trace a shape with your finger; in the fractals a tap zooms in). In **⚛️ Physics**: **⚡ Electromagnetism in motion** (charges can be dragged), **🔊 Sound and acoustics** (the 🔊 Listen button plays the sound) and **💡 Semiconductors**. In **⚗️ Physical Chemistry**: **🌡️ Distillation and mixtures** and **🔋 Cyclic voltammetry**.

### 🔭 Astrophysics, relativity, fluids, vector calculus, complex kinetics

The **🔭 Astrophysics** group has **🔭 Astrophysics**; in **⚛️ Physics** there are **⏱️ Special relativity** and **🌊 Fluids**; in **📐 Mathematics** **∇ Vector calculus**; in **⚗️ Physical Chemistry** **🌀 Complex kinetics**. Under every animation there is a bar: **⏸/▶** pauses and resumes, **↺** restarts, **×¼ … ×4** changes speed, on the right the elapsed time. Animations stop by themselves when they leave the screen; with «reduce motion» on in the system they start paused and run with ▶.

### 🎯 The laboratories in motion

In the **⚛️ Physics** category there are **🎯 Mechanics in motion**, **〰️ Waves and optics**, **🔌 Circuits** and **🔥 Thermodynamics in motion**; in **📐 Mathematics** there are **🧮 Numerical methods** and **📐 Analytic geometry and vectors**; in **⚗️ Physical Chemistry** there is **⚖️ Equilibrium and Le Chatelier**. Each tab has sliders on the left and the simulation on the right, with the numbers describing it under the controls. In the equilibrium simulator the buttons add or remove a species, change volume or temperature: concentrations move until Q equals K again, and the note says which way the reaction goes.

### 🧊 The sections' 3D tabs

Twenty-nine sections have, after their other tabs, a 3D tab built on the
section's own model: for instance the potential energy surface with the
trajectory running over it, crystal cells with Miller planes, field lines and
the motion of a charge, the light cone, the Brillouin zone, the Ising spin cube,
the particle detector, the tangent plane, the flux through a sphere, Lorenz
chaos, the Riemann sphere, the soap film between two rings. They rotate and zoom
like the other 3D scenes. Text and controls appear at once; the scene is built a
moment later, and on a slow phone it may take a little while.

### 🧊 3D Laboratory, charts and molecular views

In the **⚛️ Physics** category the **🧊 3D Laboratory** shows surfaces, atomic orbitals, motion in space, crystal structures and field lines in three dimensions. Rotate by dragging with a finger or the mouse and zoom with two fingers or the wheel. The buttons at the top right start auto-rotation (⟳), go back to the initial view (⌖), save an image (📷) and switch to full screen (⛶). Moving a finger or the mouse over a chart in any section shows a crosshair with the value of every curve at that point. Molecular 3D views have the same bar, plus the ✦ button choosing quality: automatic, high (with ambient occlusion), medium or low for slow phones. If «reduce motion» is on in the operating system there are no animations.

### ⚗️ ⚛️ 📐 The three macro-areas and the assistant

At the head of the **🔬 Chemistry**, **⚛️ Physics** and **📐 Mathematics** categories is the area of that subject. In the **🤖 Assistant** tab, write the problem as you would write it to your teacher, for example «a car at 90 km/h brakes at 5 m/s²», «how many grams of NaCl for 250 mL of 0.5 M solution» or «y'' + 4y = sin(x), y(0)=0, y'(0)=1», and press **Solve and explain**. The answer says what was understood; the **Data used** table shows in green the data read from the text, in yellow those inferred and in red those assumed, to be checked. If the chosen model is not the right one, the **Did you mean…?** buttons offer the others, and **Edit the data in the solver** opens the problem with its fields. The **🗂️ All tools** tab gathers the subject's sections, with search; **🧭 Levels** orders them from high school to PhD.

### 🧭 From high school to PhD

In the **📚 Study** category, **🧭 From high school to PhD** tells you, for chemistry, physics and mathematics, what you should be able to do at each level and opens the right tools with one click. The **Physics exam** now covers astrophysics, nuclear and quantum physics (up to variational and perturbation methods); the **Chemistry exam** organic chemistry, spectroscopy, biochemistry and a PhD level (Marcus, isotope effect, tunnelling); the **Mathematics exam** residues and the heat equation.

### Where things are

The sections live in the **navigation bar**, grouped by subject, with **🛠️
Utility** among them: laboratory, GHS, concept map, molecule comparison,
molecule search, atlas, resources, materials, notes, file manager, statistics,
data science, pomodoro, lab calculator, **articles**, and the two language
ones.

The **✨** menu holds only what is *not* a section: the editors, the overlay
labs, and actions such as exporting a figure, printing, sharing, updating. The
rule is simple and always holds: **if something is in the bar, it is not also
in the menu**. It used not to be, and the menu showed two "Data Science", two
"File Manager", two "Articles" and two "Updates".

Two exceptions, and they have a reason:

- **Spectra** is not in the bar: it has its own dedicated button, the pulsing
  one at the bottom. Three roads to the copilot were too many.
- The **spectrum reader** is not in the bar: it is a tab of the Spectra centre.

> **Two File Managers, and they are two different things.** In the bar, **📁
> File Manager** is for uploading and organising your own notes (PDF, images,
> Word). In the ✨ menu, **🔒 Protected File Manager** is a separate page with
> the password, for the gallery and the custom sections. They had the same name
> and looked like a duplicate: now they are named for what they do.

### The articles and the Nobel Prizes

**📰 Articles** (from the ✨ menu) has two tabs.

**Latest articles** shows what came out in the last two months, by topic:
spectroscopy, synthesis, catalysis, drugs, materials, biochemistry,
computational. It is not a hand-written list — that would be stale tomorrow: it
comes from **Crossref**, the DOI registry, at the moment you open the tab. Each
title leads to its **DOI**, which is a permanent address, and beside it there is
a link to **read it in Italian**.

**Nobel Prize in Chemistry** lists every prize. Years, laureates and motivations
come from the **Nobel Foundation**, live: they are not written inside the
application. The **explanation** in Italian is — and it is matched to the
*topic* of the official motivation, not to the year, so no attribution comes
from here. For each prize you get the official page, the Foundation's
scientific and popular material, the Italian translated view and an Italian
Wikipedia search — all addresses **computed** from the year, not written.

> **If a prize has no explanation, I say so.** I would rather write "for this
> prize I have no explanation" and leave you the official motivation and the
> Foundation's material, which is the source, than make something up.

> **It needs the network.** Without it you do not see a stale list passed off
> as current: you see what I asked for, from whom, and why it did not arrive —
> with the address of the request, which you can open by hand.

### Reading a spectrum you measured yourself

The **Spectrum reader** section does the opposite of the one above: it does not
predict a spectrum from a structure, it reads one you already have.

There are **two buttons**, and they are not duplicates.

`📂 Open a file` filters nothing: whatever you have in your folder, open it.
`📷 Photo or image of a spectrum` instead opens the **phone gallery** and also
lets you take the picture there and then — on a phone these are two different
system pickers, not two filters of the same one, and without the second there
is no way to hand over a photograph.

A line under the buttons then **tells you what it decided the file is**:

| What you open | What happens |
|---|---|
| a **PDF**, a **Word** file, an OpenDocument, a spreadsheet | it opens, shows you all of it and **works through** what it contains |
| a **photograph** (`.png`, `.jpg`, …) | both things: the **trace** is extracted and the image is also shown as a page, because it may be a photo of a spectrum or of a sheet |
| a **JCAMP-DX** (`.jdx`, `.dx`), compressed form included | it is a spectrum: the format itself says so |
| a **text** file or a **`.csv`** | decided **from the content**: if the numbers form a curve it is a spectrum, otherwise it is **problem text** and gets worked through |

If you prefer, **paste** the data or the problem text into the box and press
**Read and work it out**: the same reasoning applies.

> There used to be two cards, and the spectrum one allowed only `.jdx` and
> `.csv`. On a phone that filter did not narrow, it **hid**: anyone arriving
> with the PDF of an exam saw an empty folder. Now there is one door and it
> filters nothing.

If you have no file at hand, the three buttons **IR example**, **MS example**
and **NMR example** load a sample spectrum, and **example: an exam problem**
loads a complete problem.

Inside the section there is **📖 How to use it — full guide**: seven short
chapters covering the two buttons step by step, the calibration, what the
program does by itself, what it cannot do, how to recognise a wrong result from
the symptom you see, and how to take the numbers away.

### A spectrum you only have as a figure

The trace is extracted from the **pixels**, and the chart appears at once. Then
it must be **calibrated**, because the axis numbers are not in the image:

| field | what you write in it |
|---|---|
| **x at left** / **x at right** | the values at the two edges of the plot — for an IR typically 4000 and 400 **in that order**, because an IR is written with decreasing wavenumbers |
| **y at bottom** / **y at top** | the values of the vertical axis; for a figure in %T, 0 at the bottom and 100 at the top |
| **y unit** | `%T`, `T`, `A` or intensity. Picking `%T` derives the absorbance with **A = −log₁₀T**, which is the definition |
| **x/y logarithmic** | if an axis is logarithmic, say so: applying a linear map to it does not raise an error, it produces wrong numbers that look right |
| **frame** | normally I find it; "the whole figure" is for when the image is already cropped to the plot only |

Change a field and the chart redraws by itself: there is nothing to confirm.
Below it the **diagnostics** appear — how many columns, whether the frame was
found and on which sides, background and threshold, how many columns were grid
— because a number without its how cannot be challenged.

What I do by myself: I find the **axis frame** and digitise only what is inside
it (the numbers written on the axes are dark pixels just like the trace); I
**survive the grid**, picking in each column the run near where the trace was a
pixel earlier and dark enough to be the trace; I read at **sub-pixel**, because
the centre of a two-pixel line sits in between.

> **How much I get wrong.** Measured over seven constructed figures whose band
> centres are known: **mean 2.2 cm⁻¹** deviation, **worst 7.3**. One column of
> a figure 900 pixels wide over 3600 cm⁻¹ is worth about 4 cm⁻¹: below that
> there is nothing to gain, it is the limit of the figure.

> **If the calibration is wrong**, the peaks come out at wrong numbers while
> sitting in the right place on the figure: the shape is recovered from the
> pixels, the calibration is not. And a photo taken at an angle carries a
> distortion I do not straighten — frame the figure head-on.

With **download CSV** and **download JCAMP-DX** the numbers leave this place:
any spectroscopy program opens the JCAMP, and this very reader reads it back
identical. Inside it is written that the calibration was given by hand.

Below the chart you will find the peaks found with their signal-to-noise ratio,
and for each band **all** compatible assignments. If you read two rows at
1715 cm⁻¹, that is not a defect: at that wavenumber a ketone and a carboxylic
acid are both possible, and naming only one would be inventing.

> The reader **does not tell you which molecule it is**. A set of bands is
> compatible with many different molecules: the step from spectrum to structure
> is yours to take, with everything else you know about the sample.


### Opening a problem and having it worked through

The same button, `📂 Open a file`. It takes the PDF of the exam, a
photograph of the sheet, a Word file, plain text — and shows you **everything**
inside: every page drawn (click to enlarge) and the full text.

Then, if the text contains spectroscopic data, it recognises them and puts them
in a table **with where it took each one from**. That table sits above the
working on purpose: look at it first. If it mistook a mass for an IR band, the
working that follows will be impeccable and the answer wrong, and you catch it
there.

The working lists the steps with the **evidence** for each and how certain it
is: degrees of unsaturation are arithmetic, the carbon count from the M+1 peak
is an estimate with a margin, an IR band is *compatible with* several things.

> **It does not give you the structure.** A set of spectroscopic data is
> compatible with more than one molecule, and a program producing a single one
> would offer a certainty the data do not contain. What you can do is the
> opposite: write a structure yourself and the program **compares** it, signal
> by signal, saying where it fails.

> **If the document is a scan**, the text cannot be read: a scanned page
> contains pixels, not letters, and there is no optical character recognition.
> The app tells you instead of pretending the sheet was empty. The pages stay
> visible, and if one is a photograph of a spectrum the trace can be extracted
> with **Open an image**.

### Choosing the language

The **Languages** section holds **fourteen** languages, with a search field to
find them quickly: Italian, English, Spanish, French, German, Portuguese, Dutch,
Polish, Romanian, Greek, Russian, Chinese, Japanese and Arabic. Choosing Arabic
also flips the page's **direction**, right to left.

Next to it is **Chemical languages**, which is a different thing: it converts a
molecule among the twenty-five notations chemistry writes it in — SMILES, InChI,
SMARTS, molfile, XYZ, PDB, CML, the fingerprints — and, for a declared class of
simple molecules, writes its **IUPAC name**. Outside that class it says so,
rather than attempting a wrong name.

### Studying with cards

1. Open the study section
2. Generate a deck of cards
3. For each card, after answering, say how well you remembered it

The app works out **when** to show it to you again: the things you know well
come back rarely, the uncertain ones come back soon. When you reopen, you only
find the cards that are due.

### Looking up a drug

Open **Pharmacology**. For each of the 263 drugs you will find the structure,
molecular weight, mechanism of action, indications, adverse effects and class.

> ⚕️ **For teaching purposes only.** This information does not replace the
> judgement of a doctor or a pharmacist, and is not there to decide a therapy.

---

## Spectra, the assistant

Spectra answers chemistry questions and can use the app's own tools: calculate,
generate spectra, look up constants, balance reactions.

### Getting it working

Spectra relies on an external artificial-intelligence service, and you need a
free **key**. Two routes:

**The simplest — a key of your own**

1. Go to [console.groq.com](https://console.groq.com/keys) and create a key
   (free, it takes two minutes)
2. Open Spectra (the face at the bottom right, then 💬), paste the key into
   the 🔑 box
3. Done

**The definitive one — a proxy**

If services often fail to answer for you, or you would rather not keep the key
on your phone, you can publish a *proxy*: a small free program that keeps the
key safe and makes even the services that are blocked from the browser work.

In the assistant's **Proxy** box you will find **"How to set it up, in 4
steps"**, with the commands ready to copy.

### When Spectra does not answer

Almost always it is not the app's fault but the external service's. Press
**🔌 Test** in Spectra's panel: in a few seconds it tells you **which services
your device can actually reach** — and you need no key to find out.

If a service stops answering, Spectra remembers it for 24 hours and moves it to
the bottom of the list, under *"Did not answer from this device"*. It does not
delete it: tomorrow it might work again.

### Spectra Live: talking to him

Spectra has **a single button**: his face in a circle, at the bottom right, on
every screen. A tap opens the console; from the console the **💬** button opens
the written chat. Right after the app opens the circle shows a drawn face; once
the page has loaded it becomes the portrait. The
**◈ Live** button in Spectra's header and `Ctrl+Shift+J` work too. The console
fills the screen; on a phone, with the app installed, it leaves the status bar
at the top and Android's keys at the bottom free. Press the microphone and speak: Spectra listens, answers
aloud and then listens again, so you can carry on without touching anything.
Say «stop» or tap the screen to interrupt. If the browser has no speech
recognition or synthesis, the console says so and you can type.

In the console there is **Spectra with the body**, standing, with the hologram
on his right (no longer the face-only bust): on a phone between the telemetry
and the dialogue, on a large screen on the right. He follows what the console
is doing: while listening to you he is curious, while working he puts his hand
to his chin, then he speaks and gestures. When you close the console, Spectra
goes back to the section where you left him.

Some requests Spectra carries out by himself, **without network and without a
key**: «switch to physics», «calculate 3/4 + 1/6», «derivative of x^2
sin(x)», «convert 5 km to m», «constant planck», «plot sin(x)», «quiz me»,
«pause», «where am i». Everything else goes to the artificial-intelligence
service you chose, together with a short summary of what is on your screen. If
you ask about «this chart» or press **👁**, Spectra also attaches an image of
the open tab's charts.

Above the controls are the **shortcuts**: with a section open «Explain this
section», «Guide me», «What am I looking at?», «Quiz me», «Review» and
**🎓 Lesson**, which starts the section's guided lesson (see below). At the
top, the **🧭** button opens the navigator: for chemistry, physics and
mathematics every section of the bar, the quick tools and the phrases Spectra
understands even offline, with a search box. A tap on a section opens it, even
if it belongs to another subject. The **💬** button switches to the full chat.

On the left, the telemetry shows among other things who you are to Spectra
(**USER**), the **LEVEL** of the question and the **FOCUS**. The level starts
from that of the open section in the study paths (high school, bachelor,
master, PhD) and rises with advanced-course questions; «in simple words» lowers
it. If the console stays open and silent for more than a minute, Spectra may
tell you something important unprompted, for instance that it is time for a
break.

### 🎓 The guided lesson

In every section, under the title, there is the **«🎓 Guided lesson with
Spectra»** button. Tap it, or say or type «give me a lesson» to Spectra: the
section becomes a lesson in chapters, with the real simulation in front of you.

- It starts from the section's title. Then **one chapter per tab**: the tab
  opens by itself, the explanation appears one piece at a time, word by word,
  and a **spotlight** dims the rest of the page and lights up the chart or
  control being discussed.
- The **sliders** move by themselves, from minimum to maximum, while the chart
  or the 3D scene changes; the **selects** go through their options. At the
  end every control is back as it was, even if you skip ahead or close
  half-way.
- Many sections have a **check question** taken from the subject's study kit:
  the lesson waits for your answer, then shows the right one and the
  explanation.
- The **summary** lists the chapters covered; from there you can replay the
  lesson or ask Spectra to go deeper.

The lesson panel sits on the right on a large screen (the page shifts left to
make room) and at the bottom on a phone. **◀ ▶** move one step, the middle key
pauses, **🔊/🔇** turns Spectra's voice on and off, **✕** (or Esc) closes.
During the lesson the app's round buttons are hidden and they come back at the
end. If «reduce motion» is on in your system, sliders jump to the value instead
of sliding and the text appears all at once.

The lesson is built by reading the section: where a tab has little text, the
chapter is short; and in sections with no suitable question in the study kit
there is no check.

### 🌌 Spectra Studio: Spectra's laboratory

In Spectra's console tap **🧭** and, at the top of the list, **Spectra
Studio**. A separate page opens: a 3D laboratory where Spectra stands next to a
holographic bench and teaches you in four steps.

1. **Predict** — Spectra stages a phenomenon and asks what will happen. Choose
   an answer: it is recorded.
2. **Test** — the simulation runs on the bench, with the measured numbers.
3. **Prove** — the rigorous explanation, one step at a time.
4. **Reveal** — why the right answer is right and the others are not, what it
   connects to, and four exercises from high school to research. The one
   highlighted is the level Spectra recommends, based on how your predictions
   went and on the exercises you have already opened.

For now there are three lessons: **🪂 The fall** (a sphere dropped and one
thrown: which lands first?), **💧 The shape of water** (why is the angle
104.5°?) and **∑ The Basel problem** (what is 1 + 1/4 + 1/9 + …?). Dragging
turns the camera, the wheel zooms in. If the device has no 3D graphics, the
whole lesson stays in the panel, as text. Your predictions stay on this device;
they are erased with «Clear data → Persistent memory». In the studio's button
bar there is **🔊/🔇**: it turns Spectra's voice off and on, and the studio
remembers your choice next time too. The studio's own buttons and messages are
in Italian.

**Spectra's body is always there.** You do not have to load anything: the
body chosen by the author is already inside the app, in the studio and in the
AI sections. The first time a network is needed: while it arrives you see
«Spectra sta arrivando…» («Spectra is on the way…»); without a network
«Spectra non è arrivato: serve la rete la prima volta» appears — press
**«↻ Riprova»** («↻ Retry») once you are connected. After the first start
Spectra stays in the app and appears offline too. The «🧍 Corpo» button is
gone; if in a previous version you had loaded the body yourself, that copy is
deleted automatically to free space.

**Spectra in the AI sections.** In Spectra AI and in the areas with the
assistant for Chemistry, Physics and Mathematics, under the title, Spectra
stands in a lab-style frame: while the model works it brings its hand to its
chin, when the answer arrives it explains with its hands and moves its lips.
**«🎙️ Parla con me»** opens Spectra Live, **«🧠 Spiega»** opens the explanation,
**«🎓 Studio»** opens Spectra Studio. Spectra's round button, on every screen,
is its face.

**The hologram.** To Spectra's right there is a holographic screen with scenes
that really move: orbiting planets, a benzene molecule, an IR spectrum drawing
itself, a wave, an orbital, a surface. It changes by itself with the subject
you are talking about (ask about orbits and the planets appear; talk about a
spectrum and the spectrum appears) and, if you have a section open behind the
Spectra window, it shows it live. **Tap the label at the top right of the
hologram** («🪐 Orbite di Keplero · apri ›»…) to open the section where that
scene is really studied: it opens behind the Spectra window, on the
«🧠 Spiega» tab, so Spectra stays in front of you and the section is seen live
in the hologram. When you close the window you return to the AI section you
started from, with Spectra there (this also applies to sections opened from
the catalogue, from «🎞️ Mostrami tutto», which stops, or from a question). Every section of the app can be shown in the
hologram (below, «Every section in the hologram»). When answering, Spectra points at the hologram and
then explains with the hands. The buttons are in the bar under the scene.

**Explain everything: «🧠 Spiega».** In the Spectra window open the second
tab, **«🧠 Spiega»** (or press «🧠 Spiega» in Spectra's frame). Write the
question — anything in chemistry, physics or mathematics — and choose the
level, from high school to advanced PhD, at the research frontier: Spectra does
not simplify below the chosen level. The answer is complete and always has the
same structure: the summary, the theory, the step-by-step derivation, worked
numerical examples, limiting cases and common errors, the links between the
three subjects, applications and research, and three questions to check you
understood. Then you can go on: «go deeper», «prove step 3», «and if I double
the temperature?».

**What you are looking at.** If behind the window you have a section open with
a graph, a spectrum or a 3D scene, leave **«📺 Includi lo schermo»** checked
(the card shows which section and a thumbnail) or use a quick prompt:
**«📈 Spiegami questo grafico»**, **«🧪 Lo spettro, picco per picco»**,
**«🧊 La scena 3D»**. Spectra reads the control values and the tables and looks
at the image of the graphs: for an NMR spectrum it explains every signal
(chemical shift, multiplicity, coupling constant, integral) and which atom it
belongs to. **Note**: with the box checked the screen text and the image of the
graphs go to the AI provider you configured, together with the question;
uncheck it if you do not want that, and your choice stays: even when Spectra
opens a section you named or chose from the catalogue below, the model receives
only the question. The quick prompts about the screen («📈 Spiegami questo
grafico»…) check it again. A configured AI provider is needed, as for
the chat; without one, the tab tells you so and shows what the app knows on
its own (the assistant's working for a numeric exercise, the chapters of the
section's guided lesson). **«↺ Nuova spiegazione»** starts over; the
conversation is not saved.

**Every section in the hologram.** In the «🧠 Spiega» tab open the
**«🗂️ Tutte le sezioni nell'ologramma»** card (in English «Every section in the
hologram»): it lists every section of the app (201: 78 chemistry, 63 physics,
31 mathematics and 29 shared), grouped as in the bar. Search for one in the box
(for example «titration», «Schrödinger», «integrals») or filter by subject;
tap it and Spectra opens it behind the window, shows it live in the hologram
and checks «📺 Includi lo schermo», so the explanation uses its data (if you
had unchecked it, it stays unchecked). Even a
section without graphs (text, tables, controls, such as the Periodic Table)
appears in the hologram, as a card with the title, the controls and the text.
**«🎞️ Mostrami tutto»** («Show me everything») runs through every section of
the chosen subject (or all of them) in the hologram, one every 7 seconds, with
a counter («12/60 · …»); **«⏹ Ferma il giro»** stops it. You do not even need
to search: if your question names a topic (in Italian, for example
«spiegami le titolazioni», «lo spettro di massa», «la meccanica orbitale»), Spectra finds the section about it, opens it
behind the window, shows it in the hologram and explains it with its screen
data. New sections appear by themselves: the list is read from the app bar.

### ⛶ Interacting with the hologram

On the hologram, on Spectra's right, there is the **«⛶ Interagisci»**
(interact) button (in the AI sections, in the Explore sections, in the
«🧠 Spiega» tab and in the Spectra Live console). Tap it: the hologram opens
full screen, with Spectra beside it and the steps panel at the side. It starts
from what the hologram was showing; you can change mode at the top.

- **🧪 Spectra.** Choose the type (IR, ¹H-NMR, ¹³C-NMR, mass, UV-Vis) and a
  molecule (acetone, ethanol, acetic acid, benzene, toluene, ethyl acetate),
  or **write your own trace** and the spectrum is redrawn as you type.
  Examples: IR «1715 s, 2950 m, 3300 br» (wavenumber and intensity: s strong,
  m medium, br broad); ¹H-NMR «2.17 s 6H; 1.2 t 3H J=7»; mass «58 30, 43 100»
  (m/z and intensity); UV-Vis «254 200» (λ and ε). Each signal becomes a step:
  where it is, its shape, what it is assigned to and why. In ¹H-NMR choose the
  instrument field (60 to 600 MHz): multiplets really narrow or widen, and an
  inset zooms into the selected one. For the molecules you also see formula,
  molar mass and degree of unsaturation.
- **🪐 Universe.** The eight planets in 3D on their orbits. Tap a planet (or
  pick it from the list, or write an orbit such as «a=2 e=0,6»): period,
  perihelion and aphelion, speeds, surface gravity and escape velocity,
  computed step by step.
- **📐 Mathematics** and **⚛️ Physics and chemistry.** Write the question, for
  example «studia f(x)=x^3-3x» or a projectile or a pendulum: the app's own
  assistant solves it, offline, and the graph changes with the question (the
  function with its derivative, zeros and extrema; the trajectory; the
  swinging pendulum).

Press **«🔊 Spectra spiega i passaggi»**: Spectra reads them aloud one by one,
and each lights up in the text and on the hologram. Tap a peak, a planet or a
step to jump there. **«🧠 Approfondisci»** opens «🧠 Spiega» with the hologram's
data (an AI provider is needed). When you close, Spectra returns to the
section.

The spectra of the six molecules are typical literature values, for study: they
are not measured spectra. From your trace the app proposes possible assignments
according to tables; it does not tell you which molecule it is.

### ⚡ Explore with Spectra: a subject to scroll

In the chemistry, physics and mathematics bars, right after the «Area … ·
assistente» button, there is **«⚡ Esplora la chimica con Spectra»** (and
physics, and mathematics; in English «⚡ Explore chemistry with Spectra»…). It
is a page to scroll, like an explorable lesson: **ten chapters**, from high
school to advanced PhD, at the frontier of research.

- **Chemistry**: ionisation energy, the shape of molecules (VSEPR), the pH of a
  very dilute strong acid, buffers and Henderson–Hasselbalch, first-order
  kinetics, IR spectroscopy, ¹H-NMR and coupling, the molecular orbitals of
  O₂, Marcus theory and the inverted region, the delocalisation error of DFT.
- **Physics**: falling bodies, projectile motion, Kepler's laws, the pendulum,
  Carnot efficiency, two-slit interference, the particle in a box, tunnelling,
  time dilation and muons, gravitational waves (GW150914).
- **Mathematics**: the derivative as a slope, the number e, the integral and
  the logarithm, the Basel series, the harmonic series, the eigenvalues of a
  rotation, Fourier and the Gibbs phenomenon, residues, the heat equation, the
  Riemann hypothesis.

While you scroll, **Spectra stays at the top**, under the app header (on a
phone in a shorter frame, to leave room for the text). The chapter in front of
you lights up: Spectra tells it to you, with his lips and gestures, and the
hologram on his right changes scene. In every chapter:

1. **🔮 Prevedi** (predict) — tap one of the four answers. You see at once
   whether it was right and **why each answer is right or wrong**; Spectra is
   pleased or surprised.
2. **🧪 Prova** (try) — in many chapters a slider: move it and the number is
   really recomputed (the pH, the fall time, the pendulum period, the Gibbs
   phenomenon…).
3. **📺 Guardalo dal vivo** (watch it live) — the app section that shows the
   phenomenon opens behind the Spectra window and the hologram projects it.
   When you close the window you are back at the chapter.
4. **🧠 Spiegamelo tutto** (explain it all) — the full «🧠 Spiega»
   explanation, at the chapter's level, with the section's data (an AI
   provider must be configured). **🔊 Ascolta Spectra** reads it aloud.

At the top, the **«Il tuo percorso»** (your path) bar counts the chapters you
have already predicted (for example 3/10); a chapter already done shows «Già
previsto ✓» or «✗» and you can review it by tapping an answer. Predictions stay
on this device; **«Cancella dati → Memoria persistente»** erases them.

Body, face and voice
imitate a behaviour: **they are not a consciousness**. The design is described
(in Italian) in [`docs/spectra/`](../spectra/01-Analisi-modello-e-piano.md).

### Spectra's voice

Without setting anything, Spectra speaks with your device's voice, the deepest
one it finds. If you have saved an **OpenAI key** among Spectra's keys, in the
console, in the guided lesson and in Spectra Studio he speaks with a deeper,
metallic voice, and the mouth follows the voice. In that case **the text
Spectra speaks is sent to OpenAI** to turn it into audio, even if you use
another service for the chat. If you do not want this, turn the voice off with
🔇: in the console, in the guided-lesson panel and in Spectra Studio's button
bar (which remembers the choice). Or do not save an OpenAI key.

### Spectra's face and mind

Spectra has a face: a 3D android (the «Noir» model by Skyfox13,
CC BY 4.0 licence, modified; the credit is at the bottom of the console).
In the console, since v242, you see it on Spectra's body, which takes the
place of the bust. The
mouth moves on the text he speaks, the head follows your gaze, and the
expression changes with what he says and what you tell him: 17 expressions,
from a smile to doubt. The eyes have the app's blue and change shade with the
emotion; the eyelids narrow in a smile, open wide in surprise and half close
when the question is hard. The eyes follow your finger or the mouse. If nobody
touches anything for two minutes, Spectra falls asleep; the first touch wakes
it. Without 3D graphics you see a simpler face.

Spectra remembers conversations and the time you spend in the sections, and
has an internal state (curiosity, attention, care, mood, bond) that changes the
tone of the greeting and the suggestions, for instance a break after an hour
and a half of study. **It is a simulation of behaviour, not consciousness**:
numbers and rules, not feelings. Everything stays on this device; say «what do
you remember» to see it and «forget everything» to erase it. When a question
goes to the artificial-intelligence service, a summary of this memory goes
with it.

### Spectra and its creator

Ask «who created you?» and Spectra answers: Samuele Pio Provenzano, the author
of BioSpecInfo. If you say «I am your creator», Spectra asks for proof: the
author's secret phrase, to be typed into the field, which becomes hidden like a
password (do not say it aloud). The phrase is not stored and does not enter the
conversation; after three wrong attempts you must wait a minute. Whoever passes
is greeted by name on that device, until they say «forget that I am your
creator» or erase the memory from «Clear data».

Like the File Manager password, this recognition is a **deterrent**: it tells
Spectra whom it is talking to, it protects nothing.

---

## The File Manager

A personal archive for photos, documents and HTML pages, protected by a
password.

> ⚠️ **Something you need to know.** This protection is a **deterrent**, not
> real security: whoever knows where to look can get around it. Do not put
> confidential documents in it.

The files stay on your device. **There is no copy anywhere else:** if you clear
your browser data or change phone, they are gone. Use the export for the things
you care about.

---

## Frequently asked questions

**Do I have to pay for anything?**
No. The app is free. If you use Spectra, the AI service's free key has daily
limits, but nothing is paid.

**Does it really work without internet?**
Yes, after the first opening. The only things left out are those that by their
nature have to ask someone else: searching molecules by name, 3D structures
downloaded on the spot, and Spectra.

**Are my notes saved somewhere?**
Only on your device. There is no server: nobody can read them, but nobody can
recover them for you either if you lose them.

**How do I delete my data?**
✨ menu → Settings → delete data. You can choose **what**: only the keys, only
the conversations, only the study data, or everything.

**I updated but I do not see anything new.**
✨ menu → **🔄 Updates** (*Aggiornamenti*) → **Check for updates** (*Controlla
aggiornamenti*). There you can also see which version you are running, and the
check always answers in one of three ways: *you already have the latest
version* (with the number), *new version available* (with the **Update now**
button), or *cannot check now*, if the site does not answer — the app keeps
working offline anyway.

**Can I trust the spectra for a report?**
For recognising functional groups and understanding the structure-spectrum
relationship, yes. For a figure to be cited as experimental, no: they are
predictions. The app sends you to the official databases (NIST, SDBS) with
direct links.

**I found an error in a chemical datum.**
Report it: open an *issue* on the
[GitHub repository](https://github.com/samupropio1-ship-it/BioSpecInfo-v11).
The data go through automatic checks, but no check finds everything.

---

## If something goes wrong

| Problem | What to try |
|---|---|
| The app does not open | Reload it. If it persists, ✨ menu → Updates → Check |
| I do not see the new features | The version is in the ✨ menu → Updates |
| Spectra does not answer | The **🔌 Test** button: it tells you which services you reach |
| "Out of space" | ✨ menu → Settings → delete the old conversations |
| A section stays empty | Check the network: some sections load data from the internet |
| The charts are blurred | Reload the page; the charts are redrawn at your screen's resolution |

---

## Contacts

**Author:** Samuele Pio Provenzano
**Repository and reports:**
[github.com/samupropio1-ship-it/BioSpecInfo-v11](https://github.com/samupropio1-ship-it/BioSpecInfo-v11)

---

_Guide updated to version `bsi-v251`._
