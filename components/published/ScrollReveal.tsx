'use client'

import React, { useEffect, useRef } from 'react'

interface Props {
  children: React.ReactNode
  delay?: number // ms stagger for grouped items
  className?: string
}

export function ScrollReveal({ children, delay = 0, className }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.style.opacity = '1'
      el.style.transform = 'none'
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            el.classList.add('px-revealed')
          }, delay)
          observer.disconnect()
        }
      },
      { threshold: 0, rootMargin: '0px 0px 0px 0px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [delay])

  return (
    <div ref={ref} className={`px-reveal${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  )
}
