import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { Plus, Trash2, Target } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

const categoryOptions = ['Comida', 'Transporte', 'Servicios', 'Entretenimiento', 'Otros']

function formatCOP(num) {
  return '$' + num.toLocaleString('es-CO')
}

function currentMonthKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function Budgets({ session }) {
  const [budgets,      setBudgets]      = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [showForm,     setShowForm]     = useState(false)
  const [newCategory,  setNewCategory]  = useState(categoryOptions[0])
  const [newAmount,    setNewAmount]    = useState('')
  const [saving,       setSaving]       = useState(false)

  const month = currentMonthKey()

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    const [{ data: budgetData }, { data: txData }] = await Promise.all([
      supabase.from('budgets').select('*').eq('month', month),
      supabase.from('transactions').select('*').eq('type', 'expense'),
    ])
    if (budgetData) setBudgets(budgetData)
    if (txData)     setTransactions(txData)
    setLoading(false)
  }

  async function handleAddBudget() {
    if (!newAmount) return alert('Pon un monto')

    const exists = budgets.find(b => b.category === newCategory)
    if (exists) return alert('Ya tienes un presupuesto para esta categoría este mes')

    setSaving(true)
    const { data, error } = await supabase
      .from('budgets')
      .insert([{ category: newCategory, amount: parseInt(newAmount), month, user_id: session.user.id }])
      .select()

    if (error) { console.error(error); setSaving(false); return }

    setBudgets([...budgets, data[0]])
    setNewAmount('')
    setShowForm(false)
    setSaving(false)
  }

  async function handleDelete(id) {
    const { error } = await supabase.from('budgets').delete().eq('id', id)
    if (!error) setBudgets(budgets.filter(b => b.id !== id))
  }

  // Calcular gasto real por categoría este mes
  const spentByCategory = transactions
    .filter(t => t.date.slice(0, 7) === month)
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount
      return acc
    }, {})

  const inputStyle = {
    width: '100%', padding: '9px 12px', fontSize: '14px',
    border: '1px solid var(--border-light)', borderRadius: '8px',
    background: 'var(--bg-input)', color: 'var(--text-main)',
  }

  if (loading) return <p style={{ color: 'var(--text-muted)', padding: '20px' }}>Cargando presupuestos...</p>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: 'var(--text-main)', fontWeight: '600' }}>Presupuestos</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px', borderRadius: '8px', border: 'none',
            background: '#7F77DD', color: '#fff', fontSize: '13px',
            fontWeight: '500', cursor: 'pointer',
          }}>
          <Plus size={15} /> Nuevo presupuesto
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden', marginBottom: '16px' }}
          >
            <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-light)', padding: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '14px' }}>Nuevo presupuesto mensual</h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Categoría</label>
                  <select style={inputStyle} value={newCategory} onChange={e => setNewCategory(e.target.value)}>
                    {categoryOptions.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Límite mensual ($)</label>
                  <input style={inputStyle} type="number" placeholder="0" value={newAmount} onChange={e => setNewAmount(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: '9px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'transparent', fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  Cancelar
                </button>
                <button onClick={handleAddBudget} disabled={saving} style={{ flex: 2, padding: '9px', borderRadius: '8px', border: 'none', background: '#7F77DD', color: '#fff', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
                  {saving ? 'Guardando...' : 'Guardar presupuesto'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {budgets.length === 0 ? (
        <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-light)', padding: '40px 20px', textAlign: 'center' }}>
          <Target size={28} color="var(--text-lighter)" style={{ marginBottom: '10px' }} />
          <p style={{ color: 'var(--text-light)', fontSize: '13px' }}>Aún no tienes presupuestos este mes.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {budgets.map(b => {
            const spent   = spentByCategory[b.category] || 0
            const pct     = Math.min(Math.round((spent / b.amount) * 100), 100)
            const over    = spent > b.amount
            const barColor = over ? '#D85A30' : pct > 75 ? '#EF9F27' : '#1D9E75'

            return (
              <div key={b.id} style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-light)', padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-main)' }}>{b.category}</span>
                  <button onClick={() => handleDelete(b.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-lighter)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px' }}>
                  <span style={{ color: over ? '#D85A30' : 'var(--text-light)' }}>
                    {formatCOP(spent)} de {formatCOP(b.amount)}
                  </span>
                  <span style={{ color: over ? '#D85A30' : 'var(--text-muted)', fontWeight: '500' }}>
                    {pct}%{over ? ' — ¡excedido!' : ''}
                  </span>
                </div>

                <div style={{ height: '8px', background: 'var(--border-dim)', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: '99px', transition: 'width 0.3s' }} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Budgets