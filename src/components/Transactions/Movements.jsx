import { useState, useEffect } from 'react'
import { Trash2, ArrowRightLeft, Search, X } from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { walletBalances, initialBalancesByName } from '../../utils/balances'
import BalanceLine from './BalanceLine'
import useIsMobile from '../../hooks/useIsMobile'

const categoryOptions = ['Todas', 'Comida', 'Transporte', 'Servicios', 'Entretenimiento', 'Salario', 'Otros ingresos', 'Transferencia', 'Otros']

function formatCOP(num) {
  return '$' + num.toLocaleString('es-CO')
}

// Minúsculas y sin tildes para que "nomina" encuentre "Nómina"
function normalize(text) {
  return (text || '').toString().toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
}

function Movements() {
  const [transactions, setTransactions] = useState([])
  const [wallets,      setWallets]      = useState([])
  const [loading,      setLoading]      = useState(true)
  const [filterType,   setFilterType]   = useState('all')
  const [filterCat,    setFilterCat]    = useState('Todas')
  const [search,       setSearch]       = useState('')
  const isMobile = useIsMobile()

  useEffect(() => {
    fetchTransactions()
  }, [])

  async function fetchTransactions() {
    setLoading(true)
    const [{ data, error }, { data: walletData }] = await Promise.all([
      supabase.from('transactions').select('*').order('created_at', { ascending: false }),
      supabase.from('wallets').select('*'),
    ])

    if (error) console.error(error)
    else setTransactions(data)
    if (walletData) setWallets(walletData)
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

  // Saldo de cada billetera antes y después de cada movimiento (se calcula con todos, no solo los filtrados)
  const balances = walletBalances(transactions, initialBalancesByName(wallets))

  // Búsqueda por descripción, categoría, cuenta, fecha o monto
  const query       = normalize(search.trim())
  const queryDigits = /^[\d.,$\s]+$/.test(search.trim()) ? search.replace(/\D/g, '') : ''

  const filtered = transactions
    .filter(t => filterType === 'all' || t.type === filterType)
    .filter(t => filterCat  === 'Todas' || t.category === filterCat)
    .filter(t => {
      if (!query) return true
      if (queryDigits && String(t.amount).includes(queryDigits)) return true
      return [t.description, t.category, t.wallet, t.date].some(field => normalize(field).includes(query))
    })

  const btnFilter = (active) => ({
    padding: '7px 14px', borderRadius: '8px',
    fontSize: '13px', cursor: 'pointer', fontWeight: '500',
    background: active ? '#7F77DD' : 'var(--bg-input)',
    color:      active ? '#fff'    : 'var(--text-muted)',
    border:     active ? '1px solid transparent' : '1px solid var(--border-light)',
  })

  if (loading) return <p style={{ color: 'var(--text-muted)', padding: '20px' }}>Cargando movimientos...</p>

  return (
    <div>
      <h2 style={{ marginBottom: '20px', color: 'var(--text-main)', fontWeight: '600' }}>Movimientos</h2>

      <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-light)', padding: '16px 20px', marginBottom: '16px' }}>

        {/* Tipo — centrado, incluyendo transferencias */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button style={btnFilter(filterType === 'all')}      onClick={() => setFilterType('all')}>      Todos        </button>
          <button style={btnFilter(filterType === 'income')}   onClick={() => setFilterType('income')}>   Ingresos     </button>
          <button style={btnFilter(filterType === 'expense')}  onClick={() => setFilterType('expense')}>  Gastos       </button>
          <button style={btnFilter(filterType === 'transfer')} onClick={() => setFilterType('transfer')}> Transferencias</button>
        </div>

        {/* Categoría */}
        <select
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
          style={{
            padding: '7px 10px', borderRadius: '8px', border: '1px solid var(--border-light)',
            fontSize: '13px', color: 'var(--text-main)', background: 'var(--bg-input)', cursor: 'pointer',
            width: '100%',
          }}>
          {categoryOptions.map(c => <option key={c}>{c}</option>)}
        </select>

        {/* Buscador */}
        <div style={{ position: 'relative', marginTop: '12px' }}>
          <Search size={15} color="var(--text-light)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar movimiento o monto..."
            style={{
              width: '100%', boxSizing: 'border-box', padding: '8px 32px',
              borderRadius: '8px', border: '1px solid var(--border-light)',
              fontSize: '13px', color: 'var(--text-main)', background: 'var(--bg-input)', outline: 'none',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              aria-label="Limpiar búsqueda"
              style={{
                position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
                color: 'var(--text-light)', display: 'flex', alignItems: 'center',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-light)', padding: '20px' }}>
        <div style={{ fontSize: '12px', color: 'var(--text-light)', marginBottom: '14px' }}>
          {filtered.length} movimiento{filtered.length !== 1 ? 's' : ''}
        </div>

        {filtered.length === 0 && (
          <p style={{ color: 'var(--text-light)', fontSize: '13px' }}>
            {query ? 'No se encontraron movimientos con esa búsqueda.' : 'No hay movimientos con estos filtros.'}
          </p>
        )}

        {filtered.map(t => (
          <div key={t.id} style={{
            display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr) auto auto',
            alignItems: 'center', columnGap: '12px', rowGap: '3px',
            padding: '10px 0', borderBottom: '1px solid var(--border-dim)',
          }}>

            {/* Indicador tipo */}
            {t.type === 'transfer'
              ? <ArrowRightLeft size={14} color="#7F77DD" style={{ flexShrink: 0 }} />
              : <div style={{
                  width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                  background: t.type === 'income' ? '#1D9E75' : '#D85A30',
                }} />
            }

            {/* Info */}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {t.description}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '2px' }}>
                {t.category} · {t.wallet} · {t.date}
              </div>
            </div>

            {/* Monto */}
            <div style={{
              fontSize: '13px', fontWeight: '600', flexShrink: 0,
              color: t.type === 'transfer' ? '#7F77DD' : t.type === 'income' ? '#1D9E75' : '#D85A30',
            }}>
              {t.type === 'transfer' ? (t.description.includes('→') || t.description.includes('->') ? '-' : '+') : t.type === 'income' ? '+' : '-'}{formatCOP(t.amount)}
            </div>

            {/* Eliminar */}
            <button
              onClick={() => handleDelete(t.id)}
              aria-label="Eliminar"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-lighter)', padding: '8px', margin: '-4px', borderRadius: '6px',
                display: 'flex', alignItems: 'center', flexShrink: 0,
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#D85A30'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-lighter)'}
            >
              <Trash2 size={15} />
            </button>

            {/* Saldo de la billetera antes → después (en celular ocupa también el ancho del monto) */}
            <div style={{ gridColumn: isMobile ? '2 / 4' : '2 / 3' }}>
              <BalanceLine balance={balances[t.id]} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Movements