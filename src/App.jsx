import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import MainLayout from './components/Layout/MainLayout'
import Dashboard from './components/Dashboard/Dashboard'
import Reports from './components/Dashboard/Reports'
import Login from './components/Auth/Login'
import Movements from './components/Transactions/Movements'
import Wallets from './components/Wallets/Wallets'
import Budgets from './components/Budgets/Budgets'
import ResetPassword from './components/Auth/ResetPassword'

function App() {
  const [page,    setPage]    = useState('dashboard')
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <p style={{ padding: '40px', color: '#888' }}>Cargando...</p>

  // Detectar ruta de reset de contraseña
  if (window.location.pathname === '/reset-password') return <ResetPassword />

  if (!session) return <Login />

  return (
    <MainLayout page={page} setPage={setPage} session={session}>
      {page === 'dashboard' && <Dashboard session={session} />}
      {page === 'reports'   && <Reports />}
      {page === 'movements' && <Movements />}
      {page === 'wallets'   && <Wallets session={session} />}
      {page === 'budgets'   && <Budgets session={session} />}
    </MainLayout>
  )
}

export default App