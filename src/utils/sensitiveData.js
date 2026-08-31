const { encryptJson, decryptJson } = require('./encryption');

const questionnaireContext = (userId) => `questionnaire:user:${userId}`;
const answerContext = (questionnaireId, questionNumber) => (
  `answer:questionnaire:${questionnaireId}:question:${questionNumber}`
);
const diaryContext = (userId) => `diary:user:${userId}`;

const encryptQuestionnaireData = (data, userId) => encryptJson({
  estres_score: data.estres_score,
  ansiedad_score: data.ansiedad_score,
  estado_emocional: data.estado_emocional,
  emocion_principal: data.emocion_principal,
  resultado_general: data.resultado_general,
}, questionnaireContext(userId));

const decryptQuestionnaireRow = (row) => {
  const sensitive = decryptJson(row.encrypted_data, questionnaireContext(row.user_id));
  const { encrypted_data, ...publicRow } = row;
  return { ...publicRow, ...sensitive };
};

const encryptAnswerData = (data, questionnaireId, questionNumber) => encryptJson({
  pregunta_texto: data.pregunta_texto,
  respuesta: data.respuesta,
  valor_numerico: data.valor_numerico,
  categoria: data.categoria,
}, answerContext(questionnaireId, questionNumber));

const decryptAnswerRow = (row) => {
  const sensitive = decryptJson(
    row.encrypted_data,
    answerContext(row.questionnaire_id, row.pregunta_numero)
  );
  const { encrypted_data, ...publicRow } = row;
  return { ...publicRow, ...sensitive };
};

const encryptDiaryData = (data, userId) => encryptJson({
  titulo: data.titulo,
  contenido: data.contenido,
  emocion: data.emocion ?? null,
}, diaryContext(userId));

const decryptDiaryRow = (row) => {
  const sensitive = decryptJson(row.encrypted_data, diaryContext(row.user_id));
  const { encrypted_data, user_id, ...publicRow } = row;
  return { ...publicRow, ...sensitive };
};

module.exports = {
  encryptQuestionnaireData,
  decryptQuestionnaireRow,
  encryptAnswerData,
  decryptAnswerRow,
  encryptDiaryData,
  decryptDiaryRow,
};
