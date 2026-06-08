'use client'

import React, { useEffect, useState, useRef } from 'react'
import Link from 'next/link'

// ── Motion Priority 1: AI streaming demo text ─────────────────────────────────
const STREAM_CHUNKS = [
  'Redesigning the checkout flow ',
  'reduced cart abandonment ',
  'by **34%** across mobile users. ',
  'By conducting 12 user interviews ',
  'and running A/B tests on 3 variants, ',
  'we identified the core friction — ',
  'a 7-step form compressed into one ',
  'overwhelming screen.',
]

// ── Motion Priority 2: staggered headline ─────────────────────────────────────
const HEADLINE_LINE1 = ['The', 'portfolio', 'that']
const HEADLINE_LINE2 = ['gets', 'you', 'hired.']

// ── Disciplines ───────────────────────────────────────────────────────────────
const DISCIPLINES = [
  { icon: '🎯', label: 'UX Designer', desc: 'Tell the story of your research, wireframes & decisions.' },
  { icon: '📦', label: 'Product Designer', desc: 'Ship metrics, system thinking, and cross-functional wins.' },
  { icon: '✦', label: 'Brand Designer', desc: 'Showcase visual identity, motion, and art direction.' },
  { icon: '▶', label: 'Motion Designer', desc: 'Embed reels, Lottie files, and frame-by-frame breakdowns.' },
  { icon: '✏️', label: 'Illustrator', desc: 'Gallery-grade layouts for your illustration work.' },
]

// ── Testimonials ──────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  { name: 'Ananya R.', role: 'Senior Product Designer @ Swiggy', text: 'I landed my Swiggy role 2 weeks after publishing. The AI helped me articulate my process in a way I never could.' },
  { name: 'Priya S.', role: 'UX Lead @ CRED', text: 'Spent 4 hours total — onboarding, adding case studies, published. Way faster than Notion or Cargo.' },
  { name: 'Kiran M.', role: 'Brand Designer @ Razorpay', text: 'My hiring manager literally called out my portfolio in the interview. The case study structure made a difference.' },
  { name: 'Dhruv T.', role: 'Motion Designer, Freelance', text: 'Being able to embed Lottie files and reels inline changed everything. Other builders just don\'t support that.' },
  { name: 'Sneha P.', role: 'Product Designer @ Zepto', text: 'The AI prompts forced me to think deeper about my work. I actually understand my own impact now.' },
]

// ── Portfolio mockup data ─────────────────────────────────────────────────────
// (Motion Priority 3 — a CSS-drawn browser mockup that floats)

function PortfolioMockup() {
  return (
    <div
      className="px-mockup-float"
      style={{
        width: 420,
        maxWidth: '90vw',
        borderRadius: 16,
        background: 'var(--px-surface)',
        border: '1px solid var(--px-border)',
        boxShadow: 'var(--px-shadow-xl)',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Browser chrome */}
      <div style={{
        height: 36,
        background: 'var(--px-surface-2)',
        borderBottom: '1px solid var(--px-border)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: 6,
      }}>
        {['#FC5F5A','#FDBC2C','#34C749'].map((c, i) => (
          <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.8 }} />
        ))}
        <div style={{
          flex: 1, marginLeft: 10, height: 20, background: 'var(--px-surface-3)',
          borderRadius: 6, display: 'flex', alignItems: 'center', paddingLeft: 10,
        }}>
          <span style={{ fontSize: 10, color: 'var(--px-text-3)', fontFamily: 'var(--px-font)' }}>
            ✦ aryan.portfoliox.me
          </span>
        </div>
      </div>

      {/* Portfolio content mockup */}
      <div style={{ padding: '20px 20px 16px' }}>
        {/* Hero mini */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'linear-gradient(135deg,#7B5EE0,#E53416)',
            flexShrink: 0,
          }} />
          <div>
            <div style={{ width: 80, height: 10, borderRadius: 5, background: 'var(--px-text)', marginBottom: 5 }} />
            <div style={{ width: 120, height: 8, borderRadius: 5, background: 'var(--px-surface-3)' }} />
          </div>
          <div style={{
            marginLeft: 'auto',
            height: 26, padding: '0 12px', borderRadius: 6,
            background: 'var(--px-accent)', display: 'flex', alignItems: 'center',
          }}>
            <div style={{ width: 40, height: 7, borderRadius: 4, background: 'rgba(255,255,255,0.85)' }} />
          </div>
        </div>

        {/* Case study cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { grad: 'linear-gradient(135deg,#1C1B18 0%,#3A3530 100%)', label: 'Checkout Redesign', num: '01' },
            { grad: 'linear-gradient(135deg,#2A1B4A 0%,#7B5EE0 100%)', label: 'Design System', num: '02' },
            { grad: 'linear-gradient(135deg,#0D2218 0%,#1A8A4A 100%)', label: 'Onboarding Flow', num: '03' },
            { grad: 'linear-gradient(135deg,#200A0A 0%,#E53416 100%)', label: 'Brand Identity', num: '04' },
          ].map((card, i) => (
            <div key={i} style={{
              height: 88,
              borderRadius: 8,
              background: card.grad,
              padding: 10,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}>
              <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--px-font)', fontWeight: 600 }}>
                {card.num}
              </span>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--px-font)', fontWeight: 700, lineHeight: 1.3 }}>
                {card.label}
              </span>
            </div>
          ))}
        </div>

        {/* Tool strip */}
        <div style={{ display: 'flex', gap: 6, marginTop: 14, alignItems: 'center' }}>
          <span style={{ fontSize: 9, color: 'var(--px-text-3)', fontFamily: 'var(--px-font)' }}>Tools</span>
          {['Figma','Lottie','After Effects','Framer'].map((t, i) => (
            <div key={i} style={{
              height: 18, padding: '0 7px', borderRadius: 4,
              background: 'var(--px-surface-2)', border: '1px solid var(--px-border)',
              display: 'flex', alignItems: 'center',
            }}>
              <span style={{ fontSize: 8, color: 'var(--px-text-2)', fontFamily: 'var(--px-font)', fontWeight: 500 }}>
                {t}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── AI Stream demo (Motion Priority 1) ───────────────────────────────────────
function AIStreamDemo() {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        observer.disconnect()
        const full = STREAM_CHUNKS.join('')
        let i = 0
        const interval = setInterval(() => {
          i += 2
          setDisplayed(full.slice(0, i))
          if (i >= full.length) {
            setDisplayed(full)
            setDone(true)
            clearInterval(interval)
          }
        }, 22)
      }
    }, { threshold: 0.4 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Render **bold** markers
  const renderBold = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((p, i) =>
      p.startsWith('**') && p.endsWith('**')
        ? <strong key={i} style={{ color: 'var(--px-text)', fontWeight: 700 }}>{p.slice(2,-2)}</strong>
        : <React.Fragment key={i}>{p}</React.Fragment>
    )
  }

  return (
    <div ref={ref} style={{
      background: 'var(--px-surface)',
      border: '1px solid var(--px-border)',
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      {/* Editor chrome */}
      <div style={{
        padding: '10px 16px',
        borderBottom: '1px solid var(--px-border)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'var(--px-surface-2)',
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 6,
          background: 'linear-gradient(135deg,#E53416,#FF8A6A)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 13 }}>✦</span>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--px-text)', lineHeight: 1.2 }}>Write with AI</div>
          <div style={{ fontSize: 10, color: 'var(--px-text-3)' }}>Impact section · Checkout Redesign</div>
        </div>
        <div style={{
          marginLeft: 'auto',
          fontSize: 10, fontWeight: 600,
          color: 'var(--px-accent)',
          padding: '3px 8px',
          background: 'var(--px-accent-subtle)',
          borderRadius: 4,
        }}>
          {done ? '● Done' : '● Generating…'}
        </div>
      </div>
      <div style={{ padding: '16px 18px', minHeight: 100 }}>
        <p style={{ fontSize: 14, lineHeight: 1.75, color: 'var(--px-text-2)', margin: 0 }}>
          {renderBold(displayed)}
          {!done && <span className="px-stream-cursor" />}
        </p>
      </div>
    </div>
  )
}

// ── Nav ───────────────────────────────────────────────────────────────────────
function Nav() {
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(248,247,244,0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--px-border)',
      padding: '0 clamp(16px,4vw,48px)',
      height: 56,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7,
          background: 'linear-gradient(135deg,#E53416 0%,#FF6B4A 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 14, lineHeight: 1 }}>✦</span>
        </div>
        <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--px-text)' }}>
          PortfolioX
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }} className="px-nav-hide-mobile">
        {['How it works', 'Disciplines'].map(link => (
          <a key={link} href={`#${link.toLowerCase().replace(/\s+/g,'-')}`} style={{
            fontSize: 13, fontWeight: 500, color: 'var(--px-text-2)',
            textDecoration: 'none', transition: 'color 0.15s',
          }}>
            {link}
          </a>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Link href="/sign-in" style={{
          fontSize: 13, fontWeight: 500, color: 'var(--px-text-2)',
          textDecoration: 'none', padding: '6px 12px',
        }}>
          Sign in
        </Link>
        <Link href="/sign-in" style={{
          display: 'inline-flex', alignItems: 'center', height: 34,
          padding: '0 16px', borderRadius: 8, fontSize: 13, fontWeight: 700,
          background: 'var(--px-text)', color: 'var(--px-bg)',
          textDecoration: 'none', letterSpacing: '-0.01em',
        }}>
          Build my portfolio →
        </Link>
      </div>
    </nav>
  )
}

// ── Hero (Motion P2 + P3) ─────────────────────────────────────────────────────
function HeroSection() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  const words1 = HEADLINE_LINE1
  const words2 = HEADLINE_LINE2
  const allWords = [...words1, ...words2]

  return (
    <section style={{
      padding: 'clamp(72px,10vh,120px) clamp(16px,4vw,48px) clamp(56px,8vh,96px)',
      maxWidth: 1160,
      margin: '0 auto',
      display: 'flex',
      alignItems: 'center',
      gap: 'clamp(32px,5vw,80px)',
      flexWrap: 'wrap',
    }}>
      {/* Left: headline + CTAs */}
      <div style={{ flex: '1 1 400px', minWidth: 0 }}>
        {/* Eyebrow */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '5px 12px', borderRadius: 999,
          background: 'var(--px-accent-subtle)',
          border: '1px solid rgba(229,52,22,0.15)',
          marginBottom: 28,
        }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--px-accent)', letterSpacing: '0.03em' }}>
            ✦ For UX, Product, Brand &amp; Motion designers
          </span>
        </div>

        {/* Headline (Motion Priority 2: staggered words) */}
        <h1 style={{
          fontFamily: 'var(--px-font-display)',
          fontSize: 'clamp(44px,6.5vw,80px)',
          lineHeight: 1.05,
          letterSpacing: '-0.03em',
          color: 'var(--px-text)',
          margin: '0 0 24px',
        }}>
          {visible && allWords.map((word, i) => (
            <React.Fragment key={i}>
              <span
                className="px-hero-word"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {word}
              </span>
              {i < allWords.length - 1 && ' '}
              {i === words1.length - 1 && <br />}
            </React.Fragment>
          ))}
          {/* Blinking caret after last word */}
          {visible && <span className="px-caret" style={{ animationDelay: `${allWords.length * 80 + 100}ms` }} />}
        </h1>

        <p style={{
          fontSize: 'clamp(16px,2vw,19px)',
          lineHeight: 1.7,
          color: 'var(--px-text-2)',
          margin: '0 0 36px',
          maxWidth: 480,
        }}>
          Write compelling case studies with AI, showcase your tools and process,
          and publish a portfolio that hiring managers remember — in under an hour.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <Link
            href="/sign-in"
            className="px-cta-glow"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              height: 48, padding: '0 28px',
              borderRadius: 10, fontSize: 15, fontWeight: 700,
              background: 'var(--px-accent)', color: '#fff',
              textDecoration: 'none', letterSpacing: '-0.01em',
            }}
          >
            Build my portfolio
            <span style={{ fontSize: 18, lineHeight: 1 }}>→</span>
          </Link>
          <a
            href="#how-it-works"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              height: 48, padding: '0 24px',
              borderRadius: 10, fontSize: 14, fontWeight: 600,
              background: 'transparent',
              border: '1.5px solid var(--px-border)',
              color: 'var(--px-text-2)',
              textDecoration: 'none',
              transition: 'border-color 0.15s, color 0.15s',
            }}
          >
            See how it works
          </a>
        </div>

        <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', marginRight: -4 }}>
            {['#E53416','#7B5EE0','#1A8A4A','#B86E0A'].map((c, i) => (
              <div key={i} style={{
                width: 28, height: 28, borderRadius: '50%',
                background: c, border: '2px solid var(--px-bg)',
                marginLeft: i === 0 ? 0 : -8, zIndex: 4 - i,
              }} />
            ))}
          </div>
          <span style={{ fontSize: 13, color: 'var(--px-text-3)', marginLeft: 8 }}>
            Trusted by <strong style={{ color: 'var(--px-text-2)', fontWeight: 600 }}>500+</strong> designers in India
          </span>
        </div>
      </div>

      {/* Right: Portfolio mockup (Motion Priority 3) */}
      <div style={{ flex: '0 0 auto', display: 'flex', justifyContent: 'center' }}>
        <PortfolioMockup />
      </div>
    </section>
  )
}

// ── How it works (Motion Priority 1) ─────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      num: '01',
      title: 'Tell us about yourself',
      body: 'Your name, discipline, tools, and a brief bio. Onboarding takes under 5 minutes.',
      visual: (
        <div style={{ padding: '20px', background: 'var(--px-surface)', borderRadius: 12, border: '1px solid var(--px-border)' }}>
          {[
            { label: 'Full name', val: 'Aryan Mehta' },
            { label: 'Discipline', val: 'Product Designer' },
            { label: 'Tools', val: 'Figma · Lottie · Principle' },
          ].map((row, i) => (
            <div key={i} style={{ marginBottom: i < 2 ? 12 : 0 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--px-text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
                {row.label}
              </div>
              <div style={{
                height: 34, borderRadius: 7, border: '1.5px solid var(--px-border)',
                background: 'var(--px-surface-2)',
                display: 'flex', alignItems: 'center', padding: '0 12px',
                fontSize: 13, color: 'var(--px-text)',
              }}>
                {row.val}
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      num: '02',
      title: 'Write case studies with AI',
      body: 'Add your projects and let AI help you articulate your process, decisions, and measurable impact.',
      visual: <AIStreamDemo />,
    },
    {
      num: '03',
      title: 'Publish & share instantly',
      body: 'Get a clean, fast portfolio at your own sub-domain. Share with recruiters in one link.',
      visual: (
        <div style={{
          padding: 20, background: 'var(--px-surface)', borderRadius: 12,
          border: '1px solid var(--px-border)', textAlign: 'center',
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '10px 18px', borderRadius: 8,
            background: 'var(--px-surface-2)', border: '1px solid var(--px-border)',
            marginBottom: 16,
          }}>
            <span style={{ fontSize: 14 }}>🔗</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--px-accent)', fontFamily: 'var(--px-font)' }}>
              aryan.portfoliox.me
            </span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--px-text-3)', marginBottom: 16 }}>
            Your portfolio is live. Share it anywhere.
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['LinkedIn', 'Email', 'WhatsApp', 'Copy link'].map((s, i) => (
              <div key={i} style={{
                height: 28, padding: '0 12px', borderRadius: 6,
                background: 'var(--px-surface-2)', border: '1px solid var(--px-border)',
                display: 'flex', alignItems: 'center',
                fontSize: 11, fontWeight: 600, color: 'var(--px-text-2)',
              }}>
                {s}
              </div>
            ))}
          </div>
        </div>
      ),
    },
  ]

  return (
    <section id="how-it-works" style={{
      padding: 'clamp(64px,8vh,100px) clamp(16px,4vw,48px)',
      background: 'var(--px-surface)',
      borderTop: '1px solid var(--px-border)',
      borderBottom: '1px solid var(--px-border)',
    }}>
      <div style={{ maxWidth: 1040, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--px-accent)', marginBottom: 12 }}>
            How it works
          </div>
          <h2 style={{
            fontFamily: 'var(--px-font-display)',
            fontSize: 'clamp(28px,4vw,48px)',
            fontWeight: 400,
            letterSpacing: '-0.03em',
            color: 'var(--px-text)',
            margin: 0,
          }}>
            From blank page to hired,<br />in three steps.
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {steps.map((step, i) => (
            <div key={i} style={{
              padding: 28, borderRadius: 16,
              background: 'var(--px-bg)',
              border: '1px solid var(--px-border)',
              display: 'flex', flexDirection: 'column', gap: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: i === 1 ? 'var(--px-accent)' : 'var(--px-surface-2)',
                  border: `1px solid ${i === 1 ? 'transparent' : 'var(--px-border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 800,
                  color: i === 1 ? '#fff' : 'var(--px-text-3)',
                  letterSpacing: '0.02em',
                }}>
                  {step.num}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--px-text)', marginBottom: 6, letterSpacing: '-0.02em' }}>
                    {step.title}
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--px-text-2)' }}>
                    {step.body}
                  </div>
                </div>
              </div>
              {step.visual}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Disciplines ───────────────────────────────────────────────────────────────
function DisciplinesSection() {
  return (
    <section id="disciplines" style={{
      padding: 'clamp(64px,8vh,100px) clamp(16px,4vw,48px)',
    }}>
      <div style={{ maxWidth: 1040, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--px-text-3)', marginBottom: 12 }}>
            Disciplines
          </div>
          <h2 style={{
            fontFamily: 'var(--px-font-display)',
            fontSize: 'clamp(28px,4vw,48px)',
            fontWeight: 400,
            letterSpacing: '-0.03em',
            color: 'var(--px-text)',
            margin: 0,
          }}>
            Built for every kind of designer.
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
          {DISCIPLINES.map((d, i) => (
            <div key={i} style={{
              padding: '24px 20px',
              borderRadius: 14,
              background: 'var(--px-surface)',
              border: '1px solid var(--px-border)',
              transition: 'box-shadow 0.2s, transform 0.2s, border-color 0.2s',
            }}
            onMouseEnter={e => {
              const el = e.currentTarget
              el.style.boxShadow = 'var(--px-shadow-md)'
              el.style.transform = 'translateY(-3px)'
              el.style.borderColor = 'var(--px-border-strong)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget
              el.style.boxShadow = 'none'
              el.style.transform = 'translateY(0)'
              el.style.borderColor = 'var(--px-border)'
            }}
            >
              <div style={{ fontSize: 28, marginBottom: 12, lineHeight: 1 }}>{d.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--px-text)', marginBottom: 8, letterSpacing: '-0.02em' }}>
                {d.label}
              </div>
              <div style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--px-text-3)' }}>
                {d.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Testimonials marquee ──────────────────────────────────────────────────────
function TestimonialsSection() {
  const doubled = [...TESTIMONIALS, ...TESTIMONIALS]
  return (
    <section style={{
      padding: 'clamp(48px,6vh,80px) 0',
      background: 'var(--px-surface)',
      borderTop: '1px solid var(--px-border)',
      borderBottom: '1px solid var(--px-border)',
      overflow: 'hidden',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 36, padding: '0 clamp(16px,4vw,48px)' }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--px-text-3)', marginBottom: 10 }}>
          What designers say
        </div>
        <h2 style={{
          fontFamily: 'var(--px-font-display)',
          fontSize: 'clamp(24px,3.5vw,40px)',
          fontWeight: 400, letterSpacing: '-0.03em',
          color: 'var(--px-text)', margin: 0,
        }}>
          Portfolios that open doors.
        </h2>
      </div>

      <div style={{
        display: 'flex',
        gap: 16,
        animation: 'px-marquee 32s linear infinite',
        width: 'max-content',
      }}>
        {doubled.map((t, i) => (
          <div key={i} style={{
            width: 300,
            flexShrink: 0,
            padding: '22px 24px',
            borderRadius: 14,
            background: 'var(--px-bg)',
            border: '1px solid var(--px-border)',
          }}>
            <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--px-text-2)', margin: '0 0 16px' }}>
              &ldquo;{t.text}&rdquo;
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: `hsl(${i * 47 % 360},55%,55%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: '#fff',
              }}>
                {t.name[0]}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--px-text)' }}>{t.name}</div>
                <div style={{ fontSize: 11, color: 'var(--px-text-3)' }}>{t.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}


// ── Final CTA (Motion Priority 4: pulse glow) ─────────────────────────────────
function FinalCTA() {
  return (
    <section style={{
      padding: 'clamp(72px,10vh,120px) clamp(16px,4vw,48px)',
      background: 'var(--px-text)',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient radial background glow */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse 60% 50% at 50% 100%, rgba(229,52,22,0.18) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', maxWidth: 600, margin: '0 auto' }}>
        <div style={{
          fontSize: 12, fontWeight: 700, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)',
          marginBottom: 20,
        }}>
          Start today
        </div>

        <h2 style={{
          fontFamily: 'var(--px-font-display)',
          fontSize: 'clamp(32px,5vw,60px)',
          fontWeight: 400,
          letterSpacing: '-0.03em',
          color: '#fff',
          margin: '0 0 20px',
          lineHeight: 1.1,
        }}>
          Your next job starts with a great portfolio.
        </h2>

        <p style={{
          fontSize: 17,
          lineHeight: 1.65,
          color: 'rgba(255,255,255,0.55)',
          margin: '0 0 40px',
        }}>
          Published in under an hour. No setup required.
        </p>

        <Link
          href="/sign-in"
          className="px-cta-glow"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            height: 56,
            padding: '0 36px',
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 700,
            background: 'var(--px-accent)',
            color: '#fff',
            textDecoration: 'none',
            letterSpacing: '-0.01em',
          }}
        >
          Build my portfolio
          <span style={{ fontSize: 20 }}>→</span>
        </Link>

        <div style={{ marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
          Sign in with Google · Ready in minutes
        </div>
      </div>
    </section>
  )
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{
      padding: 'clamp(28px,4vh,40px) clamp(16px,4vw,48px)',
      background: 'var(--px-text)',
      borderTop: '1px solid rgba(255,255,255,0.07)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 22, height: 22, borderRadius: 6,
          background: 'var(--px-accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 11, lineHeight: 1 }}>✦</span>
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>PortfolioX</span>
      </div>

      <div style={{ display: 'flex', gap: 24 }}>
        {['Privacy', 'Terms', 'Contact'].map(link => (
          <a key={link} href="#" style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>
            {link}
          </a>
        ))}
      </div>

      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
        © 2025 PortfolioX. Built for designers, by designers.
      </div>
    </footer>
  )
}

// ── Root export ───────────────────────────────────────────────────────────────
export function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--px-bg)', color: 'var(--px-text)', fontFamily: 'var(--px-font)' }}>
      <Nav />
      <HeroSection />
      <HowItWorks />
      <DisciplinesSection />
      <TestimonialsSection />
      <FinalCTA />
      <Footer />
    </div>
  )
}
