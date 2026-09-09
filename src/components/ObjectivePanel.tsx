import { useState } from 'react'
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

  // Milestones for the progress bar
  const milestones = [
    { value: 25, label: '25' },
    { value: 50, label: '50' },
    { value: 75, label: '75' },
  ]

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
      {/* Hero Progress Card */}
      <Card className="p-8 relative overflow-hidden border-0 shadow-[0_10px_50px_-12px_rgba(248,87,31,0.2)]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#f8571f]/5 via-transparent to-[#a7abdd]/8" />
        <div className="relative">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-[#241f20] flex items-center justify-center shadow-lg">
              <Trophy className="h-7 w-7 text-[#f8571f]" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-[#241f20] tracking-tight">Objectif 2026</h2>
              <p className="text-[#6c6560] text-sm">100 clients actifs d'ici fin décembre</p>
            </div>
          </div>

          {/* Big number + progress */}
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div className="flex items-baseline gap-2">
                {editingCount ? (
                  <Input
                    type="number"
                    className="w-24 h-12 text-2xl font-bold rounded-xl"
                    value={clientCount}
                    onChange={(e) => onClientCountChange(parseInt(e.target.value) || 0)}
                    onBlur={() => setEditingCount(false)}
                    onKeyDown={(e) => e.key === 'Enter' && setEditingCount(false)}
                    autoFocus
                  />
                ) : (
                  <span
                    className="text-6xl font-bold text-[#f8571f] cursor-pointer hover:opacity-80 transition-opacity leading-none"
                    onClick={() => setEditingCount(true)}
                  >
                    {clientCount}
                  </span>
                )}
                <span className="text-xl text-[#a39c95] font-light">/ {target} clients</span>
              </div>
              <div className="text-right">
                <span className="text-3xl font-bold text-[#241f20]">{pct}%</span>
                <p className="text-xs text-[#a39c95]">complété</p>
              </div>
            </div>

            {/* Enhanced progress bar */}
            <div className="relative pt-1">
              <div className="h-6 bg-[#f5f5f7] rounded-full overflow-hidden relative shadow-inner">
                {/* Filled portion */}
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out relative"
                  style={{
                    width: `${Math.max(pct, 2)}%`,
                    background: 'linear-gradient(115deg, #f8571f 0%, #ff7b4f 40%, #accce9 80%, #a7abdd 100%)',
                  }}
                >
                  {/* Shine effect */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/25 to-transparent" />
                </div>

                {/* Milestone markers */}
                {milestones.map((m) => (
                  <div
                    key={m.value}
                    className="absolute top-0 bottom-0 flex items-center"
                    style={{ left: `${m.value}%` }}
                  >
                    <div className={`w-0.5 h-full ${pct >= m.value ? 'bg-white/40' : 'bg-[#241f20]/10'}`} />
                  </div>
                ))}
              </div>

              {/* Labels under the bar */}
              <div className="relative mt-1.5 flex justify-between text-[10px] text-[#a39c95] px-0.5">
                <span>0</span>
                {milestones.map((m) => (
                  <span
                    key={m.value}
                    className={`${pct >= m.value ? 'text-[#f8571f] font-medium' : ''}`}
                    style={{ position: 'absolute', left: `${m.value}%`, transform: 'translateX(-50%)' }}
                  >
                    {m.label}
                  </span>
                ))}
                <span>100</span>
              </div>
            </div>

            {/* Monthly sub-targets as mini cards */}
            <div className="grid grid-cols-4 gap-2 mt-2">
              {monthly.map((obj) => {
                const month = MONTHS[parseInt(obj.period.split('-')[1]) - 1]?.slice(0, 3)
                return (
                  <div
                    key={obj.id}
                    className={`text-center py-2 px-1 rounded-xl text-xs transition-all ${
                      obj.done
                        ? 'bg-[#f8571f]/10 text-[#f8571f] font-semibold'
                        : 'bg-[#f5f5f7] text-[#6c6560]'
                    }`}
                  >
                    <p className="font-medium">{month}</p>
                    <p className="text-[10px] mt-0.5 opacity-70">{obj.title.replace('Atteindre ', '')}</p>
                  </div>
                )
              })}
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
