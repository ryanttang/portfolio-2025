import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { requirePortalActor } from "@/lib/auth";
import { db } from "@/db";
import { contracts, invoices } from "@/db/schema";
import {
  getOnboardingForClient,
  listPortalMilestones,
  portalProjectPath,
} from "@/lib/onboarding";
import { getProjectAttentionSummary } from "@/lib/portal/summaries";
import { listPortalTasks } from "@/lib/portal/tasks";
import { listPortalMeetings } from "@/lib/portal/meetings";
import { listPortalFiles } from "@/lib/portal/files";
import { getThreadForOnboarding, listThreadMessages } from "@/lib/portal/messages";
import { buildProjectTimeline } from "@/lib/portal/timeline";
import ProjectDashboard from "@/components/portal/ProjectDashboard";

export default async function ProjectHubPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ welcome?: string }>;
}) {
  let actor;
  try {
    actor = await requirePortalActor();
  } catch {
    redirect("/portal/login");
  }

  const { slug } = await params;
  const { welcome } = await searchParams;
  const onboarding = await getOnboardingForClient(actor.clientId, slug);
  if (!onboarding) notFound();

  if (slug !== onboarding.slug) {
    redirect(portalProjectPath(onboarding));
  }

  if (onboarding.status !== "completed") {
    redirect(portalProjectPath(onboarding, "onboarding"));
  }

  const [
    milestones,
    tasks,
    meetings,
    files,
    attention,
    timeline,
    clientContracts,
    clientInvoices,
    thread,
  ] = await Promise.all([
    listPortalMilestones(onboarding.id),
    listPortalTasks(onboarding.id),
    listPortalMeetings(onboarding.id),
    listPortalFiles(onboarding.id),
    getProjectAttentionSummary(onboarding.id, actor.clientId),
    buildProjectTimeline(onboarding.id),
    onboarding.contractId
      ? db.select().from(contracts).where(eq(contracts.id, onboarding.contractId))
      : db.select().from(contracts).where(eq(contracts.clientId, actor.clientId)),
    onboarding.invoiceId
      ? db.select().from(invoices).where(eq(invoices.id, onboarding.invoiceId))
      : db.select().from(invoices).where(eq(invoices.clientId, actor.clientId)),
    getThreadForOnboarding(onboarding.id),
  ]);

  const messages = thread ? await listThreadMessages(thread.id) : [];

  const linkedContracts = onboarding.contractId
    ? clientContracts
    : clientContracts.slice(0, 5);
  const linkedInvoices = onboarding.invoiceId
    ? clientInvoices
    : clientInvoices.slice(0, 5);

  const showWelcome = welcome === "1" || !onboarding.hubWelcomeSeenAt;

  return (
    <ProjectDashboard
      onboardingId={onboarding.id}
      projectName={onboarding.projectName || "Your project"}
      services={onboarding.services || []}
      hubWelcomeMessage={onboarding.hubWelcomeMessage}
      showWelcome={showWelcome}
      attention={attention}
      milestones={milestones}
      tasks={tasks}
      meetings={meetings}
      files={files}
      messages={messages}
      timeline={timeline}
      contracts={linkedContracts}
      invoices={linkedInvoices}
    />
  );
}
