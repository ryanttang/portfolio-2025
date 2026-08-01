import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { clients, contracts } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function ContractsPage() {
  const rows = await db
    .select({
      id: contracts.id,
      title: contracts.title,
      status: contracts.status,
      createdAt: contracts.createdAt,
      clientName: clients.name,
    })
    .from(contracts)
    .leftJoin(clients, eq(contracts.clientId, clients.id))
    .orderBy(desc(contracts.createdAt));

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold">Contracts</h1>
          <p className="mt-1 text-sm text-white/50">Create, send, and track signed agreements.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/contracts/terms"
            className="border border-white/15 px-4 py-2 text-sm text-white/70 hover:text-[#fdf0d5]"
          >
            Terms
          </Link>
          <Link
            href="/admin/contracts/templates"
            className="border border-white/15 px-4 py-2 text-sm text-white/70 hover:text-[#fdf0d5]"
          >
            Templates
          </Link>
          <Link
            href="/admin/contracts/new"
            className="bg-[#fdf0d5] px-4 py-2 text-sm font-semibold text-black"
          >
            New contract
          </Link>
        </div>
      </div>

      <div className="mt-6 border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 bg-[#141414] text-xs uppercase tracking-wider text-white/40">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-white/40">
                  No contracts yet.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="px-4 py-3">
                  <Link href={`/admin/contracts/${r.id}`} className="text-[#fdf0d5] hover:underline">
                    {r.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-white/70">{r.clientName || "—"}</td>
                <td className="px-4 py-3 capitalize text-white/60">{r.status}</td>
                <td className="px-4 py-3 text-white/40">
                  {new Date(r.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
