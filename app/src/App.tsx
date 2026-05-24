import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/useAuth'
import { SignIn } from './pages/SignIn'

function AppContent() {
  const { session, loading, signOut } = useAuth()

  if (loading) return null
  if (!session) return <SignIn />

  return (
    <main>
      <h1>patos</h1>
      <button className="btn-ghost" onClick={signOut}>Sign out</button>
    </main>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
