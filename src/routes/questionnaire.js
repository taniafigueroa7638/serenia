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

    await client.query('BEGIN');
    transactionStarted = true;
    const result = await client.query(`
      INSERT INTO questionnaires (
        user_id, estres_score, ansiedad_score, estado_emocional,
        emocion_principal, resultado_general, tipo
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, [
      userId,
      scores.estresScore ?? 0,
      scores.ansiedadScore ?? 0,
      scores.estadoEmocional,
      scores.emocionPrincipal,
      scores.resultadoGeneral,
      tipo,
    ]);

    const questionnaireId = result.rows[0].id;

    for (const respuesta of respuestas) {
      const pregunta = preguntas.find((item) => item.num === respuesta.pregunta);
      await client.query(`
        INSERT INTO answers (
          questionnaire_id, pregunta_numero, pregunta_texto,
          respuesta, valor_numerico, categoria
        )
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        questionnaireId,
        pregunta.num,
        pregunta.texto,
        obtenerRespuestaTexto(pregunta, respuesta.valor),
        obtenerValorNumerico(tipo, pregunta, respuesta.valor),
        pregunta.categoria,
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
      SELECT * FROM questionnaires
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [req.user.id]);

    res.json({ questionnaires: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener historial' });
  }
});

// Detalle de un cuestionario.
router.get('/:id', authenticate, async (req, res) => {
  try {
    const qResult = await query(
      'SELECT * FROM questionnaires WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    const questionnaire = qResult.rows[0];

    if (!questionnaire) {
      return res.status(404).json({ error: 'Cuestionario no encontrado' });
    }

    const aResult = await query(
      'SELECT * FROM answers WHERE questionnaire_id = $1 ORDER BY pregunta_numero',
      [req.params.id]
    );

    res.json({ questionnaire, answers: aResult.rows });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener cuestionario' });
  }
});

module.exports = router;
