// Minimal JSON-returning LLM client. The pipeline only depends on the `LLM` interface, so tests swap in a fake.
export interface LLMRequest {
  system: string
  user: string
  /** Public image URLs sent alongside the prompt (vision). */
  images?: string[]
  maxTokens?: number
}

export interface LLM {
  json<T>(req: LLMRequest): Promise<T>
}

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

/** Pulls the first JSON object out of a model reply (models sometimes wrap it in prose or a code fence). */
export function parseJsonReply<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const body = fenced ? fenced[1] : text
  const start = body.indexOf('{')
  const end = body.lastIndexOf('}')
  if (start < 0 || end <= start) throw new Error('LLM reply had no JSON object')
  return JSON.parse(body.slice(start, end + 1)) as T
}

export class OpenRouterLLM implements LLM {
  constructor(
    private apiKey = process.env.OPENROUTER_API_KEY || '',
    private model = process.env.MCP_MODEL || 'anthropic/claude-haiku-4-5-20251001',
  ) {}

  async json<T>(req: LLMRequest): Promise<T> {
    if (!this.apiKey) throw new Error('OPENROUTER_API_KEY is not set')
    const content = req.images?.length
      ? [{ type: 'text', text: req.user }, ...req.images.map(url => ({ type: 'image_url', image_url: { url } }))]
      : req.user
    let lastErr: unknown
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(OPENROUTER_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://portfoliox.me',
            'X-Title': 'PortfolioX MCP',
          },
          body: JSON.stringify({
            model: this.model,
            max_tokens: req.maxTokens ?? 2000,
            temperature: 0.3,
            messages: [{ role: 'system', content: req.system }, { role: 'user', content }],
          }),
        })
        if (!res.ok) throw new Error(`OpenRouter ${res.status}`)
        const data = await res.json()
        return parseJsonReply<T>(data.choices?.[0]?.message?.content ?? '')
      } catch (err) {
        lastErr = err
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error('LLM call failed')
  }
}
