"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

export default function PortalShell({
  children,
  showNav,
  email,
}: {
  children: React.ReactNode;
  showNav: boolean;
  email: string | null;
}) {
  return (
    <div className="min-h-screen bg-[#0c0c0c] text-[#f2efe8]">
      {showNav && (
        <header className="border-b border-white/10">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
            <div>
              <p className="font-[family-name:var(--font-syne)] text-xs uppercase tracking-[0.25em] text-[#e6c47a]">
                Ryan Tang
              </p>
              <p className="text-sm text-white/50">Client portal</p>
            </div>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/portal" className="text-white/70 hover:text-white">
                Home
              </Link>
              <Link href="/portal/onboarding" className="text-white/70 hover:text-white">
                Onboarding
              </Link>
              {email && <span className="hidden text-xs text-white/30 sm:inline">{email}</span>}
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/portal/login" })}
                className="text-xs text-white/40 hover:text-white/70"
              >
                Sign out
              </button>
            </nav>
          </div>
        </header>
      )}
      <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
    </div>
  );
}
