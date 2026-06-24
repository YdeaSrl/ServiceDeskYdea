import type { Ticket, User, TicketInfo, TicketInfoItem } from '@/app/types';

const BASE_URL = 'https://my.ydea.cloud';

export interface YdeaCreds {
  apiId: string;
  apiKey: string;
}

function envCreds(): YdeaCreds {
  return {
    apiId:  process.env.YDEA_API_ID  ?? '',
    apiKey: process.env.YDEA_API_KEY ?? '',
  };
}

// Token cache keyed by "apiId:apiKey"
const tokenCache = new Map<string, { value: string; expiresAt: number }>();

// TicketInfo cache (rarely changes)
const ticketInfoCache = new Map<string, { data: TicketInfo; expiresAt: number }>();

// Yearly closed-tickets cache (expensive: ~175 pages). Key: "apiId:year"
const closedSinceYearCache = new Map<string, { data: Ticket[]; expiresAt: number }>();

async function getToken(creds: YdeaCreds): Promise<string> {
  const key = `${creds.apiId}:${creds.apiKey}`;
  const cached = tokenCache.get(key);
  const now = Date.now();
  if (cached && cached.expiresAt > now + 5 * 60_000) return cached.value;

  const res = await fetch(`${BASE_URL}/app_api_v2/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: creds.apiId, api_key: creds.apiKey }),
    cache: 'no-store',
  });

  if (!res.ok) throw new Error(`Login failed: ${res.status}`);

  const data = await res.json();
  const token: string = data.token ?? data.access_token ?? data.bearer_token ?? data.jwt;
  if (!token) throw new Error('Token non trovato nella risposta del login');

  tokenCache.set(key, { value: token, expiresAt: now + 55 * 60_000 });
  return token;
}

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

async function apiFetch<T>(path: string, creds: YdeaCreds, params: Record<string, string> = {}): Promise<T> {
  const token = await getToken(creds);
  const url = new URL(`${BASE_URL}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { headers: authHeaders(token), cache: 'no-store' });
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

async function fetchWithStates(path: string, creds: YdeaCreds, statiIds: string[], extraParams: Record<string, string> = {}): Promise<Response> {
  const token = await getToken(creds);
  const url = new URL(`${BASE_URL}${path}`);
  statiIds.forEach(id => url.searchParams.append('stato[]', id));
  Object.entries(extraParams).forEach(([k, v]) => url.searchParams.set(k, v));
  return fetch(url.toString(), { headers: authHeaders(token), cache: 'no-store' });
}

// ── Ticket Info ──────────────────────────────────────────────────────────────

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

export async function fetchTicketInfo(creds?: YdeaCreds): Promise<TicketInfo> {
  const c = creds ?? envCreds();
  const cacheKey = `${c.apiId}:${c.apiKey}`;
  const cached = ticketInfoCache.get(cacheKey);
  const now = Date.now();
  if (cached && cached.expiresAt > now) return cached.data;

  const data = await apiFetch<Record<string, unknown>>('/app_api_v2/ticket/info', c);
  const result: TicketInfo = {
    stati:    normaliseInfoField(data.stato   ?? data.stati   ?? data.states),
    priorita: normaliseInfoField(data.priorita ?? data.priorities),
    fonti:    normaliseInfoField(data.fonte   ?? data.fonti   ?? data.sources),
    tipi:     normaliseInfoField(data.tipo    ?? data.tipi    ?? data.types),
    raw:      data,
  };
  ticketInfoCache.set(cacheKey, { data: result, expiresAt: now + 5 * 60_000 });
  return result;
}

// ── Tickets ──────────────────────────────────────────────────────────────────

function extractTickets(data: Record<string, unknown>): Ticket[] {
  const list = data.objs ?? data.tickets ?? data.data ?? data.items ?? [];
  return (Array.isArray(list) ? list : []) as Ticket[];
}

export async function fetchTicketsPage(page = 1, creds?: YdeaCreds, params: Record<string, string> = {}): Promise<{ tickets: Ticket[]; hasMore: boolean }> {
  const c = creds ?? envCreds();
  const data = await apiFetch<Record<string, unknown>>('/app_api_v2/tickets', c, {
    page: String(page),
    ...params,
  });
  const tickets = extractTickets(data);
  const total = Number(data.total ?? data.count ?? data.totalCount ?? 0);
  const perPage = Number(data.perPage ?? data.per_page ?? data.limit ?? tickets.length);
  const hasMore = perPage > 0 && total > page * perPage;
  return { tickets, hasMore };
}

export async function fetchAllOpenTickets(creds?: YdeaCreds): Promise<Ticket[]> {
  const MAX_PAGES = 10;
  const all: Ticket[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const { tickets, hasMore } = await fetchTicketsPage(page, creds);
    all.push(...tickets);
    if (!hasMore || tickets.length === 0) break;
  }
  return all;
}

export async function fetchAllTicketsInStates(statiIds: string[], creds?: YdeaCreds): Promise<Ticket[]> {
  if (statiIds.length === 0) return [];
  const c = creds ?? envCreds();
  const token = await getToken(c);
  const MAX_PAGES = 300;
  const all: Ticket[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = new URL(`${BASE_URL}/app_api_v2/tickets`);
    statiIds.forEach(id => url.searchParams.append('stato[]', id));
    url.searchParams.set('page', String(page));
    const res = await fetch(url.toString(), { headers: authHeaders(token), cache: 'no-store' });
    if (!res.ok) break;
    const data: Record<string, unknown> = await res.json();
    const tickets = extractTickets(data);
    all.push(...tickets);
    if (tickets.length === 0) break;
    const total = Number(data.total ?? data.count ?? data.totalCount ?? 0);
    const perPage = Number(data.perPage ?? data.per_page ?? data.limit ?? 0);
    if (total > 0 && perPage > 0) {
      if (total <= page * perPage) break;
    } else {
      // YDEA doesn't return pagination info with stato[] filter: stop on partial page
      if (tickets.length < 20) break;
    }
  }
  return all;
}

export async function fetchClosedToday(statiIds: string[], creds?: YdeaCreds): Promise<Ticket[]> {
  if (statiIds.length === 0) return [];
  const c = creds ?? envCreds();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const res = await fetchWithStates('/app_api_v2/tickets', c, statiIds, {
    dataModificaDa: todayStart.toISOString(),
  });
  if (!res.ok) return [];
  const data: Record<string, unknown> = await res.json();
  return extractTickets(data);
}

export async function fetchAllClosedSince(statiIds: string[], from: Date, creds?: YdeaCreds): Promise<Ticket[]> {
  if (statiIds.length === 0) return [];
  const c = creds ?? envCreds();
  // Cache key uses year+month so a new month invalidates the cache automatically
  const cacheKey = `${c.apiId}:${c.apiKey}:${from.getFullYear()}-${from.getMonth()}`;
  const cached = closedSinceYearCache.get(cacheKey);
  const now = Date.now();
  if (cached && cached.expiresAt > now) return cached.data;

  const token = await getToken(c);
  const MAX_PAGES = 300;
  const all: Ticket[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = new URL(`${BASE_URL}/app_api_v2/tickets`);
    statiIds.forEach(id => url.searchParams.append('stato[]', id));
    url.searchParams.set('dataModificaDa', from.toISOString());
    url.searchParams.set('page', String(page));
    const res = await fetch(url.toString(), { headers: authHeaders(token), cache: 'no-store' });
    if (!res.ok) break;
    const data: Record<string, unknown> = await res.json();
    const tickets = extractTickets(data);
    all.push(...tickets);
    if (tickets.length === 0) break;
    const total = Number(data.total ?? data.count ?? data.totalCount ?? 0);
    const perPage = Number(data.perPage ?? data.per_page ?? data.limit ?? 0);
    if (total > 0 && perPage > 0) {
      if (total <= page * perPage) break;
    } else {
      if (tickets.length < 20) break;
    }
  }
  closedSinceYearCache.set(cacheKey, { data: all, expiresAt: now + 55 * 60_000 });
  return all;
}

// ── Users ────────────────────────────────────────────────────────────────────

export async function fetchUsers(creds?: YdeaCreds): Promise<User[]> {
  const c = creds ?? envCreds();
  const data = await apiFetch<Record<string, unknown>>('/app_api_v2/users', c);
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
  if (typeof raw === 'string') return raw.trim();
  if (typeof raw === 'object' && raw !== null) {
    const obj = raw as Record<string, unknown>;
    const nome    = String(obj.nome    ?? obj.name      ?? '').trim();
    const cognome = String(obj.cognome ?? obj.lastName  ?? obj.surname ?? '').trim();
    if (nome || cognome) return [nome, cognome].filter(Boolean).join(' ');
    if (obj.username) return String(obj.username).trim();
    if (obj.email)    return String(obj.email).trim();
    // YDEA API returns {"<userId>": "<Full Name>"} — extract the first string value
    const firstVal = Object.values(obj).find(v => typeof v === 'string' && (v as string).trim() !== '');
    if (firstVal) return String(firstVal).trim();
  }
  return '';
}
