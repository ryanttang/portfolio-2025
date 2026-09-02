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
import { addActivity, getClient, updateClient } from "@/lib/crm/clients";
import { listInvoicePayments } from "@/lib/invoices/payments";
import { logAudit } from "@/lib/audit";
import {
  CORE_ANSWER_KEYS,
  CORE_STARTER_QUESTIONS,
  type CoreAnswerKey,
  type OnboardingStep,
  type QuestionInput,
  type QuestionType,
  isLoginAnswerValue,
  loginAnswerIsEmpty,
  mergeLoginAnswers,
  normalizeLoginAnswer,
  questionIsSecret,
} from "@/lib/onboarding/types";
import {
  decryptJson,
  encryptJson,
  filenameFromValue,
  isEncryptedPayload,
} from "@/lib/crypto/sensitive";
import { isUuid, matchesLegacyOnboardingSlug, onboardingSlugBase } from "@/lib/onboarding/slug";

export { portalProjectPath } from "@/lib/onboarding/slug";

export async function listOnboardings() {
  return db.select().from(onboardings).orderBy(desc(onboardings.updatedAt));
}

export async function listOnboardingsForClient(clientId: string) {
  return db
    .select()
    .from(onboardings)
    .where(and(eq(onboardings.clientId, clientId), ne(onboardings.status, "cancelled")))
    .orderBy(desc(onboardings.updatedAt));
}

export async function getOnboarding(id: string) {
  const [row] = await db.select().from(onboardings).where(eq(onboardings.id, id)).limit(1);
  return row || null;
}

export async function getOnboardingForClient(clientId: string, idOrSlug: string) {
  if (isUuid(idOrSlug)) {
    const [row] = await db
      .select()
      .from(onboardings)
      .where(and(eq(onboardings.clientId, clientId), eq(onboardings.id, idOrSlug)))
      .limit(1);
    return row || null;
  }

  const [row] = await db
    .select()
    .from(onboardings)
    .where(and(eq(onboardings.clientId, clientId), eq(onboardings.slug, idOrSlug)))
    .limit(1);
  if (row) return row;

  const client = await getClient(clientId);
  if (!client) return null;

  const projects = await listOnboardingsForClient(clientId);
  for (const project of projects) {
    if (matchesLegacyOnboardingSlug(idOrSlug, project.projectName, client.name)) {
      return project;
    }
  }

  return null;
}

async function allocateUniqueSlug(projectName: string, excludeId?: string) {
  const base = onboardingSlugBase(projectName);
  let candidate = base;
  let n = 2;
  while (true) {
    const [existing] = await db
      .select({ id: onboardings.id })
      .from(onboardings)
      .where(
        excludeId
          ? and(eq(onboardings.slug, candidate), ne(onboardings.id, excludeId))
          : eq(onboardings.slug, candidate),
      )
      .limit(1);
    if (!existing) return candidate;
    candidate = `${base}-${n}`;
    n += 1;
  }
}

export async function refreshOnboardingSlug(id: string) {
  const row = await getOnboarding(id);
  if (!row) return null;
  const slug = await allocateUniqueSlug(row.projectName, id);
  if (slug === row.slug) return row;
  const [updated] = await db
    .update(onboardings)
    .set({ slug, updatedAt: new Date() })
    .where(eq(onboardings.id, id))
    .returning();
  return updated || row;
}

export async function refreshOnboardingSlugsForClient(clientId: string) {
  const rows = await db
    .select({ id: onboardings.id })
    .from(onboardings)
    .where(eq(onboardings.clientId, clientId));
  for (const row of rows) {
    await refreshOnboardingSlug(row.id);
  }
}

/** @deprecated Prefer listOnboardingsForClient / getOnboardingForClient for multi-project. */
export async function getActiveOnboardingForClient(clientId: string) {
  const [incomplete] = await db
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
  if (incomplete) return incomplete;

  const [completed] = await db
    .select()
    .from(onboardings)
    .where(and(eq(onboardings.clientId, clientId), eq(onboardings.status, "completed")))
    .orderBy(desc(onboardings.updatedAt))
    .limit(1);
  return completed || null;
}

export async function createOnboarding(clientId: string, projectName = "") {
  const name = projectName || "New project";
  const slug = await allocateUniqueSlug(name);

  const [row] = await db
    .insert(onboardings)
    .values({
      clientId,
      projectName: name,
      slug,
      status: "draft",
      currentStep: "welcome",
    })
    .returning();

  await addActivity(clientId, "onboarding", `Project created: ${row.projectName}`, row.id);
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
  const patch: typeof data & { slug?: string; updatedAt: Date } = {
    ...data,
    updatedAt: new Date(),
  };
  if (data.projectName !== undefined) {
    patch.slug = await allocateUniqueSlug(data.projectName, id);
  }
  const [row] = await db
    .update(onboardings)
    .set(patch)
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

export async function deleteOnboarding(id: string) {
  const row = await getOnboarding(id);
  if (!row) return null;
  await addActivity(
    row.clientId,
    "onboarding",
    `Project deleted: ${row.projectName || "Untitled"}`,
    row.id,
  );
  await db.delete(onboardings).where(eq(onboardings.id, id));
  await logAudit("delete", "onboarding", id, {
    clientId: row.clientId,
    projectName: row.projectName,
  });
  return row;
}

export function getEnabledSteps(onboarding: {
  contractEnabled: boolean;
  depositEnabled: boolean;
  hasQuestionnaire?: boolean;
}): OnboardingStep[] {
  const steps: OnboardingStep[] = ["welcome", "info"];
  if (onboarding.hasQuestionnaire) steps.push("questionnaire");
  if (onboarding.contractEnabled) steps.push("contract");
  if (onboarding.depositEnabled) steps.push("deposit");
  steps.push("handoff");
  return steps;
}

export function getNextStep(
  onboarding: {
    contractEnabled: boolean;
    depositEnabled: boolean;
    hasQuestionnaire?: boolean;
  },
  current: OnboardingStep,
): OnboardingStep | null {
  const steps = getEnabledSteps(onboarding);
  const idx = steps.indexOf(current);
  if (idx < 0 || idx >= steps.length - 1) return null;
  return steps[idx + 1];
}

export function getPreviousStep(
  onboarding: {
    contractEnabled: boolean;
    depositEnabled: boolean;
    hasQuestionnaire?: boolean;
  },
  current: OnboardingStep,
): OnboardingStep | null {
  const steps = getEnabledSteps(onboarding);
  const idx = steps.indexOf(current);
  if (idx <= 0) return null;
  return steps[idx - 1];
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
        key: q.key ?? null,
        sensitive: q.type === "login" ? true : (q.sensitive ?? false),
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
      key: question.key ?? null,
      sensitive: question.type === "login" ? true : (question.sensitive ?? false),
    })
    .returning();
  return row;
}

export async function addStarterOnboardingQuestions(onboardingId: string) {
  const existing = await listOnboardingQuestions(onboardingId);
  const usedKeys = new Set(
    existing.map((q) => q.key).filter((k): k is string => Boolean(k)),
  );
  const missing = CORE_STARTER_QUESTIONS.filter((q) => !usedKeys.has(q.key));
  if (missing.length === 0) return existing;

  const added = [];
  for (const question of missing) {
    added.push(
      await addOnboardingQuestion(onboardingId, {
        label: question.label,
        type: question.type,
        required: question.required,
        options: [],
        key: question.key,
      }),
    );
  }
  return added;
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
    key: string | null;
    sensitive: boolean;
  }>,
) {
  const [current] = await db
    .select({ type: onboardingQuestions.type })
    .from(onboardingQuestions)
    .where(eq(onboardingQuestions.id, id))
    .limit(1);
  const nextType = data.type ?? current?.type;
  const payload = nextType === "login" ? { ...data, sensitive: true } : data;

  const [row] = await db
    .update(onboardingQuestions)
    .set(payload)
    .where(eq(onboardingQuestions.id, id))
    .returning();
  if (row && (payload.sensitive === true || nextType === "login")) {
    await encryptExistingAnswersForQuestion(id);
  }
  return row;
}

export async function encryptExistingAnswersForQuestion(questionId: string) {
  const answers = await db
    .select()
    .from(onboardingAnswers)
    .where(eq(onboardingAnswers.questionId, questionId));
  for (const answer of answers) {
    if (isEncryptedPayload(answer.value)) continue;
    await db
      .update(onboardingAnswers)
      .set({
        value: encryptJson(answer.value, encryptionMeta(answer.value)),
        updatedAt: new Date(),
      })
      .where(eq(onboardingAnswers.id, answer.id));
  }
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

function encryptionMeta(value: unknown) {
  const filename = filenameFromValue(value);
  const loginEntryCount = isLoginAnswerValue(value)
    ? normalizeLoginAnswer(value).filter((e) => e.username.trim() || e.password).length
    : 0;
  return {
    filename,
    ...(loginEntryCount > 0 ? { loginEntryCount } : {}),
  };
}

function isEmptyAnswerValue(value: unknown) {
  if (!value || typeof value !== "object") return true;
  if (isLoginAnswerValue(value)) return loginAnswerIsEmpty(value);
  const v = value as { text?: string; selected?: string[] };
  if (typeof v.text === "string") return v.text.trim() === "";
  if (Array.isArray(v.selected)) return v.selected.length === 0;
  return false;
}

export function redactAnswerValue(value: unknown) {
  if (isEncryptedPayload(value)) {
    return {
      redacted: true as const,
      saved: true as const,
      ...(value.meta?.filename ? { filename: value.meta.filename } : {}),
      ...(value.meta?.loginEntryCount
        ? { loginEntryCount: value.meta.loginEntryCount }
        : {}),
    };
  }
  return value;
}

export function decryptAnswerValue(value: unknown) {
  if (isEncryptedPayload(value)) return decryptJson(value);
  return value;
}

async function valueForStorage(opts: {
  questionId?: string | null;
  value: unknown;
}) {
  if (isEncryptedPayload(opts.value)) return opts.value;
  if (!opts.questionId) return opts.value;
  const [question] = await db
    .select({
      sensitive: onboardingQuestions.sensitive,
      type: onboardingQuestions.type,
    })
    .from(onboardingQuestions)
    .where(eq(onboardingQuestions.id, opts.questionId))
    .limit(1);
  if (!question || !questionIsSecret(question)) return opts.value;
  return encryptJson(opts.value, encryptionMeta(opts.value));
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

    if (existing && isLoginAnswerValue(opts.value)) {
      opts = {
        ...opts,
        value: mergeLoginAnswers(opts.value, decryptAnswerValue(existing.value)),
      };
    }

    if (existing && isEmptyAnswerValue(opts.value) && isEncryptedPayload(existing.value)) {
      return existing;
    }

    const value = (await valueForStorage({
      questionId: opts.questionId,
      value: opts.value,
    })) as object;

    if (existing) {
      const [row] = await db
        .update(onboardingAnswers)
        .set({
          value,
          key: opts.key ?? existing.key,
          updatedAt: new Date(),
        })
        .where(eq(onboardingAnswers.id, existing.id))
        .returning();
      return row;
    }

    const [row] = await db
      .insert(onboardingAnswers)
      .values({
        onboardingId: opts.onboardingId,
        questionId: opts.questionId,
        key: opts.key || null,
        value,
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
        sensitive: q.type === "login" ? true : (q.sensitive ?? false),
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
      sensitive: i.sensitive,
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
      sensitive: q.sensitive,
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

  const questions = await listOnboardingQuestions(id);
  const next = getNextStep(
    { ...onboarding, hasQuestionnaire: questions.length > 0 },
    fromStep,
  );
  if (!next) return onboarding;

  const status =
    onboarding.status === "draft" || onboarding.status === "sent"
      ? "in_progress"
      : onboarding.status;

  return updateOnboarding(id, { currentStep: next, status });
}

export async function retreatStep(id: string, fromStep: OnboardingStep) {
  const onboarding = await getOnboarding(id);
  if (!onboarding) throw new Error("Not found");

  const questions = await listOnboardingQuestions(id);
  const prev = getPreviousStep(
    { ...onboarding, hasQuestionnaire: questions.length > 0 },
    fromStep,
  );
  if (!prev) return onboarding;

  return updateOnboarding(id, { currentStep: prev });
}

export async function getOnboardingBundle(id: string) {
  const onboarding = await getOnboarding(id);
  if (!onboarding) return null;

  const [questions, rawAnswers, contract, invoice, invoicePaymentsList] = await Promise.all([
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
    onboarding.invoiceId
      ? listInvoicePayments(onboarding.invoiceId)
      : Promise.resolve([]),
  ]);

  const answers = rawAnswers.map((answer) => {
    const question = questions.find((q) => q.id === answer.questionId);
    if ((question && questionIsSecret(question)) || isEncryptedPayload(answer.value)) {
      return { ...answer, value: redactAnswerValue(answer.value) };
    }
    return answer;
  });

  return { onboarding, questions, answers, contract, invoice, invoicePayments: invoicePaymentsList };
}

export async function getDecryptedAnswer(answerId: string) {
  const [answer] = await db
    .select()
    .from(onboardingAnswers)
    .where(eq(onboardingAnswers.id, answerId))
    .limit(1);
  if (!answer) return null;

  if (answer.questionId) {
    const [question] = await db
      .select({
        sensitive: onboardingQuestions.sensitive,
        type: onboardingQuestions.type,
      })
      .from(onboardingQuestions)
      .where(eq(onboardingQuestions.id, answer.questionId))
      .limit(1);
    if (question && questionIsSecret(question) && !isEncryptedPayload(answer.value)) {
      const encrypted = encryptJson(answer.value, encryptionMeta(answer.value));
      await db
        .update(onboardingAnswers)
        .set({ value: encrypted, updatedAt: new Date() })
        .where(eq(onboardingAnswers.id, answer.id));
      return { ...answer, value: answer.value };
    }
  }

  return { ...answer, value: decryptAnswerValue(answer.value) };
}

export async function listPortalUpdates(onboardingId: string) {
  return db
    .select()
    .from(portalUpdates)
    .where(eq(portalUpdates.onboardingId, onboardingId))
    .orderBy(desc(portalUpdates.createdAt));
}

export async function createPortalUpdate(data: {
  clientId: string;
  onboardingId: string;
  title: string;
  body: string;
  createdByAdminId?: string | null;
}) {
  const [row] = await db
    .insert(portalUpdates)
    .values({
      clientId: data.clientId,
      onboardingId: data.onboardingId,
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

export async function listPortalMilestones(onboardingId: string) {
  return db
    .select()
    .from(portalMilestones)
    .where(eq(portalMilestones.onboardingId, onboardingId))
    .orderBy(asc(portalMilestones.sortOrder), asc(portalMilestones.createdAt));
}

export async function createPortalMilestone(data: {
  clientId: string;
  onboardingId: string;
  title: string;
  description?: string | null;
  status?: string;
  dueAt?: Date | null;
}) {
  const [last] = await db
    .select({ sortOrder: portalMilestones.sortOrder })
    .from(portalMilestones)
    .where(eq(portalMilestones.onboardingId, data.onboardingId))
    .orderBy(desc(portalMilestones.sortOrder))
    .limit(1);

  const status = data.status || "upcoming";
  const [row] = await db
    .insert(portalMilestones)
    .values({
      clientId: data.clientId,
      onboardingId: data.onboardingId,
      title: data.title,
      description: data.description ?? null,
      status,
      dueAt: data.dueAt ?? null,
      completedAt: status === "done" ? new Date() : null,
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
    completedAt: Date | null;
  }>,
) {
  const patch: typeof data & { updatedAt: Date; completedAt?: Date | null } = {
    ...data,
    updatedAt: new Date(),
  };

  if (data.status !== undefined && data.completedAt === undefined) {
    if (data.status === "done") {
      const [existing] = await db
        .select({ status: portalMilestones.status, completedAt: portalMilestones.completedAt })
        .from(portalMilestones)
        .where(eq(portalMilestones.id, id))
        .limit(1);
      if (existing?.status !== "done" || !existing.completedAt) {
        patch.completedAt = new Date();
      }
    } else {
      patch.completedAt = null;
    }
  }

  const [row] = await db
    .update(portalMilestones)
    .set(patch)
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
