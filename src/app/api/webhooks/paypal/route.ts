import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { invoices } from "@/db/schema";
import { addActivity } from "@/lib/crm/clients";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const eventType = body?.event_type || body?.eventType;
    const resource = body?.resource || {};

    // Capture completed or checkout order approved
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
