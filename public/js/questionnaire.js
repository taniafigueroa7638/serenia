// Cuestionario Serenia: PSS-10 (Estrés Percibido) + GAD-7 (Ansiedad)
// Preguntas 1-10 -> PSS-10 · Preguntas 11-17 -> GAD-7

const PREGUNTAS_DATA = [
  { num: 1, texto: '¿Con qué frecuencia has estado afectado por algo que ha ocurrido inesperadamente?', categoria: 'estres' },
  { num: 2, texto: '¿Con qué frecuencia te has sentido incapaz de controlar aspectos importantes en tu vida?', categoria: 'estres' },
  { num: 3, texto: '¿Con qué frecuencia te has sentido nervioso o estresado?', categoria: 'estres' },
  { num: 4, texto: '¿Con qué frecuencia has estado seguro sobre tu capacidad para manejar tus problemas personales?', categoria: 'estres' },
  { num: 5, texto: '¿Con qué frecuencia has sentido que las cosas te van bien?', categoria: 'estres' },
  { num: 6, texto: '¿Con qué frecuencia has sentido que no podías afrontar todas las cosas pendientes?', categoria: 'estres' },
  { num: 7, texto: '¿Con qué frecuencia has podido controlar las dificultades de tu vida?', categoria: 'estres' },
  { num: 8, texto: '¿Con qué frecuencia has sentido que tenías todo bajo control?', categoria: 'estres' },
  { num: 9, texto: '¿Con qué frecuencia has estado enfadado porque las cosas que te han ocurrido estaban fuera de tu control?', categoria: 'estres' },
  { num: 10, texto: '¿Con qué frecuencia has sentido que las dificultades se acumulan tanto que no podías superarlas?', categoria: 'estres' },

  { num: 11, texto: '¿Se ha sentido nervioso, ansioso o con los nervios de punta?', categoria: 'ansiedad' },
  { num: 12, texto: '¿No se ha sentido capaz de parar o controlar sus preocupaciones?', categoria: 'ansiedad' },
  { num: 13, texto: '¿Se ha preocupado demasiado por diferentes cosas?', categoria: 'ansiedad' },
  { num: 14, texto: '¿Ha tenido dificultad para relajarse?', categoria: 'ansiedad' },
  { num: 15, texto: '¿Se ha sentido tan inquieto/a que le ha sido difícil quedarse quieto/a?', categoria: 'ansiedad' },
  { num: 16, texto: '¿Se ha sentido fácilmente irritable o malhumorado/a?', categoria: 'ansiedad' },
  { num: 17, texto: '¿Ha tenido miedo de que algo terrible pudiera pasar?', categoria: 'ansiedad' }
];

const OPCIONES = {
  estres: [
    { valor: 0, texto: 'Nunca', emoji: '😌' },
    { valor: 1, texto: 'Casi nunca', emoji: '🙂' },
    { valor: 2, texto: 'De vez en cuando', emoji: '😐' },
    { valor: 3, texto: 'A menudo', emoji: '😟' },
    { valor: 4, texto: 'Muy a menudo', emoji: '😫' }
  ],
  ansiedad: [
    { valor: 0, texto: 'Para nada', emoji: '😌' },
    { valor: 1, texto: 'Varios días', emoji: '🙂' },
    { valor: 2, texto: 'Más de la mitad de los días', emoji: '😟' },
    { valor: 3, texto: 'Casi todos los días', emoji: '😫' }
  ]
};

const SECCIONES = {
  estres: { titulo: 'Estrés percibido', subtitulo: 'PSS-10', icono: '🌊' },
  ansiedad: { titulo: 'Ansiedad', subtitulo: 'GAD-7', icono: '💭' }
};

let respuestasActuales = {};
let preguntaActual = 0;
let mostrandoIntro = true;

function renderQuestionnaire() {
  respuestasActuales = {};
  preguntaActual = 0;
  mostrandoIntro = true;
  mostrarIntro();
}

function mostrarIntro() {
  document.getElementById('app').innerHTML = `
    ${renderNavbar()}
    <div class="questionnaire-container">
      <div class="question-card glass" style="text-align:center;">
        <div style="font-size:56px;margin-bottom:16px;">🧘</div>
        <div class="question-text" style="margin-bottom:12px;">Evaluación de bienestar emocional</div>
        <p style="color:var(--text-light);font-size:15px;line-height:1.7;margin-bottom:24px;">
          Este cuestionario combina dos instrumentos validados: la <strong>Escala de Estrés Percibido (PSS-10)</strong>
          y la <strong>Escala de Ansiedad Generalizada (GAD-7)</strong>. Son ${PREGUNTAS_DATA.length} preguntas breves
          sobre cómo te has sentido durante las últimas dos semanas.
        </p>
        <p style="color:var(--text-light);font-size:13px;line-height:1.6;margin-bottom:32px;">
          Tus respuestas son confidenciales y los resultados son orientativos: no constituyen un diagnóstico médico.
        </p>
        <button class="btn btn-primary" id="btnEmpezar" style="max-width:280px;margin:0 auto;">Comenzar →</button>
      </div>
    </div>
  `;
  document.getElementById('btnEmpezar').addEventListener('click', () => {
    mostrandoIntro = false;
    mostrarPregunta();
  });
}

function mostrarPregunta() {
  const pregunta = PREGUNTAS_DATA[preguntaActual];
  const progreso = (preguntaActual / PREGUNTAS_DATA.length) * 100;
  const opciones = OPCIONES[pregunta.categoria];
  const seccion = SECCIONES[pregunta.categoria];

  // Número de pregunta dentro de su propia sección (1-10 o 1-7)
  const numEnSeccion = pregunta.categoria === 'estres' ? pregunta.num : pregunta.num - 10;
  const totalSeccion = pregunta.categoria === 'estres' ? 10 : 7;

  document.getElementById('app').innerHTML = `
    ${renderNavbar()}
    <div class="questionnaire-container">
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${progreso}%"></div>
      </div>
      <div class="question-card glass" id="questionCard">
        <div class="question-number">
          <span style="margin-right:6px;">${seccion.icono}</span>${seccion.titulo} · ${seccion.subtitulo}
          &nbsp;·&nbsp; Pregunta ${numEnSeccion} de ${totalSeccion}
        </div>
        <div class="question-text">${pregunta.texto}</div>
        <div class="options-grid" id="optionsGrid">
          ${opciones.map(opt => `
            <button class="option-btn ${respuestasActuales[pregunta.num] === opt.valor ? 'selected' : ''}"
              data-pregunta="${pregunta.num}" data-valor="${opt.valor}">
              <span class="option-emoji">${opt.emoji}</span>
              <span>${opt.texto}</span>
            </button>
          `).join('')}
        </div>
        <div style="display:flex;justify-content:flex-start;margin-top:24px;" id="navButtons">
          <button class="btn btn-secondary" id="btnPrev" style="width:auto;padding:12px 24px;">← Anterior</button>
        </div>
      </div>
    </div>
  `;

  // Bind option buttons
  document.querySelectorAll('#optionsGrid .option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const num = parseInt(btn.dataset.pregunta);
      const valor = parseInt(btn.dataset.valor);
      seleccionarRespuesta(num, valor);
    });
  });

  // Bind prev button
  document.getElementById('btnPrev').addEventListener('click', preguntaAnterior);
}

function seleccionarRespuesta(num, valor) {
  respuestasActuales[num] = valor;

  // Marca visualmente la opción elegida antes de avanzar
  document.querySelectorAll('#optionsGrid .option-btn').forEach(btn => {
    btn.classList.toggle('selected', parseInt(btn.dataset.valor) === valor);
  });
  document.querySelectorAll('#optionsGrid .option-btn').forEach(btn => btn.disabled = true);

  // Avanza automáticamente a la siguiente pregunta (o finaliza si era la última)
  setTimeout(() => {
    if (preguntaActual < PREGUNTAS_DATA.length - 1) {
      preguntaActual++;
      mostrarPregunta();
    } else {
      enviarCuestionario();
    }
  }, 350);
}

function preguntaAnterior() {
  if (preguntaActual > 0) {
    preguntaActual--;
    mostrarPregunta();
  } else {
    mostrandoIntro = true;
    mostrarIntro();
  }
}

async function enviarCuestionario() {
  const respuestasArray = Object.entries(respuestasActuales).map(([pregunta, valor]) => ({
    pregunta: parseInt(pregunta),
    valor
  }));

  const btnPrev = document.getElementById('btnPrev');
  if (btnPrev) btnPrev.disabled = true;
  const navButtons = document.getElementById('navButtons');
  if (navButtons) navButtons.insertAdjacentHTML('afterend', '<p id="calculando" style="text-align:center;color:var(--text-light);font-size:13px;margin-top:16px;">Calculando tus resultados...</p>');

  try {
    const data = await api('/questionnaire', {
      method: 'POST',
      body: { respuestas: respuestasArray }
    });
    renderResults(data.scores);
  } catch (err) {
    alert('Error: ' + err.message);
    if (btnPrev) btnPrev.disabled = false;
    document.getElementById('calculando')?.remove();
    document.querySelectorAll('#optionsGrid .option-btn').forEach(btn => btn.disabled = false);
  }
}

function renderResults(scores) {
  const emoji = scores.resultadoGeneral === 'Nivel saludable' ? '🌿' :
                scores.resultadoGeneral === 'Nivel moderado - Recomendable seguimiento' ? '⚠️' : '🚨';

  const color = scores.resultadoGeneral === 'Nivel saludable' ? '#2e7d32' :
                scores.resultadoGeneral === 'Nivel moderado - Recomendable seguimiento' ? '#ef6c00' : '#c62828';

  const maxEstres = scores.maxEstres || 40;
  const maxAnsiedad = scores.maxAnsiedad || 21;

  document.getElementById('app').innerHTML = `
    ${renderNavbar()}
    <div class="results-container">
      <div class="result-card glass">
        <div class="result-emoji">${emoji}</div>
        <div class="result-title" style="color:${color}">${scores.resultadoGeneral}</div>
        <div class="result-description">
          Aquí están tus resultados del cuestionario de hoy (PSS-10 + GAD-7). Recuerda que estos son indicadores
          generales y no constituyen un diagnóstico médico.
        </div>
        <div class="score-bars">
          <div class="score-item">
            <div class="score-header">
              <span>Estrés percibido (PSS-10) · ${scores.nivelEstres}</span>
              <span>${scores.estresScore}/${maxEstres}</span>
            </div>
            <div class="score-bar-bg">
              <div class="score-bar-fill estres" style="width: ${(scores.estresScore / maxEstres) * 100}%"></div>
            </div>
          </div>
          <div class="score-item">
            <div class="score-header">
              <span>Ansiedad (GAD-7) · ${scores.nivelAnsiedad}</span>
              <span>${scores.ansiedadScore}/${maxAnsiedad}</span>
            </div>
            <div class="score-bar-bg">
              <div class="score-bar-fill ansiedad" style="width: ${(scores.ansiedadScore / maxAnsiedad) * 100}%"></div>
            </div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:24px 0;">
          <div style="padding:16px;background:rgba(126,87,194,0.05);border-radius:12px;">
            <div style="font-size:12px;color:var(--text-light);margin-bottom:4px;">Estado general</div>
            <div style="font-size:16px;font-weight:700;color:var(--primary-dark);">${scores.estadoEmocional}</div>
          </div>
          <div style="padding:16px;background:rgba(126,87,194,0.05);border-radius:12px;">
            <div style="font-size:12px;color:var(--text-light);margin-bottom:4px;">Foco principal</div>
            <div style="font-size:16px;font-weight:700;color:var(--primary-dark);">${scores.emocionPrincipal}</div>
          </div>
        </div>
        <div style="display:flex;gap:12px;">
          <button class="btn btn-primary" data-navigate="/dashboard">Volver al inicio</button>
          <button class="btn btn-secondary" data-navigate="/history">Ver historial</button>
        </div>
      </div>
    </div>
  `;
}
