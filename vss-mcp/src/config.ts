import { z } from 'zod'

const configSchema = z.object({
  VSS_API_BASE_URL: z.string().url().transform((value) => value.replace(/\/$/, '')),
  VSS_API_TOKEN: z.string().trim().min(1).optional(),
  VSS_DEFAULT_EVENT_ORGANIZER_ID: z.string().uuid(),
  VSS_DEFAULT_VENUE_ID: z.string().uuid(),
})

export type Config = z.infer<typeof configSchema>

export function loadConfig(env: Record<string, string | undefined> = process.env): Config {
  const parsed = configSchema.safeParse(env)
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ')
    throw new Error(`Invalid VSS MCP configuration: ${details}`)
  }
  return parsed.data
}
