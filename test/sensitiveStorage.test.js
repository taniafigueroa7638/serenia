const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = relative => fs.readFileSync(path.join(__dirname, '..', relative), 'utf8');
const questionnaireRoute = read('src/routes/questionnaire.js');
const diaryRoute = read('src/routes/diary.js');
const userRoute = read('src/routes/user.js');
const models = read('src/models/index.js');

test('las nuevas escrituras persisten únicamente cargas cifradas', () => {
  assert.match(questionnaireRoute, /INSERT INTO questionnaires \([\s\S]*user_id, tipo, encrypted_data/);
  assert.match(questionnaireRoute, /INSERT INTO answers \([\s\S]*questionnaire_id, pregunta_numero, encrypted_data/);
  assert.match(diaryRoute, /INSERT INTO diary_entries \([\s\S]*user_id, fecha, permitir_chatbot, encrypted_data/);
});

test('el arranque migra y elimina las copias legibles antiguas', () => {
  assert.match(models, /SET encrypted_data = \$1,[\s\S]*estres_score = NULL/);
  assert.match(models, /SET encrypted_data = \$1,[\s\S]*pregunta_texto = NULL/);
  assert.match(models, /SET encrypted_data = \$1,[\s\S]*titulo = NULL/);
  assert.match(models, /ALTER COLUMN encrypted_data SET NOT NULL/);
});

test('los promedios se calculan después de descifrar y no sobre columnas legibles', () => {
  assert.match(userRoute, /rows\.map\(decryptQuestionnaireRow\)/);
  assert.doesNotMatch(userRoute, /AVG\(estres_score\)|AVG\(ansiedad_score\)/);
});
