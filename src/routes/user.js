const express = require('express');
const router = express.Router();
const { query } = require('../models');
const { authenticate } = require('../middleware/auth');
const { calcularEdad } = require('../utils/helpers');
const { decryptQuestionnaireRow } = require('../utils/sensitiveData');

// Perfil completo
router.get('/profile', authenticate, async (req, res) => {
  try {
    const userResult = await query(`
      SELECT id, nombre, apellido, email, fecha_nacimiento,
             EXTRACT(YEAR FROM age(CURRENT_DATE, fecha_nacimiento))::INTEGER AS edad,
             telefono, sexo, pais, created_at
      FROM users WHERE id = $1
    `, [req.user.id]);

    const questionnaireResult = await query(`
      SELECT id, user_id, tipo, encrypted_data
      FROM questionnaires
      WHERE user_id = $1
    `, [req.user.id]);
    const questionnaires = questionnaireResult.rows.map(decryptQuestionnaireRow);
    const instruments = questionnaires.filter(item => item.tipo === 'instrumentos');
    const average = (field) => {
      if (instruments.length === 0) return '0.00';
      const total = instruments.reduce((sum, item) => sum + Number(item[field] || 0), 0);
      return (total / instruments.length).toFixed(2);
    };
    const stats = {
      total_cuestionarios: questionnaires.length,
      total_serenia: questionnaires.filter(item => item.tipo === 'serenia').length,
      total_instrumentos: instruments.length,
      promedio_estres: average('estres_score'),
      promedio_ansiedad: average('ansiedad_score'),
    };

    res.json({
      user: userResult.rows[0],
      stats
    });
  } catch (err) {
    console.error('Profile load error:', err);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

// Actualizar perfil
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { nombre, apellido, telefono, sexo, fechaNacimiento, pais } = req.body;
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (nombre) { updates.push(`nombre = $${paramIndex++}`); values.push(String(nombre).trim()); }
    if (apellido) { updates.push(`apellido = $${paramIndex++}`); values.push(String(apellido).trim()); }
    if (telefono) { updates.push(`telefono = $${paramIndex++}`); values.push(String(telefono).trim()); }
    if (sexo) { updates.push(`sexo = $${paramIndex++}`); values.push(sexo); }
    if (fechaNacimiento) {
      updates.push(`fecha_nacimiento = $${paramIndex++}`);
      values.push(fechaNacimiento);
      updates.push(`edad = $${paramIndex++}`);
      values.push(calcularEdad(fechaNacimiento));
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'pais')) {
      const normalizedCountry = String(pais || '').trim();
      if (normalizedCountry.length > 80) {
        return res.status(400).json({ error: 'El país no puede superar 80 caracteres' });
      }
      updates.push(`pais = $${paramIndex++}`);
      values.push(normalizedCountry || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay datos para actualizar' });
    }

    values.push(req.user.id);
    await query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}`, values);

    res.json({ message: 'Perfil actualizado' });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
});

module.exports = router;
