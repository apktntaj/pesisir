import { describe, expect, test } from 'bun:test'
import {
  createEventSchema,
  createExhibitorSchema,
  createSourceDocumentSchema,
  createVenueSchema,
  updateEventSchema,
} from '../src/modules/schemas'

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
    expect(createVenueSchema.safeParse({ name: 'JIExpo', address: 'Kemayoran', npwp: null }).success).toBeTrue()
  })

  test('requires at least one event field for update', () => {
    expect(updateEventSchema.safeParse({}).success).toBeFalse()
  })

  test('normalizes local country and rejects Indonesian international exhibitors', () => {
    const local = createExhibitorSchema.safeParse({ legalName: 'PT Lokal', kind: 'LOCAL', npwp: null })
    expect(local.success && local.data.countryCode).toBe('ID')
    expect(createExhibitorSchema.safeParse({ legalName: 'Foreign', kind: 'INTERNATIONAL', countryCode: 'ID' }).success).toBeFalse()
    expect(createExhibitorSchema.safeParse({ legalName: 'Foreign', kind: 'INTERNATIONAL', npwp: '01.234' }).success).toBeFalse()
  })

  test('requires source-message lineage for WhatsApp attachments and forbids it for manual uploads', () => {
    const document = {
      fileName: 'invoice.pdf',
      mimeType: 'application/pdf',
      contentBase64: 'JVBERg==',
      receivedAt: '2026-09-25T08:00:00.000Z',
    }
    expect(createSourceDocumentSchema.safeParse({ ...document, sourceKind: 'WHATSAPP_ATTACHMENT' }).success).toBeFalse()
    expect(createSourceDocumentSchema.safeParse({
      ...document,
      sourceKind: 'WHATSAPP_ATTACHMENT',
      sourceMessageId: '00000000-0000-4000-8000-000000000001',
    }).success).toBeTrue()
    expect(createSourceDocumentSchema.safeParse({
      ...document,
      sourceKind: 'MANUAL_UPLOAD',
      sourceMessageId: '00000000-0000-4000-8000-000000000001',
    }).success).toBeFalse()
  })
})
