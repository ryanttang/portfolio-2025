import type { ReactNode } from "react";
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

const GOLD = "#e6c47a";
const INK = "#171717";
const MUTED = "#6b6560";
const BG = "#f4f2ed";
const CARD = "#ffffff";
const HEADER_BG = "#0c0c0c";

export type BrandShellProps = {
  previewText?: string;
  fromName: string;
  siteUrl: string;
  signatureHtml?: string | null;
  children: ReactNode;
};

export function BrandShell({
  previewText,
  fromName,
  siteUrl,
  signatureHtml,
  children,
}: BrandShellProps) {
  const host = siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");

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
          padding: "32px 12px",
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
              backgroundColor: HEADER_BG,
              padding: "22px 28px",
            }}
          >
            <Text
              style={{
                color: GOLD,
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.22em",
                margin: 0,
                textTransform: "uppercase",
              }}
            >
              {fromName}
            </Text>
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
            <Text style={{ color: MUTED, fontSize: "12px", margin: 0 }}>
              <Link href={siteUrl} style={{ color: MUTED, textDecoration: "underline" }}>
                {host}
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export function CtaButton({ href, label }: { href: string; label: string }) {
  return (
    <Section style={{ margin: "24px 0" }}>
      <Link
        href={href}
        style={{
          backgroundColor: GOLD,
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
