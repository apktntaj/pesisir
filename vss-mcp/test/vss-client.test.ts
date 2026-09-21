import { describe, expect, test } from 'bun:test'
import type { Config } from '../src/config'
import { VssApiError, VssClient, type Fetcher } from '../src/vss-client'

const config: Config = {
  VSS_API_BASE_URL: 'https://vss.example.test',
  VSS_API_TOKEN: 'secret',
  VSS_DEFAULT_EVENT_ORGANIZER_ID: '00000000-0000-4000-8000-000000000001',
  VSS_DEFAULT_VENUE_ID: '00000000-0000-4000-8000-000000000002',
}

describe('VssClient', () => {
  test('creates an event using configured organizer and venue defaults', async () => {
    const requests: Request[] = []
    const fetcher: Fetcher = async (input, init) => {
      const request = new Request(input, init)
      requests.push(request.clone())
      return Response.json({ data: { id: 'event-1', ...(await request.json()) } }, { status: 201 })
    }
    const client = new VssClient(config, fetcher)

    const event = await client.createEvent({ name: 'Test Expo', startOn: '2026-10-10', endOn: '2026-10-12' })

    expect(event.id).toBe('event-1')
    expect(await requests[0]!.json()).toEqual({
      name: 'Test Expo',
      startOn: '2026-10-10',
      endOn: '2026-10-12',
      eventOrganizerId: config.VSS_DEFAULT_EVENT_ORGANIZER_ID,
      venueId: config.VSS_DEFAULT_VENUE_ID,
    })
    expect(requests[0]!.headers.get('authorization')).toBe('Bearer secret')
  })

  test('lists events with pagination', async () => {
    const fetcher: Fetcher = async (input) => {
      expect(String(input)).toBe('https://vss.example.test/api/v1/events?limit=10&offset=20')
      return Response.json({ data: [], meta: { limit: 10, offset: 20, total: 0 } })
    }
    const result = await new VssClient(config, fetcher).listEvents(10, 20)
    expect(result.meta.total).toBe(0)
  })

  test('preserves API errors for the agent', async () => {
    const fetcher: Fetcher = async () => Response.json({
      error: { code: 'NOT_FOUND', message: 'Event tidak ditemukan.' },
    }, { status: 404 })

    expect(new VssClient(config, fetcher).getEvent('00000000-0000-4000-8000-000000000099'))
      .rejects.toEqual(new VssApiError('Event tidak ditemukan.', 404, 'NOT_FOUND', undefined))
  })
})
