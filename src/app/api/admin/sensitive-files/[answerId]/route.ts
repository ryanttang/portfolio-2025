import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getDecryptedAnswer } from "@/lib/onboarding";
import { decryptBytes } from "@/lib/crypto/sensitive";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ answerId: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { answerId } = await params;
  const answer = await getDecryptedAnswer(answerId);
  if (!answer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const value = answer.value as {
    url?: string;
    filename?: string;
    contentType?: string;
    encryptedFile?: boolean;
  };
  if (!value?.url) return NextResponse.json({ error: "No file" }, { status: 404 });

  let bytes: Buffer;
  try {
    if (value.url.startsWith("/api/uploads/")) {
      const relative = value.url.replace("/api/uploads/", "");
      bytes = await readFile(path.join(process.cwd(), "uploads", relative));
    } else {
      const res = await fetch(value.url);
      if (!res.ok) throw new Error("Fetch failed");
      bytes = Buffer.from(await res.arrayBuffer());
    }
  } catch {
    return NextResponse.json({ error: "File missing" }, { status: 404 });
  }

  const body = value.encryptedFile ? decryptBytes(bytes) : bytes;
  const filename = value.filename || "download";
  return new NextResponse(new Uint8Array(body), {
    headers: {
      "Content-Type": value.contentType || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${filename.replace(/"/g, "")}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
