import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { portalNotifications } from "@/db/schema";
import { getClient } from "@/lib/crm/clients";
import { getOnboarding } from "@/lib/onboarding";
import { getAppUrl } from "@/lib/env";
import { sendEmail } from "@/lib/email/send";
import { portalProjectPath } from "@/lib/onboarding/slug";

const NOTIFICATION_SECTION_HASH: Record<string, string> = {
  update: "#timeline",
  milestone: "#timeline",
  task: "#tasks",
  meeting: "#meetings",
  file: "#files",
  message: "#messages",
};

function notificationPortalUrl(
  onboarding: { slug: string } | null,
  type: string,
) {
  if (!onboarding) return `${getAppUrl()}/portal`;
  const hash = NOTIFICATION_SECTION_HASH[type] || "";
  return `${getAppUrl()}${portalProjectPath(onboarding)}${hash}`;
}

export async function createPortalNotification(data: {
  clientId: string;
  onboardingId?: string | null;
  type: string;
  title: string;
  body?: string;
  refType?: string | null;
  refId?: string | null;
  sendEmail?: boolean;
}) {
  const [row] = await db
    .insert(portalNotifications)
    .values({
      clientId: data.clientId,
      onboardingId: data.onboardingId ?? null,
      type: data.type,
      title: data.title,
      body: data.body ?? "",
      refType: data.refType ?? null,
      refId: data.refId ?? null,
    })
    .returning();

  if (data.sendEmail) {
    await sendPortalNotificationEmail(row.id);
  }

  return row;
}

export async function sendPortalNotificationEmail(notificationId: string) {
  const [row] = await db
    .select()
    .from(portalNotifications)
    .where(eq(portalNotifications.id, notificationId))
    .limit(1);
  if (!row || row.emailedAt) return;

  const client = await getClient(row.clientId);
  if (!client?.email) return;

  let projectUrl = `${getAppUrl()}/portal`;
  let projectName = "Your project";
  if (row.onboardingId) {
    const onboarding = await getOnboarding(row.onboardingId);
    if (onboarding) {
      projectName = onboarding.projectName || projectName;
      projectUrl = notificationPortalUrl(onboarding, row.type);
    }
  }

  const templateKey = row.type as
    | "update"
    | "milestone"
    | "task"
    | "meeting"
    | "file"
    | "message";
  const {
    renderPortalUpdateEmail,
    renderPortalTaskEmail,
    renderPortalMeetingEmail,
    renderPortalFileEmail,
    renderPortalAdminMessageEmail,
    renderPortalNotificationEmail,
  } = await import("@/lib/email/templates/transactional");

  const emailOpts = {
    clientName: client.name,
    projectName,
    title: row.title,
    body: row.body,
    portalUrl: projectUrl,
  };

  const branded =
    templateKey === "update"
      ? await renderPortalUpdateEmail(emailOpts)
      : templateKey === "task"
        ? await renderPortalTaskEmail(emailOpts)
        : templateKey === "meeting"
          ? await renderPortalMeetingEmail(emailOpts)
          : templateKey === "file"
            ? await renderPortalFileEmail(emailOpts)
            : templateKey === "message"
              ? await renderPortalAdminMessageEmail(emailOpts)
              : await renderPortalNotificationEmail(emailOpts);

  await sendEmail({
    to: [client.email],
    subject: `[Portal] ${row.title}`,
    text: branded.text,
    html: branded.html,
    clientId: row.clientId,
  });

  await db
    .update(portalNotifications)
    .set({ emailedAt: new Date() })
    .where(eq(portalNotifications.id, row.id));
}

export async function listNotificationsForClient(clientId: string, limit = 20) {
  return db
    .select()
    .from(portalNotifications)
    .where(eq(portalNotifications.clientId, clientId))
    .orderBy(desc(portalNotifications.createdAt))
    .limit(limit);
}

export async function countUnreadNotifications(clientId: string) {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(portalNotifications)
    .where(and(eq(portalNotifications.clientId, clientId), isNull(portalNotifications.readAt)));
  return row?.count ?? 0;
}

export async function markNotificationRead(id: string, clientId: string) {
  await db
    .update(portalNotifications)
    .set({ readAt: new Date() })
    .where(and(eq(portalNotifications.id, id), eq(portalNotifications.clientId, clientId)));
}

export async function markAllNotificationsRead(clientId: string) {
  await db
    .update(portalNotifications)
    .set({ readAt: new Date() })
    .where(and(eq(portalNotifications.clientId, clientId), isNull(portalNotifications.readAt)));
}
