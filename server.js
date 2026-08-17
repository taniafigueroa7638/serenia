require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./src/routes/auth');
const questionnaireRoutes = require('./src/routes/questionnaire');
const userRoutes = require('./src/routes/user');
const { initDatabase } = require('./src/models');

const app = express();
const PORT = process.env.PORT || 10000;

async function startServer() {
  try {
    await initDatabase();
    console.log('✅ Base de datos lista');
  } catch (err) {
    console.error('❌ Error al conectar DB:', err.message);
    process.exit(1);
  }

  // Seguridad: Headers HTTP
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "blob:"],
        fontSrc: ["'self'"],
        connectSrc: ["'self'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }));

  // CORS PERMISIVO para producción (mismo dominio o cualquier origin en Render)
  app.use(cors({
    origin: true,  // ← Refleja el origin de la petición
    credentials: true
  }));

  // Rate limiting
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Demasiadas solicitudes. Intente más tarde.' },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Demasiados intentos de autenticación. Intente en 15 minutos.' },
  });

  app.use(generalLimiter);
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // Rutas API
  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/questionnaire', questionnaireRoutes);
  app.use('/api/user', userRoutes);

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Servir frontend estático
  app.use(express.static(path.join(__dirname, 'public')));

  // SPA fallback
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  // Error handler
  app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
      error: process.env.NODE_ENV === 'production'
        ? 'Error interno del servidor'
        : err.message
    });
  });

  app.listen(PORT, () => {
    console.log(`🧘 Serenia API corriendo en puerto ${PORT}`);
    console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer();
