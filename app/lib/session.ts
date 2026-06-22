const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24h

function getSecret(): string {
  return process.env.SESSION_SECRET ?? 'change-me-in-production-please';
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return globalThis.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

function b64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function fromb64(s: string): Uint8Array {
  return Uint8Array.from(atob(s), c => c.charCodeAt(0));
}

export async function createSessionToken(): Promise<string> {
  const payload = String(Date.now());
  const key = await hmacKey(getSecret());
  const sig = await globalThis.crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return `${payload}.${b64(sig)}`;
}

export async function validateSessionToken(token: string): Promise<boolean> {
  try {
    const dot = token.lastIndexOf('.');
    if (dot === -1) return false;
    const payload = token.slice(0, dot);
    const sigB64 = token.slice(dot + 1);
    const ts = parseInt(payload, 10);
    if (isNaN(ts) || Date.now() - ts > SESSION_TTL_MS) return false;
    const key = await hmacKey(getSecret());
    return globalThis.crypto.subtle.verify('HMAC', key, fromb64(sigB64), new TextEncoder().encode(payload));
  } catch {
    return false;
  }
}

// ── Config encryption (AES-GCM) ───────────────────────────────────────────

async function aesKey(secret: string): Promise<CryptoKey> {
  const raw = await globalThis.crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), 'PBKDF2', false, ['deriveKey'],
  );
  return globalThis.crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: new TextEncoder().encode('ydea-v1'), iterations: 100_000, hash: 'SHA-256' },
    raw,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptConfig(data: object): Promise<string> {
  const key = await aesKey(getSecret());
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await globalThis.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(JSON.stringify(data)),
  );
  const combined = new Uint8Array(12 + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), 12);
  return b64(combined.buffer);
}

export async function decryptConfig<T>(token: string): Promise<T | null> {
  try {
    const combined = fromb64(token);
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    const key = await aesKey(getSecret());
    const decrypted = await globalThis.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
    return JSON.parse(new TextDecoder().decode(decrypted)) as T;
  } catch {
    return null;
  }
}
