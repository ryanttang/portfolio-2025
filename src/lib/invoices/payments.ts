import { asc, eq, and } from "drizzle-orm";
import { randomBytes } from "crypto";
import { db } from "@/db";
import { contracts, invoicePayments, invoices } from "@/db/schema";

export type InvoicePaymentRow = typeof invoicePayments.$inferSelect;

export type PaymentScheduleInput = {
  label: string;
  amountCents: number;
  dueDate?: string | null;
  alreadyReceived?: boolean;
  paidAt?: string | null;
};

export type AddInvoicePaymentInput = {
  label: string;
  amountCents: number;
  dueDate?: string | null;
  alreadyReceived?: boolean;
  paidAt?: string | null;
  addBalanceDue?: boolean;
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
  const scheduledCents = active.reduce((sum, p) => sum + p.amountCents, 0);
  return {
    hasSchedule: active.length > 0,
    paidCents,
    remainingCents,
    isFullyPaid: paidCents >= invoiceTotalCents && invoiceTotalCents > 0,
    pendingCount: pending.length,
    paidCount: active.filter((p) => p.status === "paid").length,
    totalScheduledCents: scheduledCents,
    unscheduledRemainingCents: Math.max(0, invoiceTotalCents - scheduledCents),
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

export function formatPaymentNotesFromPayments(
  payments: InvoicePaymentRow[],
  invoiceTotalCents: number,
): string {
  const active = payments.filter((p) => p.status !== "void");
  const paid = active.filter((p) => p.status === "paid");
  const pending = active.filter((p) => p.status === "pending");
  const summary = summarizePayments(payments, invoiceTotalCents);
  const lines: string[] = [];

  if (paid.length > 0) {
    lines.push("Payments received:");
    for (const p of paid) {
      const date = p.paidAt
        ? ` (${p.paidAt.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })})`
        : "";
      lines.push(`- ${p.label}: $${(p.amountCents / 100).toFixed(2)}${date}`);
    }
  }

  if (pending.length > 0) {
    if (lines.length > 0) lines.push("");
    lines.push("Upcoming payments:");
    for (const p of pending) {
      const due = p.dueDate
        ? ` — due ${p.dueDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}`
        : "";
      lines.push(`- ${p.label}: $${(p.amountCents / 100).toFixed(2)}${due}`);
    }
  }

  const pendingTotal = pending.reduce((sum, p) => sum + p.amountCents, 0);
  if (summary.remainingCents > 0 && pendingTotal < summary.remainingCents) {
    if (lines.length > 0) lines.push("");
    lines.push(`Balance due: $${(summary.remainingCents / 100).toFixed(2)}`);
  }

  if (summary.isFullyPaid) {
    if (lines.length > 0) lines.push("");
    lines.push("Paid in full.");
  }

  return lines.join("\n").trim();
}

export function replacePaymentScheduleInContractBody(
  bodyText: string,
  paymentNotes: string,
): string {
  const block = paymentNotes.trim();
  if (!block) return bodyText;

  if (/Payment schedule\s*\n/i.test(bodyText)) {
    return bodyText.replace(
      /(Payment schedule\s*\n)([\s\S]*?)(\nTerms\s*\n)/i,
      `$1${block}\n$3`,
    );
  }

  return bodyText.replace(
    /(3\.\s*Payment\s*&\s*Terms\s*\n)/i,
    `$1Payment schedule\n${block}\n\nTerms\n`,
  );
}

export async function syncLinkedAgreementFromInvoice(invoiceId: string) {
  const [inv] = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
  if (!inv) return;

  const payments = await listInvoicePayments(invoiceId);
  const active = payments.filter((p) => p.status !== "void");
  if (active.length === 0) return;

  const notes = formatPaymentNotesFromPayments(payments, inv.totalCents);
  const now = new Date();

  await db
    .update(invoices)
    .set({ notesPublic: notes, updatedAt: now })
    .where(eq(invoices.id, invoiceId));

  if (!inv.contractId) return;

  const [contract] = await db
    .select()
    .from(contracts)
    .where(eq(contracts.id, inv.contractId))
    .limit(1);
  if (!contract) return;

  const contractUpdate: {
    paymentNotes: string;
    updatedAt: Date;
    bodyText?: string;
  } = {
    paymentNotes: notes,
    updatedAt: now,
  };

  if (contract.status === "draft") {
    contractUpdate.bodyText = replacePaymentScheduleInContractBody(
      contract.bodyText,
      notes,
    );
  }

  await db.update(contracts).set(contractUpdate).where(eq(contracts.id, contract.id));
}

export function validateAddPayment(
  existingPayments: InvoicePaymentRow[],
  amountCents: number,
  invoiceTotalCents: number,
) {
  if (amountCents <= 0) {
    return { ok: false as const, error: "Payment amount must be greater than zero." };
  }

  const active = existingPayments.filter((p) => p.status !== "void");
  const scheduledTotal = active.reduce((sum, p) => sum + p.amountCents, 0);
  if (scheduledTotal + amountCents > invoiceTotalCents) {
    const remaining = Math.max(0, invoiceTotalCents - scheduledTotal);
    return {
      ok: false as const,
      error: `Amount exceeds remaining invoice balance of $${(remaining / 100).toFixed(2)}.`,
    };
  }

  return { ok: true as const };
}

export async function addInvoicePayment(
  invoiceId: string,
  input: AddInvoicePaymentInput,
): Promise<InvoicePaymentRow> {
  const [inv] = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
  if (!inv) throw new Error("Invoice not found");
  if (inv.status === "void") throw new Error("Cannot add payments to a void invoice");

  const label = input.label.trim();
  if (!label) throw new Error("Payment label is required.");

  const existing = await listInvoicePayments(invoiceId);
  const check = validateAddPayment(existing, input.amountCents, inv.totalCents);
  if (!check.ok) throw new Error(check.error);

  const active = existing.filter((p) => p.status !== "void");
  const sortOrder =
    active.length > 0 ? Math.max(...active.map((p) => p.sortOrder)) + 1 : 0;
  const now = new Date();
  const alreadyReceived = Boolean(input.alreadyReceived);
  const paidAt = alreadyReceived
    ? input.paidAt
      ? new Date(input.paidAt)
      : now
    : null;

  const [payment] = await db
    .insert(invoicePayments)
    .values({
      invoiceId,
      sortOrder,
      label,
      amountCents: input.amountCents,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      status: alreadyReceived ? "paid" : "pending",
      payToken: randomBytes(16).toString("hex"),
      paidAt,
      paidVia: alreadyReceived ? "manual" : null,
    })
    .returning();

  if (input.addBalanceDue && alreadyReceived) {
    const updated = await listInvoicePayments(invoiceId);
    const summary = summarizePayments(updated, inv.totalCents);
    const pendingTotal = updated
      .filter((p) => p.status === "pending")
      .reduce((sum, p) => sum + p.amountCents, 0);

    if (summary.remainingCents > 0 && pendingTotal < summary.remainingCents) {
      const balanceAmount = summary.remainingCents - pendingTotal;
      await db.insert(invoicePayments).values({
        invoiceId,
        sortOrder: sortOrder + 1,
        label: "Balance due",
        amountCents: balanceAmount,
        status: "pending",
        payToken: randomBytes(16).toString("hex"),
      });
    }
  }

  await syncInvoiceStatusFromPayments(invoiceId);
  await syncLinkedAgreementFromInvoice(invoiceId);
  return payment;
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
  await syncLinkedAgreementFromInvoice(payment.invoiceId);
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
  await syncLinkedAgreementFromInvoice(invoiceId);
}

export async function createInvoicePayments(
  invoiceId: string,
  schedule: PaymentScheduleInput[],
) {
  if (schedule.length === 0) return;

  for (let i = 0; i < schedule.length; i++) {
    const row = schedule[i];
    const alreadyReceived = Boolean(row.alreadyReceived);
    const now = new Date();
    await db.insert(invoicePayments).values({
      invoiceId,
      sortOrder: i,
      label: row.label.trim(),
      amountCents: row.amountCents,
      dueDate: row.dueDate ? new Date(row.dueDate) : null,
      status: alreadyReceived ? "paid" : "pending",
      payToken: randomBytes(16).toString("hex"),
      paidAt: alreadyReceived ? (row.paidAt ? new Date(row.paidAt) : now) : null,
      paidVia: alreadyReceived ? "manual" : null,
    });
  }

  await syncInvoiceStatusFromPayments(invoiceId);
  await syncLinkedAgreementFromInvoice(invoiceId);
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
