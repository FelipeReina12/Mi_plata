import { LayoutDashboard, List, Wallet, BarChart2, Target, Settings } from 'lucide-react'
import { supabase } from '../../supabaseClient'

const navItems = [
  { icon: LayoutDashboard, label: 'Resumen',      id: 'dashboard' },
  { icon: List,            label: 'Movimientos',  id: 'movements' },
  { icon: Wallet,          label: 'Billeteras',   id: 'wallets'   },
  { icon: BarChart2,       label: 'Informes',     id: 'reports'   },
  { icon: Target,          label: 'Presupuestos', id: 'budgets'   },
  { icon: Settings,        label: 'Ajustes',      id: 'settings'  },
]

function BottomNav({ page, setPage }) {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'var(--bg-card)', borderTop: '1px solid var(--border-light)',
      display: 'flex', zIndex: 100,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {navItems.map(item => (
        <div
          key={item.id}
          onClick={() => setPage(item.id)}
          style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '10px 0', cursor: 'pointer',
            color: page === item.id ? '#7F77DD' : 'var(--text-light)',
            fontSize: '10px', gap: '4px',
          }}>
          <item.icon size={20} strokeWidth={page === item.id ? 2.5 : 1.5} />
          {item.label}
        </div>
      ))}
    </nav>
  )
}

export default BottomNav