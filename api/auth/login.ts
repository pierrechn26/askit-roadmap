import type { VercelRequest, VercelResponse } from '@vercel/node'
import { neon } from '@neondatabase/serverless'
import { createHash, randomBytes } from 'crypto'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis' })

  const sql = neon(process.env.DATABASE_URL!)
  const hash = createHash('sha256').update(password).digest('hex')

  const users = await sql`SELECT id, name, email, role FROM users WHERE email = ${email.toLowerCase()} AND password_hash = ${hash}`

  if (users.length === 0) {
    return res.status(401).json({ error: 'Email ou mot de passe incorrect' })
  }

  const user = users[0]
  // Simple token: base64 of user data + random bytes
  const tokenData = JSON.stringify({ id: user.id, name: user.name, email: user.email, role: user.role, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 })
  const token = Buffer.from(tokenData).toString('base64') + '.' + randomBytes(16).toString('hex')

  return res.status(200).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } })
}
