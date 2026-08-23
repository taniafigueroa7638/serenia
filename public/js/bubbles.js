// Minijuego local de relajación. No usa iframes, recursos externos ni librerías.
const BUBBLE_COLORS = [
  ['#c5b5ff', '#7e57c2'],
  ['#b8ecdc', '#43a98a'],
  ['#ffd1c5', '#ff8a65'],
  ['#bce5ff', '#4a9dcc'],
  ['#f5c8ff', '#b765c5'],
];

let bubbleGameController = null;

function stopBubbleGame() {
  if (!bubbleGameController) return;
  bubbleGameController.destroy();
  bubbleGameController = null;
}

function renderBubbleGame() {
  stopBubbleGame();

  document.getElementById('app').innerHTML = `
    ${renderNavbar()}
    <main class="bubbles-page container">
      <header class="bubbles-page-header">
        <button class="bubbles-back-button" type="button" data-navigate="/dashboard">
          <span aria-hidden="true">←</span> Volver al inicio
        </button>
        <div>
          <span class="bubbles-eyebrow">Actividad de relajación</span>
          <h1>Burbujas de calma</h1>
          <p>Respira con tranquilidad y explota las burbujas a tu propio ritmo.</p>
        </div>
      </header>

      <section class="bubble-game-shell glass" aria-labelledby="bubbleGameTitle">
        <div class="bubble-game-toolbar">
          <div class="bubble-game-brand">
            <span class="bubble-game-brand-icon" aria-hidden="true">🫧</span>
            <div>
              <strong id="bubbleGameTitle">Tu pausa de calma</strong>
              <small>No hay vidas, errores ni puntuaciones negativas.</small>
            </div>
          </div>
          <div class="bubble-game-settings">
            <label for="bubbleSessionLength">Duración</label>
            <select id="bubbleSessionLength">
              <option value="60">1 minuto</option>
              <option value="180" selected>3 minutos</option>
              <option value="300">5 minutos</option>
              <option value="0">Sin límite</option>
            </select>
            <button id="bubbleSoundButton" class="bubble-control-button" type="button" aria-pressed="true">
              <span aria-hidden="true">🔊</span> Sonido
            </button>
          </div>
        </div>

        <div class="bubble-game-hud" aria-label="Estado de la actividad">
          <div class="bubble-hud-item">
            <span>Explotadas</span>
            <strong id="bubblePopCount">0</strong>
          </div>
          <div class="bubble-hud-message" id="bubbleCalmMessage">Tómate este momento para ti</div>
          <div class="bubble-hud-item">
            <span>Tiempo</span>
            <strong id="bubbleTime">03:00</strong>
          </div>
        </div>

        <div class="bubble-canvas-wrap" id="bubbleCanvasWrap">
          <canvas id="bubbleCanvas" tabindex="0" aria-label="Zona del juego. Toca o haz clic sobre las burbujas para explotarlas."></canvas>
          <div class="bubble-game-overlay is-visible" id="bubbleGameOverlay">
            <div class="bubble-overlay-card">
              <span class="bubble-overlay-icon" aria-hidden="true">🫧</span>
              <h2 id="bubbleOverlayTitle">Una pausa solo para ti</h2>
              <p id="bubbleOverlayText">Toca o haz clic sobre cada burbuja. También puedes usar la barra espaciadora.</p>
              <button class="btn btn-primary bubble-start-button" id="bubbleStartButton" type="button">Comenzar</button>
            </div>
          </div>
          <div class="bubble-pause-badge" id="bubblePauseBadge" hidden>Pausa</div>
        </div>

        <div class="bubble-game-footer">
          <p id="bubbleLiveStatus" class="sr-only" aria-live="polite"></p>
          <span>Consejo: afloja los hombros y respira lentamente mientras juegas.</span>
          <div class="bubble-footer-actions">
            <button id="bubblePauseButton" class="bubble-control-button" type="button" disabled>Pausar</button>
            <button id="bubbleRestartButton" class="bubble-control-button" type="button" disabled>Reiniciar</button>
          </div>
        </div>
      </section>
    </main>
  `;

  bubbleGameController = new SereniaBubbleGame({
    canvas: document.getElementById('bubbleCanvas'),
    wrap: document.getElementById('bubbleCanvasWrap'),
    overlay: document.getElementById('bubbleGameOverlay'),
    overlayTitle: document.getElementById('bubbleOverlayTitle'),
    overlayText: document.getElementById('bubbleOverlayText'),
    startButton: document.getElementById('bubbleStartButton'),
    pauseButton: document.getElementById('bubblePauseButton'),
    restartButton: document.getElementById('bubbleRestartButton'),
    soundButton: document.getElementById('bubbleSoundButton'),
    durationSelect: document.getElementById('bubbleSessionLength'),
    countLabel: document.getElementById('bubblePopCount'),
    timeLabel: document.getElementById('bubbleTime'),
    calmMessage: document.getElementById('bubbleCalmMessage'),
    liveStatus: document.getElementById('bubbleLiveStatus'),
    pauseBadge: document.getElementById('bubblePauseBadge'),
  });
}

class SereniaBubbleGame {
  constructor(elements) {
    Object.assign(this, elements);
    this.ctx = this.canvas.getContext('2d');
    this.bubbles = [];
    this.ripples = [];
    this.running = false;
    this.paused = false;
    this.finished = false;
    this.soundEnabled = true;
    this.popped = 0;
    this.streak = 0;
    this.elapsedMs = 0;
    this.durationMs = Number(this.durationSelect.value) * 1000;
    this.lastFrame = 0;
    this.lastPopAt = 0;
    this.spawnAccumulator = 0;
    this.animationFrameId = null;
    this.audioContext = null;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.width = 1;
    this.height = 1;

    this.handlePointer = this.handlePointer.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);
    this.handleVisibility = this.handleVisibility.bind(this);
    this.loop = this.loop.bind(this);

    this.bindEvents();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(this.wrap);
    this.resize();
    this.draw();
  }

  bindEvents() {
    this.startButton.addEventListener('click', () => this.start());
    this.pauseButton.addEventListener('click', () => this.togglePause());
    this.restartButton.addEventListener('click', () => this.start());
    this.soundButton.addEventListener('click', () => this.toggleSound());
    this.durationSelect.addEventListener('change', () => {
      if (!this.running) this.updateTimeLabel();
    });
    this.canvas.addEventListener('pointerdown', this.handlePointer);
    this.canvas.addEventListener('keydown', this.handleKeydown);
    document.addEventListener('visibilitychange', this.handleVisibility);
  }

  resize() {
    const bounds = this.wrap.getBoundingClientRect();
    this.width = Math.max(280, Math.floor(bounds.width));
    this.height = Math.max(360, Math.floor(bounds.height));
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.floor(this.width * pixelRatio);
    this.canvas.height = Math.floor(this.height * pixelRatio);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    this.bubbles.forEach((bubble) => {
      bubble.x = Math.min(Math.max(bubble.radius, bubble.x), this.width - bubble.radius);
      bubble.y = Math.min(bubble.y, this.height + bubble.radius);
    });
    this.draw();
  }

  start() {
    this.durationMs = Number(this.durationSelect.value) * 1000;
    this.bubbles = [];
    this.ripples = [];
    this.popped = 0;
    this.streak = 0;
    this.elapsedMs = 0;
    this.lastPopAt = 0;
    this.spawnAccumulator = 0;
    this.running = true;
    this.paused = false;
    this.finished = false;
    this.lastFrame = performance.now();
    this.overlay.classList.remove('is-visible');
    this.pauseBadge.hidden = true;
    this.pauseButton.disabled = false;
    this.pauseButton.textContent = 'Pausar';
    this.restartButton.disabled = false;
    this.durationSelect.disabled = true;
    this.countLabel.textContent = '0';
    this.calmMessage.textContent = 'Respira y sigue tu propio ritmo';
    this.updateTimeLabel();
    this.liveStatus.textContent = 'Actividad iniciada.';
    this.canvas.focus({ preventScroll: true });

    for (let index = 0; index < 7; index += 1) {
      this.spawnBubble(this.height * (0.18 + index * 0.12));
    }

    cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = requestAnimationFrame(this.loop);
  }

  loop(now) {
    if (!this.running) return;
    const deltaSeconds = Math.min((now - this.lastFrame) / 1000, 0.04);
    this.lastFrame = now;

    if (!this.paused) {
      this.update(deltaSeconds, now);
      this.draw();
    }

    if (this.running) this.animationFrameId = requestAnimationFrame(this.loop);
  }

  update(deltaSeconds, now) {
    this.elapsedMs += deltaSeconds * 1000;
    if (this.durationMs > 0 && this.elapsedMs >= this.durationMs) {
      this.finish();
      return;
    }

    const progress = this.durationMs > 0
      ? Math.min(this.elapsedMs / this.durationMs, 1)
      : Math.min(this.elapsedMs / 180000, 1);
    const spawnEvery = 1050 - progress * 330;
    this.spawnAccumulator += deltaSeconds * 1000;

    if (this.spawnAccumulator >= spawnEvery && this.bubbles.length < 26) {
      this.spawnAccumulator = 0;
      this.spawnBubble();
    }

    this.bubbles.forEach((bubble) => {
      bubble.y -= bubble.speed * deltaSeconds;
      bubble.phase += deltaSeconds * bubble.wobbleRate;
      bubble.drawX = bubble.x + Math.sin(bubble.phase) * bubble.wobble;
    });
    this.bubbles = this.bubbles.filter((bubble) => bubble.y + bubble.radius > -10);

    this.ripples.forEach((ripple) => {
      ripple.age += deltaSeconds;
      ripple.radius += 54 * deltaSeconds;
    });
    this.ripples = this.ripples.filter((ripple) => ripple.age < 0.55);

    if (this.lastPopAt && now - this.lastPopAt > 1200) this.streak = 0;
    this.updateTimeLabel();
  }

  spawnBubble(initialY = null) {
    const radius = 18 + Math.random() * 30;
    const color = BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)];
    const availableWidth = Math.max(1, this.width - radius * 2);
    const x = radius + Math.random() * availableWidth;
    this.bubbles.push({
      x,
      drawX: x,
      y: initialY === null ? this.height + radius : initialY,
      radius,
      speed: (this.reducedMotion ? 12 : 17) + Math.random() * 17,
      wobble: this.reducedMotion ? 0 : 3 + Math.random() * 7,
      wobbleRate: 0.7 + Math.random() * 1.1,
      phase: Math.random() * Math.PI * 2,
      color,
    });
  }

  handlePointer(event) {
    if (!this.running || this.paused) return;
    const bounds = this.canvas.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    this.popAt(x, y);
  }

  handleKeydown(event) {
    if (event.code === 'Space') {
      event.preventDefault();
      if (!this.running || this.paused || this.bubbles.length === 0) return;
      const target = this.bubbles.reduce((nearest, bubble) => {
        const distance = Math.hypot(bubble.drawX - this.width / 2, bubble.y - this.height / 2);
        return !nearest || distance < nearest.distance ? { bubble, distance } : nearest;
      }, null);
      if (target) this.popBubble(target.bubble);
    }

    if (event.code === 'KeyP' && this.running) this.togglePause();
  }

  popAt(x, y) {
    let selected = null;
    for (let index = this.bubbles.length - 1; index >= 0; index -= 1) {
      const bubble = this.bubbles[index];
      if (Math.hypot(x - bubble.drawX, y - bubble.y) <= bubble.radius + 8) {
        selected = bubble;
        break;
      }
    }
    if (selected) this.popBubble(selected);
  }

  popBubble(bubble) {
    const now = performance.now();
    this.streak = this.lastPopAt && now - this.lastPopAt < 850 ? this.streak + 1 : 1;
    this.lastPopAt = now;
    this.popped += 1;
    this.countLabel.textContent = String(this.popped);
    this.bubbles = this.bubbles.filter((item) => item !== bubble);
    this.ripples.push({ x: bubble.drawX, y: bubble.y, radius: bubble.radius * 0.55, age: 0, color: bubble.color[1] });
    this.playPop(bubble.radius);

    const messages = this.streak >= 7
      ? ['Qué buen ritmo', 'Sigue respirando con calma', 'Estás muy concentrado']
      : ['Muy bien', 'Sin prisa', 'Este momento es tuyo', 'Respira suavemente'];
    this.calmMessage.textContent = messages[Math.floor(Math.random() * messages.length)];
    this.liveStatus.textContent = `Burbuja explotada. Total: ${this.popped}.`;
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.drawAmbientGlow();
    this.bubbles.forEach((bubble) => this.drawBubble(bubble));
    this.ripples.forEach((ripple) => this.drawRipple(ripple));
  }

  drawAmbientGlow() {
    const glow = this.ctx.createRadialGradient(
      this.width * 0.5, this.height * 0.46, 20,
      this.width * 0.5, this.height * 0.46, Math.max(this.width, this.height) * 0.65,
    );
    glow.addColorStop(0, 'rgba(255,255,255,0.10)');
    glow.addColorStop(1, 'rgba(126,87,194,0.02)');
    this.ctx.fillStyle = glow;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  drawBubble(bubble) {
    const { drawX: x, y, radius, color } = bubble;
    const gradient = this.ctx.createRadialGradient(
      x - radius * 0.35, y - radius * 0.38, radius * 0.08,
      x, y, radius,
    );
    gradient.addColorStop(0, 'rgba(255,255,255,0.96)');
    gradient.addColorStop(0.28, `${color[0]}cc`);
    gradient.addColorStop(0.78, `${color[1]}82`);
    gradient.addColorStop(1, `${color[1]}2b`);

    this.ctx.save();
    this.ctx.shadowColor = `${color[1]}55`;
    this.ctx.shadowBlur = 18;
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = gradient;
    this.ctx.fill();
    this.ctx.lineWidth = 1.4;
    this.ctx.strokeStyle = 'rgba(255,255,255,0.72)';
    this.ctx.stroke();

    this.ctx.shadowBlur = 0;
    this.ctx.beginPath();
    this.ctx.arc(x - radius * 0.3, y - radius * 0.34, radius * 0.17, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(255,255,255,0.72)';
    this.ctx.fill();
    this.ctx.restore();
  }

  drawRipple(ripple) {
    const opacity = Math.max(0, 1 - ripple.age / 0.55);
    this.ctx.save();
    this.ctx.globalAlpha = opacity;
    this.ctx.beginPath();
    this.ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
    this.ctx.strokeStyle = ripple.color;
    this.ctx.lineWidth = 2.2;
    this.ctx.stroke();
    this.ctx.restore();
  }

  togglePause() {
    if (!this.running) return;
    this.paused = !this.paused;
    this.pauseButton.textContent = this.paused ? 'Continuar' : 'Pausar';
    this.pauseBadge.hidden = !this.paused;
    this.calmMessage.textContent = this.paused ? 'La actividad está en pausa' : 'Continúa a tu propio ritmo';
    this.liveStatus.textContent = this.paused ? 'Actividad pausada.' : 'Actividad reanudada.';
    this.lastFrame = performance.now();
  }

  handleVisibility() {
    if (document.hidden && this.running && !this.paused) this.togglePause();
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    this.soundButton.setAttribute('aria-pressed', String(this.soundEnabled));
    this.soundButton.innerHTML = this.soundEnabled
      ? '<span aria-hidden="true">🔊</span> Sonido'
      : '<span aria-hidden="true">🔇</span> Silencio';
  }

  playPop(radius) {
    if (!this.soundEnabled) return;
    try {
      this.audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      const start = this.audioContext.currentTime;
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(780 - radius * 5, start);
      oscillator.frequency.exponentialRampToValueAtTime(360, start + 0.08);
      gain.gain.setValueAtTime(0.035, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.09);
      oscillator.connect(gain);
      gain.connect(this.audioContext.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.1);
    } catch (error) {
      this.soundEnabled = false;
    }
  }

  updateTimeLabel() {
    const configuredMs = Number(this.durationSelect.value) * 1000;
    const duration = this.running ? this.durationMs : configuredMs;
    if (duration === 0) {
      this.timeLabel.textContent = this.running ? this.formatTime(this.elapsedMs) : 'Libre';
      return;
    }
    const remaining = this.running ? duration - this.elapsedMs : duration;
    this.timeLabel.textContent = this.formatTime(Math.max(0, remaining));
  }

  formatTime(milliseconds) {
    const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  finish() {
    this.running = false;
    this.finished = true;
    cancelAnimationFrame(this.animationFrameId);
    this.durationSelect.disabled = false;
    this.pauseButton.disabled = true;
    this.pauseBadge.hidden = true;
    this.timeLabel.textContent = '00:00';
    this.overlayTitle.textContent = 'Tu pausa ha terminado';
    this.overlayText.textContent = `Explotaste ${this.popped} ${this.popped === 1 ? 'burbuja' : 'burbujas'}. Respira una vez más antes de continuar.`;
    this.startButton.textContent = 'Repetir actividad';
    this.overlay.classList.add('is-visible');
    this.calmMessage.textContent = 'Gracias por dedicarte este momento';
    this.liveStatus.textContent = `Actividad terminada. Explotaste ${this.popped} burbujas.`;
    this.draw();
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.animationFrameId);
    this.canvas.removeEventListener('pointerdown', this.handlePointer);
    this.canvas.removeEventListener('keydown', this.handleKeydown);
    document.removeEventListener('visibilitychange', this.handleVisibility);
    if (this.resizeObserver) this.resizeObserver.disconnect();
    if (this.audioContext && this.audioContext.state !== 'closed') this.audioContext.close();
  }
}
