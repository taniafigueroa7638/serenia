const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

process.env.DATA_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');

const { encryptJson, decryptJson } = require('../src/utils/encryption');
const {
  encryptQuestionnaireData,
  decryptQuestionnaireRow,
  encryptAnswerData,
  decryptAnswerRow,
  encryptDiaryData,
  decryptDiaryRow,
} = require('../src/utils/sensitiveData');

test('AES-256-GCM recupera el contenido sin dejarlo visible en el texto cifrado', () => {
  const privateData = { titulo: 'Un día difícil', contenido: 'Hoy sentí mucha ansiedad.' };
  const payload = encryptJson(privateData, 'diary:user:15');

  assert.match(payload, /^v1\./);
  assert.doesNotMatch(payload, /Un día difícil|ansiedad/);
  assert.deepEqual(decryptJson(payload, 'diary:user:15'), privateData);
});

test('el cifrado rechaza otro usuario, otra clave o contenido alterado', () => {
  const originalKey = process.env.DATA_ENCRYPTION_KEY;
  const payload = encryptJson({ contenido: 'Privado' }, 'diary:user:1');

  assert.throws(() => decryptJson(payload, 'diary:user:2'));

  process.env.DATA_ENCRYPTION_KEY = crypto.randomBytes(32).toString('base64');
  assert.throws(() => decryptJson(payload, 'diary:user:1'));
  process.env.DATA_ENCRYPTION_KEY = originalKey;

  const parts = payload.split('.');
  parts[3] = `${parts[3][0] === 'A' ? 'B' : 'A'}${parts[3].slice(1)}`;
  assert.throws(() => decryptJson(parts.join('.'), 'diary:user:1'));
});

test('diario, cuestionarios y respuestas conservan el formato que consume la interfaz', () => {
  const diaryPayload = encryptDiaryData({
    titulo: 'Mi entrada',
    contenido: 'Contenido privado',
    emocion: 'tranquilo',
  }, 9);
  const diary = decryptDiaryRow({
    id: 3,
    user_id: 9,
    fecha: '2026-08-31',
    permitir_chatbot: false,
    encrypted_data: diaryPayload,
  });
  assert.equal(diary.titulo, 'Mi entrada');
  assert.equal(diary.contenido, 'Contenido privado');
  assert.equal(diary.encrypted_data, undefined);
  assert.equal(diary.user_id, undefined);

  const questionnairePayload = encryptQuestionnaireData({
    estres_score: 12,
    ansiedad_score: 5,
    estado_emocional: 'Positivo',
    emocion_principal: 'Tranquilo',
    resultado_general: 'Nivel saludable',
  }, 9);
  const questionnaire = decryptQuestionnaireRow({
    id: 4,
    user_id: 9,
    tipo: 'instrumentos',
    encrypted_data: questionnairePayload,
  });
  assert.equal(questionnaire.estres_score, 12);
  assert.equal(questionnaire.resultado_general, 'Nivel saludable');

  const answerPayload = encryptAnswerData({
    pregunta_texto: '¿Cómo te sientes?',
    respuesta: 'Bien',
    valor_numerico: 1,
    categoria: 'emocion',
  }, 4, 1);
  const answer = decryptAnswerRow({
    id: 8,
    questionnaire_id: 4,
    pregunta_numero: 1,
    encrypted_data: answerPayload,
  });
  assert.equal(answer.respuesta, 'Bien');
  assert.equal(answer.valor_numerico, 1);
});
