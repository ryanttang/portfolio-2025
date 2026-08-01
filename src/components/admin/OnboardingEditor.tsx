"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  addQuestionAction,
  adminUpsertAnswerAction,
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
  const [selectedServices, setSelectedServices] = useState<ServiceOption[]>(
    () => onboarding.services || [],
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

  const selectedIds = new Set(selectedServices.map((s) => s.id));

  const serviceGroups = (() => {
    const map = new Map<string, ServiceOption[]>();
    for (const opt of serviceCatalog) {
      const list = map.get(opt.group) || [];
      list.push(opt);
      map.set(opt.group, list);
    }
    return Array.from(map.entries());
  })();

  function toggleService(item: ServiceOption) {
    setSelectedServices((prev) => {
      if (prev.some((s) => s.id === item.id)) {
        return prev.filter((s) => s.id !== item.id);
      }
      // Prefer any previously saved price for this onboarding, else catalog default
      const saved = (onboarding.services || []).find((s) => s.id === item.id);
      return [
        ...prev,
        {
          id: item.id,
          label: item.label,
          group: item.group,
          price: saved?.price ?? item.price ?? "",
        },
      ];
    });
  }

  function setServicePrice(id: string, price: string) {
    setSelectedServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, price } : s)),
    );
  }

  function buildServicesPayload() {
    return selectedServices.map((s) => ({
      id: s.id,
      label: s.label,
      group: s.group,
      ...(s.price?.trim() ? { price: s.price.trim() } : {}),
    }));
  }

  async function saveConfig() {
    setSaving(true);
    setMessage("");
    await updateOnboardingAction(onboarding.id, {
      projectName,
      welcomeMessage,
      services: buildServicesPayload(),
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
    await updateOnboardingAction(onboarding.id, {
      projectName,
      welcomeMessage,
      services: buildServicesPayload(),
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
    if (
      answers.some((a) => a.questionId) &&
      !confirm("Custom answers exist. Applying a template may fail if answers are present. Continue?")
    ) {
      return;
    }
    try {
      await applyTemplateAction(onboarding.id, templateId);
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not apply template.");
    }
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
            Select what this onboarding is for, then edit pricing for this engagement if needed.
            Catalog prices are defaults only.
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
                  <ul className="space-y-2">
                    {items.map((item) => {
                      const checked = selectedIds.has(item.id);
                      const selected = selectedServices.find((s) => s.id === item.id);
                      return (
                        <li
                          key={item.id}
                          className="flex flex-wrap items-center gap-2 border border-white/5 px-2 py-2"
                        >
                          <label className="flex min-w-[180px] flex-1 cursor-pointer items-start gap-2 text-sm text-white/80">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleService(item)}
                              className="mt-1"
                            />
                            <span>
                              {item.label}
                              {item.price ? (
                                <span className="ml-1 text-white/30">list {item.price}</span>
                              ) : null}
                            </span>
                          </label>
                          {checked && (
                            <label className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/40">
                              Price
                              <input
                                type="text"
                                value={selected?.price || ""}
                                onChange={(e) => setServicePrice(item.id, e.target.value)}
                                placeholder={item.price || "$0"}
                                className="w-28 border border-white/15 bg-black/40 px-2 py-1 text-sm normal-case tracking-normal text-white"
                              />
                            </label>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
          {selectedServices.length > 0 && (
            <div className="mt-4 border-t border-white/10 pt-3">
              <p className="text-[11px] uppercase tracking-wider text-white/40">
                This onboarding ({selectedServices.length})
              </p>
              <ul className="mt-2 space-y-1 text-sm text-white/70">
                {selectedServices.map((s) => (
                  <li key={s.id} className="flex justify-between gap-3">
                    <span>{s.label}</span>
                    <span className="text-white/45">{s.price || "—"}</span>
                  </li>
                ))}
              </ul>
            </div>
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
                  if (!confirm("Remove this question?")) return;
                  try {
                    await deleteQuestionAction(q.id, onboarding.id);
                    router.refresh();
                  } catch (err) {
                    setMessage(err instanceof Error ? err.message : "Could not delete.");
                  }
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
          <p className="mt-1 text-xs text-white/40">Edit text answers if you need to correct them.</p>
          <ul className="mt-3 space-y-3 text-sm">
            {answers.map((a) => {
              const value = a.value as {
                text?: string;
                url?: string;
                filename?: string;
                bool?: boolean;
                selected?: string[];
              };
              const label =
                a.key ||
                questions.find((q) => q.id === a.questionId)?.label ||
                a.questionId ||
                "Answer";
              return (
                <li key={a.id} className="border-t border-white/5 pt-3">
                  <span className="text-[10px] uppercase tracking-wider text-[#e6c47a]/80">
                    {label}
                  </span>
                  {value?.url ? (
                    <p className="mt-1">
                      <a
                        href={value.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#e6c47a] hover:underline"
                      >
                        {value.filename || "Download file"}
                      </a>
                    </p>
                  ) : typeof value?.text === "string" ? (
                    <textarea
                      defaultValue={value.text}
                      rows={2}
                      onBlur={async (e) => {
                        if (e.target.value === value.text) return;
                        await adminUpsertAnswerAction({
                          onboardingId: onboarding.id,
                          questionId: a.questionId,
                          key: a.key,
                          value: { text: e.target.value },
                        });
                        router.refresh();
                      }}
                      className="mt-1 w-full border border-white/15 bg-black/40 px-2 py-1 text-sm"
                    />
                  ) : (
                    <pre className="mt-1 whitespace-pre-wrap text-white/70">
                      {JSON.stringify(a.value, null, 2)}
                    </pre>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
