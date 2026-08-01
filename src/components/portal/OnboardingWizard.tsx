"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  advanceOnboardingAction,
  completeHandoffAction,
  saveClientInfoAction,
  saveQuestionnaireAction,
  uploadQuestionnaireFileAction,
} from "@/app/portal/actions/onboarding";
import {
  CORE_ANSWER_KEYS,
  CORE_QUESTION_LABELS,
  type CoreAnswerKey,
  type OnboardingStep,
} from "@/lib/onboarding/types";

type Question = {
  id: string;
  label: string;
  helpText: string | null;
  type: string;
  options: string[];
  required: boolean;
};

export default function OnboardingWizard({
  onboardingId,
  onboarding,
  client,
  questions,
  answers,
  enabledSteps,
  contract,
  invoice,
}: {
  onboardingId: string;
  onboarding: {
    id: string;
    projectName: string;
    welcomeMessage: string;
    currentStep: string;
    status: string;
    contractEnabled: boolean;
    depositEnabled: boolean;
    services: { id: string; label: string; group: string; price?: string }[];
  };
  client: {
    name: string;
    email: string;
    company: string | null;
    phone: string | null;
    address: string | null;
  };
  questions: Question[];
  answers: { key: string | null; questionId: string | null; value: unknown }[];
  enabledSteps: OnboardingStep[];
  contract: { title: string; status: string; token: string } | null;
  invoice: {
    invoiceNumber: string;
    status: string;
    payToken: string;
    totalCents: number;
  } | null;
}) {
  const router = useRouter();
  const step = onboarding.currentStep as OnboardingStep;
  const stepIndex = Math.max(0, enabledSteps.indexOf(step));

  const coreDefaults: Record<CoreAnswerKey, string> = {
    goals: "",
    timeline: "",
    budget: "",
    audience: "",
  };
  for (const a of answers) {
    if (a.key && CORE_ANSWER_KEYS.includes(a.key as CoreAnswerKey)) {
      const v = a.value as { text?: string };
      coreDefaults[a.key as CoreAnswerKey] = v?.text || "";
    }
  }

  return (
    <div>
      <p className="font-[family-name:var(--font-syne)] text-xs uppercase tracking-[0.25em] text-[#fdf0d5]">
        Onboarding
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-syne)] text-3xl font-bold">
        {onboarding.projectName || "Your project"}
      </h1>

      <ol className="mt-6 flex flex-wrap gap-2">
        {enabledSteps.map((s, i) => (
          <li
            key={s}
            className={`rounded px-2.5 py-1 text-[11px] uppercase tracking-wider ${
              i === stepIndex
                ? "bg-[#fdf0d5] text-black"
                : i < stepIndex
                  ? "bg-white/15 text-white/80"
                  : "bg-white/5 text-white/40"
            }`}
          >
            {s}
          </li>
        ))}
      </ol>

      <div className="mt-8 border border-white/10 bg-[#141414] p-6">
        {step === "welcome" && (
          <WelcomeStep
            message={onboarding.welcomeMessage}
            services={onboarding.services || []}
            onContinue={async () => {
              await advanceOnboardingAction(onboardingId, "welcome");
              router.refresh();
            }}
          />
        )}
        {step === "info" && (
          <InfoStep
            client={client}
            onSave={async (data) => {
              await saveClientInfoAction(onboardingId, data);
              router.refresh();
            }}
          />
        )}
        {step === "questionnaire" && (
          <QuestionnaireStep
            onboardingId={onboardingId}
            questions={questions}
            coreDefaults={coreDefaults}
            answerMap={Object.fromEntries(
              answers
                .filter((a) => a.questionId)
                .map((a) => [a.questionId!, a.value]),
            )}
            onSave={async (data) => {
              await saveQuestionnaireAction(onboardingId, data);
              router.refresh();
            }}
          />
        )}
        {step === "contract" && (
          <ContractStep
            contract={contract}
            onContinue={async () => {
              if (contract?.status !== "signed") return;
              await advanceOnboardingAction(onboardingId, "contract");
              router.refresh();
            }}
            onRefresh={() => router.refresh()}
          />
        )}
        {step === "deposit" && (
          <DepositStep
            invoice={invoice}
            onContinue={async () => {
              if (invoice?.status !== "paid") return;
              await advanceOnboardingAction(onboardingId, "deposit");
              router.refresh();
            }}
            onRefresh={() => router.refresh()}
          />
        )}
        {step === "handoff" && (
          <HandoffStep
            projectName={onboarding.projectName}
            onComplete={async () => {
              await completeHandoffAction(onboardingId);
              router.push(`/portal/projects/${onboardingId}`);
              router.refresh();
            }}
          />
        )}
      </div>
    </div>
  );
}

function WelcomeStep({
  message,
  services,
  onContinue,
}: {
  message: string;
  services: { id: string; label: string; group: string; price?: string }[];
  onContinue: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  return (
    <div>
      <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold">Welcome</h2>
      <p className="mt-4 whitespace-pre-wrap text-white/70">{message}</p>
      {services.length > 0 && (
        <div className="mt-6">
          <p className="text-xs uppercase tracking-wider text-white/40">Services included</p>
          <ul className="mt-2 space-y-1">
            {services.map((s) => (
              <li key={s.id} className="text-sm text-white/75">
                {s.label}
                {s.price ? <span className="ml-2 text-white/35">{s.price}</span> : null}
                <span className="ml-2 text-[10px] uppercase tracking-wider text-white/30">
                  {s.group}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <button
        type="button"
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          await onContinue();
        }}
        className="mt-6 bg-[#fdf0d5] px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-50"
      >
        Continue
      </button>
    </div>
  );
}

function InfoStep({
  client,
  onSave,
}: {
  client: {
    name: string;
    email: string;
    company: string | null;
    phone: string | null;
    address: string | null;
  };
  onSave: (data: {
    name: string;
    email: string;
    company?: string;
    phone?: string;
    address?: string;
  }) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: client.name,
    email: client.email,
    company: client.company || "",
    phone: client.phone || "",
    address: client.address || "",
  });

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        await onSave(form);
      }}
      className="space-y-3"
    >
      <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold">
        Confirm your info
      </h2>
      <p className="text-sm text-white/50">
        Review the details below — update anything that looks off, then continue.
      </p>
      {(
        [
          ["name", "Name"],
          ["email", "Email"],
          ["company", "Company"],
          ["phone", "Phone"],
          ["address", "Address"],
        ] as const
      ).map(([key, label]) => (
        <label key={key} className="block text-xs uppercase tracking-wider text-white/40">
          {label}
          <input
            required={key === "name" || key === "email"}
            type={key === "email" ? "email" : "text"}
            value={form[key]}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            className="mt-1 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm"
          />
        </label>
      ))}
      <button
        type="submit"
        disabled={loading}
        className="mt-2 bg-[#fdf0d5] px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-50"
      >
        {loading ? "Saving…" : "Looks good — continue"}
      </button>
    </form>
  );
}

function QuestionnaireStep({
  onboardingId,
  questions,
  coreDefaults,
  answerMap,
  onSave,
}: {
  onboardingId: string;
  questions: Question[];
  coreDefaults: Record<CoreAnswerKey, string>;
  answerMap: Record<string, unknown>;
  onSave: (data: {
    core: Partial<Record<CoreAnswerKey, string>>;
    answers: { questionId: string; value: unknown }[];
  }) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const [core, setCore] = useState(coreDefaults);
  const [custom, setCustom] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const q of questions) {
      const v = answerMap[q.id] as {
        text?: string;
        bool?: boolean;
        selected?: string[];
        url?: string;
        filename?: string;
      };
      if (q.type === "boolean") init[q.id] = v?.bool ? "true" : "false";
      else if (q.type === "multi_select") init[q.id] = (v?.selected || []).join(", ");
      else if (q.type === "single_select") init[q.id] = (v?.selected || [])[0] || "";
      else if (q.type === "file") init[q.id] = v?.url || "";
      else init[q.id] = v?.text || "";
    }
    return init;
  });
  const [fileNames, setFileNames] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const q of questions) {
      if (q.type !== "file") continue;
      const v = answerMap[q.id] as { filename?: string };
      if (v?.filename) init[q.id] = v.filename;
    }
    return init;
  });

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        await onSave({
          core,
          answers: questions
            .filter((q) => q.type !== "file")
            .map((q) => {
              const raw = custom[q.id] || "";
              if (q.type === "boolean")
                return { questionId: q.id, value: { bool: raw === "true" } };
              if (q.type === "multi_select")
                return {
                  questionId: q.id,
                  value: {
                    selected: raw
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  },
                };
              if (q.type === "single_select")
                return { questionId: q.id, value: { selected: raw ? [raw] : [] } };
              return { questionId: q.id, value: { text: raw } };
            }),
        });
      }}
      className="space-y-4"
    >
      <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold">Questionnaire</h2>

      {CORE_ANSWER_KEYS.map((key) => (
        <label key={key} className="block text-xs uppercase tracking-wider text-white/40">
          {CORE_QUESTION_LABELS[key]}
          <textarea
            required
            value={core[key]}
            onChange={(e) => setCore({ ...core, [key]: e.target.value })}
            rows={key === "goals" ? 3 : 2}
            className="mt-1 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm normal-case tracking-normal"
          />
        </label>
      ))}

      {questions.map((q) => (
        <label key={q.id} className="block text-xs uppercase tracking-wider text-white/40">
          {q.label}
          {q.helpText && (
            <span className="mt-0.5 block normal-case text-white/30">{q.helpText}</span>
          )}
          {q.type === "file" ? (
            <div className="mt-1">
              <input
                type="file"
                accept="image/*,application/pdf"
                required={q.required && !custom[q.id]}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const fd = new FormData();
                  fd.set("file", file);
                  const result = await uploadQuestionnaireFileAction(
                    onboardingId,
                    q.id,
                    fd,
                  );
                  setCustom({ ...custom, [q.id]: result.url });
                  setFileNames({ ...fileNames, [q.id]: result.filename });
                }}
                className="w-full text-sm normal-case"
              />
              {fileNames[q.id] && (
                <p className="mt-1 text-xs normal-case text-white/50">
                  Uploaded: {fileNames[q.id]}
                </p>
              )}
            </div>
          ) : q.type === "boolean" ? (
            <select
              required={q.required}
              value={custom[q.id] || "false"}
              onChange={(e) => setCustom({ ...custom, [q.id]: e.target.value })}
              className="mt-1 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm normal-case"
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          ) : q.type === "single_select" ? (
            <select
              required={q.required}
              value={custom[q.id] || ""}
              onChange={(e) => setCustom({ ...custom, [q.id]: e.target.value })}
              className="mt-1 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm normal-case"
            >
              <option value="">Select…</option>
              {(q.options || []).map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          ) : (
            <textarea
              required={q.required}
              value={custom[q.id] || ""}
              onChange={(e) => setCustom({ ...custom, [q.id]: e.target.value })}
              rows={q.type === "long_text" ? 4 : 2}
              className="mt-1 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm normal-case tracking-normal"
            />
          )}
        </label>
      ))}

      <button
        type="submit"
        disabled={loading}
        className="mt-2 bg-[#fdf0d5] px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-50"
      >
        {loading ? "Saving…" : "Continue"}
      </button>
    </form>
  );
}

function ContractStep({
  contract,
  onContinue,
  onRefresh,
}: {
  contract: { title: string; status: string; token: string } | null;
  onContinue: () => Promise<void>;
  onRefresh: () => void;
}) {
  const [loading, setLoading] = useState(false);
  if (!contract) {
    return (
      <div>
        <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold">Agreement</h2>
        <p className="mt-3 text-sm text-white/50">
          No contract is linked yet. Please check back shortly.
        </p>
        <button type="button" onClick={onRefresh} className="mt-4 text-sm text-[#fdf0d5]">
          Refresh
        </button>
      </div>
    );
  }

  const signed = contract.status === "signed";

  return (
    <div>
      <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold">Agreement</h2>
      <p className="mt-3 text-white/70">{contract.title}</p>
      <p className="mt-1 text-sm capitalize text-white/40">Status: {contract.status}</p>
      {!signed ? (
        <Link
          href={`/sign/${contract.token}`}
          target="_blank"
          className="mt-6 inline-block bg-[#fdf0d5] px-5 py-2.5 text-sm font-semibold text-black"
        >
          Review & sign
        </Link>
      ) : (
        <p className="mt-4 text-sm text-green-400">Signed. You can continue.</p>
      )}
      <div className="mt-4 flex gap-3">
        <button type="button" onClick={onRefresh} className="text-sm text-white/50">
          Refresh status
        </button>
        <button
          type="button"
          disabled={!signed || loading}
          onClick={async () => {
            setLoading(true);
            await onContinue();
          }}
          className="bg-white/10 px-4 py-2 text-sm disabled:opacity-40"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

function DepositStep({
  invoice,
  onContinue,
  onRefresh,
}: {
  invoice: {
    invoiceNumber: string;
    status: string;
    payToken: string;
    totalCents: number;
  } | null;
  onContinue: () => Promise<void>;
  onRefresh: () => void;
}) {
  const [loading, setLoading] = useState(false);
  if (!invoice) {
    return (
      <div>
        <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold">Deposit</h2>
        <p className="mt-3 text-sm text-white/50">No deposit invoice is linked yet.</p>
        <button type="button" onClick={onRefresh} className="mt-4 text-sm text-[#fdf0d5]">
          Refresh
        </button>
      </div>
    );
  }

  const paid = invoice.status === "paid";

  return (
    <div>
      <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold">Deposit</h2>
      <p className="mt-3 text-white/70">
        Invoice {invoice.invoiceNumber} — ${(invoice.totalCents / 100).toFixed(2)}
      </p>
      <p className="mt-1 text-sm capitalize text-white/40">Status: {invoice.status}</p>
      {!paid ? (
        <Link
          href={`/pay/${invoice.payToken}`}
          target="_blank"
          className="mt-6 inline-block bg-[#fdf0d5] px-5 py-2.5 text-sm font-semibold text-black"
        >
          Pay deposit
        </Link>
      ) : (
        <p className="mt-4 text-sm text-green-400">Paid. You can continue.</p>
      )}
      <div className="mt-4 flex gap-3">
        <button type="button" onClick={onRefresh} className="text-sm text-white/50">
          Refresh status
        </button>
        <button
          type="button"
          disabled={!paid || loading}
          onClick={async () => {
            setLoading(true);
            await onContinue();
          }}
          className="bg-white/10 px-4 py-2 text-sm disabled:opacity-40"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

function HandoffStep({
  projectName,
  onComplete,
}: {
  projectName: string;
  onComplete: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  return (
    <div>
      <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold">You&apos;re all set</h2>
      <p className="mt-4 text-white/70">
        Thanks for completing onboarding
        {projectName ? ` for ${projectName}` : ""}. Your portal is ready for project updates and
        progress.
      </p>
      <button
        type="button"
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          await onComplete();
        }}
        className="mt-6 bg-[#fdf0d5] px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-50"
      >
        Enter portal
      </button>
    </div>
  );
}
