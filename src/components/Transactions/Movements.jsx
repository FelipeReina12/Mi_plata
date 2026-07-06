import { useState, useEffect } from 'react'
import { Trash2 } from 'lucide-react'
import { supabase } from '../../supabaseClient'

const categoryOptions = ['Todas', 'Comida', 'Transporte', 'Servicios', 'Entretenimiento', 'Salario', 'Otros ingresos', 'Otros']

function formatCOP(num) {
  return '$' + num.toLocaleString('es-CO')
}

function Movements() {
  const [transactions, setTransactions] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [filterType,   setFilterType]   = useState('all')
  const [filterCat,    setFilterCat]    = useState('Todas')

  useEffect(() => {
    fetchTransactions()
  }, [])

  async function fetchTransactions() {
    setLoading(true)
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) console.error(error)
    else setTransactions(data)
    setLoading(false)
  }

  async function handleDelete(id) {
    const confirm = window.confirm('¿Seguro que quieres eliminar este movimiento?')
    if (!confirm) return

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)

    if (error) console.error(error)
    else setTransactions(transactions.filter(t => t.id !== id))
  }

  const filtered = transactions
    .filter(t => filterType === 'all' || t.type === filterType)
    .filter(t => filterCat  === 'Todas' || t.category === filterCat)

  const btnFilter = (active) => ({
    padding: '7px 14px', borderRadius: '8px', border: 'none',
    fontSize: '13px', cursor: 'pointer', fontWeight: '500',
    background: active ? '#7F77DD' : '#fff',
    color:      active ? '#fff'    : '#888',
    border:     active ? 'none'    : '1px solid #eee',
  })

  if (loading) return <p style={{ color: '#888', padding: '20px' }}>Cargando movimientos...</p>

  return (
    <div>
      <h2 style={{ marginBottom: '20px', color: '#333', fontWeight: '600' }}>Movimientos</h2>

      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #eee', padding: '16px 20px', marginBottom: '16px' }}>

        {/* Tipo — centrado */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', justifyContent: 'center' }}>
          <button style={btnFilter(filterType === 'all')}     onClick={() => setFilterType('all')}>    Todos    </button>
          <button style={btnFilter(filterType === 'income')}  onClick={() => setFilterType('income')}>  Ingresos </button>
          <button style={btnFilter(filterType === 'expense')} onClick={() => setFilterType('expense')}> Gastos   </button>
        </div>

        {/* Categoría */}
        <select
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
          style={{
            padding: '7px 10px', borderRadius: '8px', border: '1px solid #eee',
            fontSize: '13px', color: '#555', background: '#fff', cursor: 'pointer',
            width: '100%',
          }}>
          {categoryOptions.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #eee', padding: '20px' }}>
        <div style={{ fontSize: '12px', color: '#999', marginBottom: '14px' }}>
          {filtered.length} movimiento{filtered.length !== 1 ? 's' : ''}
        </div>

        {filtered.length === 0 && (
          <p style={{ color: '#aaa', fontSize: '13px' }}>No hay movimientos con estos filtros.</p>
        )}

        {filtered.map(t => (
          <div key={t.id} style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '10px 0', borderBottom: '1px solid #f5f5f5',
          }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
              background: t.type === 'income' ? '#1D9E75' : '#D85A30',
            }} />

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: '500', color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.description}</div>
              <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>
                {t.category} · {t.wallet} · {t.date}
              </div>
            </div>

            <div style={{
              fontSize: '13px', fontWeight: '600', flexShrink: 0,
              color: t.type === 'income' ? '#1D9E75' : '#D85A30',
            }}>
              {t.type === 'income' ? '+' : '-'}{formatCOP(t.amount)}
            </div>

            <button
              onClick={() => handleDelete(t.id)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#ccc', padding: '4px', borderRadius: '6px',
                display: 'flex', alignItems: 'center', flexShrink: 0,
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#D85A30'}
              onMouseLeave={e => e.currentTarget.style.color = '#ccc'}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Movements