import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  ChevronLeft, CheckSquare, Square, Send, Calendar, Tag, User,
  StickyNote, X, Trash2,
} from 'lucide-react'
import type { SubTask, SubTaskNote, Priority, TeamMember } from '@/types'
import { PRIORITY_LABELS } from '@/types'

interface Props {
  subtask: SubTask
  onUpdate: (updated: SubTask) => void
  onClose: () => void
  onDelete: () => void
  members: TeamMember[]
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "à l'instant"
  if (mins < 60) return `il y a ${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `il y a ${hours}h`
  return `il y a ${Math.floor(hours / 24)}j`
}

export function SubtaskDetail({ subtask, onUpdate, onClose, onDelete, members }: Props) {
  const [newNote, setNewNote] = useState('')

  function update<K extends keyof SubTask>(key: K, value: SubTask[K]) {
    onUpdate({ ...subtask, [key]: value })
  }

  function addNote() {
    if (!newNote.trim()) return
    const note: SubTaskNote = {
      id: Date.now().toString(),
      content: newNote.trim(),
      author: 'Pierre',
      createdAt: new Date().toISOString(),
    }
    update('notes', [...(subtask.notes || []), note])
    setNewNote('')
  }

  function removeNote(id: string) {
    update('notes', (subtask.notes || []).filter((n) => n.id !== id))
  }

  const isOverdue = !subtask.done && subtask.dueDate && new Date(subtask.dueDate) < new Date()

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[rgba(36,31,32,0.06)] flex items-center gap-3">
        <button onClick={onClose} className="text-[#6c6560] hover:text-[#241f20] transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-wider text-[#a39c95] font-medium">Sous-tâche</p>
        </div>
        <button onClick={onDelete} className="text-[#a39c95] hover:text-red-500 transition-colors">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Title + Done toggle */}
        <div className="flex items-start gap-3">
          <button onClick={() => update('done', !subtask.done)} className="mt-1 shrink-0">
            {subtask.done ? (
              <CheckSquare className="h-5 w-5 text-[#f8571f]" />
            ) : (
              <Square className="h-5 w-5 text-[#a39c95] hover:text-[#f8571f] transition-colors" />
            )}
          </button>
          <Input
            value={subtask.title}
            onChange={(e) => update('title', e.target.value)}
            className={`text-base font-semibold border-0 p-0 h-auto focus-visible:ring-0 ${
              subtask.done ? 'line-through text-[#a39c95]' : 'text-[#241f20]'
            }`}
          />
        </div>

        {/* Description */}
        <Textarea
          placeholder="Ajouter une description..."
          value={subtask.description || ''}
          onChange={(e) => update('description', e.target.value)}
          className="min-h-[60px] rounded-xl resize-none text-sm"
        />

        {/* Meta row */}
        <div className="grid grid-cols-3 gap-2">
          {/* Assignee */}
          <div>
            <label className="text-[10px] font-medium text-[#a39c95] uppercase tracking-wider mb-1 flex items-center gap-1">
              <User className="h-3 w-3" /> Assigné
            </label>
            <Select value={subtask.assignee || ''} onValueChange={(v) => update('assignee', v)}>
              <SelectTrigger className="h-8 rounded-lg text-xs">
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Non assigné</SelectItem>
                {members.map((m) => <SelectItem key={m.name} value={m.name}>{m.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Priority */}
          <div>
            <label className="text-[10px] font-medium text-[#a39c95] uppercase tracking-wider mb-1 flex items-center gap-1">
              <Tag className="h-3 w-3" /> Priorité
            </label>
            <Select value={subtask.priority} onValueChange={(v) => update('priority', v as Priority)}>
              <SelectTrigger className="h-8 rounded-lg text-xs">
                <span>{PRIORITY_LABELS[subtask.priority]}</span>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PRIORITY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Due date */}
          <div>
            <label className={`text-[10px] font-medium uppercase tracking-wider mb-1 flex items-center gap-1 ${
              isOverdue ? 'text-red-500' : 'text-[#a39c95]'
            }`}>
              <Calendar className="h-3 w-3" /> Échéance
            </label>
            <Input
              type="date"
              value={subtask.dueDate}
              onChange={(e) => update('dueDate', e.target.value)}
              className={`h-8 rounded-lg text-xs ${isOverdue ? 'border-red-300 text-red-600' : ''}`}
            />
          </div>
        </div>

        {/* Status badges */}
        <div className="flex gap-2">
          {subtask.done && (
            <Badge className="bg-[#a7abdd]/20 text-[#241f20] border-0 rounded-full text-[10px]">Terminée</Badge>
          )}
          {isOverdue && (
            <Badge className="bg-red-50 text-red-600 border-0 rounded-full text-[10px]">En retard</Badge>
          )}
        </div>

        <Separator />

        {/* Notes / Comments */}
        <div>
          <label className="text-xs font-medium text-[#6c6560] uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <StickyNote className="h-3.5 w-3.5" /> Notes
          </label>

          {(!subtask.notes || subtask.notes.length === 0) && (
            <p className="text-xs text-[#a39c95] text-center py-3">Aucune note</p>
          )}

          <div className="space-y-2">
            {(subtask.notes || []).map((note) => (
              <div key={note.id} className="group flex gap-2.5">
                <div className="mt-0.5 w-6 h-6 rounded-full bg-[#f5f5f7] flex items-center justify-center shrink-0 text-[10px] font-bold text-[#6c6560]">
                  {note.author.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11px] font-medium text-[#241f20]">{note.author}</span>
                    <span className="text-[9px] text-[#a39c95]">{timeAgo(note.createdAt)}</span>
                    <button
                      onClick={() => removeNote(note.id)}
                      className="ml-auto opacity-0 group-hover:opacity-100 text-[#a39c95] hover:text-red-500 transition-all"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </div>
                  <p className="text-sm bg-[#f5f5f7] rounded-xl px-3 py-1.5 text-[#241f20]">{note.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Compose note */}
      <div className="border-t border-[rgba(36,31,32,0.06)] p-4 flex gap-2">
        <Input
          placeholder="Ajouter une note..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addNote()}
          className="rounded-full text-sm"
        />
        <Button
          size="sm"
          onClick={addNote}
          disabled={!newNote.trim()}
          className="rounded-full bg-[#241f20] hover:bg-[#333] text-white px-3"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
