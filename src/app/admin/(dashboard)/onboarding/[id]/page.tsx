import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { contracts, invoices } from "@/db/schema";
import { getClient } from "@/lib/crm/clients";
import {
  getOnboardingBundle,
  listTemplates,
} from "@/lib/onboarding";
import { getLatestUnusedInvite } from "@/lib/portal/auth";
import { getAppUrl } from "@/lib/env";
import OnboardingEditor from "@/components/admin/OnboardingEditor";
import PortalContentEditor from "@/components/admin/PortalContentEditor";
import {
  listPortalMilestones,
  listPortalUpdates,
} from "@/lib/onboarding";

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

  const [clientContracts, clientInvoices, templates, updates, milestones, invite] =
    await Promise.all([
      db.select().from(contracts).where(eq(contracts.clientId, client.id)),
      db.select().from(invoices).where(eq(invoices.clientId, client.id)),
      listTemplates(),
      listPortalUpdates(client.id),
      listPortalMilestones(client.id),
      getLatestUnusedInvite(client.id),
    ]);

  return (
    <div>
      <Link href="/admin/onboarding" className="text-xs text-white/40 hover:text-white/70">
        ← Onboarding
      </Link>
      <h1 className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold">
        {onboarding.projectName || "Onboarding"}
      </h1>
      <p className="text-sm text-white/50">
        <Link href={`/admin/crm/${client.id}`} className="hover:text-[#e6c47a]">
          {client.name}
        </Link>{" "}
        · {client.email}
      </p>

      {(contract || invoice) && (
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-white/50">
          {contract && (
            <span>
              Contract:{" "}
              <Link href={`/admin/contracts/${contract.id}`} className="text-[#e6c47a]">
                {contract.title}
              </Link>{" "}
              ({contract.status})
            </span>
          )}
          {invoice && (
            <span>
              Invoice:{" "}
              <Link href={`/admin/invoices/${invoice.id}`} className="text-[#e6c47a]">
                {invoice.invoiceNumber}
              </Link>{" "}
              ({invoice.status})
            </span>
          )}
        </div>
      )}

      <OnboardingEditor
        onboarding={onboarding}
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
      />

      <div className="mt-8">
        <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold">
          Portal content
        </h2>
        <p className="mt-1 text-sm text-white/40">
          Updates and milestones shown after onboarding handoff.
        </p>
        <PortalContentEditor
          clientId={client.id}
          updates={updates}
          milestones={milestones}
        />
      </div>
    </div>
  );
}
