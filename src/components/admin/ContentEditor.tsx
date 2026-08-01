"use client";

import { useState } from "react";
import { saveContentAction } from "@/app/admin/actions/content";
import {
  aboutSchema,
  designSchema,
  projectsSchema,
  retailSchema,
  servicesOverviewSchema,
  servicesProjectsSchema,
  servicesRetainersSchema,
  servicesTermsSchema,
  type AboutContent,
  type ContentKey,
  type DesignContent,
  type ProjectsContent,
  type RetailContent,
  type ServicesOverviewContent,
  type ServicesProjectsContent,
  type ServicesRetainersContent,
  type ServicesTermsContent,
} from "@/lib/content/schemas";

const SECTIONS: { key: ContentKey; label: string; hint: string }[] = [
  {
    key: "about",
    label: "About",
    hint: "Headline and bio shown on the home page.",
  },
  {
    key: "projects",
    label: "Projects",
    hint: "Featured project cards with title, description, link, and image.",
  },
  {
    key: "design",
    label: "Design",
    hint: "Cover and flyer image paths for the design gallery.",
  },
  {
    key: "retail",
    label: "Retail",
    hint: "Client and personal brand lists for the retail section.",
  },
  {
    key: "services_overview",
    label: "Services overview",
    hint: "Top-level service groups and prices. Also feeds onboarding options.",
  },
  {
    key: "services_projects",
    label: "Services projects",
    hint: "Project packages by section. Also feeds onboarding options.",
  },
  {
    key: "services_retainers",
    label: "Services retainers",
    hint: "Retainer packages. Also feeds onboarding options.",
  },
  {
    key: "services_terms",
    label: "Services terms",
    hint: "Public Services page Terms tab. Independent from contract templates.",
  },
];

type SectionPayload = {
  about: AboutContent;
  projects: ProjectsContent;
  design: DesignContent;
  retail: RetailContent;
  services_overview: ServicesOverviewContent;
  services_projects: ServicesProjectsContent;
  services_retainers: ServicesRetainersContent;
  services_terms: ServicesTermsContent;
};

function normalizeSection<K extends ContentKey>(
  key: K,
  payload: unknown,
): SectionPayload[K] {
  switch (key) {
    case "about":
      return aboutSchema.parse(payload ?? { headline: "", body: "" }) as SectionPayload[K];
    case "projects":
      return projectsSchema.parse(payload ?? { items: [] }) as SectionPayload[K];
    case "design":
      return designSchema.parse(payload ?? { covers: [], flyers: [] }) as SectionPayload[K];
    case "retail":
      return retailSchema.parse(payload ?? { clients: [], personal: [] }) as SectionPayload[K];
    case "services_overview":
      return servicesOverviewSchema.parse(payload ?? { groups: [] }) as SectionPayload[K];
    case "services_projects":
      return servicesProjectsSchema.parse(payload ?? { sections: [] }) as SectionPayload[K];
    case "services_retainers":
      return servicesRetainersSchema.parse(payload ?? { items: [] }) as SectionPayload[K];
    case "services_terms":
      return servicesTermsSchema.parse(
        payload ?? {
          projectPaymentLines: [],
          projectPaymentNote: "",
          projectTerms: [],
          retainerTerms: [],
        },
      ) as SectionPayload[K];
    default: {
      const _exhaustive: never = key;
      return _exhaustive;
    }
  }
}

export default function ContentManager({
  entries,
}: {
  entries: { key: ContentKey; label: string; payload: unknown }[];
}) {
  const safeEntries = entries ?? [];
  const [active, setActive] = useState<ContentKey>(
    () => safeEntries[0]?.key ?? "about",
  );
  const activeMeta = SECTIONS.find((s) => s.key === active) ?? SECTIONS[0];
  const activeEntry = safeEntries.find((e) => e.key === active) ?? safeEntries[0];

  if (!activeEntry || !activeMeta) {
    return (
      <div>
        <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold">Content</h1>
        <p className="mt-1 text-sm text-white/50">No content sections available.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold">Content</h1>
      <p className="mt-1 text-sm text-white/50">
        Edit site sections with structured fields. Services content also powers onboarding
        service options.
      </p>

      <div className="mt-6 flex flex-wrap gap-1 border-b border-white/10 pb-px">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setActive(s.key)}
            className={`px-3 py-2 text-xs font-medium transition-colors ${
              active === s.key
                ? "border-b-2 border-[#e6c47a] text-[#e6c47a]"
                : "text-white/45 hover:text-white/70"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <SectionEditor
          key={active}
          contentKey={active}
          label={activeMeta.label}
          hint={activeMeta.hint}
          initial={activeEntry.payload}
        />
      </div>
    </div>
  );
}

function SectionEditor({
  contentKey,
  label,
  hint,
  initial,
}: {
  contentKey: ContentKey;
  label: string;
  hint: string;
  initial: unknown;
}) {
  const [data, setData] = useState(() => normalizeSection(contentKey, initial));
  const [mode, setMode] = useState<"form" | "json">("form");
  const [jsonValue, setJsonValue] = useState(() =>
    JSON.stringify(normalizeSection(contentKey, initial), null, 2),
  );
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  async function savePayload(payload: unknown) {
    setSaving(true);
    setStatus("");
    try {
      const parsed = normalizeSection(contentKey, payload);
      await saveContentAction(contentKey, JSON.stringify(parsed));
      setData(parsed);
      setJsonValue(JSON.stringify(parsed, null, 2));
      setStatus("Saved");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function switchToJson() {
    setJsonValue(JSON.stringify(data, null, 2));
    setMode("json");
    setStatus("");
  }

  function switchToForm() {
    try {
      const parsed = normalizeSection(contentKey, JSON.parse(jsonValue));
      setData(parsed);
      setMode("form");
      setStatus("");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Invalid JSON — fix before switching");
    }
  }

  return (
    <div className="border border-white/10 bg-[#141414] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-syne)] text-sm font-semibold tracking-wide">
            {label}
          </h2>
          <p className="mt-1 text-xs text-white/40">{hint}</p>
        </div>
        <div className="flex gap-1 border border-white/10 p-0.5">
          <button
            type="button"
            onClick={switchToForm}
            className={`px-2 py-1 text-xs ${mode === "form" ? "bg-white/10 text-[#e6c47a]" : "text-white/50"}`}
          >
            Form
          </button>
          <button
            type="button"
            onClick={switchToJson}
            className={`px-2 py-1 text-xs ${mode === "json" ? "bg-white/10 text-[#e6c47a]" : "text-white/50"}`}
          >
            JSON
          </button>
        </div>
      </div>

      <div className="mt-5">
        {mode === "json" ? (
          <textarea
            value={jsonValue}
            onChange={(e) => setJsonValue(e.target.value)}
            rows={16}
            spellCheck={false}
            className="w-full border border-white/10 bg-black/40 p-3 font-mono text-xs text-white/90 outline-none focus:border-[#e6c47a]/50"
          />
        ) : (
          <SectionForm contentKey={contentKey} data={data} onChange={setData} />
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={() => {
            if (mode === "json") {
              try {
                void savePayload(JSON.parse(jsonValue));
              } catch {
                setStatus("Invalid JSON");
              }
            } else {
              void savePayload(data);
            }
          }}
          className="bg-[#e6c47a] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {status && (
          <p
            className={`text-sm ${status === "Saved" ? "text-emerald-400/80" : "text-red-400/90"}`}
          >
            {status}
          </p>
        )}
      </div>
    </div>
  );
}

function SectionForm({
  contentKey,
  data,
  onChange,
}: {
  contentKey: ContentKey;
  data: SectionPayload[ContentKey];
  onChange: (next: SectionPayload[ContentKey]) => void;
}) {
  switch (contentKey) {
    case "about":
      return (
        <AboutForm
          data={data as AboutContent}
          onChange={onChange as (n: AboutContent) => void}
        />
      );
    case "projects":
      return (
        <ProjectsForm
          data={data as ProjectsContent}
          onChange={onChange as (n: ProjectsContent) => void}
        />
      );
    case "design":
      return (
        <DesignForm
          data={data as DesignContent}
          onChange={onChange as (n: DesignContent) => void}
        />
      );
    case "retail":
      return (
        <RetailForm
          data={data as RetailContent}
          onChange={onChange as (n: RetailContent) => void}
        />
      );
    case "services_overview":
      return (
        <ServicesOverviewForm
          data={data as ServicesOverviewContent}
          onChange={onChange as (n: ServicesOverviewContent) => void}
        />
      );
    case "services_projects":
      return (
        <ServicesProjectsForm
          data={data as ServicesProjectsContent}
          onChange={onChange as (n: ServicesProjectsContent) => void}
        />
      );
    case "services_retainers":
      return (
        <ServicesRetainersForm
          data={data as ServicesRetainersContent}
          onChange={onChange as (n: ServicesRetainersContent) => void}
        />
      );
    case "services_terms":
      return (
        <ServicesTermsForm
          data={data as ServicesTermsContent}
          onChange={onChange as (n: ServicesTermsContent) => void}
        />
      );
    default: {
      const _exhaustive: never = contentKey;
      return _exhaustive;
    }
  }
}

/* ——— section forms ——— */

function AboutForm({
  data,
  onChange,
}: {
  data: AboutContent;
  onChange: (n: AboutContent) => void;
}) {
  return (
    <div className="space-y-4">
      <Field
        label="Headline"
        value={data.headline}
        onChange={(headline) => onChange({ ...data, headline })}
      />
      <TextArea
        label="Body"
        value={data.body}
        onChange={(body) => onChange({ ...data, body })}
        rows={5}
      />
    </div>
  );
}

function ProjectsForm({
  data,
  onChange,
}: {
  data: ProjectsContent;
  onChange: (n: ProjectsContent) => void;
}) {
  function updateItem(i: number, patch: Partial<ProjectsContent["items"][number]>) {
    const items = data.items.map((item, idx) =>
      idx === i ? { ...item, ...patch } : item,
    );
    onChange({ items });
  }

  return (
    <div className="space-y-4">
      {data.items.map((item, i) => (
        <div key={i} className="space-y-3 border border-white/10 bg-black/20 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs uppercase tracking-wider text-white/40">
              Project {i + 1}
            </p>
            <RemoveButton
              onClick={() =>
                onChange({ items: data.items.filter((_, idx) => idx !== i) })
              }
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Title"
              value={item.title}
              onChange={(title) => updateItem(i, { title })}
            />
            <Field
              label="URL"
              value={item.url}
              onChange={(url) => updateItem(i, { url })}
              hint="Link or # if none"
            />
            <div className="sm:col-span-2">
              <Field
                label="Description"
                value={item.description}
                onChange={(description) => updateItem(i, { description })}
              />
            </div>
            <div className="sm:col-span-2">
              <Field
                label="Image path"
                value={item.image}
                onChange={(image) => updateItem(i, { image })}
                hint="e.g. /cannagrab-screen.png"
              />
            </div>
          </div>
        </div>
      ))}
      <AddButton
        label="Add project"
        onClick={() =>
          onChange({
            items: [
              ...data.items,
              { title: "", description: "", url: "", image: "" },
            ],
          })
        }
      />
    </div>
  );
}

function DesignForm({
  data,
  onChange,
}: {
  data: DesignContent;
  onChange: (n: DesignContent) => void;
}) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <StringList
        label="Covers"
        values={data.covers}
        onChange={(covers) => onChange({ ...data, covers })}
        placeholder="/covers/example.jpg"
        hint="Image paths for album/cover work"
      />
      <StringList
        label="Flyers"
        values={data.flyers}
        onChange={(flyers) => onChange({ ...data, flyers })}
        placeholder="/flyers/example.jpg"
        hint="Image paths for flyer work"
      />
    </div>
  );
}

function RetailForm({
  data,
  onChange,
}: {
  data: RetailContent;
  onChange: (n: RetailContent) => void;
}) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <StringList
        label="Clients"
        values={data.clients}
        onChange={(clients) => onChange({ ...data, clients })}
        placeholder="Client name"
      />
      <StringList
        label="Personal"
        values={data.personal}
        onChange={(personal) => onChange({ ...data, personal })}
        placeholder="Brand name"
      />
    </div>
  );
}

function ServicesOverviewForm({
  data,
  onChange,
}: {
  data: ServicesOverviewContent;
  onChange: (n: ServicesOverviewContent) => void;
}) {
  return (
    <div className="space-y-4">
      {data.groups.map((group, gi) => (
        <div key={gi} className="space-y-3 border border-white/10 bg-black/20 p-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[180px] flex-1">
              <Field
                label="Group title"
                value={group.title}
                onChange={(title) => {
                  const groups = data.groups.map((g, idx) =>
                    idx === gi ? { ...g, title } : g,
                  );
                  onChange({ groups });
                }}
              />
            </div>
            <RemoveButton
              onClick={() =>
                onChange({ groups: data.groups.filter((_, idx) => idx !== gi) })
              }
            />
          </div>
          <div className="space-y-2">
            {group.items.map((item, ii) => (
              <div key={ii} className="grid grid-cols-[1fr_120px_auto] gap-2">
                <input
                  value={item.label}
                  onChange={(e) => {
                    const groups = data.groups.map((g, gIdx) => {
                      if (gIdx !== gi) return g;
                      const items = g.items.map((it, iIdx) =>
                        iIdx === ii ? { ...it, label: e.target.value } : it,
                      );
                      return { ...g, items };
                    });
                    onChange({ groups });
                  }}
                  placeholder="Service name"
                  className={inputClass}
                />
                <input
                  value={item.price}
                  onChange={(e) => {
                    const groups = data.groups.map((g, gIdx) => {
                      if (gIdx !== gi) return g;
                      const items = g.items.map((it, iIdx) =>
                        iIdx === ii ? { ...it, price: e.target.value } : it,
                      );
                      return { ...g, items };
                    });
                    onChange({ groups });
                  }}
                  placeholder="$1,250"
                  className={inputClass}
                />
                <RemoveButton
                  onClick={() => {
                    const groups = data.groups.map((g, gIdx) =>
                      gIdx === gi
                        ? { ...g, items: g.items.filter((_, iIdx) => iIdx !== ii) }
                        : g,
                    );
                    onChange({ groups });
                  }}
                />
              </div>
            ))}
          </div>
          <AddButton
            label="Add item"
            onClick={() => {
              const groups = data.groups.map((g, gIdx) =>
                gIdx === gi
                  ? { ...g, items: [...g.items, { label: "", price: "" }] }
                  : g,
              );
              onChange({ groups });
            }}
          />
        </div>
      ))}
      <AddButton
        label="Add group"
        onClick={() =>
          onChange({
            groups: [...data.groups, { title: "", items: [{ label: "", price: "" }] }],
          })
        }
      />
    </div>
  );
}

function ServicesProjectsForm({
  data,
  onChange,
}: {
  data: ServicesProjectsContent;
  onChange: (n: ServicesProjectsContent) => void;
}) {
  function slugify(label: string) {
    return label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  return (
    <div className="space-y-4">
      {data.sections.map((section, si) => (
        <div key={si} className="space-y-3 border border-white/10 bg-black/20 p-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
              <Field
                label="Section label"
                value={section.label}
                onChange={(label) => {
                  const sections = data.sections.map((s, idx) => {
                    if (idx !== si) return s;
                    const nextId =
                      !s.id || s.id === slugify(s.label) ? slugify(label) : s.id;
                    return { ...s, label, id: nextId };
                  });
                  onChange({ sections });
                }}
              />
              <Field
                label="Section id"
                value={section.id}
                onChange={(id) => {
                  const sections = data.sections.map((s, idx) =>
                    idx === si ? { ...s, id } : s,
                  );
                  onChange({ sections });
                }}
                hint="Used in onboarding option ids"
              />
            </div>
            <RemoveButton
              onClick={() =>
                onChange({
                  sections: data.sections.filter((_, idx) => idx !== si),
                })
              }
            />
          </div>
          <div className="space-y-2">
            {section.items.map((item, ii) => (
              <div key={ii} className="grid grid-cols-[1fr_120px_auto] gap-2">
                <input
                  value={item.project}
                  onChange={(e) => {
                    const sections = data.sections.map((s, sIdx) => {
                      if (sIdx !== si) return s;
                      const items = s.items.map((it, iIdx) =>
                        iIdx === ii ? { ...it, project: e.target.value } : it,
                      );
                      return { ...s, items };
                    });
                    onChange({ sections });
                  }}
                  placeholder="Project name"
                  className={inputClass}
                />
                <input
                  value={item.range}
                  onChange={(e) => {
                    const sections = data.sections.map((s, sIdx) => {
                      if (sIdx !== si) return s;
                      const items = s.items.map((it, iIdx) =>
                        iIdx === ii ? { ...it, range: e.target.value } : it,
                      );
                      return { ...s, items };
                    });
                    onChange({ sections });
                  }}
                  placeholder="$2,000"
                  className={inputClass}
                />
                <RemoveButton
                  onClick={() => {
                    const sections = data.sections.map((s, sIdx) =>
                      sIdx === si
                        ? { ...s, items: s.items.filter((_, iIdx) => iIdx !== ii) }
                        : s,
                    );
                    onChange({ sections });
                  }}
                />
              </div>
            ))}
          </div>
          <AddButton
            label="Add project"
            onClick={() => {
              const sections = data.sections.map((s, sIdx) =>
                sIdx === si
                  ? { ...s, items: [...s.items, { project: "", range: "" }] }
                  : s,
              );
              onChange({ sections });
            }}
          />
        </div>
      ))}
      <AddButton
        label="Add section"
        onClick={() =>
          onChange({
            sections: [
              ...data.sections,
              { id: "", label: "", items: [{ project: "", range: "" }] },
            ],
          })
        }
      />
    </div>
  );
}

function ServicesRetainersForm({
  data,
  onChange,
}: {
  data: ServicesRetainersContent;
  onChange: (n: ServicesRetainersContent) => void;
}) {
  function updateItem(
    i: number,
    patch: Partial<ServicesRetainersContent["items"][number]>,
  ) {
    const items = data.items.map((item, idx) =>
      idx === i ? { ...item, ...patch } : item,
    );
    onChange({ items });
  }

  return (
    <div className="space-y-4">
      {data.items.map((item, i) => (
        <div key={i} className="space-y-3 border border-white/10 bg-black/20 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs uppercase tracking-wider text-white/40">
              Retainer {i + 1}
            </p>
            <RemoveButton
              onClick={() =>
                onChange({ items: data.items.filter((_, idx) => idx !== i) })
              }
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Name"
              value={item.name}
              onChange={(name) => updateItem(i, { name })}
            />
            <Field
              label="Price"
              value={item.price}
              onChange={(price) => updateItem(i, { price })}
              hint="e.g. $2,500"
            />
            <div className="sm:col-span-2">
              <Field
                label="Positioning"
                value={item.positioning}
                onChange={(positioning) => updateItem(i, { positioning })}
                hint="Short description of what’s included"
              />
            </div>
          </div>
        </div>
      ))}
      <AddButton
        label="Add retainer"
        onClick={() =>
          onChange({
            items: [...data.items, { name: "", price: "", positioning: "" }],
          })
        }
      />
    </div>
  );
}

function ServicesTermsForm({
  data,
  onChange,
}: {
  data: ServicesTermsContent;
  onChange: (n: ServicesTermsContent) => void;
}) {
  return (
    <div className="space-y-6">
      <StringList
        label="Project payment lines"
        values={data.projectPaymentLines}
        onChange={(projectPaymentLines) => onChange({ ...data, projectPaymentLines })}
        placeholder="e.g. 50% to begin"
        hint="Shown under “Projects Under ~$10k” on the public Terms tab."
      />
      <Field
        label="Project payment note"
        value={data.projectPaymentNote}
        onChange={(projectPaymentNote) => onChange({ ...data, projectPaymentNote })}
        hint="e.g. Smaller projects: 50% / 50%"
      />
      <StringList
        label="Project terms"
        values={data.projectTerms}
        onChange={(projectTerms) => onChange({ ...data, projectTerms })}
        placeholder="Term line"
      />
      <StringList
        label="Retainer terms"
        values={data.retainerTerms}
        onChange={(retainerTerms) => onChange({ ...data, retainerTerms })}
        placeholder="Term line"
      />
    </div>
  );
}

/* ——— shared field primitives ——— */

const inputClass =
  "w-full border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-[#e6c47a]";

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
        className={`mt-1 normal-case tracking-normal ${inputClass}`}
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
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <label className="block text-xs uppercase tracking-wider text-white/40">
      {label}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className={`mt-1 resize-y normal-case tracking-normal ${inputClass}`}
      />
    </label>
  );
}

function StringList({
  label,
  values,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-white/40">{label}</p>
      {hint && <p className="mt-1 text-[10px] text-white/30">{hint}</p>}
      <div className="mt-2 space-y-2">
        {values.map((v, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={v}
              onChange={(e) => {
                const next = [...values];
                next[i] = e.target.value;
                onChange(next);
              }}
              placeholder={placeholder}
              className={inputClass}
            />
            <RemoveButton onClick={() => onChange(values.filter((_, idx) => idx !== i))} />
          </div>
        ))}
      </div>
      <AddButton label="Add" onClick={() => onChange([...values, ""])} />
    </div>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-2 text-xs text-[#e6c47a] hover:underline"
    >
      + {label}
    </button>
  );
}

function RemoveButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 px-2 py-2 text-xs text-white/35 hover:text-red-400"
      aria-label="Remove"
    >
      ✕
    </button>
  );
}
