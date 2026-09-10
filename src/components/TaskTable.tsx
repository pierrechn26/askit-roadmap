import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Trash2, ArrowUpDown, MessageSquare, CheckSquare, Square, Paperclip, ChevronRight } from 'lucide-react'
import type { Task, Priority, TaskStatus, TeamMember, SubTask, Objective } from '@/types'
import { STATUS_LABELS, STATUS_COLORS, PRIORITY_ORDER } from '@/types'
import { DEFAULT_CATEGORIES } from '@/data/defaults'
import { notifyAssignment } from '@/lib/notifications'

const PRIORITY_COLORS: Record<Priority, string> = {
  haute: 'bg-[#f8571f]/10 text-[#f8571f] border-[#f8571f]/20',
  moyenne: 'bg-[#accce9]/30 text-[#241f20] border-[#accce9]/40',
  basse: 'bg-[#f5f5f7] text-[#6c6560] border-[#f5f5f7]',
}

const PRIORITY_BADGE_SMALL: Record<Priority, string> = {
  haute: 'bg-[#f8571f]/10 text-[#f8571f]',
  moyenne: 'bg-[#accce9]/20 text-[#241f20]',
  basse: 'bg-[#f5f5f7] text-[#a39c95]',
}

interface Props {
  tasks: Task[]
  onTasksChange: (t: Task[]) => void
  members: TeamMember[]
  objectives: Objective[]
  onTaskClick: (task: Task) => void
}

export function TaskTable({ tasks, onTasksChange, members, objectives, onTaskClick }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [filterAssignee, setFilterAssignee] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([members[0]?.name || ''])
  const [selectedObjectiveIds, setSelectedObjectiveIds] = useState<string[]>([])

  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    startDate: new Date().toISOString().slice(0, 10),
    dueDate: '',
    priority: 'moyenne',
    status: 'a_faire',
    category: DEFAULT_CATEGORIES[0],
  })

  function toggleNewAssignee(name: string) {
    setSelectedAssignees((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]
    )
  }

  function addTask() {
    if (!newTask.title?.trim() || !newTask.dueDate || selectedAssignees.length === 0) return
    const created: Task = {
      ...newTask,
      id: Date.now().toString(),
      title: newTask.title!.trim(),
      description: newTask.description || '',
      assignees: selectedAssignees,
      activities: [],
      subtasks: [],
      attachments: [],
      objectiveIds: selectedObjectiveIds,
    } as Task
    onTasksChange([...tasks, created])

    selectedAssignees.forEach((name) => {
      const member = members.find((m) => m.name === name)
      if (member?.email) notifyAssignment(member, created)
    })

    setNewTask({
      title: '', description: '',
      startDate: new Date().toISOString().slice(0, 10),
      dueDate: '', priority: 'moyenne', status: 'a_faire', category: DEFAULT_CATEGORIES[0],
    })
    setSelectedAssignees([members[0]?.name || ''])
    setSelectedObjectiveIds([])
    setDialogOpen(false)
  }

  function updateTaskStatus(id: string, status: TaskStatus) {
    onTasksChange(tasks.map((t) => (t.id === id ? { ...t, status } : t)))
  }

  function toggleSubtask(taskId: string, subtaskId: string) {
    onTasksChange(tasks.map((t) => {
      if (t.id !== taskId) return t
      return {
        ...t,
        subtasks: (t.subtasks || []).map((s) =>
          s.id === subtaskId ? { ...s, done: !s.done } : s
        ),
      }
    }))
  }

  function removeTask(id: string) {
    onTasksChange(tasks.filter((t) => t.id !== id))
  }

  const memberColorMap: Record<string, string> = {}
  members.forEach((m) => { memberColorMap[m.name] = m.color })

  // Filter
  let filtered = tasks
    .filter((t) => filterAssignee === 'all' || t.assignees.includes(filterAssignee))
    .filter((t) => filterStatus === 'all' || t.status === filterStatus)

  // Sort by priority by default
  filtered = [...filtered].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-full bg-[#f8571f] hover:bg-[#e04d1a] text-white">
              <Plus className="h-4 w-4 mr-1" /> Nouvelle tâche
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader><DialogTitle className="text-[#241f20]">Nouvelle tâche</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <Input placeholder="Titre" className="rounded-xl" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} />
              <div>
                <label className="text-xs text-[#6c6560] mb-1.5 block">Responsables</label>
                <div className="flex flex-wrap gap-1.5">
                  {members.map((m) => {
                    const selected = selectedAssignees.includes(m.name)
                    return (
                      <button key={m.name} type="button" onClick={() => toggleNewAssignee(m.name)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-all ${
                          selected ? 'text-white' : 'bg-[#f5f5f7] text-[#6c6560] hover:bg-[#eee]'
                        }`}
                        style={selected ? { backgroundColor: m.color } : undefined}>
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: selected ? '#fff' : m.color }} />
                        {m.name}
                        {m.role === 'dev' && <span className="ml-0.5 opacity-70">DEV</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-[#a39c95] mb-1 block">Début</label>
                  <Input type="date" className="rounded-xl" value={newTask.startDate} onChange={(e) => setNewTask({ ...newTask, startDate: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-[#a39c95] mb-1 block">Échéance</label>
                  <Input type="date" className="rounded-xl" value={newTask.dueDate} onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Select value={newTask.priority} onValueChange={(v) => setNewTask({ ...newTask, priority: v as Priority })}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Priorité" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="haute">Haute</SelectItem>
                    <SelectItem value="moyenne">Moyenne</SelectItem>
                    <SelectItem value="basse">Basse</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={newTask.category} onValueChange={(v) => setNewTask({ ...newTask, category: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Catégorie" /></SelectTrigger>
                  <SelectContent>
                    {DEFAULT_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {/* Link to objectives */}
              {objectives.length > 0 && (
                <div>
                  <label className="text-xs text-[#6c6560] mb-1.5 block">Lier à un objectif</label>
                  <div className="flex flex-wrap gap-1.5">
                    {objectives.map((obj) => {
                      const selected = selectedObjectiveIds.includes(obj.id)
                      return (
                        <button key={obj.id} type="button"
                          onClick={() => setSelectedObjectiveIds((prev) =>
                            selected ? prev.filter((id) => id !== obj.id) : [...prev, obj.id]
                          )}
                          className={`px-2.5 py-1 rounded-full text-[11px] transition-all ${
                            selected ? 'bg-[#241f20] text-white' : 'bg-[#f5f5f7] text-[#6c6560] hover:bg-[#eee]'
                          }`}>
                          {obj.title.length > 30 ? obj.title.slice(0, 30) + '…' : obj.title}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <Button onClick={addTask} className="w-full rounded-full bg-[#241f20] hover:bg-[#333] text-white">Ajouter</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Select value={filterAssignee} onValueChange={setFilterAssignee}>
          <SelectTrigger className="w-[140px] h-8 rounded-full text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            {members.map((m) => <SelectItem key={m.name} value={m.name}>{m.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px] h-8 rounded-full text-sm">
            <span>{filterStatus === 'all' ? 'Tout statut' : STATUS_LABELS[filterStatus as TaskStatus]}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tout statut</SelectItem>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Task list with inline subtasks */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <p className="text-center text-[#a39c95] py-8">Aucune tâche</p>
        )}
        {filtered.map((task) => {
          const subtasks = [...(task.subtasks || [])].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])
          const attachments = task.attachments || []
          const stDone = subtasks.filter((s) => s.done).length

          return (
            <div key={task.id}>
              {/* Main task card */}
              <Card
                className="p-4 rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onTaskClick(task)}
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <div onClick={(e) => e.stopPropagation()}>
                    <Select value={task.status} onValueChange={(v) => updateTaskStatus(task.id, v as TaskStatus)}>
                      <SelectTrigger className={`w-[110px] h-7 text-xs rounded-full border-0 ${STATUS_COLORS[task.status]}`}>
                        <span>{STATUS_LABELS[task.status]}</span>
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <span className="flex-1 font-semibold min-w-[150px] text-[#241f20]">{task.title}</span>

                  <div className="flex -space-x-1.5">
                    {task.assignees.map((name) => (
                      <div key={name} className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold border-2 border-white"
                        style={{ backgroundColor: memberColorMap[name] || '#888' }} title={name}>
                        {name.charAt(0).toUpperCase()}
                      </div>
                    ))}
                  </div>

                  <Badge variant="outline" className={`text-xs rounded-full border ${PRIORITY_COLORS[task.priority]}`}>
                    {task.priority}
                  </Badge>
                  <Badge className="text-xs rounded-full bg-[#f5f5f7] text-[#6c6560] border-0">{task.category}</Badge>

                  <span className="text-xs text-[#a39c95] whitespace-nowrap font-mono">
                    {task.startDate} → {task.dueDate}
                  </span>

                  <div className="flex items-center gap-2">
                    {subtasks.length > 0 && (
                      <span className="flex items-center gap-0.5 text-[10px] text-[#a39c95]">
                        <CheckSquare className="h-3 w-3" /> {stDone}/{subtasks.length}
                      </span>
                    )}
                    {attachments.length > 0 && (
                      <span className="flex items-center gap-0.5 text-[10px] text-[#a39c95]">
                        <Paperclip className="h-3 w-3" /> {attachments.length}
                      </span>
                    )}
                    {task.activities.length > 0 && (
                      <span className="flex items-center gap-0.5 text-[10px] text-[#a39c95]">
                        <MessageSquare className="h-3 w-3" /> {task.activities.length}
                      </span>
                    )}
                  </div>

                  <button onClick={(e) => { e.stopPropagation(); removeTask(task.id) }}
                    className="text-[#a39c95] hover:text-[#ef4444] transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </Card>

              {/* Inline subtasks */}
              {subtasks.length > 0 && (
                <div className="ml-6 mt-1 border-l-2 border-[rgba(36,31,32,0.06)] pl-4 space-y-0.5">
                  {subtasks.map((st) => (
                    <SubtaskRow
                      key={st.id}
                      subtask={st}
                      taskId={task.id}
                      memberColorMap={memberColorMap}
                      onToggle={toggleSubtask}
                      onClick={() => onTaskClick(task)}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SubtaskRow({ subtask, taskId, memberColorMap, onToggle, onClick }: {
  subtask: SubTask
  taskId: string
  memberColorMap: Record<string, string>
  onToggle: (taskId: string, subtaskId: string) => void
  onClick: () => void
}) {
  const isOverdue = !subtask.done && subtask.dueDate && new Date(subtask.dueDate) < new Date()

  return (
    <div
      className="group flex items-center gap-2 py-1.5 px-2.5 rounded-xl hover:bg-[#f5f5f7] cursor-pointer transition-colors"
      onClick={onClick}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(taskId, subtask.id) }}
        className="shrink-0"
      >
        {subtask.done ? (
          <CheckSquare className="h-3.5 w-3.5 text-[#f8571f]" />
        ) : (
          <Square className="h-3.5 w-3.5 text-[#a39c95]" />
        )}
      </button>

      <span className={`flex-1 text-sm ${subtask.done ? 'line-through text-[#a39c95]' : 'text-[#241f20]'}`}>
        {subtask.title}
      </span>

      {/* Assignee mini avatars */}
      {(subtask.assignees || []).length > 0 && (
        <div className="flex -space-x-1 shrink-0">
          {(subtask.assignees || []).map((name) => (
            <div key={name} className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[7px] font-bold border border-white"
              style={{ backgroundColor: memberColorMap[name] || '#888' }} title={name}>
              {name.charAt(0)}
            </div>
          ))}
        </div>
      )}

      <Badge className={`text-[8px] px-1 py-0 rounded-full border-0 shrink-0 ${PRIORITY_BADGE_SMALL[subtask.priority]}`}>
        {subtask.priority.charAt(0).toUpperCase()}
      </Badge>

      {subtask.dueDate && (
        <span className={`text-[10px] font-mono shrink-0 ${isOverdue ? 'text-red-500 font-medium' : 'text-[#a39c95]'}`}>
          {subtask.dueDate.slice(5)}
        </span>
      )}

      <ChevronRight className="h-3 w-3 text-[#a39c95] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </div>
  )
}
