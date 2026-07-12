"use client";

import { useEffect, useMemo, useState } from "react";
import * as api from "@/lib/api";
import type { Project, ProjectExpense } from "@/lib/api";
import { usePermission } from "@/lib/permissions";
import { formatDate } from "@/lib/task-utils";
import { PlusIcon, TrashIcon } from "@/components/userdashboard/layout/icons";
import ExpenseFormModal from "./ExpenseFormModal";

const STATUS_COLOR: Record<ProjectExpense["status"], string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
};

export default function BudgetPanel({ project }: { project: Project }) {
  const canManage = usePermission("budget:manage", { project });
  const [expenses, setExpenses] = useState<ProjectExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalKey, setModalKey] = useState(0);

  useEffect(() => {
    if (!canManage) return;
    let cancelled = false;
    api
      .getExpenses(project.id)
      .then((data) => {
        if (!cancelled) setExpenses(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [project.id, canManage]);

  const spent = useMemo(
    () => expenses.filter((e) => e.status === "approved").reduce((sum, e) => sum + Number(e.amount), 0),
    [expenses]
  );
  const budget = Number(project.budget);
  const pct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;

  function upsert(expense: ProjectExpense) {
    setExpenses((prev) => {
      const exists = prev.some((e) => e.id === expense.id);
      return exists ? prev.map((e) => (e.id === expense.id ? expense : e)) : [expense, ...prev];
    });
  }

  async function handleDelete(expense: ProjectExpense) {
    if (!confirm(`Delete expense "${expense.expense_name}"?`)) return;
    await api.deleteExpense(expense.id);
    setExpenses((prev) => prev.filter((e) => e.id !== expense.id));
  }

  if (!canManage) {
    return <p className="text-sm text-zinc-400">Budget details are only visible to the project manager and admins.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Budget</h3>
        <button
          type="button"
          onClick={() => {
            setModalKey((k) => k + 1);
            setModalOpen(true);
          }}
          className="flex items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          Add expense
        </button>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-1 flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>${spent.toLocaleString()} spent of ${budget.toLocaleString()}</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className={`h-full rounded-full ${pct >= 90 ? "bg-red-500" : "bg-zinc-900 dark:bg-zinc-100"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-400">Loading expenses…</p>
      ) : expenses.length === 0 ? (
        <p className="text-sm text-zinc-400">No expenses logged yet.</p>
      ) : (
        <ul className="space-y-2">
          {expenses.map((e) => (
            <li
              key={e.id}
              className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{e.expense_name}</p>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${STATUS_COLOR[e.status]}`}>{e.status}</span>
                </div>
                <p className="text-xs text-zinc-400">{formatDate(e.expense_date)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">${Number(e.amount).toLocaleString()}</span>
                <button
                  type="button"
                  onClick={() => handleDelete(e)}
                  aria-label="Delete expense"
                  className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ExpenseFormModal key={modalKey} open={modalOpen} onClose={() => setModalOpen(false)} onSaved={upsert} projectId={project.id} />
    </div>
  );
}
