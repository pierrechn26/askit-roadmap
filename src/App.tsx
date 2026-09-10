import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ObjectivePanel } from '@/components/ObjectivePanel'
import { TaskTable } from '@/components/TaskTable'
import { GanttView } from '@/components/GanttView'
import { TeamSettings } from '@/components/TeamSettings'
import { TaskDetailPanel } from '@/components/TaskDetailPanel'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { DEFAULT_MEMBERS, DEFAULT_TASKS, DEFAULT_OBJECTIVES } from '@/data/defaults'
import { LayoutDashboard, ListTodo, GanttChart, Settings } from 'lucide-react'
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
      {/* Header — clean, white, AskIt identity */}
      <header className="bg-white border-b border-[rgba(36,31,32,0.08)]">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-5">
            {/* Logo */}
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
        {/* Gradient accent line */}
        <div className="max-w-6xl mx-auto px-6">
          <div className="h-[2px] bg-gradient-to-r from-[#f8571f] via-[#accce9] to-[#a7abdd]" />
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-6 pt-5 pb-10">
        <Tabs defaultValue="roadmap">
          {/* Tabs — text buttons, subtle active state like askit.ai nav */}
          <TabsList className="bg-transparent p-0 h-auto mb-8 gap-1 border-0 justify-start">
            <TabsTrigger
              value="roadmap"
              className="gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-medium
                text-[#6c6560] hover:text-[#241f20] transition-colors
                data-[state=active]:text-[#241f20] data-[state=active]:bg-transparent
                data-[state=active]:border data-[state=active]:border-[#241f20]/15
                data-[state=active]:shadow-none border border-transparent"
            >
              <LayoutDashboard className="h-3.5 w-3.5" /> Roadmap
            </TabsTrigger>
            <TabsTrigger
              value="tasks"
              className="gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-medium
                text-[#6c6560] hover:text-[#241f20] transition-colors
                data-[state=active]:text-[#241f20] data-[state=active]:bg-transparent
                data-[state=active]:border data-[state=active]:border-[#241f20]/15
                data-[state=active]:shadow-none border border-transparent"
            >
              <ListTodo className="h-3.5 w-3.5" /> Tâches
            </TabsTrigger>
            <TabsTrigger
              value="gantt"
              className="gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-medium
                text-[#6c6560] hover:text-[#241f20] transition-colors
                data-[state=active]:text-[#241f20] data-[state=active]:bg-transparent
                data-[state=active]:border data-[state=active]:border-[#241f20]/15
                data-[state=active]:shadow-none border border-transparent"
            >
              <GanttChart className="h-3.5 w-3.5" /> Timeline
            </TabsTrigger>
            <TabsTrigger
              value="team"
              className="gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-medium
                text-[#6c6560] hover:text-[#241f20] transition-colors
                data-[state=active]:text-[#241f20] data-[state=active]:bg-transparent
                data-[state=active]:border data-[state=active]:border-[#241f20]/15
                data-[state=active]:shadow-none border border-transparent"
            >
              <Settings className="h-3.5 w-3.5" /> Équipe
            </TabsTrigger>
          </TabsList>

          <TabsContent value="roadmap">
            <ObjectivePanel
              clientCount={clientCount}
              onClientCountChange={setClientCount}
              objectives={objectives}
              onObjectivesChange={setObjectives}
              tasks={tasks}
              onTaskClick={handleTaskClick}
            />
          </TabsContent>

          <TabsContent value="tasks">
            <TaskTable tasks={tasks} onTasksChange={setTasks} members={members} objectives={objectives} onTaskClick={handleTaskClick} />
          </TabsContent>

          <TabsContent value="gantt">
            <GanttView tasks={tasks} members={members} onTaskClick={handleTaskClick} />
          </TabsContent>

          <TabsContent value="team">
            <div className="max-w-md">
              <TeamSettings members={members} onMembersChange={setMembers} />
            </div>
          </TabsContent>
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
