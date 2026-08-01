import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { pageEvents } from "@/db/schema";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  path: z.string().min(1).max(500),
  referrer: z.string().max(1000).optional().nullable(),
  sessionId: z.string().max(100).optional().nullable(),
});

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = rateLimit(`pv:${ip}`, 120, 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  try {
    const json = await req.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    await db.insert(pageEvents).values({
      path: parsed.data.path,
      referrer: parsed.data.referrer || null,
      sessionId: parsed.data.sessionId || null,
      userAgent: req.headers.get("user-agent"),
    });

    return NextResponse.json({ ok: true });
  } catch {
    // Don't break the public site if DB is down
    return NextResponse.json({ ok: true, skipped: true });
  }
}
