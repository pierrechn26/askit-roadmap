import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Send,
  FileText,
  AtSign,
  StickyNote,
  Calendar,
  Tag,
  Users,
  X,
  Clock,
} from 'lucide-react'
import type { Task, TaskActivity, TaskStatus, Priority, TeamMember } from '@/types'
import { DEFAULT_CATEGORIES } from '@/data/defaults'

const STATUS_LABELS: Record<TaskStatus, string> = {
  a_faire: 'A faire',
  en_cours: 'En cours',
  termine: 'Terminé',
  bloque: 'Bloqué',
}

const STATUS_DOT: Record<TaskStatus, string> = {
  a_faire: 'bg-[#a39c95]',
  en_cours: 'bg-[#f8571f]',
  termine: 'bg-[#a7abdd]',
  bloque: 'bg-red-500',
}

const PRIORITY_LABELS: Record<Priority, string> = {
  haute: 'Haute',
  moyenne: 'Moyenne',
  basse: 'Basse',
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "à l'instant"
  if (mins < 60) return `il y a ${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `il y a ${hours}h`
  const days = Math.floor(hours / 24)
  return `il y a ${days}j`
}

function getActivityIcon(type: TaskActivity['type']) {
  switch (type) {
    case 'note': return <StickyNote className="h-3.5 w-3.5" />
    case 'document': return <FileText className="h-3.5 w-3.5" />
    case 'mention': return <AtSign className="h-3.5 w-3.5" />
    case 'status_change': return <Clock className="h-3.5 w-3.5" />
  }
}

interface Props {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onTaskUpdate: (task: Task) => void
  members: TeamMember[]
}

export function TaskDetailPanel({ task, open, onOpenChange, onTaskUpdate, members }: Props) {
  const [newMessage, setNewMessage] = useState('')
  const [activityType, setActivityType] = useState<'note' | 'document' | 'mention'>('note')

  if (!task) return null

  function updateField<K extends keyof Task>(key: K, value: Task[K]) {
    onTaskUpdate({ ...task!, [key]: value })
  }

  function toggleAssignee(name: string) {
    const current = task!.assignees
    const updated = current.includes(name)
      ? current.filter((a) => a !== name)
      : [...current, name]
    updateField('assignees', updated)
  }

  function addActivity() {
    if (!newMessage.trim()) return
    const activity: TaskActivity = {
      id: Date.now().toString(),
      type: activityType,
      content: newMessage.trim(),
      author: 'Pierre',
      createdAt: new Date().toISOString(),
    }
    updateField('activities', [...task!.activities, activity])
    setNewMessage('')
  }

  function removeActivity(id: string) {
    updateField('activities', task!.activities.filter((a) => a.id !== id))
  }

  function handleStatusChange(status: TaskStatus) {
    const activity: TaskActivity = {
      id: Date.now().toString(),
      type: 'status_change',
      content: `Statut changé vers "${STATUS_LABELS[status]}"`,
      author: 'Pierre',
      createdAt: new Date().toISOString(),
    }
    onTaskUpdate({ ...task!, status, activities: [...task!.activities, activity] })
  }

  const memberColorMap: Record<string, string> = {}
  members.forEach((m) => { memberColorMap[m.name] = m.color })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[520px] sm:max-w-[520px] p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-[rgba(36,31,32,0.06)]">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <Input
                value={task.title}
                onChange={(e) => updateField('title', e.target.value)}
                className="text-lg font-semibold border-0 p-0 h-auto focus-visible:ring-0 text-[#241f20]"
              />
            </div>
          </div>
          {/* Status & Priority row */}
          <div className="flex gap-2 mt-3">
            <Select value={task.status} onValueChange={(v) => handleStatusChange(v as TaskStatus)}>
              <SelectTrigger className="w-[130px] h-8 rounded-full text-xs">
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${STATUS_DOT[task.status]}`} />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={task.priority} onValueChange={(v) => updateField('priority', v as Priority)}>
              <SelectTrigger className="w-[110px] h-8 rounded-full text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={task.category} onValueChange={(v) => updateField('category', v)}>
              <SelectTrigger className="w-[110px] h-8 rounded-full text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEFAULT_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-6 py-4 space-y-5">
            {/* Description */}
            <div>
              <label className="text-xs font-medium text-[#6c6560] uppercase tracking-wider mb-1.5 block">
                Description
              </label>
              <Textarea
                placeholder="Ajouter une description..."
                value={task.description}
                onChange={(e) => updateField('description', e.target.value)}
                className="min-h-[80px] rounded-xl resize-none text-sm"
              />
            </div>

            {/* Assignees */}
            <div>
              <label className="text-xs font-medium text-[#6c6560] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" /> Responsables
              </label>
              <div className="flex flex-wrap gap-2">
                {members.map((m) => {
                  const selected = task.assignees.includes(m.name)
                  return (
                    <button
                      key={m.name}
                      onClick={() => toggleAssignee(m.name)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${
                        selected
                          ? 'text-white shadow-sm'
                          : 'bg-[#f5f5f7] text-[#6c6560] hover:bg-[#eee]'
                      }`}
                      style={selected ? { backgroundColor: m.color } : undefined}
                    >
                      <div
                        className="w-2.5 h-2.5 rounded-full border border-white/30"
                        style={{ backgroundColor: selected ? '#fff' : m.color }}
                      />
                      {m.name}
                      {selected && <X className="h-3 w-3 ml-0.5" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[#6c6560] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Début
                </label>
                <Input
                  type="date"
                  value={task.startDate}
                  onChange={(e) => updateField('startDate', e.target.value)}
                  className="rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[#6c6560] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" /> Échéance
                </label>
                <Input
                  type="date"
                  value={task.dueDate}
                  onChange={(e) => updateField('dueDate', e.target.value)}
                  className="rounded-xl text-sm"
                />
              </div>
            </div>

            <Separator />

            {/* Activity feed */}
            <div>
              <label className="text-xs font-medium text-[#6c6560] uppercase tracking-wider mb-3 block">
                Activité
              </label>

              {task.activities.length === 0 && (
                <p className="text-sm text-[#a39c95] text-center py-4">
                  Aucune activité pour le moment
                </p>
              )}

              <div className="space-y-3">
                {task.activities.map((activity) => (
                  <div key={activity.id} className="group flex gap-3">
                    <div className="mt-0.5 w-7 h-7 rounded-full bg-[#f5f5f7] flex items-center justify-center shrink-0 text-[#6c6560]">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-medium text-[#241f20]">{activity.author}</span>
                        <span className="text-[10px] text-[#a39c95]">{timeAgo(activity.createdAt)}</span>
                        <button
                          onClick={() => removeActivity(activity.id)}
                          className="ml-auto opacity-0 group-hover:opacity-100 text-[#a39c95] hover:text-red-500 transition-all"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                      <div className={`text-sm rounded-xl px-3 py-2 ${
                        activity.type === 'status_change'
                          ? 'bg-[#f5f5f7] text-[#6c6560] italic'
                          : activity.type === 'document'
                          ? 'bg-blue-50 text-[#241f20]'
                          : activity.type === 'mention'
                          ? 'bg-[#f8571f]/5 text-[#241f20]'
                          : 'bg-[#f5f5f7] text-[#241f20]'
                      }`}>
                        {activity.type === 'document' && <FileText className="h-3.5 w-3.5 inline mr-1.5 text-blue-500" />}
                        {activity.type === 'mention' && <AtSign className="h-3.5 w-3.5 inline mr-1.5 text-[#f8571f]" />}
                        {activity.content}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Compose bar */}
        <div className="border-t border-[rgba(36,31,32,0.06)] p-4">
          <div className="flex gap-1.5 mb-2">
            {(['note', 'document', 'mention'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setActivityType(type)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] transition-all ${
                  activityType === type
                    ? 'bg-[#241f20] text-white'
                    : 'bg-[#f5f5f7] text-[#6c6560] hover:bg-[#eee]'
                }`}
              >
                {type === 'note' && <StickyNote className="h-3 w-3" />}
                {type === 'document' && <FileText className="h-3 w-3" />}
                {type === 'mention' && <AtSign className="h-3 w-3" />}
                {type === 'note' ? 'Note' : type === 'document' ? 'Document' : 'Mention'}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder={
                activityType === 'note' ? 'Écrire une note...'
                : activityType === 'document' ? 'Lien ou nom du document...'
                : 'Mentionner @quelqu\'un...'
              }
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addActivity()}
              className="rounded-full text-sm"
            />
            <Button
              size="sm"
              onClick={addActivity}
              disabled={!newMessage.trim()}
              className="rounded-full bg-[#f8571f] hover:bg-[#e04d1a] text-white px-4"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
