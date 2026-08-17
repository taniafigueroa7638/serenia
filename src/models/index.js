const db = require('../config/database');

const initDatabase = () => {
  // Tabla de usuarios
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      apellido TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      fecha_nacimiento TEXT NOT NULL,
      edad INTEGER NOT NULL,
      telefono TEXT,
      sexo TEXT CHECK(sexo IN ('masculino', 'femenino', 'otro', 'prefiero_no_decir')),
      verification_code TEXT,
      is_verified INTEGER DEFAULT 0,
      reset_token TEXT,
      reset_token_expires INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabla de cuestionarios
  db.exec(`
    CREATE TABLE IF NOT EXISTS questionnaires (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      fecha TEXT NOT NULL,
      estres_score INTEGER NOT NULL,
      ansiedad_score INTEGER NOT NULL,
      estado_emocional TEXT NOT NULL,
      emocion_principal TEXT NOT NULL,
      resultado_general TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Tabla de respuestas individuales
  db.exec(`
    CREATE TABLE IF NOT EXISTS answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      questionnaire_id INTEGER NOT NULL,
      pregunta_numero INTEGER NOT NULL,
      pregunta_texto TEXT NOT NULL,
      respuesta TEXT NOT NULL,
      valor_numerico INTEGER,
      categoria TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (questionnaire_id) REFERENCES questionnaires(id) ON DELETE CASCADE
    )
  `);

  // Índices para rendimiento
  db.exec(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_users_reset ON users(reset_token)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_q_user ON questionnaires(user_id)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_a_questionnaire ON answers(questionnaire_id)`);

  console.log('✅ Base de datos inicializada');
};

module.exports = { db, initDatabase };