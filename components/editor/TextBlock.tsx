'use client'

import React from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'

const D = { surface2: '#1E1D1A', border: '#2B2926', text: '#C9C6BF', text2: '#8A8780', text3: '#56534D' }
const LABELS = ['Intro','Research','Ideation','Wireframes','Process','Prototype','Testing','Outcome','Learnings']

interface Props {
  html: string
  onHtml: (v: string) => void
  sectionLabel: string
  onSectionLabel: (v: string) => void
}

export function TextBlock({ html, onHtml, sectionLabel, onSectionLabel }: Props) {
  const nextLabel = () => { const i = LABELS.indexOf(sectionLabel); onSectionLabel(LABELS[(i + 1) % LABELS.length]) }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false, code: false, codeBlock: false, blockquote: false, horizontalRule: false }),
      Link.configure({ openOnClick: false }),
    ],
    content: html || '<p></p>',
    onUpdate: ({ editor }) => onHtml(editor.getHTML()),
    editorProps: {
      attributes: {
        style: `min-height: 80px; outline: none; font-size: 13px; line-height: 1.65; color: ${D.text}; font-family: var(--px-font);`,
      },
    },
  })

  const ToolBtn = ({ onClick, active, children }: { onClick: () => void; active?: boolean; children: React.ReactNode }) => (
    <button onClick={onClick} type="button"
      style={{ height: 24, padding: '0 7px', fontSize: 11, fontWeight: 600, borderRadius: 4, background: active ? '#3A3834' : 'transparent', color: active ? D.text : D.text2, border: 'none', cursor: 'pointer', fontFamily: 'var(--px-font)', letterSpacing: '-0.01em' }}>
      {children}
    </button>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span onClick={nextLabel} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: D.text2, cursor: 'pointer', userSelect: 'none', padding: '2px 6px', borderRadius: 3, background: 'rgba(255,255,255,0.04)', border: `1px solid ${D.border}` }}>{sectionLabel}</span>
        <span style={{ fontSize: 9, color: D.text3, letterSpacing: '0.06em' }}>TEXT</span>
      </div>
      <div style={{ borderRadius: 8, border: `1px solid ${D.border}`, background: D.surface2, overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 2, padding: '6px 8px', borderBottom: `1px solid ${D.border}` }}>
          <ToolBtn onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive('bold')}>B</ToolBtn>
          <ToolBtn onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive('italic')}><em>I</em></ToolBtn>
          <ToolBtn onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive('bulletList')}>• List</ToolBtn>
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 10, color: D.text3, alignSelf: 'center', marginRight: 4 }}>Max 600 chars</span>
        </div>
        <div style={{ padding: '10px 12px' }}>
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  )
}
