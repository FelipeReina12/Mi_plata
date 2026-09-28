import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { ArrowRightLeft } from 'lucide-react'
import useIsMobile from '../../hooks/useIsMobile'
import { defaultWallets, mergeWithDefaults } from '../../data/defaultWallets'
import { todayLocal } from '../../utils/dates'

const defaultWalletNames = defaultWallets.map(w => w.name)

function TransferForm({ session, onTransfer }) {
  const [walletNames,  setWalletNames]  = useState(defaultWalletNames)
  const [from,         setFrom]         = useState('')
  const [to,           setTo]           = useState('')
  const [amount,       setAmount]       = useState('')
  const [description,  setDescription]  = useState('Transferencia')
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState('')
  const isMobile = useIsMobile()

  useEffect(() => {
    async function loadWallets() {
      const { data } = await supabase.from('wallets').select('*')
      if (data) {
        // Sin las billeteras eliminadas
        const names = mergeWithDefaults(data).map(w => w.name)
        setWalletNames(names)
        setFrom(names[0] || '')
        setTo(names[1] || names[0] || '')
      } else {
        setFrom(defaultWalletNames[0])
        setTo(defaultWalletNames[1])
      }
    }
    loadWallets()
  }, [])

  async function handleTransfer() {
    setError('')
    if (!amount || parseInt(amount) <= 0) return setError('Ingresa un monto válido')
    if (from === to) return setError('Las billeteras deben ser diferentes')

    setSaving(true)
    const date = todayLocal() // la fecha solo se cambia al editar la transferencia
    const desc = description.trim() || 'Transferencia'

    const { data, error } = await supabase
      .from('transactions')
      .insert([
        // Salida de la billetera origen
        {
          description: `${desc} → ${to}`,
          amount:      parseInt(amount),
          type:        'transfer',
          category:    'Transferencia',
          wallet:      from,
          date,
          user_id:     session.user.id,
        },
        // Entrada a la billetera destino
        {
          description: `${desc} ← ${from}`,
          amount:      parseInt(amount),
          type:        'transfer',
          category:    'Transferencia',
          wallet:      to,
          date,
          user_id:     session.user.id,
        },
      ])
      .select()

    if (error) {
      console.error(error)
      setError('Error al registrar la transferencia')
      setSaving(false)
      return
    }

    onTransfer(data)
    setAmount('')
    setDescription('Transferencia')
    setSaving(false)
  }

  const inputStyle = {
    width: '100%', padding: '8px 10px', fontSize: '14px',
    border: '1px solid var(--border-light)', borderRadius: '8px',
    background: 'var(--bg-input)', color: 'var(--text-main)',
  }

  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-light)', padding: '20px', marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <ArrowRightLeft size={16} color="#7F77DD" />
        <h3 style={{ fontSize: '14px', color: 'var(--text-main)', fontWeight: '600' }}>Transferencia entre billeteras</h3>
      </div>

      {/* Origen y destino — en celular uno debajo del otro para que se lean los nombres */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr auto 1fr', gap: isMobile ? '4px' : '8px', alignItems: 'center', marginBottom: '12px' }}>
        <div>
          <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Desde</label>
          <select style={inputStyle} value={from} onChange={e => setFrom(e.target.value)}>
            {walletNames.map(w => <option key={w}>{w}</option>)}
          </select>
        </div>
        <div style={{ textAlign: 'center', color: '#7F77DD', marginTop: isMobile ? '4px' : '18px' }}>
          <ArrowRightLeft size={18} style={{ transform: isMobile ? 'rotate(90deg)' : 'none' }} />
        </div>
        <div>
          <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Hacia</label>
          <select style={inputStyle} value={to} onChange={e => setTo(e.target.value)}>
            {walletNames.map(w => <option key={w}>{w}</option>)}
          </select>
        </div>
      </div>

      {/* Monto */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Monto ($)</label>
        <input
          style={inputStyle}
          type="number"
          placeholder="0"
          value={amount}
          onChange={e => setAmount(e.target.value)}
        />
      </div>

      {/* Descripción */}
      <div style={{ marginBottom: '14px' }}>
        <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Descripción (opcional)</label>
        <input
          style={inputStyle}
          type="text"
          placeholder="Ej: Ahorro mensual"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
      </div>

      {error && (
        <div style={{ background: '#FAECE7', color: '#712B13', fontSize: '12px', padding: '10px 12px', borderRadius: '8px', marginBottom: '12px' }}>
          {error}
        </div>
      )}

      <button
        onClick={handleTransfer}
        disabled={saving}
        style={{
          width: '100%', padding: '10px', borderRadius: '8px', border: 'none',
          background: saving ? '#bbb' : '#7F77DD', color: '#fff',
          fontWeight: '600', fontSize: '14px', cursor: saving ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        }}>
        <ArrowRightLeft size={15} />
        {saving ? 'Registrando...' : 'Realizar transferencia'}
      </button>
    </div>
  )
}

export default TransferForm