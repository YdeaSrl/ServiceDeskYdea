const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24h

export interface SessionPayload {
  userId: string;
  username: string;
  role: 'admin' | 'user';
  createdAt: number;
}

function getSecret(): string {
  return process.env.SESSION_SECRET ?? 'change-me-in-production-please';
}

function b64(buf: ArrayBufferLike): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function fromb64(s: string): Uint8Array<ArrayBuffer> {
  const raw = atob(s);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

async function aesKey(secret: string): Promise<CryptoKey> {
  const raw = await globalThis.crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret), 'PBKDF2', false, ['deriveKey'],
  );
  return globalThis.crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: new TextEncoder().encode('ydea-session-v2'), iterations: 100_000, hash: 'SHA-256' },
    raw,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  const key = await aesKey(getSecret());
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await globalThis.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(JSON.stringify(payload)),
  );
  const combined = new Uint8Array(12 + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), 12);
  return b64(combined.buffer);
}

export async function validateSessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const combined = fromb64(token);
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    const key = await aesKey(getSecret());
    const decrypted = await globalThis.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
    const payload = JSON.parse(new TextDecoder().decode(decrypted)) as SessionPayload;
    if (!payload.createdAt || Date.now() - payload.createdAt > SESSION_TTL_MS) return null;
    if (!payload.userId || !payload.username) return null;
    return payload;
  } catch {
    return null;
  }
}

// ── Config encryption (AES-GCM) ───────────────────────────────────────────

async function configAesKey(secret: string): Promise<CryptoKey> {
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
  const key = await configAesKey(getSecret());
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
    const key = await configAesKey(getSecret());
    const decrypted = await globalThis.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
    return JSON.parse(new TextDecoder().decode(decrypted)) as T;
  } catch {
    return null;
  }
}
