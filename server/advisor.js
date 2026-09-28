// Lógica del Asesor IA. Corre en el servidor (función de Vercel en /api/advisor, o en `npm run dev`),
// así la clave de Gemini nunca llega al navegador.
import { GoogleGenAI } from '@google/genai'
import { createClient } from '@supabase/supabase-js'

// Modelos en orden de preferencia. En la capa gratuita cada modelo tiene su propio límite de uso,
// así que si uno está saturado o llegó a su límite se prueba con el siguiente.
const MODELS = ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.5-flash-lite']

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const formatCOP = n => '$' + n.toLocaleString('es-CO')

function buildPrompt(month, txs) {
  const [y, m] = month.split('-').map(Number)
  const monthName = new Date(y, m - 1, 1).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })

  const incomes  = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expenses = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const byCategory = txs
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + t.amount; return acc }, {})
  const categories = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([c, v]) => `${c} ${formatCOP(v)}`)
    .join(', ')

  // Una línea por movimiento: ocupa menos que el JSON y la IA lo lee igual de bien
  const lines = txs
    .map(t => `${t.date} | ${t.type === 'income' ? 'ingreso' : 'gasto'} | ${t.category} | ${t.description} | ${t.amount}`)
    .join('\n')

  return `Eres un asesor financiero experto y amigable. Un usuario te compartió sus ingresos y gastos de ${monthName} en Colombia (moneda COP).

Resumen:
- Ingresos totales: ${formatCOP(incomes)}
- Gastos totales: ${formatCOP(expenses)}
- Gastos por categoría: ${categories || 'sin gastos'}

Movimientos (fecha | tipo | categoría | descripción | monto):
${lines}

Genera un reporte en formato Markdown que contenga:
1. Un análisis muy breve y amable de sus hábitos de consumo este mes.
2. 3 consejos accionables y específicos basados en los gastos exactos que ves en los datos para ayudarle a ahorrar más.

Usa un tono motivador, directo y profesional. Usa emojis apropiados. NO uses bloques de código en tu respuesta.`
}

// Llama a Gemini probando los modelos en orden. Devuelve { text, model } o { error }.
// error: 'rate_limited' (límite de uso), 'overloaded' (servidores ocupados), 'bad_key' o 'api_error'.
export async function generateWithFallback(ai, prompt) {
  let lastError = 'api_error'
  for (const model of MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const res = await ai.models.generateContent({ model, contents: prompt })
        if (res.text) return { text: res.text, model }
        lastError = 'api_error'
        break
      } catch (err) {
        const status  = err?.status
        const message = err?.message || ''
        console.error(`Gemini ${model} (intento ${attempt}): ${status} ${message}`)

        // Clave inválida, bloqueada o sin permisos: otro modelo no lo arregla
        if (status === 401 || status === 403 || (status === 400 && /api key/i.test(message))) return { error: 'bad_key' }
        // Llegó al límite de este modelo: probar con el siguiente
        if (status === 429) { lastError = 'rate_limited'; break }
        // Servidores ocupados: esperar un poco y reintentar una vez, luego pasar al siguiente
        if (status === 500 || status === 503 || status === 504) {
          lastError = 'overloaded'
          if (attempt === 1) { await sleep(1500); continue }
          break
        }
        // Modelo no disponible u otro error: probar con el siguiente
        lastError = 'api_error'
        break
      }
    }
  }
  return { error: lastError }
}

// Atiende una petición al asesor. Devuelve { status, body } para que la use Vercel o el servidor de desarrollo.
export async function handleAdvisorRequest({ authorization, body, env }) {
  const apiKey      = env.GEMINI_API_KEY
  const supabaseUrl = env.VITE_SUPABASE_URL
  const supabaseKey = env.VITE_SUPABASE_KEY
  if (!apiKey) return { status: 500, body: { error: 'no_key' } }
  if (!supabaseUrl || !supabaseKey) return { status: 500, body: { error: 'api_error' } }

  // Solo usuarios con sesión iniciada
  const token = (authorization || '').replace(/^Bearer\s+/i, '')
  if (!token) return { status: 401, body: { error: 'unauthorized' } }

  // Cliente de Supabase que actúa como el usuario: solo puede leer sus propios datos
  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: userData, error: userError } = await supabase.auth.getUser(token)
  if (userError || !userData?.user) return { status: 401, body: { error: 'unauthorized' } }

  // El mes lo manda el navegador (el servidor está en hora UTC, no de Colombia)
  const month = /^\d{4}-\d{2}$/.test(body?.month || '') ? body.month : new Date().toISOString().slice(0, 7)
  const [y, m] = month.split('-').map(Number)
  const nextMonth = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`

  const { data: txs, error: txError } = await supabase
    .from('transactions')
    .select('description, amount, type, category, date')
    .eq('user_id', userData.user.id)
    .in('type', ['income', 'expense']) // las transferencias solo mueven plata entre billeteras
    .gte('date', `${month}-01`)
    .lt('date', `${nextMonth}-01`)
    .order('date')

  if (txError) {
    console.error(txError)
    return { status: 500, body: { error: 'api_error' } }
  }
  if (!txs?.length) return { status: 422, body: { error: 'no_data' } }

  const ai = new GoogleGenAI({ apiKey })
  const result = await generateWithFallback(ai, buildPrompt(month, txs))
  if (result.error) {
    const status = { rate_limited: 429, overloaded: 503, bad_key: 500 }[result.error] || 502
    return { status, body: { error: result.error } }
  }
  return { status: 200, body: { text: result.text, model: result.model } }
}
