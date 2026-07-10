"use client";

import { useEffect, useState } from "react";
import * as api from "@/lib/api";
import type { Activity } from "@/lib/api";
import { activityColor, activityLabel, formatDateTime } from "@/lib/task-utils";
import WidgetCard from "./WidgetCard";

export default function ActivityFeedWidget() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .getActivities()
      .then((data) => {
        if (!cancelled) setActivities(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <WidgetCard title="Recent Activity">
      {loading ? (
        <p className="text-sm text-zinc-400">Loading…</p>
      ) : activities.length === 0 ? (
        <p className="text-sm text-zinc-400">No activity yet.</p>
      ) : (
        <ul className="max-h-80 space-y-3 overflow-y-auto">
          {activities.map((a) => (
            <li key={a.id} className="flex items-start gap-3">
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${activityColor(a.action)}`} />
              <div className="min-w-0">
                <p className="truncate text-sm text-zinc-700 dark:text-zinc-200">
                  <span className="font-medium">{activityLabel(a.action)}</span>{" "}
                  <span className="text-zinc-500 dark:text-zinc-400">{a.task_title}</span>
                </p>
                <p className="truncate text-xs text-zinc-400">
                  {a.user?.name ? `${a.user.name} · ` : ""}
                  {formatDateTime(a.created_at)}
                  {a.project ? ` · ${a.project.name}` : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </WidgetCard>
  );
}
