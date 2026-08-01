import { Resend } from "resend";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { emailAttachments, emailMessages, emailThreads } from "@/db/schema";
import { getSetting } from "@/lib/content";
import { findClientByEmail, addActivity } from "@/lib/crm/clients";
import { isResendConfigured } from "@/lib/env";
import { htmlToPlainText } from "@/lib/email/templates/render";

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

export async function sendEmail(opts: {
  to: string[];
  cc?: string[];
  subject: string;
  text?: string;
  html?: string;
  threadId?: string;
  inReplyTo?: string;
  attachments?: {
    filename: string;
    content: Buffer;
    contentType?: string;
    storageUrl?: string;
  }[];
  clientId?: string | null;
}) {
  const emailSettings = await getSetting<{ fromName?: string; fromEmail?: string }>("email");
  const fromEmail =
    emailSettings?.fromEmail ||
    process.env.RESEND_FROM_EMAIL ||
    "onboarding@resend.dev";
  const fromName = emailSettings?.fromName || "Ryan Tang";
  const from = `${fromName} <${fromEmail}>`;

  const html =
    opts.html ||
    (opts.text ? opts.text.replace(/\n/g, "<br/>") : undefined);
  const text =
    opts.text ||
    (opts.html ? htmlToPlainText(opts.html) : undefined);

  let threadId = opts.threadId;
  if (!threadId) {
    const participants = Array.from(
      new Set([fromEmail.toLowerCase(), ...opts.to.map((t) => t.toLowerCase())]),
    );
    let clientId = opts.clientId || null;
    if (!clientId && opts.to[0]) {
      const client = await findClientByEmail(opts.to[0]);
      clientId = client?.id || null;
    }
    const [thread] = await db
      .insert(emailThreads)
      .values({
        subject: opts.subject || "(no subject)",
        clientId,
        participants,
        lastMessageAt: new Date(),
      })
      .returning();
    threadId = thread.id;
  } else {
    await db
      .update(emailThreads)
      .set({ lastMessageAt: new Date() })
      .where(eq(emailThreads.id, threadId));

    if (opts.clientId) {
      await db
        .update(emailThreads)
        .set({ clientId: opts.clientId })
        .where(eq(emailThreads.id, threadId));
    }
  }

  const [message] = await db
    .insert(emailMessages)
    .values({
      threadId,
      direction: "outbound",
      fromEmail,
      toEmails: opts.to,
      ccEmails: opts.cc || [],
      subject: opts.subject,
      textBody: text || null,
      htmlBody: html || null,
      inReplyTo: opts.inReplyTo || null,
      status: "queued",
      readAt: new Date(),
    })
    .returning();

  if (opts.attachments?.length) {
    for (const a of opts.attachments) {
      if (!a.storageUrl) continue;
      await db.insert(emailAttachments).values({
        messageId: message.id,
        filename: a.filename,
        contentType: a.contentType || null,
        size: a.content.length,
        storageUrl: a.storageUrl,
      });
    }
  }

  if (!isResendConfigured()) {
    await db
      .update(emailMessages)
      .set({ status: "failed" })
      .where(eq(emailMessages.id, message.id));
    return { message, threadId, error: "RESEND_API_KEY not configured" };
  }

  const resend = getResend()!;
  try {
    const result = await resend.emails.send({
      from,
      to: opts.to,
      cc: opts.cc,
      subject: opts.subject,
      ...(html ? { html, text: text || undefined } : { text: text || "" }),
      headers: opts.inReplyTo
        ? { "In-Reply-To": opts.inReplyTo, References: opts.inReplyTo }
        : undefined,
      attachments: opts.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
      })),
    } as Parameters<typeof resend.emails.send>[0]);

    const resendId = result.data?.id || null;
    await db
      .update(emailMessages)
      .set({
        status: result.error ? "failed" : "sent",
        resendId,
        messageId: resendId ? `<${resendId}@resend>` : null,
      })
      .where(eq(emailMessages.id, message.id));

    const [thread] = await db
      .select()
      .from(emailThreads)
      .where(eq(emailThreads.id, threadId))
      .limit(1);
    if (thread?.clientId) {
      await addActivity(
        thread.clientId,
        "email",
        `Sent: ${opts.subject}`,
        message.id,
      );
    }

    return { message, threadId, resendId, error: result.error?.message };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Send failed";
    await db
      .update(emailMessages)
      .set({ status: "failed" })
      .where(eq(emailMessages.id, message.id));
    return { message, threadId, error: msg };
  }
}
