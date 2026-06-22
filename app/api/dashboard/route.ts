import { NextRequest, NextResponse } from 'next/server';
import { fetchAllOpenTickets, fetchClosedToday, fetchUsers, fetchTicketInfo, getUserFullName } from '@/app/lib/ydea';
import type { YdeaCreds } from '@/app/lib/ydea';
import { isClosedState } from '@/app/lib/sla';
import { MOCK_DATA } from '@/app/lib/mockData';
import { decryptConfig } from '@/app/lib/session';
import type { DashboardData } from '@/app/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function resolveCreds(req: NextRequest): Promise<YdeaCreds | null> {
  const cookie = req.cookies.get('ydea_config')?.value;
  if (cookie) {
    const cfg = await decryptConfig<YdeaCreds>(cookie);
    if (cfg?.apiId && cfg?.apiKey) return cfg;
  }
  const apiId  = process.env.YDEA_API_ID;
  const apiKey = process.env.YDEA_API_KEY;
  if (apiId && apiId !== 'IL_TUO_ID_AZIENDA' && apiKey) {
    return { apiId, apiKey };
  }
  return null;
}

export async function GET(req: NextRequest) {
  const creds = await resolveCreds(req);

  if (!creds) {
    return NextResponse.json(
      { ...MOCK_DATA, lastUpdated: new Date().toISOString(), isMock: true } satisfies DashboardData,
      { headers: { 'Cache-Control': 'no-store', 'X-Mock': 'true' } },
    );
  }

  try {
    const [allTickets, ticketInfo, users] = await Promise.all([
      fetchAllOpenTickets(creds),
      fetchTicketInfo(creds),
      fetchUsers(creds),
    ]);

    const openTickets = allTickets.filter(t => !isClosedState(t.stato));

    const closedStateIds = ticketInfo.stati
      .filter(s => isClosedState(s.nome))
      .map(s => String(s.id));

    const closedToday = await fetchClosedToday(closedStateIds, creds);

    const userMap = new Map(users.map(u => [u.id, getUserFullName(u)]));
    const enrichedTickets = openTickets.map(t => {
      const assigneeId = (t['assegnatoA_id'] ?? t['utente_id'] ?? t['agente_id']) as number | undefined;
      if (assigneeId && !t.assegnatoA) {
        return { ...t, assegnatoA: userMap.get(assigneeId) ?? '' };
      }
      return t;
    });

    const payload: DashboardData = {
      tickets: enrichedTickets,
      closedToday,
      users,
      ticketInfo,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(payload, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Errore sconosciuto';
    return NextResponse.json(
      { fetchError: message, tickets: [], closedToday: [], users: [], ticketInfo: { stati: [], priorita: [], fonti: [], tipi: [] }, lastUpdated: new Date().toISOString() } satisfies DashboardData,
      { status: 200 },
    );
  }
}
