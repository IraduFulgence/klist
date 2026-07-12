"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import type { Role } from "@/lib/api";

export default function RoleGuard({
  allow,
  children,
}: {
  allow: Role[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { role, isLoading } = useAuth();

  const allowed = role !== null && allow.includes(role);

  useEffect(() => {
    if (!isLoading && !allowed) {
      router.replace("/dashboard/home");
    }
  }, [isLoading, allowed, router]);

  if (isLoading) {
    return <p className="text-sm text-zinc-400">Loading…</p>;
  }

  if (!allowed) return null;

  return <>{children}</>;
}
