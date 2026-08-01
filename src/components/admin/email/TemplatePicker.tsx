"use client";

export type TemplateOption = {
  id: string;
  name: string;
  slug: string;
  category: string;
  subject: string;
  bodyHtml: string;
  isPreset: boolean;
};

export default function TemplatePicker({
  templates,
  onSelect,
}: {
  templates: TemplateOption[];
  onSelect: (t: TemplateOption) => void;
}) {
  if (templates.length === 0) {
    return (
      <p className="text-xs text-white/40">
        No templates yet. Seed presets or create one under Inbox → Templates.
      </p>
    );
  }

  const presets = templates.filter((t) => t.isPreset);
  const custom = templates.filter((t) => !t.isPreset);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[10px] uppercase tracking-wider text-white/40">Template</span>
      <select
        className="border border-white/15 bg-black/40 px-2 py-1.5 text-sm"
        defaultValue=""
        onChange={(e) => {
          const id = e.target.value;
          if (!id) return;
          const t = templates.find((x) => x.id === id);
          if (t) onSelect(t);
          e.target.value = "";
        }}
      >
        <option value="">Insert…</option>
        {presets.length > 0 && (
          <optgroup label="Presets">
            {presets.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </optgroup>
        )}
        {custom.length > 0 && (
          <optgroup label="Custom">
            {custom.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </optgroup>
        )}
      </select>
    </div>
  );
}
