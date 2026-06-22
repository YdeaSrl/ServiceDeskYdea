import type { Ticket, SlaInfo, PriorityLevel } from '@/app/types';

const SLA_HOURS = parseInt(process.env.NEXT_PUBLIC_SLA_HOURS ?? '8', 10);
const WARNING_HOURS = 2;

const NEW_STATE_PATTERNS = ['nuovo', 'new', 'aperto', 'aperta', 'open'];
const CLOSED_STATE_PATTERNS = ['chiuso', 'chiusa', 'effettuato', 'completato', 'risolto', 'closed', 'done', 'resolved'];
const PRIORITY_PATTERNS: Record<PriorityLevel, string[]> = {
  urgente: ['urgente', 'urgent', 'critico', 'critical'],
  alta:    ['alta', 'alto', 'high'],
  media:   ['media', 'medio', 'medium', 'normale', 'normal'],
  bassa:   ['bassa', 'basso', 'low'],
  unknown: [],
};

export function matchesPatterns(value: string, patterns: string[]): boolean {
  const lower = value.toLowerCase();
  return patterns.some(p => lower.includes(p));
}

export function isNewState(stato: string): boolean {
  return matchesPatterns(stato, NEW_STATE_PATTERNS);
}

export function isClosedState(stato: string): boolean {
  return matchesPatterns(stato, CLOSED_STATE_PATTERNS);
}

export function getPriorityLevel(priorita: string): PriorityLevel {
  for (const [level, patterns] of Object.entries(PRIORITY_PATTERNS) as [PriorityLevel, string[]][]) {
    if (level === 'unknown') continue;
    if (matchesPatterns(priorita, patterns)) return level;
  }
  return 'unknown';
}

export function getSlaInfo(ticket: Ticket): SlaInfo {
  if (!isNewState(ticket.stato)) {
    return { status: 'na', remainingMs: 0, hoursOpen: 0, label: '' };
  }

  const createdAt = new Date(ticket.dataCreazione).getTime();
  const now = Date.now();
  const hoursOpen = (now - createdAt) / 3_600_000;
  const deadline = createdAt + SLA_HOURS * 3_600_000;
  const remainingMs = deadline - now;

  if (remainingMs <= 0) {
    return {
      status: 'breach',
      remainingMs,
      hoursOpen,
      label: `SCADUTO ${formatDuration(Math.abs(remainingMs))} fa`,
    };
  }

  if (remainingMs < WARNING_HOURS * 3_600_000) {
    return {
      status: 'warning',
      remainingMs,
      hoursOpen,
      label: `⚠ ${formatDuration(remainingMs)} rimaste`,
    };
  }

  return {
    status: 'ok',
    remainingMs,
    hoursOpen,
    label: `${formatDuration(remainingMs)} rimaste`,
  };
}

export function formatDuration(ms: number): string {
  const absMs = Math.abs(ms);
  const h = Math.floor(absMs / 3_600_000);
  const m = Math.floor((absMs % 3_600_000) / 60_000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function formatTimeAgo(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  if (ms < 60_000) return 'adesso';
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}min fa`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h fa`;
  return `${Math.floor(ms / 86_400_000)}g fa`;
}

export function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear()
    && d.getMonth() === now.getMonth()
    && d.getDate() === now.getDate();
}

export function startOfToday(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}
