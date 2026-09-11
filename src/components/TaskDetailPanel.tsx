import { useState, useRef } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Send, FileText, AtSign, StickyNote, Calendar, Tag, Users, X, Clock,
  Plus, CheckSquare, Square, Paperclip, Upload, Link2, Trash2,
  ChevronRight, Target,
} from 'lucide-react'
import type { Task, TaskActivity, TaskStatus, Priority, TeamMember, SubTask, TaskAttachment, Objective } from '@/types'
import { STATUS_LABELS, STATUS_DOT, PRIORITY_LABELS, PRIORITY_ORDER } from '@/types'
import { DEFAULT_CATEGORIES } from '@/data/defaults'
import { notifyAssignment, notifyMention } from '@/lib/notifications'
import { formatDateFR, getDateUrgency, DATE_BADGE_STYLES } from '@/lib/dates'
import { SubtaskDetail } from './SubtaskDetail'
import { MentionInput } from './MentionInput'

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "à l'instant"
  if (mins < 60) return `il y a ${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `il y a ${hours}h`
  return `il y a ${Math.floor(hours / 24)}j`
}

function getActivityIcon(type: TaskActivity['type']) {
  switch (type) {
    case 'note': return <StickyNote className="h-3.5 w-3.5" />
    case 'document': return <FileText className="h-3.5 w-3.5" />
    case 'mention': return <AtSign className="h-3.5 w-3.5" />
    case 'status_change': return <Clock className="h-3.5 w-3.5" />
  }
}

const PRIORITY_BADGE: Record<Priority, string> = {
  haute: 'bg-[#f8571f]/10 text-[#f8571f]',
  moyenne: 'bg-[#accce9]/30 text-[#241f20]',
  basse: 'bg-[#f5f5f7] text-[#6c6560]',
}

interface Props {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onTaskUpdate: (task: Task) => void
  members: TeamMember[]
  objectives: Objective[]
}

export function TaskDetailPanel({ task, open, onOpenChange, onTaskUpdate, members, objectives }: Props) {
  const [newMessage, setNewMessage] = useState('')
  const [activityType, setActivityType] = useState<'note' | 'document' | 'mention'>('note')
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [addingSubtask, setAddingSubtask] = useState(false)
  const [attachmentMode, setAttachmentMode] = useState<'file' | 'link' | null>(null)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkName, setLinkName] = useState('')
  const [openSubtaskId, setOpenSubtaskId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!task) return null

  function updateField<K extends keyof Task>(key: K, value: Task[K]) {
    onTaskUpdate({ ...task!, [key]: value })
  }

  function toggleAssignee(name: string) {
    const current = task!.assignees
    const wasAssigned = current.includes(name)
    const updated = wasAssigned ? current.filter((a) => a !== name) : [...current, name]
    updateField('assignees', updated)
    if (!wasAssigned) {
      const member = members.find((m) => m.name === name)
      if (member?.email) notifyAssignment(member, task!)
    }
  }

  // --- Sub-tasks ---
  function addSubtask() {
    if (!newSubtaskTitle.trim()) return
    const st: SubTask = {
      id: Date.now().toString(),
      title: newSubtaskTitle.trim(),
      description: '',
      done: false,
      dueDate: task!.dueDate,
      priority: 'moyenne',
      assignees: [],
      notes: [],
    }
    updateField('subtasks', [...(task!.subtasks || []), st])
    setNewSubtaskTitle('')
    setAddingSubtask(false)
  }

  function toggleSubtask(id: string) {
    updateField('subtasks', (task!.subtasks || []).map((s) =>
      s.id === id ? { ...s, done: !s.done } : s
    ))
  }

  function updateSubtask(updated: SubTask) {
    updateField('subtasks', (task!.subtasks || []).map((s) =>
      s.id === updated.id ? updated : s
    ))
  }

  function removeSubtask(id: string) {
    updateField('subtasks', (task!.subtasks || []).filter((s) => s.id !== id))
    if (openSubtaskId === id) setOpenSubtaskId(null)
  }

  // --- Attachments ---
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const att: TaskAttachment = {
        id: Date.now().toString(), name: file.name, url: reader.result as string,
        type: 'file', addedAt: new Date().toISOString(), addedBy: 'Pierre',
      }
      updateField('attachments', [...(task!.attachments || []), att])
    }
    reader.readAsDataURL(file)
    setAttachmentMode(null)
  }

  function addLinkAttachment() {
    if (!linkUrl.trim()) return
    const att: TaskAttachment = {
      id: Date.now().toString(), name: linkName.trim() || linkUrl.trim(), url: linkUrl.trim(),
      type: 'link', addedAt: new Date().toISOString(), addedBy: 'Pierre',
    }
    updateField('attachments', [...(task!.attachments || []), att])
    setLinkUrl(''); setLinkName(''); setAttachmentMode(null)
  }

  function removeAttachment(id: string) {
    updateField('attachments', (task!.attachments || []).filter((a) => a.id !== id))
  }

  // --- Activity ---
  function addActivity() {
    if (!newMessage.trim()) return
    const activity: TaskActivity = {
      id: Date.now().toString(), type: activityType, content: newMessage.trim(),
      author: 'Pierre', createdAt: new Date().toISOString(),
    }
    updateField('activities', [...task!.activities, activity])
    // Notify any @mentioned members regardless of activity type
    members.forEach((m) => {
      if (newMessage.includes(`@${m.name}`) && m.email) notifyMention(m, task!, newMessage)
    })
    setNewMessage('')
  }

  function removeActivity(id: string) {
    updateField('activities', task!.activities.filter((a) => a.id !== id))
  }

  function handleStatusChange(status: TaskStatus) {
    const activity: TaskActivity = {
      id: Date.now().toString(), type: 'status_change',
      content: `Statut changé vers "${STATUS_LABELS[status]}"`,
      author: 'Pierre', createdAt: new Date().toISOString(),
    }
    onTaskUpdate({ ...task!, status, activities: [...task!.activities, activity] })
  }

  const memberColorMap: Record<string, string> = {}
  members.forEach((m) => { memberColorMap[m.name] = m.color })

  const subtasks = [...(task.subtasks || [])].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
  const attachments = task.attachments || []
  const subtasksDone = subtasks.filter((s) => s.done).length
  const subtasksTotal = subtasks.length

  // If a subtask is open, show its detail view
  const openSubtask = openSubtaskId ? subtasks.find((s) => s.id === openSubtaskId) : null

  return (
    <Sheet open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setOpenSubtaskId(null) }}>
      <SheetContent className="w-[540px] sm:max-w-[540px] p-0 flex flex-col">
        {openSubtask ? (
          <SubtaskDetail
            subtask={openSubtask}
            onUpdate={updateSubtask}
            onClose={() => setOpenSubtaskId(null)}
            onDelete={() => removeSubtask(openSubtask.id)}
            members={members}
          />
        ) : (
          <>
            <SheetHeader className="px-6 pt-6 pb-4 border-b border-[rgba(36,31,32,0.06)]">
              <div className="flex-1 pr-4">
                <SheetTitle className="sr-only">Détail de la tâche</SheetTitle>
                <Input
                  value={task.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  className="text-lg font-semibold border-0 p-0 h-auto focus-visible:ring-0 text-[#241f20]"
                />
              </div>
              <div className="flex gap-2 mt-3 flex-wrap">
                <Select value={task.status} onValueChange={(v) => handleStatusChange(v as TaskStatus)}>
                  <SelectTrigger className="w-[130px] h-8 rounded-full text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${STATUS_DOT[task.status]}`} />
                      <span>{STATUS_LABELS[task.status]}</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={task.priority} onValueChange={(v) => updateField('priority', v as Priority)}>
                  <SelectTrigger className="w-[110px] h-8 rounded-full text-xs">
                    <span>{PRIORITY_LABELS[task.priority]}</span>
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={task.category} onValueChange={(v) => updateField('category', v)}>
                  <SelectTrigger className="w-[110px] h-8 rounded-full text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DEFAULT_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </SheetHeader>

            <ScrollArea className="flex-1">
              <div className="px-6 py-4 space-y-5">
                {/* Description */}
                <div>
                  <label className="text-xs font-medium text-[#6c6560] uppercase tracking-wider mb-1.5 block">Description</label>
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
                        <button key={m.name} onClick={() => toggleAssignee(m.name)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${
                            selected ? 'text-white shadow-sm' : 'bg-[#f5f5f7] text-[#6c6560] hover:bg-[#eee]'
                          }`}
                          style={selected ? { backgroundColor: m.color } : undefined}
                        >
                          <div className="w-2.5 h-2.5 rounded-full border border-white/30" style={{ backgroundColor: selected ? '#fff' : m.color }} />
                          {m.name}
                          {m.role === 'dev' && <Badge className="ml-1 text-[9px] px-1 py-0 bg-white/20 border-0">DEV</Badge>}
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
                    <Input type="date" value={task.startDate} onChange={(e) => updateField('startDate', e.target.value)} className="rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#6c6560] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5" /> Échéance
                    </label>
                    <Input type="date" value={task.dueDate} onChange={(e) => updateField('dueDate', e.target.value)} className="rounded-xl text-sm" />
                  </div>
                </div>

                {/* Linked objectives */}
                {objectives.length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-[#6c6560] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Target className="h-3.5 w-3.5" /> Objectifs liés
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {objectives.map((obj) => {
                        const linked = (task.objectiveIds || []).includes(obj.id)
                        return (
                          <button key={obj.id}
                            onClick={() => {
                              const current = task.objectiveIds || []
                              updateField('objectiveIds', linked ? current.filter((id) => id !== obj.id) : [...current, obj.id])
                            }}
                            className={`px-2.5 py-1 rounded-full text-[11px] transition-all ${
                              linked ? 'bg-[#241f20] text-white' : 'bg-[#f5f5f7] text-[#6c6560] hover:bg-[#eee]'
                            }`}>
                            {obj.title.length > 35 ? obj.title.slice(0, 35) + '…' : obj.title}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Sub-tasks — Asana style */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-medium text-[#6c6560] uppercase tracking-wider flex items-center gap-1.5">
                      <CheckSquare className="h-3.5 w-3.5" /> Sous-tâches
                      {subtasksTotal > 0 && (
                        <span className="text-[10px] ml-1 text-[#a39c95]">{subtasksDone}/{subtasksTotal}</span>
                      )}
                    </label>
                    <button onClick={() => setAddingSubtask(true)} className="text-xs text-[#f8571f] hover:underline flex items-center gap-0.5">
                      <Plus className="h-3 w-3" /> Ajouter
                    </button>
                  </div>

                  {subtasksTotal > 0 && (
                    <div className="h-1.5 bg-[#f5f5f7] rounded-full mb-3 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#f8571f] to-[#a7abdd] transition-all" style={{ width: `${(subtasksDone / subtasksTotal) * 100}%` }} />
                    </div>
                  )}

                  <div className="space-y-1">
                    {subtasks.map((st) => {
                      const stUrgency = getDateUrgency(st.dueDate, st.done)
                      return (
                        <div
                          key={st.id}
                          className={`group flex items-center gap-2 py-2 px-3 rounded-xl hover:bg-[#f5f5f7] cursor-pointer transition-colors ${
                            stUrgency === 'overdue' ? 'bg-red-50/50' : ''
                          }`}
                          onClick={() => setOpenSubtaskId(st.id)}
                        >
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleSubtask(st.id) }}
                            className="shrink-0"
                          >
                            {st.done ? (
                              <CheckSquare className="h-4 w-4 text-[#f8571f]" />
                            ) : (
                              <Square className="h-4 w-4 text-[#a39c95]" />
                            )}
                          </button>

                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${st.done ? 'line-through text-[#a39c95]' : 'text-[#241f20]'}`}>
                              {st.title}
                            </p>
                            {st.description && (
                              <p className="text-[11px] text-[#a39c95] truncate mt-0.5">{st.description}</p>
                            )}
                          </div>

                          {/* Assignee mini avatars */}
                          {(st.assignees || []).length > 0 && (
                            <div className="flex -space-x-1 shrink-0">
                              {(st.assignees || []).map((name) => (
                                <div
                                  key={name}
                                  className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold border border-white"
                                  style={{ backgroundColor: memberColorMap[name] || '#888' }}
                                  title={name}
                                >
                                  {name.charAt(0)}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Priority dot */}
                          <Badge className={`text-[9px] px-1.5 py-0 rounded-full border-0 shrink-0 ${PRIORITY_BADGE[st.priority]}`}>
                            {st.priority.charAt(0).toUpperCase()}
                          </Badge>

                          {/* Due date */}
                          {st.dueDate && (
                            <span className={`text-[10px] shrink-0 px-1.5 py-0.5 rounded-full ${DATE_BADGE_STYLES[stUrgency]}`}>
                              {formatDateFR(st.dueDate)}
                            </span>
                          )}

                          {/* Notes count */}
                          {(st.notes?.length || 0) > 0 && (
                            <span className="text-[9px] text-[#a39c95] shrink-0">{st.notes.length}</span>
                          )}

                          <ChevronRight className="h-3.5 w-3.5 text-[#a39c95] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </div>
                      )
                    })}
                  </div>

                  {addingSubtask && (
                    <div className="flex gap-2 mt-2 items-center">
                      <Input
                        placeholder="Nom de la sous-tâche"
                        value={newSubtaskTitle}
                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
                        className="rounded-lg text-sm h-8 flex-1"
                        autoFocus
                      />
                      <Button size="sm" onClick={addSubtask} className="h-8 rounded-lg bg-[#241f20] text-white text-xs">OK</Button>
                      <Button size="sm" variant="ghost" onClick={() => setAddingSubtask(false)} className="h-8 text-xs"><X className="h-3 w-3" /></Button>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Attachments */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-[#6c6560] uppercase tracking-wider flex items-center gap-1.5">
                      <Paperclip className="h-3.5 w-3.5" /> Documents
                    </label>
                    <div className="flex gap-1">
                      <button onClick={() => { setAttachmentMode('file'); fileInputRef.current?.click() }}
                        className="text-xs text-[#6c6560] hover:text-[#f8571f] flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#f5f5f7] hover:bg-[#f8571f]/10 transition-all">
                        <Upload className="h-3 w-3" /> Fichier
                      </button>
                      <button onClick={() => setAttachmentMode(attachmentMode === 'link' ? null : 'link')}
                        className="text-xs text-[#6c6560] hover:text-[#f8571f] flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#f5f5f7] hover:bg-[#f8571f]/10 transition-all">
                        <Link2 className="h-3 w-3" /> Lien
                      </button>
                    </div>
                  </div>
                  <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
                  {attachmentMode === 'link' && (
                    <div className="flex gap-2 mb-2">
                      <Input placeholder="Nom" value={linkName} onChange={(e) => setLinkName(e.target.value)} className="rounded-lg text-sm h-8 w-[120px]" />
                      <Input placeholder="URL" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addLinkAttachment()} className="rounded-lg text-sm h-8 flex-1" autoFocus />
                      <Button size="sm" onClick={addLinkAttachment} className="h-8 rounded-lg bg-[#241f20] text-white text-xs">OK</Button>
                    </div>
                  )}
                  {attachments.length === 0 && !attachmentMode && <p className="text-xs text-[#a39c95] text-center py-2">Aucun document</p>}
                  <div className="space-y-1">
                    {attachments.map((att) => (
                      <div key={att.id} className="group flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#f5f5f7] hover:bg-[#eee] transition-colors">
                        {att.type === 'file' ? <FileText className="h-3.5 w-3.5 text-blue-500 shrink-0" /> : <Link2 className="h-3.5 w-3.5 text-[#f8571f] shrink-0" />}
                        <a href={att.url} target="_blank" rel="noopener noreferrer" download={att.type === 'file' ? att.name : undefined} className="flex-1 text-sm text-[#241f20] hover:underline truncate">{att.name}</a>
                        <span className="text-[10px] text-[#a39c95]">{att.addedBy}</span>
                        <button onClick={() => removeAttachment(att.id)} className="opacity-0 group-hover:opacity-100 text-[#a39c95] hover:text-red-500 transition-all"><Trash2 className="h-3 w-3" /></button>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Activity */}
                <div>
                  <label className="text-xs font-medium text-[#6c6560] uppercase tracking-wider mb-3 block">Activité</label>
                  {task.activities.length === 0 && <p className="text-sm text-[#a39c95] text-center py-4">Aucune activité</p>}
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
                            <button onClick={() => removeActivity(activity.id)} className="ml-auto opacity-0 group-hover:opacity-100 text-[#a39c95] hover:text-red-500 transition-all"><X className="h-3 w-3" /></button>
                          </div>
                          <div className={`text-sm rounded-xl px-3 py-2 whitespace-pre-wrap break-words ${
                            activity.type === 'status_change' ? 'bg-[#f5f5f7] text-[#6c6560] italic'
                            : activity.type === 'document' ? 'bg-blue-50 text-[#241f20]'
                            : activity.type === 'mention' ? 'bg-[#f8571f]/5 text-[#241f20]'
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
                  <button key={type} onClick={() => setActivityType(type)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] transition-all ${
                      activityType === type ? 'bg-[#241f20] text-white' : 'bg-[#f5f5f7] text-[#6c6560] hover:bg-[#eee]'
                    }`}>
                    {type === 'note' && <StickyNote className="h-3 w-3" />}
                    {type === 'document' && <FileText className="h-3 w-3" />}
                    {type === 'mention' && <AtSign className="h-3 w-3" />}
                    {type === 'note' ? 'Note' : type === 'document' ? 'Document' : 'Mention'}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <MentionInput
                  value={newMessage}
                  onChange={setNewMessage}
                  onSubmit={addActivity}
                  placeholder={activityType === 'note' ? 'Écrire une note... (@ pour mentionner)' : activityType === 'document' ? 'Lien ou nom du document...' : 'Tapez @ pour mentionner quelqu\'un...'}
                  members={members}
                  className="rounded-full text-sm"
                />
                <Button size="sm" onClick={addActivity} disabled={!newMessage.trim()} className="rounded-full bg-[#f8571f] hover:bg-[#e04d1a] text-white px-4">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
