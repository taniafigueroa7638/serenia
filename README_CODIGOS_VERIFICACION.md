# Serenia — corrección V2 de códigos de verificación

## Causa principal encontrada

Durante el registro, `express-validator` aplica `normalizeEmail()` antes de guardar el usuario. El frontend, en cambio, conservaba en `pending_email` el texto original escrito por el usuario. Para ciertos correos (mayúsculas, puntos/subdirecciones en proveedores como Gmail, etc.) el valor almacenado en PostgreSQL podía ser distinto del valor usado después en `/verify-email` y `/resend-code`.

El código recibido era correcto, pero el backend podía no encontrar la misma fila de usuario y devolvía "Código inválido". Esto también explica casos donde el primer intento fallaba y reenviar no solucionaba nada.

## Qué cambia

- El frontend conserva el `userId` devuelto por `/register`.
- Verificar y reenviar usan ese `userId` como referencia principal, no el texto del correo.
- Si el usuario empezó el registro antes del hotfix, el servidor mantiene compatibilidad por correo y aplica la misma normalización de `express-validator`.
- El código actual expira realmente a los 30 minutos.
- Al reenviar, el código anterior sigue siendo válido durante hasta 10 minutos.
- Solo se permite solicitar otro código cada 60 segundos.
- Si Brevo falla al enviar un código nuevo, se revierte el cambio y el código anterior continúa vigente.
- Se puede pegar el código completo de 6 dígitos en la interfaz; también se filtran caracteres no numéricos.

## Instalación

Sube todos los archivos respetando exactamente sus carpetas. Render debe hacer un nuevo deploy.

No es necesario ejecutar el SQL manualmente: `initVerificationSchema()` aplica la migración al arrancar. El archivo SQL se conserva como documentación y respaldo.

Archivos:
- `server.js` — reemplazar
- `src/routes/verification.js` — nuevo/reemplazar
- `src/services/verificationSchema.js` — nuevo/reemplazar
- `public/index.html` — reemplazar
- `public/js/verification-fix.js` — nuevo
- `migrations/20261005_verification_code_reliability.sql` — nuevo
