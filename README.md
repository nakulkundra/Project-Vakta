<p align="center">
  <img src="assets/banner.svg" width="100%" alt="Project Vakta - Liquid Glass & Subtle VIBGYOR Borders" />
</p>

<p align="center">
  <a href="https://nakulkundra.github.io/Project-Vakta/">
    <img src="https://img.shields.io/badge/🌐_Live_Demo-GitHub_Pages-00E676?style=for-the-badge&labelColor=080D1A" alt="Live Demo" />
  </a>
  <a href="https://github.com/nakulkundra/Project-Vakta">
    <img src="https://img.shields.io/badge/📦_Repo-Project--Vakta-0070F3?style=for-the-badge&labelColor=080D1A" alt="GitHub Repo" />
  </a>
  <img src="https://img.shields.io/badge/Aesthetic-Liquid_Glass-8B00FF?style=for-the-badge&labelColor=080D1A" alt="Theme" />
  <img src="https://img.shields.io/badge/Accents-Subtle_VIBGYOR_Borders-FF7700?style=for-the-badge&labelColor=080D1A" alt="Borders" />
</p>

<p align="center">
  <strong>An acoustic machine-to-machine (M2M) transceiver running entirely in the browser using the Web Audio API.</strong><br>
  <em>Zero RF (no Wi-Fi, Bluetooth, or NFC). Zero pairing friction. 100% physical-layer contained.</em>
</p>

---

## 🪞 The Liquid Glass & Subtle VIBGYOR Design System

Project Vakta's user interface is crafted using a dark-mode **Liquid Glass** architecture outlined by delicate, luminous **VIBGYOR borders**:

* 🌌 **Pure Dark Mode Void:** Grounded in a deep cosmic base (`#040711`) with low-opacity (`0.10 - 0.15`), heavily diffused atmospheric orbs (`blur: 120px`) providing gentle studio back-lighting.
* 🪞 **Frosted Glass Substrates:** Cards, inputs, and button surfaces utilize multi-layer frosted translucency (`rgba(11, 18, 34, 0.65)` with `backdrop-filter: blur(28px) saturate(180%)`) with specular top reflections (`inset 0 1px 1px rgba(255, 255, 255, 0.16)`).
* 🌈 **Subtle VIBGYOR Borders Only:** The full 7-color spectral sequence (**V**iolet, **I**ndigo, **B**lue, **G**reen, **Y**ellow, **O**range, **R**ed) is applied **strictly as crisp 1px borders with a soft ambient luminescence**—completely avoiding loud or oversaturated background fills:

```css
/* Pixel-perfect Liquid Glass with Subtle VIBGYOR Border */
.card, .btn, .info-bar {
  background: linear-gradient(rgba(11, 18, 34, 0.65), rgba(11, 18, 34, 0.65)) padding-box,
              linear-gradient(135deg, 
                rgba(139, 0, 255, 0.45) 0%,   /* Violet */
                rgba(75, 0, 130, 0.40) 16.6%, /* Indigo */
                rgba(0, 112, 243, 0.45) 33.3%, /* Blue   */
                rgba(0, 230, 118, 0.45) 50.0%, /* Green  */
                rgba(255, 234, 0, 0.42) 66.6%, /* Yellow */
                rgba(255, 119, 0, 0.42) 83.3%, /* Orange */
                rgba(255, 0, 85, 0.45) 100.0%  /* Red    */
              ) border-box;
  border: 1px solid transparent;
  backdrop-filter: blur(28px) saturate(180%);
  box-shadow: 0 18px 45px -10px rgba(0, 0, 0, 0.8), 
              0 0 16px rgba(0, 112, 243, 0.06), 
              inset 0 1px 1px rgba(255, 255, 255, 0.16);
}
```

---

## 🎨 VIBGYOR Functional Border Mapping

Each of the 7 spectral hues serves a specific functional and diagnostic role:

| Color | Spectrum | Hex Code | System & Border Role |
| :---: | :---: | :---: | :--- |
| 🟣 | **V** - Violet | `#8B00FF` | Base frame anchor & Low-frequency detection boundary |
| 🔮 | **I** - Indigo | `#4B0082` | Subtle glass edge refraction & Secondary pilot tone marker |
| 🔷 | **B** - Blue | `#0070F3` | Listening state indicator & Active selection focus border |
| 🟢 | **G** - Green | `#00E676` | CRC-8 Verified packet border glow & Receiver Ready |
| 🟡 | **Y** - Yellow | `#FFEA00` | Preamble Pilot Tone A marker & Symbol decoding state |
| 🟠 | **O** - Orange | `#FF7700` | Preamble Pilot Tone B marker & Transmission progress rim |
| 🔴 | **R** - Red | `#FF0055` | High-frequency spectrum ceiling & Checksum error alert |

---

## ⚡ Live Demo (Zero Setup Required)

Open the acoustic transceiver in any browser on your laptop, phone, or tablet:

👉 **[https://nakulkundra.github.io/Project-Vakta/](https://nakulkundra.github.io/Project-Vakta/)**

> [!TIP]
> **Mobile to Laptop Acoustic Transfer:**
> 1. Open the URL on your **phone**, select **Receiver Only**, and tap **Start Listening**.
> 2. Open the URL on your **laptop**, select **Transmitter Only**, enter text, and click **Transmit Over Sound**.
> 3. The acoustic wave travels through room air, and your phone decodes and renders the message with validated CRC-8!

---

## 🔬 Acoustic Architecture & Modulation (16-FSK)

Project Vakta implements a robust airborne physical layer (PHY) based on research highlighted by the IEEE on machine-to-machine acoustic networking:

```
[ Plaintext Input ]
         │
         ▼
[ UTF-8 Byte Array ]
         │
         ▼
[ Packet Frame: Length Byte (1B) + Payload (NB) + CRC-8 (1B) ]
         │
         ▼
[ Split into 4-bit Nibbles (0x0 to 0xF) ]
         │
         ▼
[ 16-FSK Frequency Mapping: f = f_base + (nibble × f_step) ]
         │
         ▼
[ Preamble Handshake (Tone A ↔ Tone B) + Cosine Envelope Ramping ]
         │
         ▼
[ Web Audio API OscillatorNode ➔ Physical Speakers ]
         │
         ░░░░░░░░ Airborne Acoustic Waves (Air Channel) ░░░░░░░░
         │
         ▼
[ Microphone (getUserMedia with native DSP/echo cancellation disabled) ]
         │
         ▼
[ 4096-Point FFT Spectrum Analysis (AnalyserNode) ]
         │
         ▼
[ Dual Pilot Tone Preamble Lock ➔ Clock Timing Recovery ]
         │
         ▼
[ Mid-Symbol Peak Energy Sampler (Tolerant to Echo/Multipath) ]
         │
         ▼
[ Nibble Reconstruction ➔ CRC-8 Polynomial 0x07 Verification ]
         │
         ▼
[ Verified Message Rendered in Decoded Card ]
```

---

## 📡 Dual Operating Frequency Profiles

| Profile | Frequency Band | Tones / Bins | Characteristics |
| :--- | :---: | :---: | :--- |
| **🔊 Audible Robust** *(Recommended)* | $1.5\text{ kHz} - 3.0\text{ kHz}$ | 16 data bins ($\Delta f = 80\text{ Hz}$)<br>Pilots: $1400\text{ Hz}$ & $1550\text{ Hz}$ | 100% foolproof across low-cost laptop speakers, phones, and monitors. Immune to low-frequency room noise. |
| **🦇 Near-Ultrasound Silent** | $18.0\text{ kHz} - 20.0\text{ kHz}$ | 16 data bins ($\Delta f = 100\text{ Hz}$)<br>Pilots: $17.5\text{ kHz}$ & $17.85\text{ kHz}$ | Human-inaudible ultrasonic transmission demonstrating silent M2M data transfer without radio waves. |

---

## 💻 Local Quickstart

### 1. Clone the Repository
```bash
git clone https://github.com/nakulkundra/Project-Vakta.git
cd Project-Vakta
```

### 2. Start the Server
On Windows, double-click [`run.bat`](run.bat) or run:
```bash
python server.py
```

### 3. Open in Browser
* **Same Machine (Loopback / Split View):** [http://localhost:8080](http://localhost:8080)
* **Across Local Wi-Fi:** `http://<your-local-ip>:8080`

---

## 📁 Repository Structure

```
Project-Vakta/
├── assets/
│   └── banner.svg    # Vector banner with Liquid Glass & subtle VIBGYOR borders
├── index.html        # Liquid Glass UI with Split, Tx-Only, and Rx-Only views
├── vakta-core.js     # DSP Engine: 16-FSK Modulator/Demodulator & CRC-8
├── app.js            # UI Controller & Live VIBGYOR FFT Spectrum Visualizer
├── server.py         # Lightweight local dev server with auto LAN IP discovery
├── run.bat           # 1-Click Windows batch launcher
├── .gitignore        # Clean Git repository ignore rules
└── README.md         # Full project documentation & UI design specifications
```

---

## 🛡️ Security & Physical-Layer Advantages

* **Physical Boundary Containment:** Sound waves attenuate quickly through walls and closed doors, keeping transmission physically isolated inside a room.
* **No Radio Frequency (RF) Exposure:** Safe for RF-prohibited or explosive environments (such as hospital suites, ATEX facilities, and aircraft cabins).
* **Zero-Setup Transport:** Payloads can be encrypted client-side using AES-GCM; acoustic waves act purely as a connectionless physical bearer.

---

<p align="center">
  <sub>Project Vakta • Liquid Glass & Subtle VIBGYOR Borders • Created by Nakul Kundra</sub>
</p>
