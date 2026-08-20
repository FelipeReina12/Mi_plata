import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { Plus, Trash2, Calendar, Repeat } from 'lucide-react'

const categoryOptions = ['Entretenimiento', 'Servicios', 'Vivienda', 'Educación', 'Salud', 'Otros']

function formatCOP(num) {
  return '$' + num.toLocaleString('es-CO')
}

function daysUntilNextPayment(nextDateString) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  let nextDate = new Date(nextDateString + 'T00:00:00')
  nextDate.setHours(0, 0, 0, 0)

  if (nextDate < today) {
    while(nextDate < today) {
      nextDate.setMonth(nextDate.getMonth() + 1)
    }
  }

  const diffTime = Math.abs(nextDate - today)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

function Subscriptions({ session }) {
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [newCategory, setNewCategory] = useState(categoryOptions[0])
  const [newDate, setNewDate] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSubscriptions()
  }, [])

  async function loadSubscriptions() {
    setLoading(true)
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .order('next_date', { ascending: true })

    if (error) {
      console.error(error)
    } else {
      setSubscriptions(data || [])
    }
    setLoading(false)
  }

  async function handleAddSubscription() {
    if (!newName || !newAmount || !newDate) return alert('Completa todos los campos')

    setSaving(true)
    const { data, error } = await supabase
      .from('subscriptions')
      .insert([{
        name: newName,
        amount: parseInt(newAmount),
        category: newCategory,
        next_date: newDate,
        user_id: session.user.id
      }])
      .select()

    if (error) {
      console.error(error)
      alert('Error al guardar, revisa la consola o asegúrate de haber creado la tabla.')
      setSaving(false)
      return
    }

    setSubscriptions([...subscriptions, data[0]].sort((a, b) => new Date(a.next_date) - new Date(b.next_date)))
    setNewName('')
    setNewAmount('')
    setNewDate('')
    setShowForm(false)
    setSaving(false)
  }

  async function handleDelete(id) {
    const ok = window.confirm('¿Eliminar esta suscripción?')
    if (!ok) return
    const { error } = await supabase.from('subscriptions').delete().eq('id', id)
    if (!error) setSubscriptions(subscriptions.filter(s => s.id !== id))
  }

  const totalMonthly = subscriptions.reduce((sum, s) => sum + s.amount, 0)

  const inputStyle = {
    width: '100%', padding: '9px 12px', fontSize: '14px',
    border: '1px solid var(--border-light)', borderRadius: '8px',
    background: 'var(--bg-input)', color: 'var(--text-main)',
  }

  if (loading) return <p style={{ color: 'var(--text-muted)', padding: '20px' }}>Cargando suscripciones...</p>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: 'var(--text-main)', fontWeight: '600' }}>Suscripciones y Gastos fijos</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px', borderRadius: '8px', border: 'none',
            background: '#7F77DD', color: '#fff', fontSize: '13px',
            fontWeight: '500', cursor: 'pointer',
          }}>
          <Plus size={15} /> Nuevo
        </button>
      </div>

      {showForm && (
        <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-light)', padding: '20px', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '14px' }}>Nuevo gasto recurrente</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Nombre</label>
              <input style={inputStyle} placeholder="Ej: Netflix, Arriendo..." value={newName} onChange={e => setNewName(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Monto mensual ($)</label>
              <input style={inputStyle} type="number" placeholder="0" value={newAmount} onChange={e => setNewAmount(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Categoría</label>
              <select style={inputStyle} value={newCategory} onChange={e => setNewCategory(e.target.value)}>
                {categoryOptions.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Próximo pago</label>
              <input style={inputStyle} type="date" value={newDate} onChange={e => setNewDate(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: '9px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'transparent', fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer' }}>
              Cancelar
            </button>
            <button onClick={handleAddSubscription} disabled={saving} style={{ flex: 2, padding: '9px', borderRadius: '8px', border: 'none', background: '#7F77DD', color: '#fff', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-card)', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border-light)', marginBottom: '20px' }}>
        <div style={{ background: 'rgba(216, 90, 48, 0.1)', padding: '10px', borderRadius: '10px' }}>
          <Repeat size={20} color="#D85A30" />
        </div>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '2px' }}>Total en fijos (Mensual)</div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-main)' }}>{formatCOP(totalMonthly)}</div>
        </div>
      </div>

      {subscriptions.length === 0 ? (
        <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-light)', padding: '40px 20px', textAlign: 'center' }}>
          <Calendar size={28} color="var(--text-lighter)" style={{ marginBottom: '10px' }} />
          <p style={{ color: 'var(--text-light)', fontSize: '13px' }}>Aún no tienes suscripciones registradas.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {subscriptions.map(s => {
            const daysLeft = daysUntilNextPayment(s.next_date)
            const isUrgent = daysLeft <= 5

            return (
              <div key={s.id} style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-light)', padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: '600', fontSize: '15px', color: 'var(--text-main)' }}>{s.name}</span>
                  <button onClick={() => handleDelete(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-lighter)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-light)', marginBottom: '2px' }}>{s.category}</div>
                    <div style={{ fontSize: '12px', color: isUrgent ? '#D85A30' : 'var(--text-muted)', fontWeight: isUrgent ? '600' : '400' }}>
                      {daysLeft === 0 ? 'Hoy' : `Faltan ${daysLeft} días`}
                    </div>
                  </div>
                  <div style={{ fontWeight: '600', color: '#D85A30', fontSize: '14px' }}>
                    -{formatCOP(s.amount)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Subscriptions
