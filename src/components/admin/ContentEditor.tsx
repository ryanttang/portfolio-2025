"use client";

import { useState } from "react";
import { saveContentAction } from "@/app/admin/actions/content";

export default function ContentEditor({
  contentKey,
  label,
  initial,
}: {
  contentKey: string;
  label: string;
  initial: unknown;
}) {
  const [value, setValue] = useState(JSON.stringify(initial, null, 2));
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    setStatus("");
    try {
      JSON.parse(value);
      await saveContentAction(contentKey, value);
      setStatus("Saved");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Invalid JSON");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border border-white/10 bg-[#141414] p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-[family-name:var(--font-syne)] text-sm font-semibold tracking-wide">
          {label}
          <span className="ml-2 text-xs font-normal text-white/30">{contentKey}</span>
        </h2>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="bg-[#e6c47a] px-3 py-1.5 text-xs font-semibold text-black disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={12}
        className="mt-3 w-full border border-white/10 bg-black/40 p-3 font-mono text-xs text-white/90 outline-none focus:border-[#e6c47a]/50"
        spellCheck={false}
      />
      {status && <p className="mt-2 text-xs text-white/50">{status}</p>}
    </div>
  );
}
