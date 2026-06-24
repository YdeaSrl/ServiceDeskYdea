import { NextRequest, NextResponse } from 'next/server';
import { fetchAllTicketsInStates, fetchAllClosedSince, fetchClosedToday, fetchUsers, fetchTicketInfo, getUserFullName } from '@/app/lib/ydea';
import { isClosedState } from '@/app/lib/sla';
import { MOCK_DATA } from '@/app/lib/mockData';
import { resolveCredsFromRequest } from '@/app/lib/resolveCredentials';
import type { DashboardData, ChartsData } from '@/app/types';

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

    const now2 = new Date();
    const firstOfMonth = new Date(now2.getFullYear(), now2.getMonth(), 1);
    firstOfMonth.setHours(0, 0, 0, 0);
    const todayStart = new Date(now2.getFullYear(), now2.getMonth(), now2.getDate());
    // Extend yearly fetch to January — expensive but cached for 55 minutes in ydea.ts
    const janFirst = new Date(now2.getFullYear(), 0, 1);
    janFirst.setHours(0, 0, 0, 0);

    const [allTickets, closedToday, closedSinceJan] = await Promise.all([
      fetchAllTicketsInStates(openStateIds, creds),
      fetchClosedToday(closedStateIds, creds),
      fetchAllClosedSince(closedStateIds, janFirst, creds),
    ]);

    const openTickets = allTickets.filter(t => !isClosedState(t.stato));

    // KPI counts — filter yearly data down to this month/today
    const closedCreatedThisMonth = closedSinceJan.filter(t => new Date(t.dataCreazione) >= firstOfMonth).length;
    const openedThisMonthCount = openTickets.filter(t => new Date(t.dataCreazione) >= firstOfMonth).length + closedCreatedThisMonth;

    const closedCreatedToday = closedToday.filter(t => new Date(t.dataCreazione) >= todayStart).length;
    const openedTodayCount = openTickets.filter(t => new Date(t.dataCreazione) >= todayStart).length + closedCreatedToday;

    // ── Charts data (computed from already-fetched data, no extra YDEA calls) ──
    const months: string[] = [];
    for (let m = 0; m <= now2.getMonth(); m++) {
      const d = new Date(now2.getFullYear(), m, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    function toMonthKey(dateStr: string): string {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    }
    function monthLabel(key: string): string {
      const [year, month] = key.split('-');
      const d = new Date(Number(year), Number(month) - 1, 1);
      return d.toLocaleDateString('it-IT', { month: 'short', year: '2-digit' });
    }

    const openTicketIds = new Set(openTickets.map(t => t.id));
    const uniqueClosedTickets = closedSinceJan.filter(t => !openTicketIds.has(t.id));
    const allTicketsForCharts = [...openTickets, ...uniqueClosedTickets];

    const openedByMonth = new Map<string, number>(months.map(m => [m, 0]));
    for (const t of allTicketsForCharts) {
      const m = toMonthKey(t.dataCreazione);
      if (openedByMonth.has(m)) openedByMonth.set(m, (openedByMonth.get(m) ?? 0) + 1);
    }

    const closedByMonth = new Map<string, number>(months.map(m => [m, 0]));
    for (const t of closedSinceJan) {
      const m = toMonthKey(t.dataModifica ?? t.dataCreazione ?? '');
      if (closedByMonth.has(m)) closedByMonth.set(m, (closedByMonth.get(m) ?? 0) + 1);
    }

    const typeMap = new Map<string, Map<string, number>>();
    for (const t of allTicketsForCharts) {
      const tipo = (t.tipo as string | undefined)?.trim() || 'N/D';
      const m = toMonthKey(t.dataCreazione);
      if (!months.includes(m)) continue;
      if (!typeMap.has(tipo)) typeMap.set(tipo, new Map(months.map(m2 => [m2, 0])));
      const tm = typeMap.get(tipo)!;
      tm.set(m, (tm.get(m) ?? 0) + 1);
    }

    const allTypes = [...typeMap.keys()].sort(
      (a, b) => [...(typeMap.get(b)?.values() ?? [])].reduce((s, n) => s + n, 0)
              - [...(typeMap.get(a)?.values() ?? [])].reduce((s, n) => s + n, 0)
    ).slice(0, 5);

    const byType: Record<string, number[]> = {};
    for (const tipo of allTypes) {
      byType[tipo] = months.map(m => typeMap.get(tipo)?.get(m) ?? 0);
    }

    const chartsData: ChartsData = {
      monthly: months.map(m => ({ label: monthLabel(m), opened: openedByMonth.get(m) ?? 0, closed: closedByMonth.get(m) ?? 0 })),
      byType,
      types: allTypes,
      months: months.map(monthLabel),
    };

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
        // Non-empty if any value in the object is a non-empty string
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
      openedTodayCount,
      openedThisMonthCount,
      chartsData,
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
