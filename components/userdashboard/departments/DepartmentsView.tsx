"use client";

import { useEffect, useState } from "react";
import * as api from "@/lib/api";
import type { Department } from "@/lib/api";
import { PencilIcon, PlusIcon, TrashIcon, UsersIcon } from "@/components/userdashboard/layout/icons";
import DepartmentFormModal from "./DepartmentFormModal";

export default function DepartmentsView() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const [editing, setEditing] = useState<Department | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getDepartments()
      .then((data) => {
        if (!cancelled) setDepartments(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function upsert(department: Department) {
    setDepartments((prev) => {
      const exists = prev.some((d) => d.id === department.id);
      return exists ? prev.map((d) => (d.id === department.id ? department : d)) : [...prev, department];
    });
  }

  async function handleDelete(department: Department) {
    if (!confirm(`Delete department "${department.name}"?`)) return;
    await api.deleteDepartment(department.id);
    setDepartments((prev) => prev.filter((d) => d.id !== department.id));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Departments</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Organize employees into departments.</p>
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
          New Department
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-400">Loading departments…</p>
      ) : departments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-400 dark:border-zinc-700">
          No departments yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {departments.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-zinc-900 dark:text-zinc-100">{d.name}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-zinc-400">
                  <UsersIcon className="h-3.5 w-3.5" />
                  {d.users_count ?? 0} employees
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(d);
                    setModalKey((k) => k + 1);
                    setModalOpen(true);
                  }}
                  aria-label="Edit department"
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(d)}
                  aria-label="Delete department"
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <DepartmentFormModal key={modalKey} open={modalOpen} onClose={() => setModalOpen(false)} onSaved={upsert} department={editing} />
    </div>
  );
}
