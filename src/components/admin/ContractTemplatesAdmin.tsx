"use client";

import Link from "next/link";
import { useState } from "react";
import {
  loadServicesTermsOntoTemplateAction,
  updateContractTemplateAction,
} from "@/app/admin/actions/contracts";
import TermsListEditor from "@/components/admin/TermsListEditor";
import { CONTRACT_MERGE_FIELD_OPTIONS } from "@/lib/contracts/merge";

export type TemplateListItem = {
  id: string;
  name: string;
  slug: string;
  kind: string;
  titleTemplate: string;
  bodyTemplate: string;
  terms: string[];
  paymentNotes: string | null;
};

export default function ContractTemplatesAdmin({
  templates: initial,
}: {
  templates: TemplateListItem[];
}) {
  const [templates, setTemplates] = useState(initial);
  const [activeId, setActiveId] = useState(initial[0]?.id || "");
  const active = templates.find((t) => t.id === activeId) || templates[0];

  if (!active) {
    return <p className="mt-6 text-sm text-white/40">No templates yet.</p>;
  }

  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-[220px_1fr]">
      <aside className="border border-white/10 bg-[#141414] p-2">
        <p className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-white/35">
          Templates
        </p>
        <ul className="mt-1 space-y-0.5">
          {templates.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => setActiveId(t.id)}
                className={`w-full px-2 py-2 text-left text-sm ${
                  t.id === active.id
                    ? "bg-[#fdf0d5]/15 text-[#fdf0d5]"
                    : "text-white/70 hover:bg-white/[0.04]"
                }`}
              >
                <span className="block font-medium">{t.name}</span>
                <span className="block text-[10px] uppercase tracking-wider text-white/35">
                  {t.kind}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <TemplateEditor
        key={active.id}
        template={active}
        onSaved={(next) => {
          setTemplates((prev) => prev.map((t) => (t.id === next.id ? next : t)));
        }}
      />
    </div>
  );
}

function TemplateEditor({
  template,
  onSaved,
}: {
  template: TemplateListItem;
  onSaved: (t: TemplateListItem) => void;
}) {
  const [name, setName] = useState(template.name);
  const [kind, setKind] = useState(template.kind);
  const [titleTemplate, setTitleTemplate] = useState(template.titleTemplate);
  const [bodyTemplate, setBodyTemplate] = useState(template.bodyTemplate);
  const [terms, setTerms] = useState(
    Array.isArray(template.terms) ? template.terms : [],
  );
  const [paymentNotes, setPaymentNotes] = useState(template.paymentNotes || "");
  const [saving, setSaving] = useState(false);
  const [loadingTerms, setLoadingTerms] = useState(false);
  const [msg, setMsg] = useState("");

  const canLoadFromServices = kind === "project" || kind === "retainer";

  async function save() {
    setSaving(true);
    setMsg("");
    try {
      await updateContractTemplateAction(template.id, {
        name,
        kind: kind as "project" | "retainer" | "consulting",
        titleTemplate,
        bodyTemplate,
        terms,
        paymentNotes,
      });
      onSaved({
        ...template,
        name,
        kind,
        titleTemplate,
        bodyTemplate,
        terms: terms.map((t) => t.trim()).filter(Boolean),
        paymentNotes: paymentNotes.trim() || null,
      });
      setMsg("Template saved.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function loadFromServices() {
    setLoadingTerms(true);
    setMsg("");
    try {
      const result = await loadServicesTermsOntoTemplateAction(template.id);
      setTerms(result.terms);
      setPaymentNotes(result.paymentNotes || "");
      onSaved({
        ...template,
        name,
        kind,
        titleTemplate,
        bodyTemplate,
        terms: result.terms,
        paymentNotes: result.paymentNotes,
      });
      setMsg("Loaded terms from Services terms.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Could not load terms");
    } finally {
      setLoadingTerms(false);
    }
  }

  return (
    <div className="space-y-4 border border-white/10 bg-[#141414] p-4">
      <div>
        <h2 className="text-sm font-semibold">{template.name}</h2>
        <p className="mt-1 text-xs text-white/40">
          Edit the standard agreement. Use merge tokens — they fill from CRM when you create a
          contract. Shared term bullets live under{" "}
          <Link href="/admin/contracts/terms" className="text-[#fdf0d5] hover:underline">
            Terms
          </Link>
          .
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {CONTRACT_MERGE_FIELD_OPTIONS.map((f) => (
          <span
            key={f.token}
            className="border border-white/10 px-1.5 py-0.5 font-mono text-[10px] text-white/45"
            title={f.label}
          >
            {f.token}
          </span>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs uppercase tracking-wider text-white/40">
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm normal-case tracking-normal text-white outline-none focus:border-[#fdf0d5]"
          />
        </label>
        <label className="block text-xs uppercase tracking-wider text-white/40">
          Kind
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            className="mt-1 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm normal-case tracking-normal text-white outline-none focus:border-[#fdf0d5]"
          >
            <option value="project">Project</option>
            <option value="retainer">Retainer</option>
            <option value="consulting">Consulting</option>
          </select>
        </label>
        <div className="sm:col-span-2">
          <label className="block text-xs uppercase tracking-wider text-white/40">
            Title template
            <input
              value={titleTemplate}
              onChange={(e) => setTitleTemplate(e.target.value)}
              className="mt-1 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm normal-case tracking-normal text-white outline-none focus:border-[#fdf0d5]"
            />
          </label>
        </div>
      </div>

      <div className="border-t border-white/10 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-xs uppercase tracking-wider text-white/40">Terms</h3>
            <p className="mt-1 text-[10px] text-white/30">
              Injected into the body wherever you place {"{{terms}}"}.
            </p>
          </div>
          {canLoadFromServices && (
            <button
              type="button"
              onClick={() => void loadFromServices()}
              disabled={loadingTerms || saving}
              className="border border-white/15 px-2.5 py-1 text-[11px] text-white/70 hover:text-[#fdf0d5] disabled:opacity-50"
            >
              {loadingTerms ? "Loading…" : "Load from Services terms"}
            </button>
          )}
        </div>
        <div className="mt-3">
          <TermsListEditor
            label=""
            values={terms}
            onChange={setTerms}
          />
        </div>
        <label className="mt-4 block text-xs uppercase tracking-wider text-white/40">
          Payment notes (optional)
          <textarea
            value={paymentNotes}
            onChange={(e) => setPaymentNotes(e.target.value)}
            rows={3}
            className="mt-1 w-full resize-y border border-white/15 bg-black/40 px-3 py-2 text-sm normal-case tracking-normal text-white outline-none focus:border-[#fdf0d5]"
          />
          <span className="mt-1 block text-[10px] normal-case tracking-normal text-white/30">
            Becomes the contract payment schedule snapshot used when creating invoices.
          </span>
        </label>
      </div>

      <div className="border-t border-white/10 pt-4">
        <label className="block text-xs uppercase tracking-wider text-white/40">
          Body template
          <textarea
            value={bodyTemplate}
            onChange={(e) => setBodyTemplate(e.target.value)}
            rows={18}
            spellCheck={false}
            className="mt-1 w-full resize-y border border-white/15 bg-black/40 px-3 py-2 font-mono text-xs normal-case tracking-normal text-white outline-none focus:border-[#fdf0d5]"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving || loadingTerms}
          className="bg-[#fdf0d5] px-4 py-2 text-sm font-semibold text-black disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save template"}
        </button>
        {msg && <p className="text-sm text-white/50">{msg}</p>}
      </div>
    </div>
  );
}
