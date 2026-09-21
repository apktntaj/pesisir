import { McpServer } from '@modelcontextprotocol/server'
import { serveStdio } from '@modelcontextprotocol/server/stdio'
import { z } from 'zod'
import { loadConfig } from './config'
import { VssApiError, VssClient } from './vss-client'

function textResult(value: unknown) {
  return { content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }] }
}

function errorResult(error: unknown) {
  const apiError = error instanceof VssApiError ? error : null
  const message = error instanceof Error ? error.message : String(error)
  return {
    isError: true,
    content: [{
      type: 'text' as const,
      text: JSON.stringify({
        error: {
          message,
          ...(apiError?.status ? { status: apiError.status } : {}),
          ...(apiError?.code ? { code: apiError.code } : {}),
          ...(apiError?.details ? { details: apiError.details } : {}),
        },
      }),
    }],
  }
}

function buildServer() {
  const client = new VssClient(loadConfig())
  const server = new McpServer({ name: 'vss-operations', version: '0.1.0' })

  server.registerTool('list_events', {
    title: 'List VSS events',
    description: 'List events stored in VSS, including dates and linked organizer/venue summaries.',
    inputSchema: z.object({
      limit: z.number().int().min(1).max(100).default(50),
      offset: z.number().int().min(0).default(0),
    }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  }, async ({ limit, offset }) => {
    try {
      return textResult(await client.listEvents(limit, offset))
    } catch (error) {
      return errorResult(error)
    }
  })

  server.registerTool('get_event', {
    title: 'Get one VSS event',
    description: 'Get the complete stored details for one event by UUID.',
    inputSchema: z.object({ id: z.string().uuid().describe('Event UUID') }),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true },
  }, async ({ id }) => {
    try {
      return textResult(await client.getEvent(id))
    } catch (error) {
      return errorResult(error)
    }
  })

  server.registerTool('create_event', {
    title: 'Create a VSS event',
    description: 'Create an event after the WhatsApp user has explicitly confirmed its exact name, start date, and end date. Organizer and venue are configured defaults.',
    inputSchema: z.object({
      name: z.string().trim().min(1).describe('Official event name'),
      startOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('Start date in YYYY-MM-DD'),
      endOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).describe('End date in YYYY-MM-DD'),
    }).refine((value) => value.endOn >= value.startOn, { path: ['endOn'], message: 'endOn must not be before startOn' }),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
  }, async (input) => {
    try {
      return textResult(await client.createEvent(input))
    } catch (error) {
      return errorResult(error)
    }
  })

  return server
}

const handle = serveStdio(buildServer, {
  onerror: (error) => console.error(error),
})

process.on('SIGINT', () => { void handle.close() })
process.on('SIGTERM', () => { void handle.close() })
