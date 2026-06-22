import { NextRequest, NextResponse } from 'next/server';
import { encryptConfig, decryptConfig } from '@/app/lib/session';

interface StoredConfig {
  apiId: string;
  apiKey: string;
}

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get('ydea_config')?.value;
  if (cookie) {
    const cfg = await decryptConfig<StoredConfig>(cookie);
    if (cfg) {
      return NextResponse.json({
        apiId: cfg.apiId,
        apiKeySet: true,
        source: 'cookie',
      });
    }
  }

  const envId = process.env.YDEA_API_ID;
  if (envId && envId !== 'IL_TUO_ID_AZIENDA') {
    return NextResponse.json({
      apiId: envId,
      apiKeySet: !!process.env.YDEA_API_KEY,
      source: 'env',
    });
  }

  return NextResponse.json({ apiId: '', apiKeySet: false, source: 'none' });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { apiId, apiKey } = body as { apiId?: string; apiKey?: string };

  if (!apiId?.trim()) {
    return NextResponse.json({ error: 'Account ID è obbligatorio' }, { status: 400 });
  }

  let finalKey = apiKey?.trim();
  if (!finalKey) {
    // Preserve existing key if the user didn't enter a new one
    const existingCookie = req.cookies.get('ydea_config')?.value;
    if (existingCookie) {
      const cfg = await decryptConfig<StoredConfig>(existingCookie);
      finalKey = cfg?.apiKey;
    }
    if (!finalKey) finalKey = process.env.YDEA_API_KEY?.trim();
  }

  if (!finalKey) {
    return NextResponse.json({ error: 'API Key è obbligatoria' }, { status: 400 });
  }

  const encrypted = await encryptConfig({ apiId: apiId.trim(), apiKey: finalKey });
  const res = NextResponse.json({ ok: true });
  res.cookies.set('ydea_config', encrypted, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 365 * 24 * 60 * 60,
    path: '/',
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete('ydea_config');
  return res;
}
