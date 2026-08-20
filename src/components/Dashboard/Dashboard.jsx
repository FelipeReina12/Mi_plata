import { useState, useEffect } from 'react'
import MetricCard from './MetricCard'
import TransactionForm from '../Transactions/TransactionForm'
import TransferForm from '../Transactions/TransferForm'
import { supabase } from '../../supabaseClient'

function formatCOP(num) {
  return '$' + num.toLocaleString('es-CO')
}

function Dashboard({ session }) {
  const [transactions, setTransactions] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [isMobile,     setIsMobile]     = useState(window.innerWidth < 768)

  useEffect(() => {
    fetchTransactions()
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  async function fetchTransactions() {
    setLoading(true)
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error cargando:', error)
    } else {
      setTransactions(data)
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

  // Solo ingresos y gastos reales para el saldo
  const totalIncome  = transactions.filter(t => t.type === 'income') .reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
  const totalBalance = totalIncome - totalExpense

  // Fecha actual dinámica
  const currentMonth = new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
  const currentMonthLabel = currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1)

  if (loading) return <p style={{ color: 'var(--text-muted)', padding: '20px' }}>Cargando movimientos...</p>

  return (
    <div>
      <h2 style={{ marginBottom: '20px', color: 'var(--text-main)', fontWeight: '600' }}>
        Resumen — {currentMonthLabel}
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
        gap: '14px',
        marginBottom: '24px'
      }}>
        <MetricCard label="Saldo total" value={formatCOP(totalBalance)} sub="Todas las cuentas" color="var(--text-main)" />
        <MetricCard label="Ingresos"    value={formatCOP(totalIncome)}   sub="Este mes"         color="#1D9E75" />
        <MetricCard label="Gastos"      value={formatCOP(totalExpense)}  sub="Este mes"         color="#D85A30" />
      </div>

      <TransactionForm onAdd={handleAdd} />
      <TransferForm session={session} onTransfer={handleTransfer} />

      <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-light)', padding: '20px' }}>
        <h3 style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--text-main)' }}>Últimos movimientos</h3>

        {transactions.length === 0 && (
          <p style={{ color: 'var(--text-light)', fontSize: '13px' }}>Aún no hay movimientos. ¡Registra el primero!</p>
        )}

        {transactions.map(t => (
          <div key={t.id} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 0', borderBottom: '1px solid var(--border-dim)'
          }}>
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
              {t.type === 'transfer' ? (t.description.includes('→') ? '-' : '+') : t.type === 'income' ? '+' : '-'}{formatCOP(t.amount)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Dashboard