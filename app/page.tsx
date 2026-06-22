'use client';

import { useDashboard } from '@/app/hooks/useDashboard';
import { useTheme } from '@/app/components/ThemeProvider';
import AlarmBanner from '@/app/components/AlarmBanner';
import NewTicketsQueue from '@/app/components/NewTicketsQueue';
import TechnicianLoad from '@/app/components/TechnicianLoad';
import CriticalClients from '@/app/components/CriticalClients';
import LiveClock from '@/app/components/LiveClock';
import { getPriorityLevel } from '@/app/lib/sla';

export default function DashboardPage() {
  const { data, loading, secondsUntilRefresh, newTickets, inProgressTickets } = useDashboard();
  const { theme, toggle } = useTheme();

  const urgentCount = data.tickets.filter(t => getPriorityLevel(t.priorita) === 'urgente').length;

  return (
    <div style={{ display: 'grid', gridTemplateRows: '60px auto 1fr 36px', height: '100vh', background: 'var(--ground)' }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', padding: '0 20px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', zIndex: 20 }}>

        {/* Left: brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--sla-ok)', animation: 'live-pulse 2s ease-in-out infinite', flexShrink: 0 }} />
          <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-2)' }}>
            Service Desk
          </span>
          {data.isMock && (
            <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', padding: '2px 6px', borderRadius: '4px', background: 'var(--demo-bg)', color: 'var(--demo-color)', border: '1px solid var(--demo-border)', textTransform: 'uppercase' }}>
              Demo
            </span>
          )}
        </div>

        {/* Center: clock */}
        <LiveClock />

        {/* Right: KPI chips + theme toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
          <KpiChip value={data.tickets.length} label="Aperti" />
          <KpiChip value={newTickets.length} label="In coda" />
          {urgentCount > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, border: '1px solid var(--urg-border)', background: 'var(--urg-bg)', color: 'var(--urg-text)', whiteSpace: 'nowrap', animation: 'chip-urgency 2s ease-in-out infinite' }}>
              <b style={{ fontFamily: 'var(--mono)', fontSize: '14px', fontWeight: 700 }}>{urgentCount}</b> Urgenti
            </span>
          )}
          <button
            onClick={toggle}
            aria-label="Cambia tema"
            style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--surface-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', flexShrink: 0, transition: 'background 0.15s' }}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {/* ── SLA Alarm Banner ────────────────────────────────────────────── */}
      <AlarmBanner newTickets={newTickets} />

      {/* ── Main Grid ───────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>Caricamento…</div>
        </div>
      ) : (
        <main style={{ display: 'grid', gridTemplateColumns: '38fr 28fr 34fr', gap: '14px', padding: '14px', minHeight: 0, overflow: 'hidden' }}>
          <section style={{ minHeight: 0 }}>
            <NewTicketsQueue tickets={newTickets} />
          </section>
          <section style={{ minHeight: 0 }}>
            <TechnicianLoad
              inProgressTickets={inProgressTickets}
              closedToday={data.closedToday}
              newTickets={newTickets}
              users={data.users}
            />
          </section>
          <section style={{ minHeight: 0 }}>
            <CriticalClients tickets={data.tickets} />
          </section>
        </main>
      )}

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text-3)' }}>YDEA CRM v1.0</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: 'var(--text-2)' }}>
          {data.fetchError ? (
            <span style={{ fontSize: '11px', color: 'var(--sla-breach)', fontWeight: 600 }}>⚠ {data.fetchError}</span>
          ) : (
            <>
              <span>
                Aggiornato alle{' '}
                <b style={{ fontFamily: 'var(--mono)', color: 'var(--text)' }}>
                  {new Date(data.lastUpdated).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                </b>
              </span>
              <div style={{ width: 72, height: 2, background: 'var(--border)', borderRadius: 1, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: 'var(--accent)', borderRadius: 1, width: `${(secondsUntilRefresh / 60) * 100}%`, transition: 'width 1s linear' }} />
              </div>
              <span>
                Refresh in{' '}
                <b style={{ fontFamily: 'var(--mono)', color: secondsUntilRefresh <= 10 ? 'var(--sla-warn)' : 'var(--text)' }}>
                  {secondsUntilRefresh}s
                </b>
              </span>
            </>
          )}
        </div>

        <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text-3)', visibility: 'hidden' }}>YDEA CRM v1.0</span>
      </footer>
    </div>
  );
}

function KpiChip({ value, label }: { value: number; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-2)', whiteSpace: 'nowrap' }}>
      <b style={{ fontFamily: 'var(--mono)', fontSize: '14px', color: 'var(--text)', fontWeight: 700 }}>{value}</b> {label}
    </span>
  );
}
