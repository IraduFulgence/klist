"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import * as api from "@/lib/api";
import type { Project } from "@/lib/api";
import { usePermission } from "@/lib/permissions";
import { PlusIcon, UsersIcon } from "@/components/userdashboard/layout/icons";
import ProjectFormModal from "./ProjectFormModal";

export default function ProjectsView() {
  const canCreateProject = usePermission("project:create");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalKey, setModalKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api
      .getProjects()
      .then((data) => {
        if (!cancelled) setProjects(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Projects</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Boards you own or collaborate on.</p>
        </div>
        {canCreateProject && (
          <button
            type="button"
            onClick={() => {
              setModalKey((k) => k + 1);
              setModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <PlusIcon className="h-4 w-4" />
            New Project
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-zinc-400">Loading projects…</p>
      ) : projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-400 dark:border-zinc-700">
          No projects yet. Create one to start a board with your team.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}`}
              className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: project.color }} />
                <h3 className="truncate font-semibold text-zinc-900 group-hover:underline dark:text-zinc-100">
                  {project.name}
                </h3>
              </div>
              {project.description && (
                <p className="mb-4 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">{project.description}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-zinc-400">
                <span>{project.tasks_count ?? 0} tasks</span>
                <span className="flex items-center gap-1">
                  <UsersIcon className="h-3.5 w-3.5" />
                  {project.members_count ?? 1}
                </span>
                {project.manager && <span className="truncate">Manager: {project.manager.name}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}

      <ProjectFormModal
        key={modalKey}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={(project) => setProjects((prev) => [project, ...prev])}
      />
    </div>
  );
}
