import { useState, useRef, useEffect, useCallback } from 'react'
import type { TeamMember } from '@/types'

interface Props {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  placeholder?: string
  members: TeamMember[]
  className?: string
}

export function MentionInput({ value, onChange, onSubmit, placeholder, members, className }: Props) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<TeamMember[]>([])
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [mentionStart, setMentionStart] = useState(-1)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize
  const autoResize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [])

  useEffect(() => {
    autoResize()
  }, [value, autoResize])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    const cursorPos = el.selectionStart || value.length
    const textBefore = value.slice(0, cursorPos)
    const atIdx = textBefore.lastIndexOf('@')

    if (atIdx >= 0) {
      const charBefore = atIdx > 0 ? textBefore[atIdx - 1] : ' '
      if (charBefore === ' ' || charBefore === '\n' || atIdx === 0) {
        const query = textBefore.slice(atIdx + 1).toLowerCase()
        if (!query.includes(' ')) {
          const filtered = members.filter((m) =>
            m.name.toLowerCase().includes(query)
          )
          if (filtered.length > 0) {
            setSuggestions(filtered)
            setShowSuggestions(true)
            setMentionStart(atIdx)
            setSelectedIdx(0)
            return
          }
        }
      }
    }
    setShowSuggestions(false)
  }, [value, members])

  function insertMention(member: TeamMember) {
    const el = textareaRef.current
    const cursorPos = el?.selectionStart || value.length
    const before = value.slice(0, mentionStart)
    const after = value.slice(cursorPos)
    const newValue = `${before}@${member.name} ${after}`
    onChange(newValue)
    setShowSuggestions(false)

    setTimeout(() => {
      if (textareaRef.current) {
        const pos = mentionStart + member.name.length + 2
        textareaRef.current.setSelectionRange(pos, pos)
        textareaRef.current.focus()
      }
    }, 0)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (showSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIdx((i) => Math.min(i + 1, suggestions.length - 1))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIdx((i) => Math.max(i - 1, 0))
        return
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        insertMention(suggestions[selectedIdx])
        return
      }
      if (e.key === 'Escape') {
        setShowSuggestions(false)
        return
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
    // Shift+Enter = new line (default behavior)
  }

  return (
    <div className="relative flex-1">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
        placeholder={placeholder}
        rows={1}
        className={`flex w-full border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none overflow-hidden ${className || ''}`}
      />

      {showSuggestions && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-white rounded-xl shadow-lg border border-[rgba(36,31,32,0.08)] overflow-hidden z-50">
          {suggestions.map((m, i) => (
            <button
              key={m.name}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                i === selectedIdx ? 'bg-[#f5f5f7]' : 'hover:bg-[#f5f5f7]/50'
              }`}
              onMouseDown={(e) => { e.preventDefault(); insertMention(m) }}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                style={{ backgroundColor: m.color }}
              >
                {m.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-[#241f20]">{m.name}</span>
                {m.email && <span className="ml-2 text-[11px] text-[#a39c95]">{m.email}</span>}
              </div>
              {m.role === 'dev' && (
                <span className="text-[9px] bg-[#a7abdd]/20 text-[#241f20] px-1.5 py-0.5 rounded-full">DEV</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
