import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ObjectivePanel } from '@/components/ObjectivePanel'
import { TaskTable } from '@/components/TaskTable'
import { GanttView } from '@/components/GanttView'
import { TeamSettings } from '@/components/TeamSettings'
import { TaskDetailPanel } from '@/components/TaskDetailPanel'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { DEFAULT_MEMBERS, DEFAULT_TASKS, DEFAULT_OBJECTIVES } from '@/data/defaults'
import { LayoutDashboard, ListTodo, GanttChart, Users } from 'lucide-react'
import type { Task, Objective, TeamMember } from '@/types'

function App() {
  const [clientCount, setClientCount] = useLocalStorage('askit-clients', 10)
  const [tasks, setTasks] = useLocalStorage<Task[]>('askit-tasks', DEFAULT_TASKS)
  const [objectives, setObjectives] = useLocalStorage<Objective[]>('askit-objectives', DEFAULT_OBJECTIVES)
  const [members, setMembers] = useLocalStorage<TeamMember[]>('askit-members', DEFAULT_MEMBERS)

  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  function handleTaskClick(task: Task) {
    const latest = tasks.find((t) => t.id === task.id) || task
    setSelectedTask(latest)
    setDetailOpen(true)
  }

  function handleTaskUpdate(updated: Task) {
    setTasks(tasks.map((t) => (t.id === updated.id ? updated : t)))
    setSelectedTask(updated)
  }

  return (
    <div className="min-h-screen bg-[#fdfcfc]">
      {/* Header */}
      <header className="bg-white border-b border-[rgba(36,31,32,0.08)]">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="flex items-baseline">
              <span className="text-[22px] font-bold tracking-tight text-[#241f20]">ask-it</span>
              <span className="text-[22px] font-light text-[#241f20]/40">.ai</span>
            </div>
            <div className="w-px h-5 bg-[#241f20]/10" />
            <div>
              <h1 className="text-[15px] font-medium text-[#241f20] tracking-tight leading-tight">Roadmap 2026</h1>
              <p className="text-[12px] text-[#a39c95]">Suivi des objectifs et tâches de l'équipe</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-[#a39c95]">Aujourd'hui</span>
            <p className="text-[13px] font-medium text-[#241f20]">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6">
          <div className="h-[2px] bg-gradient-to-r from-[#f8571f] via-[#accce9] to-[#a7abdd]" />
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-6 pt-0 pb-10">
        <Tabs defaultValue="roadmap">
          {/* Navigation tabs — prominent, full-width bar */}
          <div className="border-b border-[rgba(36,31,32,0.08)] bg-white sticky top-0 z-20 -mx-6 px-6">
            <TabsList className="bg-transparent p-0 h-auto gap-0 border-0 justify-start w-full rounded-none">
              {[
                { value: 'roadmap', label: 'Roadmap', icon: <LayoutDashboard className="h-4 w-4" /> },
                { value: 'tasks', label: 'Tâches', icon: <ListTodo className="h-4 w-4" /> },
                { value: 'gantt', label: 'Timeline', icon: <GanttChart className="h-4 w-4" /> },
                { value: 'team', label: 'Équipe', icon: <Users className="h-4 w-4" /> },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="relative gap-2 px-5 py-3.5 rounded-none text-[14px] font-medium
                    text-[#a39c95] hover:text-[#241f20] transition-colors
                    data-[state=active]:text-[#241f20] data-[state=active]:bg-transparent
                    data-[state=active]:shadow-none
                    data-[state=active]:after:absolute data-[state=active]:after:bottom-0
                    data-[state=active]:after:left-0 data-[state=active]:after:right-0
                    data-[state=active]:after:h-[2px] data-[state=active]:after:bg-[#f8571f]
                    data-[state=active]:after:rounded-full
                    border-0"
                >
                  {tab.icon} {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="pt-6">
            <TabsContent value="roadmap" className="mt-0">
              <ObjectivePanel
                clientCount={clientCount}
                onClientCountChange={setClientCount}
                objectives={objectives}
                onObjectivesChange={setObjectives}
                tasks={tasks}
                onTasksChange={setTasks}
                onTaskClick={handleTaskClick}
              />
            </TabsContent>

            <TabsContent value="tasks" className="mt-0">
              <TaskTable tasks={tasks} onTasksChange={setTasks} members={members} objectives={objectives} onTaskClick={handleTaskClick} />
            </TabsContent>

            <TabsContent value="gantt" className="mt-0">
              <GanttView tasks={tasks} members={members} onTaskClick={handleTaskClick} />
            </TabsContent>

            <TabsContent value="team" className="mt-0">
              <div className="max-w-md">
                <TeamSettings members={members} onMembersChange={setMembers} />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </main>

      <TaskDetailPanel
        task={selectedTask}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onTaskUpdate={handleTaskUpdate}
        members={members}
        objectives={objectives}
      />
    </div>
  )
}

export default App
