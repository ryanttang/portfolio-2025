import { eq } from "drizzle-orm";
import { db } from "@/db";
import { invoices } from "@/db/schema";
import {
  capturePayPalOrder,
  createPayPalOrder,
  isPayPalConfigured,
} from "@/lib/invoices/paypal";
import { addActivity } from "@/lib/crm/clients";
import { logAudit } from "@/lib/audit";
import PayButton from "@/components/admin/PayButton";

export default async function PayPage({
  params,
  searchParams,
}: {
  params: Promise<{ invoiceId: string }>;
  searchParams: Promise<{ success?: string; cancelled?: string; token?: string }>;
}) {
  const { invoiceId: payToken } = await params;
  const sp = await searchParams;

  const [inv] = await db
    .select()
    .from(invoices)
    .where(eq(invoices.payToken, payToken))
    .limit(1);

  if (!inv) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0c0c0c] text-white/70">
        Invoice not found.
      </div>
    );
  }

  // Capture after PayPal return
  if (sp.success === "1" && inv.paypalOrderId && inv.status !== "paid") {
    try {
      if (isPayPalConfigured()) {
        await capturePayPalOrder(inv.paypalOrderId);
      }
      await db
        .update(invoices)
        .set({ status: "paid", paidAt: new Date(), updatedAt: new Date() })
        .where(eq(invoices.id, inv.id));
      await addActivity(inv.clientId, "invoice", `Paid: ${inv.invoiceNumber}`, inv.id);
      await logAudit("paid", "invoice", inv.id, { via: "paypal_return" });
      inv.status = "paid";
    } catch (err) {
      console.error("[pay capture]", err);
    }
  }

  let approveUrl: string | null = null;
  if (inv.status !== "paid" && inv.status !== "void" && inv.paypalEnabled && isPayPalConfigured()) {
    try {
      if (!inv.paypalOrderId) {
        const order = await createPayPalOrder({
          invoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber,
          totalCents: inv.totalCents,
          currency: inv.currency,
          payToken: inv.payToken,
        });
        await db
          .update(invoices)
          .set({ paypalOrderId: order.orderId })
          .where(eq(invoices.id, inv.id));
        approveUrl = order.approveUrl;
      } else {
        const order = await createPayPalOrder({
          invoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber,
          totalCents: inv.totalCents,
          currency: inv.currency,
          payToken: inv.payToken,
        });
        approveUrl = order.approveUrl;
        await db
          .update(invoices)
          .set({ paypalOrderId: order.orderId })
          .where(eq(invoices.id, inv.id));
      }
    } catch (err) {
      console.error("[pay create order]", err);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0c0c0c] px-4 text-[#f2efe8]">
      <div className="w-full max-w-md border border-white/10 bg-[#141414] p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-[#e6c47a]">Ryan Tang</p>
        <h1 className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold">
          Invoice {inv.invoiceNumber}
        </h1>
        <p className="mt-2 text-sm text-white/50">
          Amount due: ${(inv.totalCents / 100).toFixed(2)} {inv.currency}
        </p>

        {inv.status === "paid" ? (
          <p className="mt-6 text-emerald-400">This invoice has been paid. Thank you.</p>
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
