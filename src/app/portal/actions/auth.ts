"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getOnboarding } from "@/lib/onboarding";
import {
  getInviteByToken,
  getInviteRedirectPath,
  getPasswordResetByToken,
  isPasswordResetValid,
  resetPasswordFromToken,
  sendPasswordResetEmail,
  setPasswordFromInvite,
  signInFromInviteToken,
} from "@/lib/portal/auth";

export async function setPasswordFromInviteAction(token: string, password: string) {
  const invite = await getInviteByToken(token);
  const account = await setPasswordFromInvite(token, password);
  let redirectTo = "/portal";
  if (invite) {
    redirectTo = await getInviteRedirectPath(invite);
  }
  return {
    ok: true,
    email: account.email,
    clientId: account.clientId,
    onboardingId: invite?.onboardingId || null,
    redirectTo,
  };
}

export async function signInFromInviteAction(token: string) {
  const result = await signInFromInviteToken(token);
  return { ok: true, ...result };
}

export async function requestPasswordResetAction(email: string) {
  const parsed = z.string().email().parse(email);
  const { rateLimit } = await import("@/lib/rate-limit");
  const key = `portal-reset:${parsed.toLowerCase()}`;
  const { ok } = rateLimit(key, 3, 60 * 60 * 1000);
  if (!ok) {
    throw new Error("Too many reset requests. Please try again in an hour.");
  }
  await sendPasswordResetEmail(parsed);
  return { ok: true };
}

export async function resetPasswordAction(token: string, password: string) {
  const reset = await getPasswordResetByToken(token);
  if (!reset || !isPasswordResetValid(reset)) {
    throw new Error("Invalid or expired reset link");
  }
  const account = await resetPasswordFromToken(token, password);
  return { ok: true, email: account.email, redirectTo: "/portal" };
}

export async function dismissHubWelcomeAction(onboardingId: string) {
  const { requirePortalActor } = await import("@/lib/auth");
  const { getOnboardingForClient } = await import("@/lib/onboarding");
  const { db } = await import("@/db");
  const { onboardings } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");
  const { portalProjectPath } = await import("@/lib/onboarding/slug");

  const actor = await requirePortalActor();
  const onboarding = await getOnboardingForClient(actor.clientId, onboardingId);
  if (!onboarding) throw new Error("Not found");

  await db
    .update(onboardings)
    .set({ hubWelcomeSeenAt: new Date(), updatedAt: new Date() })
    .where(eq(onboardings.id, onboardingId));

  revalidatePath(portalProjectPath(onboarding));
  return { ok: true };
}

export async function resetHubWelcomeAction(onboardingId: string) {
  const { requireAdmin } = await import("@/lib/auth");
  const { db } = await import("@/db");
  const { onboardings } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");

  await requireAdmin();
  const onboarding = await getOnboarding(onboardingId);
  if (!onboarding) throw new Error("Not found");

  await db
    .update(onboardings)
    .set({ hubWelcomeSeenAt: null, updatedAt: new Date() })
    .where(eq(onboardings.id, onboardingId));

  return { ok: true };
}
