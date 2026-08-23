const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(
  path.join(__dirname, '../public/js/dashboard.js'),
  'utf8'
);
const context = vm.createContext({
  clearInterval: () => {},
  setInterval: () => 1,
  setTimeout: () => 1,
});
vm.runInContext(source, context);
vm.runInContext(`
  suggestionsSnapshot = {
    suggestions: [...SERENIA_SUGGESTIONS],
    rotationSource: startSuggestionRotation.toString(),
  };
`, context);

test('la tarjeta contiene las cinco sugerencias definidas', () => {
  assert.equal(context.suggestionsSnapshot.suggestions.length, 5);
  assert.deepEqual(
    Array.from(context.suggestionsSnapshot.suggestions),
    [
      'Tómate unos minutos para respirar lentamente y relajar tu cuerpo.',
      'Haz una pausa breve y aléjate unos minutos de aquello que te genera tensión.',
      'Recuerda hidratarte y descansar cuando lo necesites.',
      'Escuchar música tranquila puede ayudarte a crear un momento de calma.',
      'Dedica unos minutos a realizar una actividad que disfrutes.',
    ]
  );
});

test('la rotación automática utiliza un intervalo de cinco segundos', () => {
  assert.match(context.suggestionsSnapshot.rotationSource, /5000/);
});
