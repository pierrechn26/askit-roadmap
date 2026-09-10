import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Trash2, ArrowUpDown, MessageSquare, CheckSquare, Paperclip } from 'lucide-react'
import type { Task, Priority, TaskStatus, TeamMember } from '@/types'
import { STATUS_LABELS, STATUS_COLORS } from '@/types'
import { DEFAULT_CATEGORIES } from '@/data/defaults'
import { notifyAssignment } from '@/lib/notifications'

const PRIORITY_COLORS: Record<Priority, string> = {
  haute: 'bg-[#f8571f]/10 text-[#f8571f] border-[#f8571f]/20',
  moyenne: 'bg-[#accce9]/30 text-[#241f20] border-[#accce9]/40',
  basse: 'bg-[#f5f5f7] text-[#6c6560] border-[#f5f5f7]',
}

interface Props {
  tasks: Task[]
  onTasksChange: (t: Task[]) => void
  members: TeamMember[]
  onTaskClick: (task: Task) => void
}

export function TaskTable({ tasks, onTasksChange, members, onTaskClick }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'assignee'>('dueDate')
  const [filterAssignee, setFilterAssignee] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([members[0]?.name || ''])

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
    } as Task
    onTasksChange([...tasks, created])

    // Notify assignees
    selectedAssignees.forEach((name) => {
      const member = members.find((m) => m.name === name)
      if (member?.email) notifyAssignment(member, created)
    })

    setNewTask({
      title: '',
      description: '',
      startDate: new Date().toISOString().slice(0, 10),
      dueDate: '',
      priority: 'moyenne',
      status: 'a_faire',
      category: DEFAULT_CATEGORIES[0],
    })
    setSelectedAssignees([members[0]?.name || ''])
    setDialogOpen(false)
  }

  function updateTaskStatus(id: string, status: TaskStatus) {
    onTasksChange(tasks.map((t) => (t.id === id ? { ...t, status } : t)))
  }

  function removeTask(id: string) {
    onTasksChange(tasks.filter((t) => t.id !== id))
  }

  const priorityOrder: Record<Priority, number> = { haute: 0, moyenne: 1, basse: 2 }

  const memberColorMap: Record<string, string> = {}
  members.forEach((m) => { memberColorMap[m.name] = m.color })

  let filtered = tasks
    .filter((t) => filterAssignee === 'all' || t.assignees.includes(filterAssignee))
    .filter((t) => filterStatus === 'all' || t.status === filterStatus)

  filtered = [...filtered].sort((a, b) => {
    if (sortBy === 'dueDate') return a.dueDate.localeCompare(b.dueDate)
    if (sortBy === 'priority') return priorityOrder[a.priority] - priorityOrder[b.priority]
    return (a.assignees[0] || '').localeCompare(b.assignees[0] || '')
  })

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

              {/* Multi-select assignees */}
              <div>
                <label className="text-xs text-[#6c6560] mb-1.5 block">Responsables</label>
                <div className="flex flex-wrap gap-1.5">
                  {members.map((m) => {
                    const selected = selectedAssignees.includes(m.name)
                    return (
                      <button
                        key={m.name}
                        type="button"
                        onClick={() => toggleNewAssignee(m.name)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-all ${
                          selected ? 'text-white' : 'bg-[#f5f5f7] text-[#6c6560] hover:bg-[#eee]'
                        }`}
                        style={selected ? { backgroundColor: m.color } : undefined}
                      >
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

        <Button
          variant="ghost"
          size="sm"
          className="rounded-full text-[#6c6560]"
          onClick={() => setSortBy(sortBy === 'dueDate' ? 'priority' : sortBy === 'priority' ? 'assignee' : 'dueDate')}
        >
          <ArrowUpDown className="h-4 w-4 mr-1" />
          {sortBy === 'dueDate' ? 'Échéance' : sortBy === 'priority' ? 'Priorité' : 'Assigné'}
        </Button>
      </div>

      {/* Task list */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-center text-[#a39c95] py-8">Aucune tâche</p>
        )}
        {filtered.map((task) => {
          const subtasks = task.subtasks || []
          const attachments = task.attachments || []
          const stDone = subtasks.filter((s) => s.done).length
          return (
            <Card
              key={task.id}
              className="p-3.5 rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
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

                <span className="flex-1 font-medium min-w-[150px] text-[#241f20]">{task.title}</span>

                {/* Assignee avatars */}
                <div className="flex -space-x-1.5">
                  {task.assignees.map((name) => (
                    <div
                      key={name}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold border-2 border-white"
                      style={{ backgroundColor: memberColorMap[name] || '#888' }}
                      title={name}
                    >
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

                {/* Indicators */}
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

                <button
                  onClick={(e) => { e.stopPropagation(); removeTask(task.id) }}
                  className="text-[#a39c95] hover:text-[#ef4444] transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
