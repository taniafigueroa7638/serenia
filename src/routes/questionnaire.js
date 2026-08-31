const express = require('express');
const router = express.Router();
const { pool, query } = require('../models');
const { authenticate } = require('../middleware/auth');
const { validate, questionnaireValidation } = require('../middleware/validator');
const {
  PREGUNTAS_POR_TIPO,
  calcularScore,
  obtenerRespuestaTexto,
  obtenerValorNumerico,
} = require('../utils/scoring');
const { buildQuestionnaireStatus } = require('../utils/questionnaireStatus');
const {
  encryptQuestionnaireData,
  decryptQuestionnaireRow,
  encryptAnswerData,
  decryptAnswerRow,
} = require('../utils/sensitiveData');

const obtenerEstadoSemanal = async (userId, executeQuery = query) => {
  const result = await executeQuery(`
    SELECT tipo, MAX(created_at) AS last_completed_at
    FROM questionnaires
    WHERE user_id = $1
    GROUP BY tipo
  `, [userId]);

  return buildQuestionnaireStatus(result.rows);
};

// Indica cuáles de las dos evaluaciones deben completarse esta semana.
router.get('/status', authenticate, async (req, res) => {
  try {
    const status = await obtenerEstadoSemanal(req.user.id);
    res.json({ status });
  } catch (err) {
    console.error('Questionnaire status error:', err);
    res.status(500).json({ error: 'Error al consultar evaluaciones pendientes' });
  }
});

// Guardar uno de los dos cuestionarios.
router.post('/', authenticate, validate(questionnaireValidation), async (req, res) => {
  let client;
  let transactionStarted = false;
  try {
    client = await pool.connect();
    const { tipo, respuestas } = req.body;
    const userId = req.user.id;
    const preguntas = PREGUNTAS_POR_TIPO[tipo];
    const scores = calcularScore(respuestas, tipo);
    const encryptedQuestionnaire = encryptQuestionnaireData({
      estres_score: scores.estresScore ?? 0,
      ansiedad_score: scores.ansiedadScore ?? 0,
      estado_emocional: scores.estadoEmocional,
      emocion_principal: scores.emocionPrincipal,
      resultado_general: scores.resultadoGeneral,
    }, userId);

    await client.query('BEGIN');
    transactionStarted = true;
    const result = await client.query(`
      INSERT INTO questionnaires (
        user_id, tipo, encrypted_data
      )
      VALUES ($1, $2, $3)
      RETURNING id
    `, [
      userId,
      tipo,
      encryptedQuestionnaire,
    ]);

    const questionnaireId = result.rows[0].id;

    for (const respuesta of respuestas) {
      const pregunta = preguntas.find((item) => item.num === respuesta.pregunta);
      const encryptedAnswer = encryptAnswerData({
        pregunta_texto: pregunta.texto,
        respuesta: obtenerRespuestaTexto(pregunta, respuesta.valor),
        valor_numerico: obtenerValorNumerico(tipo, pregunta, respuesta.valor),
        categoria: pregunta.categoria,
      }, questionnaireId, pregunta.num);
      await client.query(`
        INSERT INTO answers (
          questionnaire_id, pregunta_numero, encrypted_data
        )
        VALUES ($1, $2, $3)
      `, [
        questionnaireId,
        pregunta.num,
        encryptedAnswer,
      ]);
    }

    const weeklyStatus = await obtenerEstadoSemanal(
      userId,
      (text, params) => client.query(text, params)
    );
    await client.query('COMMIT');
    transactionStarted = false;

    res.status(201).json({
      message: 'Cuestionario guardado exitosamente',
      questionnaireId,
      tipo,
      scores,
      weeklyStatus,
    });
  } catch (err) {
    if (client && transactionStarted) await client.query('ROLLBACK');
    console.error('Questionnaire error:', err);
    res.status(500).json({ error: 'Error al guardar cuestionario' });
  } finally {
    if (client) client.release();
  }
});

// Historial del usuario.
router.get('/history', authenticate, async (req, res) => {
  try {
    const result = await query(`
      SELECT id, user_id, fecha, tipo, created_at, encrypted_data
      FROM questionnaires
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [req.user.id]);

    res.json({ questionnaires: result.rows.map(decryptQuestionnaireRow) });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener historial' });
  }
});

// Detalle de un cuestionario.
router.get('/:id', authenticate, async (req, res) => {
  try {
    const qResult = await query(
      `SELECT id, user_id, fecha, tipo, created_at, encrypted_data
       FROM questionnaires
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );
    const encryptedQuestionnaire = qResult.rows[0];

    if (!encryptedQuestionnaire) {
      return res.status(404).json({ error: 'Cuestionario no encontrado' });
    }

    const questionnaire = decryptQuestionnaireRow(encryptedQuestionnaire);

    const aResult = await query(
      `SELECT id, questionnaire_id, pregunta_numero, created_at, encrypted_data
       FROM answers
       WHERE questionnaire_id = $1
       ORDER BY pregunta_numero`,
      [req.params.id]
    );

    res.json({
      questionnaire,
      answers: aResult.rows.map(decryptAnswerRow),
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener cuestionario' });
  }
});

module.exports = router;
