-- Serenia: robustez de códigos de verificación
-- 1) expiración real de 30 min
-- 2) código anterior válido por una breve ventana al reenviar
-- 3) marca de tiempo para evitar reenvíos duplicados

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS verification_code_expires_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS previous_verification_code VARCHAR(10),
  ADD COLUMN IF NOT EXISTS previous_verification_code_expires_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS verification_code_sent_at TIMESTAMP;

UPDATE users
SET verification_code_expires_at = COALESCE(verification_code_expires_at, NOW() + INTERVAL '30 minutes'),
    verification_code_sent_at = COALESCE(verification_code_sent_at, NOW())
WHERE is_verified = FALSE
  AND verification_code IS NOT NULL;

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
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_serenia_verification_code_metadata ON users;
CREATE TRIGGER trg_serenia_verification_code_metadata
BEFORE INSERT OR UPDATE OF verification_code ON users
FOR EACH ROW
EXECUTE FUNCTION serenia_set_verification_code_metadata();

CREATE INDEX IF NOT EXISTS idx_users_verification_email
ON users (LOWER(email));
