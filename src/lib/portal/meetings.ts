import { and, asc, eq, gte, lte, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "@/db";
import { portalMeetings } from "@/db/schema";
import { addActivity } from "@/lib/crm/clients";
import { createPortalNotification } from "@/lib/portal/notifications";

export async function listPortalMeetings(onboardingId: string) {
  return db
    .select()
    .from(portalMeetings)
    .where(eq(portalMeetings.onboardingId, onboardingId))
    .orderBy(asc(portalMeetings.startsAt));
}

export async function countUpcomingMeetings(onboardingId: string, withinDays = 7) {
  const from = new Date();
  const to = new Date();
  to.setDate(to.getDate() + withinDays);
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

export async function getPortalMeeting(id: string) {
  const [row] = await db.select().from(portalMeetings).where(eq(portalMeetings.id, id)).limit(1);
  return row || null;
}

export async function createPortalMeeting(data: {
  clientId: string;
  onboardingId: string;
  title: string;
  description?: string | null;
  startsAt: Date;
  endsAt: Date;
  timezone?: string;
  location?: string | null;
  notify?: boolean;
}) {
  const [row] = await db
    .insert(portalMeetings)
    .values({
      clientId: data.clientId,
      onboardingId: data.onboardingId,
      title: data.title,
      description: data.description ?? null,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      timezone: data.timezone || "America/Los_Angeles",
      location: data.location ?? null,
      icsUid: randomUUID(),
    })
    .returning();

  await addActivity(data.clientId, "portal", `Meeting: ${row.title}`, row.id);

  if (data.notify !== false) {
    await createPortalNotification({
      clientId: data.clientId,
      onboardingId: data.onboardingId,
      type: "meeting",
      title: `Meeting scheduled: ${row.title}`,
      body: row.description || `Starts ${row.startsAt.toLocaleString()}`,
      refType: "meeting",
      refId: row.id,
      sendEmail: true,
    });
  }

  return row;
}

export async function updatePortalMeeting(
  id: string,
  data: Partial<{
    title: string;
    description: string | null;
    startsAt: Date;
    endsAt: Date;
    timezone: string;
    location: string | null;
  }>,
) {
  const [row] = await db
    .update(portalMeetings)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(portalMeetings.id, id))
    .returning();
  return row;
}

export async function deletePortalMeeting(id: string) {
  await db.delete(portalMeetings).where(eq(portalMeetings.id, id));
}
