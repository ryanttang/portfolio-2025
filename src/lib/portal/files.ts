import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { portalFiles } from "@/db/schema";
import { addActivity } from "@/lib/crm/clients";
import { createPortalNotification } from "@/lib/portal/notifications";

export async function listPortalFiles(onboardingId: string) {
  return db
    .select()
    .from(portalFiles)
    .where(eq(portalFiles.onboardingId, onboardingId))
    .orderBy(desc(portalFiles.createdAt));
}

export async function createPortalFile(data: {
  clientId: string;
  onboardingId: string;
  title: string;
  description?: string | null;
  blobUrl: string;
  mimeType?: string | null;
  sizeBytes?: number | null;
  uploadedByAdminId?: string | null;
  notify?: boolean;
}) {
  const [row] = await db
    .insert(portalFiles)
    .values({
      clientId: data.clientId,
      onboardingId: data.onboardingId,
      title: data.title,
      description: data.description ?? null,
      blobUrl: data.blobUrl,
      mimeType: data.mimeType ?? null,
      sizeBytes: data.sizeBytes ?? null,
      uploadedByAdminId: data.uploadedByAdminId ?? null,
    })
    .returning();

  await addActivity(data.clientId, "portal", `File: ${row.title}`, row.id);

  if (data.notify !== false) {
    await createPortalNotification({
      clientId: data.clientId,
      onboardingId: data.onboardingId,
      type: "file",
      title: `New deliverable: ${row.title}`,
      body: row.description || "A new file is available in your portal.",
      refType: "file",
      refId: row.id,
      sendEmail: true,
    });
  }

  return row;
}

export async function deletePortalFile(id: string) {
  await db.delete(portalFiles).where(eq(portalFiles.id, id));
}
