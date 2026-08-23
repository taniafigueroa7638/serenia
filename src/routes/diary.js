const express = require('express');
const router = express.Router();
const { query } = require('../models');
const { authenticate } = require('../middleware/auth');
const {
  validate,
  diaryEntryValidation,
  diaryIdValidation,
} = require('../middleware/validator');

const DIARY_FIELDS = `
  id, titulo, contenido, fecha, emocion, permitir_chatbot,
  created_at, updated_at
`;

// Listar únicamente las entradas del usuario autenticado.
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await query(`
      SELECT ${DIARY_FIELDS}
      FROM diary_entries
      WHERE user_id = $1
      ORDER BY fecha DESC, created_at DESC
      LIMIT 100
    `, [req.user.id]);

    res.json({ entries: result.rows });
  } catch (err) {
    console.error('Diary list error:', err);
    res.status(500).json({ error: 'Error al obtener el diario' });
  }
});

// Crear una entrada privada.
router.post('/', authenticate, validate(diaryEntryValidation), async (req, res) => {
  try {
    const { titulo, contenido, fecha, emocion, permitirChatbot } = req.body;
    const result = await query(`
      INSERT INTO diary_entries (
        user_id, titulo, contenido, fecha, emocion, permitir_chatbot
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING ${DIARY_FIELDS}
    `, [
      req.user.id,
      titulo,
      contenido,
      fecha,
      emocion || null,
      permitirChatbot,
    ]);

    res.status(201).json({
      message: 'Entrada guardada',
      entry: result.rows[0],
    });
  } catch (err) {
    console.error('Diary create error:', err);
    res.status(500).json({ error: 'Error al guardar la entrada' });
  }
});

// Actualizar solo si la entrada pertenece al usuario autenticado.
router.put(
  '/:id',
  authenticate,
  validate(diaryIdValidation),
  validate(diaryEntryValidation),
  async (req, res) => {
    try {
      const { titulo, contenido, fecha, emocion, permitirChatbot } = req.body;
      const result = await query(`
        UPDATE diary_entries
        SET titulo = $1,
            contenido = $2,
            fecha = $3,
            emocion = $4,
            permitir_chatbot = $5,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $6 AND user_id = $7
        RETURNING ${DIARY_FIELDS}
      `, [
        titulo,
        contenido,
        fecha,
        emocion || null,
        permitirChatbot,
        req.params.id,
        req.user.id,
      ]);

      if (!result.rows[0]) {
        return res.status(404).json({ error: 'Entrada no encontrada' });
      }

      res.json({ message: 'Entrada actualizada', entry: result.rows[0] });
    } catch (err) {
      console.error('Diary update error:', err);
      res.status(500).json({ error: 'Error al actualizar la entrada' });
    }
  }
);

// Eliminar solo si la entrada pertenece al usuario autenticado.
router.delete('/:id', authenticate, validate(diaryIdValidation), async (req, res) => {
  try {
    const result = await query(`
      DELETE FROM diary_entries
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `, [req.params.id, req.user.id]);

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Entrada no encontrada' });
    }

    res.json({ message: 'Entrada eliminada' });
  } catch (err) {
    console.error('Diary delete error:', err);
    res.status(500).json({ error: 'Error al eliminar la entrada' });
  }
});

module.exports = router;
