import { render, waitFor } from '@testing-library/react'
import { expect, test, vi, type Mock } from 'vitest'
import { SignIn } from './SignIn'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/useAuth'

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOAuth: vi.fn().mockResolvedValue({}),
    },
  },
  allowedEmails: [],
}))

vi.mock('../context/useAuth', () => ({
  useAuth: vi.fn(),
}))

test('redirects to Google on mount', async () => {
  (useAuth as Mock).mockReturnValue({ authError: null })
  render(<SignIn />)
  await waitFor(() => expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
    provider: 'google',
    options: { redirectTo: window.location.origin + '/' },
  }))
})

test('redirects to stored destination after protected route redirect', async () => {
  sessionStorage.setItem('auth_redirect', '/dashboard')
  ;(useAuth as Mock).mockReturnValue({ authError: null })
  render(<SignIn />)
  await waitFor(() => expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
    provider: 'google',
    options: { redirectTo: window.location.origin + '/dashboard' },
  }))
})

test('forces account picker after auth rejection', async () => {
  (useAuth as Mock).mockReturnValue({ authError: 'not-authorized' })
  render(<SignIn />)
  await waitFor(() => expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
    provider: 'google',
    options: { redirectTo: window.location.origin + '/', queryParams: { prompt: 'select_account' } },
  }))
})
