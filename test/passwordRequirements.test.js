const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {
  evaluatePassword,
  passwordMeetsPolicy,
} = require('../src/utils/passwordPolicy');

const authSource = fs.readFileSync(
  path.join(__dirname, '../public/js/auth.js'),
  'utf8'
);
const authRouteSource = fs.readFileSync(
  path.join(__dirname, '../src/routes/auth.js'),
  'utf8'
);

test('la política exige longitud, mayúscula, minúscula y número', () => {
  assert.deepEqual(evaluatePassword('abc'), {
    minLength: false,
    uppercase: false,
    lowercase: true,
    number: false,
  });
  assert.equal(passwordMeetsPolicy('Serenia8'), true);
  assert.equal(passwordMeetsPolicy('serenia8'), false);
  assert.equal(passwordMeetsPolicy('SERENIA8'), false);
  assert.equal(passwordMeetsPolicy('Serenia!'), false);
});

test('registro y recuperación muestran los cuatro requisitos en vivo', () => {
  const context = vm.createContext({});
  vm.runInContext(authSource, context);
  vm.runInContext(`
    passwordUiSnapshot = {
      weak: evaluatePassword('abc'),
      strong: evaluatePassword('Serenia8'),
      markup: passwordRequirementsMarkup('requirements-test'),
    };
  `, context);

  assert.equal(context.passwordUiSnapshot.weak.minLength, false);
  assert.equal(context.passwordUiSnapshot.strong.minLength, true);
  assert.equal(context.passwordUiSnapshot.strong.uppercase, true);
  assert.equal(context.passwordUiSnapshot.strong.lowercase, true);
  assert.equal(context.passwordUiSnapshot.strong.number, true);
  assert.equal((context.passwordUiSnapshot.markup.match(/data-password-requirement=/g) || []).length, 4);
  assert.match(authSource, /setupPasswordRequirements\('regPassword'/);
  assert.match(authSource, /setupPasswordRequirements\('resetPassword'/);
  assert.match(authRouteSource, /reset-password', validate\(resetPasswordValidation\)/);
});
