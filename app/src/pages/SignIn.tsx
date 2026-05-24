import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'

export function SignIn() {
  const { authError } = useAuth()

  useEffect(() => {
    const destination = authError ? '/' : (sessionStorage.getItem('auth_redirect') ?? '/')
    if (!authError) sessionStorage.removeItem('auth_redirect')
    void supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + destination,
        ...(authError ? { queryParams: { prompt: 'select_account' } } : {}),
      },
    })
  }, [authError])

  return null
}
