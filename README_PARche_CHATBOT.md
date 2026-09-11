# Parche Serenia IA — Groq / GPT-OSS 120B

## Qué incorpora

- Nueva sección **Serenia IA** en la navegación.
- Chat autenticado y aislado por usuario.
- Historial de mensajes cifrado con el mismo `DATA_ENCRYPTION_KEY` de Serenia.
- Preferencias independientes para:
  - usar evaluaciones como contexto;
  - usar entradas del diario autorizadas para chatbot;
  - guardar o no guardar historial.
- Si se activa el diario, el backend solo recupera entradas con `permitir_chatbot = TRUE`.
- El chatbot no envía nombre, correo ni perfil del usuario al proveedor de IA.
- Las evaluaciones se resumen por resultados recientes; no se envían todas las respuestas individuales.
- Aviso obligatorio antes del primer uso.
- Respuesta local para frases claras de riesgo inmediato. Ese intercambio se marca para no enviarse a Groq en turnos posteriores.
- Límite por minuto y límite diario por usuario.
- Registro diario de cantidad de solicitudes y tokens.
- Modo `mock` para probar toda la interfaz sin consumir IA ni descontar el límite diario del chatbot.
- Proveedor desacoplado en `src/services/ai.js` para poder cambiar Groq por otro proveedor después.

## Archivos nuevos

- `src/routes/chat.js`
- `src/services/ai.js`
- `src/services/chatContext.js`
- `src/services/chatSchema.js`
- `src/utils/chatData.js`
- `src/utils/chatSafety.js`
- `src/middleware/chatRateLimiter.js`
- `public/js/chat.js`
- `public/css/chat.css`
- `migrations/20260910_chatbot_groq.sql`
- `.env.chatbot.example`

## Archivos reemplazados

- `server.js`
- `public/index.html`
- `public/js/app.js`

## Aplicación

1. Copia los archivos del parche sobre el proyecto respetando las carpetas.
2. Ejecuta `migrations/20260910_chatbot_groq.sql` en PostgreSQL. El servidor también verifica/crea estas tablas al arrancar mediante `initChatDatabase()`, por lo que la migración se incluye principalmente para despliegues controlados y trazabilidad.
3. Agrega las variables de `.env.chatbot.example` a Render.
4. Para la primera prueba deja `AI_PROVIDER=mock`.
5. Despliega y comprueba que aparezca **Serenia IA**, que permita aceptar el aviso, cambiar preferencias, escribir mensajes y guardar/eliminar conversaciones.
6. Crea una API key en Groq y configura `GROQ_API_KEY`.
7. Cambia `AI_PROVIDER=groq` y vuelve a desplegar.
8. En Groq Cloud, activa **Zero Data Retention (ZDR)** desde Data Controls antes de usar datos reales de usuarios.

## Variables mínimas para producción

```env
AI_PROVIDER=groq
GROQ_API_KEY=TU_CLAVE
AI_MODEL=openai/gpt-oss-120b
AI_BASE_URL=https://api.groq.com/openai/v1
AI_MAX_COMPLETION_TOKENS=700
AI_TIMEOUT_MS=30000
CHAT_REQUESTS_PER_MINUTE=12
AI_DAILY_USER_LIMIT=40
EMERGENCY_RESOURCE_TEXT=Si estás en Ecuador y hay una emergencia inmediata, comunícate con el ECU 9-1-1.
```

No cambies ni elimines la variable `DATA_ENCRYPTION_KEY` ya usada por Serenia: los mensajes del chat utilizan esa misma infraestructura de cifrado.

## Privacidad

`usar_diario` y `usar_evaluaciones` están desactivados inicialmente. Aunque el usuario active `usar_diario`, únicamente se recuperan entradas que tengan `permitir_chatbot = TRUE`.

Si `guardar_historial` está desactivado, los nuevos mensajes no se insertan en PostgreSQL. El navegador conserva únicamente hasta los 12 mensajes más recientes en memoria para mantener el contexto de la conversación actual; al recargar la página se pierden.

Las conversaciones guardadas anteriormente no se eliminan automáticamente al desactivar `guardar_historial`; el usuario puede borrarlas desde la lista de conversaciones.

## Seguridad del chatbot

Los intercambios que activan la respuesta local de seguridad siguen visibles si el usuario guarda historial, pero llevan `exclude_from_ai_context = TRUE`, por lo que no forman parte del historial que se envía a Groq en respuestas posteriores.

La detección local de riesgo es deliberadamente conservadora y solo cubre frases claras. No debe considerarse un detector clínico completo. El prompt del modelo también incluye reglas para escalar situaciones de riesgo y evitar diagnósticos o indicaciones farmacológicas.

Antes de producción real conviene realizar pruebas específicas de seguridad, privacidad, falsas alarmas y mensajes de crisis.
