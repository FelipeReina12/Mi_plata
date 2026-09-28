import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../supabaseClient'
import { todayLocal } from '../../utils/dates'
import { transactionCategories } from '../../data/categories'

// Ventana para editar un ingreso o gasto ya registrado.
// Las transferencias no se editan aquí: son dos movimientos enlazados y cambiar uno solo los descuadraría.
function EditTransactionModal({ transaction, walletNames, onClose, onSaved }) {
  const isTransfer = transaction.type === 'transfer'

  const [type,        setType]        = useState(transaction.type)
  const [description, setDescription] = useState(transaction.description || '')
  const [amount,      setAmount]      = useState(String(transaction.amount ?? ''))
  const [category,    setCategory]    = useState(transaction.category || transactionCategories[0])
  const [wallet,      setWallet]      = useState(transaction.wallet || walletNames[0] || '')
  const [date,        setDate]        = useState(transaction.date || todayLocal())
  const [saving,      setSaving]      = useState(false)
  const [error,       setError]       = useState('')

  // Si el movimiento tiene una categoría o billetera que ya no está en la lista, se conserva como opción
  const categoryOptions = transactionCategories.includes(category) ? transactionCategories : [category, ...transactionCategories]
  const walletOptions   = walletNames.includes(wallet) ? walletNames : [wallet, ...walletNames]

  async function handleSave() {
    const value = parseInt(amount, 10)
    if (!description.trim())      return setError('Escribe una descripción')
    if (!value || value <= 0)     return setError('Ingresa un monto válido')
    if (!date)                    return setError('Elige la fecha')

    setSaving(true)
    setError('')
    const { data, error } = await supabase
      .from('transactions')
      .update({ type, description: description.trim(), amount: value, category, wallet, date })
      .eq('id', transaction.id)
      .select()
    setSaving(false)

    if (error || !data?.length) {
      console.error(error)
      setError(error
        ? 'No se pudieron guardar los cambios.'
        : 'Supabase no permitió editar el movimiento. Revisa la política UPDATE de la tabla transactions.')
      return
    }
    onSaved(data[0])
  }

  const labelStyle = { fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }
  const inputStyle = {
    width: '100%', padding: '8px 10px', fontSize: '14px',
    border: '1px solid var(--border-light)', borderRadius: '8px',
    background: 'var(--bg-input)', color: 'var(--text-main)',
  }
  const typeBtn = (active, color) => ({
    flex: 1, padding: '8px', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', fontSize: '13px',
    border: active ? 'none' : '1px solid var(--border-light)',
    background: active ? color : 'transparent',
    color: active ? '#fff' : 'var(--text-muted)',
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => !saving && onClose()}
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
        {isTransfer ? (
          <>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-main)', margin: '0 0 10px' }}>Transferencia</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
              Las transferencias todavía no se pueden editar. Si te equivocaste, elimínala y hazla de nuevo.
            </p>
            <button
              onClick={onClose}
              style={{ width: '100%', marginTop: '18px', padding: '10px', borderRadius: '8px', border: 'none', background: '#7F77DD', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
              Entendido
            </button>
          </>
        ) : (
          <>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-main)', margin: '0 0 16px' }}>Editar movimiento</h3>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <button style={typeBtn(type === 'income', '#1D9E75')} onClick={() => setType('income')}>↓ Ingreso</button>
              <button style={typeBtn(type === 'expense', '#D85A30')} onClick={() => setType('expense')}>↑ Gasto</button>
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
                {categoryOptions.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '4px' }}>
              <label style={labelStyle}>Billetera</label>
              <select style={inputStyle} value={wallet} onChange={e => setWallet(e.target.value)}>
                {walletOptions.map(w => <option key={w}>{w}</option>)}
              </select>
            </div>

            {error && (
              <div style={{ background: '#FAECE7', color: '#712B13', fontSize: '12px', padding: '8px 10px', borderRadius: '8px', marginTop: '12px' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '8px', marginTop: '18px' }}>
              <button
                onClick={onClose}
                disabled={saving}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'transparent', fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ flex: 2, padding: '10px', borderRadius: '8px', border: 'none', background: '#7F77DD', color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}

export default EditTransactionModal
