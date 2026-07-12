"use client";

import { useEffect, useState } from "react";
import * as api from "@/lib/api";
import type { User } from "@/lib/api";
import { PencilIcon, PlusIcon, UsersIcon } from "@/components/userdashboard/layout/icons";
import EmployeeFormModal from "./EmployeeFormModal";

const ROLE_LABEL: Record<User["role"], string> = {
  admin: "Admin",
  project_manager: "Project Manager",
  user: "Team Member",
};

export default function EmployeesView() {
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const [editing, setEditing] = useState<User | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getEmployees()
      .then((data) => {
        if (!cancelled) setEmployees(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function upsert(employee: User) {
    setEmployees((prev) => {
      const exists = prev.some((e) => e.id === employee.id);
      return exists ? prev.map((e) => (e.id === employee.id ? employee : e)) : [employee, ...prev];
    });
  }

  async function toggleActive(employee: User) {
    const updated = await api.setEmployeeActive(employee.id, !(employee.is_active ?? true));
    upsert(updated);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Employees</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Manage everyone in your organization.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setModalKey((k) => k + 1);
            setModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <PlusIcon className="h-4 w-4" />
          New Employee
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-400">Loading employees…</p>
      ) : employees.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-400 dark:border-zinc-700">
          No employees yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {employees.map((employee) => (
            <div
              key={employee.id}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-zinc-900 dark:text-zinc-100">{employee.name}</p>
                  <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">{employee.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(employee);
                    setModalKey((k) => k + 1);
                    setModalOpen(true);
                  }}
                  aria-label="Edit employee"
                  className="shrink-0 rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  {ROLE_LABEL[employee.role]}
                </span>
                {employee.department && (
                  <span className="flex items-center gap-1 text-zinc-400">
                    <UsersIcon className="h-3.5 w-3.5" />
                    {employee.department.name}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => toggleActive(employee)}
                className={`mt-4 w-full rounded-lg border px-3 py-1.5 text-xs font-medium ${
                  employee.is_active === false
                    ? "border-green-200 text-green-700 hover:bg-green-50 dark:border-green-900 dark:text-green-400 dark:hover:bg-green-950/50"
                    : "border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
              >
                {employee.is_active === false ? "Reactivate" : "Deactivate"}
              </button>
            </div>
          ))}
        </div>
      )}

      <EmployeeFormModal key={modalKey} open={modalOpen} onClose={() => setModalOpen(false)} onSaved={upsert} employee={editing} />
    </div>
  );
}
