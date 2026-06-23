'use client';

import type { Ticket } from '@/app/types';
import { getSlaInfo } from '@/app/lib/sla';

interface Props {
  newTickets: Ticket[];
}

export default function AlarmBanner({ newTickets }: Props) {
  const breached = newTickets.filter(t => getSlaInfo(t).status === 'breach');
  const warned   = newTickets.filter(t => getSlaInfo(t).status === 'warning');

  if (breached.length === 0 && warned.length === 0) return null;

  const isBreach = breached.length > 0;
  const count = isBreach ? breached.length : warned.length;
  const label = isBreach
    ? `🚨  ${count} ticket NUOVO${count > 1 ? 'I' : ''} senza risposta da oltre 2h — SLA SCADUTO  🚨`
    : `⚠️  ${count} ticket in scadenza SLA entro 30 min`;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        padding: '9px 20px',
        fontWeight: 700,
        fontSize: '14px',
        letterSpacing: '0.02em',
        color: '#fff',
        flexShrink: 0,
        background: isBreach ? 'var(--sla-breach)' : 'var(--sla-warn)',
        animation: isBreach ? 'alarm-flash 1.4s ease-in-out infinite' : undefined,
      }}
    >
      {label}
    </div>
  );
}
