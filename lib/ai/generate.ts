import type { CaseSectionType } from '@/types'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = 'anthropic/claude-haiku-4-5-20251001'

const SYSTEM_PROMPT = `You are a writer helping designers articulate their work.
Write concise, first-person case study text — clear, specific, and grounded in the details provided.
Rules:
- Never fabricate metrics, percentages, or statistics not provided by the user
- Never start with phrases like "I'm thrilled", "In this case study", "This is an exciting project", "I am excited to", or similar filler
- Write in a confident, editorial tone — not corporate, not humble-bragging
- Keep it under 180 words per section
- Reference the section title in your framing — if the title says "The dilemma that took 3 weeks", write about a dilemma
- Reference actual project context from the inputs`

// Each section type gets its own specific prompt so the AI knows what to focus on
const SECTION_PROMPTS: Record<CaseSectionType, (title: string, problem: string, whatIDid: string) => string> = {
  overview: (_title, problem, whatIDid) =>
    `Write a 2-sentence project overview.
Context:
- Problem: ${problem}
- What I did: ${whatIDid}
One sentence on the problem, one on the approach. No heading. First person.`,

  challenge: (title, problem, whatIDid) =>
    `Write the CHALLENGE section for a design case study. The section is titled "${title}".
Context:
- Problem: ${problem}
- What I did: ${whatIDid}

Write 3–4 sentences: what the problem was, who felt it, why it was hard to solve, and what made it worth solving. Be specific — name the friction, the constraint, or the tension. No heading. First person.`,

  research: (title, problem, whatIDid) =>
    `Write the RESEARCH section for a design case study. The section is titled "${title}".
Context:
- Problem: ${problem}
- What I did: ${whatIDid}

Write 3–4 sentences: what methods were used, what was discovered, and what insight changed direction or confirmed a hypothesis. Name a surprising finding if there is one. No heading. First person.`,

  process: (title, problem, whatIDid) =>
    `Write the PROCESS section for a design case study. The section is titled "${title}".
Context:
- Problem: ${problem}
- What I did: ${whatIDid}

Write 4–5 sentences: what directions were explored, which was chosen and why, and what the key trade-off or hard decision was. Mention at least one path that was rejected and why. No heading. First person.`,

  solution: (title, problem, whatIDid) =>
    `Write the SOLUTION section for a design case study. The section is titled "${title}".
Context:
- Problem: ${problem}
- What I did: ${whatIDid}

Write 3–4 sentences describing the final design: what the 2–3 most important decisions were and what each one solved. Focus on design rationale, not just description. No heading. First person.`,

  impact: (title, problem, whatIDid) =>
    `Write the IMPACT section for a design case study. The section is titled "${title}".
Context:
- Problem: ${problem}
- What I did: ${whatIDid}

Write 3 sentences: what changed because of this work, and what you would do differently. Only include metrics if the user has provided them above. End with a genuine reflection. No heading. First person.`,

  whatsnext: (title, problem, whatIDid) =>
    `Write the WHAT'S NEXT section for a design case study. The section is titled "${title}".
Context:
- Problem: ${problem}
- What I did: ${whatIDid}

Write 2–3 sentences on where this project goes from here — what it unlocked, what future problems it sets up, or what you're watching. Think strategically, not just operationally. No heading. First person.`,

  custom: (title, problem, whatIDid) =>
    `Write a narrative section for a design case study. The section is titled "${title}".
Context:
- Problem: ${problem}
- What I did: ${whatIDid}

Write 3–4 sentences that fit the spirit of the section title. Be specific and grounded. No heading. First person.`,
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
  sectionType: CaseSectionType,
  sectionTitle: string,
  problem: string,
  whatIDid: string,
): Promise<ReadableStream<Uint8Array>> {
  const promptFn = SECTION_PROMPTS[sectionType] ?? SECTION_PROMPTS.custom
  const userPrompt = promptFn(sectionTitle, problem, whatIDid)

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
      max_tokens: 350,
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
