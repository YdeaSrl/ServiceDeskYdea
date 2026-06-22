'use client';

import type { Ticket } from '@/app/types';
import { getSlaInfo, getPriorityLevel, formatTimeAgo } from '@/app/lib/sla';

type PriKey = 'urgente' | 'alta' | 'media' | 'bassa' | 'unknown';

const PRI: Record<PriKey, { stripe: string; bg: string; border: string; text: string; label: string }> = {
  urgente: { stripe: 'var(--urg-stripe)', bg: 'var(--urg-bg)', border: 'var(--urg-border)', text: 'var(--urg-text)', label: 'Urgente' },
  alta:    { stripe: 'var(--alt-stripe)', bg: 'var(--alt-bg)', border: 'var(--alt-border)', text: 'var(--alt-text)', label: 'Alta' },
  media:   { stripe: 'var(--med-stripe)', bg: 'var(--med-bg)', border: 'var(--med-border)', text: 'var(--med-text)', label: 'Media' },
  bassa:   { stripe: 'var(--bas-stripe)', bg: 'var(--bas-bg)', border: 'var(--bas-border)', text: 'var(--bas-text)', label: 'Bassa' },
  unknown: { stripe: 'var(--border)',     bg: 'var(--surface-2)', border: 'var(--border)', text: 'var(--text-3)', label: '—' },
};

const SLA_PILL: Record<string, React.CSSProperties> = {
  breach:  { background: 'var(--urg-bg)', color: 'var(--urg-text)' },
  warning: { background: 'var(--sla-w-bg)', color: 'var(--sla-w-text)' },
  ok:      { background: 'transparent', color: 'var(--text-3)' },
};

interface Props { tickets: Ticket[]; }

export default function NewTicketsQueue({ tickets }: Props) {
  const PRI_ORDER: PriKey[] = ['urgente', 'alta', 'media', 'bassa', 'unknown'];

  const sorted = [...tickets].sort((a, b) => {
    const pa = PRI_ORDER.indexOf((getPriorityLevel(a.priorita) as PriKey) || 'unknown');
    const pb = PRI_ORDER.indexOf((getPriorityLevel(b.priorita) as PriKey) || 'unknown');
    if (pa !== pb) return pa - pb;
    return new Date(a.dataCreazione).getTime() - new Date(b.dataCreazione).getTime();
  });

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-3)' }}>
          In attesa di presa in carico
        </span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', background: 'var(--accent-soft)', color: 'var(--accent)' }}>
          {tickets.length}
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
        {sorted.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '32px' }}>
            <div style={{ fontSize: '32px' }}>✅</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--sla-ok)' }}>Nessun ticket in attesa</div>
          </div>
        ) : sorted.map(ticket => {
          const p = (PRI[getPriorityLevel(ticket.priorita) as PriKey] ? getPriorityLevel(ticket.priorita) as PriKey : 'unknown');
          const cfg = PRI[p];
          const sla = getSlaInfo(ticket);

          return (
            <div key={ticket.id} style={{ display: 'flex', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden', flexShrink: 0, borderTop: '1px solid var(--border)', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', borderLeft: `4px solid ${cfg.stripe}` }}>
              <div style={{ padding: '9px 12px', flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '2px 6px', borderRadius: '4px', border: `1px solid ${cfg.border}`, background: cfg.bg, color: cfg.text, flexShrink: 0 }}>
                    {cfg.label}
                  </span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text-3)', flexShrink: 0 }}>
                    #{ticket.codice}
                  </span>
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text-3)', marginLeft: 'auto', flexShrink: 0 }}>
                    {formatTimeAgo(ticket.dataCreazione)}
                  </span>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {ticket.titolo}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: cfg.text }}>
                    {ticket.ragioneSociale}
                  </span>
                  {sla.status !== 'na' && (
                    <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px', flexShrink: 0, whiteSpace: 'nowrap', ...SLA_PILL[sla.status] }}>
                      {sla.label}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
