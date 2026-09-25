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
| **Section menu** | Navigation bar | The 88 sections, grouped by subject |
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

### Studying with cards

1. Open the study section
2. Generate a deck of cards
3. For each card, after answering, say how well you remembered it

The app works out **when** to show it to you again: the things you know well
come back rarely, the uncertain ones come back soon. When you reopen, you only
find the cards that are due.

### Looking up a drug

Open **Pharmacology**. For each of the 178 drugs you will find the structure,
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

_Guide updated to version `bsi-v174`._
