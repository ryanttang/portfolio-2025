import { and, asc, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  contracts,
  invoices,
  onboardingAnswers,
  onboardingQuestions,
  onboardings,
  portalMilestones,
  portalUpdates,
  questionTemplateItems,
  questionTemplates,
} from "@/db/schema";
import { addActivity, updateClient } from "@/lib/crm/clients";
import { logAudit } from "@/lib/audit";
import {
  CORE_ANSWER_KEYS,
  type CoreAnswerKey,
  type OnboardingStep,
  type QuestionInput,
  type QuestionType,
} from "@/lib/onboarding/types";

export async function listOnboardings() {
  return db.select().from(onboardings).orderBy(desc(onboardings.updatedAt));
}

export async function getOnboarding(id: string) {
  const [row] = await db.select().from(onboardings).where(eq(onboardings.id, id)).limit(1);
  return row || null;
}

export async function getActiveOnboardingForClient(clientId: string) {
  const [row] = await db
    .select()
    .from(onboardings)
    .where(
      and(
        eq(onboardings.clientId, clientId),
        inArray(onboardings.status, ["draft", "sent", "in_progress", "completed"]),
      ),
    )
    .orderBy(desc(onboardings.updatedAt))
    .limit(1);
  if (!row || row.status === "cancelled") return null;
  // Prefer non-cancelled; if completed exists alongside newer cancelled we already filtered
  if (row.status === "completed") {
    const [active] = await db
      .select()
      .from(onboardings)
      .where(
        and(
          eq(onboardings.clientId, clientId),
          inArray(onboardings.status, ["draft", "sent", "in_progress"]),
        ),
      )
      .orderBy(desc(onboardings.updatedAt))
      .limit(1);
    return active || row;
  }
  return row;
}

export async function createOnboarding(clientId: string, projectName = "") {
  const existing = await getActiveOnboardingForClient(clientId);
  if (existing && existing.status !== "completed") {
    throw new Error("Client already has an active onboarding");
  }

  const [row] = await db
    .insert(onboardings)
    .values({
      clientId,
      projectName: projectName || "New project",
      status: "draft",
      currentStep: "welcome",
    })
    .returning();

  await addActivity(clientId, "onboarding", `Onboarding created: ${row.projectName}`, row.id);
  await logAudit("create", "onboarding", row.id, { clientId });
  return row;
}

export async function updateOnboarding(
  id: string,
  data: Partial<{
    projectName: string;
    welcomeMessage: string;
    services: { id: string; label: string; group: string; price?: string }[];
    contractEnabled: boolean;
    contractId: string | null;
    depositEnabled: boolean;
    invoiceId: string | null;
    status: string;
    currentStep: string;
    completedAt: Date | null;
  }>,
) {
  const [row] = await db
    .update(onboardings)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(onboardings.id, id))
    .returning();
  return row;
}

export async function cancelOnboarding(id: string) {
  const row = await updateOnboarding(id, { status: "cancelled" });
  if (row) {
    await addActivity(row.clientId, "onboarding", "Onboarding cancelled", row.id);
  }
  return row;
}

export function getEnabledSteps(onboarding: {
  contractEnabled: boolean;
  depositEnabled: boolean;
}): OnboardingStep[] {
  const steps: OnboardingStep[] = ["welcome", "info", "questionnaire"];
  if (onboarding.contractEnabled) steps.push("contract");
  if (onboarding.depositEnabled) steps.push("deposit");
  steps.push("handoff");
  return steps;
}

export function getNextStep(
  onboarding: { contractEnabled: boolean; depositEnabled: boolean },
  current: OnboardingStep,
): OnboardingStep | null {
  const steps = getEnabledSteps(onboarding);
  const idx = steps.indexOf(current);
  if (idx < 0 || idx >= steps.length - 1) return null;
  return steps[idx + 1];
}

export async function listOnboardingQuestions(onboardingId: string) {
  return db
    .select()
    .from(onboardingQuestions)
    .where(eq(onboardingQuestions.onboardingId, onboardingId))
    .orderBy(asc(onboardingQuestions.sortOrder));
}

export async function replaceOnboardingQuestions(
  onboardingId: string,
  questions: QuestionInput[],
) {
  await db
    .delete(onboardingQuestions)
    .where(eq(onboardingQuestions.onboardingId, onboardingId));

  if (questions.length === 0) return [];

  return db
    .insert(onboardingQuestions)
    .values(
      questions.map((q, i) => ({
        onboardingId,
        sortOrder: i,
        label: q.label,
        helpText: q.helpText ?? null,
        type: q.type,
        options: q.options || [],
        required: q.required ?? true,
      })),
    )
    .returning();
}

export async function addOnboardingQuestion(
  onboardingId: string,
  question: QuestionInput,
) {
  const [last] = await db
    .select({ sortOrder: onboardingQuestions.sortOrder })
    .from(onboardingQuestions)
    .where(eq(onboardingQuestions.onboardingId, onboardingId))
    .orderBy(desc(onboardingQuestions.sortOrder))
    .limit(1);

  const [row] = await db
    .insert(onboardingQuestions)
    .values({
      onboardingId,
      sortOrder: (last?.sortOrder ?? -1) + 1,
      label: question.label,
      helpText: question.helpText ?? null,
      type: question.type,
      options: question.options || [],
      required: question.required ?? true,
    })
    .returning();
  return row;
}

export async function updateOnboardingQuestion(
  id: string,
  data: Partial<{
    label: string;
    helpText: string | null;
    type: QuestionType;
    options: string[];
    required: boolean;
    sortOrder: number;
  }>,
) {
  const [row] = await db
    .update(onboardingQuestions)
    .set(data)
    .where(eq(onboardingQuestions.id, id))
    .returning();
  return row;
}

export async function deleteOnboardingQuestion(id: string) {
  await db.delete(onboardingQuestions).where(eq(onboardingQuestions.id, id));
}

export async function listAnswers(onboardingId: string) {
  return db
    .select()
    .from(onboardingAnswers)
    .where(eq(onboardingAnswers.onboardingId, onboardingId));
}

export async function upsertAnswer(opts: {
  onboardingId: string;
  questionId?: string | null;
  key?: string | null;
  value: unknown;
}) {
  if (!opts.questionId && !opts.key) {
    throw new Error("questionId or key required");
  }

  if (opts.questionId) {
    const [existing] = await db
      .select()
      .from(onboardingAnswers)
      .where(
        and(
          eq(onboardingAnswers.onboardingId, opts.onboardingId),
          eq(onboardingAnswers.questionId, opts.questionId),
        ),
      )
      .limit(1);

    if (existing) {
      const [row] = await db
        .update(onboardingAnswers)
        .set({ value: opts.value as object, updatedAt: new Date() })
        .where(eq(onboardingAnswers.id, existing.id))
        .returning();
      return row;
    }

    const [row] = await db
      .insert(onboardingAnswers)
      .values({
        onboardingId: opts.onboardingId,
        questionId: opts.questionId,
        key: null,
        value: opts.value as object,
      })
      .returning();
    return row;
  }

  const key = opts.key!;
  const [existing] = await db
    .select()
    .from(onboardingAnswers)
    .where(
      and(
        eq(onboardingAnswers.onboardingId, opts.onboardingId),
        eq(onboardingAnswers.key, key),
      ),
    )
    .limit(1);

  if (existing) {
    const [row] = await db
      .update(onboardingAnswers)
      .set({ value: opts.value as object, updatedAt: new Date() })
      .where(eq(onboardingAnswers.id, existing.id))
      .returning();
    return row;
  }

  const [row] = await db
    .insert(onboardingAnswers)
    .values({
      onboardingId: opts.onboardingId,
      questionId: null,
      key,
      value: opts.value as object,
    })
    .returning();
  return row;
}

export async function saveCoreAnswers(
  onboardingId: string,
  answers: Partial<Record<CoreAnswerKey, string>>,
) {
  for (const key of CORE_ANSWER_KEYS) {
    if (answers[key] !== undefined) {
      await upsertAnswer({
        onboardingId,
        key,
        value: { text: answers[key] },
      });
    }
  }
}

export async function listTemplates() {
  return db.select().from(questionTemplates).orderBy(desc(questionTemplates.updatedAt));
}

export async function getTemplate(id: string) {
  const [row] = await db
    .select()
    .from(questionTemplates)
    .where(eq(questionTemplates.id, id))
    .limit(1);
  return row || null;
}

export async function listTemplateItems(templateId: string) {
  return db
    .select()
    .from(questionTemplateItems)
    .where(eq(questionTemplateItems.templateId, templateId))
    .orderBy(asc(questionTemplateItems.sortOrder));
}

export async function createTemplate(name: string, description?: string | null) {
  const [row] = await db
    .insert(questionTemplates)
    .values({ name, description: description ?? null })
    .returning();
  return row;
}

export async function updateTemplate(
  id: string,
  data: Partial<{ name: string; description: string | null }>,
) {
  const [row] = await db
    .update(questionTemplates)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(questionTemplates.id, id))
    .returning();
  return row;
}

export async function deleteTemplate(id: string) {
  await db.delete(questionTemplates).where(eq(questionTemplates.id, id));
}

export async function replaceTemplateItems(templateId: string, questions: QuestionInput[]) {
  await db
    .delete(questionTemplateItems)
    .where(eq(questionTemplateItems.templateId, templateId));

  if (questions.length === 0) return [];

  return db
    .insert(questionTemplateItems)
    .values(
      questions.map((q, i) => ({
        templateId,
        sortOrder: i,
        label: q.label,
        helpText: q.helpText ?? null,
        type: q.type,
        options: q.options || [],
        required: q.required ?? true,
      })),
    )
    .returning();
}

export async function applyTemplateToOnboarding(onboardingId: string, templateId: string) {
  const items = await listTemplateItems(templateId);
  return replaceOnboardingQuestions(
    onboardingId,
    items.map((i) => ({
      label: i.label,
      helpText: i.helpText,
      type: i.type as QuestionType,
      options: i.options || [],
      required: i.required,
    })),
  );
}

export async function saveOnboardingQuestionsAsTemplate(
  onboardingId: string,
  name: string,
  description?: string | null,
) {
  const questions = await listOnboardingQuestions(onboardingId);
  const template = await createTemplate(name, description);
  await replaceTemplateItems(
    template.id,
    questions.map((q) => ({
      label: q.label,
      helpText: q.helpText,
      type: q.type as QuestionType,
      options: q.options || [],
      required: q.required,
    })),
  );
  return template;
}

export async function completeOnboarding(id: string) {
  const onboarding = await getOnboarding(id);
  if (!onboarding) throw new Error("Not found");

  const [row] = await db
    .update(onboardings)
    .set({
      status: "completed",
      currentStep: "handoff",
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(onboardings.id, id))
    .returning();

  await updateClient(onboarding.clientId, { status: "active" });
  await addActivity(onboarding.clientId, "onboarding", "Onboarding completed", id);
  await logAudit("complete", "onboarding", id);
  return row;
}

export async function advanceStep(id: string, fromStep: OnboardingStep) {
  const onboarding = await getOnboarding(id);
  if (!onboarding) throw new Error("Not found");

  const next = getNextStep(onboarding, fromStep);
  if (!next) return onboarding;

  const status =
    onboarding.status === "draft" || onboarding.status === "sent"
      ? "in_progress"
      : onboarding.status;

  return updateOnboarding(id, { currentStep: next, status });
}

export async function getOnboardingBundle(id: string) {
  const onboarding = await getOnboarding(id);
  if (!onboarding) return null;

  const [questions, answers, contract, invoice] = await Promise.all([
    listOnboardingQuestions(id),
    listAnswers(id),
    onboarding.contractId
      ? db
          .select()
          .from(contracts)
          .where(eq(contracts.id, onboarding.contractId))
          .limit(1)
          .then((r) => r[0] || null)
      : Promise.resolve(null),
    onboarding.invoiceId
      ? db
          .select()
          .from(invoices)
          .where(eq(invoices.id, onboarding.invoiceId))
          .limit(1)
          .then((r) => r[0] || null)
      : Promise.resolve(null),
  ]);

  return { onboarding, questions, answers, contract, invoice };
}

export async function listPortalUpdates(clientId: string) {
  return db
    .select()
    .from(portalUpdates)
    .where(eq(portalUpdates.clientId, clientId))
    .orderBy(desc(portalUpdates.createdAt));
}

export async function createPortalUpdate(data: {
  clientId: string;
  title: string;
  body: string;
  createdByAdminId?: string | null;
}) {
  const [row] = await db
    .insert(portalUpdates)
    .values({
      clientId: data.clientId,
      title: data.title,
      body: data.body,
      createdByAdminId: data.createdByAdminId ?? null,
    })
    .returning();
  await addActivity(data.clientId, "portal", `Update: ${row.title}`, row.id);
  return row;
}

export async function updatePortalUpdate(
  id: string,
  data: Partial<{ title: string; body: string }>,
) {
  const [row] = await db
    .update(portalUpdates)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(portalUpdates.id, id))
    .returning();
  return row;
}

export async function deletePortalUpdate(id: string) {
  await db.delete(portalUpdates).where(eq(portalUpdates.id, id));
}

export async function listPortalMilestones(clientId: string) {
  return db
    .select()
    .from(portalMilestones)
    .where(eq(portalMilestones.clientId, clientId))
    .orderBy(asc(portalMilestones.sortOrder), asc(portalMilestones.createdAt));
}

export async function createPortalMilestone(data: {
  clientId: string;
  title: string;
  description?: string | null;
  status?: string;
  dueAt?: Date | null;
}) {
  const [last] = await db
    .select({ sortOrder: portalMilestones.sortOrder })
    .from(portalMilestones)
    .where(eq(portalMilestones.clientId, data.clientId))
    .orderBy(desc(portalMilestones.sortOrder))
    .limit(1);

  const [row] = await db
    .insert(portalMilestones)
    .values({
      clientId: data.clientId,
      title: data.title,
      description: data.description ?? null,
      status: data.status || "upcoming",
      dueAt: data.dueAt ?? null,
      sortOrder: (last?.sortOrder ?? -1) + 1,
    })
    .returning();
  await addActivity(data.clientId, "portal", `Milestone: ${row.title}`, row.id);
  return row;
}

export async function updatePortalMilestone(
  id: string,
  data: Partial<{
    title: string;
    description: string | null;
    status: string;
    sortOrder: number;
    dueAt: Date | null;
  }>,
) {
  const [row] = await db
    .update(portalMilestones)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(portalMilestones.id, id))
    .returning();
  return row;
}

export async function deletePortalMilestone(id: string) {
  await db.delete(portalMilestones).where(eq(portalMilestones.id, id));
}

export async function countOnboardingsByStatus() {
  const rows = await db
    .select({
      status: onboardings.status,
      count: sql<number>`count(*)::int`,
    })
    .from(onboardings)
    .where(ne(onboardings.status, "cancelled"))
    .groupBy(onboardings.status);
  return rows;
}
