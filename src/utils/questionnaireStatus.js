const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const QUESTIONNAIRE_TYPES = [
  { tipo: 'serenia', nombre: 'Cuestionario Serenia' },
  { tipo: 'instrumentos', nombre: 'PSS-10 + GAD-7' },
];

const buildQuestionnaireStatus = (rows, now = new Date()) => {
  const latestByType = new Map(rows.map((row) => [row.tipo, row.last_completed_at]));
  const nowMs = now.getTime();
  const questionnaires = {};

  QUESTIONNAIRE_TYPES.forEach(({ tipo, nombre }) => {
    const rawLast = latestByType.get(tipo);
    const lastDate = rawLast ? new Date(rawLast) : null;
    const lastMs = lastDate && Number.isFinite(lastDate.getTime()) ? lastDate.getTime() : null;
    const due = lastMs === null || (nowMs - lastMs) >= WEEK_MS;
    const nextDueAt = lastMs === null ? null : new Date(lastMs + WEEK_MS).toISOString();

    questionnaires[tipo] = {
      tipo,
      nombre,
      due,
      lastCompletedAt: lastMs === null ? null : lastDate.toISOString(),
      nextDueAt,
    };
  });

  const pendingTypes = QUESTIONNAIRE_TYPES
    .map(({ tipo }) => tipo)
    .filter((tipo) => questionnaires[tipo].due);

  return {
    intervalDays: 7,
    required: pendingTypes.length > 0,
    pendingTypes,
    questionnaires,
  };
};

module.exports = { WEEK_MS, QUESTIONNAIRE_TYPES, buildQuestionnaireStatus };
