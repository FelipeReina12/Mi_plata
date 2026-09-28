import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { supabase } from '../../supabaseClient'
import useIsMobile from '../../hooks/useIsMobile'

const COLORS = ['#F43F5E','#7C5CFF','#F59E0B','#3B82F6','#0FA971','#8B8FA8']

function formatCOP(num) {
  return '$' + num.toLocaleString('es-CO')
}

// Eje Y compacto: 3800000 -> "$3,8M", 500000 -> "$500K"
function formatShort(v) {
  if (Math.abs(v) >= 1000000) return '$' + (v / 1000000).toLocaleString('es-CO', { maximumFractionDigits: 1 }) + 'M'
  if (Math.abs(v) >= 1000)    return '$' + Math.round(v / 1000) + 'K'
  return '$' + v
}

// Eje X: "2026-07" -> "jul 26"
function formatMonth(key) {
  const [y, m] = key.split('-')
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('es-CO', { month: 'short' }).replace('.', '') + ' ' + y.slice(2)
}

function Reports() {
  const [transactions, setTransactions] = useState([])
  const isMobile = useIsMobile()

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('transactions').select('*')
      if (data) setTransactions(data)
    }
    load()
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
      <h2 style={{ marginBottom: '20px', color: 'var(--text-main)', fontWeight: '600' }}>Reportes</h2>

      <div style={{
        display: 'grid',
        // En celular: saldo neto a lo ancho e ingresos/gastos lado a lado
        gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3, 1fr)',
        gap: isMobile ? '10px' : '14px', marginBottom: isMobile ? '20px' : '24px'
      }}>
        {[
          { label: 'Saldo neto',     value: formatCOP(totalIncome - totalExpense), color: '#0FA971', wide: true },
          { label: 'Total ingresos', value: formatCOP(totalIncome),                color: 'var(--text-main)' },
          { label: 'Total gastos',   value: formatCOP(totalExpense),               color: '#F43F5E' },
        ].map(c => (
          <div key={c.label} style={{
            background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-light)',
            padding: isMobile && !c.wide ? '14px 16px' : '16px 20px',
            gridColumn: isMobile && c.wide ? '1 / -1' : 'auto',
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>{c.label}</div>
            <div style={{ fontSize: isMobile && !c.wide ? '17px' : '20px', fontWeight: '600', color: c.color, overflowWrap: 'anywhere' }}>{c.value}</div>
          </div>
        ))}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: '14px'
      }}>
        <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-light)', padding: '20px' }}>
          <h3 style={{ fontSize: '14px', color: 'var(--text-main)', marginBottom: '16px' }}>Gastos por categoría</h3>
          {pieData.length === 0
            ? <p style={{ color: 'var(--text-light)', fontSize: '13px' }}>Aún no hay gastos registrados</p>
            : <ResponsiveContainer width="100%" height={isMobile ? 280 : 220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy={isMobile ? '42%' : '50%'} innerRadius={55} outerRadius={85} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatCOP(v)} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
          }
        </div>

        <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-light)', padding: '20px' }}>
          <h3 style={{ fontSize: '14px', color: 'var(--text-main)', marginBottom: '16px' }}>Ingresos vs Gastos por mes</h3>
          {barData.length === 0
            ? <p style={{ color: 'var(--text-light)', fontSize: '13px' }}>Aún no hay datos suficientes</p>
            : <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} margin={{ left: isMobile ? -12 : 0, right: 4 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} tickFormatter={formatMonth} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={formatShort} width={isMobile ? 52 : 60} />
                  <Tooltip formatter={(v) => formatCOP(v)} labelFormatter={formatMonth} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="ingresos" fill="#0FA971" radius={[4,4,0,0]} />
                  <Bar dataKey="gastos"   fill="#F43F5E" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
          }
        </div>
      </div>
    </div>
  )
}

export default Reports