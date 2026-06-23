import { NextRequest } from 'next/server';
import { validateSessionToken } from '@/app/lib/session';
import { getUserById } from '@/app/lib/users';
import type { YdeaCreds } from '@/app/lib/ydea';

export async function resolveCredsFromRequest(req: NextRequest): Promise<YdeaCreds | null> {
  const token = req.cookies.get('session')?.value;
  if (token) {
    const session = await validateSessionToken(token);
    if (session) {
      const user = await getUserById(session.userId);
      if (user?.apiId && user?.apiKey) {
        return { apiId: user.apiId, apiKey: user.apiKey };
      }
    }
  }

  // Fallback to env vars (for backwards compatibility / single-user setup)
  const apiId  = process.env.YDEA_API_ID;
  const apiKey = process.env.YDEA_API_KEY;
  if (apiId && apiId !== 'IL_TUO_ID_AZIENDA' && apiKey) return { apiId, apiKey };

  return null;
}
