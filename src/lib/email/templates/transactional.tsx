import { Link, Section, Text } from "@react-email/components";
import { CtaButton } from "./brand-shell";
import { getEmailBrandContext, renderBrandedComponent } from "./render";

export async function renderInvoiceEmail(opts: {
  clientName: string;
  invoiceNumber: string;
  amountLabel: string;
  payUrl: string;
}) {
  const brand = await getEmailBrandContext();
  return renderBrandedComponent(
    <>
      <Text style={{ margin: "0 0 12px" }}>Hi {opts.clientName},</Text>
      <Text style={{ margin: "0 0 12px" }}>
        Please find your invoice <strong>{opts.invoiceNumber}</strong> for{" "}
        <strong>{opts.amountLabel}</strong>. A PDF is attached for your records.
      </Text>
      <CtaButton href={opts.payUrl} label="Pay online" accentColor={brand.accentColor} />
      <Text style={{ color: "#6b6560", fontSize: "13px", margin: "16px 0 0" }}>
        Or open this link:{" "}
        <Link href={opts.payUrl} style={{ color: "#6b6560" }}>
          {opts.payUrl}
        </Link>
      </Text>
    </>,
    { preheader: `Invoice ${opts.invoiceNumber} — ${opts.amountLabel}` },
  );
}

export async function renderContractEmail(opts: {
  clientName: string;
  title: string;
  signUrl: string;
}) {
  const brand = await getEmailBrandContext();
  return renderBrandedComponent(
    <>
      <Text style={{ margin: "0 0 12px" }}>Hi {opts.clientName},</Text>
      <Text style={{ margin: "0 0 12px" }}>
        Please review and sign the agreement <strong>{opts.title}</strong>.
      </Text>
      <CtaButton href={opts.signUrl} label="Review & sign" accentColor={brand.accentColor} />
      <Text style={{ color: "#6b6560", fontSize: "13px", margin: "16px 0 0" }}>
        Or open this link:{" "}
        <Link href={opts.signUrl} style={{ color: "#6b6560" }}>
          {opts.signUrl}
        </Link>
      </Text>
    </>,
    { preheader: `Please sign: ${opts.title}` },
  );
}

export async function renderPortalInviteEmail(opts: {
  clientName: string;
  inviteUrl: string;
  projectName?: string;
  services?: string[];
  expiresDays: number;
}) {
  const brand = await getEmailBrandContext();
  return renderBrandedComponent(
    <>
      <Text style={{ margin: "0 0 12px" }}>Hi {opts.clientName},</Text>
      <Text style={{ margin: "0 0 12px" }}>
        You&apos;re invited to your client portal
        {opts.projectName ? (
          <>
            {" "}
            for <strong>{opts.projectName}</strong>
          </>
        ) : null}
        .
      </Text>
      {opts.services && opts.services.length > 0 ? (
        <Text style={{ margin: "0 0 12px" }}>
          <strong>Services:</strong> {opts.services.join(", ")}
        </Text>
      ) : null}
      <Text style={{ margin: "0 0 12px" }}>
        Use the button below to set your password and get started. This link expires in{" "}
        {opts.expiresDays} days.
      </Text>
      <CtaButton href={opts.inviteUrl} label="Set up portal" accentColor={brand.accentColor} />
    </>,
    {
      preheader: opts.projectName
        ? `Set up your portal — ${opts.projectName}`
        : "Set up your client portal",
    },
  );
}

export async function renderPortalMessageEmail(opts: {
  clientName: string;
  clientEmail: string;
  projectName: string;
  body: string;
}) {
  const bodyHtml = opts.body
    .split(/\n{2,}/)
    .map((block) => `<p style="margin:0 0 12px">${block.replace(/\n/g, "<br/>")}</p>`)
    .join("");

  return renderBrandedComponent(
    <>
      <Text style={{ margin: "0 0 8px" }}>
        <strong>From:</strong> {opts.clientName} &lt;{opts.clientEmail}&gt;
      </Text>
      <Text style={{ margin: "0 0 16px" }}>
        <strong>Project:</strong> {opts.projectName}
      </Text>
      <Section>
        <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
      </Section>
    </>,
    {
      preheader: `Portal message from ${opts.clientName}`,
      includeSignature: false,
    },
  );
}
