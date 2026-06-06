'use client'

import { useEffect, useRef } from 'react'

interface Props {
  userId: string
  caseStudyId?: string
  eventType: 'page_view' | 'case_study_view'
}

export function AnalyticsTracker({ userId, caseStudyId, eventType }: Props) {
  const startRef = useRef(Date.now())
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current) return
    fired.current = true

    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, caseStudyId, eventType }),
    }).catch(() => {}) // fire and forget, never throw

    // Record time on page when user leaves
    const onLeave = () => {
      const seconds = Math.round((Date.now() - startRef.current) / 1000)
      if (seconds < 2) return
      navigator.sendBeacon('/api/analytics', JSON.stringify({ userId, caseStudyId, eventType: 'page_view', timeOnPage: seconds }))
    }
    window.addEventListener('beforeunload', onLeave)
    return () => window.removeEventListener('beforeunload', onLeave)
  }, [userId, caseStudyId, eventType])

  return null
}
