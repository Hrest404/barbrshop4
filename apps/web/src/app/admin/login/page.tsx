'use client'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Ошибка входа'); return }
      router.push('/admin')
    } catch {
      setError('Ошибка соединения')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 16, padding: '48px 40px', width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>✂️</div>
          <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>Barbershop Admin</h1>
          <p style={{ color: '#666', marginTop: 8 }}>Войдите для управления</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: '#999', fontSize: 13, display: 'block', marginBottom: 6 }}>Логин</label>
            <input
              value={login} onChange={e => setLogin(e.target.value)} required
              style={{ width: '100%', background: '#111', border: '1px solid #333', borderRadius: 8, padding: '12px 14px', color: '#fff', fontSize: 15, boxSizing: 'border-box' }}
              autoComplete="username"
            />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ color: '#999', fontSize: 13, display: 'block', marginBottom: 6 }}>Пароль</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required
              style={{ width: '100%', background: '#111', border: '1px solid #333', borderRadius: 8, padding: '12px 14px', color: '#fff', fontSize: 15, boxSizing: 'border-box' }}
              autoComplete="current-password"
            />
          </div>
          {error && <p style={{ color: '#ff5555', fontSize: 14, marginBottom: 16, textAlign: 'center' }}>{error}</p>}
          <button
            type="submit" disabled={loading}
            style={{ width: '100%', background: '#c8a96e', color: '#0f0f0f', border: 'none', borderRadius: 8, padding: '14px', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  )
}
