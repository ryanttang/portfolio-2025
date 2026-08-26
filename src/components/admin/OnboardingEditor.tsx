"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  addQuestionAction,
  addStarterQuestionsAction,
  adminUpsertAnswerAction,
  applyTemplateAction,
  cancelOnboardingAction,
  deleteQuestionAction,
  saveAsTemplateAction,
  sendOnboardingInviteAction,
  updateOnboardingAction,
  updateOnboardingClientInfoAction,
  updateQuestionAction,
} from "@/app/admin/actions/onboarding";
import SensitiveAnswerReveal from "@/components/admin/SensitiveAnswerReveal";
import {
  ONBOARDING_STEPS,
  QUESTION_TYPES,
  QUESTION_TYPE_LABELS,
  type OnboardingStep,
  type QuestionType,
} from "@/lib/onboarding/types";

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
  key?: string | null;
  sensitive?: boolean;
};

type Option = { id: string; label: string };

type ServiceOption = {
  id: string;
  label: string;
  group: string;
  price?: string;
};

type ClientSummary = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  address: string | null;
};

const STEP_TABS: { key: OnboardingStep; label: string }[] = [
  { key: "welcome", label: "Welcome" },
  { key: "info", label: "Client info" },
  { key: "questionnaire", label: "Questionnaire" },
  { key: "contract", label: "Contract" },
  { key: "deposit", label: "Deposit" },
  { key: "handoff", label: "Handoff" },
];

function initialTab(currentStep: string): OnboardingStep {
  return ONBOARDING_STEPS.includes(currentStep as OnboardingStep)
    ? (currentStep as OnboardingStep)
    : "welcome";
}

export default function OnboardingEditor({
  onboarding,
  client,
  questions,
  contracts,
  invoices,
  templates,
  answers,
  inviteUrl,
  serviceCatalog,
  contractDetail,
  invoiceDetail,
}: {
  onboarding: Onboarding;
  client: ClientSummary;
  questions: Question[];
  contracts: Option[];
  invoices: Option[];
  templates: Option[];
  answers: { id: string; key: string | null; questionId: string | null; value: unknown }[];
  inviteUrl: string | null;
  serviceCatalog: ServiceOption[];
  contractDetail?: string;
  invoiceDetail?: string;
}) {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState<OnboardingStep>(() =>
    initialTab(onboarding.currentStep),
  );
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
  const [newSensitive, setNewSensitive] = useState(false);
  const [templateId, setTemplateId] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [clientForm, setClientForm] = useState({
    name: client.name,
    email: client.email,
    company: client.company || "",
    phone: client.phone || "",
    address: client.address || "",
  });
  const [savingClient, setSavingClient] = useState(false);

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

  function isStepEnabled(key: OnboardingStep) {
    if (key === "contract") return contractEnabled;
    if (key === "deposit") return depositEnabled;
    return true;
  }

  function toggleService(item: ServiceOption) {
    setSelectedServices((prev) => {
      if (prev.some((s) => s.id === item.id)) {
        return prev.filter((s) => s.id !== item.id);
      }
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

  async function addStarterQuestions() {
    await addStarterQuestionsAction(onboarding.id);
    router.refresh();
  }

  async function addQuestion() {
    if (!newLabel.trim()) return;
    await addQuestionAction(onboarding.id, {
      label: newLabel.trim(),
      type: newType,
      required: true,
      options: [],
      sensitive: newType === "login" || newSensitive,
    });
    setNewLabel("");
    setNewSensitive(false);
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

  async function saveClientInfo() {
    if (!clientForm.name.trim() || !clientForm.email.trim()) {
      setMessage("Name and email are required.");
      return;
    }
    setSavingClient(true);
    setMessage("");
    try {
      await updateOnboardingClientInfoAction(onboarding.id, {
        name: clientForm.name.trim(),
        email: clientForm.email.trim(),
        company: clientForm.company,
        phone: clientForm.phone,
        address: clientForm.address,
      });
      setMessage("Client info saved. It will be prefilled in the wizard.");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not save client info.");
    }
    setSavingClient(false);
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="rounded bg-white/10 px-2 py-1 capitalize">
          {onboarding.status.replace("_", " ")}
        </span>
        <span className="text-white/40">
          Client at:{" "}
          <span className="capitalize text-white/70">{onboarding.currentStep}</span>
        </span>
        {inviteUrl && (
          <a href={inviteUrl} className="text-xs text-[#fdf0d5] hover:underline" target="_blank">
            Latest invite link
          </a>
        )}
      </div>

      <section className="border border-white/10 bg-[#141414]">
        <div className="border-b border-white/10 p-4">
          <h2 className="text-sm font-semibold">Project setup</h2>
          <p className="mt-1 text-xs text-white/40">
            Select a wizard step to edit what the client sees there.
          </p>
          <label className="mt-3 block text-xs uppercase tracking-wider text-white/40">
            Project name
            <input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="mt-1 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm"
            />
          </label>
        </div>

        <div
          role="tablist"
          aria-label="Wizard steps"
          className="flex flex-wrap gap-1 border-b border-white/10 px-2 pt-2"
        >
          {STEP_TABS.map((tab) => {
            const enabled = isStepEnabled(tab.key);
            const selected = activeStep === tab.key;
            const isClientHere = onboarding.currentStep === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveStep(tab.key)}
                className={`rounded-t px-3 py-2 text-[11px] uppercase tracking-wider transition ${
                  selected
                    ? "bg-[#fdf0d5] text-black"
                    : enabled
                      ? "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                      : "bg-transparent text-white/30 hover:bg-white/5 hover:text-white/50"
                } ${!enabled && !selected ? "line-through decoration-white/20" : ""}`}
              >
                {tab.label}
                {isClientHere && !selected ? (
                  <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#fdf0d5]" />
                ) : null}
              </button>
            );
          })}
        </div>

        <div role="tabpanel" className="space-y-4 p-4">
          {activeStep === "welcome" && (
            <>
              <p className="text-xs text-white/40">
                Shown first. Welcome copy and the services list for this engagement.
              </p>
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
                  Select what this onboarding is for, then edit pricing for this engagement if
                  needed. Catalog prices are defaults only.
                </p>
                {serviceGroups.length === 0 ? (
                  <p className="mt-3 text-sm text-white/40">
                    No services in CMS yet. Add them under Content → services keys.
                  </p>
                ) : (
                  <div className="mt-3 space-y-4">
                    {serviceGroups.map(([group, items]) => (
                      <div key={group}>
                        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#fdf0d5]/80">
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
            </>
          )}

          {activeStep === "info" && (
            <>
              <p className="text-xs text-white/40">
                Prefill contact details here. The client will see these values already filled in and
                only need to confirm (or correct) them.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    ["name", "Name", true],
                    ["email", "Email", true],
                    ["company", "Company", false],
                    ["phone", "Phone", false],
                    ["address", "Address", false],
                  ] as const
                ).map(([key, label, required]) => (
                  <label
                    key={key}
                    className={`block text-xs uppercase tracking-wider text-white/40 ${
                      key === "address" ? "sm:col-span-2" : ""
                    }`}
                  >
                    {label}
                    {required ? "" : " · optional"}
                    <input
                      type={key === "email" ? "email" : "text"}
                      required={required}
                      value={clientForm[key]}
                      onChange={(e) =>
                        setClientForm((prev) => ({ ...prev, [key]: e.target.value }))
                      }
                      className="mt-1 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm normal-case tracking-normal text-white"
                    />
                  </label>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={saveClientInfo}
                  disabled={savingClient}
                  className="bg-[#fdf0d5] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
                >
                  {savingClient ? "Saving…" : "Save client info"}
                </button>
                <Link
                  href={`/admin/crm/${client.id}`}
                  className="text-sm text-[#fdf0d5] hover:underline"
                >
                  Open full CRM record →
                </Link>
              </div>
            </>
          )}

          {activeStep === "questionnaire" && (
            <>
              <p className="text-xs text-white/40">
                Optional step. Mark a question as encrypted when you need logins or other secrets —
                answers are stored encrypted and only you can reveal them in admin.
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
                <button
                  type="button"
                  onClick={addStarterQuestions}
                  className="border border-white/20 px-3 py-1.5 text-xs"
                >
                  Insert starter questions
                </button>
              </div>

              <ul className="space-y-2">
                {questions.map((q) => (
                  <li
                    key={q.id}
                    className="flex flex-wrap items-start gap-2 border border-white/10 p-3"
                  >
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
                        {QUESTION_TYPE_LABELS[q.type as QuestionType] || q.type}
                        {q.required ? " · required" : " · optional"}
                        {q.sensitive || q.type === "login" ? " · encrypted" : ""}
                      </p>
                    </div>
                    <label className="flex items-center gap-1 self-center text-[10px] uppercase tracking-wider text-white/40">
                      <input
                        type="checkbox"
                        checked={q.required}
                        onChange={async (e) => {
                          await updateQuestionAction(q.id, onboarding.id, {
                            required: e.target.checked,
                          });
                          router.refresh();
                        }}
                      />
                      Required
                    </label>
                    <label className="flex items-center gap-1 self-center text-[10px] uppercase tracking-wider text-white/40">
                      <input
                        type="checkbox"
                        checked={Boolean(q.sensitive) || q.type === "login"}
                        disabled={q.type === "login"}
                        onChange={async (e) => {
                          await updateQuestionAction(q.id, onboarding.id, {
                            sensitive: e.target.checked,
                          });
                          router.refresh();
                        }}
                      />
                      Encrypt
                    </label>
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
                  <li className="text-sm text-white/40">
                    No questions yet — this step is skipped until you add some.
                  </li>
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
                  onChange={(e) => {
                    const next = e.target.value as QuestionType;
                    setNewType(next);
                    if (next === "login") setNewSensitive(true);
                  }}
                  className="border border-white/15 bg-black/40 px-3 py-2 text-sm"
                >
                  {QUESTION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {QUESTION_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-white/40">
                  <input
                    type="checkbox"
                    checked={newType === "login" || newSensitive}
                    disabled={newType === "login"}
                    onChange={(e) => setNewSensitive(e.target.checked)}
                  />
                  Encrypt
                </label>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="bg-white/10 px-3 py-2 text-sm"
                >
                  Add question
                </button>
                {newType === "login" && (
                  <p className="w-full text-xs text-white/40">
                    Login info shows username and password fields (clients can add more than one) and is always encrypted.
                  </p>
                )}
              </div>

              {answers.length > 0 && (
                <div className="border-t border-white/10 pt-4">
                  <h3 className="text-sm font-semibold">Answers</h3>
                  <p className="mt-1 text-xs text-white/40">
                    Encrypted answers stay hidden until you reveal them. Only admins can decrypt.
                  </p>
                  <ul className="mt-3 space-y-3 text-sm">
                    {answers.map((a) => {
                      const value = a.value as {
                        text?: string;
                        url?: string;
                        filename?: string;
                        bool?: boolean;
                        selected?: string[];
                        redacted?: boolean;
                        saved?: boolean;
                      };
                      const question = questions.find((q) => q.id === a.questionId);
                      const label =
                        question?.label ||
                        a.key ||
                        a.questionId ||
                        "Answer";
                      const encrypted = Boolean(question?.sensitive || value?.redacted);
                      return (
                        <li key={a.id} className="border-t border-white/5 pt-3">
                          <span className="text-[10px] uppercase tracking-wider text-[#fdf0d5]/80">
                            {label}
                          </span>
                          {encrypted || question?.type === "login" ? (
                            <SensitiveAnswerReveal
                              answerId={a.id}
                              onboardingId={onboarding.id}
                              questionId={a.questionId}
                              answerKey={a.key}
                              filename={value?.filename}
                            />
                          ) : value?.url ? (
                            <p className="mt-1">
                              <a
                                href={value.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#fdf0d5] hover:underline"
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
                </div>
              )}
            </>
          )}

          {activeStep === "contract" && (
            <>
              <p className="text-xs text-white/40">
                Optional step. When enabled, the client must sign the linked contract before
                continuing.
              </p>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={contractEnabled}
                  onChange={(e) => setContractEnabled(e.target.checked)}
                />
                Include contract step
              </label>
              {contractEnabled && (
                <div className="space-y-2">
                  <select
                    value={contractId}
                    onChange={(e) => setContractId(e.target.value)}
                    className="w-full max-w-md border border-white/15 bg-black/40 px-3 py-2 text-sm"
                  >
                    <option value="">Select contract…</option>
                    {contracts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  {contractDetail && (
                    <p className="text-xs text-white/40">Linked: {contractDetail}</p>
                  )}
                  <Link
                    href="/admin/contracts"
                    className="inline-block text-sm text-[#fdf0d5] hover:underline"
                  >
                    Manage contracts →
                  </Link>
                </div>
              )}
            </>
          )}

          {activeStep === "deposit" && (
            <>
              <p className="text-xs text-white/40">
                Optional step. When enabled, the client must pay the linked invoice before
                continuing.
              </p>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={depositEnabled}
                  onChange={(e) => setDepositEnabled(e.target.checked)}
                />
                Include deposit step
              </label>
              {depositEnabled && (
                <div className="space-y-2">
                  <select
                    value={invoiceId}
                    onChange={(e) => setInvoiceId(e.target.value)}
                    className="w-full max-w-md border border-white/15 bg-black/40 px-3 py-2 text-sm"
                  >
                    <option value="">Select invoice…</option>
                    {invoices.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.label}
                      </option>
                    ))}
                  </select>
                  {invoiceDetail && (
                    <p className="text-xs text-white/40">Linked: {invoiceDetail}</p>
                  )}
                  <Link
                    href="/admin/invoices"
                    className="inline-block text-sm text-[#fdf0d5] hover:underline"
                  >
                    Manage invoices →
                  </Link>
                </div>
              )}
            </>
          )}

          {activeStep === "handoff" && (
            <>
              <p className="text-xs text-white/40">
                Final step. After the client completes handoff, they land in the project portal
                hub.
              </p>
              <div className="border border-white/10 px-3 py-3 text-sm text-white/70">
                <p>
                  Configure updates and milestones in{" "}
                  <span className="text-white/90">Portal content</span> below so the hub is ready
                  when onboarding finishes.
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-white/10 p-4">
          <button
            type="button"
            onClick={saveConfig}
            disabled={saving}
            className="bg-[#fdf0d5] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
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
          {message && <p className="w-full text-sm text-white/60 break-all">{message}</p>}
        </div>
      </section>
    </div>
  );
}
