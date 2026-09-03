<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=0,8B00FF,4B0082,0070F3,00E676,FFEA00,FF7700,FF0055&height=220&section=header&text=PROJECT%20VAKTA%20%28वक्ता%29&fontSize=42&fontColor=ffffff&fontAlignY=38&desc=Airborne%20Data-over-Sound%20Transceiver%20•%20Liquid%20Glass%20%26%20VIBGYOR%20Theme&descAlignY=58&descSize=16" width="100%" alt="Project Vakta Header" />
</p>

<p align="center">
  <a href="https://nakulkundra.github.io/Project-Vakta/">
    <img src="https://img.shields.io/badge/🌐_LIVE_DEMO-GITHUB_PAGES-00E676?style=for-the-badge&labelColor=080D1A" alt="Live Demo" />
  </a>
  <a href="https://github.com/nakulkundra/Project-Vakta">
    <img src="https://img.shields.io/badge/📦_REPO-Project--Vakta-0070F3?style=for-the-badge&labelColor=080D1A" alt="GitHub Repo" />
  </a>
  <img src="https://img.shields.io/badge/THEME-LIQUID_GLASS_%26_VIBGYOR-8B00FF?style=for-the-badge&labelColor=080D1A" alt="Theme" />
  <img src="https://img.shields.io/badge/DSP-16--FSK_%2B_CRC8-FF7700?style=for-the-badge&labelColor=080D1A" alt="DSP" />
</p>

<p align="center">
  <strong>An acoustic data transmission engine running entirely in the browser using the native Web Audio API.</strong><br>
  <em>Zero RF (no Wi-Fi, no Bluetooth, no NFC). Zero pairing friction. 100% physical-layer contained.</em>
</p>

---

## 🌈 The Subtle Liquid Glass & VIBGYOR Design

Project Vakta features an understated, dark-mode **Liquid Glass** architecture framed by delicate, luminous **VIBGYOR borders**:

* 🪞 **Frosted Liquid Glass Surfaces:** Translucent dark obsidian glass (`backdrop-filter: blur(28px) saturate(180%)`) with delicate inner specular light and beveled refractions.
* 🌈 **Subtle VIBGYOR Glow Borders:** Clean, non-distracting 1px gradient borders spanning the 7 spectral hues (**V**iolet, **I**ndigo, **B**lue, **G**reen, **Y**ellow, **O**range, **R**ed), providing a soft ambient luminescence without loud or flashy fills.
* 🌌 **Pure Dark Mode Void:** Deep cosmic black backdrop (`#040711`) with subtle, ambient atmospheric glow that highlights the glassware boundaries.

| Color | Spectrum | Hex Code | Border & Diagnostic Role |
| :---: | :---: | :---: | :--- |
| 🟣 | **V** - Violet | `#8B00FF` | Outer frame boundary & low-frequency anchor |
| 🔮 | **I** - Indigo | `#4B0082` | Subtle glass edge refraction |
| 🔷 | **B** - Blue | `#0070F3` | Active listening & state focus illumination |
| 🟢 | **G** - Green | `#00E676` | CRC-8 Verified packet glow & Ready indicators |
| 🟡 | **Y** - Yellow | `#FFEA00` | Preamble Tone A frequency marker |
| 🟠 | **O** - Orange | `#FF7700` | Preamble Tone B frequency marker |
| 🔴 | **R** - Red | `#FF0055` | High-frequency spectrum ceiling |

---

## ⚡ Live Demo (Zero Install)

Launch the acoustic transceiver directly on any smartphone, tablet, or laptop browser:

👉 **[https://nakulkundra.github.io/Project-Vakta/](https://nakulkundra.github.io/Project-Vakta/)**

> [!TIP]
> Open the link on your **phone** in *Receiver Only* mode, and open it on your **laptop** in *Transmitter Only* mode. Type a message on the laptop and hit **Transmit** — your phone decodes the acoustic sound waves right through the air!

---

## 🔬 Acoustic Architecture & Modulation (16-FSK)

Inspired by research highlighted by the IEEE on ultrasonic machine-to-machine connectivity (e.g., Sonarax, Stimshop), Project Vakta implements an airborne acoustic PHY layer:

```
[ Plaintext Input ]
         │
         ▼
[ UTF-8 Byte Array ]
         │
         ▼
[ Packet Assembler: Length (1B) + Payload (NB) + CRC-8 (1B) ]
         │
         ▼
[ Nibble Splitting (Each byte ➔ 2x 4-bit nibbles: 0x0 - 0xF) ]
         │
         ▼
[ 16-FSK Modulation: f = f_base + (nibble × f_step) ]
         │
         ▼
[ Preamble Handshake (Tone A ↔ Tone B) + Cosine Envelope Ramping ]
         │
         ▼
[ Web Audio API OscillatorNode ➔ Speakers ]
         │
         ░░░░░░░░ Airborne Acoustic Waves (Air Channel) ░░░░░░░░
         │
         ▼
[ Microphone (getUserMedia with native DSP disabled) ]
         │
         ▼
[ 4096-Point FFT Spectrum Analysis (AnalyserNode) ]
         │
         ▼
[ Dual Pilot Tone Preamble Lock ➔ Clock Recovery ]
         │
         ▼
[ Center-of-Symbol Peak Energy Sampler ]
         │
         ▼
[ Nibble Reconstruction ➔ CRC-8 Polynomial 0x07 Verification ]
         │
         ▼
[ Verified Decoded Message Rendered on UI ]
```

---

## 📡 Dual Operating Profiles

Project Vakta supports two frequency configurations switchable on the fly:

### 1. 🔊 Audible Robust (1.5 kHz – 3.0 kHz) — Recommended
* **Preamble Tones:** $1400\text{ Hz}$ & $1550\text{ Hz}$
* **Data Frequencies:** 16 discrete bins from $1700\text{ Hz}$ to $2900\text{ Hz}$ ($\Delta f = 80\text{ Hz}$)
* **Characteristics:** 100% foolproof across low-cost laptop speakers, phone microphones, and monitors. Immune to low-frequency room rumble.

### 2. 🦇 Near-Ultrasound Silent (18.0 kHz – 20.0 kHz)
* **Preamble Tones:** $17.5\text{ kHz}$ & $17.85\text{ kHz}$
* **Data Frequencies:** 16 discrete bins from $18.2\text{ kHz}$ to $19.7\text{ kHz}$ ($\Delta f = 100\text{ Hz}$)
* **Characteristics:** Inaudible to adult human ears. Demonstrates silent ultrasonic device-to-device communication without RF.

---

## 💻 Local Quickstart

### Prerequisites
* Python 3.x installed (for local server serving with secure context).

### 1. Clone the Repository
```bash
git clone https://github.com/nakulkundra/Project-Vakta.git
cd Project-Vakta
```

### 2. Run the Server
On Windows, double click [`run.bat`](run.bat) or execute:
```bash
python server.py
```

### 3. Open in Browser
* **Same Machine (Loopback test):** Navigate to [http://localhost:8080](http://localhost:8080)
* **Across Two Machines on Wi-Fi:** Navigate to `http://<your-lan-ip>:8080`

---

## 📁 Repository Structure

```
Project-Vakta/
├── index.html        # Liquid Glass & VIBGYOR UI with split/single role layouts
├── vakta-core.js     # DSP Engine: 16-FSK Modulator/Demodulator & CRC-8
├── app.js            # UI Controller & Live VIBGYOR FFT Spectrum Visualizer
├── server.py         # Zero-dependency local dev server with auto LAN IP
├── run.bat           # 1-Click Windows batch launcher
├── .gitignore        # Clean Git repository ignore rules
└── README.md         # Full project documentation & technical specs
```

---

## 🛡️ Security & Privacy Advantages of Sound

* **Physical Perimeter Containment:** Sound waves do not penetrate thick walls or closed doors, eliminating eavesdropping risks from outside a room.
* **No RF Footprint:** Operates in radio-restricted environments (e.g., explosive ATEX zones, hospital operating rooms, aircraft cabins).
* **Zero Trust Transport:** Payloads can be encrypted client-side with AES-GCM before modulation; the acoustic channel acts solely as a zero-setup physical transport.

---

<p align="center">
  <sub>Project Vakta • Built with Web Audio API & HTML5 • Created by Nakul Kundra</sub>
</p>
