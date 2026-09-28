import { useState } from 'react'
import { supabase } from '../../supabaseClient'
import { Wallet } from 'lucide-react'

function Login() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [mode,     setMode]     = useState('login') // 'login', 'register', 'forgot'
  const [message,  setMessage]  = useState('')

  async function handleSubmit() {
    if (!email) return setError('Ingresa tu email')
    if (mode !== 'forgot' && !password) return setError('Ingresa tu contraseña')
    setLoading(true)
    setError('')
    setMessage('')

    if (mode === 'register') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setMessage('¡Cuenta creada! Revisa tu email para confirmarla.')

    } else if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)

    } else if (mode === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://miplata-lovat.vercel.app/reset-password',
      })
      if (error) setError(error.message)
      else setMessage('¡Listo! Revisa tu email para restablecer tu contraseña.')
    }

    setLoading(false)
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px', fontSize: '14px',
    border: '1px solid var(--border-light)', borderRadius: '8px',
    background: 'var(--bg-input)', color: 'var(--text-main)', marginTop: '4px',
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }}>
      <div style={{
        background: 'var(--bg-card)', borderRadius: '16px',
        border: '1px solid var(--border-light)', padding: 'clamp(24px, 7vw, 40px)',
        width: '100%', maxWidth: '380px',
      }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px', justifyContent: 'center' }}>
          <div style={{ background: 'rgba(124, 92, 255, 0.15)', borderRadius: '10px', padding: '8px' }}>
            <Wallet size={22} color="#7C5CFF" />
          </div>
          <span style={{ fontWeight: '700', fontSize: '20px', color: 'var(--text-main)' }}>MiPlata</span>
        </div>

        <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '6px' }}>
          {mode === 'login'    ? 'Iniciar sesión'        :
           mode === 'register' ? 'Crear cuenta'          :
                                 'Restablecer contraseña'}
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-light)', marginBottom: '24px' }}>
          {mode === 'login'    ? 'Bienvenido de vuelta'                  :
           mode === 'register' ? 'Empieza a controlar tus finanzas'      :
                                 'Te enviaremos un link a tu email'}
        </p>

        {/* Email */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>Email</label>
          <input
            style={inputStyle}
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>

        {/* Contraseña — solo en login y register */}
        {mode !== 'forgot' && (
          <div style={{ marginBottom: '10px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>Contraseña</label>
            <input
              style={inputStyle}
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
        )}

        {/* Link olvidé contraseña */}
        {mode === 'login' && (
          <div style={{ textAlign: 'right', marginBottom: '16px' }}>
            <span
              onClick={() => { setMode('forgot'); setError(''); setMessage('') }}
              style={{ fontSize: '12px', color: '#7C5CFF', cursor: 'pointer' }}>
              ¿Olvidaste tu contraseña?
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ background: 'var(--error-bg)', color: 'var(--error-text)', fontSize: '12px', padding: '10px 12px', borderRadius: '8px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {/* Mensaje de éxito */}
        {message && (
          <div style={{ background: 'var(--success-bg)', color: 'var(--success-text)', fontSize: '12px', padding: '10px 12px', borderRadius: '8px', marginBottom: '16px' }}>
            {message}
          </div>
        )}

        {/* Botón */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%', padding: '11px', borderRadius: '8px', border: 'none',
            background: loading ? '#bbb' : '#7C5CFF', color: '#fff',
            fontWeight: '600', fontSize: '14px', cursor: loading ? 'default' : 'pointer',
          }}>
          {loading ? 'Cargando...' :
           mode === 'login'    ? 'Entrar'                    :
           mode === 'register' ? 'Crear cuenta'              :
                                 'Enviar link de recuperación'}
        </button>

        {/* Cambiar modo */}
        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', marginTop: '20px' }}>
          {mode === 'forgot' ? (
            <span onClick={() => { setMode('login'); setError(''); setMessage('') }} style={{ color: '#7C5CFF', cursor: 'pointer', fontWeight: '500' }}>
              Volver al inicio de sesión
            </span>
          ) : mode === 'login' ? (
            <>¿No tienes cuenta?{' '}
              <span onClick={() => { setMode('register'); setError(''); setMessage('') }} style={{ color: '#7C5CFF', cursor: 'pointer', fontWeight: '500' }}>
                Regístrate
              </span>
            </>
          ) : (
            <>¿Ya tienes cuenta?{' '}
              <span onClick={() => { setMode('login'); setError(''); setMessage('') }} style={{ color: '#7C5CFF', cursor: 'pointer', fontWeight: '500' }}>
                Inicia sesión
              </span>
            </>
          )}
        </p>

      </div>
    </div>
  )
}

export default Login