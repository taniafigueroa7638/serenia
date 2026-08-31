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
const encryptionMigrationSource = fs.readFileSync(
  path.join(__dirname, '../migrations/20260831_cifrado_datos_sensibles.sql'),
  'utf8'
);

test('listar, editar y eliminar entradas siempre exige el usuario propietario', () => {
  assert.match(routeSource, /WHERE user_id = \$1/);
  assert.match(routeSource, /WHERE id = \$4 AND user_id = \$5/);
  assert.match(routeSource, /WHERE id = \$1 AND user_id = \$2/);
});

test('el acceso del chatbot queda desactivado por defecto', () => {
  assert.match(migrationSource, /permitir_chatbot BOOLEAN NOT NULL DEFAULT FALSE/);
});

test('el contenido del diario se guarda cifrado y no en las columnas legibles', () => {
  assert.match(routeSource, /INSERT INTO diary_entries[\s\S]*encrypted_data/);
  assert.doesNotMatch(routeSource, /INSERT INTO diary_entries \([^)]*titulo[^)]*contenido/);
  assert.match(encryptionMigrationSource, /ADD COLUMN IF NOT EXISTS encrypted_data TEXT/);
});
