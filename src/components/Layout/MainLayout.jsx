import Sidebar from './Sidebar'
import BottomNav from './BottomNav'
import useIsMobile from '../../hooks/useIsMobile'

function MainLayout({ children, page, setPage }) {
  const isMobile = useIsMobile()

  return (
    <div style={{ display: 'flex', fontFamily: 'sans-serif' }}>
      {!isMobile && <Sidebar page={page} setPage={setPage} />}
      <main style={{
        flex: 1,
        minWidth: 0,
        padding: isMobile ? '16px' : '24px',
        paddingTop: isMobile ? 'calc(16px + env(safe-area-inset-top))' : '24px',
        paddingBottom: isMobile ? 'calc(88px + env(safe-area-inset-bottom))' : '24px',
        background: 'transparent',
        minHeight: '100vh',
      }}>
        {children}
      </main>
      {isMobile && <BottomNav page={page} setPage={setPage} />}
    </div>
  )
}

export default MainLayout
