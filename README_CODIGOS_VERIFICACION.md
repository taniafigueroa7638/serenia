# Serenia — corrección de códigos de verificación

## Problema corregido

El flujo anterior reemplazaba el código almacenado cada vez que se pulsaba **Reenviar**. Si Brevo entregaba los mensajes fuera de orden, o el usuario pulsaba reenviar más de una vez, podía recibir por correo un código real que ya había sido sustituido en la base de datos. El sistema entonces respondía "Código inválido" aunque el usuario copiara exactamente el código recibido.

## Qué cambia

- El código actual expira realmente a los 30 minutos.
- Al reenviar, el código anterior sigue siendo válido durante hasta 10 minutos (sin superar su vencimiento original).
- Solo se permite solicitar un nuevo código cada 60 segundos.
- Los reenvíos se serializan con `FOR UPDATE` para evitar carreras por doble clic o peticiones simultáneas.
- Si Brevo rechaza el reenvío, la transacción se revierte y el código anterior continúa vigente.
- Se normaliza el correo (minúsculas/espacios) y se valida que el código tenga exactamente seis dígitos.
- Las rutas nuevas se montan antes del router de autenticación existente, por lo que no se toca el resto del login/registro/restablecimiento.

## Archivos

- `server.js` — reemplazar
- `src/routes/verification.js` — nuevo
- `src/services/verificationSchema.js` — nuevo
- `migrations/20261005_verification_code_reliability.sql` — nuevo/documentación de migración

`initVerificationSchema()` aplica automáticamente las columnas y el trigger al arrancar Render. El SQL se incluye para mantener la migración documentada; no es obligatorio ejecutarlo manualmente si el despliegue inicia correctamente.
