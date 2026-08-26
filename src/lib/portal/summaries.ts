import { and, eq, gte, isNull, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { portalMeetings, portalNotifications } from "@/db/schema";
import { listOnboardingsForClient } from "@/lib/onboarding";
import { countUnreadClientMessages } from "@/lib/portal/messages";
import { countPendingTasks } from "@/lib/portal/tasks";
import type { ProjectAttentionSummary } from "@/lib/portal/types";

export async function countUpcomingMeetingsWithinHours(onboardingId: string, hours: number) {
  const from = new Date();
  const to = new Date(from.getTime() + hours * 60 * 60 * 1000);
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(portalMeetings)
    .where(
      and(
        eq(portalMeetings.onboardingId, onboardingId),
        gte(portalMeetings.startsAt, from),
        lte(portalMeetings.startsAt, to),
      ),
    );
  return row?.count ?? 0;
}

export async function countUnreadNotificationsForProject(clientId: string, onboardingId: string) {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(portalNotifications)
    .where(
      and(
        eq(portalNotifications.clientId, clientId),
        eq(portalNotifications.onboardingId, onboardingId),
        isNull(portalNotifications.readAt),
      ),
    );
  return row?.count ?? 0;
}

export async function getProjectAttentionSummary(
  onboardingId: string,
  clientId: string,
): Promise<ProjectAttentionSummary> {
  const [pendingTasks, unreadMessages, upcomingMeetings, unreadNotifications] =
    await Promise.all([
      countPendingTasks(onboardingId),
      countUnreadClientMessages(onboardingId),
      countUpcomingMeetingsWithinHours(onboardingId, 48),
      countUnreadNotificationsForProject(clientId, onboardingId),
    ]);

  return { pendingTasks, unreadMessages, upcomingMeetings, unreadNotifications };
}

export type PortalProjectCardSummary = {
  onboardingId: string;
  pendingTasks: number;
  meetingsWithin48h: number;
  meetingTomorrow: boolean;
  unreadNotifications: number;
  hasAttention: boolean;
};

export async function getPortalHomeProjectSummaries(
  clientId: string,
): Promise<PortalProjectCardSummary[]> {
  const projects = await listOnboardingsForClient(clientId);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStart = new Date(tomorrow);
  tomorrowStart.setHours(0, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(23, 59, 59, 999);

  return Promise.all(
    projects.map(async (p) => {
      const [pendingTasks, meetingsWithin48h, unreadNotifications, tomorrowMeetings] =
        await Promise.all([
          p.status === "completed" ? countPendingTasks(p.id) : Promise.resolve(0),
          p.status === "completed"
            ? countUpcomingMeetingsWithinHours(p.id, 48)
            : Promise.resolve(0),
          countUnreadNotificationsForProject(clientId, p.id),
          p.status === "completed"
            ? db
                .select({ count: sql<number>`count(*)::int` })
                .from(portalMeetings)
                .where(
                  and(
                    eq(portalMeetings.onboardingId, p.id),
                    gte(portalMeetings.startsAt, tomorrowStart),
                    lte(portalMeetings.startsAt, tomorrowEnd),
                  ),
                )
                .then((r) => r[0]?.count ?? 0)
            : Promise.resolve(0),
        ]);

      const hasAttention =
        pendingTasks > 0 || meetingsWithin48h > 0 || unreadNotifications > 0;

      return {
        onboardingId: p.id,
        pendingTasks,
        meetingsWithin48h,
        meetingTomorrow: tomorrowMeetings > 0,
        unreadNotifications,
        hasAttention,
      };
    }),
  );
}
