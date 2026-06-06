'use client'

import React from 'react'

const ICONS: Record<string, React.ReactNode> = {
  barChart: (<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="3" height="7" rx="0.5"/><rect x="8.5" y="7" width="3" height="11" rx="0.5"/><rect x="14" y="3" width="3" height="15" rx="0.5"/></svg>),
  palette: (<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M10 3a7 7 0 1 0 4.9 12c.8-.9.1-2-1-2H12a1.5 1.5 0 0 1 0-3 7 7 0 0 0-2-12z"/><circle cx="7" cy="8.5" r="1" fill="currentColor" stroke="none"/><circle cx="10" cy="6.5" r="1" fill="currentColor" stroke="none"/><circle cx="13" cy="8.5" r="1" fill="currentColor" stroke="none"/></svg>),
  eye: (<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M1.5 10s3.5-6 8.5-6 8.5 6 8.5 6-3.5 6-8.5 6-8.5-6-8.5-6z"/><circle cx="10" cy="10" r="2.5"/></svg>),
  globe: (<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="10" cy="10" r="7"/><path d="M10 3c0 0-3.5 3-3.5 7s3.5 7 3.5 7"/><path d="M10 3c0 0 3.5 3 3.5 7s-3.5 7-3.5 7"/><line x1="3" y1="10" x2="17" y2="10"/></svg>),
  sun: (<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="10" cy="10" r="3.5"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="10" y1="16" x2="10" y2="18"/><line x1="2" y1="10" x2="4" y2="10"/><line x1="16" y1="10" x2="18" y2="10"/><line x1="4.6" y1="4.6" x2="5.9" y2="5.9"/><line x1="14.1" y1="14.1" x2="15.4" y2="15.4"/><line x1="4.6" y1="15.4" x2="5.9" y2="14.1"/><line x1="14.1" y1="5.9" x2="15.4" y2="4.6"/></svg>),
  moon: (<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M17 10.8A7.5 7.5 0 1 1 9.2 3a5.5 5.5 0 0 0 7.8 7.8z"/></svg>),
  plus: (<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="10" y1="4" x2="10" y2="16"/><line x1="4" y1="10" x2="16" y2="10"/></svg>),
  edit: (<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 3.5a2.12 2.12 0 0 1 3 3l-10 10-4.5 1.5 1.5-4.5 10-10z"/></svg>),
  trash: (<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h12"/><path d="M7.5 6V4.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5V6"/><rect x="5" y="6" width="10" height="10" rx="1.5"/><line x1="8.5" y1="9.5" x2="8.5" y2="13.5"/><line x1="11.5" y1="9.5" x2="11.5" y2="13.5"/></svg>),
  lock: (<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="9.5" width="12" height="8.5" rx="2"/><path d="M7.5 9.5V7a2.5 2.5 0 0 1 5 0v2.5"/><circle cx="10" cy="13.75" r="1" fill="currentColor" stroke="none"/></svg>),
  arrowLeft: (<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="16" y1="10" x2="4" y2="10"/><polyline points="9 15 4 10 9 5"/></svg>),
  chevronRight: (<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="7.5 4 13.5 10 7.5 16"/></svg>),
  chevronDown: (<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7.5 10 13.5 16 7.5"/></svg>),
  x: (<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="5" x2="15" y2="15"/><line x1="15" y1="5" x2="5" y2="15"/></svg>),
  image: (<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2.5" y="4.5" width="15" height="11" rx="2"/><circle cx="7" cy="8.5" r="1.5"/><path d="M2.5 13.5l4-4 3.5 3.5 2-2 5.5 5.5"/></svg>),
  grid2: (<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="2.5" y="2.5" width="6.5" height="6.5" rx="1.5"/><rect x="11" y="2.5" width="6.5" height="6.5" rx="1.5"/><rect x="2.5" y="11" width="6.5" height="6.5" rx="1.5"/><rect x="11" y="11" width="6.5" height="6.5" rx="1.5"/></svg>),
  figma: (<svg viewBox="0 0 20 20"><path d="M7 2h3a3 3 0 0 1 0 6H7z" fill="#0ACF83"/><path d="M7 8h3a3 3 0 0 1 0 6H7z" fill="#A259FF"/><path d="M7 14h3a3 3 0 0 1 0 6H7z" fill="#F24E1E"/><circle cx="14" cy="11" r="3" fill="#1ABCFE"/><path d="M4 2h3v6H4a3 3 0 0 1 0-6z" fill="#FF7262"/></svg>),
  compareH: (<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="1.5" y="4.5" width="7.5" height="11" rx="1.5"/><rect x="11" y="4.5" width="7.5" height="11" rx="1.5"/><line x1="10" y1="2" x2="10" y2="18" strokeDasharray="2 2"/></svg>),
  text: (<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="5" x2="16" y2="5"/><line x1="10" y1="5" x2="10" y2="17"/></svg>),
  sparkle: (<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2l1.8 5.2L17 9l-5.2 1.8L10 16l-1.8-5.2L3 9l5.2-1.8z"/><path d="M16 14l1 2.5 2.5 1-2.5 1L16 21l-1-2.5-2.5-1 2.5-1z" opacity="0.6"/></svg>),
  checkCircle: (<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="10" r="7.5"/><polyline points="7 10.5 9 12.5 13.5 8"/></svg>),
  search: (<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="9" r="5.5"/><line x1="13.8" y1="13.8" x2="17" y2="17"/></svg>),
  download: (<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M10 3v10"/><polyline points="6.5 9.5 10 13 13.5 9.5"/><path d="M4 15.5h12"/></svg>),
  userPlus: (<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12.5 12c-2.5 0-4.5 2-4.5 4.5v.5h9v-.5c0-2.5-2-4.5-4.5-4.5z"/><circle cx="12.5" cy="7.5" r="3"/><line x1="2" y1="10" x2="7" y2="10"/><line x1="4.5" y1="7.5" x2="4.5" y2="12.5"/></svg>),
  externalLink: (<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 4.5H5A1.5 1.5 0 0 0 3.5 6v9A1.5 1.5 0 0 0 5 16.5h9a1.5 1.5 0 0 0 1.5-1.5v-4.5"/><polyline points="13.5 3.5 16.5 3.5 16.5 6.5"/><line x1="10.5" y1="9.5" x2="16.5" y2="3.5"/></svg>),
  upload: (<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13V4"/><polyline points="6.5 7 10 3.5 13.5 7"/><path d="M3.5 14v2A1.5 1.5 0 0 0 5 17.5h10A1.5 1.5 0 0 0 16.5 16v-2"/></svg>),
  linkedin: (<svg viewBox="0 0 20 20" fill="currentColor"><rect x="2.5" y="7.5" width="3.5" height="10.5" rx="0.5"/><circle cx="4.25" cy="4.25" r="2.25"/><path d="M9.5 7.5h3.5v1.7s1.2-2 4-2c3.2 0 3.5 2.5 3.5 5.2V18H17V13c0-1.8-.4-3-2-3-2 0-2.5 1.6-2.5 3V18H9.5z"/></svg>),
  dribbble: (<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="10" cy="10" r="7.5"/><path d="M3 8c3.5 1 6.5 2.5 8.5 6.5"/><path d="M10.5 2.5c-1 2.5-1.8 5.5-1 9.5"/><path d="M6.5 17.5c1.5-3.5 3-5.5 7-6.5"/></svg>),
  behance: (<svg viewBox="0 0 20 20" fill="currentColor"><path d="M2 5h5.5c2 0 3.5.8 3.5 2.8 0 1.2-.6 2-1.6 2.5 1.4.4 2.2 1.4 2.2 2.8C11.6 15.8 9.6 16 7.4 16H2zm3 4.2h2.3c.8 0 1.2-.4 1.2-1.1 0-.8-.5-1.1-1.3-1.1H5zm0 4.3h2.5c.9 0 1.5-.4 1.5-1.3 0-.8-.5-1.3-1.5-1.3H5z"/><path d="M13 11.5c.2 1.3 1 2 2.4 2 .8 0 1.6-.4 1.9-1H19c-.6 2-2 3-4 3-2.7 0-4.5-1.8-4.5-4.5s1.7-4.5 4.3-4.5c2.8 0 4.2 2 4.2 5zm3.8-1.2c-.1-1.1-.8-1.8-1.9-1.8-1.2 0-1.8.7-1.9 1.8z"/><path d="M13.5 5H18v1.2h-4.5z"/></svg>),
  copy: (<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="7" y="7" width="10" height="10" rx="1.5"/><path d="M4 13.5V4A1.5 1.5 0 0 1 5.5 2.5H13"/></svg>),
  check: (<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3.5 10 8 15 16.5 5.5"/></svg>),
  settings: (<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="10" cy="10" r="3"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.93 4.93l1.42 1.42M13.65 13.65l1.42 1.42M4.93 15.07l1.42-1.42M13.65 6.35l1.42-1.42"/></svg>),
  shield: (<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2L4 5v5c0 4.1 2.6 7.6 6 8.9C14 17.6 16 14.1 16 10V5z"/></svg>),
  zap: (<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 12 9 12 7 18 17 8 11 8 13 2"/></svg>),
  drag: (<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="7.5" cy="5" r="1" fill="currentColor" stroke="none"/><circle cx="12.5" cy="5" r="1" fill="currentColor" stroke="none"/><circle cx="7.5" cy="10" r="1" fill="currentColor" stroke="none"/><circle cx="12.5" cy="10" r="1" fill="currentColor" stroke="none"/><circle cx="7.5" cy="15" r="1" fill="currentColor" stroke="none"/><circle cx="12.5" cy="15" r="1" fill="currentColor" stroke="none"/></svg>),
  twitter: (<svg viewBox="0 0 20 20" fill="currentColor"><path d="M17.5 4.2c-.6.3-1.3.5-2 .6.7-.4 1.2-1.1 1.5-1.9-.7.4-1.4.7-2.2.8C14.1 3 13.2 2.5 12.2 2.5c-1.9 0-3.4 1.5-3.4 3.4 0 .3 0 .5.1.8C5.8 6.5 3.4 5.2 1.8 3.1c-.3.5-.5 1.1-.5 1.8 0 1.2.6 2.2 1.5 2.8-.6 0-1.1-.2-1.6-.4v.1c0 1.6 1.2 3 2.8 3.3-.3.1-.6.1-.9.1-.2 0-.4 0-.6-.1.4 1.3 1.6 2.3 3 2.3-1.1.9-2.5 1.4-4 1.4H1c1.4.9 3.1 1.5 4.9 1.5 5.9 0 9.1-4.9 9.1-9.1v-.4c.6-.5 1.2-1 1.5-1.7z"/></svg>),
}

interface IconProps {
  name: keyof typeof ICONS
  size?: number
  color?: string
  className?: string
  style?: React.CSSProperties
}

export function Icon({ name, size = 20, color, className, style: sx }: IconProps) {
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        width: size,
        height: size,
        flexShrink: 0,
        color: color || 'currentColor',
        ...sx,
      }}
    >
      {ICONS[name] ?? null}
    </span>
  )
}

export type IconName = keyof typeof ICONS
