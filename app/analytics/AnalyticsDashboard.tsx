'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Btn } from '@/components/ui/Button'
import { PXLogo } from '@/components/ui/Misc'
import { Icon } from '@/components/ui/Icon'

interface AnalyticsEvent {
  id: number
  case_study_id: string | null
  event_type: string
  visitor_fingerprint: string | null
  time_on_page_seconds: number | null
  recorded_at: string
}

interface CaseStudy { id: string; title: string; published: boolean }

interface Props {
  events: AnalyticsEvent[]
  caseStudies: CaseStudy[]
  slug: string | null
}

type Range = '7d' | '30d' | '90d'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
}

// ── Simple SVG bar chart ──────────────────────────────────────────────────────
function BarChart({ data, label }: { data: { date: string; count: number }[]; label: string }) {
  const max = Math.max(...data.map(d => d.count), 1)
  const w = 640
  const h = 120
  const barW = Math.max(4, Math.floor((w - 40) / data.length) - 2)
  const gap = Math.floor((w - 40) / data.length)

  // Show every nth label so they don't overlap
  const labelEvery = data.length > 30 ? 7 : data.length > 14 ? 3 : 1

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${w} ${h + 28}`} style={{ width: '100%', minWidth: 300, display: 'block' }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(pct => (
          <line key={pct} x1={0} x2={w} y1={h - h * pct} y2={h - h * pct} stroke="var(--px-border)" strokeWidth={1} />
        ))}
        {/* Bars */}
        {data.map((d, i) => {
          const barH = Math.max(2, (d.count / max) * (h - 8))
          const x = 20 + i * gap
          const y = h - barH
          return (
            <g key={d.date}>
              <rect x={x} y={y} width={barW} height={barH} rx={2}
                fill={d.count > 0 ? 'var(--px-accent)' : 'var(--px-surface-3)'}
                opacity={d.count > 0 ? 0.85 : 0.4} />
              {/* Tooltip on hover (via title) */}
              <title>{d.date}: {d.count} visitor{d.count !== 1 ? 's' : ''}</title>
            </g>
          )
        })}
        {/* X-axis labels */}
        {data.map((d, i) => {
          if (i % labelEvery !== 0) return null
          const x = 20 + i * gap + barW / 2
          return (
            <text key={d.date} x={x} y={h + 20} textAnchor="middle" fontSize={10} fill="var(--px-text-3)" fontFamily="var(--px-font)">
              {formatDate(d.date + 'T00:00:00')}
            </text>
          )
        })}
      </svg>
    </div>
  )
}

// ── Stats card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div style={{ background: 'var(--px-surface)', border: '1px solid var(--px-border)', borderRadius: 'var(--px-r-lg)', padding: '20px 22px', flex: 1, minWidth: 140 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--px-text-3)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.04em', color: accent ? 'var(--px-accent)' : 'var(--px-text)', marginBottom: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--px-text-3)' }}>{sub}</div>}
    </div>
  )
}

// ── Main dashboard ────────────────────────────────────────────────────────────
export function AnalyticsDashboard({ events, caseStudies, slug }: Props) {
  const router = useRouter()
  const [range, setRange] = useState<Range>('30d')
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)

  // Filter events by selected range
  const rangeDays = range === '7d' ? 7 : range === '30d' ? 30 : 90
  const rangeStart = useMemo(() => new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000), [rangeDays])

  const filteredEvents = useMemo(() =>
    events.filter(e => new Date(e.recorded_at) >= rangeStart),
    [events, rangeStart]
  )

  // Unique visitors (by fingerprint, page_view events only)
  const pageViews = filteredEvents.filter(e => e.event_type === 'page_view')
  const uniqueVisitors = new Set(pageViews.map(e => e.visitor_fingerprint).filter(Boolean)).size

  // Visitors over time (daily unique fingerprints)
  const dailyMap = useMemo(() => {
    const map: Record<string, Set<string>> = {}
    // Fill in all days in range
    for (let d = 0; d < rangeDays; d++) {
      const date = new Date(rangeStart.getTime() + d * 24 * 60 * 60 * 1000)
      const key = date.toISOString().slice(0, 10)
      if (!map[key]) map[key] = new Set()
    }
    pageViews.forEach(e => {
      const key = e.recorded_at.slice(0, 10)
      if (!map[key]) map[key] = new Set()
      if (e.visitor_fingerprint) map[key].add(e.visitor_fingerprint)
    })
    return map
  }, [pageViews, rangeStart, rangeDays])

  const chartData = Object.entries(dailyMap).sort(([a], [b]) => a.localeCompare(b)).map(([date, visitors]) => ({ date, count: visitors.size }))

  // Peak day
  const peakDay = chartData.reduce((best, d) => d.count > best.count ? d : best, { date: '', count: 0 })

  // Case study stats
  const csViews = filteredEvents.filter(e => e.event_type === 'case_study_view')
  const caseStats = useMemo(() => {
    const map: Record<string, { views: Set<string>; times: number[] }> = {}
    csViews.forEach(e => {
      if (!e.case_study_id) return
      if (!map[e.case_study_id]) map[e.case_study_id] = { views: new Set(), times: [] }
      if (e.visitor_fingerprint) map[e.case_study_id].views.add(e.visitor_fingerprint)
      if (e.time_on_page_seconds) map[e.case_study_id].times.push(e.time_on_page_seconds)
    })
    return map
  }, [csViews])

  const caseRows = caseStudies.map(cs => {
    const stat = caseStats[cs.id]
    const views = stat ? stat.views.size : 0
    const avgTime = stat && stat.times.length > 0
      ? Math.round(stat.times.reduce((a, b) => a + b, 0) / stat.times.length)
      : 0
    return { ...cs, views, avgTime }
  }).sort((a, b) => b.views - a.views)

  const isEmpty = filteredEvents.length === 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--px-bg)' }}>
      {/* Nav */}
      <div style={{ height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: '1px solid var(--px-border)', background: 'var(--px-surface)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <PXLogo size={22} />
          <div style={{ width: 1, height: 16, background: 'var(--px-border)' }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--px-text)', letterSpacing: '-0.02em' }}>Insights</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {slug && (
            <a href={`https://${slug}.portfoliox.me`} target="_blank" rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--px-text-3)', textDecoration: 'none', fontWeight: 500 }}>
              <Icon name="externalLink" size={12} /> {slug}.portfoliox.me
            </a>
          )}
          <Btn variant="secondary" size="sm" icon="arrowLeft" onClick={() => router.push('/dashboard')}>Builder</Btn>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 28px 64px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--px-text)', marginBottom: 3 }}>Portfolio analytics</h1>
              <p style={{ fontSize: 13, color: 'var(--px-text-3)' }}>No PII collected · Visitors are anonymous</p>
            </div>
            {/* Range toggle */}
            <div style={{ display: 'flex', background: 'var(--px-surface-2)', border: '1px solid var(--px-border)', borderRadius: 8, padding: 3 }}>
              {(['7d', '30d', '90d'] as Range[]).map(r => (
                <button key={r} onClick={() => setRange(r)}
                  style={{ padding: '5px 14px', fontSize: 12, fontWeight: 600, borderRadius: 5, background: range === r ? 'var(--px-surface)' : 'transparent', color: range === r ? 'var(--px-text)' : 'var(--px-text-3)', border: range === r ? '1px solid var(--px-border)' : '1px solid transparent', cursor: 'pointer', fontFamily: 'var(--px-font)', transition: 'all 0.15s', boxShadow: range === r ? 'var(--px-shadow-sm)' : 'none' }}>
                  {r === '7d' ? 'Last 7 days' : r === '30d' ? 'Last 30 days' : 'Last 90 days'}
                </button>
              ))}
            </div>
          </div>

          {isEmpty ? (
            /* ── Empty state ── */
            <div style={{ background: 'var(--px-surface)', border: '1px solid var(--px-border)', borderRadius: 'var(--px-r-xl)', padding: '64px 32px', textAlign: 'center' }}>
              {/* Ghost chart bars */}
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 4, height: 80, marginBottom: 28, opacity: 0.15 }}>
                {[40, 65, 30, 80, 55, 70, 45, 90, 60, 75, 50, 85].map((h, i) => (
                  <div key={i} style={{ width: 20, height: h, borderRadius: 3, background: 'var(--px-text)', animation: `px-shimmer 1.4s infinite ${i * 100}ms` }} />
                ))}
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--px-text)', marginBottom: 8, letterSpacing: '-0.02em' }}>No visitors yet</h2>
              <p style={{ fontSize: 14, color: 'var(--px-text-3)', lineHeight: 1.6, maxWidth: 360, margin: '0 auto 24px' }}>
                Analytics will appear here once someone visits your published portfolio. Share your link to get started.
              </p>
              {slug ? (
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <button onClick={() => navigator.clipboard.writeText(`https://${slug}.portfoliox.me`)}
                    style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', fontSize: 13, fontWeight: 600, borderRadius: 'var(--px-r)', background: 'var(--px-surface-2)', border: '1px solid var(--px-border)', color: 'var(--px-text)', cursor: 'pointer', fontFamily: 'var(--px-font)' }}>
                    <Icon name="copy" size={14} /> Copy portfolio link
                  </button>
                  <a href={`https://${slug}.portfoliox.me`} target="_blank" rel="noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', fontSize: 13, fontWeight: 600, borderRadius: 'var(--px-r)', background: 'var(--px-accent)', color: '#fff', textDecoration: 'none' }}>
                    <Icon name="externalLink" size={14} /> Open portfolio
                  </a>
                </div>
              ) : (
                <Btn variant="primary" onClick={() => router.push('/dashboard')}>Publish your portfolio first</Btn>
              )}
            </div>
          ) : (
            <>
              {/* Stats row */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                <StatCard label="Unique visitors" value={uniqueVisitors} sub={`in the last ${rangeDays} days`} accent />
                <StatCard label="Portfolio views" value={pageViews.length} sub="total page loads" />
                <StatCard label="Case study views" value={csViews.length} sub="total opens" />
                <StatCard label="Peak day" value={peakDay.count > 0 ? peakDay.count : '—'} sub={peakDay.count > 0 ? formatDate(peakDay.date + 'T00:00:00') : 'no data yet'} />
              </div>

              {/* Visitors chart */}
              <div style={{ background: 'var(--px-surface)', border: '1px solid var(--px-border)', borderRadius: 'var(--px-r-xl)', padding: '22px 24px', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--px-text)', letterSpacing: '-0.02em' }}>Unique visitors per day</h2>
                  <span style={{ fontSize: 12, color: 'var(--px-text-3)' }}>Hover bars for exact count</span>
                </div>
                <BarChart data={chartData} label="visitors" />
              </div>

              {/* Case study breakdown */}
              {caseRows.length > 0 && (
                <div style={{ background: 'var(--px-surface)', border: '1px solid var(--px-border)', borderRadius: 'var(--px-r-xl)', overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--px-border)' }}>
                    <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--px-text)', letterSpacing: '-0.02em', margin: 0 }}>Case study breakdown</h2>
                  </div>
                  {/* Table header */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 120px 90px', padding: '8px 20px', background: 'var(--px-surface-2)', borderBottom: '1px solid var(--px-border)' }}>
                    {['Case study', 'Views', 'Avg. time', 'Status'].map(col => (
                      <div key={col} style={{ fontSize: 11, fontWeight: 700, color: 'var(--px-text-3)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{col}</div>
                    ))}
                  </div>
                  {caseRows.map((cs, i) => (
                    <div key={cs.id}
                      onClick={() => setSelectedCaseId(selectedCaseId === cs.id ? null : cs.id)}
                      style={{ display: 'grid', gridTemplateColumns: '1fr 100px 120px 90px', padding: '12px 20px', borderBottom: i < caseRows.length - 1 ? '1px solid var(--px-border)' : 'none', cursor: 'pointer', transition: 'background 0.1s', background: selectedCaseId === cs.id ? 'var(--px-accent-subtle)' : 'transparent' }}
                      onMouseEnter={e => { if (selectedCaseId !== cs.id) (e.currentTarget as HTMLElement).style.background = 'var(--px-surface-2)' }}
                      onMouseLeave={e => { if (selectedCaseId !== cs.id) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Icon name={selectedCaseId === cs.id ? 'chevronDown' : 'chevronRight'} size={14} color="var(--px-text-3)" />
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--px-text)', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cs.title}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: cs.views > 0 ? 'var(--px-text)' : 'var(--px-text-3)' }}>{cs.views}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: cs.avgTime > 0 ? 'var(--px-text)' : 'var(--px-text-3)' }}>
                          {cs.avgTime > 0 ? formatDuration(cs.avgTime) : '—'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: cs.published ? 'var(--px-success-subtle)' : 'var(--px-surface-2)', color: cs.published ? 'var(--px-success)' : 'var(--px-text-3)', border: `1px solid ${cs.published ? 'transparent' : 'var(--px-border)'}` }}>
                          {cs.published ? 'Published' : 'Draft'}
                        </span>
                      </div>

                      {/* Expanded row — daily views for this case study */}
                      {selectedCaseId === cs.id && (
                        <div style={{ gridColumn: '1 / -1', paddingTop: 12, paddingLeft: 22 }}>
                          <p style={{ fontSize: 12, color: 'var(--px-text-3)', marginBottom: 8 }}>Daily views for this case study</p>
                          <CaseStudyMiniChart events={filteredEvents.filter(e => e.case_study_id === cs.id && e.event_type === 'case_study_view')} rangeStart={rangeStart} rangeDays={rangeDays} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Mini chart for expanded case study row ────────────────────────────────────
function CaseStudyMiniChart({ events, rangeStart, rangeDays }: { events: AnalyticsEvent[]; rangeStart: Date; rangeDays: number }) {
  const data = useMemo(() => {
    const map: Record<string, number> = {}
    for (let d = 0; d < rangeDays; d++) {
      const date = new Date(rangeStart.getTime() + d * 24 * 60 * 60 * 1000)
      map[date.toISOString().slice(0, 10)] = 0
    }
    events.forEach(e => {
      const key = e.recorded_at.slice(0, 10)
      if (key in map) map[key]++
    })
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date, count }))
  }, [events, rangeStart, rangeDays])

  const max = Math.max(...data.map(d => d.count), 1)

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 40, marginBottom: 4 }}>
      {data.map(d => (
        <div key={d.date} title={`${formatDate(d.date + 'T00:00:00')}: ${d.count} view${d.count !== 1 ? 's' : ''}`}
          style={{ flex: 1, height: Math.max(2, (d.count / max) * 36), borderRadius: 2, background: d.count > 0 ? 'var(--px-accent)' : 'var(--px-surface-3)', opacity: d.count > 0 ? 0.7 : 0.3, cursor: 'default', transition: 'opacity 0.12s' }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={e => (e.currentTarget.style.opacity = d.count > 0 ? '0.7' : '0.3')} />
      ))}
    </div>
  )
}
