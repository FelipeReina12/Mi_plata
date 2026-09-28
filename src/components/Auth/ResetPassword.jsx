import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { Wallet } from 'lucide-react'

function ResetPassword() {
  const [password,  setPassword]  = useState('')
  const [password2, setPassword2] = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [message,   setMessage]   = useState('')

  async function handleReset() {
    if (!password || !password2)    return setError('Completa los dos campos')
    if (password !== password2)     return setError('Las contraseñas no coinciden')
    if (password.length < 6)        return setError('Mínimo 6 caracteres')

    setLoading(true)
    setError('')

    const { error } = await supabase.auth.updateUser({ password })

    if (error) setError(error.message)
    else setMessage('¡Contraseña actualizada! Ya puedes iniciar sesión.')

    setLoading(false)
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px', fontSize: '14px',
    border: '1px solid var(--border-light)', borderRadius: '8px',
    background: 'var(--bg-input)', color: 'var(--text-main)', marginTop: '4px',
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg-app)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }}>
      <div style={{
        background: 'var(--bg-card)', borderRadius: '16px',
        border: '1px solid var(--border-light)', padding: 'clamp(24px, 7vw, 40px)',
        width: '100%', maxWidth: '380px',
      }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px', justifyContent: 'center' }}>
          <div style={{ background: '#EEEDFE', borderRadius: '10px', padding: '8px' }}>
            <Wallet size={22} color="#7F77DD" />
          </div>
          <span style={{ fontWeight: '700', fontSize: '20px', color: 'var(--text-main)' }}>MiPlata</span>
        </div>

        <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '6px' }}>Nueva contraseña</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-light)', marginBottom: '24px' }}>Elige una contraseña segura</p>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>Nueva contraseña</label>
          <input style={inputStyle} type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>Confirmar contraseña</label>
          <input style={inputStyle} type="password" placeholder="Repite la contraseña" value={password2} onChange={e => setPassword2(e.target.value)} />
        </div>

        {error && (
          <div style={{ background: '#FAECE7', color: '#712B13', fontSize: '12px', padding: '10px 12px', borderRadius: '8px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {message && (
          <div style={{ background: '#E1F5EE', color: '#085041', fontSize: '12px', padding: '10px 12px', borderRadius: '8px', marginBottom: '16px' }}>
            {message}
          </div>
        )}

        <button
          onClick={handleReset}
          disabled={loading || !!message}
          style={{
            width: '100%', padding: '11px', borderRadius: '8px', border: 'none',
            background: loading || message ? '#bbb' : '#7F77DD', color: '#fff',
            fontWeight: '600', fontSize: '14px', cursor: 'pointer',
          }}>
          {loading ? 'Guardando...' : 'Actualizar contraseña'}
        </button>

      </div>
    </div>
  )
}

export default ResetPassword