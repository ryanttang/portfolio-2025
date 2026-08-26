"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { markInvoicePaymentPaidAction } from "@/app/admin/actions/invoices";

type PaymentRow = {
  id: string;
  label: string;
  amountCents: number;
  dueDate: Date | null;
  status: string;
  payToken: string;
  paidAt: Date | null;
};

export default function InvoicePaymentSchedule({
  invoiceStatus,
  payments,
  paidCents,
  remainingCents,
}: {
  invoiceStatus: string;
  payments: PaymentRow[];
  paidCents: number;
  remainingCents: number;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  if (payments.length === 0) return null;

  async function markPaid(paymentId: string) {
    setBusyId(paymentId);
    try {
      await markInvoicePaymentPaidAction(paymentId);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mt-6 border border-white/10 bg-[#141414] p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-white/40">Payment schedule</p>
          <p className="mt-1 text-sm text-white/60">
            Paid ${(paidCents / 100).toFixed(2)} · Remaining ${(remainingCents / 100).toFixed(2)}
          </p>
        </div>
      </div>

      <table className="mt-4 w-full text-sm">
        <thead className="border-b border-white/10 text-xs uppercase text-white/40">
          <tr>
            <th className="py-2 text-left">Payment</th>
            <th className="py-2 text-right">Amount</th>
            <th className="py-2 text-left">Due</th>
            <th className="py-2 text-left">Status</th>
            <th className="py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {payments.map((p) => (
            <tr key={p.id}>
              <td className="py-2 pr-3">{p.label}</td>
              <td className="py-2 text-right">${(p.amountCents / 100).toFixed(2)}</td>
              <td className="py-2 text-white/50">
                {p.dueDate
                  ? p.dueDate.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "—"}
              </td>
              <td className="py-2 capitalize text-white/60">{p.status}</td>
              <td className="py-2 text-right">
                {p.status === "pending" && invoiceStatus !== "void" ? (
                  <div className="flex justify-end gap-2">
                    <a
                      href={`/pay/${p.payToken}`}
                      target="_blank"
                      rel="noreferrer"
                      className="border border-white/20 px-2 py-1 text-xs"
                    >
                      Pay link
                    </a>
                    <button
                      type="button"
                      disabled={busyId === p.id}
                      onClick={() => markPaid(p.id)}
                      className="border border-white/20 px-2 py-1 text-xs disabled:opacity-50"
                    >
                      {busyId === p.id ? "Saving…" : "Mark paid"}
                    </button>
                  </div>
                ) : p.paidAt ? (
                  <span className="text-xs text-white/40">
                    {p.paidAt.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
