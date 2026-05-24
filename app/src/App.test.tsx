import { render, waitFor } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import App from './App'
import { supabase } from './lib/supabase'

vi.mock('./lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn().mockImplementation((cb: (e: string, s: null) => void) => {
        cb('INITIAL_SESSION', null)
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      }),
      signInWithOAuth: vi.fn().mockResolvedValue({}),
      signOut: vi.fn().mockResolvedValue({}),
    },
  },
  allowedEmails: [],
}))

test('triggers Google sign-in when unauthenticated', async () => {
  render(<App />)
  await waitFor(() => expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  }))
})
