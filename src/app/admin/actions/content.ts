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
});

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
  });
  const client = await createClient(parsed);
  revalidatePath("/admin/crm");
  return { ok: true, id: client.id };
}

export async function updateClientAction(id: string, formData: FormData) {
  await requireAdmin();
  const { updateClient } = await import("@/lib/crm/clients");
  const parsed = clientSchema.partial().extend({ name: z.string().optional(), email: z.string().email().optional() }).parse({
    name: formData.get("name") || undefined,
    email: formData.get("email") || undefined,
    company: formData.get("company") || undefined,
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined,
    status: (formData.get("status") as string) || undefined,
    notes: formData.get("notes") || undefined,
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
  body: string;
  threadId?: string;
  inReplyTo?: string;
}) {
  await requireAdmin();
  const { sendEmail } = await import("@/lib/email/send");
  const result = await sendEmail({
    to: [data.to],
    cc: data.cc ? data.cc.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
    subject: data.subject,
    text: data.body,
    threadId: data.threadId,
    inReplyTo: data.inReplyTo,
  });
  revalidatePath("/admin/inbox");
  if (result.error) return { ok: false, error: result.error };
  return { ok: true, threadId: result.threadId };
}

export async function markThreadReadAction(threadId: string) {
  await requireAdmin();
  const { markThreadRead } = await import("@/lib/email/threads");
  await markThreadRead(threadId);
  revalidatePath("/admin/inbox");
  return { ok: true };
}
