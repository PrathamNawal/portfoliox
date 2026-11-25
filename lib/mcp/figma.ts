// Figma REST client and URL parsing. Reads frames, their text layers and rendered images.
export interface FigmaRef {
  fileKey: string
  /** Node id in API form ("12:34"), when the link points at a frame or page. */
  nodeId?: string
  /** A prototype link: becomes an embed block, not a set of screens. */
  isPrototype: boolean
  url: string
}

export function parseFigmaUrl(raw: string): FigmaRef | null {
  let u: URL
  try { u = new URL(raw.trim()) } catch { return null }
  if (!/(^|\.)figma\.com$/.test(u.hostname)) return null
  const m = u.pathname.match(/^\/(file|design|proto|board|deck)\/([A-Za-z0-9]+)/)
  if (!m) return null
  const node = u.searchParams.get('node-id')
  return {
    fileKey: m[2],
    nodeId: node ? decodeURIComponent(node).replace(/-/g, ':') : undefined,
    isPrototype: m[1] === 'proto',
    url: raw.trim(),
  }
}

export interface FigmaNode {
  id: string
  name: string
  type: string
  characters?: string
  children?: FigmaNode[]
}

export interface FigmaApi {
  getFile(fileKey: string, depth: number): Promise<{ name: string; document: FigmaNode }>
  getNodes(fileKey: string, ids: string[]): Promise<Record<string, { document: FigmaNode } | null>>
  getImages(fileKey: string, ids: string[]): Promise<Record<string, string | null>>
}

export class FigmaError extends Error {
  constructor(message: string, public fix: string) { super(message) }
}

export class FigmaRestApi implements FigmaApi {
  constructor(private token: string) {}

  private async get(path: string) {
    const res = await fetch(`https://api.figma.com/v1${path}`, { headers: { 'X-Figma-Token': this.token } })
    if (res.status === 403 || res.status === 404) {
      throw new FigmaError(
        `Figma returned ${res.status}: the file is private or the link is wrong.`,
        'Share the file with the Figma account whose token is saved in PortfolioX (Dashboard → MCP), or export the frames as images and pass their URLs instead.',
      )
    }
    if (res.status === 429) throw new FigmaError('Figma rate limit reached.', 'Wait a minute and call the tool again with the same run_id to resume.')
    if (!res.ok) throw new FigmaError(`Figma API error ${res.status}.`, 'Try again, or pass exported images instead of the Figma link.')
    return res.json()
  }

  getFile(fileKey: string, depth: number) { return this.get(`/files/${fileKey}?depth=${depth}`) }
  async getNodes(fileKey: string, ids: string[]) {
    return (await this.get(`/files/${fileKey}/nodes?ids=${encodeURIComponent(ids.join(','))}`)).nodes
  }
  async getImages(fileKey: string, ids: string[]) {
    return (await this.get(`/images/${fileKey}?ids=${encodeURIComponent(ids.join(','))}&format=png&scale=1`)).images
  }
}

const FRAME_TYPES = new Set(['FRAME', 'COMPONENT', 'COMPONENT_SET', 'INSTANCE'])

export interface FigmaFrame { id: string; name: string; page: string }

/** Top-level frames a link points at: a frame's own child frames, a page's frames, or every page's frames. */
export async function listFrames(api: FigmaApi, ref: FigmaRef): Promise<FigmaFrame[]> {
  const collect = (parent: FigmaNode, page: string): FigmaFrame[] => {
    const out: FigmaFrame[] = []
    for (const child of parent.children ?? []) {
      if (FRAME_TYPES.has(child.type)) out.push({ id: child.id, name: child.name, page })
      else if (child.type === 'SECTION') out.push(...collect(child, `${page} / ${child.name}`))
    }
    return out
  }
  if (ref.nodeId) {
    const nodes = await api.getNodes(ref.fileKey, [ref.nodeId])
    const node = nodes[ref.nodeId]?.document
    if (!node) throw new FigmaError('The node in the link was not found.', 'Copy the link again from Figma (Share → Copy link) or drop the node-id from the URL.')
    if (node.type === 'CANVAS' || node.type === 'SECTION') return collect(node, node.name)
    const inner = collect(node, node.name)
    return inner.length >= 2 ? inner : [{ id: node.id, name: node.name, page: node.name }]
  }
  const file = await api.getFile(ref.fileKey, 2)
  return (file.document.children ?? []).flatMap(page => collect(page, page.name))
}

/** Text layers inside each frame, joined and capped, so the writer can quote what is on the screen. */
export async function frameTexts(api: FigmaApi, fileKey: string, ids: string[], cap = 600): Promise<Record<string, string>> {
  const out: Record<string, string> = {}
  for (let i = 0; i < ids.length; i += 25) {
    const chunk = ids.slice(i, i + 25)
    const nodes = await api.getNodes(fileKey, chunk)
    for (const id of chunk) {
      const texts: string[] = []
      const walk = (n?: FigmaNode) => {
        if (!n) return
        if (n.type === 'TEXT' && n.characters) texts.push(n.characters.trim())
        n.children?.forEach(walk)
      }
      walk(nodes[id]?.document)
      out[id] = texts.filter(Boolean).join(' · ').slice(0, cap)
    }
  }
  return out
}
