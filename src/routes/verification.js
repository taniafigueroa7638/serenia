const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const router = express.Router();

const { pool, query } = require('../models');
const { sendVerificationCode, generateCode } = require('../services/email');

const CODE_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 60;
const PREVIOUS_CODE_GRACE_MINUTES = 10;

const identityValidation = [
  body('userId').optional({ nullable: true }).isInt({ min: 1 }).toInt(),
  body('email').optional({ checkFalsy: true }).isEmail().normalizeEmail(),
];

function getValidationErrors(req) {
  const errors = validationResult(req);
  return errors.isEmpty() ? null : errors.array();
}

function normalizeCode(value) {
  return String(value || '').replace(/\D/g, '').slice(0, CODE_LENGTH);
}

function isFuture(value) {
  if (!value) return false;
  const timestamp = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(timestamp) && timestamp > Date.now();
}

function codeMatches(code, storedCode, expiresAt) {
  return Boolean(storedCode)
    && code === String(storedCode)
    && isFuture(expiresAt);
}

async function findPendingUser(db, { userId, email, forUpdate = false }) {
  const lock = forUpdate ? ' FOR UPDATE' : '';

  // El ID devuelto al registrar es la referencia principal. Evita depender de
  // cómo express-validator haya normalizado el correo (puntos, mayúsculas,
  // subdirecciones de Gmail, etc.).
  if (Number.isInteger(userId) && userId > 0) {
    const result = await db.query(`
      SELECT *
      FROM users
      WHERE id = $1
      LIMIT 1${lock}
    `, [userId]);
    return result.rows[0] || null;
  }

  // Compatibilidad con registros iniciados antes del hotfix. Aquí el email ya
  // fue normalizado por el mismo middleware que se usa en /register.
  if (email) {
    const result = await db.query(`
      SELECT *
      FROM users
      WHERE email = $1
      LIMIT 1${lock}
    `, [email]);
    return result.rows[0] || null;
  }

  return null;
}

router.post('/verify-email', identityValidation, async (req, res) => {
  try {
    const errors = getValidationErrors(req);
    if (errors) {
      return res.status(400).json({ error: 'Datos de verificación inválidos', details: errors });
    }

    const userId = Number.isInteger(req.body.userId) ? req.body.userId : null;
    const email = req.body.email || null;
    const code = normalizeCode(req.body.code);

    if ((!userId && !email) || !new RegExp(`^\\d{${CODE_LENGTH}}$`).test(code)) {
      return res.status(400).json({ error: 'Ingresa el código de 6 dígitos.' });
    }

    const user = await findPendingUser({ query }, { userId, email });
    if (!user) {
      return res.status(400).json({ error: 'Código inválido o expirado.' });
    }

    if (user.is_verified) {
      return res.status(409).json({ error: 'Este correo ya fue verificado. Puedes iniciar sesión.' });
    }

    const currentMatches = codeMatches(
      code,
      user.verification_code,
      user.verification_code_expires_at
    );
    const previousMatches = codeMatches(
      code,
      user.previous_verification_code,
      user.previous_verification_code_expires_at
    );

    if (!currentMatches && !previousMatches) {
      return res.status(400).json({ error: 'Código inválido o expirado.' });
    }

    const updated = await query(`
      UPDATE users
      SET is_verified = TRUE,
          verification_code = NULL,
          verification_code_expires_at = NULL,
          previous_verification_code = NULL,
          previous_verification_code_expires_at = NULL
      WHERE id = $1 AND is_verified = FALSE
      RETURNING *
    `, [user.id]);

    const verifiedUser = updated.rows[0];
    if (!verifiedUser) {
      return res.status(409).json({ error: 'Este correo ya fue verificado. Puedes iniciar sesión.' });
    }

    const token = jwt.sign(
      { userId: verifiedUser.id, email: verifiedUser.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      message: 'Email verificado correctamente',
      token,
      user: {
        id: verifiedUser.id,
        nombre: verifiedUser.nombre,
        apellido: verifiedUser.apellido,
        email: verifiedUser.email,
      },
    });
  } catch (err) {
    console.error('Verify email error:', err);
    res.status(500).json({ error: 'Error al verificar email' });
  }
});

router.post('/resend-code', identityValidation, async (req, res) => {
  const errors = getValidationErrors(req);
  if (errors) {
    return res.status(400).json({ error: 'Datos de verificación inválidos', details: errors });
  }

  const userId = Number.isInteger(req.body.userId) ? req.body.userId : null;
  const email = req.body.email || null;
  if (!userId && !email) return res.status(400).json({ error: 'No se pudo identificar la cuenta.' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const user = await findPendingUser(client, { userId, email, forUpdate: true });
    if (!user || user.is_verified) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Usuario no encontrado o ya verificado' });
    }

    if (user.verification_code_sent_at) {
      const sentAt = new Date(user.verification_code_sent_at).getTime();
      if (Number.isFinite(sentAt)) {
        const elapsedSeconds = Math.floor((Date.now() - sentAt) / 1000);
        if (elapsedSeconds < RESEND_COOLDOWN_SECONDS) {
          const retryAfter = RESEND_COOLDOWN_SECONDS - Math.max(0, elapsedSeconds);
          await client.query('ROLLBACK');
          return res.status(429).json({
            error: `Espera ${retryAfter} segundos antes de solicitar otro código.`,
            retryAfter,
          });
        }
      }
    }

    const newCode = generateCode();

    await client.query(`
      UPDATE users
      SET previous_verification_code = verification_code,
          previous_verification_code_expires_at = CASE
            WHEN verification_code IS NULL THEN NULL
            ELSE LEAST(
              COALESCE(verification_code_expires_at, NOW() + INTERVAL '30 minutes'),
              NOW() + INTERVAL '${PREVIOUS_CODE_GRACE_MINUTES} minutes'
            )
          END,
          verification_code = $1,
          verification_code_expires_at = NOW() + INTERVAL '30 minutes',
          verification_code_sent_at = NOW()
      WHERE id = $2
    `, [newCode, user.id]);

    await sendVerificationCode(user.email, newCode, user.nombre);
    await client.query('COMMIT');

    res.json({
      message: 'Código reenviado. El código anterior seguirá funcionando durante unos minutos.',
      cooldownSeconds: RESEND_COOLDOWN_SECONDS,
    });
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.error('Resend verification code error:', err);
    res.status(503).json({
      error: 'No pudimos reenviar el código en este momento. El código anterior sigue siendo válido si no ha expirado.'
    });
  } finally {
    client.release();
  }
});

module.exports = router;
