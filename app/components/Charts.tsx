'use client';

import { useEffect, useState } from 'react';
import type { ChartsData } from '@/app/types';

const CHART_COLORS = ['#009FE3', '#059669', '#EA580C', '#7C3AED', '#E11D48'];

function MiniLineChart({
  title,
  series,
  labels,
  colors,
}: {
  title: string;
  series: { name: string; values: number[] }[];
  labels: string[];
  colors: string[];
}) {
  const W = 500, H = 90;
  const MT = 10, MR = 12, MB = 22, ML = 28;
  const pw = W - ML - MR;
  const ph = H - MT - MB;

  const allVals = series.flatMap(s => s.values);
  const maxV = Math.max(1, ...allVals);
  const n = labels.length;

  const xPos = (i: number) => ML + (n <= 1 ? pw / 2 : (i / (n - 1)) * pw);
  const yPos = (v: number) => MT + ph - (v / maxV) * ph;

  return (
    <div style={{
      flex: 1, minWidth: 0,
      background: 'var(--surface)',
      borderRadius: 'var(--radius)',
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow)',
      padding: '8px 10px',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-3)' }}>
          {title}
        </span>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {series.map((s, i) => (
            <span key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '8px', fontWeight: 600, color: 'var(--text-2)' }}>
              <span style={{ width: 10, height: 2, background: colors[i % colors.length], borderRadius: 1, display: 'inline-block', flexShrink: 0 }} />
              {s.name}
            </span>
          ))}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ flex: 1, minHeight: 0, width: '100%', height: '100%' }}
        preserveAspectRatio="none"
      >
        {/* Horizontal grid lines */}
        {[0, 0.5, 1].map(f => (
          <line
            key={f}
            x1={ML} y1={MT + f * ph}
            x2={W - MR} y2={MT + f * ph}
            stroke="var(--border)" strokeWidth={0.5}
          />
        ))}

        {/* Area fills */}
        {series.map((s, si) => {
          const pts = s.values.map((v, i) => `${xPos(i)},${yPos(v)}`);
          const d = `M ${xPos(0)},${H - MB} L ${pts.join(' L ')} L ${xPos(n - 1)},${H - MB} Z`;
          return <path key={si} d={d} fill={colors[si % colors.length]} opacity={0.08} />;
        })}

        {/* Lines */}
        {series.map((s, si) => (
          <polyline
            key={si}
            points={s.values.map((v, i) => `${xPos(i)},${yPos(v)}`).join(' ')}
            fill="none"
            stroke={colors[si % colors.length]}
            strokeWidth={1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}

        {/* Dots */}
        {series.map((s, si) => s.values.map((v, i) => (
          <circle
            key={`${si}-${i}`}
            cx={xPos(i)} cy={yPos(v)} r={2.5}
            fill={colors[si % colors.length]}
            stroke="var(--surface)" strokeWidth={1}
          />
        )))}

        {/* X-axis labels */}
        {labels.map((l, i) => (
          <text
            key={l}
            x={xPos(i)} y={H - 4}
            textAnchor="middle"
            fontSize={7.5}
            fill="var(--text-3)"
          >
            {l}
          </text>
        ))}

        {/* Y max */}
        <text x={ML - 3} y={MT} textAnchor="end" dominantBaseline="hanging" fontSize={7} fill="var(--text-3)">
          {maxV}
        </text>
        <text x={ML - 3} y={H - MB} textAnchor="end" dominantBaseline="auto" fontSize={7} fill="var(--text-3)">
          0
        </text>
      </svg>
    </div>
  );
}

function Skeleton() {
  return (
    <div style={{ flex: 1, minWidth: 0, background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>Caricamento grafici…</span>
    </div>
  );
}

export default function Charts() {
  const [data, setData] = useState<ChartsData | null>(null);

  useEffect(() => {
    fetch('/api/charts')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d && !d.error) setData(d); })
      .catch(() => {});
  }, []);

  if (!data) {
    return (
      <div style={{ display: 'flex', gap: '12px', height: '100%', padding: '0 14px 14px' }}>
        <Skeleton /><Skeleton />
      </div>
    );
  }

  const { monthly, byType, types, months } = data;

  const chart1Series = [
    { name: 'Aperti', values: monthly.map(p => p.opened) },
    { name: 'Chiusi', values: monthly.map(p => p.closed) },
  ];

  const chart2Series = types.map(t => ({ name: t, values: byType[t] ?? months.map(() => 0) }));

  return (
    <div style={{ display: 'flex', gap: '12px', height: '100%', padding: '0 14px 14px' }}>
      <MiniLineChart
        title="Ticket aperti vs chiusi — mese su mese"
        series={chart1Series}
        labels={monthly.map(p => p.label)}
        colors={['#009FE3', '#059669']}
      />
      <MiniLineChart
        title="Nuovi ticket per tipologia — mese su mese"
        series={chart2Series}
        labels={months}
        colors={CHART_COLORS}
      />
    </div>
  );
}
