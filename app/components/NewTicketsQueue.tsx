'use client';

import type { Ticket } from '@/app/types';
import { getSlaInfo, getPriorityLevel, formatTimeAgo } from '@/app/lib/sla';

const PRIORITY_CONFIG = {
  urgente: { label: 'URGENTE', bg: 'bg-red-900/60',   border: 'border-red-500',   badge: 'bg-red-600',    text: 'text-red-400'   },
  alta:    { label: 'ALTA',    bg: 'bg-orange-900/40', border: 'border-orange-500', badge: 'bg-orange-600', text: 'text-orange-400' },
  media:   { label: 'MEDIA',   bg: 'bg-slate-800',     border: 'border-slate-600',  badge: 'bg-slate-600',  text: 'text-slate-400'  },
  bassa:   { label: 'BASSA',   bg: 'bg-slate-800',     border: 'border-slate-700',  badge: 'bg-slate-700',  text: 'text-slate-500'  },
  unknown: { label: '—',       bg: 'bg-slate-800',     border: 'border-slate-700',  badge: 'bg-slate-700',  text: 'text-slate-500'  },
};

const SLA_CONFIG = {
  breach:  'text-red-400 font-bold',
  warning: 'text-amber-400 font-bold',
  ok:      'text-slate-400',
  na:      'text-slate-600',
};

interface Props {
  tickets: Ticket[];
}

export default function NewTicketsQueue({ tickets }: Props) {
  const sorted = [...tickets].sort((a, b) => {
    const pa = ['urgente', 'alta', 'media', 'bassa', 'unknown'].indexOf(getPriorityLevel(a.priorita));
    const pb = ['urgente', 'alta', 'media', 'bassa', 'unknown'].indexOf(getPriorityLevel(b.priorita));
    if (pa !== pb) return pa - pb;
    return new Date(a.dataCreazione).getTime() - new Date(b.dataCreazione).getTime();
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-slate-300 font-bold text-lg uppercase tracking-widest">
          In attesa di presa in carico
        </h2>
        <span className="bg-blue-600 text-white text-sm font-bold px-3 py-1 rounded-full">
          {tickets.length}
        </span>
      </div>

      {tickets.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-3">✅</div>
            <p className="text-green-400 text-xl font-semibold">Nessun ticket in attesa</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
          {sorted.map(ticket => {
            const priority = getPriorityLevel(ticket.priorita);
            const cfg = PRIORITY_CONFIG[priority];
            const sla = getSlaInfo(ticket);
            const slaCls = SLA_CONFIG[sla.status];

            return (
              <div
                key={ticket.id}
                className={`rounded-lg border ${cfg.bg} ${cfg.border} p-3 flex flex-col gap-1 shrink-0`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded ${cfg.badge} text-white`}>
                      {cfg.label}
                    </span>
                    <span className="text-slate-400 text-sm font-mono shrink-0">#{ticket.codice}</span>
                  </div>
                  <span className="text-slate-500 text-sm shrink-0">{formatTimeAgo(ticket.dataCreazione)}</span>
                </div>

                <p className="text-white font-semibold text-base leading-tight truncate">
                  {ticket.titolo}
                </p>

                <div className="flex items-center justify-between">
                  <span className={`text-base font-bold ${cfg.text}`}>
                    {ticket.ragioneSociale}
                  </span>
                  {sla.status !== 'na' && (
                    <span className={`text-sm ${slaCls}`}>
                      {sla.label}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
