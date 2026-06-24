'use client';

import { useState, useEffect } from 'react';
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
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const W = 500, H = 150;
  const MT = 14, MR = 14, MB = 26, ML = 32;
  const pw = W - ML - MR;
  const ph = H - MT - MB;

  const allVals = series.flatMap(s => s.values);
  const maxV = Math.max(1, ...allVals);
  const n = labels.length;

  const xPos = (i: number) => ML + (n <= 1 ? pw / 2 : (i / (n - 1)) * pw);
  const yPos = (v: number) => MT + ph - (v / maxV) * ph;

  const ttWidth = 110;
  const ttLineH = 14;
  const ttH = (series.length + 1) * ttLineH + 10;
  const ttX = hoverIdx !== null && xPos(hoverIdx) + ttWidth + 8 > W - MR
    ? xPos(hoverIdx) - ttWidth - 6
    : hoverIdx !== null ? xPos(hoverIdx) + 6 : 0;
  const ttY = MT;

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
        style={{ flex: 1, minHeight: 0, width: '100%', height: '100%', cursor: 'crosshair' }}
        preserveAspectRatio="none"
        onMouseLeave={() => setHoverIdx(null)}
      >
        {/* Horizontal grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(f => (
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
            cx={xPos(i)} cy={yPos(v)} r={hoverIdx === i ? 4 : 2.5}
            fill={colors[si % colors.length]}
            stroke="var(--surface)" strokeWidth={1}
          />
        )))}

        {/* Invisible hit areas per column */}
        {n > 0 && Array.from({ length: n }, (_, i) => {
          const x0 = i === 0 ? ML : (xPos(i - 1) + xPos(i)) / 2;
          const x1 = i === n - 1 ? W - MR : (xPos(i) + xPos(i + 1)) / 2;
          return (
            <rect
              key={i}
              x={x0} y={MT}
              width={x1 - x0} height={ph}
              fill="transparent"
              onMouseEnter={() => setHoverIdx(i)}
            />
          );
        })}

        {/* Crosshair + tooltip */}
        {hoverIdx !== null && (
          <g>
            <line
              x1={xPos(hoverIdx)} y1={MT}
              x2={xPos(hoverIdx)} y2={H - MB}
              stroke="var(--text-3)" strokeWidth={1} strokeDasharray="3,2"
            />
            <rect
              x={ttX} y={ttY}
              width={ttWidth} height={ttH}
              rx={4}
              fill="var(--surface)"
              stroke="var(--border)"
              strokeWidth={1}
            />
            <text x={ttX + 8} y={ttY + 11} fontSize={8.5} fontWeight={700} fill="var(--text-2)">
              {labels[hoverIdx]}
            </text>
            {series.map((s, si) => (
              <g key={si}>
                <rect
                  x={ttX + 8} y={ttY + 10 + (si + 1) * ttLineH - 4}
                  width={8} height={2}
                  fill={colors[si % colors.length]}
                  rx={1}
                />
                <text x={ttX + 20} y={ttY + 10 + (si + 1) * ttLineH} fontSize={8} fill="var(--text-3)">
                  {s.name}:{' '}
                  <tspan fontWeight={700} fill="var(--text)">{s.values[hoverIdx]}</tspan>
                </text>
              </g>
            ))}
          </g>
        )}

        {/* X-axis labels */}
        {labels.map((l, i) => (
          <text
            key={l}
            x={xPos(i)} y={H - 6}
            textAnchor="middle"
            fontSize={7.5}
            fill={hoverIdx === i ? 'var(--text-2)' : 'var(--text-3)'}
          >
            {l}
          </text>
        ))}

        {/* Y axis labels */}
        <text x={ML - 4} y={MT} textAnchor="end" dominantBaseline="hanging" fontSize={7} fill="var(--text-3)">
          {maxV}
        </text>
        <text x={ML - 4} y={H - MB} textAnchor="end" dominantBaseline="auto" fontSize={7} fill="var(--text-3)">
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

function ErrorCard({ onRetry }: { onRetry: () => void }) {
  return (
    <div style={{ flex: 1, minWidth: 0, background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
      <span style={{ fontSize: '10px', color: 'var(--sla-breach)', fontWeight: 600 }}>Errore caricamento grafici</span>
      <button
        onClick={onRetry}
        style={{ fontSize: '10px', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface-2)', cursor: 'pointer', color: 'var(--text-2)', fontWeight: 600 }}
      >
        Riprova
      </button>
    </div>
  );
}

export default function Charts() {
  const [data, setData] = useState<ChartsData | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  function load() {
    setError(false);
    setLoading(true);
    fetch('/api/charts')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(d => {
        if (d && !d.error) { setData(d); setLoading(false); }
        else { setError(true); setLoading(false); }
      })
      .catch(() => { setError(true); setLoading(false); });
  }

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', gap: '12px', height: '100%', padding: '0 14px 14px' }}>
        <Skeleton /><Skeleton />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ display: 'flex', gap: '12px', height: '100%', padding: '0 14px 14px' }}>
        <ErrorCard onRetry={load} /><ErrorCard onRetry={load} />
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
