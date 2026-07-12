"use client";

import { useEffect, useState } from "react";
import * as api from "@/lib/api";
import type { Project, ProjectPriority, ProjectStatus, User } from "@/lib/api";
import { useAuth } from "@/components/auth/AuthProvider";
import { toDateInputValue } from "@/lib/task-utils";
import { XIcon } from "../layout/icons";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899"];

export default function ProjectFormModal({
  open,
  onClose,
  onSaved,
  project,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (project: Project) => void;
  project?: Project | null;
}) {
  const { user, isAdmin } = useAuth();
  const isEdit = Boolean(project);
  const [name, setName] = useState(() => project?.name ?? "");
  const [description, setDescription] = useState(() => project?.description ?? "");
  const [color, setColor] = useState(() => project?.color ?? COLORS[0]);
  const [startDate, setStartDate] = useState(() => (project?.start_date ? toDateInputValue(project.start_date).slice(0, 10) : ""));
  const [endDate, setEndDate] = useState(() => (project?.end_date ? toDateInputValue(project.end_date).slice(0, 10) : ""));
  const [status, setStatus] = useState<ProjectStatus>(() => project?.status ?? "not_started");
  const [priority, setPriority] = useState<ProjectPriority>(() => project?.priority ?? "medium");
  const [budget, setBudget] = useState(() => String(project?.budget ?? ""));
  const [managerId, setManagerId] = useState(() => String(project?.manager_id ?? ""));
  const [managers, setManagers] = useState<User[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || isEdit || !isAdmin) return;
    let cancelled = false;
    api.getEmployees({ role: "project_manager" }).then((data) => {
      if (!cancelled) setManagers(data);
    });
    return () => {
      cancelled = true;
    };
  }, [open, isEdit, isAdmin]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (isEdit) {
        const body = {
          name,
          description: description || undefined,
          color,
          start_date: startDate,
          end_date: endDate,
          status,
          budget: Number(budget),
          priority,
        };
        const saved = await api.updateProject(project!.id, body);
        onSaved(saved);
      } else {
        const resolvedManagerId = isAdmin ? Number(managerId) : user!.id;
        const managerName = isAdmin ? managers.find((m) => m.id === resolvedManagerId)?.name ?? user!.name : user!.name;
        const saved = await api.createProject({
          name,
          description: description || undefined,
          color,
          start_date: startDate,
          end_date: endDate,
          status,
          budget: Number(budget),
          priority,
          manager_id: resolvedManagerId,
          owner: managerName,
        });
        onSaved(saved);
      }
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
      <div className="relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {isEdit ? "Edit Project" : "New Project"}
          </h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Description</label>
            <textarea
              rows={3}
              required={!isEdit}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
          </div>

          {!isEdit && isAdmin && (
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Project manager</label>
              <select
                required
                value={managerId}
                onChange={(e) => setManagerId(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              >
                <option value="">Select a manager…</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Start date</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">End date</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Budget</label>
              <input
                type="number"
                min={0}
                step="0.01"
                required
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as ProjectPriority)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <option value="not_started">Not started</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
              <option value="onhold">On hold</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Color</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={c}
                  className={`h-7 w-7 rounded-full ring-offset-2 ring-offset-white transition dark:ring-offset-zinc-900 ${
                    color === c ? "ring-2 ring-zinc-900 dark:ring-zinc-100" : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

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
              {saving ? "Saving…" : isEdit ? "Save changes" : "Create project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
