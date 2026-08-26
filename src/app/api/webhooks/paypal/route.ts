import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { invoices } from "@/db/schema";
import { addActivity } from "@/lib/crm/clients";
import { logAudit } from "@/lib/audit";
import {
  getPaymentById,
  getPaymentByPayPalOrderId,
  markPaymentPaid,
  syncInvoiceStatusFromPayments,
} from "@/lib/invoices/payments";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const eventType = body?.event_type || body?.eventType;
    const resource = body?.resource || {};

    const orderId =
      resource?.id ||
      resource?.supplementary_data?.related_ids?.order_id ||
      resource?.purchase_units?.[0]?.payments?.captures?.[0]?.id;

    const referenceId =
      resource?.purchase_units?.[0]?.reference_id ||
      resource?.supplementary_data?.related_ids?.order_id;

    if (
      eventType === "PAYMENT.CAPTURE.COMPLETED" ||
      eventType === "CHECKOUT.ORDER.APPROVED" ||
      eventType === "CHECKOUT.ORDER.COMPLETED"
    ) {
      if (orderId) {
        const payment = await getPaymentByPayPalOrderId(String(orderId));
        if (payment && payment.status !== "paid") {
          await markPaymentPaid(payment.id, "paypal");
          const [inv] = await db
            .select()
            .from(invoices)
            .where(eq(invoices.id, payment.invoiceId))
            .limit(1);
          if (inv) {
            await addActivity(
              inv.clientId,
              "invoice",
              `Paid via PayPal: ${inv.invoiceNumber} — ${payment.label}`,
              inv.id,
            );
            await logAudit("paid", "invoice_payment", payment.id, {
              via: "paypal_webhook",
              eventType,
            });
          }
          return NextResponse.json({ ok: true });
        }
      }

      let invoice = null as typeof invoices.$inferSelect | null;

      if (orderId) {
        const [byOrder] = await db
          .select()
          .from(invoices)
          .where(eq(invoices.paypalOrderId, String(orderId)))
          .limit(1);
        invoice = byOrder || null;
      }

      if (!invoice && referenceId) {
        const paymentByRef = await getPaymentById(String(referenceId));
        if (paymentByRef && paymentByRef.status !== "paid") {
          await markPaymentPaid(paymentByRef.id, "paypal");
          const [inv] = await db
            .select()
            .from(invoices)
            .where(eq(invoices.id, paymentByRef.invoiceId))
            .limit(1);
          if (inv) {
            await addActivity(
              inv.clientId,
              "invoice",
              `Paid via PayPal: ${inv.invoiceNumber} — ${paymentByRef.label}`,
              inv.id,
            );
            await logAudit("paid", "invoice_payment", paymentByRef.id, {
              via: "paypal_webhook",
              eventType,
            });
          }
          return NextResponse.json({ ok: true });
        }

        const [byId] = await db
          .select()
          .from(invoices)
          .where(eq(invoices.id, String(referenceId)))
          .limit(1);
        invoice = byId || null;
      }

      if (invoice && invoice.status !== "paid") {
        await db
          .update(invoices)
          .set({ status: "paid", paidAt: new Date(), updatedAt: new Date() })
          .where(eq(invoices.id, invoice.id));
        await syncInvoiceStatusFromPayments(invoice.id);
        await addActivity(
          invoice.clientId,
          "invoice",
          `Paid via PayPal: ${invoice.invoiceNumber}`,
          invoice.id,
        );
        await logAudit("paid", "invoice", invoice.id, { via: "paypal_webhook", eventType });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[paypal webhook]", err);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
