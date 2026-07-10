export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "No due date";
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function isOverdue(task: { due_date: string | null; completed: boolean }): boolean {
  if (!task.due_date || task.completed) return false;
  return new Date(task.due_date) < new Date();
}

export type TaskFilter = "all" | "pending" | "completed" | "overdue";

export function filterTasks(tasks: import("@/lib/api").Task[], filter: TaskFilter) {
  switch (filter) {
    case "pending":
      return tasks.filter((t) => !t.completed);
    case "completed":
      return tasks.filter((t) => t.completed);
    case "overdue":
      return tasks.filter((t) => isOverdue(t));
    default:
      return tasks;
  }
}

export function taskStats(tasks: import("@/lib/api").Task[]) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const pending = total - completed;
  const overdue = tasks.filter((t) => isOverdue(t)).length;
  return { total, completed, pending, overdue };
}

export function toDateInputValue(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function activityLabel(action: import("@/lib/api").Activity["action"]): string {
  const labels: Record<import("@/lib/api").Activity["action"], string> = {
    created: "Created task",
    updated: "Updated task",
    completed: "Completed task",
    reopened: "Reopened task",
    deleted: "Deleted task",
    assigned: "Reassigned task",
  };
  return labels[action];
}

export function activityColor(action: import("@/lib/api").Activity["action"]): string {
  const colors: Record<import("@/lib/api").Activity["action"], string> = {
    created: "bg-blue-500",
    updated: "bg-yellow-500",
    completed: "bg-green-500",
    reopened: "bg-orange-500",
    deleted: "bg-red-500",
    assigned: "bg-purple-500",
  };
  return colors[action];
}

type TaskLike = import("@/lib/api").Task;
type TaskStatus = import("@/lib/api").TaskStatus;
type TaskPriority = import("@/lib/api").TaskPriority;

export const BOARD_COLUMNS: { key: TaskStatus; label: string }[] = [
  { key: "todo", label: "To Do" },
  { key: "in_progress", label: "In Progress" },
  { key: "done", label: "Done" },
];

export function statusLabel(status: TaskStatus): string {
  return BOARD_COLUMNS.find((c) => c.key === status)?.label ?? status;
}

export function priorityColor(priority: TaskPriority): string {
  const colors: Record<TaskPriority, string> = {
    low: "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200",
    medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
    high: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
  };
  return colors[priority];
}

export function groupTasksByStatus(tasks: TaskLike[]): Record<TaskStatus, TaskLike[]> {
  const groups: Record<TaskStatus, TaskLike[]> = { todo: [], in_progress: [], done: [] };
  for (const task of tasks) {
    (groups[task.status] ?? groups.todo).push(task);
  }
  for (const key of Object.keys(groups) as TaskStatus[]) {
    groups[key].sort((a, b) => a.position - b.position);
  }
  return groups;
}

export function dateKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function tasksByDueDate(tasks: TaskLike[]): Map<string, TaskLike[]> {
  const map = new Map<string, TaskLike[]>();
  for (const task of tasks) {
    if (!task.due_date) continue;
    const key = dateKey(new Date(task.due_date));
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(task);
  }
  return map;
}

export type CalendarCell = { date: Date; inCurrentMonth: boolean };

export function getMonthMatrix(year: number, month: number): CalendarCell[] {
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = firstOfMonth.getDay();
  const gridStart = new Date(year, month, 1 - startOffset);

  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    return { date, inCurrentMonth: date.getMonth() === month };
  });
}

export function upcomingTasks(tasks: TaskLike[], limit = 5): TaskLike[] {
  const now = new Date();
  return tasks
    .filter((t) => !t.completed && t.due_date)
    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
    .filter((t) => new Date(t.due_date!).getTime() >= now.setHours(0, 0, 0, 0))
    .slice(0, limit);
}
