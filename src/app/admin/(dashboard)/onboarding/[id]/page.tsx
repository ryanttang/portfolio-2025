import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { contracts, invoices } from "@/db/schema";
import { getClient } from "@/lib/crm/clients";
import {
  getOnboardingBundle,
  listTemplates,
  listPortalMilestones,
  listPortalUpdates,
} from "@/lib/onboarding";
import { listAvailableServices } from "@/lib/onboarding/services";
import { getLatestUnusedInvite } from "@/lib/portal/auth";
import { getAppUrl } from "@/lib/env";
import OnboardingEditor from "@/components/admin/OnboardingEditor";
import PortalContentEditor from "@/components/admin/PortalContentEditor";
import PreviewPortalButton from "@/components/admin/PreviewPortalButton";
import { restartOnboardingWizardAction } from "@/app/admin/actions/onboarding";

export default async function OnboardingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bundle = await getOnboardingBundle(id);
  if (!bundle) notFound();

  const { onboarding, questions, answers, contract, invoice } = bundle;
  const client = await getClient(onboarding.clientId);
  if (!client) notFound();

  const [clientContracts, clientInvoices, templates, updates, milestones, invite, serviceCatalog] =
    await Promise.all([
      db.select().from(contracts).where(eq(contracts.clientId, client.id)),
      db.select().from(invoices).where(eq(invoices.clientId, client.id)),
      listTemplates(),
      listPortalUpdates(onboarding.id),
      listPortalMilestones(onboarding.id),
      getLatestUnusedInvite(client.id, onboarding.id),
      listAvailableServices(),
    ]);

  async function restartWizard() {
    "use server";
    await restartOnboardingWizardAction(id);
  }

  const steps = [
    { key: "welcome", label: "Welcome", on: true },
    { key: "info", label: "Client info", on: true },
    { key: "questionnaire", label: "Questionnaire", on: true },
    {
      key: "contract",
      label: "Contract",
      on: onboarding.contractEnabled,
      detail: contract ? `${contract.title} (${contract.status})` : "not linked",
    },
    {
      key: "deposit",
      label: "Deposit",
      on: onboarding.depositEnabled,
      detail: invoice
        ? `${invoice.invoiceNumber} (${invoice.status})`
        : "not linked",
    },
    { key: "handoff", label: "Handoff", on: true },
  ];

  const previewLabel =
    onboarding.status === "completed" ? "Preview portal hub" : "Preview onboarding";

  return (
    <div>
      <Link href="/admin/onboarding" className="text-xs text-white/40 hover:text-white/70">
        ← Projects
      </Link>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold">
            {onboarding.projectName || "Project"}
          </h1>
          <p className="text-sm text-white/50">
            <Link href={`/admin/crm/${client.id}`} className="hover:text-[#e6c47a]">
              {client.name}
            </Link>{" "}
            · {client.email}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <form action={restartWizard}>
            <button
              type="submit"
              className="border border-white/20 px-3 py-1.5 text-xs text-white/70 hover:border-white/40"
              title="Reset wizard to welcome so you can walk through intake again"
            >
              Restart wizard
            </button>
          </form>
          <PreviewPortalButton
            clientId={client.id}
            onboardingId={onboarding.id}
            label={previewLabel}
          />
        </div>
      </div>

      <div className="mt-4 border border-white/10 bg-[#141414] p-3">
        <p className="text-[11px] uppercase tracking-wider text-white/40">Wizard steps</p>
        <ol className="mt-2 flex flex-wrap gap-2">
          {steps.map((s) => (
            <li
              key={s.key}
              className={`rounded px-2 py-1 text-[11px] ${
                s.on
                  ? onboarding.currentStep === s.key
                    ? "bg-[#e6c47a] text-black"
                    : "bg-white/10 text-white/80"
                  : "bg-white/5 text-white/30 line-through"
              }`}
              title={"detail" in s ? s.detail : undefined}
            >
              {s.label}
              {"detail" in s && s.on ? ` · ${s.detail}` : ""}
            </li>
          ))}
        </ol>
        <p className="mt-2 text-[11px] text-white/35">
          Edit questions and settings below. Preview opens the live client portal (changes save).
        </p>
      </div>

      <OnboardingEditor
        onboarding={{
          ...onboarding,
          services: onboarding.services || [],
        }}
        questions={questions}
        contracts={clientContracts.map((c) => ({
          id: c.id,
          label: `${c.title} (${c.status})`,
        }))}
        invoices={clientInvoices.map((i) => ({
          id: i.id,
          label: `${i.invoiceNumber} — $${(i.totalCents / 100).toFixed(2)} (${i.status})`,
        }))}
        templates={templates.map((t) => ({ id: t.id, label: t.name }))}
        answers={answers}
        inviteUrl={invite ? `${getAppUrl()}/portal/invite/${invite.token}` : null}
        serviceCatalog={serviceCatalog}
      />

      <div className="mt-8">
        <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold">
          Portal content
        </h2>
        <p className="mt-1 text-sm text-white/40">
          Updates and milestones for this project.
        </p>
        <PortalContentEditor
          clientId={client.id}
          onboardingId={onboarding.id}
          updates={updates}
          milestones={milestones}
        />
      </div>
    </div>
  );
}
