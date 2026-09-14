import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant' })
  }

  const token = authHeader.slice(7)
  try {
    const base64Part = token.split('.')[0]
    const data = JSON.parse(Buffer.from(base64Part, 'base64').toString())

    if (data.exp < Date.now()) {
      return res.status(401).json({ error: 'Token expiré' })
    }

    return res.status(200).json({ user: { id: data.id, name: data.name, email: data.email, role: data.role } })
  } catch {
    return res.status(401).json({ error: 'Token invalide' })
  }
}
