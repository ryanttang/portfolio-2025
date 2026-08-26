import {
  listPortalMilestones,
  listPortalUpdates,
} from "@/lib/onboarding";
import { listPortalMeetings } from "@/lib/portal/meetings";
import { listPortalTasks } from "@/lib/portal/tasks";
import { listPortalFiles } from "@/lib/portal/files";
import { getThreadForOnboarding, listThreadMessages } from "@/lib/portal/messages";
import type { PortalTimelineEvent } from "@/lib/portal/types";

export async function buildProjectTimeline(onboardingId: string): Promise<PortalTimelineEvent[]> {
  const [updates, milestones, tasks, meetings, files, thread] = await Promise.all([
    listPortalUpdates(onboardingId),
    listPortalMilestones(onboardingId),
    listPortalTasks(onboardingId),
    listPortalMeetings(onboardingId),
    listPortalFiles(onboardingId),
    getThreadForOnboarding(onboardingId),
  ]);

  const messages = thread ? await listThreadMessages(thread.id) : [];

  const events: PortalTimelineEvent[] = [
    ...updates.map((u) => ({
      id: u.id,
      type: "update" as const,
      title: u.title,
      body: u.body,
      at: u.createdAt,
    })),
    ...milestones.map((m) => ({
      id: m.id,
      type: "milestone" as const,
      title: m.title,
      body: m.description,
      at: m.updatedAt,
      meta: { status: m.status, dueAt: m.dueAt?.toISOString() ?? null },
    })),
    ...tasks
      .filter((t) => t.status === "completed")
      .map((t) => ({
        id: t.id,
        type: "task" as const,
        title: t.title,
        body: t.description,
        at: t.completedAt || t.updatedAt,
        meta: { status: t.status, type: t.type },
      })),
    ...meetings.map((m) => ({
      id: m.id,
      type: "meeting" as const,
      title: m.title,
      body: m.description,
      at: m.startsAt,
      meta: { location: m.location, endsAt: m.endsAt.toISOString() },
    })),
    ...files.map((f) => ({
      id: f.id,
      type: "file" as const,
      title: f.title,
      body: f.description,
      at: f.createdAt,
      meta: { blobUrl: f.blobUrl, mimeType: f.mimeType },
    })),
    ...messages.map((msg) => ({
      id: msg.id,
      type: "message" as const,
      title: msg.subject || (msg.senderType === "admin" ? "Message from Ryan" : "Your message"),
      body: msg.body,
      at: msg.createdAt,
      meta: { senderType: msg.senderType },
    })),
  ];

  return events.sort((a, b) => b.at.getTime() - a.at.getTime());
}
