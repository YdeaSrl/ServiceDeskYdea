import { NextRequest, NextResponse } from 'next/server';
import { fetchAllOpenTickets, fetchAllClosedSince, fetchTicketInfo } from '@/app/lib/ydea';
import type { YdeaCreds } from '@/app/lib/ydea';
import { isClosedState } from '@/app/lib/sla';
import { decryptConfig } from '@/app/lib/session';

export const dynamic = 'force-dynamic';

async function resolveCreds(req: NextRequest): Promise<YdeaCreds | null> {
  const cookie = req.cookies.get('ydea_config')?.value;
  if (cookie) {
    const cfg = await decryptConfig<YdeaCreds>(cookie);
    if (cfg?.apiId && cfg?.apiKey) return cfg;
  }
  const apiId  = process.env.YDEA_API_ID;
  const apiKey = process.env.YDEA_API_KEY;
  if (apiId && apiId !== 'IL_TUO_ID_AZIENDA' && apiKey) return { apiId, apiKey };
  return null;
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

export async function GET(req: NextRequest) {
  const creds = await resolveCreds(req);
  if (!creds) {
    return NextResponse.json({ monthly: [], byType: {}, types: [], months: [] });
  }

  try {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    const ticketInfo = await fetchTicketInfo(creds);
    const closedStateIds = ticketInfo.stati.filter(s => isClosedState(s.nome)).map(s => String(s.id));

    const [openTickets, closedTickets] = await Promise.all([
      fetchAllOpenTickets(creds),
      fetchAllClosedSince(closedStateIds, sixMonthsAgo, creds),
    ]);

    const openedByMonth = new Map<string, number>(months.map(m => [m, 0]));
    for (const t of openTickets) {
      const m = toMonthKey(t.dataCreazione);
      if (openedByMonth.has(m)) openedByMonth.set(m, (openedByMonth.get(m) ?? 0) + 1);
    }

    const closedByMonth = new Map<string, number>(months.map(m => [m, 0]));
    for (const t of closedTickets) {
      const m = toMonthKey(t.dataModifica ?? t.dataCreazione ?? '');
      if (closedByMonth.has(m)) closedByMonth.set(m, (closedByMonth.get(m) ?? 0) + 1);
    }

    const typeMap = new Map<string, Map<string, number>>();
    for (const t of [...openTickets, ...closedTickets]) {
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
