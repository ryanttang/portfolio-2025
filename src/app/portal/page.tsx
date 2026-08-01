import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { contracts, invoices } from "@/db/schema";
import { getClient } from "@/lib/crm/clients";
import {
  getActiveOnboardingForClient,
  listPortalMilestones,
  listPortalUpdates,
} from "@/lib/onboarding";

export default async function PortalHomePage() {
  const session = await auth();
  if (!session?.user?.clientId || session.user.role !== "client") {
    redirect("/portal/login");
  }

  const clientId = session.user.clientId;
  const client = await getClient(clientId);
  if (!client) redirect("/portal/login");

  const onboarding = await getActiveOnboardingForClient(clientId);
  if (onboarding && onboarding.status !== "completed") {
    redirect("/portal/onboarding");
  }

  const [milestones, updates, clientContracts, clientInvoices] = await Promise.all([
    listPortalMilestones(clientId),
    listPortalUpdates(clientId),
    db
      .select()
      .from(contracts)
      .where(eq(contracts.clientId, clientId))
      .orderBy(desc(contracts.updatedAt)),
    db
      .select()
      .from(invoices)
      .where(eq(invoices.clientId, clientId))
      .orderBy(desc(invoices.updatedAt)),
  ]);

  return (
    <div>
      <p className="font-[family-name:var(--font-syne)] text-xs uppercase tracking-[0.25em] text-[#e6c47a]">
        Hello, {client.name.split(" ")[0]}
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-syne)] text-3xl font-bold">
        {onboarding?.projectName || "Your project"}
      </h1>
      <p className="mt-2 text-sm text-white/50">
        Progress, updates, and documents for your engagement.
      </p>

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
            <li className="text-sm text-white/40">Milestones will appear here as the project moves.</li>
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
            {clientContracts.map((c) => (
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
            {clientContracts.length === 0 && (
              <li className="text-white/40">No agreements yet.</li>
            )}
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40">
            Invoices
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {clientInvoices.map((i) => (
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
            {clientInvoices.length === 0 && (
              <li className="text-white/40">No invoices yet.</li>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}
