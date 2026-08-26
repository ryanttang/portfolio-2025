"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/db";
import { contracts, invoices, portalMilestones } from "@/db/schema";
import {
  addOnboardingQuestion,
  addStarterOnboardingQuestions,
  applyTemplateToOnboarding,
  cancelOnboarding,
  createOnboarding,
  createPortalMilestone,
  createPortalUpdate,
  createTemplate,
  deleteOnboarding,
  deleteOnboardingQuestion,
  deletePortalMilestone,
  deletePortalUpdate,
  deleteTemplate,
  getOnboarding,
  listAnswers,
  listOnboardingQuestions,
  portalProjectPath,
  refreshOnboardingSlug,
  replaceTemplateItems,
  saveOnboardingQuestionsAsTemplate,
  getDecryptedAnswer,
  updateOnboarding,
  updateOnboardingQuestion,
  updatePortalMilestone,
  updatePortalUpdate,
  updateTemplate,
  upsertAnswer,
} from "@/lib/onboarding";
import { ensureClientAccount, sendPortalInviteEmail } from "@/lib/portal/auth";
import { setViewAsCookie, clearViewAsCookie, getViewAsPayload } from "@/lib/portal/view-as";
import { logAudit } from "@/lib/audit";
import { QUESTION_TYPES, CORE_ANSWER_KEYS, type QuestionInput } from "@/lib/onboarding/types";
import { redirect } from "next/navigation";

async function revalidateOnboarding(id: string, clientId?: string, slug?: string) {
  revalidatePath("/admin/onboarding");
  revalidatePath(`/admin/onboarding/${id}`);
  revalidatePath("/admin/onboarding/templates");
  let resolvedSlug = slug;
  let resolvedClientId = clientId;
  if (!resolvedSlug || !resolvedClientId) {
    const row = await getOnboarding(id);
    resolvedSlug = resolvedSlug || row?.slug;
    resolvedClientId = resolvedClientId || row?.clientId;
  }
  if (resolvedSlug) {
    revalidatePath(portalProjectPath({ slug: resolvedSlug }));
    revalidatePath(portalProjectPath({ slug: resolvedSlug }, "onboarding"));
  }
  if (resolvedClientId) revalidatePath(`/admin/crm/${resolvedClientId}`);
}

const questionSchema = z.object({
  label: z.string().min(1),
  helpText: z.string().optional().nullable(),
  type: z.enum(QUESTION_TYPES),
  options: z.array(z.string()).optional(),
  required: z.boolean().optional(),
  key: z.enum(CORE_ANSWER_KEYS).optional().nullable(),
  sensitive: z.boolean().optional(),
});

export async function createOnboardingAction(clientId: string, projectName?: string) {
  await requireAdmin();
  const row = await createOnboarding(clientId, projectName);
  await revalidateOnboarding(row.id, clientId, row.slug);
  return { ok: true, id: row.id };
}

const serviceSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  group: z.string().min(1),
  price: z.string().optional(),
});

export async function updateOnboardingAction(
  id: string,
  data: {
    projectName?: string;
    welcomeMessage?: string;
    services?: { id: string; label: string; group: string; price?: string }[];
    contractEnabled?: boolean;
    contractId?: string | null;
    depositEnabled?: boolean;
    invoiceId?: string | null;
  },
) {
  await requireAdmin();
  const parsed = {
    ...data,
    services: data.services ? z.array(serviceSchema).parse(data.services) : undefined,
  };
  const row = await updateOnboarding(id, parsed);
  if (!row) throw new Error("Not found");
  await revalidateOnboarding(id, row.clientId, row.slug);
  return { ok: true };
}

/** Prefill / update CRM contact fields shown on the client info wizard step. */
export async function updateOnboardingClientInfoAction(
  onboardingId: string,
  data: {
    name: string;
    email: string;
    company?: string;
    phone?: string;
    address?: string;
  },
) {
  await requireAdmin();
  const onboarding = await getOnboarding(onboardingId);
  if (!onboarding) throw new Error("Not found");

  const parsed = z
    .object({
      name: z.string().min(1),
      email: z.string().email(),
      company: z.string().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
    })
    .parse(data);

  const { updateClient } = await import("@/lib/crm/clients");
  await updateClient(onboarding.clientId, {
    name: parsed.name,
    email: parsed.email,
    company: parsed.company?.trim() ? parsed.company.trim() : null,
    phone: parsed.phone?.trim() ? parsed.phone.trim() : null,
    address: parsed.address?.trim() ? parsed.address.trim() : null,
  });

  const refreshed = await refreshOnboardingSlug(onboardingId);
  await revalidateOnboarding(onboardingId, onboarding.clientId, (refreshed || onboarding).slug);
  return { ok: true };
}

export async function sendOnboardingInviteAction(id: string) {
  await requireAdmin();
  const onboarding = await getOnboarding(id);
  if (!onboarding) throw new Error("Not found");

  const serviceLabels = (onboarding.services || []).map((s) =>
    s.price ? `${s.label} (${s.price})` : s.label,
  );
  const { url, result } = await sendPortalInviteEmail(onboarding.clientId, {
    projectName: onboarding.projectName,
    services: serviceLabels,
    onboardingId: onboarding.id,
  });

  if (onboarding.status === "draft") {
    await updateOnboarding(id, { status: "sent" });
  }

  await revalidateOnboarding(id, onboarding.clientId);
  return { ok: true, url, error: result.error };
}

export async function cancelOnboardingAction(id: string) {
  await requireAdmin();
  const row = await cancelOnboarding(id);
  if (row) await revalidateOnboarding(id, row.clientId);
  return { ok: true };
}

export async function deleteOnboardingAction(id: string) {
  await requireAdmin();
  try {
    const row = await deleteOnboarding(id);
    if (!row) return { ok: false as const, error: "Project not found" };
    revalidatePath("/admin/onboarding");
    revalidatePath("/admin/portal");
    if (row.clientId) revalidatePath(`/admin/crm/${row.clientId}`);
    if (row.slug) {
      revalidatePath(portalProjectPath({ slug: row.slug }));
      revalidatePath(portalProjectPath({ slug: row.slug }, "onboarding"));
    }
    return { ok: true as const };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Delete failed",
    };
  }
}

export async function addStarterQuestionsAction(onboardingId: string) {
  await requireAdmin();
  await addStarterOnboardingQuestions(onboardingId);
  const onboarding = await getOnboarding(onboardingId);
  await revalidateOnboarding(onboardingId, onboarding?.clientId);
  return { ok: true };
}

export async function addQuestionAction(onboardingId: string, question: QuestionInput) {
  await requireAdmin();
  const parsed = questionSchema.parse(question);
  await addOnboardingQuestion(onboardingId, parsed);
  const onboarding = await getOnboarding(onboardingId);
  await revalidateOnboarding(onboardingId, onboarding?.clientId);
  return { ok: true };
}

export async function updateQuestionAction(
  id: string,
  onboardingId: string,
  data: Partial<QuestionInput> & { sortOrder?: number },
) {
  await requireAdmin();
  await updateOnboardingQuestion(id, data);
  const onboarding = await getOnboarding(onboardingId);
  await revalidateOnboarding(onboardingId, onboarding?.clientId);
  return { ok: true };
}

export async function deleteQuestionAction(id: string, onboardingId: string) {
  await requireAdmin();
  await deleteOnboardingQuestion(id);
  const onboarding = await getOnboarding(onboardingId);
  await revalidateOnboarding(onboardingId, onboarding?.clientId);
  return { ok: true };
}

export async function applyTemplateAction(onboardingId: string, templateId: string) {
  await requireAdmin();
  const answers = await listAnswers(onboardingId);
  if (answers.some((a) => a.questionId)) {
    throw new Error("Cannot apply template after custom answers exist — clear answers first");
  }
  await applyTemplateToOnboarding(onboardingId, templateId);
  const onboarding = await getOnboarding(onboardingId);
  await revalidateOnboarding(onboardingId, onboarding?.clientId);
  return { ok: true };
}

export async function saveAsTemplateAction(
  onboardingId: string,
  name: string,
  description?: string,
) {
  await requireAdmin();
  const template = await saveOnboardingQuestionsAsTemplate(onboardingId, name, description);
  revalidatePath("/admin/onboarding/templates");
  return { ok: true, id: template.id };
}

export async function revealSensitiveAnswerAction(answerId: string) {
  await requireAdmin();
  const answer = await getDecryptedAnswer(answerId);
  if (!answer) throw new Error("Not found");
  return { ok: true as const, value: answer.value };
}

export async function adminUpsertAnswerAction(opts: {
  onboardingId: string;
  questionId?: string | null;
  key?: string | null;
  value: unknown;
}) {
  await requireAdmin();
  await upsertAnswer(opts);
  const onboarding = await getOnboarding(opts.onboardingId);
  await revalidateOnboarding(opts.onboardingId, onboarding?.clientId);
  return { ok: true };
}

export async function createTemplateAction(name: string, description?: string) {
  await requireAdmin();
  const row = await createTemplate(name, description);
  revalidatePath("/admin/onboarding/templates");
  return { ok: true, id: row.id };
}

export async function updateTemplateAction(
  id: string,
  data: { name?: string; description?: string | null },
) {
  await requireAdmin();
  await updateTemplate(id, data);
  revalidatePath("/admin/onboarding/templates");
  revalidatePath(`/admin/onboarding/templates/${id}`);
  return { ok: true };
}

export async function deleteTemplateAction(id: string) {
  await requireAdmin();
  await deleteTemplate(id);
  revalidatePath("/admin/onboarding/templates");
  return { ok: true };
}

export async function saveTemplateItemsAction(templateId: string, questions: QuestionInput[]) {
  await requireAdmin();
  const parsed = z.array(questionSchema).parse(questions);
  await replaceTemplateItems(templateId, parsed);
  revalidatePath(`/admin/onboarding/templates/${templateId}`);
  revalidatePath("/admin/onboarding/templates");
  return { ok: true };
}

export async function createUpdateAction(
  clientId: string,
  onboardingId: string,
  title: string,
  body: string,
) {
  const session = await requireAdmin();
  await createPortalUpdate({
    clientId,
    onboardingId,
    title,
    body,
    createdByAdminId: session.user.id,
  });
  await revalidateOnboarding(onboardingId, clientId);
  return { ok: true };
}

export async function updateUpdateAction(
  id: string,
  clientId: string,
  onboardingId: string,
  title: string,
  body: string,
) {
  await requireAdmin();
  await updatePortalUpdate(id, { title, body });
  await revalidateOnboarding(onboardingId, clientId);
  return { ok: true };
}

export async function deleteUpdateAction(id: string, clientId: string, onboardingId: string) {
  await requireAdmin();
  await deletePortalUpdate(id);
  await revalidateOnboarding(onboardingId, clientId);
  return { ok: true };
}

export async function createMilestoneAction(
  clientId: string,
  onboardingId: string,
  data: { title: string; description?: string; status?: string },
) {
  await requireAdmin();
  await createPortalMilestone({
    clientId,
    onboardingId,
    title: data.title,
    description: data.description,
    status: data.status,
  });
  await revalidateOnboarding(onboardingId, clientId);
  return { ok: true };
}

export async function updateMilestoneAction(
  id: string,
  clientId: string,
  onboardingId: string,
  data: Partial<{
    title: string;
    description: string | null;
    status: string;
    notifyClient?: boolean;
  }>,
) {
  await requireAdmin();
  const [existing] = await db
    .select()
    .from(portalMilestones)
    .where(eq(portalMilestones.id, id))
    .limit(1);
  const { notifyClient, ...patch } = data;
  const row = await updatePortalMilestone(id, patch);

  if (
    row &&
    patch.status &&
    existing &&
    existing.status !== patch.status &&
    notifyClient !== false
  ) {
    const { createPortalNotification } = await import("@/lib/portal/notifications");
    await createPortalNotification({
      clientId,
      onboardingId,
      type: "milestone",
      title: `Milestone updated: ${row.title}`,
      body: `Status is now ${patch.status.replace("_", " ")}.`,
      refType: "milestone",
      refId: row.id,
      sendEmail: true,
    });
  }

  await revalidateOnboarding(onboardingId, clientId);
  return { ok: true };
}

export async function deleteMilestoneAction(
  id: string,
  clientId: string,
  onboardingId: string,
) {
  await requireAdmin();
  await deletePortalMilestone(id);
  await revalidateOnboarding(onboardingId, clientId);
  return { ok: true };
}

export async function previewPortalAction(formData: FormData) {
  const clientId = String(formData.get("clientId") || "");
  const onboardingId = String(formData.get("onboardingId") || "");
  const returnPath = String(formData.get("returnPath") || "");
  const previewHub = formData.get("previewHub") === "1";
  if (!clientId) throw new Error("Missing client");
  await startViewAsClientAction(clientId, {
    ...(onboardingId ? { onboardingId } : {}),
    ...(returnPath ? { returnPath } : {}),
    ...(previewHub ? { previewHub: true } : {}),
  });
}

export async function startViewAsClientAction(
  clientId: string,
  opts?: { onboardingId?: string; returnPath?: string; previewHub?: boolean },
) {
  const session = await requireAdmin();
  await ensureClientAccount(clientId);

  let redirectTo = "/portal";
  let returnOnboardingId: string | undefined;

  if (opts?.onboardingId) {
    const onboarding = await getOnboarding(opts.onboardingId);
    if (!onboarding || onboarding.clientId !== clientId) {
      throw new Error("Project not found for this client");
    }
    returnOnboardingId = onboarding.id;
    if (opts.previewHub) {
      redirectTo = portalProjectPath(onboarding);
    } else if (onboarding.status === "completed") {
      redirectTo = portalProjectPath(onboarding);
    } else if (onboarding.status !== "cancelled") {
      redirectTo = portalProjectPath(onboarding, "onboarding");
    }
  }

  await setViewAsCookie(clientId, session.user.id, {
    returnOnboardingId,
    returnPath: opts?.returnPath,
  });
  await logAudit("view_as_start", "client", clientId, {
    adminId: session.user.id,
    onboardingId: returnOnboardingId || null,
  });
  redirect(redirectTo);
}

export async function stopViewAsClientAction(clientId?: string) {
  const session = await requireAdmin();
  const payload = await getViewAsPayload();
  await clearViewAsCookie();
  const cid = clientId || payload?.clientId || null;
  await logAudit("view_as_stop", "client", cid, { adminId: session.user.id });
  if (payload?.returnPath) {
    redirect(payload.returnPath);
  }
  if (payload?.returnOnboardingId) {
    redirect(`/admin/onboarding/${payload.returnOnboardingId}`);
  }
  redirect(cid ? `/admin/crm/${cid}` : "/admin/crm");
}

/** Reopen the portal wizard at welcome so you can demo intake again. */
export async function restartOnboardingWizardAction(onboardingId: string) {
  await requireAdmin();
  const onboarding = await getOnboarding(onboardingId);
  if (!onboarding) throw new Error("Project not found");
  await updateOnboarding(onboardingId, {
    currentStep: "welcome",
    status: onboarding.status === "cancelled" ? "draft" : "in_progress",
    completedAt: null,
  });
  await revalidateOnboarding(onboardingId, onboarding.clientId);
  return { ok: true };
}

export async function listClientContractsAction(clientId: string) {
  await requireAdmin();
  return db.select().from(contracts).where(eq(contracts.clientId, clientId));
}

export async function listClientInvoicesAction(clientId: string) {
  await requireAdmin();
  return db.select().from(invoices).where(eq(invoices.clientId, clientId));
}

export async function getOnboardingQuestionsAction(onboardingId: string) {
  await requireAdmin();
  return listOnboardingQuestions(onboardingId);
}
