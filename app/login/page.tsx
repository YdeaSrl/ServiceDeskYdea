'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        router.replace('/');
      } else {
        const data = await res.json();
        setError(data.error ?? 'Errore di accesso');
      }
    } catch {
      setError('Impossibile contattare il server');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--ground)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '380px',
        background: 'var(--surface)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '32px 32px 24px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface-2)',
          textAlign: 'center',
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px',
          }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--sla-ok)',
              animation: 'live-pulse 2s ease-in-out infinite',
            }} />
            <span style={{
              fontFamily: 'var(--mono)',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--text-3)',
            }}>
              Service Desk
            </span>
          </div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            YDEA CRM
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-2)', marginTop: '4px' }}>
            Dashboard di monitoraggio
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '28px 32px 32px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--text-3)',
              marginBottom: '8px',
            }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Il tuo username"
              autoFocus
              autoComplete="username"
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${error ? 'var(--sla-breach)' : 'var(--border)'}`,
                background: 'var(--surface-2)',
                color: 'var(--text)',
                fontSize: '15px',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: 'var(--text-3)',
              marginBottom: '8px',
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="La tua password"
              autoComplete="current-password"
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${error ? 'var(--sla-breach)' : 'var(--border)'}`,
                background: 'var(--surface-2)',
                color: 'var(--text)',
                fontSize: '15px',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {error && (
            <div style={{
              marginBottom: '16px',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--urg-bg)',
              border: '1px solid var(--urg-border)',
              color: 'var(--urg-text)',
              fontSize: '13px',
              fontWeight: 500,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username || !password}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: loading || !username || !password ? 'var(--surface-2)' : 'var(--accent)',
              color: loading || !username || !password ? 'var(--text-3)' : '#fff',
              fontSize: '14px',
              fontWeight: 700,
              cursor: loading || !username || !password ? 'not-allowed' : 'pointer',
              letterSpacing: '0.03em',
            }}
          >
            {loading ? 'Accesso in corso…' : 'Accedi'}
          </button>
        </form>
      </div>
    </div>
  );
}
