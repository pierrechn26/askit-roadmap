export type Priority = 'haute' | 'moyenne' | 'basse'
export type TaskStatus = 'a_faire' | 'en_cours' | 'termine' | 'bloque'

export interface Task {
  id: string
  title: string
  assignee: string
  startDate: string // ISO date
  dueDate: string // ISO date
  priority: Priority
  status: TaskStatus
  category: string
}

export interface Objective {
  id: string
  title: string
  type: 'mensuel' | 'hebdo'
  period: string // e.g. "2026-09" or "2026-W37"
  done: boolean
}

export interface TeamMember {
  name: string
  color: string
}
