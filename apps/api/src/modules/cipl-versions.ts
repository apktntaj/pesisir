import { asc, count, desc, eq } from 'drizzle-orm'
import type { Context, Hono } from 'hono'
import { z } from 'zod'
import type { ZodType } from 'zod'
import type { Database } from '../db/client'
import { ciplItems, cipls, ciplVersions, eventExhibitors, sourceDocuments } from '../db/schema'
import { createCiplSchema, createCiplVersionSchema } from './schemas'
import { ApiError, notFound } from '../shared/errors'
import { auditedMutation, type Transaction } from '../shared/mutations'
import { idSchema } from '../shared/responses'

const ciplFields = { id: cipls.id, eventExhibitorId: cipls.eventExhibitorId, referenceNumber: cipls.referenceNumber, status: cipls.status, activeVersionId: cipls.activeVersionId, createdAt: cipls.createdAt, updatedAt: cipls.updatedAt }
const versionFields = { id: ciplVersions.id, ciplId: ciplVersions.ciplId, versionNumber: ciplVersions.versionNumber, status: ciplVersions.status, sourceDocumentId: ciplVersions.sourceDocumentId, receivedAt: ciplVersions.receivedAt, receivedByActorRef: ciplVersions.receivedByActorRef, revisionNote: ciplVersions.revisionNote, createdAt: ciplVersions.createdAt }
const itemFields = { id: ciplItems.id, ciplVersionId: ciplItems.ciplVersionId, lineNumber: ciplItems.lineNumber, description: ciplItems.description, quantity: ciplItems.quantity, unit: ciplItems.unit, unitValue: ciplItems.unitValue, currency: ciplItems.currency, grossWeightKg: ciplItems.grossWeightKg, netWeightKg: ciplItems.netWeightKg, countryOfOrigin: ciplItems.countryOfOrigin, identifiers: ciplItems.identifiers, intendedUse: ciplItems.intendedUse, intendedDisposal: ciplItems.intendedDisposal }

async function body<T>(context: Context, schema: ZodType<T>): Promise<T> { const parsed = schema.safeParse(await context.req.json().catch(() => null)); if (!parsed.success) throw new ApiError(422, 'VALIDATION_ERROR', 'Request tidak valid.', parsed.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }))); return parsed.data }
function id(raw: string) { const parsed = idSchema.safeParse(raw); if (!parsed.success) throw new ApiError(400, 'INVALID_ID', 'ID harus berupa UUID yang valid.'); return parsed.data }
async function requireCipl(db: Database | Transaction, ciplId: string) { const [cipl] = await db.select(ciplFields).from(cipls).where(eq(cipls.id, ciplId)).limit(1); if (!cipl) throw notFound('CIPL'); return cipl }
async function requireDocument(db: Database | Transaction, documentId: string) { const [document] = await db.select({ id: sourceDocuments.id }).from(sourceDocuments).where(eq(sourceDocuments.id, documentId)).limit(1); if (!document) throw notFound('Source Document') }
async function requireActiveParticipation(db: Database | Transaction, participationId: string) { const [participation] = await db.select({ id: eventExhibitors.id, status: eventExhibitors.status }).from(eventExhibitors).where(eq(eventExhibitors.id, participationId)).limit(1); if (!participation) throw notFound('Event Exhibitor'); if (participation.status !== 'ACTIVE') throw new ApiError(409, 'INACTIVE_EVENT_EXHIBITOR', 'Event Exhibitor tidak aktif.') }

function itemValues(versionId: string, items: z.infer<typeof createCiplVersionSchema>['items']) { return items.map((item) => ({ ciplVersionId: versionId, ...item, unitValue: item.unitValue ?? null, currency: item.currency ?? null, grossWeightKg: item.grossWeightKg ?? null, netWeightKg: item.netWeightKg ?? null, countryOfOrigin: item.countryOfOrigin ?? null, intendedUse: item.intendedUse ?? null, intendedDisposal: item.intendedDisposal ?? null })) }

export function registerCiplVersionRoutes(app: Hono, db: Database) {
  app.post('/api/v1/cipls', async (context) => {
    const input = await body(context, createCiplSchema)
    return auditedMutation(context, db, input, 'cipl', 'CREATE', async (tx, meta) => {
      await requireActiveParticipation(tx, input.eventExhibitorId); await requireDocument(tx, input.sourceDocumentId)
      const [cipl] = await tx.insert(cipls).values({ eventExhibitorId: input.eventExhibitorId, referenceNumber: input.referenceNumber ?? null, status: 'RECEIVED' }).returning(ciplFields)
      if (!cipl) throw new ApiError(500, 'INTERNAL_ERROR', 'CIPL tidak dapat dibuat.')
      const [version] = await tx.insert(ciplVersions).values({ ciplId: cipl.id, versionNumber: 1, status: 'DRAFT', sourceDocumentId: input.sourceDocumentId, receivedAt: new Date(input.receivedAt), receivedByActorRef: meta.actorRef, revisionNote: input.revisionNote ?? null }).returning(versionFields)
      if (!version) throw new ApiError(500, 'INTERNAL_ERROR', 'Versi CIPL tidak dapat dibuat.')
      const items = await tx.insert(ciplItems).values(itemValues(version.id, input.items)).returning(itemFields)
      return { entityId: cipl.id, afterData: { ...cipl, versions: [{ ...version, items }] }, body: { data: { ...cipl, versions: [{ ...version, items }] } }, status: 201 }
    })
  })

  app.post('/api/v1/cipls/:ciplId/versions', async (context) => {
    const ciplId = id(context.req.param('ciplId')); const input = await body(context, createCiplVersionSchema)
    return auditedMutation(context, db, input, 'cipl_version', 'CREATE', async (tx, meta) => {
      const cipl = await requireCipl(tx, ciplId); await requireActiveParticipation(tx, cipl.eventExhibitorId); await requireDocument(tx, input.sourceDocumentId)
      const [latest] = await tx.select({ versionNumber: ciplVersions.versionNumber }).from(ciplVersions).where(eq(ciplVersions.ciplId, ciplId)).orderBy(desc(ciplVersions.versionNumber)).limit(1)
      const [version] = await tx.insert(ciplVersions).values({ ciplId, versionNumber: (latest?.versionNumber ?? 0) + 1, status: 'DRAFT', sourceDocumentId: input.sourceDocumentId, receivedAt: new Date(input.receivedAt), receivedByActorRef: meta.actorRef, revisionNote: input.revisionNote ?? null }).returning(versionFields)
      if (!version) throw new ApiError(500, 'INTERNAL_ERROR', 'Versi CIPL tidak dapat dibuat.')
      const items = await tx.insert(ciplItems).values(itemValues(version.id, input.items)).returning(itemFields)
      return { entityId: version.id, afterData: { ...version, items }, body: { data: { ...version, items } }, status: 201 }
    })
  })

  app.post('/api/v1/cipl-versions/:id/ready', async (context) => {
    const versionId = id(context.req.param('id')); const input = await body(context, z.object({}).strict())
    return auditedMutation(context, db, input, 'cipl_version', 'READY', async (tx) => {
      const [version] = await tx.select(versionFields).from(ciplVersions).where(eq(ciplVersions.id, versionId)).limit(1); if (!version) throw notFound('CIPL Version')
      const [itemCount] = await tx.select({ total: count() }).from(ciplItems).where(eq(ciplItems.ciplVersionId, versionId)); if (!itemCount || itemCount.total < 1) throw new ApiError(409, 'CIPL_VERSION_NOT_READY', 'Versi CIPL READY harus memiliki minimal satu item valid.')
      const [ready] = await tx.update(ciplVersions).set({ status: 'READY' }).where(eq(ciplVersions.id, versionId)).returning(versionFields)
      const [cipl] = await tx.update(cipls).set({ activeVersionId: versionId, status: 'READY', updatedAt: new Date() }).where(eq(cipls.id, version.ciplId)).returning(ciplFields)
      if (!ready || !cipl) throw new ApiError(500, 'INTERNAL_ERROR', 'Versi CIPL tidak dapat diaktifkan.')
      return { entityId: ready.id, beforeData: version, afterData: { ...ready, cipl }, body: { data: { ...ready, cipl } }, status: 200 }
    })
  })

  app.get('/api/v1/cipls/:id', async (context) => {
    const cipl = await requireCipl(db, id(context.req.param('id')))
    const versions = await db.select(versionFields).from(ciplVersions).where(eq(ciplVersions.ciplId, cipl.id)).orderBy(asc(ciplVersions.versionNumber))
    const data = await Promise.all(versions.map(async (version) => ({ ...version, items: await db.select(itemFields).from(ciplItems).where(eq(ciplItems.ciplVersionId, version.id)).orderBy(asc(ciplItems.lineNumber)) })))
    return context.json({ data: { ...cipl, versions: data } })
  })
}
