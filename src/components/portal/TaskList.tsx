"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { completeTaskAction, uploadTaskFileAction } from "@/app/portal/actions/hub";

export default function TaskList({
  onboardingId,
  tasks,
}: {
  onboardingId: string;
  tasks: {
    id: string;
    type: string;
    status: string;
    title: string;
    description: string | null;
    linkUrl: string | null;
    dueAt: Date | null;
  }[];
}) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [note, setNote] = useState<Record<string, string>>({});

  const pending = tasks.filter((t) => t.status === "pending");

  if (pending.length === 0) {
    return <p className="text-sm text-white/40">No action items right now.</p>;
  }

  return (
    <ul className="space-y-3">
      {pending.map((task) => (
        <li key={task.id} className="border border-white/10 bg-[#141414] p-4">
          <div className="flex flex-wrap items-baseline gap-2">
            <p className="font-medium">{task.title}</p>
            <span className="text-[10px] uppercase tracking-wider text-white/40">{task.type}</span>
            {task.dueAt && (
              <span className="text-[10px] text-white/30">Due {task.dueAt.toLocaleDateString()}</span>
            )}
          </div>
          {task.description && (
            <p className="mt-2 text-sm text-white/60">{task.description}</p>
          )}
          {task.linkUrl && (
            <a
              href={task.linkUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-sm text-[#fdf0d5] hover:underline"
            >
              Open link
            </a>
          )}
          {task.type === "approval" && (
            <textarea
              value={note[task.id] || ""}
              onChange={(e) => setNote((n) => ({ ...n, [task.id]: e.target.value }))}
              placeholder="Optional note…"
              rows={2}
              className="mt-3 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm"
            />
          )}
          {task.type === "upload" && (
            <form
              className="mt-3"
              onSubmit={async (e) => {
                e.preventDefault();
                setLoadingId(task.id);
                const fd = new FormData(e.currentTarget);
                try {
                  await uploadTaskFileAction(task.id, onboardingId, fd);
                  router.refresh();
                } finally {
                  setLoadingId(null);
                }
              }}
            >
              <input
                name="file"
                type="file"
                required
                className="w-full text-sm text-white/70"
              />
              <button
                type="submit"
                disabled={loadingId === task.id}
                className="mt-2 bg-[#fdf0d5] px-3 py-1.5 text-xs font-semibold text-black disabled:opacity-50"
              >
                {loadingId === task.id ? "Uploading…" : "Upload & complete"}
              </button>
            </form>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {task.type === "approval" ? (
              <>
                <button
                  type="button"
                  disabled={loadingId === task.id}
                  onClick={async () => {
                    setLoadingId(task.id);
                    await completeTaskAction(task.id, onboardingId, {
                      approved: true,
                      note: note[task.id],
                    });
                    router.refresh();
                    setLoadingId(null);
                  }}
                  className="bg-[#fdf0d5] px-3 py-1.5 text-xs font-semibold text-black disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  type="button"
                  disabled={loadingId === task.id}
                  onClick={async () => {
                    setLoadingId(task.id);
                    await completeTaskAction(task.id, onboardingId, {
                      approved: false,
                      note: note[task.id],
                    });
                    router.refresh();
                    setLoadingId(null);
                  }}
                  className="border border-white/20 px-3 py-1.5 text-xs text-white/70"
                >
                  Request changes
                </button>
              </>
            ) : task.type !== "upload" ? (
              <button
                type="button"
                disabled={loadingId === task.id}
                onClick={async () => {
                  setLoadingId(task.id);
                  await completeTaskAction(task.id, onboardingId);
                  router.refresh();
                  setLoadingId(null);
                }}
                className="bg-[#fdf0d5] px-3 py-1.5 text-xs font-semibold text-black disabled:opacity-50"
              >
                {loadingId === task.id
                  ? "Saving…"
                  : task.type === "review"
                    ? "Mark reviewed"
                    : "Mark complete"}
              </button>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
