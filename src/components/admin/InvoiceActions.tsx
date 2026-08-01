"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  markInvoicePaidAction,
  sendInvoiceAction,
  voidInvoiceAction,
} from "@/app/admin/actions/invoices";

export default function InvoiceActions({
  id,
  status,
  payUrl,
}: {
  id: string;
  status: string;
  payUrl: string;
}) {
  const router = useRouter();
  const [msg, setMsg] = useState("");

  async function send() {
    setMsg("Sending…");
    const result = await sendInvoiceAction(id);
    setMsg(result.error || `Sent. Pay link: ${result.payUrl || payUrl}`);
    router.refresh();
  }

  async function markPaid() {
    await markInvoicePaidAction(id);
    router.refresh();
  }

  async function voidInv() {
    if (!confirm("Void this invoice?")) return;
    await voidInvoiceAction(id);
    router.refresh();
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {status !== "paid" && status !== "void" && (
        <button
          type="button"
          onClick={send}
          className="bg-[#fdf0d5] px-3 py-1.5 text-xs font-semibold text-black"
        >
          Email invoice
        </button>
      )}
      {status !== "paid" && status !== "void" && (
        <button type="button" onClick={markPaid} className="border border-white/20 px-3 py-1.5 text-xs">
          Mark paid
        </button>
      )}
      {status !== "void" && status !== "paid" && (
        <button type="button" onClick={voidInv} className="border border-white/20 px-3 py-1.5 text-xs">
          Void
        </button>
      )}
      <a href={payUrl} target="_blank" rel="noreferrer" className="border border-white/20 px-3 py-1.5 text-xs">
        Open pay page
      </a>
      {msg && <span className="text-xs text-white/50">{msg}</span>}
    </div>
  );
}
