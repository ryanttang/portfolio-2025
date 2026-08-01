import { Resend } from "resend";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { emailAttachments, emailMessages, emailThreads } from "@/db/schema";
import { ensureClientFromEmail, addActivity } from "@/lib/crm/clients";
import { storeFile } from "@/lib/storage";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY!);
}

export async function processInboundEmail(emailId: string) {
  const resend = getResend();
  const received = await resend.emails.receiving.get(emailId);
  const data = received.data;
  if (!data) throw new Error("Could not fetch received email");

  const fromRaw = String(data.from || "");
  const angleMatch = fromRaw.match(/<([^>]+)>/);
  const fromEmail = (angleMatch?.[1] || fromRaw).trim().toLowerCase();
  const toEmails = (data.to || []).map((t: string) => t.toLowerCase());
  const subject = data.subject || "(no subject)";
  const messageId = data.message_id || null;

  if (messageId) {
    const [dup] = await db
      .select()
      .from(emailMessages)
      .where(eq(emailMessages.messageId, messageId))
      .limit(1);
    if (dup) return dup;
  }

  const client = await ensureClientFromEmail(fromEmail);

  // Try to find thread by In-Reply-To
  let threadId: string | null = null;
  const inReplyTo = (data as { headers?: Record<string, string> }).headers?.["in-reply-to"] || null;
  if (inReplyTo) {
    const [prev] = await db
      .select()
      .from(emailMessages)
      .where(eq(emailMessages.messageId, inReplyTo))
      .limit(1);
    if (prev) threadId = prev.threadId;
  }

  if (!threadId) {
    const [thread] = await db
      .insert(emailThreads)
      .values({
        subject,
        clientId: client.id,
        participants: Array.from(new Set([fromEmail, ...toEmails])),
        lastMessageAt: new Date(),
      })
      .returning();
    threadId = thread.id;
  } else {
    await db
      .update(emailThreads)
      .set({ lastMessageAt: new Date(), clientId: client.id })
      .where(eq(emailThreads.id, threadId));
  }

  const [message] = await db
    .insert(emailMessages)
    .values({
      threadId,
      direction: "inbound",
      fromEmail,
      toEmails,
      ccEmails: data.cc || [],
      subject,
      textBody: data.text || null,
      htmlBody: data.html || null,
      resendId: emailId,
      messageId,
      inReplyTo,
      status: "received",
      readAt: null,
    })
    .returning();

  // Attachments
  try {
    const atts = await resend.emails.receiving.attachments.list({ emailId });
    for (const att of atts.data?.data || []) {
      if (!att.download_url) continue;
      const res = await fetch(att.download_url);
      const buf = Buffer.from(await res.arrayBuffer());
      const url = await storeFile(
        `email/${message.id}/${att.filename || "attachment"}`,
        buf,
        att.content_type || "application/octet-stream",
      );
      await db.insert(emailAttachments).values({
        messageId: message.id,
        filename: att.filename || "attachment",
        contentType: att.content_type || null,
        size: buf.length,
        storageUrl: url,
      });
    }
  } catch (err) {
    console.warn("[inbound] attachments", err);
  }

  await addActivity(client.id, "email", `Received: ${subject}`, message.id);
  return message;
}
