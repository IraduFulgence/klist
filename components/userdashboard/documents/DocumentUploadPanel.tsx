"use client";

import { useEffect, useRef, useState } from "react";
import * as api from "@/lib/api";
import type { Project, ProjectFile } from "@/lib/api";
import { usePermission } from "@/lib/permissions";
import { formatDate } from "@/lib/task-utils";
import { DocumentIcon, PlusIcon, TrashIcon } from "@/components/userdashboard/layout/icons";

export default function DocumentUploadPanel({ project }: { project: Project }) {
  const canUploadProjectDocs = usePermission("project:edit", { project });
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getProjectFiles(project.id)
      .then((data) => {
        if (!cancelled) setFiles(data.filter((f) => !f.task_id));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [project.id]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const saved = await api.uploadProjectFile(project.id, file);
      setFiles((prev) => [saved, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDelete(file: ProjectFile) {
    if (!confirm(`Delete "${file.file_name}"?`)) return;
    await api.deleteProjectFile(file.id);
    setFiles((prev) => prev.filter((f) => f.id !== file.id));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Documents</h3>
        {canUploadProjectDocs && (
          <label className="flex cursor-pointer items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
            <PlusIcon className="h-3.5 w-3.5" />
            {uploading ? "Uploading…" : "Upload"}
            <input ref={inputRef} type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        )}
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      {loading ? (
        <p className="text-sm text-zinc-400">Loading documents…</p>
      ) : files.length === 0 ? (
        <p className="text-sm text-zinc-400">No project documents yet.</p>
      ) : (
        <ul className="space-y-2">
          {files.map((f) => (
            <li
              key={f.id}
              className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <a
                href={api.getFileDownloadUrl(f.id)}
                className="flex min-w-0 items-center gap-2 text-sm font-medium text-zinc-700 hover:underline dark:text-zinc-200"
              >
                <DocumentIcon className="h-4 w-4 shrink-0 text-zinc-400" />
                <span className="truncate">{f.file_name}</span>
              </a>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs text-zinc-400">{formatDate(f.created_at)}</span>
                <button
                  type="button"
                  onClick={() => handleDelete(f)}
                  aria-label="Delete file"
                  className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/50"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
