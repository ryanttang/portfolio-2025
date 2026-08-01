"use client";

import Link from "next/link";
import { useState } from "react";
import { saveContentAction } from "@/app/admin/actions/content";
import { syncServicesTermsToTemplatesAction } from "@/app/admin/actions/contracts";
import type { ServicesTermsContent } from "@/lib/content/schemas";
import TermsListEditor from "@/components/admin/TermsListEditor";

export default function ServicesTermsEditor({
  initial,
  showHubLinks = true,
}: {
  initial: ServicesTermsContent;
  showHubLinks?: boolean;
}) {
  const [data, setData] = useState<ServicesTermsContent>(initial);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [msg, setMsg] = useState("");

  async function save() {
    setSaving(true);
    setMsg("");
    try {
      await saveContentAction("services_terms", JSON.stringify(data));
      setMsg("Terms saved.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function syncTemplates() {
    setSyncing(true);
    setMsg("");
    try {
      await saveContentAction("services_terms", JSON.stringify(data));
      const result = await syncServicesTermsToTemplatesAction();
      setMsg(
        `Saved and synced ${result.updated} template${result.updated === 1 ? "" : "s"} (project & retainer).`,
      );
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="space-y-6 border border-white/10 bg-[#141414] p-4">
      <div>
        <p className="text-xs text-white/40">
          Canonical payment schedule and term bullets for the public Services Terms tab. Use sync to
          push Project & Retainer copy into contract templates.
        </p>
        {showHubLinks && (
          <p className="mt-2 text-xs text-white/35">
            Also edit under{" "}
            <Link href="/admin/contracts/terms" className="text-[#fdf0d5] hover:underline">
              Contracts → Terms
            </Link>
            .
          </p>
        )}
      </div>

      <TermsListEditor
        label="Project payment lines"
        values={data.projectPaymentLines}
        onChange={(projectPaymentLines) => setData({ ...data, projectPaymentLines })}
        placeholder="e.g. 50% to begin"
        hint="Shown under “Payment Terms” on the public Terms tab."
        addLabel="Add payment line"
      />

      <label className="block text-xs uppercase tracking-wider text-white/40">
        Project payment note
        <input
          value={data.projectPaymentNote}
          onChange={(e) => setData({ ...data, projectPaymentNote: e.target.value })}
          className="mt-1 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm normal-case tracking-normal text-white outline-none focus:border-[#fdf0d5]"
        />
        <span className="mt-1 block text-[10px] normal-case tracking-normal text-white/30">
          e.g. Smaller projects: 50% / 50%
        </span>
      </label>

      <TermsListEditor
        label="Project terms"
        values={data.projectTerms}
        onChange={(projectTerms) => setData({ ...data, projectTerms })}
      />

      <TermsListEditor
        label="Retainer terms"
        values={data.retainerTerms}
        onChange={(retainerTerms) => setData({ ...data, retainerTerms })}
      />

      <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-4">
        <button
          type="button"
          onClick={save}
          disabled={saving || syncing}
          className="bg-[#fdf0d5] px-4 py-2 text-sm font-semibold text-black disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save terms"}
        </button>
        <button
          type="button"
          onClick={syncTemplates}
          disabled={saving || syncing}
          className="border border-white/20 px-4 py-2 text-sm disabled:opacity-60"
        >
          {syncing ? "Syncing…" : "Sync to Project & Retainer templates"}
        </button>
        {msg && <p className="text-sm text-white/50">{msg}</p>}
      </div>
    </div>
  );
}
