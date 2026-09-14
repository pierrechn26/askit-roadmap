import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'

interface Props {
  onLogin: (token: string, user: { id: number; name: string; email: string; role: string }) => void
}

export function LoginPage({ onLogin }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erreur de connexion')
      } else {
        onLogin(data.token, data.user)
      }
    } catch (e: any) {
      console.error('Login error:', e)
      setError('Erreur réseau : ' + (e?.message || 'impossible de contacter le serveur'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#fdfcfc] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-baseline">
            <span className="text-3xl font-bold tracking-tight text-[#241f20]">ask-it</span>
            <span className="text-3xl font-light text-[#241f20]/40">.ai</span>
          </div>
          <p className="text-sm text-[#a39c95] mt-1">Roadmap & gestion d'équipe</p>
        </div>

        <Card className="p-6 rounded-2xl border-0 shadow-[0_10px_50px_-12px_rgba(36,31,32,0.1)]">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[#6c6560] mb-1.5 block">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@ask-it.ai"
                className="rounded-xl"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#6c6560] mb-1.5 block">Mot de passe</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="rounded-xl"
                required
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#241f20] hover:bg-[#333] text-white h-10"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Se connecter'}
            </Button>
          </form>
        </Card>

        {/* Gradient line */}
        <div className="mt-6 h-[2px] bg-gradient-to-r from-[#f8571f] via-[#accce9] to-[#a7abdd] rounded-full" />
      </div>
    </div>
  )
}
