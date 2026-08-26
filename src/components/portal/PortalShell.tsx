"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useTransition } from "react";
import { stopViewAsClientAction } from "@/app/admin/actions/onboarding";
import NotificationBell from "@/components/portal/NotificationBell";

export default function PortalShell({
  children,
  showNav,
  email,
  impersonating,
  impersonatedClientId,
  notifications = [],
  unreadCount = 0,
  projectSlugs = {},
}: {
  children: React.ReactNode;
  showNav: boolean;
  email: string | null;
  impersonating?: boolean;
  impersonatedClientId?: string | null;
  notifications?: {
    id: string;
    type: string;
    title: string;
    body: string;
    createdAt: Date;
    readAt: Date | null;
    onboardingId: string | null;
  }[];
  unreadCount?: number;
  projectSlugs?: Record<string, string>;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="min-h-screen bg-[#0c0c0c] text-[#f2efe8]">
      {impersonating && (
        <div className="border-b border-[#fdf0d5]/40 bg-[#fdf0d5]/15 px-4 py-2 text-center text-sm text-[#fdf0d5]">
          Previewing as {email || "client"} · edits save to this client{" "}
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await stopViewAsClientAction(impersonatedClientId || undefined);
              })
            }
            className="ml-2 underline disabled:opacity-50"
          >
            Exit to admin
          </button>
        </div>
      )}
      {showNav && (
        <header className="border-b border-white/10">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
            <div>
              <p className="font-[family-name:var(--font-syne)] text-xs uppercase tracking-[0.25em] text-[#fdf0d5]">
                Ryan Tang
              </p>
              <p className="text-sm text-white/50">Client portal</p>
            </div>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/portal" className="text-white/70 hover:text-white">
                Projects
              </Link>
              <NotificationBell
                notifications={notifications}
                unreadCount={unreadCount}
                projectSlugs={projectSlugs}
              />
              {!impersonating && (
                <Link href="/portal/account" className="text-white/70 hover:text-white">
                  Account
                </Link>
              )}
              {email && <span className="hidden text-xs text-white/30 sm:inline">{email}</span>}
              {!impersonating && (
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/portal/login" })}
                  className="text-xs text-white/40 hover:text-white/70"
                >
                  Sign out
                </button>
              )}
            </nav>
          </div>
        </header>
      )}
      <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
    </div>
  );
}

