import type { ReactNode } from "react";
import { render } from "@react-email/render";
import { Text } from "@react-email/components";
import { getSetting } from "@/lib/content";
import { getAppUrl } from "@/lib/env";
import { BrandShell } from "./brand-shell";

export type EmailSettings = {
  fromName?: string;
  fromEmail?: string;
  headerTitle?: string;
  headerTagline?: string;
  headerBg?: string;
  accentColor?: string;
  logoUrl?: string;
  signatureHtml?: string;
  footerHtml?: string;
  showSiteInFooter?: boolean;
};

export async function getEmailBrandContext(overrides?: Partial<EmailSettings>) {
  const { sanitizeEmailHtml } = await import("@/lib/email/sanitize");
  const emailSettings = await getSetting<EmailSettings>("email");
  const merged: EmailSettings = { ...emailSettings, ...overrides };
  return {
    fromName: merged.fromName || "Ryan Tang",
    fromEmail:
      merged.fromEmail ||
      process.env.RESEND_FROM_EMAIL ||
      "onboarding@resend.dev",
    headerTitle: merged.headerTitle || merged.fromName || "Ryan Tang",
    headerTagline: merged.headerTagline || "",
    headerBg: merged.headerBg || "#0c0c0c",
    accentColor: merged.accentColor || "#e6c47a",
    logoUrl: merged.logoUrl || "",
    signatureHtml: merged.signatureHtml
      ? sanitizeEmailHtml(merged.signatureHtml)
      : null,
    footerHtml: merged.footerHtml ? sanitizeEmailHtml(merged.footerHtml) : null,
    showSiteInFooter: merged.showSiteInFooter !== false,
    siteUrl: getAppUrl(),
  };
}

function BodyHtml({ html }: { html: string }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

function shellFromBrand(
  brand: Awaited<ReturnType<typeof getEmailBrandContext>>,
  children: ReactNode,
  opts?: { preheader?: string; includeSignature?: boolean },
) {
  return (
    <BrandShell
      previewText={opts?.preheader}
      fromName={brand.fromName}
      siteUrl={brand.siteUrl}
      headerTitle={brand.headerTitle}
      headerTagline={brand.headerTagline || null}
      headerBg={brand.headerBg}
      accentColor={brand.accentColor}
      logoUrl={brand.logoUrl || null}
      signatureHtml={opts?.includeSignature === false ? null : brand.signatureHtml}
      footerHtml={brand.footerHtml}
      showSiteInFooter={brand.showSiteInFooter}
    >
      {children}
    </BrandShell>
  );
}

export async function renderBrandedEmail(opts: {
  bodyHtml: string;
  preheader?: string;
  includeSignature?: boolean;
  brandOverrides?: Partial<EmailSettings>;
}): Promise<{ html: string; text: string }> {
  const brand = await getEmailBrandContext(opts.brandOverrides);
  const element = shellFromBrand(
    brand,
    <BodyHtml html={opts.bodyHtml} />,
    opts,
  );

  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);
  return { html, text };
}

export async function renderBrandedComponent(
  children: ReactNode,
  opts?: {
    preheader?: string;
    includeSignature?: boolean;
    brandOverrides?: Partial<EmailSettings>;
  },
): Promise<{ html: string; text: string }> {
  const brand = await getEmailBrandContext(opts?.brandOverrides);
  const element = shellFromBrand(brand, children, opts);

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
