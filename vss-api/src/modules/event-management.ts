import { and, asc, count, eq, ilike, isNull } from 'drizzle-orm'
import type { Hono } from 'hono'
import type { Context } from 'hono'
import type { ZodType } from 'zod'
import type { Database } from '../db/client'
import {
  agentContacts, agents, contacts, eventExhibitorLifecycleEvents, eventExhibitors, eventLifecycleEvents,
  events, exhibitorContacts, exhibitors,
} from '../db/schema'
import {
  archiveSchema, createAgentSchema, createContactSchema, createEventExhibitorSchema, createExhibitorSchema,
  reasonSchema, updateAgentSchema, updateEventExhibitorSchema, updateExhibitorSchema,
} from './schemas'
import { ApiError, notFound } from '../shared/errors'
import { auditedMutation, type Transaction } from '../shared/mutations'
import { idSchema, paginationSchema } from '../shared/responses'

async function body<T>(context: Context, schema: ZodType<T>): Promise<T> {
  const parsed = schema.safeParse(await context.req.json().catch(() => null))
  if (!parsed.success) throw new ApiError(422, 'VALIDATION_ERROR', 'Request tidak valid.', parsed.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })))
  return parsed.data
}

function id(raw: string) {
  const parsed = idSchema.safeParse(raw)
  if (!parsed.success) throw new ApiError(400, 'INVALID_ID', 'ID harus berupa UUID yang valid.')
  return parsed.data
}

function pagination(context: Context) {
  const parsed = paginationSchema.safeParse({ limit: context.req.query('limit'), offset: context.req.query('offset') })
  if (!parsed.success) throw new ApiError(400, 'INVALID_PAGINATION', 'Parameter pagination tidak valid.')
  return parsed.data
}

async function exhibitor(transaction: Database | Transaction, exhibitorId: string) {
  const [item] = await transaction.select().from(exhibitors).where(eq(exhibitors.id, exhibitorId)).limit(1)
  if (!item) throw notFound('Exhibitor')
  return item
}

async function agent(transaction: Database | Transaction, agentId: string) {
  const [item] = await transaction.select().from(agents).where(eq(agents.id, agentId)).limit(1)
  if (!item) throw notFound('Agent')
  return item
}

async function event(transaction: Database | Transaction, eventId: string) {
  const [item] = await transaction.select().from(events).where(eq(events.id, eventId)).limit(1)
  if (!item) throw notFound('Event')
  return item
}

async function participation(transaction: Database | Transaction, participationId: string) {
  const [item] = await transaction.select().from(eventExhibitors).where(eq(eventExhibitors.id, participationId)).limit(1)
  if (!item) throw notFound('Event Exhibitor')
  return item
}

function validateAssignment(owner: Awaited<ReturnType<typeof exhibitor>>, coordinator: Awaited<ReturnType<typeof agent>> | null, newExhibitorReference = true, newAgentReference = true) {
  if (newExhibitorReference && owner.archivedAt) throw new ApiError(409, 'ARCHIVED_EXHIBITOR', 'Exhibitor yang diarsipkan tidak dapat digunakan.')
  if (owner.kind === 'LOCAL' && coordinator) throw new ApiError(422, 'LOCAL_EXHIBITOR_AGENT_FORBIDDEN', 'Exhibitor lokal tidak boleh memiliki agent.')
  if (newAgentReference && coordinator?.archivedAt) throw new ApiError(409, 'ARCHIVED_AGENT', 'Agent yang diarsipkan tidak dapat digunakan.')
}

export function registerEventManagementRoutes(app: Hono, db: Database) {
  app.get('/api/v1/exhibitors', async (context) => {
    const { limit, offset } = pagination(context)
    const includeArchived = context.req.query('includeArchived') === 'true'
    const search = context.req.query('search')?.trim()
    const rawKind = context.req.query('kind')
    const kind = rawKind === 'LOCAL' || rawKind === 'INTERNATIONAL' ? rawKind : undefined
    if (rawKind && !kind) throw new ApiError(400, 'INVALID_QUERY', 'kind harus LOCAL atau INTERNATIONAL.')
    const filters = [!includeArchived ? isNull(exhibitors.archivedAt) : undefined, search ? ilike(exhibitors.legalName, `%${search}%`) : undefined, kind ? eq(exhibitors.kind, kind) : undefined].filter(Boolean)
    const where = filters.length ? and(...filters as Parameters<typeof and>) : undefined
    const [items, totals] = await Promise.all([
      db.select().from(exhibitors).where(where).orderBy(asc(exhibitors.legalName)).limit(limit).offset(offset),
      db.select({ total: count() }).from(exhibitors).where(where),
    ])
    return context.json({ data: items, meta: { limit, offset, total: totals[0]?.total ?? 0 } })
  })

  app.post('/api/v1/exhibitors', async (context) => {
    const input = await body(context, createExhibitorSchema)
    return auditedMutation(context, db, input, 'exhibitor', 'CREATE', async (transaction) => {
      const [item] = await transaction.insert(exhibitors).values(input).returning()
      if (!item) throw new ApiError(500, 'INTERNAL_ERROR', 'Exhibitor tidak dapat dibuat.')
      return { entityId: item.id, afterData: item, body: { data: item }, status: 201 }
    })
  })

  app.get('/api/v1/exhibitors/:id', async (context) => {
    const item = await exhibitor(db, id(context.req.param('id')))
    const linkedContacts = await db.select({ contact: contacts, isPrimary: exhibitorContacts.isPrimary }).from(exhibitorContacts)
      .innerJoin(contacts, eq(exhibitorContacts.contactId, contacts.id)).where(eq(exhibitorContacts.exhibitorId, item.id)).orderBy(asc(contacts.name))
    return context.json({ data: { ...item, contacts: linkedContacts.map(({ contact, isPrimary }) => ({ ...contact, isPrimary })) } })
  })

  app.patch('/api/v1/exhibitors/:id', async (context) => {
    const exhibitorId = id(context.req.param('id'))
    const input = await body(context, updateExhibitorSchema)
    return auditedMutation(context, db, input, 'exhibitor', 'UPDATE', async (transaction) => {
      const existing = await exhibitor(transaction, exhibitorId)
      const kind = input.kind ?? existing.kind
      const npwp = input.npwp === undefined ? existing.npwp : input.npwp
      let countryCode = input.countryCode === undefined ? existing.countryCode : input.countryCode
      if (kind === 'LOCAL') {
        const assignments = await transaction.select({ agentId: eventExhibitors.agentId }).from(eventExhibitors).where(eq(eventExhibitors.exhibitorId, exhibitorId))
        if (assignments.some((assignment) => assignment.agentId)) throw new ApiError(422, 'LOCAL_EXHIBITOR_AGENT_FORBIDDEN', 'Hapus agent dari seluruh partisipasi sebelum mengubah exhibitor menjadi lokal.')
        countryCode = 'ID'
      } else {
        if (npwp) throw new ApiError(422, 'INTERNATIONAL_NPWP_FORBIDDEN', 'Exhibitor internasional tidak boleh memiliki NPWP Indonesia.')
        if (countryCode === 'ID') throw new ApiError(422, 'INTERNATIONAL_COUNTRY_INVALID', 'Exhibitor internasional tidak boleh memakai kode negara ID.')
      }
      const [item] = await transaction.update(exhibitors).set({ ...input, countryCode, npwp: kind === 'INTERNATIONAL' ? null : npwp, updatedAt: new Date() }).where(eq(exhibitors.id, exhibitorId)).returning()
      if (!item) throw notFound('Exhibitor')
      return { entityId: item.id, beforeData: existing, afterData: item, body: { data: item }, status: 200 }
    })
  })

  app.post('/api/v1/exhibitors/:id/archive', async (context) => {
    const exhibitorId = id(context.req.param('id'))
    const input = await body(context, archiveSchema)
    return auditedMutation(context, db, input, 'exhibitor', 'ARCHIVE', async (transaction, meta) => {
      const existing = await exhibitor(transaction, exhibitorId)
      const [item] = await transaction.update(exhibitors).set({ archivedAt: new Date(), archivedByActorRef: meta.actorRef, archiveReason: input.reason, updatedAt: new Date() }).where(eq(exhibitors.id, exhibitorId)).returning()
      if (!item) throw notFound('Exhibitor')
      return { entityId: item.id, beforeData: existing, afterData: item, body: { data: item }, status: 200 }
    })
  })

  app.post('/api/v1/exhibitors/:id/contacts', async (context) => {
    const exhibitorId = id(context.req.param('id'))
    const input = await body(context, createContactSchema)
    return auditedMutation(context, db, input, 'contact', 'CREATE', async (transaction) => {
      await exhibitor(transaction, exhibitorId)
      if (input.isPrimary) await transaction.update(exhibitorContacts).set({ isPrimary: false }).where(eq(exhibitorContacts.exhibitorId, exhibitorId))
      const { isPrimary, ...contactInput } = input
      const [item] = await transaction.insert(contacts).values(contactInput).returning()
      if (!item) throw new ApiError(500, 'INTERNAL_ERROR', 'Contact tidak dapat dibuat.')
      await transaction.insert(exhibitorContacts).values({ exhibitorId, contactId: item.id, isPrimary })
      return { entityId: item.id, afterData: item, body: { data: { ...item, isPrimary } }, status: 201 }
    })
  })

  app.get('/api/v1/agents', async (context) => {
    const { limit, offset } = pagination(context)
    const includeArchived = context.req.query('includeArchived') === 'true'
    const search = context.req.query('search')?.trim()
    const filters = [!includeArchived ? isNull(agents.archivedAt) : undefined, search ? ilike(agents.name, `%${search}%`) : undefined].filter(Boolean)
    const where = filters.length ? and(...filters as Parameters<typeof and>) : undefined
    const [items, totals] = await Promise.all([
      db.select().from(agents).where(where).orderBy(asc(agents.name)).limit(limit).offset(offset), db.select({ total: count() }).from(agents).where(where),
    ])
    return context.json({ data: items, meta: { limit, offset, total: totals[0]?.total ?? 0 } })
  })

  app.post('/api/v1/agents', async (context) => {
    const input = await body(context, createAgentSchema)
    return auditedMutation(context, db, input, 'agent', 'CREATE', async (transaction) => {
      const [item] = await transaction.insert(agents).values(input).returning()
      if (!item) throw new ApiError(500, 'INTERNAL_ERROR', 'Agent tidak dapat dibuat.')
      return { entityId: item.id, afterData: item, body: { data: item }, status: 201 }
    })
  })

  app.get('/api/v1/agents/:id', async (context) => {
    const item = await agent(db, id(context.req.param('id')))
    const linkedContacts = await db.select({ contact: contacts, isPrimary: agentContacts.isPrimary }).from(agentContacts)
      .innerJoin(contacts, eq(agentContacts.contactId, contacts.id)).where(eq(agentContacts.agentId, item.id)).orderBy(asc(contacts.name))
    return context.json({ data: { ...item, contacts: linkedContacts.map(({ contact, isPrimary }) => ({ ...contact, isPrimary })) } })
  })

  app.patch('/api/v1/agents/:id', async (context) => {
    const agentId = id(context.req.param('id'))
    const input = await body(context, updateAgentSchema)
    return auditedMutation(context, db, input, 'agent', 'UPDATE', async (transaction) => {
      const existing = await agent(transaction, agentId)
      const [item] = await transaction.update(agents).set({ ...input, updatedAt: new Date() }).where(eq(agents.id, agentId)).returning()
      if (!item) throw notFound('Agent')
      return { entityId: item.id, beforeData: existing, afterData: item, body: { data: item }, status: 200 }
    })
  })

  app.post('/api/v1/agents/:id/archive', async (context) => {
    const agentId = id(context.req.param('id'))
    const input = await body(context, archiveSchema)
    return auditedMutation(context, db, input, 'agent', 'ARCHIVE', async (transaction, meta) => {
      const existing = await agent(transaction, agentId)
      const [item] = await transaction.update(agents).set({ archivedAt: new Date(), archivedByActorRef: meta.actorRef, archiveReason: input.reason, updatedAt: new Date() }).where(eq(agents.id, agentId)).returning()
      if (!item) throw notFound('Agent')
      return { entityId: item.id, beforeData: existing, afterData: item, body: { data: item }, status: 200 }
    })
  })

  app.post('/api/v1/agents/:id/contacts', async (context) => {
    const agentId = id(context.req.param('id'))
    const input = await body(context, createContactSchema)
    return auditedMutation(context, db, input, 'contact', 'CREATE', async (transaction) => {
      await agent(transaction, agentId)
      if (input.isPrimary) await transaction.update(agentContacts).set({ isPrimary: false }).where(eq(agentContacts.agentId, agentId))
      const { isPrimary, ...contactInput } = input
      const [item] = await transaction.insert(contacts).values(contactInput).returning()
      if (!item) throw new ApiError(500, 'INTERNAL_ERROR', 'Contact tidak dapat dibuat.')
      await transaction.insert(agentContacts).values({ agentId, contactId: item.id, isPrimary })
      return { entityId: item.id, afterData: item, body: { data: { ...item, isPrimary } }, status: 201 }
    })
  })

  app.get('/api/v1/events/:eventId/exhibitors', async (context) => {
    const eventId = id(context.req.param('eventId'))
    await event(db, eventId)
    const rows = await db.select({ participation: eventExhibitors, exhibitor: exhibitors, agent: agents, primaryContact: contacts })
      .from(eventExhibitors).innerJoin(exhibitors, eq(eventExhibitors.exhibitorId, exhibitors.id))
      .leftJoin(agents, eq(eventExhibitors.agentId, agents.id)).leftJoin(contacts, eq(eventExhibitors.primaryContactId, contacts.id))
      .where(eq(eventExhibitors.eventId, eventId)).orderBy(asc(exhibitors.legalName))
    return context.json({ data: rows.map((row) => ({ ...row.participation, exhibitor: row.exhibitor, agent: row.agent, primaryContact: row.primaryContact })) })
  })

  app.post('/api/v1/events/:eventId/exhibitors', async (context) => {
    const eventId = id(context.req.param('eventId'))
    const input = await body(context, createEventExhibitorSchema)
    return auditedMutation(context, db, input, 'event_exhibitor', 'CREATE', async (transaction) => {
      const parent = await event(transaction, eventId)
      if (parent.status === 'CANCELLED') throw new ApiError(409, 'CANCELLED_EVENT', 'Event yang dibatalkan tidak dapat menerima exhibitor.')
      const owner = await exhibitor(transaction, input.exhibitorId)
      const coordinator = input.agentId ? await agent(transaction, input.agentId) : null
      validateAssignment(owner, coordinator)
      if (input.primaryContactId) {
        const [owned] = await transaction.select().from(exhibitorContacts).where(and(eq(exhibitorContacts.exhibitorId, owner.id), eq(exhibitorContacts.contactId, input.primaryContactId))).limit(1)
        if (!owned) throw new ApiError(422, 'INVALID_PRIMARY_CONTACT', 'Primary contact harus dimiliki exhibitor.')
      }
      const [item] = await transaction.insert(eventExhibitors).values({ eventId, ...input }).returning()
      if (!item) throw new ApiError(500, 'INTERNAL_ERROR', 'Partisipasi exhibitor tidak dapat dibuat.')
      return { entityId: item.id, afterData: item, body: { data: item }, status: 201 }
    })
  })

  app.get('/api/v1/event-exhibitors/:id', async (context) => {
    const participationId = id(context.req.param('id'))
    const [row] = await db.select({ participation: eventExhibitors, exhibitor: exhibitors, agent: agents, event: events, primaryContact: contacts })
      .from(eventExhibitors).innerJoin(exhibitors, eq(eventExhibitors.exhibitorId, exhibitors.id)).innerJoin(events, eq(eventExhibitors.eventId, events.id))
      .leftJoin(agents, eq(eventExhibitors.agentId, agents.id)).leftJoin(contacts, eq(eventExhibitors.primaryContactId, contacts.id))
      .where(eq(eventExhibitors.id, participationId)).limit(1)
    if (!row) throw notFound('Event Exhibitor')
    return context.json({ data: { ...row.participation, exhibitor: row.exhibitor, agent: row.agent, event: row.event, primaryContact: row.primaryContact } })
  })

  app.patch('/api/v1/event-exhibitors/:id', async (context) => {
    const participationId = id(context.req.param('id'))
    const input = await body(context, updateEventExhibitorSchema)
    return auditedMutation(context, db, input, 'event_exhibitor', 'UPDATE', async (transaction) => {
      const existing = await participation(transaction, participationId)
      if (existing.status === 'WITHDRAWN') throw new ApiError(409, 'PARTICIPATION_WITHDRAWN', 'Aktifkan kembali partisipasi sebelum mengubahnya.')
      const parent = await event(transaction, existing.eventId)
      if (parent.status === 'CANCELLED') throw new ApiError(409, 'CANCELLED_EVENT', 'Event yang dibatalkan tidak dapat diubah partisipasinya.')
      const owner = await exhibitor(transaction, existing.exhibitorId)
      const nextAgentId = input.agentId === undefined ? existing.agentId : input.agentId
      validateAssignment(owner, nextAgentId ? await agent(transaction, nextAgentId) : null, false, nextAgentId !== existing.agentId)
      if (input.primaryContactId) {
        const [owned] = await transaction.select().from(exhibitorContacts).where(and(eq(exhibitorContacts.exhibitorId, owner.id), eq(exhibitorContacts.contactId, input.primaryContactId))).limit(1)
        if (!owned) throw new ApiError(422, 'INVALID_PRIMARY_CONTACT', 'Primary contact harus dimiliki exhibitor.')
      }
      const [item] = await transaction.update(eventExhibitors).set({ ...input, updatedAt: new Date() }).where(eq(eventExhibitors.id, participationId)).returning()
      if (!item) throw notFound('Event Exhibitor')
      return { entityId: item.id, beforeData: existing, afterData: item, body: { data: item }, status: 200 }
    })
  })

  const lifecycle = (path: string, fromStatus: 'ACTIVE' | 'WITHDRAWN', toStatus: 'ACTIVE' | 'WITHDRAWN', action: string) => {
    app.post(path, async (context) => {
      const participationId = id(context.req.param('id')!)
      const input = await body(context, reasonSchema)
      return auditedMutation(context, db, input, 'event_exhibitor', action, async (transaction, meta) => {
        const existing = await participation(transaction, participationId)
        if (existing.status !== fromStatus) throw new ApiError(409, 'INVALID_LIFECYCLE_TRANSITION', `Status partisipasi harus ${fromStatus}.`)
        const parent = await event(transaction, existing.eventId)
        if (toStatus === 'ACTIVE' && parent.status === 'CANCELLED') throw new ApiError(409, 'CANCELLED_EVENT', 'Event harus diaktifkan kembali terlebih dahulu.')
        const [item] = await transaction.update(eventExhibitors).set({ status: toStatus, updatedAt: new Date() }).where(eq(eventExhibitors.id, participationId)).returning()
        if (!item) throw notFound('Event Exhibitor')
        await transaction.insert(eventExhibitorLifecycleEvents).values({ eventExhibitorId: participationId, fromStatus, toStatus, reason: input.reason, actorRef: meta.actorRef, sourceMessageId: meta.sourceMessageId })
        return { entityId: item.id, beforeData: existing, afterData: item, body: { data: item }, status: 200 }
      })
    })
  }
  lifecycle('/api/v1/event-exhibitors/:id/withdraw', 'ACTIVE', 'WITHDRAWN', 'WITHDRAW')
  lifecycle('/api/v1/event-exhibitors/:id/reactivate', 'WITHDRAWN', 'ACTIVE', 'REACTIVATE')

  const eventLifecycle = (path: string, fromStatus: 'ACTIVE' | 'CANCELLED', toStatus: 'ACTIVE' | 'CANCELLED', action: string) => {
    app.post(path, async (context) => {
      const eventId = id(context.req.param('id')!)
      const input = await body(context, reasonSchema)
      return auditedMutation(context, db, input, 'event', action, async (transaction, meta) => {
        const existing = await event(transaction, eventId)
        if (existing.status !== fromStatus) throw new ApiError(409, 'INVALID_LIFECYCLE_TRANSITION', `Status event harus ${fromStatus}.`)
        const [item] = await transaction.update(events).set({ status: toStatus, updatedAt: new Date() }).where(eq(events.id, eventId)).returning()
        if (!item) throw notFound('Event')
        await transaction.insert(eventLifecycleEvents).values({ eventId, fromStatus, toStatus, reason: input.reason, actorRef: meta.actorRef, sourceMessageId: meta.sourceMessageId })
        return { entityId: item.id, beforeData: existing, afterData: item, body: { data: item }, status: 200 }
      })
    })
  }
  eventLifecycle('/api/v1/events/:id/cancel', 'ACTIVE', 'CANCELLED', 'CANCEL')
  eventLifecycle('/api/v1/events/:id/reactivate', 'CANCELLED', 'ACTIVE', 'REACTIVATE')

}
