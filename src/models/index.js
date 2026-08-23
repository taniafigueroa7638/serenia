const { pool, query } = require('../config/database');

const initDatabase = async () => {
  try {
    // Tabla de usuarios
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

    // Tabla de cuestionarios
    await query(`
      CREATE TABLE IF NOT EXISTS questionnaires (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        estres_score INTEGER NOT NULL,
        ansiedad_score INTEGER NOT NULL,
        estado_emocional VARCHAR(50) NOT NULL,
        emocion_principal VARCHAR(50) NOT NULL,
        resultado_general VARCHAR(100) NOT NULL,
        tipo VARCHAR(20) NOT NULL DEFAULT 'instrumentos',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Migración compatible con instalaciones existentes: los registros
    // anteriores corresponden al cuestionario PSS-10 + GAD-7.
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

    // Tabla de respuestas individuales
    await query(`
      CREATE TABLE IF NOT EXISTS answers (
        id SERIAL PRIMARY KEY,
        questionnaire_id INTEGER NOT NULL REFERENCES questionnaires(id) ON DELETE CASCADE,
        pregunta_numero INTEGER NOT NULL,
        pregunta_texto TEXT NOT NULL,
        respuesta VARCHAR(100) NOT NULL,
        valor_numerico INTEGER,
        categoria VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Diario personal. El permiso del chatbot es individual y está desactivado
    // por defecto para proteger la privacidad de cada entrada.
    await query(`
      CREATE TABLE IF NOT EXISTS diary_entries (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        titulo VARCHAR(100) NOT NULL,
        contenido TEXT NOT NULL,
        fecha DATE NOT NULL DEFAULT CURRENT_DATE,
        emocion VARCHAR(20),
        permitir_chatbot BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT diary_entries_emocion_check CHECK (
          emocion IS NULL OR emocion IN (
            'tranquilo', 'feliz', 'neutral', 'preocupado',
            'ansioso', 'molesto', 'triste', 'cansado'
          )
        ),
        CONSTRAINT diary_entries_contenido_length_check CHECK (
          char_length(contenido) BETWEEN 1 AND 8000
        )
      )
    `);

    // Índices para rendimiento
    await query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_users_reset ON users(reset_token)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_q_user ON questionnaires(user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_q_created ON questionnaires(created_at)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_q_user_tipo_created ON questionnaires(user_id, tipo, created_at DESC)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_a_questionnaire ON answers(questionnaire_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_diary_user_fecha ON diary_entries(user_id, fecha DESC, created_at DESC)`);

    console.log('✅ Tablas e índices de PostgreSQL creados/verificados');
  } catch (err) {
    console.error('❌ Error al inicializar base de datos:', err.message);
    throw err;
  }
};

module.exports = { pool, query, initDatabase };
