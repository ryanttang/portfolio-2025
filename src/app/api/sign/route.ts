import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { signAgreement } from "@/lib/contracts/sign";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  external_id: z.string().min(8),
  consent: z.literal(true),
  signature_method: z.enum(["draw", "type"]),
  signature_png_base64: z.string().optional(),
  typed_signature: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const rl = rateLimit(`sign:${ip}`, 20, 15 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ message: "Too many requests" }, { status: 429 });
  }

  try {
    const json = await req.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
    }

    const result = await signAgreement({
      externalId: parsed.data.external_id,
      consent: parsed.data.consent,
      signatureMethod: parsed.data.signature_method,
      signaturePngBase64: parsed.data.signature_png_base64,
      typedSignature: parsed.data.typed_signature,
      ip,
      userAgent: req.headers.get("user-agent"),
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "Signing failed" },
      { status: 400 },
    );
  }
}
