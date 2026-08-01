import { and, desc, eq, isNull } from "drizzle-orm";
import { randomBytes } from "crypto";
import { hash, compare } from "bcryptjs";
import { db } from "@/db";
import { clientAccounts, clients, portalInvites } from "@/db/schema";
import { getClient } from "@/lib/crm/clients";
import { getAppUrl } from "@/lib/env";
import { sendEmail } from "@/lib/email/send";
import { addActivity } from "@/lib/crm/clients";
import { logAudit } from "@/lib/audit";

const INVITE_DAYS = 14;

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

export async function createPortalInvite(clientId: string) {
  await ensureClientAccount(clientId);
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_DAYS);

  const [invite] = await db
    .insert(portalInvites)
    .values({ clientId, token, expiresAt })
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

export async function verifyClientPassword(email: string, password: string) {
  const account = await getClientAccountByEmail(email);
  if (!account?.passwordHash) return null;
  const valid = await compare(password, account.passwordHash);
  if (!valid) return null;
  return account;
}

export async function sendPortalInviteEmail(clientId: string) {
  const client = await getClient(clientId);
  if (!client?.email) throw new Error("Client has no email");

  const invite = await createPortalInvite(clientId);
  const url = `${getAppUrl()}/portal/invite/${invite.token}`;

  const result = await sendEmail({
    to: [client.email],
    subject: "Set up your client portal",
    clientId,
    text: `Hi ${client.name},\n\nYou're invited to your client portal. Use this link to set your password and get started:\n\n${url}\n\nThis link expires in ${INVITE_DAYS} days.\n\nThank you,\nRyan Tang`,
    html: `<p>Hi ${client.name},</p><p>You're invited to your client portal. Use this link to set your password and get started:</p><p><a href="${url}">${url}</a></p><p>This link expires in ${INVITE_DAYS} days.</p><p>Thank you,<br/>Ryan Tang</p>`,
  });

  await addActivity(clientId, "portal", "Portal invite sent", invite.id);
  await logAudit("invite_sent", "portal_invite", invite.id, { clientId });

  return { invite, url, result };
}

export async function listRecentInvites(clientId: string) {
  return db
    .select()
    .from(portalInvites)
    .where(eq(portalInvites.clientId, clientId))
    .orderBy(desc(portalInvites.createdAt))
    .limit(5);
}

export async function getLatestUnusedInvite(clientId: string) {
  const [invite] = await db
    .select()
    .from(portalInvites)
    .where(
      and(eq(portalInvites.clientId, clientId), isNull(portalInvites.usedAt)),
    )
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
