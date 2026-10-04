export type ProjectStatus = 'active' | 'on_hold' | 'done';
export type TaskStatus = 'todo' | 'doing' | 'done';

export interface Project {
  id: string;
  name: string;
  client: string;
  ownerId: string;
  status: ProjectStatus;
  dueDate: string;
  budgetHours: number;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  assigneeId: string;
  status: TaskStatus;
  dueDate: string;
  loggedMinutes: number;
}