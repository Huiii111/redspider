import express from 'express'
import { benchmarkRoute, caseRoute } from './routes/benchmark.js'
import { healthRoute } from './routes/health.js'
import { HttpError } from './routes/httpError.js'
import { scanRoute } from './routes/scan.js'

const BODY_LIMIT_MULTIPLIER = 3

export function createApp(dependencies) {
  const app = express()
  const bodyLimit = dependencies.limits.maxTerraformBytes * BODY_LIMIT_MULTIPLIER
  app.use(express.json({ limit: bodyLimit }))

  app.get('/api/health', healthRoute(dependencies))
  app.get('/api/benchmark', benchmarkRoute(dependencies))
  app.get('/api/cases/:id', caseRoute(dependencies))
  app.post('/api/scan', scanRoute(dependencies))

  app.use((error, _request, response, _next) => {
    if (error instanceof HttpError) {
      return response.status(error.status).json({ error: { code: error.code, message: error.message } })
    }
    if (error.type === 'entity.too.large') {
      const message = 'That Terraform is too large. Shorten it and try again.'
      return response.status(413).json({ error: { code: 'INPUT_TOO_LARGE', message } })
    }
    if (error.type === 'entity.parse.failed') {
      return response.status(400).json({ error: { code: 'INVALID_INPUT', message: 'The request was not valid JSON.' } })
    }
    console.error(JSON.stringify({ level: 'error', message: error.message, stack: error.stack }))
    return response.status(500).json({ error: { code: 'SERVER_ERROR', message: 'The server hit an unexpected problem.' } })
  })
  return app
}
