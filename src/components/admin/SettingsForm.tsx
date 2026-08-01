"use client";

import Link from "next/link";
import { useState } from "react";
import { saveSettingAction } from "@/app/admin/actions/content";
import EmailBrandSettings from "@/components/admin/email/EmailBrandSettings";

type BrandSettings = {
  name: string;
  contactEmail: string;
  resumeUrl: string;
  socials: {
    linkedin: string;
    github: string;
    soundcloud: string;
  };
};

type InvoiceSettings = {
  sellerLegalName: string;
  sellerAddress: string;
  sellerTaxId: string;
  sellerPaymentInstructions: string;
  sellerFooterNote: string;
};

type FeaturesSettings = {
  contractSigning: boolean;
  paypalMode: "sandbox" | "live";
};

const BRAND_DEFAULTS: BrandSettings = {
  name: "Ryan Tang",
  contactEmail: "",
  resumeUrl: "/resume.pdf",
  socials: { linkedin: "", github: "", soundcloud: "" },
};

const INVOICE_DEFAULTS: InvoiceSettings = {
  sellerLegalName: "Ryan Tang",
  sellerAddress: "",
  sellerTaxId: "",
  sellerPaymentInstructions: "Pay via PayPal or as instructed on the invoice.",
  sellerFooterNote: "Thank you for your business.",
};

const FEATURES_DEFAULTS: FeaturesSettings = {
  contractSigning: true,
  paypalMode: "sandbox",
};

function asObject(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
}

function parseBrand(raw: unknown): BrandSettings {
  const o = asObject(raw);
  const socials = asObject(o.socials);
  return {
    name: String(o.name ?? BRAND_DEFAULTS.name),
    contactEmail: String(o.contactEmail ?? BRAND_DEFAULTS.contactEmail),
    resumeUrl: String(o.resumeUrl ?? BRAND_DEFAULTS.resumeUrl),
    socials: {
      linkedin: String(socials.linkedin ?? ""),
      github: String(socials.github ?? ""),
      soundcloud: String(socials.soundcloud ?? ""),
    },
  };
}

function parseInvoice(raw: unknown): InvoiceSettings {
  const o = asObject(raw);
  return {
    sellerLegalName: String(o.sellerLegalName ?? INVOICE_DEFAULTS.sellerLegalName),
    sellerAddress: String(o.sellerAddress ?? ""),
    sellerTaxId: String(o.sellerTaxId ?? ""),
    sellerPaymentInstructions: String(
      o.sellerPaymentInstructions ?? INVOICE_DEFAULTS.sellerPaymentInstructions,
    ),
    sellerFooterNote: String(o.sellerFooterNote ?? INVOICE_DEFAULTS.sellerFooterNote),
  };
}

function parseFeatures(raw: unknown): FeaturesSettings {
  const o = asObject(raw);
  const mode = o.paypalMode === "live" ? "live" : "sandbox";
  return {
    contractSigning: o.contractSigning !== false,
    paypalMode: mode,
  };
}

export default function SettingsForm({
  brand,
  invoice,
  email,
  features,
}: {
  brand: unknown;
  invoice: unknown;
  email: unknown;
  features: unknown;
}) {
  return (
    <div className="mt-8 space-y-4">
      <BrandSettingsSection initial={parseBrand(brand)} />
      <InvoiceSettingsSection initial={parseInvoice(invoice)} />
      <EmailBrandSettings email={email} />
      <FeaturesSettingsSection initial={parseFeatures(features)} />
    </div>
  );
}

function BrandSettingsSection({ initial }: { initial: BrandSettings }) {
  const [name, setName] = useState(initial.name);
  const [contactEmail, setContactEmail] = useState(initial.contactEmail);
  const [resumeUrl, setResumeUrl] = useState(initial.resumeUrl);
  const [linkedin, setLinkedin] = useState(initial.socials.linkedin);
  const [github, setGithub] = useState(initial.socials.github);
  const [soundcloud, setSoundcloud] = useState(initial.socials.soundcloud);
  const { saving, msg, save } = useSaveSetting("brand", () => ({
    name: name.trim(),
    contactEmail: contactEmail.trim(),
    resumeUrl: resumeUrl.trim(),
    socials: {
      linkedin: linkedin.trim(),
      github: github.trim(),
      soundcloud: soundcloud.trim(),
    },
  }));

  return (
    <section className="border border-white/10 bg-[#141414] p-4 space-y-4">
      <Header
        title="Brand"
        description="Site identity defaults — name, contact, resume, and social links."
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Display name" value={name} onChange={setName} />
        <Field
          label="Contact email"
          value={contactEmail}
          onChange={setContactEmail}
          type="email"
        />
        <div className="sm:col-span-2">
          <Field
            label="Resume URL"
            value={resumeUrl}
            onChange={setResumeUrl}
            hint="Path or absolute URL used for resume downloads"
          />
        </div>
      </div>
      <div className="border-t border-white/10 pt-4">
        <h3 className="text-xs uppercase tracking-wider text-white/40">Social links</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="LinkedIn" value={linkedin} onChange={setLinkedin} />
          <Field label="GitHub" value={github} onChange={setGithub} />
          <div className="sm:col-span-2">
            <Field label="SoundCloud" value={soundcloud} onChange={setSoundcloud} />
          </div>
        </div>
      </div>
      <SaveRow saving={saving} msg={msg} onSave={save} label="Save brand" />
    </section>
  );
}

function InvoiceSettingsSection({ initial }: { initial: InvoiceSettings }) {
  const [sellerLegalName, setSellerLegalName] = useState(initial.sellerLegalName);
  const [sellerAddress, setSellerAddress] = useState(initial.sellerAddress);
  const [sellerTaxId, setSellerTaxId] = useState(initial.sellerTaxId);
  const [sellerPaymentInstructions, setSellerPaymentInstructions] = useState(
    initial.sellerPaymentInstructions,
  );
  const [sellerFooterNote, setSellerFooterNote] = useState(initial.sellerFooterNote);
  const { saving, msg, save } = useSaveSetting("invoice", () => ({
    sellerLegalName: sellerLegalName.trim(),
    sellerAddress: sellerAddress.trim(),
    sellerTaxId: sellerTaxId.trim(),
    sellerPaymentInstructions: sellerPaymentInstructions.trim(),
    sellerFooterNote: sellerFooterNote.trim(),
  }));

  return (
    <section className="border border-white/10 bg-[#141414] p-4 space-y-4">
      <Header
        title="Invoice seller defaults"
        description="Letterhead copied onto new invoices at create time. Existing invoices keep their snapshot."
      />
      <p className="text-xs text-white/40">
        Payment <span className="text-white/60">instructions</span> below are how to pay
        (PayPal, wire, etc.). Agreement payment{" "}
        <span className="text-white/60">schedules</span> live under{" "}
        <Link href="/admin/contracts/terms" className="text-[#fdf0d5] hover:underline">
          Contracts → Terms
        </Link>{" "}
        and are pulled onto invoices when you link a contract.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Legal name"
          value={sellerLegalName}
          onChange={setSellerLegalName}
          hint="Appears as the seller on PDFs and pay pages"
        />
        <Field
          label="Tax ID (optional)"
          value={sellerTaxId}
          onChange={setSellerTaxId}
        />
        <div className="sm:col-span-2">
          <TextArea
            label="Address"
            value={sellerAddress}
            onChange={setSellerAddress}
            rows={3}
            hint="Business address shown on invoices"
          />
        </div>
        <div className="sm:col-span-2">
          <TextArea
            label="Payment instructions (how to pay)"
            value={sellerPaymentInstructions}
            onChange={setSellerPaymentInstructions}
            rows={3}
            hint="Shown on the public pay page and invoice PDF — not the milestone schedule"
          />
        </div>
        <div className="sm:col-span-2">
          <Field
            label="Footer note"
            value={sellerFooterNote}
            onChange={setSellerFooterNote}
            hint="Closing line on invoice PDFs"
          />
        </div>
      </div>
      <SaveRow saving={saving} msg={msg} onSave={save} label="Save invoice defaults" />
    </section>
  );
}

function FeaturesSettingsSection({ initial }: { initial: FeaturesSettings }) {
  const [contractSigning, setContractSigning] = useState(initial.contractSigning);
  const [paypalMode, setPaypalMode] = useState(initial.paypalMode);
  const { saving, msg, save } = useSaveSetting("features", () => ({
    contractSigning,
    paypalMode,
  }));

  return (
    <section className="border border-white/10 bg-[#141414] p-4 space-y-4">
      <Header
        title="Features"
        description="Product preferences. Env vars above still control whether integrations are available."
      />
      <div className="space-y-4">
        <label className="flex items-start gap-3 text-sm text-white/70">
          <input
            type="checkbox"
            checked={contractSigning}
            onChange={(e) => setContractSigning(e.target.checked)}
            className="mt-0.5 accent-[#fdf0d5]"
          />
          <span>
            <span className="block font-medium text-white/85">Contract signing</span>
            <span className="mt-0.5 block text-xs text-white/40">
              Prefer e-sign flows when a signing certificate is configured.
            </span>
          </span>
        </label>

        <label className="block text-xs uppercase tracking-wider text-white/40">
          PayPal mode
          <select
            value={paypalMode}
            onChange={(e) => setPaypalMode(e.target.value === "live" ? "live" : "sandbox")}
            className="mt-1 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm normal-case tracking-normal text-white outline-none focus:border-[#fdf0d5] sm:max-w-xs"
          >
            <option value="sandbox">Sandbox</option>
            <option value="live">Live</option>
          </select>
          <span className="mt-1 block text-[10px] normal-case tracking-normal text-white/30">
            Preference for checkout mode. Runtime PayPal still requires env credentials.
          </span>
        </label>
      </div>
      <SaveRow saving={saving} msg={msg} onSave={save} label="Save features" />
    </section>
  );
}

function useSaveSetting(key: string, buildPayload: () => unknown) {
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function save() {
    setSaving(true);
    setMsg("");
    try {
      await saveSettingAction(key, JSON.stringify(buildPayload()));
      setMsg("Saved.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return { saving, msg, save };
}

function Header({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="mt-1 text-xs text-white/40">{description}</p>
    </div>
  );
}

function SaveRow({
  saving,
  msg,
  onSave,
  label,
}: {
  saving: boolean;
  msg: string;
  onSave: () => void;
  label: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 pt-2">
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="bg-[#fdf0d5] px-4 py-2 text-sm font-semibold text-black disabled:opacity-60"
      >
        {saving ? "Saving…" : label}
      </button>
      {msg && <p className="text-sm text-white/50">{msg}</p>}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  hint,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  type?: string;
}) {
  return (
    <label className="block text-xs uppercase tracking-wider text-white/40">
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm normal-case tracking-normal text-white outline-none focus:border-[#fdf0d5]"
      />
      {hint && (
        <span className="mt-1 block text-[10px] normal-case tracking-normal text-white/30">
          {hint}
        </span>
      )}
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  hint,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  rows?: number;
}) {
  return (
    <label className="block text-xs uppercase tracking-wider text-white/40">
      {label}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="mt-1 w-full resize-y border border-white/15 bg-black/40 px-3 py-2 text-sm normal-case tracking-normal text-white outline-none focus:border-[#fdf0d5]"
      />
      {hint && (
        <span className="mt-1 block text-[10px] normal-case tracking-normal text-white/30">
          {hint}
        </span>
      )}
    </label>
  );
}
