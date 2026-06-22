'use client';

import { useState, useEffect } from 'react';

export default function LiveClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  const dateStr = now.toLocaleDateString('it-IT', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('it-IT', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });

  return (
    <div className="flex items-center gap-4">
      <span className="text-slate-400 capitalize">{dateStr}</span>
      <span className="text-white font-mono font-bold text-base">{timeStr}</span>
    </div>
  );
}
