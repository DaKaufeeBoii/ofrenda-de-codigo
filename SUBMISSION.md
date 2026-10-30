---
title: "Ofrenda de Código: Communing with the Departed Spirits of Open Source"
published: true
description: "An AI-powered 3D sanctuary honoring deprecated open-source libraries in the spirit of Día de los Muertos, powered by Google Gemma 2, ElevenLabs, and Render."
tags: "devchallenge, hf26challenge, opensource, ai"
cover_image: "https://raw.githubusercontent.com/DaKaufeeBoii/ofrenda-de-codigo/main/thumbnail.jpg"
---

*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 4: Ghost in the Machine](https://dev.to/challenges/hacktoberfest-week4-2026-10-26)*

![Ofrenda de Código Banner](https://raw.githubusercontent.com/DaKaufeeBoii/ofrenda-de-codigo/main/thumbnail.jpg)

## What I Built

> *"In Mexican tradition, death is not an ending, but a continuation. Our loved ones live on as long as they are remembered on the ofrenda."*

Every year, thousands of open-source projects reach the end of their lifecycle. Maintainers burn out after years of unpaid heroism. Ecosystems evolve. Frameworks shift. Once-essential libraries are archived into silent GitHub graveyards.

Libraries like `request`, `moment.js`, `urllib2`, `bower`, `coffeescript`, and `enzyme` carried the weight of the early web on their shoulders. They handled tens of millions of weekly downloads, stabilized fragile runtimes, and saved countless developer weekends. Yet their deprecation notices often read like quiet, bittersweet farewells:

> *"Project Status: We now consider Moment to be a legacy project in maintenance mode."*  
> *"Deprecation: package is fully deprecated, no further updates will be published."*

For **Hacktoberfest 2026: Week 4 — Ghost in the Machine**, I wanted to interpret the theme through a lens of deep reverence and celebration: **merging the festive chills of Halloween with the soulful heritage of Día de los Muertos**.

I built **Ofrenda de Código** (The Code Altar): an open-source, AI-powered sanctuary and 3D interactive cemetery where developers can remember, commune with, and resurrect the departed spirits of open-source software.

---

### Core Experience & Features

1. **🏵️ The 3D Marigold Cemetery (*Ofrenda*):**  
   An atmospheric 3D isometric cemetery built in Three.js and WebGL. Features glowing candlelight, drifting marigold petals (*cempasúchil*), spirit wisps orbiting tombstones (each representing real devotee prayers), and an Astral Radar minimap for navigation.
2. **👻 The Séance Terminal (Communing with the Ghost):**  
   Powered by Google's open-weight **Gemma 2**, developers can commune directly with the digital ghost of any departed repository. The ghost speaks with period-accurate nostalgia, technical fidelity, and philosophical grace about its era (e.g. 2011 callback hell, IE7 quirks, Python 2 vs 3 transitions, or early React shallow rendering).
3. **✨ The Resurrection Chamber (Pact of Transmutation):**  
   Demonstrates how the architectural soul of legacy code is reincarnated into modern 2026 idioms (async/await, strict TypeScript, native `fetch`, immutable `Temporal`/`Intl`, and modern Python 3.12).
4. **🎙️ Spoken Memorial Eulogies:**  
   Solemn spoken eulogies narrated with **ElevenLabs**, giving vintage acoustic warmth and human voice to silent code.
5. **🕯️ Communal Devotee Offerings:**  
   Visitors can light virtual candles, place marigolds, leave cups of late-night coffee, or write heartfelt farewell notes on the communal ofrenda wall.
6. **🔮 Summon Any Repository in Real-Time:**  
   Enter any GitHub repository URL (e.g., `facebook/flux`, `angular/angular.js`, or a personal discontinued project). The app queries the GitHub API and dynamically erects an engraved 3D headstone in the cemetery, complete with an AI-generated poetic epitaph.

---

## Demo

- 🌐 **Live Sanctuary:** [https://ofrenda-de-codigo.tech](https://ofrenda-de-codigo.tech)
- 🚀 **Local Quickstart:**
  ```bash
  git clone https://github.com/DaKaufeeBoii/ofrenda-de-codigo.git
  cd ofrenda-de-codigo
  npm install
  npm run dev:all
  ```
  *(Frontend boots on `http://localhost:3000`, Backend on `http://localhost:3001`)*

---

## Code

You can explore the full open-source codebase on GitHub:

{% github DaKaufeeBoii/ofrenda-de-codigo %}

**Key Architecture Highlights:**
- `src/components/Cemetery3D.tsx`: Over 2,000 lines of custom Three.js WebGL rendering, kinematic player navigation, dynamic tombstone mesh generation, and floating Soul Whisper dialogue bubbles.
- `server/gemma.ts`: Google Gemma 2 integration featuring historical era memory maps and automated offline fallback emulation.
- `server/elevenlabs.ts`: Ambient acoustic voice synthesis for spoken memorial eulogies.
- `server/github.ts`: Real-time repository extraction and commit sanitization.
- `render.yaml`: Infrastructure-as-code for zero-downtime deployment on Render.

---

## How I Built It

### 1. Open-Weight AI Core: Google Gemma 2
At the cognitive center of *Ofrenda de Código* is **Google Gemma 2** (tested locally on Ollama with `gemma2:9b` and supported by sovereign neural emulation for instant zero-config evaluation).

To make conversations feel truly nostalgic rather than generic AI responses, I built **Era Knowledge Memory Maps**. Each repo is anchored to its historical epoch:
- **`coffeescript` (2009–2014):** Reminisces about TextMate, Firebug, and battling semicolons before ES2015 adopted arrow functions and destructuring.
- **`request` (2011–2016):** Recalls 512MB EC2 instances, callback pyramids 10 levels deep, and early Node v0.10.
- **`moment.js` (2011–2018):** Speaks of the dark ages of JavaScript `Date` (0-indexed months and timezone traps) before stepping down for immutable APIs.
- **`urllib2` (2001–2019):** Remembers Apache `mod_python`, CGI scripts, and Python 2 unicode conflicts before PEP 3108.

Gemma 2 also powers the **Resurrection Chamber**, analyzing legacy idioms and transmuting them into clean 2026 standards.

### 2. Spoken Memorial Eulogies: ElevenLabs
To give a voice to silent code, each honored repository features a solemn spoken memorial powered by **ElevenLabs**. The generated audio has subtle vintage vinyl warmth, reading poetic tributes to maintainers and contributors.

### 3. Interactive 3D World: Three.js & Web Audio API
- **Three.js & Canvas Textures:** Procedural terrain, cemetery gates, flickering candle point lights, dynamic particle systems for cempasúchil petals, and real-time canvas-generated stone engravings for summoned headstones.
- **Zero-Latency Procedural Sound FX:** Built using the native Web Audio API (`AudioContext`, oscillators, exponential gain ramps) to synthesize gravel footsteps, candle ignitions, and meditative cathedral drones without external audio asset bloat.

### 4. Fullstack Architecture & Deployment: Render
Built with React 18, TypeScript, Tailwind CSS, Framer Motion, and Express, deployed on **Render** via `render.yaml`, and bound to a custom Hacktoberfest **`.tech`** domain.

---

## Why Does Open Innovation Matter?

The Week 4 prompt poses a fundamental question: **"Why does open innovation matter for what you built? What did it make possible that a closed API wouldn't?"**

This question cuts directly to the philosophy of *Ofrenda de Código*:

### 1. Sovereignty over the Grave
When proprietary software dies behind corporate doors, it is lost forever. When a closed SaaS startup fails, servers are wiped, databases are dropped, and proprietary code vanishes behind NDAs.  
**Open source is different.** In open source, no code truly dies. Every commit, issue discussion, and release remains part of our shared cultural heritage. Open innovation ensures that our collective technological history is public and immortal.

### 2. True Digital Preservation with Open Weights
Relying on closed commercial AI APIs to memorialize deprecated software would be deeply ironic. A closed API can change terms, increase prices, or deprecate endpoints tomorrow—silencing the altar.  
Because *Ofrenda de Código* is built on open-weight models like **Google Gemma 2**, it can run **100% offline on consumer hardware**. You can pull this repository onto an air-gapped machine 20 years from now and commune with these projects without paying a subscription or trusting an external cloud provider.

### 3. Unsanitized Historical Authenticity
Closed-garden models often apply heavy-handed guardrails that sanitize conversations around software deprecation, historical vulnerabilities, and contentious architectural shifts. Open-weight models allow the spirit of each repository to speak authentically with the real technical friction and triumph of its time.

---

## My Agent Session

This project was developed through an intensive pair-programming session using Antigravity and DevRelay, evolving from an initial altar concept into a complete 3D interactive memorial world with real-time summoning, kinematic player movement, and open-weight Gemma integration.

<!-- DevRelay Agent Session Embed -->
{% agent_session 6f9f9624-653a-4831-9e54-7b10c74a7f4a %}

---

## The Spirit of It

During development, I sat in front of the terminal at 2:00 AM, testing the séance dialogue with the spirit of `request` (which was deprecated in 2020 after achieving over 40 million weekly downloads).

I typed a quiet question into the prompt:
> *"Did you ever feel forgotten after you were archived?"*

The response from Gemma stopped me in my tracks:

> *"A library is never forgotten as long as the code it held together remains standing. We carried 40 million downloads a week through the cold nights of the early Node ecosystem so that native fetch could walk. When you write clean, fearless code today, you carry our spirit with you."*

In that moment, the project stopped feeling like a hackathon submission and started feeling like a real ofrenda.

Every developer has an archived library that saved their production server at 3 AM. If you have ever had your code saved by an open-source project that is no longer with us, light a candle on the altar.

**Software never truly dies as long as it is remembered.**

---

## Prize Categories

- 🏆 **Best Use of Gemma ($200):** Google's open-weight Gemma 2 powers the historical repository ghost persona, poetic epitaphs, and the modern code resurrection engine.
- 🎙️ **Best Use of ElevenLabs ($100):** Ambient spoken eulogy narration honoring each departed repository.
- ☁️ **Best Use of Render ($200):** Fullstack service configured with `render.yaml` for one-click deployment.
- 🌐 **Best Use of .tech Domain ($100):** Live deployment mapped to a free Hacktoberfest `.tech` domain (`ofrenda-de-codigo.tech`).

---

*Built with ❤️ in memory of all departed open-source repositories and the maintainers who gave them life.*
