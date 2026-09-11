import type { TeamMember, Task } from '@/types'

const APP_URL = 'https://askit-roadmap.vercel.app'

function emailTemplate(content: string, taskTitle: string, linkUrl: string) {
  return `
    <div style="font-family: 'DM Sans', system-ui, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
      <div style="border-bottom: 2px solid; border-image: linear-gradient(to right, #f8571f, #accce9, #a7abdd) 1; padding-bottom: 16px; margin-bottom: 24px;">
        <span style="font-size: 18px; font-weight: 700; color: #241f20;">ask-it</span><span style="font-size: 18px; font-weight: 300; color: #a39c95;">.ai</span>
      </div>
      ${content}
      <div style="margin-top: 24px;">
        <a href="${linkUrl}" style="display: inline-block; padding: 10px 24px; background: #241f20; color: white; text-decoration: none; border-radius: 100px; font-size: 14px; font-weight: 500;">
          Voir la tâche : ${taskTitle}
        </a>
      </div>
      <p style="margin-top: 24px; font-size: 12px; color: #a39c95;">
        — AskIt Roadmap
      </p>
    </div>
  `
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!to) return
  try {
    const res = await fetch('/api/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, html }),
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
  const html = emailTemplate(
    `<p style="color: #241f20; font-size: 15px;">Bonjour <strong>${member.name}</strong>,</p>
     <p style="color: #6c6560; font-size: 14px;">La tâche suivante vous a été assignée :</p>
     <div style="background: #f5f5f7; border-radius: 12px; padding: 16px; margin: 16px 0;">
       <p style="margin: 0 0 8px; font-size: 16px; font-weight: 600; color: #241f20;">${task.title}</p>
       <p style="margin: 0; font-size: 13px; color: #6c6560;">
         Échéance : <strong>${task.dueDate}</strong><br/>
         Priorité : <strong>${task.priority}</strong><br/>
         Catégorie : <strong>${task.category}</strong>
       </p>
     </div>`,
    task.title,
    `${APP_URL}/?tab=tasks&task=${task.id}`,
  )
  sendEmail(member.email, `[AskIt] Tâche assignée : ${task.title}`, html)
}

export function notifyMention(member: TeamMember, task: Task, message: string) {
  if (!member.email) return
  const html = emailTemplate(
    `<p style="color: #241f20; font-size: 15px;">Bonjour <strong>${member.name}</strong>,</p>
     <p style="color: #6c6560; font-size: 14px;">Vous avez été mentionné(e) dans la tâche <strong>"${task.title}"</strong> :</p>
     <div style="background: #fff5f2; border-left: 3px solid #f8571f; border-radius: 0 12px 12px 0; padding: 12px 16px; margin: 16px 0;">
       <p style="margin: 0; font-size: 14px; color: #241f20; white-space: pre-wrap;">${message}</p>
     </div>`,
    task.title,
    `${APP_URL}/?tab=tasks&task=${task.id}`,
  )
  sendEmail(member.email, `[AskIt] Vous avez été mentionné(e) : ${task.title}`, html)
}
