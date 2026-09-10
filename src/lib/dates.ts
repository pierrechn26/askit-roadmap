import { differenceInDays, format, parseISO } from 'date-fns'

export function formatDateFR(dateStr: string): string {
  if (!dateStr) return ''
  try {
    return format(parseISO(dateStr), 'dd/MM/yyyy')
  } catch {
    return dateStr
  }
}

export type DateUrgency = 'overdue' | 'urgent' | 'normal'

export function getDateUrgency(dateStr: string, done?: boolean): DateUrgency {
  if (!dateStr || done) return 'normal'
  const diff = differenceInDays(parseISO(dateStr), new Date())
  if (diff < 0) return 'overdue'
  if (diff <= 3) return 'urgent'
  return 'normal'
}

export const DATE_BADGE_STYLES: Record<DateUrgency, string> = {
  overdue: 'bg-red-50 text-red-600 border border-red-300 font-semibold',
  urgent: 'bg-[#f8571f]/10 text-[#f8571f] border border-[#f8571f]/30 font-semibold',
  normal: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
}

export const CARD_BORDER_STYLES: Record<DateUrgency, string> = {
  overdue: 'ring-2 ring-red-400/60',
  urgent: 'ring-2 ring-[#f8571f]/40',
  normal: '',
}
