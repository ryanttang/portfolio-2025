import Link from "next/link";
import { redirect } from "next/navigation";
import { requirePortalActor } from "@/lib/auth";
import { listOnboardingsForClient, portalProjectPath } from "@/lib/onboarding";
import { getPortalHomeProjectSummaries } from "@/lib/portal/summaries";

export default async function PortalHomePage() {
  let actor;
  try {
    actor = await requirePortalActor();
  } catch {
    redirect("/portal/login");
  }

  const [projects, summaries] = await Promise.all([
    listOnboardingsForClient(actor.clientId),
    getPortalHomeProjectSummaries(actor.clientId),
  ]);

  const summaryById = new Map(summaries.map((s) => [s.onboardingId, s]));
  const globalAttention = summaries.some((s) => s.hasAttention);

  return (
    <div>
      <p className="font-[family-name:var(--font-syne)] text-xs uppercase tracking-[0.25em] text-[#fdf0d5]">
        Your projects
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-syne)] text-3xl font-bold">Portal</h1>
      <p className="mt-2 text-sm text-white/50">
        Open a project to continue onboarding or view progress.
      </p>

      {globalAttention && (
        <div className="mt-6 border border-[#fdf0d5]/30 bg-[#fdf0d5]/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#fdf0d5]">
            Needs your attention
          </p>
          <p className="mt-1 text-sm text-white/70">
            One or more projects have action items, meetings, or unread updates.
          </p>
        </div>
      )}

      <ul className="mt-8 space-y-3">
        {projects.map((p) => {
          const incomplete = p.status !== "completed";
          const href = incomplete
            ? portalProjectPath(p, "onboarding")
            : portalProjectPath(p);
          const summary = summaryById.get(p.id);
          const badges: string[] = [];
          if (summary?.pendingTasks) {
            badges.push(
              `${summary.pendingTasks} task${summary.pendingTasks === 1 ? "" : "s"} due`,
            );
          }
          if (summary?.meetingTomorrow) {
            badges.push("Meeting tomorrow");
          } else if (summary?.meetingsWithin48h) {
            badges.push(
              `${summary.meetingsWithin48h} meeting${summary.meetingsWithin48h === 1 ? "" : "s"} soon`,
            );
          }

          return (
            <li key={p.id}>
              <Link
                href={href}
                className="relative block border border-white/10 bg-[#141414] p-4 transition hover:border-[#fdf0d5]/40"
              >
                {summary?.hasAttention && (
                  <span
                    className="absolute right-3 top-3 h-2 w-2 rounded-full bg-[#fdf0d5]"
                    aria-label="Needs attention"
                  />
                )}
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
                {badges.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {badges.map((b) => (
                      <li
                        key={b}
                        className="border border-[#fdf0d5]/25 bg-[#fdf0d5]/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#fdf0d5]"
                      >
                        {b}
                      </li>
                    ))}
                  </ul>
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
