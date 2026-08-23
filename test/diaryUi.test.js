const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(
  path.join(__dirname, '../public/js/diary.js'),
  'utf8'
);
const context = vm.createContext({});
vm.runInContext(source, context);
vm.runInContext(`
  diarySnapshot = {
    moods: DIARY_MOODS.map((mood) => mood.value),
    localDate: getLocalDateValue(),
  };
`, context);

test('el diario ofrece todas las emociones admitidas por la base', () => {
  assert.deepEqual(Array.from(context.diarySnapshot.moods), [
    '', 'tranquilo', 'feliz', 'neutral', 'preocupado',
    'ansioso', 'molesto', 'triste', 'cansado'
  ]);
});

test('la fecha nueva usa el calendario local y formato ISO de fecha', () => {
  assert.match(context.diarySnapshot.localDate, /^\d{4}-\d{2}-\d{2}$/);
});
