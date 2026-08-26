"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  deleteOnboardingAction,
  startViewAsClientAction,
} from "@/app/admin/actions/onboarding";

export default function ProjectRowActions({
  projectId,
  projectName,
  clientId,
}: {
  projectId: string;
  projectName: string;
  clientId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [previewPending, startPreview] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/admin/onboarding/${projectId}`}
          className="border border-white/20 px-2.5 py-1 text-[11px] text-white/70 hover:border-white/40"
        >
          Edit
        </Link>
        <button
          type="button"
          disabled={previewPending}
          onClick={() => {
            startPreview(async () => {
              await startViewAsClientAction(clientId, { onboardingId: projectId });
            });
          }}
          className="border border-[#fdf0d5]/50 px-2.5 py-1 text-[11px] text-[#fdf0d5] disabled:opacity-50"
        >
          {previewPending ? "…" : "Preview"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (!confirm(`Delete “${projectName}”? This cannot be undone.`)) return;
            setError(null);
            startTransition(async () => {
              const res = await deleteOnboardingAction(projectId);
              if (!res.ok) {
                setError(res.error);
                return;
              }
              router.refresh();
            });
          }}
          className="border border-red-500/40 px-2.5 py-1 text-[11px] text-red-300 disabled:opacity-50"
        >
          {pending ? "…" : "Delete"}
        </button>
      </div>
      {error && <p className="text-[11px] text-red-300/90">{error}</p>}
    </div>
  );
}
