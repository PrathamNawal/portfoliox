// PortfolioX MCP server endpoint (Streamable HTTP, stateless). Auth: Authorization: Bearer pxm_… personal token.
import { handleMcpRequest, productionDeps } from '@/lib/mcp/handler'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// build_case_study imports, labels and writes in one request. Runs save after every stage, so a timeout is
// resumable with run_id; 300s covers typical files on Vercel Pro.
export const maxDuration = 300

const handle = (req: Request) => handleMcpRequest(req, productionDeps())
export { handle as GET, handle as POST, handle as DELETE }
