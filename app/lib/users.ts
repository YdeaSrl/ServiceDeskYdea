import { kv } from '@vercel/kv';

export interface AppUser {
  id: string;
  username: string;
  passwordHash: string;
  passwordSalt: string;
  role: 'admin' | 'user';
  apiId: string;
  apiKey: string;
  createdAt: string;
}

export interface PublicUser {
  id: string;
  username: string;
  role: 'admin' | 'user';
  apiId: string;
  hasCredentials: boolean;
  createdAt: string;
}

function b64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function fromb64(s: string): Uint8Array {
  const raw = atob(s);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

async function hashPassword(password: string, salt: Uint8Array<ArrayBuffer>): Promise<Uint8Array> {
  const key = await globalThis.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await globalThis.crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    key,
    256,
  );
  return new Uint8Array(bits);
}

export async function createPasswordHash(password: string): Promise<{ hash: string; salt: string }> {
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16)) as Uint8Array<ArrayBuffer>;
  const hash = await hashPassword(password, salt);
  return { hash: b64(hash.buffer as ArrayBuffer), salt: b64(salt.buffer as ArrayBuffer) };
}

export async function verifyPassword(password: string, hashB64: string, saltB64: string): Promise<boolean> {
  try {
    const salt = fromb64(saltB64) as Uint8Array<ArrayBuffer>;
    const expected = fromb64(hashB64);
    const actual = await hashPassword(password, salt);
    if (actual.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
    return diff === 0;
  } catch {
    return false;
  }
}

export async function getUserById(id: string): Promise<AppUser | null> {
  return await kv.get<AppUser>(`user:${id}`);
}

export async function getUserByUsername(username: string): Promise<AppUser | null> {
  const id = await kv.get<string>(`username:${username.toLowerCase().trim()}`);
  if (!id) return null;
  return getUserById(id);
}

export async function getAllUsers(): Promise<AppUser[]> {
  const ids = await kv.smembers<string[]>('users');
  if (!ids.length) return [];
  const users = await Promise.all(ids.map(id => kv.get<AppUser>(`user:${id}`)));
  return users.filter((u): u is AppUser => u !== null);
}

export async function createUser(data: {
  username: string;
  password: string;
  role: 'admin' | 'user';
  apiId?: string;
  apiKey?: string;
}): Promise<AppUser> {
  const { hash, salt } = await createPasswordHash(data.password);
  const id = globalThis.crypto.randomUUID();
  const user: AppUser = {
    id,
    username: data.username.toLowerCase().trim(),
    passwordHash: hash,
    passwordSalt: salt,
    role: data.role,
    apiId: data.apiId ?? '',
    apiKey: data.apiKey ?? '',
    createdAt: new Date().toISOString(),
  };
  await kv.set(`user:${id}`, user);
  await kv.set(`username:${user.username}`, id);
  await kv.sadd('users', id);
  return user;
}

export async function updateUser(
  id: string,
  data: Partial<Pick<AppUser, 'apiId' | 'apiKey' | 'role'>> & { password?: string },
): Promise<AppUser | null> {
  const user = await getUserById(id);
  if (!user) return null;
  if (data.password) {
    const { hash, salt } = await createPasswordHash(data.password);
    user.passwordHash = hash;
    user.passwordSalt = salt;
  }
  if (data.apiId !== undefined) user.apiId = data.apiId;
  if (data.apiKey !== undefined) user.apiKey = data.apiKey;
  if (data.role !== undefined) user.role = data.role;
  await kv.set(`user:${id}`, user);
  return user;
}

export async function deleteUser(id: string): Promise<void> {
  const user = await getUserById(id);
  if (!user) return;
  await kv.del(`user:${id}`);
  await kv.del(`username:${user.username}`);
  await kv.srem('users', id);
}

export function toPublicUser(user: AppUser): PublicUser {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    apiId: user.apiId,
    hasCredentials: !!(user.apiId && user.apiKey),
    createdAt: user.createdAt,
  };
}

export async function ensureAdminBootstrap(): Promise<void> {
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminUsername || !adminPassword) return;

  const existing = await getUserByUsername(adminUsername);
  if (existing) return;

  await createUser({
    username: adminUsername,
    password: adminPassword,
    role: 'admin',
    apiId: process.env.YDEA_API_ID ?? '',
    apiKey: process.env.YDEA_API_KEY ?? '',
  });
}
