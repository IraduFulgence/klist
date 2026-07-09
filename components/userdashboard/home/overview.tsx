"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

export default function Overview() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await logout();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">Overview</h1>
      {user && (
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Signed in as {user.name}
        </p>
      )}
      <button
        type="button"
        onClick={handleLogout}
        disabled={loading}
        className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {loading ? "Signing out…" : "Sign out"}
      </button>
    </div>
  );
}
