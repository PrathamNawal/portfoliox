// HTTP entry for the MCP server: bearer-token auth, then a stateless Streamable HTTP transport per request.
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { createClient } from '@supabase/supabase-js'
import { bearerToken, decryptSecret, hashToken } from './auth'
import { FigmaRestApi } from './figma'
import { OpenRouterLLM } from './llm'
import { httpFetcher } from './pipeline/ingest'
import { createPortfolioServer } from './server'
import type { Deps } from './service'
import { SupabaseStore } from './store'

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } })

export function productionDeps(): Deps {
  const store = new SupabaseStore(createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!))
  return {
    store,
    llm: process.env.OPENROUTER_API_KEY ? new OpenRouterLLM() : null,
    fetcher: httpFetcher,
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://portfoliox.me',
    figmaFor: async (userId) => {
      const enc = await store.getFigmaTokenEnc(userId)
      const token = enc ? decryptSecret(enc) : process.env.FIGMA_ACCESS_TOKEN
      return token ? new FigmaRestApi(token) : null
    },
  }
}

export async function handleMcpRequest(req: Request, deps: Deps): Promise<Response> {
  const token = bearerToken(req.headers.get('authorization'))
  const unauthorized = json(401, { error: 'Missing or invalid PortfolioX token. Create one in Dashboard → MCP and send it as "Authorization: Bearer pxm_…".' }, { 'WWW-Authenticate': 'Bearer realm="portfoliox-mcp"' })
  if (!token) return unauthorized
  const record = await deps.store.findTokenByHash(hashToken(token))
  if (!record || record.revoked) return unauthorized
  void deps.store.touchToken(record.id).catch(() => {})

  if (req.method !== 'POST') return json(405, { error: 'This MCP server is stateless; use POST.' }, { Allow: 'POST' })

  const server = createPortfolioServer(deps, record.userId)
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true })
  await server.connect(transport)
  try {
    return await transport.handleRequest(req)
  } finally {
    // Stateless: nothing to keep between requests.
    void server.close().catch(() => {})
  }
}
