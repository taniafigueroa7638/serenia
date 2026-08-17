const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

const { query } = require('../models');
const { sendVerificationCode, sendPasswordReset, generateCode } = require('../services/email');
const { validate, registerValidation, loginValidation } = require('../middleware/validator');
const { calcularEdad, generateToken } = require('../utils/helpers');
const { authenticate } = require('../middleware/auth');

// Registro
router.post('/register', validate(registerValidation), async (req, res) => {
  try {
    const { nombre, apellido, email, password, fechaNacimiento, telefono, sexo } = req.body;

    // Verificar email único
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    const edad = calcularEdad(fechaNacimiento);
    const passwordHash = await bcrypt.hash(password, 12);
    const verificationCode = generateCode();

    const result = await query(`
      INSERT INTO users (nombre, apellido, email, password_hash, fecha_nacimiento, edad, telefono, sexo, verification_code)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `, [nombre, apellido, email, passwordHash, fechaNacimiento, edad, telefono || null, sexo || null, verificationCode]);

    // Enviar email de verificación
    await sendVerificationCode(email, verificationCode, nombre);

    res.status(201).json({
      message: 'Registro exitoso. Revisa tu email para el código de verificación.',
      userId: result.rows[0].id
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

// Verificar email
router.post('/verify-email', async (req, res) => {
  try {
    const { email, code } = req.body;

    const result = await query(
      'SELECT * FROM users WHERE email = $1 AND verification_code = $2',
      [email, code]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ error: 'Código inválido' });
    }

    await query(
      'UPDATE users SET is_verified = TRUE, verification_code = NULL WHERE id = $1',
      [user.id]
    );

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      message: 'Email verificado correctamente',
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al verificar email' });
  }
});

// Reenviar código
router.post('/resend-code', async (req, res) => {
  try {
    const { email } = req.body;
    const result = await query(
      'SELECT * FROM users WHERE email = $1 AND is_verified = FALSE',
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado o ya verificado' });
    }

    const newCode = generateCode();
    await query('UPDATE users SET verification_code = $1 WHERE id = $2', [newCode, user.id]);
    await sendVerificationCode(email, newCode, user.nombre);

    res.json({ message: 'Código reenviado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al reenviar código' });
  }
});

// Login
router.post('/login', validate(loginValidation), async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    if (!user.is_verified) {
      return res.status(403).json({ error: 'Email no verificado. Revisa tu correo.' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// Recuperar contraseña
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const result = await query(
      'SELECT * FROM users WHERE email = $1 AND is_verified = TRUE',
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      // Respuesta genérica por seguridad
      return res.json({ message: 'Si el email existe, recibirás instrucciones.' });
    }

    const resetToken = generateToken();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await query(
      'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
      [resetToken, expires, user.id]
    );

    await sendPasswordReset(email, resetToken, user.nombre);

    res.json({ message: 'Si el email existe, recibirás instrucciones.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Error al procesar solicitud' });
  }
});

// Resetear contraseña
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    }

    const result = await query(
      'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
      [token]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ error: 'Token inválido o expirado' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
      [passwordHash, user.id]
    );

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error al resetear contraseña' });
  }
});

// Obtener usuario actual
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
