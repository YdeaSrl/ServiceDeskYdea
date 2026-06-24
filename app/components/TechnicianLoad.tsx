'use client';

import type { Ticket, User, TechnicianSummary } from '@/app/types';
import { getAssigneeName, getUserFullName } from '@/app/lib/ydea';
import { getPriorityLevel, formatTimeAgo, isNewState, isClosedState } from '@/app/lib/sla';

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

  const recentNew = [...newTickets, ...inProgressTickets, ...closedToday]
    .filter(t => Date.now() - new Date(t.dataCreazione).getTime() < 3_600_000)
    .sort((a, b) => new Date(b.dataCreazione).getTime() - new Date(a.dataCreazione).getTime())
    .filter((t, i, arr) => arr.findIndex(x => x.id === t.id) === i)
    .slice(0, 8);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '12px' }}>

      {/* Carico tecnici */}
      <Panel style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <PanelHead label="Carico tecnici" />
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {techLoad.filter(t => t.ticketCount > 0).map(tech => {
            const hasUrgent = tech.urgentCount > 0;
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
                  <div style={{
                    height: '100%', borderRadius: 4,
                    width: `${(tech.ticketCount / maxLoad) * 100}%`,
                    transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)',
                    background: hasUrgent
                      ? 'linear-gradient(90deg, #DC2626, #F87171)'
                      : 'linear-gradient(90deg, var(--accent), var(--accent-mid))',
                  }} />
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
      <Panel style={{ flex: 1.4, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <PanelHead label="Nuovi ultimi 60 min" count={recentNew.length} />
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {recentNew.length === 0 ? (
            <span style={{ fontSize: '11px', color: 'var(--text-3)', padding: '4px' }}>Nessun nuovo ticket</span>
          ) : recentNew.map(t => {
            const isClosed = isClosedState(t.stato);
            const isNew = isNewState(t.stato);
            const stateColor = isClosed
              ? { bg: 'rgba(22,163,74,0.08)', border: 'rgba(22,163,74,0.25)', dot: '#16a34a' }
              : isNew
                ? { bg: 'rgba(220,38,38,0.08)', border: 'rgba(220,38,38,0.25)', dot: '#dc2626' }
                : { bg: 'rgba(217,119,6,0.08)', border: 'rgba(217,119,6,0.25)', dot: '#d97706' };
            return (
              <div key={t.id} title={t.stato} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 8px', borderRadius: 6, background: stateColor.bg, border: `1px solid ${stateColor.border}` }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: stateColor.dot, flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--accent)', flexShrink: 0 }}>#{t.codice}</span>
                <span style={{ fontSize: '11px', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)', minWidth: 0 }}>
                  {t.ragioneSociale}
                  <span style={{ fontWeight: 400, color: 'var(--text-3)' }}> · {t.stato}</span>
                </span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text-3)', flexShrink: 0 }}>{formatTimeAgo(t.dataCreazione)}</span>
              </div>
            );
          })}
        </div>
      </Panel>

    </div>
  );
}
