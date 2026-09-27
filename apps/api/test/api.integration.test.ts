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
  if (ids.cipl) await database.client`delete from shipment_allocations where shipment_id in (select id from shipments where cipl_version_id in (select id from cipl_versions where cipl_id = ${ids.cipl}))`
  if (ids.cipl) await database.client`delete from shipments where cipl_version_id in (select id from cipl_versions where cipl_id = ${ids.cipl})`
  if (ids.cipl) await database.client`update cipls set active_version_id = null where id = ${ids.cipl}`
  if (ids.cipl) await database.client`delete from cipl_items where cipl_version_id in (select id from cipl_versions where cipl_id = ${ids.cipl})`
  if (ids.cipl) await database.client`delete from cipl_versions where cipl_id = ${ids.cipl}`
  if (ids.cipl) await database.client`delete from cipls where id = ${ids.cipl}`
  if (ids.extractionFact) await database.client`delete from document_extraction_fact_reviews where extraction_fact_id = ${ids.extractionFact}`
  if (ids.extraction) await database.client`delete from document_extraction_facts where extraction_id = ${ids.extraction}`
  if (ids.extraction) await database.client`delete from document_extractions where id = ${ids.extraction}`
  if (ids.provenanceDocument) await database.client`delete from source_documents where id = ${ids.provenanceDocument}`
  if (ids.sourceDocument) await database.client`delete from source_documents where id = ${ids.sourceDocument}`
  if (ids.sourceMessage) await database.client`delete from source_messages where id = ${ids.sourceMessage}`
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

describe('source lineage', () => {
  test('preserves a WhatsApp message, its attachment metadata, and original bytes', async () => {
    const externalMessageId = `wamid.${crypto.randomUUID()}`
    const sourceMessage = await create('/api/v1/source-messages', {
      channel: 'WHATSAPP',
      externalMessageId,
      conversationRef: 'whatsapp:test-group',
      senderRef: 'whatsapp:test-user',
      occurredAt: '2026-09-25T08:00:00.000Z',
      bodyText: 'Invoice attached',
    })
    expect(sourceMessage.response.status).toBe(201)
    ids.sourceMessage = sourceMessage.body.data.id

    const original = new TextEncoder().encode('source invoice bytes')
    const sourceDocument = await json<{ data: { id: string; byteSize: number; sha256: string; content?: unknown } }>(
      '/api/v1/source-documents',
      {
        method: 'POST',
        headers: writeHeaders(),
        body: JSON.stringify({
          sourceKind: 'WHATSAPP_ATTACHMENT',
          sourceMessageId: ids.sourceMessage,
          fileName: 'invoice.pdf',
          mimeType: 'application/pdf',
          contentBase64: Buffer.from(original).toString('base64'),
          receivedAt: '2026-09-25T08:00:01.000Z',
        }),
      },
    )
    expect(sourceDocument.response.status).toBe(201)
    expect(sourceDocument.body.data.byteSize).toBe(original.byteLength)
    expect(sourceDocument.body.data.sha256).toHaveLength(64)
    expect(sourceDocument.body.data.content).toBeUndefined()
    ids.sourceDocument = sourceDocument.body.data.id

    const content = await app.request(`http://vss.local/api/v1/source-documents/${ids.sourceDocument}/content`)
    expect(content.status).toBe(200)
    expect(content.headers.get('content-type')).toBe('application/pdf')
    expect(new Uint8Array(await content.arrayBuffer())).toEqual(original)

    const duplicate = await create('/api/v1/source-messages', {
      channel: 'WHATSAPP',
      externalMessageId,
      conversationRef: 'whatsapp:test-group',
      senderRef: 'whatsapp:test-user',
      occurredAt: '2026-09-25T08:00:00.000Z',
    })
    expect(duplicate.response.status).toBe(409)
  })
})

describe('extraction provenance', () => {
  test('persists information states, evidence, reviews, and idempotent retries', async () => {
    const document = await create('/api/v1/source-documents', {
      sourceKind: 'MANUAL_UPLOAD',
      fileName: 'provenance-invoice.pdf',
      mimeType: 'application/pdf',
      contentBase64: Buffer.from('provenance invoice bytes').toString('base64'),
      receivedAt: '2026-09-25T10:00:00.000Z',
    })
    expect(document.response.status).toBe(201)
    ids.provenanceDocument = document.body.data.id

    const key = 'integration-extraction-replay'
    const payload = {
      facts: [
        {
          field: 'invoice.number',
          informationState: 'SOURCE_BACKED',
          assertedValue: 'INV-001',
          evidenceLocators: [{ kind: 'PDF_PAGE', reference: { page: 1 }, excerpt: 'Invoice INV-001' }],
        },
        {
          field: 'currency',
          informationState: 'INFERRED',
          assertedValue: 'USD',
          confidencePercent: 82,
        },
        {
          field: 'consignee.name',
          informationState: 'UNKNOWN',
        },
        {
          field: 'weight.gross',
          informationState: 'CONFLICTING',
          conflictExplanation: 'Invoice and packing list differ.',
          evidenceLocators: [{ kind: 'PDF_PAGE', reference: { page: 2 } }],
        },
      ],
    }
    const first = await json<{ data: { id: string; facts: Array<{ id: string; field: string; evidenceLocators: unknown }> } }>(
      `/api/v1/source-documents/${ids.provenanceDocument}/extractions`,
      { method: 'POST', headers: writeHeaders(key), body: JSON.stringify(payload) },
    )
    const replay = await json<{ data: { id: string } }>(`/api/v1/source-documents/${ids.provenanceDocument}/extractions`, {
      method: 'POST', headers: writeHeaders(key), body: JSON.stringify(payload),
    })
    expect(first.response.status).toBe(201)
    expect(replay.response.status).toBe(201)
    expect(replay.body.data.id).toBe(first.body.data.id)
    ids.extraction = first.body.data.id
    const extractionFact = first.body.data.facts.find((fact) => fact.field === 'currency')
    if (!extractionFact) throw new Error('Expected currency fact in extraction response.')
    ids.extractionFact = extractionFact.id

    const conflict = await json<{ error: { code: string } }>(`/api/v1/source-documents/${ids.provenanceDocument}/extractions`, {
      method: 'POST', headers: writeHeaders(key), body: JSON.stringify({ facts: [payload.facts[0]] }),
    })
    expect(conflict.response.status).toBe(409)
    expect(conflict.body.error.code).toBe('IDEMPOTENCY_CONFLICT')

    const review = await json<{ data: { resultingState: string; resultingValue: string } }>(`/api/v1/extraction-facts/${ids.extractionFact}/reviews`, {
      method: 'POST',
      headers: writeHeaders(),
      body: JSON.stringify({
        kind: 'CONFIRM',
        resultingState: 'CONFIRMED',
        resultingValue: 'USD',
        reason: 'Confirmed by commercial invoice review.',
        evidenceLocators: [{ kind: 'PDF_PAGE', reference: { page: 1 } }],
      }),
    })
    expect(review.response.status).toBe(201)
    expect(review.body.data.resultingState).toBe('CONFIRMED')

    const detail = await json<{ data: { facts: Array<{ field: string; reviews: Array<{ resultingValue: string }>; evidenceLocators: unknown }> } }>(`/api/v1/extractions/${ids.extraction}`)
    expect(detail.response.status).toBe(200)
    const currency = detail.body.data.facts.find((fact) => fact.field === 'currency')
    expect(currency?.reviews[0]?.resultingValue).toBe('USD')
    const invoice = detail.body.data.facts.find((fact) => fact.field === 'invoice.number')
    expect(invoice?.evidenceLocators).toEqual([{ kind: 'PDF_PAGE', reference: { page: 1 }, excerpt: 'Invoice INV-001' }])
    expect('content' in detail.body.data).toBeFalse()
  })

  test('rejects invalid fact combinations and unknown source documents without partial writes', async () => {
    const invalid = await json<{ error: { code: string } }>(`/api/v1/source-documents/${ids.provenanceDocument}/extractions`, {
      method: 'POST',
      headers: writeHeaders(),
      body: JSON.stringify({ facts: [{ field: 'consignee.name', informationState: 'UNKNOWN', assertedValue: 'PT Example' }] }),
    })
    expect(invalid.response.status).toBe(422)
    expect(invalid.body.error.code).toBe('VALIDATION_ERROR')

    const missing = await json<{ error: { code: string } }>('/api/v1/source-documents/00000000-0000-4000-8000-000000000001/extractions', {
      method: 'POST',
      headers: writeHeaders(),
      body: JSON.stringify({ facts: [{ field: 'invoice.number', informationState: 'SOURCE_BACKED', assertedValue: 'INV-404' }] }),
    })
    expect(missing.response.status).toBe(404)
    const extractions = await json<{ meta: { total: number } }>(`/api/v1/source-documents/${ids.provenanceDocument}/extractions`)
    expect(extractions.response.status).toBe(200)
    expect(extractions.body.meta.total).toBe(1)
  })
})

describe('CIPL versions', () => {
  test('preserves immutable revisions and selects a ready active version', async () => {
    const initial = await json<{ data: { id: string; versions: Array<{ id: string; versionNumber: number }> } }>('/api/v1/cipls', {
      method: 'POST', headers: writeHeaders(), body: JSON.stringify({
        eventExhibitorId: ids.internationalParticipation,
        referenceNumber: 'CIPL-001',
        sourceDocumentId: ids.sourceDocument,
        receivedAt: '2026-09-25T09:00:00.000Z',
        items: [{ lineNumber: 1, description: 'Display stand', quantity: 2, unit: 'PCS' }],
      }),
    })
    expect(initial.response.status).toBe(201)
    ids.cipl = initial.body.data.id
    const firstVersion = initial.body.data.versions[0]
    if (!firstVersion) throw new Error('Expected initial CIPL version.')
    const ready = await json<{ data: { status: string; cipl: { activeVersionId: string } } }>(`/api/v1/cipl-versions/${firstVersion.id}/ready`, { method: 'POST', headers: writeHeaders(), body: '{}' })
    expect(ready.response.status).toBe(200)
    expect(ready.body.data.cipl.activeVersionId).toBe(firstVersion.id)
    const revision = await json<{ data: { id: string; versionNumber: number } }>(`/api/v1/cipls/${ids.cipl}/versions`, {
      method: 'POST', headers: writeHeaders(), body: JSON.stringify({
        sourceDocumentId: ids.sourceDocument, receivedAt: '2026-09-25T10:00:00.000Z',
        revisionNote: 'Corrected quantity.', items: [{ lineNumber: 1, description: 'Display stand', quantity: 3, unit: 'PCS' }],
      }),
    })
    expect(revision.response.status).toBe(201)
    ids.readyCiplVersion = revision.body.data.id
    expect(revision.body.data.versionNumber).toBe(2)
    await json(`/api/v1/cipl-versions/${revision.body.data.id}/ready`, { method: 'POST', headers: writeHeaders(), body: '{}' })
    const detail = await json<{ data: { activeVersionId: string; versions: Array<{ versionNumber: number; items: Array<{ quantity: number }> }> } }>(`/api/v1/cipls/${ids.cipl}`)
    expect(detail.body.data.activeVersionId).toBe(revision.body.data.id)
    expect(detail.body.data.versions[0]?.items[0]?.quantity).toBe(2)
    expect(detail.body.data.versions[1]?.items[0]?.quantity).toBe(3)
  })
})

describe('shipment allocations', () => {
  test('accepts allocations from a ready CIPL version and rejects over-allocation', async () => {
    const cipl = await json<{ data: { versions: Array<{ id: string; items: Array<{ id: string; unit: string }> }> } }>(`/api/v1/cipls/${ids.cipl}`)
    const version = cipl.body.data.versions.find((value) => value.id === ids.readyCiplVersion)
    const item = version?.items[0]
    if (!item) throw new Error('Expected ready CIPL item.')
    const payload = { ciplVersionId: ids.readyCiplVersion, sourceDocumentId: ids.sourceDocument, documentType: 'BL', documentNumber: 'BL-001', direction: 'IMPORT', allocations: [{ ciplItemId: item.id, quantity: 3, unit: item.unit }] }
    const first = await create('/api/v1/shipments', payload)
    expect(first.response.status).toBe(201)
    const excess = await create('/api/v1/shipments', { ...payload, documentNumber: 'BL-002', allocations: [{ ...payload.allocations[0], quantity: 1 }] })
    expect(excess.response.status).toBe(409)
  })
})
