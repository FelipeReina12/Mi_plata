import { useState } from 'react'
import { LayoutDashboard, List, Wallet, BarChart2, Target, Settings, Repeat, Sparkles, MoreHorizontal } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

// Las 4 secciones más usadas van en la barra; el resto en el menú "Más"
const navItems = [
  { icon: LayoutDashboard, label: 'Resumen',     id: 'dashboard' },
  { icon: List,            label: 'Movimientos', id: 'movements' },
  { icon: Wallet,          label: 'Billeteras',  id: 'wallets'   },
  { icon: BarChart2,       label: 'Reportes',    id: 'reports'   },
]

const moreItems = [
  { icon: Target,   label: 'Presupuestos', id: 'budgets'       },
  { icon: Repeat,   label: 'Gastos fijos', id: 'subscriptions' },
  { icon: Sparkles, label: 'Asesor IA',    id: 'advisor'       },
  { icon: Settings, label: 'Ajustes',      id: 'settings'      },
]

function BottomNav({ page, setPage }) {
  const [showMore, setShowMore] = useState(false)
  const moreActive = moreItems.some(item => item.id === page)

  function go(id) {
    setPage(id)
    setShowMore(false)
  }

  const tabStyle = (active) => ({
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '8px 0 10px', cursor: 'pointer', minHeight: '56px',
    background: 'none', border: 'none',
    color: active ? '#7F77DD' : 'var(--text-muted)',
    fontSize: '11px', fontWeight: active ? '600' : '400', gap: '4px',
  })

  return (
    <>
      {/* Menú "Más" */}
      <AnimatePresence>
        {showMore && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMore(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.4)', zIndex: 99 }}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{
                position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 100,
                background: 'var(--bg-card)', borderRadius: '16px 16px 0 0',
                padding: '8px 16px calc(80px + env(safe-area-inset-bottom))',
              }}
            >
              <div style={{ width: '36px', height: '4px', borderRadius: '99px', background: 'var(--border-light)', margin: '0 auto 12px' }} />
              {moreItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => go(item.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '14px',
                    padding: '14px 12px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                    background: page === item.id ? 'rgba(127, 119, 221, 0.15)' : 'transparent',
                    color: page === item.id ? '#7F77DD' : 'var(--text-main)',
                    fontSize: '15px', fontWeight: page === item.id ? '600' : '500', textAlign: 'left',
                  }}>
                  <item.icon size={20} />
                  {item.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--bg-card)', borderTop: '1px solid var(--border-light)',
        display: 'flex', zIndex: 101,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {navItems.map(item => (
          <button key={item.id} onClick={() => go(item.id)} style={tabStyle(page === item.id && !showMore)}>
            <item.icon size={22} strokeWidth={page === item.id && !showMore ? 2.5 : 1.75} />
            {item.label}
          </button>
        ))}
        <button onClick={() => setShowMore(!showMore)} style={tabStyle(moreActive || showMore)}>
          <MoreHorizontal size={22} strokeWidth={moreActive || showMore ? 2.5 : 1.75} />
          Más
        </button>
      </nav>
    </>
  )
}

export default BottomNav
