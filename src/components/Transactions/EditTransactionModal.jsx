import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRightLeft } from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { todayLocal } from '../../utils/dates'
import { parseTransfer } from '../../utils/balances'
import { transactionCategories } from '../../data/categories'

const labelStyle = { fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }
const inputStyle = {
  width: '100%', padding: '8px 10px', fontSize: '14px',
  border: '1px solid var(--border-light)', borderRadius: '8px',
  background: 'var(--bg-input)', color: 'var(--text-main)',
}
const titleStyle = { fontSize: '16px', fontWeight: '600', color: 'var(--text-main)', margin: '0 0 16px' }

// Si el valor actual ya no está en la lista (p. ej. una billetera eliminada), se conserva como opción
function withCurrent(options, ...current) {
  return [...current.filter(c => c && !options.includes(c)), ...options]
}

async function updateTransaction(id, changes) {
  const { data, error } = await supabase.from('transactions').update(changes).eq('id', id).select()
  if (error || !data?.length) {
    console.error(error)
    return {
      error: error
        ? 'No se pudieron guardar los cambios.'
        : 'Supabase no permitió editar el movimiento. Revisa la política UPDATE de la tabla transactions.',
    }
  }
  return { row: data[0] }
}

function ErrorBox({ children }) {
  return (
    <div style={{ background: 'var(--error-bg)', color: 'var(--error-text)', fontSize: '12px', padding: '8px 10px', borderRadius: '8px', marginTop: '12px' }}>
      {children}
    </div>
  )
}

function Buttons({ saving, onClose, onSave }) {
  return (
    <div style={{ display: 'flex', gap: '8px', marginTop: '18px' }}>
      <button
        onClick={onClose}
        disabled={saving}
        style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'transparent', fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer' }}>
        Cancelar
      </button>
      <button
        onClick={onSave}
        disabled={saving}
        style={{ flex: 2, padding: '10px', borderRadius: '8px', border: 'none', background: '#7C5CFF', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
        {saving ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </div>
  )
}

// ── Ingreso o gasto ─────────────────────────────────────────────
function IncomeExpenseForm({ transaction, walletNames, onClose, onSaved }) {
  const [type,        setType]        = useState(transaction.type)
  const [description, setDescription] = useState(transaction.description || '')
  const [amount,      setAmount]      = useState(String(transaction.amount ?? ''))
  const [category,    setCategory]    = useState(transaction.category || transactionCategories[0])
  const [wallet,      setWallet]      = useState(transaction.wallet || walletNames[0] || '')
  const [date,        setDate]        = useState(transaction.date || todayLocal())
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')

  async function handleSave() {
    const value = parseInt(amount, 10)
    if (!description.trim())  return setError('Escribe una descripción')
    if (!value || value <= 0) return setError('Ingresa un monto válido')
    if (!date)                return setError('Elige la fecha')

    setSaving(true)
    setError('')
    const { row, error } = await updateTransaction(transaction.id, { type, description: description.trim(), amount: value, category, wallet, date })
    setSaving(false)
    if (error) return setError(error)
    onSaved([row])
  }

  const typeBtn = (active, color) => ({
    flex: 1, padding: '8px', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', fontSize: '13px',
    border: active ? 'none' : '1px solid var(--border-light)',
    background: active ? color : 'transparent',
    color: active ? '#fff' : 'var(--text-muted)',
  })

  return (
    <>
      <h3 style={titleStyle}>Editar movimiento</h3>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <button style={typeBtn(type === 'income', '#0FA971')} onClick={() => setType('income')}>↓ Ingreso</button>
        <button style={typeBtn(type === 'expense', '#F43F5E')} onClick={() => setType('expense')}>↑ Gasto</button>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label style={labelStyle}>Descripción</label>
        <input style={inputStyle} value={description} onChange={e => setDescription(e.target.value)} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
        <div>
          <label style={labelStyle}>Monto ($)</label>
          <input style={inputStyle} type="number" inputMode="numeric" value={amount} onChange={e => setAmount(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Fecha</label>
          <input style={inputStyle} type="date" max={todayLocal()} value={date} onChange={e => setDate(e.target.value)} />
        </div>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label style={labelStyle}>Categoría</label>
        <select style={inputStyle} value={category} onChange={e => setCategory(e.target.value)}>
          {withCurrent(transactionCategories, category).map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div style={{ marginBottom: '4px' }}>
        <label style={labelStyle}>Billetera</label>
        <select style={inputStyle} value={wallet} onChange={e => setWallet(e.target.value)}>
          {withCurrent(walletNames, wallet).map(w => <option key={w}>{w}</option>)}
        </select>
      </div>

      {error && <ErrorBox>{error}</ErrorBox>}
      <Buttons saving={saving} onClose={onClose} onSave={handleSave} />
    </>
  )
}

// ── Transferencia: se editan juntas la salida y la entrada ──────
function TransferEditForm({ transaction, partner, walletNames, onClose, onSaved }) {
  const parsed = parseTransfer(transaction)
  const out = parsed.isOut ? transaction : partner
  const inn = parsed.isOut ? partner : transaction

  const [from,        setFrom]        = useState(parsed.from)
  const [to,          setTo]          = useState(parsed.to)
  const [amount,      setAmount]      = useState(String(transaction.amount ?? ''))
  const [date,        setDate]        = useState(transaction.date || todayLocal())
  const [description, setDescription] = useState(parsed.base)
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')

  async function handleSave() {
    const value = parseInt(amount, 10)
    if (from === to)          return setError('Las billeteras deben ser diferentes')
    if (!value || value <= 0) return setError('Ingresa un monto válido')
    if (!date)                return setError('Elige la fecha')

    const desc = description.trim() || 'Transferencia'
    setSaving(true)
    setError('')

    const first = await updateTransaction(out.id, { wallet: from, description: `${desc} → ${to}`, amount: value, date })
    if (first.error) { setSaving(false); return setError(first.error) }

    const second = await updateTransaction(inn.id, { wallet: to, description: `${desc} ← ${from}`, amount: value, date })
    if (second.error) {
      // Deshacer la salida para que la transferencia no quede descuadrada
      await updateTransaction(out.id, { wallet: out.wallet, description: out.description, amount: out.amount, date: out.date })
      setSaving(false)
      return setError(second.error)
    }

    setSaving(false)
    onSaved([first.row, second.row])
  }

  return (
    <>
      <h3 style={titleStyle}>Editar transferencia</h3>

      <div style={{ marginBottom: '4px' }}>
        <label style={labelStyle}>Desde</label>
        <select style={inputStyle} value={from} onChange={e => setFrom(e.target.value)}>
          {withCurrent(walletNames, from).map(w => <option key={w}>{w}</option>)}
        </select>
      </div>
      <div style={{ textAlign: 'center', color: '#7C5CFF', margin: '4px 0' }}>
        <ArrowRightLeft size={18} style={{ transform: 'rotate(90deg)' }} />
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label style={labelStyle}>Hacia</label>
        <select style={inputStyle} value={to} onChange={e => setTo(e.target.value)}>
          {withCurrent(walletNames, to).map(w => <option key={w}>{w}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
        <div>
          <label style={labelStyle}>Monto ($)</label>
          <input style={inputStyle} type="number" inputMode="numeric" value={amount} onChange={e => setAmount(e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Fecha</label>
          <input style={inputStyle} type="date" max={todayLocal()} value={date} onChange={e => setDate(e.target.value)} />
        </div>
      </div>

      <div style={{ marginBottom: '4px' }}>
        <label style={labelStyle}>Descripción (opcional)</label>
        <input style={inputStyle} placeholder="Transferencia" value={description} onChange={e => setDescription(e.target.value)} />
      </div>

      {error && <ErrorBox>{error}</ErrorBox>}
      <Buttons saving={saving} onClose={onClose} onSave={handleSave} />
    </>
  )
}

// ── Ventana ─────────────────────────────────────────────────────
// partner: la otra mitad si es una transferencia (null si quedó sola).
// onSaved recibe la lista de movimientos actualizados (uno, o dos si es transferencia).
function EditTransactionModal({ transaction, partner, walletNames, onClose, onSaved }) {
  const isTransfer = transaction.type === 'transfer'
  const canEditTransfer = isTransfer && partner && parseTransfer(transaction)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
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
        style={{
          background: 'var(--bg-card)', borderRadius: '16px', padding: '22px', width: '100%', maxWidth: '400px',
          maxHeight: 'calc(100vh - 32px)', overflowY: 'auto', textAlign: 'left',
        }}
      >
        {canEditTransfer ? (
          <TransferEditForm transaction={transaction} partner={partner} walletNames={walletNames} onClose={onClose} onSaved={onSaved} />
        ) : isTransfer ? (
          <>
            <h3 style={{ ...titleStyle, marginBottom: '10px' }}>Transferencia</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              La otra parte de esta transferencia ya no existe (por ejemplo, porque se eliminó esa billetera),
              así que no se puede editar. Si quieres, puedes eliminarla.
            </p>
            <button
              onClick={onClose}
              style={{ width: '100%', marginTop: '18px', padding: '10px', borderRadius: '8px', border: 'none', background: '#7C5CFF', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
              Entendido
            </button>
          </>
        ) : (
          <IncomeExpenseForm transaction={transaction} walletNames={walletNames} onClose={onClose} onSaved={onSaved} />
        )}
      </motion.div>
    </motion.div>
  )
}

export default EditTransactionModal
