import { useState, useEffect } from 'react'
import MetricCard from './MetricCard'
import TransactionForm from '../Transactions/TransactionForm'
import TransferForm from '../Transactions/TransferForm'
import { supabase } from '../../supabaseClient'
import { motion } from 'framer-motion'
import useIsMobile from '../../hooks/useIsMobile'
import InitialBalanceSetup from '../Wallets/InitialBalanceSetup'
import { mergeWithDefaults, replaceSaved } from '../../data/defaultWallets'

function formatCOP(num) {
  return '$' + num.toLocaleString('es-CO')
}

function Dashboard({ session, setPage }) {
  const [transactions,  setTransactions]  = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [loading,       setLoading]       = useState(true)
  const [wallets,       setWallets]       = useState([]) // vacío si no cargaron: así no se muestra la pregunta del saldo inicial
  const isMobile = useIsMobile()

  useEffect(() => {
    fetchTransactions()
  }, [])

  async function fetchTransactions() {
    setLoading(true)
    const [{ data: txData }, { data: subData }, { data: walletData }] = await Promise.all([
      supabase.from('transactions').select('*').order('created_at', { ascending: false }),
      supabase.from('subscriptions').select('*').order('next_date', { ascending: true }),
      supabase.from('wallets').select('*'),
    ])

    if (txData) setTransactions(txData)
    if (walletData) setWallets(mergeWithDefaults(walletData))
    if (subData) {
      // Filtrar suscripciones urgentes (próximos 7 días)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const upcoming = subData.filter(s => {
        let nextDate = new Date(s.next_date + 'T00:00:00')
        nextDate.setHours(0, 0, 0, 0)
        if (nextDate < today) {
          while(nextDate < today) nextDate.setMonth(nextDate.getMonth() + 1)
        }
        const diffDays = Math.ceil(Math.abs(nextDate - today) / (1000 * 60 * 60 * 24))
        return diffDays <= 7
      })
      setSubscriptions(upcoming)
    }
    setLoading(false)
  }

  async function handleAdd(newTransaction) {
    const { data, error } = await supabase
      .from('transactions')
      .insert([{ ...newTransaction, user_id: session.user.id }])
      .select()

    if (error) {
      console.error('Error guardando:', error)
    } else {
      setTransactions([data[0], ...transactions])
    }
  }

  function handleTransfer(newTxs) {
    setTransactions([...newTxs, ...transactions])
  }

  // Filtrar movimientos del mes actual para métricas de mes
  const currentMonthKey = new Date().toISOString().slice(0, 7)
  const thisMonthTxs = transactions.filter(t => t.date && t.date.startsWith(currentMonthKey))
  const totalIncome  = thisMonthTxs.filter(t => t.type === 'income') .reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = thisMonthTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
  const initialTotal = wallets.reduce((sum, w) => sum + (w.initial_balance || 0), 0) // suma de los saldos iniciales
  const totalBalance = initialTotal + transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) - transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)

  // Fecha actual dinámica
  const currentMonth = new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
  const currentMonthLabel = currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1)

  if (loading) return <p style={{ color: 'var(--text-muted)', padding: '20px' }}>Cargando movimientos...</p>

  return (
    <div>
      <h2 style={{ marginBottom: '20px', color: 'var(--text-main)', fontWeight: '600' }}>
        Resumen — {currentMonthLabel}
      </h2>

      {/* Pregunta de una sola vez: cuánto hay hoy en cada billetera */}
      <InitialBalanceSetup
        session={session}
        wallets={wallets}
        transactions={transactions}
        onSaved={saved => setWallets(ws => replaceSaved(ws, saved))}
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          display: 'grid',
          // En celular: saldo total a lo ancho e ingresos/gastos lado a lado
          gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)',
          gap: isMobile ? '10px' : '14px',
          marginBottom: isMobile ? '20px' : '24px'
        }}
      >
        <div style={{ gridColumn: isMobile ? '1 / -1' : 'auto' }}>
          <MetricCard label="Saldo total" value={formatCOP(totalBalance)} sub="Todas las cuentas" color="var(--text-main)" />
        </div>
        <MetricCard label="Ingresos" value={formatCOP(totalIncome)}  sub="Este mes" color="#1D9E75" compact={isMobile} />
        <MetricCard label="Gastos"   value={formatCOP(totalExpense)} sub="Este mes" color="#D85A30" compact={isMobile} />
      </motion.div>

      <TransactionForm onAdd={handleAdd} />
      <TransferForm session={session} onTransfer={handleTransfer} />

      {/* Widget Próximos Pagos */}
      {subscriptions.length > 0 && (
        <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-light)', padding: '20px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '14px', color: 'var(--text-main)', fontWeight: '600' }}>Próximos pagos fijos (7 días)</h3>
            <button onClick={() => setPage && setPage('subscriptions')} style={{ background: 'none', border: 'none', color: '#7F77DD', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
              Ver todas
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {subscriptions.map(s => (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-input)', padding: '10px 14px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#D85A30' }} />
                  <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-main)' }}>{s.name}</span>
                </div>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#D85A30' }}>-{formatCOP(s.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-light)', padding: '20px' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--text-main)' }}>Últimos movimientos</h3>

        {transactions.length === 0 && (
          <p style={{ color: 'var(--text-light)', fontSize: '13px' }}>Aún no hay movimientos. ¡Registra el primero!</p>
        )}

        {transactions.slice(0, 20).map((t, i) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, duration: 0.2 }}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 0', borderBottom: '1px solid var(--border-dim)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
              {t.type === 'transfer'
                ? <span style={{ color: '#7F77DD', fontSize: '16px', flexShrink: 0 }}>⇄</span>
                : <div style={{
                    width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                    background: t.type === 'income' ? '#1D9E75' : '#D85A30',
                  }} />
              }
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.description}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '2px' }}>{t.category} · {t.wallet} · {t.date}</div>
              </div>
            </div>
            <div style={{
              fontSize: '13px', fontWeight: '600', flexShrink: 0, marginLeft: '10px',
              color: t.type === 'transfer' ? '#7F77DD' : t.type === 'income' ? '#1D9E75' : '#D85A30',
            }}>
              {t.type === 'transfer' ? (t.description.includes('→') || t.description.includes('->') ? '-' : '+') : t.type === 'income' ? '+' : '-'}{formatCOP(t.amount)}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default Dashboard