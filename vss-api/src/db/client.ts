import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres, { type Sql } from 'postgres'
import type { Config } from '../config'
import * as schema from './schema'

export type Database = PostgresJsDatabase<typeof schema>

export interface DatabaseConnection {
  db: Database
  client: Sql
}

export function createDatabase(config: Pick<Config, 'DATABASE_URL'>): DatabaseConnection {
  const client = postgres(config.DATABASE_URL, { max: 10 })
  return { db: drizzle(client, { schema }), client }
}
