"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { contractSignatures, contracts } from "@/db/schema";
import { addActivity, getClient } from "@/lib/crm/clients";
import { sendEmail } from "@/lib/email/send";
import { getAppUrl } from "@/lib/env";
import { logAudit } from "@/lib/audit";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
}

const schema = z.object({
  clientId: z.string().uuid(),
  title: z.string().min(1),
  bodyText: z.string().min(1),
  amountCents: z.number().int().optional().nullable(),
  paymentNotes: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function createContractAction(data: z.infer<typeof schema>) {
  await requireAdmin();
  const parsed = schema.parse(data);
  const token = randomBytes(24).toString("hex");
  const [row] = await db
    .insert(contracts)
    .values({
      clientId: parsed.clientId,
      title: parsed.title,
      bodyText: parsed.bodyText,
      amountCents: parsed.amountCents ?? null,
      paymentNotes: parsed.paymentNotes?.trim() || null,
      notes: parsed.notes ?? null,
      token,
      status: "draft",
    })
    .returning();
  await addActivity(parsed.clientId, "contract", `Created: ${row.title}`, row.id);
  await logAudit("create", "contract", row.id);
  revalidatePath("/admin/contracts");
  return { ok: true, id: row.id };
}

export async function updateContractAction(
  id: string,
  data: Partial<z.infer<typeof schema>> & { status?: string },
) {
  await requireAdmin();
  const [existing] = await db.select().from(contracts).where(eq(contracts.id, id)).limit(1);
  if (!existing) throw new Error("Not found");

  const payload: Partial<z.infer<typeof schema>> & { status?: string; updatedAt: Date } = {
    ...data,
    updatedAt: new Date(),
  };
  if (!data.status && existing.status === "draft") {
    payload.status = "ready";
  }

  const [row] = await db
    .update(contracts)
    .set(payload)
    .where(eq(contracts.id, id))
    .returning();
  revalidatePath("/admin/contracts");
  revalidatePath(`/admin/contracts/${id}`);
  return { ok: true, contract: row };
}

export async function sendContractAction(id: string) {
  await requireAdmin();
  const [contract] = await db.select().from(contracts).where(eq(contracts.id, id)).limit(1);
  if (!contract) throw new Error("Not found");
  const client = await getClient(contract.clientId);
  if (!client?.email) throw new Error("Client has no email");

  const url = `${getAppUrl()}/sign/${contract.token}`;
  const { renderContractEmail } = await import("@/lib/email/templates/transactional");
  const branded = await renderContractEmail({
    clientName: client.name,
    title: contract.title,
    signUrl: url,
  });
  const result = await sendEmail({
    to: [client.email],
    subject: `Please sign: ${contract.title}`,
    text: branded.text,
    html: branded.html,
    clientId: client.id,
  });

  await db
    .update(contracts)
    .set({ status: "sent", sentAt: new Date(), updatedAt: new Date() })
    .where(eq(contracts.id, id));

  await addActivity(client.id, "contract", `Sent for signature: ${contract.title}`, id);
  await logAudit("send", "contract", id);
  revalidatePath("/admin/contracts");
  return { ok: !result.error, error: result.error, url };
}

export async function voidContractAction(id: string) {
  await requireAdmin();
  await db
    .update(contracts)
    .set({ status: "void", updatedAt: new Date() })
    .where(eq(contracts.id, id));
  await logAudit("void", "contract", id);
  revalidatePath("/admin/contracts");
  return { ok: true };
}

export async function getContractSignature(contractId: string) {
  await requireAdmin();
  const [sig] = await db
    .select()
    .from(contractSignatures)
    .where(eq(contractSignatures.contractId, contractId))
    .limit(1);
  return sig || null;
}

const templateSchema = z.object({
  name: z.string().min(1),
  titleTemplate: z.string().min(1),
  bodyTemplate: z.string().min(1),
  terms: z.array(z.string()),
  paymentNotes: z.string().optional().nullable(),
  kind: z.enum(["project", "retainer", "consulting"]).optional(),
});

export async function updateContractTemplateAction(
  id: string,
  data: z.infer<typeof templateSchema>,
) {
  await requireAdmin();
  const parsed = templateSchema.parse(data);
  const { updateContractTemplate } = await import("@/lib/contracts/templates");
  const row = await updateContractTemplate(id, {
    name: parsed.name,
    titleTemplate: parsed.titleTemplate,
    bodyTemplate: parsed.bodyTemplate,
    terms: parsed.terms.map((t) => t.trim()).filter(Boolean),
    paymentNotes: parsed.paymentNotes?.trim() || null,
    kind: parsed.kind,
  });
  if (!row) throw new Error("Template not found");
  await logAudit("update", "contract_template", id);
  revalidatePath("/admin/contracts/templates");
  revalidatePath("/admin/contracts/new");
  return { ok: true };
}

/** Push CMS services_terms onto Project & Retainer contract templates. */
export async function syncServicesTermsToTemplatesAction() {
  await requireAdmin();
  const { getContent } = await import("@/lib/content");
  const { servicesTermsSchema } = await import("@/lib/content/schemas");
  const { listContractTemplates, updateContractTemplate } = await import(
    "@/lib/contracts/templates"
  );
  const { applyServicesTermsToTemplate } = await import("@/lib/terms/shared");

  const raw = await getContent("services_terms");
  const content = servicesTermsSchema.parse(raw);
  const templates = await listContractTemplates();
  let updated = 0;

  for (const t of templates) {
    const kind = t.kind as "project" | "retainer" | "consulting";
    const applied = applyServicesTermsToTemplate(kind, content);
    if (!applied) continue;
    await updateContractTemplate(t.id, {
      terms: applied.terms,
      paymentNotes: applied.paymentNotes,
    });
    updated += 1;
  }

  await logAudit("sync", "contract_templates", "services_terms", { updated });
  revalidatePath("/admin/contracts/templates");
  revalidatePath("/admin/contracts/terms");
  revalidatePath("/admin/contracts/new");
  revalidatePath("/admin/content");
  return { ok: true, updated };
}

/** Load CMS services_terms onto a single template (project/retainer only). */
export async function loadServicesTermsOntoTemplateAction(templateId: string) {
  await requireAdmin();
  const { getContent } = await import("@/lib/content");
  const { servicesTermsSchema } = await import("@/lib/content/schemas");
  const { getContractTemplate, updateContractTemplate } = await import(
    "@/lib/contracts/templates"
  );
  const { applyServicesTermsToTemplate } = await import("@/lib/terms/shared");

  const template = await getContractTemplate(templateId);
  if (!template) throw new Error("Template not found");

  const kind = template.kind as "project" | "retainer" | "consulting";
  const content = servicesTermsSchema.parse(await getContent("services_terms"));
  const applied = applyServicesTermsToTemplate(kind, content);
  if (!applied) {
    throw new Error("Consulting templates are not synced from Services terms.");
  }

  const row = await updateContractTemplate(templateId, {
    terms: applied.terms,
    paymentNotes: applied.paymentNotes,
  });
  if (!row) throw new Error("Template not found");

  await logAudit("sync", "contract_template", templateId, { from: "services_terms" });
  revalidatePath("/admin/contracts/templates");
  revalidatePath("/admin/contracts/new");
  return {
    ok: true as const,
    terms: applied.terms,
    paymentNotes: applied.paymentNotes,
  };
}
