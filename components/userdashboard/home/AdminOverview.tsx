"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import * as api from "@/lib/api";
import type { OrganizationReport } from "@/lib/api";
import ActivityFeedWidget from "@/components/userdashboard/widgets/ActivityFeedWidget";
import OrgStatsWidget from "@/components/userdashboard/widgets/OrgStatsWidget";

export default function AdminOverview() {
  const { user } = useAuth();
  const [report, setReport] = useState<OrganizationReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .getOrganizationReport()
      .then((data) => {
        if (!cancelled) setReport(data);
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
        <h1 className="text-2xl font-semibold text-zinc-900">
          Welcome back{user ? `, ${user.name.split(" ")[0]}` : ""}
        </h1>
        
      </div>

      {loading || !report ? (
        <p className="text-sm text-zinc-400">Loading dashboard…</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-3">
            <OrgStatsWidget report={report} />
          </div>
          <div className="xl:col-span-3">
            <ActivityFeedWidget />
          </div>
        </div>
      )}
    </div>
  );
}
