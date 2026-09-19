import { z } from 'zod'

const requiredText = z.string().trim().min(1)
const optionalText = requiredText.optional()
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Gunakan format YYYY-MM-DD.')

export const createEventOrganizerSchema = z.object({ name: requiredText })
export const updateEventOrganizerSchema = z.object({ name: optionalText }).refine((value) => value.name !== undefined, 'Minimal satu field harus diberikan.')

export const createVenueSchema = z.object({ name: requiredText, address: requiredText })
export const updateVenueSchema = z.object({ name: optionalText, address: optionalText }).refine((value) => value.name !== undefined || value.address !== undefined, 'Minimal satu field harus diberikan.')

export const createContactSchema = z.object({ name: requiredText, contact: requiredText })
export const updateContactSchema = z.object({ name: optionalText, contact: optionalText }).refine((value) => value.name !== undefined || value.contact !== undefined, 'Minimal satu field harus diberikan.')

export const createEventSchema = z.object({
  name: requiredText,
  startOn: dateOnly,
  endOn: dateOnly,
  eventOrganizerId: z.string().uuid(),
  venueId: z.string().uuid(),
}).refine((value) => value.endOn >= value.startOn, { path: ['endOn'], message: 'endOn tidak boleh sebelum startOn.' })

export const updateEventSchema = z.object({
  name: optionalText,
  startOn: dateOnly.optional(),
  endOn: dateOnly.optional(),
  eventOrganizerId: z.string().uuid().optional(),
  venueId: z.string().uuid().optional(),
}).refine((value) => Object.keys(value).length > 0, 'Minimal satu field harus diberikan.')
