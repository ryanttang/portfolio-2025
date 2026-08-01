"use client";

import { useState } from "react";
import { saveSettingAction } from "@/app/admin/actions/content";
import EmailBrandSettings from "@/components/admin/email/EmailBrandSettings";

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
  const [brandJson, setBrandJson] = useState(JSON.stringify(brand, null, 2));
  const [invoiceJson, setInvoiceJson] = useState(JSON.stringify(invoice, null, 2));
  const [featuresJson, setFeaturesJson] = useState(JSON.stringify(features, null, 2));
  const [msg, setMsg] = useState("");

  async function saveAll() {
    setMsg("");
    try {
      await saveSettingAction("brand", brandJson);
      await saveSettingAction("invoice", invoiceJson);
      await saveSettingAction("features", featuresJson);
      setMsg("Settings saved. Email brand is saved separately below.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Save failed");
    }
  }

  return (
    <div className="mt-8 space-y-4">
      <EmailBrandSettings email={email} />

      {[
        { label: "Brand", value: brandJson, set: setBrandJson },
        { label: "Invoice seller defaults", value: invoiceJson, set: setInvoiceJson },
        { label: "Features", value: featuresJson, set: setFeaturesJson },
      ].map((block) => (
        <div key={block.label} className="border border-white/10 bg-[#141414] p-4">
          <h2 className="text-sm font-semibold">{block.label}</h2>
          <textarea
            value={block.value}
            onChange={(e) => block.set(e.target.value)}
            rows={8}
            className="mt-2 w-full border border-white/10 bg-black/40 p-3 font-mono text-xs outline-none focus:border-[#e6c47a]/50"
            spellCheck={false}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={saveAll}
        className="bg-[#e6c47a] px-4 py-2 text-sm font-semibold text-black"
      >
        Save settings
      </button>
      {msg && <p className="text-sm text-white/50">{msg}</p>}
    </div>
  );
}
