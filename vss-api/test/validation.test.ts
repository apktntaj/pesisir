import { describe, expect, test } from 'bun:test'
import { createEventSchema, createVenueSchema, updateEventSchema } from '../src/modules/schemas'

describe('request validation', () => {
  test('rejects events ending before they begin', () => {
    expect(createEventSchema.safeParse({
      name: 'Expo',
      startOn: '2026-12-05',
      endOn: '2026-12-04',
      eventOrganizerId: '00000000-0000-4000-8000-000000000001',
      venueId: '00000000-0000-4000-8000-000000000002',
    }).success).toBeFalse()
  })

  test('accepts a complete venue', () => {
    expect(createVenueSchema.safeParse({ name: 'JIExpo', address: 'Kemayoran' }).success).toBeTrue()
  })

  test('requires at least one event field for update', () => {
    expect(updateEventSchema.safeParse({}).success).toBeFalse()
  })
})
