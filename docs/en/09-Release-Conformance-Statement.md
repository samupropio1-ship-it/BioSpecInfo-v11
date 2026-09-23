# Release Conformance Statement — BioSpecInfo

| Field | Value |
|-------|--------|
| **Software** | BioSpecInfo |
| **Version** | `bsi-v172` |
| **Author and release owner** | Samuele Pio Provenzano |
| **Repository** | `github.com/samupropio1-ship-it/BioSpecInfo-v11` |
| **Distribution** | GitHub Pages — `samupropio1-ship-it.github.io/BioSpecInfo-v11/` |
| **Nature of the software** | Client-side Progressive Web App, no backend |

---

## 1. Subject of this statement

The undersigned declares that version `bsi-v172` of BioSpecInfo has been put
through the verification procedure described in
[`02-Verification-Validation-Report.md`](02-Verification-Validation-Report.md)
and that the outcomes are those reported, without selection, in
[`../evidence/RAPPORTO-VERIFICA.md`](../evidence/RAPPORTO-VERIFICA.md) — a
document generated automatically by `tools/genera-evidenza.js`, which
transcribes the benches' output with no manual intervention.

This statement does **not** attest the absence of defects. It attests that:

1. an automated verification procedure exists and can be reproduced by third
   parties;
2. the outcome reported is the one actually produced, failures included;
3. the known limitations are declared explicitly and not presented as features.

---

## 2. Intended use and limitations

### 2.1 Declared purpose

BioSpecInfo is a **teaching and study-support** tool for chemistry,
biochemistry, pharmacology and astrochemistry. It is designed for university
students and for exam preparation.

### 2.2 What the software is NOT intended for

These exclusions are an integral part of this statement.

| Domain | Exclusion |
|---|---|
| **Clinical use** | It is not a medical device within the meaning of Regulation (EU) 2017/745. It does not support diagnosis, prescription, dosing or therapeutic decisions. The pharmacological data are for teaching purposes only, and the application says so at the head of the section. |
| **Certified analytical use** | The spectra are **predictions** from functional-group tables, not measurements nor quantum-mechanical simulations. They do not replace an experimental database (SDBS, NIST) nor an instrumental determination, and cannot be used for the formal identification of substances. |
| **Regulated GxP environment** | It is not validated for use in a GLP/GMP environment. The alignment with GAMP 5 described in `docs/03` is methodological, not a formal qualification. |
| **Access control** | The File Manager protects its contents with a client-side deterrent. On a static site there is no effective access control: whoever reads the source bypasses it. It must not be used for confidential material. |

---

## 3. Summary of verification outcomes

The full outcomes, with each bench's textual output, the execution environment,
the commit and the SHA-256 digests, are in
[`../evidence/RAPPORTO-VERIFICA.md`](../evidence/RAPPORTO-VERIFICA.md).

| Family | What it demonstrates |
|---|---|
| Scientific data | The chemical data are verified against an independent source |
| AI agent | The assistant stays usable when the external provider fails |
| Stability | The app withstands long sessions, exhausted storage, degraded networks |
| Interface | The panels respond as documented |
| Documentation/code consistency | What the documentation promises exists in the code |

---

## 4. Known deviations at the date of release

Listed in full. None has been removed from verification in order to make it
pass.

| # | Deviation | Impact | Treatment |
|---|---|---|---|
| **D-01** | **2 entries** (it was 6) that are not single molecules: Ivermectin, a mixture of B1a/B1b homologues, and Coartem, a combination of two active ingredients | For these two no 2D/3D representation and no spectral prediction is available | Entries left **without SMILES**: the pharmacological data remain, the structure is not shown. For Digoxin, Vincristine and Tacrolimus (topical and systemic) the structure was taken from **ChEMBL** and passes the comparison with the declared molecular weight: those four left the registry. The two that remain have no structure to show, not a missing one. |
| **D-02** | 19 entries with no SMILES by their very nature (monoclonal antibodies, peptides) | None: for those molecules SMILES notation is not the appropriate representation | Not a substantive deviation; listed for completeness |
| **D-03** | ~~SEC-02 verified only by proxy~~ — **remedied**: see S-10 | — | `audit_rete` observes the traffic during real use, with a canary value seeded into the user's own data |
| **D-04** | The File Manager password is present in the git history predating its removal | The deterrent is known to anyone consulting the history | Documented; the effective remedy is to change the password |
| **D-06** | Code coverage **measured but partial**: 49.79 % of statements, not branches | It is the coverage of the widest path a bench walks (87 sections plus the other pages), not of the whole battery; and an `if` entered from one side only counts as covered | `audit_copertura` measures it with Chromium's profiler, with no build and without rewriting the source. The value is **recorded**: if it falls, the battery fails |
| **D-07** | Verification on Chromium only | Firefox and WebKit are tested by hand | Declared in `docs/08` §8. In the verification environment the reason is checkable: the CDN from which `playwright-core` downloads the other engines answers **403** to the network policy, so Firefox and WebKit cannot be installed there |
| **D-08** | English translation covering 10 of the 16 documents | A non-Italian-speaking assessor reads 10 documents out of 16 | Declared here; the remaining ones are available in Italian. The translated set covers the whole due-diligence path: dossier, architecture, V&V, security, licences, AI agent, SBOM, traceability, this statement and the test documentation |
| **D-09** | Full WCAG 2.1 AA conformance not verifiable entirely by automation | What stays outside is text inside SVGs (8,888 elements), text over a real background **image** (108) and everything requiring human judgement. Text over a **gradient** has entered the measurement: 591 elements, judged against the worst stop of the gradient | The skipped elements are **counted** and reported on every run |

> ### Contrast, from 1,069 defects to zero — how it surfaced and how it was closed
>
> Up to version `bsi-v168` this document declared WCAG conformance "verified by
> sampling" and the bench reported **0 defects**. Those were two statements at
> once true and meaningless: the bench inspected only the **visible** elements,
> and `index.html` shows one section at a time. Out of 19,751 text elements it
> was looking at **41**.
>
> Walking all 87 sections, **1,069** contrast defects surfaced. They had not
> appeared: they had always been there.
>
> Today they are **zero**, measured over those same 87 sections with the same
> bench. Not by wholesale substitution — that road, attempted once, introduced
> 997 new defects — but by going back to the **common cause** every time and
> re-measuring after each change. The **40 unlabelled fields** have likewise
> fallen to **zero**.
>
> The gravest causes were not wrong colours but **theme tokens whose value
> equalled the background**:
>
> | Structural defect | Measured effect |
> |---|---|
> | `--g800` is `#0d1522`, **identical to `--bg`** — and the rule `a { color: var(--g800) }` applied it to every link | Every link without a colour of its own was at contrast **1:1**: invisible |
> | `--g700` is `#16263d`, nearly identical to `--white` (`#16273e`) | Text at **1.01:1** |
> | Buttons that changed their **background** without changing their **text colour** | The selected state (or the deselected one, depending on the panel) became unreadable: **1.39:1** |
> | `lightenColor(hex,pct){ return hex; }` | A function called "lighten" that returned the colour **unchanged**: an unfinished stub, in all likelihood written for this very problem |
> | The quiz answer panel: light background, light text | The student **could not read the correct answer** |
>
> The structural remedy was an explicit token — `--testo-forte` — for prominent
> text on a dark surface, applied only to the uses as a *text colour*: `--g800`
> and `--g700` stay where they serve as background or border.
>
> | Cause | Defects | Remedy |
> |---|---:|---|
> | A dark-theme safety net with higher specificity than the components: text meant for the **white** cards was forced to `#d4dce6`, contrast 1.38:1 | 159 | Rewritten with `:where()` (zero specificity): it protects text that has no colour of its own and stops fighting text that has one |
> | A per-category accent used as **text** on a dark header, with `#0d1522` (near-black) as fallback: 1.13:1 | ~400 | `bsiAccentoLeggibile()` preserves the hue and raises the lightness just enough. Applied at the 14 points where the accent is chosen — not in the data, so it holds for future entries too |
> | Two hues used only on dark backgrounds, just under threshold (3.75:1 and 3.04:1) | 139 | Replaced after **verifying** that they never appeared on a light background |
> | Table zebra striping white/near-black with always-light text: the white rows were unreadable | 57 | Two dark tones, consistent with the theme |
> | Periodic-table cells just under threshold (4.46:1 and 3.88:1) | 43 | Text at `#eceff4`, verified across all nine categories |
> | `"#var(--text)"` — one `#` too many makes the colour invalid: in SVG it falls back to black, on canvas the assignment is **ignored** and the previous colour persists | 8 places | Replaced with the real value |
>
> **The direction of the correction depends on the surface, not on the colour.**
> The first attempt always lightened: it removed thirty defects on the dark
> header and added eighteen on the light formula box that uses the same accent.
> The function now darkens on light backgrounds and lightens on dark ones.
>
> **The final tail: 80 → 0.** The last eighty were scattered over 33 distinct
> causes and looked like finishing work. They were not: three more structural
> causes lay underneath.
>
> | Final cause | Remedy |
> |---|---|
> | **The "automatic contrast corrector" was producing defects instead of removing them.** It used *perceived* brightness instead of WCAG luminance, so its thresholds corresponded to no real ratio; it **ignored alpha**, so `rgba(255,180,84,.08)` over a dark surface looked to it like a "light background" and it darkened the text to `#16273e` — **creating** a defect at 1.21:1 on top of a source that was already correct; and it looked only at elements carrying a background of **their own**, that is, never the commonest case | Rewritten: it walks the ancestors **compositing alpha** to obtain the effective background, measures the true WCAG ratio, and delegates the correction to `bsiAccentoLeggibile()` |
> | `--g900` is `#0d1522` — **the same as `--bg`**, exactly like `--g800`: the legacy of a greyscale born for the *light* theme, where `--g900` was "the darkest text". With the theme inverted, that role no longer exists | The uses as a **text colour** (30 rules today) move to `--testo-forte`; the 16 uses as a **background** stay where they are |
> | A colour chosen from data used as a **background** with the text hard-coded to `#fff`: it works while the hue is dark and stops as soon as someone adds `#e65100` | `bsiEtichettaLeggibile()` — the dual of the previous function: it picks the text by looking at the background and, if neither extreme suffices, **darkens the background while preserving the hue**, because a label must stay recognisable by colour |
>
> The steps as measured with the official bench, not estimated:
> **80 → 27 → 26 → 10 → 4 → 0**. Each step is a full re-measurement over the 87
> sections after a group of changes; none of the figures above is attributed to
> a single cause, because the causes were not measured one by one.
>
> The number remains **recorded as a baseline** in
> `evidence/accessibilita-riferimento.json`. Zero is not an achievement to file
> away: it is the value the bench defends. If a future change reintroduces even
> one defect, the battery **fails**.
>
> What stays outside automation is what automation cannot judge: text inside
> SVGs and text over gradient backgrounds (D-09). Those elements are **counted**
> and reported on every run, not passed over in silence.

---

## 4-bis. Deviations remedied in this version

They are listed because they concerned **the verification apparatus itself**,
and a conformance statement that says nothing about the defects of its own
evidence is not worth the paper it is written on.

| # | Deviation remedied | Why it mattered |
|---|---|---|
| **S-01** | 32 of the 39 benches were not in the repository: they lived in the working area of the session in which they had been written | It made **false** the sentence this whole document rests on — "anyone can re-run them". Whoever cloned the repository found 7 out of 39. They now live in `tools/banchi/` |
| **S-02** | A missing bench was counted but did not make the battery fail | A battery missing *all* its benches would have declared "CONFORMANT" with zero failures. A missing bench now makes the outcome **NON-CONFORMANT** |
| **S-03** | `package.json` and `package-lock.json` were excluded from the repository | `npm install`, the documented command for reproducing the evidence, installed nothing: the battery failed at the first bench with *Cannot find module* |
| **S-04** | The accessibility check inspected only the visible section | On `index.html` that meant one section out of 87. The "0 defects" held for the Dashboard, not for the application |
| **S-05** | `SCI-10` was defined twice in the matrix, and the coverage totals were wrong (36 declared out of 37 defined) | The first number an assessor reads was wrong. A bench now verifies it |
| **S-06** | 50 broken links out of 127 in the delivery packages | Documentation handed to third parties with references that led nowhere |
| **S-07** | 15 attachable PDFs stuck at documents 00-05 and at an earlier version | An obsolete attachment states false things with an air of authority |
| **S-08** | The numeric-claims bench looked at **the Italian documents only** | The English set drifted undisturbed: `docs/en/05` declared "84 sections" while the app has 87, and stayed stuck at version `bsi-v146` while the code was at 171. The English set is now compared against the measurement just like the Italian one, and a disagreement between the two languages fails the bench |
| **S-10** | SEC-02 — "no personal data leaves the device" — was verified by checking the two *mechanisms* of exit, not the exit | A check on mechanisms says "I cannot see how it would leave", which is not "it did not leave". `audit_rete` seeds an unrepeatable value into 71 stores of the user's data, then **uses** the application and inspects the URL, headers and body of every request. Proved in reverse with `BSI_PROVA_FUGA=1`, which causes a leak on purpose: the bench must fail, and it does |
| **S-11** | The deviations registry had no converse guard: an entry declared that **no longer deviates** simply stayed | An exemption nobody revokes is a permission left switched on, and tomorrow it would silently cover a wrong structure put in its place. The bench now fails for that too — verified by putting a remedied entry back |
| **S-09** | The "automatic contrast corrector" **created** the defects it was meant to remove | It ignored alpha: a `rgba(255,180,84,.08)` background over a dark surface looked light to it, and it darkened with `!important` a text that was already correct in the source. A remedy tool that worsens the thing it remedies is the hardest kind of defect to see, because it presents itself as the solution |

---

## 5. Acceptance criteria applied

A version is published only if **all** the following criteria are satisfied.

- [x] No non-network JavaScript error on any page
- [x] `tools/verifica-farmaci.js` — no defect; every deviation recorded
- [x] `verifica_guida` — no promise in the documentation without a counterpart in the code
- [x] No conflict marker in the tracked files
- [x] Service Worker cache version bumped and aligned with `BSI_APP_VERSION`
- [x] Known deviations listed in §4 of this document
- [x] Evidence report regenerated against the published commit
- [x] **No missing bench** — a bench that is not there is not a bench that passed
- [x] `tools/genera-pacchetti.js` closed with **0 broken links**
- [x] `tools/genera-pdf.js` re-run: the attachments describe this version

---

## 6. Change management

| Aspect | Procedure |
|---|---|
| **Traceability** | Every change goes through a pull request describing the defect, its cause and its verification |
| **Versioning** | The application version coincides with the Service Worker cache version (`bsi-vNNN`), incremented at every publication |
| **Distribution** | Automatic from `main` via GitHub Pages; the Service Worker signals the new version to open sessions without interrupting them |
| **Regression** | The full battery is re-run before every merge into `main` |
| **Reversibility** | Every version corresponds to a commit; rollback is a `git revert` |

---

## 7. Intellectual property and licences

All third-party components are distributed under **permissive** licences (MIT,
BSD-3-Clause, CC0, Public Domain), mutually compatible and free of strong
copyleft constraints. The full bill of materials, with digests and residual
obligations, is in [`07-SBOM.md`](07-SBOM.md) and in CycloneDX format at
[`../evidence/sbom.cdx.json`](../evidence/sbom.cdx.json).

The code written for this project is the author's own work.

---

## 8. Data handling

The application is **local-first**: there is no backend, no personal data is
collected and no persistent identifier is present. Data generated by the user
(notes, chats, API keys, uploaded files) stay in the device's `localStorage` and
IndexedDB and can be deleted selectively from the interface itself.

Network calls are optional and go to documented public services (§4 of
`07-SBOM.md`). If the user configures the proxy, the API keys reside on a Worker
they own and not on the device.

Details in [`03-Security-Privacy-Compliance.md`](03-Security-Privacy-Compliance.md).

---

## 9. Signature

This document is drawn up by the author of the software, who takes
responsibility for it. It does not constitute certification by a third-party
body, and is not presented as such.

Anyone can verify what is declared here by re-running the procedure in §5 of
[`../evidence/RAPPORTO-VERIFICA.md`](../evidence/RAPPORTO-VERIFICA.md) against
the commit indicated, and comparing the SHA-256 digests of the files.

**Samuele Pio Provenzano**
_Version `bsi-v172`._
