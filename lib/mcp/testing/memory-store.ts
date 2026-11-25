// In-memory Store for tests. Mirrors SupabaseStore's behaviour, including user scoping on every read.
import crypto from 'crypto'
import type { CaseStudy, Profile } from '@/types'
import type { RunState } from '../types'
import { assetPath, type Store, type TokenRecord } from '../store'

export class MemoryStore implements Store {
  tokens = new Map<string, TokenRecord>() // keyed by hash
  profiles = new Map<string, Profile>()
  credits = new Map<string, number>()
  cases = new Map<string, CaseStudy>()
  runs = new Map<string, RunState & { createdAt: string }>()
  assets = new Map<string, Uint8Array>()
  figmaTokens = new Map<string, string>()
  freeLimit = 6

  async findTokenByHash(hash: string) { return this.tokens.get(hash) ?? null }
  async touchToken() {}
  async getFigmaTokenEnc(userId: string) { return this.figmaTokens.get(userId) ?? null }

  async getProfile(userId: string) { return this.profiles.get(userId) ?? null }
  async setSlug(userId: string, slug: string) {
    if (await this.isSlugTaken(slug, userId)) return 'taken' as const
    const p = this.profiles.get(userId)
    if (p) p.slug = slug
    return 'ok' as const
  }
  async isSlugTaken(slug: string, exceptUserId?: string) {
    return [...this.profiles.values()].some(p => p.slug === slug && p.id !== exceptUserId)
  }
  async getCredits(userId: string) { return this.credits.get(userId) ?? 10 }
  async setCredits(userId: string, c: number) { this.credits.set(userId, c) }
  async getFreeCaseStudyLimit() { return this.freeLimit }

  async listCaseStudies(userId: string) { return [...this.cases.values()].filter(c => c.user_id === userId) }
  async getCaseStudy(userId: string, id: string) {
    const c = this.cases.get(id)
    return c && c.user_id === userId ? c : null
  }
  async insertCaseStudy(userId: string, row: Partial<CaseStudy>) {
    const now = new Date().toISOString()
    const c = {
      id: crypto.randomUUID(), user_id: userId, title: 'Untitled', problem: null, what_i_did: null, outcome_notes: null,
      cover_image_url: null, blocks: [], metadata: {}, section_labels: {}, nda_enabled: false, published: false,
      display_order: 0, ai_generated: {}, sections: null, discipline: null, overview_data: null,
      created_at: now, updated_at: now, ...row,
    } as CaseStudy
    this.cases.set(c.id, c)
    return c
  }
  async updateCaseStudy(userId: string, id: string, patch: Partial<CaseStudy>) {
    const c = await this.getCaseStudy(userId, id)
    if (!c) throw new Error('Not found')
    Object.assign(c, patch, { updated_at: new Date().toISOString() })
    return c
  }

  async uploadAsset(userId: string, bytes: Uint8Array, contentType: string) {
    const path = assetPath(userId, bytes, contentType)
    this.assets.set(path, bytes)
    return `https://storage.test/${path}`
  }

  async getRun(userId: string, runId: string) {
    const r = this.runs.get(runId)
    return r && r.userId === userId ? structuredClone(r) : null
  }
  async findRunByHash(userId: string, inputHash: string) {
    const r = [...this.runs.values()].reverse().find(x => x.userId === userId && x.inputHash === inputHash && x.status !== 'failed')
    return r ? structuredClone(r) : null
  }
  async latestRunForCase(userId: string, caseStudyId: string) {
    const r = [...this.runs.values()].reverse().find(x => x.userId === userId && x.caseStudyId === caseStudyId)
    return r ? structuredClone(r) : null
  }
  async saveRun(run: RunState) {
    const prev = this.runs.get(run.runId)
    this.runs.delete(run.runId) // keep insertion order = recency
    this.runs.set(run.runId, { ...structuredClone(run), createdAt: prev?.createdAt ?? new Date().toISOString() })
  }
  async countRunsSince(userId: string, sinceIso: string) {
    return [...this.runs.values()].filter(r => r.userId === userId && r.createdAt >= sinceIso).length
  }
}
