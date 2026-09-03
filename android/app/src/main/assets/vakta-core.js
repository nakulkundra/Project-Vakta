/**
 * Project Vakta - Acoustic Data-over-Sound Engine
 * Implements 16-FSK modulation, packet framing, CRC8 error checking,
 * and FFT-based real-time demodulation via Web Audio API.
 */

(function (window) {
  'use strict';

  // --- Frequency Profiles ---
  const PROFILES = {
    audible: {
      id: 'audible',
      name: 'Audible Robust (1.5 kHz – 3.0 kHz)',
      description: 'Works on all speakers/mics regardless of hardware limitations.',
      preambleA: 1400,
      preambleB: 1550,
      baseFreq: 1700,
      stepFreq: 80, // 16 bins: 1700, 1780, ... 2900 Hz
      endTone: 3100,
      minFreq: 1300,
      maxFreq: 3300
    },
    ultrasonic: {
      id: 'ultrasonic',
      name: 'Near-Ultrasound Silent (18.0 kHz – 20.0 kHz)',
      description: 'Inaudible to humans. Demonstrates ultrasonic machine-to-machine transfer.',
      preambleA: 17500,
      preambleB: 17850,
      baseFreq: 18200,
      stepFreq: 100, // 16 bins: 18200, 18300, ... 19700 Hz
      endTone: 20000,
      minFreq: 17200,
      maxFreq: 20300
    }
  };

  // --- CRC8 Implementation (Polynomial 0x07) ---
  function crc8(byteArray) {
    let crc = 0x00;
    for (let i = 0; i < byteArray.length; i++) {
      crc ^= byteArray[i];
      for (let j = 0; j < 8; j++) {
        if (crc & 0x80) {
          crc = ((crc << 1) ^ 0x07) & 0xff;
        } else {
          crc = (crc << 1) & 0xff;
        }
      }
    }
    return crc;
  }

  // --- UTF-8 Helper ---
  function stringToBytes(str) {
    return new TextEncoder().encode(str);
  }

  function bytesToString(bytes) {
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  }

  // =========================================================================
  // VaktaTransmitter: Encodes text to audio waveform using 16-FSK
  // =========================================================================
  class VaktaTransmitter {
    constructor(options = {}) {
      this.profile = PROFILES[options.profile || 'audible'];
      this.symbolDuration = options.symbolDuration || 0.08; // 80ms per symbol
      this.volume = options.volume !== undefined ? options.volume : 0.8;
      this.audioCtx = null;
      this.isTransmitting = false;
      this.onProgress = options.onProgress || null;
      this.onComplete = options.onComplete || null;
    }

    setProfile(profileId) {
      if (PROFILES[profileId]) {
        this.profile = PROFILES[profileId];
      }
    }

    setSymbolDuration(durationSec) {
      this.symbolDuration = Math.max(0.04, Math.min(0.2, durationSec));
    }

    setVolume(vol) {
      this.volume = Math.max(0.0, Math.min(1.0, vol));
    }

    _ensureAudioContext() {
      if (!this.audioCtx || this.audioCtx.state === 'closed') {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioCtx();
      }
      if (this.audioCtx.state === 'suspended') {
        return this.audioCtx.resume();
      }
      return Promise.resolve();
    }

    buildPacket(text) {
      const payloadBytes = stringToBytes(text);
      if (payloadBytes.length === 0) {
        throw new Error('Message cannot be empty.');
      }
      if (payloadBytes.length > 255) {
        throw new Error('Message exceeds maximum 255 bytes limit for this PoC.');
      }

      const lengthByte = payloadBytes.length;
      const checksum = crc8([lengthByte, ...payloadBytes]);
      const fullBytes = [lengthByte, ...payloadBytes, checksum];

      // Convert bytes to 16-FSK nibbles (High nibble first, then Low nibble)
      const nibbles = [];
      for (let b of fullBytes) {
        nibbles.push((b >> 4) & 0x0f);
        nibbles.push(b & 0x0f);
      }

      // Build sequence of frequencies
      const freqSequence = [];

      // Preamble: [ToneA, ToneB, ToneA, ToneB]
      // Pilot tones are slightly longer (1.5x) for rock-solid sync detection
      const pilotDuration = this.symbolDuration * 1.5;
      freqSequence.push({ freq: this.profile.preambleA, duration: pilotDuration, type: 'preamble' });
      freqSequence.push({ freq: this.profile.preambleB, duration: pilotDuration, type: 'preamble' });
      freqSequence.push({ freq: this.profile.preambleA, duration: pilotDuration, type: 'preamble' });
      freqSequence.push({ freq: this.profile.preambleB, duration: pilotDuration, type: 'preamble' });

      // Guard silence
      freqSequence.push({ freq: 0, duration: this.symbolDuration * 0.5, type: 'guard' });

      // Data nibble symbols
      for (let nib of nibbles) {
        const freq = this.profile.baseFreq + nib * this.profile.stepFreq;
        freqSequence.push({ freq, duration: this.symbolDuration, type: 'data', nibble: nib });
      }

      // End tone
      freqSequence.push({ freq: this.profile.endTone, duration: this.symbolDuration * 1.2, type: 'end' });
      freqSequence.push({ freq: 0, duration: 0.05, type: 'guard' });

      return {
        freqSequence,
        totalBytes: fullBytes.length,
        totalSymbols: nibbles.length,
        checksum
      };
    }

    async transmit(text) {
      if (this.isTransmitting) {
        throw new Error('Already transmitting.');
      }

      await this._ensureAudioContext();
      const packet = this.buildPacket(text);
      this.isTransmitting = true;

      const ctx = this.audioCtx;
      const startTime = ctx.currentTime + 0.1; // small offset for smooth start
      let currentTime = startTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(ctx.destination);

      // Start silent
      gain.gain.setValueAtTime(0, ctx.currentTime);
      osc.start(ctx.currentTime);

      const ramp = 0.006; // 6ms smooth attack/decay to eliminate speaker clicks
      const sequence = packet.freqSequence;
      const totalSteps = sequence.length;

      for (let i = 0; i < totalSteps; i++) {
        const item = sequence[i];
        const tStart = currentTime;
        const tEnd = currentTime + item.duration;

        if (item.freq > 0) {
          // Set frequency
          osc.frequency.setValueAtTime(item.freq, tStart);

          // Smooth envelope: ramp up, hold, ramp down
          gain.gain.setValueAtTime(0, tStart);
          gain.gain.linearRampToValueAtTime(this.volume, tStart + ramp);
          gain.gain.setValueAtTime(this.volume, Math.max(tStart + ramp, tEnd - ramp));
          gain.gain.linearRampToValueAtTime(0, tEnd);
        } else {
          // Silence
          gain.gain.setValueAtTime(0, tStart);
          gain.gain.setValueAtTime(0, tEnd);
        }

        currentTime = tEnd;
      }

      // Progress reporting loop
      const totalDuration = currentTime - startTime;
      const progressInterval = setInterval(() => {
        if (!this.isTransmitting) {
          clearInterval(progressInterval);
          return;
        }
        const elapsed = ctx.currentTime - startTime;
        const pct = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
        if (this.onProgress) {
          this.onProgress({
            percent: Math.round(pct),
            elapsed: Math.max(0, elapsed),
            totalDuration
          });
        }
        if (elapsed >= totalDuration) {
          clearInterval(progressInterval);
          this.isTransmitting = false;
          try {
            osc.stop(ctx.currentTime + 0.05);
            setTimeout(() => {
              osc.disconnect();
              gain.disconnect();
            }, 100);
          } catch (e) {}
          if (this.onComplete) {
            this.onComplete({ text, packet });
          }
        }
      }, 30);
    }

    stop() {
      if (this.isTransmitting && this.audioCtx) {
        this.isTransmitting = false;
        try {
          this.audioCtx.close();
          this.audioCtx = null;
        } catch (e) {}
      }
    }
  }

  // =========================================================================
  // VaktaReceiver: Listens to mic, detects preamble, decodes 16-FSK packets
  // =========================================================================
  class VaktaReceiver {
    constructor(options = {}) {
      this.profile = PROFILES[options.profile || 'audible'];
      this.symbolDuration = options.symbolDuration || 0.08;
      this.audioCtx = null;
      this.analyser = null;
      this.micStream = null;
      this.sourceNode = null;
      this.isListening = false;

      // Callbacks
      this.onStateChange = options.onStateChange || null;
      this.onMessageReceived = options.onMessageReceived || null;
      this.onError = options.onError || null;
      this.onAudioProcess = options.onAudioProcess || null;

      // Demodulation state
      this.state = 'IDLE'; // 'IDLE', 'PREAMBLE_A1', 'PREAMBLE_B1', 'PREAMBLE_A2', 'PREAMBLE_B2', 'RECEIVING'
      this.stateStartTime = 0;
      this.receivedNibbles = [];
      this.expectedPayloadLength = null;
      this.totalExpectedNibbles = null;
      this.nextSymbolSampleTime = 0;
      this.animationFrameId = null;

      // FFT Buffers
      this.fftSize = 4096;
      this.frequencyData = null;
    }

    setProfile(profileId) {
      if (PROFILES[profileId]) {
        this.profile = PROFILES[profileId];
        this._resetState('IDLE');
      }
    }

    setSymbolDuration(durationSec) {
      this.symbolDuration = Math.max(0.04, Math.min(0.2, durationSec));
    }

    async startListening() {
      if (this.isListening) return;

      // Modern audio capture with noise suppression disabled
      const constraints = {
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          channelCount: 1
        }
      };

      try {
        this.micStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        throw new Error('Microphone access denied or unavailable: ' + err.message);
      }

      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioCtx();
      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = this.fftSize;
      this.analyser.smoothingTimeConstant = 0.2; // responsive to tone changes

      this.sourceNode = this.audioCtx.createMediaStreamSource(this.micStream);
      this.sourceNode.connect(this.analyser);

      this.frequencyData = new Float32Array(this.analyser.frequencyBinCount);
      this.isListening = true;
      this._resetState('IDLE');

      this._listenLoop();
    }

    stopListening() {
      this.isListening = false;
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
      if (this.micStream) {
        this.micStream.getTracks().forEach((track) => track.stop());
        this.micStream = null;
      }
      if (this.sourceNode) {
        this.sourceNode.disconnect();
        this.sourceNode = null;
      }
      if (this.audioCtx) {
        try {
          this.audioCtx.close();
        } catch (e) {}
        this.audioCtx = null;
      }
      this._resetState('IDLE');
    }

    _resetState(newState) {
      this.state = newState;
      this.stateStartTime = performance.now();
      if (newState === 'IDLE') {
        this.receivedNibbles = [];
        this.expectedPayloadLength = null;
        this.totalExpectedNibbles = null;
      }
      if (this.onStateChange) {
        this.onStateChange(this.state, {
          receivedCount: this.receivedNibbles.length,
          totalExpected: this.totalExpectedNibbles
        });
      }
    }

    _freqToBin(freq) {
      const nyquist = this.audioCtx.sampleRate / 2;
      return Math.round((freq / nyquist) * this.analyser.frequencyBinCount);
    }

    // Get power in dB around target frequency (+/- 1 bin window)
    _getPowerAtFreq(freq) {
      const centerBin = this._freqToBin(freq);
      const binCount = this.analyser.frequencyBinCount;
      let maxPower = -150;
      for (let offset = -1; offset <= 1; offset++) {
        const bin = centerBin + offset;
        if (bin >= 0 && bin < binCount) {
          if (this.frequencyData[bin] > maxPower) {
            maxPower = this.frequencyData[bin];
          }
        }
      }
      return maxPower;
    }

    // Compute average ambient noise in the relevant frequency band
    _getBandNoiseFloor() {
      const minBin = this._freqToBin(this.profile.minFreq);
      const maxBin = this._freqToBin(this.profile.maxFreq);
      let sum = 0;
      let count = 0;
      for (let b = minBin; b <= maxBin; b++) {
        sum += this.frequencyData[b];
        count++;
      }
      return count > 0 ? sum / count : -100;
    }

    _listenLoop() {
      if (!this.isListening) return;

      this.analyser.getFloatFrequencyData(this.frequencyData);
      const now = performance.now();
      const noiseFloor = this._getBandNoiseFloor();

      // Emit audio process event for real-time visualization
      if (this.onAudioProcess) {
        this.onAudioProcess({
          frequencyData: this.frequencyData,
          noiseFloor,
          analyser: this.analyser,
          sampleRate: this.audioCtx.sampleRate,
          profile: this.profile,
          state: this.state
        });
      }

      // Detection threshold: Signal must exceed local noise floor by at least 14 dB and be > -75 dBFS
      const thresholdDiff = 14;
      const minAbsoluteDB = -75;

      const powerA = this._getPowerAtFreq(this.profile.preambleA);
      const powerB = this._getPowerAtFreq(this.profile.preambleB);

      const isToneA = powerA > noiseFloor + thresholdDiff && powerA > minAbsoluteDB && powerA > powerB + 6;
      const isToneB = powerB > noiseFloor + thresholdDiff && powerB > minAbsoluteDB && powerB > powerA + 6;

      const pilotDurationMs = this.symbolDuration * 1.5 * 1000;
      const maxPreambleWait = pilotDurationMs * 2.8;

      switch (this.state) {
        case 'IDLE':
          if (isToneA) {
            this._resetState('PREAMBLE_A1');
          }
          break;

        case 'PREAMBLE_A1':
          if (now - this.stateStartTime > maxPreambleWait) {
            this._resetState('IDLE');
          } else if (isToneB && now - this.stateStartTime > pilotDurationMs * 0.4) {
            this._resetState('PREAMBLE_B1');
          }
          break;

        case 'PREAMBLE_B1':
          if (now - this.stateStartTime > maxPreambleWait) {
            this._resetState('IDLE');
          } else if (isToneA && now - this.stateStartTime > pilotDurationMs * 0.4) {
            this._resetState('PREAMBLE_A2');
          }
          break;

        case 'PREAMBLE_A2':
          if (now - this.stateStartTime > maxPreambleWait) {
            this._resetState('IDLE');
          } else if (isToneB && now - this.stateStartTime > pilotDurationMs * 0.4) {
            this._resetState('PREAMBLE_B2');
          }
          break;

        case 'PREAMBLE_B2':
          // Wait until Tone B ends and transition to receiving data
          if (now - this.stateStartTime > pilotDurationMs * 0.7) {
            // Preamble complete! Synchronize symbol clock
            // Account for the 0.5 symbol guard silence
            const guardTimeMs = this.symbolDuration * 0.5 * 1000;
            const symbolDurationMs = this.symbolDuration * 1000;
            this.nextSymbolSampleTime = now + guardTimeMs + symbolDurationMs * 0.5; // sample in middle of first symbol
            this.receivedNibbles = [];
            this.expectedPayloadLength = null;
            this.totalExpectedNibbles = null;
            this._resetState('RECEIVING');
          }
          break;

        case 'RECEIVING':
          if (now >= this.nextSymbolSampleTime) {
            // Time to decode a symbol!
            const decodedNibble = this._detectHighestNibble();
            this.receivedNibbles.push(decodedNibble);

            // Schedule next sample time
            const symbolDurationMs = this.symbolDuration * 1000;
            this.nextSymbolSampleTime += symbolDurationMs;

            if (this.onStateChange) {
              this.onStateChange(this.state, {
                receivedCount: this.receivedNibbles.length,
                totalExpected: this.totalExpectedNibbles
              });
            }

            // Check if we have received the 2 nibbles of the Length byte
            if (this.receivedNibbles.length === 2 && this.expectedPayloadLength === null) {
              const highNib = this.receivedNibbles[0];
              const lowNib = this.receivedNibbles[1];
              this.expectedPayloadLength = (highNib << 4) | lowNib;

              if (this.expectedPayloadLength <= 0 || this.expectedPayloadLength > 255) {
                // Invalid length header - abort packet
                if (this.onError) {
                  this.onError('Invalid packet length header detected: ' + this.expectedPayloadLength);
                }
                this._resetState('IDLE');
                break;
              }

              // Total expected nibbles: (1 length byte + L payload bytes + 1 CRC byte) * 2
              this.totalExpectedNibbles = (1 + this.expectedPayloadLength + 1) * 2;
            }

            // Check if full packet received
            if (this.totalExpectedNibbles && this.receivedNibbles.length >= this.totalExpectedNibbles) {
              this._finishPacketDecode();
            }

            // Timeout safety: if stuck receiving too long without reaching target
            const maxReceivingMs = (this.totalExpectedNibbles || 60) * symbolDurationMs * 1.5;
            if (now - this.stateStartTime > maxReceivingMs) {
              if (this.onError) {
                this.onError('Packet receive timed out.');
              }
              this._resetState('IDLE');
            }
          }
          break;
      }

      this.animationFrameId = requestAnimationFrame(() => this._listenLoop());
    }

    _detectHighestNibble() {
      let maxNibble = 0;
      let maxPower = -200;

      for (let nib = 0; nib < 16; nib++) {
        const freq = this.profile.baseFreq + nib * this.profile.stepFreq;
        const power = this._getPowerAtFreq(freq);
        if (power > maxPower) {
          maxPower = power;
          maxNibble = nib;
        }
      }
      return maxNibble;
    }

    _finishPacketDecode() {
      const nibbles = this.receivedNibbles;
      const bytes = [];
      for (let i = 0; i < nibbles.length - 1; i += 2) {
        bytes.push((nibbles[i] << 4) | nibbles[i + 1]);
      }

      if (bytes.length < 2) {
        this._resetState('IDLE');
        return;
      }

      const receivedLength = bytes[0];
      const payloadBytes = bytes.slice(1, 1 + receivedLength);
      const receivedCrc = bytes[1 + receivedLength];

      const calculatedCrc = crc8([receivedLength, ...payloadBytes]);

      if (receivedCrc === calculatedCrc) {
        const decodedText = bytesToString(new Uint8Array(payloadBytes));
        if (this.onMessageReceived) {
          this.onMessageReceived({
            text: decodedText,
            length: receivedLength,
            crc: calculatedCrc,
            profile: this.profile.name,
            timestamp: new Date()
          });
        }
      } else {
        if (this.onError) {
          this.onError(`Checksum error: received 0x${receivedCrc.toString(16).toUpperCase()}, expected 0x${calculatedCrc.toString(16).toUpperCase()}`);
        }
      }

      // Return to listening for new preambles
      this._resetState('IDLE');
    }
  }

  // Export to global scope
  window.Vakta = {
    PROFILES,
    VaktaTransmitter,
    VaktaReceiver,
    crc8,
    stringToBytes,
    bytesToString
  };
})(window);
