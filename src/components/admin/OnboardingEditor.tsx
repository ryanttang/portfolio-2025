"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  addQuestionAction,
  applyTemplateAction,
  cancelOnboardingAction,
  deleteQuestionAction,
  saveAsTemplateAction,
  sendOnboardingInviteAction,
  updateOnboardingAction,
  updateQuestionAction,
} from "@/app/admin/actions/onboarding";
import { QUESTION_TYPES, type QuestionType } from "@/lib/onboarding/types";

type Onboarding = {
  id: string;
  clientId: string;
  projectName: string;
  welcomeMessage: string;
  status: string;
  currentStep: string;
  services: { id: string; label: string; group: string; price?: string }[];
  contractEnabled: boolean;
  contractId: string | null;
  depositEnabled: boolean;
  invoiceId: string | null;
};

type Question = {
  id: string;
  label: string;
  helpText: string | null;
  type: string;
  options: string[];
  required: boolean;
  sortOrder: number;
};

type Option = { id: string; label: string };

type ServiceOption = {
  id: string;
  label: string;
  group: string;
  price?: string;
};

export default function OnboardingEditor({
  onboarding,
  questions,
  contracts,
  invoices,
  templates,
  answers,
  inviteUrl,
  serviceCatalog,
}: {
  onboarding: Onboarding;
  questions: Question[];
  contracts: Option[];
  invoices: Option[];
  templates: Option[];
  answers: { id: string; key: string | null; questionId: string | null; value: unknown }[];
  inviteUrl: string | null;
  serviceCatalog: ServiceOption[];
}) {
  const router = useRouter();
  const [projectName, setProjectName] = useState(onboarding.projectName);
  const [welcomeMessage, setWelcomeMessage] = useState(onboarding.welcomeMessage);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(
    () => (onboarding.services || []).map((s) => s.id),
  );
  const [contractEnabled, setContractEnabled] = useState(onboarding.contractEnabled);
  const [contractId, setContractId] = useState(onboarding.contractId || "");
  const [depositEnabled, setDepositEnabled] = useState(onboarding.depositEnabled);
  const [invoiceId, setInvoiceId] = useState(onboarding.invoiceId || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState<QuestionType>("short_text");
  const [templateId, setTemplateId] = useState("");
  const [templateName, setTemplateName] = useState("");

  const serviceGroups = (() => {
    const map = new Map<string, ServiceOption[]>();
    for (const opt of serviceCatalog) {
      const list = map.get(opt.group) || [];
      list.push(opt);
      map.set(opt.group, list);
    }
    return Array.from(map.entries());
  })();

  function toggleService(id: string) {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function saveConfig() {
    setSaving(true);
    setMessage("");
    const services = serviceCatalog.filter((s) => selectedServiceIds.includes(s.id));
    await updateOnboardingAction(onboarding.id, {
      projectName,
      welcomeMessage,
      services,
      contractEnabled,
      contractId: contractEnabled && contractId ? contractId : null,
      depositEnabled,
      invoiceId: depositEnabled && invoiceId ? invoiceId : null,
    });
    setSaving(false);
    setMessage("Saved.");
    router.refresh();
  }

  async function sendInvite() {
    setSaving(true);
    setMessage("");
    const services = serviceCatalog.filter((s) => selectedServiceIds.includes(s.id));
    await updateOnboardingAction(onboarding.id, {
      projectName,
      welcomeMessage,
      services,
      contractEnabled,
      contractId: contractEnabled && contractId ? contractId : null,
      depositEnabled,
      invoiceId: depositEnabled && invoiceId ? invoiceId : null,
    });
    const result = await sendOnboardingInviteAction(onboarding.id);
    setSaving(false);
    setMessage(
      result.error
        ? `Invite created but email failed: ${result.error}. Link: ${result.url}`
        : `Invite sent. Link: ${result.url}`,
    );
    router.refresh();
  }

  async function addQuestion() {
    if (!newLabel.trim()) return;
    await addQuestionAction(onboarding.id, {
      label: newLabel.trim(),
      type: newType,
      required: true,
      options: [],
    });
    setNewLabel("");
    router.refresh();
  }

  async function applyTemplate() {
    if (!templateId) return;
    await applyTemplateAction(onboarding.id, templateId);
    router.refresh();
  }

  async function saveTemplate() {
    if (!templateName.trim()) return;
    await saveAsTemplateAction(onboarding.id, templateName.trim());
    setTemplateName("");
    setMessage("Template saved.");
    router.refresh();
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="rounded bg-white/10 px-2 py-1 capitalize">
          {onboarding.status.replace("_", " ")}
        </span>
        <span className="text-white/40">
          Step: <span className="capitalize text-white/70">{onboarding.currentStep}</span>
        </span>
        {inviteUrl && (
          <a href={inviteUrl} className="text-xs text-[#e6c47a] hover:underline" target="_blank">
            Latest invite link
          </a>
        )}
      </div>

      <section className="space-y-3 border border-white/10 bg-[#141414] p-4">
        <h2 className="text-sm font-semibold">Configuration</h2>
        <label className="block text-xs uppercase tracking-wider text-white/40">
          Project name
          <input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="mt-1 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-xs uppercase tracking-wider text-white/40">
          Welcome message
          <textarea
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
            rows={4}
            className="mt-1 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm"
          />
        </label>

        <div className="border border-white/10 p-3">
          <p className="text-xs uppercase tracking-wider text-white/40">Services</p>
          <p className="mt-1 text-xs text-white/35">
            Select what this onboarding / invite is for. Shown to the client and included in the
            invite email.
          </p>
          {serviceGroups.length === 0 ? (
            <p className="mt-3 text-sm text-white/40">
              No services in CMS yet. Add them under Content → services keys.
            </p>
          ) : (
            <div className="mt-3 space-y-4">
              {serviceGroups.map(([group, items]) => (
                <div key={group}>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#e6c47a]/80">
                    {group}
                  </p>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {items.map((item) => {
                      const checked = selectedServiceIds.includes(item.id);
                      return (
                        <li key={item.id}>
                          <label className="flex cursor-pointer items-start gap-2 text-sm text-white/80">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleService(item.id)}
                              className="mt-1"
                            />
                            <span>
                              {item.label}
                              {item.price ? (
                                <span className="ml-1 text-white/35">{item.price}</span>
                              ) : null}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
          {selectedServiceIds.length > 0 && (
            <p className="mt-3 text-xs text-white/40">
              {selectedServiceIds.length} selected
            </p>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 border border-white/10 p-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={contractEnabled}
                onChange={(e) => setContractEnabled(e.target.checked)}
              />
              Contract step
            </label>
            {contractEnabled && (
              <select
                value={contractId}
                onChange={(e) => setContractId(e.target.value)}
                className="w-full border border-white/15 bg-black/40 px-3 py-2 text-sm"
              >
                <option value="">Select contract…</option>
                {contracts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="space-y-2 border border-white/10 p-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={depositEnabled}
                onChange={(e) => setDepositEnabled(e.target.checked)}
              />
              Deposit step
            </label>
            {depositEnabled && (
              <select
                value={invoiceId}
                onChange={(e) => setInvoiceId(e.target.value)}
                className="w-full border border-white/15 bg-black/40 px-3 py-2 text-sm"
              >
                <option value="">Select invoice…</option>
                {invoices.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={saveConfig}
            disabled={saving}
            className="bg-[#e6c47a] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={sendInvite}
            disabled={saving}
            className="border border-white/20 px-4 py-2 text-sm"
          >
            Send / resend invite
          </button>
          {onboarding.status !== "cancelled" && onboarding.status !== "completed" && (
            <button
              type="button"
              onClick={async () => {
                if (!confirm("Cancel this onboarding?")) return;
                await cancelOnboardingAction(onboarding.id);
                router.refresh();
              }}
              className="border border-red-500/40 px-4 py-2 text-sm text-red-300"
            >
              Cancel
            </button>
          )}
        </div>
        {message && <p className="text-sm text-white/60 break-all">{message}</p>}
      </section>

      <section className="space-y-3 border border-white/10 bg-[#141414] p-4">
        <h2 className="text-sm font-semibold">Custom questions</h2>
        <p className="text-xs text-white/40">
          Fixed core intake (goals, timeline, budget, audience) is always included. Add project-specific
          questions below.
        </p>

        <div className="flex flex-wrap gap-2">
          <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            className="border border-white/15 bg-black/40 px-3 py-2 text-sm"
          >
            <option value="">Apply template…</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={applyTemplate}
            className="border border-white/20 px-3 py-1.5 text-xs"
          >
            Apply
          </button>
          <input
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="New template name"
            className="border border-white/15 bg-black/40 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={saveTemplate}
            className="border border-white/20 px-3 py-1.5 text-xs"
          >
            Save as template
          </button>
        </div>

        <ul className="space-y-2">
          {questions.map((q) => (
            <li key={q.id} className="flex flex-wrap items-start gap-2 border border-white/10 p-3">
              <div className="min-w-0 flex-1">
                <input
                  defaultValue={q.label}
                  onBlur={async (e) => {
                    if (e.target.value !== q.label) {
                      await updateQuestionAction(q.id, onboarding.id, {
                        label: e.target.value,
                      });
                      router.refresh();
                    }
                  }}
                  className="w-full border border-white/15 bg-black/40 px-2 py-1 text-sm"
                />
                <p className="mt-1 text-[10px] uppercase tracking-wider text-white/30">
                  {q.type}
                  {q.required ? " · required" : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await deleteQuestionAction(q.id, onboarding.id);
                  router.refresh();
                }}
                className="text-xs text-red-300"
              >
                Remove
              </button>
            </li>
          ))}
          {questions.length === 0 && (
            <li className="text-sm text-white/40">No custom questions yet.</li>
          )}
        </ul>

        <div className="flex flex-wrap gap-2 border-t border-white/10 pt-3">
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Question label"
            className="min-w-[200px] flex-1 border border-white/15 bg-black/40 px-3 py-2 text-sm"
          />
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as QuestionType)}
            className="border border-white/15 bg-black/40 px-3 py-2 text-sm"
          >
            {QUESTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={addQuestion}
            className="bg-white/10 px-3 py-2 text-sm"
          >
            Add question
          </button>
        </div>
      </section>

      {answers.length > 0 && (
        <section className="border border-white/10 bg-[#141414] p-4">
          <h2 className="text-sm font-semibold">Answers</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {answers.map((a) => (
              <li key={a.id} className="border-t border-white/5 pt-2">
                <span className="text-[10px] uppercase tracking-wider text-[#e6c47a]/80">
                  {a.key || a.questionId}
                </span>
                <pre className="mt-1 whitespace-pre-wrap text-white/70">
                  {typeof a.value === "object"
                    ? JSON.stringify(a.value, null, 2)
                    : String(a.value)}
                </pre>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
