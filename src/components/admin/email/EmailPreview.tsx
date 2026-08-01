"use client";

import { useEffect, useState } from "react";
import { previewBrandedEmailAction } from "@/app/admin/actions/content";
import type { EmailSettings } from "@/lib/email/templates/render";

export default function EmailPreview({
  bodyHtml,
  subject,
  brandOverrides,
  iframeClassName = "h-[420px] w-full bg-[#f4f2ed]",
}: {
  bodyHtml: string;
  subject?: string;
  brandOverrides?: Partial<EmailSettings>;
  iframeClassName?: string;
}) {
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const overridesKey = JSON.stringify(brandOverrides || {});

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (!bodyHtml.trim()) {
        setHtml("");
        return;
      }
      setLoading(true);
      setError("");
      try {
        const result = await previewBrandedEmailAction(
          bodyHtml,
          subject,
          brandOverrides,
        );
        if (!cancelled) {
          if (result.ok) setHtml(result.html);
          else setError(result.error || "Preview failed");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Preview failed");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- overridesKey serializes brandOverrides
  }, [bodyHtml, subject, overridesKey]);

  if (!bodyHtml.trim()) {
    return (
      <div className="border border-white/10 bg-[#141414] px-4 py-10 text-center text-sm text-white/40">
        Start writing to preview the branded email.
      </div>
    );
  }

  return (
    <div className="border border-white/10 bg-white">
      {loading && (
        <p className="border-b border-black/10 px-3 py-1.5 text-xs text-black/40">
          Updating preview…
        </p>
      )}
      {error && (
        <p className="border-b border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700">
          {error}
        </p>
      )}
      <iframe
        title="Email preview"
        sandbox=""
        srcDoc={html}
        className={iframeClassName}
      />
    </div>
  );
}
