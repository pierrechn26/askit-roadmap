export const CRM_STAGES = [
  'a_contacter',
  'prospect_froid',
  'prospect_chaud',
  'r1',
  'followup',
  'fantome',
  'valide_attente',
  'deal_perdu',
  'deal_gagne',
] as const

export type CrmStage = typeof CRM_STAGES[number]

export const CRM_STAGE_LABELS: Record<CrmStage, string> = {
  a_contacter: 'À contacter',
  prospect_froid: 'Prospect froid (1er contact)',
  prospect_chaud: 'Prospect chaud (échange en cours)',
  r1: 'R1',
  followup: 'Follow-up en cours',
  fantome: 'Fantôme',
  valide_attente: 'Validé en attente',
  deal_perdu: 'Deal perdu',
  deal_gagne: 'Deal gagné',
}

export const CRM_STAGE_COLORS: Record<CrmStage, string> = {
  a_contacter: '#6c6560',
  prospect_froid: '#a39c95',
  prospect_chaud: '#accce9',
  r1: '#a7abdd',
  followup: '#f8571f',
  fantome: '#241f20',
  valide_attente: '#84cc16',
  deal_perdu: '#ef4444',
  deal_gagne: '#10b981',
}

export interface CrmNote {
  id: string
  content: string
  author: string
  createdAt: string
}

export interface CrmContact {
  id: string
  name: string
  email: string
  phone: string
  linkedin: string
}

export interface CrmDeal {
  id: string
  company: string
  website: string
  contacts: CrmContact[]
  amount: number
  stage: CrmStage
  notes: CrmNote[]
  source: string
  createdAt: string
  closedAt: string
  nextAction: string
  nextActionDate: string
}
