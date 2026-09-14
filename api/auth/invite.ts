import type { VercelRequest, VercelResponse } from '@vercel/node'
import { neon } from '@neondatabase/serverless'
import { createHash, randomBytes } from 'crypto'
import { Resend } from 'resend'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, name, invitedBy } = req.body
  if (!email || !name) return res.status(400).json({ error: 'Email et nom requis' })

  const sql = neon(process.env.DATABASE_URL!)

  // Check if user already exists
  const existing = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase()}`
  if (existing.length > 0) {
    return res.status(400).json({ error: 'Cet utilisateur existe déjà' })
  }

  // Generate temporary password
  const tempPassword = randomBytes(4).toString('hex') // 8 chars
  const hash = createHash('sha256').update(tempPassword).digest('hex')

  await sql`INSERT INTO users (name, email, password_hash, role, invited_by) VALUES (${name}, ${email.toLowerCase()}, ${hash}, 'member', ${invitedBy || ''})`

  // Send invite email
  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: 'AskIt Roadmap <notifications@app.ask-it.ai>',
    to: email,
    subject: 'Invitation — AskIt Roadmap',
    html: `
      <div style="font-family: 'DM Sans', system-ui, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px;">
        <div style="border-bottom: 2px solid; border-image: linear-gradient(to right, #f8571f, #accce9, #a7abdd) 1; padding-bottom: 16px; margin-bottom: 24px;">
          <span style="font-size: 18px; font-weight: 700; color: #241f20;">ask-it</span><span style="font-size: 18px; font-weight: 300; color: #a39c95;">.ai</span>
        </div>
        <p style="color: #241f20; font-size: 15px;">Bonjour <strong>${name}</strong>,</p>
        <p style="color: #6c6560; font-size: 14px;">Vous avez été invité(e) à rejoindre <strong>AskIt Roadmap</strong>.</p>
        <div style="background: #f5f5f7; border-radius: 12px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0 0 8px; font-size: 13px; color: #6c6560;">Vos identifiants de connexion :</p>
          <p style="margin: 0; font-size: 14px; color: #241f20;">
            <strong>Email :</strong> ${email}<br/>
            <strong>Mot de passe :</strong> ${tempPassword}
          </p>
        </div>
        <p style="color: #6c6560; font-size: 13px;">Pensez à changer votre mot de passe après votre première connexion.</p>
        <div style="margin-top: 24px;">
          <a href="https://askit-roadmap.vercel.app" style="display: inline-block; padding: 10px 24px; background: #241f20; color: white; text-decoration: none; border-radius: 100px; font-size: 14px; font-weight: 500;">
            Se connecter
          </a>
        </div>
        <p style="margin-top: 24px; font-size: 12px; color: #a39c95;">— AskIt Roadmap</p>
      </div>
    `,
  })

  return res.status(200).json({ success: true })
}
