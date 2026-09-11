require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./src/routes/auth');
const questionnaireRoutes = require('./src/routes/questionnaire');
const userRoutes = require('./src/routes/user');
const diaryRoutes = require('./src/routes/diary');
const chatRoutes = require('./src/routes/chat');
const { initDatabase } = require('./src/models');
const { initChatDatabase } = require('./src/services/chatSchema');
const {
  generalLimiter,
  loginLimiter,
  sensitiveAuthLimiter
} = require('./src/middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 10000;
// Render termina HTTPS en un proxy. Esto permite que Express y los limitadores
// identifiquen la IP real del cliente en lugar de tratar a todos como el proxy.
app.set('trust proxy', 1);

async function startServer() {
  try {
    await initDatabase();
    await initChatDatabase();
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
    origin: true,
    credentials: true
  }));

  app.use(generalLimiter);
  app.use(express.json({ limit: '50kb' }));
  app.use(express.urlencoded({ extended: true, limit: '50kb' }));
  // Rutas API
  app.use('/api/auth/login', loginLimiter);
  app.use([
    '/api/auth/register',
    '/api/auth/verify-email',
    '/api/auth/resend-code',
    '/api/auth/forgot-password',
    '/api/auth/reset-password'
  ], sensitiveAuthLimiter);
  app.use('/api/auth', authRoutes);
  app.use('/api/questionnaire', questionnaireRoutes);
  app.use('/api/user', userRoutes);
  app.use('/api/diary', diaryRoutes);
  app.use('/api/chat', chatRoutes);
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
