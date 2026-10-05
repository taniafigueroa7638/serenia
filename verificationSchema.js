const { query } = require('../models');

async function initVerificationSchema() {
  await query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS verification_code_expires_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS previous_verification_code VARCHAR(10),
      ADD COLUMN IF NOT EXISTS previous_verification_code_expires_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS verification_code_sent_at TIMESTAMP
  `);

  // Los códigos creados por versiones anteriores no tenían expiración persistida.
  // Les damos una ventana válida al desplegar esta corrección para no bloquear
  // a usuarios que estén justo en medio del registro.
  await query(`
    UPDATE users
    SET verification_code_expires_at = COALESCE(verification_code_expires_at, NOW() + INTERVAL '30 minutes'),
        verification_code_sent_at = COALESCE(verification_code_sent_at, NOW())
    WHERE is_verified = FALSE
      AND verification_code IS NOT NULL
  `);

  // El registro existente solo escribe verification_code. Este trigger completa
  // automáticamente la expiración real que el email ya anuncia (30 minutos).
  await query(`
    CREATE OR REPLACE FUNCTION serenia_set_verification_code_metadata()
    RETURNS TRIGGER AS $$
    BEGIN
      IF TG_OP = 'INSERT' THEN
        IF NEW.verification_code IS NOT NULL THEN
          NEW.verification_code_expires_at := COALESCE(
            NEW.verification_code_expires_at,
            NOW() + INTERVAL '30 minutes'
          );
          NEW.verification_code_sent_at := COALESCE(NEW.verification_code_sent_at, NOW());
        END IF;
        RETURN NEW;
      END IF;

      IF NEW.verification_code IS DISTINCT FROM OLD.verification_code THEN
        IF NEW.verification_code IS NULL THEN
          NEW.verification_code_expires_at := NULL;
        ELSE
          NEW.verification_code_expires_at := COALESCE(
            NEW.verification_code_expires_at,
            NOW() + INTERVAL '30 minutes'
          );
          NEW.verification_code_sent_at := COALESCE(NEW.verification_code_sent_at, NOW());
        END IF;
      END IF;

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);

  await query(`DROP TRIGGER IF EXISTS trg_serenia_verification_code_metadata ON users`);
  await query(`
    CREATE TRIGGER trg_serenia_verification_code_metadata
    BEFORE INSERT OR UPDATE OF verification_code ON users
    FOR EACH ROW
    EXECUTE FUNCTION serenia_set_verification_code_metadata()
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_users_verification_email
    ON users (LOWER(email))
  `);
}

module.exports = { initVerificationSchema };
