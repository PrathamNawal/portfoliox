export type GenerationSection = 'intro' | 'process' | 'outcome'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = 'anthropic/claude-haiku-4-5-20251001'

const SYSTEM_PROMPT = `You are a writer helping designers articulate their work.
Write concise, first-person case study text — clear, specific, and grounded in the details provided.
Rules:
- Never fabricate metrics, percentages, or statistics not provided by the user
- Never start with phrases like "I'm thrilled", "In this case study", "This is an exciting project", "I am excited to", or similar filler
- Write in a confident, editorial tone — not corporate, not humble-bragging
- Keep it under 150 words per section
- Reference actual project context from the inputs`

const SECTION_PROMPTS: Record<GenerationSection, (p: string, w: string, o: string) => string> = {
  intro: (problem, whatIDid, outcome) =>
    `Write the INTRO section for a design case study.
Context:
- Problem: ${problem}
- What I did: ${whatIDid}
${outcome ? `- Outcome: ${outcome}` : ''}

Write 2–3 sentences introducing the project: what problem existed and why it mattered. No heading. First person.`,

  process: (problem, whatIDid, outcome) =>
    `Write the PROCESS section for a design case study.
Context:
- Problem: ${problem}
- What I did: ${whatIDid}
${outcome ? `- Outcome: ${outcome}` : ''}

Write 3–4 sentences describing the design approach, key decisions, and methods used. No heading. First person.`,

  outcome: (problem, whatIDid, outcome) =>
    `Write the OUTCOME section for a design case study.
Context:
- Problem: ${problem}
- What I did: ${whatIDid}
${outcome ? `- Outcome/result: ${outcome}` : ''}

Write 2–3 sentences describing what changed and what was learned. Only include metrics if explicitly stated in the context above. No heading. First person.`,
}

const FILLER_OPENERS = [
  "i'm thrilled", "in this case study", "this is an exciting",
  "i am excited", "welcome to", "in this project",
]

function hasFiller(text: string): boolean {
  const lower = text.toLowerCase().trimStart()
  return FILLER_OPENERS.some((f) => lower.startsWith(f))
}

export async function generateSection(
  section: GenerationSection,
  problem: string,
  whatIDid: string,
  outcome: string,
): Promise<ReadableStream<Uint8Array>> {
  const userPrompt = SECTION_PROMPTS[section](problem, whatIDid, outcome)

  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://portfoliox.me',
      'X-Title': 'PortfolioX',
    },
    body: JSON.stringify({
      model: MODEL,
      stream: true,
      max_tokens: 300,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    }),
  })

  if (!response.ok || !response.body) {
    throw new Error(`OpenRouter error: ${response.status}`)
  }

  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  return new ReadableStream({
    async start(controller) {
      const reader = response.body!.getReader()
      let fullText = ''
      let fillerChecked = false

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const data = line.slice(6).trim()
            if (data === '[DONE]') continue

            try {
              const json = JSON.parse(data)
              const text = json.choices?.[0]?.delta?.content
              if (!text) continue

              fullText += text

              // Check for filler opener once we have enough text
              if (!fillerChecked && fullText.length > 30) {
                fillerChecked = true
                if (hasFiller(fullText)) {
                  controller.error(new Error('FILLER_OPENER'))
                  return
                }
              }

              controller.enqueue(encoder.encode(text))
            } catch {
              // Malformed JSON chunk — skip
            }
          }
        }
        controller.close()
      } catch (err) {
        controller.error(err)
      }
    },
  })
}
