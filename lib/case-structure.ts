import { asLabel, asStep } from './case-copy'

// Turns a case study's plain narrative into typed nodes so repeated patterns read as structure, not as a run of
// paragraphs. Everything is conservative: a block only becomes a heading, step, card or list when it matches a
// pattern exactly; anything else stays a paragraph. Patterns seen in published case studies:
//   "01. Salary Planner"                      numbered title            -> step
//   "01. Plan — Understand monthly income."   numbered term - description (2+ in a row) -> numbered cards
//   "Brand presence: Created a visual..."     label: description        (3+ in a row)  -> cards; fewer -> bold lead-in
//   "Align on positioning\nCollaborated..."   title line + description  (3+ in a row)  -> numbered cards
//   "Problem Statement" then a paragraph      short title               -> sub-heading
//   three or more one-line sentences          a list in disguise        -> bullet list

export type Node =
  | { k: 'p'; text: string; lead?: boolean }
  | { k: 'step'; n: string; title: string }
  | { k: 'h3'; text: string }
  | { k: 'label'; text: string }
  | { k: 'ul' | 'ol'; items: string[] }
  | { k: 'defs'; items: { n?: string; term: string; text: string }[] }

const BULLET = /^[-*•]\s+/
const NUMBERED = /^\d+\.\s+/

interface Block { kind: 'ul' | 'ol' | 'p'; lines: string[] }

/** Lines grouped into blocks: blank lines separate blocks, and bullet or numbered runs form their own blocks. */
export function parseBlocks(text: string): Block[] {
  const lines = text.split('\n')
  const blocks: Block[] = []
  let i = 0
  while (i < lines.length) {
    const t = lines[i].trim()
    if (t === '') { i++; continue }
    const kind = BULLET.test(t) ? 'ul' : NUMBERED.test(t) ? 'ol' : null
    if (kind) {
      const re = kind === 'ul' ? BULLET : NUMBERED
      const items: string[] = []
      while (i < lines.length && re.test(lines[i].trim())) { items.push(lines[i].trim().replace(re, '')); i++ }
      blocks.push({ kind, lines: items })
      continue
    }
    const para: string[] = []
    while (i < lines.length && lines[i].trim() !== '' && !BULLET.test(lines[i].trim()) && !NUMBERED.test(lines[i].trim())) { para.push(lines[i].trim()); i++ }
    blocks.push({ kind: 'p', lines: para })
  }
  return blocks
}

const words = (s: string) => s.trim().split(/\s+/).length
const NO_END = /[.!?:;,]$/
const DEF = /^(.{2,40}?)\s+[—–]\s+(\S.*)$/
const isTitle = (s: string) => s.length <= 60 && words(s) <= 6 && !NO_END.test(s) && /^[A-Z0-9]/.test(s)

type Cls =
  | { t: 'ul' | 'ol'; lines: string[] }
  | { t: 'step'; n: string; title: string }
  | { t: 'label'; text: string }
  | { t: 'numDef'; n: string; term: string; text: string }
  | { t: 'labelDef'; term: string; text: string }
  | { t: 'titleDesc'; term: string; text: string }
  | { t: 'defLines'; items: { term: string; text: string }[] }
  | { t: 'title'; text: string }
  | { t: 'short'; text: string }
  | { t: 'p'; text: string }

function classify(b: Block): Cls {
  if (b.kind === 'ul') return { t: 'ul', lines: b.lines }
  if (b.kind === 'ol') {
    if (b.lines.length > 1) return { t: 'ol', lines: b.lines }
    const rest = b.lines[0]
    const m = rest.match(DEF)
    return m ? { t: 'numDef', n: '', term: m[1], text: m[2] } : rest.length <= 90 && !/[.!?:]$/.test(rest) ? { t: 'step', n: '', title: rest } : { t: 'ol', lines: b.lines }
  }
  if (b.lines.length === 1) {
    const line = b.lines[0]
    const step = asStep(line)
    if (step) return { t: 'step', n: step.n, title: step.title }
    const label = asLabel(line)
    if (label) return { t: 'label', text: label }
    const ld = line.match(/^([A-Z][^:.!?]{1,38}):\s+(\S.+)$/)
    if (ld && words(ld[1]) <= 5) return { t: 'labelDef', term: ld[1], text: ld[2] }
    if (isTitle(line)) return { t: 'title', text: line }
    if (line.length <= 80 && /[.!?]$/.test(line)) return { t: 'short', text: line }
    return { t: 'p', text: line }
  }
  if (b.lines.length === 2 && isTitle(b.lines[0]) && b.lines[1].length >= 30) return { t: 'titleDesc', term: b.lines[0], text: b.lines[1] }
  if (b.lines.length >= 2 && b.lines.every(l => DEF.test(l))) return { t: 'defLines', items: b.lines.map(l => { const m = l.match(DEF)!; return { term: m[1], text: m[2] } }) }
  return { t: 'p', text: b.lines.join('\n') }
}

export function structure(narrative: string): Node[] {
  // numbered blocks keep their number (parseBlocks strips it), so read it from the source lines
  const numbers: string[] = (narrative ?? '').split('\n').map(l => l.trim()).filter(l => NUMBERED.test(l)).map(l => (l.match(/^(\d+)\./) as RegExpMatchArray)[1].padStart(2, '0'))
  let numIdx = 0
  const blocks = parseBlocks(narrative ?? '')
  const cls: Cls[] = blocks.map(b => {
    const c = classify(b)
    if (b.kind === 'ol') {
      const n = numbers[numIdx]
      numIdx += b.lines.length
      if (c.t === 'step' || c.t === 'numDef') return { ...c, n }
    }
    return c
  })

  const out: Node[] = []
  for (let i = 0; i < cls.length; i++) {
    const c = cls[i]
    const run = (t: Cls['t']) => { let j = i; while (j < cls.length && cls[j].t === t) j++; return j - i }
    switch (c.t) {
      case 'ul': case 'ol': out.push({ k: c.t, items: c.lines }); break
      case 'step': out.push({ k: 'step', n: c.n, title: c.title }); break
      case 'label': out.push({ k: 'label', text: c.text }); break
      case 'numDef': {
        const n = run('numDef')
        const items = cls.slice(i, i + n) as Extract<Cls, { t: 'numDef' }>[]
        if (n >= 2) out.push({ k: 'defs', items: items.map(x => ({ n: x.n, term: x.term, text: x.text })) })
        else out.push({ k: 'p', text: `**${items[0].term}** — ${items[0].text}` })
        i += n - 1
        break
      }
      case 'labelDef': {
        const n = run('labelDef')
        const items = cls.slice(i, i + n) as Extract<Cls, { t: 'labelDef' }>[]
        if (n >= 3) out.push({ k: 'defs', items: items.map(x => ({ term: x.term, text: x.text })) })
        else items.forEach(x => out.push({ k: 'p', text: `**${x.term}:** ${x.text}` }))
        i += n - 1
        break
      }
      case 'titleDesc': {
        const n = run('titleDesc')
        const items = cls.slice(i, i + n) as Extract<Cls, { t: 'titleDesc' }>[]
        if (n >= 3) out.push({ k: 'defs', items: items.map((x, idx) => ({ n: String(idx + 1).padStart(2, '0'), term: x.term, text: x.text })) })
        else items.forEach(x => { out.push({ k: 'h3', text: x.term }); out.push({ k: 'p', text: x.text }) })
        i += n - 1
        break
      }
      case 'defLines': out.push({ k: 'defs', items: c.items }); break
      case 'short': {
        const n = run('short')
        const items = cls.slice(i, i + n) as Extract<Cls, { t: 'short' }>[]
        if (n >= 3) out.push({ k: 'ul', items: items.map(x => x.text) })
        else items.forEach(x => out.push({ k: 'p', text: x.text }))
        i += n - 1
        break
      }
      case 'title': out.push(i + 1 < cls.length && cls[i + 1].t !== 'title' ? { k: 'h3', text: c.text } : { k: 'p', text: c.text }); break
      case 'p': out.push({ k: 'p', text: c.text }); break
    }
  }
  // a section that opens with a long paragraph gets a lead; one that opens with a step, label or heading does not
  const first = out[0]
  if (first && first.k === 'p' && first.text.length >= 60) first.lead = true
  return out
}
