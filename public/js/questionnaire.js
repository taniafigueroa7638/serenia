// Las dos evaluaciones solicitadas para Serenia.

const OPCIONES_FRECUENCIA_NEGATIVA = [
  { valor: 0, texto: 'Nunca', emoji: '😌' },
  { valor: 1, texto: 'Casi nunca', emoji: '🙂' },
  { valor: 2, texto: 'A veces', emoji: '😐' },
  { valor: 3, texto: 'Frecuentemente', emoji: '😟' },
  { valor: 4, texto: 'Siempre', emoji: '😫' },
];

const OPCIONES_PSS_NEGATIVAS = [
  { valor: 0, texto: 'Nunca', emoji: '😌' },
  { valor: 1, texto: 'Casi nunca', emoji: '🙂' },
  { valor: 2, texto: 'De vez en cuando', emoji: '😐' },
  { valor: 3, texto: 'A menudo', emoji: '😟' },
  { valor: 4, texto: 'Muy a menudo', emoji: '😫' },
];

// En los ítems positivos del PSS-10, responder “Muy a menudo” expresa mayor
// bienestar. El valor se conserva para el cálculo; solo cambia el sentido visual.
const OPCIONES_PSS_POSITIVAS = [
  { valor: 0, texto: 'Nunca', emoji: '😫' },
  { valor: 1, texto: 'Casi nunca', emoji: '😟' },
  { valor: 2, texto: 'De vez en cuando', emoji: '😐' },
  { valor: 3, texto: 'A menudo', emoji: '🙂' },
  { valor: 4, texto: 'Muy a menudo', emoji: '😌' },
];

const OPCIONES_GAD = [
  { valor: 0, texto: 'Para nada', emoji: '😌' },
  { valor: 1, texto: 'Varios días', emoji: '😕' },
  { valor: 2, texto: 'Más de la mitad de los días', emoji: '😟' },
  { valor: 3, texto: 'Casi todos los días', emoji: '😫' },
];

const OPCIONES_CAPACIDAD = [
  { valor: 0, texto: 'Nada capaz', emoji: '😣' },
  { valor: 1, texto: 'Poco capaz', emoji: '😟' },
  { valor: 2, texto: 'Moderadamente capaz', emoji: '😐' },
  { valor: 3, texto: 'Muy capaz', emoji: '🙂' },
  { valor: 4, texto: 'Totalmente capaz', emoji: '💪' },
];

const OPCIONES_ESTADO = [
  { valor: 0, texto: 'Muy negativo', emoji: '😫' },
  { valor: 1, texto: 'Negativo', emoji: '😟' },
  { valor: 2, texto: 'Neutral', emoji: '😐' },
  { valor: 3, texto: 'Positivo', emoji: '🙂' },
  { valor: 4, texto: 'Muy positivo', emoji: '😄' },
];

const OPCIONES_EMOCION = [
  { valor: 0, texto: 'Tranquilo/a', emoji: '😌' },
  { valor: 1, texto: 'Feliz', emoji: '😄' },
  { valor: 2, texto: 'Neutral', emoji: '😐' },
  { valor: 3, texto: 'Preocupado/a', emoji: '😟' },
  { valor: 4, texto: 'Ansioso/a', emoji: '😰' },
  { valor: 5, texto: 'Molesto/a', emoji: '😡' },
  { valor: 6, texto: 'Triste', emoji: '😢' },
  { valor: 7, texto: 'Cansado/a', emoji: '😴' },
];

const CUESTIONARIOS = {
  serenia: {
    titulo: 'Cuestionario Serenia',
    subtitulo: 'Seguimiento emocional',
    icono: '🌿',
    descripcion: 'Diez preguntas breves para registrar cómo te has sentido recientemente y cómo te sientes hoy.',
    preguntas: [
      { num: 1, texto: '¿Con qué frecuencia te has sentido estresado durante la última semana?', seccion: 'Estrés', opciones: OPCIONES_FRECUENCIA_NEGATIVA },
      { num: 2, texto: '¿Te has sentido molesto por situaciones inesperadas recientemente?', seccion: 'Estrés', opciones: OPCIONES_FRECUENCIA_NEGATIVA },
      { num: 3, texto: '¿Te sientes capaz de manejar tus problemas personales?', seccion: 'Estrés', opciones: OPCIONES_CAPACIDAD },
      { num: 4, texto: '¿Te has enojado por situaciones que estaban fuera de tu control?', seccion: 'Estrés', opciones: OPCIONES_FRECUENCIA_NEGATIVA },
      { num: 5, texto: '¿Te has sentido nervioso o intranquilo últimamente?', seccion: 'Ansiedad', opciones: OPCIONES_FRECUENCIA_NEGATIVA },
      { num: 6, texto: '¿Has tenido dificultad para relajarte?', seccion: 'Ansiedad', opciones: OPCIONES_FRECUENCIA_NEGATIVA },
      { num: 7, texto: '¿Con qué frecuencia has sentido temblores en las manos?', seccion: 'Ansiedad', opciones: OPCIONES_FRECUENCIA_NEGATIVA },
      { num: 8, texto: '¿Has experimentado mareos o sensación de inestabilidad recientemente?', seccion: 'Ansiedad', opciones: OPCIONES_FRECUENCIA_NEGATIVA },
      { num: 9, texto: '¿Cómo describirías tu estado emocional el día de hoy?', seccion: 'Estado emocional', opciones: OPCIONES_ESTADO },
      { num: 10, texto: '¿Qué emoción representa mejor cómo te sientes actualmente?', seccion: 'Estado emocional', opciones: OPCIONES_EMOCION },
    ],
  },
  instrumentos: {
    titulo: 'Instrumentos de medición',
    subtitulo: 'PSS-10 + GAD-7',
    icono: '🧘',
    descripcion: 'Evaluación combinada de estrés percibido y ansiedad. Responde según cómo te has sentido recientemente.',
    preguntas: [
      { num: 1, texto: '¿Con qué frecuencia has estado afectado por algo que ha ocurrido inesperadamente?', seccion: 'Estrés percibido · PSS-10', opciones: OPCIONES_PSS_NEGATIVAS },
      { num: 2, texto: '¿Con qué frecuencia te has sentido incapaz de controlar aspectos importantes en tu vida?', seccion: 'Estrés percibido · PSS-10', opciones: OPCIONES_PSS_NEGATIVAS },
      { num: 3, texto: '¿Con qué frecuencia te has sentido nervioso o estresado?', seccion: 'Estrés percibido · PSS-10', opciones: OPCIONES_PSS_NEGATIVAS },
      { num: 4, texto: '¿Con qué frecuencia has estado seguro sobre tu capacidad para manejar tus problemas personales?', seccion: 'Estrés percibido · PSS-10', opciones: OPCIONES_PSS_POSITIVAS },
      { num: 5, texto: '¿Con qué frecuencia has sentido que las cosas te van bien?', seccion: 'Estrés percibido · PSS-10', opciones: OPCIONES_PSS_POSITIVAS },
      { num: 6, texto: '¿Con qué frecuencia has sentido que no podías afrontar todas las cosas pendientes?', seccion: 'Estrés percibido · PSS-10', opciones: OPCIONES_PSS_NEGATIVAS },
      { num: 7, texto: '¿Con qué frecuencia has podido controlar las dificultades de tu vida?', seccion: 'Estrés percibido · PSS-10', opciones: OPCIONES_PSS_POSITIVAS },
      { num: 8, texto: '¿Con qué frecuencia has sentido que tenías todo bajo control?', seccion: 'Estrés percibido · PSS-10', opciones: OPCIONES_PSS_POSITIVAS },
      { num: 9, texto: '¿Con qué frecuencia has estado enfadado porque las cosas que te han ocurrido estaban fuera de tu control?', seccion: 'Estrés percibido · PSS-10', opciones: OPCIONES_PSS_NEGATIVAS },
      { num: 10, texto: '¿Con qué frecuencia has sentido que las dificultades se acumulan tanto que no podías superarlas?', seccion: 'Estrés percibido · PSS-10', opciones: OPCIONES_PSS_NEGATIVAS },
      { num: 11, texto: '¿Se ha sentido nervioso, ansioso o con los nervios de punta?', seccion: 'Ansiedad · GAD-7', opciones: OPCIONES_GAD },
      { num: 12, texto: '¿No se ha sentido capaz de parar o controlar sus preocupaciones?', seccion: 'Ansiedad · GAD-7', opciones: OPCIONES_GAD },
      { num: 13, texto: '¿Se ha preocupado demasiado por diferentes cosas?', seccion: 'Ansiedad · GAD-7', opciones: OPCIONES_GAD },
      { num: 14, texto: '¿Ha tenido dificultad para relajarse?', seccion: 'Ansiedad · GAD-7', opciones: OPCIONES_GAD },
      { num: 15, texto: '¿Se ha sentido tan inquieto/a que le ha sido difícil quedarse quieto/a?', seccion: 'Ansiedad · GAD-7', opciones: OPCIONES_GAD },
      { num: 16, texto: '¿Se ha sentido fácilmente irritable o malhumorado/a?', seccion: 'Ansiedad · GAD-7', opciones: OPCIONES_GAD },
      { num: 17, texto: '¿Ha tenido miedo de que algo terrible pudiera pasar?', seccion: 'Ansiedad · GAD-7', opciones: OPCIONES_GAD },
    ],
  },
};

let respuestasActuales = {};
let preguntaActual = 0;
let tipoActual = null;

async function renderQuestionnaire() {
  const requestedType = new URLSearchParams(window.location.search).get('type');
  if (CUESTIONARIOS[requestedType]) {
    iniciarCuestionario(requestedType, false);
    return;
  }

  document.getElementById('app').innerHTML = `
    ${renderNavbar()}
    <div class="questionnaire-container">
      <div class="question-card glass" style="text-align:center;">
        <div class="loading loading-primary" aria-label="Cargando"></div>
        <p style="margin-top:16px;color:var(--text-light);">Revisando tus evaluaciones...</p>
      </div>
    </div>
  `;

  try {
    const data = await api('/questionnaire/status');
    state.questionnaireStatus = data.status;
    mostrarSelectorCuestionarios(data.status);
  } catch (err) {
    if (!state.token) return;
    document.getElementById('app').innerHTML = `
      ${renderNavbar()}
      <div class="questionnaire-container">
        <div class="question-card glass" style="text-align:center;">
          <div style="font-size:48px;margin-bottom:12px;">😕</div>
          <h2>No pudimos cargar las evaluaciones</h2>
          <p style="color:var(--text-light);margin:12px 0 24px;">${err.message}</p>
          <button class="btn btn-secondary" data-navigate="/dashboard">Volver al inicio</button>
        </div>
      </div>
    `;
  }
}

function mostrarSelectorCuestionarios(status) {
  const pendientes = status.pendingTypes.length;
  const mensaje = pendientes > 0
    ? `Para mantener tu seguimiento al día, completa ${pendientes === 1 ? 'la evaluación pendiente' : 'las dos evaluaciones pendientes'} de esta semana.`
    : 'Tus evaluaciones semanales están al día. Puedes volver a responder cualquiera cuando desees.';

  document.getElementById('app').innerHTML = `
    ${renderNavbar()}
    <div class="questionnaire-container questionnaire-hub">
      <div class="question-card glass questionnaire-hub-header">
        <div style="font-size:48px;margin-bottom:10px;">🌱</div>
        <h1>Evaluaciones de bienestar</h1>
        <p>${mensaje}</p>
        <div class="weekly-note ${pendientes > 0 ? 'is-due' : 'is-current'}">
          ${pendientes > 0 ? '⏰ Seguimiento semanal pendiente' : '✓ Seguimiento semanal completado'}
        </div>
      </div>
      <div class="questionnaire-choice-grid">
        ${['serenia', 'instrumentos'].map((tipo) => {
          const config = CUESTIONARIOS[tipo];
          const item = status.questionnaires[tipo];
          const ultima = item.lastCompletedAt
            ? `Última respuesta: ${new Date(item.lastCompletedAt).toLocaleDateString('es-EC')}`
            : 'Aún no la has respondido';
          return `
            <article class="questionnaire-choice-card glass ${item.due ? 'is-due' : ''}">
              <div class="questionnaire-choice-icon">${config.icono}</div>
              <div class="questionnaire-status ${item.due ? 'is-due' : 'is-current'}">
                ${item.due ? 'Pendiente' : 'Al día'}
              </div>
              <h2>${config.titulo}</h2>
              <p class="questionnaire-choice-subtitle">${config.subtitulo}</p>
              <p>${config.descripcion}</p>
              <small>${ultima}</small>
              <button class="btn ${item.due ? 'btn-primary' : 'btn-secondary'} btn-start-questionnaire" data-type="${tipo}">
                ${item.due ? 'Responder ahora' : 'Volver a responder'}
              </button>
            </article>
          `;
        }).join('')}
      </div>
      ${pendientes > 0 ? `
        <button class="btn btn-secondary questionnaire-dismiss" id="btnDismissWeekly">
          Ahora no, ir al inicio
        </button>
      ` : ''}
    </div>
  `;

  document.querySelectorAll('.btn-start-questionnaire').forEach((button) => {
    button.addEventListener('click', () => iniciarCuestionario(button.dataset.type));
  });
  document.getElementById('btnDismissWeekly')?.addEventListener('click', dismissWeeklyPrompt);
}

function iniciarCuestionario(tipo, updateUrl = true) {
  tipoActual = tipo;
  respuestasActuales = {};
  preguntaActual = 0;
  if (updateUrl) {
    window.history.replaceState({}, '', `/questionnaire?type=${tipo}`);
  }
  mostrarIntro();
}

function mostrarIntro() {
  const config = CUESTIONARIOS[tipoActual];
  document.getElementById('app').innerHTML = `
    ${renderNavbar()}
    <div class="questionnaire-container">
      <div class="question-card glass" style="text-align:center;">
        <div style="font-size:56px;margin-bottom:16px;">${config.icono}</div>
        <div class="question-text" style="margin-bottom:8px;">${config.titulo}</div>
        <div style="font-weight:700;color:var(--primary);margin-bottom:14px;">${config.subtitulo}</div>
        <p style="color:var(--text-light);font-size:15px;line-height:1.7;margin-bottom:18px;">
          ${config.descripcion} Son ${config.preguntas.length} preguntas.
        </p>
        <p style="color:var(--text-light);font-size:13px;line-height:1.6;margin-bottom:28px;">
          Tus respuestas son confidenciales. Los resultados orientativos no sustituyen una evaluación profesional.
        </p>
        <div class="intro-actions">
          <button class="btn btn-secondary" id="btnVolverSelector">← Elegir otra</button>
          <button class="btn btn-primary" id="btnEmpezar">Comenzar →</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('btnVolverSelector').addEventListener('click', () => {
    window.history.replaceState({}, '', '/questionnaire');
    renderQuestionnaire();
  });
  document.getElementById('btnEmpezar').addEventListener('click', mostrarPregunta);
}

function mostrarPregunta() {
  const config = CUESTIONARIOS[tipoActual];
  const pregunta = config.preguntas[preguntaActual];
  const progreso = ((preguntaActual + 1) / config.preguntas.length) * 100;

  document.getElementById('app').innerHTML = `
    ${renderNavbar()}
    <div class="questionnaire-container">
      <div class="progress-bar" role="progressbar" aria-valuemin="1" aria-valuemax="${config.preguntas.length}" aria-valuenow="${preguntaActual + 1}">
        <div class="progress-fill" style="width:${progreso}%"></div>
      </div>
      <div class="question-card glass" id="questionCard">
        <div class="question-number">
          ${config.icono} ${pregunta.seccion} · Pregunta ${preguntaActual + 1} de ${config.preguntas.length}
        </div>
        <div class="question-text">${pregunta.texto}</div>
        <div class="options-grid" id="optionsGrid">
          ${pregunta.opciones.map((opcion) => `
            <button class="option-btn ${respuestasActuales[pregunta.num] === opcion.valor ? 'selected' : ''}"
              data-pregunta="${pregunta.num}" data-valor="${opcion.valor}">
              <span class="option-emoji">${opcion.emoji}</span>
              <span>${opcion.texto}</span>
            </button>
          `).join('')}
        </div>
        <div class="question-nav" id="navButtons">
          <button class="btn btn-secondary" id="btnPrev">← Anterior</button>
        </div>
      </div>
    </div>
  `;

  document.querySelectorAll('#optionsGrid .option-btn').forEach((button) => {
    button.addEventListener('click', () => {
      seleccionarRespuesta(
        Number.parseInt(button.dataset.pregunta, 10),
        Number.parseInt(button.dataset.valor, 10)
      );
    });
  });
  document.getElementById('btnPrev').addEventListener('click', preguntaAnterior);
}

function seleccionarRespuesta(numero, valor) {
  respuestasActuales[numero] = valor;
  document.querySelectorAll('#optionsGrid .option-btn').forEach((button) => {
    button.classList.toggle('selected', Number.parseInt(button.dataset.valor, 10) === valor);
    button.disabled = true;
  });

  const config = CUESTIONARIOS[tipoActual];
  setTimeout(() => {
    if (preguntaActual < config.preguntas.length - 1) {
      preguntaActual += 1;
      mostrarPregunta();
    } else {
      enviarCuestionario();
    }
  }, 350);
}

function preguntaAnterior() {
  if (preguntaActual > 0) {
    preguntaActual -= 1;
    mostrarPregunta();
  } else {
    mostrarIntro();
  }
}

async function enviarCuestionario() {
  const respuestas = Object.entries(respuestasActuales)
    .map(([pregunta, valor]) => ({ pregunta: Number.parseInt(pregunta, 10), valor }))
    .sort((a, b) => a.pregunta - b.pregunta);

  const btnPrev = document.getElementById('btnPrev');
  if (btnPrev) btnPrev.disabled = true;
  document.getElementById('navButtons')?.insertAdjacentHTML(
    'afterend',
    '<p id="calculando" class="calculating-message">Guardando tus respuestas...</p>'
  );

  try {
    const data = await api('/questionnaire', {
      method: 'POST',
      body: { tipo: tipoActual, respuestas },
    });
    state.questionnaireStatus = data.weeklyStatus;
    renderResults(data.scores, data.weeklyStatus);
  } catch (err) {
    alert(`Error: ${err.message}`);
    if (btnPrev) btnPrev.disabled = false;
    document.getElementById('calculando')?.remove();
    document.querySelectorAll('#optionsGrid .option-btn').forEach((button) => {
      button.disabled = false;
    });
  }
}

function renderResults(scores, weeklyStatus) {
  if (tipoActual === 'serenia') {
    renderSereniaResults(scores, weeklyStatus);
    return;
  }

  const emoji = scores.resultadoGeneral === 'Nivel saludable' ? '🌿'
    : scores.resultadoGeneral === 'Nivel moderado - Recomendable seguimiento' ? '⚠️' : '🚨';
  const color = scores.resultadoGeneral === 'Nivel saludable' ? '#2e7d32'
    : scores.resultadoGeneral === 'Nivel moderado - Recomendable seguimiento' ? '#ef6c00' : '#c62828';

  document.getElementById('app').innerHTML = `
    ${renderNavbar()}
    <div class="results-container">
      <div class="result-card glass">
        <div class="result-emoji">${emoji}</div>
        <div class="result-title" style="color:${color}">${scores.resultadoGeneral}</div>
        <div class="result-description">
          Resultados de PSS-10 + GAD-7. Son indicadores generales y no constituyen un diagnóstico médico.
        </div>
        <div class="score-bars">
          <div class="score-item">
            <div class="score-header">
              <span>Estrés percibido · ${scores.nivelEstres}</span>
              <span>${scores.estresScore}/${scores.maxEstres}</span>
            </div>
            <div class="score-bar-bg"><div class="score-bar-fill estres" style="width:${(scores.estresScore / scores.maxEstres) * 100}%"></div></div>
          </div>
          <div class="score-item">
            <div class="score-header">
              <span>Ansiedad · ${scores.nivelAnsiedad}</span>
              <span>${scores.ansiedadScore}/${scores.maxAnsiedad}</span>
            </div>
            <div class="score-bar-bg"><div class="score-bar-fill ansiedad" style="width:${(scores.ansiedadScore / scores.maxAnsiedad) * 100}%"></div></div>
          </div>
        </div>
        <div class="result-summary-grid">
          <div><small>Estado general</small><strong>${scores.estadoEmocional}</strong></div>
          <div><small>Foco principal</small><strong>${scores.emocionPrincipal}</strong></div>
        </div>
        ${renderResultActions(weeklyStatus)}
      </div>
    </div>
  `;
  bindResultActions(weeklyStatus);
}

function renderSereniaResults(scores, weeklyStatus) {
  const estadoEmoji = {
    'Muy negativo': '😫',
    'Negativo': '😟',
    'Neutral': '😐',
    'Positivo': '🙂',
    'Muy positivo': '😄',
  }[scores.estadoEmocional] || '🌿';

  document.getElementById('app').innerHTML = `
    ${renderNavbar()}
    <div class="results-container">
      <div class="result-card glass">
        <div class="result-emoji">${estadoEmoji}</div>
        <div class="result-title">Registro emocional completado</div>
        <div class="result-description">
          Gracias por detenerte un momento y registrar cómo te sientes hoy.
        </div>
        <div class="result-summary-grid">
          <div><small>Estado emocional</small><strong>${scores.estadoEmocional}</strong></div>
          <div><small>Emoción principal</small><strong>${scores.emocionPrincipal}</strong></div>
        </div>
        ${renderResultActions(weeklyStatus)}
      </div>
    </div>
  `;
  bindResultActions(weeklyStatus);
}

function renderResultActions(weeklyStatus) {
  const pendiente = weeklyStatus.pendingTypes[0];
  if (pendiente) {
    return `
      <div class="pending-result-note">Te queda una evaluación semanal por completar.</div>
      <div class="result-actions">
        <button class="btn btn-primary" id="btnContinuePending">Continuar con ${CUESTIONARIOS[pendiente].titulo}</button>
        <button class="btn btn-secondary" id="btnDismissFromResults">Completar después</button>
      </div>
    `;
  }

  return `
    <div class="result-actions">
      <button class="btn btn-primary" data-navigate="/dashboard">Volver al inicio</button>
      <button class="btn btn-secondary" data-navigate="/history">Ver historial</button>
    </div>
  `;
}

function bindResultActions(weeklyStatus) {
  const pendiente = weeklyStatus.pendingTypes[0];
  if (!pendiente) return;
  document.getElementById('btnContinuePending').addEventListener('click', () => iniciarCuestionario(pendiente));
  document.getElementById('btnDismissFromResults').addEventListener('click', dismissWeeklyPrompt);
}
