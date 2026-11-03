import type { MouseEvent } from 'react'

// Shared-element morph between a case-study card cover and the case-study hero (and back).
// Next's <Link> is a same-document navigation, so the browser's own cross-page transition never runs;
// instead the click is wrapped in document.startViewTransition and the transition is held open until the
// destination has rendered (ViewTransitionGate calls settleTransition). Browsers without the API, reduced
// motion, modified clicks and NDA cards fall back to the plain navigation. Styles: "View transitions" in app/themes.css.

export const COVER_NAME = 'case-cover'
const GIVE_UP_MS = 1500

interface Transition { finished: Promise<unknown> }
type StartViewTransition = (update: () => Promise<void>) => Transition
type Router = { push: (href: string) => void }

let release: (() => void) | null = null
let lastCase: string | null = null
let active: Transition | null = null

function canTransition(): boolean {
  return typeof document !== 'undefined'
    && 'startViewTransition' in document
    && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** onClick for a link whose `source` element should morph into the destination page's counterpart. */
export function transitionClick(e: MouseEvent, router: Router, href: string, source: HTMLElement | null, caseId?: string) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
  if (!source || !canTransition()) return
  e.preventDefault()
  if (caseId) lastCase = caseId
  source.style.viewTransitionName = COVER_NAME
  const start = (document as unknown as { startViewTransition: StartViewTransition }).startViewTransition.bind(document)
  active = start(() => new Promise<void>(resolve => {
    const timer = window.setTimeout(resolve, GIVE_UP_MS)
    release = () => { window.clearTimeout(timer); release = null; resolve() }
    router.push(href)
  }))
  const done = () => { source.style.viewTransitionName = ''; active = null }
  active.finished.then(done, done)
}

/** Called by the destination page once it has rendered: names its counterpart element and lets the transition run. */
export function settleTransition(target: HTMLElement | null) {
  if (!release) return
  if (target) {
    target.style.viewTransitionName = COVER_NAME
    active?.finished.then(() => { target.style.viewTransitionName = '' }, () => { target.style.viewTransitionName = '' })
  }
  release()
}

/** The case study the reader last opened (so the portfolio can morph the hero back into its card). */
export function lastOpenedCase(): string | null { return lastCase }
