import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { invoicePayments, invoices } from "@/db/schema";
import {
  capturePayPalOrder,
  createPayPalOrder,
  isPayPalConfigured,
} from "@/lib/invoices/paypal";
import {
  getPaymentByPayToken,
  listInvoicePayments,
  markPaymentPaid,
  summarizePayments,
  type InvoicePaymentRow,
} from "@/lib/invoices/payments";
import { addActivity } from "@/lib/crm/clients";
import { logAudit } from "@/lib/audit";
import PayButton from "@/components/admin/PayButton";

async function markInvoiceFullyPaid(inv: typeof invoices.$inferSelect, via: string) {
  await db
    .update(invoices)
    .set({ status: "paid", paidAt: new Date(), updatedAt: new Date() })
    .where(eq(invoices.id, inv.id));
  await addActivity(inv.clientId, "invoice", `Paid: ${inv.invoiceNumber}`, inv.id);
  await logAudit("paid", "invoice", inv.id, { via });
}

async function ensurePayPalOrder(
  inv: typeof invoices.$inferSelect,
  opts: {
    amountCents: number;
    payToken: string;
    paymentId?: string;
    paymentLabel?: string;
    persistOrderId: (orderId: string) => Promise<void>;
  },
) {
  if (!inv.paypalEnabled || !isPayPalConfigured()) return null;

  try {
    const order = await createPayPalOrder({
      invoiceId: inv.id,
      invoiceNumber: inv.invoiceNumber,
      totalCents: opts.amountCents,
      currency: inv.currency,
      payToken: opts.payToken,
      paymentId: opts.paymentId,
      paymentLabel: opts.paymentLabel,
    });
    await opts.persistOrderId(order.orderId);
    return order.approveUrl;
  } catch (err) {
    console.error("[pay create order]", err);
    return null;
  }
}

export default async function PayPage({
  params,
  searchParams,
}: {
  params: Promise<{ invoiceId: string }>;
  searchParams: Promise<{ success?: string; cancelled?: string; token?: string }>;
}) {
  const { invoiceId: payToken } = await params;
  const sp = await searchParams;

  let inv = (
    await db.select().from(invoices).where(eq(invoices.payToken, payToken)).limit(1)
  )[0];
  let activePayment: InvoicePaymentRow | null = null;

  if (!inv) {
    activePayment = await getPaymentByPayToken(payToken);
    if (activePayment) {
      inv = (
        await db.select().from(invoices).where(eq(invoices.id, activePayment.invoiceId)).limit(1)
      )[0];
    }
  }

  if (!inv) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0c0c0c] text-white/70">
        Invoice not found.
      </div>
    );
  }

  if (activePayment) {
    if (
      sp.success === "1" &&
      activePayment.paypalOrderId &&
      activePayment.status !== "paid"
    ) {
      try {
        if (isPayPalConfigured()) {
          await capturePayPalOrder(activePayment.paypalOrderId);
        }
        await markPaymentPaid(activePayment.id, "paypal");
        await addActivity(
          inv.clientId,
          "invoice",
          `Paid: ${inv.invoiceNumber} — ${activePayment.label}`,
          inv.id,
        );
        await logAudit("paid", "invoice_payment", activePayment.id, {
          via: "paypal_return",
        });
        activePayment = { ...activePayment, status: "paid" };
      } catch (err) {
        console.error("[pay capture payment]", err);
      }
    }

    const payments = await listInvoicePayments(inv.id);
    const summary = summarizePayments(payments, inv.totalCents);

    let approveUrl: string | null = null;
    if (activePayment.status !== "paid" && activePayment.status !== "void" && inv.status !== "void") {
      approveUrl = await ensurePayPalOrder(inv, {
        amountCents: activePayment.amountCents,
        payToken: activePayment.payToken,
        paymentId: activePayment.id,
        paymentLabel: activePayment.label,
        persistOrderId: async (orderId) => {
          await db
            .update(invoicePayments)
            .set({ paypalOrderId: orderId, updatedAt: new Date() })
            .where(eq(invoicePayments.id, activePayment!.id));
        },
      });
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0c0c0c] px-4 text-[#f2efe8]">
        <div className="w-full max-w-md border border-white/10 bg-[#141414] p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-[#fdf0d5]">Ryan Tang</p>
          <h1 className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold">
            Invoice {inv.invoiceNumber}
          </h1>
          <p className="mt-2 text-sm text-white/50">{activePayment.label}</p>
          <p className="mt-1 text-sm text-white/50">
            Amount due: ${(activePayment.amountCents / 100).toFixed(2)} {inv.currency}
          </p>

          {activePayment.status === "paid" ? (
            <>
              <p className="mt-6 text-emerald-400">This payment has been received. Thank you.</p>
              {!summary.isFullyPaid && (
                <Link
                  href={`/pay/${inv.payToken}`}
                  className="mt-4 inline-block text-sm text-[#fdf0d5] hover:underline"
                >
                  View full payment schedule →
                </Link>
              )}
            </>
          ) : inv.status === "void" ? (
            <p className="mt-6 text-white/50">This invoice is void.</p>
          ) : (
            <>
              {sp.cancelled === "1" && (
                <p className="mt-4 text-sm text-amber-400">Payment was cancelled.</p>
              )}
              {approveUrl ? (
                <PayButton href={approveUrl} />
              ) : (
                <div className="mt-6 space-y-2 text-sm text-white/70">
                  <p>PayPal is not available for this payment right now.</p>
                  {inv.sellerPaymentInstructions && (
                    <p className="whitespace-pre-wrap border border-white/10 p-3 text-white/80">
                      {inv.sellerPaymentInstructions}
                    </p>
                  )}
                </div>
              )}
              <Link
                href={`/pay/${inv.payToken}`}
                className="mt-4 inline-block text-xs text-white/40 hover:text-white/70"
              >
                ← Back to invoice schedule
              </Link>
            </>
          )}
        </div>
      </div>
    );
  }

  let payments = await listInvoicePayments(inv.id);
  let summary = summarizePayments(payments, inv.totalCents);

  if (sp.success === "1" && inv.paypalOrderId && inv.status !== "paid" && !summary.hasSchedule) {
    try {
      if (isPayPalConfigured()) {
        await capturePayPalOrder(inv.paypalOrderId);
      }
      await markInvoiceFullyPaid(inv, "paypal_return");
      inv = { ...inv, status: "paid" };
    } catch (err) {
      console.error("[pay capture]", err);
    }
  }

  let approveUrl: string | null = null;
  if (!summary.hasSchedule && inv.status !== "paid" && inv.status !== "void") {
    approveUrl = await ensurePayPalOrder(inv, {
      amountCents: inv.totalCents,
      payToken: inv.payToken,
      persistOrderId: async (orderId) => {
        await db.update(invoices).set({ paypalOrderId: orderId }).where(eq(invoices.id, inv!.id));
      },
    });
  }

  payments = await listInvoicePayments(inv.id);
  summary = summarizePayments(payments, inv.totalCents);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0c0c0c] px-4 text-[#f2efe8]">
      <div className="w-full max-w-lg border border-white/10 bg-[#141414] p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-[#fdf0d5]">Ryan Tang</p>
        <h1 className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold">
          Invoice {inv.invoiceNumber}
        </h1>

        {summary.hasSchedule ? (
          <>
            <p className="mt-2 text-sm text-white/50">
              Total: ${(inv.totalCents / 100).toFixed(2)} {inv.currency}
            </p>
            <p className="mt-1 text-sm text-white/50">
              Paid: ${(summary.paidCents / 100).toFixed(2)} · Remaining: $
              {(summary.remainingCents / 100).toFixed(2)}
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-white/50">
            Amount due: ${(inv.totalCents / 100).toFixed(2)} {inv.currency}
          </p>
        )}

        {inv.status === "paid" ? (
          <p className="mt-6 text-emerald-400">This invoice has been paid. Thank you.</p>
        ) : inv.status === "void" ? (
          <p className="mt-6 text-white/50">This invoice is void.</p>
        ) : summary.hasSchedule ? (
          <div className="mt-6 space-y-3">
            {sp.cancelled === "1" && (
              <p className="text-sm text-amber-400">Payment was cancelled.</p>
            )}
            <p className="text-xs uppercase tracking-wider text-white/40">Payment schedule</p>
            <ul className="divide-y divide-white/10 border border-white/10">
              {payments
                .filter((p) => p.status !== "void")
                .map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 px-3 py-3 text-sm">
                    <div>
                      <p className="text-white/85">{p.label}</p>
                      <p className="text-xs text-white/45">
                        ${(p.amountCents / 100).toFixed(2)}
                        {p.dueDate
                          ? ` · due ${p.dueDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`
                          : ""}
                      </p>
                    </div>
                    {p.status === "paid" ? (
                      <span className="text-xs text-emerald-400">Paid</span>
                    ) : (
                      <Link
                        href={`/pay/${p.payToken}`}
                        className="shrink-0 bg-[#fdf0d5] px-3 py-1.5 text-xs font-semibold text-black"
                      >
                        Pay now
                      </Link>
                    )}
                  </li>
                ))}
            </ul>
            {inv.sellerPaymentInstructions && (
              <p className="whitespace-pre-wrap border border-white/10 p-3 text-sm text-white/70">
                {inv.sellerPaymentInstructions}
              </p>
            )}
          </div>
        ) : (
          <>
            {sp.cancelled === "1" && (
              <p className="mt-4 text-sm text-amber-400">Payment was cancelled.</p>
            )}
            {approveUrl ? (
              <PayButton href={approveUrl} />
            ) : (
              <div className="mt-6 space-y-2 text-sm text-white/70">
                <p>PayPal is not available for this invoice right now.</p>
                {inv.sellerPaymentInstructions && (
                  <p className="whitespace-pre-wrap border border-white/10 p-3 text-white/80">
                    {inv.sellerPaymentInstructions}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
