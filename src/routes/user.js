const express = require('express');
const router = express.Router();
const { db } = require('../models');
const { authenticate } = require('../middleware/auth');
const { calcularEdad } = require('../utils/helpers');

// Perfil completo
router.get('/profile', authenticate, (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, nombre, apellido, email, fecha_nacimiento, edad, telefono, sexo, created_at 
      FROM users WHERE id = ?
    `).get(req.user.id);

    // Estadísticas
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_cuestionarios,
        AVG(estres_score) as promedio_estres,
        AVG(ansiedad_score) as promedio_ansiedad
      FROM questionnaires WHERE user_id = ?
    `).get(req.user.id);

    res.json({ user, stats });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

// Actualizar perfil
router.put('/profile', authenticate, (req, res) => {
  try {
    const { nombre, apellido, telefono, sexo, fechaNacimiento } = req.body;
    const updates = [];
    const values = [];

    if (nombre) { updates.push('nombre = ?'); values.push(nombre); }
    if (apellido) { updates.push('apellido = ?'); values.push(apellido); }
    if (telefono) { updates.push('telefono = ?'); values.push(telefono); }
    if (sexo) { updates.push('sexo = ?'); values.push(sexo); }
    if (fechaNacimiento) {
      updates.push('fecha_nacimiento = ?'); 
      values.push(fechaNacimiento);
      updates.push('edad = ?');
      values.push(calcularEdad(fechaNacimiento));
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay datos para actualizar' });
    }

    values.push(req.user.id);
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    res.json({ message: 'Perfil actualizado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
});

module.exports = router;