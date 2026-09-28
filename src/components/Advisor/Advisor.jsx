import { useState } from 'react'
import { supabase } from '../../supabaseClient'
import { Sparkles, AlertCircle, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { motion } from 'framer-motion'
import { currentMonthLocal } from '../../utils/dates'

// Mensaje para cada error que puede devolver /api/advisor
const errorMessages = {
  no_data:      'No tienes ingresos ni gastos este mes para analizar.',
  rate_limited: 'La IA llegó a su límite de uso gratuito por ahora. Intenta de nuevo en unos minutos; si sigue igual, el límite diario se reinicia mañana.',
  overloaded:   'Los servidores de Gemini están muy ocupados en este momento. Intenta de nuevo en un momento.',
  bad_key:      'La clave de Gemini no es válida o fue bloqueada. Crea una nueva en Google AI Studio y actualízala en Vercel.',
  no_key:       'Falta configurar la variable GEMINI_API_KEY en el servidor.',
  unauthorized: 'Tu sesión expiró. Cierra sesión y vuelve a entrar.',
  network:      'No se pudo conectar. Revisa tu conexión a internet e intenta de nuevo.',
  api_error:    'Algo falló al generar el análisis. Intenta de nuevo.',
}

function Advisor() {
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState(null)
  const [error, setError] = useState(null)

  async function handleAnalyze() {
    setLoading(true)
    setError(null)
    setResponse(null)

    try {
      // La llamada a Gemini la hace el servidor (/api/advisor) con la sesión del usuario:
      // así la clave de la IA no queda expuesta en el navegador
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/advisor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({ month: currentMonthLocal() }),
      })
      const data = await res.json().catch(() => ({}))

      if (data.text) setResponse(data.text)
      else setError(data.error || 'api_error')
    } catch (err) {
      console.error(err)
      setError('network')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
        <Sparkles color="#7C5CFF" size={24} />
        <h2 style={{ color: 'var(--text-main)', fontWeight: '600' }}>Asesor IA</h2>
      </div>

      {!response && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: 'clamp(20px, 6vw, 30px)', textAlign: 'center', border: '1px solid var(--border-light)' }}
        >
          <div style={{ background: 'rgba(124, 92, 255, 0.1)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Sparkles color="#7C5CFF" size={30} />
          </div>
          <h3 style={{ fontSize: '18px', color: 'var(--text-main)', marginBottom: '10px' }}>Analiza tus finanzas con IA</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.5', maxWidth: '400px', margin: '0 auto 24px' }}>
            Nuestro asesor inteligente leerá tus movimientos de este mes y te dará recomendaciones personalizadas para optimizar tus gastos.
          </p>

          {error && (
            <div style={{ background: 'rgba(244, 63, 94, 0.1)', padding: '12px', borderRadius: '8px', color: '#F43F5E', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '20px', textAlign: 'left' }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              {errorMessages[error] || errorMessages.api_error}
            </div>
          )}

          <button
            onClick={handleAnalyze}
            style={{
              padding: '12px 24px', borderRadius: '99px', border: 'none',
              background: '#7C5CFF', color: '#fff', fontSize: '15px', fontWeight: '600',
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px',
              boxShadow: '0 4px 14px rgba(124, 92, 255, 0.3)'
            }}
          >
            <Sparkles size={18} />
            {error ? 'Intentar de nuevo' : 'Generar análisis'}
          </button>
        </motion.div>
      )}

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
            <Loader2 size={32} color="#7C5CFF" />
          </motion.div>
          <p style={{ color: 'var(--text-muted)', marginTop: '16px', fontSize: '14px' }}>La IA está analizando tus finanzas...</p>
        </div>
      )}

      {response && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: 'clamp(18px, 5vw, 30px)', border: '1px solid var(--border-light)' }}
        >
          <div className="markdown-body" style={{ color: 'var(--text-main)', fontSize: '15px', lineHeight: '1.6' }}>
            <ReactMarkdown>{response}</ReactMarkdown>
          </div>

          <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid var(--border-dim)', textAlign: 'center' }}>
            <button
              onClick={handleAnalyze}
              style={{
                padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border-light)',
                background: 'transparent', color: 'var(--text-muted)', fontSize: '13px', fontWeight: '500',
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px'
              }}
            >
              <Sparkles size={14} />
              Generar nuevo análisis
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default Advisor
