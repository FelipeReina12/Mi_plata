import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { handleAdvisorRequest } from './server/advisor.js'

// En desarrollo (npm run dev) atiende /api/advisor igual que la función de Vercel
function localApi(env) {
  return {
    name: 'local-api',
    configureServer(server) {
      server.middlewares.use('/api/advisor', async (req, res) => {
        let raw = ''
        for await (const chunk of req) raw += chunk
        let body = {}
        try { body = raw ? JSON.parse(raw) : {} } catch { /* cuerpo inválido: se ignora */ }

        const result = req.method === 'POST'
          ? await handleAdvisorRequest({ authorization: req.headers.authorization, body, env })
          : { status: 405, body: { error: 'method_not_allowed' } }

        res.statusCode = result.status
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(result.body))
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Todas las variables del .env, también las que no empiezan por VITE_ (como GEMINI_API_KEY),
  // solo para el servidor de desarrollo: nunca se incluyen en la app del navegador
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), localApi(env)],
  }
})
