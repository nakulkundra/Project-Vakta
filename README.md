# Project Vakta (वक्ता) — Data-over-Sound PoC

An acoustic data communication proof-of-concept inspired by the IEEE article *"Transferring Data Over Sound"*.

Project Vakta encodes digital text into airborne acoustic waves using **16-FSK (Frequency Shift Keying)** modulation and decodes them in real time using the browser's native **Web Audio API**.

---

## 🚀 Key Features

* **Zero External Dependencies:** 100% vanilla HTML5, CSS3, and JavaScript. No npm modules, CDN dependencies, or external servers required.
* **Dual Frequency Profiles:**
  * 🔊 **Audible Robust (1.5 kHz – 3.0 kHz):** Ideal for instant testing across any consumer laptop, phone, or tablet speaker/microphone regardless of hardware quality.
  * 🦇 **Near-Ultrasound Silent (18.0 kHz – 20.0 kHz):** Human-inaudible ultrasonic transmission matching commercial IoT standards (e.g., Sonarax, Stimshop).
* **Packet Framing & Integrity:**
  * **Preamble Sequence:** Dual-pilot alternating sync tones (`Tone A` ↔ `Tone B`) for robust clock locking.
  * **Length Header:** Dynamic payload sizing (up to 255 bytes).
  * **CRC-8 Error Detection:** Polynomial `0x07` checksum protects against false triggers from ambient room noise.
  * **Click-Free Audio Shaping:** Trapezoidal cosine envelope smoothing prevents high-frequency transient speaker "clicks".
* **Live FFT Spectrum Visualizer:** Real-time canvas waterfall showing frequency bins, signal-to-noise ratio (SNR), and active detection windows.
* **Flexible Layouts:** "Split Dual View" for single-machine loopback testing, or dedicated "Transmitter Only" and "Receiver Only" views for two separate machines.

---

## 🛠️ Quickstart Guide

### Step 1: Start the Local Server
Because modern browsers strictly require a **Secure Context** (`localhost` or `HTTPS`) to enable microphone access (`getUserMedia`), run the included Python server:

```bash
python server.py
```

The script will detect your local network IP and display:
* Local URL: `http://localhost:8080`
* LAN URL: `http://<your-local-ip>:8080`

---

### Step 2: Testing Scenarios

#### Scenario A: Single Machine (Loopback / Split Mode)
1. Open `http://localhost:8080` in Chrome or Edge.
2. Under the **🎙️ Receiver** panel, click **Start Listening (Enable Mic)** and allow microphone permissions.
3. Observe the live spectrum visualizer showing ambient room sound.
4. Under the **🔊 Transmitter** panel, type a short message (or click a preset like `Hello World 👋`).
5. Click **Transmit Over Sound**.
6. **Watch the magic:** Your speakers will emit the modulated chirp, the spectrum canvas will show the frequency peaks hitting the detection bins, and the Receiver will decode and display the message with verified CRC-8!

#### Scenario B: Two Separate Machines / Laptop & Phone
1. **Receiver Device (e.g., Laptop 2):** Open `http://localhost:8080` (or `http://<local-ip>:8080`), select **Receiver Only**, and click **Start Listening**.
2. **Transmitter Device (e.g., Laptop 1):** Open the page, select **Transmitter Only**, enter your text, and click **Transmit Over Sound**.
3. The sound travels across the room air, enters the receiver's microphone, and appears decoded on the second screen.

---

## 📊 Technical Architecture

```
[ Text Input ]
      │
      ▼
[ UTF-8 Byte Array ]
      │
      ▼
[ Frame Packet: Length + Payload + CRC8 ]
      │
      ▼
[ Split into 4-bit Nibbles (0-15) ]
      │
      ▼
[ 16-FSK Frequency Mapper (f = f_base + nibble * f_step) ]
      │
      ▼
[ Preamble Pilot Tones + Cosine Ramp Envelope ]
      │
      ▼
[ Web Audio API OscillatorNode / Speaker ]
      │
      ░░░ Airborne Sound Waves (Air Interface) ░░░
      │
      ▼
[ Microphone (getUserMedia with DSP disabled) ]
      │
      ▼
[ AnalyserNode 4096-point FFT ]
      │
      ▼
[ Preamble Phase Detector -> Clock Recovery ]
      │
      ▼
[ Center-of-Symbol Peak Energy Sampler ]
      │
      ▼
[ Nibble Reassembly -> CRC8 Checksum Verification ]
      │
      ▼
[ Decoded Message Displayed ]
```

---

## 📁 File Structure

* `index.html`: Clean, responsive UI with dual-view and single-role modes.
* `vakta-core.js`: Core DSP engine (`VaktaTransmitter`, `VaktaReceiver`, CRC-8, 16-FSK modulation/demodulation).
* `app.js`: UI event handling, spectrum canvas renderer, and history manager.
* `server.py`: Lightweight zero-dependency HTTP server with automatic LAN IP resolution.
