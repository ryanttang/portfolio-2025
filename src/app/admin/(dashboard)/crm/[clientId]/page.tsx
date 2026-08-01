import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  getClient,
  listActivities,
  listNotes,
} from "@/lib/crm/clients";
import { listOnboardingsForClient } from "@/lib/onboarding";
import { createOnboardingAction, startViewAsClientAction } from "@/app/admin/actions/onboarding";
import ClientDetail from "@/components/admin/ClientDetail";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const client = await getClient(clientId);
  if (!client) notFound();

  const [notes, activities, projects] = await Promise.all([
    listNotes(clientId),
    listActivities(clientId),
    listOnboardingsForClient(clientId),
  ]);

  async function startProject(formData: FormData) {
    "use server";
    const name = String(formData.get("projectName") || "").trim();
    const result = await createOnboardingAction(clientId, name || undefined);
    redirect(`/admin/onboarding/${result.id}`);
  }

  async function viewAsClient() {
    "use server";
    await startViewAsClientAction(clientId);
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
        <form action={viewAsClient}>
          <button type="submit" className="border border-[#e6c47a]/50 px-3 py-1.5 text-xs text-[#e6c47a]">
            View as client
          </button>
        </form>
      </div>

      <section className="mt-8 border border-white/10 bg-[#141414] p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Projects</h2>
            <p className="mt-1 text-xs text-white/40">
              Each project has its own onboarding, services, and portal updates.
            </p>
          </div>
          <form action={startProject} className="flex flex-wrap gap-2">
            <input
              name="projectName"
              placeholder="Project name"
              className="border border-white/15 bg-black/40 px-3 py-1.5 text-sm"
            />
            <button
              type="submit"
              className="bg-[#e6c47a] px-3 py-1.5 text-xs font-semibold text-black"
            >
              New project
            </button>
          </form>
        </div>
        <ul className="mt-4 space-y-2">
          {projects.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-2 text-sm"
            >
              <div>
                <Link
                  href={`/admin/onboarding/${p.id}`}
                  className="text-[#e6c47a] hover:underline"
                >
                  {p.projectName || "Untitled project"}
                </Link>
                <p className="text-[10px] uppercase tracking-wider text-white/35">
                  {p.status.replace("_", " ")} · step {p.currentStep}
                </p>
              </div>
              {(p.services || []).length > 0 && (
                <p className="text-xs text-white/45">
                  {(p.services || []).map((s) => s.label).join(", ")}
                </p>
              )}
            </li>
          ))}
          {projects.length === 0 && (
            <li className="text-sm text-white/40">No projects yet.</li>
          )}
        </ul>
      </section>

      <ClientDetail client={client} notes={notes} activities={activities} />
    </div>
  );
}
