import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken } from '@/app/lib/session';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const password: unknown = body?.password;
  const expected = process.env.DASHBOARD_PASSWORD ?? 'ydea2024';

  if (typeof password !== 'string' || password !== expected) {
    return NextResponse.json({ error: 'Password non corretta' }, { status: 401 });
  }

  const token = await createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60,
    path: '/',
  });
  return res;
}
