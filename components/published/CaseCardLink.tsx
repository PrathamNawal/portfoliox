'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import { transitionClick } from '@/lib/view-transition'

// The case-study card link: opening a project morphs the card cover into the case-study hero.
// NDA cards open the password gate (no hero), so they navigate normally.
export function CaseCardLink({ href, className, index, caseId, morph, children }: { href: string; className: string; index: number; caseId: string; morph: boolean; children: ReactNode }) {
  const router = useRouter()
  return (
    <Link href={href} className={className} data-i={index}
      onClick={e => transitionClick(e, router, href, morph ? e.currentTarget.querySelector<HTMLElement>('[data-vt-cover]') : null, caseId)}>
      {children}
    </Link>
  )
}
