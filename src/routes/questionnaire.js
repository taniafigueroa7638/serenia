const express = require('express');
const router = express.Router();
const { query } = require('../models');
const { authenticate } = require('../middleware/auth');
const { validate, questionnaireValidation } = require('../middleware/validator');
const { calcularScore, PREGUNTAS, ESCALAS } = require('../utils/scoring');

// Guardar cuestionario
router.post('/', authenticate, validate(questionnaireValidation), async (req, res) => {
  try {
    const { respuestas } = req.body;
    const userId = req.user.id;

    const scores = calcularScore(respuestas);

    const result = await query(`
      INSERT INTO questionnaires (user_id, estres_score, ansiedad_score, estado_emocional, emocion_principal, resultado_general)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [
      userId,
      scores.estresScore,
      scores.ansiedadScore,
      scores.estadoEmocional,
      scores.emocionPrincipal,
      scores.resultadoGeneral
    ]);

    const questionnaireId = result.rows[0].id;

    // Guardar respuestas individuales
    for (const r of respuestas) {
      const pregunta = PREGUNTAS.find(p => p.num === r.pregunta);
      if (!pregunta) continue;

      let respuestaTexto;
      if (pregunta.num === 3) {
        respuestaTexto = ESCALAS.capacidad[r.valor];
      } else if (pregunta.num === 9) {
        respuestaTexto = ESCALAS.emocional[r.valor];
      } else if (pregunta.num === 10) {
        respuestaTexto = ESCALAS.emociones[r.valor] || 'No especificada';
      } else {
        respuestaTexto = ESCALAS.frecuencia[r.valor];
      }

      await query(`
        INSERT INTO answers (questionnaire_id, pregunta_numero, pregunta_texto, respuesta, valor_numerico, categoria)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        questionnaireId,
        pregunta.num,
        pregunta.texto,
        respuestaTexto,
        pregunta.invertida ? (4 - r.valor) : r.valor,
        pregunta.categoria
      ]);
    }

    res.status(201).json({
      message: 'Cuestionario guardado exitosamente',
      questionnaireId,
      scores
    });
  } catch (err) {
    console.error('Questionnaire error:', err);
    res.status(500).json({ error: 'Error al guardar cuestionario' });
  }
});

// Historial del usuario
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

// Detalle de un cuestionario
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
