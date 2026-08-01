import { getAppUrl, isPayPalConfigured } from "@/lib/env";

function paypalBase() {
  const mode = (process.env.PAYPAL_MODE || "sandbox").toLowerCase();
  return mode === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

async function getAccessToken() {
  if (!isPayPalConfigured()) throw new Error("PayPal not configured");
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`,
  ).toString("base64");
  const res = await fetch(`${paypalBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`PayPal auth failed: ${res.status}`);
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export async function createPayPalOrder(opts: {
  invoiceId: string;
  invoiceNumber: string;
  totalCents: number;
  currency?: string;
  payToken: string;
}) {
  const token = await getAccessToken();
  const appUrl = getAppUrl();
  const value = (opts.totalCents / 100).toFixed(2);

  const res = await fetch(`${paypalBase()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: opts.invoiceId,
          invoice_id: opts.invoiceNumber,
          amount: {
            currency_code: opts.currency || "USD",
            value,
          },
          description: `Invoice ${opts.invoiceNumber}`,
        },
      ],
      application_context: {
        return_url: `${appUrl}/pay/${opts.payToken}?success=1`,
        cancel_url: `${appUrl}/pay/${opts.payToken}?cancelled=1`,
        brand_name: "Ryan Tang",
        user_action: "PAY_NOW",
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal create order failed: ${text}`);
  }

  const order = (await res.json()) as {
    id: string;
    links?: { rel: string; href: string }[];
  };
  const approve = order.links?.find((l) => l.rel === "approve")?.href || null;
  return { orderId: order.id, approveUrl: approve };
}

export async function capturePayPalOrder(orderId: string) {
  const token = await getAccessToken();
  const res = await fetch(`${paypalBase()}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PayPal capture failed: ${text}`);
  }
  return res.json();
}

export { isPayPalConfigured };
