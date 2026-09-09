import { useMemo } from 'react'
import type { Task, TeamMember } from '@/types'
import {
  differenceInDays,
  startOfWeek,
  addDays,
  format,
  parseISO,
  isWithinInterval,
  startOfMonth,
  endOfMonth,
  addMonths,
} from 'date-fns'
import { fr } from 'date-fns/locale'

interface Props {
  tasks: Task[]
  members: TeamMember[]
  onTaskClick: (task: Task) => void
}

const STATUS_COLORS: Record<string, string> = {
  a_faire: '#a39c95',
  en_cours: '#f8571f',
  termine: '#a7abdd',
  bloque: '#ef4444',
}

export function GanttView({ tasks, members, onTaskClick }: Props) {
  const { months, startDate, totalDays } = useMemo(() => {
    const now = new Date()
    const start = startOfMonth(now)
    const monthList = Array.from({ length: 4 }, (_, i) => addMonths(start, i))
    const end = endOfMonth(monthList[monthList.length - 1])
    const days = differenceInDays(end, start) + 1
    return { months: monthList, startDate: start, totalDays: days }
  }, [])

  const weeks = useMemo(() => {
    const result: Date[] = []
    let current = startOfWeek(startDate, { weekStartsOn: 1 })
    const endDate = addDays(startDate, totalDays)
    while (current < endDate) {
      result.push(current)
      current = addDays(current, 7)
    }
    return result
  }, [startDate, totalDays])

  const memberColorMap = useMemo(() => {
    const map: Record<string, string> = {}
    members.forEach((m) => { map[m.name] = m.color })
    return map
  }, [members])

  function getBarStyle(task: Task) {
    const tStart = parseISO(task.startDate)
    const tEnd = parseISO(task.dueDate)
    const endDate = addDays(startDate, totalDays)

    if (tEnd < startDate || tStart > endDate) return null

    const clampedStart = tStart < startDate ? startDate : tStart
    const clampedEnd = tEnd > endDate ? endDate : tEnd

    const left = (differenceInDays(clampedStart, startDate) / totalDays) * 100
    const width = ((differenceInDays(clampedEnd, clampedStart) + 1) / totalDays) * 100

    return { left: `${left}%`, width: `${Math.max(width, 0.8)}%` }
  }

  // Group tasks by assignee (tasks can appear under multiple assignees)
  const grouped = useMemo(() => {
    const map: Record<string, Task[]> = {}
    members.forEach((m) => { map[m.name] = [] })
    tasks.forEach((t) => {
      t.assignees.forEach((assignee) => {
        if (!map[assignee]) map[assignee] = []
        map[assignee].push(t)
      })
    })
    return map
  }, [tasks, members])

  // Today marker
  const todayPct = useMemo(() => {
    const now = new Date()
    const endDate = addDays(startDate, totalDays)
    if (now < startDate || now > endDate) return null
    return (differenceInDays(now, startDate) / totalDays) * 100
  }, [startDate, totalDays])

  return (
    <div className="overflow-x-auto rounded-2xl border-0 shadow-sm bg-white">
      <div className="min-w-[900px]">
        {/* Month headers */}
        <div className="flex border-b border-[rgba(36,31,32,0.06)]">
          <div className="w-[180px] shrink-0 p-3 font-semibold text-sm border-r border-[rgba(36,31,32,0.06)] text-[#241f20]">
            Membre
          </div>
          <div className="flex-1 relative">
            <div className="flex">
              {months.map((m) => {
                const mStart = startOfMonth(m)
                const mEnd = endOfMonth(m)
                const daysInMonth = differenceInDays(mEnd, mStart) + 1
                const widthPct = (daysInMonth / totalDays) * 100
                return (
                  <div
                    key={m.toISOString()}
                    className="text-center text-sm font-medium py-2.5 border-r border-[rgba(36,31,32,0.06)] text-[#241f20] capitalize"
                    style={{ width: `${widthPct}%` }}
                  >
                    {format(m, 'MMMM yyyy', { locale: fr })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Week sub-headers */}
        <div className="flex border-b border-[rgba(36,31,32,0.06)] bg-[#f5f5f7]/50">
          <div className="w-[180px] shrink-0 border-r border-[rgba(36,31,32,0.06)]" />
          <div className="flex-1 relative flex h-5">
            {weeks.map((w) => {
              const endDate = addDays(startDate, totalDays)
              const wEnd = addDays(w, 6)
              if (w > endDate) return null
              const clampedEnd = wEnd > endDate ? endDate : wEnd
              const clampedStart = w < startDate ? startDate : w
              const left = (differenceInDays(clampedStart, startDate) / totalDays) * 100
              const width = ((differenceInDays(clampedEnd, clampedStart) + 1) / totalDays) * 100

              const isCurrentWeek = isWithinInterval(new Date(), { start: w, end: wEnd })

              return (
                <div
                  key={w.toISOString()}
                  className={`text-[10px] text-center border-r border-[rgba(36,31,32,0.04)] flex items-center justify-center ${
                    isCurrentWeek ? 'bg-[#f8571f]/8 font-semibold text-[#f8571f]' : 'text-[#a39c95]'
                  }`}
                  style={{ position: 'absolute', left: `${left}%`, width: `${width}%` }}
                >
                  S{format(w, 'ww')}
                </div>
              )
            })}
          </div>
        </div>

        {/* Rows */}
        {Object.entries(grouped).map(([name, memberTasks]) => (
          <div key={name}>
            {memberTasks.length === 0 ? (
              <div className="flex border-b border-[rgba(36,31,32,0.04)] hover:bg-[#f5f5f7]/30 transition-colors">
                <div className="w-[180px] shrink-0 p-2.5 border-r border-[rgba(36,31,32,0.06)] flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: memberColorMap[name] || '#888' }} />
                  <span className="text-sm font-medium text-[#241f20]">{name}</span>
                </div>
                <div className="flex-1 relative h-10">
                  <span className="text-xs text-[#a39c95] absolute top-1/2 left-4 -translate-y-1/2">Pas de tâche</span>
                </div>
              </div>
            ) : (
              memberTasks.map((task, i) => (
                <div key={task.id} className="flex border-b border-[rgba(36,31,32,0.04)] hover:bg-[#f5f5f7]/30 transition-colors">
                  {i === 0 ? (
                    <div className="w-[180px] shrink-0 p-2.5 border-r border-[rgba(36,31,32,0.06)] flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: memberColorMap[name] || '#888' }} />
                      <span className="text-sm font-medium text-[#241f20]">{name}</span>
                    </div>
                  ) : (
                    <div className="w-[180px] shrink-0 border-r border-[rgba(36,31,32,0.06)]" />
                  )}
                  <div className="flex-1 relative h-11">
                    {(() => {
                      const style = getBarStyle(task)
                      if (!style) return null
                      return (
                        <div
                          className="absolute top-1/2 -translate-y-1/2 h-7 rounded-lg text-white text-[11px] font-medium flex items-center px-2.5 truncate cursor-pointer shadow-sm hover:shadow-md hover:brightness-110 transition-all"
                          style={{
                            ...style,
                            backgroundColor: STATUS_COLORS[task.status] || '#f8571f',
                          }}
                          title={`${task.title} (${task.startDate} → ${task.dueDate})`}
                          onClick={() => onTaskClick(task)}
                        >
                          {task.title}
                        </div>
                      )
                    })()}
                    {/* Today line */}
                    {todayPct !== null && (
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-[#f8571f] z-10 pointer-events-none"
                        style={{ left: `${todayPct}%` }}
                      />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
