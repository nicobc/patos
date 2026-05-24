import { createContext, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, allowedEmails } from '../lib/supabase'

interface AuthContextValue {
  session: Session | null
  loading: boolean
  authError: string | null
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  loading: true,
  authError: null,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && !allowedEmails.includes(session.user.email ?? '')) {
        void supabase.auth.signOut()
        setSession(null)
        setAuthError('not-authorized')
        setLoading(false)
        return
      }
      setAuthError(null)
      setSession(session)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ session, loading, authError, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext }
