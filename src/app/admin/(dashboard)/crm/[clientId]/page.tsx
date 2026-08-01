import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  getClient,
  listActivities,
  listNotes,
} from "@/lib/crm/clients";
import { getActiveOnboardingForClient } from "@/lib/onboarding";
import { createOnboardingAction } from "@/app/admin/actions/onboarding";
import ClientDetail from "@/components/admin/ClientDetail";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const client = await getClient(clientId);
  if (!client) notFound();

  const [notes, activities, onboarding] = await Promise.all([
    listNotes(clientId),
    listActivities(clientId),
    getActiveOnboardingForClient(clientId),
  ]);

  async function startOnboarding() {
    "use server";
    const result = await createOnboardingAction(clientId);
    redirect(`/admin/onboarding/${result.id}`);
  }

  return (
    <div>
      <Link href="/admin/crm" className="text-xs text-white/40 hover:text-white/70">
        ← CRM
      </Link>
      <h1 className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold">{client.name}</h1>
      <p className="text-sm text-white/50">{client.email}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/admin/inbox?compose=1&to=${encodeURIComponent(client.email)}`}
          className="bg-[#e6c47a] px-3 py-1.5 text-xs font-semibold text-black"
        >
          Compose email
        </Link>
        <Link
          href={`/admin/contracts/new?clientId=${client.id}`}
          className="border border-white/20 px-3 py-1.5 text-xs"
        >
          New contract
        </Link>
        <Link
          href={`/admin/invoices/new?clientId=${client.id}`}
          className="border border-white/20 px-3 py-1.5 text-xs"
        >
          New invoice
        </Link>
        {onboarding && onboarding.status !== "cancelled" && onboarding.status !== "completed" ? (
          <Link
            href={`/admin/onboarding/${onboarding.id}`}
            className="border border-[#e6c47a]/50 px-3 py-1.5 text-xs text-[#e6c47a]"
          >
            Onboarding ({onboarding.status.replace("_", " ")})
          </Link>
        ) : (
          <>
            {onboarding?.status === "completed" && (
              <Link
                href={`/admin/onboarding/${onboarding.id}`}
                className="border border-white/20 px-3 py-1.5 text-xs"
              >
                View last onboarding
              </Link>
            )}
            <form action={startOnboarding}>
              <button type="submit" className="border border-white/20 px-3 py-1.5 text-xs">
                Start onboarding
              </button>
            </form>
          </>
        )}
      </div>

      <ClientDetail client={client} notes={notes} activities={activities} />
    </div>
  );
}
