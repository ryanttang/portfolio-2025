import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { clients, invoices } from "@/db/schema";

export default async function InvoicesPage() {
  const rows = await db
    .select({
      id: invoices.id,
      number: invoices.invoiceNumber,
      status: invoices.status,
      totalCents: invoices.totalCents,
      clientName: clients.name,
      createdAt: invoices.createdAt,
    })
    .from(invoices)
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .orderBy(desc(invoices.createdAt));

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold">Invoices</h1>
          <p className="mt-1 text-sm text-white/50">Create, email, and track payments.</p>
        </div>
        <Link
          href="/admin/invoices/new"
          className="bg-[#e6c47a] px-4 py-2 text-sm font-semibold text-black"
        >
          New invoice
        </Link>
      </div>

      <div className="mt-6 border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 bg-[#141414] text-xs uppercase tracking-wider text-white/40">
            <tr>
              <th className="px-4 py-3">Number</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-white/40">
                  No invoices yet.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3">
                  <Link href={`/admin/invoices/${r.id}`} className="text-[#e6c47a] hover:underline">
                    {r.number}
                  </Link>
                </td>
                <td className="px-4 py-3 text-white/70">{r.clientName || "—"}</td>
                <td className="px-4 py-3">${(r.totalCents / 100).toFixed(2)}</td>
                <td className="px-4 py-3 capitalize text-white/60">{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
