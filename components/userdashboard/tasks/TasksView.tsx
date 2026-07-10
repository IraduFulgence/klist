"use client";

import { useEffect, useMemo, useState } from "react";
import * as api from "@/lib/api";
import type { Project, Task } from "@/lib/api";
import {
  filterTasks,
  formatDate,
  isOverdue,
  priorityColor,
  statusLabel,
  taskStats,
  type TaskFilter,
} from "@/lib/task-utils";
import { CheckIcon, PencilIcon, PlusIcon, TrashIcon } from "@/components/userdashboard/layout/icons";
import TaskModal from "./TaskModal";

const FILTERS: { key: TaskFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "completed", label: "Completed" },
  { key: "overdue", label: "Overdue" },
];

export default function TasksView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [modalKey, setModalKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.getTasks(), api.getProjects()])
      .then(([taskData, projectData]) => {
        if (!cancelled) {
          setTasks(taskData);
          setProjects(projectData);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleTasks = useMemo(() => filterTasks(tasks, filter), [tasks, filter]);
  const stats = useMemo(() => taskStats(tasks), [tasks]);

  function upsertTask(task: Task) {
    setTasks((prev) => {
      const exists = prev.some((t) => t.id === task.id);
      return exists ? prev.map((t) => (t.id === task.id ? task : t)) : [task, ...prev];
    });
  }

  async function toggleCompleted(task: Task) {
    const updated = await api.updateTask(task.id, { completed: !task.completed });
    upsertTask(updated);
  }

  async function handleDelete(task: Task) {
    if (!confirm(`Delete "${task.title}"?`)) return;
    await api.deleteTask(task.id);
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">My Tasks</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {stats.total} total &middot; {stats.pending} pending &middot; {stats.overdue} overdue
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingTask(null);
            setModalKey((k) => k + 1);
            setModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <PlusIcon className="h-4 w-4" />
          New Task
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === f.key
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-white text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-zinc-400">Loading tasks…</p>
      ) : visibleTasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-400 dark:border-zinc-700">
          No tasks here.
        </div>
      ) : (
        <div className="space-y-2">
          {visibleTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <button
                type="button"
                onClick={() => toggleCompleted(task)}
                aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                  task.completed
                    ? "border-green-500 bg-green-500 text-white"
                    : "border-zinc-300 text-transparent hover:border-zinc-400 dark:border-zinc-600"
                }`}
              >
                <CheckIcon className="h-3.5 w-3.5" />
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className={`font-medium ${task.completed ? "text-zinc-400 line-through" : "text-zinc-900 dark:text-zinc-100"}`}>
                    {task.title}
                  </p>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${priorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                  {task.project && (
                    <span
                      className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:text-zinc-300"
                      style={{ backgroundColor: `${task.project.color}22` }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: task.project.color }} />
                      {task.project.name}
                    </span>
                  )}
                  {!task.completed && (
                    <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                      {statusLabel(task.status)}
                    </span>
                  )}
                </div>
                {task.description && (
                  <p className="mt-1 truncate text-sm text-zinc-500 dark:text-zinc-400">{task.description}</p>
                )}
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                  <span className={isOverdue(task) ? "font-medium text-red-500" : "text-zinc-400"}>
                    {formatDate(task.due_date)}
                  </span>
                  {task.assignee && <span className="text-zinc-400">&middot; Assigned to {task.assignee.name}</span>}
                </div>
              </div>

              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setEditingTask(task);
                    setModalKey((k) => k + 1);
                    setModalOpen(true);
                  }}
                  aria-label="Edit"
                  className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(task)}
                  aria-label="Delete"
                  className="rounded-lg p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <TaskModal
        key={modalKey}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={upsertTask}
        task={editingTask}
        projects={projects}
      />
    </div>
  );
}
