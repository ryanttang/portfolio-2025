"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  linkThreadClientAction,
  markThreadReadAction,
  sendInboxEmailAction,
  uploadEmailAttachmentAction,
} from "@/app/admin/actions/content";
import RichTextEditor from "@/components/admin/email/RichTextEditor";
import EmailPreviewModal from "@/components/admin/email/EmailPreviewModal";
import TemplatePicker, {
  type TemplateOption,
} from "@/components/admin/email/TemplatePicker";
import HtmlMessageBody from "@/components/admin/email/HtmlMessageBody";
import { MERGE_FIELD_OPTIONS } from "@/lib/email/merge";

type Thread = {
  id: string;
  subject: string;
  clientId: string | null;
  lastMessageAt: string;
  participants: string[];
  unreadCount?: number;
};

type Attachment = {
  id: string;
  messageId: string;
  filename: string;
  contentType: string | null;
  size: number | null;
  storageUrl: string;
};

type Message = {
  id: string;
  threadId: string;
  direction: string;
  fromEmail: string;
  toEmails: string[];
  subject: string;
  textBody: string | null;
  htmlBody: string | null;
  messageId: string | null;
  status: string;
  createdAt: string;
};

type PendingAttachment = {
  filename: string;
  contentBase64: string;
  contentType?: string;
  storageUrl?: string;
  size: number;
};

function formatThreadWhen(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const date = d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const time = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${date} · ${time}`;
}

export default function InboxClient({
  threads,
  initialThreadId,
  initialMessages,
  attachments,
  templates,
  composeOpen,
  defaultTo,
  clientNameById,
}: {
  threads: Thread[];
  initialThreadId: string | null;
  initialMessages: Message[];
  attachments: Attachment[];
  templates: TemplateOption[];
  composeOpen: boolean;
  defaultTo: string;
  clientNameById: Record<string, string>;
}) {
  const router = useRouter();
  const [showCompose, setShowCompose] = useState(composeOpen);
  const [to, setTo] = useState(defaultTo);
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("<p></p>");
  const [replyBody, setReplyBody] = useState("<p></p>");
  const [status, setStatus] = useState("");
  const [pendingFiles, setPendingFiles] = useState<PendingAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<"compose" | "reply" | null>(null);

  const attachmentsByMessage = useMemo(() => {
    const map = new Map<string, Attachment[]>();
    for (const a of attachments) {
      const list = map.get(a.messageId) || [];
      list.push(a);
      map.set(a.messageId, list);
    }
    return map;
  }, [attachments]);

  const activeThread = threads.find((t) => t.id === initialThreadId) || null;

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      const next: PendingAttachment[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.set("file", file);
        const result = await uploadEmailAttachmentAction(fd);
        if (!result.ok) {
          setStatus(result.error || "Upload failed");
          continue;
        }
        next.push({
          filename: result.filename,
          contentBase64: result.contentBase64,
          contentType: result.contentType,
          storageUrl: result.storageUrl,
          size: result.size,
        });
      }
      setPendingFiles((prev) => [...prev, ...next]);
    } finally {
      setUploading(false);
    }
  }

  async function send() {
    setStatus("Sending…");
    const result = await sendInboxEmailAction({
      to,
      cc,
      subject,
      html: body,
      attachments: pendingFiles,
    });
    if (!result.ok) {
      setStatus(result.error || "Failed");
      return;
    }
    setStatus("Sent");
    setShowCompose(false);
    setBody("<p></p>");
    setSubject("");
    setPendingFiles([]);
    router.push(`/admin/inbox?thread=${result.threadId}`);
    router.refresh();
  }

  async function openThread(id: string) {
    await markThreadReadAction(id);
    setShowCompose(false);
    router.push(`/admin/inbox?thread=${id}`);
    router.refresh();
  }

  async function reply() {
    if (!initialThreadId || !replyBody.replace(/<[^>]+>/g, "").trim()) return;
    const lastInbound = [...initialMessages].reverse().find((m) => m.direction === "inbound");
    const last = initialMessages[initialMessages.length - 1];
    const replyTo =
      lastInbound?.fromEmail || last?.toEmails?.[0] || "";
    setStatus("Sending…");
    const result = await sendInboxEmailAction({
      to: replyTo,
      subject: last?.subject?.startsWith("Re:") ? last.subject : `Re: ${last?.subject || ""}`,
      html: replyBody,
      threadId: initialThreadId,
      inReplyTo: last?.messageId || undefined,
      clientId: activeThread?.clientId,
      attachments: pendingFiles,
    });
    if (!result.ok) {
      setStatus(result.error || "Failed");
      return;
    }
    setReplyBody("<p></p>");
    setPendingFiles([]);
    setStatus("Sent");
    router.refresh();
  }

  function applyTemplate(t: TemplateOption) {
    setSubject(t.subject);
    setBody(t.bodyHtml);
  }

  function insertMergeToken(token: string) {
    setBody((prev) => {
      if (!prev || prev === "<p></p>") return `<p>${token}</p>`;
      return prev.replace(/<\/p>\s*$/i, ` ${token}</p>`);
    });
  }

  async function linkClient() {
    if (!activeThread) return;
    const email =
      [...initialMessages].reverse().find((m) => m.direction === "inbound")?.fromEmail ||
      activeThread.participants.find((p) => !p.includes("ryantang")) ||
      activeThread.participants[0];
    if (!email) return;
    setStatus("Linking…");
    const result = await linkThreadClientAction(activeThread.id, email);
    if (result.ok) {
      setStatus("Client linked");
      router.refresh();
    }
  }

  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-[280px_1fr]">
      <div className="border border-white/10 bg-[#141414]">
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
          <span className="text-xs uppercase tracking-wider text-white/40">Threads</span>
          <div className="flex items-center gap-3">
            <Link href="/admin/inbox/templates" className="text-xs text-white/40 hover:text-white/70">
              Templates
            </Link>
            <button
              type="button"
              onClick={() => {
                setShowCompose(true);
              }}
              className="text-xs text-[#fdf0d5]"
            >
              Compose
            </button>
          </div>
        </div>
        <ul className="max-h-[70vh] overflow-y-auto divide-y divide-white/5">
          {threads.length === 0 && (
            <li className="px-3 py-6 text-sm text-white/40">No messages yet.</li>
          )}
          {threads.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => openThread(t.id)}
                className={`w-full px-3 py-3 text-left text-sm hover:bg-white/5 ${
                  initialThreadId === t.id ? "bg-white/10" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p
                    className={`min-w-0 truncate ${
                      (t.unreadCount ?? 0) > 0
                        ? "font-semibold text-white"
                        : "font-medium text-white/90"
                    }`}
                  >
                    {t.subject}
                  </p>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {(t.unreadCount ?? 0) > 0 && (
                      <span className="rounded-full bg-[#fdf0d5] px-1.5 py-0.5 text-[10px] font-semibold leading-none text-black">
                        {t.unreadCount}
                      </span>
                    )}
                    <time
                      dateTime={t.lastMessageAt}
                      className="whitespace-nowrap text-[10px] tabular-nums text-white/35"
                      title={new Date(t.lastMessageAt).toLocaleString()}
                    >
                      {formatThreadWhen(t.lastMessageAt)}
                    </time>
                  </div>
                </div>
                <p className="truncate text-xs text-white/40">
                  {t.clientId && clientNameById[t.clientId]
                    ? clientNameById[t.clientId]
                    : t.participants?.join(", ")}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="border border-white/10 bg-[#141414] p-4 min-h-[400px]">
        {showCompose ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Compose</h2>
              <button
                type="button"
                onClick={() => setPreview("compose")}
                className="border border-white/15 px-2.5 py-1 text-xs text-white/60 hover:text-[#fdf0d5]"
              >
                Preview
              </button>
            </div>
            <TemplatePicker templates={templates} onSelect={applyTemplate} />
            <input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="To"
              className="w-full border border-white/15 bg-black/40 px-3 py-2 text-sm"
            />
            <input
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              placeholder="Cc (optional)"
              className="w-full border border-white/15 bg-black/40 px-3 py-2 text-sm"
            />
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              className="w-full border border-white/15 bg-black/40 px-3 py-2 text-sm"
            />
            <div className="flex flex-wrap gap-1">
              {MERGE_FIELD_OPTIONS.map((f) => (
                <button
                  key={f.token}
                  type="button"
                  onClick={() => insertMergeToken(f.token)}
                  className="border border-white/15 px-2 py-0.5 text-[10px] text-white/50 hover:text-[#fdf0d5]"
                >
                  {f.label}
                </button>
              ))}
            </div>
            <RichTextEditor value={body} onChange={setBody} />
            <div className="flex flex-wrap items-center gap-3">
              <label className="cursor-pointer border border-white/20 px-3 py-1.5 text-xs text-white/70">
                {uploading ? "Uploading…" : "Attach files"}
                <input
                  type="file"
                  multiple
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    void uploadFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
              {pendingFiles.map((f) => (
                <span key={f.filename + f.size} className="text-xs text-white/50">
                  {f.filename}
                  <button
                    type="button"
                    className="ml-1 text-white/30 hover:text-white"
                    onClick={() =>
                      setPendingFiles((prev) => prev.filter((x) => x !== f))
                    }
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={send}
                className="bg-[#fdf0d5] px-4 py-2 text-sm font-semibold text-black"
              >
                Send
              </button>
              <button
                type="button"
                onClick={() => setShowCompose(false)}
                className="px-4 py-2 text-sm text-white/50"
              >
                Cancel
              </button>
            </div>
            {status && <p className="text-sm text-white/50">{status}</p>}
          </div>
        ) : !initialThreadId ? (
          <p className="text-sm text-white/40">Select a thread or compose a message.</p>
        ) : (
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div>
                <h2 className="text-sm font-semibold">{activeThread?.subject}</h2>
                {activeThread?.clientId ? (
                  <Link
                    href={`/admin/crm/${activeThread.clientId}`}
                    className="text-xs text-[#fdf0d5] hover:underline"
                  >
                    {clientNameById[activeThread.clientId] || "View client"}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={linkClient}
                    className="text-xs text-white/40 hover:text-[#fdf0d5]"
                  >
                    Create / link client
                  </button>
                )}
              </div>
            </div>
            <div className="flex min-h-[min(70vh,760px)] flex-col">
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
                {initialMessages.map((m) => (
                  <div
                    key={m.id}
                    className={`border border-white/10 p-3 ${
                      m.direction === "outbound" ? "bg-white/[0.03]" : ""
                    }`}
                  >
                    <div className="flex justify-between gap-2 text-xs text-white/40">
                      <span>
                        {m.direction === "outbound" ? "You" : m.fromEmail} →{" "}
                        {m.toEmails.join(", ")}
                      </span>
                      <span>{new Date(m.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="mt-1 text-sm font-medium">{m.subject}</p>
                    <HtmlMessageBody htmlBody={m.htmlBody} textBody={m.textBody} />
                    {(attachmentsByMessage.get(m.id) || []).length > 0 && (
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {(attachmentsByMessage.get(m.id) || []).map((a) => (
                          <li key={a.id}>
                            <a
                              href={a.storageUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="border border-white/15 px-2 py-1 text-xs text-[#fdf0d5] hover:bg-white/5"
                            >
                              {a.filename}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-4 shrink-0 border-t border-white/10 pt-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs uppercase tracking-wider text-white/40">Reply</span>
                  <button
                    type="button"
                    onClick={() => setPreview("reply")}
                    className="border border-white/15 px-2.5 py-1 text-xs text-white/60 hover:text-[#fdf0d5]"
                  >
                    Preview
                  </button>
                </div>
                <RichTextEditor
                  value={replyBody}
                  onChange={setReplyBody}
                  placeholder="Reply…"
                  minHeight="100px"
                />
                <div className="flex flex-wrap items-center gap-3">
                  <label className="cursor-pointer border border-white/20 px-3 py-1.5 text-xs text-white/70">
                    {uploading ? "Uploading…" : "Attach"}
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      disabled={uploading}
                      onChange={(e) => {
                        void uploadFiles(e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {pendingFiles.map((f) => (
                    <span key={f.filename + f.size} className="text-xs text-white/50">
                      {f.filename}
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={reply}
                  className="bg-[#fdf0d5] px-4 py-2 text-sm font-semibold text-black"
                >
                  Reply
                </button>
                {status && <p className="text-sm text-white/50">{status}</p>}
              </div>
            </div>
          </div>
        )}
      </div>

      <EmailPreviewModal
        open={preview === "compose"}
        onClose={() => setPreview(null)}
        bodyHtml={body}
        subject={subject}
        title="Compose preview"
      />
      <EmailPreviewModal
        open={preview === "reply"}
        onClose={() => setPreview(null)}
        bodyHtml={replyBody}
        subject={activeThread?.subject}
        title="Reply preview"
      />
    </div>
  );
}
