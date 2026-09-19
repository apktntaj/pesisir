import { afterAll, describe, expect, test } from 'bun:test'
import { eq } from 'drizzle-orm'
import { createApp } from '../src/app'
import { loadConfig } from '../src/config'
import { createDatabase } from '../src/db/client'
import { contacts, eventOrganizers, events, venues } from '../src/db/schema'

const database = createDatabase(loadConfig())
const app = createApp({ db: database.db, sql: database.client })

type ApiData<T> = { data: T }
type CreatedRecords = { organizerId?: string; venueId?: string; contactId?: string; eventId?: string }

const created: CreatedRecords = {}

async function requestJson<T>(path: string, init?: RequestInit): Promise<{ response: Response; body: T }> {
  const response = await app.request(`http://vss.local${path}`, init)
  return { response, body: await response.json() as T }
}

afterAll(async () => {
  if (created.eventId) await database.db.delete(events).where(eq(events.id, created.eventId))
  if (created.organizerId) await database.db.delete(eventOrganizers).where(eq(eventOrganizers.id, created.organizerId))
  if (created.venueId) await database.db.delete(venues).where(eq(venues.id, created.venueId))
  if (created.contactId) await database.db.delete(contacts).where(eq(contacts.id, created.contactId))
  await database.client.end()
})

describe('operations API', () => {
  test('creates a linked event, returns contacts, and protects referenced parents', async () => {
    const organizerResult = await requestJson<ApiData<{ id: string }>>('/api/v1/event-organizers', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Pamerindo' }),
    })
    expect(organizerResult.response.status).toBe(201)
    created.organizerId = organizerResult.body.data.id

    const venueResult = await requestJson<ApiData<{ id: string }>>('/api/v1/venues', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'JIExpo', address: 'Kemayoran' }),
    })
    expect(venueResult.response.status).toBe(201)
    created.venueId = venueResult.body.data.id

    const contactResult = await requestJson<ApiData<{ id: string }>>(`/api/v1/event-organizers/${organizerResult.body.data.id}/contacts`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Budi', contact: '+6281234567890' }),
    })
    expect(contactResult.response.status).toBe(201)

    created.contactId = contactResult.body.data.id
    const eventResult = await requestJson<ApiData<{ id: string }>>('/api/v1/events', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Manufacturing Indonesia 2026', startOn: '2026-12-02', endOn: '2026-12-05',
        eventOrganizerId: organizerResult.body.data.id, venueId: venueResult.body.data.id,
      }),
    })
    expect(eventResult.response.status).toBe(201)

    created.eventId = eventResult.body.data.id
    const detail = await requestJson<ApiData<{ eventOrganizer: { id: string }; venue: { id: string } }>>(`/api/v1/events/${eventResult.body.data.id}`)
    expect(detail.response.status).toBe(200)
    expect(detail.body.data.eventOrganizer.id).toBe(organizerResult.body.data.id)
    expect(detail.body.data.venue.id).toBe(venueResult.body.data.id)

    const organizerDetail = await requestJson<ApiData<{ contacts: Array<{ id: string; name: string; contact: string; createdAt: string; updatedAt: string }> }>>(`/api/v1/event-organizers/${organizerResult.body.data.id}`)
    expect(organizerDetail.body.data.contacts).toEqual([{ id: contactResult.body.data.id, name: 'Budi', contact: '+6281234567890', createdAt: expect.any(String), updatedAt: expect.any(String) }])

    const deleteVenue = await app.request(`http://vss.local/api/v1/venues/${venueResult.body.data.id}`, { method: 'DELETE' })
    expect(deleteVenue.status).toBe(409)

    const invalidEvent = await app.request('http://vss.local/api/v1/events', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Invalid', startOn: '2026-12-05', endOn: '2026-12-04', eventOrganizerId: organizerResult.body.data.id, venueId: venueResult.body.data.id }),
    })
    expect(invalidEvent.status).toBe(422)
  })
})
