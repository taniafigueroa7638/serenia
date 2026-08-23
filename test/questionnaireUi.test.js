const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(
  path.join(__dirname, '../public/js/questionnaire.js'),
  'utf8'
);
const context = vm.createContext({});
vm.runInContext(source, context);
vm.runInContext(`
  uiSnapshot = {
    totalSerenia: CUESTIONARIOS.serenia.preguntas.length,
    totalInstrumentos: CUESTIONARIOS.instrumentos.preguntas.length,
    pssNegativaPrimera: OPCIONES_PSS_NEGATIVAS[0].emoji,
    pssNegativaUltima: OPCIONES_PSS_NEGATIVAS[4].emoji,
    pssPositivaPrimera: OPCIONES_PSS_POSITIVAS[0].emoji,
    pssPositivaUltima: OPCIONES_PSS_POSITIVAS[4].emoji,
    capacidadPrimera: OPCIONES_CAPACIDAD[0].emoji,
    capacidadUltima: OPCIONES_CAPACIDAD[4].emoji,
  };
`, context);

test('la interfaz contiene ambos cuestionarios completos', () => {
  assert.equal(context.uiSnapshot.totalSerenia, 10);
  assert.equal(context.uiSnapshot.totalInstrumentos, 17);
});

test('los emojis respetan el sentido positivo o negativo de cada pregunta', () => {
  assert.equal(context.uiSnapshot.pssNegativaPrimera, '😌');
  assert.equal(context.uiSnapshot.pssNegativaUltima, '😫');
  assert.equal(context.uiSnapshot.pssPositivaPrimera, '😫');
  assert.equal(context.uiSnapshot.pssPositivaUltima, '😌');
  assert.equal(context.uiSnapshot.capacidadPrimera, '😣');
  assert.equal(context.uiSnapshot.capacidadUltima, '💪');
});
