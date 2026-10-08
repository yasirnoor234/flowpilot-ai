import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128-bit auth tag

/**
 * Derives a deterministic 32-byte key from the server environment encryption secret.
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'flowpilot-default-secret-key-32b-min!';
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypts sensitive string data (API keys, webhook tokens, headers) with AES-256-GCM.
 * Output format: base64(iv + authTag + cipherText)
 */
export function encryptSecret(plainText: string): string {
  if (!plainText) return '';

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plainText, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Combine IV (12B) + AuthTag (16B) + Encrypted Payload
  const combined = Buffer.concat([iv, authTag, encrypted]);
  return combined.toString('base64');
}

/**
 * Decrypts an AES-256-GCM encrypted payload.
 */
export function decryptSecret(encryptedBase64: string): string {
  if (!encryptedBase64) return '';

  try {
    const key = getEncryptionKey();
    const combined = Buffer.from(encryptedBase64, 'base64');

    if (combined.length < IV_LENGTH + AUTH_TAG_LENGTH) {
      throw new Error('Invalid encrypted payload length.');
    }

    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const cipherText = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(cipherText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString('utf8');
  } catch (err: any) {
    throw new Error(`Failed to decrypt secret: ${err.message}`);
  }
}

/**
 * Masks a secret string for client-safe display (e.g. "re_••••••••3fa9").
 */
export function maskSecret(secret?: string | null): string {
  if (!secret) return '';
  if (secret.length <= 8) return '••••••••';
  const prefix = secret.slice(0, 3);
  const suffix = secret.slice(-4);
  return `${prefix}••••••••${suffix}`;
}

/**
 * Redacts known secret patterns (API keys, tokens, webhooks) from log messages or errors.
 */
export function redactSecrets(text: string): string {
  if (!text || typeof text !== 'string') return text;

  return text
    .replace(/re_[a-zA-Z0-9_-]{20,}/g, '[REDACTED_RESEND_KEY]')
    .replace(/sk-[a-zA-Z0-9_-]{20,}/g, '[REDACTED_OPENAI_KEY]')
    .replace(/whsec_[a-zA-Z0-9_-]{20,}/g, '[REDACTED_WEBHOOK_SECRET]')
    .replace(/https:\/\/hooks\.slack\.com\/services\/[A-Za-z0-9_\/]+/g, 'https://hooks.slack.com/services/[REDACTED_SLACK_WEBHOOK]')
    .replace(/Bearer\s+[a-zA-Z0-9_\.-]+/gi, 'Bearer [REDACTED_BEARER_TOKEN]');
}

/**
 * Validates whether an incoming Slack webhook URL belongs strictly to hooks.slack.com
 * to prevent Server-Side Request Forgery (SSRF) to internal infrastructure or metadata services.
 */
export function validateSlackWebhookUrl(urlString: string): { valid: boolean; error?: string } {
  if (!urlString || typeof urlString !== 'string') {
    return { valid: false, error: 'Slack Webhook URL is required.' };
  }

  try {
    const url = new URL(urlString);
    if (url.protocol !== 'https:') {
      return { valid: false, error: 'Slack Webhook URL must use HTTPS.' };
    }
    if (url.hostname !== 'hooks.slack.com') {
      return { valid: false, error: 'Slack Webhook URL host must be hooks.slack.com.' };
    }
    if (!url.pathname.startsWith('/services/')) {
      return { valid: false, error: 'Invalid Slack Webhook URL path format.' };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format.' };
  }
}
