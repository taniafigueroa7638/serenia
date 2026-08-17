const { Pool } = require('pg');

// Configuración SSL para Aiven (certificados self-signed)
const sslConfig = process.env.NODE_ENV === 'production'
  ? { rejectUnauthorized: false }
  : false;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Error inesperado en pool de PostgreSQL:', err);
});

const query = (text, params) => pool.query(text, params);

module.exports = { pool, query };
