import Link from "next/link";
import { redirect } from "next/navigation";
import StatCard from "@/components/portal/StatCard";
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
  const activeProjects = projects.filter((p) => p.status === "completed");
  const inProgress = projects.filter((p) => p.status !== "completed");
  const needsAttention = summaries.filter((s) => s.hasAttention).length;

  return (
    <div className="space-y-6">
      <div className="rounded-sm border border-white/10 bg-[#121212] p-6">
        <p className="font-[family-name:var(--font-syne)] text-[10px] uppercase tracking-[0.25em] text-[#fdf0d5]">
          Client portal
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-syne)] text-3xl font-bold">Dashboard</h1>
        <p className="mt-2 max-w-xl text-sm text-white/50">
          Your projects, action items, and updates in one place.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Total projects" value={projects.length} hint={`${activeProjects.length} active hubs`} />
        <StatCard
          label="In onboarding"
          value={inProgress.length}
          hint={inProgress.length === 1 ? "project in setup" : "projects in setup"}
          accent={inProgress.length > 0}
        />
        <StatCard
          label="Needs attention"
          value={needsAttention}
          hint={needsAttention === 0 ? "you're all caught up" : "projects with open items"}
          accent={needsAttention > 0}
        />
      </div>

      <div>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold">Projects</h2>
            <p className="text-xs text-white/40">Open a project hub or continue onboarding.</p>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="rounded-sm border border-dashed border-white/15 bg-[#121212]/50 p-10 text-center">
            <p className="text-sm text-white/40">
              No projects yet. You&apos;ll see them here after an invite.
            </p>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((p) => {
              const incomplete = p.status !== "completed";
              const href = incomplete
                ? portalProjectPath(p, "onboarding")
                : portalProjectPath(p);
              const summary = summaryById.get(p.id);
              const stats: { label: string; accent?: boolean }[] = [];

              if (summary?.pendingTasks) {
                stats.push({
                  label: `${summary.pendingTasks} task${summary.pendingTasks === 1 ? "" : "s"}`,
                  accent: true,
                });
              }
              if (summary?.meetingTomorrow) {
                stats.push({ label: "Meeting tomorrow", accent: true });
              } else if (summary?.meetingsWithin48h) {
                stats.push({
                  label: `${summary.meetingsWithin48h} meeting${summary.meetingsWithin48h === 1 ? "" : "s"} soon`,
                });
              }

              return (
                <li key={p.id}>
                  <Link
                    href={href}
                    className="group relative flex h-full flex-col rounded-sm border border-white/10 bg-[#121212] p-5 transition hover:border-[#fdf0d5]/35 hover:bg-[#161616]"
                  >
                    {summary?.hasAttention && (
                      <span
                        className="absolute right-4 top-4 h-2 w-2 rounded-full bg-[#fdf0d5]"
                        aria-label="Needs attention"
                      />
                    )}

                    <div className="flex items-start justify-between gap-3 pr-4">
                      <h3 className="font-[family-name:var(--font-syne)] text-lg font-semibold leading-snug group-hover:text-[#fdf0d5]">
                        {p.projectName || "Untitled project"}
                      </h3>
                      <span
                        className={`shrink-0 rounded-sm px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                          incomplete
                            ? "border border-[#fdf0d5]/25 bg-[#fdf0d5]/10 text-[#fdf0d5]"
                            : "border border-white/10 bg-white/[0.03] text-white/45"
                        }`}
                      >
                        {p.status.replace("_", " ")}
                      </span>
                    </div>

                    {(p.services || []).length > 0 && (
                      <p className="mt-3 line-clamp-2 text-sm text-white/50">
                        {(p.services || []).map((s) => s.label).join(" · ")}
                      </p>
                    )}

                    {stats.length > 0 && (
                      <ul className="mt-4 flex flex-wrap gap-2">
                        {stats.map((stat) => (
                          <li
                            key={stat.label}
                            className={`rounded-sm px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                              stat.accent
                                ? "border border-[#fdf0d5]/25 bg-[#fdf0d5]/10 text-[#fdf0d5]"
                                : "border border-white/10 bg-white/[0.03] text-white/45"
                            }`}
                          >
                            {stat.label}
                          </li>
                        ))}
                      </ul>
                    )}

                    <p className="mt-auto pt-5 text-xs font-medium text-[#fdf0d5]/80 group-hover:text-[#fdf0d5]">
                      {incomplete ? "Continue onboarding →" : "Open project hub →"}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
