import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import express from 'express'
import { env } from './config/env.js'
import { runMigrations } from './db/migrations.js'
import { craftRouter } from './routes/craft.js'
import { settingsRouter } from './routes/settings.js'
import { stateRouter } from './routes/state.js'

runMigrations()

const app = express()
const distPath = resolve(process.cwd(), 'dist')
const indexPath = resolve(distPath, 'index.html')

app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.use('/api/state', stateRouter)
app.use('/api/settings', settingsRouter)
app.use('/api/craft', craftRouter)

if (existsSync(distPath)) {
  app.use(express.static(distPath))

  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(indexPath)
  })
}

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error)
  res.status(500).json({
    message: error instanceof Error ? error.message : '服务器内部错误',
  })
})

app.listen(env.port, () => {
  console.log(`Server listening on http://localhost:${env.port}`)
  console.log(`SQLite database: ${env.databasePath}`)
})
