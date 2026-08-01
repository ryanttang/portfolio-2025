import Link from "next/link";
import { redirect } from "next/navigation";
import { requirePortalActor } from "@/lib/auth";
import { listOnboardingsForClient } from "@/lib/onboarding";

export default async function PortalHomePage() {
  let actor;
  try {
    actor = await requirePortalActor();
  } catch {
    redirect("/portal/login");
  }

  const projects = await listOnboardingsForClient(actor.clientId);

  return (
    <div>
      <p className="font-[family-name:var(--font-syne)] text-xs uppercase tracking-[0.25em] text-[#fdf0d5]">
        Your projects
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-syne)] text-3xl font-bold">Portal</h1>
      <p className="mt-2 text-sm text-white/50">
        Open a project to continue onboarding or view progress.
      </p>

      <ul className="mt-8 space-y-3">
        {projects.map((p) => {
          const incomplete = p.status !== "completed";
          const href = incomplete
            ? `/portal/projects/${p.id}/onboarding`
            : `/portal/projects/${p.id}`;
          return (
            <li key={p.id}>
              <Link
                href={href}
                className="block border border-white/10 bg-[#141414] p-4 transition hover:border-[#fdf0d5]/40"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="font-medium">{p.projectName || "Untitled project"}</h2>
                  <span className="text-[10px] uppercase tracking-wider text-white/40">
                    {p.status.replace("_", " ")}
                  </span>
                </div>
                {(p.services || []).length > 0 && (
                  <p className="mt-2 text-sm text-white/55">
                    {(p.services || [])
                      .map((s) => (s.price ? `${s.label} (${s.price})` : s.label))
                      .join(" · ")}
                  </p>
                )}
                <p className="mt-2 text-xs text-[#fdf0d5]">
                  {incomplete ? "Continue onboarding →" : "Open project →"}
                </p>
              </Link>
            </li>
          );
        })}
        {projects.length === 0 && (
          <li className="text-sm text-white/40">
            No projects yet. You&apos;ll see them here after an invite.
          </li>
        )}
      </ul>
    </div>
  );
}
