const express = require('express');
const router = express.Router();
const { db } = require('../models');
const { authenticate } = require('../middleware/auth');
const { validate, questionnaireValidation } = require('../middleware/validator');
const { calcularScore, PREGUNTAS, ESCALAS } = require('../utils/scoring');

// Guardar cuestionario
router.post('/', authenticate, validate(questionnaireValidation), (req, res) => {
  try {
    const { respuestas } = req.body;
    const userId = req.user.id;

    const scores = calcularScore(respuestas);

    const result = db.prepare(`
      INSERT INTO questionnaires (user_id, fecha, estres_score, ansiedad_score, estado_emocional, emocion_principal, resultado_general)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      new Date().toISOString(),
      scores.estresScore,
      scores.ansiedadScore,
      scores.estadoEmocional,
      scores.emocionPrincipal,
      scores.resultadoGeneral
    );

    const questionnaireId = result.lastInsertRowid;

    // Guardar respuestas individuales
    const insertAnswer = db.prepare(`
      INSERT INTO answers (questionnaire_id, pregunta_numero, pregunta_texto, respuesta, valor_numerico, categoria)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    respuestas.forEach(r => {
      const pregunta = PREGUNTAS.find(p => p.num === r.pregunta);
      let respuestaTexto;
      
      if (pregunta.num === 3) {
        respuestaTexto = ESCALAS.capacidad[r.valor];
      } else if (pregunta.num === 9) {
        respuestaTexto = ESCALAS.emocional[r.valor];
      } else if (pregunta.num === 10) {
        respuestaTexto = ESCALAS.emociones[r.valor];
      } else {
        respuestaTexto = ESCALAS.frecuencia[r.valor];
      }

      insertAnswer.run(
        questionnaireId,
        pregunta.num,
        pregunta.texto,
        respuestaTexto,
        pregunta.invertida ? (4 - r.valor) : r.valor,
        pregunta.categoria
      );
    });

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
router.get('/history', authenticate, (req, res) => {
  try {
    const questionnaires = db.prepare(`
      SELECT * FROM questionnaires 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `).all(req.user.id);

    res.json({ questionnaires });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener historial' });
  }
});

// Detalle de un cuestionario
router.get('/:id', authenticate, (req, res) => {
  try {
    const questionnaire = db.prepare(`
      SELECT * FROM questionnaires WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.id);

    if (!questionnaire) {
      return res.status(404).json({ error: 'Cuestionario no encontrado' });
    }

    const answers = db.prepare(`
      SELECT * FROM answers WHERE questionnaire_id = ? ORDER BY pregunta_numero
    `).all(req.params.id);

    res.json({ questionnaire, answers });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener cuestionario' });
  }
});

module.exports = router;