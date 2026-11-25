// The claim validator. Every number in generated text must trace back to something the user gave us
// (brief, process notes, answers, text on their screens). Sentences that carry an untraceable number are
// removed, not rewritten: removal is deterministic and can't introduce a new claim.

const NUMBER_RE = /(?:[$₹€£]\s?)?\d[\d,]*(?:\.\d+)?(?:\s?(?:%|percent|x\b|k\b|m\b|bn\b|\+))?/gi

const NUMBER_WORDS: Record<string, string> = {
  one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9', ten: '10',
  eleven: '11', twelve: '12', fifteen: '15', twenty: '20', thirty: '30', forty: '40', fifty: '50', hundred: '100',
  half: '50', dozen: '12',
}

/** Digits of a number token, without separators or leading zeros: "1,200" → "1200", "18%" → "18". */
export function numberKey(token: string): string {
  return token.replace(/[^\d.]/g, '').replace(/\.$/, '').replace(/^0+(?=\d)/, '')
}

export function numbersIn(text: string): string[] {
  return (text.match(NUMBER_RE) ?? []).map(t => t.trim())
}

export function corpusNumberKeys(corpus: string): Set<string> {
  const keys = new Set(numbersIn(corpus).map(numberKey))
  for (const w of corpus.toLowerCase().match(/[a-z]+/g) ?? []) if (NUMBER_WORDS[w]) keys.add(NUMBER_WORDS[w])
  return keys
}

/** Numbers in `text` that do not appear anywhere in the user's own material. */
export function untracedNumbers(text: string, corpus: string | Set<string>): string[] {
  const keys = typeof corpus === 'string' ? corpusNumberKeys(corpus) : corpus
  return numbersIn(text).filter(t => {
    const k = numberKey(t)
    return k !== '' && !keys.has(k)
  })
}

/** Paragraphs → lines → sentences, so removal keeps the narrative's paragraph breaks. */
function splitSentences(line: string): string[] {
  return line.match(/[^.!?]+(?:[.!?]+(?=\s|$)|$)/g)?.map(s => s.trim()).filter(Boolean) ?? []
}

export interface Removal { sentence: string; claims: string[] }

export function enforceClaims(text: string, corpus: string): { text: string; removed: Removal[] } {
  const keys = corpusNumberKeys(corpus)
  const removed: Removal[] = []
  const paragraphs = text.split(/\n\s*\n/).map(p =>
    p.split('\n').map(line => {
      // Numbered steps ("01. Plan") are list markers, not claims.
      const marker = line.match(/^\s*\d{1,2}[.)]\s+/)?.[0] ?? ''
      const kept = splitSentences(line.slice(marker.length)).filter(s => {
        const bad = untracedNumbers(s, keys)
        if (bad.length) removed.push({ sentence: s, claims: bad })
        return bad.length === 0
      })
      return kept.length ? marker + kept.join(' ') : ''
    }).filter(Boolean).join('\n'),
  ).filter(Boolean)
  return { text: paragraphs.join('\n\n'), removed }
}

const COMMON_CAPS = new Set([
  'I', 'We', 'The', 'A', 'An', 'This', 'That', 'These', 'Those', 'It', 'My', 'Our', 'In', 'On', 'At', 'For', 'With',
  'UX', 'UI', 'MVP', 'API', 'iOS', 'Android', 'Figma', 'FigJam', 'Sketch', 'Miro', 'Maze', 'Notion', 'Jira',
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
  'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December',
])

/** Capitalised words mid-sentence that the user never wrote. Reported, not removed: names are too noisy to strip. */
export function unverifiedNames(text: string, corpus: string): string[] {
  const lower = corpus.toLowerCase()
  const found = new Set<string>()
  for (const s of text.split(/(?<=[.!?:])\s+|\n+/)) {
    const words = s.trim().split(/\s+/).slice(1) // skip the sentence's first word
    for (const raw of words) {
      const w = raw.replace(/^[^\p{L}]+|[^\p{L}\d]+$/gu, '')
      if (w.length < 3 || !/^\p{Lu}/u.test(w) || COMMON_CAPS.has(w)) continue
      if (!lower.includes(w.toLowerCase())) found.add(w)
    }
  }
  return [...found]
}

export function anonymise(text: string, name: string, replacement = 'the client'): string {
  if (!name.trim()) return text
  const esc = name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text.replace(new RegExp(`\\b${esc}\\b`, 'gi'), replacement)
}

const PLACEHOLDER_RE = /\[\[[^\]]*\]\]|\bTBD\b|\[add [^\]]*\]/i
export function hasPlaceholder(text: string): boolean {
  return PLACEHOLDER_RE.test(text)
}
