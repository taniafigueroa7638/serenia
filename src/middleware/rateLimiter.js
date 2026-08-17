const rateLimit = require('express-rate-limit');

const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5,
  message: { error: 'Límite de solicitudes excedido. Intente más tarde.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { strictLimiter };