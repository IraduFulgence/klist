import { useAuth } from "@/components/auth/AuthProvider";
import type { Project, User } from "@/lib/api";

export type PermissionAction =
  | "project:create"
  | "project:edit"
  | "project:delete"
  | "project:assignManager"
  | "employee:manage"
  | "department:manage"
  | "milestone:manage"
  | "task:assign"
  | "budget:manage"
  | "reports:view"
  | "settings:manage"
  | "document:upload"
  | "comment:create";

type PermissionContext = { project?: Project | null };

export function can(user: User | null, action: PermissionAction, ctx: PermissionContext = {}): boolean {
  if (!user) return false;

  const isProjectManagerOf = (project?: Project | null) =>
    Boolean(project && project.manager_id === user.id);

  switch (action) {
    case "project:create":
      return user.role === "admin" || user.role === "project_manager";
    case "project:edit":
    case "project:delete":
    case "milestone:manage":
    case "budget:manage":
      return user.role === "admin" || isProjectManagerOf(ctx.project);
    case "project:assignManager":
    case "employee:manage":
    case "department:manage":
    case "settings:manage":
      return user.role === "admin";
    case "task:assign":
      return user.role === "admin" || user.role === "project_manager" || isProjectManagerOf(ctx.project);
    case "reports:view":
      return user.role === "admin" || user.role === "project_manager";
    case "document:upload":
      return true;
    case "comment:create":
      return true;
    default:
      return false;
  }
}

export function usePermission(action: PermissionAction, ctx: PermissionContext = {}): boolean {
  const { user } = useAuth();
  return can(user, action, ctx);
}
