"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  sendClientPortalInviteAction,
  sendPasswordResetForClientAction,
} from "@/app/admin/actions/portal-hub";

export default function CrmPortalActions({
  clientId,
  projects,
}: {
  clientId: string;
  projects: { id: string; projectName: string | null }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [projectId, setProjectId] = useState(projects[0]?.id || "");
  const [status, setStatus] = useState("");

  return (
    <div className="flex flex-wrap items-center gap-2">
      {projects.length > 0 && (
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="border border-white/15 bg-black/40 px-2 py-1.5 text-xs"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.projectName || "Untitled project"}
            </option>
          ))}
        </select>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setStatus("");
            try {
              await sendClientPortalInviteAction(clientId, projectId || null);
              setStatus("Access link sent.");
              router.refresh();
            } catch (err) {
              setStatus(err instanceof Error ? err.message : "Failed to send.");
            }
          })
        }
        className="border border-[#fdf0d5]/50 px-3 py-1.5 text-xs text-[#fdf0d5] disabled:opacity-50"
      >
        Send access link
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setStatus("");
            try {
              await sendPasswordResetForClientAction(clientId);
              setStatus("Password reset email sent.");
            } catch (err) {
              setStatus(err instanceof Error ? err.message : "Failed to send.");
            }
          })
        }
        className="border border-white/20 px-3 py-1.5 text-xs text-white/70 disabled:opacity-50"
      >
        Send password reset
      </button>
      {status && <span className="text-xs text-white/50">{status}</span>}
    </div>
  );
}
