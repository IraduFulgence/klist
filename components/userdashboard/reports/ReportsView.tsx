"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import * as api from "@/lib/api";
import type { OrganizationReport, Project, ProjectReport } from "@/lib/api";
import { formatDate } from "@/lib/task-utils";
import OrgStatsWidget from "@/components/userdashboard/widgets/OrgStatsWidget";

function ProjectReportPanel({ project }: { project: Project }) {
  const [report, setReport] = useState<ProjectReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .getProjectReport(project.id)
      .then((data) => {
        if (!cancelled) setReport(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [project.id]);

  if (loading || !report) return <p className="text-sm text-zinc-400">Loading report…</p>;

  return (
    <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{project.name}</h3>

      <div>
        <div className="mb-1 flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>
            ${report.spent.toLocaleString()} spent of ${report.budget.toLocaleString()}
          </span>
          <span>${report.remaining.toLocaleString()} remaining</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-zinc-900 dark:bg-zinc-100"
            style={{ width: `${report.budget > 0 ? Math.min(100, Math.round((report.spent / report.budget) * 100)) : 0}%` }}
          />
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase text-zinc-400">Team workload</p>
        <ul className="space-y-1.5">
          {report.team_workload.map((w) => (
            <li key={w.user.id} className="flex justify-between text-sm text-zinc-600 dark:text-zinc-300">
              <span>{w.user.name}</span>
              <span className="text-zinc-400">
                {w.open_tasks_count} open · {w.completed_tasks_count} done
              </span>
            </li>
          ))}
        </ul>
      </div>

      {report.overdue_tasks.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-red-500">Overdue tasks</p>
          <ul className="space-y-1 text-sm text-red-600 dark:text-red-400">
            {report.overdue_tasks.map((t) => (
              <li key={t.id}>
                {t.title} — due {formatDate(t.due_date)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function ReportsView() {
  const { user, isAdmin } = useAuth();
  const [orgReport, setOrgReport] = useState<OrganizationReport | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (isAdmin) {
        const report = await api.getOrganizationReport();
        if (!cancelled) setOrgReport(report);
      }
      const projectData = await api.getProjects();
      if (cancelled) return;
      const reportable = isAdmin ? projectData : projectData.filter((p) => p.manager_id === user?.id);
      setProjects(reportable);
      if (reportable.length > 0) setSelectedProjectId(reportable[0].id);
    }
    load().finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [isAdmin, user?.id]);

  const selectedProject = projects.find((p) => p.id === selectedProjectId) ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Reports</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {isAdmin ? "Organization-wide performance and project reports." : "Reports for the projects you manage."}
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-400">Loading reports…</p>
      ) : (
        <div className="space-y-6">
          {isAdmin && orgReport && <OrgStatsWidget report={orgReport} />}

          <div className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Project report</h2>
              {projects.length > 0 && (
                <select
                  value={selectedProjectId ?? ""}
                  onChange={(e) => setSelectedProjectId(Number(e.target.value))}
                  className="rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            {selectedProject ? (
              <ProjectReportPanel project={selectedProject} />
            ) : (
              <p className="text-sm text-zinc-400">No projects to report on yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
