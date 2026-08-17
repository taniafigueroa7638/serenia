const { Pool } = require('pg');

// Parsear DATABASE_URL para quitar sslmode del query string
// y controlar SSL manualmente (necesario para Aiven)
let connectionConfig;

if (process.env.DATABASE_URL) {
  const dbUrl = new URL(process.env.DATABASE_URL);
  // Eliminar sslmode del query string para que pg no lo sobreescriba
  dbUrl.searchParams.delete('sslmode');

  connectionConfig = {
    connectionString: dbUrl.toString(),
    ssl: process.env.NODE_ENV === 'production' 
      ? { rejectUnauthorized: false } 
      : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };
} else {
  // Fallback para desarrollo local
  connectionConfig = {
    host: process.env.PG_HOST || 'localhost',
    port: process.env.PG_PORT || 5432,
    database: process.env.PG_DATABASE || 'serenia',
    user: process.env.PG_USER || 'postgres',
    password: process.env.PG_PASSWORD || '',
    ssl: false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  };
}

const pool = new Pool(connectionConfig);

pool.on('error', (err) => {
  console.error('Error inesperado en pool de PostgreSQL:', err);
});

const query = (text, params) => pool.query(text, params);

module.exports = { pool, query };
