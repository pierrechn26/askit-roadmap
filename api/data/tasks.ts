import type { VercelRequest, VercelResponse } from '@vercel/node'
import { neon } from '@neondatabase/serverless'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const sql = neon(process.env.DATABASE_URL!)

  try {
    if (req.method === 'GET') {
      const rows = await sql`SELECT id, data FROM app_tasks ORDER BY updated_at`
      const tasks = rows.map((r) => ({ ...r.data, id: r.id }))
      return res.status(200).json({ tasks })
    }

    if (req.method === 'POST') {
      const task = req.body
      if (!task || !task.id) return res.status(400).json({ error: 'Task with id required' })
      await sql`INSERT INTO app_tasks (id, data, updated_at) VALUES (${task.id}, ${JSON.stringify(task)}, NOW()) ON CONFLICT (id) DO UPDATE SET data = ${JSON.stringify(task)}, updated_at = NOW()`
      return res.status(200).json({ success: true })
    }

    if (req.method === 'PUT') {
      // Bulk replace all tasks
      if (Array.isArray(req.body)) {
        await sql`DELETE FROM app_tasks`
        for (const task of req.body) {
          await sql`INSERT INTO app_tasks (id, data, updated_at) VALUES (${task.id}, ${JSON.stringify(task)}, NOW())`
        }
        return res.status(200).json({ success: true })
      }
      // Single task update
      const task = req.body
      if (!task || !task.id) return res.status(400).json({ error: 'Task with id required' })
      await sql`UPDATE app_tasks SET data = ${JSON.stringify(task)}, updated_at = NOW() WHERE id = ${task.id}`
      return res.status(200).json({ success: true })
    }

    if (req.method === 'DELETE') {
      const { id } = req.body || req.query
      if (!id) return res.status(400).json({ error: 'id required' })
      await sql`DELETE FROM app_tasks WHERE id = ${id as string}`
      return res.status(200).json({ success: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('tasks API error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
