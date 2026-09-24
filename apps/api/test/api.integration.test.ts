import { afterAll, describe, expect, test } from 'bun:test'
import { createApp } from '../src/app'
import { loadConfig } from '../src/config'
import { createDatabase } from '../src/db/client'

const database = createDatabase(loadConfig())
const app = createApp({ db: database.db, sql: database.client })
const ids: Record<string, string> = {}
let sequence = 0

function writeHeaders(key?: string) {
  sequence += 1
  return {
    'Content-Type': 'application/json', 'X-Actor-Ref': 'test:integration',
    'X-Source-Message-Id': `test-message-${sequence}`, 'Idempotency-Key': key ?? `integration-${crypto.randomUUID()}`,
  }
}

async function json<T>(path: string, init?: RequestInit): Promise<{ response: Response; body: T }> {
  const response = await app.request(`http://vss.local${path}`, init)
  return { response, body: await response.json() as T }
}

async function create(path: string, payload: unknown, key?: string) {
  return json<{ data: { id: string } }>(path, { method: 'POST', headers: writeHeaders(key), body: JSON.stringify(payload) })
}

afterAll(async () => {
  await database.client`delete from event_exhibitor_lifecycle_events where event_exhibitor_id in (select id from event_exhibitors where event_id = ${ids.event ?? '00000000-0000-0000-0000-000000000000'})`
  await database.client`delete from event_exhibitors where event_id = ${ids.event ?? '00000000-0000-0000-0000-000000000000'}`
  await database.client`delete from event_lifecycle_events where event_id = ${ids.event ?? '00000000-0000-0000-0000-000000000000'}`
  if (ids.event) await database.client`delete from events where id = ${ids.event}`
  if (ids.internationalExhibitor) await database.client`delete from exhibitor_contacts where exhibitor_id = ${ids.internationalExhibitor}`
  if (ids.contact) await database.client`delete from contacts where id = ${ids.contact}`
  if (ids.localExhibitor) await database.client`delete from exhibitors where id = ${ids.localExhibitor}`
  if (ids.internationalExhibitor) await database.client`delete from exhibitors where id = ${ids.internationalExhibitor}`
  if (ids.agent) await database.client`delete from agents where id = ${ids.agent}`
  if (ids.concurrentAgent) await database.client`delete from agents where id = ${ids.concurrentAgent}`
  if (ids.organizer) await database.client`delete from event_organizers where id = ${ids.organizer}`
  if (ids.venue) await database.client`delete from venues where id = ${ids.venue}`
  await database.client`delete from audit_events where actor_ref = 'test:integration'`
  await database.client`delete from idempotency_records where key like 'integration-%' or key = 'integration-replay-key'`
  await database.client.end()
})

describe('complete event domain', () => {
  test('creates masters, event, international participation, and preserves optional venue NPWP', async () => {
    const organizer = await create('/api/v1/event-organizers', { name: `Organizer ${crypto.randomUUID()}` })
    expect(organizer.response.status).toBe(201); ids.organizer = organizer.body.data.id

    const venue = await create('/api/v1/venues', { name: `Venue ${crypto.randomUUID()}`, address: null, npwp: null })
    expect(venue.response.status).toBe(201); ids.venue = venue.body.data.id

    const international = await create('/api/v1/exhibitors', { legalName: `Global ${crypto.randomUUID()}`, kind: 'INTERNATIONAL', countryCode: 'KR' })
    expect(international.response.status).toBe(201); ids.internationalExhibitor = international.body.data.id

    const local = await create('/api/v1/exhibitors', { legalName: `Local ${crypto.randomUUID()}`, kind: 'LOCAL', npwp: null })
    expect(local.response.status).toBe(201); ids.localExhibitor = local.body.data.id

    const agent = await create('/api/v1/agents', { name: `Agent ${crypto.randomUUID()}`, countryCode: 'KR' })
    expect(agent.response.status).toBe(201); ids.agent = agent.body.data.id

    const contact = await create(`/api/v1/exhibitors/${ids.internationalExhibitor}/contacts`, { name: 'International PIC', email: 'pic@example.test', isPrimary: true })
    expect(contact.response.status).toBe(201); ids.contact = contact.body.data.id

    const event = await create('/api/v1/events', {
      name: `Expo ${crypto.randomUUID()}`, startOn: '2026-12-02', endOn: '2026-12-05', eventOrganizerId: ids.organizer, venueId: ids.venue,
    })
    expect(event.response.status).toBe(201); ids.event = event.body.data.id

    const participation = await create(`/api/v1/events/${ids.event}/exhibitors`, { exhibitorId: ids.internationalExhibitor, agentId: ids.agent, primaryContactId: ids.contact, hall: 'A', booth: 'A-01' })
    expect(participation.response.status).toBe(201); ids.internationalParticipation = participation.body.data.id

    const detail = await json<{ data: Array<{ agent: { id: string }; primaryContact: { id: string } }> }>(`/api/v1/events/${ids.event}/exhibitors`)
    expect(detail.body.data[0]?.agent.id).toBe(ids.agent)
    expect(detail.body.data[0]?.primaryContact.id).toBe(ids.contact)
  })

  test('rejects an agent for a local exhibitor', async () => {
    let databaseError = ''
    try {
      await database.client`insert into event_exhibitors (event_id, exhibitor_id, agent_id) values (${ids.event!}, ${ids.localExhibitor!}, ${ids.agent!})`
    } catch (error) {
      databaseError = error instanceof Error ? error.message : String(error)
    }
    expect(databaseError).toContain('LOCAL_EXHIBITOR_AGENT_FORBIDDEN')

    const result = await create(`/api/v1/events/${ids.event}/exhibitors`, { exhibitorId: ids.localExhibitor, agentId: ids.agent })
    expect(result.response.status).toBe(422)
    expect((result.body as unknown as { error: { code: string } }).error.code).toBe('LOCAL_EXHIBITOR_AGENT_FORBIDDEN')
  })

  test('replays identical requests and rejects conflicting idempotency reuse', async () => {
    const key = 'integration-replay-key'
    const payload = { exhibitorId: ids.localExhibitor }
    const first = await create(`/api/v1/events/${ids.event}/exhibitors`, payload, key)
    const replay = await create(`/api/v1/events/${ids.event}/exhibitors`, payload, key)
    expect(first.response.status).toBe(201)
    expect(replay.response.status).toBe(201)
    expect(replay.body.data.id).toBe(first.body.data.id)
    ids.localParticipation = first.body.data.id
    const conflict = await create(`/api/v1/events/${ids.event}/exhibitors`, { ...payload, hall: 'Different' }, key)
    expect(conflict.response.status).toBe(409)
  })

  test('collapses concurrent retries to one committed mutation', async () => {
    const key = `integration-${crypto.randomUUID()}`
    const payload = { name: `Concurrent Agent ${crypto.randomUUID()}`, countryCode: 'SG' }
    const [first, second] = await Promise.all([create('/api/v1/agents', payload, key), create('/api/v1/agents', payload, key)])
    expect(first.response.status).toBe(201)
    expect(second.response.status).toBe(201)
    expect(second.body.data.id).toBe(first.body.data.id)
    ids.concurrentAgent = first.body.data.id
  })

  test('records lifecycle and blocks participation changes while cancelled', async () => {
    const cancel = await create(`/api/v1/events/${ids.event}/cancel`, { reason: 'Integration test cancellation' })
    expect(cancel.response.status).toBe(200)
    const blocked = await app.request(`http://vss.local/api/v1/event-exhibitors/${ids.localParticipation}`, {
      method: 'PATCH', headers: writeHeaders(), body: JSON.stringify({ booth: 'B-02' }),
    })
    expect(blocked.status).toBe(409)
    const reactivate = await create(`/api/v1/events/${ids.event}/reactivate`, { reason: 'Continue integration test' })
    expect(reactivate.response.status).toBe(200)
    const withdraw = await create(`/api/v1/event-exhibitors/${ids.localParticipation}/withdraw`, { reason: 'No longer participating' })
    expect(withdraw.response.status).toBe(200)
  })

  test('keeps archived venue history but rejects new references', async () => {
    const archived = await create(`/api/v1/venues/${ids.venue}/archive`, { reason: 'Venue no longer selectable' })
    expect(archived.response.status).toBe(200)
    const historical = await json<{ data: { venue: { id: string } } }>(`/api/v1/events/${ids.event}`)
    expect(historical.body.data.venue.id).toBe(ids.venue!)
    const rejected = await create('/api/v1/events', {
      name: 'Rejected archived venue', startOn: '2027-01-01', endOn: '2027-01-02', eventOrganizerId: ids.organizer, venueId: ids.venue,
    })
    expect(rejected.response.status).toBe(409)
    let databaseError = ''
    try {
      await database.client`insert into events (name, start_on, end_on, event_organizer_id, venue_id) values ('Rejected direct event', '2027-01-01', '2027-01-02', ${ids.organizer!}, ${ids.venue!})`
    } catch (error) {
      databaseError = error instanceof Error ? error.message : String(error)
    }
    expect(databaseError).toContain('ARCHIVED_VENUE')
  })

  test('writes an audit record for every successful mutation', async () => {
    const rows = await database.client<{ total: number }[]>`select count(*)::int as total from audit_events where actor_ref = 'test:integration'`
    expect(rows[0]?.total).toBeGreaterThanOrEqual(12)
  })
})
