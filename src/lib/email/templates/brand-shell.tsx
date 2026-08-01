import type { ReactNode } from "react";
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

const DEFAULT_GOLD = "#e6c47a";
const INK = "#171717";
const MUTED = "#6b6560";
const BG = "#f4f2ed";
const CARD = "#ffffff";
const DEFAULT_HEADER_BG = "#0c0c0c";

export type BrandShellProps = {
  previewText?: string;
  fromName: string;
  siteUrl: string;
  headerTitle?: string | null;
  headerTagline?: string | null;
  headerBg?: string | null;
  accentColor?: string | null;
  logoUrl?: string | null;
  signatureHtml?: string | null;
  footerHtml?: string | null;
  showSiteInFooter?: boolean;
  children: ReactNode;
};

export function BrandShell({
  previewText,
  fromName,
  siteUrl,
  headerTitle,
  headerTagline,
  headerBg,
  accentColor,
  logoUrl,
  signatureHtml,
  footerHtml,
  showSiteInFooter = true,
  children,
}: BrandShellProps) {
  const host = siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");
  const title = (headerTitle || fromName).trim() || fromName;
  const gold = accentColor || DEFAULT_GOLD;
  const headerBackground = headerBg || DEFAULT_HEADER_BG;

  return (
    <Html>
      <Head />
      {previewText ? <Preview>{previewText}</Preview> : null}
      <Body
        style={{
          backgroundColor: BG,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
          margin: 0,
          padding: "24px 12px",
        }}
      >
        <Container
          style={{
            backgroundColor: CARD,
            border: "1px solid #e5e1d8",
            margin: "0 auto",
            maxWidth: "560px",
          }}
        >
          <Section
            style={{
              backgroundColor: headerBackground,
              padding: "22px 28px",
            }}
          >
            {logoUrl ? (
              <Img
                src={logoUrl}
                alt={title}
                width={140}
                style={{ display: "block", marginBottom: headerTagline ? 10 : 0, maxWidth: "140px" }}
              />
            ) : (
              <Text
                style={{
                  color: gold,
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.22em",
                  margin: 0,
                  textTransform: "uppercase",
                }}
              >
                {title}
              </Text>
            )}
            {headerTagline ? (
              <Text
                style={{
                  color: "rgba(255,255,255,0.55)",
                  fontSize: "12px",
                  margin: "8px 0 0",
                }}
              >
                {headerTagline}
              </Text>
            ) : null}
          </Section>

          <Section style={{ color: INK, fontSize: "15px", lineHeight: "1.65", padding: "28px" }}>
            {children}
            {signatureHtml ? (
              <Section style={{ marginTop: "28px" }}>
                <div dangerouslySetInnerHTML={{ __html: signatureHtml }} />
              </Section>
            ) : (
              <Text style={{ color: MUTED, fontSize: "14px", margin: "28px 0 0" }}>
                — {fromName}
              </Text>
            )}
          </Section>

          <Hr style={{ borderColor: "#e5e1d8", margin: 0 }} />
          <Section style={{ padding: "16px 28px" }}>
            {footerHtml ? (
              <div
                dangerouslySetInnerHTML={{ __html: footerHtml }}
                style={{ color: MUTED, fontSize: "12px", lineHeight: 1.5 }}
              />
            ) : null}
            {showSiteInFooter ? (
              <Text
                style={{
                  color: MUTED,
                  fontSize: "12px",
                  margin: footerHtml ? "10px 0 0" : 0,
                }}
              >
                <Link href={siteUrl} style={{ color: MUTED, textDecoration: "underline" }}>
                  {host}
                </Link>
              </Text>
            ) : null}
            {!footerHtml && !showSiteInFooter ? (
              <Text style={{ color: MUTED, fontSize: "12px", margin: 0 }}>{fromName}</Text>
            ) : null}
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export function CtaButton({
  href,
  label,
  accentColor,
}: {
  href: string;
  label: string;
  accentColor?: string | null;
}) {
  return (
    <Section style={{ margin: "24px 0" }}>
      <Link
        href={href}
        style={{
          backgroundColor: accentColor || DEFAULT_GOLD,
          color: "#000000",
          display: "inline-block",
          fontSize: "14px",
          fontWeight: 700,
          padding: "12px 20px",
          textDecoration: "none",
        }}
      >
        {label}
      </Link>
    </Section>
  );
}
