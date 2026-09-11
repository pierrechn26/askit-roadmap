import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { to, subject, body, html } = req.body

  if (!to || !subject) {
    return res.status(400).json({ error: 'Missing fields: to, subject' })
  }

  try {
    const data = await resend.emails.send({
      from: 'AskIt Roadmap <notifications@app.ask-it.ai>',
      to: Array.isArray(to) ? to : [to],
      subject,
      ...(html ? { html } : { text: body || '' }),
    })

    return res.status(200).json({ success: true, data })
  } catch (error: any) {
    console.error('Resend error:', error)
    return res.status(500).json({ error: error.message || 'Failed to send email' })
  }
}
