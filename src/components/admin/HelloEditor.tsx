"use client";

import Link from "next/link";
import { useState } from "react";
import { saveContentAction } from "@/app/admin/actions/content";
import TermsListEditor from "@/components/admin/TermsListEditor";
import type { HelloContent } from "@/lib/content/schemas";

const inputClass =
  "mt-1 w-full border border-white/15 bg-black/40 px-3 py-2 text-sm normal-case tracking-normal text-white outline-none focus:border-[#fdf0d5]";
const labelClass = "block text-xs uppercase tracking-wider text-white/40";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export default function HelloEditor({ initial }: { initial: HelloContent }) {
  const [data, setData] = useState<HelloContent>(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function save() {
    setSaving(true);
    setMsg("");
    try {
      await saveContentAction("hello", JSON.stringify(data));
      setMsg("Hello page saved.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8 border border-white/10 bg-[#141414] p-4">
      <div>
        <p className="text-xs text-white/40">
          Business-card QR landing at{" "}
          <Link href="/hello" className="text-[#fdf0d5] hover:underline" target="_blank">
            /hello
          </Link>
          . Condensed services overview without pricing. Links here are separate from Settings →
          Brand (no SoundCloud).
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[#fdf0d5]">Greeting</h2>
        <label className={labelClass}>
          Eyebrow
          <input
            value={data.greeting.eyebrow}
            onChange={(e) =>
              setData({ ...data, greeting: { ...data.greeting, eyebrow: e.target.value } })
            }
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Headline
          <input
            value={data.greeting.headline}
            onChange={(e) =>
              setData({ ...data, greeting: { ...data.greeting, headline: e.target.value } })
            }
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Pillars
          <input
            value={data.greeting.pillars}
            onChange={(e) =>
              setData({ ...data, greeting: { ...data.greeting, pillars: e.target.value } })
            }
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Tagline
          <textarea
            value={data.greeting.tagline}
            onChange={(e) =>
              setData({ ...data, greeting: { ...data.greeting, tagline: e.target.value } })
            }
            rows={2}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Supporting line
          <textarea
            value={data.greeting.supporting}
            onChange={(e) =>
              setData({
                ...data,
                greeting: { ...data.greeting, supporting: e.target.value },
              })
            }
            rows={2}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Availability line
          <textarea
            value={data.greeting.availability}
            onChange={(e) =>
              setData({
                ...data,
                greeting: { ...data.greeting, availability: e.target.value },
              })
            }
            rows={2}
            className={inputClass}
          />
        </label>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[#fdf0d5]">Links</h2>
        <p className="text-[10px] text-white/30">
          LinkedIn, GitHub, Email, and Resume only. Leave a field blank to hide that icon.
        </p>
        <label className={labelClass}>
          LinkedIn URL
          <input
            value={data.links.linkedin}
            onChange={(e) =>
              setData({ ...data, links: { ...data.links, linkedin: e.target.value } })
            }
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          GitHub URL
          <input
            value={data.links.github}
            onChange={(e) =>
              setData({ ...data, links: { ...data.links, github: e.target.value } })
            }
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Email
          <input
            value={data.links.email}
            onChange={(e) =>
              setData({ ...data, links: { ...data.links, email: e.target.value } })
            }
            className={inputClass}
            placeholder="hello@example.com"
          />
        </label>
        <label className={labelClass}>
          Resume URL
          <input
            value={data.links.resumeUrl}
            onChange={(e) =>
              setData({ ...data, links: { ...data.links, resumeUrl: e.target.value } })
            }
            className={inputClass}
          />
        </label>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[#fdf0d5]">Who I Can Help</h2>
        <label className={labelClass}>
          Section title
          <input
            value={data.whoICanHelp.title}
            onChange={(e) =>
              setData({
                ...data,
                whoICanHelp: { ...data.whoICanHelp, title: e.target.value },
              })
            }
            className={inputClass}
          />
        </label>
        <TermsListEditor
          label="Client types"
          values={data.whoICanHelp.items}
          onChange={(items) =>
            setData({ ...data, whoICanHelp: { ...data.whoICanHelp, items } })
          }
          placeholder="e.g. Independent shops and local storefronts"
          addLabel="Add client type"
        />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-[#fdf0d5]">Service sections</h2>
          <button
            type="button"
            onClick={() =>
              setData({
                ...data,
                serviceSections: [
                  ...data.serviceSections,
                  {
                    id: `section-${data.serviceSections.length + 1}`,
                    label: "New section",
                    items: [""],
                  },
                ],
              })
            }
            className="text-xs text-[#fdf0d5] hover:underline"
          >
            + Add section
          </button>
        </div>
        {data.serviceSections.map((section, si) => (
          <div key={si} className="space-y-3 border border-white/10 p-3">
            <div className="flex flex-wrap gap-3">
              <label className={`${labelClass} flex-1 min-w-[10rem]`}>
                Label
                <input
                  value={section.label}
                  onChange={(e) => {
                    const next = [...data.serviceSections];
                    const label = e.target.value;
                    next[si] = {
                      ...section,
                      label,
                      id: section.id || slugify(label) || `section-${si + 1}`,
                    };
                    setData({ ...data, serviceSections: next });
                  }}
                  className={inputClass}
                />
              </label>
              <label className={`${labelClass} w-40`}>
                Id
                <input
                  value={section.id}
                  onChange={(e) => {
                    const next = [...data.serviceSections];
                    next[si] = { ...section, id: e.target.value };
                    setData({ ...data, serviceSections: next });
                  }}
                  className={inputClass}
                />
              </label>
              <button
                type="button"
                onClick={() =>
                  setData({
                    ...data,
                    serviceSections: data.serviceSections.filter((_, i) => i !== si),
                  })
                }
                className="self-end px-2 py-2 text-xs text-white/35 hover:text-red-400"
              >
                Remove
              </button>
            </div>
            <TermsListEditor
              label="Offerings"
              values={section.items}
              onChange={(items) => {
                const next = [...data.serviceSections];
                next[si] = { ...section, items };
                setData({ ...data, serviceSections: next });
              }}
              placeholder="Service name"
              addLabel="Add offering"
            />
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[#fdf0d5]">How I work</h2>
        <TermsListEditor
          label="Lifecycle steps"
          values={data.lifecycle}
          onChange={(lifecycle) => setData({ ...data, lifecycle })}
          placeholder="e.g. Identify opportunities"
          addLabel="Add step"
        />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-[#fdf0d5]">Skills</h2>
          <button
            type="button"
            onClick={() =>
              setData({
                ...data,
                skillGroups: [
                  ...data.skillGroups,
                  { skill: "New skill", disciplines: [""] },
                ],
              })
            }
            className="text-xs text-[#fdf0d5] hover:underline"
          >
            + Add skill
          </button>
        </div>
        <p className="text-[10px] text-white/30">
          Skill names are headers; disciplines appear as tags underneath each skill.
        </p>
        {data.skillGroups.map((group, gi) => (
          <div key={gi} className="space-y-3 border border-white/10 p-3">
            <div className="flex justify-between gap-3">
              <label className={`${labelClass} flex-1`}>
                Skill
                <input
                  value={group.skill}
                  onChange={(e) => {
                    const next = [...data.skillGroups];
                    next[gi] = { ...group, skill: e.target.value };
                    setData({ ...data, skillGroups: next });
                  }}
                  className={inputClass}
                />
              </label>
              <button
                type="button"
                onClick={() =>
                  setData({
                    ...data,
                    skillGroups: data.skillGroups.filter((_, i) => i !== gi),
                  })
                }
                className="self-end px-2 py-2 text-xs text-white/35 hover:text-red-400"
              >
                Remove
              </button>
            </div>
            <TermsListEditor
              label="Disciplines"
              values={group.disciplines}
              onChange={(disciplines) => {
                const next = [...data.skillGroups];
                next[gi] = { ...group, disciplines };
                setData({ ...data, skillGroups: next });
              }}
              placeholder="e.g. Web Design"
              addLabel="Add discipline"
            />
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-[#fdf0d5]">Retainers</h2>
          <button
            type="button"
            onClick={() =>
              setData({
                ...data,
                retainers: [
                  ...data.retainers,
                  {
                    name: "New retainer",
                    summary: "",
                  },
                ],
              })
            }
            className="text-xs text-[#fdf0d5] hover:underline"
          >
            + Add retainer
          </button>
        </div>
        {data.retainers.map((tier, ti) => (
          <div key={ti} className="space-y-3 border border-white/10 p-3">
            <div className="flex justify-between gap-3">
              <label className={`${labelClass} flex-1`}>
                Name
                <input
                  value={tier.name}
                  onChange={(e) => {
                    const next = [...data.retainers];
                    next[ti] = { ...tier, name: e.target.value };
                    setData({ ...data, retainers: next });
                  }}
                  className={inputClass}
                />
              </label>
              <button
                type="button"
                onClick={() =>
                  setData({
                    ...data,
                    retainers: data.retainers.filter((_, i) => i !== ti),
                  })
                }
                className="self-end px-2 py-2 text-xs text-white/35 hover:text-red-400"
              >
                Remove
              </button>
            </div>
            <label className={labelClass}>
              Summary (two sentences)
              <textarea
                value={tier.summary}
                onChange={(e) => {
                  const next = [...data.retainers];
                  next[ti] = { ...tier, summary: e.target.value };
                  setData({ ...data, retainers: next });
                }}
                rows={3}
                className={inputClass}
              />
            </label>
          </div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[#fdf0d5]">Consulting</h2>
        <label className={labelClass}>
          Title
          <input
            value={data.consulting.title}
            onChange={(e) =>
              setData({
                ...data,
                consulting: { ...data.consulting, title: e.target.value },
              })
            }
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Summary (two sentences)
          <textarea
            value={data.consulting.summary}
            onChange={(e) =>
              setData({
                ...data,
                consulting: { ...data.consulting, summary: e.target.value },
              })
            }
            rows={3}
            className={inputClass}
          />
        </label>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-[#fdf0d5]">CTA label</h2>
        <label className={labelClass}>
          Email button
          <input
            value={data.cta.emailLabel}
            onChange={(e) =>
              setData({ ...data, cta: { ...data.cta, emailLabel: e.target.value } })
            }
            className={inputClass}
          />
        </label>
      </section>

      <div className="flex flex-wrap items-center gap-3 border-t border-white/10 pt-4">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="bg-[#fdf0d5] px-4 py-2 text-sm font-semibold text-black disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save Hello page"}
        </button>
        {msg && <p className="text-sm text-white/50">{msg}</p>}
      </div>
    </div>
  );
}
