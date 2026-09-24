import { McpServer } from '@modelcontextprotocol/server'
import { serveStdio } from '@modelcontextprotocol/server/stdio'
import { z } from 'zod'
import { loadConfig } from './config'
import { VssApiError, VssClient } from './vss-client'

const uuid = z.string().uuid()
const nullableText = z.string().trim().min(1).nullable().optional()
const mutationFields = {
  actorRef: z.string().trim().min(1).describe('Stable OpenClaw sender reference; do not ask the user'),
  sourceMessageId: z.string().trim().min(1).optional().describe('Originating WhatsApp/OpenClaw message ID'),
  idempotencyKey: uuid.describe('Stable UUID for this confirmed operation; reuse it when retrying'),
}
const meta = (input: { actorRef: string; sourceMessageId?: string; idempotencyKey: string }) => ({ actorRef: input.actorRef, sourceMessageId: input.sourceMessageId, idempotencyKey: input.idempotencyKey })
const textResult = (value: unknown) => ({ content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }] })
function errorResult(error: unknown) {
  const apiError = error instanceof VssApiError ? error : null
  return { isError: true, content: [{ type: 'text' as const, text: JSON.stringify({ error: {
    message: error instanceof Error ? error.message : String(error), ...(apiError?.status ? { status: apiError.status } : {}),
    ...(apiError?.code ? { code: apiError.code } : {}), ...(apiError?.details ? { details: apiError.details } : {}),
  } }) }] }
}

function buildServer() {
  const client = new VssClient(loadConfig())
  const server = new McpServer({ name: 'vss-operations', version: '0.2.0' })
  const readAnnotations = { readOnlyHint: true, destructiveHint: false, idempotentHint: true }
  const writeAnnotations = { readOnlyHint: false, destructiveHint: false, idempotentHint: true }

  server.registerTool('list_events', { title: 'List VSS events', description: 'List stored events.', inputSchema: z.object({ limit: z.number().int().min(1).max(100).default(50), offset: z.number().int().min(0).default(0) }), annotations: readAnnotations },
    async ({ limit, offset }) => { try { return textResult(await client.listEvents(limit, offset)) } catch (error) { return errorResult(error) } })
  server.registerTool('get_event', { title: 'Get VSS event', description: 'Get one event by UUID.', inputSchema: z.object({ id: uuid }), annotations: readAnnotations },
    async ({ id }) => { try { return textResult(await client.getEvent(id)) } catch (error) { return errorResult(error) } })
  server.registerTool('list_event_organizers', { title: 'List event organizers', description: 'List active event organizers for event selection.', inputSchema: z.object({}), annotations: readAnnotations },
    async () => { try { return textResult(await client.listEventOrganizers()) } catch (error) { return errorResult(error) } })
  server.registerTool('list_venues', { title: 'List venues', description: 'List active venues for event selection.', inputSchema: z.object({}), annotations: readAnnotations },
    async () => { try { return textResult(await client.listVenues()) } catch (error) { return errorResult(error) } })
  server.registerTool('list_exhibitors', { title: 'List exhibitor companies', description: 'List reusable exhibitor company records.', inputSchema: z.object({ kind: z.enum(['LOCAL', 'INTERNATIONAL']).optional() }), annotations: readAnnotations },
    async ({ kind }) => { try { return textResult(await client.listExhibitors(kind)) } catch (error) { return errorResult(error) } })
  server.registerTool('list_agents', { title: 'List agent companies', description: 'List reusable agent company records.', inputSchema: z.object({}), annotations: readAnnotations },
    async () => { try { return textResult(await client.listAgents()) } catch (error) { return errorResult(error) } })
  server.registerTool('list_event_exhibitors', { title: 'List event exhibitors', description: 'List exhibitors participating in one event.', inputSchema: z.object({ eventId: uuid }), annotations: readAnnotations },
    async ({ eventId }) => { try { return textResult(await client.listEventExhibitors(eventId)) } catch (error) { return errorResult(error) } })

  server.registerTool('create_event', {
    title: 'Create event', description: 'Create an event only after explicit confirmation of event, organizer, venue, and dates.',
    inputSchema: z.object({ name: z.string().trim().min(1), alias: nullableText, notes: nullableText, startOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), endOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), eventOrganizerId: uuid, venueId: uuid, ...mutationFields })
      .refine((value) => value.endOn >= value.startOn, { path: ['endOn'], message: 'endOn must not be before startOn' }), annotations: writeAnnotations,
  }, async (input) => { try { return textResult(await client.createEvent(input, meta(input))) } catch (error) { return errorResult(error) } })

  server.registerTool('create_exhibitor', {
    title: 'Create exhibitor company', description: 'Create a reusable local or international exhibitor company after confirmation.',
    inputSchema: z.object({ legalName: z.string().trim().min(1), alias: nullableText, kind: z.enum(['LOCAL', 'INTERNATIONAL']), npwp: nullableText, countryCode: z.string().regex(/^[A-Z]{2}$/).nullable().optional(), address: nullableText, website: z.string().url().nullable().optional(), ...mutationFields })
      .superRefine((value, context) => { if (value.kind === 'LOCAL' && value.countryCode && value.countryCode !== 'ID') context.addIssue({ code: 'custom', path: ['countryCode'], message: 'Local exhibitor country must be ID' }); if (value.kind === 'INTERNATIONAL' && (value.npwp || value.countryCode === 'ID')) context.addIssue({ code: 'custom', path: ['kind'], message: 'International exhibitor cannot use Indonesian NPWP/country' }) }), annotations: writeAnnotations,
  }, async (input) => { try { return textResult(await client.createExhibitor(input, meta(input))) } catch (error) { return errorResult(error) } })

  server.registerTool('create_agent', {
    title: 'Create agent company', description: 'Create a reusable coordination-agent company after confirmation.',
    inputSchema: z.object({ name: z.string().trim().min(1), countryCode: z.string().regex(/^[A-Z]{2}$/).nullable().optional(), address: nullableText, website: z.string().url().nullable().optional(), ...mutationFields }), annotations: writeAnnotations,
  }, async (input) => { try { return textResult(await client.createAgent(input, meta(input))) } catch (error) { return errorResult(error) } })

  server.registerTool('add_event_exhibitor', {
    title: 'Add exhibitor to event', description: 'Create an event participation after confirmation. Local exhibitors must not have agentId.',
    inputSchema: z.object({ eventId: uuid, exhibitorId: uuid, agentId: uuid.nullable().optional(), primaryContactId: uuid.nullable().optional(), hall: nullableText, booth: nullableText, notes: nullableText, ...mutationFields }), annotations: writeAnnotations,
  }, async (input) => { try { return textResult(await client.addEventExhibitor(input.eventId, input, meta(input))) } catch (error) { return errorResult(error) } })

  server.registerTool('update_event_exhibitor', {
    title: 'Update event exhibitor', description: 'Update agent, contact, hall, booth, or notes for an active participation after confirmation.',
    inputSchema: z.object({ id: uuid, agentId: uuid.nullable().optional(), primaryContactId: uuid.nullable().optional(), hall: nullableText, booth: nullableText, notes: nullableText, ...mutationFields }), annotations: writeAnnotations,
  }, async (input) => { try { return textResult(await client.updateEventExhibitor(input.id, input, meta(input))) } catch (error) { return errorResult(error) } })

  for (const command of ['cancel', 'reactivate'] as const) server.registerTool(`${command}_event`, {
    title: `${command} event`, description: `${command} an event through an explicit lifecycle command after confirmation.`,
    inputSchema: z.object({ id: uuid, reason: z.string().trim().min(1), ...mutationFields }), annotations: writeAnnotations,
  }, async (input) => { try { return textResult(await client.eventCommand(input.id, command, input.reason, meta(input))) } catch (error) { return errorResult(error) } })

  for (const command of ['withdraw', 'reactivate'] as const) server.registerTool(`${command}_event_exhibitor`, {
    title: `${command} event exhibitor`, description: `${command} an exhibitor participation through an explicit lifecycle command after confirmation.`,
    inputSchema: z.object({ id: uuid, reason: z.string().trim().min(1), ...mutationFields }), annotations: writeAnnotations,
  }, async (input) => { try { return textResult(await client.participationCommand(input.id, command, input.reason, meta(input))) } catch (error) { return errorResult(error) } })

  return server
}

const handle = serveStdio(buildServer, { onerror: (error) => console.error(error) })
process.on('SIGINT', () => { void handle.close() })
process.on('SIGTERM', () => { void handle.close() })
