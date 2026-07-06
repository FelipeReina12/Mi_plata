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
      background: '#fff',
      borderRight: '1px solid #eee',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 0',
      minHeight: '100vh'
    }}>

      {/* Logo */}
      <div style={{ padding: '0 18px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ background: '#EEEDFE', borderRadius: '8px', padding: '6px' }}>
          <Wallet size={18} color="#7F77DD" />
        </div>
        <span style={{ fontWeight: '600', fontSize: '16px' }}>MiPlata</span>
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
          background:  page === item.id ? '#EEEDFE' : 'transparent',
          color:       page === item.id ? '#3C3489' : '#666',
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
            border: '1px solid #eee', background: 'transparent',
            fontSize: '13px', color: '#999', cursor: 'pointer',
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