#!/usr/bin/env node
// WCAG AA contrast audit for published-portfolio themes.
//   npm run audit:themes
// Reads app/themes.css (+ :root from app/globals.css), resolves each theme's tokens, and checks
// text/background pairs using the flat --t-*-solid stand-ins (worst-case colours, see themes.css).
// Exit code 1 when a pair fails and is not listed in BASELINE.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const themesCss = readFileSync(join(root, 'app/themes.css'), 'utf8')
const globalsCss = readFileSync(join(root, 'app/globals.css'), 'utf8')
const themeIds = [...readFileSync(join(root, 'lib/themes.ts'), 'utf8').matchAll(/^\s+'([a-z]+)',$/gm)].map(m => m[1])

const MIN = 4.5

// Known failures in the CURRENT default theme. Changing "light" is a product decision, so it is
// reported but does not fail the audit. Remove entries as they are fixed.
const BASELINE = {
  light: new Set(['px-text-3 on page', 'on-surface-3 on surface', 'on-hero-3 on hero', 'on-header-3 on header', 'link on surface', 'button text on button']),
}

// ── tiny CSS custom-property extractor ───────────────────────────────────────
function stripComments(css) { return css.replace(/\/\*[\s\S]*?\*\//g, '') }

function blocks(css) {
  const out = []
  const src = stripComments(css)
  let i = 0
  while (i < src.length) {
    const open = src.indexOf('{', i)
    if (open < 0) break
    const rawHead = src.slice(i, open)
    const head = rawHead.slice(Math.max(rawHead.lastIndexOf(';'), rawHead.lastIndexOf('}')) + 1).trim()
    let depth = 1, j = open + 1
    while (j < src.length && depth) { if (src[j] === '{') depth++; else if (src[j] === '}') depth--; j++ }
    const body = src.slice(open + 1, j - 1)
    if (head.startsWith('@media') || head.startsWith('@supports')) out.push(...blocks(body))
    else if (!head.startsWith('@')) out.push({ selector: head, body })
    i = j
  }
  return out
}

function declarations(body) {
  const decls = {}
  let depth = 0, cur = ''
  const flush = () => {
    const idx = cur.indexOf(':')
    if (idx > 0) {
      const name = cur.slice(0, idx).trim()
      if (name.startsWith('--')) decls[name] = cur.slice(idx + 1).trim()
    }
    cur = ''
  }
  for (const ch of body) {
    if (ch === '(') depth++
    if (ch === ')') depth--
    if (ch === ';' && depth === 0) flush(); else cur += ch
  }
  flush()
  return decls
}

const rootVars = {}
for (const b of blocks(globalsCss)) if (b.selector === ':root') Object.assign(rootVars, declarations(b.body))
const baseVars = {}
const themeVars = {}
for (const b of blocks(themesCss)) {
  const m = b.selector.match(/^\.pxp\[data-pxtheme="([a-z]+)"\]$/)
  if (b.selector === '.pxp') Object.assign(baseVars, declarations(b.body))
  else if (m) themeVars[m[1]] = { ...(themeVars[m[1]] || {}), ...declarations(b.body) }
}

function lookup(theme, name) {
  return themeVars[theme]?.[name] ?? baseVars[name] ?? rootVars[name]
}

function resolve(theme, name, seen = new Set()) {
  if (seen.has(name)) return null
  seen.add(name)
  const raw = lookup(theme, name)
  if (raw == null) return null
  const m = raw.match(/^var\(\s*(--[\w-]+)\s*(?:,\s*([^)]+))?\)$/)
  if (m) return resolve(theme, m[1], seen) ?? m[2]?.trim() ?? null
  return raw
}

// ── colour maths ─────────────────────────────────────────────────────────────
function parseColor(v) {
  if (!v) return null
  v = v.trim().toLowerCase()
  let m = v.match(/^#([0-9a-f]{3})$/)
  if (m) return [...m[1]].map(c => parseInt(c + c, 16))
  m = v.match(/^#([0-9a-f]{6})$/)
  if (m) return [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16))
  m = v.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)$/)
  if (m && (m[4] === undefined || Number(m[4]) === 1)) return [m[1], m[2], m[3]].map(Number)
  return null
}
const lum = ([r, g, b]) => { const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) }
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }

// [label, foreground token, background token]
const PAIRS = [
  ['px-text on page', 'px-text', 't-page-solid'],
  ['px-text-2 on page', 'px-text-2', 't-page-solid'],
  ['px-text-3 on page', 'px-text-3', 't-page-solid'],
  ['on-hero on hero', 't-on-hero', 't-hero-solid'],
  ['on-hero-2 on hero', 't-on-hero-2', 't-hero-solid'],
  ['on-hero-3 on hero', 't-on-hero-3', 't-hero-solid'],
  ['on-header on header', 't-on-header', 't-header-solid'],
  ['on-header-3 on header', 't-on-header-3', 't-header-solid'],
  ['on-surface on surface', 't-on-surface', 't-surface-solid'],
  ['on-surface-2 on surface', 't-on-surface-2', 't-surface-solid'],
  ['on-surface-3 on surface', 't-on-surface-3', 't-surface-solid'],
  ['link on surface', 't-link', 't-surface-solid'],
  ['chip text on chip', 't-chip-fg', 't-chip-solid'],
  ['button text on button', 't-btn-fg', 't-btn-solid'],
  ['ghost text on hero', 't-ghost-fg', 't-ghost-solid'],
]

let failed = 0, baselined = 0
for (const theme of themeIds) {
  const rows = []
  for (const [label, fg, bg] of PAIRS) {
    const f = parseColor(resolve(theme, `--${fg}`)), b = parseColor(resolve(theme, `--${bg}`))
    if (!f || !b) { rows.push({ label, status: 'UNRESOLVED', detail: `${fg}=${resolve(theme, `--${fg}`)} ${bg}=${resolve(theme, `--${bg}`)}` }); continue }
    const r = ratio(f, b)
    rows.push({ label, r, status: r >= MIN ? 'ok' : BASELINE[theme]?.has(label) ? 'baseline' : 'FAIL' })
  }
  const bad = rows.filter(r => r.status === 'FAIL' || r.status === 'UNRESOLVED')
  const base = rows.filter(r => r.status === 'baseline')
  failed += bad.length; baselined += base.length
  console.log(`${bad.length ? '✗' : '✓'} ${theme}${base.length ? `  (${base.length} known baseline)` : ''}`)
  for (const r of [...bad, ...base]) console.log(`    ${r.status.padEnd(10)} ${r.label}${r.r ? `  ${r.r.toFixed(2)}:1` : ''}${r.detail ? `  ${r.detail}` : ''}`)
}
console.log(`\n${themeIds.length} themes, ${failed} failing pair(s), ${baselined} known baseline pair(s). Threshold ${MIN}:1.`)
process.exit(failed ? 1 : 0)
