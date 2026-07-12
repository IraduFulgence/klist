"use client";

import { useEffect, useState } from "react";
import * as api from "@/lib/api";
import type { Comment } from "@/lib/api";
import { useAuth } from "@/components/auth/AuthProvider";
import { formatDateTime } from "@/lib/task-utils";
import { TrashIcon } from "@/components/userdashboard/layout/icons";

export default function CommentThread({ taskId }: { taskId: number }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .getComments(taskId)
      .then((data) => {
        if (!cancelled) setComments(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [taskId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    try {
      const saved = await api.createComment(taskId, content.trim());
      setComments((prev) => [...prev, saved]);
      setContent("");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(comment: Comment) {
    await api.deleteComment(comment.id);
    setComments((prev) => prev.filter((c) => c.id !== comment.id));
  }

  return (
    <div className="space-y-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Comments</h3>

      {loading ? (
        <p className="text-sm text-zinc-400">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-zinc-400">No comments yet.</p>
      ) : (
        <ul className="max-h-48 space-y-2 overflow-y-auto">
          {comments.map((c) => (
            <li key={c.id} className="flex items-start justify-between gap-2 rounded-lg bg-zinc-50 p-2.5 text-sm dark:bg-zinc-800/50">
              <div className="min-w-0">
                <p className="text-zinc-700 dark:text-zinc-200">{c.content}</p>
                <p className="mt-0.5 text-xs text-zinc-400">
                  {c.user?.name ?? "Someone"} · {formatDateTime(c.created_at)}
                </p>
              </div>
              {(c.user_id === user?.id || user?.role === "admin") && (
                <button
                  type="button"
                  onClick={() => handleDelete(c)}
                  aria-label="Delete comment"
                  className="shrink-0 rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a comment…"
          className="min-w-0 flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-zinc-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
        <button
          type="submit"
          disabled={saving}
          className="shrink-0 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Post
        </button>
      </form>
    </div>
  );
}
