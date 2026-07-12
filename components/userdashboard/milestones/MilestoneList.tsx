"use client";

import { useEffect, useState } from "react";
import * as api from "@/lib/api";
import type { Milestone, Project } from "@/lib/api";
import { usePermission } from "@/lib/permissions";
import { formatDate } from "@/lib/task-utils";
import { PencilIcon, PlusIcon, TrashIcon } from "@/components/userdashboard/layout/icons";
import MilestoneFormModal from "./MilestoneFormModal";

const STATUS_COLOR: Record<Milestone["status"], string> = {
  not_started: "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
  onhold: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
};

export default function MilestoneList({ project }: { project: Project }) {
  const canManage = usePermission("milestone:manage", { project });
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const [editing, setEditing] = useState<Milestone | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getMilestones(project.id)
      .then((data) => {
        if (!cancelled) setMilestones(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [project.id]);

  function upsert(milestone: Milestone) {
    setMilestones((prev) => {
      const exists = prev.some((m) => m.id === milestone.id);
      return exists ? prev.map((m) => (m.id === milestone.id ? milestone : m)) : [...prev, milestone];
    });
  }

  async function handleDelete(milestone: Milestone) {
    if (!confirm(`Delete milestone "${milestone.title}"?`)) return;
    await api.deleteMilestone(milestone.id);
    setMilestones((prev) => prev.filter((m) => m.id !== milestone.id));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Milestones</h3>
        {canManage && (
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setModalKey((k) => k + 1);
              setModalOpen(true);
            }}
            className="flex items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            Add
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-zinc-400">Loading milestones…</p>
      ) : milestones.length === 0 ? (
        <p className="text-sm text-zinc-400">No milestones yet.</p>
      ) : (
        <div className="space-y-2">
          {milestones.map((m) => (
            <div key={m.id} className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{m.title}</p>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${STATUS_COLOR[m.status]}`}>
                      {m.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">Due {formatDate(m.due_date)}</p>
                </div>
                {canManage && (
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(m);
                        setModalKey((k) => k + 1);
                        setModalOpen(true);
                      }}
                      aria-label="Edit milestone"
                      className="rounded p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(m)}
                      aria-label="Delete milestone"
                      className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100"
                  style={{ width: `${Number(m.completion_percentage)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <MilestoneFormModal
        key={modalKey}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={upsert}
        projectId={project.id}
        milestone={editing}
      />
    </div>
  );
}
