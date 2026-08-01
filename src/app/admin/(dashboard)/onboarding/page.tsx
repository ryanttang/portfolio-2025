import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { clients, onboardings } from "@/db/schema";
import { listClients } from "@/lib/crm/clients";
import { createOnboardingAction } from "@/app/admin/actions/onboarding";
import { redirect } from "next/navigation";

export default async function OnboardingListPage() {
  const rows = await db
    .select({
      onboarding: onboardings,
      clientName: clients.name,
      clientEmail: clients.email,
    })
    .from(onboardings)
    .innerJoin(clients, eq(clients.id, onboardings.clientId))
    .orderBy(desc(onboardings.updatedAt));

  const allClients = await listClients();

  async function startOnboarding(formData: FormData) {
    "use server";
    const clientId = String(formData.get("clientId") || "");
    const projectName = String(formData.get("projectName") || "");
    if (!clientId) return;
    const result = await createOnboardingAction(clientId, projectName || undefined);
    redirect(`/admin/onboarding/${result.id}`);
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold">Onboarding</h1>
          <p className="mt-1 text-sm text-white/50">
            Configure client intake, contracts, deposits, and portal invites.
          </p>
        </div>
        <Link
          href="/admin/onboarding/templates"
          className="border border-white/20 px-3 py-1.5 text-xs"
        >
          Question templates
        </Link>
      </div>

      <form
        action={startOnboarding}
        className="mt-6 flex flex-wrap items-end gap-3 border border-white/10 bg-[#141414] p-4"
      >
        <label className="text-xs uppercase tracking-wider text-white/40">
          Client
          <select
            name="clientId"
            required
            className="mt-1 block min-w-[220px] border border-white/15 bg-black/40 px-3 py-2 text-sm"
          >
            <option value="">Select…</option>
            {allClients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.email})
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs uppercase tracking-wider text-white/40">
          Project name
          <input
            name="projectName"
            placeholder="Website redesign"
            className="mt-1 block min-w-[200px] border border-white/15 bg-black/40 px-3 py-2 text-sm"
          />
        </label>
        <button type="submit" className="bg-[#e6c47a] px-4 py-2 text-sm font-semibold text-black">
          Start onboarding
        </button>
      </form>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-white/40">
            <tr>
              <th className="py-2 pr-4">Project</th>
              <th className="py-2 pr-4">Client</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Step</th>
              <th className="py-2">Updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-white/40">
                  No onboardings yet.
                </td>
              </tr>
            )}
            {rows.map(({ onboarding, clientName, clientEmail }) => (
              <tr key={onboarding.id} className="border-b border-white/5">
                <td className="py-3 pr-4">
                  <Link
                    href={`/admin/onboarding/${onboarding.id}`}
                    className="text-[#e6c47a] hover:underline"
                  >
                    {onboarding.projectName || "Untitled"}
                  </Link>
                </td>
                <td className="py-3 pr-4">
                  <div>{clientName}</div>
                  <div className="text-xs text-white/40">{clientEmail}</div>
                </td>
                <td className="py-3 pr-4 capitalize">{onboarding.status.replace("_", " ")}</td>
                <td className="py-3 pr-4 capitalize">{onboarding.currentStep}</td>
                <td className="py-3 text-white/40">
                  {new Date(onboarding.updatedAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
