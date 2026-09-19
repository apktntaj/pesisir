import { index, pgTable, primaryKey, text, date, timestamp, uuid } from 'drizzle-orm/pg-core'

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}

export const eventOrganizers = pgTable('event_organizers', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  ...timestamps,
})

export const venues = pgTable('venues', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  address: text('address').notNull(),
  ...timestamps,
})

export const contacts = pgTable('contacts', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  contact: text('contact').notNull(),
  ...timestamps,
})

export const eventOrganizerContacts = pgTable('event_organizer_contacts', {
  eventOrganizerId: uuid('event_organizer_id').notNull().references(() => eventOrganizers.id, { onDelete: 'cascade' }),
  contactId: uuid('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),
}, (table) => [primaryKey({ columns: [table.eventOrganizerId, table.contactId] })])

export const venueContacts = pgTable('venue_contacts', {
  venueId: uuid('venue_id').notNull().references(() => venues.id, { onDelete: 'cascade' }),
  contactId: uuid('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),
}, (table) => [primaryKey({ columns: [table.venueId, table.contactId] })])

export const events = pgTable('events', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
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
