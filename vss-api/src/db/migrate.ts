import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import postgres from 'postgres'
import { loadConfig } from '../config'

const config = loadConfig()
const sql = postgres(config.DATABASE_URL, { max: 1 })

try {
  await sql`create table if not exists schema_migrations (
    name text primary key,
    applied_at timestamptz not null default now()
  )`

  const directory = path.resolve(import.meta.dir, '../../migrations')
  const files = (await readdir(directory)).filter((file) => file.endsWith('.sql')).sort()

  for (const file of files) {
    const existing = await sql<{ name: string }[]>`select name from schema_migrations where name = ${file}`
    if (existing.length > 0) continue

    const migration = await readFile(path.join(directory, file), 'utf8')
    await sql.begin(async (transaction) => {
      await transaction.unsafe(migration)
      await transaction`insert into schema_migrations (name) values (${file})`
    })
    console.log(`Applied ${file}`)
  }
} finally {
  await sql.end()
}
