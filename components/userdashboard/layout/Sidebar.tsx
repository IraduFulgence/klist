"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import type { Role } from "@/lib/api";
import {
  BuildingIcon,
  ChartBarIcon,
  FolderIcon,
  GearIcon,
  HomeIcon,
  TasksIcon,
  UsersIcon,
} from "./icons";

type NavItem = { href: string; label: string; icon: typeof HomeIcon };

const HOME: NavItem = { href: "/dashboard/home", label: "Home", icon: HomeIcon };
const PROJECTS: NavItem = { href: "/dashboard/projects", label: "Projects", icon: FolderIcon };
const TASKS: NavItem = { href: "/dashboard/tasks", label: "My Tasks", icon: TasksIcon };
const REPORTS: NavItem = { href: "/dashboard/reports", label: "Reports", icon: ChartBarIcon };

const ROLE_NAV: Record<Role, NavItem[]> = {
  admin: [
    HOME,
    PROJECTS,
    { href: "/dashboard/team", label: "Employees", icon: UsersIcon },
    { href: "/dashboard/departments", label: "Departments", icon: BuildingIcon },
    REPORTS,
    { href: "/dashboard/settings", label: "Settings", icon: GearIcon },
  ],
  project_manager: [HOME, PROJECTS, TASKS, REPORTS],
  user: [HOME, TASKS, PROJECTS],
};

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const nav = user ? ROLE_NAV[user.role] : [HOME];

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center gap-2 px-6 py-5">
        <div className="h-8 w-8 rounded-lg bg-zinc-900" />
        <span className="text-lg font-semibold text-zinc-900">Klist</span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname?.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-gray-500 text-white"
                  : "text-black hover:bg-gray-400"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-400 p-4">
        {user && (
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-sm font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-zinc-900">{user.name}</p>
              <p className="truncate text-xs text-zinc-800">{user.email}</p>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => logout()}
          className="w-full rounded-lg bg-red-800 border border-zinc-200 px-3 py-2 text-sm font-medium text-white hover:bg-red-500"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
