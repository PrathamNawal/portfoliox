'use client'

import { useEffect } from 'react'
import { lastOpenedCase, settleTransition } from '@/lib/view-transition'

// <ViewTransitionGate mode="hero" /> on the case page, mode="card" on the portfolio.
// Rendered on both ends of the card <-> case study morph. On mount it finds the element that should receive the
// shared name and releases the held transition. On the case page that is the hero (scroll to top); on the
// portfolio it is the cover of the card the reader came from (scroll it into view, as the hero shrinks into it).
export function ViewTransitionGate({ mode }: { mode: 'hero' | 'card' }) {
  useEffect(() => {
    const id = mode === 'card' ? lastOpenedCase() : null
    const el = mode === 'card'
      ? (id ? document.querySelector<HTMLElement>(`[data-vt-cover="${CSS.escape(id)}"]`) : null)
      : document.querySelector<HTMLElement>('[data-vt-hero]')
    if (el && mode === 'card') el.scrollIntoView({ block: 'center' })
    else window.scrollTo(0, 0)
    settleTransition(el)
  }, [mode])
  return null
}
