import { useState } from 'react'
import { Wallet } from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { balanceDelta } from '../../utils/balances'

function formatCOP(num) {
  return '$' + num.toLocaleString('es-CO')
}

// Se muestra una sola vez: pregunta cuánto hay hoy en cada billetera que aún no tiene saldo inicial.
// Al guardar u omitir, todas quedan configuradas (initial_balance deja de ser null) y no vuelve a aparecer.
function InitialBalanceSetup({ session, wallets, transactions, onSaved }) {
  const [values, setValues] = useState({})
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  const pending = wallets.filter(w => w.initial_balance === null || w.initial_balance === undefined)
  if (pending.length === 0) return null

  // Lo que MiPlata calcula hoy para cada billetera con los movimientos ya registrados
  const netByWallet = transactions.reduce((acc, t) => {
    acc[t.wallet] = (acc[t.wallet] || 0) + balanceDelta(t)
    return acc
  }, {})
  const hasMovements = transactions.length > 0

  async function save(skip) {
    // Se pregunta cuánto hay HOY; el saldo inicial es eso menos lo que ya se movió en la app.
    // Vacío u "Omitir" = dejar el saldo que calcula MiPlata (saldo inicial 0).
    const initials = {}
    for (const w of pending) {
      const typed = skip ? '' : (values[w.name] || '').trim()
      const today = typed === '' ? null : parseInt(typed, 10)
      if (Number.isNaN(today)) return setError(`Revisa el valor de ${w.name}`)
      initials[w.name] = today === null ? 0 : today - (netByWallet[w.name] || 0)
    }

    setSaving(true)
    setError('')
    const saved = []
    for (const w of pending) {
      // Las billeteras por defecto no existen en la base de datos hasta que se guardan
      const { data, error } = w.id
        ? await supabase.from('wallets').update({ initial_balance: initials[w.name] }).eq('id', w.id).select()
        : await supabase.from('wallets').insert([{ name: w.name, color: w.color, bg: w.bg, initial_balance: initials[w.name], user_id: session.user.id }]).select()

      if (error || !data?.length) {
        console.error(error)
        if (error?.message?.includes('initial_balance')) setError('Falta crear la columna initial_balance en Supabase.')
        else if (!error) setError('Supabase no permitió actualizar la billetera. Revisa la política UPDATE de la tabla wallets.')
        else setError('No se pudieron guardar los saldos.')
        if (saved.length) onSaved(saved)
        setSaving(false)
        return
      }
      saved.push(data[0])
    }

    setSaving(false)
    onSaved(saved)
  }

  const inputStyle = {
    width: '130px', flexShrink: 0, padding: '8px 10px', fontSize: '14px',
    border: '1px solid var(--border-light)', borderRadius: '8px',
    background: 'var(--bg-input)', color: 'var(--text-main)', textAlign: 'right',
  }

  return (
    <div style={{ background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid #7F77DD', padding: '20px', marginBottom: '20px' }}>
      <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '6px' }}>
        ¿Cuánto tienes hoy en cada billetera?
      </h3>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '16px' }}>
        Así tus saldos coinciden con los de tu banco. Solo te lo preguntamos una vez.
        {hasMovements && ' Deja vacío si el valor de MiPlata ya está bien.'}
      </p>

      {pending.map(w => (
        <div key={w.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', textAlign: 'left' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: w.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Wallet size={16} color={w.color} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-main)' }}>{w.name}</div>
            {hasMovements && (
              <div style={{ fontSize: '11px', color: 'var(--text-light)' }}>En MiPlata: {formatCOP(netByWallet[w.name] || 0)}</div>
            )}
          </div>
          <input
            style={inputStyle}
            type="number"
            inputMode="numeric"
            placeholder="$ 0"
            aria-label={`Saldo de hoy en ${w.name}`}
            value={values[w.name] || ''}
            onChange={e => setValues({ ...values, [w.name]: e.target.value })}
          />
        </div>
      ))}

      {error && (
        <div style={{ background: '#FAECE7', color: '#712B13', fontSize: '12px', padding: '8px 10px', borderRadius: '8px', marginBottom: '10px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
        <button
          onClick={() => save(true)}
          disabled={saving}
          style={{ flex: 1, padding: '9px', borderRadius: '8px', border: '1px solid var(--border-light)', background: 'transparent', fontSize: '13px', color: 'var(--text-muted)', cursor: 'pointer' }}>
          Omitir
        </button>
        <button
          onClick={() => save(false)}
          disabled={saving}
          style={{ flex: 2, padding: '9px', borderRadius: '8px', border: 'none', background: '#7F77DD', color: '#fff', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
          {saving ? 'Guardando...' : 'Guardar saldos'}
        </button>
      </div>
    </div>
  )
}

export default InitialBalanceSetup
