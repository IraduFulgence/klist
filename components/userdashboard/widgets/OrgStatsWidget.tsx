"use client";

import type { OrganizationReport } from "@/lib/api";
import WidgetCard from "./WidgetCard";

export default function OrgStatsWidget({ report }: { report: OrganizationReport }) {
  const cards: { label: string; value: number | string; color: string }[] = [
    { label: "Projects", value: report.total_projects, color: "text-zinc-900 dark:text-zinc-100" },
    { label: "Employees", value: report.total_employees, color: "text-blue-600 dark:text-blue-400" },
    { label: "Departments", value: report.total_departments, color: "text-purple-600 dark:text-purple-400" },
    { label: "Overdue tasks", value: report.overdue_tasks_count, color: "text-red-600 dark:text-red-400" },
  ];

  return (
    <WidgetCard title="Organization Overview">
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
          <span>Task completion rate</span>
          <span>{report.tasks_completed_pct}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-zinc-900 transition-all dark:bg-zinc-100"
            style={{ width: `${report.tasks_completed_pct}%` }}
          />
        </div>
      </div>
    </WidgetCard>
  );
}
