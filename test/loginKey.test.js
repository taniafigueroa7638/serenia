const test = require('node:test');
const assert = require('node:assert/strict');
const { buildLoginRateLimitKey } = require('../src/utils/loginKey');

test('el bloqueo agrupa variantes del mismo correo', () => {
  assert.equal(
    buildLoginRateLimitKey({ email: '  Persona@Ejemplo.com ' }),
    buildLoginRateLimitKey({ email: 'persona@ejemplo.com' })
  );
});

test('los intentos de una cuenta no afectan a otra', () => {
  assert.notEqual(
    buildLoginRateLimitKey({ email: 'uno@ejemplo.com' }),
    buildLoginRateLimitKey({ email: 'dos@ejemplo.com' })
  );
});
