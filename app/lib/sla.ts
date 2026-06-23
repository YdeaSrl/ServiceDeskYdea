import type { Ticket, SlaInfo, PriorityLevel } from '@/app/types';

const SLA_BIZ_HOURS = 8;
const WARNING_BIZ_HOURS = 2;

const NEW_STATE_PATTERNS            = ['nuovo', 'new', 'aperto', 'aperta', 'open'];
const CLOSED_STATE_PATTERNS         = ['chiuso', 'chiusa', 'effettuato', 'completato', 'risolto', 'closed', 'done', 'resolved'];
const IN_ATTESA_DA_NOI_PATTERNS     = ['attesa da noi'];
const IN_VERIFICA_TECNICA_PATTERNS  = ['verifica tecnica'];
const URGENT_INACTIVE_PATTERNS      = ['chiuso', 'chiusa', 'effettuato', 'attesa del cliente', 'attesa cliente'];

const PRIORITY_PATTERNS: Record<PriorityLevel, string[]> = {
  urgente: ['urgente', 'urgent', 'critico', 'critical'],
  alta:    ['alta', 'alto', 'high'],
  media:   ['media', 'medio', 'medium', 'normale', 'normal'],
  bassa:   ['bassa', 'basso', 'low'],
  unknown: [],
};

// Business work slots in minutes from midnight: [startMin, endMin]
const WORK_SLOTS: [number, number][] = [
  [9 * 60, 13 * 60],   // 09:00–13:00
  [14 * 60, 18 * 60],  // 14:00–18:00
];

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

export function isInAttesaDaNoiState(stato: string): boolean {
  return matchesPatterns(stato, IN_ATTESA_DA_NOI_PATTERNS);
}

export function isInVerificaTecnicaState(stato: string): boolean {
  return matchesPatterns(stato, IN_VERIFICA_TECNICA_PATTERNS);
}

export function isUrgentActive(ticket: Ticket): boolean {
  if (getPriorityLevel(ticket.priorita) !== 'urgente') return false;
  return !matchesPatterns(ticket.stato, URGENT_INACTIVE_PATTERNS);
}

export function getPriorityLevel(priorita: string): PriorityLevel {
  for (const [level, patterns] of Object.entries(PRIORITY_PATTERNS) as [PriorityLevel, string[]][]) {
    if (level === 'unknown') continue;
    if (matchesPatterns(priorita, patterns)) return level;
  }
  return 'unknown';
}

function businessMsElapsed(from: Date, to: Date): number {
  if (to <= from) return 0;
  let elapsed = 0;
  const cursor = new Date(from.getTime());

  while (cursor < to) {
    const dow = cursor.getDay(); // 0=Sun, 6=Sat
    if (dow >= 1 && dow <= 5) {
      const baseMs = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate()).getTime();
      for (const [startMin, endMin] of WORK_SLOTS) {
        const slotStart = baseMs + startMin * 60_000;
        const slotEnd   = baseMs + endMin * 60_000;
        const overlapStart = Math.max(cursor.getTime(), slotStart);
        const overlapEnd   = Math.min(to.getTime(), slotEnd);
        if (overlapEnd > overlapStart) elapsed += overlapEnd - overlapStart;
      }
    }
    cursor.setTime(new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1).getTime());
  }

  return elapsed;
}

export function getSlaInfo(ticket: Ticket): SlaInfo {
  if (!isNewState(ticket.stato)) {
    return { status: 'na', remainingMs: 0, hoursOpen: 0, label: '' };
  }

  const from = new Date(ticket.dataCreazione);
  const now = new Date();
  const hoursOpen = (now.getTime() - from.getTime()) / 3_600_000;

  const bizMsUsed = businessMsElapsed(from, now);
  const slaLimitMs = SLA_BIZ_HOURS * 3_600_000;
  const remainingMs = slaLimitMs - bizMsUsed;

  if (remainingMs <= 0) {
    return {
      status: 'breach',
      remainingMs,
      hoursOpen,
      label: `SCADUTO ${formatDuration(Math.abs(remainingMs))} fa`,
    };
  }

  if (remainingMs < WARNING_BIZ_HOURS * 3_600_000) {
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
