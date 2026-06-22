'use client';

import type { Ticket, User, TechnicianSummary } from '@/app/types';
import { getAssigneeName, getUserFullName } from '@/app/lib/ydea';
import { getPriorityLevel, formatTimeAgo, isToday } from '@/app/lib/sla';

interface Props {
  inProgressTickets: Ticket[];
  closedToday: Ticket[];
  newTickets: Ticket[];
  users: User[];
}

function buildTechLoad(tickets: Ticket[], users: User[]): TechnicianSummary[] {
  const map = new Map<string, TechnicianSummary>();

  for (const u of users) {
    const name = getUserFullName(u);
    if (!map.has(name)) {
      map.set(name, { name, userId: u.id, ticketCount: 0, urgentCount: 0 });
    }
  }

  for (const ticket of tickets) {
    const name = getAssigneeName(ticket) || 'Non assegnato';
    const existing = map.get(name) ?? { name, ticketCount: 0, urgentCount: 0 };
    existing.ticketCount++;
    if (getPriorityLevel(ticket.priorita) === 'urgente') existing.urgentCount++;
    map.set(name, existing);
  }

  return [...map.values()].sort((a, b) => b.ticketCount - a.ticketCount);
}

export default function TechnicianLoad({ inProgressTickets, closedToday, newTickets, users }: Props) {
  const techLoad = buildTechLoad(inProgressTickets, users);
  const maxLoad = Math.max(1, ...techLoad.map(t => t.ticketCount));

  const recentNew = [...newTickets, ...inProgressTickets]
    .filter(t => {
      const ms = Date.now() - new Date(t.dataCreazione).getTime();
      return ms < 60 * 60_000;
    })
    .sort((a, b) => new Date(b.dataCreazione).getTime() - new Date(a.dataCreazione).getTime())
    .slice(0, 4);

  const openedToday = [...newTickets, ...inProgressTickets].filter(t => isToday(t.dataCreazione)).length;
  const closedTodayCount = closedToday.length;
  const allOpen = newTickets.length + inProgressTickets.length;
  const slaBreached = newTickets.filter(t => {
    const h = (Date.now() - new Date(t.dataCreazione).getTime()) / 3_600_000;
    return h > 8;
  }).length;
  const slaOkPct = allOpen > 0 ? Math.round(((allOpen - slaBreached) / allOpen) * 100) : 100;

  return (
    <div className="flex flex-col h-full gap-3">

      {/* Carico tecnici */}
      <div className="flex-1 bg-slate-800/50 rounded-xl border border-slate-700 p-4 min-h-0">
        <h2 className="text-slate-300 font-bold text-lg uppercase tracking-widest mb-3">
          Carico tecnici
        </h2>
        <div className="flex flex-col gap-2 overflow-y-auto">
          {techLoad.length === 0 ? (
            <p className="text-slate-500 text-sm">Nessun dato</p>
          ) : (
            techLoad.map(tech => (
              <div key={tech.name} className="flex items-center gap-3">
                <span className="text-slate-300 font-medium text-sm w-28 truncate shrink-0">
                  {tech.name}
                </span>
                <div className="flex-1 bg-slate-700 rounded-full h-4 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      tech.urgentCount > 0 ? 'bg-red-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${(tech.ticketCount / maxLoad) * 100}%` }}
                  />
                </div>
                <span className={`text-sm font-bold w-6 text-right shrink-0 ${
                  tech.urgentCount > 0 ? 'text-red-400' : 'text-slate-300'
                }`}>
                  {tech.ticketCount}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Nuovi ultimi 60 min */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
        <h2 className="text-slate-300 font-bold text-base uppercase tracking-widest mb-2">
          Nuovi ultimi 60 min
        </h2>
        {recentNew.length === 0 ? (
          <p className="text-slate-500 text-sm">Nessun nuovo ticket</p>
        ) : (
          <div className="flex flex-col gap-1">
            {recentNew.map(t => (
              <div key={t.id} className="flex items-center justify-between text-sm">
                <span className="text-blue-400 font-mono shrink-0">#{t.codice}</span>
                <span className="text-slate-300 truncate mx-2 flex-1">{t.ragioneSociale}</span>
                <span className="text-slate-500 shrink-0">{formatTimeAgo(t.dataCreazione)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats giornaliere */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-3 text-center">
          <div className="text-3xl font-bold text-blue-400">{openedToday}</div>
          <div className="text-slate-500 text-xs mt-1 uppercase tracking-wide">Aperti oggi</div>
        </div>
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-3 text-center">
          <div className="text-3xl font-bold text-green-400">{closedTodayCount}</div>
          <div className="text-slate-500 text-xs mt-1 uppercase tracking-wide">Chiusi oggi</div>
        </div>
        <div className={`rounded-xl border p-3 text-center ${
          slaOkPct >= 90 ? 'bg-green-900/30 border-green-700' :
          slaOkPct >= 70 ? 'bg-amber-900/30 border-amber-700' :
          'bg-red-900/30 border-red-700'
        }`}>
          <div className={`text-3xl font-bold ${
            slaOkPct >= 90 ? 'text-green-400' :
            slaOkPct >= 70 ? 'text-amber-400' :
            'text-red-400'
          }`}>{slaOkPct}%</div>
          <div className="text-slate-500 text-xs mt-1 uppercase tracking-wide">SLA OK</div>
        </div>
      </div>
    </div>
  );
}
