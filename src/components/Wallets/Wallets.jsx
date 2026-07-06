import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { Wallet, Plus } from 'lucide-react'

function formatCOP(num) {
  return '$' + num.toLocaleString('es-CO')
}

const defaultWallets = [
  { name: 'Efectivo',        color: '#888780', bg: '#F1EFE8' },
  { name: 'Nequi',           color: '#1D9E75', bg: '#E1F5EE' },
  { name: 'Banco Falabella', color: '#185FA5', bg: '#E6F1FB' },
]

const colorOptions = [
  { color: '#888780', bg: '#F1EFE8', label: 'Gris'    },
  { color: '#1D9E75', bg: '#E1F5EE', label: 'Verde'   },
  { color: '#185FA5', bg: '#E6F1FB', label: 'Azul'    },
  { color: '#D85A30', bg: '#FAECE7', label: 'Naranja' },
  { color: '#7F77DD', bg: '#EEEDFE', label: 'Morado'  },
  { color: '#EF9F27', bg: '#FAEEDA', label: 'Amarillo'},
]

function Wallets({ session }) {
  const [transactions, setTransactions] = useState([])
  const [wallets,      setWallets]      = useState([])
  const [loading,      setLoading]      = useState(true)
  const [showForm,     setShowForm]     = useState(false)
  const [newName,      setNewName]      = useState('')
  const [newColor,     setNewColor]     = useState(colorOptions[0])
  const [saving,       setSaving]       = useState(false)
  const [isMobile,     setIsMobile]     = useState(window.innerWidth < 768)

  useEffect(() => {
    loadAll()
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  async function loadAll() {
    setLoading(true)

    const [{ data: txData }, { data: walletData }] = await Promise.all([
      supabase.from('transactions').select('*'),
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

  const walletSummary = transactions.reduce((acc, t) => {
    if (!acc[t.wallet]) acc[t.wallet] = { income: 0, expense: 0 }
    if (t.type === 'income')  acc[t.wallet].income  += t.amount
    if (t.type === 'expense') acc[t.wallet].expense += t.amount
    return acc
  }, {})

  const walletsWithBalance = wallets.map(w => ({
    ...w,
    income:  walletSummary[w.name]?.income  || 0,
    expense: walletSummary[w.name]?.expense || 0,
    balance: (walletSummary[w.name]?.income || 0) - (walletSummary[w.name]?.expense || 0),
  }))

  const totalBalance = walletsWithBalance.reduce((sum, w) => sum + w.balance, 0)

  const inputStyle = {
    width: '100%', padding: '9px 12px', fontSize: '14px',
    border: '1px solid #eee', borderRadius: '8px',
    background: '#fff', color: '#333',
  }

  if (loading) return <p style={{ color: '#888', padding: '20px' }}>Cargando billeteras...</p>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#333', fontWeight: '600' }}>Billeteras</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px', borderRadius: '8px', border: 'none',
            background: '#7F77DD', color: '#fff', fontSize: '13px',
            fontWeight: '500', cursor: 'pointer',
          }}>
          <Plus size={15} /> Nueva billetera
        </button>
      </div>

      {/* Formulario nueva billetera */}
      {showForm && (
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #eee', padding: '20px', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '14px' }}>Nueva billetera</h3>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '4px' }}>Nombre</label>
            <input
              style={inputStyle}
              placeholder="Ej: Daviplata, Ahorro, etc."
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '8px' }}>Color</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {colorOptions.map(c => (
                <div
                  key={c.color}
                  onClick={() => setNewColor(c)}
                  style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: c.color, cursor: 'pointer',
                    border: newColor.color === c.color ? '3px solid #333' : '3px solid transparent',
                  }}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setShowForm(false)}
              style={{ flex: 1, padding: '9px', borderRadius: '8px', border: '1px solid #eee', background: 'transparent', fontSize: '13px', color: '#888', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button
              onClick={handleAddWallet}
              disabled={saving}
              style={{ flex: 2, padding: '9px', borderRadius: '8px', border: 'none', background: '#7F77DD', color: '#fff', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
              {saving ? 'Guardando...' : 'Guardar billetera'}
            </button>
          </div>
        </div>
      )}

      {/* Saldo total */}
      <div style={{ background: '#7F77DD', borderRadius: '16px', padding: '24px 28px', marginBottom: '24px', color: '#fff' }}>
        <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Saldo total</div>
        <div style={{ fontSize: '32px', fontWeight: '700' }}>{formatCOP(totalBalance)}</div>
        <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '6px' }}>{walletsWithBalance.length} billeteras</div>
      </div>

      {/* Tarjetas — responsivas */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '14px' }}>
        {walletsWithBalance.map(w => (
          <div key={w.name} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #eee', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: w.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Wallet size={18} color={w.color} />
              </div>
              <span style={{ fontWeight: '600', fontSize: '15px', color: '#333' }}>{w.name}</span>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', color: '#999', marginBottom: '4px', textTransform: 'uppercase' }}>Saldo</div>
              <div style={{ fontSize: '22px', fontWeight: '700', color: w.balance >= 0 ? '#333' : '#D85A30' }}>
                {formatCOP(w.balance)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ flex: 1, background: '#E1F5EE', borderRadius: '8px', padding: '10px' }}>
                <div style={{ fontSize: '10px', color: '#1D9E75', marginBottom: '3px' }}>INGRESOS</div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#1D9E75' }}>+{formatCOP(w.income)}</div>
              </div>
              <div style={{ flex: 1, background: '#FAECE7', borderRadius: '8px', padding: '10px' }}>
                <div style={{ fontSize: '10px', color: '#D85A30', marginBottom: '3px' }}>GASTOS</div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#D85A30' }}>-{formatCOP(w.expense)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Wallets