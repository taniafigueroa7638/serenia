const express = require('express');
const router = express.Router();
const { query } = require('../models');
const { authenticate } = require('../middleware/auth');
const { calcularEdad } = require('../utils/helpers');

// Perfil completo
router.get('/profile', authenticate, async (req, res) => {
  try {
    const userResult = await query(`
      SELECT id, nombre, apellido, email, fecha_nacimiento, edad, telefono, sexo, created_at
      FROM users WHERE id = $1
    `, [req.user.id]);

    const statsResult = await query(`
      SELECT
        COUNT(*)::int as total_cuestionarios,
        COALESCE(AVG(estres_score), 0)::numeric(10,2) as promedio_estres,
        COALESCE(AVG(ansiedad_score), 0)::numeric(10,2) as promedio_ansiedad
      FROM questionnaires WHERE user_id = $1
    `, [req.user.id]);

    res.json({
      user: userResult.rows[0],
      stats: statsResult.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

// Actualizar perfil
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { nombre, apellido, telefono, sexo, fechaNacimiento } = req.body;
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (nombre) { updates.push(`nombre = $${paramIndex++}`); values.push(nombre); }
    if (apellido) { updates.push(`apellido = $${paramIndex++}`); values.push(apellido); }
    if (telefono) { updates.push(`telefono = $${paramIndex++}`); values.push(telefono); }
    if (sexo) { updates.push(`sexo = $${paramIndex++}`); values.push(sexo); }
    if (fechaNacimiento) {
      updates.push(`fecha_nacimiento = $${paramIndex++}`);
      values.push(fechaNacimiento);
      updates.push(`edad = $${paramIndex++}`);
      values.push(calcularEdad(fechaNacimiento));
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay datos para actualizar' });
    }

    values.push(req.user.id);
    await query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}`, values);

    res.json({ message: 'Perfil actualizado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
});

module.exports = router;
