"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/portal/actions/hub";

const SECTION_HASH: Record<string, string> = {
  milestone: "#progress",
  task: "#tasks",
  meeting: "#meetings",
  file: "#files",
  message: "#messages",
};

export default function NotificationBell({
  notifications,
  unreadCount,
  projectSlugs,
}: {
  notifications: {
    id: string;
    type: string;
    title: string;
    body: string;
    createdAt: Date;
    readAt: Date | null;
    onboardingId: string | null;
  }[];
  unreadCount: number;
  projectSlugs: Record<string, string>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  function hrefFor(n: (typeof notifications)[0]) {
    if (!n.onboardingId) return "/portal";
    const slug = projectSlugs[n.onboardingId];
    if (!slug) return "/portal";
    const hash = SECTION_HASH[n.type] || "";
    return `/portal/projects/${slug}${hash}`;
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative text-white/70 hover:text-white"
        aria-label="Notifications"
      >
        Notifications
        {unreadCount > 0 && (
          <span className="ml-1 inline-flex min-w-[1.1rem] items-center justify-center rounded-full bg-[#fdf0d5] px-1 text-[10px] font-bold text-black">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-72 border border-white/15 bg-[#141414] shadow-lg">
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Alerts</p>
            {unreadCount > 0 && (
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await markAllNotificationsReadAction();
                    router.refresh();
                  })
                }
                className="text-[10px] text-[#fdf0d5] hover:underline disabled:opacity-50"
              >
                Mark all read
              </button>
            )}
          </div>
          <ul className="max-h-64 overflow-y-auto">
            {notifications.map((n) => (
              <li key={n.id} className="border-b border-white/5 px-3 py-2">
                <Link
                  href={hrefFor(n)}
                  className="block w-full text-left"
                  onClick={() =>
                    startTransition(async () => {
                      if (!n.readAt) await markNotificationReadAction(n.id);
                      setOpen(false);
                      router.refresh();
                    })
                  }
                >
                  <p className={`text-sm ${n.readAt ? "text-white/50" : "font-medium text-white"}`}>
                    {n.title}
                  </p>
                  {n.body && <p className="mt-0.5 line-clamp-2 text-xs text-white/40">{n.body}</p>}
                </Link>
              </li>
            ))}
            {notifications.length === 0 && (
              <li className="px-3 py-4 text-sm text-white/40">No notifications yet.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
