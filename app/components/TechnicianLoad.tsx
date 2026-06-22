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
    if (!map.has(name)) map.set(name, { name, userId: u.id, ticketCount: 0, urgentCount: 0 });
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

function initials(name: string): string {
  return name.trim().split(/\s+/).map(w => w[0] ?? '').join('').toUpperCase().slice(0, 2);
}

function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', overflow: 'hidden', ...style }}>
      {children}
    </div>
  );
}

function PanelHead({ label, count }: { label: string; count?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
      <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-3)' }}>
        {label}
      </span>
      {count !== undefined && (
        <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', background: 'var(--accent-soft)', color: 'var(--accent)' }}>
          {count}
        </span>
      )}
    </div>
  );
}

export default function TechnicianLoad({ inProgressTickets, closedToday, newTickets, users }: Props) {
  const techLoad = buildTechLoad(inProgressTickets, users);
  const maxLoad = Math.max(1, ...techLoad.map(t => t.ticketCount));

  const recentNew = [...newTickets, ...inProgressTickets]
    .filter(t => Date.now() - new Date(t.dataCreazione).getTime() < 3_600_000)
    .sort((a, b) => new Date(b.dataCreazione).getTime() - new Date(a.dataCreazione).getTime())
    .slice(0, 4);

  const openedToday = [...newTickets, ...inProgressTickets].filter(t => isToday(t.dataCreazione)).length;
  const closedTodayCount = closedToday.length;
  const allOpen = newTickets.length + inProgressTickets.length;
  const breachCount = newTickets.filter(t => (Date.now() - new Date(t.dataCreazione).getTime()) / 3_600_000 > 8).length;
  const slaOkPct = allOpen > 0 ? Math.round(((allOpen - breachCount) / allOpen) * 100) : 100;

  const slaStyle = slaOkPct >= 90
    ? { background: 'var(--sla-g-bg)', border: `1px solid var(--sla-g-border)`, color: 'var(--sla-ok)' }
    : slaOkPct >= 70
    ? { background: 'var(--sla-w-bg)', border: `1px solid var(--sla-w-border)`, color: 'var(--sla-warn)' }
    : { background: 'var(--urg-bg)', border: `1px solid var(--urg-border)`, color: 'var(--sla-breach)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '12px' }}>

      {/* Carico tecnici */}
      <Panel style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <PanelHead label="Carico tecnici" />
        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' }}>
          {techLoad.map(tech => {
            const hasUrgent = tech.urgentCount > 0;
            const isIdle = tech.ticketCount === 0;
            return (
              <div key={tech.name} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  border: `1.5px solid ${hasUrgent ? 'var(--urg-border)' : 'var(--border)'}`,
                  background: hasUrgent ? 'var(--urg-bg)' : 'var(--accent-soft)',
                  color: hasUrgent ? 'var(--urg-text)' : 'var(--accent)',
                  letterSpacing: 0,
                }}>
                  {initials(tech.name)}
                </div>
                <span style={{ fontSize: '12px', fontWeight: 500, width: 70, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>
                  {tech.name.split(' ')[0]}
                </span>
                <div style={{ flex: 1, height: 7, background: 'var(--surface-2)', borderRadius: 4, overflow: 'hidden', border: '1px solid var(--border)' }}>
                  {!isIdle && (
                    <div style={{
                      height: '100%', borderRadius: 4,
                      width: `${(tech.ticketCount / maxLoad) * 100}%`,
                      transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)',
                      background: hasUrgent
                        ? 'linear-gradient(90deg, #DC2626, #F87171)'
                        : 'linear-gradient(90deg, #4F46E5, #818CF8)',
                    }} />
                  )}
                </div>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '13px', fontWeight: 700, width: 18, textAlign: 'right', color: 'var(--text)', flexShrink: 0 }}>
                  {tech.ticketCount}
                </span>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* Nuovi ultimi 60 min */}
      <Panel>
        <PanelHead label="Nuovi ultimi 60 min" count={recentNew.length} />
        <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {recentNew.length === 0 ? (
            <span style={{ fontSize: '11px', color: 'var(--text-3)', padding: '4px' }}>Nessun nuovo ticket</span>
          ) : recentNew.map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 8px', borderRadius: 6, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--accent)', flexShrink: 0 }}>#{t.codice}</span>
              <span style={{ fontSize: '11px', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>{t.ragioneSociale}</span>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text-3)', flexShrink: 0 }}>{formatTimeAgo(t.dataCreazione)}</span>
            </div>
          ))}
        </div>
      </Panel>

      {/* KPI tiles */}
      <Panel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', padding: '10px' }}>
          {[
            { n: openedToday, l: 'Aperti oggi', nc: '#2563EB', ts: {} },
            { n: closedTodayCount, l: 'Chiusi oggi', nc: 'var(--sla-ok)', ts: {} },
            { n: `${slaOkPct}%`, l: 'SLA OK', nc: slaStyle.color, ts: { background: slaStyle.background, border: slaStyle.border } },
          ].map(({ n, l, nc, ts }) => (
            <div key={l} style={{ borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', padding: '12px 8px', textAlign: 'center', background: 'var(--surface)', boxShadow: 'var(--shadow-sm)', ...ts }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '38px', fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em', color: nc }}>{n}</div>
              <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)', marginTop: '4px' }}>{l}</div>
            </div>
          ))}
        </div>
      </Panel>

    </div>
  );
}
