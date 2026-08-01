import Link from "next/link";
import { redirect } from "next/navigation";
import { listTemplates } from "@/lib/onboarding";
import { createTemplateAction, deleteTemplateAction } from "@/app/admin/actions/onboarding";

export default async function TemplatesPage() {
  const templates = await listTemplates();

  async function createTemplate(formData: FormData) {
    "use server";
    const name = String(formData.get("name") || "").trim();
    if (!name) return;
    const result = await createTemplateAction(name, String(formData.get("description") || ""));
    redirect(`/admin/onboarding/templates/${result.id}`);
  }

  return (
    <div>
      <Link href="/admin/onboarding" className="text-xs text-white/40 hover:text-white/70">
        ← Onboarding
      </Link>
      <h1 className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold">
        Question templates
      </h1>
      <p className="mt-1 text-sm text-white/50">
        Reusable custom question sets you can apply to any onboarding.
      </p>

      <form
        action={createTemplate}
        className="mt-6 flex flex-wrap items-end gap-3 border border-white/10 bg-[#141414] p-4"
      >
        <label className="text-xs uppercase tracking-wider text-white/40">
          Name
          <input
            name="name"
            required
            className="mt-1 block min-w-[200px] border border-white/15 bg-black/40 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-xs uppercase tracking-wider text-white/40">
          Description
          <input
            name="description"
            className="mt-1 block min-w-[220px] border border-white/15 bg-black/40 px-3 py-2 text-sm"
          />
        </label>
        <button type="submit" className="bg-[#e6c47a] px-4 py-2 text-sm font-semibold text-black">
          Create template
        </button>
      </form>

      <ul className="mt-8 space-y-2">
        {templates.map((t) => (
          <li
            key={t.id}
            className="flex items-center justify-between border border-white/10 bg-[#141414] px-4 py-3"
          >
            <div>
              <Link
                href={`/admin/onboarding/templates/${t.id}`}
                className="text-[#e6c47a] hover:underline"
              >
                {t.name}
              </Link>
              {t.description && (
                <p className="text-xs text-white/40">{t.description}</p>
              )}
            </div>
            <form
              action={async () => {
                "use server";
                await deleteTemplateAction(t.id);
              }}
            >
              <button type="submit" className="text-xs text-red-300">
                Delete
              </button>
            </form>
          </li>
        ))}
        {templates.length === 0 && (
          <li className="text-sm text-white/40">No templates yet.</li>
        )}
      </ul>
    </div>
  );
}
