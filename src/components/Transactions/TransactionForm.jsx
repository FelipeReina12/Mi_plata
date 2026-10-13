import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import useIsMobile from '../../hooks/useIsMobile'
import { defaultWallets, mergeWithDefaults } from '../../data/defaultWallets'
import { todayLocal } from '../../utils/dates'
import { transactionCategories as categoryOptions } from '../../data/categories'
import GlassSelect from '../UI/GlassSelect'

const defaultWalletNames = defaultWallets.map(w => w.name)

function TransactionForm({ onAdd }) {
  const [type,        setType]        = useState('expense')
  const [description, setDescription] = useState('')
  const [amount,      setAmount]      = useState('')
  const [category,    setCategory]    = useState('Comida')
  const [wallet,      setWallet]      = useState(defaultWalletNames[0])
  const [walletNames, setWalletNames] = useState(defaultWalletNames)
  const [isSelectOpen, setIsSelectOpen] = useState(false)
  const isMobile = useIsMobile()

  useEffect(() => {
    async function loadWallets() {
      const { data, error } = await supabase.from('wallets').select('*')
      if (error) { console.error(error); return }

      // Sin las billeteras eliminadas
      const names = mergeWithDefaults(data).map(w => w.name)
      setWalletNames(names)
      setWallet(names[0] || '')
    }
    loadWallets()
  }, [])

  function handleSubmit() {
    if (!description || !amount) return alert('Completa descripción y monto')

    const newTransaction = {
      description,
      amount:   parseInt(amount),
      type,
      category,
      wallet,
      date:     todayLocal(), // la fecha solo se cambia al editar el movimiento
    }

    onAdd(newTransaction)
    setDescription('')
    setAmount('')
  }

  const inputStyle = {
    width: '100%', padding: '8px 10px', fontSize: '14px',
    border: '1px solid var(--border-light)', borderRadius: '8px',
    background: 'var(--bg-input)', color: 'var(--text-main)',
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: '12px',
      border: '1px solid var(--border-light)',
      padding: '20px',
      marginBottom: '20px',
      position: 'relative',
      zIndex: isSelectOpen ? 100 : 20,
    }}>
      <h3 style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--text-main)' }}>Registrar movimiento</h3>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <button
          className={type === 'income' ? 'btn-glass-income' : 'btn-glass-inactive'}
          style={{ flex: 1, padding: '9px', borderRadius: '8px', fontSize: '13px' }}
          onClick={() => setType('income')}>
          ↓ Ingreso
        </button>
        <button
          className={type === 'expense' ? 'btn-glass-expense' : 'btn-glass-inactive'}
          style={{ flex: 1, padding: '9px', borderRadius: '8px', fontSize: '13px' }}
          onClick={() => setType('expense')}>
          ↑ Gasto
        </button>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Descripción</label>
        <input
          style={inputStyle}
          placeholder="Ej: Mercado, Salario, Netflix..."
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Monto ($)</label>
        <input
          style={inputStyle}
          type="number"
          placeholder="0"
          value={amount}
          onChange={e => setAmount(e.target.value)}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
        <div>
          <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Categoría</label>
          <GlassSelect
            value={category}
            onChange={setCategory}
            options={categoryOptions}
            placeholder="Selecciona categoría"
            onOpenChange={setIsSelectOpen}
          />
        </div>
        <div>
          <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Billetera</label>
          <GlassSelect
            value={wallet}
            onChange={setWallet}
            options={walletNames}
            placeholder="Selecciona billetera"
            onOpenChange={setIsSelectOpen}
          />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        className="btn-primary"
        style={{
          width: '100%', padding: '11px', borderRadius: '8px',
          fontSize: '14px',
        }}>
        Guardar movimiento
      </button>
    </div>
  )
}

export default TransactionForm