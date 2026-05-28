import { AuthProvider, useAuth } from './auth/AuthContext'
import LoginPage from './auth/LoginPage'
import Roadmap from './Roadmap'
import { Loader2 } from 'lucide-react'

function Gate() {
  const { user, loading } = useAuth()

  if (loading) return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', background: '#0E1E3A', gap: 16,
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <Loader2 size={32} color="#85B7EB" style={{ animation: 'spin 1s linear infinite' }} />
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0 }}>Verificando sessão...</p>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  if (!user) return <LoginPage />

  return <Roadmap />
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  )
}
