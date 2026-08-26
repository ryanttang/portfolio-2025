import Link from "next/link";
import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { clients, contracts, emailMessages, invoices } from "@/db/schema";

async function safeCount(fn: () => Promise<number>) {
  try {
    return await fn();
  } catch {
    return 0;
  }
}

export default async function AdminOverviewPage() {
  const [clientCount, leadCount, openContracts, unpaidInvoices, unread] = await Promise.all([
    safeCount(async () => {
      const [r] = await db.select({ count: sql<number>`count(*)::int` }).from(clients);
      return r?.count ?? 0;
    }),
    safeCount(async () => {
      const [r] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(clients)
        .where(eq(clients.status, "lead"));
      return r?.count ?? 0;
    }),
    safeCount(async () => {
      const [r] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(contracts)
        .where(sql`${contracts.status} in ('draft', 'ready', 'sent')`);
      return r?.count ?? 0;
    }),
    safeCount(async () => {
      const [r] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(invoices)
        .where(sql`${invoices.status} in ('draft', 'saved', 'sent')`);
      return r?.count ?? 0;
    }),
    safeCount(async () => {
      const [r] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(emailMessages)
        .where(and(eq(emailMessages.direction, "inbound"), isNull(emailMessages.readAt)));
      return r?.count ?? 0;
    }),
  ]);

  const stats = [
    { label: "Clients", value: clientCount, href: "/admin/crm" },
    { label: "Leads", value: leadCount, href: "/admin/crm?status=lead" },
    { label: "Unread mail", value: unread, href: "/admin/inbox" },
    { label: "Open contracts", value: openContracts, href: "/admin/contracts" },
    { label: "Unpaid invoices", value: unpaidInvoices, href: "/admin/invoices" },
  ];

  return (
    <div>
      <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold tracking-wide">
        Overview
      </h1>
      <p className="mt-1 text-sm text-white/50">Site ops, clients, contracts, and invoices.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="border border-white/10 bg-[#141414] p-5 transition hover:border-[#fdf0d5]/40"
          >
            <p className="text-xs uppercase tracking-wider text-white/40">{s.label}</p>
            <p className="mt-2 font-[family-name:var(--font-syne)] text-3xl font-bold text-[#fdf0d5]">
              {s.value}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link
          href="/admin/portal"
          className="bg-[#fdf0d5] px-4 py-2 text-sm font-semibold text-black hover:bg-[#f0d49a]"
        >
          Preview portal
        </Link>
        <Link
          href="/admin/crm"
          className="border border-white/20 px-4 py-2 text-sm text-white/80 hover:border-white/40"
        >
          Open clients
        </Link>
        <Link
          href="/admin/inbox?compose=1"
          className="border border-white/20 px-4 py-2 text-sm text-white/80 hover:border-white/40"
        >
          Compose email
        </Link>
        <Link
          href="/admin/contracts/new"
          className="border border-white/20 px-4 py-2 text-sm text-white/80 hover:border-white/40"
        >
          New contract
        </Link>
        <Link
          href="/admin/invoices/new"
          className="border border-white/20 px-4 py-2 text-sm text-white/80 hover:border-white/40"
        >
          New invoice
        </Link>
      </div>
    </div>
  );
}
