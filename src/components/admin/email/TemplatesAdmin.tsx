"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  createEmailTemplateAction,
  deleteEmailTemplateAction,
  duplicateEmailTemplateAction,
  updateEmailTemplateAction,
} from "@/app/admin/actions/content";
import RichTextEditor from "@/components/admin/email/RichTextEditor";
import EmailPreviewModal from "@/components/admin/email/EmailPreviewModal";

export type TemplateRow = {
  id: string;
  name: string;
  slug: string;
  category: string;
  subject: string;
  bodyHtml: string;
  isPreset: boolean;
};

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export default function TemplatesAdmin({ templates }: { templates: TemplateRow[] }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(
    templates.find((t) => !t.isPreset)?.id || templates[0]?.id || null,
  );
  const selected = templates.find((t) => t.id === selectedId) || null;
  const [name, setName] = useState(selected?.name || "");
  const [slug, setSlug] = useState(selected?.slug || "");
  const [category, setCategory] = useState(selected?.category || "general");
  const [subject, setSubject] = useState(selected?.subject || "");
  const [bodyHtml, setBodyHtml] = useState(selected?.bodyHtml || "<p></p>");
  const [showPreview, setShowPreview] = useState(false);
  const [status, setStatus] = useState("");
  const [creating, setCreating] = useState(false);

  function load(t: TemplateRow) {
    setSelectedId(t.id);
    setName(t.name);
    setSlug(t.slug);
    setCategory(t.category);
    setSubject(t.subject);
    setBodyHtml(t.bodyHtml);
    setCreating(false);
    setShowPreview(false);
    setStatus("");
  }

  function startNew() {
    setSelectedId(null);
    setCreating(true);
    setName("");
    setSlug("");
    setCategory("general");
    setSubject("");
    setBodyHtml("<p></p>");
    setShowPreview(false);
    setStatus("");
  }

  async function save() {
    setStatus("Saving…");
    if (creating || !selectedId) {
      const result = await createEmailTemplateAction({
        name,
        slug: slug || slugify(name),
        category,
        subject,
        bodyHtml,
      });
      if (!result.ok) {
        setStatus("Create failed");
        return;
      }
      setStatus("Created");
      router.refresh();
      return;
    }
    if (selected?.isPreset) {
      setStatus("Presets are read-only. Duplicate to customize.");
      return;
    }
    const result = await updateEmailTemplateAction(selectedId, {
      name,
      slug,
      category,
      subject,
      bodyHtml,
    });
    setStatus(result.ok ? "Saved" : result.error || "Failed");
    router.refresh();
  }

  async function duplicate() {
    if (!selectedId) return;
    const result = await duplicateEmailTemplateAction(selectedId);
    if (result.ok && result.id) {
      setStatus("Duplicated");
      router.refresh();
    } else {
      setStatus(result.error || "Duplicate failed");
    }
  }

  async function remove() {
    if (!selectedId || selected?.isPreset) return;
    if (!confirm("Delete this template?")) return;
    const result = await deleteEmailTemplateAction(selectedId);
    setStatus(result.ok ? "Deleted" : result.error || "Failed");
    setSelectedId(null);
    router.refresh();
  }

  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-[260px_1fr]">
      <div className="border border-white/10 bg-[#141414]">
        <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
          <span className="text-xs uppercase tracking-wider text-white/40">Templates</span>
          <button type="button" onClick={startNew} className="text-xs text-[#fdf0d5]">
            New
          </button>
        </div>
        <ul className="max-h-[70vh] divide-y divide-white/5 overflow-y-auto">
          {templates.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => load(t)}
                className={`w-full px-3 py-3 text-left text-sm hover:bg-white/5 ${
                  selectedId === t.id && !creating ? "bg-white/10" : ""
                }`}
              >
                <p className="font-medium text-white/90">{t.name}</p>
                <p className="text-[10px] uppercase tracking-wider text-white/35">
                  {t.isPreset ? "Preset" : "Custom"} · {t.category}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-3 border border-white/10 bg-[#141414] p-4">
        {!selected && !creating ? (
          <p className="text-sm text-white/40">Select a template or create a new one.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">
                {creating ? "New template" : selected?.name}
                {selected?.isPreset && !creating && (
                  <span className="ml-2 text-[10px] uppercase tracking-wider text-white/40">
                    Read-only preset
                  </span>
                )}
              </h2>
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="border border-white/15 px-2.5 py-1 text-xs text-white/60 hover:text-[#fdf0d5]"
              >
                Preview
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs uppercase tracking-wider text-white/40">
                Name
                <input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (creating) setSlug(slugify(e.target.value));
                  }}
                  disabled={!!selected?.isPreset && !creating}
                  className="mt-1 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm disabled:opacity-50"
                />
              </label>
              <label className="block text-xs uppercase tracking-wider text-white/40">
                Slug
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  disabled={!!selected?.isPreset && !creating}
                  className="mt-1 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm disabled:opacity-50"
                />
              </label>
            </div>
            <label className="block text-xs uppercase tracking-wider text-white/40">
              Category
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={!!selected?.isPreset && !creating}
                className="mt-1 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm disabled:opacity-50"
              />
            </label>
            <label className="block text-xs uppercase tracking-wider text-white/40">
              Subject
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={!!selected?.isPreset && !creating}
                className="mt-1 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm disabled:opacity-50"
              />
            </label>

            <RichTextEditor
              value={bodyHtml}
              onChange={setBodyHtml}
              minHeight="220px"
              editable={creating || !selected?.isPreset}
            />

            {selected?.isPreset && !creating ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={duplicate}
                  className="bg-[#fdf0d5] px-4 py-2 text-sm font-semibold text-black"
                >
                  Duplicate to customize
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={save}
                  className="bg-[#fdf0d5] px-4 py-2 text-sm font-semibold text-black"
                >
                  Save
                </button>
                {!creating && (
                  <button
                    type="button"
                    onClick={remove}
                    className="border border-white/20 px-4 py-2 text-sm text-white/50"
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
            {status && <p className="text-sm text-white/50">{status}</p>}
          </>
        )}
      </div>

      <EmailPreviewModal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        bodyHtml={bodyHtml}
        subject={subject}
        title="Template preview"
      />
    </div>
  );
}
