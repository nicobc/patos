import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function SignIn() {
  const { authError } = useAuth()

  useEffect(() => {
    void supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        ...(authError ? { queryParams: { prompt: 'select_account' } } : {}),
      },
    })
  }, [authError])

  return null
}
