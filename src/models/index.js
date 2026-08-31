const { pool, query } = require('../config/database');
const { assertEncryptionConfigured } = require('../utils/encryption');
const {
  encryptQuestionnaireData,
  decryptQuestionnaireRow,
  encryptAnswerData,
  decryptAnswerRow,
  encryptDiaryData,
  decryptDiaryRow,
} = require('../utils/sensitiveData');

const verifyEncryptedData = (readPayload) => {
  try {
    readPayload();
  } catch (err) {
    throw new Error(
      'DATA_ENCRYPTION_KEY no corresponde a los datos cifrados existentes o estos fueron alterados.'
    );
  }
};

const prepareSensitiveColumns = async () => {
  await query(`ALTER TABLE questionnaires ADD COLUMN IF NOT EXISTS encrypted_data TEXT`);
  await query(`
    ALTER TABLE questionnaires
      ALTER COLUMN estres_score DROP NOT NULL,
      ALTER COLUMN ansiedad_score DROP NOT NULL,
      ALTER COLUMN estado_emocional DROP NOT NULL,
      ALTER COLUMN emocion_principal DROP NOT NULL,
      ALTER COLUMN resultado_general DROP NOT NULL
  `);

  await query(`ALTER TABLE answers ADD COLUMN IF NOT EXISTS encrypted_data TEXT`);
  await query(`
    ALTER TABLE answers
      ALTER COLUMN pregunta_texto DROP NOT NULL,
      ALTER COLUMN respuesta DROP NOT NULL,
      ALTER COLUMN categoria DROP NOT NULL
  `);

  await query(`ALTER TABLE diary_entries ADD COLUMN IF NOT EXISTS encrypted_data TEXT`);
  await query(`
    ALTER TABLE diary_entries
      ALTER COLUMN titulo DROP NOT NULL,
      ALTER COLUMN contenido DROP NOT NULL
  `);
};

const migrateSensitiveData = async () => {
  assertEncryptionConfigured();
  const client = await pool.connect();
  let migratedQuestionnaires = 0;
  let migratedAnswers = 0;
  let migratedDiaryEntries = 0;

  try {
    await client.query('BEGIN');

    const questionnaires = await client.query(`
      SELECT id, user_id, estres_score, ansiedad_score, estado_emocional,
             emocion_principal, resultado_general, encrypted_data
      FROM questionnaires
      WHERE encrypted_data IS NULL
         OR estres_score IS NOT NULL
         OR ansiedad_score IS NOT NULL
         OR estado_emocional IS NOT NULL
         OR emocion_principal IS NOT NULL
         OR resultado_general IS NOT NULL
      FOR UPDATE
    `);

    for (const row of questionnaires.rows) {
      const encryptedData = row.encrypted_data || encryptQuestionnaireData(row, row.user_id);
      if (row.encrypted_data) {
        verifyEncryptedData(() => decryptQuestionnaireRow(row));
      }
      await client.query(`
        UPDATE questionnaires
        SET encrypted_data = $1,
            estres_score = NULL,
            ansiedad_score = NULL,
            estado_emocional = NULL,
            emocion_principal = NULL,
            resultado_general = NULL
        WHERE id = $2
      `, [encryptedData, row.id]);
      migratedQuestionnaires += 1;
    }

    const answers = await client.query(`
      SELECT id, questionnaire_id, pregunta_numero, pregunta_texto,
             respuesta, valor_numerico, categoria, encrypted_data
      FROM answers
      WHERE encrypted_data IS NULL
         OR pregunta_texto IS NOT NULL
         OR respuesta IS NOT NULL
         OR valor_numerico IS NOT NULL
         OR categoria IS NOT NULL
      FOR UPDATE
    `);

    for (const row of answers.rows) {
      const encryptedData = row.encrypted_data || encryptAnswerData(
        row,
        row.questionnaire_id,
        row.pregunta_numero
      );
      if (row.encrypted_data) {
        verifyEncryptedData(() => decryptAnswerRow(row));
      }
      await client.query(`
        UPDATE answers
        SET encrypted_data = $1,
            pregunta_texto = NULL,
            respuesta = NULL,
            valor_numerico = NULL,
            categoria = NULL
        WHERE id = $2
      `, [encryptedData, row.id]);
      migratedAnswers += 1;
    }

    const diaryEntries = await client.query(`
      SELECT id, user_id, titulo, contenido, emocion, encrypted_data
      FROM diary_entries
      WHERE encrypted_data IS NULL
         OR titulo IS NOT NULL
         OR contenido IS NOT NULL
         OR emocion IS NOT NULL
      FOR UPDATE
    `);

    for (const row of diaryEntries.rows) {
      const encryptedData = row.encrypted_data || encryptDiaryData(row, row.user_id);
      if (row.encrypted_data) {
        verifyEncryptedData(() => decryptDiaryRow(row));
      }
      await client.query(`
        UPDATE diary_entries
        SET encrypted_data = $1,
            titulo = NULL,
            contenido = NULL,
            emocion = NULL
        WHERE id = $2
      `, [encryptedData, row.id]);
      migratedDiaryEntries += 1;
    }

    // Si la clave configurada no corresponde a los datos existentes, el
    // servidor no debe iniciar aparentando que puede recuperarlos.
    const questionnaireSample = await client.query(`
      SELECT id, user_id, encrypted_data
      FROM questionnaires
      WHERE encrypted_data IS NOT NULL
      LIMIT 1
    `);
    if (questionnaireSample.rows[0]) {
      verifyEncryptedData(() => decryptQuestionnaireRow(questionnaireSample.rows[0]));
    }

    const answerSample = await client.query(`
      SELECT id, questionnaire_id, pregunta_numero, encrypted_data
      FROM answers
      WHERE encrypted_data IS NOT NULL
      LIMIT 1
    `);
    if (answerSample.rows[0]) {
      verifyEncryptedData(() => decryptAnswerRow(answerSample.rows[0]));
    }

    const diarySample = await client.query(`
      SELECT id, user_id, encrypted_data
      FROM diary_entries
      WHERE encrypted_data IS NOT NULL
      LIMIT 1
    `);
    if (diarySample.rows[0]) {
      verifyEncryptedData(() => decryptDiaryRow(diarySample.rows[0]));
    }

    await client.query(`ALTER TABLE questionnaires ALTER COLUMN encrypted_data SET NOT NULL`);
    await client.query(`ALTER TABLE answers ALTER COLUMN encrypted_data SET NOT NULL`);
    await client.query(`ALTER TABLE diary_entries ALTER COLUMN encrypted_data SET NOT NULL`);
    await client.query('COMMIT');

    if (migratedQuestionnaires || migratedAnswers || migratedDiaryEntries) {
      console.log(
        `🔐 Datos protegidos: ${migratedQuestionnaires} cuestionarios, ` +
        `${migratedAnswers} respuestas y ${migratedDiaryEntries} entradas del diario`
      );
    }
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const initDatabase = async () => {
  try {
    // La aplicación no modifica el esquema ni inicia si falta la clave.
    assertEncryptionConfigured();

    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(50) NOT NULL,
        apellido VARCHAR(50) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        fecha_nacimiento DATE NOT NULL,
        edad INTEGER NOT NULL,
        telefono VARCHAR(20),
        sexo VARCHAR(20) CHECK (sexo IN ('masculino', 'femenino', 'otro', 'prefiero_no_decir')),
        verification_code VARCHAR(10),
        is_verified BOOLEAN DEFAULT FALSE,
        reset_token VARCHAR(255),
        reset_token_expires TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS questionnaires (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        estres_score INTEGER,
        ansiedad_score INTEGER,
        estado_emocional VARCHAR(50),
        emocion_principal VARCHAR(50),
        resultado_general VARCHAR(100),
        tipo VARCHAR(20) NOT NULL DEFAULT 'instrumentos',
        encrypted_data TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      ALTER TABLE questionnaires
      ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) NOT NULL DEFAULT 'instrumentos'
    `);
    await query(`UPDATE questionnaires SET tipo = 'instrumentos' WHERE tipo IS NULL`);
    await query(`
      ALTER TABLE questionnaires
      ALTER COLUMN tipo SET DEFAULT 'instrumentos',
      ALTER COLUMN tipo SET NOT NULL
    `);

    await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'questionnaires_tipo_check'
            AND conrelid = 'questionnaires'::regclass
        ) THEN
          ALTER TABLE questionnaires
          ADD CONSTRAINT questionnaires_tipo_check
          CHECK (tipo IN ('serenia', 'instrumentos'));
        END IF;
      END $$
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS answers (
        id SERIAL PRIMARY KEY,
        questionnaire_id INTEGER NOT NULL REFERENCES questionnaires(id) ON DELETE CASCADE,
        pregunta_numero INTEGER NOT NULL,
        pregunta_texto TEXT,
        respuesta VARCHAR(100),
        valor_numerico INTEGER,
        categoria VARCHAR(20),
        encrypted_data TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS diary_entries (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        titulo VARCHAR(100),
        contenido TEXT,
        fecha DATE NOT NULL DEFAULT CURRENT_DATE,
        emocion VARCHAR(20),
        permitir_chatbot BOOLEAN NOT NULL DEFAULT FALSE,
        encrypted_data TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT diary_entries_emocion_check CHECK (
          emocion IS NULL OR emocion IN (
            'tranquilo', 'feliz', 'neutral', 'preocupado',
            'ansioso', 'molesto', 'triste', 'cansado'
          )
        ),
        CONSTRAINT diary_entries_contenido_length_check CHECK (
          contenido IS NULL OR char_length(contenido) BETWEEN 1 AND 8000
        )
      )
    `);

    await prepareSensitiveColumns();

    await query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_users_reset ON users(reset_token)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_q_user ON questionnaires(user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_q_created ON questionnaires(created_at)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_q_user_tipo_created ON questionnaires(user_id, tipo, created_at DESC)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_a_questionnaire ON answers(questionnaire_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_diary_user_fecha ON diary_entries(user_id, fecha DESC, created_at DESC)`);

    await migrateSensitiveData();
    console.log('✅ Tablas e índices de PostgreSQL creados/verificados');
  } catch (err) {
    console.error('❌ Error al inicializar base de datos:', err.message);
    throw err;
  }
};

module.exports = { pool, query, initDatabase };
