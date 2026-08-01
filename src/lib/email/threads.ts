import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { emailAttachments, emailMessages, emailThreads } from "@/db/schema";

export async function listThreads(limit = 50) {
  return db
    .select()
    .from(emailThreads)
    .orderBy(desc(emailThreads.lastMessageAt))
    .limit(limit);
}

export async function getThread(id: string) {
  const [thread] = await db
    .select()
    .from(emailThreads)
    .where(eq(emailThreads.id, id))
    .limit(1);
  return thread || null;
}

export async function getThreadMessages(threadId: string) {
  return db
    .select()
    .from(emailMessages)
    .where(eq(emailMessages.threadId, threadId))
    .orderBy(emailMessages.createdAt);
}

export async function getMessageAttachments(messageId: string) {
  return db
    .select()
    .from(emailAttachments)
    .where(eq(emailAttachments.messageId, messageId));
}

export async function getAttachmentsForMessages(messageIds: string[]) {
  if (messageIds.length === 0) return [] as (typeof emailAttachments.$inferSelect)[];
  const { inArray } = await import("drizzle-orm");
  return db
    .select()
    .from(emailAttachments)
    .where(inArray(emailAttachments.messageId, messageIds));
}

export async function listThreadsForClient(clientId: string, limit = 10) {
  return db
    .select()
    .from(emailThreads)
    .where(eq(emailThreads.clientId, clientId))
    .orderBy(desc(emailThreads.lastMessageAt))
    .limit(limit);
}

export async function markThreadRead(threadId: string) {
  await db
    .update(emailMessages)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(emailMessages.threadId, threadId),
        eq(emailMessages.direction, "inbound"),
        isNull(emailMessages.readAt),
      ),
    );
}

export async function unreadCount() {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(emailMessages)
    .where(and(eq(emailMessages.direction, "inbound"), isNull(emailMessages.readAt)));
  return Number(row?.count ?? 0);
}

export async function unreadCountsByThread(threadIds: string[]) {
  if (threadIds.length === 0) return {} as Record<string, number>;
  const { inArray } = await import("drizzle-orm");
  const rows = await db
    .select({
      threadId: emailMessages.threadId,
      count: sql<number>`count(*)::int`,
    })
    .from(emailMessages)
    .where(
      and(
        inArray(emailMessages.threadId, threadIds),
        eq(emailMessages.direction, "inbound"),
        isNull(emailMessages.readAt),
      ),
    )
    .groupBy(emailMessages.threadId);
  return Object.fromEntries(rows.map((r) => [r.threadId, Number(r.count ?? 0)]));
}
