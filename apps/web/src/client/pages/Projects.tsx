import React, { useMemo, useState } from 'react';
import { PlusIcon } from 'lucide-react';
import { toast } from 'sonner';
import { TaskRow } from '../components/projects/TaskRow';
import { Badge, Tone } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { ProgressBar } from '../components/ui/ProgressBar';
import { useErp } from '../contexts/ErpContext';
import { projects, projectTasks } from '../data/projects';
import { usePersistentState } from '../hooks/usePersistentState';
import { formatMinutes, useTaskTimer } from '../hooks/useTaskTimer';
import type { ProjectStatus, ProjectTask, TaskStatus } from '../types/projects';
import { cn } from '../utils/cn';
import { formatDate } from '../utils/dates';
import { createId } from '../utils/ids';
import { inputClass, selectChevron, selectClass } from '../utils/styles';

const statusMeta: Record<ProjectStatus, {label: string;tone: Tone;}> = {
  active: { label: 'Active', tone: 'positive' },
  on_hold: { label: 'On hold', tone: 'warning' },
  done: { label: 'Completed', tone: 'neutral' }
};

const groups: {id: TaskStatus;label: string;}[] = [
{ id: 'doing', label: 'In progress' },
{ id: 'todo', label: 'To do' },
{ id: 'done', label: 'Done' }];


export function Projects() {
  const { state, user, lookups } = useErp();
  const [tasks, setTasks] = usePersistentState<ProjectTask[]>('projects.tasks', projectTasks);
  const [selectedId, setSelectedId] = useState(projects[0].id);
  const [newTitle, setNewTitle] = useState('');
  const [newAssignee, setNewAssignee] = useState(user.id);
  const timer = useTaskTimer();
  const today = new Date().toISOString().slice(0, 10);
  const people = state.users.filter((u) => u.kind === 'person');

  const stats = useMemo(() => {
    const map = new Map<string, {total: number;done: number;minutes: number;}>();
    for (const p of projects) map.set(p.id, { total: 0, done: 0, minutes: 0 });
    for (const t of tasks) {
      const s = map.get(t.projectId)!;
      s.total += 1;
      if (t.status === 'done') s.done += 1;
      s.minutes += t.loggedMinutes;
    }
    return map;
  }, [tasks]);

  const project = projects.find((p) => p.id === selectedId)!;
  const projectTaskList = tasks.filter((t) => t.projectId === project.id);
  const ps = stats.get(project.id)!;
  const loggedHours = ps.minutes / 60;
  const overBudget = loggedHours > project.budgetHours;

  const setStatus = (id: string, status: TaskStatus) => {
    if (status === 'done' && timer.running?.taskId === id) stopTimer();
    setTasks((list) => list.map((t) => t.id === id ? { ...t, status } : t));
  };

  const stopTimer = () => {
    const r = timer.stop();
    if (!r) return;
    const minutes = Math.max(1, Math.round((Date.now() - r.startedAt) / 60000));
    setTasks((list) => list.map((t) => t.id === r.taskId ? { ...t, loggedMinutes: t.loggedMinutes + minutes } : t));
    toast.success(`Logged ${formatMinutes(minutes)}`);
  };

  const toggleTimer = (task: ProjectTask) => {
    if (timer.running?.taskId === task.id) return stopTimer();
    if (timer.running) stopTimer();
    timer.start(task.id);
    if (task.status === 'todo') setTasks((list) => list.map((t) => t.id === task.id ? { ...t, status: 'doing' } : t));
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const due = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
    setTasks((list) => [...list, { id: createId('t'), projectId: project.id, title: newTitle.trim(), assigneeId: newAssignee, status: 'todo', dueDate: due, loggedMinutes: 0 }]);
    setNewTitle('');
  };

  return (
    <div>
      <PageHeader title="Projects" meta={`${projects.filter((p) => p.status === 'active').length} active projects`} />
      <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        <nav aria-label="Projects" className="h-fit rounded-lg border border-line bg-surface shadow-card">
          <ul className="divide-y divide-line">
            {projects.map((p) => {
              const s = stats.get(p.id)!;
              const active = p.id === selectedId;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(p.id)}
                    aria-current={active}
                    className={cn('relative block w-full px-4 py-3 text-left transition-colors duration-100', active ? 'bg-accent-soft/60' : 'hover:bg-surface-2/60')}>
                    
                    {active && <span className="absolute inset-y-0 left-0 w-0.5 bg-accent" aria-hidden />}
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[13px] font-medium text-ink">{p.name}</span>
                      {p.status !== 'active' && <span className="shrink-0 text-[11px] text-muted">{statusMeta[p.status].label}</span>}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-muted">{p.client}</div>
                    <div className="mt-2 flex items-center gap-2">
                      <ProgressBar value={s.done} max={s.total} tone={s.done === s.total ? 'positive' : 'accent'} label={`${p.name} progress`} />
                      <span className="tabular shrink-0 text-[11px] text-muted">
                        {s.done}/{s.total}
                      </span>
                    </div>
                  </button>
                </li>);

            })}
          </ul>
        </nav>

        <section aria-labelledby="project-title" className="min-w-0 rounded-lg border border-line bg-surface shadow-card">
          <header className="border-b border-line px-4 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="project-title" className="text-base font-semibold text-ink">
                {project.name}
              </h2>
              <Badge tone={statusMeta[project.status].tone} dot>
                {statusMeta[project.status].label}
              </Badge>
            </div>
            <dl className="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-[13px]">
              <div>
                <dt className="text-muted">Client</dt>
                <dd className="text-ink">{project.client}</dd>
              </div>
              <div>
                <dt className="text-muted">Owner</dt>
                <dd className="text-ink">{lookups.usersById.get(project.ownerId)?.name}</dd>
              </div>
              <div>
                <dt className="text-muted">Due</dt>
                <dd className={cn(project.status !== 'done' && project.dueDate < today ? 'font-medium text-critical' : 'text-ink')}>{formatDate(project.dueDate)}</dd>
              </div>
              <div className="min-w-[180px] flex-1">
                <dt className="text-muted">Time logged</dt>
                <dd className="mt-1 flex items-center gap-2">
                  <ProgressBar value={loggedHours} max={project.budgetHours} tone={overBudget ? 'critical' : 'accent'} label="Hours used of budget" />
                  <span className={cn('tabular shrink-0 text-xs', overBudget ? 'font-medium text-critical' : 'text-muted')}>
                    {formatMinutes(ps.minutes)} of {project.budgetHours}h
                  </span>
                </dd>
              </div>
            </dl>
          </header>

          {groups.map((g) => {
            const list = projectTaskList.filter((t) => t.status === g.id);
            if (list.length === 0) return null;
            return (
              <div key={g.id}>
                <h3 className="border-b border-line bg-surface-2/50 px-4 py-1.5 text-xs font-medium text-muted">
                  {g.label} <span className="tabular text-subtle">{list.length}</span>
                </h3>
                <ul className="divide-y divide-line border-b border-line">
                  {list.map((t) =>
                  <TaskRow
                    key={t.id}
                    task={t}
                    assignee={lookups.usersById.get(t.assigneeId)}
                    overdue={t.status !== 'done' && t.dueDate < today}
                    timing={timer.running?.taskId === t.id}
                    elapsedSeconds={timer.elapsedSeconds}
                    onStatus={(s) => setStatus(t.id, s)}
                    onTimer={() => toggleTimer(t)} />

                  )}
                </ul>
              </div>);

          })}

          {project.status !== 'done' &&
          <form onSubmit={addTask} className="flex flex-wrap items-center gap-2 px-4 py-3">
              <input aria-label="New task" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Add a task…" className={`${inputClass} min-w-[200px] flex-1`} />
              <select aria-label="Assignee" value={newAssignee} onChange={(e) => setNewAssignee(e.target.value)} className={`${selectClass} w-44`} style={selectChevron}>
                {people.map((p) =>
              <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
              )}
              </select>
              <Button type="submit" icon={PlusIcon} disabled={!newTitle.trim()}>
                Add
              </Button>
            </form>
          }
        </section>
      </div>
    </div>);

}