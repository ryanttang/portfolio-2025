import { and, desc, eq, isNull } from "drizzle-orm";
import { randomBytes } from "crypto";
import { hash, compare } from "bcryptjs";
import { db } from "@/db";
import { clientAccounts, clients, portalInvites, portalPasswordResets } from "@/db/schema";
import { getClient } from "@/lib/crm/clients";
import { getAppUrl } from "@/lib/env";
import { sendEmail } from "@/lib/email/send";
import { firstNameFrom } from "@/lib/email/merge";
import { addActivity } from "@/lib/crm/clients";
import { logAudit } from "@/lib/audit";
import { getOnboarding } from "@/lib/onboarding";
import { portalProjectPath } from "@/lib/onboarding/slug";

const INVITE_DAYS = 14;
const RESET_HOURS = 1;

export async function ensureClientAccount(clientId: string) {
  const client = await getClient(clientId);
  if (!client) throw new Error("Client not found");

  const [existing] = await db
    .select()
    .from(clientAccounts)
    .where(eq(clientAccounts.clientId, clientId))
    .limit(1);

  if (existing) {
    if (existing.email !== client.email.toLowerCase()) {
      const [updated] = await db
        .update(clientAccounts)
        .set({ email: client.email.toLowerCase(), updatedAt: new Date() })
        .where(eq(clientAccounts.id, existing.id))
        .returning();
      return updated;
    }
    return existing;
  }

  const [row] = await db
    .insert(clientAccounts)
    .values({
      clientId,
      email: client.email.toLowerCase(),
    })
    .returning();
  return row;
}

export async function getClientAccountByEmail(email: string) {
  const [row] = await db
    .select()
    .from(clientAccounts)
    .where(eq(clientAccounts.email, email.toLowerCase()))
    .limit(1);
  return row || null;
}

export async function getClientAccountByClientId(clientId: string) {
  const [row] = await db
    .select()
    .from(clientAccounts)
    .where(eq(clientAccounts.clientId, clientId))
    .limit(1);
  return row || null;
}

export async function createPortalInvite(clientId: string, onboardingId?: string | null) {
  await ensureClientAccount(clientId);
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_DAYS);

  const [invite] = await db
    .insert(portalInvites)
    .values({
      clientId,
      onboardingId: onboardingId || null,
      token,
      expiresAt,
    })
    .returning();

  return invite;
}

export async function getInviteByToken(token: string) {
  const [invite] = await db
    .select()
    .from(portalInvites)
    .where(eq(portalInvites.token, token))
    .limit(1);
  return invite || null;
}

export function isInviteValid(invite: {
  expiresAt: Date;
  usedAt: Date | null;
}) {
  if (invite.usedAt) return false;
  return invite.expiresAt.getTime() > Date.now();
}

export async function setPasswordFromInvite(token: string, password: string) {
  const invite = await getInviteByToken(token);
  if (!invite || !isInviteValid(invite)) {
    throw new Error("Invalid or expired invite");
  }
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  const account = await ensureClientAccount(invite.clientId);
  const passwordHash = await hash(password, 12);

  const [updated] = await db
    .update(clientAccounts)
    .set({
      passwordHash,
      passwordSetAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(clientAccounts.id, account.id))
    .returning();

  await db
    .update(portalInvites)
    .set({ usedAt: new Date() })
    .where(eq(portalInvites.id, invite.id));

  await addActivity(invite.clientId, "portal", "Portal password set");
  await logAudit("password_set", "client_account", updated.id, {
    clientId: invite.clientId,
  });

  return updated;
}

export async function consumeInviteForSignIn(token: string, email: string) {
  const invite = await getInviteByToken(token);
  if (!invite || !isInviteValid(invite)) return null;

  const account = await ensureClientAccount(invite.clientId);
  if (account.email !== email.toLowerCase() || !account.passwordHash) return null;

  await db
    .update(portalInvites)
    .set({ usedAt: new Date() })
    .where(eq(portalInvites.id, invite.id));

  await addActivity(invite.clientId, "portal", "Portal access link used");
  await logAudit("invite_used", "portal_invite", invite.id, {
    clientId: invite.clientId,
  });

  return account;
}

export async function consumeInviteToken(token: string) {
  const invite = await getInviteByToken(token);
  if (!invite || !isInviteValid(invite)) {
    throw new Error("Invalid or expired invite");
  }

  const account = await ensureClientAccount(invite.clientId);

  await db
    .update(portalInvites)
    .set({ usedAt: new Date() })
    .where(eq(portalInvites.id, invite.id));

  await addActivity(invite.clientId, "portal", "Portal access link used");
  await logAudit("invite_used", "portal_invite", invite.id, {
    clientId: invite.clientId,
  });

  return { invite, account };
}

export async function getInviteRedirectPath(invite: {
  onboardingId: string | null;
}) {
  if (!invite.onboardingId) return "/portal";

  const onboarding = await getOnboarding(invite.onboardingId);
  if (!onboarding) return "/portal";

  if (onboarding.status === "completed") {
    return `${portalProjectPath(onboarding)}?welcome=1`;
  }
  return portalProjectPath(onboarding, "onboarding");
}

export async function signInFromInviteToken(token: string) {
  const invite = await getInviteByToken(token);
  if (!invite || !isInviteValid(invite)) {
    throw new Error("Invalid or expired invite");
  }
  const account = await getClientAccountByClientId(invite.clientId);
  if (!account?.passwordHash) {
    throw new Error("Password not set");
  }
  const redirectTo = await getInviteRedirectPath(invite);
  return {
    email: account.email,
    clientId: account.clientId,
    redirectTo,
  };
}

export async function createPasswordReset(clientId: string) {
  await db
    .update(portalPasswordResets)
    .set({ usedAt: new Date() })
    .where(and(eq(portalPasswordResets.clientId, clientId), isNull(portalPasswordResets.usedAt)));

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + RESET_HOURS);

  const [row] = await db
    .insert(portalPasswordResets)
    .values({ clientId, token, expiresAt })
    .returning();

  return row;
}

export async function getPasswordResetByToken(token: string) {
  const [row] = await db
    .select()
    .from(portalPasswordResets)
    .where(eq(portalPasswordResets.token, token))
    .limit(1);
  return row || null;
}

export function isPasswordResetValid(reset: { expiresAt: Date; usedAt: Date | null }) {
  if (reset.usedAt) return false;
  return reset.expiresAt.getTime() > Date.now();
}

export async function sendPasswordResetEmail(email: string) {
  const account = await getClientAccountByEmail(email);
  if (!account?.passwordHash) {
    return { ok: true, sent: false };
  }

  const reset = await createPasswordReset(account.clientId);
  const client = await getClient(account.clientId);
  const url = `${getAppUrl()}/portal/reset-password/${reset.token}`;

  const { renderPortalPasswordResetEmail } = await import("@/lib/email/templates/transactional");
  const branded = await renderPortalPasswordResetEmail({
    clientName: client?.name || "there",
    resetUrl: url,
    expiresHours: RESET_HOURS,
  });

  await sendEmail({
    to: [email.toLowerCase()],
    subject: "Reset your portal password",
    clientId: account.clientId,
    text: branded.text,
    html: branded.html,
  });

  await addActivity(account.clientId, "portal", "Password reset requested", reset.id);
  return { ok: true, sent: true };
}

export async function resetPasswordFromToken(token: string, password: string) {
  const reset = await getPasswordResetByToken(token);
  if (!reset || !isPasswordResetValid(reset)) {
    throw new Error("Invalid or expired reset link");
  }
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  const account = await getClientAccountByClientId(reset.clientId);
  if (!account) throw new Error("Account not found");

  const passwordHash = await hash(password, 12);
  const [updated] = await db
    .update(clientAccounts)
    .set({
      passwordHash,
      passwordSetAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(clientAccounts.id, account.id))
    .returning();

  await db
    .update(portalPasswordResets)
    .set({ usedAt: new Date() })
    .where(eq(portalPasswordResets.id, reset.id));

  await addActivity(reset.clientId, "portal", "Password reset completed");
  await logAudit("password_reset", "client_account", updated.id, {
    clientId: reset.clientId,
  });

  return updated;
}

export async function verifyClientPassword(email: string, password: string) {
  const account = await getClientAccountByEmail(email);
  if (!account?.passwordHash) return null;
  const valid = await compare(password, account.passwordHash);
  if (!valid) return null;
  return account;
}

export async function sendPortalInviteEmail(
  clientId: string,
  context?: {
    projectName?: string;
    services?: string[];
    onboardingId?: string | null;
  },
) {
  const client = await getClient(clientId);
  if (!client?.email) throw new Error("Client has no email");

  const invite = await createPortalInvite(clientId, context?.onboardingId);
  const url = `${getAppUrl()}/portal/invite/${invite.token}`;

  const { renderPortalInviteEmail } = await import("@/lib/email/templates/transactional");
  const branded = await renderPortalInviteEmail({
    clientName: client.name,
    inviteUrl: url,
    projectName: context?.projectName,
    services: context?.services,
    expiresDays: INVITE_DAYS,
  });

  const firstName = firstNameFrom(client.name);
  const greeting = firstName ? `Hi ${firstName}!` : "Hi there!";
  const projectLabel = context?.projectName?.trim() || "your project";
  const subject = `${greeting} Here is your link to access your Client Portal for ${projectLabel}`;

  const result = await sendEmail({
    to: [client.email],
    subject,
    clientId,
    text: branded.text,
    html: branded.html,
  });

  await addActivity(clientId, "portal", "Portal invite sent", invite.id);
  await logAudit("invite_sent", "portal_invite", invite.id, {
    clientId,
    onboardingId: context?.onboardingId,
  });

  return { invite, url, result };
}

export async function changeClientPassword(
  clientId: string,
  currentPassword: string,
  newPassword: string,
) {
  const account = await getClientAccountByClientId(clientId);
  if (!account?.passwordHash) throw new Error("No password set");
  if (newPassword.length < 8) throw new Error("Password must be at least 8 characters");
  const valid = await compare(currentPassword, account.passwordHash);
  if (!valid) throw new Error("Current password is incorrect");
  const passwordHash = await hash(newPassword, 12);
  const [updated] = await db
    .update(clientAccounts)
    .set({
      passwordHash,
      passwordSetAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(clientAccounts.id, account.id))
    .returning();
  await logAudit("password_change", "client_account", updated.id, { clientId });
  return updated;
}

export async function listRecentInvites(clientId: string) {
  return db
    .select()
    .from(portalInvites)
    .where(eq(portalInvites.clientId, clientId))
    .orderBy(desc(portalInvites.createdAt))
    .limit(5);
}

export async function getLatestUnusedInvite(clientId: string, onboardingId?: string | null) {
  const conditions = [
    eq(portalInvites.clientId, clientId),
    isNull(portalInvites.usedAt),
  ];
  if (onboardingId) {
    conditions.push(eq(portalInvites.onboardingId, onboardingId));
  }
  const [invite] = await db
    .select()
    .from(portalInvites)
    .where(and(...conditions))
    .orderBy(desc(portalInvites.createdAt))
    .limit(1);
  if (!invite || !isInviteValid(invite)) return null;
  return invite;
}

export async function getClientWithAccount(clientId: string) {
  const [row] = await db
    .select({
      client: clients,
      account: clientAccounts,
    })
    .from(clients)
    .leftJoin(clientAccounts, eq(clientAccounts.clientId, clients.id))
    .where(eq(clients.id, clientId))
    .limit(1);
  return row || null;
}
