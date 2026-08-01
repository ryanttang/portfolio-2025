"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { invoiceLineItems, invoices } from "@/db/schema";
import { nextInvoiceNumber } from "@/lib/invoices/numbering";
import { buildInvoicePdfBuffer } from "@/lib/invoices/pdf";
import { createPayPalOrder, isPayPalConfigured } from "@/lib/invoices/paypal";
import { getSetting } from "@/lib/content";
import { addActivity, getClient } from "@/lib/crm/clients";
import { sendEmail } from "@/lib/email/send";
import { getAppUrl } from "@/lib/env";
import { logAudit } from "@/lib/audit";
import { storeFile } from "@/lib/storage";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
}

const lineSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().int().positive(),
  unitPriceCents: z.number().int(),
});

export async function createInvoiceAction(data: {
  clientId: string;
  contractId?: string | null;
  dueDate?: string | null;
  lineItems: z.infer<typeof lineSchema>[];
  notesPublic?: string;
  notesInternal?: string;
  paypalEnabled?: boolean;
  discountCents?: number;
  taxCents?: number;
}) {
  await requireAdmin();
  const client = await getClient(data.clientId);
  if (!client) throw new Error("Client not found");

  const seller = await getSetting<{
    sellerLegalName?: string;
    sellerAddress?: string;
    sellerTaxId?: string;
    sellerPaymentInstructions?: string;
    sellerFooterNote?: string;
  }>("invoice");

  const lines = data.lineItems.map((l) => lineSchema.parse(l));
  const subtotal = lines.reduce((s, l) => s + l.quantity * l.unitPriceCents, 0);
  const discount = data.discountCents || 0;
  const tax = data.taxCents || 0;
  const total = Math.max(0, subtotal - discount + tax);
  const number = await nextInvoiceNumber();
  const payToken = randomBytes(16).toString("hex");

  const [inv] = await db
    .insert(invoices)
    .values({
      invoiceNumber: number,
      clientId: client.id,
      contractId: data.contractId || null,
      status: "draft",
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      sellerLegalName: seller?.sellerLegalName || "Ryan Tang",
      sellerAddress: seller?.sellerAddress || null,
      sellerTaxId: seller?.sellerTaxId || null,
      sellerPaymentInstructions: seller?.sellerPaymentInstructions || null,
      sellerFooterNote: seller?.sellerFooterNote || null,
      clientName: client.name,
      clientCompany: client.company,
      clientEmail: client.email,
      clientPhone: client.phone,
      clientAddress: client.address,
      subtotalCents: subtotal,
      discountCents: discount,
      taxCents: tax,
      totalCents: total,
      notesPublic: data.notesPublic || null,
      notesInternal: data.notesInternal || null,
      paypalEnabled: Boolean(data.paypalEnabled),
      payToken,
    })
    .returning();

  for (let i = 0; i < lines.length; i++) {
    await db.insert(invoiceLineItems).values({
      invoiceId: inv.id,
      sortOrder: i,
      description: lines[i].description,
      quantity: lines[i].quantity,
      unitPriceCents: lines[i].unitPriceCents,
    });
  }

  await addActivity(client.id, "invoice", `Created ${number}`, inv.id);
  await logAudit("create", "invoice", inv.id);
  revalidatePath("/admin/invoices");
  return { ok: true, id: inv.id };
}

export async function markInvoicePaidAction(id: string) {
  await requireAdmin();
  const [inv] = await db
    .update(invoices)
    .set({ status: "paid", paidAt: new Date(), updatedAt: new Date() })
    .where(eq(invoices.id, id))
    .returning();
  if (inv) {
    await addActivity(inv.clientId, "invoice", `Marked paid: ${inv.invoiceNumber}`, id);
    await logAudit("paid", "invoice", id, { via: "manual" });
  }
  revalidatePath("/admin/invoices");
  return { ok: true };
}

export async function voidInvoiceAction(id: string) {
  await requireAdmin();
  await db
    .update(invoices)
    .set({ status: "void", updatedAt: new Date() })
    .where(eq(invoices.id, id));
  await logAudit("void", "invoice", id);
  revalidatePath("/admin/invoices");
  return { ok: true };
}

export async function sendInvoiceAction(id: string) {
  await requireAdmin();
  const [inv] = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
  if (!inv) throw new Error("Not found");
  if (!inv.clientEmail) throw new Error("No client email");

  const lines = await db
    .select()
    .from(invoiceLineItems)
    .where(eq(invoiceLineItems.invoiceId, id));

  let payUrl: string | null = `${getAppUrl()}/pay/${inv.payToken}`;
  let paypalOrderId = inv.paypalOrderId;

  if (inv.paypalEnabled && isPayPalConfigured() && !paypalOrderId) {
    const order = await createPayPalOrder({
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      totalCents: inv.totalCents,
      currency: inv.currency,
      payToken: inv.payToken,
    });
    paypalOrderId = order.orderId;
    if (order.approveUrl) payUrl = order.approveUrl;
    await db
      .update(invoices)
      .set({ paypalOrderId })
      .where(eq(invoices.id, id));
  }

  const pdf = await buildInvoicePdfBuffer({
    ...inv,
    payUrl,
    lineItems: lines.map((l) => ({
      description: l.description,
      quantity: l.quantity,
      unitPriceCents: l.unitPriceCents,
    })),
  });

  await storeFile(`invoices/${inv.id}.pdf`, pdf, "application/pdf");

  const amountLabel = `$${(inv.totalCents / 100).toFixed(2)}`;
  const invoicePayUrl = payUrl || `${getAppUrl()}/pay/${inv.payToken}`;
  const { renderInvoiceEmail } = await import("@/lib/email/templates/transactional");
  const branded = await renderInvoiceEmail({
    clientName: inv.clientName || "there",
    invoiceNumber: inv.invoiceNumber,
    amountLabel,
    payUrl: invoicePayUrl,
  });

  const result = await sendEmail({
    to: [inv.clientEmail],
    subject: `Invoice ${inv.invoiceNumber}`,
    text: branded.text,
    html: branded.html,
    attachments: [{ filename: `${inv.invoiceNumber}.pdf`, content: pdf, contentType: "application/pdf" }],
    clientId: inv.clientId,
  });

  await db
    .update(invoices)
    .set({ status: "sent", sentAt: new Date(), updatedAt: new Date() })
    .where(eq(invoices.id, id));

  await addActivity(inv.clientId, "invoice", `Sent ${inv.invoiceNumber}`, id);
  await logAudit("send", "invoice", id);
  revalidatePath("/admin/invoices");
  return { ok: !result.error, error: result.error, payUrl };
}
