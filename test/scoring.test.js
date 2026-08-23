const test = require('node:test');
const assert = require('node:assert/strict');
const {
  INSTRUMENTOS_PREGUNTAS,
  SERENIA_PREGUNTAS,
  calcularScore,
} = require('../src/utils/scoring');

const respuestasInstrumentos = (valorPss, valorGad) => (
  INSTRUMENTOS_PREGUNTAS.map((pregunta) => ({
    pregunta: pregunta.num,
    valor: pregunta.num <= 10 ? valorPss : valorGad,
  }))
);

test('los catálogos tienen 10 y 17 preguntas', () => {
  assert.equal(SERENIA_PREGUNTAS.length, 10);
  assert.equal(INSTRUMENTOS_PREGUNTAS.length, 17);
});

test('PSS-10 invierte correctamente las preguntas positivas', () => {
  const respuestas = respuestasInstrumentos(0, 0);
  [4, 5, 7, 8].forEach((numero) => {
    respuestas.find((item) => item.pregunta === numero).valor = 4;
  });
  const scores = calcularScore(respuestas, 'instrumentos');
  assert.equal(scores.estresScore, 0);
  assert.equal(scores.ansiedadScore, 0);
});

test('el ejemplo del documento PSS-10 obtiene 20 puntos', () => {
  const scores = calcularScore(respuestasInstrumentos(2, 0), 'instrumentos');
  assert.equal(scores.estresScore, 20);
  assert.equal(scores.nivelEstres, 'Moderado');
});

test('GAD-7 clasifica 21 puntos como ansiedad grave', () => {
  const scores = calcularScore(respuestasInstrumentos(2, 3), 'instrumentos');
  assert.equal(scores.ansiedadScore, 21);
  assert.equal(scores.nivelAnsiedad, 'Grave');
});

test('Serenia conserva el estado y la emoción declarados sin inventar puntajes', () => {
  const respuestas = SERENIA_PREGUNTAS.map((pregunta) => ({
    pregunta: pregunta.num,
    valor: pregunta.num === 9 ? 4 : pregunta.num === 10 ? 1 : 0,
  }));
  const scores = calcularScore(respuestas, 'serenia');
  assert.equal(scores.estresScore, null);
  assert.equal(scores.ansiedadScore, null);
  assert.equal(scores.estadoEmocional, 'Muy positivo');
  assert.equal(scores.emocionPrincipal, 'Feliz');
});
