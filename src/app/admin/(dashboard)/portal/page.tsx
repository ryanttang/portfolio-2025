import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { clients, onboardings } from "@/db/schema";
import { listClients } from "@/lib/crm/clients";
import {
  createOnboardingAction,
  startViewAsClientAction,
} from "@/app/admin/actions/onboarding";
import { createClientAction } from "@/app/admin/actions/content";
import PreviewPortalButton from "@/components/admin/PreviewPortalButton";

const PORTAL_RETURN = "/admin/portal";

export default async function AdminPortalPreviewPage() {
  const [rows, allClients] = await Promise.all([
    db
      .select({
        onboarding: onboardings,
        clientName: clients.name,
        clientEmail: clients.email,
        clientId: clients.id,
      })
      .from(onboardings)
      .innerJoin(clients, eq(clients.id, onboardings.clientId))
      .orderBy(desc(onboardings.updatedAt))
      .limit(40),
    listClients(),
  ]);

  async function previewAsClient(formData: FormData) {
    "use server";
    const clientId = String(formData.get("clientId") || "");
    if (!clientId) return;
    await startViewAsClientAction(clientId, { returnPath: PORTAL_RETURN });
  }

  async function previewProject(formData: FormData) {
    "use server";
    const clientId = String(formData.get("clientId") || "");
    const onboardingId = String(formData.get("onboardingId") || "");
    if (!clientId || !onboardingId) return;
    await startViewAsClientAction(clientId, {
      onboardingId,
      returnPath: PORTAL_RETURN,
    });
  }

  async function startDemoProject(formData: FormData) {
    "use server";
    let clientId = String(formData.get("clientId") || "");
    const projectName = String(formData.get("projectName") || "").trim() || "Portal demo";

    if (!clientId) {
      const demo = new FormData();
      demo.set("name", "Demo Client");
      demo.set("email", `demo+${Date.now()}@ryantang.site`);
      demo.set("status", "lead");
      demo.set("company", "Demo");
      const created = await createClientAction(demo);
      if (!created?.id) throw new Error("Could not create demo client");
      clientId = created.id;
    }

    const result = await createOnboardingAction(clientId, projectName);
    await startViewAsClientAction(clientId, {
      onboardingId: result.id,
      returnPath: PORTAL_RETURN,
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold">
            Portal preview
          </h1>
          <p className="mt-1 text-sm text-white/50">
            Open the live client portal as any client. Changes save — use Restart wizard on a
            project if you need a clean demo walkthrough.
          </p>
        </div>
        <Link
          href="/admin/onboarding"
          className="border border-white/20 px-3 py-1.5 text-xs text-white/70 hover:border-white/40"
        >
          Manage projects
        </Link>
      </div>

      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <form
          action={previewAsClient}
          className="border border-white/10 bg-[#141414] p-5"
        >
          <h2 className="text-sm font-semibold">Preview portal home</h2>
          <p className="mt-1 text-xs text-white/40">
            Lands on the client project list, same as a signed-in client.
          </p>
          <label className="mt-4 block text-xs uppercase tracking-wider text-white/40">
            Client
            <select
              name="clientId"
              required
              className="mt-1 block w-full border border-white/15 bg-black/40 px-3 py-2 text-sm"
            >
              <option value="">Select…</option>
              {allClients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.email})
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={allClients.length === 0}
            className="mt-4 bg-[#fdf0d5] px-4 py-2 text-sm font-semibold text-black hover:bg-[#f0d49a] disabled:opacity-40"
          >
            Open portal
          </button>
        </form>

        <form
          action={startDemoProject}
          className="border border-white/10 bg-[#141414] p-5"
        >
          <h2 className="text-sm font-semibold">Quick demo onboarding</h2>
          <p className="mt-1 text-xs text-white/40">
            Creates a project (and a demo client if needed), then opens the intake wizard.
          </p>
          <label className="mt-4 block text-xs uppercase tracking-wider text-white/40">
            Client (optional)
            <select
              name="clientId"
              className="mt-1 block w-full border border-white/15 bg-black/40 px-3 py-2 text-sm"
            >
              <option value="">New demo client</option>
              {allClients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.email})
                </option>
              ))}
            </select>
          </label>
          <label className="mt-3 block text-xs uppercase tracking-wider text-white/40">
            Project name
            <input
              name="projectName"
              placeholder="Portal demo"
              className="mt-1 block w-full border border-white/15 bg-black/40 px-3 py-2 text-sm"
            />
          </label>
          <button
            type="submit"
            className="mt-4 border border-[#fdf0d5]/50 px-4 py-2 text-sm text-[#fdf0d5] hover:bg-[#fdf0d5]/10"
          >
            Start demo
          </button>
        </form>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold">Recent projects</h2>
        <p className="mt-1 text-xs text-white/40">
          Jump straight into onboarding or the completed project hub.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-white/40">
              <tr>
                <th className="py-2 pr-4">Project</th>
                <th className="py-2 pr-4">Client</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2">Preview</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-white/40">
                    No projects yet — use Quick demo onboarding above.
                  </td>
                </tr>
              )}
              {rows.map(({ onboarding, clientName, clientEmail, clientId }) => (
                <tr key={onboarding.id} className="border-b border-white/5">
                  <td className="py-3 pr-4">
                    <Link
                      href={`/admin/onboarding/${onboarding.id}`}
                      className="text-[#fdf0d5] hover:underline"
                    >
                      {onboarding.projectName || "Untitled"}
                    </Link>
                    <p className="text-[10px] uppercase tracking-wider text-white/35">
                      step {onboarding.currentStep}
                    </p>
                  </td>
                  <td className="py-3 pr-4">
                    <div>{clientName}</div>
                    <div className="text-xs text-white/40">{clientEmail}</div>
                  </td>
                  <td className="py-3 pr-4 capitalize">
                    {onboarding.status.replace("_", " ")}
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-2">
                      <form action={previewProject}>
                        <input type="hidden" name="clientId" value={clientId} />
                        <input type="hidden" name="onboardingId" value={onboarding.id} />
                        <button
                          type="submit"
                          className="border border-[#fdf0d5]/50 px-2.5 py-1 text-[11px] text-[#fdf0d5]"
                        >
                          {onboarding.status === "completed"
                            ? "Preview hub"
                            : "Preview onboarding"}
                        </button>
                      </form>
                      <PreviewPortalButton
                        clientId={clientId}
                        returnPath={PORTAL_RETURN}
                        label="Portal home"
                        className="border border-white/20 px-2.5 py-1 text-[11px] text-white/70 hover:border-white/40"
                      />
                      <Link
                        href={`/admin/onboarding/${onboarding.id}`}
                        className="border border-white/20 px-2.5 py-1 text-[11px] text-white/70 hover:border-white/40"
                      >
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
