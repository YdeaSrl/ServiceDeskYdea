'use client';

import type { Ticket, ClientCriticality, PriorityLevel } from '@/app/types';
import { getPriorityLevel } from '@/app/lib/sla';

interface Props {
  tickets: Ticket[];
}

const PRIORITY_ORDER: PriorityLevel[] = ['urgente', 'alta', 'media', 'bassa', 'unknown'];

const PRIORITY_BADGE: Record<PriorityLevel, string> = {
  urgente: 'bg-red-600 text-white',
  alta:    'bg-orange-600 text-white',
  media:   'bg-yellow-600 text-white',
  bassa:   'bg-slate-600 text-white',
  unknown: 'bg-slate-700 text-slate-300',
};

const PRIORITY_DOT: Record<PriorityLevel, string> = {
  urgente: '🔴',
  alta:    '🟠',
  media:   '🟡',
  bassa:   '🟢',
  unknown: '⚪',
};

function buildClientList(tickets: Ticket[]): ClientCriticality[] {
  const map = new Map<number, ClientCriticality>();

  for (const t of tickets) {
    const id = t.anagrafica_id;
    const existing = map.get(id) ?? {
      ragioneSociale: t.ragioneSociale,
      anagrafica_id: id,
      totalOpen: 0,
      urgentCount: 0,
      highCount: 0,
      maxPriority: 'unknown' as PriorityLevel,
    };
    existing.totalOpen++;
    const level = getPriorityLevel(t.priorita);
    if (level === 'urgente') existing.urgentCount++;
    if (level === 'alta') existing.highCount++;
    const currIdx = PRIORITY_ORDER.indexOf(existing.maxPriority);
    const newIdx  = PRIORITY_ORDER.indexOf(level);
    if (newIdx < currIdx) existing.maxPriority = level;
    map.set(id, existing);
  }

  return [...map.values()]
    .sort((a, b) => {
      const idxA = PRIORITY_ORDER.indexOf(a.maxPriority);
      const idxB = PRIORITY_ORDER.indexOf(b.maxPriority);
      if (idxA !== idxB) return idxA - idxB;
      return b.totalOpen - a.totalOpen;
    })
    .slice(0, 7);
}

export default function CriticalClients({ tickets }: Props) {
  const clients = buildClientList(tickets);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-slate-300 font-bold text-lg uppercase tracking-widest">
          Clienti critici
        </h2>
        <span className="text-slate-500 text-sm">{clients.length} clienti</span>
      </div>

      {clients.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-3">🎉</div>
            <p className="text-green-400 text-xl font-semibold">Nessun cliente critico</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-2">
          {clients.map((client, idx) => (
            <div
              key={client.anagrafica_id}
              className={`rounded-lg border p-3 flex items-center gap-3 ${
                client.maxPriority === 'urgente'
                  ? 'bg-red-900/30 border-red-700'
                  : client.maxPriority === 'alta'
                  ? 'bg-orange-900/20 border-orange-800'
                  : 'bg-slate-800/60 border-slate-700'
              }`}
            >
              <span className="text-slate-600 font-bold text-sm w-5 shrink-0">{idx + 1}.</span>
              <span className="text-lg shrink-0">{PRIORITY_DOT[client.maxPriority]}</span>
              <span className="text-white font-semibold text-base flex-1 truncate">
                {client.ragioneSociale}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                {client.urgentCount > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-600 text-white">
                    {client.urgentCount} urg
                  </span>
                )}
                <span className={`text-sm font-bold px-2 py-0.5 rounded ${PRIORITY_BADGE[client.maxPriority]}`}>
                  {client.totalOpen} ticket
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
