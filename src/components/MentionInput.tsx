import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
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
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Detect @ pattern
    const input = inputRef.current
    if (!input) return
    const cursorPos = input.selectionStart || value.length
    const textBefore = value.slice(0, cursorPos)
    const atIdx = textBefore.lastIndexOf('@')

    if (atIdx >= 0) {
      const charBefore = atIdx > 0 ? textBefore[atIdx - 1] : ' '
      if (charBefore === ' ' || charBefore === '\n' || atIdx === 0) {
        const query = textBefore.slice(atIdx + 1).toLowerCase()
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
    setShowSuggestions(false)
  }, [value, members])

  function insertMention(member: TeamMember) {
    const before = value.slice(0, mentionStart)
    const input = inputRef.current
    const cursorPos = input?.selectionStart || value.length
    const after = value.slice(cursorPos)
    const newValue = `${before}@${member.name} ${after}`
    onChange(newValue)
    setShowSuggestions(false)

    // Focus back
    setTimeout(() => {
      if (inputRef.current) {
        const pos = mentionStart + member.name.length + 2
        inputRef.current.setSelectionRange(pos, pos)
        inputRef.current.focus()
      }
    }, 0)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
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
    } else if (e.key === 'Enter') {
      onSubmit()
    }
  }

  return (
    <div className="relative flex-1">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
        placeholder={placeholder}
        className={className}
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
