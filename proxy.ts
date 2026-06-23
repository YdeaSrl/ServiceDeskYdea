import { NextRequest, NextResponse } from 'next/server';
import { validateSessionToken } from '@/app/lib/session';

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === '/login' || pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  const token = req.cookies.get('session')?.value;
  const session = token ? await validateSessionToken(token) : null;

  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (session.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 });
    }
  }

  return NextResponse.next();
}
