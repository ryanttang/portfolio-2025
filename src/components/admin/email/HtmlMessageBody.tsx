"use client";

/**
 * Renders stored email HTML inside a sandboxed iframe.
 * Sanitization happens on write (compose/send); the iframe sandbox is the client-side guard.
 */
export default function HtmlMessageBody({
  htmlBody,
  textBody,
}: {
  htmlBody: string | null;
  textBody: string | null;
}) {
  if (htmlBody) {
    return (
      <iframe
        title="Message"
        sandbox=""
        srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{margin:0;padding:8px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;line-height:1.55;color:#e8e4dc;background:transparent}a{color:#e6c47a}img{max-width:100%;height:auto}</style></head><body>${htmlBody}</body></html>`}
        className="mt-2 min-h-[80px] w-full border-0"
        style={{ height: "auto" }}
        onLoad={(e) => {
          const iframe = e.currentTarget;
          try {
            const doc = iframe.contentDocument;
            if (doc?.body) {
              iframe.style.height = `${Math.max(doc.body.scrollHeight + 16, 80)}px`;
            }
          } catch {
            /* sandbox may block */
          }
        }}
      />
    );
  }

  return (
    <pre className="mt-2 whitespace-pre-wrap font-sans text-sm text-white/80">
      {textBody || "(no text body)"}
    </pre>
  );
}
