import { z } from 'zod'

const requiredText = z.string().trim().min(1)
const nullableText = requiredText.nullable().optional()
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Gunakan format YYYY-MM-DD.')
const uuid = z.string().uuid()
const countryCode = z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/).nullable().optional()
const website = z.string().trim().url().nullable().optional()
const instant = z.string().datetime({ offset: true })
const base64Content = z.string()
  .min(4)
  .max(27_962_028, 'Ukuran dokumen maksimum 20 MiB.')
  .regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/, 'contentBase64 harus berupa base64 yang valid.')
const documentFields = {
  fileName: requiredText.max(255),
  mimeType: z.enum([
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'image/jpeg',
    'image/png',
  ]),
  contentBase64: base64Content,
  receivedAt: instant,
}

const nonEmptyPatch = <T extends z.ZodRawShape>(shape: T) => z.object(shape).refine(
  (value) => Object.keys(value).length > 0,
  'Minimal satu field harus diberikan.',
)

export const createEventOrganizerSchema = z.object({ name: requiredText, npwp: nullableText, address: nullableText, website })
export const updateEventOrganizerSchema = nonEmptyPatch({ name: requiredText.optional(), npwp: nullableText, address: nullableText, website })

export const createVenueSchema = z.object({ name: requiredText, npwp: nullableText, address: nullableText, website, loadingAccessNotes: nullableText })
export const updateVenueSchema = nonEmptyPatch({ name: requiredText.optional(), npwp: nullableText, address: nullableText, website, loadingAccessNotes: nullableText })

export const createContactSchema = z.object({
  name: requiredText, role: nullableText, email: z.string().trim().email().nullable().optional(), phone: nullableText,
  legacyContact: nullableText, isPrimary: z.boolean().default(false),
}).refine((value) => Boolean(value.email || value.phone || value.legacyContact), { message: 'Email atau telepon wajib diisi.', path: ['email'] })
export const updateContactSchema = nonEmptyPatch({
  name: requiredText.optional(), role: nullableText, email: z.string().trim().email().nullable().optional(), phone: nullableText,
})

export const createEventSchema = z.object({
  name: requiredText, alias: nullableText, notes: nullableText, startOn: dateOnly, endOn: dateOnly, eventOrganizerId: uuid, venueId: uuid,
}).refine((value) => value.endOn >= value.startOn, { path: ['endOn'], message: 'endOn tidak boleh sebelum startOn.' })
export const updateEventSchema = nonEmptyPatch({
  name: requiredText.optional(), alias: nullableText, notes: nullableText, startOn: dateOnly.optional(), endOn: dateOnly.optional(),
  eventOrganizerId: uuid.optional(), venueId: uuid.optional(),
})

const exhibitorFields = {
  legalName: requiredText, alias: nullableText, npwp: nullableText, countryCode, address: nullableText, website,
}
export const createExhibitorSchema = z.discriminatedUnion('kind', [
  z.object({ ...exhibitorFields, kind: z.literal('LOCAL'), countryCode: z.literal('ID').optional().default('ID') }),
  z.object({ ...exhibitorFields, kind: z.literal('INTERNATIONAL'), npwp: z.null().optional(), countryCode })
    .refine((value) => value.countryCode !== 'ID', { path: ['countryCode'], message: 'Exhibitor internasional tidak boleh memakai kode negara ID.' }),
])
export const updateExhibitorSchema = nonEmptyPatch({
  legalName: requiredText.optional(), alias: nullableText, kind: z.enum(['LOCAL', 'INTERNATIONAL']).optional(), npwp: nullableText,
  countryCode, address: nullableText, website,
})

export const createAgentSchema = z.object({ name: requiredText, countryCode, address: nullableText, website })
export const updateAgentSchema = nonEmptyPatch({ name: requiredText.optional(), countryCode, address: nullableText, website })

export const createEventExhibitorSchema = z.object({
  exhibitorId: uuid, agentId: uuid.nullable().optional(), primaryContactId: uuid.nullable().optional(), hall: nullableText, booth: nullableText, notes: nullableText,
})
export const updateEventExhibitorSchema = nonEmptyPatch({
  agentId: uuid.nullable().optional(), primaryContactId: uuid.nullable().optional(), hall: nullableText, booth: nullableText, notes: nullableText,
})

export const reasonSchema = z.object({ reason: requiredText })

export const createSourceMessageSchema = z.object({
  channel: z.literal('WHATSAPP').default('WHATSAPP'),
  externalMessageId: requiredText.max(255),
  conversationRef: requiredText.max(255),
  senderRef: requiredText.max(255),
  occurredAt: instant,
  bodyText: z.string().nullable().optional(),
})

export const createSourceDocumentSchema = z.discriminatedUnion('sourceKind', [
  z.object({ ...documentFields, sourceKind: z.literal('WHATSAPP_ATTACHMENT'), sourceMessageId: uuid }).strict(),
  z.object({ ...documentFields, sourceKind: z.literal('MANUAL_UPLOAD') }).strict(),
])

const informationState = z.enum(['SOURCE_BACKED', 'CONFIRMED', 'INFERRED', 'UNKNOWN', 'CONFLICTING', 'NOT_APPLICABLE'])
const evidenceLocatorSchema = z.object({
  kind: z.enum(['PDF_PAGE', 'SPREADSHEET_RANGE', 'IMAGE_REGION', 'TEXT_SPAN']),
  reference: z.record(z.string(), z.unknown()).refine((value) => Object.keys(value).length > 0, 'reference wajib diisi.'),
  excerpt: nullableText,
}).strict()

function validateFactState(
  value: { informationState: z.infer<typeof informationState>; assertedValue?: unknown; conflictExplanation?: string | null },
  context: z.RefinementCtx,
  valueField: 'assertedValue' | 'resultingValue',
) {
  const hasValue = value.assertedValue !== undefined && value.assertedValue !== null
  const conflictExplanation = value.conflictExplanation?.trim()
  if (['SOURCE_BACKED', 'CONFIRMED', 'INFERRED'].includes(value.informationState)) {
    if (!hasValue) context.addIssue({ code: 'custom', path: [valueField], message: `${valueField} wajib diisi untuk state ini.` })
    if (conflictExplanation) context.addIssue({ code: 'custom', path: ['conflictExplanation'], message: 'conflictExplanation hanya boleh diisi untuk state CONFLICTING.' })
  }
  if (['UNKNOWN', 'NOT_APPLICABLE'].includes(value.informationState)) {
    if (hasValue) context.addIssue({ code: 'custom', path: [valueField], message: `${valueField} tidak boleh diisi untuk state ini.` })
    if (conflictExplanation) context.addIssue({ code: 'custom', path: ['conflictExplanation'], message: 'conflictExplanation hanya boleh diisi untuk state CONFLICTING.' })
  }
  if (value.informationState === 'CONFLICTING') {
    if (hasValue) context.addIssue({ code: 'custom', path: [valueField], message: `${valueField} tidak boleh diisi untuk state CONFLICTING.` })
    if (!conflictExplanation) context.addIssue({ code: 'custom', path: ['conflictExplanation'], message: 'conflictExplanation wajib diisi untuk state CONFLICTING.' })
  }
}

const extractionFactSchema = z.object({
  field: requiredText.max(255),
  informationState,
  assertedValue: z.unknown().optional(),
  confidencePercent: z.number().int().min(0).max(100).optional(),
  conflictExplanation: nullableText,
  evidenceLocators: z.array(evidenceLocatorSchema).default([]),
}).strict().superRefine((value, context) => validateFactState(value, context, 'assertedValue'))

export const createDocumentExtractionSchema = z.object({
  facts: z.array(extractionFactSchema).min(1),
}).strict().superRefine((value, context) => {
  const fields = new Set<string>()
  for (const [index, fact] of value.facts.entries()) {
    if (fields.has(fact.field)) context.addIssue({ code: 'custom', path: ['facts', index, 'field'], message: 'field harus unik dalam satu extraction.' })
    fields.add(fact.field)
  }
})

export const createDocumentExtractionFactReviewSchema = z.object({
  kind: z.enum(['CONFIRM', 'CORRECT']),
  resultingState: informationState,
  resultingValue: z.unknown().optional(),
  conflictExplanation: nullableText,
  reason: requiredText,
  evidenceLocators: z.array(evidenceLocatorSchema).default([]),
}).strict().superRefine((value, context) => {
  validateFactState({
    informationState: value.resultingState,
    assertedValue: value.resultingValue,
    conflictExplanation: value.conflictExplanation,
  }, context, 'resultingValue')
  if (value.kind === 'CONFIRM' && value.resultingState !== 'CONFIRMED') {
    context.addIssue({ code: 'custom', path: ['resultingState'], message: 'Review CONFIRM harus menghasilkan state CONFIRMED.' })
  }
})

const ciplItemSchema = z.object({
  lineNumber: z.number().int().positive(),
  description: requiredText,
  quantity: z.number().positive(),
  unit: requiredText.max(50),
  unitValue: z.number().nonnegative().nullable().optional(),
  currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/).nullable().optional(),
  grossWeightKg: z.number().nonnegative().nullable().optional(),
  netWeightKg: z.number().nonnegative().nullable().optional(),
  countryOfOrigin: countryCode,
  identifiers: z.array(requiredText).default([]),
  intendedUse: nullableText,
  intendedDisposal: nullableText,
}).strict()

const ciplVersionInput = z.object({
  sourceDocumentId: uuid,
  receivedAt: instant,
  revisionNote: nullableText,
  items: z.array(ciplItemSchema).min(1),
}).strict().superRefine((value, context) => {
  const lines = new Set<number>()
  for (const [index, item] of value.items.entries()) {
    if (lines.has(item.lineNumber)) context.addIssue({ code: 'custom', path: ['items', index, 'lineNumber'], message: 'lineNumber harus unik dalam satu versi CIPL.' })
    lines.add(item.lineNumber)
  }
})

export const createCiplSchema = z.object({
  eventExhibitorId: uuid,
  referenceNumber: nullableText,
  ...ciplVersionInput.shape,
}).strict().superRefine((value, context) => {
  const lines = new Set<number>()
  for (const [index, item] of value.items.entries()) {
    if (lines.has(item.lineNumber)) context.addIssue({ code: 'custom', path: ['items', index, 'lineNumber'], message: 'lineNumber harus unik dalam satu versi CIPL.' })
    lines.add(item.lineNumber)
  }
})
export const createCiplVersionSchema = ciplVersionInput
const shipmentAllocationSchema = z.object({
  ciplItemId: uuid,
  quantity: z.number().positive(),
  unit: requiredText.max(50),
}).strict()

export const createShipmentSchema = z.object({
  ciplVersionId: uuid,
  sourceDocumentId: uuid,
  documentType: z.enum(['BL', 'AWB']),
  documentNumber: requiredText,
  shipmentMode: z.enum(['FCL', 'LCL']).nullable().optional(),
  direction: z.enum(['IMPORT', 'EXPORT']),
  shipper: nullableText,
  consignee: nullableText,
  notifyParty: nullableText,
  carrier: nullableText,
  etaOrEtd: instant.nullable().optional(),
  origin: nullableText,
  destination: nullableText,
  legacyReference: nullableText,
  allocations: z.array(shipmentAllocationSchema).min(1),
}).strict().superRefine((value, context) => {
  const items = new Set<string>()
  for (const [index, allocation] of value.allocations.entries()) {
    if (items.has(allocation.ciplItemId)) context.addIssue({ code: 'custom', path: ['allocations', index, 'ciplItemId'], message: 'Item hanya boleh dialokasikan sekali per shipment.' })
    items.add(allocation.ciplItemId)
  }
})

const customsJobAllocationSchema = z.object({
  shipmentAllocationId: uuid,
  quantity: z.number().positive(),
  unit: requiredText.max(50),
}).strict()

export const createCustomsJobSchema = z.object({
  shipmentId: uuid,
  documentType: z.enum(['BC_2_3', 'BC_2_5', 'BC_3_0']),
  notes: nullableText,
  allocations: z.array(customsJobAllocationSchema).min(1),
}).strict().superRefine((value, context) => {
  const seen = new Set<string>()
  for (const [index, allocation] of value.allocations.entries()) {
    if (seen.has(allocation.shipmentAllocationId)) context.addIssue({ code: 'custom', path: ['allocations', index, 'shipmentAllocationId'], message: 'Setiap shipment allocation hanya boleh dialokasikan sekali per customs job.' })
    seen.add(allocation.shipmentAllocationId)
  }
})

const normalTransitions = ['DRAFT', 'PREPARING', 'SUBMITTED', 'REGISTERED', 'RELEASED', 'COMPLETED'] as const
const allStatuses = [...normalTransitions, 'ON_HOLD', 'CANCELLED'] as const
export type CustomsJobStatus = typeof allStatuses[number]

export const transitionCustomsJobSchema = z.discriminatedUnion('toStatus', [
  z.object({ toStatus: z.enum(['PREPARING', 'SUBMITTED', 'REGISTERED', 'RELEASED', 'COMPLETED']) }).strict(),
  z.object({ toStatus: z.literal('ON_HOLD'), reason: requiredText }).strict(),
  z.object({ toStatus: z.literal('CANCELLED'), reason: requiredText }).strict(),
  z.object({
    toStatus: z.literal('PREPARING'),
    reason: requiredText,
    evidenceSourceDocumentId: uuid,
  }).strict(),
])

export const resumeCustomsJobSchema = z.object({ reason: requiredText, evidenceSourceDocumentId: uuid }).strict()

export const createTicketSchema = z.object({
  contextKind: z.enum(['GENERAL', 'EVENT', 'CUSTOMS_JOB']),
  eventId: uuid.nullable().optional(),
  customsJobId: uuid.nullable().optional(),
  assigneeId: uuid.nullable().optional(),
  title: requiredText,
  description: nullableText,
  priority: z.enum(['NORMAL', 'URGENT']).default('NORMAL'),
}).superRefine((value, context) => {
  if (value.contextKind === 'GENERAL' && (value.eventId || value.customsJobId)) context.addIssue({ code: 'custom', message: 'General ticket tidak memiliki context ID.' })
  if (value.contextKind === 'EVENT' && (!value.eventId || value.customsJobId)) context.addIssue({ code: 'custom', message: 'Event ticket memerlukan eventId saja.' })
  if (value.contextKind === 'CUSTOMS_JOB' && (!value.customsJobId || value.eventId)) context.addIssue({ code: 'custom', message: 'Job ticket memerlukan customsJobId saja.' })
})
export const updateTicketSchema = z.object({
  title: requiredText.optional(), description: nullableText, assigneeId: uuid.nullable().optional(),
  priority: z.enum(['NORMAL', 'URGENT']).optional(), status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']).optional(),
  outcome: nullableText, reason: nullableText,
}).refine((value) => Object.keys(value).length > 0, 'Minimal satu field harus diberikan.').superRefine((value, context) => {
  if (value.status === 'DONE' && !value.outcome) context.addIssue({ code: 'custom', path: ['outcome'], message: 'Outcome wajib untuk DONE.' })
})
export const createTicketCommentSchema = z.object({ authorUserId: uuid, body: requiredText }).strict()
export const archiveSchema = reasonSchema
