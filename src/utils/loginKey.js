const buildLoginRateLimitKey = (body) => {
  const email = typeof body?.email === 'string'
    ? body.email.trim().toLowerCase()
    : '';
  return `login:${email || 'solicitud-invalida'}`;
};

module.exports = { buildLoginRateLimitKey };
