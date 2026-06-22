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

  const session = req.cookies.get('session')?.value;
  if (!session || !(await validateSessionToken(session))) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}
