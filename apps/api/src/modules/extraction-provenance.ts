import { asc, count, eq, inArray } from 'drizzle-orm'
import type { Context, Hono } from 'hono'
import type { ZodType } from 'zod'
import type { Database } from '../db/client'
import {
  documentExtractionFactReviews,
  documentExtractionFacts,
  documentExtractions,
  sourceDocuments,
} from '../db/schema'
import {
  createDocumentExtractionFactReviewSchema,
  createDocumentExtractionSchema,
} from './schemas'
import { ApiError, notFound } from '../shared/errors'
import { auditedMutation, type Transaction } from '../shared/mutations'
import { idSchema, paginationSchema } from '../shared/responses'

const extractionFields = {
  id: documentExtractions.id,
  sourceDocumentId: documentExtractions.sourceDocumentId,
  submittedByActorRef: documentExtractions.submittedByActorRef,
  createdAt: documentExtractions.createdAt,
}

const factFields = {
  id: documentExtractionFacts.id,
  extractionId: documentExtractionFacts.extractionId,
  field: documentExtractionFacts.field,
  informationState: documentExtractionFacts.informationState,
  assertedValue: documentExtractionFacts.assertedValue,
  confidencePercent: documentExtractionFacts.confidencePercent,
  conflictExplanation: documentExtractionFacts.conflictExplanation,
  evidenceLocators: documentExtractionFacts.evidenceLocators,
  createdAt: documentExtractionFacts.createdAt,
}

const reviewFields = {
  id: documentExtractionFactReviews.id,
  extractionFactId: documentExtractionFactReviews.extractionFactId,
  kind: documentExtractionFactReviews.kind,
  resultingState: documentExtractionFactReviews.resultingState,
  resultingValue: documentExtractionFactReviews.resultingValue,
  conflictExplanation: documentExtractionFactReviews.conflictExplanation,
  reason: documentExtractionFactReviews.reason,
  evidenceLocators: documentExtractionFactReviews.evidenceLocators,
  reviewedByActorRef: documentExtractionFactReviews.reviewedByActorRef,
  createdAt: documentExtractionFactReviews.createdAt,
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

function pagination(context: Context) {
  const parsed = paginationSchema.safeParse({ limit: context.req.query('limit'), offset: context.req.query('offset') })
  if (!parsed.success) throw new ApiError(400, 'INVALID_PAGINATION', 'Parameter pagination tidak valid.')
  return parsed.data
}

async function requireSourceDocument(database: Database | Transaction, sourceDocumentId: string) {
  const [document] = await database.select({ id: sourceDocuments.id }).from(sourceDocuments).where(eq(sourceDocuments.id, sourceDocumentId)).limit(1)
  if (!document) throw notFound('Source Document')
  return document
}

async function requireExtraction(database: Database | Transaction, extractionId: string) {
  const [extraction] = await database.select(extractionFields).from(documentExtractions).where(eq(documentExtractions.id, extractionId)).limit(1)
  if (!extraction) throw notFound('Document Extraction')
  return extraction
}

async function requireExtractionFact(database: Database | Transaction, extractionFactId: string) {
  const [fact] = await database.select(factFields).from(documentExtractionFacts).where(eq(documentExtractionFacts.id, extractionFactId)).limit(1)
  if (!fact) throw notFound('Document Extraction Fact')
  return fact
}

export function registerExtractionProvenanceRoutes(app: Hono, db: Database) {
  app.post('/api/v1/source-documents/:sourceDocumentId/extractions', async (context) => {
    const sourceDocumentId = id(context.req.param('sourceDocumentId'))
    const input = await body(context, createDocumentExtractionSchema)
    return auditedMutation(context, db, input, 'document_extraction', 'CREATE', async (transaction, metadata) => {
      await requireSourceDocument(transaction, sourceDocumentId)
      const [extraction] = await transaction.insert(documentExtractions).values({ sourceDocumentId, submittedByActorRef: metadata.actorRef }).returning(extractionFields)
      if (!extraction) throw new ApiError(500, 'INTERNAL_ERROR', 'Document Extraction tidak dapat dibuat.')
      const facts = await transaction.insert(documentExtractionFacts).values(input.facts.map((fact) => ({
        extractionId: extraction.id,
        field: fact.field,
        informationState: fact.informationState,
        assertedValue: fact.assertedValue ?? null,
        confidencePercent: fact.confidencePercent ?? null,
        conflictExplanation: fact.conflictExplanation ?? null,
        evidenceLocators: fact.evidenceLocators,
      }))).returning(factFields)
      const data = { ...extraction, facts }
      return { entityId: extraction.id, afterData: data, body: { data }, status: 201 }
    })
  })

  app.get('/api/v1/source-documents/:sourceDocumentId/extractions', async (context) => {
    const sourceDocumentId = id(context.req.param('sourceDocumentId'))
    const { limit, offset } = pagination(context)
    await requireSourceDocument(db, sourceDocumentId)
    const [data, totalResult] = await Promise.all([
      db.select(extractionFields).from(documentExtractions).where(eq(documentExtractions.sourceDocumentId, sourceDocumentId))
        .orderBy(asc(documentExtractions.createdAt), asc(documentExtractions.id)).limit(limit).offset(offset),
      db.select({ total: count() }).from(documentExtractions).where(eq(documentExtractions.sourceDocumentId, sourceDocumentId)),
    ])
    return context.json({ data, meta: { limit, offset, total: totalResult[0]?.total ?? 0 } })
  })

  app.get('/api/v1/extractions/:id', async (context) => {
    const extraction = await requireExtraction(db, id(context.req.param('id')))
    const facts = await db.select(factFields).from(documentExtractionFacts).where(eq(documentExtractionFacts.extractionId, extraction.id))
      .orderBy(asc(documentExtractionFacts.createdAt), asc(documentExtractionFacts.id))
    const factIds = facts.map((fact) => fact.id)
    const reviews = factIds.length === 0 ? [] : await db.select(reviewFields).from(documentExtractionFactReviews)
      .where(inArray(documentExtractionFactReviews.extractionFactId, factIds))
      .orderBy(asc(documentExtractionFactReviews.createdAt), asc(documentExtractionFactReviews.id))
    const reviewsByFactId: Record<string, Array<typeof reviews[number]>> = {}
    for (const review of reviews) (reviewsByFactId[review.extractionFactId] ??= []).push(review)
    return context.json({ data: { ...extraction, facts: facts.map((fact) => ({ ...fact, reviews: reviewsByFactId[fact.id] ?? [] })) } })
  })

  app.post('/api/v1/extraction-facts/:extractionFactId/reviews', async (context) => {
    const extractionFactId = id(context.req.param('extractionFactId'))
    const input = await body(context, createDocumentExtractionFactReviewSchema)
    return auditedMutation(context, db, input, 'document_extraction_fact_review', 'CREATE', async (transaction, metadata) => {
      await requireExtractionFact(transaction, extractionFactId)
      const [review] = await transaction.insert(documentExtractionFactReviews).values({
        extractionFactId,
        kind: input.kind,
        resultingState: input.resultingState,
        resultingValue: input.resultingValue ?? null,
        conflictExplanation: input.conflictExplanation ?? null,
        reason: input.reason,
        evidenceLocators: input.evidenceLocators,
        reviewedByActorRef: metadata.actorRef,
      }).returning(reviewFields)
      if (!review) throw new ApiError(500, 'INTERNAL_ERROR', 'Document Extraction Fact Review tidak dapat dibuat.')
      return { entityId: review.id, afterData: review, body: { data: review }, status: 201 }
    })
  })
}
