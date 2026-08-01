"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireClient } from "@/lib/auth";
import { getClient, updateClient } from "@/lib/crm/clients";
import {
  advanceStep,
  completeOnboarding,
  getActiveOnboardingForClient,
  saveCoreAnswers,
  updateOnboarding,
  upsertAnswer,
} from "@/lib/onboarding";
import { setPasswordFromInvite } from "@/lib/portal/auth";
import type { CoreAnswerKey, OnboardingStep } from "@/lib/onboarding/types";
import { CORE_ANSWER_KEYS } from "@/lib/onboarding/types";

export async function setPasswordFromInviteAction(token: string, password: string) {
  const account = await setPasswordFromInvite(token, password);
  return { ok: true, email: account.email, clientId: account.clientId };
}

export async function saveClientInfoAction(data: {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  address?: string;
}) {
  const session = await requireClient();
  const clientId = session.user.clientId!;
  const parsed = z
    .object({
      name: z.string().min(1),
      email: z.string().email(),
      company: z.string().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
    })
    .parse(data);

  await updateClient(clientId, {
    name: parsed.name,
    email: parsed.email.toLowerCase(),
    company: parsed.company || null,
    phone: parsed.phone || null,
    address: parsed.address || null,
  });

  const onboarding = await getActiveOnboardingForClient(clientId);
  if (onboarding && onboarding.status !== "completed") {
    await advanceStep(onboarding.id, "info");
  }

  revalidatePath("/portal/onboarding");
  revalidatePath("/portal");
  return { ok: true };
}

export async function saveQuestionnaireAction(data: {
  core: Partial<Record<CoreAnswerKey, string>>;
  answers: { questionId: string; value: unknown }[];
}) {
  const session = await requireClient();
  const clientId = session.user.clientId!;
  const onboarding = await getActiveOnboardingForClient(clientId);
  if (!onboarding || onboarding.status === "completed") {
    throw new Error("No active onboarding");
  }

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
  revalidatePath("/portal/onboarding");
  return { ok: true };
}

export async function advanceOnboardingAction(fromStep: OnboardingStep) {
  const session = await requireClient();
  const clientId = session.user.clientId!;
  const onboarding = await getActiveOnboardingForClient(clientId);
  if (!onboarding || onboarding.status === "completed") {
    throw new Error("No active onboarding");
  }

  if (fromStep === "welcome") {
    if (onboarding.status === "sent" || onboarding.status === "draft") {
      await updateOnboarding(onboarding.id, { status: "in_progress" });
    }
  }

  if (fromStep === "handoff") {
    await completeOnboarding(onboarding.id);
    revalidatePath("/portal");
    revalidatePath("/portal/onboarding");
    return { ok: true, completed: true };
  }

  await advanceStep(onboarding.id, fromStep);
  revalidatePath("/portal/onboarding");
  return { ok: true };
}

export async function completeHandoffAction() {
  const session = await requireClient();
  const clientId = session.user.clientId!;
  const onboarding = await getActiveOnboardingForClient(clientId);
  if (!onboarding) throw new Error("No active onboarding");
  await completeOnboarding(onboarding.id);
  revalidatePath("/portal");
  revalidatePath("/portal/onboarding");
  return { ok: true };
}

export async function getPortalClientAction() {
  const session = await requireClient();
  return getClient(session.user.clientId!);
}
