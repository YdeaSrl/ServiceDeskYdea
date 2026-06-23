import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken } from '@/app/lib/session';
import { getUserByUsername, verifyPassword, ensureAdminBootstrap } from '@/app/lib/users';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { username, password } = body as { username?: string; password?: string };

  if (!username?.trim() || !password) {
    return NextResponse.json({ error: 'Username e password sono obbligatori' }, { status: 400 });
  }

  try {
    await ensureAdminBootstrap();

    const user = await getUserByUsername(username);
    if (!user) {
      return NextResponse.json({ error: 'Credenziali non valide' }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.passwordHash, user.passwordSalt);
    if (!valid) {
      return NextResponse.json({ error: 'Credenziali non valide' }, { status: 401 });
    }

    const token = await createSessionToken({
      userId: user.id,
      username: user.username,
      role: user.role,
      createdAt: Date.now(),
    });

    const res = NextResponse.json({ ok: true, role: user.role });
    res.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
      path: '/',
    });
    return res;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 });
  }
}
