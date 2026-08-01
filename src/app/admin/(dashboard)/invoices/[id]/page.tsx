import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { invoiceLineItems, invoices } from "@/db/schema";
import { getAppUrl } from "@/lib/env";
import InvoiceActions from "@/components/admin/InvoiceActions";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [inv] = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
  if (!inv) notFound();
  const lines = await db
    .select()
    .from(invoiceLineItems)
    .where(eq(invoiceLineItems.invoiceId, id));

  return (
    <div>
      <Link href="/admin/invoices" className="text-xs text-white/40 hover:text-white/70">
        ← Invoices
      </Link>
      <h1 className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold">
        {inv.invoiceNumber}
      </h1>
      <p className="mt-1 text-sm text-white/50">
        {inv.clientName} · <span className="capitalize">{inv.status}</span> · $
        {(inv.totalCents / 100).toFixed(2)}
      </p>

      <InvoiceActions
        id={inv.id}
        status={inv.status}
        payUrl={`${getAppUrl()}/pay/${inv.payToken}`}
      />

      <div className="mt-6 border border-white/10">
        <table className="w-full text-sm">
          <thead className="border-b border-white/10 bg-[#141414] text-xs uppercase text-white/40">
            <tr>
              <th className="px-4 py-2 text-left">Description</th>
              <th className="px-4 py-2 text-right">Qty</th>
              <th className="px-4 py-2 text-right">Rate</th>
              <th className="px-4 py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {lines.map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-2">{l.description}</td>
                <td className="px-4 py-2 text-right">{l.quantity}</td>
                <td className="px-4 py-2 text-right">${(l.unitPriceCents / 100).toFixed(2)}</td>
                <td className="px-4 py-2 text-right">
                  ${((l.quantity * l.unitPriceCents) / 100).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
