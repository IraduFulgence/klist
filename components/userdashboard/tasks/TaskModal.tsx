"use client";

import { useEffect, useState } from "react";
import * as api from "@/lib/api";
import type { Project, Task, TaskInput, TaskPriority, TaskStatus, User } from "@/lib/api";
import { toDateInputValue } from "@/lib/task-utils";
import { usePermission } from "@/lib/permissions";
import { DocumentIcon, PlusIcon, XIcon } from "../layout/icons";
import CommentThread from "@/components/userdashboard/comments/CommentThread";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: (task: Task) => void;
  task?: Task | null;
  projects?: Project[];
  lockedProjectId?: number;
  initialStatus?: TaskStatus;
};

export default function TaskModal({ open, onClose, onSaved, task, projects, lockedProjectId, initialStatus }: Props) {
  const isEdit = Boolean(task);
  const [title, setTitle] = useState(() => task?.title ?? "");
  const [description, setDescription] = useState(() => task?.description ?? "");
  const [dueDate, setDueDate] = useState(() => (task?.due_date ? toDateInputValue(task.due_date) : ""));
  const [projectId, setProjectId] = useState(() => String(lockedProjectId ?? task?.project_id ?? ""));
  const [assigneeId, setAssigneeId] = useState(() => (task?.assignee_id ? String(task.assignee_id) : ""));
  const [status, setStatus] = useState<TaskStatus>(() => task?.status ?? initialStatus ?? "todo");
  const [priority, setPriority] = useState<TaskPriority>(() => task?.priority ?? "medium");
  const [members, setMembers] = useState<(User & { pivot: { role: string } })[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taskFiles, setTaskFiles] = useState<import("@/lib/api").ProjectFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const canAssignOthers = usePermission("task:assign");

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    api.getProjectMembers(Number(projectId)).then((data) => {
      if (!cancelled) setMembers(data);
    });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  useEffect(() => {
    if (!isEdit || !task?.project_id) return;
    let cancelled = false;
    api.getProjectFiles(task.project_id, task.id).then((data) => {
      if (!cancelled) setTaskFiles(data);
    });
    return () => {
      cancelled = true;
    };
  }, [isEdit, task?.project_id, task?.id]);

  if (!open) return null;

  async function handleUploadWork(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !task?.project_id) return;
    setUploading(true);
    try {
      const saved = await api.uploadProjectFile(task.project_id, file, task.id);
      setTaskFiles((prev) => [saved, ...prev]);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body: TaskInput = {
        title,
        description: description || undefined,
        due_date: dueDate || undefined,
        project_id: projectId ? Number(projectId) : undefined,
        assignee_id: assigneeId ? Number(assigneeId) : undefined,
        status,
        priority,
      };
      const saved = isEdit ? await api.updateTask(task!.id, body) : await api.createTask(body);
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button aria-label="Close" className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {isEdit ? "Edit Task" : "New Task"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Title</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Due date</label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Done</option>
              </select>
            </div>

            {projects && !lockedProjectId && (
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Project</label>
                <select
                  value={projectId}
                  onChange={(e) => {
                    setProjectId(e.target.value);
                    setAssigneeId("");
                  }}
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                >
                  <option value="">Personal (no project)</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {projectId && canAssignOthers && (
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Assignee</label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {saving ? "Saving…" : isEdit ? "Save changes" : "Create task"}
            </button>
          </div>
        </form>

        {isEdit && task?.project_id && (
          <div className="mt-4 space-y-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Completed work</h3>
              <label className="flex cursor-pointer items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
                <PlusIcon className="h-3.5 w-3.5" />
                {uploading ? "Uploading…" : "Upload"}
                <input type="file" className="hidden" onChange={handleUploadWork} disabled={uploading} />
              </label>
            </div>
            {taskFiles.length === 0 ? (
              <p className="text-sm text-zinc-400">No files uploaded yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {taskFiles.map((f) => (
                  <li key={f.id}>
                    <a
                      href={api.getFileDownloadUrl(f.id)}
                      className="flex items-center gap-2 text-sm text-zinc-700 hover:underline dark:text-zinc-200"
                    >
                      <DocumentIcon className="h-4 w-4 shrink-0 text-zinc-400" />
                      <span className="truncate">{f.file_name}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {isEdit && <CommentThread taskId={task!.id} />}
      </div>
    </div>
  );
}
