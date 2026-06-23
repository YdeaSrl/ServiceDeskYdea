import { NextRequest, NextResponse } from 'next/server';
import { fetchTicketsPage, fetchTicketInfo, fetchUsers } from '@/app/lib/ydea';
import type { YdeaCreds } from '@/app/lib/ydea';
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

export async function GET(req: NextRequest) {
  const creds = await resolveCreds(req);
  if (!creds) {
    return NextResponse.json({ error: 'No credentials configured' }, { status: 401 });
  }

  try {
    const [{ tickets }, ticketInfo, users] = await Promise.all([
      fetchTicketsPage(1, creds),
      fetchTicketInfo(creds),
      fetchUsers(creds),
    ]);

    const sampleTicket = tickets[0] ?? null;
    const sampleUser = users[0] ?? null;

    return NextResponse.json({
      sampleTicket_allFields: sampleTicket,
      sampleTicket_keyFields: sampleTicket ? {
        stato: sampleTicket.stato,
        stato_id: sampleTicket.stato_id,
        priorita: sampleTicket.priorita,
        priorita_id: sampleTicket.priorita_id,
        assegnatoA: sampleTicket.assegnatoA,
        assegnatoA_id: sampleTicket['assegnatoA_id'],
        assegnato_a: sampleTicket['assegnato_a'],
        assegnato_a_id: sampleTicket['assegnato_a_id'],
        utente_id: sampleTicket['utente_id'],
        agente_id: sampleTicket['agente_id'],
        contatti: sampleTicket['contatti'],
        contatto: sampleTicket['contatto'],
      } : null,
      ticketInfo_stati: ticketInfo.stati,
      ticketInfo_priorita: ticketInfo.priorita,
      totalTickets: tickets.length,
      totalUsers: users.length,
      sampleUser: sampleUser,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
