"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createContractAction } from "@/app/admin/actions/contracts";
import TermsListEditor from "@/components/admin/TermsListEditor";
import { buildContractDraft } from "@/lib/contracts/merge";

type ClientOption = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  address: string | null;
  phone: string | null;
};

type TemplateOption = {
  id: string;
  name: string;
  kind: string;
  titleTemplate: string;
  bodyTemplate: string;
  terms: string[];
  paymentNotes: string | null;
};

type SellerDefaults = {
  sellerLegalName?: string | null;
  sellerAddress?: string | null;
};

export default function ContractForm({
  clients,
  templates,
  seller,
  defaultClientId,
}: {
  clients: ClientOption[];
  templates: TemplateOption[];
  seller: SellerDefaults;
  defaultClientId?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [templateId, setTemplateId] = useState(templates[0]?.id || "");
  const [clientId, setClientId] = useState(defaultClientId || "");
  const [title, setTitle] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [terms, setTerms] = useState<string[]>([]);
  const [paymentNotes, setPaymentNotes] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const dirtyRef = useRef(false);

  const template = useMemo(
    () => templates.find((t) => t.id === templateId) || templates[0],
    [templateId, templates],
  );
  const client = useMemo(
    () => clients.find((c) => c.id === clientId) || null,
    [clientId, clients],
  );

  function fillFromTemplate(opts?: { force?: boolean }) {
    if (!template) return;
    if (!opts?.force && dirtyRef.current) return;
    const amountCents = amount ? Math.round(Number(amount) * 100) : null;
    const draft = buildContractDraft({
      template,
      client,
      seller,
      amountCents: Number.isFinite(amountCents) ? amountCents : null,
      terms: opts?.force ? template.terms : terms.length ? terms : template.terms,
      paymentNotes:
        opts?.force || !paymentNotes
          ? template.paymentNotes
          : paymentNotes,
    });
    setTitle(draft.title);
    setBodyText(draft.bodyText);
    setTerms(draft.terms);
    setPaymentNotes(draft.paymentNotes);
    dirtyRef.current = false;
  }

  useEffect(() => {
    if (!template) return;
    setTerms(Array.isArray(template.terms) ? [...template.terms] : []);
    setPaymentNotes(template.paymentNotes || "");
    dirtyRef.current = false;
    // Fill when template changes
    const amountCents = amount ? Math.round(Number(amount) * 100) : null;
    const draft = buildContractDraft({
      template,
      client,
      seller,
      amountCents: Number.isFinite(amountCents) ? amountCents : null,
      terms: template.terms,
      paymentNotes: template.paymentNotes,
    });
    setTitle(draft.title);
    setBodyText(draft.bodyText);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: template switch resets draft
  }, [templateId]);

  useEffect(() => {
    if (!template || !clientId) return;
    if (dirtyRef.current) return;
    fillFromTemplate({ force: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- client change refills when not dirty
  }, [clientId]);

  function rebuildBodyFromTerms(nextTerms: string[], nextPayment: string) {
    if (!template) return;
    const amountCents = amount ? Math.round(Number(amount) * 100) : null;
    const draft = buildContractDraft({
      template: {
        ...template,
        // Keep current title/body templates; only re-merge with new terms
      },
      client,
      seller,
      amountCents: Number.isFinite(amountCents) ? amountCents : null,
      terms: nextTerms,
      paymentNotes: nextPayment,
    });
    setTitle(draft.title);
    setBodyText(draft.bodyText);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (!clientId) throw new Error("Select a client");
      if (!title.trim() || !bodyText.trim()) throw new Error("Title and body are required");
      const amountCents = amount ? Math.round(Number(amount) * 100) : null;
      const result = await createContractAction({
        clientId,
        title: title.trim(),
        bodyText: bodyText.trim(),
        amountCents: Number.isFinite(amountCents as number) ? amountCents : null,
        paymentNotes: paymentNotes.trim() || null,
        notes: notes.trim() || null,
      });
      router.push(`/admin/contracts/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
      setSaving(false);
    }
  }

  if (!templates.length) {
    return (
      <p className="mt-6 text-sm text-white/50">
        No contract templates found. Open Templates to seed the defaults.
      </p>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-6 max-w-3xl space-y-4 border border-white/10 bg-[#141414] p-5"
    >
      <label className="block text-xs uppercase tracking-wider text-white/40">
        Template
        <select
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
          required
          className="mt-1 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm normal-case tracking-normal text-white"
        >
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-xs uppercase tracking-wider text-white/40">
        Client
        <select
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          required
          className="mt-1 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm normal-case tracking-normal text-white"
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

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-4">
        <h3 className="text-xs uppercase tracking-wider text-white/40">Agreement</h3>
        <button
          type="button"
          onClick={() => fillFromTemplate({ force: true })}
          className="text-xs text-[#fdf0d5] hover:underline"
        >
          Reset from template
        </button>
      </div>

      <label className="block text-xs uppercase tracking-wider text-white/40">
        Title
        <input
          value={title}
          onChange={(e) => {
            dirtyRef.current = true;
            setTitle(e.target.value);
          }}
          required
          className="mt-1 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm normal-case tracking-normal text-white"
        />
      </label>

      <div>
        <TermsListEditor
          label="Terms for this contract"
          values={terms}
          hint="Edit before send — does not change the template or public Services page. Saved onto the contract for invoices."
          onChange={(next) => {
            dirtyRef.current = true;
            setTerms(next);
            rebuildBodyFromTerms(next, paymentNotes);
          }}
        />
        <label className="mt-3 block text-xs uppercase tracking-wider text-white/40">
          Payment notes
          <textarea
            value={paymentNotes}
            onChange={(e) => {
              dirtyRef.current = true;
              setPaymentNotes(e.target.value);
              rebuildBodyFromTerms(terms, e.target.value);
            }}
            rows={3}
            className="mt-1 w-full resize-y border border-white/15 bg-black/40 px-3 py-2 text-sm normal-case tracking-normal text-white"
          />
        </label>
      </div>

      <label className="block text-xs uppercase tracking-wider text-white/40">
        Agreement body
        <textarea
          value={bodyText}
          onChange={(e) => {
            dirtyRef.current = true;
            setBodyText(e.target.value);
          }}
          required
          rows={16}
          className="mt-1 w-full border border-white/15 bg-black/40 px-3 py-2 font-mono text-xs normal-case tracking-normal text-white"
        />
      </label>

      <label className="block text-xs uppercase tracking-wider text-white/40">
        Amount (USD, optional)
        <input
          value={amount}
          onChange={(e) => {
            dirtyRef.current = true;
            setAmount(e.target.value);
          }}
          onBlur={() => {
            if (!dirtyRef.current) fillFromTemplate({ force: true });
            else if (template) {
              const amountCents = amount ? Math.round(Number(amount) * 100) : null;
              const draft = buildContractDraft({
                template,
                client,
                seller,
                amountCents: Number.isFinite(amountCents as number) ? amountCents : null,
                terms,
                paymentNotes,
              });
              // Only refresh amount token in body if {{amount}} present and user hasn't heavily customized —
              // safer: rebuild title/body from current terms when amount blurs
              setTitle(draft.title);
              setBodyText(draft.bodyText);
            }
          }}
          type="number"
          step="0.01"
          className="mt-1 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm normal-case tracking-normal text-white"
        />
      </label>

      <label className="block text-xs uppercase tracking-wider text-white/40">
        Internal notes
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="mt-1 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm normal-case tracking-normal text-white"
        />
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
