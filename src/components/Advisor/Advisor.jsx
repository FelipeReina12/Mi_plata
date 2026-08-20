import { useState } from 'react'
import { supabase } from '../../supabaseClient'
import { Sparkles, AlertCircle, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { motion } from 'framer-motion'
import { GoogleGenAI } from '@google/genai'

function Advisor({ session, setPage }) {
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState(null)
  const [error, setError] = useState(null)

  async function handleAnalyze() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY
    
    if (!apiKey) {
      setError('no_key')
      return
    }

    setLoading(true)
    setError(null)
    setResponse(null)

    try {
      // 1. Obtener datos del usuario (mes actual)
      const d = new Date()
      const currentMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

      const { data: txs } = await supabase
        .from('transactions')
        .select('description, amount, type, category, date')
        .gte('date', currentMonth + '-01')

      if (!txs || txs.length === 0) {
        setLoading(false)
        setError('no_data')
        return
      }

      // 2. Preparar el prompt
      const incomes = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
      const expenses = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
      
      const prompt = `Eres un asesor financiero experto y amigable. Un usuario te ha compartido sus gastos e ingresos de este mes en Colombia (moneda COP).
      
      Resumen numérico:
      - Ingresos totales: $${incomes}
      - Gastos totales: $${expenses}
      
      Detalle de movimientos:
      ${JSON.stringify(txs)}
      
      Por favor, genera un reporte en formato Markdown que contenga:
      1. Un análisis muy breve y amable de sus hábitos de consumo este mes.
      2. 3 consejos accionables y específicos basados en los gastos exactos que ves en los datos para ayudarle a ahorrar más.
      
      Usa un tono motivador, directo y profesional. Usa emojis apropiados. NO uses bloques de código en tu respuesta.`

      // 3. Llamar a la API usando el SDK oficial
      const ai = new GoogleGenAI({ apiKey })
      const res = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt
      })

      if (res.text) {
        setResponse(res.text)
      } else {
        throw new Error('Respuesta vacía de la API')
      }

    } catch (err) {
      console.error(err)
      setError('api_error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
        <Sparkles color="#7F77DD" size={24} />
        <h2 style={{ color: 'var(--text-main)', fontWeight: '600' }}>Asesor IA</h2>
      </div>

      {!response && !loading && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '30px', textAlign: 'center', border: '1px solid var(--border-light)' }}
        >
          <div style={{ background: 'rgba(127, 119, 221, 0.1)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Sparkles color="#7F77DD" size={30} />
          </div>
          <h3 style={{ fontSize: '18px', color: 'var(--text-main)', marginBottom: '10px' }}>Analiza tus finanzas con IA</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.5', maxWidth: '400px', margin: '0 auto 24px' }}>
            Nuestro asesor inteligente leerá tus movimientos de este mes y te dará recomendaciones personalizadas para optimizar tus gastos.
          </p>
          
          {error === 'no_key' && (
            <div style={{ background: 'rgba(216, 90, 48, 0.1)', padding: '12px', borderRadius: '8px', color: '#D85A30', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
              <AlertCircle size={16} />
              Falta la variable de entorno VITE_GEMINI_API_KEY en tu código.
            </div>
          )}

          {error === 'no_data' && (
            <div style={{ background: 'rgba(216, 90, 48, 0.1)', padding: '12px', borderRadius: '8px', color: '#D85A30', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
              <AlertCircle size={16} />
              No tienes movimientos este mes para analizar.
            </div>
          )}

          {error === 'api_error' && (
            <div style={{ background: 'rgba(216, 90, 48, 0.1)', padding: '12px', borderRadius: '8px', color: '#D85A30', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
              <AlertCircle size={16} />
              Error al conectar con la IA. Revisa tu API Key.
            </div>
          )}

          <button 
            onClick={handleAnalyze}
            style={{
              padding: '12px 24px', borderRadius: '99px', border: 'none',
              background: '#7F77DD', color: '#fff', fontSize: '15px', fontWeight: '600',
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px',
              boxShadow: '0 4px 14px rgba(127, 119, 221, 0.3)'
            }}
          >
            <Sparkles size={18} />
            Generar análisis
          </button>
        </motion.div>
      )}

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
            <Loader2 size={32} color="#7F77DD" />
          </motion.div>
          <p style={{ color: 'var(--text-muted)', marginTop: '16px', fontSize: '14px' }}>La IA está analizando tus finanzas...</p>
        </div>
      )}

      {response && !loading && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '30px', border: '1px solid var(--border-light)' }}
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
