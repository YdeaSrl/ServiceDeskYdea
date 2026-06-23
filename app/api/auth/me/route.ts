import { NextRequest, NextResponse } from 'next/server';
import { validateSessionToken } from '@/app/lib/session';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('session')?.value;
  if (!token) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const session = await validateSessionToken(token);
  if (!session) return NextResponse.json({ error: 'Sessione scaduta' }, { status: 401 });

  return NextResponse.json({ userId: session.userId, username: session.username, role: session.role });
}
