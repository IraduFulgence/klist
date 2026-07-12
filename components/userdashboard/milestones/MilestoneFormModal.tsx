"use client";

import { useState } from "react";
import * as api from "@/lib/api";
import type { Milestone } from "@/lib/api";
import { toDateInputValue } from "@/lib/task-utils";
import { XIcon } from "@/components/userdashboard/layout/icons";

export default function MilestoneFormModal({
  open,
  onClose,
  onSaved,
  projectId,
  milestone,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (milestone: Milestone) => void;
  projectId: number;
  milestone?: Milestone | null;
}) {
  const isEdit = Boolean(milestone);
  const [title, setTitle] = useState(() => milestone?.title ?? "");
  const [dueDate, setDueDate] = useState(() => (milestone?.due_date ? toDateInputValue(milestone.due_date).slice(0, 10) : ""));
  const [status, setStatus] = useState<Milestone["status"]>(() => milestone?.status ?? "not_started");
  const [completion, setCompletion] = useState(() => Number(milestone?.completion_percentage ?? 0));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body = { title, due_date: dueDate, status, completion_percentage: completion };
      const saved = isEdit
        ? await api.updateMilestone(milestone!.id, body)
        : await api.createMilestone(projectId, body);
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
      <div className="relative z-10 w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {isEdit ? "Edit Milestone" : "New Milestone"}
          </h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Due date</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Milestone["status"])}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              >
                <option value="not_started">Not started</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
                <option value="onhold">On hold</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Completion: {completion}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={completion}
              onChange={(e) => setCompletion(Number(e.target.value))}
              className="w-full"
            />
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
              {saving ? "Saving…" : isEdit ? "Save changes" : "Create milestone"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
