const test = require('node:test');
const assert = require('node:assert/strict');
const { buildQuestionnaireStatus, WEEK_MS } = require('../src/utils/questionnaireStatus');

const NOW = new Date('2026-08-22T12:00:00.000Z');

test('un usuario nuevo tiene pendientes las dos evaluaciones', () => {
  const status = buildQuestionnaireStatus([], NOW);
  assert.equal(status.required, true);
  assert.deepEqual(status.pendingTypes, ['serenia', 'instrumentos']);
});

test('cada evaluación conserva su propia fecha semanal', () => {
  const status = buildQuestionnaireStatus([
    { tipo: 'instrumentos', last_completed_at: new Date(NOW.getTime() - 24 * 60 * 60 * 1000) },
  ], NOW);
  assert.equal(status.questionnaires.serenia.due, true);
  assert.equal(status.questionnaires.instrumentos.due, false);
  assert.deepEqual(status.pendingTypes, ['serenia']);
});

test('una evaluación vuelve a quedar pendiente al cumplir siete días', () => {
  const rows = [
    { tipo: 'serenia', last_completed_at: new Date(NOW.getTime() - WEEK_MS) },
    { tipo: 'instrumentos', last_completed_at: new Date(NOW.getTime() - WEEK_MS + 1) },
  ];
  const status = buildQuestionnaireStatus(rows, NOW);
  assert.equal(status.questionnaires.serenia.due, true);
  assert.equal(status.questionnaires.instrumentos.due, false);
});
