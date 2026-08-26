import Link from "next/link";
import AttentionBanner from "@/components/portal/AttentionBanner";
import DashboardCard from "@/components/portal/DashboardCard";
import DashboardWelcomeModal from "@/components/portal/DashboardWelcomeModal";
import FileList from "@/components/portal/FileList";
import MeetingList from "@/components/portal/MeetingList";
import MessageThread from "@/components/portal/MessageThread";
import MilestoneProgress from "@/components/portal/MilestoneProgress";
import ProjectTimeline from "@/components/portal/ProjectTimeline";
import StatCard from "@/components/portal/StatCard";
import TaskList from "@/components/portal/TaskList";
import type { PortalTimelineEvent } from "@/lib/portal/types";
import type { ProjectAttentionSummary } from "@/lib/portal/types";

export default function ProjectDashboard({
  onboardingId,
  projectName,
  services,
  hubWelcomeMessage,
  showWelcome,
  messagesEnabled,
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
  messagesEnabled: boolean;
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
  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const upcomingMeetings = meetings.filter((m) => m.startsAt.getTime() >= Date.now());
  const milestoneDone = milestones.filter((m) => m.status === "done").length;
  const progressPct =
    milestones.length > 0 ? Math.round((milestoneDone / milestones.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <DashboardWelcomeModal
        onboardingId={onboardingId}
        projectName={projectName}
        welcomeMessage={hubWelcomeMessage}
        show={showWelcome}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/portal"
          className="text-xs text-white/40 transition hover:text-white/70"
        >
          ← All projects
        </Link>
      </div>

      <div className="rounded-sm border border-white/10 bg-[#121212] p-6">
        <p className="font-[family-name:var(--font-syne)] text-[10px] uppercase tracking-[0.25em] text-[#fdf0d5]">
          Project hub
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-syne)] text-3xl font-bold">
          {projectName || "Your project"}
        </h1>
        {services.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {services.map((s) => (
              <li
                key={s.id}
                className="rounded-sm border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-white/65"
              >
                {s.label}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Action items"
          value={pendingTasks.length}
          hint={pendingTasks.length === 1 ? "needs you" : pendingTasks.length > 0 ? "need you" : "all clear"}
          href={pendingTasks.length > 0 ? "#tasks" : undefined}
          accent={pendingTasks.length > 0}
        />
        <StatCard
          label="Meetings"
          value={upcomingMeetings.length}
          hint="upcoming"
          href={upcomingMeetings.length > 0 ? "#meetings" : undefined}
        />
        <StatCard
          label="Progress"
          value={`${progressPct}%`}
          hint={
            milestones.length > 0
              ? `${milestoneDone} of ${milestones.length} milestones`
              : "milestones pending"
          }
        />
        <StatCard
          label="Deliverables"
          value={files.length}
          hint="shared files"
          href={files.length > 0 ? "#files" : undefined}
        />
      </div>

      <AttentionBanner summary={attention} messagesEnabled={messagesEnabled} />

      <div className="grid gap-4 lg:grid-cols-12">
        <DashboardCard
          title="Progress"
          description="Milestone timeline"
          className="lg:col-span-4"
        >
          <MilestoneProgress milestones={milestones} />
        </DashboardCard>

        <DashboardCard
          id="tasks"
          title="Action items"
          description="Tasks waiting on you"
          className="lg:col-span-8"
        >
          <TaskList onboardingId={onboardingId} tasks={tasks} />
        </DashboardCard>

        <DashboardCard
          id="timeline"
          title="Activity"
          description="Updates, tasks, meetings, and files"
          className="lg:col-span-12"
        >
          <ProjectTimeline events={timeline} messagesEnabled={messagesEnabled} />
        </DashboardCard>

        <DashboardCard
          id="meetings"
          title="Meetings"
          description="Scheduled calls and sessions"
          className="lg:col-span-6"
        >
          <MeetingList meetings={meetings} />
        </DashboardCard>

        {messagesEnabled ? (
          <DashboardCard
            id="messages"
            title="Messages"
            description="Direct thread with Ryan"
            className="lg:col-span-6"
          >
            <MessageThread onboardingId={onboardingId} messages={messages} />
          </DashboardCard>
        ) : null}

        <DashboardCard
          id="files"
          title="Deliverables"
          description="Shared files and assets"
          className={messagesEnabled ? "lg:col-span-6" : "lg:col-span-6"}
        >
          <FileList files={files} />
        </DashboardCard>

        <DashboardCard
          title="Agreements & billing"
          description="Contracts and invoices"
          className={messagesEnabled ? "lg:col-span-6" : "lg:col-span-6"}
        >
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="text-[10px] font-medium uppercase tracking-wider text-white/40">
                Agreements
              </h3>
              <ul className="mt-3 space-y-2 text-sm">
                {contracts.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-sm border border-white/5 bg-white/[0.02] px-3 py-2"
                  >
                    {c.status === "signed" || c.status === "sent" ? (
                      <Link href={`/sign/${c.token}`} className="text-[#fdf0d5] hover:underline">
                        {c.title}
                        <span className="ml-1 text-white/40">({c.status})</span>
                      </Link>
                    ) : (
                      <span className="text-white/60">
                        {c.title} <span className="text-white/35">({c.status})</span>
                      </span>
                    )}
                  </li>
                ))}
                {contracts.length === 0 && (
                  <li className="text-sm text-white/40">No agreements yet.</li>
                )}
              </ul>
            </div>
            <div>
              <h3 className="text-[10px] font-medium uppercase tracking-wider text-white/40">
                Invoices
              </h3>
              <ul className="mt-3 space-y-2 text-sm">
                {invoices.map((i) => (
                  <li
                    key={i.id}
                    className="rounded-sm border border-white/5 bg-white/[0.02] px-3 py-2"
                  >
                    {i.status !== "void" && i.status !== "draft" ? (
                      <Link href={`/pay/${i.payToken}`} className="text-[#fdf0d5] hover:underline">
                        {i.invoiceNumber}
                        <span className="ml-1 text-white/50">
                          — ${(i.totalCents / 100).toFixed(2)}
                        </span>
                        <span className="ml-1 text-white/35">({i.status})</span>
                      </Link>
                    ) : (
                      <span className="text-white/60">
                        {i.invoiceNumber} <span className="text-white/35">({i.status})</span>
                      </span>
                    )}
                  </li>
                ))}
                {invoices.length === 0 && (
                  <li className="text-sm text-white/40">No invoices yet.</li>
                )}
              </ul>
            </div>
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}
