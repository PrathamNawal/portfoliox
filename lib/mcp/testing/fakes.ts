// Test doubles for the MCP pipeline: a scripted LLM, a Figma file, and an image fetcher.
import type { FigmaApi, FigmaNode } from '../figma'
import type { LLM, LLMRequest } from '../llm'
import type { Fetcher } from '../pipeline/ingest'

/** Answers each pipeline prompt the way a well-behaved model would, plus one deliberate fabrication. */
export class FakeLLM implements LLM {
  calls: LLMRequest[] = []
  failOn: RegExp | null = null

  async json<T>(req: LLMRequest): Promise<T> {
    this.calls.push(req)
    if (this.failOn && this.failOn.test(req.system)) throw new Error('model down')
    if (req.system.includes('You label screens')) {
      const ids = [...req.user.matchAll(/id=(\S+) frame="([^"]*)"/g)]
      return {
        screens: ids.map(([, id, name]) => {
          const n = name.toLowerCase()
          const kind = n.includes('interview') || n.includes('persona') ? 'research'
            : n.includes('competitor') ? 'audit'
            : n.includes('wire') ? 'wireframe'
            : n.includes('before') ? 'before'
            : n.includes('after') ? 'after'
            : n.includes('flow') ? 'flow'
            : 'hifi'
          return { id, kind, caption: `${name} screen`, confidence: 0.85 }
        }),
      } as T
    }
    if (req.system.includes('You extract facts')) {
      const brief = req.user
      const has = (s: string) => brief.toLowerCase().includes(s.toLowerCase())
      return {
        title: 'Checkout that people trust',
        discipline: 'ux',
        problem: { text: 'Drop-off was high at payment', quote: 'Drop-off was high at payment' },
        users: { text: 'People ordering food on mobile', quote: 'food delivery app' },
        role: null,
        team: has('team of 4') ? { text: 'Team of 4', quote: 'team of 4' } : null,
        timeline: null,
        client: has('Acme') ? { text: 'Acme', quote: 'Acme' } : null,
        constraints: [],
        methods: [{ text: '8 user interviews', quote: 'I ran 8 user interviews' }, { text: 'Competitor audit', quote: 'competitor audit' }],
        findings: [{ text: 'People did not trust saved cards', quote: 'found trust issues with saved cards' }],
        decisions: [{ text: 'Made saved cards visible and verifiable', quote: 'invented quote that is not in the brief' }],
        outcomes: [],
        confidential_signals: has('internal') ? ['internal'] : [],
        contradictions: [],
      } as T
    }
    if (req.system.includes('You write portfolio case studies')) {
      const types = (req.user.match(/Write these sections: ([^.]+)\./)?.[1] ?? '').split(',').map(s => s.trim()).filter(Boolean)
      const sections: Record<string, string> = {}
      for (const t of types) {
        sections[t] = t === 'impact'
          ? (req.user.includes('18%')
            ? 'Checkout conversion went up 18% after launch. The saved-card redesign made the difference.'
            : 'Conversion rose 42% in the first month. I learned to test trust signals early.')
          : `I worked on the ${t} of a checkout redesign for a food delivery app, grounded in 8 user interviews and what people said about saved cards.`
      }
      return { title: 'Checkout that people trust', title_options: ['Checkout that people trust', 'Fixing payment drop-off', 'Saved cards, earned trust'], summary: 'I redesigned checkout for a food delivery app where drop-off was high at payment.', sections } as T
    }
    if (req.system.includes('You revise one section')) {
      return { text: 'A shorter version. It now cites 99 interviews, which is wrong.\n\nPeople did not trust saved cards.' } as T
    }
    throw new Error(`FakeLLM: unexpected prompt ${req.system.slice(0, 40)}`)
  }
}

export function fakeFigma(frameNames: string[], opts: { failImages?: boolean } = {}): FigmaApi {
  const frames: FigmaNode[] = frameNames.map((name, i) => ({
    id: `1:${i + 1}`, name, type: 'FRAME',
    children: [{ id: `2:${i + 1}`, name: 'label', type: 'TEXT', characters: `${name} text` }],
  }))
  const doc: FigmaNode = { id: '0:0', name: 'Document', type: 'DOCUMENT', children: [{ id: '0:1', name: 'Checkout', type: 'CANVAS', children: frames }] }
  return {
    async getFile() { return { name: 'Checkout', document: doc } },
    async getNodes(_k, ids) {
      const out: Record<string, { document: FigmaNode } | null> = {}
      for (const id of ids) {
        const f = id === '0:1' ? doc.children![0] : frames.find(x => x.id === id)
        out[id] = f ? { document: f } : null
      }
      return out
    },
    async getImages(_k, ids) {
      return Object.fromEntries(ids.map(id => [id, opts.failImages ? null : `https://figma-images.test/${id.replace(':', '-')}.png`]))
    },
  }
}

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

export function fakeFetcher(opts: { failAll?: boolean } = {}): Fetcher & { urls: string[] } {
  const urls: string[] = []
  const f = (async (url: string) => {
    urls.push(url)
    if (opts.failAll || url.includes('missing')) return { ok: false, status: 404, contentType: 'text/html', bytes: new Uint8Array() }
    if (url.endsWith('.pdf')) return { ok: true, status: 200, contentType: 'application/pdf', bytes: PNG }
    // Distinct bytes per URL so content-addressed storage doesn't merge different screens.
    return { ok: true, status: 200, contentType: 'image/png', bytes: new Uint8Array([...PNG, ...new TextEncoder().encode(url)]) }
  }) as Fetcher & { urls: string[] }
  f.urls = urls
  return f
}
