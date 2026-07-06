import { LayoutDashboard, List, Wallet, BarChart2, Target, LogOut } from 'lucide-react'
import { supabase } from '../../supabaseClient'

const navItems = [
  { icon: LayoutDashboard, label: 'Resumen',      id: 'dashboard' },
  { icon: List,            label: 'Movimientos',  id: 'movements' },
  { icon: Wallet,          label: 'Billeteras',   id: 'wallets'   },
  { icon: BarChart2,       label: 'Informes',     id: 'reports'   },
  { icon: Target,          label: 'Presupuestos', id: 'budgets'   },
]

function BottomNav({ page, setPage }) {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: '#fff', borderTop: '1px solid #eee',
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
            color: page === item.id ? '#7F77DD' : '#aaa',
            fontSize: '10px', gap: '4px',
          }}>
          <item.icon size={20} strokeWidth={page === item.id ? 2.5 : 1.5} />
          {item.label}
        </div>
      ))}

      {/* Botón cerrar sesión */}
      <div
        onClick={() => supabase.auth.signOut()}
        style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '10px 0', cursor: 'pointer',
          color: '#D85A30', fontSize: '10px', gap: '4px',
        }}>
        <LogOut size={20} strokeWidth={1.5} />
        Salir
      </div>
    </nav>
  )
}

export default BottomNav