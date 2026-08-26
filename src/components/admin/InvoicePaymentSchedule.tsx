"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  addInvoicePaymentAction,
  markInvoicePaymentPaidAction,
} from "@/app/admin/actions/invoices";

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
  invoiceId,
  invoiceStatus,
  invoiceTotalCents,
  payments,
  paidCents,
  remainingCents,
  unscheduledRemainingCents,
  linkedContractId,
}: {
  invoiceId: string;
  invoiceStatus: string;
  invoiceTotalCents: number;
  payments: PaymentRow[];
  paidCents: number;
  remainingCents: number;
  unscheduledRemainingCents: number;
  linkedContractId: string | null;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [label, setLabel] = useState("Deposit");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [paidDate, setPaidDate] = useState("");
  const [alreadyReceived, setAlreadyReceived] = useState(true);
  const [addBalanceDue, setAddBalanceDue] = useState(true);

  const amountCents = useMemo(
    () => Math.round(Number(amount || 0) * 100),
    [amount],
  );

  const canAdd =
    invoiceStatus !== "void" &&
    amountCents > 0 &&
    label.trim().length > 0 &&
    unscheduledRemainingCents > 0 &&
    amountCents <= unscheduledRemainingCents;

  async function markPaid(paymentId: string) {
    setBusyId(paymentId);
    try {
      await markInvoicePaymentPaidAction(paymentId);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!canAdd) return;
    setAdding(true);
    setError("");
    try {
      await addInvoicePaymentAction(invoiceId, {
        label: label.trim(),
        amountCents,
        dueDate: alreadyReceived ? null : dueDate || null,
        alreadyReceived,
        paidAt: alreadyReceived && paidDate ? paidDate : null,
        addBalanceDue: alreadyReceived && addBalanceDue,
      });
      setAmount("");
      setDueDate("");
      setPaidDate("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add payment");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="mt-6 border border-white/10 bg-[#141414] p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-white/40">Payment schedule</p>
          <p className="mt-1 text-sm text-white/60">
            Invoice ${(invoiceTotalCents / 100).toFixed(2)} · Paid ${(paidCents / 100).toFixed(2)}{" "}
            · Remaining ${(remainingCents / 100).toFixed(2)}
          </p>
          {linkedContractId && (
            <p className="mt-1 text-xs text-white/35">
              Updates the linked{" "}
              <Link
                href={`/admin/contracts/${linkedContractId}`}
                className="text-[#fdf0d5] hover:underline"
              >
                service agreement
              </Link>{" "}
              payment schedule.
            </p>
          )}
        </div>
      </div>

      {payments.length > 0 && (
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
      )}

      {invoiceStatus !== "void" && unscheduledRemainingCents > 0 && (
        <form onSubmit={onAdd} className="mt-5 border-t border-white/10 pt-4">
          <p className="text-xs uppercase tracking-wider text-white/40">Add payment</p>
          <p className="mt-1 text-xs text-white/35">
            Record a payment already received or schedule an upcoming installment. Up to $
            {(unscheduledRemainingCents / 100).toFixed(2)} can still be allocated.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_100px_130px]">
            <input
              placeholder="Label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
              className="border border-white/15 bg-black/40 px-3 py-2 text-sm"
            />
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="border border-white/15 bg-black/40 px-2 py-2 text-sm"
            />
            {alreadyReceived ? (
              <input
                type="date"
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
                className="border border-white/15 bg-black/40 px-2 py-2 text-sm"
                title="Date received"
              />
            ) : (
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="border border-white/15 bg-black/40 px-2 py-2 text-sm"
                title="Due date"
              />
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-white/75">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={alreadyReceived}
                onChange={(e) => setAlreadyReceived(e.target.checked)}
              />
              Already received
            </label>
            {alreadyReceived && (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={addBalanceDue}
                  onChange={(e) => setAddBalanceDue(e.target.checked)}
                />
                Add balance due as upcoming payment
              </label>
            )}
          </div>
          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={!canAdd || adding}
            className="mt-3 bg-[#fdf0d5] px-4 py-2 text-xs font-semibold text-black disabled:opacity-50"
          >
            {adding ? "Adding…" : "Add payment"}
          </button>
        </form>
      )}
    </div>
  );
}
