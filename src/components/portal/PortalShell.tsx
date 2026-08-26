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
    <div className="portal-root min-h-screen bg-[#0a0a0a] text-[#f2efe8]">
      <div
        className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_75%)]"
        aria-hidden
      />
      {impersonating && (
        <div className="relative border-b border-[#fdf0d5]/40 bg-[#fdf0d5]/15 px-4 py-2 text-center text-sm text-[#fdf0d5]">
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
        <header className="relative border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 lg:px-6">
            <Link href="/portal" className="group">
              <p className="font-[family-name:var(--font-syne)] text-xs uppercase tracking-[0.25em] text-[#fdf0d5]">
                Ryan Tang
              </p>
              <p className="text-sm text-white/45 transition group-hover:text-white/65">
                Client portal
              </p>
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link
                href="/portal"
                className="rounded-sm border border-transparent px-2 py-1 text-white/70 transition hover:border-white/10 hover:bg-white/[0.03] hover:text-white"
              >
                Dashboard
              </Link>
              <NotificationBell
                notifications={notifications}
                unreadCount={unreadCount}
                projectSlugs={projectSlugs}
              />
              {!impersonating && (
                <Link
                  href="/portal/account"
                  className="rounded-sm border border-transparent px-2 py-1 text-white/70 transition hover:border-white/10 hover:bg-white/[0.03] hover:text-white"
                >
                  Account
                </Link>
              )}
              {email && <span className="hidden text-xs text-white/30 lg:inline">{email}</span>}
              {!impersonating && (
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/portal/login" })}
                  className="text-xs text-white/40 transition hover:text-white/70"
                >
                  Sign out
                </button>
              )}
            </nav>
          </div>
        </header>
      )}
      <main className="relative mx-auto max-w-6xl px-4 py-8 lg:px-6">{children}</main>
    </div>
  );
}
