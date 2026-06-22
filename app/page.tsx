'use client';

import { useDashboard } from '@/app/hooks/useDashboard';
import AlarmBanner from '@/app/components/AlarmBanner';
import NewTicketsQueue from '@/app/components/NewTicketsQueue';
import TechnicianLoad from '@/app/components/TechnicianLoad';
import CriticalClients from '@/app/components/CriticalClients';
import LiveClock from '@/app/components/LiveClock';
import { getPriorityLevel } from '@/app/lib/sla';

export default function DashboardPage() {
  const { data, loading, secondsUntilRefresh, newTickets, inProgressTickets } = useDashboard();

  const urgentCount = data.tickets.filter(t => getPriorityLevel(t.priorita) === 'urgente').length;

  return (
    <div className="flex flex-col h-screen bg-[#080d14] overflow-hidden">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-5 py-3 bg-[#0d1520] border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-slate-400 font-semibold text-sm uppercase tracking-widest">
            Service Desk — Dashboard Live
          </span>
        </div>

        <LiveClock />

        <div className="flex items-center gap-4 text-sm">
          {urgentCount > 0 && (
            <span className="bg-red-700 text-white font-bold px-3 py-1 rounded-full animate-pulse">
              {urgentCount} URGENTI
            </span>
          )}
          <span className="text-slate-400">
            Aperti: <span className="text-white font-bold text-lg">{data.tickets.length}</span>
          </span>
          <span className="text-slate-400">
            In coda: <span className="text-blue-400 font-bold text-lg">{newTickets.length}</span>
          </span>
        </div>
      </header>

      {/* ── SLA Alarm Banner ────────────────────────────────────────── */}
      <AlarmBanner newTickets={newTickets} />

      {/* ── Main Grid ───────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400 text-xl">Caricamento dati in corso…</p>
          </div>
        </div>
      ) : (
        <main className="flex-1 grid grid-cols-[38%_28%_34%] gap-3 p-3 min-h-0">

          {/* Colonna 1 — In attesa di presa in carico */}
          <section className="bg-[#0d1520] rounded-xl border border-slate-800 p-4 min-h-0 flex flex-col">
            <NewTicketsQueue tickets={newTickets} />
          </section>

          {/* Colonna 2 — Carico tecnici + nuovi + stats */}
          <section className="min-h-0 flex flex-col">
            <TechnicianLoad
              inProgressTickets={inProgressTickets}
              closedToday={data.closedToday}
              newTickets={newTickets}
              users={data.users}
            />
          </section>

          {/* Colonna 3 — Clienti critici */}
          <section className="bg-[#0d1520] rounded-xl border border-slate-800 p-4 min-h-0 flex flex-col">
            <CriticalClients tickets={data.tickets} />
          </section>
        </main>
      )}

      {/* ── Status Bar ──────────────────────────────────────────────── */}
      <footer className="flex items-center justify-between px-5 py-2 bg-[#0d1520] border-t border-slate-800 shrink-0 text-sm">
        <span className="text-slate-600 text-xs">YDEA CRM</span>

        <div className="flex items-center gap-4">
          {data.fetchError ? (
            <span className="text-red-400 font-semibold">⚠ {data.fetchError}</span>
          ) : (
            <>
              <span className="text-slate-500">
                Aggiornato alle{' '}
                <span className="text-slate-300 font-mono">
                  {new Date(data.lastUpdated).toLocaleTimeString('it-IT')}
                </span>
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-500">
                Prossimo refresh in{' '}
                <span className={`font-mono font-bold ${secondsUntilRefresh <= 10 ? 'text-amber-400' : 'text-slate-300'}`}>
                  {secondsUntilRefresh}s
                </span>
              </span>
            </>
          )}
        </div>

        <span className="text-slate-600 text-xs">v1.0</span>
      </footer>
    </div>
  );
}
