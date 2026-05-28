import { useState } from 'react'
import { AuthProvider, useAuth } from './auth/AuthContext'
import LoginPage from './auth/LoginPage'
import Roadmap from './Roadmap'
import { Loader2 } from 'lucide-react'

function Gate() {
  const { user, loading } = useAuth()
  const [showLogin, setShowLogin] = useState(false)

  if (loading) return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#0E1E3A', gap: 16,
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <Loader2 size={32} color="#85B7EB" style={{ animation: 'spin 1s linear infinite' }} />
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0 }}>Verificando sessão...</p>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  // Usuário autenticado → roadmap completo
  if (user) return <Roadmap />

  // Não autenticado: tela de login ou roadmap em modo leitura
  if (showLogin) return <LoginPage />

  // Modo público (viewer) — leitura sem login
  return (
    <div>
      {/* Banner de acesso público */}
      <div style={{
        background: '#0E1E3A', borderBottom: '1px solid rgba(133,183,235,0.2)',
        padding: '8px 20px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 14 }}>👁️</span>
          Modo visualização — somente leitura
        </span>
        <button
          type="button"
          onClick={() => setShowLogin(true)}
          style={{
            background: '#378ADD', color: '#fff', border: 'none',
            borderRadius: 6, padding: '5px 14px', fontSize: 12,
            fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Fazer login
        </button>
      </div>
      <Roadmap />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  )
}
