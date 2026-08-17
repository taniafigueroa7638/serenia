const PREGUNTAS_DATA = [
  { num: 1, texto: '¿Con qué frecuencia te has sentido estresado durante la última semana?', tipo: 'frecuencia', categoria: 'estres' },
  { num: 2, texto: '¿Te has sentido molesto por situaciones inesperadas recientemente?', tipo: 'frecuencia', categoria: 'estres' },
  { num: 3, texto: '¿Te sientes capaz de manejar tus problemas personales?', tipo: 'capacidad', categoria: 'estres' },
  { num: 4, texto: '¿Te has enojado por situaciones que estaban fuera de tu control?', tipo: 'frecuencia', categoria: 'estres' },
  { num: 5, texto: '¿Te has sentido nervioso o intranquilo últimamente?', tipo: 'frecuencia', categoria: 'ansiedad' },
  { num: 6, texto: '¿Has tenido dificultad para relajarte?', tipo: 'frecuencia', categoria: 'ansiedad' },
  { num: 7, texto: '¿Con qué frecuencia has sentido temblores en las manos?', tipo: 'frecuencia', categoria: 'ansiedad' },
  { num: 8, texto: '¿Has experimentado mareos o sensación de inestabilidad recientemente?', tipo: 'frecuencia', categoria: 'ansiedad' },
  { num: 9, texto: '¿Cómo describirías tu estado emocional el día de hoy?', tipo: 'emocional', categoria: 'emocional' },
  { num: 10, texto: '¿Qué emoción representa mejor cómo te sientes actualmente?', tipo: 'emociones', categoria: 'emocional' }
];

const OPCIONES = {
  frecuencia: [
    { valor: 0, texto: 'Nunca', emoji: '😌' },
    { valor: 1, texto: 'Casi nunca', emoji: '🙂' },
    { valor: 2, texto: 'A veces', emoji: '😐' },
    { valor: 3, texto: 'Frecuentemente', emoji: '😟' },
    { valor: 4, texto: 'Siempre', emoji: '😫' }
  ],
  capacidad: [
    { valor: 0, texto: 'Nada capaz', emoji: '💔' },
    { valor: 1, texto: 'Poco capaz', emoji: '😕' },
    { valor: 2, texto: 'Moderadamente capaz', emoji: '🤔' },
    { valor: 3, texto: 'Muy capaz', emoji: '💪' },
    { valor: 4, texto: 'Totalmente capaz', emoji: '🌟' }
  ],
  emocional: [
    { valor: 0, texto: 'Muy negativo', emoji: '😢' },
    { valor: 1, texto: 'Negativo', emoji: '😞' },
    { valor: 2, texto: 'Neutral', emoji: '😐' },
    { valor: 3, texto: 'Positivo', emoji: '😊' },
    { valor: 4, texto: 'Muy positivo', emoji: '🤩' }
  ],
  emociones: [
    { valor: 0, texto: 'Tranquilo/a', emoji: '😌' },
    { valor: 1, texto: 'Feliz', emoji: '😊' },
    { valor: 2, texto: 'Neutral', emoji: '😐' },
    { valor: 3, texto: 'Preocupado/a', emoji: '😟' },
    { valor: 4, texto: 'Ansioso/a', emoji: '😰' },
    { valor: 5, texto: 'Molesto/a', emoji: '😠' },
    { valor: 6, texto: 'Triste', emoji: '😢' },
    { valor: 7, texto: 'Cansado/a', emoji: '😴' }
  ]
};

let respuestasActuales = {};
let preguntaActual = 0;

function renderQuestionnaire() {
  respuestasActuales = {};
  preguntaActual = 0;
  mostrarPregunta();
}

function mostrarPregunta() {
  const pregunta = PREGUNTAS_DATA[preguntaActual];
  const progreso = ((preguntaActual) / PREGUNTAS_DATA.length) * 100;
  const opciones = OPCIONES[pregunta.tipo];

  document.getElementById('app').innerHTML = `
    ${renderNavbar()}
    <div class="questionnaire-container">
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${progreso}%"></div>
      </div>
      <div class="question-card glass">
        <div class="question-number">Pregunta ${pregunta.num} de ${PREGUNTAS_DATA.length}</div>
        <div class="question-text">${pregunta.texto}</div>
        <div class="options-grid">
          ${opciones.map(opt => `
            <button class="option-btn ${respuestasActuales[pregunta.num] === opt.valor ? 'selected' : ''}"
              onclick="seleccionarRespuesta(${pregunta.num}, ${opt.valor})">
              <span class="option-emoji">${opt.emoji}</span>
              <span>${opt.texto}</span>
            </button>
          `).join('')}
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:24px;">
          ${preguntaActual > 0 ? `<button class="btn btn-secondary" style="width:auto;padding:12px 24px;" onclick="preguntaAnterior()">← Anterior</button>` : '<div></div>'}
          ${respuestasActuales[pregunta.num] !== undefined ?
            `<button class="btn btn-primary" style="width:auto;padding:12px 24px;" onclick="siguientePregunta()">
              ${preguntaActual === PREGUNTAS_DATA.length - 1 ? 'Finalizar →' : 'Siguiente →'}
            </button>` : ''}
        </div>
      </div>
    </div>
  `;
}

function seleccionarRespuesta(num, valor) {
  respuestasActuales[num] = valor;
  mostrarPregunta();
}

function siguientePregunta() {
  if (preguntaActual < PREGUNTAS_DATA.length - 1) {
    preguntaActual++;
    mostrarPregunta();
  } else {
    enviarCuestionario();
  }
}

function preguntaAnterior() {
  if (preguntaActual > 0) {
    preguntaActual--;
    mostrarPregunta();
  }
}

async function enviarCuestionario() {
  const respuestasArray = Object.entries(respuestasActuales).map(([pregunta, valor]) => ({
    pregunta: parseInt(pregunta),
    valor
  }));

  try {
    const data = await api('/questionnaire', {
      method: 'POST',
      body: { respuestas: respuestasArray }
    });
    renderResults(data.scores);
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

function renderResults(scores) {
  const emoji = scores.resultadoGeneral === 'Nivel saludable' ? '🌿' :
                scores.resultadoGeneral === 'Nivel moderado - Recomendable seguimiento' ? '⚠️' : '🚨';

  const color = scores.resultadoGeneral === 'Nivel saludable' ? '#2e7d32' :
                scores.resultadoGeneral === 'Nivel moderado - Recomendable seguimiento' ? '#ef6c00' : '#c62828';

  document.getElementById('app').innerHTML = `
    ${renderNavbar()}
    <div class="results-container">
      <div class="result-card glass">
        <div class="result-emoji">${emoji}</div>
        <div class="result-title" style="color:${color}">${scores.resultadoGeneral}</div>
        <div class="result-description">
          Aquí están tus resultados del cuestionario de hoy. Recuerda que estos son indicadores generales
          y no constituyen un diagnóstico médico.
        </div>
        <div class="score-bars">
          <div class="score-item">
            <div class="score-header">
              <span>Nivel de Estrés</span>
              <span>${scores.nivelEstres} (${scores.estresScore}/16)</span>
            </div>
            <div class="score-bar-bg">
              <div class="score-bar-fill estres" style="width: ${(scores.estresScore / 16) * 100}%"></div>
            </div>
          </div>
          <div class="score-item">
            <div class="score-header">
              <span>Nivel de Ansiedad</span>
              <span>${scores.nivelAnsiedad} (${scores.ansiedadScore}/16)</span>
            </div>
            <div class="score-bar-bg">
              <div class="score-bar-fill ansiedad" style="width: ${(scores.ansiedadScore / 16) * 100}%"></div>
            </div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:24px 0;">
          <div style="padding:16px;background:rgba(126,87,194,0.05);border-radius:12px;">
            <div style="font-size:12px;color:var(--text-light);margin-bottom:4px;">Estado emocional</div>
            <div style="font-size:18px;font-weight:700;color:var(--primary-dark);">${scores.estadoEmocional}</div>
          </div>
          <div style="padding:16px;background:rgba(126,87,194,0.05);border-radius:12px;">
            <div style="font-size:12px;color:var(--text-light);margin-bottom:4px;">Emoción principal</div>
            <div style="font-size:18px;font-weight:700;color:var(--primary-dark);">${scores.emocionPrincipal}</div>
          </div>
        </div>
        <div style="display:flex;gap:12px;">
          <button class="btn btn-primary" onclick="goTo('/dashboard')">Volver al inicio</button>
          <button class="btn btn-secondary" onclick="goTo('/history')">Ver historial</button>
        </div>
      </div>
    </div>
  `;
}
