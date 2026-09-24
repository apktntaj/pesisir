import { z } from 'zod'

const requiredText = z.string().trim().min(1)
const nullableText = requiredText.nullable().optional()
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Gunakan format YYYY-MM-DD.')
const uuid = z.string().uuid()
const countryCode = z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/).nullable().optional()
const website = z.string().trim().url().nullable().optional()

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
export const archiveSchema = reasonSchema
