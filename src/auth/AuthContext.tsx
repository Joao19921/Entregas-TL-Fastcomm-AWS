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

    // Fallback: máximo 10 segundos de loading — NÃO apaga a sessão
    const fallback = setTimeout(done, 10000)

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

  const login = async (email: string, password: string, _username?: string): Promise<string | null> => {
    try {
      // Timeout 30s — necessário para redes com latência maior
      const result = await Promise.race([
        supabase.auth.signInWithPassword({ email, password }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 30000)
        ),
      ])
      const { error } = result as Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>
      if (error) {
        if (error.message.includes('Invalid login') || error.message.includes('invalid')) return 'Usuário ou senha incorretos.'
        return error.message
      }
      return null
    } catch (e: unknown) {
      if (e instanceof Error && e.message === 'timeout')
        return '__timeout__'
      return 'Erro de conexão. Verifique sua internet e tente novamente.'
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
