"use client";

import type { Task } from "@/lib/api";
import { taskStats } from "@/lib/task-utils";
import WidgetCard from "./WidgetCard";

export default function TaskSummaryWidget({ tasks }: { tasks: Task[] }) {
  const stats = taskStats(tasks);
  const pct = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;

  const cards: { label: string; value: number; color: string }[] = [
    { label: "Total", value: stats.total, color: "text-zinc-900 dark:text-zinc-100" },
    { label: "Pending", value: stats.pending, color: "text-amber-600 dark:text-amber-400" },
    { label: "Completed", value: stats.completed, color: "text-green-600 dark:text-green-400" },
    { label: "Overdue", value: stats.overdue, color: "text-red-600 dark:text-red-400" },
  ];

  return (
    <WidgetCard title="Task Summary">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label}>
            <p className={`text-2xl font-semibold ${c.color}`}>{c.value}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{c.label}</p>
          </div>
        ))}
      </div>
      <div className="mt-5">
        <div className="mb-1 flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>Overall progress</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-zinc-900 transition-all dark:bg-zinc-100"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </WidgetCard>
  );
}
