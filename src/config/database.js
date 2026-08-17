const { Pool } = require('pg');

// Parse DATABASE_URL o usar variables separadas
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20, // máximo de conexiones en pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Manejo de errores del pool
pool.on('error', (err) => {
  console.error('Error inesperado en pool de PostgreSQL:', err);
});

// Helper para queries
const query = (text, params) => pool.query(text, params);

module.exports = { pool, query };
