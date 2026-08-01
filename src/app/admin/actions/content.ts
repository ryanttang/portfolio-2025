"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { setContent, setSetting } from "@/lib/content";
import { logAudit } from "@/lib/audit";
import { z } from "zod";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return session;
}

export async function saveContentAction(key: string, payloadJson: string) {
  await requireAdmin();
  const payload = JSON.parse(payloadJson);
  await setContent(key, payload);
  await logAudit("update", "site_content", key);
  revalidatePath("/admin/content");
  revalidatePath("/");
  revalidatePath("/services");
  return { ok: true };
}

export async function saveSettingAction(key: string, valueJson: string) {
  await requireAdmin();
  const value = JSON.parse(valueJson);
  await setSetting(key, value);
  await logAudit("update", "site_settings", key);
  revalidatePath("/admin/settings");
  return { ok: true };
}

const clientSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  company: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  status: z.enum(["lead", "active", "past", "archived"]).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

function parseTags(raw: FormDataEntryValue | null): string[] | undefined {
  if (raw == null || raw === "") return undefined;
  return String(raw)
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export async function createClientAction(formData: FormData) {
  await requireAdmin();
  const { createClient } = await import("@/lib/crm/clients");
  const parsed = clientSchema.parse({
    name: formData.get("name"),
    email: formData.get("email"),
    company: formData.get("company") || undefined,
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined,
    status: (formData.get("status") as string) || "lead",
    notes: formData.get("notes") || undefined,
    tags: parseTags(formData.get("tags")),
  });
  const client = await createClient(parsed);
  revalidatePath("/admin/crm");
  return { ok: true, id: client.id };
}

export async function updateClientAction(id: string, formData: FormData) {
  await requireAdmin();
  const { updateClient } = await import("@/lib/crm/clients");
  const parsed = clientSchema
    .partial()
    .extend({ name: z.string().optional(), email: z.string().email().optional() })
    .parse({
      name: formData.get("name") || undefined,
      email: formData.get("email") || undefined,
      company: formData.get("company") || undefined,
      phone: formData.get("phone") || undefined,
      address: formData.get("address") || undefined,
      status: (formData.get("status") as string) || undefined,
      notes: formData.get("notes") || undefined,
      tags: parseTags(formData.get("tags")) ?? [],
    });
  await updateClient(id, parsed);
  revalidatePath("/admin/crm");
  revalidatePath(`/admin/crm/${id}`);
  return { ok: true };
}

export async function addClientNoteAction(clientId: string, body: string) {
  await requireAdmin();
  const { addNote } = await import("@/lib/crm/clients");
  await addNote(clientId, body);
  revalidatePath(`/admin/crm/${clientId}`);
  return { ok: true };
}

export async function sendInboxEmailAction(data: {
  to: string;
  cc?: string;
  subject: string;
  html: string;
  threadId?: string;
  inReplyTo?: string;
  clientId?: string | null;
  attachments?: {
    filename: string;
    contentBase64: string;
    contentType?: string;
    storageUrl?: string;
  }[];
}) {
  await requireAdmin();
  const { sendEmail } = await import("@/lib/email/send");
  const { findClientByEmail } = await import("@/lib/crm/clients");
  const { applyMergeFields, buildMergeContext } = await import("@/lib/email/merge");
  const { renderBrandedEmail, htmlToPlainText } = await import(
    "@/lib/email/templates/render"
  );
  const { sanitizeEmailHtml } = await import("@/lib/email/sanitize");

  const to = data.to.trim().toLowerCase();
  let clientId = data.clientId || null;
  let client = clientId
    ? await (await import("@/lib/crm/clients")).getClient(clientId)
    : null;
  if (!client) {
    client = await findClientByEmail(to);
    clientId = client?.id || null;
  }

  const mergeCtx = buildMergeContext(client);
  const subject = applyMergeFields(data.subject, mergeCtx);
  const bodyHtml = sanitizeEmailHtml(applyMergeFields(data.html, mergeCtx));
  const branded = await renderBrandedEmail({
    bodyHtml,
    preheader: subject,
  });

  const attachments = data.attachments?.map((a) => ({
    filename: a.filename,
    content: Buffer.from(a.contentBase64, "base64"),
    contentType: a.contentType,
    storageUrl: a.storageUrl,
  }));

  const result = await sendEmail({
    to: [to],
    cc: data.cc ? data.cc.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
    subject,
    html: branded.html,
    text: branded.text || htmlToPlainText(bodyHtml),
    threadId: data.threadId,
    inReplyTo: data.inReplyTo,
    clientId,
    attachments,
  });
  revalidatePath("/admin/inbox");
  if (clientId) revalidatePath(`/admin/crm/${clientId}`);
  if (result.error) return { ok: false, error: result.error };
  return { ok: true, threadId: result.threadId };
}

export async function previewBrandedEmailAction(
  bodyHtml: string,
  subject?: string,
  brandOverrides?: {
    fromName?: string;
    fromEmail?: string;
    headerTitle?: string;
    headerTagline?: string;
    headerBg?: string;
    accentColor?: string;
    logoUrl?: string;
    signatureHtml?: string;
    footerHtml?: string;
    showSiteInFooter?: boolean;
  },
) {
  await requireAdmin();
  const { renderBrandedEmail } = await import("@/lib/email/templates/render");
  const { sanitizeEmailHtml } = await import("@/lib/email/sanitize");
  try {
    const branded = await renderBrandedEmail({
      bodyHtml: sanitizeEmailHtml(bodyHtml),
      preheader: subject || undefined,
      brandOverrides,
    });
    return { ok: true as const, html: branded.html };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Preview failed",
    };
  }
}

export async function uploadEmailAttachmentAction(formData: FormData) {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false as const, error: "No file" };
  if (file.size > 10 * 1024 * 1024) {
    return { ok: false as const, error: "File too large (max 10MB)" };
  }
  const { storeFile } = await import("@/lib/storage");
  const { randomUUID } = await import("crypto");
  const buf = Buffer.from(await file.arrayBuffer());
  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const path = `email-attachments/${randomUUID()}-${safeName}`;
  const storageUrl = await storeFile(path, buf, file.type || "application/octet-stream");
  return {
    ok: true as const,
    filename: file.name,
    contentType: file.type || "application/octet-stream",
    contentBase64: buf.toString("base64"),
    storageUrl,
    size: file.size,
  };
}

export async function linkThreadClientAction(threadId: string, email: string) {
  await requireAdmin();
  const { ensureClientFromEmail } = await import("@/lib/crm/clients");
  const { db } = await import("@/db");
  const { emailThreads } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");
  const client = await ensureClientFromEmail(email);
  await db
    .update(emailThreads)
    .set({ clientId: client.id })
    .where(eq(emailThreads.id, threadId));
  revalidatePath("/admin/inbox");
  revalidatePath(`/admin/crm/${client.id}`);
  return { ok: true, clientId: client.id };
}

export async function markThreadReadAction(threadId: string) {
  await requireAdmin();
  const { markThreadRead } = await import("@/lib/email/threads");
  await markThreadRead(threadId);
  revalidatePath("/admin/inbox");
  return { ok: true };
}

const templateSchema = z.object({
  name: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  category: z.string().optional(),
  subject: z.string(),
  bodyHtml: z.string(),
});

export async function createEmailTemplateAction(data: z.infer<typeof templateSchema>) {
  await requireAdmin();
  const parsed = templateSchema.parse(data);
  const { createEmailTemplate } = await import("@/lib/email/templates");
  const row = await createEmailTemplate(parsed);
  await logAudit("create", "email_template", row.id);
  revalidatePath("/admin/inbox/templates");
  revalidatePath("/admin/inbox");
  return { ok: true, id: row.id };
}

export async function updateEmailTemplateAction(
  id: string,
  data: Partial<z.infer<typeof templateSchema>>,
) {
  await requireAdmin();
  const parsed = templateSchema.partial().parse(data);
  try {
    const { updateEmailTemplate } = await import("@/lib/email/templates");
    const row = await updateEmailTemplate(id, parsed);
    if (!row) return { ok: false, error: "Not found" };
    await logAudit("update", "email_template", id);
    revalidatePath("/admin/inbox/templates");
    revalidatePath("/admin/inbox");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Update failed" };
  }
}

export async function deleteEmailTemplateAction(id: string) {
  await requireAdmin();
  try {
    const { deleteEmailTemplate } = await import("@/lib/email/templates");
    await deleteEmailTemplate(id);
    await logAudit("delete", "email_template", id);
    revalidatePath("/admin/inbox/templates");
    revalidatePath("/admin/inbox");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Delete failed" };
  }
}

export async function duplicateEmailTemplateAction(id: string) {
  await requireAdmin();
  const { duplicateEmailTemplate } = await import("@/lib/email/templates");
  const row = await duplicateEmailTemplate(id);
  if (!row) return { ok: false, error: "Not found" };
  await logAudit("create", "email_template", row.id);
  revalidatePath("/admin/inbox/templates");
  revalidatePath("/admin/inbox");
  return { ok: true, id: row.id };
}
