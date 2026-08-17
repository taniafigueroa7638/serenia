/**
 * Sistema de puntuación del Cuestionario Serenia
 * Instrumentos: PSS-10 (Escala de Estrés Percibido) + GAD-7 (Ansiedad)
 */

// Preguntas 1-10: PSS-10 (estrés) · Preguntas 11-17: GAD-7 (ansiedad)
const PREGUNTAS = [
  { num: 1, texto: '¿Con qué frecuencia has estado afectado por algo que ha ocurrido inesperadamente?', categoria: 'estres', invertida: false },
  { num: 2, texto: '¿Con qué frecuencia te has sentido incapaz de controlar aspectos importantes en tu vida?', categoria: 'estres', invertida: false },
  { num: 3, texto: '¿Con qué frecuencia te has sentido nervioso o estresado?', categoria: 'estres', invertida: false },
  { num: 4, texto: '¿Con qué frecuencia has estado seguro sobre tu capacidad para manejar tus problemas personales?', categoria: 'estres', invertida: true },
  { num: 5, texto: '¿Con qué frecuencia has sentido que las cosas te van bien?', categoria: 'estres', invertida: true },
  { num: 6, texto: '¿Con qué frecuencia has sentido que no podías afrontar todas las cosas pendientes?', categoria: 'estres', invertida: false },
  { num: 7, texto: '¿Con qué frecuencia has podido controlar las dificultades de tu vida?', categoria: 'estres', invertida: true },
  { num: 8, texto: '¿Con qué frecuencia has sentido que tenías todo bajo control?', categoria: 'estres', invertida: true },
  { num: 9, texto: '¿Con qué frecuencia has estado enfadado porque las cosas que te han ocurrido estaban fuera de tu control?', categoria: 'estres', invertida: false },
  { num: 10, texto: '¿Con qué frecuencia has sentido que las dificultades se acumulan tanto que no podías superarlas?', categoria: 'estres', invertida: false },

  { num: 11, texto: '¿Se ha sentido nervioso, ansioso o con los nervios de punta?', categoria: 'ansiedad', invertida: false },
  { num: 12, texto: '¿No se ha sentido capaz de parar o controlar sus preocupaciones?', categoria: 'ansiedad', invertida: false },
  { num: 13, texto: '¿Se ha preocupado demasiado por diferentes cosas?', categoria: 'ansiedad', invertida: false },
  { num: 14, texto: '¿Ha tenido dificultad para relajarse?', categoria: 'ansiedad', invertida: false },
  { num: 15, texto: '¿Se ha sentido tan inquieto/a que le ha sido difícil quedarse quieto/a?', categoria: 'ansiedad', invertida: false },
  { num: 16, texto: '¿Se ha sentido fácilmente irritable o malhumorado/a?', categoria: 'ansiedad', invertida: false },
  { num: 17, texto: '¿Ha tenido miedo de que algo terrible pudiera pasar?', categoria: 'ansiedad', invertida: false },
];

// Escalas de respuesta mostradas al usuario (PSS-10: 0-4 · GAD-7: 0-3)
const ESCALAS = {
  estres: ['Nunca', 'Casi nunca', 'De vez en cuando', 'A menudo', 'Muy a menudo'],
  ansiedad: ['Para nada', 'Varios días', 'Más de la mitad de los días', 'Casi todos los días'],
};

const MAX_ESTRES = 40; // PSS-10: 10 preguntas x 4 puntos
const MAX_ANSIEDAD = 21; // GAD-7: 7 preguntas x 3 puntos

const calcularScore = (respuestas) => {
  let estresScore = 0;
  let ansiedadScore = 0;

  respuestas.forEach(r => {
    const pregunta = PREGUNTAS.find(p => p.num === r.pregunta);
    if (!pregunta) return;

    // Invertir preguntas 4, 5, 7 y 8 del PSS-10 (miden capacidad de control)
    const valor = pregunta.invertida ? (4 - r.valor) : r.valor;

    if (pregunta.categoria === 'estres') {
      estresScore += valor;
    } else if (pregunta.categoria === 'ansiedad') {
      ansiedadScore += valor;
    }
  });

  // Clasificación PSS-10 (0-40)
  let nivelEstres;
  if (estresScore <= 13) nivelEstres = 'Bajo';
  else if (estresScore <= 26) nivelEstres = 'Moderado';
  else nivelEstres = 'Severo';

  // Clasificación GAD-7 (0-21)
  let nivelAnsiedad;
  if (ansiedadScore <= 4) nivelAnsiedad = 'Mínima';
  else if (ansiedadScore <= 9) nivelAnsiedad = 'Leve';
  else if (ansiedadScore <= 14) nivelAnsiedad = 'Moderada';
  else nivelAnsiedad = 'Grave';

  // Resultado general combinado
  let resultadoGeneral;
  if (nivelEstres === 'Severo' || nivelAnsiedad === 'Grave') {
    resultadoGeneral = 'Requiere atención profesional';
  } else if (nivelEstres === 'Moderado' || nivelAnsiedad === 'Moderada' || nivelAnsiedad === 'Leve') {
    resultadoGeneral = 'Nivel moderado - Recomendable seguimiento';
  } else {
    resultadoGeneral = 'Nivel saludable';
  }

  // Resumen cualitativo (se guarda en estado_emocional / emocion_principal)
  let estadoEmocional;
  if (resultadoGeneral === 'Requiere atención profesional') estadoEmocional = 'Alta tensión emocional';
  else if (resultadoGeneral === 'Nivel moderado - Recomendable seguimiento') estadoEmocional = 'Tensión moderada';
  else estadoEmocional = 'Equilibrio emocional';

  const ratioEstres = estresScore / MAX_ESTRES;
  const ratioAnsiedad = ansiedadScore / MAX_ANSIEDAD;
  let emocionPrincipal;
  if (Math.abs(ratioEstres - ratioAnsiedad) < 0.08) emocionPrincipal = 'Estrés y ansiedad equilibrados';
  else if (ratioEstres > ratioAnsiedad) emocionPrincipal = 'Estrés';
  else emocionPrincipal = 'Ansiedad';

  return {
    estresScore,
    ansiedadScore,
    maxEstres: MAX_ESTRES,
    maxAnsiedad: MAX_ANSIEDAD,
    nivelEstres,
    nivelAnsiedad,
    estadoEmocional,
    emocionPrincipal,
    resultadoGeneral
  };
};

module.exports = {
  PREGUNTAS,
  ESCALAS,
  MAX_ESTRES,
  MAX_ANSIEDAD,
  calcularScore
};
