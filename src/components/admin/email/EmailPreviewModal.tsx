"use client";

import { useEffect } from "react";
import EmailPreview from "@/components/admin/email/EmailPreview";
import type { EmailSettings } from "@/lib/email/templates/render";

export default function EmailPreviewModal({
  open,
  onClose,
  bodyHtml,
  subject,
  brandOverrides,
  title = "Email preview",
}: {
  open: boolean;
  onClose: () => void;
  bodyHtml: string;
  subject?: string;
  brandOverrides?: Partial<EmailSettings>;
  title?: string;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col border border-white/15 bg-[#141414] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-white">{title}</h2>
            {subject ? (
              <p className="mt-0.5 truncate text-xs text-white/40">{subject}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 px-2 py-1 text-sm text-white/50 hover:text-white"
            aria-label="Close preview"
          >
            ✕
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <EmailPreview
            bodyHtml={bodyHtml}
            subject={subject}
            brandOverrides={brandOverrides}
            iframeClassName="h-[min(70vh,560px)] w-full bg-[#f4f2ed]"
          />
        </div>
      </div>
    </div>
  );
}
