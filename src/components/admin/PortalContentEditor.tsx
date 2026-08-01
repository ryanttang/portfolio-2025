"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createMilestoneAction,
  createUpdateAction,
  deleteMilestoneAction,
  deleteUpdateAction,
  updateMilestoneAction,
} from "@/app/admin/actions/onboarding";
import { MILESTONE_STATUSES } from "@/lib/onboarding/types";

export default function PortalContentEditor({
  clientId,
  updates,
  milestones,
}: {
  clientId: string;
  updates: {
    id: string;
    title: string;
    body: string;
    createdAt: Date;
  }[];
  milestones: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    sortOrder: number;
  }[];
}) {
  const router = useRouter();
  const [updateTitle, setUpdateTitle] = useState("");
  const [updateBody, setUpdateBody] = useState("");
  const [milestoneTitle, setMilestoneTitle] = useState("");

  return (
    <div className="mt-4 grid gap-6 lg:grid-cols-2">
      <section className="border border-white/10 bg-[#141414] p-4">
        <h3 className="text-sm font-semibold">Updates</h3>
        <div className="mt-3 space-y-2">
          <input
            value={updateTitle}
            onChange={(e) => setUpdateTitle(e.target.value)}
            placeholder="Title"
            className="w-full border border-white/15 bg-black/40 px-3 py-2 text-sm"
          />
          <textarea
            value={updateBody}
            onChange={(e) => setUpdateBody(e.target.value)}
            placeholder="Update for the client…"
            rows={3}
            className="w-full border border-white/15 bg-black/40 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={async () => {
              if (!updateTitle.trim()) return;
              await createUpdateAction(clientId, updateTitle.trim(), updateBody);
              setUpdateTitle("");
              setUpdateBody("");
              router.refresh();
            }}
            className="bg-[#e6c47a] px-3 py-1.5 text-xs font-semibold text-black"
          >
            Post update
          </button>
        </div>
        <ul className="mt-4 space-y-3">
          {updates.map((u) => (
            <li key={u.id} className="border-t border-white/10 pt-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{u.title}</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-white/60">{u.body}</p>
                  <p className="mt-1 text-[10px] text-white/30">
                    {new Date(u.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await deleteUpdateAction(u.id, clientId);
                    router.refresh();
                  }}
                  className="text-xs text-red-300"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
          {updates.length === 0 && (
            <li className="text-sm text-white/40">No updates yet.</li>
          )}
        </ul>
      </section>

      <section className="border border-white/10 bg-[#141414] p-4">
        <h3 className="text-sm font-semibold">Milestones</h3>
        <div className="mt-3 flex gap-2">
          <input
            value={milestoneTitle}
            onChange={(e) => setMilestoneTitle(e.target.value)}
            placeholder="Milestone title"
            className="flex-1 border border-white/15 bg-black/40 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={async () => {
              if (!milestoneTitle.trim()) return;
              await createMilestoneAction(clientId, { title: milestoneTitle.trim() });
              setMilestoneTitle("");
              router.refresh();
            }}
            className="bg-[#e6c47a] px-3 py-1.5 text-xs font-semibold text-black"
          >
            Add
          </button>
        </div>
        <ul className="mt-4 space-y-3">
          {milestones.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
              <input
                defaultValue={m.title}
                onBlur={async (e) => {
                  if (e.target.value !== m.title) {
                    await updateMilestoneAction(m.id, clientId, { title: e.target.value });
                    router.refresh();
                  }
                }}
                className="min-w-[140px] flex-1 border border-white/15 bg-black/40 px-2 py-1 text-sm"
              />
              <select
                defaultValue={m.status}
                onChange={async (e) => {
                  await updateMilestoneAction(m.id, clientId, { status: e.target.value });
                  router.refresh();
                }}
                className="border border-white/15 bg-black/40 px-2 py-1 text-xs"
              >
                {MILESTONE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace("_", " ")}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={async () => {
                  await deleteMilestoneAction(m.id, clientId);
                  router.refresh();
                }}
                className="text-xs text-red-300"
              >
                Delete
              </button>
            </li>
          ))}
          {milestones.length === 0 && (
            <li className="text-sm text-white/40">No milestones yet.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
