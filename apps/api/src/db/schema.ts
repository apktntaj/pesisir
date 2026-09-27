import { boolean, customType, doublePrecision, index, integer, jsonb, pgTable, primaryKey, text, date, timestamp, unique, uuid } from 'drizzle-orm/pg-core'

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}

const bytea = customType<{ data: Uint8Array }>({
  dataType() {
    return 'bytea'
  },
})

export const eventOrganizers = pgTable('event_organizers', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  npwp: text('npwp'),
  address: text('address'),
  website: text('website'),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  archivedByActorRef: text('archived_by_actor_ref'),
  archiveReason: text('archive_reason'),
  ...timestamps,
})

export const venues = pgTable('venues', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  address: text('address'),
  npwp: text('npwp'),
  website: text('website'),
  loadingAccessNotes: text('loading_access_notes'),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  archivedByActorRef: text('archived_by_actor_ref'),
  archiveReason: text('archive_reason'),
  ...timestamps,
})

export const contacts = pgTable('contacts', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  legacyContact: text('legacy_contact'),
  role: text('role'),
  email: text('email'),
  phone: text('phone'),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  ...timestamps,
})

export const eventOrganizerContacts = pgTable('event_organizer_contacts', {
  eventOrganizerId: uuid('event_organizer_id').notNull().references(() => eventOrganizers.id, { onDelete: 'cascade' }),
  contactId: uuid('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),
  isPrimary: boolean('is_primary').notNull().default(false),
}, (table) => [primaryKey({ columns: [table.eventOrganizerId, table.contactId] })])

export const venueContacts = pgTable('venue_contacts', {
  venueId: uuid('venue_id').notNull().references(() => venues.id, { onDelete: 'cascade' }),
  contactId: uuid('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),
  isPrimary: boolean('is_primary').notNull().default(false),
}, (table) => [primaryKey({ columns: [table.venueId, table.contactId] })])

export const events = pgTable('events', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  alias: text('alias'),
  notes: text('notes'),
  status: text('status', { enum: ['ACTIVE', 'CANCELLED'] }).notNull().default('ACTIVE'),
  startOn: date('start_on', { mode: 'string' }).notNull(),
  endOn: date('end_on', { mode: 'string' }).notNull(),
  eventOrganizerId: uuid('event_organizer_id').notNull().references(() => eventOrganizers.id, { onDelete: 'restrict' }),
  venueId: uuid('venue_id').notNull().references(() => venues.id, { onDelete: 'restrict' }),
  ...timestamps,
}, (table) => [
  index('events_event_organizer_id_idx').on(table.eventOrganizerId),
  index('events_venue_id_idx').on(table.venueId),
  index('events_start_on_idx').on(table.startOn),
])

export const exhibitors = pgTable('exhibitors', {
  id: uuid('id').defaultRandom().primaryKey(), legalName: text('legal_name').notNull(), alias: text('alias'),
  kind: text('kind', { enum: ['LOCAL', 'INTERNATIONAL'] }).notNull(), npwp: text('npwp'), countryCode: text('country_code'),
  address: text('address'), website: text('website'), archivedAt: timestamp('archived_at', { withTimezone: true }),
  archivedByActorRef: text('archived_by_actor_ref'), archiveReason: text('archive_reason'), ...timestamps,
}, (table) => [index('exhibitors_legal_name_idx').on(table.legalName), index('exhibitors_kind_idx').on(table.kind)])

export const agents = pgTable('agents', {
  id: uuid('id').defaultRandom().primaryKey(), name: text('name').notNull(), countryCode: text('country_code'), address: text('address'),
  website: text('website'), archivedAt: timestamp('archived_at', { withTimezone: true }), archivedByActorRef: text('archived_by_actor_ref'),
  archiveReason: text('archive_reason'), ...timestamps,
}, (table) => [index('agents_name_idx').on(table.name)])

export const exhibitorContacts = pgTable('exhibitor_contacts', {
  exhibitorId: uuid('exhibitor_id').notNull().references(() => exhibitors.id, { onDelete: 'restrict' }),
  contactId: uuid('contact_id').notNull().references(() => contacts.id, { onDelete: 'restrict' }),
  isPrimary: boolean('is_primary').notNull().default(false),
}, (table) => [primaryKey({ columns: [table.exhibitorId, table.contactId] })])

export const agentContacts = pgTable('agent_contacts', {
  agentId: uuid('agent_id').notNull().references(() => agents.id, { onDelete: 'restrict' }),
  contactId: uuid('contact_id').notNull().references(() => contacts.id, { onDelete: 'restrict' }),
  isPrimary: boolean('is_primary').notNull().default(false),
}, (table) => [primaryKey({ columns: [table.agentId, table.contactId] })])

export const eventExhibitors = pgTable('event_exhibitors', {
  id: uuid('id').defaultRandom().primaryKey(), eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'restrict' }),
  exhibitorId: uuid('exhibitor_id').notNull().references(() => exhibitors.id, { onDelete: 'restrict' }),
  agentId: uuid('agent_id').references(() => agents.id, { onDelete: 'restrict' }), primaryContactId: uuid('primary_contact_id').references(() => contacts.id, { onDelete: 'restrict' }),
  hall: text('hall'), booth: text('booth'), notes: text('notes'), status: text('status', { enum: ['ACTIVE', 'WITHDRAWN'] }).notNull().default('ACTIVE'), ...timestamps,
}, (table) => [
  unique('event_exhibitors_event_exhibitor_unique').on(table.eventId, table.exhibitorId), index('event_exhibitors_event_idx').on(table.eventId),
  index('event_exhibitors_exhibitor_idx').on(table.exhibitorId), index('event_exhibitors_agent_idx').on(table.agentId),
])

export const eventLifecycleEvents = pgTable('event_lifecycle_events', {
  id: uuid('id').defaultRandom().primaryKey(), eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'restrict' }),
  fromStatus: text('from_status').notNull(), toStatus: text('to_status').notNull(), reason: text('reason').notNull(), actorRef: text('actor_ref').notNull(),
  sourceMessageId: text('source_message_id'), occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
})

export const eventExhibitorLifecycleEvents = pgTable('event_exhibitor_lifecycle_events', {
  id: uuid('id').defaultRandom().primaryKey(), eventExhibitorId: uuid('event_exhibitor_id').notNull().references(() => eventExhibitors.id, { onDelete: 'restrict' }),
  fromStatus: text('from_status').notNull(), toStatus: text('to_status').notNull(), reason: text('reason').notNull(), actorRef: text('actor_ref').notNull(),
  sourceMessageId: text('source_message_id'), occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
})

export const sourceMessages = pgTable('source_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  channel: text('channel', { enum: ['WHATSAPP'] }).notNull(),
  externalMessageId: text('external_message_id').notNull(),
  conversationRef: text('conversation_ref').notNull(),
  senderRef: text('sender_ref').notNull(),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
  bodyText: text('body_text'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique('source_messages_channel_external_unique').on(table.channel, table.externalMessageId),
  index('source_messages_conversation_occurred_idx').on(table.conversationRef, table.occurredAt),
])

export const sourceDocuments = pgTable('source_documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  sourceKind: text('source_kind', { enum: ['WHATSAPP_ATTACHMENT', 'MANUAL_UPLOAD'] }).notNull(),
  sourceMessageId: uuid('source_message_id').references(() => sourceMessages.id, { onDelete: 'restrict' }),
  fileName: text('file_name').notNull(),
  mimeType: text('mime_type', { enum: [
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'image/jpeg',
    'image/png',
  ] }).notNull(),
  byteSize: integer('byte_size').notNull(),
  sha256: text('sha256').notNull(),
  content: bytea('content').notNull(),
  receivedAt: timestamp('received_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('source_documents_message_idx').on(table.sourceMessageId),
  index('source_documents_sha256_idx').on(table.sha256),
  index('source_documents_received_idx').on(table.receivedAt),
])

export const documentExtractions = pgTable('document_extractions', {
  id: uuid('id').defaultRandom().primaryKey(),
  sourceDocumentId: uuid('source_document_id').notNull().references(() => sourceDocuments.id, { onDelete: 'restrict' }),
  submittedByActorRef: text('submitted_by_actor_ref').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index('document_extractions_source_document_idx').on(table.sourceDocumentId, table.createdAt)])

export const documentExtractionFacts = pgTable('document_extraction_facts', {
  id: uuid('id').defaultRandom().primaryKey(),
  extractionId: uuid('extraction_id').notNull().references(() => documentExtractions.id, { onDelete: 'restrict' }),
  field: text('field').notNull(),
  informationState: text('information_state', { enum: ['SOURCE_BACKED', 'CONFIRMED', 'INFERRED', 'UNKNOWN', 'CONFLICTING', 'NOT_APPLICABLE'] }).notNull(),
  assertedValue: jsonb('asserted_value'),
  confidencePercent: integer('confidence_percent'),
  conflictExplanation: text('conflict_explanation'),
  evidenceLocators: jsonb('evidence_locators').notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique('document_extraction_facts_extraction_field_unique').on(table.extractionId, table.field),
  index('document_extraction_facts_extraction_idx').on(table.extractionId, table.createdAt),
])

export const documentExtractionFactReviews = pgTable('document_extraction_fact_reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  extractionFactId: uuid('extraction_fact_id').notNull().references(() => documentExtractionFacts.id, { onDelete: 'restrict' }),
  kind: text('kind', { enum: ['CONFIRM', 'CORRECT'] }).notNull(),
  resultingState: text('resulting_state', { enum: ['SOURCE_BACKED', 'CONFIRMED', 'INFERRED', 'UNKNOWN', 'CONFLICTING', 'NOT_APPLICABLE'] }).notNull(),
  resultingValue: jsonb('resulting_value'),
  conflictExplanation: text('conflict_explanation'),
  reason: text('reason').notNull(),
  evidenceLocators: jsonb('evidence_locators').notNull().default([]),
  reviewedByActorRef: text('reviewed_by_actor_ref').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index('document_extraction_fact_reviews_fact_idx').on(table.extractionFactId, table.createdAt)])

export const cipls = pgTable('cipls', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventExhibitorId: uuid('event_exhibitor_id').notNull().references(() => eventExhibitors.id, { onDelete: 'restrict' }),
  referenceNumber: text('reference_number'),
  status: text('status', { enum: ['AWAITING_DOCUMENT', 'RECEIVED', 'UNDER_REVIEW', 'READY', 'ON_HOLD', 'CANCELLED'] }).notNull(),
  activeVersionId: uuid('active_version_id'),
  ...timestamps,
})

export const ciplVersions = pgTable('cipl_versions', {
  id: uuid('id').defaultRandom().primaryKey(),
  ciplId: uuid('cipl_id').notNull().references(() => cipls.id, { onDelete: 'restrict' }),
  versionNumber: integer('version_number').notNull(),
  status: text('status', { enum: ['DRAFT', 'READY'] }).notNull(),
  sourceDocumentId: uuid('source_document_id').notNull().references(() => sourceDocuments.id, { onDelete: 'restrict' }),
  receivedAt: timestamp('received_at', { withTimezone: true }).notNull(),
  receivedByActorRef: text('received_by_actor_ref').notNull(),
  revisionNote: text('revision_note'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [unique('cipl_versions_cipl_version_unique').on(table.ciplId, table.versionNumber), index('cipl_versions_cipl_idx').on(table.ciplId, table.versionNumber)])

export const ciplItems = pgTable('cipl_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  ciplVersionId: uuid('cipl_version_id').notNull().references(() => ciplVersions.id, { onDelete: 'restrict' }),
  lineNumber: integer('line_number').notNull(),
  description: text('description').notNull(),
  quantity: doublePrecision('quantity').notNull(),
  unit: text('unit').notNull(),
  unitValue: doublePrecision('unit_value'),
  currency: text('currency'),
  grossWeightKg: doublePrecision('gross_weight_kg'),
  netWeightKg: doublePrecision('net_weight_kg'),
  countryOfOrigin: text('country_of_origin'),
  identifiers: jsonb('identifiers').notNull().default([]),
  intendedUse: text('intended_use'),
  intendedDisposal: text('intended_disposal'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [unique('cipl_items_version_line_unique').on(table.ciplVersionId, table.lineNumber), index('cipl_items_version_idx').on(table.ciplVersionId, table.lineNumber)])

export const shipments = pgTable('shipments', {
  id: uuid('id').defaultRandom().primaryKey(),
  ciplVersionId: uuid('cipl_version_id').notNull().references(() => ciplVersions.id, { onDelete: 'restrict' }),
  sourceDocumentId: uuid('source_document_id').notNull().references(() => sourceDocuments.id, { onDelete: 'restrict' }),
  documentType: text('document_type', { enum: ['BL', 'AWB'] }).notNull(),
  documentNumber: text('document_number').notNull(),
  shipmentMode: text('shipment_mode', { enum: ['FCL', 'LCL'] }),
  direction: text('direction', { enum: ['IMPORT', 'EXPORT'] }).notNull(),
  shipper: text('shipper'), consignee: text('consignee'), notifyParty: text('notify_party'), carrier: text('carrier'),
  etaOrEtd: timestamp('eta_or_etd', { withTimezone: true }), origin: text('origin'), destination: text('destination'), legacyReference: text('legacy_reference'),
  status: text('status', { enum: ['DRAFT', 'DOCUMENT_RECEIVED', 'UNDER_REVIEW', 'READY_FOR_CUSTOMS', 'ON_HOLD', 'CANCELLED'] }).notNull(),
  ...timestamps,
}, (table) => [index('shipments_cipl_version_idx').on(table.ciplVersionId)])

export const shipmentAllocations = pgTable('shipment_allocations', {
  id: uuid('id').defaultRandom().primaryKey(),
  shipmentId: uuid('shipment_id').notNull().references(() => shipments.id, { onDelete: 'restrict' }),
  ciplItemId: uuid('cipl_item_id').notNull().references(() => ciplItems.id, { onDelete: 'restrict' }),
  quantity: doublePrecision('quantity').notNull(),
  unit: text('unit').notNull(),
}, (table) => [unique('shipment_allocations_shipment_item_unique').on(table.shipmentId, table.ciplItemId), index('shipment_allocations_item_idx').on(table.ciplItemId)])

export const users = pgTable('users', { id: uuid('id').defaultRandom().primaryKey(), name: text('name').notNull(), email: text('email').notNull(), passwordHash: text('password_hash').notNull(), isActive: boolean('is_active').notNull(), ...timestamps })
export const userRoles = pgTable('user_roles', { userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'restrict' }), role: text('role').notNull() }, (table) => [primaryKey({ columns: [table.userId, table.role] })])
export const tickets = pgTable('tickets', { id: uuid('id').defaultRandom().primaryKey(), contextKind: text('context_kind').notNull(), eventId: uuid('event_id').references(() => events.id), customsJobId: uuid('customs_job_id'), assigneeId: uuid('assignee_id').references(() => users.id), title: text('title').notNull(), description: text('description'), priority: text('priority').notNull(), status: text('status').notNull(), outcome: text('outcome'), createdByUserId: uuid('created_by_user_id').references(() => users.id), ...timestamps })
export const ticketActivities = pgTable('ticket_activities', { id: uuid('id').defaultRandom().primaryKey(), ticketId: uuid('ticket_id').notNull().references(() => tickets.id, { onDelete: 'restrict' }), kind: text('kind').notNull(), actorUserId: uuid('actor_user_id').references(() => users.id), summary: text('summary').notNull(), occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow() })
export const ticketComments = pgTable('ticket_comments', { id: uuid('id').defaultRandom().primaryKey(), ticketId: uuid('ticket_id').notNull().references(() => tickets.id, { onDelete: 'restrict' }), authorUserId: uuid('author_user_id').notNull().references(() => users.id), body: text('body').notNull(), createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow() })
export const auditEvents = pgTable('audit_events', {
  id: uuid('id').defaultRandom().primaryKey(), entityType: text('entity_type').notNull(), entityId: uuid('entity_id').notNull(), action: text('action').notNull(),
  beforeData: jsonb('before_data'), afterData: jsonb('after_data'), actorRef: text('actor_ref').notNull(), sourceMessageId: text('source_message_id'),
  idempotencyKey: text('idempotency_key').notNull(), occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index('audit_events_entity_idx').on(table.entityType, table.entityId, table.occurredAt)])

export const idempotencyRecords = pgTable('idempotency_records', {
  key: text('key').primaryKey(), method: text('method').notNull(), path: text('path').notNull(), requestHash: text('request_hash').notNull(),
  responseStatus: integer('response_status').notNull(), responseBody: jsonb('response_body').notNull(), createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
