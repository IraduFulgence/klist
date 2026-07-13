"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import * as api from "@/lib/api";
import type { Project, Task, TaskStatus } from "@/lib/api";
import { usePermission } from "@/lib/permissions";
import { BOARD_COLUMNS, groupTasksByStatus, priorityColor } from "@/lib/task-utils";
import { PencilIcon, PlusIcon, UsersIcon } from "@/components/userdashboard/layout/icons";
import TaskModal from "@/components/userdashboard/tasks/TaskModal";
import ProjectFormModal from "./ProjectFormModal";
import MembersModal from "./MembersModal";
import MilestoneList from "@/components/userdashboard/milestones/MilestoneList";
import DocumentUploadPanel from "@/components/userdashboard/documents/DocumentUploadPanel";
import BudgetPanel from "@/components/userdashboard/budget/BudgetPanel";

type Columns = Record<TaskStatus, Task[]>;

function reorderColumns(current: Columns, taskId: number, toStatus: TaskStatus, toIndex?: number): Columns {
  const next: Columns = {
    todo: [...current.todo],
    in_progress: [...current.in_progress],
    completed: [...current.completed],
  };

  let moved: Task | undefined;
  for (const key of Object.keys(next) as TaskStatus[]) {
    const idx = next[key].findIndex((t) => t.id === taskId);
    if (idx !== -1) {
      [moved] = next[key].splice(idx, 1);
      break;
    }
  }
  if (!moved) return current;

  moved = { ...moved, status: toStatus, completed: toStatus === "completed" };
  const insertAt = toIndex ?? next[toStatus].length;
  next[toStatus].splice(insertAt, 0, moved);
  return next;
}

const TABS = ["board", "milestones", "documents", "budget"] as const;
type Tab = (typeof TABS)[number];
const TAB_LABELS: Record<Tab, string> = { board: "Board", milestones: "Milestones", documents: "Documents", budget: "Budget" };

export default function BoardView({ projectId }: { projectId: number }) {
  const [project, setProject] = useState<Project | null>(null);
  const [columns, setColumns] = useState<Columns>({ todo: [], in_progress: [], completed: [] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("board");
  const [taskModal, setTaskModal] = useState<{ open: boolean; task: Task | null; status: TaskStatus }>({
    open: false,
    task: null,
    status: "todo",
  });
  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [taskModalKey, setTaskModalKey] = useState(0);
  const [editProjectKey, setEditProjectKey] = useState(0);
  const draggedId = useRef<number | null>(null);
  const canEditProject = usePermission("project:edit", { project });
  const canDeleteProject = usePermission("project:delete", { project });
  const canViewBudget = usePermission("budget:manage", { project });

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.getProject(projectId), api.getTasks({ project_id: projectId })])
      .then(([projectData, taskData]) => {
        if (cancelled) return;
        setProject(projectData);
        setColumns(groupTasksByStatus(taskData));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const persist = useCallback(
    async (next: Columns) => {
      try {
        const updated = await api.reorderTasks(projectId, {
          todo: next.todo.map((t) => t.id),
          in_progress: next.in_progress.map((t) => t.id),
          completed: next.completed.map((t) => t.id),
        });
        setColumns(groupTasksByStatus(updated));
      } catch {
        // best-effort resync on failure
        const tasks = await api.getTasks({ project_id: projectId });
        setColumns(groupTasksByStatus(tasks));
      }
    },
    [projectId]
  );

  function moveTask(taskId: number, toStatus: TaskStatus, toIndex?: number) {
    setColumns((prev) => {
      const next = reorderColumns(prev, taskId, toStatus, toIndex);
      persist(next);
      return next;
    });
  }

  function handleDrop(e: React.DragEvent, status: TaskStatus, index?: number) {
    e.preventDefault();
    e.stopPropagation();
    const id = draggedId.current;
    draggedId.current = null;
    if (id == null) return;
    moveTask(id, status, index);
  }

  function upsertTask(task: Task) {
    setColumns((prev) => {
      const withoutTask: Columns = {
        todo: prev.todo.filter((t) => t.id !== task.id),
        in_progress: prev.in_progress.filter((t) => t.id !== task.id),
        completed: prev.completed.filter((t) => t.id !== task.id),
      };
      withoutTask[task.status] = [task, ...withoutTask[task.status]];
      return withoutTask;
    });
  }

  async function handleDeleteProject() {
    if (!project) return;
    if (!confirm(`Delete project "${project.name}"? This cannot be undone.`)) return;
    await api.deleteProject(project.id);
    window.location.href = "/dashboard/projects";
  }

  if (loading || !project) {
    return <p className="text-sm text-zinc-400">Loading board…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/projects" className="text-xs font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
          &larr; All projects
        </Link>
        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-2 h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: project.color }} />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{project.name}</h1>
                {canEditProject && (
                  <button
                    type="button"
                    onClick={() => {
                    setEditProjectKey((k) => k + 1);
                    setEditProjectOpen(true);
                  }}
                    aria-label="Edit project"
                    className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
              {project.description && (
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{project.description}</p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => setMembersOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <UsersIcon className="h-4 w-4" />
              Members
            </button>
            <button
              type="button"
              onClick={() => {
                setTaskModalKey((k) => k + 1);
                setTaskModal({ open: true, task: null, status: "todo" });
              }}
              className="flex items-center gap-2 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              <PlusIcon className="h-4 w-4" />
              New Task
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.filter((t) => t !== "budget" || canViewBudget).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === t
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-white text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {tab === "milestones" && <MilestoneList project={project} />}
      {tab === "documents" && <DocumentUploadPanel project={project} />}
      {tab === "budget" && <BudgetPanel project={project} />}

      {tab === "board" && (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {BOARD_COLUMNS.map((col) => (
          <div
            key={col.key}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, col.key)}
            className="flex flex-col rounded-2xl bg-zinc-100/70 p-3 dark:bg-zinc-900/50"
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{col.label}</h2>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs text-zinc-500 shadow-sm dark:bg-zinc-800 dark:text-zinc-400">
                {columns[col.key].length}
              </span>
            </div>

            <div className="flex-1 space-y-2">
              {columns[col.key].map((task, index) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => {
                    draggedId.current = task.id;
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, col.key, index)}
                  onClick={() => {
                    setTaskModalKey((k) => k + 1);
                    setTaskModal({ open: true, task, status: task.status });
                  }}
                  className="cursor-pointer space-y-2 rounded-xl border border-zinc-200 bg-white p-3 text-sm shadow-sm transition hover:shadow-md active:cursor-grabbing dark:border-zinc-700 dark:bg-zinc-900"
                >
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{task.title}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${priorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                    {task.due_date && (
                      <span className="text-[11px] text-zinc-400">
                        {new Date(task.due_date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>
                  {task.assignee && (
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200">
                        {task.assignee.name.charAt(0).toUpperCase()}
                      </span>
                      {task.assignee.name}
                    </div>
                  )}
                  <select
                    value={task.status}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      e.stopPropagation();
                      moveTask(task.id, e.target.value as TaskStatus);
                    }}
                    className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] text-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 md:hidden"
                  >
                    {BOARD_COLUMNS.map((c) => (
                      <option key={c.key} value={c.key}>
                        Move to {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}

              <button
                type="button"
                onClick={() => {
                  setTaskModalKey((k) => k + 1);
                  setTaskModal({ open: true, task: null, status: col.key });
                }}
                className="flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-zinc-300 py-2 text-xs font-medium text-zinc-400 hover:border-zinc-400 hover:text-zinc-600 dark:border-zinc-700 dark:hover:border-zinc-500 dark:hover:text-zinc-300"
              >
                <PlusIcon className="h-3.5 w-3.5" />
                Add task
              </button>
            </div>
          </div>
        ))}
      </div>
      )}

      <TaskModal
        key={`task-modal-${taskModalKey}`}
        open={taskModal.open}
        onClose={() => setTaskModal((s) => ({ ...s, open: false }))}
        onSaved={upsertTask}
        task={taskModal.task}
        lockedProjectId={project.id}
        initialStatus={taskModal.status}
      />
      <ProjectFormModal
        key={`project-form-${editProjectKey}`}
        open={editProjectOpen}
        onClose={() => setEditProjectOpen(false)}
        onSaved={(p) => setProject(p)}
        project={project}
      />
      <MembersModal open={membersOpen} onClose={() => setMembersOpen(false)} project={project} />

      {canDeleteProject && (
        <div className="pt-4 text-right">
          <button
            type="button"
            onClick={handleDeleteProject}
            className="text-xs font-medium text-red-500 hover:text-red-700 dark:hover:text-red-400"
          >
            Delete project
          </button>
        </div>
      )}
    </div>
  );
}
