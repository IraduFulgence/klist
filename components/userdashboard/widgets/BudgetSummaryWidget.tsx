"use client";

import WidgetCard from "./WidgetCard";

export type BudgetSummaryItem = { projectId: number; projectName: string; budget: number; spent: number };

export default function BudgetSummaryWidget({ items }: { items: BudgetSummaryItem[] }) {
  return (
    <WidgetCard title="Budget vs Spent">
      {items.length === 0 ? (
        <p className="text-sm text-zinc-400">No managed projects yet.</p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const pct = item.budget > 0 ? Math.min(100, Math.round((item.spent / item.budget) * 100)) : 0;
            return (
              <div key={item.projectId}>
                <div className="mb-1 flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="truncate">{item.projectName}</span>
                  <span>
                    ${item.spent.toLocaleString()} / ${item.budget.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className={`h-full rounded-full ${pct >= 90 ? "bg-red-500" : "bg-zinc-900 dark:bg-zinc-100"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </WidgetCard>
  );
}
