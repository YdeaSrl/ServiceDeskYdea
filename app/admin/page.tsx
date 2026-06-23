'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  username: string;
  role: 'admin' | 'user';
  apiId: string;
  hasCredentials: boolean;
  createdAt: string;
}

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border)',
  background: 'var(--surface-2)',
  color: 'var(--text)',
  fontSize: '13px',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

const LABEL_STYLE: React.CSSProperties = {
  display: 'block',
  fontSize: '10px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: 'var(--text-3)',
  marginBottom: '5px',
};

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({ username: '', password: '', role: 'user' as 'admin' | 'user', apiId: '', apiKey: '' });
  const [editForm, setEditForm] = useState({ password: '', apiId: '', apiKey: '', role: 'user' as 'admin' | 'user' });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  async function loadUsers() {
    try {
      const res = await fetch('/api/admin/users');
      if (res.status === 403) { router.replace('/'); return; }
      const data = await res.json();
      setUsers(data.users ?? []);
    } catch {
      setError('Impossibile caricare gli utenti');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadUsers(); }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error ?? 'Errore'); return; }
      setForm({ username: '', password: '', role: 'user', apiId: '', apiKey: '' });
      setCreating(false);
      await loadUsers();
    } catch {
      setFormError('Errore di rete');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleUpdate(id: string) {
    setFormLoading(true);
    setFormError('');
    try {
      const payload: Record<string, string> = { id };
      if (editForm.password) payload.password = editForm.password;
      if (editForm.apiId) payload.apiId = editForm.apiId;
      if (editForm.apiKey) payload.apiKey = editForm.apiKey;
      payload.role = editForm.role;

      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error ?? 'Errore'); return; }
      setEditingId(null);
      await loadUsers();
    } catch {
      setFormError('Errore di rete');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete(id: string, username: string) {
    if (!confirm(`Eliminare l'utente "${username}"?`)) return;
    try {
      const res = await fetch(`/api/admin/users?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (res.ok) await loadUsers();
    } catch {
      setError('Errore durante l\'eliminazione');
    }
  }

  const card: React.CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ground)', padding: '32px 24px' }}>
      <div style={{ maxWidth: 780, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-3)', marginBottom: '4px' }}>
              Pannello Admin
            </div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
              Gestione utenti
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => { setCreating(true); setEditingId(null); setFormError(''); }}
              style={{ padding: '9px 16px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--accent)', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
            >
              + Nuovo utente
            </button>
            <button
              onClick={() => router.push('/')}
              style={{ padding: '9px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-2)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              ← Dashboard
            </button>
          </div>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--urg-bg)', border: '1px solid var(--urg-border)', color: 'var(--urg-text)', fontSize: '13px' }}>
            {error}
          </div>
        )}

        {creating && (
          <div style={{ ...card, padding: '24px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '20px' }}>Nuovo utente</div>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={LABEL_STYLE}>Username</label>
                  <input style={INPUT_STYLE} value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="mario.rossi" required />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Password</label>
                  <input type="password" style={INPUT_STYLE} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min. 6 caratteri" required />
                </div>
                <div>
                  <label style={LABEL_STYLE}>Ruolo</label>
                  <select style={INPUT_STYLE} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as 'admin' | 'user' }))}>
                    <option value="user">Utente</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label style={LABEL_STYLE}>YDEA Account ID</label>
                  <input style={INPUT_STYLE} value={form.apiId} onChange={e => setForm(f => ({ ...f, apiId: e.target.value }))} placeholder="Es: acme" />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={LABEL_STYLE}>YDEA API Key</label>
                  <input type="password" style={INPUT_STYLE} value={form.apiKey} onChange={e => setForm(f => ({ ...f, apiKey: e.target.value }))} placeholder="API Key YDEA" />
                </div>
              </div>

              {formError && (
                <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--urg-bg)', border: '1px solid var(--urg-border)', color: 'var(--urg-text)', fontSize: '12px' }}>
                  {formError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => { setCreating(false); setFormError(''); }} style={{ padding: '9px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-2)', fontSize: '13px', cursor: 'pointer' }}>
                  Annulla
                </button>
                <button type="submit" disabled={formLoading} style={{ padding: '9px 16px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--accent)', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: formLoading ? 'not-allowed' : 'pointer' }}>
                  {formLoading ? 'Creazione…' : 'Crea utente'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div style={card}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-3)' }}>
              Utenti ({users.length})
            </span>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-3)', fontSize: '13px' }}>Caricamento…</div>
          ) : users.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-3)', fontSize: '13px' }}>Nessun utente</div>
          ) : (
            <div>
              {users.map((user, idx) => (
                <div key={user.id}>
                  {idx > 0 && <div style={{ borderTop: '1px solid var(--border)' }} />}
                  <div style={{ padding: '14px 20px' }}>
                    {editingId === user.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                          <span style={{ fontFamily: 'var(--mono)', fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>{user.username}</span>
                          <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: user.role === 'admin' ? 'var(--accent-soft)' : 'var(--surface-2)', color: user.role === 'admin' ? 'var(--accent)' : 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{user.role}</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          <div>
                            <label style={LABEL_STYLE}>Nuova password</label>
                            <input type="password" style={INPUT_STYLE} value={editForm.password} onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))} placeholder="Lascia vuoto per non cambiare" />
                          </div>
                          <div>
                            <label style={LABEL_STYLE}>Ruolo</label>
                            <select style={INPUT_STYLE} value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value as 'admin' | 'user' }))}>
                              <option value="user">Utente</option>
                              <option value="admin">Admin</option>
                            </select>
                          </div>
                          <div>
                            <label style={LABEL_STYLE}>YDEA Account ID</label>
                            <input style={INPUT_STYLE} value={editForm.apiId} onChange={e => setEditForm(f => ({ ...f, apiId: e.target.value }))} placeholder="Es: acme" />
                          </div>
                          <div>
                            <label style={LABEL_STYLE}>YDEA API Key</label>
                            <input type="password" style={INPUT_STYLE} value={editForm.apiKey} onChange={e => setEditForm(f => ({ ...f, apiKey: e.target.value }))} placeholder="Lascia vuoto per non cambiare" />
                          </div>
                        </div>
                        {formError && <div style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--urg-bg)', border: '1px solid var(--urg-border)', color: 'var(--urg-text)', fontSize: '12px' }}>{formError}</div>}
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button onClick={() => { setEditingId(null); setFormError(''); }} style={{ padding: '7px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-2)', fontSize: '12px', cursor: 'pointer' }}>Annulla</button>
                          <button onClick={() => handleUpdate(user.id)} disabled={formLoading} style={{ padding: '7px 14px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--accent)', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: formLoading ? 'not-allowed' : 'pointer' }}>
                            {formLoading ? 'Salvataggio…' : 'Salva'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontFamily: 'var(--mono)', fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>{user.username}</span>
                            <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: user.role === 'admin' ? 'var(--accent-soft)' : 'var(--surface-2)', color: user.role === 'admin' ? 'var(--accent)' : 'var(--text-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{user.role}</span>
                            {user.hasCredentials ? (
                              <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'var(--sla-g-bg)', color: 'var(--sla-ok)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>YDEA ✓</span>
                            ) : (
                              <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'var(--urg-bg)', color: 'var(--urg-text)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>No YDEA</span>
                            )}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-3)', marginTop: '2px' }}>
                            {user.apiId ? `Account: ${user.apiId}` : 'Nessun account configurato'}
                            {' · '}
                            Creato {new Date(user.createdAt).toLocaleDateString('it-IT')}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                          <button
                            onClick={() => {
                              setEditingId(user.id);
                              setEditForm({ password: '', apiId: user.apiId, apiKey: '', role: user.role });
                              setFormError('');
                              setCreating(false);
                            }}
                            style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--surface-2)', color: 'var(--text-2)', fontSize: '12px', cursor: 'pointer' }}
                          >
                            Modifica
                          </button>
                          <button
                            onClick={() => handleDelete(user.id, user.username)}
                            style={{ padding: '6px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--urg-border)', background: 'var(--urg-bg)', color: 'var(--urg-text)', fontSize: '12px', cursor: 'pointer' }}
                          >
                            Elimina
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
