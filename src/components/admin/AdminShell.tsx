"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

type NavItem = {
  href: string;
  label: string;
  exact?: boolean;
};

type NavSection = { label: string; items: NavItem[] };

const PRIMARY: NavItem[] = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/inbox", label: "Inbox" },
];

const SECTIONS: NavSection[] = [
  {
    label: "Manage Site",
    items: [
      { href: "/admin/content", label: "Content" },
      { href: "/admin/traffic", label: "Traffic" },
    ],
  },
  {
    label: "Manage Clients",
    items: [
      { href: "/admin/crm", label: "Clients" },
      { href: "/admin/onboarding", label: "Projects" },
      { href: "/admin/portal", label: "Portal" },
      { href: "/admin/contracts", label: "Contracts" },
      { href: "/admin/invoices", label: "Invoices" },
    ],
  },
];

const SETTINGS: NavItem = { href: "/admin/settings", label: "Settings" };

function isActive(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function NavLink({
  item,
  pathname,
  unreadCount,
  compact,
}: {
  item: NavItem;
  pathname: string;
  unreadCount: number;
  compact?: boolean;
}) {
  const active = isActive(pathname, item);
  const showBadge = item.href === "/admin/inbox" && unreadCount > 0;
  const badgeLabel = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <Link
      href={item.href}
      className={
        compact
          ? `inline-flex items-center gap-1.5 whitespace-nowrap rounded px-2.5 py-1.5 text-xs ${
              active ? "bg-white/10 text-[#e6c47a]" : "text-white/60"
            }`
          : `flex items-center justify-between gap-2 rounded px-3 py-2 text-sm transition ${
              active
                ? "bg-white/10 text-[#e6c47a]"
                : "text-white/70 hover:bg-white/5 hover:text-white"
            }`
      }
    >
      <span>{item.label}</span>
      {showBadge && (
        <span
          className={
            compact
              ? "rounded-full bg-[#e6c47a] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-black"
              : "min-w-[1.25rem] rounded-full bg-[#e6c47a] px-1.5 py-0.5 text-center text-[10px] font-semibold leading-none text-black"
          }
          aria-label={`${unreadCount} unread emails`}
        >
          {badgeLabel}
        </span>
      )}
    </Link>
  );
}

function flatNav(): NavItem[] {
  return [...PRIMARY, ...SECTIONS.flatMap((s) => s.items), SETTINGS];
}

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

          <nav className="flex flex-1 flex-col">
            <div className="flex flex-col gap-1">
              {PRIMARY.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  unreadCount={unreadCount}
                />
              ))}
            </div>

            {SECTIONS.map((section) => (
              <div key={section.label} className="mt-6">
                <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
                  {section.label}
                </p>
                <div className="flex flex-col gap-1">
                  {section.items.map((item) => (
                    <NavLink
                      key={item.href}
                      item={item}
                      pathname={pathname}
                      unreadCount={unreadCount}
                    />
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="mt-6 border-t border-white/10 pt-4">
            <NavLink item={SETTINGS} pathname={pathname} unreadCount={unreadCount} />
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/admin/login" })}
              className="mt-2 w-full rounded px-3 py-2 text-left text-xs text-white/40 hover:bg-white/5 hover:text-white/70"
            >
              Sign out
            </button>
          </div>
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
            {flatNav().map((item) => (
              <NavLink
                key={item.href}
                item={item}
                pathname={pathname}
                unreadCount={unreadCount}
                compact
              />
            ))}
          </nav>
          <main className="flex-1 p-4 md:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
