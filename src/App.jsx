import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import MainLayout from './components/Layout/MainLayout'
import Dashboard from './components/Dashboard/Dashboard'
import Reports from './components/Dashboard/Reports'
import Login from './components/Auth/Login'
import Movements from './components/Transactions/Movements'
import Wallets from './components/Wallets/Wallets'
import Budgets from './components/Budgets/Budgets'
import Settings from './components/Settings/Settings'
import ResetPassword from './components/Auth/ResetPassword'

function App() {
  const [page,    setPage]    = useState('dashboard')
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('miplata_theme')
    if (saved !== null) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark')
      localStorage.setItem('miplata_theme', 'dark')
    } else {
      document.body.classList.remove('dark')
      localStorage.setItem('miplata_theme', 'light')
    }
  }, [darkMode])

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
    <MainLayout page={page} setPage={setPage} session={session} darkMode={darkMode} setDarkMode={setDarkMode}>
      {page === 'dashboard' && <Dashboard session={session} />}
      {page === 'reports'   && <Reports />}
      {page === 'movements' && <Movements />}
      {page === 'wallets'   && <Wallets session={session} />}
      {page === 'budgets'   && <Budgets session={session} />}
      {page === 'settings'  && <Settings darkMode={darkMode} setDarkMode={setDarkMode} />}
    </MainLayout>
  )
}

export default App