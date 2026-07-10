"use client";

import Link from "next/link";
import type { Task } from "@/lib/api";
import { BOARD_COLUMNS, groupTasksByStatus, priorityColor } from "@/lib/task-utils";
import WidgetCard from "./WidgetCard";

export default function KanbanPreviewWidget({ tasks }: { tasks: Task[] }) {
  const groups = groupTasksByStatus(tasks);

  return (
    <WidgetCard
      title="Board Overview"
      action={
        <Link
          href="/dashboard/projects"
          className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          View boards &rarr;
        </Link>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {BOARD_COLUMNS.map((col) => (
          <div key={col.key} className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800/50">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{col.label}</p>
              <span className="text-xs text-zinc-400">{groups[col.key].length}</span>
            </div>
            <div className="space-y-2">
              {groups[col.key].slice(0, 3).map((t) => (
                <div
                  key={t.id}
                  className="rounded-lg border border-zinc-200 bg-white p-2 text-xs shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
                >
                  <p className="truncate font-medium text-zinc-700 dark:text-zinc-200">{t.title}</p>
                  <span className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${priorityColor(t.priority)}`}>
                    {t.priority}
                  </span>
                </div>
              ))}
              {groups[col.key].length === 0 && <p className="text-xs text-zinc-300 dark:text-zinc-600">Empty</p>}
            </div>
          </div>
        ))}
      </div>
    </WidgetCard>
  );
}
