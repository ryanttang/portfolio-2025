"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const NAV = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/traffic", label: "Traffic" },
  { href: "/admin/content", label: "Content" },
  { href: "/admin/crm", label: "Clients" },
  { href: "/admin/onboarding", label: "Projects" },
  { href: "/admin/inbox", label: "Inbox" },
  { href: "/admin/contracts", label: "Contracts" },
  { href: "/admin/invoices", label: "Invoices" },
  { href: "/admin/settings", label: "Settings" },
];

export default function AdminShell({
  children,
  unreadCount = 0,
}: {
  children: React.ReactNode;
  unreadCount?: number;
}) {
  const pathname = usePathname();

  return (
    <div className="admin-root min-h-screen bg-[#0c0c0c] text-[#f2efe8]">
      <div className="flex min-h-screen">
        <aside className="hidden w-56 shrink-0 border-r border-white/10 bg-[#111] p-5 md:flex md:flex-col">
          <div className="mb-8">
            <p className="font-[family-name:var(--font-syne)] text-xs uppercase tracking-[0.25em] text-[#e6c47a]">
              Ryan Tang
            </p>
            <h1 className="mt-1 font-[family-name:var(--font-syne)] text-lg font-bold tracking-wide">
              Admin
            </h1>
          </div>
          <nav className="flex flex-1 flex-col gap-1">
            {NAV.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded px-3 py-2 text-sm transition ${
                    active
                      ? "bg-white/10 text-[#e6c47a]"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {item.label}
                  {item.href === "/admin/inbox" && unreadCount > 0 && (
                    <span className="ml-2 rounded-full bg-[#e6c47a] px-1.5 py-0.5 text-[10px] font-semibold text-black">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="mt-4 text-left text-xs text-white/40 hover:text-white/70"
          >
            Sign out
          </button>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-white/10 px-4 py-3 md:hidden">
            <p className="font-[family-name:var(--font-syne)] text-sm font-bold tracking-wide">
              Admin
            </p>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/admin/login" })}
              className="text-xs text-white/50"
            >
              Sign out
            </button>
          </header>
          <nav className="flex gap-1 overflow-x-auto border-b border-white/10 px-2 py-2 md:hidden">
            {NAV.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap rounded px-2.5 py-1.5 text-xs ${
                    active ? "bg-white/10 text-[#e6c47a]" : "text-white/60"
                  }`}
                >
                  {item.label}
                  {item.href === "/admin/inbox" && unreadCount > 0 ? ` (${unreadCount})` : ""}
                </Link>
              );
            })}
          </nav>
          <main className="flex-1 p-4 md:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
