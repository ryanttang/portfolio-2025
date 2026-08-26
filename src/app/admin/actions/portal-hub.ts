"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getOnboarding, portalProjectPath } from "@/lib/onboarding";
import { createPortalTask, deletePortalTask } from "@/lib/portal/tasks";
import {
  createPortalMeeting,
  deletePortalMeeting,
} from "@/lib/portal/meetings";
import { createPortalFile, deletePortalFile } from "@/lib/portal/files";
import { postPortalMessage, getOrCreateThread, listThreadMessages } from "@/lib/portal/messages";
import { createPortalNotification } from "@/lib/portal/notifications";
import { saveProjectInfo, type ProjectInfo } from "@/lib/portal/project-info";
import { createPortalUpdate } from "@/lib/onboarding";
import { storeFile } from "@/lib/storage";
import { db } from "@/db";
import { onboardings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";

async function revalidateHub(onboardingId: string) {
  const onboarding = await getOnboarding(onboardingId);
  if (onboarding) {
    revalidatePath(portalProjectPath(onboarding));
  }
  revalidatePath(`/admin/onboarding/${onboardingId}`);
  revalidatePath("/portal");
}

export async function createTaskAction(
  clientId: string,
  onboardingId: string,
  data: {
    type: string;
    title: string;
    description?: string;
    linkUrl?: string;
    dueAt?: string;
    notify?: boolean;
  },
) {
  await requireAdmin();
  const parsed = z
    .object({
      type: z.enum(["general", "approval", "review", "upload"]),
      title: z.string().min(1),
      description: z.string().optional(),
      linkUrl: z.string().optional(),
      dueAt: z.string().optional(),
      notify: z.boolean().optional(),
    })
    .parse(data);

  await createPortalTask({
    clientId,
    onboardingId,
    type: parsed.type,
    title: parsed.title,
    description: parsed.description,
    linkUrl: parsed.linkUrl,
    dueAt: parsed.dueAt ? new Date(parsed.dueAt) : null,
    notify: parsed.notify,
  });
  await revalidateHub(onboardingId);
  return { ok: true };
}

export async function deleteTaskAction(id: string, clientId: string, onboardingId: string) {
  await requireAdmin();
  await deletePortalTask(id);
  await revalidateHub(onboardingId);
  return { ok: true };
}

export async function updateTaskAction(
  id: string,
  clientId: string,
  onboardingId: string,
  data: Partial<{
    title: string;
    description: string | null;
    linkUrl: string | null;
    dueAt: string | null;
    status: string;
  }>,
) {
  await requireAdmin();
  const { updatePortalTask } = await import("@/lib/portal/tasks");
  const { dueAt, status, ...rest } = data;
  await updatePortalTask(id, {
    ...rest,
    ...(status
      ? { status: status as "pending" | "completed" | "cancelled" }
      : {}),
    ...(dueAt !== undefined ? { dueAt: dueAt ? new Date(dueAt) : null } : {}),
  });
  await revalidateHub(onboardingId);
  return { ok: true };
}

export async function createMeetingAction(
  clientId: string,
  onboardingId: string,
  data: {
    title: string;
    description?: string;
    startsAt: string;
    endsAt: string;
    timezone?: string;
    location?: string;
    notify?: boolean;
  },
) {
  await requireAdmin();
  const parsed = z
    .object({
      title: z.string().min(1),
      description: z.string().optional(),
      startsAt: z.string(),
      endsAt: z.string(),
      timezone: z.string().optional(),
      location: z.string().optional(),
      notify: z.boolean().optional(),
    })
    .parse(data);

  await createPortalMeeting({
    clientId,
    onboardingId,
    title: parsed.title,
    description: parsed.description,
    startsAt: new Date(parsed.startsAt),
    endsAt: new Date(parsed.endsAt),
    timezone: parsed.timezone,
    location: parsed.location,
    notify: parsed.notify,
  });
  await revalidateHub(onboardingId);
  return { ok: true };
}

export async function deleteMeetingAction(id: string, clientId: string, onboardingId: string) {
  await requireAdmin();
  await deletePortalMeeting(id);
  await revalidateHub(onboardingId);
  return { ok: true };
}

export async function updateMeetingAction(
  id: string,
  clientId: string,
  onboardingId: string,
  data: Partial<{
    title: string;
    description: string | null;
    startsAt: string;
    endsAt: string;
    timezone: string;
    location: string | null;
  }>,
) {
  await requireAdmin();
  const { updatePortalMeeting } = await import("@/lib/portal/meetings");
  await updatePortalMeeting(id, {
    ...data,
    startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
    endsAt: data.endsAt ? new Date(data.endsAt) : undefined,
  });
  await revalidateHub(onboardingId);
  return { ok: true };
}

export async function uploadPortalFileAction(
  clientId: string,
  onboardingId: string,
  formData: FormData,
) {
  const session = await requireAdmin();
  const file = formData.get("file");
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const notify = formData.get("notify") !== "false";

  if (!(file instanceof File)) throw new Error("No file");
  if (!title) throw new Error("Title required");
  if (file.size > 25 * 1024 * 1024) throw new Error("File must be under 25MB");

  const buf = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop() || "bin";
  const path = `portal/${onboardingId}/${randomBytes(6).toString("hex")}.${ext}`;
  const url = await storeFile(path, buf, file.type);

  await createPortalFile({
    clientId,
    onboardingId,
    title,
    description: description || null,
    blobUrl: url,
    mimeType: file.type,
    sizeBytes: file.size,
    uploadedByAdminId: session.user.id,
    notify,
  });
  await revalidateHub(onboardingId);
  return { ok: true };
}

export async function deleteFileAction(id: string, clientId: string, onboardingId: string) {
  await requireAdmin();
  await deletePortalFile(id);
  await revalidateHub(onboardingId);
  return { ok: true };
}

export async function postAdminMessageAction(
  clientId: string,
  onboardingId: string,
  data: { subject?: string; body: string; notify?: boolean },
) {
  const session = await requireAdmin();
  const parsed = z.object({ subject: z.string().optional(), body: z.string().min(1) }).parse(data);

  await postPortalMessage({
    clientId,
    onboardingId,
    senderType: "admin",
    subject: parsed.subject,
    body: parsed.body,
    createdByAdminId: session.user.id,
    notify: data.notify,
  });
  await revalidateHub(onboardingId);
  return { ok: true };
}

export async function createUpdateWithNotifyAction(
  clientId: string,
  onboardingId: string,
  title: string,
  body: string,
  notify: boolean,
) {
  const session = await requireAdmin();
  const row = await createPortalUpdate({
    clientId,
    onboardingId,
    title,
    body,
    createdByAdminId: session.user.id,
  });

  if (notify) {
    await createPortalNotification({
      clientId,
      onboardingId,
      type: "update",
      title: `Project update: ${title}`,
      body: body.slice(0, 280),
      refType: "update",
      refId: row.id,
      sendEmail: true,
    });
  }

  await revalidateHub(onboardingId);
  return { ok: true };
}

export async function updateHubWelcomeMessageAction(
  onboardingId: string,
  hubWelcomeMessage: string,
) {
  await requireAdmin();
  await db
    .update(onboardings)
    .set({ hubWelcomeMessage, updatedAt: new Date() })
    .where(eq(onboardings.id, onboardingId));
  const onboarding = await getOnboarding(onboardingId);
  if (onboarding) revalidatePath(portalProjectPath(onboarding));
  return { ok: true };
}

export async function updateProjectInfoAction(onboardingId: string, data: ProjectInfo) {
  await requireAdmin();
  const parsed = z
    .object({
      projectUrl: z.string(),
      clientLoginUrl: z.string(),
      clientUsername: z.string(),
      clientPassword: z.string(),
    })
    .parse(data);
  await saveProjectInfo(onboardingId, parsed);
  await revalidateHub(onboardingId);
  return { ok: true };
}

export async function updateMessagesEnabledAction(onboardingId: string, enabled: boolean) {
  await requireAdmin();
  await db
    .update(onboardings)
    .set({ messagesEnabled: enabled, updatedAt: new Date() })
    .where(eq(onboardings.id, onboardingId));
  await revalidateHub(onboardingId);
  return { ok: true };
}

export async function getAdminThreadMessagesAction(onboardingId: string) {
  await requireAdmin();
  const onboarding = await getOnboarding(onboardingId);
  if (!onboarding) throw new Error("Not found");
  const thread = await getOrCreateThread(onboarding.clientId, onboardingId);
  return listThreadMessages(thread.id);
}

export async function sendPasswordResetForClientAction(clientId: string) {
  await requireAdmin();
  const { getClientAccountByClientId, sendPasswordResetEmail } = await import("@/lib/portal/auth");
  const account = await getClientAccountByClientId(clientId);
  if (!account) throw new Error("No portal account");
  await sendPasswordResetEmail(account.email);
  return { ok: true };
}

export async function sendClientPortalInviteAction(
  clientId: string,
  onboardingId?: string | null,
) {
  await requireAdmin();
  const { getOnboarding } = await import("@/lib/onboarding");
  const { sendPortalInviteEmail } = await import("@/lib/portal/auth");

  let context: { projectName?: string; onboardingId?: string | null } = { onboardingId };
  if (onboardingId) {
    const onboarding = await getOnboarding(onboardingId);
    if (!onboarding || onboarding.clientId !== clientId) {
      throw new Error("Project not found for this client");
    }
    context = {
      projectName: onboarding.projectName,
      onboardingId: onboarding.id,
    };
  }

  const { url } = await sendPortalInviteEmail(clientId, context);
  return { ok: true, url };
}
