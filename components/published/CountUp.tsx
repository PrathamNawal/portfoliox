'use client'

import React, { useEffect, useRef } from 'react'

// A figure that counts up from zero when it scrolls into view ("64%", "60+", "4.2★", "−32%"). The text around the
// number is kept as written. The final value is what is rendered, so without JavaScript, with animation off, or with
// reduced motion it simply is the value. Styles: "Case study" in app/themes.css.

const PARTS = /^(\D*?)(\d[\d,]*(?:\.\d+)?)([\s\S]*)$/
const DURATION = 1300

export function CountUp({ value, animate }: { value: string; animate: boolean }) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    const m = value.match(PARTS)
    if (!el || !m || !animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const [, before, digits, after] = m
    const target = parseFloat(digits.replace(/,/g, ''))
    const decimals = (digits.split('.')[1] ?? '').length
    const grouped = digits.indexOf(',') !== -1
    const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: grouped })
    let raf = 0
    el.textContent = `${before}${fmt(0)}${after}`
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      io.disconnect()
      const t0 = performance.now()
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / DURATION)
        el.textContent = p < 1 ? `${before}${fmt(target * (1 - Math.pow(1 - p, 3)))}${after}` : value
        if (p < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }, { threshold: 0.6 })
    io.observe(el)
    return () => { io.disconnect(); cancelAnimationFrame(raf); el.textContent = value }
  }, [value, animate])

  return <span ref={ref}>{value}</span>
}
