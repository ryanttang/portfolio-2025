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
        Use the button below to access your portal — set your password if this is your first time,
        or sign in directly if you already have one. This link expires in {opts.expiresDays} days.
      </Text>
      <CtaButton href={opts.inviteUrl} label="Access portal" accentColor={brand.accentColor} />
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

export async function renderPortalPasswordResetEmail(opts: {
  clientName: string;
  resetUrl: string;
  expiresHours: number;
}) {
  const brand = await getEmailBrandContext();
  return renderBrandedComponent(
    <>
      <Text style={{ margin: "0 0 12px" }}>Hi {opts.clientName},</Text>
      <Text style={{ margin: "0 0 12px" }}>
        We received a request to reset your client portal password. This link expires in{" "}
        {opts.expiresHours} hour{opts.expiresHours === 1 ? "" : "s"}.
      </Text>
      <CtaButton href={opts.resetUrl} label="Reset password" accentColor={brand.accentColor} />
      <Text style={{ color: "#6b6560", fontSize: "13px", margin: "16px 0 0" }}>
        If you didn&apos;t request this, you can ignore this email.
      </Text>
    </>,
    { preheader: "Reset your portal password" },
  );
}

export async function renderPortalNotificationEmail(opts: {
  clientName: string;
  projectName: string;
  title: string;
  body: string;
  portalUrl: string;
}) {
  const brand = await getEmailBrandContext();
  return renderBrandedComponent(
    <>
      <Text style={{ margin: "0 0 12px" }}>Hi {opts.clientName},</Text>
      <Text style={{ margin: "0 0 12px" }}>
        <strong>{opts.title}</strong>
        {opts.projectName ? (
          <>
            {" "}
            — <strong>{opts.projectName}</strong>
          </>
        ) : null}
      </Text>
      {opts.body ? <Text style={{ margin: "0 0 12px" }}>{opts.body}</Text> : null}
      <CtaButton href={opts.portalUrl} label="Open portal" accentColor={brand.accentColor} />
    </>,
    { preheader: opts.title },
  );
}

type PortalEventEmailOpts = {
  clientName: string;
  projectName: string;
  title: string;
  body: string;
  portalUrl: string;
};

export async function renderPortalUpdateEmail(opts: PortalEventEmailOpts) {
  return renderPortalNotificationEmail({
    ...opts,
    title: opts.title || "New project update",
  });
}

export async function renderPortalTaskEmail(opts: PortalEventEmailOpts) {
  return renderPortalNotificationEmail({
    ...opts,
    title: opts.title || "New action item",
  });
}

export async function renderPortalMeetingEmail(opts: PortalEventEmailOpts) {
  return renderPortalNotificationEmail({
    ...opts,
    title: opts.title || "Meeting scheduled",
  });
}

export async function renderPortalFileEmail(opts: PortalEventEmailOpts) {
  return renderPortalNotificationEmail({
    ...opts,
    title: opts.title || "New deliverable",
  });
}

export async function renderPortalAdminMessageEmail(opts: PortalEventEmailOpts) {
  return renderPortalNotificationEmail({
    ...opts,
    title: opts.title || "New message from Ryan",
  });
}
