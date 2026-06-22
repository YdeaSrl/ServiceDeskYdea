import type { Ticket, User, TicketInfo, TicketInfoItem } from '@/app/types';

const BASE_URL = 'https://my.ydea.cloud';
const API_ID  = process.env.YDEA_API_ID!;
const API_KEY = process.env.YDEA_API_KEY!;

// In-memory token cache — survives warm Vercel invocations
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 5 * 60_000) {
    return cachedToken.value;
  }

  const res = await fetch(`${BASE_URL}/app_api_v2/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: API_ID, api_key: API_KEY }),
    cache: 'no-store',
  });

  if (!res.ok) throw new Error(`Login failed: ${res.status}`);

  const data = await res.json();
  const token: string = data.token ?? data.access_token ?? data.bearer_token ?? data.jwt;

  if (!token) throw new Error('Token non trovato nella risposta del login');

  cachedToken = { value: token, expiresAt: now + 55 * 60_000 };
  return token;
}

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

async function apiFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const token = await getToken();
  const url = new URL(`${BASE_URL}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: authHeaders(token),
    cache: 'no-store',
  });

  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

async function fetchWithStates(path: string, statiIds: string[], extraParams: Record<string, string> = {}): Promise<Response> {
  const token = await getToken();
  const url = new URL(`${BASE_URL}${path}`);
  statiIds.forEach(id => url.searchParams.append('stato[]', id));
  Object.entries(extraParams).forEach(([k, v]) => url.searchParams.set(k, v));
  return fetch(url.toString(), { headers: authHeaders(token), cache: 'no-store' });
}

function normaliseInfoField(raw: unknown): TicketInfoItem[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((item: Record<string, unknown>) => ({
      id:    String(item.id ?? item.stato_id ?? ''),
      nome:  String(item.nome ?? item.name ?? item.label ?? item.id ?? ''),
      colore: item.colore as string | undefined,
    }));
  }
  if (typeof raw === 'object') {
    return Object.entries(raw as Record<string, unknown>).map(([id, val]) => ({
      id,
      nome: typeof val === 'string' ? val : JSON.stringify(val),
    }));
  }
  return [];
}

export async function fetchTicketInfo(): Promise<TicketInfo> {
  const data = await apiFetch<Record<string, unknown>>('/app_api_v2/ticket/info');
  return {
    stati:    normaliseInfoField(data.stato   ?? data.stati   ?? data.states),
    priorita: normaliseInfoField(data.priorita ?? data.priorities),
    fonti:    normaliseInfoField(data.fonte   ?? data.fonti   ?? data.sources),
    tipi:     normaliseInfoField(data.tipo    ?? data.tipi    ?? data.types),
    raw:      data,
  };
}

function extractTickets(data: Record<string, unknown>): Ticket[] {
  const list = data.objs ?? data.tickets ?? data.data ?? data.items ?? [];
  return (Array.isArray(list) ? list : []) as Ticket[];
}

export async function fetchTicketsPage(page = 1, params: Record<string, string> = {}): Promise<{ tickets: Ticket[]; hasMore: boolean }> {
  const data = await apiFetch<Record<string, unknown>>('/app_api_v2/tickets', {
    page: String(page),
    ...params,
  });
  const tickets = extractTickets(data);
  const total = Number(data.total ?? data.count ?? data.totalCount ?? 0);
  const perPage = Number(data.perPage ?? data.per_page ?? data.limit ?? tickets.length);
  const hasMore = perPage > 0 && total > page * perPage;
  return { tickets, hasMore };
}

export async function fetchAllOpenTickets(): Promise<Ticket[]> {
  const MAX_PAGES = 10;
  const all: Ticket[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { tickets, hasMore } = await fetchTicketsPage(page);
    all.push(...tickets);
    if (!hasMore || tickets.length === 0) break;
  }
  return all;
}

export async function fetchClosedToday(statiIds: string[]): Promise<Ticket[]> {
  if (statiIds.length === 0) return [];
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const res = await fetchWithStates('/app_api_v2/tickets', statiIds, {
    dataModificaDa: todayStart.toISOString(),
  });

  if (!res.ok) return [];
  const data: Record<string, unknown> = await res.json();
  return extractTickets(data);
}

export async function fetchUsers(): Promise<User[]> {
  const data = await apiFetch<Record<string, unknown>>('/app_api_v2/users');
  const list = data.users ?? data.objs ?? data.data ?? data;
  return (Array.isArray(list) ? list : []) as User[];
}

export function getUserFullName(user: User): string {
  if (user.nome || user.cognome) {
    return `${user.nome ?? ''} ${user.cognome ?? ''}`.trim();
  }
  return String(user.username ?? user.email ?? `User ${user.id}`);
}

export function getAssigneeName(ticket: Ticket): string {
  const raw = ticket.assegnatoA
    ?? ticket['assegnato_a']
    ?? ticket['assegnato']
    ?? ticket['utenteAssegnato']
    ?? ticket['tecnico']
    ?? ticket['agente']
    ?? ticket['operatore'];
  if (!raw) return '';
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'object' && raw !== null) {
    const obj = raw as Record<string, unknown>;
    return String(obj.nome ?? obj.cognome ?? obj.name ?? obj.username ?? '');
  }
  return '';
}
