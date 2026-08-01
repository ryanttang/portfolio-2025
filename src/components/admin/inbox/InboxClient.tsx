"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  markThreadReadAction,
  sendInboxEmailAction,
} from "@/app/admin/actions/content";

type Thread = {
  id: string;
  subject: string;
  clientId: string | null;
  lastMessageAt: string;
  participants: string[];
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

export default function InboxClient({
  threads,
  initialThreadId,
  initialMessages,
  composeOpen,
  defaultTo,
}: {
  threads: Thread[];
  initialThreadId: string | null;
  initialMessages: Message[];
  composeOpen: boolean;
  defaultTo: string;
}) {
  const router = useRouter();
  const [showCompose, setShowCompose] = useState(composeOpen);
  const [to, setTo] = useState(defaultTo);
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("");
  const [replyBody, setReplyBody] = useState("");

  async function send() {
    setStatus("Sending…");
    const result = await sendInboxEmailAction({ to, cc, subject, body });
    if (!result.ok) {
      setStatus(result.error || "Failed");
      return;
    }
    setStatus("Sent");
    setShowCompose(false);
    setBody("");
    setSubject("");
    router.push(`/admin/inbox?thread=${result.threadId}`);
    router.refresh();
  }

  async function openThread(id: string) {
    await markThreadReadAction(id);
    router.push(`/admin/inbox?thread=${id}`);
    router.refresh();
  }

  async function reply() {
    if (!initialThreadId || !replyBody.trim()) return;
    const lastInbound = [...initialMessages].reverse().find((m) => m.direction === "inbound");
    const last = initialMessages[initialMessages.length - 1];
    const replyTo =
      lastInbound?.fromEmail ||
      last?.toEmails?.[0] ||
      "";
    const result = await sendInboxEmailAction({
      to: replyTo,
      subject: last?.subject?.startsWith("Re:") ? last.subject : `Re: ${last?.subject || ""}`,
      body: replyBody,
      threadId: initialThreadId,
      inReplyTo: last?.messageId || undefined,
    });
    if (!result.ok) {
      setStatus(result.error || "Failed");
      return;
    }
    setReplyBody("");
    router.refresh();
  }

  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-[280px_1fr]">
      <div className="border border-white/10 bg-[#141414]">
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
          <span className="text-xs uppercase tracking-wider text-white/40">Threads</span>
          <button
            type="button"
            onClick={() => setShowCompose(true)}
            className="text-xs text-[#e6c47a]"
          >
            Compose
          </button>
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
                <p className="truncate font-medium text-white/90">{t.subject}</p>
                <p className="truncate text-xs text-white/40">
                  {t.participants?.join(", ")}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="border border-white/10 bg-[#141414] p-4 min-h-[400px]">
        {showCompose ? (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold">Compose</h2>
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
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              placeholder="Message"
              className="w-full border border-white/15 bg-black/40 px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={send}
                className="bg-[#e6c47a] px-4 py-2 text-sm font-semibold text-black"
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
            <div className="space-y-4 max-h-[50vh] overflow-y-auto">
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
                  <pre className="mt-2 whitespace-pre-wrap font-sans text-sm text-white/80">
                    {m.textBody || "(no text body)"}
                  </pre>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t border-white/10 pt-4">
              <textarea
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                rows={4}
                placeholder="Reply…"
                className="w-full border border-white/15 bg-black/40 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={reply}
                className="mt-2 bg-[#e6c47a] px-4 py-2 text-sm font-semibold text-black"
              >
                Reply
              </button>
              {status && <p className="mt-2 text-sm text-white/50">{status}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
