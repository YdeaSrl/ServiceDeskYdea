'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { DashboardData } from '@/app/types';
import { playUrgentAlert, playNewTicketSound } from '@/app/lib/audio';
import { isNewState, isClosedState, getPriorityLevel } from '@/app/lib/sla';

const REFRESH_INTERVAL_MS = 60_000;

const EMPTY: DashboardData = {
  tickets: [],
  closedToday: [],
  users: [],
  ticketInfo: { stati: [], priorita: [], fonti: [], tipi: [] },
  lastUpdated: new Date().toISOString(),
};

export function useDashboard() {
  const [data, setData] = useState<DashboardData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(REFRESH_INTERVAL_MS / 1000);

  const previousTicketIds = useRef<Set<number>>(new Set());
  const audioUnlocked = useRef(false);
  const nextFetchAt = useRef<number>(Date.now() + REFRESH_INTERVAL_MS);

  useEffect(() => {
    const unlock = () => {
      if (!audioUnlocked.current) {
        audioUnlocked.current = true;
        const ctx = new AudioContext();
        ctx.resume().then(() => ctx.close());
      }
    };
    window.addEventListener('click', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  const detectNewTickets = useCallback((newData: DashboardData) => {
    if (previousTicketIds.current.size === 0) {
      previousTicketIds.current = new Set(newData.tickets.map(t => t.id));
      return;
    }

    const prevIds = previousTicketIds.current;
    const newIds = new Set(newData.tickets.map(t => t.id));

    let hasNewUrgent = false;
    let hasNewAny = false;

    for (const ticket of newData.tickets) {
      if (!prevIds.has(ticket.id)) {
        hasNewAny = true;
        if (getPriorityLevel(ticket.priorita) === 'urgente') {
          hasNewUrgent = true;
        }
      }
    }

    previousTicketIds.current = newIds;

    if (!audioUnlocked.current) return;

    if (hasNewUrgent) {
      playUrgentAlert();
    } else if (hasNewAny) {
      playNewTicketSound();
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: DashboardData = await res.json();
      detectNewTickets(json);
      setData(json);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Errore';
      setData(prev => ({ ...prev, fetchError: message }));
    } finally {
      setLoading(false);
      nextFetchAt.current = Date.now() + REFRESH_INTERVAL_MS;
      setSecondsUntilRefresh(REFRESH_INTERVAL_MS / 1000);
    }
  }, [detectNewTickets]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    const tick = setInterval(() => {
      const remaining = Math.max(0, Math.round((nextFetchAt.current - Date.now()) / 1000));
      setSecondsUntilRefresh(remaining);
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  const newTickets = data.tickets.filter(t => isNewState(t.stato));
  const inProgressTickets = data.tickets.filter(t => !isNewState(t.stato) && !isClosedState(t.stato));

  return {
    data,
    loading,
    secondsUntilRefresh,
    newTickets,
    inProgressTickets,
  };
}
