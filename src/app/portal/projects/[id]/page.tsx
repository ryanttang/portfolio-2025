import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { requirePortalActor } from "@/lib/auth";
import { db } from "@/db";
import { contracts, invoices } from "@/db/schema";
import {
  getOnboardingForClient,
  listPortalMilestones,
  listPortalUpdates,
} from "@/lib/onboarding";
import ProjectMessageForm from "@/components/portal/ProjectMessageForm";

export default async function ProjectHubPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  let actor;
  try {
    actor = await requirePortalActor();
  } catch {
    redirect("/portal/login");
  }

  const { id } = await params;
  const onboarding = await getOnboardingForClient(actor.clientId, id);
  if (!onboarding) notFound();

  if (onboarding.status !== "completed") {
    redirect(`/portal/projects/${id}/onboarding`);
  }

  const [milestones, updates, clientContracts, clientInvoices] = await Promise.all([
    listPortalMilestones(id),
    listPortalUpdates(id),
    onboarding.contractId
      ? db.select().from(contracts).where(eq(contracts.id, onboarding.contractId))
      : db.select().from(contracts).where(eq(contracts.clientId, actor.clientId)),
    onboarding.invoiceId
      ? db.select().from(invoices).where(eq(invoices.id, onboarding.invoiceId))
      : db.select().from(invoices).where(eq(invoices.clientId, actor.clientId)),
  ]);

  const linkedContracts = onboarding.contractId
    ? clientContracts
    : clientContracts.slice(0, 5);
  const linkedInvoices = onboarding.invoiceId
    ? clientInvoices
    : clientInvoices.slice(0, 5);

  return (
    <div>
      <Link href="/portal" className="text-xs text-white/40 hover:text-white/70">
        ← Projects
      </Link>
      <h1 className="mt-2 font-[family-name:var(--font-syne)] text-3xl font-bold">
        {onboarding.projectName || "Your project"}
      </h1>
      {(onboarding.services || []).length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {(onboarding.services || []).map((s) => (
            <li
              key={s.id}
              className="border border-white/15 bg-white/5 px-2.5 py-1 text-xs text-white/70"
            >
              {s.label}
              {s.price ? <span className="ml-1.5 text-white/40">{s.price}</span> : null}
            </li>
          ))}
        </ul>
      )}

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40">
          Milestones
        </h2>
        <ul className="mt-4 space-y-3">
          {milestones.map((m) => (
            <li key={m.id} className="border-l-2 border-[#e6c47a]/60 pl-4">
              <div className="flex flex-wrap items-baseline gap-2">
                <p className="font-medium">{m.title}</p>
                <span className="text-[10px] uppercase tracking-wider text-white/40">
                  {m.status.replace("_", " ")}
                </span>
              </div>
              {m.description && (
                <p className="mt-1 text-sm text-white/55">{m.description}</p>
              )}
            </li>
          ))}
          {milestones.length === 0 && (
            <li className="text-sm text-white/40">
              Milestones will appear here as the project moves.
            </li>
          )}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40">Updates</h2>
        <ul className="mt-4 space-y-4">
          {updates.map((u) => (
            <li key={u.id} className="border border-white/10 bg-[#141414] p-4">
              <p className="font-medium">{u.title}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-white/65">{u.body}</p>
              <p className="mt-2 text-[10px] text-white/30">
                {new Date(u.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
          {updates.length === 0 && (
            <li className="text-sm text-white/40">No updates posted yet.</li>
          )}
        </ul>
      </section>

      <section className="mt-10 grid gap-6 sm:grid-cols-2">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40">
            Agreements
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {linkedContracts.map((c) => (
              <li key={c.id}>
                {c.status === "signed" || c.status === "sent" ? (
                  <Link href={`/sign/${c.token}`} className="text-[#e6c47a] hover:underline">
                    {c.title} ({c.status})
                  </Link>
                ) : (
                  <span className="text-white/50">
                    {c.title} ({c.status})
                  </span>
                )}
              </li>
            ))}
            {linkedContracts.length === 0 && (
              <li className="text-white/40">No agreements yet.</li>
            )}
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40">
            Invoices
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {linkedInvoices.map((i) => (
              <li key={i.id}>
                {i.status !== "void" && i.status !== "draft" ? (
                  <Link href={`/pay/${i.payToken}`} className="text-[#e6c47a] hover:underline">
                    {i.invoiceNumber} — ${(i.totalCents / 100).toFixed(2)} ({i.status})
                  </Link>
                ) : (
                  <span className="text-white/50">
                    {i.invoiceNumber} ({i.status})
                  </span>
                )}
              </li>
            ))}
            {linkedInvoices.length === 0 && (
              <li className="text-white/40">No invoices yet.</li>
            )}
          </ul>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40">
          Message
        </h2>
        <ProjectMessageForm onboardingId={id} />
      </section>
    </div>
  );
}
