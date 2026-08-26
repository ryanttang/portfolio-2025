"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { dismissHubWelcomeAction } from "@/app/portal/actions/auth";
import { DEFAULT_HUB_WELCOME_MESSAGE } from "@/lib/portal/types";

export default function DashboardWelcomeModal({
  onboardingId,
  projectName,
  welcomeMessage,
  show,
}: {
  onboardingId: string;
  projectName: string;
  welcomeMessage?: string | null;
  show: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(show);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const message = welcomeMessage?.trim() || DEFAULT_HUB_WELCOME_MESSAGE;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto border border-[#fdf0d5]/30 bg-[#141414] p-6 shadow-xl"
      >
        <p className="font-[family-name:var(--font-syne)] text-xs uppercase tracking-[0.25em] text-[#fdf0d5]">
          Welcome
        </p>
        <h2 className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold">
          {projectName || "Your project hub"}
        </h2>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-white/70">{message}</p>
        <ul className="mt-6 space-y-2 text-sm text-white/60">
          <li>• Track milestones and project progress</li>
          <li>• Complete action items when something needs your input</li>
          <li>• Read updates and message me directly in the portal</li>
          <li>• Download deliverables and add meetings to your calendar</li>
        </ul>
        <button
          type="button"
          disabled={loading}
          onClick={async () => {
            setLoading(true);
            await dismissHubWelcomeAction(onboardingId);
            setOpen(false);
            router.replace(window.location.pathname);
            router.refresh();
            setLoading(false);
          }}
          className="mt-8 w-full bg-[#fdf0d5] px-4 py-2.5 text-sm font-semibold text-black disabled:opacity-50"
        >
          {loading ? "Loading…" : "Get started"}
        </button>
      </div>
    </div>
  );
}
