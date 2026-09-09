import { useState } from 'react'
import { Progress } from '@/components/ui/progress'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { CheckCircle2, Circle, Plus, Target, Trophy } from 'lucide-react'
import type { Objective } from '@/types'

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

function formatPeriod(period: string, type: 'mensuel' | 'hebdo') {
  if (type === 'mensuel') {
    const [y, m] = period.split('-')
    return `${MONTHS[parseInt(m) - 1]} ${y}`
  }
  return `Semaine ${period.split('W')[1]} (${period.split('-')[0]})`
}

interface Props {
  clientCount: number
  onClientCountChange: (n: number) => void
  objectives: Objective[]
  onObjectivesChange: (o: Objective[]) => void
}

export function ObjectivePanel({ clientCount, onClientCountChange, objectives, onObjectivesChange }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState<'mensuel' | 'hebdo'>('mensuel')
  const [newPeriod, setNewPeriod] = useState('2026-10')
  const [editingCount, setEditingCount] = useState(false)

  const target = 100
  const pct = Math.round((clientCount / target) * 100)

  function addObjective() {
    if (!newTitle.trim()) return
    onObjectivesChange([
      ...objectives,
      {
        id: Date.now().toString(),
        title: newTitle.trim(),
        type: newType,
        period: newPeriod,
        done: false,
      },
    ])
    setNewTitle('')
    setDialogOpen(false)
  }

  function toggleDone(id: string) {
    onObjectivesChange(
      objectives.map((o) => (o.id === id ? { ...o, done: !o.done } : o)),
    )
  }

  function removeObjective(id: string) {
    onObjectivesChange(objectives.filter((o) => o.id !== id))
  }

  const monthly = objectives.filter((o) => o.type === 'mensuel').sort((a, b) => a.period.localeCompare(b.period))
  const weekly = objectives.filter((o) => o.type === 'hebdo').sort((a, b) => a.period.localeCompare(b.period))

  return (
    <div className="space-y-6">
      {/* Hero Card — Brand gradient */}
      <Card className="p-6 relative overflow-hidden border-0 shadow-[0_10px_40px_-12px_rgba(248,87,31,0.15)]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#f8571f]/8 via-[#accce9]/8 to-[#a7abdd]/10" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-[#241f20] flex items-center justify-center">
              <Trophy className="h-6 w-6 text-[#f8571f]" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-[#241f20] tracking-tight">Objectif 2026</h2>
              <p className="text-[#6c6560] text-sm">100 clients actifs d'ici fin décembre</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <div className="flex items-baseline gap-2">
                {editingCount ? (
                  <Input
                    type="number"
                    className="w-20 h-9 text-lg font-bold"
                    value={clientCount}
                    onChange={(e) => onClientCountChange(parseInt(e.target.value) || 0)}
                    onBlur={() => setEditingCount(false)}
                    onKeyDown={(e) => e.key === 'Enter' && setEditingCount(false)}
                    autoFocus
                  />
                ) : (
                  <span
                    className="text-5xl font-bold text-[#f8571f] cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setEditingCount(true)}
                  >
                    {clientCount}
                  </span>
                )}
                <span className="text-lg text-[#a39c95]">/ {target} clients</span>
              </div>
              <span className="text-xl font-semibold text-[#f8571f]">{pct}%</span>
            </div>
            <div className="relative">
              <Progress value={pct} className="h-3 bg-[#f5f5f7] [&>div]:bg-gradient-to-r [&>div]:from-[#f8571f] [&>div]:to-[#a7abdd] [&>div]:rounded-full rounded-full" />
            </div>
          </div>
        </div>
      </Card>

      {/* Objectifs mensuels */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-[#241f20]">
            <Target className="h-5 w-5 text-[#f8571f]" /> Objectifs mensuels
          </h3>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-full bg-[#241f20] hover:bg-[#333] text-white">
                <Plus className="h-4 w-4 mr-1" /> Ajouter
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-[#241f20]">Nouvel objectif</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <Input
                  placeholder="Titre de l'objectif"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="rounded-xl"
                />
                <Select value={newType} onValueChange={(v) => setNewType(v as 'mensuel' | 'hebdo')}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensuel">Mensuel</SelectItem>
                    <SelectItem value="hebdo">Hebdomadaire</SelectItem>
                  </SelectContent>
                </Select>
                {newType === 'mensuel' ? (
                  <Select value={newPeriod} onValueChange={setNewPeriod}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 4 }, (_, i) => {
                        const m = 9 + i
                        const val = `2026-${m.toString().padStart(2, '0')}`
                        return <SelectItem key={val} value={val}>{MONTHS[m - 1]} 2026</SelectItem>
                      })}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    placeholder="ex: 2026-W38"
                    value={newPeriod}
                    onChange={(e) => setNewPeriod(e.target.value)}
                    className="rounded-xl"
                  />
                )}
                <Button onClick={addObjective} className="w-full rounded-full bg-[#f8571f] hover:bg-[#e04d1a] text-white">
                  Ajouter
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-2">
          {monthly.map((obj) => (
            <Card
              key={obj.id}
              className={`p-3.5 flex items-center gap-3 rounded-2xl border-0 shadow-sm transition-all hover:shadow-md ${obj.done ? 'opacity-50' : ''}`}
            >
              <button onClick={() => toggleDone(obj.id)} className="shrink-0">
                {obj.done ? (
                  <CheckCircle2 className="h-5 w-5 text-[#f8571f]" />
                ) : (
                  <Circle className="h-5 w-5 text-[#a39c95]" />
                )}
              </button>
              <span className={`flex-1 font-medium ${obj.done ? 'line-through text-[#a39c95]' : 'text-[#241f20]'}`}>
                {obj.title}
              </span>
              <Badge className="bg-[#f5f5f7] text-[#6c6560] border-0 rounded-full text-xs font-medium">
                {formatPeriod(obj.period, obj.type)}
              </Badge>
              <button onClick={() => removeObjective(obj.id)} className="text-[#a39c95] hover:text-[#ef4444] text-sm transition-colors">
                &times;
              </button>
            </Card>
          ))}
        </div>
      </div>

      {/* Objectifs hebdo */}
      {weekly.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 text-[#241f20]">Objectifs hebdomadaires</h3>
          <div className="grid gap-2">
            {weekly.map((obj) => (
              <Card
                key={obj.id}
                className={`p-3.5 flex items-center gap-3 rounded-2xl border-0 shadow-sm ${obj.done ? 'opacity-50' : ''}`}
              >
                <button onClick={() => toggleDone(obj.id)} className="shrink-0">
                  {obj.done ? (
                    <CheckCircle2 className="h-5 w-5 text-[#f8571f]" />
                  ) : (
                    <Circle className="h-5 w-5 text-[#a39c95]" />
                  )}
                </button>
                <span className={`flex-1 font-medium ${obj.done ? 'line-through text-[#a39c95]' : 'text-[#241f20]'}`}>
                  {obj.title}
                </span>
                <Badge variant="outline" className="rounded-full text-xs">{formatPeriod(obj.period, obj.type)}</Badge>
                <button onClick={() => removeObjective(obj.id)} className="text-[#a39c95] hover:text-[#ef4444] text-sm transition-colors">
                  &times;
                </button>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
