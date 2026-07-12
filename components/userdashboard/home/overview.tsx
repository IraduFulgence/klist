"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import AdminOverview from "./AdminOverview";
import ProjectManagerOverview from "./ProjectManagerOverview";
import TeamMemberOverview from "./TeamMemberOverview";

export default function Overview() {
  const { role } = useAuth();

  if (role === "admin") return <AdminOverview />;
  if (role === "project_manager") return <ProjectManagerOverview />;
  return <TeamMemberOverview />;
}
