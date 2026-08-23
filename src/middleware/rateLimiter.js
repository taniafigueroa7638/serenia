const rateLimit = require('express-rate-limit');
const { buildLoginRateLimitKey } = require('../utils/loginKey');

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  message: { error: 'Demasiadas solicitudes. Intente más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// El bloqueo del inicio de sesión se aísla por correo normalizado. De este modo,
// los intentos fallidos de una cuenta no bloquean a los demás usuarios que
// comparten una red, un proxy o la misma instancia en Render.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  keyGenerator: (req) => buildLoginRateLimitKey(req.body),
  skipSuccessfulRequests: true,
  message: {
    error: 'Demasiados intentos fallidos para esta cuenta. Intente nuevamente en 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Conserva protección para operaciones sensibles distintas del login. Aquí se
// usa el identificador IP seguro del propio paquete (con app.set('trust proxy')).
const sensitiveAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: { error: 'Demasiadas solicitudes de autenticación. Intente en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { generalLimiter, loginLimiter, sensitiveAuthLimiter };
