import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import BottomNav from './BottomNav'

function MainLayout({ children, page, setPage }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div style={{ display: 'flex', fontFamily: 'sans-serif' }}>
      {!isMobile && <Sidebar page={page} setPage={setPage} />}
      <main style={{
        flex: 1,
        padding: isMobile ? '16px' : '24px',
        paddingBottom: isMobile ? '80px' : '24px',
        background: '#F7F6F3',
        minHeight: '100vh',
      }}>
        {children}
      </main>
      {isMobile && <BottomNav page={page} setPage={setPage} />}
    </div>
  )
}

export default MainLayout