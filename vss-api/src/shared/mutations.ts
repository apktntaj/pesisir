import { createHash } from 'node:crypto'
import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { and, eq } from 'drizzle-orm'
import type { Database } from '../db/client'
import { auditEvents, idempotencyRecords } from '../db/schema'
import { ApiError } from './errors'

export type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0]

type MutationResult = {
  entityId: string
  beforeData?: unknown
  afterData?: unknown
  body: Record<string, unknown>
  status: number
}

export type MutationMetadata = {
  actorRef: string
  sourceMessageId: string | null
  idempotencyKey: string
}

function metadata(context: Context): MutationMetadata {
  const actorRef = context.req.header('X-Actor-Ref')?.trim()
  const idempotencyKey = context.req.header('Idempotency-Key')?.trim()
  if (!actorRef) throw new ApiError(400, 'ACTOR_REQUIRED', 'Header X-Actor-Ref wajib diisi.')
  if (!idempotencyKey || idempotencyKey.length < 8) throw new ApiError(400, 'IDEMPOTENCY_KEY_REQUIRED', 'Header Idempotency-Key wajib diisi.')
  return { actorRef, idempotencyKey, sourceMessageId: context.req.header('X-Source-Message-Id')?.trim() || null }
}

export async function auditedMutation(
  context: Context,
  db: Database,
  requestBody: unknown,
  entityType: string,
  action: string,
  mutate: (transaction: Transaction, metadata: MutationMetadata) => Promise<MutationResult>,
): Promise<Response> {
  const meta = metadata(context)
  const method = context.req.method
  const path = context.req.path
  const requestHash = createHash('sha256').update(JSON.stringify(requestBody ?? null)).digest('hex')
  const [existing] = await db.select().from(idempotencyRecords).where(eq(idempotencyRecords.key, meta.idempotencyKey)).limit(1)
  if (existing) {
    if (existing.method !== method || existing.path !== path || existing.requestHash !== requestHash) {
      throw new ApiError(409, 'IDEMPOTENCY_CONFLICT', 'Idempotency-Key sudah digunakan untuk request yang berbeda.')
    }
    return context.json(existing.responseBody as Record<string, unknown>, existing.responseStatus as ContentfulStatusCode)
  }

  let result: MutationResult
  try {
    result = await db.transaction(async (transaction) => {
      const operation = await mutate(transaction, meta)
      await transaction.insert(auditEvents).values({
        entityType, entityId: operation.entityId, action, beforeData: operation.beforeData ?? null,
        afterData: operation.afterData ?? null, actorRef: meta.actorRef, sourceMessageId: meta.sourceMessageId,
        idempotencyKey: meta.idempotencyKey,
      })
      await transaction.insert(idempotencyRecords).values({
        key: meta.idempotencyKey, method, path, requestHash, responseStatus: operation.status, responseBody: operation.body,
      })
      return operation
    })
  } catch (error) {
    const [raced] = await db.select().from(idempotencyRecords).where(eq(idempotencyRecords.key, meta.idempotencyKey)).limit(1)
    if (!raced) throw error
    if (raced.method !== method || raced.path !== path || raced.requestHash !== requestHash) {
      throw new ApiError(409, 'IDEMPOTENCY_CONFLICT', 'Idempotency-Key sudah digunakan untuk request yang berbeda.')
    }
    return context.json(raced.responseBody as Record<string, unknown>, raced.responseStatus as ContentfulStatusCode)
  }
  return context.json(result.body, result.status as ContentfulStatusCode)
}

export async function idempotencyExists(db: Database, key: string, method: string, path: string) {
  const [record] = await db.select().from(idempotencyRecords).where(and(
    eq(idempotencyRecords.key, key), eq(idempotencyRecords.method, method), eq(idempotencyRecords.path, path),
  )).limit(1)
  return record
}
