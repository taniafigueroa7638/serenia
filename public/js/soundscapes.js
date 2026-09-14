// Serenia - Ambientes de calma y sonidos ASMR
// Implementación propia con Web Audio API. No usa audio ni código de terceros.

const SERENIA_SOUND_PRESET_KEYS = {
  ambient: 'serenia_ambient_presets_v1',
  asmr: 'serenia_asmr_presets_v1',
};

const SERENIA_SOUND_CATALOG = {
  ambient: [
    { id: 'rain', icon: '🌧️', name: 'Lluvia suave', description: 'Textura ligera de lluvia continua.', engine: 'rain' },
    { id: 'ocean', icon: '🌊', name: 'Olas', description: 'Movimiento lento parecido al vaivén del mar.', engine: 'ocean' },
    { id: 'wind', icon: '🍃', name: 'Viento', description: 'Brisa suave y envolvente.', engine: 'wind' },
    { id: 'forest', icon: '🌲', name: 'Bosque', description: 'Fondo natural con pequeños trinos.', engine: 'forest' },
    { id: 'fire', icon: '🔥', name: 'Chimenea', description: 'Calidez suave con pequeños crepitares.', engine: 'fire' },
    { id: 'stream', icon: '💧', name: 'Riachuelo', description: 'Agua ligera y constante.', engine: 'stream' },
    { id: 'white', icon: '☁️', name: 'Ruido blanco', description: 'Sonido uniforme para enmascarar distracciones.', engine: 'white' },
    { id: 'pink', icon: '🌸', name: 'Ruido rosa', description: 'Más suave que el ruido blanco.', engine: 'pink' },
    { id: 'brown', icon: '🟤', name: 'Ruido marrón', description: 'Grave, profundo y estable.', engine: 'brown' },
    { id: 'cafe', icon: '☕', name: 'Cafetería tranquila', description: 'Murmullo tenue y cálido de fondo.', engine: 'cafe' },
  ],
  asmr: [
    { id: 'tapping', icon: '🤏', name: 'Golpecitos', description: 'Golpes suaves y espaciados.', engine: 'tapping' },
    { id: 'brushing', icon: '🪶', name: 'Cepillado', description: 'Textura continua y delicada.', engine: 'brushing' },
    { id: 'keyboard', icon: '⌨️', name: 'Teclado', description: 'Pulsaciones ligeras e irregulares.', engine: 'keyboard' },
    { id: 'paper', icon: '📄', name: 'Papel', description: 'Roce suave y movimientos breves.', engine: 'paper' },
    { id: 'drops', icon: '💧', name: 'Gotas', description: 'Gotas aisladas con resonancia suave.', engine: 'drops' },
    { id: 'whisper', icon: '🤫', name: 'Susurro ambiental', description: 'Aire filtrado muy tenue, sin voces reales.', engine: 'whisper' },
    { id: 'crinkle', icon: '✨', name: 'Textura crujiente', description: 'Pequeños crujidos relajantes.', engine: 'crinkle' },
    { id: 'softclicks', icon: '🫰', name: 'Clics suaves', description: 'Clics cortos y calmados.', engine: 'softclicks' },
  ],
};

let serenSoundscapeController = null;

function stopSoundscapePage() {
  if (!serenSoundscapeController) return;
  serenSoundscapeController.destroy();
  serenSoundscapeController = null;
}

function injectSoundscapeCards() {
  const grid = document.querySelector('.relaxation-games-grid');
  if (!grid || grid.querySelector('[data-serenia-soundscape-card]')) return;

  const ambientCard = document.createElement('button');
  ambientCard.type = 'button';
  ambientCard.className = 'relaxation-game-card soundscape-home-card glass';
  ambientCard.dataset.navigate = '/games/ambient';
  ambientCard.dataset.sereniaSoundscapeCard = 'ambient';
  ambientCard.innerHTML = `
    <span class="soundscape-home-icon" aria-hidden="true">🌧️</span>
    <span class="game-card-copy">
      <small>Mezclador de sonidos</small>
      <strong>Ambientes de calma</strong>
      <span>Combina lluvia, olas, bosque y otras texturas para crear tu propio ambiente.</span>
    </span>
    <span class="game-card-action">Abrir →</span>
  `;

  const asmrCard = document.createElement('button');
  asmrCard.type = 'button';
  asmrCard.className = 'relaxation-game-card soundscape-home-card glass';
  asmrCard.dataset.navigate = '/games/asmr';
  asmrCard.dataset.sereniaSoundscapeCard = 'asmr';
  asmrCard.innerHTML = `
    <span class="soundscape-home-icon" aria-hidden="true">🎧</span>
    <span class="game-card-copy">
      <small>Mezclador sensorial</small>
      <strong>Sonidos ASMR</strong>
      <span>Combina golpecitos, cepillado, gotas y otras texturas suaves a tu ritmo.</span>
    </span>
    <span class="game-card-action">Abrir →</span>
  `;

  grid.appendChild(ambientCard);
  grid.appendChild(asmrCard);
}

function renderAmbientMixer() {
  renderSoundscapePage('ambient');
}

function renderAsmrMixer() {
  renderSoundscapePage('asmr');
}

function renderSoundscapePage(mode) {
  stopSoundscapePage();

  const isAsmr = mode === 'asmr';
  const title = isAsmr ? 'Sonidos ASMR' : 'Ambientes de calma';
  const eyebrow = isAsmr ? 'Exploración sensorial' : 'Paisajes sonoros';
  const subtitle = isAsmr
    ? 'Combina texturas suaves, ajusta su volumen y balance, y crea una mezcla a tu gusto.'
    : 'Activa varios sonidos al mismo tiempo y construye un ambiente tranquilo para leer, descansar o concentrarte.';
  const tip = isAsmr
    ? 'Usa audífonos a un volumen cómodo si quieres percibir mejor el balance izquierda/derecha.'
    : 'Empieza con dos o tres sonidos a volumen bajo y ajusta poco a poco.';

  document.getElementById('app').innerHTML = `
    ${renderNavbar()}
    <main class="soundscape-page container" data-soundscape-mode="${mode}">
      <header class="soundscape-page-header">
        <button class="soundscape-back-button" type="button" data-navigate="/dashboard">
          <span aria-hidden="true">←</span> Volver al inicio
        </button>
        <div>
          <span class="soundscape-eyebrow">${eyebrow}</span>
          <h1>${isAsmr ? '🎧' : '🌧️'} ${title}</h1>
          <p>${subtitle}</p>
        </div>
      </header>

      <section class="soundscape-shell glass">
        <div class="soundscape-toolbar">
          <div class="soundscape-toolbar-main">
            <button id="soundscapeStopAll" class="soundscape-toolbar-button danger-soft" type="button" disabled>
              <span aria-hidden="true">■</span> Detener todo
            </button>
            <button id="soundscapeSaveMix" class="soundscape-toolbar-button" type="button">
              <span aria-hidden="true">♡</span> Guardar mezcla
            </button>
          </div>

          <div class="soundscape-toolbar-secondary">
            <label class="soundscape-select-field">
              <span>Mis mezclas</span>
              <select id="soundscapePresetSelect">
                <option value="">Seleccionar…</option>
              </select>
            </label>
            <button id="soundscapeLoadMix" class="soundscape-icon-button" type="button" title="Cargar mezcla" aria-label="Cargar mezcla">▶</button>
            <button id="soundscapeDeleteMix" class="soundscape-icon-button" type="button" title="Eliminar mezcla guardada" aria-label="Eliminar mezcla guardada">🗑️</button>
            <label class="soundscape-select-field timer-field">
              <span>Temporizador</span>
              <select id="soundscapeTimer">
                <option value="0">Sin límite</option>
                <option value="5">5 min</option>
                <option value="15">15 min</option>
                <option value="30">30 min</option>
                <option value="60">60 min</option>
              </select>
            </label>
          </div>
        </div>

        <div class="soundscape-status-row">
          <div>
            <span>Sonidos activos</span>
            <strong id="soundscapeActiveCount">0</strong>
          </div>
          <p id="soundscapeTimerStatus">Sin temporizador</p>
        </div>

        <div class="soundscape-grid" id="soundscapeGrid">
          ${SERENIA_SOUND_CATALOG[mode].map(sound => renderSoundCard(sound, isAsmr)).join('')}
        </div>

        <footer class="soundscape-footer">
          <span aria-hidden="true">🌿</span>
          <p>${tip}</p>
        </footer>
        <p id="soundscapeLiveStatus" class="sr-only" aria-live="polite"></p>
      </section>
    </main>
  `;

  serenSoundscapeController = new SereniaSoundscapeController(mode);
}

function renderSoundCard(sound, isAsmr) {
  return `
    <article class="soundscape-sound-card" data-sound-id="${sound.id}">
      <button class="soundscape-toggle" type="button" aria-pressed="false" data-sound-toggle="${sound.id}">
        <span class="soundscape-sound-icon" aria-hidden="true">${sound.icon}</span>
        <span class="soundscape-sound-copy">
          <strong>${sound.name}</strong>
          <small>${sound.description}</small>
        </span>
        <span class="soundscape-play-indicator" aria-hidden="true">▶</span>
      </button>
      <div class="soundscape-controls">
        <label>
          <span>Volumen</span>
          <output id="volumeOutput-${sound.id}">45%</output>
          <input type="range" min="0" max="100" value="45" step="1" data-sound-volume="${sound.id}" aria-label="Volumen de ${sound.name}">
        </label>
        ${isAsmr ? `
          <label>
            <span>Balance</span>
            <output id="panOutput-${sound.id}">Centro</output>
            <input type="range" min="-100" max="100" value="0" step="1" data-sound-pan="${sound.id}" aria-label="Balance estéreo de ${sound.name}">
          </label>
        ` : ''}
      </div>
    </article>
  `;
}

class SereniaSoundscapeController {
  constructor(mode) {
    this.mode = mode;
    this.catalog = SERENIA_SOUND_CATALOG[mode];
    this.audioContext = null;
    this.masterGain = null;
    this.active = new Map();
    this.destroyed = false;
    this.timerId = null;
    this.timerEndsAt = 0;
    this.timerTicker = null;

    this.grid = document.getElementById('soundscapeGrid');
    this.stopAllButton = document.getElementById('soundscapeStopAll');
    this.saveButton = document.getElementById('soundscapeSaveMix');
    this.presetSelect = document.getElementById('soundscapePresetSelect');
    this.loadButton = document.getElementById('soundscapeLoadMix');
    this.deleteButton = document.getElementById('soundscapeDeleteMix');
    this.timerSelect = document.getElementById('soundscapeTimer');
    this.timerStatus = document.getElementById('soundscapeTimerStatus');
    this.activeCount = document.getElementById('soundscapeActiveCount');
    this.liveStatus = document.getElementById('soundscapeLiveStatus');

    this.bindEvents();
    this.refreshPresets();
  }

  bindEvents() {
    this.grid.addEventListener('click', (event) => {
      const button = event.target.closest('[data-sound-toggle]');
      if (!button) return;
      this.toggleSound(button.dataset.soundToggle).catch(err => {
        console.error('Soundscape audio error:', err);
        this.liveStatus.textContent = 'No fue posible iniciar el audio en este navegador.';
      });
    });

    this.grid.addEventListener('input', (event) => {
      const volumeId = event.target.dataset.soundVolume;
      const panId = event.target.dataset.soundPan;
      if (volumeId) this.setVolume(volumeId, Number(event.target.value));
      if (panId) this.setPan(panId, Number(event.target.value));
    });

    this.stopAllButton.addEventListener('click', () => this.stopAll());
    this.saveButton.addEventListener('click', () => this.savePreset());
    this.loadButton.addEventListener('click', () => this.loadSelectedPreset());
    this.deleteButton.addEventListener('click', () => this.deleteSelectedPreset());
    this.timerSelect.addEventListener('change', () => this.setTimer(Number(this.timerSelect.value)));
  }

  async ensureAudio() {
    if (!this.audioContext) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) throw new Error('Web Audio API no disponible');
      this.audioContext = new AudioContextClass();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.72;
      this.masterGain.connect(this.audioContext.destination);
    }
    if (this.audioContext.state === 'suspended') await this.audioContext.resume();
  }

  async toggleSound(id) {
    if (this.active.has(id)) {
      this.stopSound(id);
      return;
    }

    await this.ensureAudio();
    const sound = this.catalog.find(item => item.id === id);
    if (!sound) return;

    const card = this.grid.querySelector(`[data-sound-id="${id}"]`);
    const volumeInput = card.querySelector(`[data-sound-volume="${id}"]`);
    const panInput = card.querySelector(`[data-sound-pan="${id}"]`);
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = Number(volumeInput.value) / 100;

    let pannerNode = null;
    if (this.audioContext.createStereoPanner) {
      pannerNode = this.audioContext.createStereoPanner();
      pannerNode.pan.value = panInput ? Number(panInput.value) / 100 : 0;
      gainNode.connect(pannerNode);
      pannerNode.connect(this.masterGain);
    } else {
      gainNode.connect(this.masterGain);
    }

    const active = {
      sound,
      gainNode,
      pannerNode,
      nodes: [],
      timers: [],
      cleanup: [],
    };
    this.active.set(id, active);

    this.startEngine(active, sound.engine);
    this.updateCardState(id, true);
    this.updateActiveCount();
    this.liveStatus.textContent = `${sound.name} activado.`;
  }

  startEngine(active, engine) {
    switch (engine) {
      case 'white': return this.startNoise(active, 'white', { gain: 0.34 });
      case 'pink': return this.startNoise(active, 'pink', { gain: 0.42, lowpass: 6500 });
      case 'brown': return this.startNoise(active, 'brown', { gain: 0.56, lowpass: 2600 });
      case 'rain': return this.startRain(active);
      case 'ocean': return this.startOcean(active);
      case 'wind': return this.startWind(active);
      case 'forest': return this.startForest(active);
      case 'fire': return this.startFire(active);
      case 'stream': return this.startStream(active);
      case 'cafe': return this.startCafe(active);
      case 'tapping': return this.startTapping(active);
      case 'brushing': return this.startBrushing(active);
      case 'keyboard': return this.startKeyboard(active);
      case 'paper': return this.startPaper(active);
      case 'drops': return this.startDrops(active);
      case 'whisper': return this.startWhisper(active);
      case 'crinkle': return this.startCrinkle(active);
      case 'softclicks': return this.startSoftClicks(active);
      default: return this.startNoise(active, 'pink', { gain: 0.3 });
    }
  }

  createNoiseBuffer(color = 'white', seconds = 5) {
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, sampleRate * seconds, sampleRate);
    const data = buffer.getChannelData(0);
    let brown = 0;
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < data.length; i += 1) {
      const white = Math.random() * 2 - 1;
      if (color === 'brown') {
        brown = (brown + 0.02 * white) / 1.02;
        data[i] = brown * 3.2;
      } else if (color === 'pink') {
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      } else {
        data[i] = white * 0.72;
      }
    }
    return buffer;
  }

  createLoopingNoise(active, color, options = {}) {
    const source = this.audioContext.createBufferSource();
    source.buffer = this.createNoiseBuffer(color, options.seconds || 5);
    source.loop = true;

    let current = source;
    if (options.highpass) {
      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = options.highpass;
      current.connect(filter);
      current = filter;
      active.nodes.push(filter);
    }
    if (options.bandpass) {
      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = options.bandpass;
      filter.Q.value = options.q || 0.7;
      current.connect(filter);
      current = filter;
      active.nodes.push(filter);
    }
    if (options.lowpass) {
      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = options.lowpass;
      current.connect(filter);
      current = filter;
      active.nodes.push(filter);
    }

    const localGain = this.audioContext.createGain();
    localGain.gain.value = options.gain ?? 1;
    current.connect(localGain);
    localGain.connect(active.gainNode);
    source.start();
    active.nodes.push(source, localGain);
    return { source, localGain, current };
  }

  startNoise(active, color, options = {}) {
    this.createLoopingNoise(active, color, options);
  }

  startRain(active) {
    this.createLoopingNoise(active, 'white', { highpass: 900, lowpass: 8500, gain: 0.38 });
    this.startRandomRepeater(active, 650, 1500, () => this.playDroplet(active, 1050 + Math.random() * 900, 0.025));
  }

  startOcean(active) {
    const { localGain } = this.createLoopingNoise(active, 'pink', { lowpass: 1100, gain: 0.32 });
    const lfo = this.audioContext.createOscillator();
    const lfoGain = this.audioContext.createGain();
    lfo.frequency.value = 0.085;
    lfoGain.gain.value = 0.19;
    localGain.gain.value = 0.28;
    lfo.connect(lfoGain);
    lfoGain.connect(localGain.gain);
    lfo.start();
    active.nodes.push(lfo, lfoGain);
  }

  startWind(active) {
    const source = this.audioContext.createBufferSource();
    source.buffer = this.createNoiseBuffer('white', 5);
    source.loop = true;
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 720;
    filter.Q.value = 0.6;
    const localGain = this.audioContext.createGain();
    localGain.gain.value = 0.34;
    const lfo = this.audioContext.createOscillator();
    const lfoGain = this.audioContext.createGain();
    lfo.frequency.value = 0.12;
    lfoGain.gain.value = 320;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    source.connect(filter);
    filter.connect(localGain);
    localGain.connect(active.gainNode);
    source.start();
    lfo.start();
    active.nodes.push(source, filter, localGain, lfo, lfoGain);
  }

  startForest(active) {
    this.createLoopingNoise(active, 'pink', { lowpass: 2400, gain: 0.16 });
    this.startRandomRepeater(active, 2200, 5200, () => this.playBird(active));
  }

  startFire(active) {
    this.createLoopingNoise(active, 'brown', { highpass: 120, lowpass: 2200, gain: 0.22 });
    this.startRandomRepeater(active, 180, 780, () => this.playCrackle(active, 0.035 + Math.random() * 0.035));
  }

  startStream(active) {
    const { localGain } = this.createLoopingNoise(active, 'white', { bandpass: 1700, q: 0.48, gain: 0.25 });
    const lfo = this.audioContext.createOscillator();
    const lfoGain = this.audioContext.createGain();
    lfo.frequency.value = 0.35;
    lfoGain.gain.value = 0.07;
    lfo.connect(lfoGain);
    lfoGain.connect(localGain.gain);
    lfo.start();
    active.nodes.push(lfo, lfoGain);
    this.startRandomRepeater(active, 900, 1900, () => this.playDroplet(active, 1300 + Math.random() * 500, 0.018));
  }

  startCafe(active) {
    const { localGain } = this.createLoopingNoise(active, 'pink', { bandpass: 780, q: 0.45, lowpass: 1800, gain: 0.18 });
    const lfo = this.audioContext.createOscillator();
    const lfoGain = this.audioContext.createGain();
    lfo.frequency.value = 0.21;
    lfoGain.gain.value = 0.04;
    lfo.connect(lfoGain);
    lfoGain.connect(localGain.gain);
    lfo.start();
    active.nodes.push(lfo, lfoGain);
    this.startRandomRepeater(active, 1600, 4200, () => this.playSoftClick(active, 0.014));
  }

  startTapping(active) {
    this.startRandomRepeater(active, 380, 900, () => this.playTap(active));
    this.playTap(active);
  }

  startBrushing(active) {
    const { localGain } = this.createLoopingNoise(active, 'pink', { bandpass: 2400, q: 0.6, gain: 0.18 });
    const lfo = this.audioContext.createOscillator();
    const lfoGain = this.audioContext.createGain();
    lfo.frequency.value = 0.42;
    lfoGain.gain.value = 0.085;
    lfo.connect(lfoGain);
    lfoGain.connect(localGain.gain);
    lfo.start();
    active.nodes.push(lfo, lfoGain);
  }

  startKeyboard(active) {
    this.startRandomRepeater(active, 110, 460, () => this.playKeyboardClick(active));
    this.playKeyboardClick(active);
  }

  startPaper(active) {
    this.startRandomRepeater(active, 900, 2500, () => this.playNoiseBurst(active, 0.16 + Math.random() * 0.2, 1800, 0.055));
    this.playNoiseBurst(active, 0.2, 1700, 0.05);
  }

  startDrops(active) {
    this.startRandomRepeater(active, 650, 1700, () => this.playDroplet(active, 700 + Math.random() * 650, 0.06));
    this.playDroplet(active, 900, 0.06);
  }

  startWhisper(active) {
    const { localGain } = this.createLoopingNoise(active, 'white', { bandpass: 3200, q: 0.55, lowpass: 5200, gain: 0.095 });
    const lfo = this.audioContext.createOscillator();
    const lfoGain = this.audioContext.createGain();
    lfo.frequency.value = 0.18;
    lfoGain.gain.value = 0.04;
    lfo.connect(lfoGain);
    lfoGain.connect(localGain.gain);
    lfo.start();
    active.nodes.push(lfo, lfoGain);
  }

  startCrinkle(active) {
    this.startRandomRepeater(active, 140, 580, () => this.playCrackle(active, 0.025 + Math.random() * 0.035));
    this.playCrackle(active, 0.04);
  }

  startSoftClicks(active) {
    this.startRandomRepeater(active, 420, 1100, () => this.playSoftClick(active, 0.045));
    this.playSoftClick(active, 0.04);
  }

  startRandomRepeater(active, minMs, maxMs, callback) {
    let cancelled = false;
    let timeoutId = null;
    const schedule = () => {
      if (cancelled || this.destroyed || !this.active.has(active.sound.id)) return;
      const delay = minMs + Math.random() * (maxMs - minMs);
      timeoutId = window.setTimeout(() => {
        if (!cancelled && this.active.has(active.sound.id)) callback();
        schedule();
      }, delay);
      active.timers.push(timeoutId);
    };
    schedule();
    active.cleanup.push(() => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    });
  }

  createTransientRoute(active) {
    const gain = this.audioContext.createGain();
    let destination = gain;
    if (active.pannerNode) {
      gain.connect(active.pannerNode);
    } else {
      gain.connect(active.gainNode);
    }
    return { gain, destination };
  }

  playTap(active) {
    const now = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(190 + Math.random() * 180, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.055);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.095, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.085);
    osc.connect(gain);
    gain.connect(active.gainNode);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  playKeyboardClick(active) {
    const now = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = 'square';
    osc.frequency.value = 650 + Math.random() * 500;
    gain.gain.setValueAtTime(0.03, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.028);
    osc.connect(gain);
    gain.connect(active.gainNode);
    osc.start(now);
    osc.stop(now + 0.03);
  }

  playDroplet(active, frequency = 900, volume = 0.05) {
    const now = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(220, frequency * 0.52), now + 0.18);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    osc.connect(gain);
    gain.connect(active.gainNode);
    osc.start(now);
    osc.stop(now + 0.23);
  }

  playBird(active) {
    const now = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = 'sine';
    const base = 1500 + Math.random() * 800;
    osc.frequency.setValueAtTime(base, now);
    osc.frequency.linearRampToValueAtTime(base * 1.32, now + 0.07);
    osc.frequency.linearRampToValueAtTime(base * 0.92, now + 0.16);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.018, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    osc.connect(gain);
    gain.connect(active.gainNode);
    osc.start(now);
    osc.stop(now + 0.19);
  }

  playCrackle(active, volume = 0.04) {
    this.playNoiseBurst(active, 0.025 + Math.random() * 0.05, 3200 + Math.random() * 2500, volume);
  }

  playSoftClick(active, volume = 0.035) {
    const now = this.audioContext.currentTime;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.type = 'sine';
    osc.frequency.value = 420 + Math.random() * 260;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);
    osc.connect(gain);
    gain.connect(active.gainNode);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  playNoiseBurst(active, duration = 0.12, centerFrequency = 2000, volume = 0.04) {
    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, Math.max(32, Math.floor(sampleRate * duration)), sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = centerFrequency;
    filter.Q.value = 0.8;
    const gain = this.audioContext.createGain();
    const now = this.audioContext.currentTime;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(active.gainNode);
    source.start(now);
  }

  setVolume(id, value) {
    const output = document.getElementById(`volumeOutput-${id}`);
    if (output) output.textContent = `${value}%`;
    const active = this.active.get(id);
    if (active && this.audioContext) {
      active.gainNode.gain.setTargetAtTime(value / 100, this.audioContext.currentTime, 0.025);
    }
  }

  setPan(id, value) {
    const output = document.getElementById(`panOutput-${id}`);
    if (output) {
      output.textContent = value === 0 ? 'Centro' : value < 0 ? `Izq. ${Math.abs(value)}%` : `Der. ${value}%`;
    }
    const active = this.active.get(id);
    if (active?.pannerNode && this.audioContext) {
      active.pannerNode.pan.setTargetAtTime(value / 100, this.audioContext.currentTime, 0.025);
    }
  }

  stopSound(id) {
    const active = this.active.get(id);
    if (!active) return;

    active.cleanup.forEach(fn => {
      try { fn(); } catch (_) {}
    });
    active.timers.forEach(timer => clearTimeout(timer));
    active.nodes.forEach(node => {
      try { if (typeof node.stop === 'function') node.stop(); } catch (_) {}
      try { if (typeof node.disconnect === 'function') node.disconnect(); } catch (_) {}
    });
    try { active.gainNode.disconnect(); } catch (_) {}
    try { active.pannerNode?.disconnect(); } catch (_) {}

    this.active.delete(id);
    this.updateCardState(id, false);
    this.updateActiveCount();
    this.liveStatus.textContent = `${active.sound.name} detenido.`;
  }

  stopAll({ keepTimer = false } = {}) {
    [...this.active.keys()].forEach(id => this.stopSound(id));
    if (!keepTimer) this.clearTimer();
    this.liveStatus.textContent = 'Todos los sonidos se detuvieron.';
  }

  updateCardState(id, playing) {
    const card = this.grid.querySelector(`[data-sound-id="${id}"]`);
    if (!card) return;
    card.classList.toggle('is-playing', playing);
    const toggle = card.querySelector('[data-sound-toggle]');
    toggle.setAttribute('aria-pressed', String(playing));
    const indicator = card.querySelector('.soundscape-play-indicator');
    indicator.textContent = playing ? '■' : '▶';
  }

  updateActiveCount() {
    this.activeCount.textContent = String(this.active.size);
    this.stopAllButton.disabled = this.active.size === 0;
  }

  getCurrentMix() {
    return this.catalog.map(sound => {
      const card = this.grid.querySelector(`[data-sound-id="${sound.id}"]`);
      return {
        id: sound.id,
        active: this.active.has(sound.id),
        volume: Number(card.querySelector(`[data-sound-volume="${sound.id}"]`).value),
        pan: Number(card.querySelector(`[data-sound-pan="${sound.id}"]`)?.value || 0),
      };
    });
  }

  readPresets() {
    try {
      const parsed = JSON.parse(localStorage.getItem(SERENIA_SOUND_PRESET_KEYS[this.mode]) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  writePresets(presets) {
    localStorage.setItem(SERENIA_SOUND_PRESET_KEYS[this.mode], JSON.stringify(presets));
  }

  savePreset() {
    const mix = this.getCurrentMix();
    if (!mix.some(item => item.active)) {
      alert('Activa al menos un sonido antes de guardar la mezcla.');
      return;
    }
    const suggested = this.mode === 'asmr' ? 'Mi mezcla ASMR' : 'Mi ambiente';
    const name = window.prompt('Nombre de la mezcla:', suggested)?.trim();
    if (!name) return;

    const presets = this.readPresets();
    const existingIndex = presets.findIndex(item => item.name.toLowerCase() === name.toLowerCase());
    const preset = { name, mix, savedAt: new Date().toISOString() };
    if (existingIndex >= 0) presets[existingIndex] = preset;
    else presets.push(preset);
    this.writePresets(presets.slice(-20));
    this.refreshPresets(name);
    this.liveStatus.textContent = `Mezcla ${name} guardada.`;
  }

  refreshPresets(selectName = '') {
    const presets = this.readPresets();
    this.presetSelect.innerHTML = '<option value="">Seleccionar…</option>' + presets
      .map((preset, index) => `<option value="${index}">${escapeHtml(preset.name)}</option>`)
      .join('');
    if (selectName) {
      const index = presets.findIndex(item => item.name === selectName);
      if (index >= 0) this.presetSelect.value = String(index);
    }
  }

  async loadSelectedPreset() {
    const index = Number(this.presetSelect.value);
    if (!Number.isInteger(index) || this.presetSelect.value === '') return;
    const preset = this.readPresets()[index];
    if (!preset) return;

    this.stopAll();
    for (const item of preset.mix || []) {
      const card = this.grid.querySelector(`[data-sound-id="${item.id}"]`);
      if (!card) continue;
      const volume = card.querySelector(`[data-sound-volume="${item.id}"]`);
      const pan = card.querySelector(`[data-sound-pan="${item.id}"]`);
      volume.value = String(item.volume ?? 45);
      this.setVolume(item.id, Number(volume.value));
      if (pan) {
        pan.value = String(item.pan ?? 0);
        this.setPan(item.id, Number(pan.value));
      }
      if (item.active) await this.toggleSound(item.id);
    }
    this.liveStatus.textContent = `Mezcla ${preset.name} cargada.`;
  }

  deleteSelectedPreset() {
    const index = Number(this.presetSelect.value);
    if (!Number.isInteger(index) || this.presetSelect.value === '') return;
    const presets = this.readPresets();
    const preset = presets[index];
    if (!preset) return;
    if (!window.confirm(`¿Eliminar la mezcla “${preset.name}”?`)) return;
    presets.splice(index, 1);
    this.writePresets(presets);
    this.refreshPresets();
  }

  setTimer(minutes) {
    this.clearTimer(false);
    if (!minutes) {
      this.timerStatus.textContent = 'Sin temporizador';
      return;
    }

    this.timerEndsAt = Date.now() + minutes * 60 * 1000;
    this.timerId = window.setTimeout(() => {
      this.stopAll({ keepTimer: true });
      this.clearTimer();
      this.liveStatus.textContent = 'El temporizador terminó y los sonidos se detuvieron.';
    }, minutes * 60 * 1000);
    this.timerTicker = window.setInterval(() => this.updateTimerStatus(), 1000);
    this.updateTimerStatus();
  }

  updateTimerStatus() {
    if (!this.timerEndsAt) return;
    const remaining = Math.max(0, this.timerEndsAt - Date.now());
    const totalSeconds = Math.ceil(remaining / 1000);
    const min = Math.floor(totalSeconds / 60);
    const sec = totalSeconds % 60;
    this.timerStatus.textContent = `Se detendrá en ${min}:${String(sec).padStart(2, '0')}`;
  }

  clearTimer(resetSelect = true) {
    if (this.timerId) clearTimeout(this.timerId);
    if (this.timerTicker) clearInterval(this.timerTicker);
    this.timerId = null;
    this.timerTicker = null;
    this.timerEndsAt = 0;
    if (resetSelect && this.timerSelect) this.timerSelect.value = '0';
    if (this.timerStatus) this.timerStatus.textContent = 'Sin temporizador';
  }

  destroy() {
    this.destroyed = true;
    this.stopAll();
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
    }
    this.audioContext = null;
  }
}

// Registrar las dos rutas sin modificar app.js.
if (typeof routes !== 'undefined') {
  routes['/games/ambient'] = () => requireAuth(renderAmbientMixer);
  routes['/games/asmr'] = () => requireAuth(renderAsmrMixer);
}

// Inserta las tarjetas cuando el dashboard es renderizado.
const serenSoundscapeObserver = new MutationObserver(() => {
  injectSoundscapeCards();
  if (serenSoundscapeController && !document.querySelector('.soundscape-page')) {
    stopSoundscapePage();
  }
});

serenSoundscapeObserver.observe(document.documentElement, { childList: true, subtree: true });
document.addEventListener('DOMContentLoaded', injectSoundscapeCards);
