'use client';

import type { Ticket, ClientCriticality, PriorityLevel } from '@/app/types';
import { getPriorityLevel } from '@/app/lib/sla';

interface Props { tickets: Ticket[]; }

const PRIORITY_ORDER: PriorityLevel[] = ['urgente', 'alta', 'media', 'bassa', 'unknown'];

const STRIPE: Record<PriorityLevel, string> = {
  urgente: 'var(--urg-stripe)',
  alta:    'var(--alt-stripe)',
  media:   'var(--med-stripe)',
  bassa:   'var(--bas-stripe)',
  unknown: 'var(--border)',
};

function buildClientList(tickets: Ticket[]): ClientCriticality[] {
  const map = new Map<number, ClientCriticality>();
  for (const t of tickets) {
    const id = t.anagrafica_id;
    const existing = map.get(id) ?? { ragioneSociale: t.ragioneSociale, anagrafica_id: id, totalOpen: 0, urgentCount: 0, highCount: 0, maxPriority: 'unknown' as PriorityLevel };
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
      const d = PRIORITY_ORDER.indexOf(a.maxPriority) - PRIORITY_ORDER.indexOf(b.maxPriority);
      return d !== 0 ? d : b.totalOpen - a.totalOpen;
    })
    .slice(0, 7);
}

export default function CriticalClients({ tickets }: Props) {
  const clients = buildClientList(tickets);

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-3)' }}>
          Clienti critici
        </span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', background: 'var(--accent-soft)', color: 'var(--accent)' }}>
          {clients.length}
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
        {clients.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '32px' }}>
            <div style={{ fontSize: '32px' }}>🎉</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--sla-ok)' }}>Nessun cliente critico</div>
          </div>
        ) : clients.map((client, idx) => {
          const stripe = STRIPE[client.maxPriority];
          return (
            <div key={client.anagrafica_id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', boxShadow: 'var(--shadow-sm)', borderTop: '1px solid var(--border)', borderRight: '1px solid var(--border)', borderBottom: '1px solid var(--border)', borderLeft: `4px solid ${stripe}` }}>
              <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', width: 18, flexShrink: 0 }}>
                {String(idx + 1).padStart(2, '0')}
              </span>
              <span style={{ fontSize: '13px', fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>
                {client.ragioneSociale}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                {client.urgentCount > 0 && (
                  <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', background: 'var(--urg-bg)', color: 'var(--urg-text)', border: '1px solid var(--urg-border)' }}>
                    {client.urgentCount} urg
                  </span>
                )}
                <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
                  {client.totalOpen}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
