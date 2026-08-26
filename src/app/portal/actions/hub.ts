"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requirePortalActor } from "@/lib/auth";
import { addActivity, getClient } from "@/lib/crm/clients";
import { getSetting } from "@/lib/content";
import { getOnboardingForClient, portalProjectPath } from "@/lib/onboarding";
import { completePortalTask, updatePortalTask } from "@/lib/portal/tasks";
import { postPortalMessage, getOrCreateThread, markMessagesReadForClient } from "@/lib/portal/messages";
import {
  countUnreadNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/portal/notifications";
import { sendEmail } from "@/lib/email/send";
import { logAudit } from "@/lib/audit";
import { storeFile } from "@/lib/storage";
import { randomBytes } from "crypto";

async function ownedOnboarding(onboardingId: string) {
  const actor = await requirePortalActor();
  const onboarding = await getOnboardingForClient(actor.clientId, onboardingId);
  if (!onboarding) throw new Error("Not found");
  return { actor, onboarding };
}

function auditImpersonation(
  actor: { impersonating: boolean; impersonatorAdminId: string | null; clientId: string },
  action: string,
  entityId?: string,
) {
  if (actor.impersonating && actor.impersonatorAdminId) {
    return logAudit(action, "onboarding", entityId || null, {
      impersonatorAdminId: actor.impersonatorAdminId,
      clientId: actor.clientId,
    });
  }
  return Promise.resolve();
}

export async function completeTaskAction(
  taskId: string,
  onboardingId: string,
  data?: { note?: string; approved?: boolean },
) {
  const { actor, onboarding } = await ownedOnboarding(onboardingId);
  const metadata = data
    ? { note: data.note || null, approved: data.approved ?? null }
    : undefined;
  await completePortalTask(taskId, actor.clientId, metadata);
  await auditImpersonation(actor, "complete_task", taskId);
  revalidatePath(portalProjectPath(onboarding));
  return { ok: true };
}

export async function uploadTaskFileAction(
  taskId: string,
  onboardingId: string,
  formData: FormData,
) {
  const { actor, onboarding } = await ownedOnboarding(onboardingId);
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("No file");
  if (file.size > 25 * 1024 * 1024) throw new Error("File must be under 25MB");

  const buf = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop() || "bin";
  const path = `portal/tasks/${onboardingId}/${taskId}-${randomBytes(6).toString("hex")}.${ext}`;
  const url = await storeFile(path, buf, file.type);

  await updatePortalTask(taskId, {
    metadata: {
      uploadUrl: url,
      filename: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    },
  });
  await completePortalTask(taskId, actor.clientId, {
    uploadUrl: url,
    filename: file.name,
  });
  await auditImpersonation(actor, "upload_task_file", taskId);
  revalidatePath(portalProjectPath(onboarding));
  return { ok: true, filename: file.name };
}

export async function postMessageAction(
  onboardingId: string,
  data: { subject?: string; body: string },
) {
  const { actor, onboarding } = await ownedOnboarding(onboardingId);
  const parsed = z.object({ subject: z.string().optional(), body: z.string().min(1) }).parse(data);

  const client = await getClient(actor.clientId);
  if (!client) throw new Error("Client not found");

  await postPortalMessage({
    clientId: actor.clientId,
    onboardingId,
    senderType: "client",
    subject: parsed.subject || null,
    body: parsed.body,
  });

  await addActivity(
    actor.clientId,
    "portal_message",
    `Portal message: ${parsed.subject || "Message"} — ${onboarding.projectName || "Project"}`,
    onboardingId,
  );

  const emailSettings = await getSetting<{ fromEmail?: string }>("email");
  const to =
    emailSettings?.fromEmail || process.env.RESEND_FROM_EMAIL || process.env.ADMIN_EMAIL;
  if (to) {
    const { renderPortalMessageEmail } = await import("@/lib/email/templates/transactional");
    const branded = await renderPortalMessageEmail({
      clientName: client.name,
      clientEmail: client.email,
      projectName: onboarding.projectName || "Project",
      body: parsed.body,
    });
    await sendEmail({
      to: [to],
      subject: `[Portal] ${onboarding.projectName || "Project"}: ${parsed.subject || "Message"}`,
      text: branded.text,
      html: branded.html,
      clientId: actor.clientId,
    });
  }

  await auditImpersonation(actor, "portal_message", onboardingId);
  revalidatePath(portalProjectPath(onboarding));
  return { ok: true };
}

export async function markThreadReadAction(onboardingId: string) {
  const { actor, onboarding } = await ownedOnboarding(onboardingId);
  const thread = await getOrCreateThread(actor.clientId, onboardingId);
  await markMessagesReadForClient(thread.id);
  revalidatePath(portalProjectPath(onboarding));
  return { ok: true };
}

export async function markNotificationReadAction(notificationId: string) {
  const actor = await requirePortalActor();
  await markNotificationRead(notificationId, actor.clientId);
  revalidatePath("/portal");
  return { ok: true };
}

export async function markAllNotificationsReadAction() {
  const actor = await requirePortalActor();
  await markAllNotificationsRead(actor.clientId);
  revalidatePath("/portal");
  return { ok: true };
}

export async function getUnreadNotificationCountAction() {
  const actor = await requirePortalActor();
  const count = await countUnreadNotifications(actor.clientId);
  return { count };
}
