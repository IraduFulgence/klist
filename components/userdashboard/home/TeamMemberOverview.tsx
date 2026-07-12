"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import * as api from "@/lib/api";
import type { Task } from "@/lib/api";
import ActivityFeedWidget from "@/components/userdashboard/widgets/ActivityFeedWidget";
import CalendarWidget from "@/components/userdashboard/widgets/CalendarWidget";
import KanbanPreviewWidget from "@/components/userdashboard/widgets/KanbanPreviewWidget";
import TaskSummaryWidget from "@/components/userdashboard/widgets/TaskSummaryWidget";

export default function TeamMemberOverview() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .getTasks()
      .then((data) => {
        if (!cancelled) setTasks(data);
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
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Welcome back{user ? `, ${user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Here&apos;s what&apos;s happening across your work.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-zinc-400">Loading dashboard…</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-3">
            <TaskSummaryWidget tasks={tasks} />
          </div>
          <div className="xl:col-span-2">
            <CalendarWidget tasks={tasks} />
          </div>
          <div>
            <ActivityFeedWidget />
          </div>
          <div className="xl:col-span-3">
            <KanbanPreviewWidget tasks={tasks} />
          </div>
        </div>
      )}
    </div>
  );
}
