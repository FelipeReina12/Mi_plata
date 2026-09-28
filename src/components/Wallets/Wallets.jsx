import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { Wallet, Plus, ArrowRightLeft, Trash2, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import TransferForm from '../Transactions/TransferForm'
import BalanceLine from '../Transactions/BalanceLine'
import { walletBalances, initialBalancesByName, transferPartners, parseTransfer } from '../../utils/balances'
import useIsMobile from '../../hooks/useIsMobile'
import { byDateDesc } from '../../utils/dates'
import InitialBalanceSetup from './InitialBalanceSetup'
import { mergeWithDefaults, replaceSaved, walletColor, walletTint } from '../../data/defaultWallets'

function formatCOP(num) {
  return '$' + num.toLocaleString('es-CO')
}

const colorOptions = [
  { color: '#8B8FA8', bg: '#8B8FA826' },
  { color: '#0FA971', bg: '#0FA97126' },
  { color: '#3B82F6', bg: '#3B82F626' },
  { color: '#F43F5E', bg: '#F43F5E26' },
  { color: '#7C5CFF', bg: '#7C5CFF26' },
  { color: '#F59E0B', bg: '#F59E0B26' },
]

function Wallets({ session }) {
  const [transactions, setTransactions] = useState([])
  const [wallets, setWallets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(colorOptions[0])
  const [newInitial, setNewInitial] = useState('')
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const isMobile = useIsMobile()
  // La pregunta del saldo inicial solo se muestra si las billeteras cargaron bien
  const [walletsLoaded, setWalletsLoaded] = useState(false)
  // expanded: { wallet: 'Nequi', type: 'income' } o null
  const [expanded, setExpanded] = useState(null)
  // Billetera que se va a eliminar (abre la confirmación)
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

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
    setWallets(mergeWithDefaults(walletData))
    setWalletsLoaded(!!walletData)
    setLoading(false)
  }

  async function handleAddWallet() {
    if (!newName.trim()) return
    setSaving(true)
    setFormError('')
    const newWallet = { name: newName.trim(), color: newColor.color, bg: newColor.bg, user_id: session.user.id }
    // El saldo inicial se pregunta al crear la billetera (vacío = 0), así no vuelve a pedirse después
    let { data, error } = await supabase
      .from('wallets')
      .insert([{ ...newWallet, initial_balance: parseInt(newInitial, 10) || 0 }])
      .select()
    // Si todavía no existe la columna en Supabase y no se escribió saldo, se crea igual sin él
    if (error?.message?.includes('initial_balance') && !newInitial.trim()) {
      ({ data, error } = await supabase.from('wallets').insert([newWallet]).select())
    }
    if (error) {
      console.error(error)
      setFormError(error.message?.includes('initial_balance')
        ? 'Falta crear la columna initial_balance en Supabase. Deja el saldo inicial vacío o crea la columna primero.'
        : 'No se pudo guardar la billetera.')
      setSaving(false)
      return
    }
    setWallets([...wallets, data[0]])
    setNewName('')
    setNewInitial('')
    setNewColor(colorOptions[0])
    setShowForm(false)
    setSaving(false)
  }

  async function handleTransfer(newTxs) {
    setTransactions(prev => [...newTxs, ...prev])
    setShowTransfer(false)
  }

  async function handleDeleteTx(t) {
    // Si es una transferencia completa, se eliminan juntas la salida y la entrada
    const partnerId = transferPartners(transactions).get(t.id)
    const transfer  = partnerId !== undefined && parseTransfer(t)
    const ok = window.confirm(transfer
      ? `Se eliminará la transferencia completa: la salida de ${transfer.from} y la entrada a ${transfer.to}. ¿Continuar?`
      : '¿Eliminar este movimiento?')
    if (!ok) return
    const ids = transfer ? [t.id, partnerId] : [t.id]
    const { error } = await supabase.from('transactions').delete().in('id', ids)
    if (!error) setTransactions(transactions.filter(x => !ids.includes(x.id)))
  }

  async function handleDeleteWallet(w) {
    setDeleting(true)
    setDeleteError('')

    // 1. Ocultar la billetera. Se marca hidden en vez de borrarla para que Efectivo, Nequi y
    //    Banco Falabella (que vienen por defecto) no vuelvan a aparecer.
    const { data, error } = w.id
      ? await supabase.from('wallets').update({ hidden: true }).eq('id', w.id).select()
      : await supabase.from('wallets').insert([{ name: w.name, color: w.color, bg: w.bg, initial_balance: 0, hidden: true, user_id: session.user.id }]).select()

    if (error || !data?.length) {
      console.error(error)
      if (error?.message?.includes('hidden')) setDeleteError('Falta crear la columna hidden en Supabase.')
      else if (!error) setDeleteError('Supabase no permitió actualizar la billetera. Revisa la política UPDATE de la tabla wallets.')
      else setDeleteError('No se pudo eliminar la billetera.')
      setDeleting(false)
      return
    }

    // 2. Borrar sus movimientos (solo después de ocultarla, para no perder nada si lo anterior falla).
    //    La otra mitad de sus transferencias se queda en la otra billetera: esa plata sí entró o salió de allá.
    if (w.movements.length > 0) {
      const { error: txError } = await supabase
        .from('transactions')
        .delete()
        .eq('wallet', w.name)
        .eq('user_id', session.user.id)
      if (txError) {
        console.error(txError)
        setDeleteError('La billetera se eliminó, pero no sus movimientos. Puedes borrarlos desde Movimientos.')
        setWallets(wallets.filter(x => x.name !== w.name))
        setDeleting(false)
        return
      }
    }

    setWallets(wallets.filter(x => x.name !== w.name))
    setTransactions(transactions.filter(t => t.wallet !== w.name))
    if (expanded?.wallet === w.name) setExpanded(null)
    setToDelete(null)
    setDeleting(false)
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
    balance: (w.initial_balance || 0) + (walletSummary[w.name]?.income || 0) - (walletSummary[w.name]?.expense || 0),
    movements: walletSummary[w.name]?.movements || [],
  }))

  const totalBalance = walletsWithBalance.reduce((sum, w) => sum + w.balance, 0)

  // Saldo de la billetera antes y después de cada movimiento
  const balances = walletBalances(transactions, initialBalancesByName(wallets))

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
              background: showTransfer ? '#7C5CFF' : 'var(--bg-card)',
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
              background: '#7C5CFF', color: '#fff', fontSize: '13px',
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
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Saldo inicial (opcional)</label>
                <input style={inputStyle} type="number" inputMode="numeric" placeholder="¿Cuánto tienes hoy en esta billetera?" value={newInitial} onChange={e => setNewInitial(e.target.value)} />
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
              {formError && (
                <div style={{ background: 'var(--error-bg)', color: 'var(--error-text)', fontSize: '12px', padding: '8px 10px', borderRadius: '8px', marginBottom: '12px' }}>
                  {formError}
                </div>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: '9px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'transparent', fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button onClick={handleAddWallet} disabled={saving} style={{ flex: 2, padding: '9px', borderRadius: '8px', border: 'none', background: '#7C5CFF', color: '#fff', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
                  {saving ? 'Guardando...' : 'Guardar billetera'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pregunta de una sola vez: cuánto hay hoy en cada billetera */}
      {walletsLoaded && (
        <InitialBalanceSetup
          session={session}
          wallets={wallets}
          transactions={transactions}
          onSaved={saved => setWallets(ws => replaceSaved(ws, saved))}
        />
      )}

      {/* Saldo total */}
      <div style={{ background: 'linear-gradient(135deg, #7C5CFF 0%, #5B6CFF 55%, #38BDF8 100%)', borderRadius: '20px', padding: '24px 28px', marginBottom: '24px', color: '#fff', boxShadow: '0 12px 32px rgba(124, 92, 255, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.35)' }}>
        <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Saldo total</div>
        <div style={{ fontSize: '32px', fontWeight: '700' }}>{formatCOP(totalBalance)}</div>
        <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '6px' }}>{walletsWithBalance.length} billeteras</div>
      </div>

      {/* Tarjetas */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '14px' }}>
        {walletsWithBalance.map(w => {
          const incomeMovs = [...w.movements].sort(byDateDesc).filter(t => t.type === 'income' || (t.type === 'transfer' && (t.description.includes('←') || t.description.includes('<-'))))
          const expenseMovs = [...w.movements].sort(byDateDesc).filter(t => t.type === 'expense' || (t.type === 'transfer' && (t.description.includes('→') || t.description.includes('->'))))
          const isExpandedIncome = expanded?.wallet === w.name && expanded?.type === 'income'
          const isExpandedExpense = expanded?.wallet === w.name && expanded?.type === 'expense'

          return (
            <div key={w.name} style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
              <div style={{ padding: '20px' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: walletTint(w.color), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Wallet size={18} color={walletColor(w.color)} />
                  </div>
                  <span style={{ fontWeight: '600', fontSize: '15px', color: 'var(--text-main)', flex: 1, minWidth: 0, textAlign: 'left' }}>{w.name}</span>
                  {walletsWithBalance.length > 1 && (
                    <button
                      onClick={() => { setToDelete(w); setDeleteError('') }}
                      aria-label={`Eliminar ${w.name}`}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-lighter)', padding: '8px', margin: '-8px', display: 'flex', flexShrink: 0 }}
                      onMouseEnter={e => e.currentTarget.style.color = '#F43F5E'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-lighter)'}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                {/* Saldo */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Saldo</div>
                  <div style={{ fontSize: '22px', fontWeight: '700', color: w.balance >= 0 ? 'var(--text-main)' : '#F43F5E' }}>
                    {formatCOP(w.balance)}
                  </div>
                </div>

                {/* Botones ingresos y gastos */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => toggleExpand(w.name, 'income')}
                    style={{
                      flex: 1, background: isExpandedIncome ? '#0FA971' : 'var(--success-bg)',
                      borderRadius: '8px', padding: '10px', border: 'none', cursor: 'pointer',
                      textAlign: 'center',
                    }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: isExpandedIncome ? '#fff' : '#0FA971' }}>
                      Ingresos
                    </div>
                    {incomeMovs.length > 0 && (
                      <div style={{ fontSize: '10px', color: isExpandedIncome ? 'rgba(255,255,255,0.7)' : 'rgba(15, 169, 113, 0.8)', marginTop: '2px' }}>
                        {incomeMovs.length} movimientos.
                      </div>
                    )}
                  </button>

                  <button
                    onClick={() => toggleExpand(w.name, 'expense')}
                    style={{
                      flex: 1, background: isExpandedExpense ? '#F43F5E' : 'var(--error-bg)',
                      borderRadius: '8px', padding: '10px', border: 'none', cursor: 'pointer',
                      textAlign: 'center',
                    }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: isExpandedExpense ? '#fff' : '#F43F5E' }}>
                      Gastos
                    </div>
                    {expenseMovs.length > 0 && (
                      <div style={{ fontSize: '10px', color: isExpandedExpense ? 'rgba(255,255,255,0.7)' : 'rgba(244, 63, 94, 0.8)', marginTop: '2px' }}>
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
                        <span style={{ fontSize: '12px', fontWeight: '500', color: isExpandedIncome ? '#0FA971' : '#F43F5E' }}>
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
                                color: isIncoming ? '#0FA971' : '#F43F5E',
                              }}>
                                {isIncoming ? '+' : '-'}{formatCOP(t.amount)}
                              </div>
                              <button
                                onClick={() => handleDeleteTx(t)}
                                aria-label="Eliminar"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-lighter)', padding: '8px', margin: '-4px', flexShrink: 0, display: 'flex' }}
                                onMouseEnter={e => e.currentTarget.style.color = '#F43F5E'}
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

      {/* Confirmación para eliminar billetera */}
      <AnimatePresence>
        {toDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !deleting && setToDelete(null)}
            style={{
              position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0, 0, 0, 0.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '22px', width: '100%', maxWidth: '360px', textAlign: 'left' }}
            >
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-main)', margin: '0 0 10px' }}>
                ¿Eliminar {toDelete.name}?
              </h3>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                {toDelete.movements.length > 0 ? (
                  <p style={{ marginBottom: '8px' }}>
                    Tiene <strong style={{ color: 'var(--text-main)' }}>{toDelete.movements.length} movimiento{toDelete.movements.length !== 1 ? 's' : ''}</strong> que también se eliminará{toDelete.movements.length !== 1 ? 'n' : ''}.
                  </p>
                ) : (
                  <p style={{ marginBottom: '8px' }}>No tiene movimientos.</p>
                )}
                {toDelete.balance !== 0 && (
                  <p style={{ marginBottom: '8px' }}>
                    Su saldo de <strong style={{ color: 'var(--text-main)' }}>{formatCOP(toDelete.balance)}</strong> dejará de contar en tu saldo total.
                  </p>
                )}
                <p>Esto no se puede deshacer.</p>
              </div>

              {deleteError && (
                <div style={{ background: 'var(--error-bg)', color: 'var(--error-text)', fontSize: '12px', padding: '8px 10px', borderRadius: '8px', marginTop: '12px' }}>
                  {deleteError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', marginTop: '18px' }}>
                <button
                  onClick={() => setToDelete(null)}
                  disabled={deleting}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'transparent', fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button
                  onClick={() => handleDeleteWallet(toDelete)}
                  disabled={deleting}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#F43F5E', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                  {deleting ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Wallets