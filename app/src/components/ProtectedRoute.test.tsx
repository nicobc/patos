import { render, screen } from '@testing-library/react'
import { expect, test, vi, type Mock, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { useAuth } from '../context/useAuth'

vi.mock('../context/useAuth', () => ({
  useAuth: vi.fn(),
}))

function renderWithRouter(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/sign-in" element={<div>sign-in page</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<div>home</div>} />
          <Route path="/dashboard" element={<div>dashboard</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

beforeEach(() => sessionStorage.clear())

test('authenticated users reach the protected route', () => {
  ;(useAuth as Mock).mockReturnValue({ session: { user: { email: 'a@b.com' } }, loading: false })
  renderWithRouter('/')
  expect(screen.getByText('home')).toBeInTheDocument()
})

test('unauthenticated users are redirected to sign-in', () => {
  ;(useAuth as Mock).mockReturnValue({ session: null, loading: false })
  renderWithRouter('/')
  expect(screen.getByText('sign-in page')).toBeInTheDocument()
})

test('redirect stores the intended destination in sessionStorage', () => {
  ;(useAuth as Mock).mockReturnValue({ session: null, loading: false })
  renderWithRouter('/dashboard')
  expect(sessionStorage.getItem('auth_redirect')).toBe('/dashboard')
})

test('loading state renders nothing', () => {
  ;(useAuth as Mock).mockReturnValue({ session: null, loading: true })
  const { container } = renderWithRouter('/')
  expect(container).toBeEmptyDOMElement()
})
