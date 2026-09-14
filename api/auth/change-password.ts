import type { VercelRequest, VercelResponse } from '@vercel/node'
import { neon } from '@neondatabase/serverless'
import { createHash } from 'crypto'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, currentPassword, newPassword } = req.body
  if (!email || !currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Champs requis manquants' })
  }

  const sql = neon(process.env.DATABASE_URL!)
  const currentHash = createHash('sha256').update(currentPassword).digest('hex')

  const users = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase()} AND password_hash = ${currentHash}`
  if (users.length === 0) {
    return res.status(401).json({ error: 'Mot de passe actuel incorrect' })
  }

  const newHash = createHash('sha256').update(newPassword).digest('hex')
  await sql`UPDATE users SET password_hash = ${newHash} WHERE email = ${email.toLowerCase()}`

  return res.status(200).json({ success: true })
}
