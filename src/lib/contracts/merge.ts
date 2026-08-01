import { firstNameFrom } from "@/lib/email/merge";

export type ContractMergeContext = {
  name?: string | null;
  first_name?: string | null;
  company?: string | null;
  email?: string | null;
  address?: string | null;
  phone?: string | null;
  date?: string | null;
  amount?: string | null;
  seller_name?: string | null;
  seller_address?: string | null;
  terms?: string | null;
};

const TOKEN_RE =
  /\{\{\s*(name|first_name|company|email|address|phone|date|amount|seller_name|seller_address|terms)\s*\}\}/gi;

export function buildContractMergeContext(opts: {
  client?: {
    name?: string | null;
    company?: string | null;
    email?: string | null;
    address?: string | null;
    phone?: string | null;
  } | null;
  seller?: {
    sellerLegalName?: string | null;
    sellerAddress?: string | null;
  } | null;
  amountCents?: number | null;
  termsText?: string | null;
  date?: Date;
}): ContractMergeContext {
  const amount =
    opts.amountCents != null && Number.isFinite(opts.amountCents)
      ? `$${(opts.amountCents / 100).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`
      : "";
  const d = opts.date ?? new Date();
  return {
    name: opts.client?.name || "",
    first_name: firstNameFrom(opts.client?.name),
    company: opts.client?.company || "",
    email: opts.client?.email || "",
    address: opts.client?.address || "",
    phone: opts.client?.phone || "",
    date: d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    amount,
    seller_name: opts.seller?.sellerLegalName || "",
    seller_address: opts.seller?.sellerAddress || "",
    terms: opts.termsText || "",
  };
}

export function applyContractMergeFields(
  input: string,
  ctx: ContractMergeContext,
): string {
  return input.replace(TOKEN_RE, (_match, key: string) => {
    const k = key.toLowerCase() as keyof ContractMergeContext;
    return ctx[k] ?? "";
  });
}

export function formatTermsBlock(terms: string[], paymentNotes?: string | null): string {
  const lines: string[] = [];
  if (paymentNotes?.trim()) {
    lines.push("Payment schedule");
    lines.push(paymentNotes.trim());
    lines.push("");
  }
  if (terms.length) {
    lines.push("Terms");
    terms.forEach((t, i) => {
      const text = t.trim();
      if (text) lines.push(`${i + 1}. ${text}`);
    });
  }
  return lines.join("\n").trim();
}

export const CONTRACT_MERGE_FIELD_OPTIONS = [
  { token: "{{name}}", label: "Client name" },
  { token: "{{first_name}}", label: "First name" },
  { token: "{{company}}", label: "Company" },
  { token: "{{email}}", label: "Email" },
  { token: "{{address}}", label: "Address" },
  { token: "{{phone}}", label: "Phone" },
  { token: "{{date}}", label: "Date" },
  { token: "{{amount}}", label: "Amount" },
  { token: "{{seller_name}}", label: "Seller name" },
  { token: "{{seller_address}}", label: "Seller address" },
  { token: "{{terms}}", label: "Terms block" },
] as const;

export function buildContractDraft(opts: {
  template: {
    titleTemplate: string;
    bodyTemplate: string;
    terms: string[] | unknown;
    paymentNotes?: string | null;
  };
  client: {
    name?: string | null;
    company?: string | null;
    email?: string | null;
    address?: string | null;
    phone?: string | null;
  } | null;
  seller?: {
    sellerLegalName?: string | null;
    sellerAddress?: string | null;
  } | null;
  amountCents?: number | null;
  terms?: string[];
  paymentNotes?: string | null;
}) {
  const terms =
    opts.terms ?? (Array.isArray(opts.template.terms) ? (opts.template.terms as string[]) : []);
  const paymentNotes =
    opts.paymentNotes !== undefined ? opts.paymentNotes : opts.template.paymentNotes;
  const termsText = formatTermsBlock(terms, paymentNotes);
  const ctx = buildContractMergeContext({
    client: opts.client,
    seller: opts.seller,
    amountCents: opts.amountCents,
    termsText,
  });
  const titleSource = opts.template.titleTemplate || "Service Agreement — {{company}}";
  let title = applyContractMergeFields(titleSource, ctx).trim();
  if (!title || title.endsWith("—") || title.endsWith("-")) {
    title = applyContractMergeFields(
      titleSource.replace(/\{\{\s*company\s*\}\}/gi, "{{name}}"),
      ctx,
    ).trim();
  }
  const bodyText = applyContractMergeFields(opts.template.bodyTemplate, ctx).trim();
  return { title, bodyText, terms, paymentNotes: paymentNotes || "" };
}
