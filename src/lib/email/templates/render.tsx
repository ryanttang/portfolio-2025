import type { ReactNode } from "react";
import { render } from "@react-email/render";
import { Text } from "@react-email/components";
import { getSetting } from "@/lib/content";
import { getAppUrl } from "@/lib/env";
import { BrandShell } from "./brand-shell";

export type EmailSettings = {
  fromName?: string;
  fromEmail?: string;
  signatureHtml?: string;
};

export async function getEmailBrandContext() {
  const emailSettings = await getSetting<EmailSettings>("email");
  return {
    fromName: emailSettings?.fromName || "Ryan Tang",
    fromEmail:
      emailSettings?.fromEmail ||
      process.env.RESEND_FROM_EMAIL ||
      "onboarding@resend.dev",
    signatureHtml: emailSettings?.signatureHtml || null,
    siteUrl: getAppUrl(),
  };
}

function BodyHtml({ html }: { html: string }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

export async function renderBrandedEmail(opts: {
  bodyHtml: string;
  preheader?: string;
  includeSignature?: boolean;
}): Promise<{ html: string; text: string }> {
  const brand = await getEmailBrandContext();
  const element = (
    <BrandShell
      previewText={opts.preheader}
      fromName={brand.fromName}
      siteUrl={brand.siteUrl}
      signatureHtml={opts.includeSignature === false ? null : brand.signatureHtml}
    >
      <BodyHtml html={opts.bodyHtml} />
    </BrandShell>
  );

  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);
  return { html, text };
}

export async function renderBrandedComponent(
  children: ReactNode,
  opts?: { preheader?: string; includeSignature?: boolean },
): Promise<{ html: string; text: string }> {
  const brand = await getEmailBrandContext();
  const element = (
    <BrandShell
      previewText={opts?.preheader}
      fromName={brand.fromName}
      siteUrl={brand.siteUrl}
      signatureHtml={opts?.includeSignature === false ? null : brand.signatureHtml}
    >
      {children}
    </BrandShell>
  );

  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);
  return { html, text };
}

/** Lightweight HTML → plain text for stored body without full shell. */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<a[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, "$2 ($1)")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function paragraphHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((block) => `<p>${block.replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

export { Text };
