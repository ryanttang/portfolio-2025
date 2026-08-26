"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateContractAction } from "@/app/admin/actions/contracts";

export default function ContractDraftEditor({
  id,
  contractStatus,
  initialTitle,
  initialBody,
  initialAmountCents,
  initialPaymentNotes,
}: {
  id: string;
  contractStatus: string;
  initialTitle: string;
  initialBody: string;
  initialAmountCents: number | null;
  initialPaymentNotes?: string | null;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [bodyText, setBodyText] = useState(initialBody);
  const [amount, setAmount] = useState(
    initialAmountCents != null ? (initialAmountCents / 100).toFixed(2) : "",
  );
  const [paymentNotes, setPaymentNotes] = useState(initialPaymentNotes || "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function save() {
    setSaving(true);
    setMsg("");
    try {
      const amountCents = amount ? Math.round(Number(amount) * 100) : null;
      await updateContractAction(id, {
        title: title.trim(),
        bodyText: bodyText.trim(),
        amountCents: Number.isFinite(amountCents as number) ? amountCents : null,
        paymentNotes: paymentNotes.trim() || null,
      });
      setMsg(contractStatus === "draft" ? "Saved and ready for signature." : "Saved.");
      router.refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-6 space-y-4 border border-white/10 bg-[#141414] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">
          {contractStatus === "draft" ? "Edit draft" : "Edit agreement"}
        </h2>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="bg-[#fdf0d5] px-3 py-1.5 text-xs font-semibold text-black disabled:opacity-60"
        >
          {saving ? "Saving…" : contractStatus === "draft" ? "Save & mark ready" : "Save"}
        </button>
      </div>
      <label className="block text-xs uppercase tracking-wider text-white/40">
        Title
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm normal-case tracking-normal text-white outline-none focus:border-[#fdf0d5]"
        />
      </label>
      <label className="block text-xs uppercase tracking-wider text-white/40">
        Amount (USD, optional)
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm normal-case tracking-normal text-white outline-none focus:border-[#fdf0d5] sm:max-w-xs"
        />
      </label>
      <label className="block text-xs uppercase tracking-wider text-white/40">
        Payment schedule notes
        <textarea
          value={paymentNotes}
          onChange={(e) => setPaymentNotes(e.target.value)}
          rows={3}
          className="mt-1 w-full resize-y border border-white/15 bg-black/40 px-3 py-2 text-sm normal-case tracking-normal text-white outline-none focus:border-[#fdf0d5]"
        />
        <span className="mt-1 block text-[10px] normal-case tracking-normal text-white/30">
          Copied onto new invoices linked to this contract.
        </span>
      </label>
      <label className="block text-xs uppercase tracking-wider text-white/40">
        Agreement body
        <textarea
          value={bodyText}
          onChange={(e) => setBodyText(e.target.value)}
          rows={18}
          className="mt-1 w-full resize-y border border-white/15 bg-black/40 px-3 py-2 font-mono text-xs normal-case tracking-normal text-white outline-none focus:border-[#fdf0d5]"
        />
      </label>
      {msg && <p className="text-sm text-white/50">{msg}</p>}
    </div>
  );
}
