'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

interface SettingsStatus {
  apiId: string;
  apiKeySet: boolean;
  source: 'cookie' | 'env' | 'none';
}

export default function SettingsPage() {
  const router = useRouter();
  const [status, setStatus] = useState<SettingsStatus | null>(null);
  const [apiId, setApiId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then((d: SettingsStatus) => {
        setStatus(d);
        setApiId(d.apiId ?? '');
      })
      .catch(() => setStatus({ apiId: '', apiKeySet: false, source: 'none' }));
  }, []);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiId: apiId.trim(), apiKey: apiKey.trim() }),
      });
      if (res.ok) {
        setSaved(true);
        setApiKey('');
        setStatus(prev => prev ? { ...prev, apiId: apiId.trim(), apiKeySet: true, source: 'cookie' } : prev);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const d = await res.json();
        setError(d.error ?? 'Errore nel salvataggio');
      }
    } catch {
      setError('Impossibile contattare il server');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
  }

  async function handleReset() {
    await fetch('/api/settings', { method: 'DELETE' });
    setStatus({ apiId: '', apiKeySet: false, source: 'none' });
    setApiId('');
    setApiKey('');
  }

  const sourceLabel: Record<string, string> = {
    cookie: 'Salvate in sessione',
    env:    'Da variabili d\'ambiente',
    none:   'Non configurate',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--ground)',
      padding: '24px',
    }}>
      {/* Top bar */}
      <div style={{
        maxWidth: '560px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
      }}>
        <button
          onClick={() => router.push('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--text-2)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          ← Dashboard
        </button>
        <button
          onClick={handleLogout}
          style={{
            padding: '8px 14px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            color: 'var(--text-3)',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Disconnetti
        </button>
      </div>

      <div style={{ maxWidth: '560px', margin: '0 auto' }}>
        {/* Title */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{
            fontSize: '22px',
            fontWeight: 700,
            color: 'var(--text)',
            letterSpacing: '-0.02em',
            margin: 0,
          }}>
            Impostazioni
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-2)', marginTop: '4px' }}>
            Configura la connessione al CRM YDEA
          </p>
        </div>

        {/* Status chip */}
        {status && (
          <div style={{
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            background: status.source === 'none' ? 'var(--urg-bg)' : 'var(--sla-g-bg)',
            border: `1px solid ${status.source === 'none' ? 'var(--urg-border)' : 'var(--sla-g-border)'}`,
          }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: status.source === 'none' ? 'var(--sla-breach)' : 'var(--sla-ok)',
              flexShrink: 0,
            }} />
            <span style={{
              fontSize: '13px',
              fontWeight: 600,
              color: status.source === 'none' ? 'var(--urg-text)' : 'var(--bas-text)',
            }}>
              {sourceLabel[status.source]}
            </span>
            {status.apiId && (
              <span style={{
                fontFamily: 'var(--mono)',
                fontSize: '11px',
                color: 'var(--text-3)',
                marginLeft: '4px',
              }}>
                ID: {status.apiId}
              </span>
            )}
          </div>
        )}

        {/* Credentials form */}
        <div style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow)',
          overflow: 'hidden',
          marginBottom: '16px',
        }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--surface-2)',
          }}>
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: 'var(--text-3)',
            }}>
              Credenziali API
            </span>
          </div>

          <form onSubmit={handleSave} style={{ padding: '20px' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--text-3)',
                marginBottom: '6px',
              }}>
                Account ID (AppAccount)
              </label>
              <input
                type="text"
                value={apiId}
                onChange={e => setApiId(e.target.value)}
                placeholder="es. 12345"
                autoComplete="off"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  background: 'var(--surface-2)',
                  color: 'var(--text)',
                  fontSize: '14px',
                  fontFamily: 'var(--mono)',
                  outline: 'none',
                  boxSizing: 'border-box',
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
                marginBottom: '6px',
              }}>
                API Key
                {status?.apiKeySet && (
                  <span style={{ marginLeft: '8px', fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--sla-ok)' }}>
                    — già impostata
                  </span>
                )}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder={status?.apiKeySet ? 'Lascia vuoto per non modificare' : 'Inserisci la chiave API'}
                  autoComplete="off"
                  style={{
                    width: '100%',
                    padding: '10px 44px 10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    background: 'var(--surface-2)',
                    color: 'var(--text)',
                    fontSize: '14px',
                    fontFamily: 'var(--mono)',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(v => !v)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-3)',
                    fontSize: '13px',
                    padding: '4px',
                  }}
                >
                  {showKey ? 'Nascondi' : 'Mostra'}
                </button>
              </div>
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
              }}>
                {error}
              </div>
            )}

            {saved && (
              <div style={{
                marginBottom: '16px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--sla-g-bg)',
                border: '1px solid var(--sla-g-border)',
                color: 'var(--sla-ok)',
                fontSize: '13px',
                fontWeight: 600,
              }}>
                Credenziali salvate correttamente
              </div>
            )}

            <button
              type="submit"
              disabled={saving || !apiId}
              style={{
                padding: '11px 24px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: (saving || !apiId) ? 'var(--surface-2)' : 'var(--accent)',
                color: (saving || !apiId) ? 'var(--text-3)' : '#fff',
                fontSize: '14px',
                fontWeight: 700,
                cursor: (saving || !apiId) ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
              }}
            >
              {saving ? 'Salvataggio…' : 'Salva'}
            </button>
          </form>
        </div>

        {/* Reset */}
        {status?.source === 'cookie' && (
          <div style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>Ripristina configurazione</div>
              <div style={{ fontSize: '12px', color: 'var(--text-3)', marginTop: '2px' }}>Rimuove le credenziali salvate (torna alle variabili d&apos;ambiente)</div>
            </div>
            <button
              onClick={handleReset}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--urg-border)',
                background: 'var(--urg-bg)',
                color: 'var(--urg-text)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                flexShrink: 0,
                marginLeft: '16px',
              }}
            >
              Ripristina
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
