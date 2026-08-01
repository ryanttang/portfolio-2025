"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createContractAction } from "@/app/admin/actions/contracts";

export default function ContractForm({
  clients,
  defaultClientId,
}: {
  clients: { id: string; name: string; email: string }[];
  defaultClientId?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    try {
      const amount = fd.get("amount") ? Math.round(Number(fd.get("amount")) * 100) : null;
      const result = await createContractAction({
        clientId: String(fd.get("clientId")),
        title: String(fd.get("title")),
        bodyText: String(fd.get("bodyText")),
        amountCents: amount,
        notes: String(fd.get("notes") || "") || null,
      });
      router.push(`/admin/contracts/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 max-w-2xl space-y-4 border border-white/10 bg-[#141414] p-5">
      <label className="block text-xs uppercase tracking-wider text-white/40">
        Client
        <select
          name="clientId"
          required
          defaultValue={defaultClientId || ""}
          className="mt-1 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm"
        >
          <option value="" disabled>
            Select client
          </option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.email})
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs uppercase tracking-wider text-white/40">
        Title
        <input
          name="title"
          required
          className="mt-1 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm"
        />
      </label>
      <label className="block text-xs uppercase tracking-wider text-white/40">
        Agreement body
        <textarea
          name="bodyText"
          required
          rows={14}
          className="mt-1 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm"
          placeholder="Paste the full agreement text…"
        />
      </label>
      <label className="block text-xs uppercase tracking-wider text-white/40">
        Amount (USD, optional)
        <input
          name="amount"
          type="number"
          step="0.01"
          className="mt-1 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm"
        />
      </label>
      <label className="block text-xs uppercase tracking-wider text-white/40">
        Internal notes
        <textarea name="notes" rows={2} className="mt-1 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm" />
      </label>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="bg-[#e6c47a] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
      >
        {saving ? "Creating…" : "Create draft"}
      </button>
    </form>
  );
}
