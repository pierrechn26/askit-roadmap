export const CRM_STAGES = [
  'prospect_froid',
  'prospect_chaud',
  'r1',
  'followup',
  'fantome_valide',
  'deal_perdu',
  'deal_gagne',
] as const

export type CrmStage = typeof CRM_STAGES[number]

export const CRM_STAGE_LABELS: Record<CrmStage, string> = {
  prospect_froid: 'Prospect froid',
  prospect_chaud: 'Prospect chaud',
  r1: 'R1',
  followup: 'Follow-up en cours',
  fantome_valide: 'Fantôme validé en attente',
  deal_perdu: 'Deal perdu',
  deal_gagne: 'Deal gagné',
}

export const CRM_STAGE_COLORS: Record<CrmStage, string> = {
  prospect_froid: '#a39c95',
  prospect_chaud: '#accce9',
  r1: '#a7abdd',
  followup: '#f8571f',
  fantome_valide: '#241f20',
  deal_perdu: '#ef4444',
  deal_gagne: '#10b981',
}

export interface CrmNote {
  id: string
  content: string
  author: string
  createdAt: string
}

export interface CrmDeal {
  id: string
  company: string
  contact: string
  amount: number // monthly amount €
  stage: CrmStage
  notes: CrmNote[]
  source: string
  createdAt: string
  closedAt: string // date when moved to won/lost
  nextAction: string
  nextActionDate: string
}
