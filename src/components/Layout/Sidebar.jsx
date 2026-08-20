import { LayoutDashboard, List, Wallet, BarChart2, Target, Settings, LogOut } from 'lucide-react'
import { supabase } from '../../supabaseClient'

const navItems = [
  { icon: LayoutDashboard, label: 'Resumen',      id: 'dashboard' },
  { icon: List,            label: 'Movimientos',  id: 'movements' },
  { icon: Wallet,          label: 'Billeteras',   id: 'wallets'   },
  { icon: BarChart2,       label: 'Reportes',     id: 'reports'   },
  { icon: Target,          label: 'Presupuestos', id: 'budgets'   },
  { icon: Settings,        label: 'Ajustes',      id: 'settings'  },
]

function Sidebar({ page, setPage }) {
  return (
    <aside style={{
      width: '200px',
      background: 'var(--bg-card)',
      borderRight: '1px solid var(--border-light)',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 0',
      minHeight: '100vh'
    }}>

      {/* Logo */}
      <div style={{ padding: '0 18px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ background: page === 'settings' ? 'rgba(127, 119, 221, 0.2)' : '#EEEDFE', borderRadius: '8px', padding: '6px' }}>
          <Wallet size={18} color="#7F77DD" />
        </div>
        <span style={{ fontWeight: '600', fontSize: '16px', color: 'var(--text-main)' }}>MiPlata</span>
      </div>

      {/* Nav items */}
      {navItems.map((item) => (
        <div key={item.id} onClick={() => setPage(item.id)} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 18px',
          cursor: 'pointer',
          borderLeft: page === item.id ? '2px solid #7F77DD' : '2px solid transparent',
          background:  page === item.id ? 'rgba(127, 119, 221, 0.15)' : 'transparent',
          color:       page === item.id ? '#7F77DD' : 'var(--text-muted)',
          fontSize: '13px',
          fontWeight:  page === item.id ? '500' : '400',
        }}>
          <item.icon size={16} />
          {item.label}
        </div>
      ))}

      {/* Cerrar sesión */}
      <div style={{ marginTop: 'auto', padding: '20px 18px 0' }}>
        <button
          onClick={() => supabase.auth.signOut()}
          style={{
            width: '100%', padding: '9px', borderRadius: '8px',
            border: '1px solid var(--border-light)', background: 'transparent',
            fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          }}>
          <LogOut size={14} />
          Cerrar sesión
        </button>
      </div>

    </aside>
  )
}

export default Sidebar