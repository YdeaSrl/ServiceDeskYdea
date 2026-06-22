export interface Ticket {
  id: number;
  uuid: string;
  codice: string;
  titolo: string;
  descrizione: string;
  dataCreazione: string;
  dataModifica: string;
  stato: string;
  stato_id: string;
  ragioneSociale: string;
  anagrafica_id: number;
  erpCode: string;
  priorita: string;
  priorita_id: number;
  fonte: string;
  tipo: string;
  assegnatoA?: string;
  contrattoCodice?: string;
  contrattoId?: number;
  [key: string]: unknown;
}

export interface User {
  id: number;
  nome?: string;
  cognome?: string;
  email?: string;
  username?: string;
  [key: string]: unknown;
}

export interface TicketInfoItem {
  id: string | number;
  nome: string;
  colore?: string;
}

export interface TicketInfo {
  stati: TicketInfoItem[];
  priorita: TicketInfoItem[];
  fonti: TicketInfoItem[];
  tipi: TicketInfoItem[];
  raw?: Record<string, unknown>;
}

export type PriorityLevel = 'urgente' | 'alta' | 'media' | 'bassa' | 'unknown';
export type SlaStatusType = 'breach' | 'warning' | 'ok' | 'na';

export interface SlaInfo {
  status: SlaStatusType;
  remainingMs: number;
  hoursOpen: number;
  label: string;
}

export interface TechnicianSummary {
  name: string;
  userId?: number;
  ticketCount: number;
  urgentCount: number;
}

export interface ClientCriticality {
  ragioneSociale: string;
  anagrafica_id: number;
  totalOpen: number;
  urgentCount: number;
  highCount: number;
  maxPriority: PriorityLevel;
}

export interface DashboardData {
  tickets: Ticket[];
  closedToday: Ticket[];
  users: User[];
  ticketInfo: TicketInfo;
  lastUpdated: string;
  fetchError?: string;
}
