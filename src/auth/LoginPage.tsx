import { useState } from 'react'
import { useAuth } from './AuthContext'
import logo from '../assets/logo-fastcomm.png'

// Mapeia identificadores de usuário para e-mails internos
const USER_MAP: Record<string, string> = {
  'roadmap2026': 'roadmap2026@fastcomm.internal',
}

function resolveEmail(input: string): string {
  const key = input.trim().toLowerCase()
  return USER_MAP[key] ?? (input.includes('@') ? input.trim() : input.trim())
}

export default function LoginPage({ onViewerMode }: { onViewerMode?: () => void }) {
  const { login } = useAuth()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword]     = useState('')
  const [error, setError]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [showPwd, setShowPwd]       = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!identifier || !password) { setError('Preencha usuário e senha.'); return }
    setLoading(true); setError('')
    const email = resolveEmail(identifier)
    const err = await login(email, password, identifier.trim())
    if (err) setError(err)
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0E1E3A 0%, #1A2B4A 60%, #0E1E3A 100%)',
      fontFamily: 'Inter, system-ui, sans-serif', padding: 16,
    }}>
      {/* Card */}
      <div style={{
        background: 'white', borderRadius: 16, padding: '48px 44px', width: '100%', maxWidth: 420,
        boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src={logo} alt="Fastcomm" style={{ height: 38, width: 'auto', marginBottom: 20 }} />
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0E1E3A', letterSpacing: -0.3 }}>
            Acesso à plataforma
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: '#6B7280' }}>
            Entre com suas credenciais para continuar
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Identifier */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6, letterSpacing: 0.3 }}>
              USUÁRIO
            </label>
            <input
              type="text"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              placeholder="Seu usuário ou e-mail"
              autoComplete="username"
              style={{
                width: '100%', boxSizing: 'border-box', padding: '11px 14px',
                border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 14,
                fontFamily: 'inherit', color: '#111827', outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = '#378ADD')}
              onBlur={e =>  (e.currentTarget.style.borderColor = '#E5E7EB')}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6, letterSpacing: 0.3 }}>
              SENHA
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '11px 44px 11px 14px',
                  border: '1.5px solid #E5E7EB', borderRadius: 8, fontSize: 14,
                  fontFamily: 'inherit', color: '#111827', outline: 'none',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = '#378ADD')}
                onBlur={e =>  (e.currentTarget.style.borderColor = '#E5E7EB')}
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF',
                  fontSize: 12, fontWeight: 600, padding: 0,
                }}
              >
                {showPwd ? 'OCULTAR' : 'VER'}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8,
              padding: '10px 14px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontSize: 16 }}>⚠️</span>
              <span style={{ fontSize: 13, color: '#991B1B', fontWeight: 500 }}>{error}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '12px', background: loading ? '#9CA3AF' : '#0E1E3A',
              color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              transition: 'background 0.15s', letterSpacing: 0.3,
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#1A2B4A' }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#0E1E3A' }}
          >
            {loading ? 'Autenticando...' : 'Entrar'}
          </button>
        </form>

        {/* Visitor access */}
        {onViewerMode && (
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
              <span style={{ fontSize: 11, color: '#9CA3AF', whiteSpace: 'nowrap' }}>ou</span>
              <div style={{ flex: 1, height: 1, background: '#E5E7EB' }} />
            </div>
            <button
              type="button"
              onClick={onViewerMode}
              style={{
                width: '100%', padding: '11px', background: '#F9FAFB',
                color: '#374151', border: '1.5px solid #E5E7EB', borderRadius: 8,
                fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#F3F4F6'; e.currentTarget.style.borderColor = '#D1D5DB' }}
              onMouseLeave={e => { e.currentTarget.style.background = '#F9FAFB'; e.currentTarget.style.borderColor = '#E5E7EB' }}
            >
              👁️ Entrar como visitante
            </button>
          </div>
        )}

        {/* Footer */}
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: '#9CA3AF' }}>
          Acesso restrito · Entre em contato com o administrador para solicitar acesso
        </p>
      </div>
    </div>
  )
}
