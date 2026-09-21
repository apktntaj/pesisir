import { Client } from '@modelcontextprotocol/client'
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio'

const client = new Client({ name: 'vss-mcp-smoke-test', version: '0.1.0' })
const transport = new StdioClientTransport({
  command: '/usr/bin/node',
  args: ['--env-file=.env', 'dist/server.js'],
  cwd: process.cwd(),
})

try {
  await client.connect(transport)
  const { tools } = await client.listTools()
  const names = tools.map((tool) => tool.name).sort()
  const expected = ['create_event', 'get_event', 'list_events']
  if (JSON.stringify(names) !== JSON.stringify(expected)) {
    throw new Error(`Unexpected MCP tool list: ${names.join(', ')}`)
  }

  const result = await client.callTool({
    name: 'list_events',
    arguments: { limit: 1, offset: 0 },
  })
  if (result.isError) throw new Error(`list_events returned an error: ${JSON.stringify(result.content)}`)

  const text = result.content.find((item) => item.type === 'text')?.text
  const payload = text ? JSON.parse(text) as { meta?: { total?: number } } : null
  if (typeof payload?.meta?.total !== 'number') throw new Error('list_events returned an invalid payload.')

  console.log(`VSS MCP smoke test passed; ${payload.meta.total} event(s) available.`)
} finally {
  await client.close()
}
