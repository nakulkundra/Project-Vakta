/**
 * Project Vakta - UI Controller & Spectrum Visualizer
 */

document.addEventListener('DOMContentLoaded', () => {
  const { VaktaTransmitter, VaktaReceiver, PROFILES } = window.Vakta;

  // --- UI Elements ---
  const txProfileSelect = document.getElementById('txProfileSelect');
  const rxProfileSelect = document.getElementById('rxProfileSelect');
  const txMessageInput = document.getElementById('txMessageInput');
  const charCount = document.getElementById('charCount');
  const symbolSpeedRange = document.getElementById('symbolSpeedRange');
  const speedLabel = document.getElementById('speedLabel');
  const volumeRange = document.getElementById('volumeRange');
  const volumeLabel = document.getElementById('volumeLabel');
  const btnTransmit = document.getElementById('btnTransmit');
  const btnTransmitText = document.getElementById('btnTransmitText');
  const txStatusBadge = document.getElementById('txStatusBadge');
  const txProgressWrap = document.getElementById('txProgressWrap');
  const txProgressBar = document.getElementById('txProgressBar');

  const btnToggleListen = document.getElementById('btnToggleListen');
  const btnListenText = document.getElementById('btnListenText');
  const rxStatusBadge = document.getElementById('rxStatusBadge');
  const rxStateDetail = document.getElementById('rxStateDetail');
  const snrLabel = document.getElementById('snrLabel');
  const messageOutput = document.getElementById('messageOutput');
  const messageText = document.getElementById('messageText');
  const messageCrc = document.getElementById('messageCrc');
  const messageTime = document.getElementById('messageTime');
  const historyList = document.getElementById('historyList');
  const historyCount = document.getElementById('historyCount');

  const spectrumCanvas = document.getElementById('spectrumCanvas');
  const canvasOverlay = document.getElementById('canvasOverlay');
  const canvasCtx = spectrumCanvas.getContext('2d');

  // View Switcher Buttons
  const viewDual = document.getElementById('viewDual');
  const viewTx = document.getElementById('viewTx');
  const viewRx = document.getElementById('viewRx');
  const txPanel = document.getElementById('txPanel');
  const rxPanel = document.getElementById('rxPanel');
  const mainGrid = document.getElementById('mainGrid');

  // Preset Chips
  const presetChips = document.querySelectorAll('.preset-chip');

  // --- Engine Instances ---
  let transmitter = new VaktaTransmitter({
    profile: txProfileSelect.value,
    symbolDuration: parseInt(symbolSpeedRange.value, 10) / 1000,
    volume: parseInt(volumeRange.value, 10) / 100,
    onProgress: handleTxProgress,
    onComplete: handleTxComplete
  });

  let receiver = new VaktaReceiver({
    profile: rxProfileSelect.value,
    symbolDuration: parseInt(symbolSpeedRange.value, 10) / 1000,
    onStateChange: handleRxStateChange,
    onMessageReceived: handleRxMessage,
    onError: handleRxError,
    onAudioProcess: renderSpectrum
  });

  let receivedHistory = [];

  // --- Resize Canvas on Layout ---
  function resizeCanvas() {
    const rect = spectrumCanvas.parentElement.getBoundingClientRect();
    spectrumCanvas.width = rect.width * (window.devicePixelRatio || 1);
    spectrumCanvas.height = rect.height * (window.devicePixelRatio || 1);
  }
  window.addEventListener('resize', resizeCanvas);
  setTimeout(resizeCanvas, 50);

  // --- View Switcher Logic ---
  function setView(view) {
    [viewDual, viewTx, viewRx].forEach((btn) => btn.classList.remove('active'));

    if (view === 'tx') {
      viewTx.classList.add('active');
      txPanel.style.display = 'flex';
      rxPanel.style.display = 'none';
      mainGrid.style.gridTemplateColumns = '1fr';
    } else if (view === 'rx') {
      viewRx.classList.add('active');
      txPanel.style.display = 'none';
      rxPanel.style.display = 'flex';
      mainGrid.style.gridTemplateColumns = '1fr';
    } else {
      viewDual.classList.add('active');
      txPanel.style.display = 'flex';
      rxPanel.style.display = 'flex';
      mainGrid.style.gridTemplateColumns = window.innerWidth > 900 ? '1fr 1fr' : '1fr';
    }
    setTimeout(resizeCanvas, 50);
  }

  viewDual.addEventListener('click', () => setView('dual'));
  viewTx.addEventListener('click', () => setView('tx'));
  viewRx.addEventListener('click', () => setView('rx'));

  // --- Transmitter Controls ---
  function updateCharCount() {
    const len = txMessageInput.value.length;
    charCount.textContent = `${len} / 120 chars`;
  }
  txMessageInput.addEventListener('input', updateCharCount);
  updateCharCount();

  presetChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      txMessageInput.value = chip.getAttribute('data-text');
      updateCharCount();
    });
  });

  txProfileSelect.addEventListener('change', () => {
    transmitter.setProfile(txProfileSelect.value);
    // Suggest matching receiver profile if in dual view
    if (viewDual.classList.contains('active')) {
      rxProfileSelect.value = txProfileSelect.value;
      receiver.setProfile(txProfileSelect.value);
    }
  });

  rxProfileSelect.addEventListener('change', () => {
    receiver.setProfile(rxProfileSelect.value);
  });

  symbolSpeedRange.addEventListener('input', () => {
    const val = parseInt(symbolSpeedRange.value, 10);
    speedLabel.textContent = `${val} ms/sym`;
    transmitter.setSymbolDuration(val / 1000);
    receiver.setSymbolDuration(val / 1000);
  });

  volumeRange.addEventListener('input', () => {
    const val = parseInt(volumeRange.value, 10);
    volumeLabel.textContent = `${val}%`;
    transmitter.setVolume(val / 100);
  });

  // --- Transmit Action ---
  btnTransmit.addEventListener('click', async () => {
    const text = txMessageInput.value.trim();
    if (!text) {
      alert('Please enter a message to transmit.');
      return;
    }

    try {
      btnTransmit.disabled = true;
      btnTransmitText.textContent = 'Transmitting Audio...';
      txProgressWrap.style.display = 'block';
      txProgressBar.style.width = '0%';

      txStatusBadge.className = 'badge receiving';
      txStatusBadge.innerHTML = '<span class="badge-dot"></span> Transmitting';

      await transmitter.transmit(text);
    } catch (err) {
      alert('Transmission error: ' + err.message);
      handleTxComplete();
    }
  });

  function handleTxProgress(info) {
    txProgressBar.style.width = `${info.percent}%`;
  }

  function handleTxComplete() {
    btnTransmit.disabled = false;
    btnTransmitText.textContent = 'Transmit Over Sound';
    txStatusBadge.className = 'badge';
    txStatusBadge.innerHTML = '<span class="badge-dot"></span> Ready';
    setTimeout(() => {
      txProgressWrap.style.display = 'none';
      txProgressBar.style.width = '0%';
    }, 400);
  }

  // --- Receiver Microphone & State ---
  btnToggleListen.addEventListener('click', async () => {
    if (!receiver.isListening) {
      try {
        btnToggleListen.disabled = true;
        btnListenText.textContent = 'Requesting Mic Access...';

        await receiver.startListening();

        btnToggleListen.disabled = false;
        btnToggleListen.className = 'btn btn-danger';
        btnListenText.textContent = 'Stop Listening';

        rxStatusBadge.className = 'badge listening';
        rxStatusBadge.innerHTML = '<span class="badge-dot"></span> Listening';
        rxStateDetail.textContent = 'Microphone active. Waiting for signal...';
      } catch (err) {
        btnToggleListen.disabled = false;
        btnToggleListen.className = 'btn btn-success';
        btnListenText.textContent = 'Start Listening (Enable Mic)';
        alert(err.message);
      }
    } else {
      receiver.stopListening();
      btnToggleListen.className = 'btn btn-success';
      btnListenText.textContent = 'Start Listening (Enable Mic)';

      rxStatusBadge.className = 'badge';
      rxStatusBadge.innerHTML = '<span class="badge-dot"></span> Standby (Mic Off)';
      rxStateDetail.textContent = 'Microphone stopped.';
      snrLabel.textContent = 'SNR: -- dB';
      clearCanvas();
    }
  });

  function handleRxStateChange(state, details) {
    switch (state) {
      case 'IDLE':
        rxStatusBadge.className = 'badge listening';
        rxStatusBadge.innerHTML = '<span class="badge-dot"></span> Listening';
        rxStateDetail.textContent = 'Listening for pilot tones...';
        break;
      case 'PREAMBLE_A1':
      case 'PREAMBLE_B1':
      case 'PREAMBLE_A2':
      case 'PREAMBLE_B2':
        rxStatusBadge.className = 'badge receiving';
        rxStatusBadge.innerHTML = '<span class="badge-dot"></span> Preamble Sync';
        rxStateDetail.textContent = `Preamble handshake detected (${state})`;
        break;
      case 'RECEIVING':
        rxStatusBadge.className = 'badge receiving';
        rxStatusBadge.innerHTML = '<span class="badge-dot"></span> Receiving';
        const expected = details.totalExpected ? details.totalExpected : '?';
        rxStateDetail.textContent = `Decoding symbols: ${details.receivedCount} / ${expected}`;
        break;
    }
  }

  function handleRxMessage(msg) {
    rxStatusBadge.className = 'badge success';
    rxStatusBadge.innerHTML = '<span class="badge-dot"></span> Packet Verified';
    rxStateDetail.textContent = `Decoded ${msg.length} bytes with valid CRC8!`;

    // Visual feedback on message output card
    messageOutput.classList.add('has-message');
    messageText.textContent = `"${msg.text}"`;
    messageCrc.textContent = `CRC-8: 0x${msg.crc.toString(16).toUpperCase().padStart(2, '0')}`;
    messageTime.textContent = msg.timestamp.toLocaleTimeString();

    // Flash animation
    messageOutput.style.transform = 'scale(1.02)';
    setTimeout(() => {
      messageOutput.style.transform = 'scale(1)';
    }, 200);

    // Add to history
    receivedHistory.unshift(msg);
    updateHistoryList();
  }

  function handleRxError(errMsg) {
    rxStatusBadge.className = 'badge error';
    rxStatusBadge.innerHTML = '<span class="badge-dot"></span> Packet Discarded';
    rxStateDetail.textContent = errMsg;

    setTimeout(() => {
      if (receiver.isListening && receiver.state === 'IDLE') {
        rxStatusBadge.className = 'badge listening';
        rxStatusBadge.innerHTML = '<span class="badge-dot"></span> Listening';
        rxStateDetail.textContent = 'Listening for pilot tones...';
      }
    }, 2500);
  }

  function updateHistoryList() {
    historyCount.textContent = `${receivedHistory.length} message${receivedHistory.length === 1 ? '' : 's'}`;
    if (receivedHistory.length === 0) {
      historyList.innerHTML = '<div style="font-size: 0.8rem; color: var(--text-muted); padding: 8px;">No packets logged yet.</div>';
      return;
    }

    historyList.innerHTML = receivedHistory
      .slice(0, 10)
      .map(
        (item) => `
      <div class="history-item">
        <span class="text">"${escapeHtml(item.text)}"</span>
        <span class="time">${item.timestamp.toLocaleTimeString()} (${item.length}B, CRC: 0x${item.crc.toString(16).toUpperCase()})</span>
      </div>
    `
      )
      .join('');
  }

  function escapeHtml(str) {
    return str.replace(/[&<>'"]/g, (tag) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag));
  }

  function clearCanvas() {
    canvasCtx.fillStyle = '#080c14';
    canvasCtx.fillRect(0, 0, spectrumCanvas.width, spectrumCanvas.height);
  }

  // --- Live Spectrum & Band Highlight Visualizer ---
  function renderSpectrum(audioInfo) {
    const { frequencyData, noiseFloor, analyser, sampleRate, profile, state } = audioInfo;
    const width = spectrumCanvas.width;
    const height = spectrumCanvas.height;

    canvasCtx.fillStyle = '#080c14';
    canvasCtx.fillRect(0, 0, width, height);

    const binCount = analyser.frequencyBinCount;
    const nyquist = sampleRate / 2;

    // Determine target band coordinate range
    const minBandX = (profile.minFreq / nyquist) * width;
    const maxBandX = (profile.maxFreq / nyquist) * width;

    // Highlight target band
    canvasCtx.fillStyle = state === 'RECEIVING' ? 'rgba(0, 230, 118, 0.12)' : 'rgba(0, 210, 255, 0.08)';
    canvasCtx.fillRect(minBandX, 0, Math.max(12, maxBandX - minBandX), height);

    // Draw band border markers
    canvasCtx.strokeStyle = state === 'RECEIVING' ? 'rgba(0, 230, 118, 0.4)' : 'rgba(0, 210, 255, 0.3)';
    canvasCtx.setLineDash([3, 3]);
    canvasCtx.strokeRect(minBandX, 0, Math.max(12, maxBandX - minBandX), height);
    canvasCtx.setLineDash([]);

    // Draw Spectrum Curve
    canvasCtx.lineWidth = 1.5;
    canvasCtx.beginPath();

    let maxInBand = -150;

    for (let i = 0; i < binCount; i++) {
      const freq = (i / binCount) * nyquist;
      const x = (i / binCount) * width;

      // Map dB (-120 to -20 dB) to canvas height
      const db = frequencyData[i];
      const normalized = Math.max(0, Math.min(1, (db + 120) / 100));
      const y = height - normalized * height;

      if (i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }

      if (freq >= profile.minFreq && freq <= profile.maxFreq && db > maxInBand) {
        maxInBand = db;
      }
    }

    // Spectrum gradient stroke
    const grad = canvasCtx.createLinearGradient(0, 0, width, 0);
    grad.addColorStop(0, '#3a7bd5');
    grad.addColorStop(0.5, '#00d2ff');
    grad.addColorStop(1, '#00e676');
    canvasCtx.strokeStyle = grad;
    canvasCtx.stroke();

    // Mark 16 FSK Frequencies in target profile with small ticks
    canvasCtx.fillStyle = 'rgba(0, 210, 255, 0.5)';
    for (let nib = 0; nib < 16; nib++) {
      const f = profile.baseFreq + nib * profile.stepFreq;
      const fx = (f / nyquist) * width;
      canvasCtx.fillRect(fx - 1, height - 8, 2, 8);
    }

    // Mark Preamble Tones A and B
    canvasCtx.fillStyle = '#ffab00';
    const paX = (profile.preambleA / nyquist) * width;
    const pbX = (profile.preambleB / nyquist) * width;
    canvasCtx.fillRect(paX - 1, height - 14, 2, 14);
    canvasCtx.fillRect(pbX - 1, height - 14, 2, 14);

    // Update SNR Label
    const snr = Math.max(0, Math.round(maxInBand - noiseFloor));
    snrLabel.textContent = `In-Band Peak: ${Math.round(maxInBand)} dB | SNR: ~${snr} dB`;

    // Overlay text
    canvasOverlay.textContent = `Band: ${profile.minFreq}-${profile.maxFreq}Hz | Status: ${state}`;
  }
});
