'use client';

interface Props {
  urgentCount: number;
  inQueueCount: number;
  inProgressCount: number;
  closedTodayCount: number;
  slaOkPct: number;
}

interface Tile {
  value: number | string;
  label: string;
  color: string;
  bg: string;
  border: string;
  pulse?: boolean;
}

export default function KpiBanner({ urgentCount, inQueueCount, inProgressCount, closedTodayCount, slaOkPct }: Props) {
  const slaColor = slaOkPct >= 90 ? 'var(--sla-ok)' : slaOkPct >= 70 ? 'var(--sla-warn)' : 'var(--sla-breach)';
  const slaBg    = slaOkPct >= 90 ? 'var(--sla-g-bg)' : slaOkPct >= 70 ? 'var(--sla-w-bg)' : 'var(--urg-bg)';
  const slaBorder = slaOkPct >= 90 ? 'var(--sla-g-border)' : slaOkPct >= 70 ? 'var(--sla-w-border)' : 'var(--urg-border)';

  const tiles: Tile[] = [
    {
      value: urgentCount,
      label: 'Urgenti',
      color: urgentCount > 0 ? 'var(--sla-breach)' : 'var(--text-3)',
      bg: urgentCount > 0 ? 'var(--urg-bg)' : 'var(--surface)',
      border: urgentCount > 0 ? 'var(--urg-border)' : 'var(--border)',
      pulse: urgentCount > 0,
    },
    {
      value: inQueueCount,
      label: 'In attesa',
      color: inQueueCount > 0 ? 'var(--accent)' : 'var(--text-3)',
      bg: 'var(--surface)',
      border: 'var(--border)',
    },
    {
      value: inProgressCount,
      label: 'In lavorazione',
      color: '#2563EB',
      bg: 'var(--surface)',
      border: 'var(--border)',
    },
    {
      value: closedTodayCount,
      label: 'Chiusi oggi',
      color: 'var(--sla-ok)',
      bg: 'var(--surface)',
      border: 'var(--border)',
    },
    {
      value: `${slaOkPct}%`,
      label: 'SLA rispettato',
      color: slaColor,
      bg: slaBg,
      border: slaBorder,
    },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      gap: '10px',
      padding: '10px 14px',
      background: 'var(--ground)',
    }}>
      {tiles.map(tile => (
        <div
          key={tile.label}
          style={{
            background: tile.bg,
            border: `1.5px solid ${tile.border}`,
            borderRadius: 'var(--radius)',
            padding: '14px 12px 12px',
            textAlign: 'center',
            boxShadow: 'var(--shadow)',
            animation: tile.pulse ? 'chip-urgency 2s ease-in-out infinite' : undefined,
          }}
        >
          <div style={{
            fontFamily: 'var(--mono)',
            fontSize: '54px',
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: '-0.03em',
            color: tile.color,
          }}>
            {tile.value}
          </div>
          <div style={{
            fontSize: '10px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: 'var(--text-3)',
            marginTop: '6px',
          }}>
            {tile.label}
          </div>
        </div>
      ))}
    </div>
  );
}
