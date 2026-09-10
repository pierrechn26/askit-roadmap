import type { TeamMember, Task } from '@/types'

export function notifyByEmail(member: TeamMember, subject: string, body: string) {
  if (!member.email) return
  const mailto = `mailto:${encodeURIComponent(member.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  window.open(mailto, '_blank')
}

export function notifyAssignment(member: TeamMember, task: Task) {
  notifyByEmail(
    member,
    `[AskIt] Tâche assignée : ${task.title}`,
    `Bonjour ${member.name},\n\nLa tâche "${task.title}" vous a été assignée.\n\nÉchéance : ${task.dueDate}\nPriorité : ${task.priority}\n\nCordialement,\nAskIt Roadmap`,
  )
}

export function notifyMention(member: TeamMember, task: Task, message: string) {
  notifyByEmail(
    member,
    `[AskIt] Vous avez été mentionné(e) : ${task.title}`,
    `Bonjour ${member.name},\n\nVous avez été mentionné(e) dans la tâche "${task.title}" :\n\n"${message}"\n\nCordialement,\nAskIt Roadmap`,
  )
}
