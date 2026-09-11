BEGIN;

-- País del usuario para adaptar recursos locales sin asumir una ubicación.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS pais VARCHAR(80);

-- Permiso separado: la IA solo recibe edad, sexo y país cuando el usuario lo activa.
ALTER TABLE chat_preferences
  ADD COLUMN IF NOT EXISTS usar_perfil BOOLEAN NOT NULL DEFAULT FALSE;

COMMIT;
