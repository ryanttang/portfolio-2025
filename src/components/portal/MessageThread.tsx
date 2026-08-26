"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { markThreadReadAction, postMessageAction } from "@/app/portal/actions/hub";

export default function MessageThread({
  onboardingId,
  messages,
}: {
  onboardingId: string;
  messages: {
    id: string;
    senderType: string;
    subject: string | null;
    body: string;
    createdAt: Date;
  }[];
}) {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    void markThreadReadAction(onboardingId);
  }, [onboardingId]);

  return (
    <div>
      <ul className="max-h-80 space-y-3 overflow-y-auto">
        {messages.map((m) => (
          <li
            key={m.id}
            className={`border p-3 text-sm ${
              m.senderType === "admin"
                ? "border-[#fdf0d5]/20 bg-[#fdf0d5]/5"
                : "border-white/10 bg-black/20 ml-6"
            }`}
          >
            <p className="text-[10px] uppercase tracking-wider text-white/40">
              {m.senderType === "admin" ? "Ryan" : "You"} · {m.createdAt.toLocaleString()}
            </p>
            {m.subject && <p className="mt-1 font-medium">{m.subject}</p>}
            <p className="mt-1 whitespace-pre-wrap text-white/70">{m.body}</p>
          </li>
        ))}
        {messages.length === 0 && (
          <li className="text-sm text-white/40">No messages yet. Send one below.</li>
        )}
      </ul>
      <form
        className="mt-4 space-y-3 border border-white/10 bg-[#141414] p-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setLoading(true);
          setStatus("");
          try {
            await postMessageAction(onboardingId, { subject, body });
            setSubject("");
            setBody("");
            setStatus("Message sent.");
            router.refresh();
          } catch (err) {
            setStatus(err instanceof Error ? err.message : "Failed to send.");
          }
          setLoading(false);
        }}
      >
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject (optional)"
          className="w-full border border-white/15 bg-black/40 px-3 py-2 text-sm"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          rows={3}
          placeholder="Your message…"
          className="w-full border border-white/15 bg-black/40 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-[#fdf0d5] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
        >
          {loading ? "Sending…" : "Send message"}
        </button>
        {status && <p className="text-sm text-white/50">{status}</p>}
      </form>
    </div>
  );
}
