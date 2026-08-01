"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createInvoiceAction } from "@/app/admin/actions/invoices";

type Line = { description: string; quantity: number; unitPrice: string };

type ContractOption = {
  id: string;
  clientId: string;
  title: string;
  amountCents: number | null;
  paymentNotes: string | null;
  status: string;
};

export default function InvoiceForm({
  clients,
  contracts,
  defaultClientId,
  defaultContractId,
}: {
  clients: { id: string; name: string; email: string }[];
  contracts: ContractOption[];
  defaultClientId?: string;
  defaultContractId?: string;
}) {
  const router = useRouter();
  const initialContract = defaultContractId
    ? contracts.find((c) => c.id === defaultContractId)
    : undefined;
  const [clientId, setClientId] = useState(
    defaultClientId || initialContract?.clientId || "",
  );
  const [contractId, setContractId] = useState(defaultContractId || "");
  const [notesPublic, setNotesPublic] = useState(initialContract?.paymentNotes || "");
  const [lines, setLines] = useState<Line[]>(() => {
    if (initialContract?.amountCents != null) {
      return [
        {
          description: initialContract.title,
          quantity: 1,
          unitPrice: (initialContract.amountCents / 100).toFixed(2),
        },
      ];
    }
    return [{ description: "", quantity: 1, unitPrice: "" }];
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const clientContracts = useMemo(
    () =>
      contracts.filter(
        (c) => !clientId || c.clientId === clientId,
      ),
    [contracts, clientId],
  );

  function applyContract(id: string) {
    setContractId(id);
    if (!id) return;
    const contract = contracts.find((c) => c.id === id);
    if (!contract) return;
    setClientId(contract.clientId);
    if (contract.paymentNotes) {
      setNotesPublic(contract.paymentNotes);
    }
    if (contract.amountCents != null) {
      setLines([
        {
          description: contract.title,
          quantity: 1,
          unitPrice: (contract.amountCents / 100).toFixed(2),
        },
      ]);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    try {
      const result = await createInvoiceAction({
        clientId,
        contractId: contractId || null,
        dueDate: String(fd.get("dueDate") || "") || null,
        notesPublic: notesPublic.trim() || undefined,
        paypalEnabled: fd.get("paypalEnabled") === "on",
        lineItems: lines.map((l) => ({
          description: l.description,
          quantity: l.quantity,
          unitPriceCents: Math.round(Number(l.unitPrice || 0) * 100),
        })),
      });
      router.push(`/admin/invoices/${result.id}`);
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
          required
          value={clientId}
          onChange={(e) => {
            setClientId(e.target.value);
            if (contractId) {
              const still = contracts.find(
                (c) => c.id === contractId && c.clientId === e.target.value,
              );
              if (!still) setContractId("");
            }
          }}
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
        Linked contract (optional)
        <select
          value={contractId}
          onChange={(e) => applyContract(e.target.value)}
          className="mt-1 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm"
        >
          <option value="">None</option>
          {clientContracts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title} ({c.status})
              {c.amountCents != null
                ? ` — $${(c.amountCents / 100).toFixed(2)}`
                : ""}
            </option>
          ))}
        </select>
        <span className="mt-1 block text-[10px] normal-case tracking-normal text-white/30">
          Prefills public notes from the contract payment schedule and can seed a line item from
          the agreement amount.
        </span>
      </label>

      <label className="block text-xs uppercase tracking-wider text-white/40">
        Due date
        <input
          name="dueDate"
          type="date"
          className="mt-1 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm"
        />
      </label>

      <div>
        <p className="text-xs uppercase tracking-wider text-white/40">Line items</p>
        <div className="mt-2 space-y-2">
          {lines.map((line, i) => (
            <div key={i} className="grid grid-cols-[1fr_70px_100px] gap-2">
              <input
                placeholder="Description"
                value={line.description}
                onChange={(e) => {
                  const next = [...lines];
                  next[i] = { ...line, description: e.target.value };
                  setLines(next);
                }}
                required
                className="border border-white/15 bg-black/40 px-3 py-2 text-sm"
              />
              <input
                type="number"
                min={1}
                value={line.quantity}
                onChange={(e) => {
                  const next = [...lines];
                  next[i] = { ...line, quantity: Number(e.target.value) };
                  setLines(next);
                }}
                className="border border-white/15 bg-black/40 px-2 py-2 text-sm"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Price"
                value={line.unitPrice}
                onChange={(e) => {
                  const next = [...lines];
                  next[i] = { ...line, unitPrice: e.target.value };
                  setLines(next);
                }}
                required
                className="border border-white/15 bg-black/40 px-2 py-2 text-sm"
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setLines([...lines, { description: "", quantity: 1, unitPrice: "" }])}
          className="mt-2 text-xs text-[#fdf0d5]"
        >
          + Add line
        </button>
      </div>

      <label className="block text-xs uppercase tracking-wider text-white/40">
        Public notes
        <textarea
          value={notesPublic}
          onChange={(e) => setNotesPublic(e.target.value)}
          rows={3}
          className="mt-1 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm"
          placeholder="Payment schedule from the linked contract appears here"
        />
      </label>

      <label className="flex items-center gap-2 text-sm text-white/80">
        <input name="paypalEnabled" type="checkbox" defaultChecked />
        Enable PayPal pay link when sending
      </label>

      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="bg-[#fdf0d5] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
      >
        {saving ? "Creating…" : "Create draft"}
      </button>
    </form>
  );
}
