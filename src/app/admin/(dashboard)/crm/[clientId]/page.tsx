import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  getClient,
  listActivities,
  listNotes,
} from "@/lib/crm/clients";
import { listThreadsForClient } from "@/lib/email/threads";
import { listOnboardingsForClient } from "@/lib/onboarding";
import { createOnboardingAction } from "@/app/admin/actions/onboarding";
import ClientDetail from "@/components/admin/ClientDetail";
import PreviewPortalButton from "@/components/admin/PreviewPortalButton";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const client = await getClient(clientId);
  if (!client) notFound();

  const [notes, activities, projects, threads] = await Promise.all([
    listNotes(clientId),
    listActivities(clientId),
    listOnboardingsForClient(clientId),
    listThreadsForClient(clientId, 8),
  ]);

  async function startProject(formData: FormData) {
    "use server";
    const name = String(formData.get("projectName") || "").trim();
    const result = await createOnboardingAction(clientId, name || undefined);
    redirect(`/admin/onboarding/${result.id}`);
  }

  return (
    <div>
      <Link href="/admin/crm" className="text-xs text-white/40 hover:text-white/70">
        ← Clients
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
        <PreviewPortalButton clientId={clientId} label="Preview portal" />
      </div>

      <section className="mt-8 border border-white/10 bg-[#141414] p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Recent email</h2>
            <p className="mt-1 text-xs text-white/40">Threads linked to this client.</p>
          </div>
          <Link
            href={`/admin/inbox?compose=1&to=${encodeURIComponent(client.email)}`}
            className="text-xs text-[#e6c47a] hover:underline"
          >
            Email client
          </Link>
        </div>
        <ul className="mt-4 space-y-2">
          {threads.map((t) => (
            <li
              key={t.id}
              className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-2 text-sm"
            >
              <Link
                href={`/admin/inbox?thread=${t.id}`}
                className="text-[#e6c47a] hover:underline"
              >
                {t.subject}
              </Link>
              <span className="text-[10px] text-white/35">
                {t.lastMessageAt.toLocaleString()}
              </span>
            </li>
          ))}
          {threads.length === 0 && (
            <li className="text-sm text-white/40">No email threads yet.</li>
          )}
        </ul>
      </section>

      <section className="mt-8 border border-white/10 bg-[#141414] p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Projects</h2>
            <p className="mt-1 text-xs text-white/40">
              Edit intake config, or preview the client onboarding wizard.
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
              <div className="flex flex-wrap items-center gap-2">
                {(p.services || []).length > 0 && (
                  <p className="text-xs text-white/45">
                    {(p.services || []).map((s) => s.label).join(", ")}
                  </p>
                )}
                <Link
                  href={`/admin/onboarding/${p.id}`}
                  className="border border-white/20 px-2.5 py-1 text-[11px] text-white/70 hover:border-white/40"
                >
                  Edit
                </Link>
                <PreviewPortalButton
                  clientId={clientId}
                  onboardingId={p.id}
                  label={p.status === "completed" ? "Preview hub" : "Preview onboarding"}
                  className="border border-[#e6c47a]/50 px-2.5 py-1 text-[11px] text-[#e6c47a]"
                />
              </div>
            </li>
          ))}
          {projects.length === 0 && (
            <li className="text-sm text-white/40">No projects yet.</li>
          )}
        </ul>
      </section>

      <ClientDetail
        client={{
          ...client,
          tags: Array.isArray(client.tags) ? client.tags : [],
        }}
        notes={notes}
        activities={activities}
      />
    </div>
  );
}
