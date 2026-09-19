import { createApp } from './app'
import { loadConfig } from './config'
import { createDatabase } from './db/client'

const config = loadConfig()
const database = createDatabase(config)
const app = createApp({ db: database.db, sql: database.client })

const server = Bun.serve({
  fetch: app.fetch,
  hostname: config.HOST,
  port: config.PORT,
})

console.log(JSON.stringify({ level: 'info', message: 'Server started', host: config.HOST, port: config.PORT }))

async function shutdown(signal: string) {
  console.log(JSON.stringify({ level: 'info', message: `${signal} received, shutting down` }))
  server.stop()
  await database.client.end()
  process.exit(0)
}

process.on('SIGTERM', () => { void shutdown('SIGTERM') })
process.on('SIGINT', () => { void shutdown('SIGINT') })
