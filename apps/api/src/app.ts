import { and, asc, count, desc, eq, gte, isNull, lte } from 'drizzle-orm'
import { Hono } from 'hono'
import type { Context } from 'hono'
import type { ZodType } from 'zod'
import type { Sql } from 'postgres'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import type { Database } from './db/client'
import { contacts, eventOrganizerContacts, eventOrganizers, events, venueContacts, venues } from './db/schema'
import {
  archiveSchema,
  createContactSchema,
  createEventOrganizerSchema,
  createEventSchema,
  createVenueSchema,
  updateContactSchema,
  updateEventOrganizerSchema,
  updateEventSchema,
  updateVenueSchema,
} from './modules/schemas'
import { registerEventManagementRoutes } from './modules/event-management'
import { registerSourceLineageRoutes } from './modules/source-lineage'
import { ApiError, notFound } from './shared/errors'
import { auditedMutation, type Transaction } from './shared/mutations'
import { idSchema, paginationSchema } from './shared/responses'

export interface AppDependencies {
  db: Database
  sql: Sql
}

async function parseBody<T>(context: Context, schema: ZodType<T>): Promise<T> {
  const json = await context.req.json().catch(() => null)
  const parsed = schema.safeParse(json)
  if (!parsed.success) {
    throw new ApiError(422, 'VALIDATION_ERROR', 'Request tidak valid.', parsed.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    })))
  }
  return parsed.data
}

function parseId(rawId: string): string {
  const parsed = idSchema.safeParse(rawId)
  if (!parsed.success) throw new ApiError(400, 'INVALID_ID', 'ID harus berupa UUID yang valid.')
  return parsed.data
}

function parsePagination(context: Context) {
  const parsed = paginationSchema.safeParse({
    limit: context.req.query('limit'),
    offset: context.req.query('offset'),
  })
  if (!parsed.success) throw new ApiError(400, 'INVALID_PAGINATION', 'Parameter pagination tidak valid.')
  return parsed.data
}

function parseOptionalUuid(value: string | undefined, field: string): string | undefined {
  if (!value) return undefined
  const parsed = idSchema.safeParse(value)
  if (!parsed.success) throw new ApiError(400, 'INVALID_QUERY', `${field} harus berupa UUID yang valid.`)
  return parsed.data
}

async function ensureEventOrganizer(db: Database | Transaction, id: string) {
  const [organizer] = await db.select().from(eventOrganizers).where(eq(eventOrganizers.id, id)).limit(1)
  if (!organizer) throw notFound('Event Organizer')
  return organizer
}

async function ensureVenue(db: Database | Transaction, id: string) {
  const [venue] = await db.select().from(venues).where(eq(venues.id, id)).limit(1)
  if (!venue) throw notFound('Venue')
  return venue
}

async function ensureContact(db: Database | Transaction, id: string) {
  const [contact] = await db.select().from(contacts).where(eq(contacts.id, id)).limit(1)
  if (!contact) throw notFound('Contact')
  return contact
}

export function createApp({ db, sql }: AppDependencies) {
  const app = new Hono()

  app.onError((error, context) => {
    if (error instanceof ApiError) {
      return context.json({ error: { code: error.code, message: error.message, details: error.details } }, error.status as ContentfulStatusCode)
    }
    const databaseMessage = error instanceof Error && error.cause instanceof Error ? error.cause.message : error instanceof Error ? error.message : ''
    if (databaseMessage.includes('LOCAL_EXHIBITOR_AGENT_FORBIDDEN')) return context.json({ error: { code: 'LOCAL_EXHIBITOR_AGENT_FORBIDDEN', message: 'Exhibitor lokal tidak boleh memiliki agent.' } }, 422)
    if (databaseMessage.includes('event_exhibitors_event_exhibitor_unique') || databaseMessage.includes('event_exhibitors_event_id_exhibitor_id_key')) {
      return context.json({ error: { code: 'DUPLICATE_PARTICIPATION', message: 'Exhibitor sudah terdaftar pada event ini.' } }, 409)
    }
    console.error(error)
    return context.json({ error: { code: 'INTERNAL_ERROR', message: 'Terjadi kesalahan internal.' } }, 500)
  })

  app.get('/health', async (context) => {
    try {
      await sql`select 1`
      return context.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() })
    } catch {
      return context.json({ status: 'degraded', database: 'unavailable', timestamp: new Date().toISOString() }, 503)
    }
  })

  app.get('/api/v1/event-organizers', async (context) => {
    const { limit, offset } = parsePagination(context)
    const where = context.req.query('includeArchived') === 'true' ? undefined : isNull(eventOrganizers.archivedAt)
    const [items, totalResult] = await Promise.all([
      db.select().from(eventOrganizers).where(where).orderBy(asc(eventOrganizers.name)).limit(limit).offset(offset),
      db.select({ total: count() }).from(eventOrganizers).where(where),
    ])
    return context.json({ data: items, meta: { limit, offset, total: totalResult[0]?.total ?? 0 } })
  })

  app.post('/api/v1/event-organizers', async (context) => {
    const input = await parseBody(context, createEventOrganizerSchema)
    return auditedMutation(context, db, input, 'event_organizer', 'CREATE', async (transaction) => {
      const [item] = await transaction.insert(eventOrganizers).values(input).returning()
      if (!item) throw new ApiError(500, 'INTERNAL_ERROR', 'Event Organizer tidak dapat dibuat.')
      return { entityId: item.id, afterData: item, body: { data: item }, status: 201 }
    })
  })

  app.get('/api/v1/event-organizers/:id', async (context) => {
    const id = parseId(context.req.param('id'))
    const organizer = await ensureEventOrganizer(db, id)
    const linkedContacts = await db.select({ id: contacts.id, name: contacts.name, legacyContact: contacts.legacyContact, role: contacts.role, email: contacts.email, phone: contacts.phone, createdAt: contacts.createdAt, updatedAt: contacts.updatedAt })
      .from(eventOrganizerContacts).innerJoin(contacts, eq(eventOrganizerContacts.contactId, contacts.id))
      .where(eq(eventOrganizerContacts.eventOrganizerId, id)).orderBy(asc(contacts.name))
    return context.json({ data: { ...organizer, contacts: linkedContacts } })
  })

  app.patch('/api/v1/event-organizers/:id', async (context) => {
    const id = parseId(context.req.param('id'))
    const input = await parseBody(context, updateEventOrganizerSchema)
    return auditedMutation(context, db, input, 'event_organizer', 'UPDATE', async (transaction) => {
      const existing = await ensureEventOrganizer(transaction, id)
      const [item] = await transaction.update(eventOrganizers).set({ ...input, updatedAt: new Date() }).where(eq(eventOrganizers.id, id)).returning()
      if (!item) throw notFound('Event Organizer')
      return { entityId: item.id, beforeData: existing, afterData: item, body: { data: item }, status: 200 }
    })
  })

  app.delete('/api/v1/event-organizers/:id', async (context) => {
    parseId(context.req.param('id'))
    throw new ApiError(405, 'ARCHIVE_REQUIRED', 'Gunakan endpoint archive agar riwayat tetap terjaga.')
  })

  app.post('/api/v1/event-organizers/:id/archive', async (context) => {
    const id = parseId(context.req.param('id'))
    const input = await parseBody(context, archiveSchema)
    return auditedMutation(context, db, input, 'event_organizer', 'ARCHIVE', async (transaction, meta) => {
      const existing = await ensureEventOrganizer(transaction, id)
      const [item] = await transaction.update(eventOrganizers).set({ archivedAt: new Date(), archivedByActorRef: meta.actorRef, archiveReason: input.reason, updatedAt: new Date() }).where(eq(eventOrganizers.id, id)).returning()
      if (!item) throw notFound('Event Organizer')
      return { entityId: item.id, beforeData: existing, afterData: item, body: { data: item }, status: 200 }
    })
  })

  app.post('/api/v1/event-organizers/:id/contacts', async (context) => {
    const organizerId = parseId(context.req.param('id'))
    const input = await parseBody(context, createContactSchema)
    return auditedMutation(context, db, input, 'contact', 'CREATE', async (transaction) => {
      await ensureEventOrganizer(transaction, organizerId)
      if (input.isPrimary) await transaction.update(eventOrganizerContacts).set({ isPrimary: false }).where(eq(eventOrganizerContacts.eventOrganizerId, organizerId))
      const { isPrimary, ...contactInput } = input
      const [contact] = await transaction.insert(contacts).values(contactInput).returning()
      if (!contact) throw new ApiError(500, 'INTERNAL_ERROR', 'Contact tidak dapat dibuat.')
      await transaction.insert(eventOrganizerContacts).values({ eventOrganizerId: organizerId, contactId: contact.id, isPrimary })
      return { entityId: contact.id, afterData: contact, body: { data: { ...contact, isPrimary } }, status: 201 }
    })
  })

  app.get('/api/v1/venues', async (context) => {
    const { limit, offset } = parsePagination(context)
    const where = context.req.query('includeArchived') === 'true' ? undefined : isNull(venues.archivedAt)
    const [items, totalResult] = await Promise.all([
      db.select().from(venues).where(where).orderBy(asc(venues.name)).limit(limit).offset(offset),
      db.select({ total: count() }).from(venues).where(where),
    ])
    return context.json({ data: items, meta: { limit, offset, total: totalResult[0]?.total ?? 0 } })
  })

  app.post('/api/v1/venues', async (context) => {
    const input = await parseBody(context, createVenueSchema)
    return auditedMutation(context, db, input, 'venue', 'CREATE', async (transaction) => {
      const [item] = await transaction.insert(venues).values(input).returning()
      if (!item) throw new ApiError(500, 'INTERNAL_ERROR', 'Venue tidak dapat dibuat.')
      return { entityId: item.id, afterData: item, body: { data: item }, status: 201 }
    })
  })

  app.get('/api/v1/venues/:id', async (context) => {
    const id = parseId(context.req.param('id'))
    const venue = await ensureVenue(db, id)
    const linkedContacts = await db.select({ id: contacts.id, name: contacts.name, legacyContact: contacts.legacyContact, role: contacts.role, email: contacts.email, phone: contacts.phone, createdAt: contacts.createdAt, updatedAt: contacts.updatedAt })
      .from(venueContacts).innerJoin(contacts, eq(venueContacts.contactId, contacts.id))
      .where(eq(venueContacts.venueId, id)).orderBy(asc(contacts.name))
    return context.json({ data: { ...venue, contacts: linkedContacts } })
  })

  app.patch('/api/v1/venues/:id', async (context) => {
    const id = parseId(context.req.param('id'))
    const input = await parseBody(context, updateVenueSchema)
    return auditedMutation(context, db, input, 'venue', 'UPDATE', async (transaction) => {
      const existing = await ensureVenue(transaction, id)
      const [item] = await transaction.update(venues).set({ ...input, updatedAt: new Date() }).where(eq(venues.id, id)).returning()
      if (!item) throw notFound('Venue')
      return { entityId: item.id, beforeData: existing, afterData: item, body: { data: item }, status: 200 }
    })
  })

  app.delete('/api/v1/venues/:id', async (context) => {
    parseId(context.req.param('id'))
    throw new ApiError(405, 'ARCHIVE_REQUIRED', 'Gunakan endpoint archive agar riwayat tetap terjaga.')
  })

  app.post('/api/v1/venues/:id/archive', async (context) => {
    const id = parseId(context.req.param('id'))
    const input = await parseBody(context, archiveSchema)
    return auditedMutation(context, db, input, 'venue', 'ARCHIVE', async (transaction, meta) => {
      const existing = await ensureVenue(transaction, id)
      const [item] = await transaction.update(venues).set({ archivedAt: new Date(), archivedByActorRef: meta.actorRef, archiveReason: input.reason, updatedAt: new Date() }).where(eq(venues.id, id)).returning()
      if (!item) throw notFound('Venue')
      return { entityId: item.id, beforeData: existing, afterData: item, body: { data: item }, status: 200 }
    })
  })

  app.post('/api/v1/venues/:id/contacts', async (context) => {
    const venueId = parseId(context.req.param('id'))
    const input = await parseBody(context, createContactSchema)
    return auditedMutation(context, db, input, 'contact', 'CREATE', async (transaction) => {
      await ensureVenue(transaction, venueId)
      if (input.isPrimary) await transaction.update(venueContacts).set({ isPrimary: false }).where(eq(venueContacts.venueId, venueId))
      const { isPrimary, ...contactInput } = input
      const [contact] = await transaction.insert(contacts).values(contactInput).returning()
      if (!contact) throw new ApiError(500, 'INTERNAL_ERROR', 'Contact tidak dapat dibuat.')
      await transaction.insert(venueContacts).values({ venueId, contactId: contact.id, isPrimary })
      return { entityId: contact.id, afterData: contact, body: { data: { ...contact, isPrimary } }, status: 201 }
    })
  })

  app.patch('/api/v1/contacts/:id', async (context) => {
    const id = parseId(context.req.param('id'))
    const input = await parseBody(context, updateContactSchema)
    return auditedMutation(context, db, input, 'contact', 'UPDATE', async (transaction) => {
      const existing = await ensureContact(transaction, id)
      const [item] = await transaction.update(contacts).set({ ...input, updatedAt: new Date() }).where(eq(contacts.id, id)).returning()
      if (!item) throw notFound('Contact')
      return { entityId: item.id, beforeData: existing, afterData: item, body: { data: item }, status: 200 }
    })
  })

  app.delete('/api/v1/contacts/:id', async (context) => {
    parseId(context.req.param('id'))
    throw new ApiError(405, 'ARCHIVE_REQUIRED', 'Contact tidak dihapus permanen; arsipkan melalui endpoint archive.')
  })

  app.post('/api/v1/contacts/:id/archive', async (context) => {
    const id = parseId(context.req.param('id'))
    const input = await parseBody(context, archiveSchema)
    return auditedMutation(context, db, input, 'contact', 'ARCHIVE', async (transaction) => {
      const existing = await ensureContact(transaction, id)
      const [item] = await transaction.update(contacts).set({ archivedAt: new Date(), updatedAt: new Date() }).where(eq(contacts.id, id)).returning()
      if (!item) throw notFound('Contact')
      return { entityId: item.id, beforeData: existing, afterData: item, body: { data: item }, status: 200 }
    })
  })

  app.get('/api/v1/events', async (context) => {
    const { limit, offset } = parsePagination(context)
    const eventOrganizerId = parseOptionalUuid(context.req.query('eventOrganizerId'), 'eventOrganizerId')
    const venueId = parseOptionalUuid(context.req.query('venueId'), 'venueId')
    const startsFrom = context.req.query('startsFrom')
    const startsUntil = context.req.query('startsUntil')
    const rawStatus = context.req.query('status')
    const status = rawStatus === 'ACTIVE' || rawStatus === 'CANCELLED' ? rawStatus : undefined
    if (startsFrom && !/^\d{4}-\d{2}-\d{2}$/.test(startsFrom)) throw new ApiError(400, 'INVALID_QUERY', 'startsFrom harus YYYY-MM-DD.')
    if (startsUntil && !/^\d{4}-\d{2}-\d{2}$/.test(startsUntil)) throw new ApiError(400, 'INVALID_QUERY', 'startsUntil harus YYYY-MM-DD.')
    if (rawStatus && !status) throw new ApiError(400, 'INVALID_QUERY', 'status harus ACTIVE atau CANCELLED.')
    const conditions = [
      eventOrganizerId ? eq(events.eventOrganizerId, eventOrganizerId) : undefined,
      venueId ? eq(events.venueId, venueId) : undefined,
      startsFrom ? gte(events.startOn, startsFrom) : undefined,
      startsUntil ? lte(events.startOn, startsUntil) : undefined,
      status ? eq(events.status, status) : undefined,
    ].filter((condition): condition is NonNullable<typeof condition> => condition !== undefined)
    const where = conditions.length > 0 ? and(...conditions) : undefined
    const [items, totalResult] = await Promise.all([
      db.select({ event: events, eventOrganizer: { id: eventOrganizers.id, name: eventOrganizers.name }, venue: { id: venues.id, name: venues.name } })
        .from(events).innerJoin(eventOrganizers, eq(events.eventOrganizerId, eventOrganizers.id)).innerJoin(venues, eq(events.venueId, venues.id))
        .where(where).orderBy(desc(events.startOn)).limit(limit).offset(offset),
      db.select({ total: count() }).from(events).where(where),
    ])
    return context.json({ data: items.map((item) => ({ ...item.event, eventOrganizer: item.eventOrganizer, venue: item.venue })), meta: { limit, offset, total: totalResult[0]?.total ?? 0 } })
  })

  app.post('/api/v1/events', async (context) => {
    const input = await parseBody(context, createEventSchema)
    return auditedMutation(context, db, input, 'event', 'CREATE', async (transaction) => {
      const organizer = await ensureEventOrganizer(transaction, input.eventOrganizerId)
      const venue = await ensureVenue(transaction, input.venueId)
      if (organizer.archivedAt) throw new ApiError(409, 'ARCHIVED_EVENT_ORGANIZER', 'Event Organizer yang diarsipkan tidak dapat digunakan.')
      if (venue.archivedAt) throw new ApiError(409, 'ARCHIVED_VENUE', 'Venue yang diarsipkan tidak dapat digunakan.')
      const [item] = await transaction.insert(events).values(input).returning()
      if (!item) throw new ApiError(500, 'INTERNAL_ERROR', 'Event tidak dapat dibuat.')
      return { entityId: item.id, afterData: item, body: { data: item }, status: 201 }
    })
  })

  app.get('/api/v1/events/:id', async (context) => {
    const id = parseId(context.req.param('id'))
    const [item] = await db.select({ event: events, eventOrganizer: { id: eventOrganizers.id, name: eventOrganizers.name }, venue: { id: venues.id, name: venues.name } })
      .from(events).innerJoin(eventOrganizers, eq(events.eventOrganizerId, eventOrganizers.id)).innerJoin(venues, eq(events.venueId, venues.id)).where(eq(events.id, id)).limit(1)
    if (!item) throw notFound('Event')
    const participationCounts = await sql<{ status: string; total: number }[]>`select status, count(*)::int as total from event_exhibitors where event_id = ${id} group by status`
    return context.json({ data: {
      ...item.event, eventOrganizer: item.eventOrganizer, venue: item.venue,
      participationCounts: {
        active: participationCounts.find((row) => row.status === 'ACTIVE')?.total ?? 0,
        withdrawn: participationCounts.find((row) => row.status === 'WITHDRAWN')?.total ?? 0,
      },
    } })
  })

  app.patch('/api/v1/events/:id', async (context) => {
    const id = parseId(context.req.param('id'))
    const input = await parseBody(context, updateEventSchema)
    return auditedMutation(context, db, input, 'event', 'UPDATE', async (transaction) => {
      const [existing] = await transaction.select().from(events).where(eq(events.id, id)).limit(1)
      if (!existing) throw notFound('Event')
      const eventOrganizerId = input.eventOrganizerId ?? existing.eventOrganizerId
      const venueId = input.venueId ?? existing.venueId
      const startOn = input.startOn ?? existing.startOn
      const endOn = input.endOn ?? existing.endOn
      if (endOn < startOn) throw new ApiError(422, 'VALIDATION_ERROR', 'endOn tidak boleh sebelum startOn.', [{ field: 'endOn', message: 'endOn tidak boleh sebelum startOn.' }])
      const organizer = await ensureEventOrganizer(transaction, eventOrganizerId)
      const venue = await ensureVenue(transaction, venueId)
      if (organizer.archivedAt) throw new ApiError(409, 'ARCHIVED_EVENT_ORGANIZER', 'Event Organizer yang diarsipkan tidak dapat digunakan.')
      if (venue.archivedAt) throw new ApiError(409, 'ARCHIVED_VENUE', 'Venue yang diarsipkan tidak dapat digunakan.')
      const [item] = await transaction.update(events).set({ ...input, updatedAt: new Date() }).where(eq(events.id, id)).returning()
      if (!item) throw notFound('Event')
      return { entityId: item.id, beforeData: existing, afterData: item, body: { data: item }, status: 200 }
    })
  })

  app.delete('/api/v1/events/:id', async (context) => {
    parseId(context.req.param('id'))
    throw new ApiError(405, 'CANCEL_REQUIRED', 'Gunakan endpoint cancel agar riwayat event tetap terjaga.')
  })

  registerEventManagementRoutes(app, db)
  registerSourceLineageRoutes(app, db)

  return app
}
