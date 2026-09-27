import { describe, expect, test } from 'bun:test'
import {
  createEventSchema,
  createExhibitorSchema,
  createSourceDocumentSchema,
  createCiplSchema,
  createDocumentExtractionFactReviewSchema,
  createDocumentExtractionSchema,
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

  test('enforces extraction fact information states and unique fields', () => {
    const sourceBacked = {
      field: 'invoice.number',
      informationState: 'SOURCE_BACKED',
      assertedValue: 'INV-001',
      evidenceLocators: [{ kind: 'PDF_PAGE', reference: { page: 1 }, excerpt: 'Invoice INV-001' }],
    }
    expect(createDocumentExtractionSchema.safeParse({ facts: [sourceBacked] }).success).toBeTrue()
    expect(createDocumentExtractionSchema.safeParse({
      facts: [{ field: 'consignee.name', informationState: 'UNKNOWN', assertedValue: 'PT Example' }],
    }).success).toBeFalse()
    expect(createDocumentExtractionSchema.safeParse({
      facts: [{ field: 'weight.gross', informationState: 'CONFLICTING' }],
    }).success).toBeFalse()
    expect(createDocumentExtractionSchema.safeParse({ facts: [sourceBacked, sourceBacked] }).success).toBeFalse()
  })

  test('requires a resulting value for confirmation and a reason for every review', () => {
    expect(createDocumentExtractionFactReviewSchema.safeParse({
      kind: 'CONFIRM',
      resultingState: 'CONFIRMED',
      resultingValue: 'INV-001',
      reason: 'Verified against original invoice.',
    }).success).toBeTrue()
    expect(createDocumentExtractionFactReviewSchema.safeParse({
      kind: 'CONFIRM',
      resultingState: 'INFERRED',
      resultingValue: 'INV-001',
      reason: 'Invalid confirmation.',
    }).success).toBeFalse()
    expect(createDocumentExtractionFactReviewSchema.safeParse({
      kind: 'CORRECT',
      resultingState: 'CONFIRMED',
      resultingValue: 'INV-002',
      reason: '',
    }).success).toBeFalse()
  })

  test('requires complete positive CIPL version items', () => {
    const input = {
      eventExhibitorId: '00000000-0000-4000-8000-000000000001',
      sourceDocumentId: '00000000-0000-4000-8000-000000000002',
      receivedAt: '2026-09-25T08:00:00.000Z',
      items: [{ lineNumber: 1, description: 'Display stand', quantity: 2, unit: 'PCS' }],
    }
    expect(createCiplSchema.safeParse(input).success).toBeTrue()
    expect(createCiplSchema.safeParse({ ...input, items: [{ ...input.items[0], quantity: 0 }] }).success).toBeFalse()
    expect(createCiplSchema.safeParse({ ...input, items: [input.items[0], input.items[0]] }).success).toBeFalse()
  })
})
