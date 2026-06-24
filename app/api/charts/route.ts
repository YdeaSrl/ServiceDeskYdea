import { NextRequest, NextResponse } from 'next/server';
import { fetchAllTicketsInStates, fetchAllClosedSince, fetchTicketInfo } from '@/app/lib/ydea';
import { isClosedState } from '@/app/lib/sla';
import { resolveCredsFromRequest } from '@/app/lib/resolveCredentials';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;


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

export async function GET(req: NextRequest) {
  const creds = await resolveCredsFromRequest(req);
  if (!creds) {
    return NextResponse.json({ monthly: [], byType: {}, types: [], months: [] });
  }

  try {
    const now = new Date();
    // From January 1st of the current year
    const janFirst = new Date(now.getFullYear(), 0, 1);
    janFirst.setHours(0, 0, 0, 0);

    // Build month keys from January to current month
    const months: string[] = [];
    for (let m = 0; m <= now.getMonth(); m++) {
      const d = new Date(now.getFullYear(), m, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    const ticketInfo = await fetchTicketInfo(creds);
    const closedStateIds = ticketInfo.stati.filter(s => isClosedState(s.nome)).map(s => String(s.id));
    const openStateIds = ticketInfo.stati.filter(s => !isClosedState(s.nome)).map(s => String(s.id));

    const [openTickets, closedTickets] = await Promise.all([
      fetchAllTicketsInStates(openStateIds, creds),
      fetchAllClosedSince(closedStateIds, janFirst, creds),
    ]);

    // Deduplicate: a ticket that changed state this year may appear in both sets
    const openTicketIds = new Set(openTickets.map(t => t.id));
    const uniqueClosedTickets = closedTickets.filter(t => !openTicketIds.has(t.id));
    const allTickets = [...openTickets, ...uniqueClosedTickets];

    // "Aperti" = all tickets created in each month (regardless of current state)
    const openedByMonth = new Map<string, number>(months.map(m => [m, 0]));
    for (const t of allTickets) {
      const m = toMonthKey(t.dataCreazione);
      if (openedByMonth.has(m)) openedByMonth.set(m, (openedByMonth.get(m) ?? 0) + 1);
    }

    // "Chiusi" = tickets closed (by modification date) in each month
    const closedByMonth = new Map<string, number>(months.map(m => [m, 0]));
    for (const t of closedTickets) {
      const m = toMonthKey(t.dataModifica ?? t.dataCreazione ?? '');
      if (closedByMonth.has(m)) closedByMonth.set(m, (closedByMonth.get(m) ?? 0) + 1);
    }

    const typeMap = new Map<string, Map<string, number>>();
    for (const t of allTickets) {
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

    const monthly = months.map(m => ({
      label: monthLabel(m),
      opened: openedByMonth.get(m) ?? 0,
      closed: closedByMonth.get(m) ?? 0,
    }));

    return NextResponse.json({
      monthly,
      byType,
      types: allTypes,
      months: months.map(monthLabel),
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
