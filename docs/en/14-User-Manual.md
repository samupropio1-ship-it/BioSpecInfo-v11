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
| **Section menu** | Navigation bar | The 96 sections, grouped by subject |
| **✨** | Bottom right | Tools, settings and updates |
| **Spectra** | Bottom right | The assistant that answers questions |

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

### 🎮 The Element Run

A retro platformer, in its own section. The power-ups are not flowers: they are
**periodic table elements**, and each one transforms you with an ability that
comes from its chemistry.

| element | what it gives you | why |
|---|---|---|
| **H** | you jump higher | the lightest there is |
| **He** | you fall slowly | noble gas lighter than air |
| **C** | four shots in a fan | four bonds |
| **F** | the hardest shot | the most electronegative |
| **Al** | you take one hit | it passivates with its own oxide |
| **Fe** | you smash through falling | heavy and ferromagnetic |
| **Hg** | you run | liquid metal |
| **Au** | oxidising enemies cannot touch you | it does not oxidise |

…and twelve more. Name and atomic number are read from **this application's
periodic table**: they are not rewritten in the game.

**Twelve levels** in four zones, a **boss** at the end of each zone and the
**final boss** at the twelfth. Levels are generated at random every run, but
never impassable: no gap wider than a jump covers, no step higher than a jump
clears — and before every boss you are guaranteed a shooting element, because a
boss without one would be invincible.

**Controls**: `◀ ▶` move, `⤒` jumps (hold it to jump higher), `✦` uses the
element's ability. Keyboard: arrows or `A/D`, space jumps, `K` acts. Jumping
**on** an enemy squashes it.

**The five difficulties** have chemistry names, and they are not decorative —
they say how reactive the system is:

| difficulty | what changes |
|---|---|
| **Dilute solution** | 5 lives, everything slow, basic questions |
| **Saturated solution** | 4 lives, more enemies and more power-ups |
| **Exothermic reaction** | 3 lives, and **a wrong answer costs** |
| **Enzymatic catalysis** | 2 lives, everything faster, 25 s to answer |
| **Nuclear fusion** | **one life**, fierce enemies, 20 s to answer |

**At the checkpoints** (the flags) a chemistry question arrives. The difficulty
does not make the same question harder: it changes **which** questions come —
from an element's symbol to the right retrosynthetic disconnection for a target,
by way of IR bands, ¹H and ¹³C shifts, J constants, degrees of unsaturation,
masses, reactions, amino acids and chemical languages.

> **The questions are not written in the game.** They are **generated** from
> this application's tables, and after each answer I tell you **where** that
> question comes from. If the table is right, the question is right — and there
> is no second list of chemistry that could diverge from the real ones.

**It works offline**: there is not a single file to download — the graphics are
drawn as rectangles and the sounds are synthesised.

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
2. Open Spectra, paste the key into the 🔑 box
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
✨ menu → **Updates** → *Check*. There you can also see which version you are
running.

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

_Guide updated to version `bsi-v211`._
