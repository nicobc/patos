import { render, screen, act, waitFor } from '@testing-library/react'
import { expect, test, vi, type Mock } from 'vitest'
import { AuthProvider } from './AuthContext'
import { useAuth } from './useAuth'
import { supabase } from '../lib/supabase'

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(),
      signOut: vi.fn().mockResolvedValue({}),
    },
  },
  allowedEmails: ['allowed@example.com'],
}))

function Probe() {
  const { session, loading, authError } = useAuth()
  if (loading) return <span>loading</span>
  if (authError) return <span>error:{authError}</span>
  return <span>{session ? session.user.email : 'signed-out'}</span>
}

function setup() {
  let fire: (session: unknown) => void = () => {}
  ;(supabase.auth.onAuthStateChange as Mock).mockImplementation((cb: (e: string, s: unknown) => void) => {
    fire = (session) => cb('SIGNED_IN', session)
    return { data: { subscription: { unsubscribe: vi.fn() } } }
  })
  render(<AuthProvider><Probe /></AuthProvider>)
  return { fire }
}

test('accepts an allowlisted session', async () => {
  const { fire } = setup()
  act(() => fire({ user: { email: 'allowed@example.com' } }))
  expect(await screen.findByText('allowed@example.com')).toBeInTheDocument()
})

test('rejects and signs out a non-allowlisted session', async () => {
  const { fire } = setup()
  act(() => fire({ user: { email: 'stranger@example.com' } }))
  await waitFor(() => expect(supabase.auth.signOut).toHaveBeenCalled())
  expect(screen.getByText('error:not-authorized')).toBeInTheDocument()
})

test('sets session to null when signed out', async () => {
  const { fire } = setup()
  act(() => fire(null))
  expect(await screen.findByText('signed-out')).toBeInTheDocument()
})
