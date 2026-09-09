export type Priority = 'haute' | 'moyenne' | 'basse'
export type TaskStatus = 'a_faire' | 'en_cours' | 'termine' | 'bloque'

export interface TaskActivity {
  id: string
  type: 'note' | 'document' | 'mention' | 'status_change'
  content: string
  author: string
  createdAt: string // ISO datetime
}

export interface Task {
  id: string
  title: string
  description: string
  assignees: string[] // multiple assignees
  startDate: string
  dueDate: string
  priority: Priority
  status: TaskStatus
  category: string
  activities: TaskActivity[]
}

export interface Objective {
  id: string
  title: string
  type: 'mensuel' | 'hebdo'
  period: string
  done: boolean
}

export interface TeamMember {
  name: string
  color: string
}
