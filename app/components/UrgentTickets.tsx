'use client';

import type { Ticket } from '@/app/types';
import { getPriorityLevel, formatTimeAgo } from '@/app/lib/sla';
import { getAssigneeName } from '@/app/lib/ydea';

interface Props { tickets: Ticket[]; }

const PRIORITY_COLOR: Record<string, string> = {
  urgente: 'var(--sla-breach)',
  alta:    '#EA580C',
  media:   '#D97706',
  bassa:   'var(--text-3)',
  unknown: 'var(--text-3)',
};

export default function UrgentTickets({ tickets }: Props) {
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--urg-border)', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', flex: '0 0 auto', maxHeight: '48%', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--sla-breach)' }}>
          Ticket urgenti attivi
        </span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', background: tickets.length > 0 ? 'var(--urg-bg)' : 'var(--surface-2)', color: tickets.length > 0 ? 'var(--urg-text)' : 'var(--text-3)', border: `1px solid ${tickets.length > 0 ? 'var(--urg-border)' : 'var(--border)'}` }}>
          {tickets.length}
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {tickets.length === 0 ? (
          <div style={{ padding: '16px 0', textAlign: 'center', fontSize: '11px', color: 'var(--text-3)' }}>
            Nessun ticket urgente attivo
          </div>
        ) : tickets.map(t => {
          const level = getPriorityLevel(t.priorita);
          const assignee = getAssigneeName(t);
          return (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', borderRadius: 6, background: 'var(--urg-bg)', border: '1px solid var(--urg-border)' }}>
              <div style={{ width: 3, height: 28, borderRadius: 2, background: PRIORITY_COLOR[level] ?? 'var(--urg-stripe)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '11px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>
                  {t.ragioneSociale}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.titolo}
                </div>
                <div style={{ fontSize: '9px', fontWeight: 600, color: 'var(--text-3)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {t.stato}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', flexShrink: 0 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--accent)' }}>#{t.codice}</span>
                {assignee && (
                  <span style={{ fontSize: '9px', color: 'var(--text-3)' }}>{assignee.split(' ')[0]}</span>
                )}
                <span style={{ fontFamily: 'var(--mono)', fontSize: '9px', color: 'var(--text-3)' }}>{formatTimeAgo(t.dataCreazione)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
