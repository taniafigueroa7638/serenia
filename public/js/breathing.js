// Serenia · Respiración guiada. Implementación independiente, sin código de Breathe Ease.
// Mantiene la actividad integrada en la SPA actual y desactiva el acceso a ASMR.

const SERENIA_BREATH_PATTERNS = Object.freeze({
  suave: {
    name: 'Respiración suave · 4–6',
    description: 'Inhala durante 4 segundos y exhala suavemente durante 6. Sin retenciones.',
    phases: [{ title: 'Inhala', seconds: 4, from: 0.72, to: 1.07 }, { title: 'Exhala', seconds: 6, from: 1.07, to: 0.72 }],
  },
  cuadrada: {
    name: 'Respiración cuadrada · 4–4–4–4',
    description: 'Inhala, mantén, exhala y descansa durante 4 segundos cada vez.',
    phases: [{ title: 'Inhala', seconds: 4, from: 0.72, to: 1.07 }, { title: 'Mantén suavemente', seconds: 4, from: 1.07, to: 1.07 }, { title: 'Exhala', seconds: 4, from: 1.07, to: 0.72 }, { title: 'Descansa', seconds: 4, from: 0.72, to: 0.72 }],
  },
  relajacion: {
    name: 'Respiración 4–7–8',
    description: 'Inhala 4 segundos, mantén 7 y exhala 8. Evita retenciones si te incomodan.',
    phases: [{ title: 'Inhala', seconds: 4, from: 0.72, to: 1.07 }, { title: 'Mantén suavemente', seconds: 7, from: 1.07, to: 1.07 }, { title: 'Exhala', seconds: 8, from: 1.07, to: 0.72 }],
  },
});

let serenBreathingController = null;

function stopBreathingPage() {
  if (!serenBreathingController) return;
  serenBreathingController.destroy();
  serenBreathingController = null;
}

function updateSereniaNavbarClearance() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;
  const height = Math.ceil(navbar.getBoundingClientRect().height);
  if (height > 0) {
    const newValue = `${height}px`;
    if (document.documentElement.style.getPropertyValue('--serenia-navbar-height') !== newValue) {
      document.documentElement.style.setProperty('--serenia-navbar-height', newValue);
    }
  }
}

function adaptSereniaRelaxationCards() {
  const grid = document.querySelector('.relaxation-games-grid');
  if (!grid) return;

  // Ambientes es el único mezclador que permanece; su motor se conserva intacto.
  const ambient = grid.querySelector('[data-serenia-soundscape-card="ambient"]');
  if (ambient) {
    const action = ambient.querySelector('.game-card-action');
    if (action && action.textContent !== 'Jugar →') action.textContent = 'Jugar →';
  }

  // Retiramos la tarjeta ASMR, que el módulo anterior inyectaba automáticamente.
  grid.querySelector('[data-serenia-soundscape-card="asmr"]')?.remove();

  if (!grid.querySelector('[data-serenia-breathing-card]')) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'relaxation-game-card breathing-home-card glass';
    card.dataset.navigate = '/games/breathe';
    card.dataset.sereniaBreathingCard = 'true';
    card.innerHTML = `
      <span class="breathing-home-icon" aria-hidden="true">🫁</span>
      <span class="game-card-copy">
        <small>Actividad de respiración</small>
        <strong>Respira con Serenia</strong>
        <span>Sigue un círculo animado y elige un ritmo de respiración tranquilo.</span>
      </span>
      <span class="game-card-action">Jugar →</span>
    `;
    grid.appendChild(card);
  }
}

function renderBreathingGame() {
  stopBreathingPage();
  stopSoundscapePage();

  document.getElementById('app').innerHTML = `
    ${renderNavbar()}
    <main class="breathing-page container">
      <header class="breathing-header">
        <button class="breathing-back" type="button" data-navigate="/dashboard">← Volver al inicio</button>
        <div>
          <span class="breathing-eyebrow">Actividad de relajación</span>
          <h1>🫁 Respira con Serenia</h1>
          <p>Elige un ritmo y deja que el círculo te guíe, sin apresurarte.</p>
        </div>
      </header>
      <section class="breathing-shell glass" aria-label="Ejercicio de respiración guiada">
        <div class="breathing-settings">
          <label for="breathingPattern">Técnica
            <select id="breathingPattern">
              <option value="suave">Suave · 4–6</option>
              <option value="cuadrada">Cuadrada · 4–4–4–4</option>
              <option value="relajacion">4–7–8</option>
            </select>
          </label>
          <label for="breathingDuration">Duración
            <select id="breathingDuration">
              <option value="60">1 minuto</option>
              <option value="180" selected>3 minutos</option>
              <option value="300">5 minutos</option>
              <option value="0">Sin límite</option>
            </select>
          </label>
        </div>
        <p id="breathingDescription" class="breathing-description">Inhala durante 4 segundos y exhala suavemente durante 6. Sin retenciones.</p>
        <div class="breathing-stage" aria-label="Círculo de respiración">
          <div id="breathingCircle" class="breathing-circle" aria-hidden="true">
            <div class="breathing-circle-inner">✦</div>
          </div>
          <div class="breathing-phase">
            <span id="breathingInstruction">Cuando quieras, comienza</span>
            <strong id="breathingCount" aria-hidden="true">—</strong>
          </div>
        </div>
        <p id="breathingAnnouncement" class="sr-only" aria-live="polite"></p>
        <div class="breathing-progress">
          <span>Tiempo: <strong id="breathingTime">03:00</strong></span>
          <span>Ciclos: <strong id="breathingCycles">0</strong></span>
        </div>
        <div class="breathing-actions">
          <button id="breathingStart" class="btn btn-primary" type="button">Comenzar</button>
          <button id="breathingPause" class="btn btn-secondary" type="button" disabled>Pausar</button>
          <button id="breathingStop" class="btn btn-secondary" type="button" disabled>Detener</button>
        </div>
        <p class="breathing-note">Respira con naturalidad. Si sientes mareo o incomodidad, detente; nunca fuerces una retención.</p>
      </section>
    </main>
  `;

  updateSereniaNavbarClearance();
  serenBreathingController = new SereniaBreathingActivity();
}

class SereniaBreathingActivity {
  constructor() {
    this.patternSelect = document.getElementById('breathingPattern');
    this.durationSelect = document.getElementById('breathingDuration');
    this.description = document.getElementById('breathingDescription');
    this.circle = document.getElementById('breathingCircle');
    this.instruction = document.getElementById('breathingInstruction');
    this.count = document.getElementById('breathingCount');
    this.announcement = document.getElementById('breathingAnnouncement');
    this.time = document.getElementById('breathingTime');
    this.cycles = document.getElementById('breathingCycles');
    this.startButton = document.getElementById('breathingStart');
    this.pauseButton = document.getElementById('breathingPause');
    this.stopButton = document.getElementById('breathingStop');

    this.running = false;
    this.paused = false;
    this.phaseIndex = 0;
    this.phaseElapsedMs = 0;
    this.elapsedMs = 0;
    this.completedCycles = 0;
    this.rafId = null;
    this.lastNow = 0;
    this.lastDisplayedSecond = null;

    this.tick = this.tick.bind(this);
    this.handleVisibility = this.handleVisibility.bind(this);
    this.patternSelect.addEventListener('change', () => this.updateDescription());
    this.durationSelect.addEventListener('change', () => this.updateTime());
    this.startButton.addEventListener('click', () => this.start());
    this.pauseButton.addEventListener('click', () => this.togglePause());
    this.stopButton.addEventListener('click', () => this.stop());
    document.addEventListener('visibilitychange', this.handleVisibility);
    this.updateDescription();
    this.updateTime();
  }

  get pattern() {
    return SERENIA_BREATH_PATTERNS[this.patternSelect.value] || SERENIA_BREATH_PATTERNS.suave;
  }

  get totalMs() {
    return Number(this.durationSelect.value) * 1000;
  }

  updateDescription() {
    this.description.textContent = this.pattern.description;
  }

  updateTime() {
    const remaining = this.totalMs === 0 ? Math.floor(this.elapsedMs / 1000) : Math.max(0, Math.ceil((this.totalMs - this.elapsedMs) / 1000));
    this.time.textContent = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.paused = false;
    this.phaseIndex = 0;
    this.phaseElapsedMs = 0;
    this.elapsedMs = 0;
    this.completedCycles = 0;
    this.lastDisplayedSecond = null;
    this.cycles.textContent = '0';
    this.patternSelect.disabled = true;
    this.durationSelect.disabled = true;
    this.startButton.disabled = true;
    this.pauseButton.disabled = false;
    this.stopButton.disabled = false;
    this.pauseButton.textContent = 'Pausar';
    this.announcePhase();
    this.lastNow = performance.now();
    this.updateTime();
    this.rafId = requestAnimationFrame(this.tick);
  }

  announcePhase() {
    const phase = this.pattern.phases[this.phaseIndex];
    this.instruction.textContent = phase.title;
    this.announcement.textContent = `${phase.title}, ${phase.seconds} segundos.`;
  }

  tick(now) {
    if (!this.running || this.paused) return;
    const delta = Math.max(0, Math.min(now - this.lastNow, 250));
    this.lastNow = now;
    this.elapsedMs += delta;
    this.phaseElapsedMs += delta;

    if (this.totalMs > 0 && this.elapsedMs >= this.totalMs) {
      this.finish();
      return;
    }

    let phase = this.pattern.phases[this.phaseIndex];
    while (this.phaseElapsedMs >= phase.seconds * 1000) {
      this.phaseElapsedMs -= phase.seconds * 1000;
      this.phaseIndex = (this.phaseIndex + 1) % this.pattern.phases.length;
      if (this.phaseIndex === 0) {
        this.completedCycles += 1;
        this.cycles.textContent = String(this.completedCycles);
      }
      phase = this.pattern.phases[this.phaseIndex];
      this.announcePhase();
    }

    const progress = this.phaseElapsedMs / (phase.seconds * 1000);
    const smooth = progress * progress * (3 - 2 * progress);
    const scale = phase.from + (phase.to - phase.from) * smooth;
    this.circle.style.transform = `scale(${scale.toFixed(4)})`;
    const second = Math.max(1, Math.ceil(phase.seconds - this.phaseElapsedMs / 1000));
    if (second !== this.lastDisplayedSecond) {
      this.count.textContent = String(second);
      this.lastDisplayedSecond = second;
      this.updateTime();
    }
    this.rafId = requestAnimationFrame(this.tick);
  }

  togglePause() {
    if (!this.running) return;
    this.paused = !this.paused;
    this.pauseButton.textContent = this.paused ? 'Continuar' : 'Pausar';
    if (this.paused) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
      this.announcement.textContent = 'Ejercicio en pausa.';
    } else {
      this.announcement.textContent = 'Ejercicio reanudado.';
      this.lastNow = performance.now();
      this.rafId = requestAnimationFrame(this.tick);
    }
  }

  handleVisibility() {
    if (document.hidden && this.running && !this.paused) this.togglePause();
  }

  finish() {
    this.stop('Sesión terminada. Gracias por dedicarte este momento.');
    this.updateTime();
  }

  stop(message = 'Ejercicio detenido. Puedes volver a comenzar cuando quieras.') {
    cancelAnimationFrame(this.rafId);
    this.rafId = null;
    this.running = false;
    this.paused = false;
    this.patternSelect.disabled = false;
    this.durationSelect.disabled = false;
    this.startButton.disabled = false;
    this.pauseButton.disabled = true;
    this.stopButton.disabled = true;
    this.pauseButton.textContent = 'Pausar';
    this.circle.style.transform = 'scale(0.72)';
    this.instruction.textContent = message;
    this.count.textContent = '—';
    this.announcement.textContent = message;
    this.lastDisplayedSecond = null;
  }

  destroy() {
    cancelAnimationFrame(this.rafId);
    this.rafId = null;
    this.running = false;
    document.removeEventListener('visibilitychange', this.handleVisibility);
  }
}

// Se carga DESPUÉS de soundscapes.js; no se modifica el mezclador original.
if (typeof routes !== 'undefined') {
  routes['/games/breathe'] = () => requireAuth(renderBreathingGame);
  // Enlaces antiguos a ASMR dejan de abrir ese juego.
  routes['/games/asmr'] = () => requireAuth(() => goTo('/dashboard'));
}

const serenBreathingObserver = new MutationObserver(() => {
  adaptSereniaRelaxationCards();
  if (serenBreathingController && !document.querySelector('.breathing-page')) stopBreathingPage();
  updateSereniaNavbarClearance();
});

serenBreathingObserver.observe(document.documentElement, { childList: true, subtree: true });
window.addEventListener('resize', updateSereniaNavbarClearance);
document.addEventListener('DOMContentLoaded', () => {
  adaptSereniaRelaxationCards();
  updateSereniaNavbarClearance();
});
