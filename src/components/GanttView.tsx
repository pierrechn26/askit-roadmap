import { useMemo } from 'react'
import type { Task, TeamMember } from '@/types'
import {
  differenceInDays,
  addDays,
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  addMonths,
  isSameDay,
  isWeekend,
} from 'date-fns'
import { fr } from 'date-fns/locale'

interface Props {
  tasks: Task[]
  members: TeamMember[]
  onTaskClick: (task: Task) => void
}

const STATUS_BAR_COLORS: Record<string, string> = {
  a_faire: '#a39c95',
  en_cours: '#f8571f',
  termine: '#a7abdd',
  bloque: '#ef4444',
}

export function GanttView({ tasks, members, onTaskClick }: Props) {
  const { months, startDate, totalDays, days } = useMemo(() => {
    const now = new Date()
    const start = startOfMonth(now)
    const monthList = Array.from({ length: 4 }, (_, i) => addMonths(start, i))
    const end = endOfMonth(monthList[monthList.length - 1])
    const total = differenceInDays(end, start) + 1
    const dayList = Array.from({ length: total }, (_, i) => addDays(start, i))
    return { months: monthList, startDate: start, totalDays: total, days: dayList }
  }, [])

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

    return { left: `${left}%`, width: `${Math.max(width, 0.5)}%` }
  }

  // Group tasks by assignee
  const grouped = useMemo(() => {
    const map: Record<string, Task[]> = {}
    members.forEach((m) => { map[m.name] = [] })
    tasks.forEach((t) => {
      t.assignees.forEach((assignee) => {
        if (!map[assignee]) map[assignee] = []
        if (!map[assignee].find((x) => x.id === t.id)) {
          map[assignee].push(t)
        }
      })
    })
    return map
  }, [tasks, members])

  const today = new Date()
  const todayPct = useMemo(() => {
    const endDate = addDays(startDate, totalDays)
    if (today < startDate || today > endDate) return null
    return (differenceInDays(today, startDate) / totalDays) * 100
  }, [startDate, totalDays, today])

  // Determine which days to show labels (every Monday + 1st of month)
  const dayWidth = 100 / totalDays

  return (
    <div className="overflow-x-auto rounded-2xl border-0 shadow-sm bg-white">
      <div style={{ minWidth: `${Math.max(900, totalDays * 8)}px` }}>
        {/* Month headers */}
        <div className="flex border-b border-[rgba(36,31,32,0.06)]">
          <div className="w-[160px] shrink-0 p-3 font-semibold text-sm border-r border-[rgba(36,31,32,0.06)] text-[#241f20]">
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
                    className="text-center text-sm font-medium py-2 border-r border-[rgba(36,31,32,0.06)] text-[#241f20] capitalize"
                    style={{ width: `${widthPct}%` }}
                  >
                    {format(m, 'MMMM yyyy', { locale: fr })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Day headers */}
        <div className="flex border-b border-[rgba(36,31,32,0.06)] bg-[#f5f5f7]/50">
          <div className="w-[160px] shrink-0 border-r border-[rgba(36,31,32,0.06)]" />
          <div className="flex-1 relative h-5">
            {days.map((d, i) => {
              const isToday = isSameDay(d, today)
              const dayNum = d.getDate()
              const isMonday = d.getDay() === 1
              const is1st = dayNum === 1
              const showLabel = isMonday || is1st || isToday
              const weekend = isWeekend(d)

              return (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 border-r flex items-center justify-center"
                  style={{
                    left: `${i * dayWidth}%`,
                    width: `${dayWidth}%`,
                    borderColor: is1st ? 'rgba(36,31,32,0.12)' : 'rgba(36,31,32,0.03)',
                    backgroundColor: isToday ? 'rgba(248,87,31,0.08)' : weekend ? 'rgba(36,31,32,0.02)' : 'transparent',
                  }}
                >
                  {showLabel && (
                    <span className={`text-[8px] leading-none ${
                      isToday ? 'text-[#f8571f] font-bold' : 'text-[#a39c95]'
                    }`}>
                      {dayNum}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Rows */}
        {Object.entries(grouped).map(([name, memberTasks]) => {
          const member = members.find((m) => m.name === name)
          return (
            <div key={name}>
              {memberTasks.length === 0 ? (
                <div className="flex border-b border-[rgba(36,31,32,0.04)] hover:bg-[#f5f5f7]/30 transition-colors">
                  <div className="w-[160px] shrink-0 p-2 border-r border-[rgba(36,31,32,0.06)] flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: memberColorMap[name] || '#888' }} />
                    <span className="text-sm font-medium text-[#241f20]">{name}</span>
                    {member?.role === 'dev' && (
                      <span className="text-[9px] bg-[#a7abdd]/20 text-[#241f20] px-1.5 py-0.5 rounded-full">DEV</span>
                    )}
                  </div>
                  <div className="flex-1 relative h-10">
                    <span className="text-xs text-[#a39c95] absolute top-1/2 left-4 -translate-y-1/2">Pas de tâche</span>
                  </div>
                </div>
              ) : (
                memberTasks.map((task, i) => (
                  <div key={task.id} className="flex border-b border-[rgba(36,31,32,0.04)] hover:bg-[#f5f5f7]/30 transition-colors">
                    {i === 0 ? (
                      <div className="w-[160px] shrink-0 p-2 border-r border-[rgba(36,31,32,0.06)] flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: memberColorMap[name] || '#888' }} />
                        <span className="text-sm font-medium text-[#241f20]">{name}</span>
                        {member?.role === 'dev' && (
                          <span className="text-[9px] bg-[#a7abdd]/20 text-[#241f20] px-1.5 py-0.5 rounded-full">DEV</span>
                        )}
                      </div>
                    ) : (
                      <div className="w-[160px] shrink-0 border-r border-[rgba(36,31,32,0.06)]" />
                    )}
                    <div className="flex-1 relative h-11">
                      {/* Weekend stripes */}
                      {days.map((d, di) => isWeekend(d) ? (
                        <div
                          key={di}
                          className="absolute top-0 bottom-0 bg-[rgba(36,31,32,0.015)]"
                          style={{ left: `${di * dayWidth}%`, width: `${dayWidth}%` }}
                        />
                      ) : null)}

                      {/* Task bar */}
                      {(() => {
                        const style = getBarStyle(task)
                        if (!style) return null
                        const subtasks = task.subtasks || []
                        const stDone = subtasks.filter((s) => s.done).length
                        return (
                          <div
                            className="absolute top-1/2 -translate-y-1/2 h-7 rounded-lg text-white text-[11px] font-medium flex items-center px-2 truncate cursor-pointer shadow-sm hover:shadow-md hover:brightness-110 transition-all"
                            style={{ ...style, backgroundColor: STATUS_BAR_COLORS[task.status] || '#f8571f' }}
                            title={`${task.title} (${task.startDate} → ${task.dueDate})`}
                            onClick={() => onTaskClick(task)}
                          >
                            <span className="truncate">{task.title}</span>
                            {subtasks.length > 0 && (
                              <span className="ml-1.5 text-[9px] opacity-80 shrink-0">
                                {stDone}/{subtasks.length}
                              </span>
                            )}
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
          )
        })}
      </div>
    </div>
  )
}
