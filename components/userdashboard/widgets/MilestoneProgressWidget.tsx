"use client";

import type { Milestone } from "@/lib/api";
import { formatDate } from "@/lib/task-utils";
import WidgetCard from "./WidgetCard";

function isOverdueMilestone(m: Milestone): boolean {
  return m.status !== "completed" && m.status !== "cancelled" && new Date(m.due_date) < new Date();
}

export default function MilestoneProgressWidget({ milestones }: { milestones: Milestone[] }) {
  const sorted = [...milestones].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

  return (
    <WidgetCard title="Milestones">
      {sorted.length === 0 ? (
        <p className="text-sm text-zinc-400">No milestones yet.</p>
      ) : (
        <ul className="space-y-3">
          {sorted.slice(0, 6).map((m) => (
            <li key={m.id} className="flex items-center gap-3">
              <span className={`h-2 w-2 shrink-0 rounded-full ${isOverdueMilestone(m) ? "bg-red-500" : "bg-blue-500"}`} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-zinc-700 dark:text-zinc-200">{m.title}</p>
                <p className={`text-xs ${isOverdueMilestone(m) ? "font-medium text-red-500" : "text-zinc-400"}`}>
                  Due {formatDate(m.due_date)}
                </p>
              </div>
              <span className="text-xs text-zinc-400">{Number(m.completion_percentage)}%</span>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}
