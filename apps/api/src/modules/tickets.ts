import type { Hono } from 'hono'
import { asc, eq } from 'drizzle-orm'
import type { Database } from '../db/client'
import { ticketActivities, ticketComments, tickets } from '../db/schema'
import { createTicketCommentSchema, createTicketSchema, updateTicketSchema } from './schemas'
import { ApiError } from '../shared/errors'
import { auditedMutation } from '../shared/mutations'

export function registerTicketRoutes(app: Hono, db: Database) {
  app.get('/api/v1/tickets', async (context) => context.json({ data: await db.select().from(tickets).orderBy(asc(tickets.createdAt)) }))
  app.post('/api/v1/tickets', async (context) => {
    const parsed = createTicketSchema.safeParse(await context.req.json().catch(() => null))
    if (!parsed.success) throw new ApiError(422, 'VALIDATION_ERROR', 'Request tidak valid.', parsed.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })))
    return auditedMutation(context, db, parsed.data, 'ticket', 'CREATE', async (tx) => {
      const [ticket] = await tx.insert(tickets).values({ ...parsed.data, eventId: parsed.data.eventId ?? null, customsJobId: parsed.data.customsJobId ?? null, assigneeId: parsed.data.assigneeId ?? null, description: parsed.data.description ?? null, status: 'TODO', outcome: null, createdByUserId: null }).returning()
      if (!ticket) throw new ApiError(500, 'INTERNAL_ERROR', 'Ticket tidak dapat dibuat.')
      return { entityId: ticket.id, afterData: ticket, body: { data: ticket }, status: 201 }
    })
  })
  app.patch('/api/v1/tickets/:id', async (context) => {
    const parsed = updateTicketSchema.safeParse(await context.req.json().catch(() => null))
    if (!parsed.success) throw new ApiError(422, 'VALIDATION_ERROR', 'Request tidak valid.', parsed.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })))
    const id = context.req.param('id')
    return auditedMutation(context, db, parsed.data, 'ticket', 'UPDATE', async (tx) => {
      const [before] = await tx.select().from(tickets).where(eq(tickets.id, id)).limit(1)
      if (!before) throw new ApiError(404, 'NOT_FOUND', 'Ticket tidak ditemukan.')
      if (before.status === 'DONE' && parsed.data.status && parsed.data.status !== 'DONE' && !parsed.data.reason) throw new ApiError(422, 'VALIDATION_ERROR', 'Alasan membuka kembali ticket wajib diisi.')
      const [ticket] = await tx.update(tickets).set({ ...parsed.data, outcome: parsed.data.status === 'DONE' ? parsed.data.outcome : parsed.data.status ? null : before.outcome, updatedAt: new Date() }).where(eq(tickets.id, id)).returning()
      if (!ticket) throw new ApiError(500, 'INTERNAL_ERROR', 'Ticket tidak dapat diperbarui.')
      return { entityId: ticket.id, beforeData: before, afterData: ticket, body: { data: ticket }, status: 200 }
    })
  })
  app.get('/api/v1/tickets/:id/timeline', async (context) => context.json({ data: {
    activities: await db.select().from(ticketActivities).where(eq(ticketActivities.ticketId, context.req.param('id'))).orderBy(asc(ticketActivities.occurredAt)),
    comments: await db.select().from(ticketComments).where(eq(ticketComments.ticketId, context.req.param('id'))).orderBy(asc(ticketComments.createdAt)),
  } }))
  app.post('/api/v1/tickets/:id/comments', async (context) => {
    const parsed = createTicketCommentSchema.safeParse(await context.req.json().catch(() => null))
    if (!parsed.success) throw new ApiError(422, 'VALIDATION_ERROR', 'Request tidak valid.')
    return auditedMutation(context, db, parsed.data, 'ticket_comment', 'CREATE', async (tx) => {
      const [comment] = await tx.insert(ticketComments).values({ ticketId: context.req.param('id'), authorUserId: parsed.data.authorUserId, body: parsed.data.body }).returning()
      if (!comment) throw new ApiError(500, 'INTERNAL_ERROR', 'Comment tidak dapat dibuat.')
      return { entityId: comment.id, afterData: comment, body: { data: comment }, status: 201 }
    })
  })
  app.get('/api/v1/tickets/:id', async (context) => { const [ticket] = await db.select().from(tickets).where(eq(tickets.id, context.req.param('id'))).limit(1); if (!ticket) throw new ApiError(404, 'NOT_FOUND', 'Ticket tidak ditemukan.'); return context.json({ data: ticket }) })
}
