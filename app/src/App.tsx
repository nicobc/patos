import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/useAuth'
import { ProtectedRoute } from './components/ProtectedRoute'
import { SignIn } from './pages/SignIn'

function Home() {
  const { signOut } = useAuth()
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
      <BrowserRouter>
        <Routes>
          <Route path="/sign-in" element={<SignIn />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Home />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
