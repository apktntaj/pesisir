import { eq, inArray, sql } from 'drizzle-orm'
import type { Context, Hono } from 'hono'
import type { ZodType } from 'zod'
import { ciplItems, ciplVersions, shipmentAllocations, shipments, sourceDocuments } from '../db/schema'
import type { Database } from '../db/client'
import { createShipmentSchema } from './schemas'
import { ApiError, notFound } from '../shared/errors'
import { auditedMutation } from '../shared/mutations'

async function body<T>(context: Context, schema: ZodType<T>): Promise<T> { const parsed = schema.safeParse(await context.req.json().catch(() => null)); if (!parsed.success) throw new ApiError(422, 'VALIDATION_ERROR', 'Request tidak valid.', parsed.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }))); return parsed.data }
export function registerShipmentRoutes(app: Hono, db: Database) {
  app.post('/api/v1/shipments', async (context) => {
    const input = await body(context, createShipmentSchema)
    return auditedMutation(context, db, input, 'shipment', 'CREATE', async (tx) => {
      const [version] = await tx.select().from(ciplVersions).where(eq(ciplVersions.id, input.ciplVersionId)).limit(1)
      if (!version) throw notFound('CIPL Version')
      await tx.execute(sql`select id from cipl_items where ${inArray(ciplItems.id, input.allocations.map((allocation) => allocation.ciplItemId))} for update`)
      if (version.status !== 'READY') throw new ApiError(409, 'CIPL_VERSION_NOT_READY', 'Shipment harus memakai versi CIPL READY.')
      const [document] = await tx.select({ id: sourceDocuments.id }).from(sourceDocuments).where(eq(sourceDocuments.id, input.sourceDocumentId)).limit(1)
      if (!document) throw notFound('Source Document')
      const items = await tx.select().from(ciplItems).where(inArray(ciplItems.id, input.allocations.map((x) => x.ciplItemId)))
      if (items.length !== input.allocations.length || items.some((x) => x.ciplVersionId !== version.id)) throw new ApiError(422, 'INVALID_ALLOCATION_ITEM', 'Item harus berasal dari versi CIPL sumber.')
      for (const allocation of input.allocations) {
        const item = items.find((x) => x.id === allocation.ciplItemId)!; if (item.unit !== allocation.unit) throw new ApiError(422, 'INVALID_ALLOCATION_UNIT', 'Unit alokasi harus sama dengan unit CIPL.')
        const [used] = await tx.select({ total: sql<number>`coalesce(sum(${shipmentAllocations.quantity}), 0)` }).from(shipmentAllocations).where(eq(shipmentAllocations.ciplItemId, item.id))
        if ((used?.total ?? 0) + allocation.quantity > item.quantity) throw new ApiError(409, 'CIPL_ALLOCATION_EXCEEDED', 'Total alokasi melebihi quantity CIPL.')
      }
      const [shipment] = await tx.insert(shipments).values({ ...input, shipmentMode: input.shipmentMode ?? null, shipper: input.shipper ?? null, consignee: input.consignee ?? null, notifyParty: input.notifyParty ?? null, carrier: input.carrier ?? null, etaOrEtd: input.etaOrEtd ? new Date(input.etaOrEtd) : null, origin: input.origin ?? null, destination: input.destination ?? null, legacyReference: input.legacyReference ?? null, status: 'DOCUMENT_RECEIVED' }).returning()
      if (!shipment) throw new ApiError(500, 'INTERNAL_ERROR', 'Shipment tidak dapat dibuat.')
      const allocations = await tx.insert(shipmentAllocations).values(input.allocations.map((x) => ({ shipmentId: shipment.id, ...x }))).returning()
      return { entityId: shipment.id, afterData: { ...shipment, allocations }, body: { data: { ...shipment, allocations } }, status: 201 }
    })
  })
}
