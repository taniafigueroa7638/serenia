/**
 * Catálogo y puntuación de las dos evaluaciones de Serenia.
 * - serenia: seguimiento emocional elaborado para la aplicación (10 preguntas).
 * - instrumentos: PSS-10 + GAD-7 (17 preguntas).
 */

const INSTRUMENTOS_PREGUNTAS = [
  { num: 1, texto: '¿Con qué frecuencia has estado afectado por algo que ha ocurrido inesperadamente?', categoria: 'estres', escala: 'pss', invertida: false },
  { num: 2, texto: '¿Con qué frecuencia te has sentido incapaz de controlar aspectos importantes en tu vida?', categoria: 'estres', escala: 'pss', invertida: false },
  { num: 3, texto: '¿Con qué frecuencia te has sentido nervioso o estresado?', categoria: 'estres', escala: 'pss', invertida: false },
  { num: 4, texto: '¿Con qué frecuencia has estado seguro sobre tu capacidad para manejar tus problemas personales?', categoria: 'estres', escala: 'pss', invertida: true },
  { num: 5, texto: '¿Con qué frecuencia has sentido que las cosas te van bien?', categoria: 'estres', escala: 'pss', invertida: true },
  { num: 6, texto: '¿Con qué frecuencia has sentido que no podías afrontar todas las cosas pendientes?', categoria: 'estres', escala: 'pss', invertida: false },
  { num: 7, texto: '¿Con qué frecuencia has podido controlar las dificultades de tu vida?', categoria: 'estres', escala: 'pss', invertida: true },
  { num: 8, texto: '¿Con qué frecuencia has sentido que tenías todo bajo control?', categoria: 'estres', escala: 'pss', invertida: true },
  { num: 9, texto: '¿Con qué frecuencia has estado enfadado porque las cosas que te han ocurrido estaban fuera de tu control?', categoria: 'estres', escala: 'pss', invertida: false },
  { num: 10, texto: '¿Con qué frecuencia has sentido que las dificultades se acumulan tanto que no podías superarlas?', categoria: 'estres', escala: 'pss', invertida: false },

  { num: 11, texto: '¿Se ha sentido nervioso, ansioso o con los nervios de punta?', categoria: 'ansiedad', escala: 'gad', invertida: false },
  { num: 12, texto: '¿No se ha sentido capaz de parar o controlar sus preocupaciones?', categoria: 'ansiedad', escala: 'gad', invertida: false },
  { num: 13, texto: '¿Se ha preocupado demasiado por diferentes cosas?', categoria: 'ansiedad', escala: 'gad', invertida: false },
  { num: 14, texto: '¿Ha tenido dificultad para relajarse?', categoria: 'ansiedad', escala: 'gad', invertida: false },
  { num: 15, texto: '¿Se ha sentido tan inquieto/a que le ha sido difícil quedarse quieto/a?', categoria: 'ansiedad', escala: 'gad', invertida: false },
  { num: 16, texto: '¿Se ha sentido fácilmente irritable o malhumorado/a?', categoria: 'ansiedad', escala: 'gad', invertida: false },
  { num: 17, texto: '¿Ha tenido miedo de que algo terrible pudiera pasar?', categoria: 'ansiedad', escala: 'gad', invertida: false },
];

const SERENIA_PREGUNTAS = [
  { num: 1, texto: '¿Con qué frecuencia te has sentido estresado durante la última semana?', categoria: 'estres', escala: 'frecuencia' },
  { num: 2, texto: '¿Te has sentido molesto por situaciones inesperadas recientemente?', categoria: 'estres', escala: 'frecuencia' },
  { num: 3, texto: '¿Te sientes capaz de manejar tus problemas personales?', categoria: 'estres', escala: 'capacidad' },
  { num: 4, texto: '¿Te has enojado por situaciones que estaban fuera de tu control?', categoria: 'estres', escala: 'frecuencia' },
  { num: 5, texto: '¿Te has sentido nervioso o intranquilo últimamente?', categoria: 'ansiedad', escala: 'frecuencia' },
  { num: 6, texto: '¿Has tenido dificultad para relajarte?', categoria: 'ansiedad', escala: 'frecuencia' },
  { num: 7, texto: '¿Con qué frecuencia has sentido temblores en las manos?', categoria: 'ansiedad', escala: 'frecuencia' },
  { num: 8, texto: '¿Has experimentado mareos o sensación de inestabilidad recientemente?', categoria: 'ansiedad', escala: 'frecuencia' },
  { num: 9, texto: '¿Cómo describirías tu estado emocional el día de hoy?', categoria: 'estado_emocional', escala: 'estado' },
  { num: 10, texto: '¿Qué emoción representa mejor cómo te sientes actualmente?', categoria: 'emocion', escala: 'emocion' },
];

const ESCALAS = {
  pss: ['Nunca', 'Casi nunca', 'De vez en cuando', 'A menudo', 'Muy a menudo'],
  gad: ['Para nada', 'Varios días', 'Más de la mitad de los días', 'Casi todos los días'],
  frecuencia: ['Nunca', 'Casi nunca', 'A veces', 'Frecuentemente', 'Siempre'],
  capacidad: ['Nada capaz', 'Poco capaz', 'Moderadamente capaz', 'Muy capaz', 'Totalmente capaz'],
  estado: ['Muy negativo', 'Negativo', 'Neutral', 'Positivo', 'Muy positivo'],
  emocion: ['Tranquilo/a', 'Feliz', 'Neutral', 'Preocupado/a', 'Ansioso/a', 'Molesto/a', 'Triste', 'Cansado/a'],
};

const PREGUNTAS_POR_TIPO = {
  serenia: SERENIA_PREGUNTAS,
  instrumentos: INSTRUMENTOS_PREGUNTAS,
};

const MAX_ESTRES = 40;
const MAX_ANSIEDAD = 21;

const calcularInstrumentos = (respuestas) => {
  let estresScore = 0;
  let ansiedadScore = 0;

  respuestas.forEach((respuesta) => {
    const pregunta = INSTRUMENTOS_PREGUNTAS.find((item) => item.num === respuesta.pregunta);
    if (!pregunta) return;

    // PSS-10: los ítems positivos 4, 5, 7 y 8 se puntúan en sentido inverso.
    const valor = pregunta.invertida ? (4 - respuesta.valor) : respuesta.valor;
    if (pregunta.categoria === 'estres') estresScore += valor;
    if (pregunta.categoria === 'ansiedad') ansiedadScore += valor;
  });

  let nivelEstres;
  if (estresScore <= 13) nivelEstres = 'Bajo';
  else if (estresScore <= 26) nivelEstres = 'Moderado';
  else nivelEstres = 'Severo';

  let nivelAnsiedad;
  if (ansiedadScore <= 4) nivelAnsiedad = 'Mínima';
  else if (ansiedadScore <= 9) nivelAnsiedad = 'Leve';
  else if (ansiedadScore <= 14) nivelAnsiedad = 'Moderada';
  else nivelAnsiedad = 'Grave';

  let resultadoGeneral;
  if (nivelEstres === 'Severo' || nivelAnsiedad === 'Grave') {
    resultadoGeneral = 'Requiere atención profesional';
  } else if (nivelEstres === 'Moderado' || nivelAnsiedad === 'Moderada' || nivelAnsiedad === 'Leve') {
    resultadoGeneral = 'Nivel moderado - Recomendable seguimiento';
  } else {
    resultadoGeneral = 'Nivel saludable';
  }

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
    tipo: 'instrumentos',
    estresScore,
    ansiedadScore,
    maxEstres: MAX_ESTRES,
    maxAnsiedad: MAX_ANSIEDAD,
    nivelEstres,
    nivelAnsiedad,
    estadoEmocional,
    emocionPrincipal,
    resultadoGeneral,
  };
};

const calcularSerenia = (respuestas) => {
  const valorPorPregunta = new Map(
    respuestas.map((respuesta) => [respuesta.pregunta, respuesta.valor])
  );
  const estadoEmocional = ESCALAS.estado[valorPorPregunta.get(9)];
  const emocionPrincipal = ESCALAS.emocion[valorPorPregunta.get(10)];

  // El documento de Serenia no define una fórmula clínica para estas 10
  // preguntas. Se registra el estado declarado sin inventar un puntaje.
  return {
    tipo: 'serenia',
    estresScore: null,
    ansiedadScore: null,
    maxEstres: null,
    maxAnsiedad: null,
    nivelEstres: null,
    nivelAnsiedad: null,
    estadoEmocional,
    emocionPrincipal,
    resultadoGeneral: 'Registro emocional completado',
  };
};

const calcularScore = (respuestas, tipo = 'instrumentos') => {
  if (tipo === 'serenia') return calcularSerenia(respuestas);
  return calcularInstrumentos(respuestas);
};

const obtenerRespuestaTexto = (pregunta, valor) => (
  ESCALAS[pregunta.escala]?.[valor] || 'No especificada'
);

const obtenerValorNumerico = (tipo, pregunta, valor) => {
  if (tipo === 'instrumentos' && pregunta.invertida) return 4 - valor;
  if (tipo === 'serenia' && pregunta.escala === 'emocion') return null;
  return valor;
};

module.exports = {
  INSTRUMENTOS_PREGUNTAS,
  SERENIA_PREGUNTAS,
  PREGUNTAS_POR_TIPO,
  ESCALAS,
  MAX_ESTRES,
  MAX_ANSIEDAD,
  calcularScore,
  obtenerRespuestaTexto,
  obtenerValorNumerico,
};
