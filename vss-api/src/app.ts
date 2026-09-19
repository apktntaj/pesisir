import { and, asc, count, desc, eq, gte, lte } from 'drizzle-orm'
import { Hono } from 'hono'
import type { Context } from 'hono'
import type { ZodType } from 'zod'
import type { Sql } from 'postgres'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import type { Database } from './db/client'
import { contacts, eventOrganizerContacts, eventOrganizers, events, venueContacts, venues } from './db/schema'
import {
  createContactSchema,
  createEventOrganizerSchema,
  createEventSchema,
  createVenueSchema,
  updateContactSchema,
  updateEventOrganizerSchema,
  updateEventSchema,
  updateVenueSchema,
} from './modules/schemas'
import { ApiError, notFound, resourceInUse } from './shared/errors'
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

async function ensureEventOrganizer(db: Database, id: string) {
  const [organizer] = await db.select().from(eventOrganizers).where(eq(eventOrganizers.id, id)).limit(1)
  if (!organizer) throw notFound('Event Organizer')
  return organizer
}

async function ensureVenue(db: Database, id: string) {
  const [venue] = await db.select().from(venues).where(eq(venues.id, id)).limit(1)
  if (!venue) throw notFound('Venue')
  return venue
}

async function ensureContact(db: Database, id: string) {
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
    const [items, totalResult] = await Promise.all([
      db.select().from(eventOrganizers).orderBy(asc(eventOrganizers.name)).limit(limit).offset(offset),
      db.select({ total: count() }).from(eventOrganizers),
    ])
    return context.json({ data: items, meta: { limit, offset, total: totalResult[0]?.total ?? 0 } })
  })

  app.post('/api/v1/event-organizers', async (context) => {
    const input = await parseBody(context, createEventOrganizerSchema)
    const [item] = await db.insert(eventOrganizers).values(input).returning()
    return context.json({ data: item }, 201)
  })

  app.get('/api/v1/event-organizers/:id', async (context) => {
    const id = parseId(context.req.param('id'))
    const organizer = await ensureEventOrganizer(db, id)
    const linkedContacts = await db.select({ id: contacts.id, name: contacts.name, contact: contacts.contact, createdAt: contacts.createdAt, updatedAt: contacts.updatedAt })
      .from(eventOrganizerContacts).innerJoin(contacts, eq(eventOrganizerContacts.contactId, contacts.id))
      .where(eq(eventOrganizerContacts.eventOrganizerId, id)).orderBy(asc(contacts.name))
    return context.json({ data: { ...organizer, contacts: linkedContacts } })
  })

  app.patch('/api/v1/event-organizers/:id', async (context) => {
    const id = parseId(context.req.param('id'))
    await ensureEventOrganizer(db, id)
    const input = await parseBody(context, updateEventOrganizerSchema)
    const [item] = await db.update(eventOrganizers).set({ ...input, updatedAt: new Date() }).where(eq(eventOrganizers.id, id)).returning()
    return context.json({ data: item })
  })

  app.delete('/api/v1/event-organizers/:id', async (context) => {
    const id = parseId(context.req.param('id'))
    await ensureEventOrganizer(db, id)
    const [usage] = await db.select({ total: count() }).from(events).where(eq(events.eventOrganizerId, id))
    if ((usage?.total ?? 0) > 0) throw resourceInUse('Event Organizer')
    await db.delete(eventOrganizers).where(eq(eventOrganizers.id, id))
    return context.body(null, 204)
  })

  app.post('/api/v1/event-organizers/:id/contacts', async (context) => {
    const organizerId = parseId(context.req.param('id'))
    const input = await parseBody(context, createContactSchema)
    const item = await db.transaction(async (transaction) => {
      await ensureEventOrganizer(transaction, organizerId)
      const [contact] = await transaction.insert(contacts).values(input).returning()
      if (!contact) throw new ApiError(500, 'INTERNAL_ERROR', 'Contact tidak dapat dibuat.')
      await transaction.insert(eventOrganizerContacts).values({ eventOrganizerId: organizerId, contactId: contact.id })
      return contact
    })
    return context.json({ data: item }, 201)
  })

  app.get('/api/v1/venues', async (context) => {
    const { limit, offset } = parsePagination(context)
    const [items, totalResult] = await Promise.all([
      db.select().from(venues).orderBy(asc(venues.name)).limit(limit).offset(offset),
      db.select({ total: count() }).from(venues),
    ])
    return context.json({ data: items, meta: { limit, offset, total: totalResult[0]?.total ?? 0 } })
  })

  app.post('/api/v1/venues', async (context) => {
    const input = await parseBody(context, createVenueSchema)
    const [item] = await db.insert(venues).values(input).returning()
    return context.json({ data: item }, 201)
  })

  app.get('/api/v1/venues/:id', async (context) => {
    const id = parseId(context.req.param('id'))
    const venue = await ensureVenue(db, id)
    const linkedContacts = await db.select({ id: contacts.id, name: contacts.name, contact: contacts.contact, createdAt: contacts.createdAt, updatedAt: contacts.updatedAt })
      .from(venueContacts).innerJoin(contacts, eq(venueContacts.contactId, contacts.id))
      .where(eq(venueContacts.venueId, id)).orderBy(asc(contacts.name))
    return context.json({ data: { ...venue, contacts: linkedContacts } })
  })

  app.patch('/api/v1/venues/:id', async (context) => {
    const id = parseId(context.req.param('id'))
    await ensureVenue(db, id)
    const input = await parseBody(context, updateVenueSchema)
    const [item] = await db.update(venues).set({ ...input, updatedAt: new Date() }).where(eq(venues.id, id)).returning()
    return context.json({ data: item })
  })

  app.delete('/api/v1/venues/:id', async (context) => {
    const id = parseId(context.req.param('id'))
    await ensureVenue(db, id)
    const [usage] = await db.select({ total: count() }).from(events).where(eq(events.venueId, id))
    if ((usage?.total ?? 0) > 0) throw resourceInUse('Venue')
    await db.delete(venues).where(eq(venues.id, id))
    return context.body(null, 204)
  })

  app.post('/api/v1/venues/:id/contacts', async (context) => {
    const venueId = parseId(context.req.param('id'))
    const input = await parseBody(context, createContactSchema)
    const item = await db.transaction(async (transaction) => {
      await ensureVenue(transaction, venueId)
      const [contact] = await transaction.insert(contacts).values(input).returning()
      if (!contact) throw new ApiError(500, 'INTERNAL_ERROR', 'Contact tidak dapat dibuat.')
      await transaction.insert(venueContacts).values({ venueId, contactId: contact.id })
      return contact
    })
    return context.json({ data: item }, 201)
  })

  app.patch('/api/v1/contacts/:id', async (context) => {
    const id = parseId(context.req.param('id'))
    await ensureContact(db, id)
    const input = await parseBody(context, updateContactSchema)
    const [item] = await db.update(contacts).set({ ...input, updatedAt: new Date() }).where(eq(contacts.id, id)).returning()
    return context.json({ data: item })
  })

  app.delete('/api/v1/contacts/:id', async (context) => {
    const id = parseId(context.req.param('id'))
    await ensureContact(db, id)
    await db.delete(contacts).where(eq(contacts.id, id))
    return context.body(null, 204)
  })

  app.get('/api/v1/events', async (context) => {
    const { limit, offset } = parsePagination(context)
    const eventOrganizerId = parseOptionalUuid(context.req.query('eventOrganizerId'), 'eventOrganizerId')
    const venueId = parseOptionalUuid(context.req.query('venueId'), 'venueId')
    const startsFrom = context.req.query('startsFrom')
    const startsUntil = context.req.query('startsUntil')
    if (startsFrom && !/^\d{4}-\d{2}-\d{2}$/.test(startsFrom)) throw new ApiError(400, 'INVALID_QUERY', 'startsFrom harus YYYY-MM-DD.')
    if (startsUntil && !/^\d{4}-\d{2}-\d{2}$/.test(startsUntil)) throw new ApiError(400, 'INVALID_QUERY', 'startsUntil harus YYYY-MM-DD.')
    const conditions = [
      eventOrganizerId ? eq(events.eventOrganizerId, eventOrganizerId) : undefined,
      venueId ? eq(events.venueId, venueId) : undefined,
      startsFrom ? gte(events.startOn, startsFrom) : undefined,
      startsUntil ? lte(events.startOn, startsUntil) : undefined,
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
    await ensureEventOrganizer(db, input.eventOrganizerId)
    await ensureVenue(db, input.venueId)
    const [item] = await db.insert(events).values(input).returning()
    return context.json({ data: item }, 201)
  })

  app.get('/api/v1/events/:id', async (context) => {
    const id = parseId(context.req.param('id'))
    const [item] = await db.select({ event: events, eventOrganizer: { id: eventOrganizers.id, name: eventOrganizers.name }, venue: { id: venues.id, name: venues.name } })
      .from(events).innerJoin(eventOrganizers, eq(events.eventOrganizerId, eventOrganizers.id)).innerJoin(venues, eq(events.venueId, venues.id)).where(eq(events.id, id)).limit(1)
    if (!item) throw notFound('Event')
    return context.json({ data: { ...item.event, eventOrganizer: item.eventOrganizer, venue: item.venue } })
  })

  app.patch('/api/v1/events/:id', async (context) => {
    const id = parseId(context.req.param('id'))
    const [existing] = await db.select().from(events).where(eq(events.id, id)).limit(1)
    if (!existing) throw notFound('Event')
    const input = await parseBody(context, updateEventSchema)
    const eventOrganizerId = input.eventOrganizerId ?? existing.eventOrganizerId
    const venueId = input.venueId ?? existing.venueId
    const startOn = input.startOn ?? existing.startOn
    const endOn = input.endOn ?? existing.endOn
    if (endOn < startOn) throw new ApiError(422, 'VALIDATION_ERROR', 'endOn tidak boleh sebelum startOn.', [{ field: 'endOn', message: 'endOn tidak boleh sebelum startOn.' }])
    await ensureEventOrganizer(db, eventOrganizerId)
    await ensureVenue(db, venueId)
    const [item] = await db.update(events).set({ ...input, updatedAt: new Date() }).where(eq(events.id, id)).returning()
    return context.json({ data: item })
  })

  app.delete('/api/v1/events/:id', async (context) => {
    const id = parseId(context.req.param('id'))
    const [item] = await db.delete(events).where(eq(events.id, id)).returning({ id: events.id })
    if (!item) throw notFound('Event')
    return context.body(null, 204)
  })

  return app
}
