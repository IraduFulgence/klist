"use client";

import { useEffect, useState } from "react";
import * as api from "@/lib/api";
import type { Project, User } from "@/lib/api";
import { useAuth } from "@/components/auth/AuthProvider";
import { TrashIcon, XIcon } from "../layout/icons";

export default function MembersModal({
  open,
  onClose,
  project,
}: {
  open: boolean;
  onClose: () => void;
  project: Project;
}) {
  const { user } = useAuth();
  const [members, setMembers] = useState<(User & { pivot: { role: string } })[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isOwner = user?.id === project.owner_id;

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    api.getProjectMembers(project.id).then((data) => {
      if (cancelled) return;
      setMembers(data);
      setError(null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [open, project.id]);

  if (!open) return null;

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const updated = await api.addProjectMember(project.id, email);
      setMembers(updated);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add member");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(memberId: number) {
    await api.removeProjectMember(project.id, memberId);
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button aria-label="Close" className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl dark:bg-zinc-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Members</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        {isOwner && (
          <form onSubmit={handleInvite} className="mb-4 flex gap-2">
            <input
              type="email"
              required
              placeholder="teammate@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <button
              type="submit"
              disabled={saving}
              className="shrink-0 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Invite
            </button>
          </form>
        )}
        {error && <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

        {loading ? (
          <p className="text-sm text-zinc-400">Loading members…</p>
        ) : (
          <ul className="space-y-2">
            {members.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{m.name}</p>
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{m.email}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="rounded bg-zinc-100 px-2 py-0.5 text-[10px] font-medium uppercase text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                    {m.pivot.role}
                  </span>
                  {isOwner && m.pivot.role !== "owner" && (
                    <button
                      type="button"
                      onClick={() => handleRemove(m.id)}
                      aria-label={`Remove ${m.name}`}
                      className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
