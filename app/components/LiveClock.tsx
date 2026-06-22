'use client';

import { useState, useEffect } from 'react';

export default function LiveClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  const timeStr = now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: '24px', fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--text)', lineHeight: 1 }}>
        {timeStr}
      </div>
      <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px', textTransform: 'capitalize', letterSpacing: '0.01em' }}>
        {dateStr}
      </div>
    </div>
  );
}
