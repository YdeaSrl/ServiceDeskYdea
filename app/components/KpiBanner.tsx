'use client';

interface Props {
  urgentCount: number;
  inAttesaDaNoiCount: number;
  inVerificaTecnicaCount: number;
  closedTodayCount: number;
  slaOkPct: number;
  apritiSettimana: number;
  apritiMese: number;
}

interface Tile {
  value: number | string;
  label: string;
  color: string;
  bg: string;
  border: string;
  pulse?: boolean;
}

export default function KpiBanner({
  urgentCount,
  inAttesaDaNoiCount,
  inVerificaTecnicaCount,
  closedTodayCount,
  slaOkPct,
  apritiSettimana,
  apritiMese,
}: Props) {
  const slaColor  = slaOkPct >= 90 ? 'var(--sla-ok)' : slaOkPct >= 70 ? 'var(--sla-warn)' : 'var(--sla-breach)';
  const slaBg     = slaOkPct >= 90 ? 'var(--sla-g-bg)' : slaOkPct >= 70 ? 'var(--sla-w-bg)' : 'var(--urg-bg)';
  const slaBorder = slaOkPct >= 90 ? 'var(--sla-g-border)' : slaOkPct >= 70 ? 'var(--sla-w-border)' : 'var(--urg-border)';

  const tiles: Tile[] = [
    {
      value:  urgentCount,
      label:  'Urgenti',
      color:  urgentCount > 0 ? 'var(--sla-breach)' : 'var(--text-3)',
      bg:     urgentCount > 0 ? 'var(--urg-bg)' : 'var(--surface)',
      border: urgentCount > 0 ? 'var(--urg-border)' : 'var(--border)',
      pulse:  urgentCount > 0,
    },
    {
      value:  inAttesaDaNoiCount,
      label:  'In attesa da noi',
      color:  inAttesaDaNoiCount > 0 ? '#D97706' : 'var(--text-3)',
      bg:     'var(--surface)',
      border: 'var(--border)',
    },
    {
      value:  inVerificaTecnicaCount,
      label:  'In verifica tecnica',
      color:  'var(--accent)',
      bg:     'var(--surface)',
      border: 'var(--border)',
    },
    {
      value:  closedTodayCount,
      label:  'Chiusi oggi',
      color:  'var(--sla-ok)',
      bg:     'var(--surface)',
      border: 'var(--border)',
    },
    {
      value:  `${slaOkPct}%`,
      label:  'SLA rispettato',
      color:  slaColor,
      bg:     slaBg,
      border: slaBorder,
    },
    {
      value:  apritiSettimana,
      label:  'Aperti settimana',
      color:  '#7C3AED',
      bg:     'var(--surface)',
      border: 'var(--border)',
    },
    {
      value:  apritiMese,
      label:  'Aperti mese',
      color:  '#0891B2',
      bg:     'var(--surface)',
      border: 'var(--border)',
    },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(7, 1fr)',
      gap: '8px',
      padding: '8px 14px',
      background: 'var(--ground)',
    }}>
      {tiles.map(tile => (
        <div
          key={tile.label}
          style={{
            background: tile.bg,
            border: `1.5px solid ${tile.border}`,
            borderRadius: 'var(--radius)',
            padding: '10px 8px 8px',
            textAlign: 'center',
            boxShadow: 'var(--shadow)',
            animation: tile.pulse ? 'chip-urgency 2s ease-in-out infinite' : undefined,
          }}
        >
          <div style={{
            fontFamily: 'var(--mono)',
            fontSize: '44px',
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: '-0.03em',
            color: tile.color,
          }}>
            {tile.value}
          </div>
          <div style={{
            fontSize: '9px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--text-3)',
            marginTop: '5px',
          }}>
            {tile.label}
          </div>
        </div>
      ))}
    </div>
  );
}
