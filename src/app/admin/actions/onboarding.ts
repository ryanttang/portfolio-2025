"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/db";
import { contracts, invoices } from "@/db/schema";
import {
  addOnboardingQuestion,
  applyTemplateToOnboarding,
  cancelOnboarding,
  createOnboarding,
  createPortalMilestone,
  createPortalUpdate,
  createTemplate,
  deleteOnboardingQuestion,
  deletePortalMilestone,
  deletePortalUpdate,
  deleteTemplate,
  getOnboarding,
  listOnboardingQuestions,
  replaceTemplateItems,
  saveOnboardingQuestionsAsTemplate,
  updateOnboarding,
  updateOnboardingQuestion,
  updatePortalMilestone,
  updatePortalUpdate,
  updateTemplate,
  upsertAnswer,
} from "@/lib/onboarding";
import { sendPortalInviteEmail } from "@/lib/portal/auth";
import { QUESTION_TYPES, type QuestionInput } from "@/lib/onboarding/types";

function revalidateOnboarding(id: string, clientId?: string) {
  revalidatePath("/admin/onboarding");
  revalidatePath(`/admin/onboarding/${id}`);
  revalidatePath("/admin/onboarding/templates");
  if (clientId) revalidatePath(`/admin/crm/${clientId}`);
}

const questionSchema = z.object({
  label: z.string().min(1),
  helpText: z.string().optional().nullable(),
  type: z.enum(QUESTION_TYPES),
  options: z.array(z.string()).optional(),
  required: z.boolean().optional(),
});

export async function createOnboardingAction(clientId: string, projectName?: string) {
  await requireAdmin();
  const row = await createOnboarding(clientId, projectName);
  revalidateOnboarding(row.id, clientId);
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
  revalidateOnboarding(id, row.clientId);
  return { ok: true };
}

export async function sendOnboardingInviteAction(id: string) {
  await requireAdmin();
  const onboarding = await getOnboarding(id);
  if (!onboarding) throw new Error("Not found");

  const serviceLabels = (onboarding.services || []).map((s) => s.label);
  const { url, result } = await sendPortalInviteEmail(onboarding.clientId, {
    projectName: onboarding.projectName,
    services: serviceLabels,
  });

  if (onboarding.status === "draft") {
    await updateOnboarding(id, { status: "sent" });
  }

  revalidateOnboarding(id, onboarding.clientId);
  return { ok: true, url, error: result.error };
}

export async function cancelOnboardingAction(id: string) {
  await requireAdmin();
  const row = await cancelOnboarding(id);
  if (row) revalidateOnboarding(id, row.clientId);
  return { ok: true };
}

export async function addQuestionAction(onboardingId: string, question: QuestionInput) {
  await requireAdmin();
  const parsed = questionSchema.parse(question);
  await addOnboardingQuestion(onboardingId, parsed);
  const onboarding = await getOnboarding(onboardingId);
  revalidateOnboarding(onboardingId, onboarding?.clientId);
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
  revalidateOnboarding(onboardingId, onboarding?.clientId);
  return { ok: true };
}

export async function deleteQuestionAction(id: string, onboardingId: string) {
  await requireAdmin();
  await deleteOnboardingQuestion(id);
  const onboarding = await getOnboarding(onboardingId);
  revalidateOnboarding(onboardingId, onboarding?.clientId);
  return { ok: true };
}

export async function applyTemplateAction(onboardingId: string, templateId: string) {
  await requireAdmin();
  await applyTemplateToOnboarding(onboardingId, templateId);
  const onboarding = await getOnboarding(onboardingId);
  revalidateOnboarding(onboardingId, onboarding?.clientId);
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

export async function adminUpsertAnswerAction(opts: {
  onboardingId: string;
  questionId?: string | null;
  key?: string | null;
  value: unknown;
}) {
  await requireAdmin();
  await upsertAnswer(opts);
  const onboarding = await getOnboarding(opts.onboardingId);
  revalidateOnboarding(opts.onboardingId, onboarding?.clientId);
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

export async function createUpdateAction(clientId: string, title: string, body: string) {
  const session = await requireAdmin();
  await createPortalUpdate({
    clientId,
    title,
    body,
    createdByAdminId: session.user.id,
  });
  revalidatePath(`/admin/crm/${clientId}`);
  revalidatePath(`/admin/onboarding`);
  return { ok: true };
}

export async function updateUpdateAction(id: string, clientId: string, title: string, body: string) {
  await requireAdmin();
  await updatePortalUpdate(id, { title, body });
  revalidatePath(`/admin/crm/${clientId}`);
  return { ok: true };
}

export async function deleteUpdateAction(id: string, clientId: string) {
  await requireAdmin();
  await deletePortalUpdate(id);
  revalidatePath(`/admin/crm/${clientId}`);
  return { ok: true };
}

export async function createMilestoneAction(
  clientId: string,
  data: { title: string; description?: string; status?: string },
) {
  await requireAdmin();
  await createPortalMilestone({
    clientId,
    title: data.title,
    description: data.description,
    status: data.status,
  });
  revalidatePath(`/admin/crm/${clientId}`);
  return { ok: true };
}

export async function updateMilestoneAction(
  id: string,
  clientId: string,
  data: Partial<{ title: string; description: string | null; status: string }>,
) {
  await requireAdmin();
  await updatePortalMilestone(id, data);
  revalidatePath(`/admin/crm/${clientId}`);
  return { ok: true };
}

export async function deleteMilestoneAction(id: string, clientId: string) {
  await requireAdmin();
  await deletePortalMilestone(id);
  revalidatePath(`/admin/crm/${clientId}`);
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
