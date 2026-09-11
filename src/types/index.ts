export type Priority = 'haute' | 'moyenne' | 'basse'
export type TaskStatus = 'a_faire' | 'en_cours' | 'termine' | 'bloque'

export const STATUS_LABELS: Record<TaskStatus, string> = {
  a_faire: 'À faire',
  en_cours: 'En cours',
  termine: 'Terminé',
  bloque: 'Bloqué',
}

export const STATUS_DOT: Record<TaskStatus, string> = {
  a_faire: 'bg-[#a39c95]',
  en_cours: 'bg-[#f8571f]',
  termine: 'bg-[#a7abdd]',
  bloque: 'bg-red-500',
}

export const STATUS_COLORS: Record<TaskStatus, string> = {
  a_faire: 'bg-[#f5f5f7] text-[#6c6560]',
  en_cours: 'bg-[#f8571f]/10 text-[#f8571f]',
  termine: 'bg-[#a7abdd]/20 text-[#241f20]',
  bloque: 'bg-red-50 text-red-600',
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  haute: 'Haute',
  moyenne: 'Moyenne',
  basse: 'Basse',
}

export const PRIORITY_ORDER: Record<Priority, number> = {
  haute: 0,
  moyenne: 1,
  basse: 2,
}

export interface SubTask {
  id: string
  title: string
  description: string
  done: boolean
  dueDate: string
  priority: Priority
  assignees: string[]
  notes: SubTaskNote[]
}

export interface SubTaskNote {
  id: string
  content: string
  author: string
  createdAt: string
}

export interface TaskAttachment {
  id: string
  name: string
  url: string
  type: 'file' | 'link'
  addedAt: string
  addedBy: string
}

export interface TaskActivity {
  id: string
  type: 'note' | 'document' | 'mention' | 'status_change'
  content: string
  author: string
  createdAt: string
}

export type TaskType = 'roadmap' | 'ticket'

export interface Task {
  id: string
  title: string
  description: string
  assignees: string[]
  startDate: string
  dueDate: string
  priority: Priority
  status: TaskStatus
  category: string
  taskType: TaskType
  client: string // for tickets: client name
  activities: TaskActivity[]
  subtasks: SubTask[]
  attachments: TaskAttachment[]
  objectiveIds: string[]
}

export const OBJECTIVE_CATEGORIES = [
  'Global',
  'Marketing',
  'Produit',
  'Commercial',
  'Tech',
  'Ops',
] as const

export type ObjectiveCategory = typeof OBJECTIVE_CATEGORIES[number]

export interface Objective {
  id: string
  title: string
  subtitle: string
  type: 'annuel' | 'mensuel' | 'hebdo'
  category: ObjectiveCategory
  period: string
  done: boolean
}

export interface TeamMember {
  name: string
  email: string
  color: string
  role: 'general' | 'dev'
}
