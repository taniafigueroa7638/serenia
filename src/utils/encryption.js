const crypto = require('node:crypto');

const ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_VERSION = 'v1';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

let cachedSource;
let cachedKey;

const loadEncryptionKey = () => {
  const source = process.env.DATA_ENCRYPTION_KEY;
  if (!source) {
    throw new Error(
      'Falta DATA_ENCRYPTION_KEY. Configura una clave Base64 de 32 bytes antes de iniciar Serenia.'
    );
  }

  if (cachedKey && cachedSource === source) return cachedKey;

  let key;
  if (/^[a-fA-F0-9]{64}$/.test(source)) {
    key = Buffer.from(source, 'hex');
  } else {
    key = Buffer.from(source, 'base64');
  }

  if (key.length !== 32) {
    throw new Error('DATA_ENCRYPTION_KEY debe contener exactamente 32 bytes en Base64 o 64 caracteres hexadecimales.');
  }

  cachedSource = source;
  cachedKey = key;
  return key;
};

const encryptJson = (value, context) => {
  if (!context) throw new Error('El contexto de cifrado es obligatorio');

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, loadEncryptionKey(), iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  cipher.setAAD(Buffer.from(context, 'utf8'));

  const plaintext = Buffer.from(JSON.stringify(value), 'utf8');
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    ENCRYPTION_VERSION,
    iv.toString('base64url'),
    authTag.toString('base64url'),
    ciphertext.toString('base64url'),
  ].join('.');
};

const decryptJson = (payload, context) => {
  if (!payload || typeof payload !== 'string') {
    throw new Error('No existe información cifrada para descifrar');
  }
  if (!context) throw new Error('El contexto de cifrado es obligatorio');

  const [version, ivText, tagText, ciphertextText, extra] = payload.split('.');
  if (version !== ENCRYPTION_VERSION || !ivText || !tagText || !ciphertextText || extra) {
    throw new Error('Formato de información cifrada inválido');
  }

  const iv = Buffer.from(ivText, 'base64url');
  const authTag = Buffer.from(tagText, 'base64url');
  const ciphertext = Buffer.from(ciphertextText, 'base64url');
  if (iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH) {
    throw new Error('Información cifrada inválida');
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, loadEncryptionKey(), iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAAD(Buffer.from(context, 'utf8'));
  decipher.setAuthTag(authTag);

  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return JSON.parse(plaintext.toString('utf8'));
};

const assertEncryptionConfigured = () => {
  loadEncryptionKey();
};

module.exports = {
  encryptJson,
  decryptJson,
  assertEncryptionConfigured,
};
