// Función de Vercel: POST /api/advisor
// La clave de Gemini vive solo aquí (variable de entorno GEMINI_API_KEY en Vercel).
import { handleAdvisorRequest } from '../server/advisor.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' })

  const { status, body } = await handleAdvisorRequest({
    authorization: req.headers.authorization,
    body: req.body,
    env: process.env,
  })
  res.status(status).json(body)
}
