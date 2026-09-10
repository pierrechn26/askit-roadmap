import type { Task, Objective, TeamMember } from '@/types'

export const DEFAULT_MEMBERS: TeamMember[] = [
  { name: 'Pierre', email: '', color: '#f8571f', role: 'general' },
  { name: 'Bastien', email: '', color: '#a7abdd', role: 'dev' },
  { name: 'Membre 3', email: '', color: '#accce9', role: 'general' },
  { name: 'Membre 4', email: '', color: '#241f20', role: 'general' },
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
    description: '',
    assignees: ['Pierre'],
    startDate: '2026-09-09',
    dueDate: '2026-09-15',
    priority: 'haute',
    status: 'en_cours',
    category: 'Ops',
    activities: [],
    subtasks: [],
    attachments: [],
  },
  {
    id: '2',
    title: 'Prospection 20 leads / semaine',
    description: '',
    assignees: ['Pierre'],
    startDate: '2026-09-09',
    dueDate: '2026-12-31',
    priority: 'haute',
    status: 'en_cours',
    category: 'Commercial',
    activities: [],
    subtasks: [],
    attachments: [],
  },
]

export const DEFAULT_OBJECTIVES: Objective[] = [
  { id: '0', title: '100 clients actifs', subtitle: 'Objectif principal de l\'année 2026', type: 'annuel', category: 'Global', period: '2026', done: false },
  { id: '1', title: 'Atteindre 15 clients actifs', subtitle: 'Focus onboarding + prospection active', type: 'mensuel', category: 'Commercial', period: '2026-09', done: false },
  { id: '2', title: 'Atteindre 25 clients actifs', subtitle: 'Scale des canaux d\'acquisition', type: 'mensuel', category: 'Marketing', period: '2026-10', done: false },
  { id: '3', title: 'Atteindre 40 clients actifs', subtitle: 'Partenariats et referral actifs', type: 'mensuel', category: 'Commercial', period: '2026-11', done: false },
  { id: '4', title: 'Atteindre 100 clients actifs', subtitle: 'Objectif annuel final', type: 'mensuel', category: 'Global', period: '2026-12', done: false },
]
