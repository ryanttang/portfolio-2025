"use client";

import { useCallback, useEffect, useRef } from "react";

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
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const isBranded = Boolean(
    htmlBody &&
      (/<!DOCTYPE/i.test(htmlBody) ||
        /<html[\s>]/i.test(htmlBody) ||
        /background-color:\s*#f4f2ed/i.test(htmlBody) ||
        /max-width:\s*560px/i.test(htmlBody)),
  );

  const fitHeight = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    try {
      const doc = iframe.contentDocument;
      if (!doc?.documentElement) return;
      const body = doc.body;
      const contentH = isBranded
        ? Math.max(
            body?.scrollHeight ?? 0,
            doc.documentElement.scrollHeight,
          )
        : Math.max(body?.scrollHeight ?? 0, body?.offsetHeight ?? 0);
      const pad = isBranded ? 4 : 8;
      const min = isBranded ? 160 : 64;
      iframe.style.height = `${Math.max(contentH + pad, min)}px`;
    } catch {
      /* sandbox may block */
    }
  }, [isBranded]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    let clearTimers: (() => void) | undefined;

    function onLoad() {
      const el = iframeRef.current;
      if (!el) return;
      fitHeight();
      try {
        const doc = el.contentDocument;
        if (!doc) return;
        const imgs = Array.from(doc.images || []);
        for (const img of imgs) {
          if (!img.complete) img.addEventListener("load", fitHeight, { once: true });
        }
        requestAnimationFrame(() => {
          fitHeight();
          requestAnimationFrame(fitHeight);
        });
        const t1 = window.setTimeout(fitHeight, 50);
        const t2 = window.setTimeout(fitHeight, 200);
        clearTimers = () => {
          window.clearTimeout(t1);
          window.clearTimeout(t2);
        };
      } catch {
        /* ignore */
      }
    }

    iframe.addEventListener("load", onLoad);
    if (iframe.contentDocument?.readyState === "complete") onLoad();
    return () => {
      iframe.removeEventListener("load", onLoad);
      clearTimers?.();
    };
  }, [fitHeight, htmlBody]);

  if (htmlBody) {
    const srcDoc = isBranded
      ? injectAdminThreadStyles(htmlBody)
      : `<!DOCTYPE html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0}body{padding:8px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;line-height:1.55;color:#e8e4dc;background:transparent}a{color:#fdf0d5}img{max-width:100%;height:auto}</style></head><body>${htmlBody}</body></html>`;

    return (
      <div
        className={
          isBranded
            ? "mt-3 border border-white/10 bg-[#f4f2ed]"
            : "mt-2"
        }
      >
        <iframe
          ref={iframeRef}
          title="Message"
          // allow-same-origin needed to measure content height; no scripts allowed
          sandbox="allow-same-origin"
          srcDoc={srcDoc}
          className={`w-full border-0 ${isBranded ? "min-h-[160px] bg-[#f4f2ed]" : "min-h-[64px]"}`}
          style={{ height: isBranded ? 200 : 96 }}
        />
      </div>
    );
  }

  return (
    <pre className="mt-2 whitespace-pre-wrap font-sans text-sm text-white/80">
      {textBody || "(no text body)"}
    </pre>
  );
}

/** Tighter outer padding when viewing branded shells in the admin thread. */
function injectAdminThreadStyles(html: string) {
  const style =
    "<style id=\"admin-thread-pad\">body{padding:16px 12px!important;box-sizing:border-box!important}</style>";
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head[^>]*>/i, (m) => `${m}${style}`);
  }
  return style + html;
}
