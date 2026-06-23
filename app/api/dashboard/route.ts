import { NextRequest, NextResponse } from 'next/server';
import { fetchAllTicketsInStates, fetchClosedToday, fetchUsers, fetchTicketInfo, getUserFullName } from '@/app/lib/ydea';
import { isClosedState } from '@/app/lib/sla';
import { MOCK_DATA } from '@/app/lib/mockData';
import { resolveCredsFromRequest } from '@/app/lib/resolveCredentials';
import type { DashboardData } from '@/app/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const creds = await resolveCredsFromRequest(req);

  if (!creds) {
    return NextResponse.json(
      { ...MOCK_DATA, lastUpdated: new Date().toISOString(), isMock: true } satisfies DashboardData,
      { headers: { 'Cache-Control': 'no-store', 'X-Mock': 'true' } },
    );
  }

  try {
    const [ticketInfo, users] = await Promise.all([
      fetchTicketInfo(creds),
      fetchUsers(creds),
    ]);

    const closedStateIds = ticketInfo.stati
      .filter(s => isClosedState(s.nome))
      .map(s => String(s.id));

    const openStateIds = ticketInfo.stati
      .filter(s => !isClosedState(s.nome))
      .map(s => String(s.id));

    const allTickets = await fetchAllTicketsInStates(openStateIds, creds);
    const openTickets = allTickets.filter(t => !isClosedState(t.stato));

    const closedToday = await fetchClosedToday(closedStateIds, creds);

    const internalUsers = users.filter(u => {
      const ruoli = u['ruoli'] as string[] | undefined;
      if (Array.isArray(ruoli) && ruoli.includes('ROLE_ESTERNO')) return false;
      if (u['isCustomerPortal']) return false;
      return true;
    });

    const userMap = new Map(internalUsers.map(u => [u.id, getUserFullName(u)]));

    function assigneeIsEmpty(v: unknown): boolean {
      if (v == null) return true;
      if (typeof v === 'string') return v.trim() === '';
      if (typeof v === 'object' && v !== null) {
        return !Object.values(v as Record<string, unknown>).some(
          val => typeof val === 'string' && (val as string).trim() !== ''
        );
      }
      return false;
    }

    const enrichedTickets = openTickets.map(t => {
      if (assigneeIsEmpty(t.assegnatoA)) {
        const assigneeId = (
          t['assegnatoA_id'] ?? t['assegnato_a_id'] ?? t['utente_id'] ?? t['agente_id']
        ) as number | undefined;
        if (assigneeId) return { ...t, assegnatoA: userMap.get(assigneeId) ?? '' };
      }
      return t;
    });

    const payload: DashboardData = {
      tickets: enrichedTickets,
      closedToday,
      users: internalUsers,
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
