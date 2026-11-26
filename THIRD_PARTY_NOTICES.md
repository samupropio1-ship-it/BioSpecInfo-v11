# Third-Party Notices — BioSpecInfo

BioSpecInfo includes the following third-party open-source components. The
original copyright notices are reproduced below as required by their licenses.
Almost all are **permissive**; the one exception is the built-in offline voice
(**meSpeak / eSpeak**), which is under the **GPL-3.0** strong-copyleft license.
That license applies **only to that component** — used as a separate library
through its public interface — and its full text is in
[`vendor/mespeak/COPYING-GPL-3.0.txt`](vendor/mespeak/COPYING-GPL-3.0.txt), with
a note in [`vendor/mespeak/NOTICE.md`](vendor/mespeak/NOTICE.md).

This file lists **only third-party components**. The proprietary BioSpecInfo
code is covered by the project [`LICENSE`](LICENSE) ("All rights reserved").

| Component | File(s) | License | Copyright holder |
|-----------|---------|---------|------------------|
| RDKit (MinimalLib / rdkit-js) | `RDKit_minimal.js`, `RDKit_minimal.wasm` | BSD-3-Clause | Greg Landrum & the RDKit contributors |
| 3Dmol.js | `3Dmol-min.js` | BSD-3-Clause | David Koes / University of Pittsburgh & 3Dmol.js authors |
| three.js | `three.min.js`, `three_bloom.js`, `gltf_loader.js` | MIT | three.js authors |
| SmilesDrawer | `smiles-drawer.min.js` | MIT | Daniel Probst & contributors |
| sql.js (SQLite → WASM) | `lib/sql-wasm.js`, `lib/sql-wasm.wasm` | MIT | sql.js authors; SQLite is public domain |
| PDF.js | `vendor/pdfjs/pdf.min.mjs`, `vendor/pdfjs/pdf.worker.min.mjs`, `vendor/pdfjs/standard_fonts/` | Apache-2.0 | Mozilla Foundation & PDF.js contributors |
| «Noir» 3D model (Spectra's face) | `models/spectra-noir.glb` | CC BY 4.0 | Skyfox13 (Sketchfab) |
| «Bounty Hunter» 3D model (Spectra's body), embedded as a packed block | `models/spectra-corpo.bsi` | CGTrader Royalty Free | Its author on CGTrader (name not present in the file) |
| meSpeak.js + eSpeak (built-in offline voice) | `vendor/mespeak/mespeak-bundle.js`, `vendor/mespeak/mespeak_config.json`, `vendor/mespeak/voices/*.json` | **GPL-3.0** | Norbert Landsteiner (meSpeak, masswerk.at); eSpeak authors |

> The exact version of each library is the one bundled in this repository.

---

## 1. RDKit — BSD-3-Clause

```
Copyright (c) Greg Landrum and the RDKit contributors.
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice,
    this list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation
    and/or other materials provided with the distribution.
  * Neither the name of the copyright holders nor the names of its
    contributors may be used to endorse or promote products derived from this
    software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES ARE DISCLAIMED. IN NO EVENT SHALL THE
COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE.
```

## 2. 3Dmol.js — BSD-3-Clause

```
Copyright (c) 2014, University of Pittsburgh and contributors (3Dmol.js).
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the conditions of the BSD 3-Clause
License are met (retention of the copyright notice and disclaimer; no use of the
names of the copyright holders to endorse derived products without permission).

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
```

## 3. three.js — MIT

```
Copyright © 2010-2024 three.js authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 4. SmilesDrawer — MIT

```
Copyright (c) 2018 Daniel Probst and contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction ... (MIT License; full text as in §3).

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
```

## 5. sql.js — MIT (SQLite: public domain)

```
Copyright (c) 2017 sql.js authors

Permission is hereby granted, free of charge, ... (MIT License; full text as
in §3).

sql.js embeds SQLite, which is released into the public domain by its authors.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
```

---

_For the authoritative and complete license text of each project, refer to the
respective upstream repository. The notices above are reproduced to satisfy the
attribution requirements of the permissive licenses._

---

## PDF.js — Apache-2.0

Copyright 2012 Mozilla Foundation

Licensed under the Apache License, Version 2.0 (the "License"); you may not
use these files except in compliance with the License. You may obtain a copy
of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
License for the specific language governing permissions and limitations under
the License.

The full licence text as shipped by the project is kept verbatim in
`vendor/pdfjs/LICENSE`.

> **Which build, and why the legacy one.** The bundled files come from the
> `legacy/` build of `pdfjs-dist`. The default build uses very recent language
> features (`Map.prototype.getOrInsertComputed` among them) and throws on
> browsers that do not have them yet — including the Chromium the verification
> battery runs on. The legacy build is the one meant for wider support, and a
> PWA that has to open on a three-year-old phone needs it.

---

## «Noir» 3D model — CC BY 4.0

```
"Noir" by Skyfox13 (https://sketchfab.com/podderkuntal25), published on
Sketchfab: https://sketchfab.com/3d-models/noir-8edf174437494f0080b4cd5aa0f0509c
Licensed under Creative Commons Attribution 4.0 International (CC BY 4.0):
https://creativecommons.org/licenses/by/4.0/
```

The model has been **modified**: textures recompressed, tangents removed, the
face rendered as dark grey metal, head and mouth animated by
`bsi-spectra-androide.js`. The attribution is also shown in the Spectra Live
console.

---

## «Bounty Hunter» 3D model — CGTrader Royalty Free

Spectra's body is the «Bounty Hunter» model, downloaded free of charge from
CGTrader under the CGTrader Royalty Free licence, which allows using the model
inside a product but not offering it as a standalone file. It is therefore
embedded in the app as a packed block (`models/spectra-corpo.bsi`, produced by
`tools/impacchetta-corpo.js`) that only the app's code reopens; the original
`.glb` is not in the repository. The author's name is not present in the file.
The model has been **modified** in the browser: automatic rig, hood, night-blue
recolouring, the «Noir» face on the collar. See `models/CREDITS.md`.


---

## meSpeak.js + eSpeak — GPL-3.0 (built-in offline voice)

Spectra's built-in voice uses **meSpeak.js**, a JavaScript wrapper by
**Norbert Landsteiner** (masswerk.at) over **eSpeak**, a formant text-to-speech
engine compiled to JavaScript/asm.js. It is used as a fallback so that Spectra
can speak on devices that have **no system TTS voice**, generating a WAV that is
played through the Web Audio API — with nothing to install and no external
service.

```
meSpeak.js — Copyright (C) Norbert Landsteiner (masswerk.at)
eSpeak     — Copyright (C) Jonathan Duddington and the eSpeak authors

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU General Public License as published by the Free Software
Foundation, either version 3 of the License, or (at your option) any later
version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY
WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
PARTICULAR PURPOSE. See the GNU General Public License for more details.
```

- Full licence text: [`vendor/mespeak/COPYING-GPL-3.0.txt`](vendor/mespeak/COPYING-GPL-3.0.txt)
- Component note and sources: [`vendor/mespeak/NOTICE.md`](vendor/mespeak/NOTICE.md)
- Upstream: meSpeak — http://www.masswerk.at/mespeak/ · eSpeak — https://espeak.sourceforge.net/
- The engine (`ESpeak.js`) and the wrapper (`mespeak.js`) were **not modified**:
  they are only concatenated, as-is, into `mespeak-bundle.js` so they load as a
  single browser script. That file is the component's distributed source form.

**This GPL-3.0 component stays under the GPL on redistribution.** It is invoked
only through its public API (`loadConfig` / `loadVoice` / `speak`) as a separate
library; the rest of BioSpecInfo remains under the project [`LICENSE`](LICENSE).
