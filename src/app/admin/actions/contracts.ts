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
  const [row] = await db
    .update(contracts)
    .set({
      ...data,
      updatedAt: new Date(),
    })
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
