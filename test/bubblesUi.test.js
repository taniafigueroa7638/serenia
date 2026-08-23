const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('el minijuego de burbujas está integrado en la SPA', () => {
  const app = read('public/js/app.js');
  const dashboard = read('public/js/dashboard.js');
  const index = read('public/index.html');

  assert.match(app, /'\/games\/bubbles': \(\) => requireAuth\(renderBubbleGame\)/);
  assert.match(app, /stopBubbleGame\(\)/);
  assert.match(dashboard, /data-navigate="\/games\/bubbles"/);
  assert.match(dashboard, /Burbujas de calma/);
  assert.match(index, /<script src="\/js\/bubbles\.js"><\/script>/);
});

test('el juego funciona localmente y contempla táctil, teclado y limpieza', () => {
  const bubbles = read('public/js/bubbles.js');

  assert.match(bubbles, /addEventListener\('pointerdown'/);
  assert.match(bubbles, /event\.code === 'Space'/);
  assert.match(bubbles, /prefers-reduced-motion: reduce/);
  assert.match(bubbles, /ResizeObserver/);
  assert.match(bubbles, /destroy\(\)/);
  assert.doesNotMatch(bubbles, /<iframe|https?:\/\//i);
});

test('la actividad evita vidas y puntuaciones negativas', () => {
  const bubbles = read('public/js/bubbles.js');

  assert.match(bubbles, /No hay vidas, errores ni puntuaciones negativas/);
  assert.match(bubbles, /Explotadas/);
  assert.doesNotMatch(bubbles, /lives\s*[=:]/i);
});

