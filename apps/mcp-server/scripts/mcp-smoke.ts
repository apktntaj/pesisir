import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'

type RpcResponse = { id?: number; result?: unknown; error?: unknown }
const child = spawn('/usr/bin/node', ['--env-file=.env', 'dist/server.js'], {
  cwd: process.cwd(), stdio: ['pipe', 'pipe', 'inherit'],
})
const lines = createInterface({ input: child.stdout })
const pending = new Map<number, { resolve: (value: RpcResponse) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> }>()
let nextId = 0

lines.on('line', (line) => {
  const message = JSON.parse(line) as RpcResponse
  if (message.id === undefined) return
  const waiter = pending.get(message.id)
  if (!waiter) return
  clearTimeout(waiter.timer); pending.delete(message.id); waiter.resolve(message)
})
child.on('exit', (code) => {
  for (const waiter of pending.values()) waiter.reject(new Error(`MCP server exited with code ${code}`))
  pending.clear()
})

function request(method: string, params: Record<string, unknown>) {
  const id = ++nextId
  child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`)
  return new Promise<RpcResponse>((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Timed out waiting for ${method}`)) }, 5000)
    pending.set(id, { resolve, reject, timer })
  })
}

try {
  const initialized = await request('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'vss-mcp-smoke-test', version: '0.2.0' } })
  if (initialized.error) throw new Error(`Initialize failed: ${JSON.stringify(initialized.error)}`)
  child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized', params: {} })}\n`)

  const toolResponse = await request('tools/list', {})
  const tools = (toolResponse.result as { tools?: Array<{ name: string }> } | undefined)?.tools ?? []
  const names = tools.map((tool) => tool.name).sort()
  const expected = [
    'add_event_exhibitor', 'cancel_event', 'create_agent', 'create_event', 'create_event_organizer', 'create_exhibitor',
    'create_venue', 'get_event', 'list_agents', 'list_event_exhibitors', 'list_event_organizers', 'list_events',
    'list_exhibitors', 'list_venues', 'reactivate_event', 'reactivate_event_exhibitor', 'update_event_exhibitor',
    'withdraw_event_exhibitor',
  ]
  if (JSON.stringify(names) !== JSON.stringify(expected)) throw new Error(`Unexpected MCP tool list: ${names.join(', ')}`)

  const call = await request('tools/call', { name: 'list_events', arguments: { limit: 1, offset: 0 } })
  const result = call.result as { isError?: boolean; content?: Array<{ type: string; text?: string }> } | undefined
  if (result?.isError) throw new Error(`list_events returned an error: ${JSON.stringify(result.content)}`)
  const text = result?.content?.find((item) => item.type === 'text')?.text
  const payload = text ? JSON.parse(text) as { meta?: { total?: number } } : null
  if (typeof payload?.meta?.total !== 'number') throw new Error('list_events returned an invalid payload.')
  console.log(`VSS MCP smoke test passed; ${payload.meta.total} event(s) available through 18 tools.`)
} finally {
  child.stdin.end()
  child.kill()
  lines.close()
}
