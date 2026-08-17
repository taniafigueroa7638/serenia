/**
 * Sistema de puntuación del Cuestionario Serenia
 * Basado en las preguntas proporcionadas
 */

const PREGUNTAS = [
  { num: 1, texto: '¿Con qué frecuencia te has sentido estresado durante la última semana?', categoria: 'estres', invertida: false },
  { num: 2, texto: '¿Te has sentido molesto por situaciones inesperadas recientemente?', categoria: 'estres', invertida: false },
  { num: 3, texto: '¿Te sientes capaz de manejar tus problemas personales?', categoria: 'estres', invertida: true }, // Invertida
  { num: 4, texto: '¿Te has enojado por situaciones que estaban fuera de tu control?', categoria: 'estres', invertida: false },
  { num: 5, texto: '¿Te has sentido nervioso o intranquilo últimamente?', categoria: 'ansiedad', invertida: false },
  { num: 6, texto: '¿Has tenido dificultad para relajarte?', categoria: 'ansiedad', invertida: false },
  { num: 7, texto: '¿Con qué frecuencia has sentido temblores en las manos?', categoria: 'ansiedad', invertida: false },
  { num: 8, texto: '¿Has experimentado mareos o sensación de inestabilidad recientemente?', categoria: 'ansiedad', invertida: false },
  { num: 9, texto: '¿Cómo describirías tu estado emocional el día de hoy?', categoria: 'emocional', invertida: false },
  { num: 10, texto: '¿Qué emoción representa mejor cómo te sientes actualmente?', categoria: 'emocional', invertida: false },
];

const ESCALAS = {
  frecuencia: ['Nunca', 'Casi nunca', 'A veces', 'Frecuentemente', 'Siempre'],
  capacidad: ['Nada capaz', 'Poco capaz', 'Moderadamente capaz', 'Muy capaz', 'Totalmente capaz'],
  emocional: ['Muy negativo', 'Negativo', 'Neutral', 'Positivo', 'Muy positivo'],
  emociones: ['Tranquilo/a', 'Feliz', 'Neutral', 'Preocupado/a', 'Ansioso/a', 'Molesto/a', 'Triste', 'Cansado/a']
};

const calcularScore = (respuestas) => {
  let estresScore = 0;
  let ansiedadScore = 0;
  let estadoEmocional = '';
  let emocionPrincipal = '';

  respuestas.forEach(r => {
    const pregunta = PREGUNTAS.find(p => p.num === r.pregunta);
    if (!pregunta) return;

    let valor = r.valor;

    // Invertir pregunta 3 (capacidad de manejo)
    if (pregunta.invertida) {
      valor = 4 - valor;
    }

    if (pregunta.categoria === 'estres') {
      estresScore += valor;
    } else if (pregunta.categoria === 'ansiedad') {
      ansiedadScore += valor;
    } else if (pregunta.num === 9) {
      estadoEmocional = ESCALAS.emocional[valor];
    } else if (pregunta.num === 10) {
      emocionPrincipal = ESCALAS.emociones[valor] || 'No especificada';
    }
  });

  // Clasificación estrés (max 16)
  let nivelEstres;
  if (estresScore <= 4) nivelEstres = 'Bajo';
  else if (estresScore <= 10) nivelEstres = 'Moderado';
  else nivelEstres = 'Severo';

  // Clasificación ansiedad (max 16)
  let nivelAnsiedad;
  if (ansiedadScore <= 4) nivelAnsiedad = 'Mínima';
  else if (ansiedadScore <= 10) nivelAnsiedad = 'Moderada';
  else nivelAnsiedad = 'Severa';

  // Resultado general
  let resultadoGeneral;
  if (nivelEstres === 'Severo' || nivelAnsiedad === 'Severa') {
    resultadoGeneral = 'Requiere atención profesional';
  } else if (nivelEstres === 'Moderado' || nivelAnsiedad === 'Moderada') {
    resultadoGeneral = 'Nivel moderado - Recomendable seguimiento';
  } else {
    resultadoGeneral = 'Nivel saludable';
  }

  return {
    estresScore,
    ansiedadScore,
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
  calcularScore
};