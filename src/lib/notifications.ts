import type { TeamMember, Task } from '@/types'

async function sendEmail(to: string, subject: string, body: string) {
  if (!to) return
  try {
    const res = await fetch('/api/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, body }),
    })
    if (!res.ok) {
      const err = await res.json()
      console.warn('Notification non envoyée:', err)
    }
  } catch (e) {
    console.warn('Erreur envoi notification:', e)
  }
}

export function notifyAssignment(member: TeamMember, task: Task) {
  if (!member.email) return
  sendEmail(
    member.email,
    `[AskIt] Tâche assignée : ${task.title}`,
    `Bonjour ${member.name},\n\nLa tâche "${task.title}" vous a été assignée.\n\nÉchéance : ${task.dueDate}\nPriorité : ${task.priority}\nCatégorie : ${task.category}\n\nCordialement,\nAskIt Roadmap`,
  )
}

export function notifyMention(member: TeamMember, task: Task, message: string) {
  if (!member.email) return
  sendEmail(
    member.email,
    `[AskIt] Vous avez été mentionné(e) : ${task.title}`,
    `Bonjour ${member.name},\n\nVous avez été mentionné(e) dans la tâche "${task.title}" :\n\n"${message}"\n\nCordialement,\nAskIt Roadmap`,
  )
}
