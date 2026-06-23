import { NextRequest, NextResponse } from 'next/server';
import { validateSessionToken } from '@/app/lib/session';
import { getUserById, updateUser } from '@/app/lib/users';

async function getSession(req: NextRequest) {
  const token = req.cookies.get('session')?.value;
  if (!token) return null;
  return validateSessionToken(token);
}

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ apiId: '', apiKeySet: false, source: 'none' });

  const user = await getUserById(session.userId);
  if (user?.apiId) {
    return NextResponse.json({ apiId: user.apiId, apiKeySet: !!user.apiKey, source: 'kv' });
  }

  const envId = process.env.YDEA_API_ID;
  if (envId && envId !== 'IL_TUO_ID_AZIENDA') {
    return NextResponse.json({ apiId: envId, apiKeySet: !!process.env.YDEA_API_KEY, source: 'env' });
  }

  return NextResponse.json({ apiId: '', apiKeySet: false, source: 'none' });
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { apiId, apiKey } = body as { apiId?: string; apiKey?: string };

  if (!apiId?.trim()) return NextResponse.json({ error: 'Account ID è obbligatorio' }, { status: 400 });

  const user = await getUserById(session.userId);
  const finalKey = apiKey?.trim() || user?.apiKey || process.env.YDEA_API_KEY?.trim() || '';

  if (!finalKey) return NextResponse.json({ error: 'API Key è obbligatoria' }, { status: 400 });

  await updateUser(session.userId, { apiId: apiId.trim(), apiKey: finalKey });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  await updateUser(session.userId, { apiId: '', apiKey: '' });
  return NextResponse.json({ ok: true });
}
