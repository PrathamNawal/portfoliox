// Ingest: Figma links, image URLs and video links → stored screens. Failures are per asset; one bad link
// never stops the run, it becomes a warning with a fix.
import { frameTexts, listFrames, parseFigmaUrl, FigmaError, type FigmaApi } from '../figma'
import type { Store } from '../store'
import type { Screen } from '../types'

export const MAX_FIGMA_FRAMES = 40
export const MAX_IMAGE_BYTES = 15 * 1024 * 1024

export type Fetcher = (url: string) => Promise<{ ok: boolean; status: number; contentType: string; bytes: Uint8Array }>

export const httpFetcher: Fetcher = async (url) => {
  const res = await fetch(url, { redirect: 'follow' })
  const buf = new Uint8Array(await res.arrayBuffer())
  return { ok: res.ok, status: res.status, contentType: res.headers.get('content-type') ?? '', bytes: buf }
}

const VIDEO_RE = /(youtube\.com\/watch|youtu\.be\/|vimeo\.com\/\d|loom\.com\/share\/|\.(mp4|webm|mov)(\?|$))/i
const IMAGE_EXT_RE = /\.(png|jpe?g|webp|gif)(\?|$)/i

export function classifyAsset(url: string): 'figma' | 'video' | 'image' | 'unknown' {
  if (parseFigmaUrl(url)) return 'figma'
  if (VIDEO_RE.test(url)) return 'video'
  if (IMAGE_EXT_RE.test(url)) return 'image'
  try { new URL(url) } catch { return 'unknown' }
  return 'image' // try it; the content type decides
}

/** Allows only public http(s) URLs, so a link can't make the server fetch internal addresses. */
export function isSafePublicUrl(raw: string): boolean {
  let u: URL
  try { u = new URL(raw) } catch { return false }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return false
  const h = u.hostname.toLowerCase()
  if (h === 'localhost' || h.endsWith('.local') || h.endsWith('.internal') || h === 'metadata.google.internal') return false
  if (/^(127\.|10\.|192\.168\.|169\.254\.|0\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h) || h.startsWith('[')) return false
  return true
}

/** Picks frames evenly when a file has more than the cap, keeping first and last. */
export function sampleFrames<T>(frames: T[], cap: number): T[] {
  if (frames.length <= cap) return frames
  const step = (frames.length - 1) / (cap - 1)
  return Array.from({ length: cap }, (_, i) => frames[Math.round(i * step)])
}

export interface IngestDeps { store: Store; figma: FigmaApi | null; fetcher: Fetcher }

export async function ingestAssets(userId: string, assets: string[], deps: IngestDeps, warnings: string[]): Promise<Screen[]> {
  const screens: Screen[] = []
  let order = 0
  const store = async (url: string, name: string, extra: Partial<Screen> = {}) => {
    if (!isSafePublicUrl(url)) { warnings.push(`Skipped ${url}: only public http(s) links can be imported.`); return }
    const r = await deps.fetcher(url)
    if (!r.ok) { warnings.push(`Could not download ${name} (HTTP ${r.status}). Check the link is public.`); return }
    if (!r.contentType.startsWith('image/')) { warnings.push(`Skipped ${name}: it is not an image (${r.contentType || 'unknown type'}). PDFs and docs are not supported in v1.`); return }
    if (r.bytes.length > MAX_IMAGE_BYTES) { warnings.push(`Skipped ${name}: larger than 15 MB.`); return }
    const stored = await deps.store.uploadAsset(userId, r.bytes, r.contentType)
    screens.push({ id: `s${order + 1}`, source: 'image', name, url: stored, kind: 'other', confidence: 0, order: order++, ...extra })
  }

  for (const raw of assets.map(a => a.trim()).filter(Boolean)) {
    const kind = classifyAsset(raw)
    if (kind === 'video') {
      screens.push({ id: `s${order + 1}`, source: 'video', name: 'Video', url: raw, kind: 'final', confidence: 0.9, order: order++ })
    } else if (kind === 'figma') {
      const ref = parseFigmaUrl(raw)!
      if (ref.isPrototype) {
        screens.push({ id: `s${order + 1}`, source: 'figma-embed', name: 'Prototype', url: raw, kind: 'prototype', confidence: 0.9, order: order++ })
        continue
      }
      if (!deps.figma) {
        warnings.push('A Figma link was given but no Figma token is set up. Add one in Dashboard → MCP, or export the frames and pass image URLs.')
        continue
      }
      try {
        const all = await listFrames(deps.figma, ref)
        const frames = sampleFrames(all, MAX_FIGMA_FRAMES)
        if (all.length > frames.length) warnings.push(`The Figma link has ${all.length} frames; imported ${frames.length} spread across the file. Link a specific page or frame to choose.`)
        if (!frames.length) { warnings.push('No frames found at that Figma link. Link a page or frame that holds your screens.'); continue }
        const texts = await frameTexts(deps.figma, ref.fileKey, frames.map(f => f.id))
        const images: Record<string, string | null> = {}
        for (let i = 0; i < frames.length; i += 20) Object.assign(images, await deps.figma.getImages(ref.fileKey, frames.slice(i, i + 20).map(f => f.id)))
        for (const f of frames) {
          const img = images[f.id]
          if (!img) { warnings.push(`Figma could not render frame "${f.name}".`); continue }
          await store(img, f.name, { source: 'figma', text: texts[f.id] || undefined, group: f.page })
        }
      } catch (err) {
        warnings.push(err instanceof FigmaError ? `${err.message} ${err.fix}` : `Figma import failed: ${(err as Error).message}`)
      }
    } else if (kind === 'image') {
      const name = decodeURIComponent(raw.split('/').pop()?.split('?')[0] ?? 'Image').replace(/\.[a-z]+$/i, '')
      try { await store(raw, name) } catch (err) { warnings.push(`Could not import ${raw}: ${(err as Error).message}`) }
    } else {
      warnings.push(`Skipped "${raw}": not a link the tool can read.`)
    }
  }
  return screens
}
