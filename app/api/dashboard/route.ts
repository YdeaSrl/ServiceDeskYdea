import { NextResponse } from 'next/server';
import { fetchAllOpenTickets, fetchClosedToday, fetchUsers, fetchTicketInfo, getUserFullName } from '@/app/lib/ydea';
import { isClosedState } from '@/app/lib/sla';
import type { DashboardData } from '@/app/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const [allTickets, ticketInfo, users] = await Promise.all([
      fetchAllOpenTickets(),
      fetchTicketInfo(),
      fetchUsers(),
    ]);

    const openTickets = allTickets.filter(t => !isClosedState(t.stato));

    const closedStateIds = ticketInfo.stati
      .filter(s => isClosedState(s.nome))
      .map(s => String(s.id));

    const closedToday = await fetchClosedToday(closedStateIds);

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

    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Errore sconosciuto';
    return NextResponse.json(
      { fetchError: message, tickets: [], closedToday: [], users: [], ticketInfo: { stati: [], priorita: [], fonti: [], tipi: [] }, lastUpdated: new Date().toISOString() } satisfies DashboardData,
      { status: 200 },
    );
  }
}
