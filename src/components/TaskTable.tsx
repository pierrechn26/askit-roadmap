import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Plus, Trash2, ArrowUpDown, MessageSquare, CheckSquare, Square, Paperclip, ChevronRight, Filter, X, LayoutList, Bug } from 'lucide-react'
import type { Task, Priority, TaskStatus, TeamMember, SubTask, Objective } from '@/types'
import { STATUS_LABELS, STATUS_COLORS, PRIORITY_ORDER } from '@/types'
import { DEFAULT_CATEGORIES } from '@/data/defaults'
import { notifyAssignment } from '@/lib/notifications'
import { formatDateFR, getDateUrgency, DATE_BADGE_STYLES, CARD_BORDER_STYLES } from '@/lib/dates'

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

type SortKey = 'priority' | 'dueDate' | 'startDate' | 'status' | 'assignee' | 'category'

const SORT_LABELS: Record<SortKey, string> = {
  priority: 'Priorité',
  dueDate: 'Échéance',
  startDate: 'Date début',
  status: 'Statut',
  assignee: 'Assigné',
  category: 'Catégorie',
}

const STATUS_ORDER: Record<TaskStatus, number> = {
  bloque: 0, en_cours: 1, a_faire: 2, termine: 3,
}

export function TaskTable({ tasks, onTasksChange, members, objectives, onTaskClick }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewType, setViewType] = useState<'roadmap' | 'ticket'>('roadmap')
  const [filterAssignee, setFilterAssignee] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterClient, setFilterClient] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortKey>('priority')
  const [sortAsc, setSortAsc] = useState(true)
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([members[0]?.name || ''])
  const [selectedObjectiveIds, setSelectedObjectiveIds] = useState<string[]>([])

  const [newClient, setNewClient] = useState('')
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
      taskType: viewType,
      client: viewType === 'ticket' ? newClient.trim() : '',
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
    setNewClient('')
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

  const viewTasks = tasks.filter((t) => (t.taskType || 'roadmap') === viewType)
  const allCategories = [...new Set(viewTasks.map((t) => t.category))].sort()
  const allClients = [...new Set(tasks.filter((t) => t.client).map((t) => t.client))].sort()

  // Filter
  let filtered = viewTasks
    .filter((t) => filterAssignee === 'all' || t.assignees.includes(filterAssignee))
    .filter((t) => filterStatus === 'all' || t.status === filterStatus)
    .filter((t) => filterPriority === 'all' || t.priority === filterPriority)
    .filter((t) => filterCategory === 'all' || t.category === filterCategory)
    .filter((t) => filterClient === 'all' || t.client === filterClient)

  // Sort
  const dir = sortAsc ? 1 : -1
  filtered = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'priority': return (PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]) * dir
      case 'dueDate': return a.dueDate.localeCompare(b.dueDate) * dir
      case 'startDate': return a.startDate.localeCompare(b.startDate) * dir
      case 'status': return (STATUS_ORDER[a.status] - STATUS_ORDER[b.status]) * dir
      case 'assignee': return (a.assignees[0] || '').localeCompare(b.assignees[0] || '') * dir
      case 'category': return a.category.localeCompare(b.category) * dir
      default: return 0
    }
  })

  const activeFilters = [filterAssignee, filterStatus, filterPriority, filterCategory, filterClient].filter((f) => f !== 'all').length

  function handleSortClick(key: SortKey) {
    if (sortBy === key) setSortAsc(!sortAsc)
    else { setSortBy(key); setSortAsc(true) }
  }

  function clearFilters() {
    setFilterAssignee('all')
    setFilterStatus('all')
    setFilterPriority('all')
    setFilterCategory('all')
    setFilterClient('all')
  }

  return (
    <div className="space-y-4">
      {/* Sub-tabs: Roadmap / Tickets Dev */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-[#f5f5f7] rounded-full p-0.5">
          <button
            onClick={() => { setViewType('roadmap'); clearFilters() }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              viewType === 'roadmap' ? 'bg-white text-[#241f20] shadow-sm' : 'text-[#a39c95] hover:text-[#241f20]'
            }`}
          >
            <LayoutList className="h-4 w-4" /> Tâches Roadmap
            <span className="text-[10px] bg-[#f5f5f7] text-[#6c6560] rounded-full px-1.5 py-0.5 ml-0.5">
              {tasks.filter((t) => (t.taskType || 'roadmap') === 'roadmap').length}
            </span>
          </button>
          <button
            onClick={() => { setViewType('ticket'); clearFilters() }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              viewType === 'ticket' ? 'bg-white text-[#241f20] shadow-sm' : 'text-[#a39c95] hover:text-[#241f20]'
            }`}
          >
            <Bug className="h-4 w-4" /> Tickets Dev
            <span className="text-[10px] bg-[#f5f5f7] text-[#6c6560] rounded-full px-1.5 py-0.5 ml-0.5">
              {tasks.filter((t) => t.taskType === 'ticket').length}
            </span>
          </button>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-full bg-[#f8571f] hover:bg-[#e04d1a] text-white">
              <Plus className="h-4 w-4 mr-1" /> {viewType === 'ticket' ? 'Nouveau ticket' : 'Nouvelle tâche'}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader><DialogTitle className="text-[#241f20]">{viewType === 'ticket' ? 'Nouveau ticket dev' : 'Nouvelle tâche'}</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              {viewType === 'ticket' && (
                <Input placeholder="Client (ex: Baubo, Dermeden...)" className="rounded-xl" value={newClient} onChange={(e) => setNewClient(e.target.value)} />
              )}
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

        {/* Separator */}
        <div className="w-px h-5 bg-[#241f20]/10" />

        {/* Filters */}
        <div className="flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-[#a39c95]" />

          <Select value={filterAssignee} onValueChange={setFilterAssignee}>
            <SelectTrigger className={`h-7 rounded-full text-[12px] px-2.5 ${filterAssignee !== 'all' ? 'bg-[#241f20] text-white' : 'bg-[#f5f5f7] text-[#6c6560]'}`}>
              <span>{filterAssignee === 'all' ? 'Assigné' : filterAssignee}</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              {members.map((m) => <SelectItem key={m.name} value={m.name}>{m.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className={`h-7 rounded-full text-[12px] px-2.5 ${filterStatus !== 'all' ? 'bg-[#241f20] text-white' : 'bg-[#f5f5f7] text-[#6c6560]'}`}>
              <span>{filterStatus === 'all' ? 'Statut' : STATUS_LABELS[filterStatus as TaskStatus]}</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tout statut</SelectItem>
              {Object.entries(STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className={`h-7 rounded-full text-[12px] px-2.5 ${filterPriority !== 'all' ? 'bg-[#f8571f] text-white' : 'bg-[#f5f5f7] text-[#6c6560]'}`}>
              <span>{filterPriority === 'all' ? 'Priorité' : filterPriority.charAt(0).toUpperCase() + filterPriority.slice(1)}</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toute priorité</SelectItem>
              <SelectItem value="haute">Haute</SelectItem>
              <SelectItem value="moyenne">Moyenne</SelectItem>
              <SelectItem value="basse">Basse</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className={`h-7 rounded-full text-[12px] px-2.5 ${filterCategory !== 'all' ? 'bg-[#a7abdd] text-white' : 'bg-[#f5f5f7] text-[#6c6560]'}`}>
              <span>{filterCategory === 'all' ? 'Catégorie' : filterCategory}</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toute catégorie</SelectItem>
              {allCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>

          {viewType === 'ticket' && allClients.length > 0 && (
            <Select value={filterClient} onValueChange={setFilterClient}>
              <SelectTrigger className={`h-7 rounded-full text-[12px] px-2.5 ${filterClient !== 'all' ? 'bg-[#6366f1] text-white' : 'bg-[#f5f5f7] text-[#6c6560]'}`}>
                <span>{filterClient === 'all' ? 'Client' : filterClient}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tout client</SelectItem>
                {allClients.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          {activeFilters > 0 && (
            <button onClick={clearFilters} className="h-7 px-2 rounded-full bg-red-50 text-red-500 text-[11px] flex items-center gap-1 hover:bg-red-100 transition-colors">
              <X className="h-3 w-3" /> Effacer ({activeFilters})
            </button>
          )}
        </div>

        {/* Separator */}
        <div className="w-px h-5 bg-[#241f20]/10" />

        {/* Sort — single button with dropdown, click header to toggle direction */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="h-7 px-3 rounded-full text-[12px] flex items-center gap-1.5 bg-[#f5f5f7] text-[#6c6560] hover:bg-[#eee] transition-all">
              <ArrowUpDown className="h-3 w-3" />
              {SORT_LABELS[sortBy]}
              <span className="text-[10px]">{sortAsc ? '↑' : '↓'}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[160px] p-1 rounded-xl" align="start">
            {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => {
              const active = sortBy === key
              return (
                <button
                  key={key}
                  onClick={() => handleSortClick(key)}
                  className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    active ? 'bg-[#241f20] text-white' : 'text-[#241f20] hover:bg-[#f5f5f7]'
                  }`}
                >
                  {SORT_LABELS[key]}
                  {active && <span className="text-xs">{sortAsc ? '↑' : '↓'}</span>}
                </button>
              )
            })}
          </PopoverContent>
        </Popover>
      </div>

      {/* Results count */}
      <div className="flex items-center gap-2 text-xs text-[#a39c95]">
        <span>{filtered.length} tâche{filtered.length > 1 ? 's' : ''}</span>
        {activeFilters > 0 && <span>({activeFilters} filtre{activeFilters > 1 ? 's' : ''} actif{activeFilters > 1 ? 's' : ''})</span>}
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

          const urgency = getDateUrgency(task.dueDate, task.status === 'termine')

          return (
            <div key={task.id}>
              {/* Main task card */}
              <Card
                className={`p-4 rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${CARD_BORDER_STYLES[urgency]}`}
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

                  <div className="flex-1 min-w-[150px]">
                    {task.client && (
                      <span className="text-[10px] font-semibold text-[#6366f1] uppercase tracking-wider">{task.client}</span>
                    )}
                    <span className="font-semibold text-[#241f20] block">{task.title}</span>
                  </div>

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

                  <span className={`text-xs whitespace-nowrap px-2 py-0.5 rounded-full ${DATE_BADGE_STYLES[urgency]}`}>
                    {formatDateFR(task.startDate)} → {formatDateFR(task.dueDate)}
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
  const urgency = getDateUrgency(subtask.dueDate, subtask.done)

  return (
    <div
      className={`group flex items-center gap-2 py-1.5 px-2.5 rounded-xl hover:bg-[#f5f5f7] cursor-pointer transition-colors ${
        urgency === 'overdue' ? 'bg-red-50/50' : ''
      }`}
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
        <span className={`text-[10px] shrink-0 px-1.5 py-0.5 rounded-full ${DATE_BADGE_STYLES[urgency]}`}>
          {formatDateFR(subtask.dueDate)}
        </span>
      )}

      <ChevronRight className="h-3 w-3 text-[#a39c95] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </div>
  )
}
