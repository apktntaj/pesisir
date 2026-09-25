import { createHash } from 'node:crypto'
import { eq } from 'drizzle-orm'
import type { Context, Hono } from 'hono'
import type { ZodType } from 'zod'
import type { Database } from '../db/client'
import { sourceDocuments, sourceMessages } from '../db/schema'
import { ApiError, notFound } from '../shared/errors'
import { auditedMutation, type Transaction } from '../shared/mutations'
import { idSchema } from '../shared/responses'
import { createSourceDocumentSchema, createSourceMessageSchema } from './schemas'

const maximumDocumentBytes = 20 * 1024 * 1024
const documentMetadata = {
  id: sourceDocuments.id,
  sourceKind: sourceDocuments.sourceKind,
  sourceMessageId: sourceDocuments.sourceMessageId,
  fileName: sourceDocuments.fileName,
  mimeType: sourceDocuments.mimeType,
  byteSize: sourceDocuments.byteSize,
  sha256: sourceDocuments.sha256,
  receivedAt: sourceDocuments.receivedAt,
  createdAt: sourceDocuments.createdAt,
}

async function body<T>(context: Context, schema: ZodType<T>): Promise<T> {
  const parsed = schema.safeParse(await context.req.json().catch(() => null))
  if (!parsed.success) {
    throw new ApiError(422, 'VALIDATION_ERROR', 'Request tidak valid.', parsed.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    })))
  }
  return parsed.data
}

function id(raw: string) {
  const parsed = idSchema.safeParse(raw)
  if (!parsed.success) throw new ApiError(400, 'INVALID_ID', 'ID harus berupa UUID yang valid.')
  return parsed.data
}

async function requireSourceMessage(database: Database | Transaction, sourceMessageId: string) {
  const [message] = await database.select().from(sourceMessages).where(eq(sourceMessages.id, sourceMessageId)).limit(1)
  if (!message) throw notFound('Source Message')
  return message
}

export function registerSourceLineageRoutes(app: Hono, db: Database) {
  app.post('/api/v1/source-messages', async (context) => {
    const input = await body(context, createSourceMessageSchema)
    return auditedMutation(context, db, input, 'source_message', 'CREATE', async (transaction) => {
      const [message] = await transaction.insert(sourceMessages).values({
        ...input,
        occurredAt: new Date(input.occurredAt),
        bodyText: input.bodyText ?? null,
      }).onConflictDoNothing({
        target: [sourceMessages.channel, sourceMessages.externalMessageId],
      }).returning()
      if (!message) throw new ApiError(409, 'DUPLICATE_SOURCE_MESSAGE', 'Pesan sumber ini sudah tercatat.')
      return { entityId: message.id, afterData: message, body: { data: message }, status: 201 }
    })
  })

  app.get('/api/v1/source-messages/:id', async (context) => {
    const message = await requireSourceMessage(db, id(context.req.param('id')))
    return context.json({ data: message })
  })

  app.post('/api/v1/source-documents', async (context) => {
    const input = await body(context, createSourceDocumentSchema)
    const content = Buffer.from(input.contentBase64, 'base64')
    if (content.byteLength === 0 || content.byteLength > maximumDocumentBytes) {
      throw new ApiError(422, 'INVALID_DOCUMENT_SIZE', 'Ukuran dokumen harus antara 1 byte dan 20 MiB.')
    }
    const request = {
      sourceKind: input.sourceKind,
      sourceMessageId: input.sourceKind === 'WHATSAPP_ATTACHMENT' ? input.sourceMessageId : null,
      fileName: input.fileName,
      mimeType: input.mimeType,
      receivedAt: input.receivedAt,
      contentSha256: createHash('sha256').update(content).digest('hex'),
    }

    return auditedMutation(context, db, request, 'source_document', 'CREATE', async (transaction) => {
      const sourceMessageId = input.sourceKind === 'WHATSAPP_ATTACHMENT' ? input.sourceMessageId : null
      if (sourceMessageId) await requireSourceMessage(transaction, sourceMessageId)
      const [document] = await transaction.insert(sourceDocuments).values({
        sourceKind: input.sourceKind,
        sourceMessageId,
        fileName: input.fileName,
        mimeType: input.mimeType,
        byteSize: content.byteLength,
        sha256: request.contentSha256,
        content,
        receivedAt: new Date(input.receivedAt),
      }).returning(documentMetadata)
      if (!document) throw new ApiError(500, 'INTERNAL_ERROR', 'Dokumen sumber tidak dapat dibuat.')
      return { entityId: document.id, afterData: document, body: { data: document }, status: 201 }
    })
  })

  app.get('/api/v1/source-documents/:id', async (context) => {
    const [document] = await db.select(documentMetadata).from(sourceDocuments).where(eq(sourceDocuments.id, id(context.req.param('id')))).limit(1)
    if (!document) throw notFound('Source Document')
    return context.json({ data: document })
  })

  app.get('/api/v1/source-documents/:id/content', async (context) => {
    const [document] = await db.select({
      content: sourceDocuments.content,
      fileName: sourceDocuments.fileName,
      mimeType: sourceDocuments.mimeType,
    }).from(sourceDocuments).where(eq(sourceDocuments.id, id(context.req.param('id')))).limit(1)
    if (!document) throw notFound('Source Document')
    return new Response(document.content, {
      headers: {
        'Content-Type': document.mimeType,
        'Content-Length': String(document.content.byteLength),
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(document.fileName)}`,
      },
    })
  })
}
