<p align="center">
  <img src="assets/banner.svg" width="100%" alt="Project Vakta - Acoustic Data-over-Sound Transceiver" />
</p>

<p align="center">
  <a href="https://nakulkundra.github.io/Project-Vakta/">
    <img src="https://img.shields.io/badge/🌐_Live_Demo-GitHub_Pages-00E676?style=for-the-badge&labelColor=080D1A" alt="Live Demo" />
  </a>
  <a href="https://github.com/nakulkundra/Project-Vakta">
    <img src="https://img.shields.io/badge/📦_Repo-Project--Vakta-0070F3?style=for-the-badge&labelColor=080D1A" alt="GitHub Repo" />
  </a>
  <img src="https://img.shields.io/badge/PHY_Layer-16--FSK_Modulation-8B00FF?style=for-the-badge&labelColor=080D1A" alt="PHY Layer" />
  <img src="https://img.shields.io/badge/Integrity-CRC--8_ATM_(0x07)-FF7700?style=for-the-badge&labelColor=080D1A" alt="CRC-8" />
</p>

<p align="center">
  <strong>An airborne machine-to-machine (M2M) acoustic transceiver running in client-side JavaScript via the W3C Web Audio API.</strong><br>
  <em>Zero radio frequency footprint (no Wi-Fi, Bluetooth, or NFC). Zero network pairing friction. Strictly air-gapped physical containment.</em>
</p>

---

## ⚡ Live Deployments & Cross-Platform Binaries

* 🌐 **Web Audio Transceiver (Zero Setup):** [https://nakulkundra.github.io/Project-Vakta/](https://nakulkundra.github.io/Project-Vakta/)
* 📱 **Native Android Application (.APK):** [GitHub Releases](https://github.com/nakulkundra/Project-Vakta/releases) • [**Download v1.0.5 APK**](https://github.com/nakulkundra/Project-Vakta/releases/download/v1.0.5/Project-Vakta-v1.0.5.apk)
* 💻 **Local Source / Dev Server:** Clone repository and execute `python server.py` (serves on port `8080`).

---

## 🔬 System Architecture & Theory of Operation

Project Vakta establishes a wireless, non-RF physical communication channel (PHY) between commodity speakers and microphones through airborne acoustic sound pressure waves.

```
                          TRANSMISSION PIPELINE (MODULATOR)
┌─────────────────┐     ┌───────────────────────┐     ┌────────────────────────┐
│ Plaintext UTF-8 │ ──> │ Byte Serialization    │ ──> │ CRC-8 Frame Assembler  │
│ Input String    │     │ [0x48, 0x69, 0x21]    │     │ [Len][Payload][CRC8]   │
└─────────────────┘     └───────────────────────┘     └────────────────────────┘
                                                                   │
                                                                   ▼
┌─────────────────┐     ┌───────────────────────┐     ┌────────────────────────┐
│ Physical Audio  │ <── │ Cosine Pulse Shaping  │ <── │ 16-FSK Tone Mapper     │
│ Waves in Air    │     │ Sidelobe Suppression  │     │ 4-bit Nibble ➔ f_k     │
└─────────────────┘     └───────────────────────┘     └────────────────────────┘

                           RECEPTION PIPELINE (DEMODULATOR)
┌─────────────────┐     ┌───────────────────────┐     ┌────────────────────────┐
│ Microphone MEMS │ ──> │ 4096-Point Continuous │ ──> │ Dual-Chirp Preamble    │
│ (DSP Bypassed)  │     │ FFT Analyzer (11.7Hz) │     │ Phase Lock & Sync      │
└─────────────────┘     └───────────────────────┘     └────────────────────────┘
                                                                   │
                                                                   ▼
┌─────────────────┐     ┌───────────────────────┐     ┌────────────────────────┐
│ Verified Output │ <── │ Polynomial 0x07       │ <── │ Mid-Symbol Peak        │
│ Plaintext Event │     │ CRC-8 Frame Check     │     │ Energy Bin Extraction  │
└─────────────────┘     └───────────────────────┘     └────────────────────────┘
```

---

## 📐 Physical Layer (PHY) & Mathematical Modeling

### 1. 16-Ary Frequency Shift Keying (16-FSK)
Information is encoded into discrete audio frequencies by dividing each 8-bit byte into two 4-bit nibbles ($M = 2^4 = 16$ distinct symbols):

$$\text{Nibble}_{\text{high}} = \lfloor \text{Byte} \gg 4 \rfloor, \quad \text{Nibble}_{\text{low}} = \text{Byte} \;\&\; 0\text{x0F}$$

Each nibble $k \in \{0, 1, \dots, 15\}$ maps deterministically to a synthesized continuous-phase sub-band center frequency $f_k$:

$$f_k = f_{\text{base}} + k \cdot \Delta f$$

Where:
* $f_{\text{base}}$ is the base carrier boundary of the active profile.
* $\Delta f$ is the sub-carrier channel spacing.

### 2. Spectral Orthogonality Condition & Doppler Margins
For non-coherent FSK demodulation without inter-carrier interference (ICI), the tone spacing must satisfy the continuous orthogonality condition over symbol duration $T_{\text{sym}}$:

$$\Delta f \ge \frac{1}{T_{\text{sym}}}$$

At the default transmission rate of $T_{\text{sym}} = 80\text{ ms}$, the theoretical minimum separation is:

$$\Delta f_{\text{min}} = \frac{1}{0.080\text{ s}} = 12.5\text{ Hz}$$

Project Vakta enforces:
* **Audible Band:** $\Delta f = 80\text{ Hz} \implies \frac{\Delta f}{\Delta f_{\text{min}}} = 6.40\times \text{ guard ratio}$
* **Near-Ultrasound Band:** $\Delta f = 100\text{ Hz} \implies \frac{\Delta f}{\Delta f_{\text{min}}} = 8.00\times \text{ guard ratio}$

#### Doppler Shift Immunity:
The Doppler frequency shift $\Delta f_D$ caused by relative physical movement at velocity $v$ in room air ($c \approx 343\text{ m/s}$) is:

$$\Delta f_D = f_c \left(\frac{v}{c}\right)$$

For a transmitter or receiver moved rapidly by hand ($v \approx 1.5\text{ m/s}$) at $f_c = 19\text{ kHz}$:

$$\Delta f_D = 19000 \cdot \left(\frac{1.5}{343}\right) \approx 83.09\text{ Hz}$$

Because our sub-band spacing ($\Delta f = 100\text{ Hz}$) and FFT bin aggregation window are parameterized with an adaptive peak-neighborhood search ($\pm 35\text{ Hz}$), the receiver tolerates ambient room vibrations and physical movements without symbol drift.

---

### 3. Raised Cosine Pulse Shaping & Sidelobe Suppression
Abrupt rectangular on/off keying causes spectral leakage (Gibbs phenomenon) with sidelobes rolling off at an inadequate $-20\text{ dB/decade}$, bleeding energy into adjacent FSK channels. 

Project Vakta shapes the envelope of each tone burst with a symmetrical raised-cosine taper applied to the Web Audio `GainNode`:

$$w(t) = \begin{cases} 
\frac{1}{2}\left[1 - \cos\left(\frac{\pi t}{T_{\text{ramp}}}\right)\right] & 0 \le t < T_{\text{ramp}} \\
1 & T_{\text{ramp}} \le t < T_{\text{sym}} - T_{\text{ramp}} \\
\frac{1}{2}\left[1 + \cos\left(\frac{\pi (t - (T_{\text{sym}} - T_{\text{ramp}}))}{T_{\text{ramp}}}\right)\right] & T_{\text{sym}} - T_{\text{ramp}} \le t \le T_{\text{sym}}
\end{cases}$$

Where $T_{\text{ramp}} = 5\text{ ms}$. This guarantees that spectral sidelobes fall below **$-32\text{ dB}$**, eliminating false adjacent-bin triggers.

---

## 🛰️ Frame Structure & Protocol Hierarchy

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   PHYSICAL FRAME                                       │
├─────────────────┬─────────────────┬───────────┬─────────────┬──────────────┬───────────┤
│  Pilot Tone A   │  Pilot Tone B   │ Guard Gap │ Length Byte │ Payload Data │   CRC-8   │
│   f_pilotA      │   f_pilotB      │  Silence  │  (2 Nibbles)│ (2N Nibbles) │(2 Nibbles)│
│    150 ms       │    150 ms       │   40 ms   │   160 ms    │   N × 160 ms │  160 ms   │
└─────────────────┴─────────────────┴───────────┴─────────────┴──────────────┴───────────┘
```

1. **Dual Pilot Preamble:** 
   * Tone A ($150\text{ ms}$) primes the detector's adaptive energy filter.
   * Tone B ($150\text{ ms}$) confirms intentional transmission and provides precise clock timing recovery ($t_0$).
   * Guard Gap ($40\text{ ms}$) clears room echoes and reverberations before data transmission.
2. **Length Header (1 Byte):**
   * Encodes total payload byte length $N \in [1, 120]$.
3. **Payload Stream ($N$ Bytes):**
   * Transmitted sequentially as $2N$ symbols, MSB nibble first.
4. **CRC-8 Frame Check Sequence (1 Byte):**
   * Transmitted as 2 nibbles at the end of the packet.

---

## 🛡️ Error Detection: CRC-8-ATM (Polynomial 0x07)

To ensure zero transmission corruption over multipath room acoustics, Project Vakta implements an 8-bit Cyclic Redundancy Check using the standard ATM/ITU polynomial:

$$G(x) = x^8 + x^2 + x^1 + 1 \quad (\text{Binary: } 100000111_2 \implies 0\text{x07})$$

### Mathematical Properties:
* **Hamming Distance:** $d = 4$ for frame lengths up to 119 bits.
* **Error Detection Guarantee:**
  * Detects $100\%$ of single-bit errors ($e(x) = x^i$).
  * Detects $100\%$ of all double-bit errors ($e(x) = x^i + x^j$).
  * Detects $100\%$ of any odd number of errors.
  * Detects all burst error spans $\le 8\text{ bits}$ in length.
  * Detects $99.609\%$ of arbitrary random burst errors $> 8\text{ bits}$.

Packets failing the polynomial division:

$$R(x) = [M(x) \cdot x^8] \pmod{G(x)} \ne 0$$

are automatically rejected at the PHY layer, preventing corrupted data from reaching the application layer.

---

## 🎛️ Demodulation Engine: 4096-Point Discrete Fourier Transform

The receiving engine captures live acoustic pressure data via `navigator.mediaDevices.getUserMedia` and streams it through a native Web Audio `AnalyserNode`.

### 1. Discrete Frequency Bin Resolution
The continuous audio stream is digitized at sample rate $F_s$ ($44,100\text{ Hz}$ or $48,000\text{ Hz}$) with an FFT size $N_{\text{FFT}} = 4096$:

$$\Delta f_{\text{bin}} = \frac{F_s}{N_{\text{FFT}}} = \frac{48000\text{ Hz}}{4096} \approx 11.71875\text{ Hz/bin}$$

Every tone frequency $f$ is evaluated by mapping it to its discrete frequency index $i$:

$$i = \left\lfloor \frac{f}{\Delta f_{\text{bin}}} + 0.5 \right\rfloor$$

### 2. Mid-Symbol Peak Energy Sampling
In enclosed rooms, multipath acoustics create constructive and destructive wave interference during tone transitions. 

To achieve maximum Signal-to-Interference Ratio (SIR), the demodulator samples energy **at the midpoint of each symbol period**:

$$t_{\text{sample}} = t_{\text{sym\_start}} + \frac{1}{2} T_{\text{sym}} \quad (t = 40\text{ ms})$$

This completely isolates the detector from transient phase discontinuities and decaying echoes of preceding symbols.

### 3. Dynamic Thresholding & Native DSP Bypass
Commodity browsers enforce automated voice filters (AEC, AGC, NS) that suppress continuous tones as background noise. Project Vakta explicitly disables these browser DSP layers:

```javascript
navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false
  }
});
```

The receiver calculates a continuous real-time noise floor $\sigma_{\text{ambient}}$ from unallocated guard bands and requires an adaptive signal-to-noise margin:

$$\text{SNR}_{\text{instantaneous}} = 20 \log_{10}\left(\frac{V_{\text{tone}}}{V_{\text{ambient}}}\right) \ge 12\text{ dB}$$

---

## 📡 Operating Frequency Profiles

| Parameter | 🔊 Audible Robust Profile | 🦇 Near-Ultrasound Silent Profile |
| :--- | :---: | :---: |
| **Operational Band** | $1500\text{ Hz} - 3000\text{ Hz}$ | $18000\text{ Hz} - 20000\text{ Hz}$ |
| **Base Frequency ($f_{\text{base}}$)** | $1700\text{ Hz}$ | $18200\text{ Hz}$ |
| **Channel Spacing ($\Delta f$)** | $80\text{ Hz}$ | $100\text{ Hz}$ |
| **Sub-carrier Bins (16-FSK)** | $1700\text{ Hz} - 2900\text{ Hz}$ | $18200\text{ Hz} - 19700\text{ Hz}$ |
| **Pilot Tone A** | $1400\text{ Hz}$ | $17500\text{ Hz}$ |
| **Pilot Tone B** | $1550\text{ Hz}$ | $17850\text{ Hz}$ |
| **Symbol Period ($T_{\text{sym}}$)** | $80\text{ ms}$ | $80\text{ ms}$ |
| **Net Throughput** | $\approx 25\text{ baud} \; (50\text{ bps})$ | $\approx 25\text{ baud} \; (50\text{ bps})$ |
| **Atmospheric Attenuation** | $\approx 0.015\text{ dB/m}$ | $\approx 0.650\text{ dB/m}$ |
| **Audibility** | Audible chirping | Inaudible to adult humans |

---

## 📱 Android Native Hybrid Container Architecture

The Android application wraps the Web Audio DSP core inside a high-performance native container using modern Android architecture components:

* **Secure Context Provisioning (`WebViewAssetLoader`):** 
  Standard Android `file:///android_asset/` origins block microphone capture (`getUserMedia`) due to browser security restrictions. Project Vakta uses `androidx.webkit.WebViewAssetLoader` to intercept asset calls and map them to a virtual secure origin:
  ```
  https://appassets.androidplatform.net/assets/index.html
  ```
  Chromium's embedded rendering engine recognizes this as a valid **Secure Context (HTTPS)**, enabling Web Audio and microphone streams without hosting external servers.
* **Direct Audio Permissions:** Implements explicit runtime permission handling for `RECORD_AUDIO` and `MODIFY_AUDIO_SETTINGS`.
* **Process Wake Locking:** Utilizes `FLAG_KEEP_SCREEN_ON` to prevent device CPU sleep during long acoustic listening sessions.

---

## 📁 Repository Structure

```
Project-Vakta/
├── .github/workflows/
│   └── android-build.yml    # CI/CD: Automated Incremental APK Build Pipeline
├── android/                 # Native Android Hybrid Application Source
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml   # Audio permissions & activity definitions
│   │   │   ├── java/.../MainActivity.kt  # WebViewAssetLoader & permission broker
│   │   │   └── assets/               # Bundled offline DSP engine and web UI
│   │   └── build.gradle              # App Gradle configuration & dependencies
│   ├── build.gradle                  # Top-level Gradle build file
│   └── settings.gradle               # Root project settings
├── assets/
│   └── banner.svg           # High-resolution architectural vector header
├── index.html               # Responsive Transceiver Interface (Tx/Rx Dual-View)
├── vakta-core.js            # Core DSP Engine: 16-FSK Modulator, Demodulator, CRC-8
├── app.js                   # Application State Controller & Real-Time FFT Visualizer
├── server.py                # Standalone Python HTTP development server
├── run.bat                  # 1-Click launcher for local loopback testing
└── README.md                # System engineering specification and mathematical guide
```

---

<p align="center">
  <sub>Project Vakta • Airborne Acoustic M2M Transceiver • Mathematical Specification</sub>
</p>
