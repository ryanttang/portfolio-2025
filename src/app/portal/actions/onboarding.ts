"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireClient, requirePortalActor } from "@/lib/auth";
import { getClient, updateClient } from "@/lib/crm/clients";
import {
  advanceStep,
  completeOnboarding,
  getOnboardingForClient,
  saveCoreAnswers,
  updateOnboarding,
  upsertAnswer,
} from "@/lib/onboarding";
import {
  changeClientPassword,
  getInviteByToken,
  setPasswordFromInvite,
} from "@/lib/portal/auth";
import { sendEmail } from "@/lib/email/send";
import { getSetting } from "@/lib/content";
import { logAudit } from "@/lib/audit";
import { storeFile } from "@/lib/storage";
import type { CoreAnswerKey, OnboardingStep } from "@/lib/onboarding/types";
import { CORE_ANSWER_KEYS } from "@/lib/onboarding/types";
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

export async function setPasswordFromInviteAction(token: string, password: string) {
  const invite = await getInviteByToken(token);
  const account = await setPasswordFromInvite(token, password);
  return {
    ok: true,
    email: account.email,
    clientId: account.clientId,
    onboardingId: invite?.onboardingId || null,
  };
}

export async function saveClientInfoAction(
  onboardingId: string,
  data: {
    name: string;
    email: string;
    company?: string;
    phone?: string;
    address?: string;
  },
) {
  const { actor, onboarding } = await ownedOnboarding(onboardingId);
  const parsed = z
    .object({
      name: z.string().min(1),
      email: z.string().email(),
      company: z.string().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
    })
    .parse(data);

  await updateClient(actor.clientId, {
    name: parsed.name,
    email: parsed.email.toLowerCase(),
    company: parsed.company || null,
    phone: parsed.phone || null,
    address: parsed.address || null,
  });

  if (onboarding.status !== "completed") {
    await advanceStep(onboarding.id, "info");
  }

  await auditImpersonation(actor, "save_client_info", onboardingId);
  revalidatePath(`/portal/projects/${onboardingId}/onboarding`);
  revalidatePath("/portal");
  return { ok: true };
}

export async function saveQuestionnaireAction(
  onboardingId: string,
  data: {
    core: Partial<Record<CoreAnswerKey, string>>;
    answers: { questionId: string; value: unknown }[];
  },
) {
  const { actor, onboarding } = await ownedOnboarding(onboardingId);
  if (onboarding.status === "completed") throw new Error("Onboarding already completed");

  const core: Partial<Record<CoreAnswerKey, string>> = {};
  for (const key of CORE_ANSWER_KEYS) {
    if (data.core[key] !== undefined) core[key] = data.core[key];
  }
  await saveCoreAnswers(onboarding.id, core);

  for (const a of data.answers) {
    await upsertAnswer({
      onboardingId: onboarding.id,
      questionId: a.questionId,
      value: a.value,
    });
  }

  await advanceStep(onboarding.id, "questionnaire");
  await auditImpersonation(actor, "save_questionnaire", onboardingId);
  revalidatePath(`/portal/projects/${onboardingId}/onboarding`);
  return { ok: true };
}

export async function uploadQuestionnaireFileAction(
  onboardingId: string,
  questionId: string,
  formData: FormData,
) {
  const { actor } = await ownedOnboarding(onboardingId);
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("No file");
  if (file.size > 10 * 1024 * 1024) throw new Error("File must be under 10MB");
  const allowed = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ];
  if (!allowed.includes(file.type)) {
    throw new Error("Only PDF and images are allowed");
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop() || "bin";
  const path = `onboarding/${onboardingId}/${questionId}-${randomBytes(6).toString("hex")}.${ext}`;
  const url = await storeFile(path, buf, file.type);

  await upsertAnswer({
    onboardingId,
    questionId,
    value: { url, filename: file.name, contentType: file.type },
  });

  await auditImpersonation(actor, "upload_file", onboardingId);
  revalidatePath(`/portal/projects/${onboardingId}/onboarding`);
  return { ok: true, url, filename: file.name };
}

export async function advanceOnboardingAction(
  onboardingId: string,
  fromStep: OnboardingStep,
) {
  const { actor, onboarding } = await ownedOnboarding(onboardingId);
  if (onboarding.status === "completed") throw new Error("Already completed");

  if (fromStep === "welcome") {
    if (onboarding.status === "sent" || onboarding.status === "draft") {
      await updateOnboarding(onboarding.id, { status: "in_progress" });
    }
  }

  if (fromStep === "handoff") {
    await completeOnboarding(onboarding.id);
    await auditImpersonation(actor, "complete_onboarding", onboardingId);
    revalidatePath("/portal");
    revalidatePath(`/portal/projects/${onboardingId}`);
    return { ok: true, completed: true };
  }

  await advanceStep(onboarding.id, fromStep);
  await auditImpersonation(actor, "advance_step", onboardingId);
  revalidatePath(`/portal/projects/${onboardingId}/onboarding`);
  return { ok: true };
}

export async function completeHandoffAction(onboardingId: string) {
  const { actor } = await ownedOnboarding(onboardingId);
  await completeOnboarding(onboardingId);
  await auditImpersonation(actor, "complete_onboarding", onboardingId);
  revalidatePath("/portal");
  revalidatePath(`/portal/projects/${onboardingId}`);
  return { ok: true };
}

export async function changePasswordAction(currentPassword: string, newPassword: string) {
  const session = await requireClient();
  if (session.impersonating) throw new Error("Cannot change password while viewing as client");
  await changeClientPassword(session.user.clientId!, currentPassword, newPassword);
  return { ok: true };
}

export async function sendPortalMessageAction(
  onboardingId: string,
  data: { subject: string; body: string },
) {
  const { actor, onboarding } = await ownedOnboarding(onboardingId);
  const client = await getClient(actor.clientId);
  if (!client) throw new Error("Client not found");

  const parsed = z
    .object({
      subject: z.string().min(1),
      body: z.string().min(1),
    })
    .parse(data);

  const emailSettings = await getSetting<{ fromEmail?: string }>("email");
  const to =
    emailSettings?.fromEmail ||
    process.env.RESEND_FROM_EMAIL ||
    process.env.ADMIN_EMAIL;
  if (!to) throw new Error("No admin inbox email configured");

  await sendEmail({
    to: [to],
    subject: `[Portal] ${onboarding.projectName || "Project"}: ${parsed.subject}`,
    text: `From: ${client.name} <${client.email}>\nProject: ${onboarding.projectName}\n\n${parsed.body}`,
    html: `<p><strong>From:</strong> ${client.name} &lt;${client.email}&gt;</p><p><strong>Project:</strong> ${onboarding.projectName}</p><p>${parsed.body.replace(/\n/g, "<br/>")}</p>`,
    clientId: actor.clientId,
  });

  await auditImpersonation(actor, "portal_message", onboardingId);
  return { ok: true };
}

export async function getPortalClientAction() {
  const actor = await requirePortalActor();
  return getClient(actor.clientId);
}
