import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { CheckCircle2, Circle, Plus, Target, Trophy, Star, CalendarDays, CalendarClock } from 'lucide-react'
import type { Objective } from '@/types'

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

interface Props {
  clientCount: number
  onClientCountChange: (n: number) => void
  objectives: Objective[]
  onObjectivesChange: (o: Objective[]) => void
}

export function ObjectivePanel({ clientCount, onClientCountChange, objectives, onObjectivesChange }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newSubtitle, setNewSubtitle] = useState('')
  const [newType, setNewType] = useState<'annuel' | 'mensuel' | 'hebdo'>('mensuel')
  const [newPeriod, setNewPeriod] = useState('2026-10')
  const [editingCount, setEditingCount] = useState(false)

  const target = 100
  const pct = Math.round((clientCount / target) * 100)
  const milestones = [{ value: 25, label: '25' }, { value: 50, label: '50' }, { value: 75, label: '75' }]

  function addObjective() {
    if (!newTitle.trim()) return
    onObjectivesChange([
      ...objectives,
      {
        id: Date.now().toString(),
        title: newTitle.trim(),
        subtitle: newSubtitle.trim(),
        type: newType,
        period: newPeriod,
        done: false,
      },
    ])
    setNewTitle('')
    setNewSubtitle('')
    setDialogOpen(false)
  }

  function toggleDone(id: string) {
    onObjectivesChange(objectives.map((o) => (o.id === id ? { ...o, done: !o.done } : o)))
  }

  function removeObjective(id: string) {
    onObjectivesChange(objectives.filter((o) => o.id !== id))
  }

  // Default period when switching type
  function handleTypeChange(type: 'annuel' | 'mensuel' | 'hebdo') {
    setNewType(type)
    if (type === 'annuel') setNewPeriod('2026')
    else if (type === 'mensuel') setNewPeriod('2026-10')
    else setNewPeriod('2026-W38')
  }

  const annual = objectives.filter((o) => o.type === 'annuel').sort((a, b) => a.period.localeCompare(b.period))
  const monthly = objectives.filter((o) => o.type === 'mensuel').sort((a, b) => a.period.localeCompare(b.period))
  const weekly = objectives.filter((o) => o.type === 'hebdo').sort((a, b) => a.period.localeCompare(b.period))

  return (
    <div className="space-y-8">
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
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div className="flex items-baseline gap-2">
                {editingCount ? (
                  <Input type="number" className="w-24 h-12 text-2xl font-bold rounded-xl" value={clientCount}
                    onChange={(e) => onClientCountChange(parseInt(e.target.value) || 0)}
                    onBlur={() => setEditingCount(false)}
                    onKeyDown={(e) => e.key === 'Enter' && setEditingCount(false)}
                    autoFocus />
                ) : (
                  <span className="text-6xl font-bold text-[#f8571f] cursor-pointer hover:opacity-80 transition-opacity leading-none"
                    onClick={() => setEditingCount(true)}>{clientCount}</span>
                )}
                <span className="text-xl text-[#a39c95] font-light">/ {target} clients</span>
              </div>
              <div className="text-right">
                <span className="text-3xl font-bold text-[#241f20]">{pct}%</span>
                <p className="text-xs text-[#a39c95]">complété</p>
              </div>
            </div>
            <div className="relative pt-1">
              <div className="h-6 bg-[#f5f5f7] rounded-full overflow-hidden relative shadow-inner">
                <div className="h-full rounded-full transition-all duration-700 ease-out relative"
                  style={{ width: `${Math.max(pct, 2)}%`, background: 'linear-gradient(115deg, #f8571f 0%, #ff7b4f 40%, #accce9 80%, #a7abdd 100%)' }}>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/25 to-transparent" />
                </div>
                {milestones.map((m) => (
                  <div key={m.value} className="absolute top-0 bottom-0 flex items-center" style={{ left: `${m.value}%` }}>
                    <div className={`w-0.5 h-full ${pct >= m.value ? 'bg-white/40' : 'bg-[#241f20]/10'}`} />
                  </div>
                ))}
              </div>
              <div className="relative mt-1.5 flex justify-between text-[10px] text-[#a39c95] px-0.5">
                <span>0</span>
                {milestones.map((m) => (
                  <span key={m.value} className={pct >= m.value ? 'text-[#f8571f] font-medium' : ''}
                    style={{ position: 'absolute', left: `${m.value}%`, transform: 'translateX(-50%)' }}>{m.label}</span>
                ))}
                <span>100</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Add objective button — global */}
      <div className="flex justify-end">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-full bg-[#241f20] hover:bg-[#333] text-white">
              <Plus className="h-4 w-4 mr-1" /> Nouvel objectif
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-[#241f20]">Nouvel objectif</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <Input placeholder="Titre de l'objectif" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="rounded-xl" />
              <Input placeholder="Sous-titre / description courte" value={newSubtitle} onChange={(e) => setNewSubtitle(e.target.value)} className="rounded-xl" />

              {/* Type selector pills */}
              <div>
                <label className="text-xs text-[#6c6560] mb-2 block">Type d'objectif</label>
                <div className="flex gap-2">
                  {([
                    { value: 'annuel' as const, label: 'Annuel', icon: <Star className="h-3.5 w-3.5" /> },
                    { value: 'mensuel' as const, label: 'Mensuel', icon: <CalendarDays className="h-3.5 w-3.5" /> },
                    { value: 'hebdo' as const, label: 'Hebdomadaire', icon: <CalendarClock className="h-3.5 w-3.5" /> },
                  ]).map((t) => (
                    <button
                      key={t.value}
                      onClick={() => handleTypeChange(t.value)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm transition-all ${
                        newType === t.value
                          ? 'bg-[#241f20] text-white'
                          : 'bg-[#f5f5f7] text-[#6c6560] hover:bg-[#eee]'
                      }`}
                    >
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Period selector */}
              {newType === 'annuel' ? (
                <Select value={newPeriod} onValueChange={setNewPeriod}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2026">2026</SelectItem>
                    <SelectItem value="2027">2027</SelectItem>
                  </SelectContent>
                </Select>
              ) : newType === 'mensuel' ? (
                <Select value={newPeriod} onValueChange={setNewPeriod}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => {
                      const val = `2026-${(i + 1).toString().padStart(2, '0')}`
                      return <SelectItem key={val} value={val}>{MONTHS[i]} 2026</SelectItem>
                    })}
                  </SelectContent>
                </Select>
              ) : (
                <Input placeholder="ex: 2026-W38" value={newPeriod} onChange={(e) => setNewPeriod(e.target.value)} className="rounded-xl" />
              )}

              <Button onClick={addObjective} className="w-full rounded-full bg-[#f8571f] hover:bg-[#e04d1a] text-white">
                Ajouter
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Objectifs annuels */}
      {annual.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold flex items-center gap-2 text-[#241f20] mb-4">
            <Star className="h-5 w-5 text-[#f8571f]" /> Objectifs annuels
          </h3>
          <div className="grid gap-3">
            {annual.map((obj) => (
              <Card
                key={obj.id}
                className={`rounded-2xl border-0 overflow-hidden transition-all hover:shadow-md ${obj.done ? 'opacity-50' : 'shadow-[0_4px_20px_-4px_rgba(248,87,31,0.15)]'}`}
              >
                <div className="flex">
                  <div className={`w-24 shrink-0 flex flex-col items-center justify-center py-5 ${
                    obj.done ? 'bg-[#a7abdd]/10' : 'bg-gradient-to-b from-[#f8571f]/10 to-[#a7abdd]/10'
                  }`}>
                    <Star className={`h-5 w-5 mb-1 ${obj.done ? 'text-[#a39c95]' : 'text-[#f8571f]'}`} />
                    <span className={`text-lg font-bold ${obj.done ? 'text-[#a39c95]' : 'text-[#241f20]'}`}>{obj.period}</span>
                  </div>
                  <div className="flex-1 p-5 flex items-center gap-3">
                    <button onClick={() => toggleDone(obj.id)} className="shrink-0">
                      {obj.done
                        ? <CheckCircle2 className="h-7 w-7 text-[#f8571f]" />
                        : <Circle className="h-7 w-7 text-[#a39c95] hover:text-[#f8571f] transition-colors" />
                      }
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-base ${obj.done ? 'line-through text-[#a39c95]' : 'text-[#241f20]'}`}>{obj.title}</p>
                      {obj.subtitle && <p className={`text-sm mt-0.5 ${obj.done ? 'text-[#a39c95]' : 'text-[#6c6560]'}`}>{obj.subtitle}</p>}
                    </div>
                    <Badge className="bg-[#f8571f]/10 text-[#f8571f] border-0 rounded-full text-[10px] shrink-0">Annuel</Badge>
                    <button onClick={() => removeObjective(obj.id)} className="text-[#a39c95] hover:text-[#ef4444] text-lg transition-colors shrink-0">&times;</button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Objectifs mensuels */}
      <section>
        <h3 className="text-lg font-semibold flex items-center gap-2 text-[#241f20] mb-4">
          <CalendarDays className="h-5 w-5 text-[#f8571f]" /> Objectifs mensuels
        </h3>
        {monthly.length === 0 ? (
          <p className="text-sm text-[#a39c95] text-center py-4">Aucun objectif mensuel</p>
        ) : (
          <div className="grid gap-3">
            {monthly.map((obj) => (
              <ObjectiveCard key={obj.id} obj={obj} onToggle={toggleDone} onRemove={removeObjective} />
            ))}
          </div>
        )}
      </section>

      {/* Objectifs hebdo */}
      <section>
        <h3 className="text-lg font-semibold flex items-center gap-2 text-[#241f20] mb-4">
          <CalendarClock className="h-5 w-5 text-[#accce9]" /> Objectifs hebdomadaires
        </h3>
        {weekly.length === 0 ? (
          <p className="text-sm text-[#a39c95] text-center py-4">Aucun objectif hebdomadaire</p>
        ) : (
          <div className="grid gap-3">
            {weekly.map((obj) => (
              <ObjectiveCard key={obj.id} obj={obj} onToggle={toggleDone} onRemove={removeObjective} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function ObjectiveCard({ obj, onToggle, onRemove }: { obj: Objective; onToggle: (id: string) => void; onRemove: (id: string) => void }) {
  const isMonthly = obj.type === 'mensuel'
  let periodLabel = obj.period

  if (isMonthly) {
    const [y, m] = obj.period.split('-')
    const monthName = MONTHS[parseInt(m) - 1]
    periodLabel = `${monthName?.slice(0, 3)}`
    var yearLabel = y
  } else {
    periodLabel = `S${obj.period.split('W')[1]}`
    var yearLabel = obj.period.split('-')[0]
  }

  return (
    <Card className={`rounded-2xl border-0 shadow-sm transition-all hover:shadow-md overflow-hidden ${obj.done ? 'opacity-50' : ''}`}>
      <div className="flex">
        <div className={`w-20 shrink-0 flex flex-col items-center justify-center py-4 ${
          obj.done ? 'bg-[#a7abdd]/10' : isMonthly ? 'bg-gradient-to-b from-[#f8571f]/8 to-[#a7abdd]/8' : 'bg-gradient-to-b from-[#accce9]/15 to-[#a7abdd]/8'
        }`}>
          <span className={`text-lg font-bold ${obj.done ? 'text-[#a39c95]' : 'text-[#241f20]'}`}>{periodLabel}</span>
          <span className="text-[10px] text-[#a39c95]">{yearLabel}</span>
        </div>
        <div className="flex-1 p-4 flex items-center gap-3">
          <button onClick={() => onToggle(obj.id)} className="shrink-0">
            {obj.done
              ? <CheckCircle2 className="h-6 w-6 text-[#f8571f]" />
              : <Circle className="h-6 w-6 text-[#a39c95] hover:text-[#f8571f] transition-colors" />
            }
          </button>
          <div className="flex-1 min-w-0">
            <p className={`font-semibold text-[15px] ${obj.done ? 'line-through text-[#a39c95]' : 'text-[#241f20]'}`}>{obj.title}</p>
            {obj.subtitle && <p className={`text-sm mt-0.5 ${obj.done ? 'text-[#a39c95]' : 'text-[#6c6560]'}`}>{obj.subtitle}</p>}
          </div>
          <Badge className={`rounded-full text-[10px] border-0 shrink-0 ${
            isMonthly ? 'bg-[#f5f5f7] text-[#6c6560]' : 'bg-[#accce9]/20 text-[#241f20]'
          }`}>
            {isMonthly ? 'Mensuel' : 'Hebdo'}
          </Badge>
          <button onClick={() => onRemove(obj.id)} className="text-[#a39c95] hover:text-[#ef4444] text-lg transition-colors shrink-0">&times;</button>
        </div>
      </div>
    </Card>
  )
}
