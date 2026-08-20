import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'

const categoryOptions = [
  'Comida', 'Transporte', 'Servicios', 'Entretenimiento', 'Salario', 'Otros ingresos', 'Otros'
]

const defaultWalletNames = ['Efectivo', 'Nequi', 'Banco Falabella']

function TransactionForm({ onAdd }) {
  const [type,        setType]        = useState('expense')
  const [description, setDescription] = useState('')
  const [amount,      setAmount]      = useState('')
  const [category,    setCategory]    = useState('Comida')
  const [wallet,      setWallet]      = useState('')
  const [walletNames, setWalletNames] = useState(defaultWalletNames)

  useEffect(() => {
    async function loadWallets() {
      const { data, error } = await supabase.from('wallets').select('name')
      if (error) { console.error(error); return }

      const names = data.map(w => w.name)
      const merged = [...new Set([...defaultWalletNames, ...names])]
      setWalletNames(merged)
      setWallet(merged[0])
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
      date:     new Date().toISOString().split('T')[0],
    }

    onAdd(newTransaction)
    setDescription('')
    setAmount('')
  }

  const btnStyle = (active, color) => ({
    flex: 1, padding: '8px', borderRadius: '8px', cursor: 'pointer',
    fontWeight: '500', fontSize: '13px',
    border: active ? 'none' : '1px solid var(--border-light)',
    background: active ? color : 'transparent',
    color: active ? '#fff' : 'var(--text-muted)',
  })

  const inputStyle = {
    width: '100%', padding: '8px 10px', fontSize: '14px',
    border: '1px solid var(--border-light)', borderRadius: '8px',
    background: 'var(--bg-input)', color: 'var(--text-main)',
  }

  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-light)', padding: '20px', marginBottom: '20px' }}>
      <h3 style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--text-main)' }}>Registrar movimiento</h3>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <button style={btnStyle(type === 'income',  '#1D9E75')} onClick={() => setType('income')}>
          ↓ Ingreso
        </button>
        <button style={btnStyle(type === 'expense', '#D85A30')} onClick={() => setType('expense')}>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
        <div>
          <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Categoría</label>
          <select style={inputStyle} value={category} onChange={e => setCategory(e.target.value)}>
            {categoryOptions.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Billetera</label>
          <select style={inputStyle} value={wallet} onChange={e => setWallet(e.target.value)}>
            {walletNames.map(w => <option key={w}>{w}</option>)}
          </select>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        style={{
          width: '100%', padding: '10px', borderRadius: '8px', border: 'none',
          background: '#7F77DD', color: '#fff', fontWeight: '600',
          fontSize: '14px', cursor: 'pointer',
        }}>
        Guardar movimiento
      </button>
    </div>
  )
}

export default TransactionForm