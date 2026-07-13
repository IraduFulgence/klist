"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as api from "@/lib/api";
import type { Project, Task } from "@/lib/api";
import { FolderIcon, SearchIcon, TasksIcon } from "./icons";

export default function GlobalSearch() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([api.getTasks(), api.getProjects()])
      .then(([taskData, projectData]) => {
        setTasks(taskData);
        setProjects(projectData);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { tasks: [], projects: [] };
    return {
      tasks: tasks.filter((t) => t.title.toLowerCase().includes(q)).slice(0, 5),
      projects: projects.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 5),
    };
  }, [query, tasks, projects]);

  const hasResults = results.tasks.length > 0 || results.projects.length > 0;

  function goToTasks() {
    setOpen(false);
    setQuery("");
    router.push("/dashboard/tasks");
  }

  function goToProject(id: number) {
    setOpen(false);
    setQuery("");
    router.push(`/dashboard/projects/${id}`);
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={loaded ? "Search tasks, projects…" : "Loading…"}
          className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:bg-white focus:outline-none"
        />
      </div>

      {open && query.trim() && (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 max-h-96 overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-lg">
          {!hasResults ? (
            <p className="px-4 py-3 text-sm text-zinc-400">No matches for &ldquo;{query}&rdquo;</p>
          ) : (
            <>
              {results.tasks.length > 0 && (
                <div className="p-2">
                  <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">Tasks</p>
                  {results.tasks.map((task) => (
                    <button
                      key={`task-${task.id}`}
                      type="button"
                      onClick={goToTasks}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100"
                    >
                      <TasksIcon className="h-4 w-4 shrink-0 text-zinc-400" />
                      <span className="truncate">{task.title}</span>
                    </button>
                  ))}
                </div>
              )}
              {results.projects.length > 0 && (
                <div className="border-t border-zinc-100 p-2">
                  <p className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-zinc-400">Projects</p>
                  {results.projects.map((project) => (
                    <button
                      key={`project-${project.id}`}
                      type="button"
                      onClick={() => goToProject(project.id)}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100"
                    >
                      <FolderIcon className="h-4 w-4 shrink-0 text-zinc-400" />
                      <span className="truncate">{project.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
