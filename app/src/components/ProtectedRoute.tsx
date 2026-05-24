import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

export function ProtectedRoute() {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) return null
  if (!session) {
    sessionStorage.setItem('auth_redirect', location.pathname)
    return <Navigate to="/sign-in" replace />
  }
  return <Outlet />
}
