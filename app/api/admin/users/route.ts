import { NextRequest, NextResponse } from 'next/server';
import { validateSessionToken } from '@/app/lib/session';
import { getAllUsers, createUser, updateUser, deleteUser, toPublicUser } from '@/app/lib/users';

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get('session')?.value;
  if (!token) return null;
  const session = await validateSessionToken(token);
  if (!session || session.role !== 'admin') return null;
  return session;
}

export async function GET(req: NextRequest) {
  const session = await requireAdmin(req);
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });

  const users = await getAllUsers();
  return NextResponse.json({ users: users.map(toPublicUser) });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin(req);
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { username, password, role, apiId, apiKey } = body as {
    username?: string;
    password?: string;
    role?: string;
    apiId?: string;
    apiKey?: string;
  };

  if (!username?.trim()) return NextResponse.json({ error: 'Username è obbligatorio' }, { status: 400 });
  if (!password || password.length < 6) return NextResponse.json({ error: 'Password deve essere almeno 6 caratteri' }, { status: 400 });
  if (role !== 'admin' && role !== 'user') return NextResponse.json({ error: 'Ruolo non valido' }, { status: 400 });

  try {
    const user = await createUser({ username, password, role, apiId: apiId?.trim(), apiKey: apiKey?.trim() });
    return NextResponse.json({ user: toPublicUser(user) }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin(req);
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { id, ...data } = body as { id?: string; password?: string; role?: string; apiId?: string; apiKey?: string };

  if (!id) return NextResponse.json({ error: 'ID è obbligatorio' }, { status: 400 });

  const user = await updateUser(id, {
    ...(data.password ? { password: data.password } : {}),
    ...(data.role === 'admin' || data.role === 'user' ? { role: data.role } : {}),
    ...(data.apiId !== undefined ? { apiId: data.apiId } : {}),
    ...(data.apiKey !== undefined ? { apiKey: data.apiKey } : {}),
  });

  if (!user) return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 });
  return NextResponse.json({ user: toPublicUser(user) });
}

export async function DELETE(req: NextRequest) {
  const session = await requireAdmin(req);
  if (!session) return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID è obbligatorio' }, { status: 400 });

  if (id === session.userId) return NextResponse.json({ error: 'Non puoi eliminare il tuo account' }, { status: 400 });

  await deleteUser(id);
  return NextResponse.json({ ok: true });
}
