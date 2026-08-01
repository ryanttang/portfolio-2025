"use client";

import { useState } from "react";
import { sendPortalMessageAction } from "@/app/portal/actions/onboarding";

export default function ProjectMessageForm({ onboardingId }: { onboardingId: string }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="mt-4 space-y-3 border border-white/10 bg-[#141414] p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus("");
        try {
          await sendPortalMessageAction(onboardingId, { subject, body });
          setSubject("");
          setBody("");
          setStatus("Message sent.");
        } catch (err) {
          setStatus(err instanceof Error ? err.message : "Failed to send.");
        }
        setLoading(false);
      }}
    >
      <input
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        required
        placeholder="Subject"
        className="w-full border border-white/15 bg-black/40 px-3 py-2 text-sm"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        required
        rows={4}
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
  );
}
