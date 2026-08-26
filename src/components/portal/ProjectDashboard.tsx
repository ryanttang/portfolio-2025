import Link from "next/link";
import AttentionBanner from "@/components/portal/AttentionBanner";
import DashboardWelcomeModal from "@/components/portal/DashboardWelcomeModal";
import FileList from "@/components/portal/FileList";
import MeetingList from "@/components/portal/MeetingList";
import MessageThread from "@/components/portal/MessageThread";
import MilestoneProgress from "@/components/portal/MilestoneProgress";
import ProjectTimeline from "@/components/portal/ProjectTimeline";
import TaskList from "@/components/portal/TaskList";
import type { PortalTimelineEvent } from "@/lib/portal/types";
import type { ProjectAttentionSummary } from "@/lib/portal/types";

export default function ProjectDashboard({
  onboardingId,
  projectName,
  services,
  hubWelcomeMessage,
  showWelcome,
  attention,
  milestones,
  tasks,
  meetings,
  files,
  messages,
  timeline,
  contracts,
  invoices,
}: {
  onboardingId: string;
  projectName: string;
  services: { id: string; label: string; group: string; price?: string }[];
  hubWelcomeMessage: string | null;
  showWelcome: boolean;
  attention: ProjectAttentionSummary;
  milestones: {
    id: string;
    title: string;
    status: string;
    dueAt: Date | null;
  }[];
  tasks: {
    id: string;
    type: string;
    status: string;
    title: string;
    description: string | null;
    linkUrl: string | null;
    dueAt: Date | null;
  }[];
  meetings: {
    id: string;
    title: string;
    description: string | null;
    startsAt: Date;
    endsAt: Date;
    location: string | null;
  }[];
  files: {
    id: string;
    title: string;
    description: string | null;
    blobUrl: string;
    mimeType: string | null;
    createdAt: Date;
  }[];
  messages: {
    id: string;
    senderType: string;
    subject: string | null;
    body: string;
    createdAt: Date;
  }[];
  timeline: PortalTimelineEvent[];
  contracts: { id: string; title: string; status: string; token: string }[];
  invoices: {
    id: string;
    invoiceNumber: string;
    status: string;
    payToken: string;
    totalCents: number;
  }[];
}) {
  const upcomingTasks = tasks.filter((t) => t.status === "pending").slice(0, 3);
  const upcomingMeetings = meetings
    .filter((m) => m.startsAt.getTime() >= Date.now())
    .slice(0, 2);

  return (
    <div>
      <DashboardWelcomeModal
        onboardingId={onboardingId}
        projectName={projectName}
        welcomeMessage={hubWelcomeMessage}
        show={showWelcome}
      />

      <Link href="/portal" className="text-xs text-white/40 hover:text-white/70">
        ← Projects
      </Link>
      <h1 className="mt-2 font-[family-name:var(--font-syne)] text-3xl font-bold">
        {projectName || "Your project"}
      </h1>
      {services.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {services.map((s) => (
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

      <div className="mt-8">
        <AttentionBanner summary={attention} />
      </div>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40">Progress</h2>
        <div className="mt-4">
          <MilestoneProgress milestones={milestones} />
        </div>
      </section>

      {(upcomingTasks.length > 0 || upcomingMeetings.length > 0) && (
        <section className="mt-10 grid gap-4 sm:grid-cols-2">
          {upcomingTasks.length > 0 && (
            <div className="border border-white/10 bg-[#141414] p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">
                Due soon
              </h3>
              <ul className="mt-2 space-y-1 text-sm">
                {upcomingTasks.map((t) => (
                  <li key={t.id}>
                    <a href="#tasks" className="text-white/75 hover:text-white">
                      {t.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {upcomingMeetings.length > 0 && (
            <div className="border border-white/10 bg-[#141414] p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40">
                Upcoming meetings
              </h3>
              <ul className="mt-2 space-y-1 text-sm">
                {upcomingMeetings.map((m) => (
                  <li key={m.id}>
                    <a href="#meetings" className="text-white/75 hover:text-white">
                      {m.title} · {m.startsAt.toLocaleDateString()}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <section id="timeline" className="mt-10 scroll-mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40">Timeline</h2>
        <div className="mt-4">
          <ProjectTimeline events={timeline} />
        </div>
      </section>

      <section id="tasks" className="mt-10 scroll-mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40">
          Action items
        </h2>
        <div className="mt-4">
          <TaskList onboardingId={onboardingId} tasks={tasks} />
        </div>
      </section>

      <section id="meetings" className="mt-10 scroll-mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40">Meetings</h2>
        <div className="mt-4">
          <MeetingList meetings={meetings} />
        </div>
      </section>

      <section id="messages" className="mt-10 scroll-mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40">Messages</h2>
        <div className="mt-4">
          <MessageThread onboardingId={onboardingId} messages={messages} />
        </div>
      </section>

      <section id="files" className="mt-10 scroll-mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40">
          Deliverables
        </h2>
        <div className="mt-4">
          <FileList files={files} />
        </div>
      </section>

      <section className="mt-10 grid gap-6 sm:grid-cols-2">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40">
            Agreements
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {contracts.map((c) => (
              <li key={c.id}>
                {c.status === "signed" || c.status === "sent" ? (
                  <Link href={`/sign/${c.token}`} className="text-[#fdf0d5] hover:underline">
                    {c.title} ({c.status})
                  </Link>
                ) : (
                  <span className="text-white/50">
                    {c.title} ({c.status})
                  </span>
                )}
              </li>
            ))}
            {contracts.length === 0 && (
              <li className="text-white/40">No agreements yet.</li>
            )}
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white/40">
            Invoices
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {invoices.map((i) => (
              <li key={i.id}>
                {i.status !== "void" && i.status !== "draft" ? (
                  <Link href={`/pay/${i.payToken}`} className="text-[#fdf0d5] hover:underline">
                    {i.invoiceNumber} — ${(i.totalCents / 100).toFixed(2)} ({i.status})
                  </Link>
                ) : (
                  <span className="text-white/50">
                    {i.invoiceNumber} ({i.status})
                  </span>
                )}
              </li>
            ))}
            {invoices.length === 0 && (
              <li className="text-white/40">No invoices yet.</li>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}
