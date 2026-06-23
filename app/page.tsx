'use client';

import { useRouter } from 'next/navigation';
import { useDashboard } from '@/app/hooks/useDashboard';
import { useTheme } from '@/app/components/ThemeProvider';
import AlarmBanner from '@/app/components/AlarmBanner';
import KpiBanner from '@/app/components/KpiBanner';
import NewTicketsQueue from '@/app/components/NewTicketsQueue';
import TechnicianLoad from '@/app/components/TechnicianLoad';
import CriticalClients from '@/app/components/CriticalClients';
import LiveClock from '@/app/components/LiveClock';
import { isUrgentActive, getSlaInfo } from '@/app/lib/sla';

export default function DashboardPage() {
  const router = useRouter();
  const { data, loading, secondsUntilRefresh, newTickets, inProgressTickets, inAttesaDaNoiTickets, inVerificaTecnicaTickets } = useDashboard();
  const { theme, toggle } = useTheme();

  const urgentActiveCount = data.tickets.filter(t => isUrgentActive(t)).length;
  const breachCount = newTickets.filter(t => getSlaInfo(t).status === 'breach').length;
  const allOpen = newTickets.length + inProgressTickets.length;
  const slaOkPct = allOpen > 0 ? Math.round(((allOpen - breachCount) / allOpen) * 100) : 100;

  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const apritiSettimana = data.tickets.filter(t => new Date(t.dataCreazione) >= monday).length;
  const apritiMese = data.tickets.filter(t => new Date(t.dataCreazione) >= firstOfMonth).length;

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
  }

  return (
    <div style={{ display: 'grid', gridTemplateRows: '60px auto auto 1fr 36px', height: '100vh', background: 'var(--ground)' }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', padding: '0 20px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', zIndex: 20 }}>

        {/* Left: brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://www.ydea.cloud/wp-content/uploads/2023/06/logo_ydea_blu.svg"
            alt="YDEA"
            style={{ height: 26, width: 'auto', flexShrink: 0 }}
          />
          <div style={{ width: 1, height: 18, background: 'var(--border)', flexShrink: 0 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--sla-ok)', animation: 'live-pulse 2s ease-in-out infinite', flexShrink: 0 }} />
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-2)' }}>
              Service Desk
            </span>
          </div>
          {data.isMock && (
            <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', padding: '2px 6px', borderRadius: '4px', background: 'var(--demo-bg)', color: 'var(--demo-color)', border: '1px solid var(--demo-border)', textTransform: 'uppercase' }}>
              Demo
            </span>
          )}
        </div>

        {/* Center: clock */}
        <LiveClock />

        {/* Right: actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
          <button
            onClick={() => router.push('/settings')}
            aria-label="Impostazioni"
            title="Impostazioni"
            style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--surface-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', flexShrink: 0, transition: 'background 0.15s' }}
          >
            ⚙
          </button>
          <button
            onClick={toggle}
            aria-label="Cambia tema"
            style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--surface-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', flexShrink: 0, transition: 'background 0.15s' }}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button
            onClick={handleLogout}
            aria-label="Disconnetti"
            title="Disconnetti"
            style={{ padding: '0 12px', height: 34, borderRadius: '17px', border: '1px solid var(--border)', background: 'var(--surface-2)', cursor: 'pointer', fontSize: '11px', fontWeight: 600, color: 'var(--text-3)', flexShrink: 0, transition: 'background 0.15s' }}
          >
            Esci
          </button>
        </div>
      </header>

      {/* ── SLA Alarm Banner ────────────────────────────────────────────── */}
      <AlarmBanner newTickets={newTickets} />

      {/* ── KPI Banner ──────────────────────────────────────────────────── */}
      <KpiBanner
        urgentCount={urgentActiveCount}
        inAttesaDaNoiCount={inAttesaDaNoiTickets.length}
        inVerificaTecnicaCount={inVerificaTecnicaTickets.length}
        closedTodayCount={data.closedToday.length}
        slaOkPct={slaOkPct}
        apritiSettimana={apritiSettimana}
        apritiMese={apritiMese}
      />

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
