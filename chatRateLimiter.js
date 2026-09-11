const rateLimit = require('express-rate-limit');

const configuredLimit = Number(process.env.CHAT_REQUESTS_PER_MINUTE || 12);
const perMinuteLimit = Number.isInteger(configuredLimit) && configuredLimit > 0
  ? configuredLimit
  : 12;

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: perMinuteLimit,
  keyGenerator: (req) => `chat-user:${req.user.id}`,
  message: { error: 'Has enviado varios mensajes seguidos. Espera un momento antes de continuar.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { chatLimiter };
