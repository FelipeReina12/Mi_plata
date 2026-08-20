import { supabase } from '../../supabaseClient'
import { Moon, Sun, LogOut } from 'lucide-react'

function Settings({ darkMode, setDarkMode }) {
  return (
    <div>
      <h2 style={{ marginBottom: '20px', color: 'var(--text-main)', fontWeight: '600' }}>
        Ajustes
      </h2>

      <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-light)', padding: '20px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '14px', color: 'var(--text-main)', marginBottom: '16px' }}>Apariencia</h3>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-dim)' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-main)' }}>Modo Oscuro</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Cambia los colores de la aplicación.</div>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            style={{
              padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-light)',
              background: 'var(--bg-app)', color: 'var(--text-main)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500'
            }}>
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            {darkMode ? 'Desactivar' : 'Activar'}
          </button>
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-light)', padding: '20px' }}>
        <h3 style={{ fontSize: '14px', color: 'var(--text-main)', marginBottom: '16px' }}>Cuenta</h3>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-main)' }}>Cerrar sesión</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Salir de tu cuenta de forma segura.</div>
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            style={{
              padding: '8px 12px', borderRadius: '8px', border: 'none',
              background: '#D85A30', color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500'
            }}>
            <LogOut size={16} />
            Salir
          </button>
        </div>
      </div>
    </div>
  )
}

export default Settings
