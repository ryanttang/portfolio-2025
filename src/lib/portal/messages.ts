import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { portalMessageThreads, portalMessages } from "@/db/schema";
import { createPortalNotification } from "@/lib/portal/notifications";

export async function getOrCreateThread(clientId: string, onboardingId: string) {
  const [existing] = await db
    .select()
    .from(portalMessageThreads)
    .where(eq(portalMessageThreads.onboardingId, onboardingId))
    .limit(1);

  if (existing) return existing;

  const [row] = await db
    .insert(portalMessageThreads)
    .values({ clientId, onboardingId })
    .returning();
  return row;
}

export async function listThreadMessages(threadId: string) {
  return db
    .select()
    .from(portalMessages)
    .where(eq(portalMessages.threadId, threadId))
    .orderBy(asc(portalMessages.createdAt));
}

export async function countUnreadClientMessages(onboardingId: string) {
  const [thread] = await db
    .select({ id: portalMessageThreads.id })
    .from(portalMessageThreads)
    .where(eq(portalMessageThreads.onboardingId, onboardingId))
    .limit(1);
  if (!thread) return 0;

  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(portalMessages)
    .where(
      and(
        eq(portalMessages.threadId, thread.id),
        eq(portalMessages.senderType, "admin"),
        isNull(portalMessages.readAt),
      ),
    );
  return row?.count ?? 0;
}

export async function postPortalMessage(data: {
  clientId: string;
  onboardingId: string;
  senderType: "admin" | "client";
  subject?: string | null;
  body: string;
  createdByAdminId?: string | null;
  notify?: boolean;
}) {
  const thread = await getOrCreateThread(data.clientId, data.onboardingId);

  const [message] = await db
    .insert(portalMessages)
    .values({
      threadId: thread.id,
      senderType: data.senderType,
      subject: data.subject ?? null,
      body: data.body,
      createdByAdminId: data.createdByAdminId ?? null,
    })
    .returning();

  await db
    .update(portalMessageThreads)
    .set({ lastMessageAt: new Date() })
    .where(eq(portalMessageThreads.id, thread.id));

  if (data.senderType === "admin" && data.notify !== false) {
    await createPortalNotification({
      clientId: data.clientId,
      onboardingId: data.onboardingId,
      type: "message",
      title: data.subject || "New message from Ryan",
      body: data.body.slice(0, 280),
      refType: "message",
      refId: message.id,
      sendEmail: true,
    });
  }

  return message;
}

export async function markMessagesReadForClient(threadId: string) {
  await db
    .update(portalMessages)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(portalMessages.threadId, threadId),
        eq(portalMessages.senderType, "admin"),
        isNull(portalMessages.readAt),
      ),
    );
}

export async function getThreadForOnboarding(onboardingId: string) {
  const [row] = await db
    .select()
    .from(portalMessageThreads)
    .where(eq(portalMessageThreads.onboardingId, onboardingId))
    .limit(1);
  return row || null;
}

export async function listRecentThreadsForClient(clientId: string) {
  return db
    .select()
    .from(portalMessageThreads)
    .where(eq(portalMessageThreads.clientId, clientId))
    .orderBy(desc(portalMessageThreads.lastMessageAt));
}
