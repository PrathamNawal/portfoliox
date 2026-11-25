// Data access for the MCP server. Every tool goes through this interface, so the whole server can run
// against Supabase in production and an in-memory store in tests (lib/mcp/testing/memory-store.ts).
import crypto from 'crypto'
import type { CaseStudy, Profile } from '@/types'
import type { RunState } from './types'

export interface TokenRecord { id: string; userId: string; name: string; revoked: boolean }

export interface Store {
  // Auth
  findTokenByHash(hash: string): Promise<TokenRecord | null>
  touchToken(id: string): Promise<void>
  getFigmaTokenEnc(userId: string): Promise<string | null>

  // Profile, plan and credits
  getProfile(userId: string): Promise<Profile | null>
  setSlug(userId: string, slug: string): Promise<'ok' | 'taken'>
  isSlugTaken(slug: string, exceptUserId?: string): Promise<boolean>
  getCredits(userId: string): Promise<number>
  setCredits(userId: string, credits: number): Promise<void>
  getFreeCaseStudyLimit(): Promise<number>

  // Case studies
  listCaseStudies(userId: string): Promise<CaseStudy[]>
  getCaseStudy(userId: string, id: string): Promise<CaseStudy | null>
  insertCaseStudy(userId: string, row: Partial<CaseStudy>): Promise<CaseStudy>
  updateCaseStudy(userId: string, id: string, patch: Partial<CaseStudy> & { nda_password_hash?: string | null }): Promise<CaseStudy>

  // Assets
  uploadAsset(userId: string, bytes: Uint8Array, contentType: string): Promise<string>

  // Pipeline runs
  getRun(userId: string, runId: string): Promise<RunState | null>
  findRunByHash(userId: string, inputHash: string): Promise<RunState | null>
  latestRunForCase(userId: string, caseStudyId: string): Promise<RunState | null>
  saveRun(run: RunState): Promise<void>
  countRunsSince(userId: string, sinceIso: string): Promise<number>
}

export function assetPath(userId: string, bytes: Uint8Array, contentType: string): string {
  const hash = crypto.createHash('sha256').update(bytes).digest('hex').slice(0, 32)
  const ext = contentType.includes('jpeg') ? 'jpg' : contentType.includes('webp') ? 'webp' : contentType.includes('gif') ? 'gif' : 'png'
  // Content-addressed: re-importing the same file never creates a copy.
  return `${userId}/mcp/${hash}.${ext}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any

export class SupabaseStore implements Store {
  constructor(private db: Db) {}

  async findTokenByHash(hash: string) {
    const { data } = await this.db.from('mcp_tokens').select('id, user_id, name, revoked_at').eq('token_hash', hash).maybeSingle()
    if (!data) return null
    return { id: data.id, userId: data.user_id, name: data.name, revoked: !!data.revoked_at }
  }

  async touchToken(id: string) {
    await this.db.from('mcp_tokens').update({ last_used_at: new Date().toISOString() }).eq('id', id)
  }

  async getFigmaTokenEnc(userId: string) {
    const { data } = await this.db.from('mcp_user_settings').select('figma_token_enc').eq('user_id', userId).maybeSingle()
    return data?.figma_token_enc ?? null
  }

  async getProfile(userId: string) {
    const { data } = await this.db.from('profiles').select('*').eq('id', userId).maybeSingle()
    return data ?? null
  }

  async setSlug(userId: string, slug: string) {
    const { error } = await this.db.from('profiles').update({ slug }).eq('id', userId)
    if (error?.code === '23505') return 'taken' as const
    if (error) throw new Error(error.message)
    return 'ok' as const
  }

  async isSlugTaken(slug: string, exceptUserId?: string) {
    let q = this.db.from('profiles').select('id').eq('slug', slug)
    if (exceptUserId) q = q.neq('id', exceptUserId)
    const { data } = await q.maybeSingle()
    return !!data
  }

  async getCredits(userId: string) {
    const { data } = await this.db.from('ai_credits').select('credits_remaining').eq('user_id', userId).maybeSingle()
    return data?.credits_remaining ?? 10
  }

  async setCredits(userId: string, credits: number) {
    await this.db.from('ai_credits').upsert({ user_id: userId, credits_remaining: credits, updated_at: new Date().toISOString() })
  }

  async getFreeCaseStudyLimit() {
    const { data } = await this.db.from('app_settings').select('value').eq('key', 'free_tier_case_study_limit').maybeSingle()
    return parseInt(data?.value || '6', 10)
  }

  async listCaseStudies(userId: string) {
    const { data, error } = await this.db.from('case_studies').select('*').eq('user_id', userId).order('display_order', { ascending: true })
    if (error) throw new Error(error.message)
    return data ?? []
  }

  async getCaseStudy(userId: string, id: string) {
    const { data } = await this.db.from('case_studies').select('*').eq('id', id).eq('user_id', userId).maybeSingle()
    return data ?? null
  }

  async insertCaseStudy(userId: string, row: Partial<CaseStudy>) {
    const { data, error } = await this.db.from('case_studies').insert({ ...row, user_id: userId }).select().single()
    if (error) throw new Error(error.message)
    return data
  }

  async updateCaseStudy(userId: string, id: string, patch: Partial<CaseStudy>) {
    const { data, error } = await this.db.from('case_studies').update(patch).eq('id', id).eq('user_id', userId).select().single()
    if (error) throw new Error(error.message)
    return data
  }

  async uploadAsset(userId: string, bytes: Uint8Array, contentType: string) {
    const path = assetPath(userId, bytes, contentType)
    const bucket = 'case-study-images'
    const { error } = await this.db.storage.from(bucket).upload(path, bytes, { contentType, upsert: true })
    if (error) throw new Error(`Upload failed: ${error.message}`)
    return this.db.storage.from(bucket).getPublicUrl(path).data.publicUrl as string
  }

  private fromRow(row: { state: RunState } | null) {
    return row ? row.state : null
  }

  async getRun(userId: string, runId: string) {
    const { data } = await this.db.from('mcp_runs').select('state').eq('id', runId).eq('user_id', userId).maybeSingle()
    return this.fromRow(data)
  }

  async findRunByHash(userId: string, inputHash: string) {
    const { data } = await this.db.from('mcp_runs').select('state').eq('user_id', userId).eq('input_hash', inputHash)
      .neq('status', 'failed').order('created_at', { ascending: false }).limit(1).maybeSingle()
    return this.fromRow(data)
  }

  async latestRunForCase(userId: string, caseStudyId: string) {
    const { data } = await this.db.from('mcp_runs').select('state').eq('user_id', userId).eq('case_study_id', caseStudyId)
      .order('updated_at', { ascending: false }).limit(1).maybeSingle()
    return this.fromRow(data)
  }

  async saveRun(run: RunState) {
    const { error } = await this.db.from('mcp_runs').upsert({
      id: run.runId,
      user_id: run.userId,
      case_study_id: run.caseStudyId ?? null,
      input_hash: run.inputHash,
      stage: run.stage,
      status: run.status,
      state: run,
      updated_at: new Date().toISOString(),
    })
    if (error) throw new Error(`Could not save run: ${error.message}`)
  }

  async countRunsSince(userId: string, sinceIso: string) {
    const { count } = await this.db.from('mcp_runs').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', sinceIso)
    return count ?? 0
  }
}
