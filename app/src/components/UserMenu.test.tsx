import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi, type Mock } from 'vitest'
import { UserMenu } from './UserMenu'
import { useAuth } from '../context/useAuth'

vi.mock('../context/useAuth', () => ({
  useAuth: vi.fn(),
}))

function setup(name = 'Ana') {
  const signOut = vi.fn()
  ;(useAuth as Mock).mockReturnValue({
    session: { user: { user_metadata: { full_name: name }, email: 'ana@example.com' } },
    signOut,
  })
  render(<UserMenu />)
  return { signOut }
}

test('shows user name as trigger label', () => {
  setup()
  expect(screen.getByRole('button', { name: /Ana/i })).toBeInTheDocument()
})

test('dropdown is closed initially', () => {
  setup()
  expect(screen.queryByRole('button', { name: /sign out/i })).not.toBeInTheDocument()
})

test('opens dropdown on trigger click', async () => {
  setup()
  await userEvent.click(screen.getByRole('button', { name: /Ana/i }))
  expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument()
})

test('closes dropdown on outside click', async () => {
  setup()
  await userEvent.click(screen.getByRole('button', { name: /Ana/i }))
  fireEvent.mouseDown(document.body)
  expect(screen.queryByRole('button', { name: /sign out/i })).not.toBeInTheDocument()
})

test('closes dropdown on outside touch', async () => {
  setup()
  await userEvent.click(screen.getByRole('button', { name: /Ana/i }))
  fireEvent.touchStart(document.body)
  expect(screen.queryByRole('button', { name: /sign out/i })).not.toBeInTheDocument()
})

test('sign-out calls signOut', async () => {
  const { signOut } = setup()
  await userEvent.click(screen.getByRole('button', { name: /Ana/i }))
  await userEvent.click(screen.getByRole('button', { name: /sign out/i }))
  expect(signOut).toHaveBeenCalledOnce()
})

test('falls back to email when no display name', () => {
  ;(useAuth as Mock).mockReturnValue({
    session: { user: { user_metadata: {}, email: 'ana@example.com' } },
    signOut: vi.fn(),
  })
  render(<UserMenu />)
  expect(screen.getByRole('button', { name: /ana@example.com/i })).toBeInTheDocument()
})
