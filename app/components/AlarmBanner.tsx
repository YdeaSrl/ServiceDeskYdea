'use client';

import type { Ticket } from '@/app/types';
import { getSlaInfo } from '@/app/lib/sla';

interface Props {
  newTickets: Ticket[];
}

export default function AlarmBanner({ newTickets }: Props) {
  const breached = newTickets.filter(t => getSlaInfo(t).status === 'breach');
  const warning  = newTickets.filter(t => getSlaInfo(t).status === 'warning');

  if (breached.length === 0 && warning.length === 0) return null;

  const isBreach = breached.length > 0;
  const count = isBreach ? breached.length : warning.length;
  const label = isBreach
    ? `${count} ticket NUOVO${count > 1 ? 'I' : ''} senza presa in carico da oltre 8h — SLA SCADUTO`
    : `${count} ticket NUOVO${count > 1 ? 'I' : ''} in scadenza SLA entro 2 ore`;

  return (
    <div
      className={`flex items-center justify-center gap-3 py-3 text-white font-bold text-xl tracking-wide ${
        isBreach
          ? 'bg-red-700 animate-pulse'
          : 'bg-amber-600'
      }`}
    >
      <span className="text-2xl">{isBreach ? '🚨' : '⚠️'}</span>
      <span>{label}</span>
      <span className="text-2xl">{isBreach ? '🚨' : '⚠️'}</span>
    </div>
  );
}
