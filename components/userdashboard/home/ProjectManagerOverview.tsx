"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import * as api from "@/lib/api";
import type { Milestone, Project, Task } from "@/lib/api";
import ActivityFeedWidget from "@/components/userdashboard/widgets/ActivityFeedWidget";
import KanbanPreviewWidget from "@/components/userdashboard/widgets/KanbanPreviewWidget";
import TaskSummaryWidget from "@/components/userdashboard/widgets/TaskSummaryWidget";
import BudgetSummaryWidget, { type BudgetSummaryItem } from "@/components/userdashboard/widgets/BudgetSummaryWidget";
import MilestoneProgressWidget from "@/components/userdashboard/widgets/MilestoneProgressWidget";

export default function ProjectManagerOverview() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [budgetItems, setBudgetItems] = useState<BudgetSummaryItem[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [taskData, projects] = await Promise.all([api.getTasks(), api.getProjects()]);
      if (cancelled) return;
      setTasks(taskData);

      const managed = projects.filter((p: Project) => p.manager_id === user?.id);
      const reports = await Promise.all(
        managed.map((p) =>
          api
            .getProjectReport(p.id)
            .then((report) => ({ project: p, report }))
            .catch(() => null)
        )
      );
      if (cancelled) return;

      const items: BudgetSummaryItem[] = [];
      const allMilestones: Milestone[] = [];
      for (const entry of reports) {
        if (!entry) continue;
        items.push({ projectId: entry.project.id, projectName: entry.project.name, budget: entry.report.budget, spent: entry.report.spent });
        allMilestones.push(...entry.report.milestones);
      }
      setBudgetItems(items);
      setMilestones(allMilestones);
    }

    load().finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Welcome back{user ? `, ${user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Here&apos;s the state of your projects.</p>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-400">Loading dashboard…</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-3">
            <TaskSummaryWidget tasks={tasks} />
          </div>
          <div className="xl:col-span-2">
            <BudgetSummaryWidget items={budgetItems} />
          </div>
          <div>
            <MilestoneProgressWidget milestones={milestones} />
          </div>
          <div className="xl:col-span-2">
            <KanbanPreviewWidget tasks={tasks} />
          </div>
          <div>
            <ActivityFeedWidget />
          </div>
        </div>
      )}
    </div>
  );
}
