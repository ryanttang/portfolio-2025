"use client";

import { useState } from "react";
import { saveSettingAction } from "@/app/admin/actions/content";
import RichTextEditor from "@/components/admin/email/RichTextEditor";
import EmailPreviewModal from "@/components/admin/email/EmailPreviewModal";
import type { EmailSettings } from "@/lib/email/templates/render";

const DEFAULTS: Required<
  Pick<
    EmailSettings,
    | "fromName"
    | "fromEmail"
    | "headerTitle"
    | "headerTagline"
    | "headerBg"
    | "accentColor"
    | "logoUrl"
    | "signatureHtml"
    | "footerHtml"
    | "showSiteInFooter"
  >
> = {
  fromName: "Ryan Tang",
  fromEmail: "hello@ryantang.site",
  headerTitle: "Ryan Tang",
  headerTagline: "",
  headerBg: "#0c0c0c",
  accentColor: "#e6c47a",
  logoUrl: "",
  signatureHtml: "<p>— Ryan Tang</p>",
  footerHtml: "",
  showSiteInFooter: true,
};

function asEmail(raw: unknown): EmailSettings {
  if (!raw || typeof raw !== "object") return {};
  return raw as EmailSettings;
}

export default function EmailBrandSettings({ email }: { email: unknown }) {
  const initial = { ...DEFAULTS, ...asEmail(email) };
  const [fromName, setFromName] = useState(initial.fromName || DEFAULTS.fromName);
  const [fromEmail, setFromEmail] = useState(initial.fromEmail || DEFAULTS.fromEmail);
  const [headerTitle, setHeaderTitle] = useState(
    initial.headerTitle || initial.fromName || DEFAULTS.headerTitle,
  );
  const [headerTagline, setHeaderTagline] = useState(initial.headerTagline || "");
  const [headerBg, setHeaderBg] = useState(initial.headerBg || DEFAULTS.headerBg);
  const [accentColor, setAccentColor] = useState(
    initial.accentColor || DEFAULTS.accentColor,
  );
  const [logoUrl, setLogoUrl] = useState(initial.logoUrl || "");
  const [signatureHtml, setSignatureHtml] = useState(
    initial.signatureHtml || DEFAULTS.signatureHtml,
  );
  const [footerHtml, setFooterHtml] = useState(initial.footerHtml || "");
  const [showSiteInFooter, setShowSiteInFooter] = useState(
    initial.showSiteInFooter !== false,
  );
  const [showPreview, setShowPreview] = useState(false);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    setMsg("");
    try {
      const payload: EmailSettings = {
        fromName: fromName.trim(),
        fromEmail: fromEmail.trim(),
        headerTitle: headerTitle.trim(),
        headerTagline: headerTagline.trim(),
        headerBg: headerBg.trim() || DEFAULTS.headerBg,
        accentColor: accentColor.trim() || DEFAULTS.accentColor,
        logoUrl: logoUrl.trim(),
        signatureHtml,
        footerHtml,
        showSiteInFooter,
      };
      await saveSettingAction("email", JSON.stringify(payload));
      setMsg("Email brand settings saved. New sends will use this header and footer.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const previewBody = `
    <p>Hi there,</p>
    <p>This is a preview of your branded email layout. The header, signature, and footer below come from your settings.</p>
    <p>Thanks for taking a look.</p>
  `;

  const brandOverrides = {
    fromName,
    fromEmail,
    headerTitle,
    headerTagline,
    headerBg,
    accentColor,
    logoUrl,
    signatureHtml,
    footerHtml,
    showSiteInFooter,
  };

  return (
    <div className="border border-white/10 bg-[#141414] p-4 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Email brand</h2>
          <p className="mt-1 text-xs text-white/40">
            Header, signature, and footer applied to inbox and transactional emails.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowPreview(true)}
          className="border border-white/15 px-2.5 py-1 text-xs text-white/60 hover:text-[#e6c47a]"
        >
          Preview
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="From name" value={fromName} onChange={setFromName} />
        <Field label="From email" value={fromEmail} onChange={setFromEmail} />
      </div>

      <div className="border-t border-white/10 pt-4">
        <h3 className="text-xs uppercase tracking-wider text-white/40">Header</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field
            label="Header title"
            value={headerTitle}
            onChange={setHeaderTitle}
            hint="Shown in the dark header bar (defaults to from name)"
          />
          <Field
            label="Tagline (optional)"
            value={headerTagline}
            onChange={setHeaderTagline}
            hint="Small line under the title"
          />
          <ColorField label="Header background" value={headerBg} onChange={setHeaderBg} />
          <ColorField label="Accent color" value={accentColor} onChange={setAccentColor} />
          <div className="sm:col-span-2">
            <Field
              label="Logo URL (optional)"
              value={logoUrl}
              onChange={setLogoUrl}
              hint="If set, logo replaces the text title in the header"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 pt-4">
        <h3 className="text-xs uppercase tracking-wider text-white/40">Signature</h3>
        <p className="mt-1 mb-2 text-xs text-white/35">
          Appended after the message body on outbound branded emails.
        </p>
        <RichTextEditor
          value={signatureHtml || "<p></p>"}
          onChange={setSignatureHtml}
          placeholder="Your signature…"
          minHeight="100px"
        />
      </div>

      <div className="border-t border-white/10 pt-4">
        <h3 className="text-xs uppercase tracking-wider text-white/40">Footer</h3>
        <p className="mt-1 mb-2 text-xs text-white/35">
          Bottom strip under the divider — address, disclaimer, or links.
        </p>
        <RichTextEditor
          value={footerHtml || "<p></p>"}
          onChange={setFooterHtml}
          placeholder="Footer text…"
          minHeight="80px"
        />
        <label className="mt-3 flex items-center gap-2 text-sm text-white/70">
          <input
            type="checkbox"
            checked={showSiteInFooter}
            onChange={(e) => setShowSiteInFooter(e.target.checked)}
            className="accent-[#e6c47a]"
          />
          Show site URL in footer
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="bg-[#e6c47a] px-4 py-2 text-sm font-semibold text-black disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save email brand"}
        </button>
        {msg && <p className="text-sm text-white/50">{msg}</p>}
      </div>

      <EmailPreviewModal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        bodyHtml={previewBody}
        subject="Brand preview"
        brandOverrides={brandOverrides}
        title="Email brand preview"
      />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <label className="block text-xs uppercase tracking-wider text-white/40">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm normal-case tracking-normal text-white outline-none focus:border-[#e6c47a]"
      />
      {hint && <span className="mt-1 block text-[10px] normal-case tracking-normal text-white/30">{hint}</span>}
    </label>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-xs uppercase tracking-wider text-white/40">
      {label}
      <div className="mt-1 flex gap-2">
        <input
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#0c0c0c"}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 cursor-pointer border border-white/15 bg-black/40 p-1"
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 border border-white/15 bg-black/40 px-3 py-2 text-sm normal-case tracking-normal text-white outline-none focus:border-[#e6c47a]"
        />
      </div>
    </label>
  );
}
