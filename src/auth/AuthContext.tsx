import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

// ─── Types ────────────────────────────────────────────────────

export type Role = 'master' | 'viewer'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: Role
}

interface AuthCtx {
  user: AuthUser | null
  loading: boolean
  isMaster: boolean
  login: (email: string, password: string, username?: string) => Promise<string | null>
  logout: () => Promise<void>
  audit: (action: string, table: string, id?: string, payload?: object) => Promise<void>
}

// ─── Context ──────────────────────────────────────────────────

const Ctx = createContext<AuthCtx | null>(null)

async function fetchProfile(supaUser: User): Promise<AuthUser> {
  const { data } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', supaUser.id)
    .single()

  return {
    id:    supaUser.id,
    email: supaUser.email ?? '',
    name:  data?.full_name || supaUser.email?.split('@')[0] || 'Usuário',
    role:  (data?.role ?? 'viewer') as Role,
  }
}

// ─── Provider ─────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const done = () => { if (mounted) setLoading(false) }

    // Fallback: nunca ficar em loading por mais de 4 segundos
    // Se disparar, limpa sessão corrompida do localStorage
    const fallback = setTimeout(() => {
      Object.keys(localStorage)
        .filter(k => k.startsWith('sb-'))
        .forEach(k => localStorage.removeItem(k))
      done()
    }, 4000)

    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user && mounted) {
          try {
            setUser(await fetchProfile(session.user))
          } catch {
            setUser(null)
          }
        }
      } catch {
        // Supabase indisponível — abre como visitor
      } finally {
        clearTimeout(fallback)
        done()
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      if (!mounted) return
      try {
        if (session?.user) {
          setUser(await fetchProfile(session.user))
        } else {
          setUser(null)
        }
      } catch {
        setUser(null)
      }
    })

    return () => {
      mounted = false
      clearTimeout(fallback)
      subscription.unsubscribe()
    }
  }, [])

  // Credenciais locais — fallback quando Supabase não está acessível
  const LOCAL_USERS: Record<string, { password: string; role: Role; name: string; email: string }> = {
    'roadmap2026': {
      password: 'FastC@mm2026!',
      role: 'master',
      name: 'Administrador',
      email: 'roadmap2026@fastcomm.internal',
    },
  }

  const login = async (email: string, password: string, username?: string): Promise<string | null> => {
    // 1. Verifica credenciais locais primeiro (instantâneo, sem dependência de rede)
    const localKey = (username ?? '').toLowerCase()
    const localUser = LOCAL_USERS[localKey]
    if (localUser && password === localUser.password) {
      setUser({ id: 'local-' + localKey, email: localUser.email, name: localUser.name, role: localUser.role })
      return null
    }

    // 2. Tenta Supabase como fallback (timeout 8s)
    try {
      const result = await Promise.race([
        supabase.auth.signInWithPassword({ email, password }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 8000)
        ),
      ])
      const { error } = result as Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>
      if (error) {
        if (error.message.includes('Invalid login')) return 'Usuário ou senha incorretos.'
        return error.message
      }
      return null
    } catch (e: unknown) {
      // Se Supabase falhou mas credenciais locais não bateram = credenciais erradas
      return 'Usuário ou senha incorretos.'
    }
  }

  const logout = async () => {
    try { await supabase.auth.signOut() } catch { /* ignora erro */ }
    setUser(null)
  }

  const audit = async (action: string, table: string, id?: string, payload?: object) => {
    if (!user) return
    await supabase.from('audit_logs').insert({
      user_id:    user.id,
      user_email: user.email,
      action,
      table_name: table,
      record_id:  id,
      payload:    payload ?? null,
    })
  }

  return (
    <Ctx.Provider value={{ user, loading, isMaster: user?.role === 'master', login, logout, audit }}>
      {children}
    </Ctx.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth must be inside <AuthProvider>')
  return ctx
}
