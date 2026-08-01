import { NextRequest, NextResponse } from "next/server";
import { processInboundEmail } from "@/lib/email/inbound";

export async function POST(req: NextRequest) {
  try {
    const secret = process.env.RESEND_WEBHOOK_SECRET;
    if (secret) {
      const svixId = req.headers.get("svix-id");
      const svixTimestamp = req.headers.get("svix-timestamp");
      const svixSignature = req.headers.get("svix-signature");
      // Lightweight presence check; full Svix verify can be added with svix package
      if (!svixId || !svixTimestamp || !svixSignature) {
        return NextResponse.json({ error: "Missing signature headers" }, { status: 401 });
      }
    }

    const body = await req.json();
    if (body?.type !== "email.received") {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const emailId = body?.data?.email_id;
    if (!emailId) {
      return NextResponse.json({ error: "Missing email_id" }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "Resend not configured" }, { status: 503 });
    }

    await processInboundEmail(emailId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[resend webhook]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Webhook failed" },
      { status: 500 },
    );
  }
}
