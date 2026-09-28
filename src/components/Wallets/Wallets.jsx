import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { Wallet, Plus, ArrowRightLeft, Trash2, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import TransferForm from '../Transactions/TransferForm'
import BalanceLine from '../Transactions/BalanceLine'
import { walletBalances } from '../../utils/balances'
import useIsMobile from '../../hooks/useIsMobile'

function formatCOP(num) {
  return '$' + num.toLocaleString('es-CO')
}

const defaultWallets = [
  { name: 'Efectivo', color: '#888780', bg: '#F1EFE8' },
  { name: 'Nequi', color: '#1D9E75', bg: '#E1F5EE' },
  { name: 'Banco Falabella', color: '#185FA5', bg: '#E6F1FB' },
]

const colorOptions = [
  { color: '#888780', bg: '#F1EFE8' },
  { color: '#1D9E75', bg: '#E1F5EE' },
  { color: '#185FA5', bg: '#E6F1FB' },
  { color: '#D85A30', bg: '#FAECE7' },
  { color: '#7F77DD', bg: '#EEEDFE' },
  { color: '#EF9F27', bg: '#FAEEDA' },
]

function Wallets({ session }) {
  const [transactions, setTransactions] = useState([])
  const [wallets, setWallets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(colorOptions[0])
  const [saving, setSaving] = useState(false)
  const isMobile = useIsMobile()
  // expanded: { wallet: 'Nequi', type: 'income' } o null
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    const [{ data: txData }, { data: walletData }] = await Promise.all([
      supabase.from('transactions').select('*').order('created_at', { ascending: false }),
      supabase.from('wallets').select('*').order('created_at'),
    ])
    if (txData) setTransactions(txData)
    if (walletData) {
      const userWalletNames = walletData.map(w => w.name)
      const defaults = defaultWallets.filter(w => !userWalletNames.includes(w.name))
      setWallets([...defaults, ...walletData])
    } else {
      setWallets(defaultWallets)
    }
    setLoading(false)
  }

  async function handleAddWallet() {
    if (!newName.trim()) return
    setSaving(true)
    const { data, error } = await supabase
      .from('wallets')
      .insert([{ name: newName.trim(), color: newColor.color, bg: newColor.bg, user_id: session.user.id }])
      .select()
    if (error) { console.error(error); setSaving(false); return }
    setWallets([...wallets, data[0]])
    setNewName('')
    setNewColor(colorOptions[0])
    setShowForm(false)
    setSaving(false)
  }

  async function handleTransfer(newTxs) {
    setTransactions(prev => [...newTxs, ...prev])
    setShowTransfer(false)
  }

  async function handleDeleteTx(id) {
    const ok = window.confirm('¿Eliminar este movimiento?')
    if (!ok) return
    const { error } = await supabase.from('transactions').delete().eq('id', id)
    if (!error) setTransactions(transactions.filter(t => t.id !== id))
  }

  function toggleExpand(walletName, type) {
    if (expanded?.wallet === walletName && expanded?.type === type) {
      setExpanded(null)
    } else {
      setExpanded({ wallet: walletName, type })
    }
  }

  const walletSummary = transactions.reduce((acc, t) => {
    if (!acc[t.wallet]) acc[t.wallet] = { income: 0, expense: 0, movements: [] }
    if (t.type === 'income') {
      acc[t.wallet].income += t.amount
    } else if (t.type === 'expense') {
      acc[t.wallet].expense += t.amount
    } else if (t.type === 'transfer') {
      // Salida de la billetera origen: descuenta del saldo
      if (t.description.includes('→') || t.description.includes('->')) {
        acc[t.wallet].expense += t.amount
      }
      // Entrada a la billetera destino: suma al saldo
      else if (t.description.includes('←') || t.description.includes('<-')) {
        acc[t.wallet].income += t.amount
      }
    }
    acc[t.wallet].movements.push(t)
    return acc
  }, {})

  const walletsWithBalance = wallets.map(w => ({
    ...w,
    income: walletSummary[w.name]?.income || 0,
    expense: walletSummary[w.name]?.expense || 0,
    balance: (walletSummary[w.name]?.income || 0) - (walletSummary[w.name]?.expense || 0),
    movements: walletSummary[w.name]?.movements || [],
  }))

  const totalBalance = walletsWithBalance.reduce((sum, w) => sum + w.balance, 0)

  // Saldo de la billetera antes y después de cada movimiento
  const balances = walletBalances(transactions)

  const inputStyle = {
    width: '100%', padding: '9px 12px', fontSize: '14px',
    border: '1px solid var(--border-light)', borderRadius: '8px',
    background: 'var(--bg-input)', color: 'var(--text-main)',
  }

  if (loading) return <p style={{ color: 'var(--text-muted)', padding: '20px' }}>Cargando billeteras...</p>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ color: 'var(--text-main)', fontWeight: '600' }}>Billeteras</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => { setShowTransfer(!showTransfer); if (showForm) setShowForm(false) }}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border-light)',
              background: showTransfer ? '#7F77DD' : 'var(--bg-card)',
              color: showTransfer ? '#fff' : 'var(--text-main)',
              fontSize: '13px', fontWeight: '500', cursor: 'pointer',
            }}>
            <ArrowRightLeft size={15} /> Transferir
          </button>
          <button
            onClick={() => { setShowForm(!showForm); if (showTransfer) setShowTransfer(false) }}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 14px', borderRadius: '8px', border: 'none',
              background: '#7F77DD', color: '#fff', fontSize: '13px',
              fontWeight: '500', cursor: 'pointer',
            }}>
            <Plus size={15} /> Nueva billetera
          </button>
        </div>
      </div>

      {/* Formulario de transferencia */}
      <AnimatePresence>
        {showTransfer && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden', marginBottom: '16px' }}
          >
            <TransferForm session={session} onTransfer={handleTransfer} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Formulario nueva billetera */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden', marginBottom: '16px' }}
          >
            <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-light)', padding: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '14px' }}>Nueva billetera</h3>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Nombre</label>
                <input style={inputStyle} placeholder="Ej: Daviplata, Ahorro..." value={newName} onChange={e => setNewName(e.target.value)} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Color</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {colorOptions.map(c => (
                    <div key={c.color} onClick={() => setNewColor(c)} style={{
                      width: '28px', height: '28px', borderRadius: '50%', background: c.color, cursor: 'pointer',
                      border: newColor.color === c.color ? '3px solid var(--text-main)' : '3px solid transparent',
                    }} />
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: '9px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'transparent', fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button onClick={handleAddWallet} disabled={saving} style={{ flex: 2, padding: '9px', borderRadius: '8px', border: 'none', background: '#7F77DD', color: '#fff', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
                  {saving ? 'Guardando...' : 'Guardar billetera'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Saldo total */}
      <div style={{ background: '#7F77DD', borderRadius: '16px', padding: '24px 28px', marginBottom: '24px', color: '#fff' }}>
        <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Saldo total</div>
        <div style={{ fontSize: '32px', fontWeight: '700' }}>{formatCOP(totalBalance)}</div>
        <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '6px' }}>{walletsWithBalance.length} billeteras</div>
      </div>

      {/* Tarjetas */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '14px' }}>
        {walletsWithBalance.map(w => {
          const incomeMovs = w.movements.filter(t => t.type === 'income' || (t.type === 'transfer' && (t.description.includes('←') || t.description.includes('<-'))))
          const expenseMovs = w.movements.filter(t => t.type === 'expense' || (t.type === 'transfer' && (t.description.includes('→') || t.description.includes('->'))))
          const isExpandedIncome = expanded?.wallet === w.name && expanded?.type === 'income'
          const isExpandedExpense = expanded?.wallet === w.name && expanded?.type === 'expense'

          return (
            <div key={w.name} style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
              <div style={{ padding: '20px' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: w.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Wallet size={18} color={w.color} />
                  </div>
                  <span style={{ fontWeight: '600', fontSize: '15px', color: 'var(--text-main)' }}>{w.name}</span>
                </div>

                {/* Saldo */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Saldo</div>
                  <div style={{ fontSize: '22px', fontWeight: '700', color: w.balance >= 0 ? 'var(--text-main)' : '#D85A30' }}>
                    {formatCOP(w.balance)}
                  </div>
                </div>

                {/* Botones ingresos y gastos */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => toggleExpand(w.name, 'income')}
                    style={{
                      flex: 1, background: isExpandedIncome ? '#1D9E75' : '#E1F5EE',
                      borderRadius: '8px', padding: '10px', border: 'none', cursor: 'pointer',
                      textAlign: 'center',
                    }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: isExpandedIncome ? '#fff' : '#1D9E75' }}>
                      Ingresos
                    </div>
                    {incomeMovs.length > 0 && (
                      <div style={{ fontSize: '10px', color: isExpandedIncome ? 'rgba(255,255,255,0.7)' : '#6dbfa0', marginTop: '2px' }}>
                        {incomeMovs.length} movimientos.
                      </div>
                    )}
                  </button>

                  <button
                    onClick={() => toggleExpand(w.name, 'expense')}
                    style={{
                      flex: 1, background: isExpandedExpense ? '#D85A30' : '#FAECE7',
                      borderRadius: '8px', padding: '10px', border: 'none', cursor: 'pointer',
                      textAlign: 'center',
                    }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: isExpandedExpense ? '#fff' : '#D85A30' }}>
                      Gastos
                    </div>
                    {expenseMovs.length > 0 && (
                      <div style={{ fontSize: '10px', color: isExpandedExpense ? 'rgba(255,255,255,0.7)' : '#e09070', marginTop: '2px' }}>
                        {expenseMovs.length} movimientos.
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {/* Lista desplegable */}
              <AnimatePresence>
                {(isExpandedIncome || isExpandedExpense) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ borderTop: '1px solid var(--border-dim)' }}>
                      <div style={{
                        padding: '10px 20px 6px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}>
                        <span style={{ fontSize: '12px', fontWeight: '500', color: isExpandedIncome ? '#1D9E75' : '#D85A30' }}>
                          {isExpandedIncome ? 'Ingresos y entradas' : 'Gastos y salidas'} en {w.name}
                        </span>
                        <button onClick={() => setExpanded(null)} aria-label="Cerrar" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-lighter)', padding: '8px', margin: '-8px', display: 'flex' }}>
                          <X size={14} />
                        </button>
                      </div>

                      <div style={{ padding: '0 20px' }}>
                        {(isExpandedIncome ? incomeMovs : expenseMovs).map(t => {
                          const isIncoming = t.type === 'income' || (t.type === 'transfer' && (t.description.includes('←') || t.description.includes('<-')))
                          return (
                            <div key={t.id} style={{
                              display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto auto',
                              alignItems: 'center', columnGap: '10px', rowGap: '3px',
                              padding: '9px 0', borderBottom: '1px solid var(--border-dim)',
                            }}>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {t.description}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '1px' }}>
                                  {t.category} · {t.date}
                                </div>
                              </div>
                              <div style={{
                                fontSize: '13px', fontWeight: '600', flexShrink: 0,
                                color: isIncoming ? '#1D9E75' : '#D85A30',
                              }}>
                                {isIncoming ? '+' : '-'}{formatCOP(t.amount)}
                              </div>
                              <button
                                onClick={() => handleDeleteTx(t.id)}
                                aria-label="Eliminar"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-lighter)', padding: '8px', margin: '-4px', flexShrink: 0, display: 'flex' }}
                                onMouseEnter={e => e.currentTarget.style.color = '#D85A30'}
                                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-lighter)'}
                              >
                                <Trash2 size={15} />
                              </button>

                              {/* Saldo de la billetera antes → después */}
                              <div style={{ gridColumn: isMobile ? '1 / 3' : '1 / 2' }}>
                                <BalanceLine balance={balances[t.id]} />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Wallets