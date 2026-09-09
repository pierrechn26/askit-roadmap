import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Trash2, ArrowUpDown } from 'lucide-react'
import type { Task, Priority, TaskStatus, TeamMember } from '@/types'
import { DEFAULT_CATEGORIES } from '@/data/defaults'

const PRIORITY_COLORS: Record<Priority, string> = {
  haute: 'bg-[#f8571f]/10 text-[#f8571f] border-[#f8571f]/20',
  moyenne: 'bg-[#accce9]/30 text-[#241f20] border-[#accce9]/40',
  basse: 'bg-[#f5f5f7] text-[#6c6560] border-[#f5f5f7]',
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  a_faire: 'A faire',
  en_cours: 'En cours',
  termine: 'Terminé',
  bloque: 'Bloqué',
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  a_faire: 'bg-[#f5f5f7] text-[#6c6560]',
  en_cours: 'bg-[#f8571f]/10 text-[#f8571f]',
  termine: 'bg-[#a7abdd]/20 text-[#241f20]',
  bloque: 'bg-red-50 text-red-600',
}

interface Props {
  tasks: Task[]
  onTasksChange: (t: Task[]) => void
  members: TeamMember[]
}

export function TaskTable({ tasks, onTasksChange, members }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'assignee'>('dueDate')
  const [filterAssignee, setFilterAssignee] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    assignee: members[0]?.name || '',
    startDate: new Date().toISOString().slice(0, 10),
    dueDate: '',
    priority: 'moyenne',
    status: 'a_faire',
    category: DEFAULT_CATEGORIES[0],
  })

  function addTask() {
    if (!newTask.title?.trim() || !newTask.dueDate) return
    onTasksChange([
      ...tasks,
      {
        ...newTask,
        id: Date.now().toString(),
        title: newTask.title!.trim(),
      } as Task,
    ])
    setNewTask({
      title: '',
      assignee: members[0]?.name || '',
      startDate: new Date().toISOString().slice(0, 10),
      dueDate: '',
      priority: 'moyenne',
      status: 'a_faire',
      category: DEFAULT_CATEGORIES[0],
    })
    setDialogOpen(false)
  }

  function updateTask(id: string, updates: Partial<Task>) {
    onTasksChange(tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)))
  }

  function removeTask(id: string) {
    onTasksChange(tasks.filter((t) => t.id !== id))
  }

  const priorityOrder: Record<Priority, number> = { haute: 0, moyenne: 1, basse: 2 }

  let filtered = tasks
    .filter((t) => filterAssignee === 'all' || t.assignee === filterAssignee)
    .filter((t) => filterStatus === 'all' || t.status === filterStatus)

  filtered = [...filtered].sort((a, b) => {
    if (sortBy === 'dueDate') return a.dueDate.localeCompare(b.dueDate)
    if (sortBy === 'priority') return priorityOrder[a.priority] - priorityOrder[b.priority]
    return a.assignee.localeCompare(b.assignee)
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
              <Select value={newTask.assignee} onValueChange={(v) => setNewTask({ ...newTask, assignee: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Assigné à" /></SelectTrigger>
                <SelectContent>
                  {members.map((m) => <SelectItem key={m.name} value={m.name}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
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
          <SelectTrigger className="w-[140px] h-8 rounded-full text-sm"><SelectValue /></SelectTrigger>
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
        {filtered.map((task) => (
          <Card key={task.id} className="p-3.5 rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Status select */}
              <Select value={task.status} onValueChange={(v) => updateTask(task.id, { status: v as TaskStatus })}>
                <SelectTrigger className={`w-[110px] h-7 text-xs rounded-full border-0 ${STATUS_COLORS[task.status]}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>

              {/* Title */}
              <span className="flex-1 font-medium min-w-[150px] text-[#241f20]">{task.title}</span>

              {/* Assignee */}
              <Select value={task.assignee} onValueChange={(v) => updateTask(task.id, { assignee: v })}>
                <SelectTrigger className="w-[120px] h-7 text-xs rounded-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => <SelectItem key={m.name} value={m.name}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>

              {/* Priority badge */}
              <Badge variant="outline" className={`text-xs rounded-full border ${PRIORITY_COLORS[task.priority]}`}>
                {task.priority}
              </Badge>

              {/* Category */}
              <Badge className="text-xs rounded-full bg-[#f5f5f7] text-[#6c6560] border-0">{task.category}</Badge>

              {/* Dates */}
              <span className="text-xs text-[#a39c95] whitespace-nowrap font-mono">
                {task.startDate} → {task.dueDate}
              </span>

              {/* Delete */}
              <button onClick={() => removeTask(task.id)} className="text-[#a39c95] hover:text-[#ef4444] transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
