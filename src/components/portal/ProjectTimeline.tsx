"use client";

import { useState } from "react";
import type { PortalTimelineEvent, PortalTimelineEventType } from "@/lib/portal/types";

const FILTERS: { id: "all" | PortalTimelineEventType; label: string }[] = [
  { id: "all", label: "All" },
  { id: "update", label: "Updates" },
  { id: "task", label: "Tasks" },
  { id: "meeting", label: "Meetings" },
  { id: "file", label: "Files" },
  { id: "message", label: "Messages" },
];

export default function ProjectTimeline({
  events,
  messagesEnabled = false,
}: {
  events: PortalTimelineEvent[];
  messagesEnabled?: boolean;
}) {
  const [filter, setFilter] = useState<"all" | PortalTimelineEventType>("all");
  const filters = messagesEnabled
    ? FILTERS
    : FILTERS.filter((f) => f.id !== "message");
  const visible =
    filter === "all" ? events : events.filter((e) => e.type === filter || e.type === "milestone");

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`px-2.5 py-1 text-[10px] uppercase tracking-wider ${
              filter === f.id
                ? "bg-[#fdf0d5] text-black"
                : "border border-white/15 text-white/50 hover:text-white/80"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <ul className="mt-4 space-y-3">
        {visible.map((e) => (
          <li key={`${e.type}-${e.id}`} className="rounded-sm border border-white/5 bg-white/[0.02] p-4">
            <div className="flex flex-wrap items-baseline gap-2">
              <p className="font-medium">{e.title}</p>
              <span className="text-[10px] uppercase tracking-wider text-white/30">{e.type}</span>
            </div>
            {e.body && (
              <p className="mt-2 whitespace-pre-wrap text-sm text-white/65">{e.body}</p>
            )}
            {e.type === "file" && typeof e.meta?.blobUrl === "string" && (
              <a
                href={e.meta.blobUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-sm text-[#fdf0d5] hover:underline"
              >
                Download
              </a>
            )}
            <p className="mt-2 text-[10px] text-white/30">{e.at.toLocaleString()}</p>
          </li>
        ))}
        {visible.length === 0 && (
          <li className="text-sm text-white/40">No activity yet for this filter.</li>
        )}
      </ul>
    </div>
  );
}
