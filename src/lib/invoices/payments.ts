import { asc, eq, and } from "drizzle-orm";
import { randomBytes } from "crypto";
import { db } from "@/db";
import { invoicePayments, invoices } from "@/db/schema";

export type InvoicePaymentRow = typeof invoicePayments.$inferSelect;

export type PaymentScheduleInput = {
  label: string;
  amountCents: number;
  dueDate?: string | null;
};

export async function listInvoicePayments(invoiceId: string) {
  return db
    .select()
    .from(invoicePayments)
    .where(eq(invoicePayments.invoiceId, invoiceId))
    .orderBy(asc(invoicePayments.sortOrder), asc(invoicePayments.createdAt));
}

export async function getPaymentByPayToken(payToken: string) {
  const [payment] = await db
    .select()
    .from(invoicePayments)
    .where(eq(invoicePayments.payToken, payToken))
    .limit(1);
  return payment || null;
}

export async function getPaymentById(paymentId: string) {
  const [payment] = await db
    .select()
    .from(invoicePayments)
    .where(eq(invoicePayments.id, paymentId))
    .limit(1);
  return payment || null;
}

export async function getPaymentByPayPalOrderId(orderId: string) {
  const [payment] = await db
    .select()
    .from(invoicePayments)
    .where(eq(invoicePayments.paypalOrderId, orderId))
    .limit(1);
  return payment || null;
}

export function summarizePayments(
  payments: InvoicePaymentRow[],
  invoiceTotalCents: number,
) {
  const active = payments.filter((p) => p.status !== "void");
  const paidCents = active
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amountCents, 0);
  const remainingCents = Math.max(0, invoiceTotalCents - paidCents);
  const pending = active.filter((p) => p.status === "pending");
  return {
    hasSchedule: active.length > 0,
    paidCents,
    remainingCents,
    isFullyPaid: active.length > 0 && pending.length === 0,
    pendingCount: pending.length,
    paidCount: active.filter((p) => p.status === "paid").length,
    totalScheduledCents: active.reduce((sum, p) => sum + p.amountCents, 0),
  };
}

export function isDepositSatisfied(
  invoice: { status: string },
  payments: InvoicePaymentRow[],
) {
  if (invoice.status === "paid") return true;
  const active = payments.filter((p) => p.status !== "void");
  if (active.length === 0) return invoice.status === "paid";
  const first = active[0];
  return first.status === "paid";
}

export async function createInvoicePayments(
  invoiceId: string,
  schedule: PaymentScheduleInput[],
) {
  if (schedule.length === 0) return;

  for (let i = 0; i < schedule.length; i++) {
    const row = schedule[i];
    await db.insert(invoicePayments).values({
      invoiceId,
      sortOrder: i,
      label: row.label.trim(),
      amountCents: row.amountCents,
      dueDate: row.dueDate ? new Date(row.dueDate) : null,
      payToken: randomBytes(16).toString("hex"),
    });
  }
}

export async function syncInvoiceStatusFromPayments(invoiceId: string) {
  const payments = await listInvoicePayments(invoiceId);
  if (payments.length === 0) return;

  const [inv] = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
  if (!inv || inv.status === "void") return;

  const summary = summarizePayments(payments, inv.totalCents);
  const now = new Date();

  if (summary.isFullyPaid) {
    const paidRows = payments.filter((p) => p.status === "paid" && p.paidAt);
    const lastPaidAt =
      paidRows.length > 0
        ? paidRows.reduce(
            (latest, p) => (p.paidAt! > latest ? p.paidAt! : latest),
            paidRows[0].paidAt!,
          )
        : now;

    await db
      .update(invoices)
      .set({ status: "paid", paidAt: lastPaidAt, updatedAt: now })
      .where(eq(invoices.id, invoiceId));
    return;
  }

  if (summary.paidCount > 0) {
    await db
      .update(invoices)
      .set({ status: "partial", paidAt: null, updatedAt: now })
      .where(eq(invoices.id, invoiceId));
    return;
  }

  if (inv.status === "partial" || inv.status === "paid") {
    const fallback = inv.sentAt ? "sent" : "draft";
    await db
      .update(invoices)
      .set({ status: fallback, paidAt: null, updatedAt: now })
      .where(eq(invoices.id, invoiceId));
  }
}

export async function markPaymentPaid(
  paymentId: string,
  via: "manual" | "paypal",
) {
  const now = new Date();
  const [payment] = await db
    .update(invoicePayments)
    .set({
      status: "paid",
      paidAt: now,
      paidVia: via,
      updatedAt: now,
    })
    .where(eq(invoicePayments.id, paymentId))
    .returning();

  if (!payment) return null;

  await syncInvoiceStatusFromPayments(payment.invoiceId);
  return payment;
}

export async function markAllPaymentsPaid(invoiceId: string, via: "manual" | "paypal") {
  const now = new Date();
  await db
    .update(invoicePayments)
    .set({
      status: "paid",
      paidAt: now,
      paidVia: via,
      updatedAt: now,
    })
    .where(
      and(
        eq(invoicePayments.invoiceId, invoiceId),
        eq(invoicePayments.status, "pending"),
      ),
    );

  await syncInvoiceStatusFromPayments(invoiceId);
}

export async function voidInvoicePayments(invoiceId: string) {
  const now = new Date();
  await db
    .update(invoicePayments)
    .set({ status: "void", updatedAt: now })
    .where(
      and(
        eq(invoicePayments.invoiceId, invoiceId),
        eq(invoicePayments.status, "pending"),
      ),
    );
}

export function validatePaymentSchedule(
  schedule: PaymentScheduleInput[],
  invoiceTotalCents: number,
) {
  if (schedule.length === 0) return { ok: true as const };

  const normalized = schedule.map((p) => ({
    label: p.label.trim(),
    amountCents: p.amountCents,
  }));

  if (normalized.some((p) => !p.label)) {
    return { ok: false as const, error: "Each payment needs a label." };
  }
  if (normalized.some((p) => p.amountCents <= 0)) {
    return { ok: false as const, error: "Each payment amount must be greater than zero." };
  }

  const sum = normalized.reduce((s, p) => s + p.amountCents, 0);
  if (sum !== invoiceTotalCents) {
    return {
      ok: false as const,
      error: `Payment schedule must total $${(invoiceTotalCents / 100).toFixed(2)} (currently $${(sum / 100).toFixed(2)}).`,
    };
  }

  return { ok: true as const };
}
