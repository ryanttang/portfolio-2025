import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { portalTasks } from "@/db/schema";
import { addActivity } from "@/lib/crm/clients";
import { createPortalNotification } from "@/lib/portal/notifications";
import type { PortalTaskStatus, PortalTaskType } from "@/lib/portal/types";

export async function listPortalTasks(onboardingId: string) {
  return db
    .select()
    .from(portalTasks)
    .where(eq(portalTasks.onboardingId, onboardingId))
    .orderBy(asc(portalTasks.sortOrder), asc(portalTasks.createdAt));
}

export async function countPendingTasks(onboardingId: string) {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(portalTasks)
    .where(and(eq(portalTasks.onboardingId, onboardingId), eq(portalTasks.status, "pending")));
  return row?.count ?? 0;
}

export async function createPortalTask(data: {
  clientId: string;
  onboardingId: string;
  type?: PortalTaskType;
  title: string;
  description?: string | null;
  linkUrl?: string | null;
  dueAt?: Date | null;
  notify?: boolean;
}) {
  const [last] = await db
    .select({ sortOrder: portalTasks.sortOrder })
    .from(portalTasks)
    .where(eq(portalTasks.onboardingId, data.onboardingId))
    .orderBy(desc(portalTasks.sortOrder))
    .limit(1);

  const [row] = await db
    .insert(portalTasks)
    .values({
      clientId: data.clientId,
      onboardingId: data.onboardingId,
      type: data.type || "general",
      title: data.title,
      description: data.description ?? null,
      linkUrl: data.linkUrl ?? null,
      dueAt: data.dueAt ?? null,
      sortOrder: (last?.sortOrder ?? -1) + 1,
    })
    .returning();

  await addActivity(data.clientId, "portal", `Task: ${row.title}`, row.id);

  if (data.notify !== false) {
    await createPortalNotification({
      clientId: data.clientId,
      onboardingId: data.onboardingId,
      type: "task",
      title: `New action item: ${row.title}`,
      body: row.description || "Something needs your attention in the portal.",
      refType: "task",
      refId: row.id,
      sendEmail: true,
    });
  }

  return row;
}

export async function updatePortalTask(
  id: string,
  data: Partial<{
    type: PortalTaskType;
    status: PortalTaskStatus;
    title: string;
    description: string | null;
    linkUrl: string | null;
    dueAt: Date | null;
    metadata: Record<string, unknown>;
  }>,
) {
  const [row] = await db
    .update(portalTasks)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(portalTasks.id, id))
    .returning();
  return row;
}

export async function completePortalTask(
  id: string,
  clientId: string,
  metadata?: Record<string, unknown>,
) {
  const [row] = await db
    .update(portalTasks)
    .set({
      status: "completed",
      completedAt: new Date(),
      updatedAt: new Date(),
      ...(metadata ? { metadata } : {}),
    })
    .where(and(eq(portalTasks.id, id), eq(portalTasks.clientId, clientId)))
    .returning();
  if (row) {
    await addActivity(clientId, "portal", `Task completed: ${row.title}`, row.id);
  }
  return row;
}

export async function deletePortalTask(id: string) {
  await db.delete(portalTasks).where(eq(portalTasks.id, id));
}
