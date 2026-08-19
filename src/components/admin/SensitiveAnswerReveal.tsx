"use client";

import { useState } from "react";
import { revealSensitiveAnswerAction } from "@/app/admin/actions/onboarding";
import { adminUpsertAnswerAction } from "@/app/admin/actions/onboarding";

export default function SensitiveAnswerReveal({
  answerId,
  onboardingId,
  questionId,
  answerKey,
  filename,
}: {
  answerId: string;
  onboardingId: string;
  questionId: string | null;
  answerKey: string | null;
  filename?: string;
}) {
  const [revealed, setRevealed] = useState<unknown | null>(null);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function reveal() {
    setLoading(true);
    setError("");
    try {
      const result = await revealSensitiveAnswerAction(answerId);
      setRevealed(result.value);
      setVisible(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not decrypt.");
    } finally {
      setLoading(false);
    }
  }

  const value = revealed as {
    text?: string;
    url?: string;
    filename?: string;
    encryptedFile?: boolean;
    bool?: boolean;
    selected?: string[];
  } | null;

  return (
    <div className="mt-1">
      <p className="text-[10px] uppercase tracking-wider text-[#fdf0d5]/70">Encrypted</p>
      {!revealed ? (
        <button
          type="button"
          onClick={reveal}
          disabled={loading}
          className="mt-1 text-sm text-[#fdf0d5] hover:underline disabled:opacity-50"
        >
          {loading ? "Decrypting…" : filename ? `Reveal ${filename}` : "Reveal (admin only)"}
        </button>
      ) : (
        <div className="mt-2 space-y-2">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              className="text-xs text-white/50 hover:text-white/80"
            >
              {visible ? "Hide" : "Show"}
            </button>
            {typeof value?.text === "string" && (
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(value.text || "")}
                className="text-xs text-white/50 hover:text-white/80"
              >
                Copy
              </button>
            )}
          </div>
          {value?.encryptedFile || (value?.url && value?.filename) ? (
            <a
              href={`/api/admin/sensitive-files/${answerId}`}
              className="text-sm text-[#fdf0d5] hover:underline"
            >
              Download {value.filename || filename || "file"}
            </a>
          ) : typeof value?.text === "string" ? (
            visible ? (
              <textarea
                defaultValue={value.text}
                rows={3}
                onBlur={async (e) => {
                  if (e.target.value === value.text) return;
                  await adminUpsertAnswerAction({
                    onboardingId,
                    questionId,
                    key: answerKey,
                    value: { text: e.target.value },
                  });
                }}
                className="w-full border border-white/15 bg-black/40 px-2 py-1 text-sm"
              />
            ) : (
              <p className="font-mono text-sm tracking-widest text-white/50">••••••••••••</p>
            )
          ) : visible ? (
            <pre className="whitespace-pre-wrap text-sm text-white/70">
              {JSON.stringify(revealed, null, 2)}
            </pre>
          ) : (
            <p className="font-mono text-sm tracking-widest text-white/50">••••••••••••</p>
          )}
        </div>
      )}
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
}
