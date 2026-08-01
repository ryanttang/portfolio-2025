import { getContent } from "@/lib/content";
import ContentEditor from "@/components/admin/ContentEditor";

const SECTIONS = [
  { key: "about", label: "About" },
  { key: "projects", label: "Projects" },
  { key: "design", label: "Design" },
  { key: "retail", label: "Retail" },
  { key: "services_overview", label: "Services overview" },
  { key: "services_projects", label: "Services projects" },
  { key: "services_retainers", label: "Services retainers" },
];

export default async function ContentPage() {
  const entries = await Promise.all(
    SECTIONS.map(async (s) => ({
      ...s,
      payload: await getContent(s.key),
    })),
  );

  return (
    <div>
      <h1 className="font-[family-name:var(--font-syne)] text-2xl font-bold">Content</h1>
      <p className="mt-1 text-sm text-white/50">
        Edit site sections as JSON. Public pages fall back to defaults if empty.
      </p>
      <div className="mt-8 space-y-6">
        {entries.map((e) => (
          <ContentEditor key={e.key} contentKey={e.key} label={e.label} initial={e.payload} />
        ))}
      </div>
    </div>
  );
}
