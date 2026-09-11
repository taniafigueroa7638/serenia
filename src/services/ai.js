const DEFAULT_GROQ_BASE_URL = 'https://api.groq.com/openai/v1';
const DEFAULT_MODEL = 'openai/gpt-oss-120b';

function asPositiveInt(value, fallback) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}

async function callGroq({ systemPrompt, messages }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    const error = new Error('Falta GROQ_API_KEY en las variables de entorno');
    error.code = 'AI_NOT_CONFIGURED';
    throw error;
  }

  const baseUrl = (process.env.AI_BASE_URL || DEFAULT_GROQ_BASE_URL).replace(/\/$/, '');
  const model = process.env.AI_MODEL || DEFAULT_MODEL;
  const maxCompletionTokens = asPositiveInt(process.env.AI_MAX_COMPLETION_TOKENS, 700);
  const timeoutMs = asPositiveInt(process.env.AI_TIMEOUT_MS, 30000);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        temperature: 0.45,
        max_completion_tokens: maxCompletionTokens,
        citation_options: 'disabled',
      }),
      signal: controller.signal,
    });

    let data = null;
    try {
      data = await response.json();
    } catch (_) {
      data = null;
    }

    if (!response.ok) {
      const error = new Error(data?.error?.message || `Groq respondió HTTP ${response.status}`);
      error.status = response.status;
      error.code = response.status === 429 ? 'AI_RATE_LIMIT' : 'AI_PROVIDER_ERROR';
      throw error;
    }

    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) {
      const error = new Error('La IA devolvió una respuesta vacía');
      error.code = 'AI_EMPTY_RESPONSE';
      throw error;
    }

    return {
      text,
      provider: 'groq',
      model: data.model || model,
      usage: {
        prompt_tokens: Number(data?.usage?.prompt_tokens || 0),
        completion_tokens: Number(data?.usage?.completion_tokens || 0),
      },
    };
  } catch (err) {
    if (err.name === 'AbortError') {
      const timeoutError = new Error('La IA tardó demasiado en responder');
      timeoutError.code = 'AI_TIMEOUT';
      throw timeoutError;
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

async function callMock({ messages }) {
  const last = [...messages].reverse().find((item) => item.role === 'user');
  return {
    text: `Modo de prueba activo. Recibí tu mensaje: “${String(last?.content || '').slice(0, 180)}”. Cuando configures GROQ_API_KEY y AI_PROVIDER=groq, aquí responderá Serenia IA.`,
    provider: 'mock',
    model: 'serenia-mock',
    usage: { prompt_tokens: 0, completion_tokens: 0 },
  };
}

async function generateChatResponse(payload) {
  const provider = (process.env.AI_PROVIDER || 'mock').toLowerCase();

  if (provider === 'mock') return callMock(payload);
  if (provider === 'groq') return callGroq(payload);

  const error = new Error(`Proveedor de IA no soportado: ${provider}`);
  error.code = 'AI_PROVIDER_UNSUPPORTED';
  throw error;
}

module.exports = { generateChatResponse };
