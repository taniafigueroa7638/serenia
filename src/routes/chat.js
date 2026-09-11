const express = require('express');
const router = express.Router();
const { query, pool } = require('../models');
const { authenticate } = require('../middleware/auth');
const { chatLimiter } = require('../middleware/chatRateLimiter');
const {
  encryptChatMessage,
  decryptChatMessageRow,
} = require('../utils/chatData');
const {
  getOrCreatePreferences,
  buildAuthorizedContext,
  contextToSystemText,
} = require('../services/chatContext');
const {
  detectImmediateRisk,
  buildImmediateSupportResponse,
  buildSystemPrompt,
} = require('../utils/chatSafety');
const { generateChatResponse } = require('../services/ai');

const MAX_MESSAGE_CHARS = 2000;
const MAX_HISTORY_MESSAGES = 12;
const DEFAULT_DAILY_LIMIT = 40;

function getDailyLimit() {
  const value = Number(process.env.AI_DAILY_USER_LIMIT || DEFAULT_DAILY_LIMIT);
  return Number.isInteger(value) && value > 0 ? value : DEFAULT_DAILY_LIMIT;
}

function publicPreferences(row) {
  return {
    usarDiario: row.usar_diario,
    usarEvaluaciones: row.usar_evaluaciones,
    usarPerfil: row.usar_perfil,
    guardarHistorial: row.guardar_historial,
    avisoAceptado: Boolean(row.aviso_aceptado_at),
    avisoAceptadoAt: row.aviso_aceptado_at,
  };
}

function parseBoolean(value, fallback) {
  return typeof value === 'boolean' ? value : fallback;
}

function validateClientHistory(history) {
  if (history == null) return [];
  if (!Array.isArray(history)) throw new Error('El historial temporal es inválido');
  if (history.length > MAX_HISTORY_MESSAGES) throw new Error('El historial temporal es demasiado largo');

  return history.map((item) => {
    const role = item?.role;
    const content = typeof item?.content === 'string' ? item.content.trim() : '';
    if (!['user', 'assistant'].includes(role) || !content || content.length > MAX_MESSAGE_CHARS) {
      throw new Error('El historial temporal contiene mensajes inválidos');
    }
    return { role, content };
  });
}

async function loadConversationHistory(userId, conversationId) {
  const ownership = await query(`
    SELECT id
    FROM chat_conversations
    WHERE id = $1 AND user_id = $2
  `, [conversationId, userId]);

  if (!ownership.rows[0]) {
    const error = new Error('Conversación no encontrada');
    error.status = 404;
    throw error;
  }

  const result = await query(`
    SELECT m.id, m.conversation_id, m.role, m.created_at, m.encrypted_data
    FROM chat_messages m
    WHERE m.conversation_id = $1
      AND m.exclude_from_ai_context = FALSE
    ORDER BY m.created_at DESC, m.id DESC
    LIMIT $2
  `, [conversationId, MAX_HISTORY_MESSAGES]);

  return result.rows
    .reverse()
    .map((row) => decryptChatMessageRow(row, userId))
    .map(({ role, content }) => ({ role, content }));
}

async function reserveDailyRequest(userId) {
  const limit = getDailyLimit();
  const result = await query(`
    INSERT INTO chat_usage_daily (user_id, usage_date, request_count)
    VALUES ($1, CURRENT_DATE, 1)
    ON CONFLICT (user_id, usage_date)
    DO UPDATE SET
      request_count = chat_usage_daily.request_count + 1,
      updated_at = CURRENT_TIMESTAMP
    WHERE chat_usage_daily.request_count < $2
    RETURNING request_count
  `, [userId, limit]);

  return { allowed: Boolean(result.rows[0]), limit };
}

async function releaseDailyRequest(userId) {
  await query(`
    UPDATE chat_usage_daily
    SET request_count = GREATEST(request_count - 1, 0),
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = $1 AND usage_date = CURRENT_DATE
  `, [userId]);
}

async function recordTokenUsage(userId, usage) {
  await query(`
    UPDATE chat_usage_daily
    SET prompt_tokens = prompt_tokens + $2,
        completion_tokens = completion_tokens + $3,
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = $1 AND usage_date = CURRENT_DATE
  `, [
    userId,
    Number(usage?.prompt_tokens || 0),
    Number(usage?.completion_tokens || 0),
  ]);
}

async function persistExchange(userId, conversationId, userMessage, assistantMessage, excludeFromAiContext = false) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let id = conversationId;

    if (!id) {
      const created = await client.query(`
        INSERT INTO chat_conversations (user_id)
        VALUES ($1)
        RETURNING id
      `, [userId]);
      id = created.rows[0].id;
    } else {
      const ownership = await client.query(`
        SELECT id FROM chat_conversations
        WHERE id = $1 AND user_id = $2
        FOR UPDATE
      `, [id, userId]);
      if (!ownership.rows[0]) {
        const error = new Error('Conversación no encontrada');
        error.status = 404;
        throw error;
      }
    }

    await client.query(`
      INSERT INTO chat_messages (conversation_id, role, encrypted_data, exclude_from_ai_context)
      VALUES ($1, 'user', $2, $4), ($1, 'assistant', $3, $4)
    `, [
      id,
      encryptChatMessage(userMessage, id, userId),
      encryptChatMessage(assistantMessage, id, userId),
      excludeFromAiContext,
    ]);

    await client.query(`
      UPDATE chat_conversations
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `, [id]);

    await client.query('COMMIT');
    return id;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

router.get('/preferences', authenticate, async (req, res) => {
  try {
    const preferences = await getOrCreatePreferences(req.user.id);
    res.json({ preferences: publicPreferences(preferences) });
  } catch (err) {
    console.error('Chat preferences error:', err);
    res.status(500).json({ error: 'No se pudieron cargar las preferencias del chat' });
  }
});

router.put('/preferences', authenticate, async (req, res) => {
  try {
    const current = await getOrCreatePreferences(req.user.id);
    const usarDiario = parseBoolean(req.body.usarDiario, current.usar_diario);
    const usarEvaluaciones = parseBoolean(req.body.usarEvaluaciones, current.usar_evaluaciones);
    const usarPerfil = parseBoolean(req.body.usarPerfil, current.usar_perfil);
    const guardarHistorial = parseBoolean(req.body.guardarHistorial, current.guardar_historial);
    const acceptNotice = req.body.acceptNotice === true;

    const result = await query(`
      UPDATE chat_preferences
      SET usar_diario = $2,
          usar_evaluaciones = $3,
          usar_perfil = $4,
          guardar_historial = $5,
          aviso_aceptado_at = CASE
            WHEN $6 THEN COALESCE(aviso_aceptado_at, CURRENT_TIMESTAMP)
            ELSE aviso_aceptado_at
          END,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
      RETURNING user_id, usar_diario, usar_evaluaciones, usar_perfil, guardar_historial,
                aviso_aceptado_at, created_at, updated_at
    `, [req.user.id, usarDiario, usarEvaluaciones, usarPerfil, guardarHistorial, acceptNotice]);

    res.json({ preferences: publicPreferences(result.rows[0]) });
  } catch (err) {
    console.error('Chat preferences update error:', err);
    res.status(500).json({ error: 'No se pudieron guardar las preferencias del chat' });
  }
});

router.get('/conversations', authenticate, async (req, res) => {
  try {
    const result = await query(`
      SELECT c.id, c.created_at, c.updated_at, COUNT(m.id)::INTEGER AS message_count
      FROM chat_conversations c
      LEFT JOIN chat_messages m ON m.conversation_id = c.id
      WHERE c.user_id = $1
      GROUP BY c.id
      ORDER BY c.updated_at DESC
      LIMIT 50
    `, [req.user.id]);

    res.json({ conversations: result.rows });
  } catch (err) {
    console.error('Chat conversations error:', err);
    res.status(500).json({ error: 'No se pudieron cargar las conversaciones' });
  }
});

router.get('/conversations/:id/messages', authenticate, async (req, res) => {
  try {
    const conversationId = Number(req.params.id);
    if (!Number.isInteger(conversationId) || conversationId <= 0) {
      return res.status(400).json({ error: 'Conversación inválida' });
    }

    const ownership = await query(`
      SELECT id FROM chat_conversations
      WHERE id = $1 AND user_id = $2
    `, [conversationId, req.user.id]);
    if (!ownership.rows[0]) return res.status(404).json({ error: 'Conversación no encontrada' });

    const result = await query(`
      SELECT recent.id, recent.conversation_id, recent.role, recent.created_at, recent.encrypted_data
      FROM (
        SELECT m.id, m.conversation_id, m.role, m.created_at, m.encrypted_data
        FROM chat_messages m
        WHERE m.conversation_id = $1
        ORDER BY m.created_at DESC, m.id DESC
        LIMIT 200
      ) recent
      ORDER BY recent.created_at ASC, recent.id ASC
    `, [conversationId]);

    res.json({
      conversationId,
      messages: result.rows.map((row) => decryptChatMessageRow(row, req.user.id)),
    });
  } catch (err) {
    console.error('Chat messages error:', err);
    res.status(500).json({ error: 'No se pudieron cargar los mensajes' });
  }
});

router.delete('/conversations/:id', authenticate, async (req, res) => {
  try {
    const conversationId = Number(req.params.id);
    if (!Number.isInteger(conversationId) || conversationId <= 0) {
      return res.status(400).json({ error: 'Conversación inválida' });
    }

    const result = await query(`
      DELETE FROM chat_conversations
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `, [conversationId, req.user.id]);

    if (!result.rows[0]) return res.status(404).json({ error: 'Conversación no encontrada' });
    res.json({ message: 'Conversación eliminada' });
  } catch (err) {
    console.error('Chat delete error:', err);
    res.status(500).json({ error: 'No se pudo eliminar la conversación' });
  }
});

router.get('/usage', authenticate, async (req, res) => {
  try {
    const result = await query(`
      SELECT request_count, prompt_tokens, completion_tokens
      FROM chat_usage_daily
      WHERE user_id = $1 AND usage_date = CURRENT_DATE
    `, [req.user.id]);
    const row = result.rows[0] || { request_count: 0, prompt_tokens: 0, completion_tokens: 0 };
    res.json({
      usage: {
        requests: row.request_count,
        limit: getDailyLimit(),
        promptTokens: row.prompt_tokens,
        completionTokens: row.completion_tokens,
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'No se pudo consultar el uso del chat' });
  }
});

router.post('/message', authenticate, chatLimiter, async (req, res) => {
  const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';
  if (!message || message.length > MAX_MESSAGE_CHARS) {
    return res.status(400).json({ error: `El mensaje debe contener entre 1 y ${MAX_MESSAGE_CHARS} caracteres` });
  }

  let preferences;
  try {
    preferences = await getOrCreatePreferences(req.user.id);
  } catch (err) {
    console.error('Chat preference load error:', err);
    return res.status(500).json({ error: 'No se pudieron consultar las preferencias del chat' });
  }

  if (!preferences.aviso_aceptado_at) {
    return res.status(403).json({
      error: 'Debes aceptar el aviso de Serenia IA antes de iniciar una conversación',
      code: 'CHAT_NOTICE_REQUIRED',
    });
  }

  let history = [];
  let conversationId = null;
  try {
    if (preferences.guardar_historial) {
      if (req.body.conversationId != null) {
        conversationId = Number(req.body.conversationId);
        if (!Number.isInteger(conversationId) || conversationId <= 0) {
          return res.status(400).json({ error: 'Conversación inválida' });
        }
        history = await loadConversationHistory(req.user.id, conversationId);
      }
    } else {
      history = validateClientHistory(req.body.history);
    }
  } catch (err) {
    return res.status(err.status || 400).json({ error: err.message });
  }

  if (detectImmediateRisk(message)) {
    let country = null;
    try {
      const countryResult = await query('SELECT pais FROM users WHERE id = $1', [req.user.id]);
      country = countryResult.rows[0]?.pais || null;
    } catch (countryErr) {
      console.error('Could not load country for local safety response:', countryErr);
    }
    const reply = buildImmediateSupportResponse(country);
    try {
      if (preferences.guardar_historial) {
        conversationId = await persistExchange(req.user.id, conversationId, message, reply, true);
      }
    } catch (err) {
      console.error('Could not persist local safety response:', err);
    }
    return res.json({
      reply,
      conversationId,
      source: 'local_safety',
      contextUsed: { profile: false, diary: false, evaluations: false },
    });
  }

  const providerName = (process.env.AI_PROVIDER || 'mock').toLowerCase();
  const shouldMeterUsage = providerName !== 'mock';
  let reserved = false;
  let providerCompleted = false;
  try {
    if (shouldMeterUsage) {
      const reservation = await reserveDailyRequest(req.user.id);
      if (!reservation.allowed) {
        return res.status(429).json({
          error: `Alcanzaste el límite diario de ${reservation.limit} respuestas de Serenia IA.`,
          code: 'CHAT_DAILY_LIMIT',
        });
      }
      reserved = true;
    }

    const authorizedContext = await buildAuthorizedContext(req.user.id, preferences);
    const systemPrompt = buildSystemPrompt(contextToSystemText(authorizedContext));
    const messages = [...history, { role: 'user', content: message }];

    const aiResponse = await generateChatResponse({
      systemPrompt,
      messages,
    });
    providerCompleted = true;

    let historySaved = !preferences.guardar_historial;
    if (preferences.guardar_historial) {
      try {
        conversationId = await persistExchange(
          req.user.id,
          conversationId,
          message,
          aiResponse.text
        );
        historySaved = true;
      } catch (persistErr) {
        console.error('Chat history persistence error:', persistErr);
      }
    }

    if (shouldMeterUsage) {
      try {
        await recordTokenUsage(req.user.id, aiResponse.usage);
      } catch (usageErr) {
        console.error('Chat usage accounting error:', usageErr);
      }
    }

    res.json({
      reply: aiResponse.text,
      conversationId,
      source: aiResponse.provider,
      model: aiResponse.model,
      contextUsed: {
        profile: Boolean(authorizedContext.profile),
        diary: authorizedContext.diary.length > 0,
        evaluations: authorizedContext.evaluations.length > 0,
      },
      historySaved,
    });
  } catch (err) {
    if (reserved && !providerCompleted) {
      try { await releaseDailyRequest(req.user.id); } catch (_) {}
    }
    console.error('Chat AI error:', err);

    if (err.code === 'AI_NOT_CONFIGURED') {
      return res.status(503).json({ error: 'Serenia IA todavía no está configurada en el servidor.' });
    }
    if (err.code === 'AI_RATE_LIMIT' || err.status === 429) {
      return res.status(503).json({ error: 'El servicio de IA alcanzó temporalmente su límite. Intenta nuevamente más tarde.' });
    }
    if (err.code === 'AI_TIMEOUT') {
      return res.status(504).json({ error: 'Serenia IA tardó demasiado en responder. Intenta nuevamente.' });
    }
    res.status(502).json({ error: 'No fue posible obtener una respuesta de Serenia IA.' });
  }
});

module.exports = router;
