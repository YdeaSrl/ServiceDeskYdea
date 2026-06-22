import type { DashboardData } from '@/app/types';

const now = Date.now();
const h = (hours: number) => new Date(now - hours * 3_600_000).toISOString();
const m = (mins: number)  => new Date(now - mins  * 60_000).toISOString();

export const MOCK_DATA: DashboardData = {
  lastUpdated: new Date().toISOString(),
  users: [
    { id: 1, nome: 'Marco',   cognome: 'Rossi'    },
    { id: 2, nome: 'Sara',    cognome: 'Bianchi'  },
    { id: 3, nome: 'Luca',    cognome: 'Ferrari'  },
    { id: 4, nome: 'Anna',    cognome: 'Esposito' },
    { id: 5, nome: 'Paolo',   cognome: 'Greco'    },
  ],
  ticketInfo: {
    stati: [
      { id: '1', nome: 'Nuovo' },
      { id: '2', nome: 'In Lavorazione' },
      { id: '3', nome: 'In Attesa Cliente' },
      { id: '4', nome: 'Chiuso' },
      { id: '5', nome: 'Effettuato' },
    ],
    priorita: [
      { id: '1', nome: 'Bassa'   },
      { id: '2', nome: 'Media'   },
      { id: '3', nome: 'Alta'    },
      { id: '4', nome: 'Urgente' },
    ],
    fonti:  [{ id: '1', nome: 'Email' }, { id: '2', nome: 'Telefono' }],
    tipi:   [{ id: '1', nome: 'Bug' }, { id: '2', nome: 'Supporto' }],
  },
  closedToday: [
    { id: 201, uuid: 'u201', codice: 'TK-201', titolo: 'Aggiornamento modulo fatture', descrizione: '', dataCreazione: h(5), dataModifica: m(90), stato: 'Chiuso', stato_id: '4', ragioneSociale: 'Ferragamo Srl', anagrafica_id: 10, erpCode: '', priorita: 'Media', priorita_id: 2, fonte: 'Email', tipo: 'Supporto', assegnatoA: 'Marco Rossi' },
    { id: 202, uuid: 'u202', codice: 'TK-202', titolo: 'Configurazione report', descrizione: '', dataCreazione: h(3), dataModifica: m(45), stato: 'Effettuato', stato_id: '5', ragioneSociale: 'Paoli & Figli', anagrafica_id: 11, erpCode: '', priorita: 'Bassa', priorita_id: 1, fonte: 'Email', tipo: 'Supporto', assegnatoA: 'Sara Bianchi' },
    { id: 203, uuid: 'u203', codice: 'TK-203', titolo: 'Reset password utente', descrizione: '', dataCreazione: h(2), dataModifica: m(30), stato: 'Chiuso', stato_id: '4', ragioneSociale: 'Rinaldi SpA', anagrafica_id: 12, erpCode: '', priorita: 'Bassa', priorita_id: 1, fonte: 'Telefono', tipo: 'Supporto', assegnatoA: 'Luca Ferrari' },
    { id: 204, uuid: 'u204', codice: 'TK-204', titolo: 'Errore stampa DDT', descrizione: '', dataCreazione: h(4), dataModifica: m(15), stato: 'Chiuso', stato_id: '4', ragioneSociale: 'Acme Italia Srl', anagrafica_id: 1, erpCode: '', priorita: 'Alta', priorita_id: 3, fonte: 'Email', tipo: 'Bug', assegnatoA: 'Anna Esposito' },
    { id: 205, uuid: 'u205', codice: 'TK-205', titolo: 'Import listino prezzi', descrizione: '', dataCreazione: h(6), dataModifica: m(60), stato: 'Effettuato', stato_id: '5', ragioneSociale: 'Beta Tech Srl', anagrafica_id: 2, erpCode: '', priorita: 'Media', priorita_id: 2, fonte: 'Email', tipo: 'Supporto', assegnatoA: 'Marco Rossi' },
    { id: 206, uuid: 'u206', codice: 'TK-206', titolo: 'Sincronizzazione magazzino', descrizione: '', dataCreazione: h(3), dataModifica: m(20), stato: 'Chiuso', stato_id: '4', ragioneSociale: 'Gamma Group', anagrafica_id: 3, erpCode: '', priorita: 'Alta', priorita_id: 3, fonte: 'Telefono', tipo: 'Bug', assegnatoA: 'Paolo Greco' },
    { id: 207, uuid: 'u207', codice: 'TK-207', titolo: 'Aggiornamento IVA', descrizione: '', dataCreazione: h(2), dataModifica: m(10), stato: 'Chiuso', stato_id: '4', ragioneSociale: 'Delta Costruzioni', anagrafica_id: 4, erpCode: '', priorita: 'Media', priorita_id: 2, fonte: 'Email', tipo: 'Supporto', assegnatoA: 'Sara Bianchi' },
    { id: 208, uuid: 'u208', codice: 'TK-208', titolo: 'Creazione nuovo utente CRM', descrizione: '', dataCreazione: h(1), dataModifica: m(5), stato: 'Effettuato', stato_id: '5', ragioneSociale: 'Acme Italia Srl', anagrafica_id: 1, erpCode: '', priorita: 'Bassa', priorita_id: 1, fonte: 'Email', tipo: 'Supporto', assegnatoA: 'Luca Ferrari' },
  ],
  tickets: [
    // ── STATO: NUOVO (SLA breach — oltre 8h) ──
    { id: 101, uuid: 'u101', codice: 'TK-101', titolo: 'Impossibile accedere al portale clienti', descrizione: 'Errore 403 su tutti gli utenti del cliente', dataCreazione: h(9.5), dataModifica: h(9.5), stato: 'Nuovo', stato_id: '1', ragioneSociale: 'Acme Italia Srl', anagrafica_id: 1, erpCode: '', priorita: 'Urgente', priorita_id: 4, fonte: 'Telefono', tipo: 'Bug', assegnatoA: '' },
    { id: 102, uuid: 'u102', codice: 'TK-102', titolo: 'Errore critico su emissione fatture', descrizione: 'Il modulo fatturazione va in crash', dataCreazione: h(10.2), dataModifica: h(10.2), stato: 'Nuovo', stato_id: '1', ragioneSociale: 'Beta Tech Srl', anagrafica_id: 2, erpCode: '', priorita: 'Urgente', priorita_id: 4, fonte: 'Email', tipo: 'Bug', assegnatoA: '' },
    // ── STATO: NUOVO (SLA warning — meno di 2h rimaste) ──
    { id: 103, uuid: 'u103', codice: 'TK-103', titolo: 'Stampa report mensile bloccata', descrizione: '', dataCreazione: h(6.5), dataModifica: h(6.5), stato: 'Nuovo', stato_id: '1', ragioneSociale: 'Gamma Group', anagrafica_id: 3, erpCode: '', priorita: 'Alta', priorita_id: 3, fonte: 'Email', tipo: 'Bug', assegnatoA: '' },
    // ── STATO: NUOVO (SLA ok) ──
    { id: 104, uuid: 'u104', codice: 'TK-104', titolo: 'Configurazione nuovi magazzini', descrizione: '', dataCreazione: h(3), dataModifica: h(3), stato: 'Nuovo', stato_id: '1', ragioneSociale: 'Delta Costruzioni', anagrafica_id: 4, erpCode: '', priorita: 'Media', priorita_id: 2, fonte: 'Email', tipo: 'Supporto', assegnatoA: '' },
    { id: 105, uuid: 'u105', codice: 'TK-105', titolo: 'Richiesta export dati clienti', descrizione: '', dataCreazione: m(45), dataModifica: m(45), stato: 'Nuovo', stato_id: '1', ragioneSociale: 'Epsilon Logistica', anagrafica_id: 5, erpCode: '', priorita: 'Bassa', priorita_id: 1, fonte: 'Email', tipo: 'Supporto', assegnatoA: '' },
    { id: 106, uuid: 'u106', codice: 'TK-106', titolo: 'Assistenza importazione anagrafica', descrizione: '', dataCreazione: m(20), dataModifica: m(20), stato: 'Nuovo', stato_id: '1', ragioneSociale: 'Acme Italia Srl', anagrafica_id: 1, erpCode: '', priorita: 'Media', priorita_id: 2, fonte: 'Telefono', tipo: 'Supporto', assegnatoA: '' },
    { id: 107, uuid: 'u107', codice: 'TK-107', titolo: 'Problema sincronizzazione ordini', descrizione: '', dataCreazione: m(8), dataModifica: m(8), stato: 'Nuovo', stato_id: '1', ragioneSociale: 'Beta Tech Srl', anagrafica_id: 2, erpCode: '', priorita: 'Alta', priorita_id: 3, fonte: 'Email', tipo: 'Bug', assegnatoA: '' },
    // ── STATO: IN LAVORAZIONE ──
    { id: 108, uuid: 'u108', codice: 'TK-108', titolo: 'Blocco invio email automatiche', descrizione: '', dataCreazione: h(2), dataModifica: h(1), stato: 'In Lavorazione', stato_id: '2', ragioneSociale: 'Zeta Industries', anagrafica_id: 6, erpCode: '', priorita: 'Urgente', priorita_id: 4, fonte: 'Telefono', tipo: 'Bug', assegnatoA: 'Marco Rossi' },
    { id: 109, uuid: 'u109', codice: 'TK-109', titolo: 'Personalizzazione template PDF', descrizione: '', dataCreazione: h(5), dataModifica: h(2), stato: 'In Lavorazione', stato_id: '2', ragioneSociale: 'Acme Italia Srl', anagrafica_id: 1, erpCode: '', priorita: 'Alta', priorita_id: 3, fonte: 'Email', tipo: 'Supporto', assegnatoA: 'Sara Bianchi' },
    { id: 110, uuid: 'u110', codice: 'TK-110', titolo: 'Migrazione dati da vecchio gestionale', descrizione: '', dataCreazione: h(24), dataModifica: h(3), stato: 'In Lavorazione', stato_id: '2', ragioneSociale: 'Omega Solutions', anagrafica_id: 7, erpCode: '', priorita: 'Alta', priorita_id: 3, fonte: 'Email', tipo: 'Supporto', assegnatoA: 'Luca Ferrari' },
    { id: 111, uuid: 'u111', codice: 'TK-111', titolo: 'Configurazione profili permessi', descrizione: '', dataCreazione: h(6), dataModifica: h(1), stato: 'In Lavorazione', stato_id: '2', ragioneSociale: 'Gamma Group', anagrafica_id: 3, erpCode: '', priorita: 'Media', priorita_id: 2, fonte: 'Email', tipo: 'Supporto', assegnatoA: 'Anna Esposito' },
    { id: 112, uuid: 'u112', codice: 'TK-112', titolo: 'Errore calcolo sconti su ordini', descrizione: '', dataCreazione: h(3), dataModifica: m(30), stato: 'In Lavorazione', stato_id: '2', ragioneSociale: 'Beta Tech Srl', anagrafica_id: 2, erpCode: '', priorita: 'Alta', priorita_id: 3, fonte: 'Telefono', tipo: 'Bug', assegnatoA: 'Paolo Greco' },
    { id: 113, uuid: 'u113', codice: 'TK-113', titolo: 'Setup integrazione e-commerce', descrizione: '', dataCreazione: h(48), dataModifica: h(4), stato: 'In Lavorazione', stato_id: '2', ragioneSociale: 'Eta Commerce', anagrafica_id: 8, erpCode: '', priorita: 'Media', priorita_id: 2, fonte: 'Email', tipo: 'Supporto', assegnatoA: 'Marco Rossi' },
    { id: 114, uuid: 'u114', codice: 'TK-114', titolo: 'Problema con stampa etichette', descrizione: '', dataCreazione: h(4), dataModifica: h(2), stato: 'In Lavorazione', stato_id: '2', ragioneSociale: 'Theta Logistics', anagrafica_id: 9, erpCode: '', priorita: 'Media', priorita_id: 2, fonte: 'Telefono', tipo: 'Bug', assegnatoA: 'Sara Bianchi' },
    { id: 115, uuid: 'u115', codice: 'TK-115', titolo: 'Aggiornamento listino fornitore', descrizione: '', dataCreazione: h(2), dataModifica: m(45), stato: 'In Lavorazione', stato_id: '2', ragioneSociale: 'Acme Italia Srl', anagrafica_id: 1, erpCode: '', priorita: 'Bassa', priorita_id: 1, fonte: 'Email', tipo: 'Supporto', assegnatoA: 'Luca Ferrari' },
    // ── STATO: IN ATTESA CLIENTE ──
    { id: 116, uuid: 'u116', codice: 'TK-116', titolo: 'Verifica dati migrazione completata', descrizione: '', dataCreazione: h(72), dataModifica: h(24), stato: 'In Attesa Cliente', stato_id: '3', ragioneSociale: 'Omega Solutions', anagrafica_id: 7, erpCode: '', priorita: 'Media', priorita_id: 2, fonte: 'Email', tipo: 'Supporto', assegnatoA: 'Paolo Greco' },
    { id: 117, uuid: 'u117', codice: 'TK-117', titolo: 'Conferma configurazione IVA', descrizione: '', dataCreazione: h(48), dataModifica: h(12), stato: 'In Attesa Cliente', stato_id: '3', ragioneSociale: 'Zeta Industries', anagrafica_id: 6, erpCode: '', priorita: 'Bassa', priorita_id: 1, fonte: 'Email', tipo: 'Supporto', assegnatoA: 'Anna Esposito' },
    { id: 118, uuid: 'u118', codice: 'TK-118', titolo: 'Attesa credenziali server cliente', descrizione: '', dataCreazione: h(36), dataModifica: h(18), stato: 'In Attesa Cliente', stato_id: '3', ragioneSociale: 'Eta Commerce', anagrafica_id: 8, erpCode: '', priorita: 'Alta', priorita_id: 3, fonte: 'Telefono', tipo: 'Supporto', assegnatoA: 'Marco Rossi' },
  ],
};
