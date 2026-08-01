"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateContractAction } from "@/app/admin/actions/contracts";

export default function ContractDraftEditor({
  id,
  initialTitle,
  initialBody,
  initialAmountCents,
}: {
  id: string;
  initialTitle: string;
  initialBody: string;
  initialAmountCents: number | null;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [bodyText, setBodyText] = useState(initialBody);
  const [amount, setAmount] = useState(
    initialAmountCents != null ? (initialAmountCents / 100).toFixed(2) : "",
  );
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
      });
      setMsg("Draft saved.");
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
        <h2 className="text-sm font-semibold">Edit draft</h2>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="bg-[#e6c47a] px-3 py-1.5 text-xs font-semibold text-black disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save draft"}
        </button>
      </div>
      <label className="block text-xs uppercase tracking-wider text-white/40">
        Title
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm normal-case tracking-normal text-white outline-none focus:border-[#e6c47a]"
        />
      </label>
      <label className="block text-xs uppercase tracking-wider text-white/40">
        Amount (USD, optional)
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm normal-case tracking-normal text-white outline-none focus:border-[#e6c47a] sm:max-w-xs"
        />
      </label>
      <label className="block text-xs uppercase tracking-wider text-white/40">
        Agreement body
        <textarea
          value={bodyText}
          onChange={(e) => setBodyText(e.target.value)}
          rows={18}
          className="mt-1 w-full resize-y border border-white/15 bg-black/40 px-3 py-2 font-mono text-xs normal-case tracking-normal text-white outline-none focus:border-[#e6c47a]"
        />
      </label>
      {msg && <p className="text-sm text-white/50">{msg}</p>}
    </div>
  );
}
