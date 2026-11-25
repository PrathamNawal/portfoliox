'use client'

// Connect an AI assistant (Claude, Cursor, any MCP client) to PortfolioX: create a token, copy the config,
// optionally connect Figma so build_case_study can read design files.
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Btn } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface TokenRow { id: string; name: string; created_at: string; last_used_at: string | null }

const card: React.CSSProperties = { background: 'var(--px-surface)', border: '1px solid var(--px-border)', borderRadius: 'var(--px-r-lg)', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }
const code: React.CSSProperties = { fontFamily: 'ui-monospace, monospace', fontSize: 12, background: 'var(--px-surface-2)', border: '1px solid var(--px-border)', borderRadius: 8, padding: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: 'var(--px-text)', margin: 0 }
const muted: React.CSSProperties = { fontSize: 13, color: 'var(--px-text-2)', margin: 0, lineHeight: 1.5 }

export default function McpSettingsPage() {
  const router = useRouter()
  const [tokens, setTokens] = useState<TokenRow[]>([])
  const [figma, setFigma] = useState(false)
  const [name, setName] = useState('Claude')
  const [fresh, setFresh] = useState<string | null>(null)
  const [figmaToken, setFigmaToken] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const endpoint = `${origin}/api/mcp`

  const load = useCallback(async () => {
    const res = await fetch('/api/mcp/tokens')
    if (!res.ok) return
    const data = await res.json()
    setTokens(data.tokens)
    setFigma(data.figma_connected)
  }, [])
  useEffect(() => { load() }, [load])

  const create = async () => {
    setBusy(true); setError('')
    const res = await fetch('/api/mcp/tokens', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) })
    const data = await res.json()
    setBusy(false)
    if (!res.ok) { setError(data.error || 'Could not create a token'); return }
    setFresh(data.token)
    load()
  }

  const revoke = async (id: string) => {
    await fetch(`/api/mcp/tokens?id=${id}`, { method: 'DELETE' })
    load()
  }

  const saveFigma = async (value: string) => {
    setBusy(true); setError('')
    const res = await fetch('/api/mcp/tokens', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ figma_token: value }) })
    const data = await res.json()
    setBusy(false)
    if (!res.ok) { setError(data.error || 'Could not save the Figma token'); return }
    setFigma(data.figma_connected); setFigmaToken('')
  }

  const config = JSON.stringify({ mcpServers: { portfoliox: { type: 'http', url: endpoint, headers: { Authorization: `Bearer ${fresh ?? 'pxm_your_token'}` } } } }, null, 2)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--px-bg)', padding: '32px 16px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <Btn variant="ghost" size="sm" icon="arrowLeft" onClick={() => router.push('/dashboard')}>Dashboard</Btn>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--px-text)', margin: '12px 0 4px' }}>Connect an AI assistant</h1>
          <p style={muted}>Give Claude (or any MCP client) your project brief, process and Figma link. It builds the case study draft, asks only what matters, and publishes when you confirm.</p>
        </div>

        {error && <p style={{ ...muted, color: '#C94040' }}>{error}</p>}

        <section style={card}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--px-text)' }}>1. Create a token</h2>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}><Input label="Name" value={name} onChange={setName} maxLength={60} /></div>
            <Btn onClick={create} disabled={busy}>Create token</Btn>
          </div>
          {fresh && (
            <>
              <p style={{ ...muted, color: 'var(--px-text)', fontWeight: 600 }}>Copy this token now. It won&apos;t be shown again.</p>
              <pre style={code}>{fresh}</pre>
              <Btn variant="secondary" size="sm" icon="copy" onClick={() => navigator.clipboard.writeText(fresh)}>Copy token</Btn>
            </>
          )}
          {tokens.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {tokens.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, fontSize: 13, color: 'var(--px-text)' }}>
                  <span>{t.name} <span style={{ color: 'var(--px-text-3)' }}>· {t.last_used_at ? `last used ${new Date(t.last_used_at).toLocaleDateString()}` : 'never used'}</span></span>
                  <Btn variant="danger" size="xs" onClick={() => revoke(t.id)}>Revoke</Btn>
                </div>
              ))}
            </div>
          )}
        </section>

        <section style={card}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--px-text)' }}>2. Add PortfolioX to your assistant</h2>
          <p style={muted}>Server URL: <code>{endpoint}</code>. Send the token as a Bearer header. For Claude Code: <code>claude mcp add --transport http portfoliox {endpoint} --header &quot;Authorization: Bearer {fresh ?? 'pxm_…'}&quot;</code>. For JSON-configured clients:</p>
          <pre style={code}>{config}</pre>
        </section>

        <section style={card}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--px-text)' }}>3. Connect Figma (optional)</h2>
          <p style={muted}>
            {figma ? 'Figma is connected. The assistant can read files your Figma account can open.' : 'Lets the assistant import frames straight from your Figma links. Create a personal access token in Figma (Settings → Security → Personal access tokens, read-only file access). Without it, pass exported image links instead.'}
          </p>
          {figma
            ? <Btn variant="outline" size="sm" onClick={() => saveFigma('')} disabled={busy}>Disconnect Figma</Btn>
            : (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}><Input label="Figma personal access token" type="password" value={figmaToken} onChange={setFigmaToken} /></div>
                <Btn onClick={() => saveFigma(figmaToken)} disabled={busy || !figmaToken}>Connect</Btn>
              </div>
            )}
        </section>
      </div>
    </div>
  )
}
