const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const routeSource = fs.readFileSync(
  path.join(__dirname, '../src/routes/diary.js'),
  'utf8'
);
const migrationSource = fs.readFileSync(
  path.join(__dirname, '../migrations/20260822_diario.sql'),
  'utf8'
);

test('listar, editar y eliminar entradas siempre exige el usuario propietario', () => {
  assert.match(routeSource, /WHERE user_id = \$1/);
  assert.match(routeSource, /WHERE id = \$6 AND user_id = \$7/);
  assert.match(routeSource, /WHERE id = \$1 AND user_id = \$2/);
});

test('el acceso del chatbot queda desactivado por defecto', () => {
  assert.match(migrationSource, /permitir_chatbot BOOLEAN NOT NULL DEFAULT FALSE/);
});
