import type { Task, Objective, TeamMember } from '@/types'

export const DEFAULT_MEMBERS: TeamMember[] = [
  { name: 'Pierre', color: '#f8571f' },
  { name: 'Membre 2', color: '#a7abdd' },
  { name: 'Membre 3', color: '#accce9' },
  { name: 'Membre 4', color: '#241f20' },
]

export const DEFAULT_CATEGORIES = [
  'Produit',
  'Commercial',
  'Marketing',
  'Tech',
  'Ops',
  'Support',
]

export const DEFAULT_TASKS: Task[] = [
  {
    id: '1',
    title: 'Finaliser onboarding Dermeden',
    assignee: 'Pierre',
    startDate: '2026-09-09',
    dueDate: '2026-09-15',
    priority: 'haute',
    status: 'en_cours',
    category: 'Ops',
  },
  {
    id: '2',
    title: 'Prospection 20 leads / semaine',
    assignee: 'Pierre',
    startDate: '2026-09-09',
    dueDate: '2026-12-31',
    priority: 'haute',
    status: 'en_cours',
    category: 'Commercial',
  },
]

export const DEFAULT_OBJECTIVES: Objective[] = [
  {
    id: '1',
    title: 'Atteindre 15 clients actifs',
    type: 'mensuel',
    period: '2026-09',
    done: false,
  },
  {
    id: '2',
    title: 'Atteindre 25 clients actifs',
    type: 'mensuel',
    period: '2026-10',
    done: false,
  },
  {
    id: '3',
    title: 'Atteindre 40 clients actifs',
    type: 'mensuel',
    period: '2026-11',
    done: false,
  },
  {
    id: '4',
    title: 'Atteindre 100 clients actifs',
    type: 'mensuel',
    period: '2026-12',
    done: false,
  },
]
