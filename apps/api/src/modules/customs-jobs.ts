import { asc, eq, inArray, sql } from 'drizzle-orm'
import type { Context, Hono } from 'hono'
import type { ZodType } from 'zod'
import { customsJobAllocations, customsJobTransitions, customsJobs, shipmentAllocations, shipments } from '../db/schema'
import type { Database } from '../db/client'
import { createCustomsJobSchema, resumeCustomsJobSchema, transitionCustomsJobSchema, type CustomsJobStatus } from './schemas'
import { ApiError, notFound } from '../shared/errors'
import { auditedMutation } from '../shared/mutations'

// ── Normal lifecycle: next allowed status per current status ──────────────────
const NEXT_STATUS: Partial<Record<CustomsJobStatus, CustomsJobStatus>> = {
  DRAFT: 'PREPARING',
  PREPARING: 'SUBMITTED',
  SUBMITTED: 'REGISTERED',
  REGISTERED: 'RELEASED',
  RELEASED: 'COMPLETED',
}

// Statuses that allow backward/non-linear transitions with reason+evidence
const RESUMABLE_FROM: CustomsJobStatus[] = ['ON_HOLD']

async function body<T>(context: Context, schema: ZodType<T>): Promise<T> {
  const parsed = schema.safeParse(await context.req.json().catch(() => null))
  if (!parsed.success) throw new ApiError(422, 'VALIDATION_ERROR', 'Request tidak valid.', parsed.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })))
  return parsed.data
}

export function registerCustomsJobRoutes(app: Hono, db: Database) {

  // ── GET /api/v1/customs-jobs ──────────────────────────────────────────────
  app.get('/api/v1/customs-jobs', async (context) => {
    const shipmentId = context.req.query('shipmentId')
    const rows = shipmentId
      ? await db.select().from(customsJobs).where(eq(customsJobs.shipmentId, shipmentId)).orderBy(asc(customsJobs.createdAt))
      : await db.select().from(customsJobs).orderBy(asc(customsJobs.createdAt))
    return context.json({ data: rows })
  })

  // ── GET /api/v1/customs-jobs/:id ─────────────────────────────────────────
  app.get('/api/v1/customs-jobs/:id', async (context) => {
    const id = context.req.param('id')
    const [job] = await db.select().from(customsJobs).where(eq(customsJobs.id, id)).limit(1)
    if (!job) throw notFound('Customs Job')
    const [allocations, transitions] = await Promise.all([
      db.select().from(customsJobAllocations).where(eq(customsJobAllocations.customsJobId, id)),
      db.select().from(customsJobTransitions).where(eq(customsJobTransitions.customsJobId, id)).orderBy(asc(customsJobTransitions.occurredAt)),
    ])
    return context.json({ data: { ...job, allocations, transitions } })
  })

  // ── POST /api/v1/customs-jobs ─────────────────────────────────────────────
  app.post('/api/v1/customs-jobs', async (context) => {
    const input = await body(context, createCustomsJobSchema)
    return auditedMutation(context, db, input, 'customs_job', 'CREATE', async (tx) => {

      // Verify shipment exists
      const [shipment] = await tx.select().from(shipments).where(eq(shipments.id, input.shipmentId)).limit(1)
      if (!shipment) throw notFound('Shipment')

      // Lock shipment allocations to prevent concurrent over-allocation
      const allocationIds = input.allocations.map((a) => a.shipmentAllocationId)
      const sourceAllocations = await tx
        .select()
        .from(shipmentAllocations)
        .where(inArray(shipmentAllocations.id, allocationIds))
        .for('update')

      // Validate all requested allocations exist and belong to this shipment
      if (sourceAllocations.length !== input.allocations.length) throw new ApiError(422, 'INVALID_ALLOCATION', 'Satu atau lebih shipment allocation tidak ditemukan.')
      if (sourceAllocations.some((sa) => sa.shipmentId !== input.shipmentId)) throw new ApiError(422, 'INVALID_ALLOCATION', 'Semua alokasi harus berasal dari shipment yang sama.')

      // Validate unit and quantity per allocation
      for (const allocation of input.allocations) {
        const source = sourceAllocations.find((sa) => sa.id === allocation.shipmentAllocationId)!
        if (source.unit !== allocation.unit) throw new ApiError(422, 'INVALID_ALLOCATION_UNIT', `Unit alokasi harus sama dengan unit shipment (${source.unit}).`)
        if (allocation.quantity > source.quantity) throw new ApiError(422, 'INVALID_ALLOCATION_QUANTITY', 'Quantity alokasi tidak boleh melebihi quantity shipment allocation.')

        // Check cumulative already allocated across other customs jobs
        const [used] = await tx
          .select({ total: sql<number>`coalesce(sum(${customsJobAllocations.quantity}), 0)` })
          .from(customsJobAllocations)
          .where(eq(customsJobAllocations.shipmentAllocationId, allocation.shipmentAllocationId))
        if ((used?.total ?? 0) + allocation.quantity > source.quantity) throw new ApiError(409, 'ALLOCATION_EXCEEDED', 'Total alokasi melebihi quantity shipment allocation.')
      }

      // Create the job
      const [job] = await tx.insert(customsJobs).values({
        shipmentId: input.shipmentId,
        documentType: input.documentType,
        notes: input.notes ?? null,
        status: 'DRAFT',
      }).returning()
      if (!job) throw new ApiError(500, 'INTERNAL_ERROR', 'Customs Job tidak dapat dibuat.')

      // Record initial transition DRAFT→DRAFT as creation marker
      const actorRef = context.req.header('X-Actor-Ref') ?? 'unknown'
      await tx.insert(customsJobTransitions).values({
        customsJobId: job.id,
        fromStatus: 'DRAFT',
        toStatus: 'DRAFT',
        reason: 'Job dibuat.',
        evidenceSourceDocumentId: null,
        actorRef,
      })

      const allocations = await tx.insert(customsJobAllocations).values(
        input.allocations.map((a) => ({
          customsJobId: job.id,
          shipmentAllocationId: a.shipmentAllocationId,
          quantity: a.quantity,
          unit: a.unit,
        }))
      ).returning()

      return {
        entityId: job.id,
        afterData: { ...job, allocations },
        body: { data: { ...job, allocations } },
        status: 201 as const,
      }
    })
  })

  // ── POST /api/v1/customs-jobs/:id/transitions ─────────────────────────────
  // Handles forward transitions, ON_HOLD, CANCELLED
  app.post('/api/v1/customs-jobs/:id/transitions', async (context) => {
    const id = context.req.param('id')
    const input = await body(context, transitionCustomsJobSchema)
    return auditedMutation(context, db, input, 'customs_job', 'TRANSITION', async (tx) => {
      const [job] = await tx.select().from(customsJobs).where(eq(customsJobs.id, id)).limit(1).for('update')
      if (!job) throw notFound('Customs Job')

      const from = job.status as CustomsJobStatus
      const to = input.toStatus as CustomsJobStatus

      // Cannot transition from terminal states
      if (from === 'COMPLETED' || from === 'CANCELLED') {
        throw new ApiError(409, 'INVALID_TRANSITION', `Job dengan status ${from} tidak dapat ditransisikan.`)
      }

      // ON_HOLD and CANCELLED are allowed from any non-terminal status
      if (to === 'ON_HOLD' || to === 'CANCELLED') {
        // reason is enforced by schema discriminated union
      } else {
        // Forward transition: must be the next step in normal sequence
        const expected = NEXT_STATUS[from]
        if (to !== expected) {
          throw new ApiError(409, 'INVALID_TRANSITION', `Tidak bisa transisi dari ${from} ke ${to}. Transisi normal berikutnya adalah ke ${expected ?? '(tidak ada)'}.`)
        }
      }

      // Validate reason is present when required (schema ensures this for ON_HOLD and CANCELLED)
      const reason = 'reason' in input ? input.reason : null
      const evidenceId = 'evidenceSourceDocumentId' in input ? input.evidenceSourceDocumentId : null

      await tx.update(customsJobs).set({ status: to, updatedAt: new Date() }).where(eq(customsJobs.id, id))
      const actorRef = context.req.header('X-Actor-Ref') ?? 'unknown'
      const [transition] = await tx.insert(customsJobTransitions).values({
        customsJobId: id,
        fromStatus: from,
        toStatus: to,
        reason: reason ?? null,
        evidenceSourceDocumentId: evidenceId ?? null,
        actorRef,
      }).returning()

      return {
        entityId: id,
        beforeData: job,
        afterData: { ...job, status: to },
        body: { data: { ...job, status: to, transition } },
        status: 200 as const,
      }
    })
  })

  // ── POST /api/v1/customs-jobs/:id/resume ──────────────────────────────────
  // Resumes an ON_HOLD job back to PREPARING, requires reason + evidence document
  app.post('/api/v1/customs-jobs/:id/resume', async (context) => {
    const id = context.req.param('id')
    const input = await body(context, resumeCustomsJobSchema)
    return auditedMutation(context, db, input, 'customs_job', 'RESUME', async (tx) => {
      const [job] = await tx.select().from(customsJobs).where(eq(customsJobs.id, id)).limit(1).for('update')
      if (!job) throw notFound('Customs Job')

      const from = job.status as CustomsJobStatus
      if (!RESUMABLE_FROM.includes(from)) {
        throw new ApiError(409, 'INVALID_TRANSITION', `Hanya job dengan status ${RESUMABLE_FROM.join(' atau ')} yang dapat di-resume.`)
      }

      const to: CustomsJobStatus = 'PREPARING'
      await tx.update(customsJobs).set({ status: to, updatedAt: new Date() }).where(eq(customsJobs.id, id))
      const actorRef = context.req.header('X-Actor-Ref') ?? 'unknown'
      const [transition] = await tx.insert(customsJobTransitions).values({
        customsJobId: id,
        fromStatus: from,
        toStatus: to,
        reason: input.reason,
        evidenceSourceDocumentId: input.evidenceSourceDocumentId,
        actorRef,
      }).returning()

      return {
        entityId: id,
        beforeData: job,
        afterData: { ...job, status: to },
        body: { data: { ...job, status: to, transition } },
        status: 200 as const,
      }
    })
  })

  // ── GET /api/v1/customs-jobs/:id/transitions ──────────────────────────────
  app.get('/api/v1/customs-jobs/:id/transitions', async (context) => {
    const id = context.req.param('id')
    const [job] = await db.select({ id: customsJobs.id }).from(customsJobs).where(eq(customsJobs.id, id)).limit(1)
    if (!job) throw notFound('Customs Job')
    const transitions = await db
      .select()
      .from(customsJobTransitions)
      .where(eq(customsJobTransitions.customsJobId, id))
      .orderBy(asc(customsJobTransitions.occurredAt))
    return context.json({ data: transitions })
  })
}
