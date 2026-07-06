import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { supabase } from '../../supabaseClient'

const COLORS = ['#D85A30','#7F77DD','#EF9F27','#185FA5','#1D9E75','#888780']

function formatCOP(num) {
  return '$' + num.toLocaleString('es-CO')
}

function Reports() {
  const [transactions, setTransactions] = useState([])
  const [isMobile,     setIsMobile]     = useState(window.innerWidth < 768)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('transactions').select('*')
      if (data) setTransactions(data)
    }
    load()
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const expensesByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount
      return acc
    }, {})

  const pieData = Object.entries(expensesByCategory).map(([name, value]) => ({ name, value }))

  const byMonth = transactions.reduce((acc, t) => {
    const month = t.date.slice(0, 7)
    if (!acc[month]) acc[month] = { month, ingresos: 0, gastos: 0 }
    if (t.type === 'income')  acc[month].ingresos += t.amount
    if (t.type === 'expense') acc[month].gastos   += t.amount
    return acc
  }, {})

  const barData = Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month))

  const totalIncome  = transactions.filter(t => t.type === 'income') .reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  return (
    <div>
      <h2 style={{ marginBottom: '20px', color: '#333', fontWeight: '600' }}>Reportes</h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
        gap: '14px', marginBottom: '24px'
      }}>
        {[
          { label: 'Saldo neto',     value: formatCOP(totalIncome - totalExpense), color: '#1D9E75' },
          { label: 'Total ingresos', value: formatCOP(totalIncome),                color: '#333'    },
          { label: 'Total gastos',   value: formatCOP(totalExpense),               color: '#D85A30' },
        ].map(c => (
          <div key={c.label} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #eee', padding: '16px 20px' }}>
            <div style={{ fontSize: '11px', color: '#999', textTransform: 'uppercase', marginBottom: '6px' }}>{c.label}</div>
            <div style={{ fontSize: '20px', fontWeight: '600', color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: '14px'
      }}>
        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #eee', padding: '20px' }}>
          <h3 style={{ fontSize: '14px', color: '#333', marginBottom: '16px' }}>Gastos por categoría</h3>
          {pieData.length === 0
            ? <p style={{ color: '#aaa', fontSize: '13px' }}>Aún no hay gastos registrados</p>
            : <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatCOP(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
          }
        </div>

        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #eee', padding: '20px' }}>
          <h3 style={{ fontSize: '14px', color: '#333', marginBottom: '16px' }}>Ingresos vs Gastos por mes</h3>
          {barData.length === 0
            ? <p style={{ color: '#aaa', fontSize: '13px' }}>Aún no hay datos suficientes</p>
            : <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData}>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => '$' + (v/1000).toFixed(0) + 'K'} />
                  <Tooltip formatter={(v) => formatCOP(v)} />
                  <Legend />
                  <Bar dataKey="ingresos" fill="#1D9E75" radius={[4,4,0,0]} />
                  <Bar dataKey="gastos"   fill="#D85A30" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
          }
        </div>
      </div>
    </div>
  )
}

export default Reports